import asyncio
import os
import json
import base64
import time
from pydantic import BaseModel, Field
from PIL import Image, ImageStat
from app.core.config import settings

MODERATION_PROMPT = """
You are a strict image moderation engine.

Evaluate the image only from visible evidence. Do not guess, do not infer from the prompt, and do not mark a category as detected unless the image clearly shows it.

For each category in the schema:
- set detected=true only when there is direct visual evidence
- set detected=false when there is no clear evidence
- set confidence to 0 when detected=false
- set confidence to a 0-100 risk score only when detected=true
- keep the reason short and specific to the visible evidence

Return only valid JSON matching the schema.
"""

# Define strict JSON output schema using Pydantic
class ModerationCategory(BaseModel):
    detected: bool = Field(description="Whether the category is detected")
    confidence: float = Field(description="Confidence score from 0 to 100")
    reason: str = Field(description="Explanation of the finding")

class ModerationResult(BaseModel):
    graphicViolence: ModerationCategory = Field(description="Graphic Violence")
    hateSymbols: ModerationCategory = Field(description="Hate Symbols")
    selfHarm: ModerationCategory = Field(description="Self-Harm")
    extremistPropaganda: ModerationCategory = Field(description="Extremist Propaganda")
    weaponsContraband: ModerationCategory = Field(description="Weapons & Contraband")
    harassmentHumiliation: ModerationCategory = Field(description="Harassment & Humiliation")

# Custom dict wrapper for backward compatibility with existing verdict_engine.py
# The existing engine calls float() on the scores to check policies
class CategoryScore(dict):
    def __init__(self, data: dict):
        super().__init__(data)
        self.detected = bool(data.get("detected", False))
        self.model_confidence = float(data.get("confidence", 0))
        self.confidence = self.model_confidence if self.detected else 0.0
        self["model_confidence"] = self.model_confidence
        self["confidence"] = self.confidence
    def __float__(self):
        return self.confidence


def _empty_category(reason: str) -> dict:
    return {"detected": False, "confidence": 0.0, "reason": reason}


def _fallback_analysis(file_path: str) -> dict:
    with Image.open(file_path) as image:
        rgb_image = image.convert("RGB")
        stats = ImageStat.Stat(rgb_image)
        avg_brightness = sum(stats.mean) / len(stats.mean)
        width, height = rgb_image.size

    reasoning = (
        "Local fallback analysis was used. "
        f"Image size is {width}x{height} and average brightness is {avg_brightness:.1f}."
    )

    parsed_result = {
        "graphicViolence": _empty_category(reasoning),
        "hateSymbols": _empty_category(reasoning),
        "selfHarm": _empty_category(reasoning),
        "extremistPropaganda": _empty_category(reasoning),
        "weaponsContraband": _empty_category(reasoning),
        "harassmentHumiliation": _empty_category(reasoning),
    }

    parsed_result["explicit"] = CategoryScore(parsed_result["extremistPropaganda"])
    parsed_result["violence"] = CategoryScore(parsed_result["graphicViolence"])
    parsed_result["weapons"] = CategoryScore(parsed_result["weaponsContraband"])
    parsed_result["hate"] = CategoryScore(parsed_result["hateSymbols"])
    parsed_result["self_harm"] = CategoryScore(parsed_result["selfHarm"])
    parsed_result["spam"] = CategoryScore(parsed_result["harassmentHumiliation"])
    parsed_result["reasoning"] = reasoning
    parsed_result["provider"] = "local_fallback"
    parsed_result["model"] = "heuristic-fallback"
    return parsed_result

def encode_image_to_base64(file_path: str) -> str:
    with open(file_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def _analyze_with_gemini(file_path: str, mime_type: str) -> dict:
    from google import genai
    from google.genai import types
    from google.genai.errors import ClientError

    base64_image = encode_image_to_base64(file_path)
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    prompt = MODERATION_PROMPT.strip()

    max_attempts = 3
    backoff_seconds = 1.0
    last_error = None

    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[
                    prompt,
                    types.Part.from_bytes(
                        data=base64.b64decode(base64_image),
                        mime_type=mime_type,
                    )
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ModerationResult,
                    temperature=0.1
                )
            )
            parsed_result = json.loads(response.text)
            parsed_result["request_attempts"] = attempt
            parsed_result["request_status"] = "success"
            break
        except ClientError as client_error:
            last_error = client_error
            status = getattr(client_error, "status_code", None)
            if status == 429 and attempt < max_attempts:
                time.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            raise
        except Exception as general_error:
            last_error = general_error
            raise
    else:
        if last_error is not None:
            raise last_error


    parsed_result["explicit"] = CategoryScore(parsed_result.get("extremistPropaganda", {"detected": False, "confidence": 0, "reason": "Not evaluated"}))
    parsed_result["violence"] = CategoryScore(parsed_result.get("graphicViolence", {"detected": False, "confidence": 0, "reason": "Not evaluated"}))
    parsed_result["weapons"] = CategoryScore(parsed_result.get("weaponsContraband", {"detected": False, "confidence": 0, "reason": "Not evaluated"}))
    parsed_result["hate"] = CategoryScore(parsed_result.get("hateSymbols", {"detected": False, "confidence": 0, "reason": "Not evaluated"}))
    parsed_result["self_harm"] = CategoryScore(parsed_result.get("selfHarm", {"detected": False, "confidence": 0, "reason": "Not evaluated"}))
    parsed_result["spam"] = CategoryScore(parsed_result.get("harassmentHumiliation", {"detected": False, "confidence": 0, "reason": "Not evaluated"}))

    for key in ("graphicViolence", "hateSymbols", "selfHarm", "extremistPropaganda", "weaponsContraband", "harassmentHumiliation"):
        category = parsed_result.get(key)
        if isinstance(category, dict):
            detected = bool(category.get("detected", False))
            model_confidence = float(category.get("confidence", 0))
            category["model_confidence"] = model_confidence
            category["confidence"] = model_confidence if detected else 0.0

    detected_reasons = [
        cat["reason"] for key, cat in parsed_result.items()
        if isinstance(cat, dict) and cat.get("detected") and "reason" in cat
    ]
    parsed_result["reasoning"] = " | ".join(detected_reasons) if detected_reasons else "Content appears safe based on image analysis."
    parsed_result["provider"] = "gemini"
    parsed_result["model"] = settings.GEMINI_MODEL
    if "request_attempts" not in parsed_result:
        parsed_result["request_attempts"] = 1
    return parsed_result


def _analyze_image_sync(file_path: str, mime_type: str) -> dict:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Image not found at {file_path}")

    provider = settings.AI_PROVIDER.lower().strip()

    if provider == "local_fallback":
        return _fallback_analysis(file_path)

    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            fallback = _fallback_analysis(file_path)
            fallback["provider"] = "gemini_fallback"
            fallback["model"] = settings.GEMINI_MODEL
            fallback["error"] = "No GEMINI_API_KEY configured"
            fallback["error_code"] = "NO_API_KEY"
            return fallback

        try:
            return _analyze_with_gemini(file_path, mime_type)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Gemini analysis failed, falling back to local analyzer: {e}")
            fallback = _fallback_analysis(file_path)
            fallback["provider"] = "gemini_fallback"
            fallback["model"] = settings.GEMINI_MODEL
            fallback["error"] = str(e)
            fallback["error_code"] = "GEMINI_ERROR"
            return fallback

    raise ValueError(f"Unknown AI_PROVIDER '{settings.AI_PROVIDER}'. Supported values: gemini, local_fallback")


async def analyze_image(file_path: str, mime_type: str) -> dict:
    return await asyncio.to_thread(_analyze_image_sync, file_path, mime_type)
