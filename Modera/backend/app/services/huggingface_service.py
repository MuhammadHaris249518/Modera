"""Hugging Face local inference fallback for image moderation.

Uses openai/clip-vit-base-patch32 for zero-shot image classification.
No API key required - runs entirely locally on CPU or CUDA.
"""

import logging
import threading
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

# Configure module logger
logger = logging.getLogger(__name__)

# Classification categories using descriptive natural-language prompts
# CLIP performs significantly better with detailed text descriptions than simple labels
# These prompts are crafted to maximize classification accuracy for content moderation
CLASSIFICATION_LABELS: Tuple[str, ...] = (
    "a normal safe everyday photograph",
    "an image showing physical violence or fighting",
    "an image containing a firearm, gun, knife, or other dangerous weapon",
    "an image containing nudity or explicit adult content",
    "an image containing illegal drugs or narcotics"
)

# Map descriptive prompts back to short category names for output
LABEL_TO_CATEGORY: Dict[str, str] = {
    "a normal safe everyday photograph": "Safe Image",
    "an image showing physical violence or fighting": "Violence",
    "an image containing a firearm, gun, knife, or other dangerous weapon": "Weapon",
    "an image containing nudity or explicit adult content": "Adult Content",
    "an image containing illegal drugs or narcotics": "Drugs"
}

# Model configuration
MODEL_NAME: str = "openai/clip-vit-base-patch32"
DEVICE: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Configurable thresholds for each harmful category
# Threshold determines minimum confidence (0.0-1.0) to flag content as harmful
# 0.60 = 60% confidence required
# Adjust these based on your false positive/negative tolerance
WEAPON_THRESHOLD: float = 0.60
VIOLENCE_THRESHOLD: float = 0.60
ADULT_THRESHOLD: float = 0.60
DRUG_THRESHOLD: float = 0.60

# Category to threshold mapping for easy lookup
CATEGORY_THRESHOLDS: Dict[str, float] = {
    "Weapon": WEAPON_THRESHOLD,
    "Violence": VIOLENCE_THRESHOLD,
    "Adult Content": ADULT_THRESHOLD,
    "Drugs": DRUG_THRESHOLD
}

# Thread-safe model loading
_model_lock = threading.Lock()
_model: Optional[CLIPModel] = None
_processor: Optional[CLIPProcessor] = None


def _load_model() -> Tuple[CLIPModel, CLIPProcessor]:
    """Load CLIP model and processor with thread-safe lazy initialization.
    
    The model is loaded only once on first call and cached for subsequent uses.
    Thread-safe: multiple concurrent requests will wait for the model to load.
    
    Returns:
        Tuple of (model, processor) ready for inference
        
    Raises:
        RuntimeError: If model loading fails
    """
    global _model, _processor
    
    # Fast path: model already loaded
    if _model is not None and _processor is not None:
        return _model, _processor
    
    # Slow path: load model with thread safety
    with _model_lock:
        # Double-check pattern for thread safety
        if _model is None or _processor is None:
            logger.info(f"Loading Hugging Face model: {MODEL_NAME} on {DEVICE}")
            
            try:
                _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
                _model = CLIPModel.from_pretrained(MODEL_NAME)
                _model = _model.to(DEVICE)
                _model.eval()  # Set to evaluation mode for inference
                
                logger.info(f"Successfully loaded {MODEL_NAME} on {DEVICE}")
                
            except Exception as e:
                logger.error(f"Failed to load Hugging Face model: {e}", exc_info=True)
                _model = None
                _processor = None
                raise RuntimeError(f"Model loading failed: {e}") from e
    
    return _model, _processor


def analyze_with_huggingface(file_path: str) -> Dict[str, Any]:
    """Analyze image using local Hugging Face CLIP model with threshold-based decisions.
    
    Performs zero-shot image classification to detect harmful content.
    Uses descriptive prompts for better accuracy and configurable thresholds
    for each category. The model is loaded lazily on first call and cached.
    
    Args:
        file_path: Path to the image file to analyze
        
    Returns:
        Dictionary containing:
            - source: "huggingface"
            - provider: "huggingface"
            - model: Model name used
            - device: Device used for inference
            - status: "harmful" or "safe" based on threshold evaluation
            - detected_categories: List of all categories with confidence > 0
            - triggered_categories: List of categories exceeding their thresholds
            - thresholds_used: Dict of thresholds applied
            - highest_category: Category with highest confidence
            - highest_confidence: Confidence of highest category
            - all_scores: Dict of all category scores (sorted high to low)
            
    Raises:
        FileNotFoundError: If image file doesn't exist
        RuntimeError: If model loading or inference fails
    """
    try:
        # Validate input
        if not file_path or not isinstance(file_path, str):
            raise ValueError("file_path must be a non-empty string")
        
        # Load model (cached after first call)
        model, processor = _load_model()
        
        # Load and preprocess image
        try:
            image = Image.open(file_path).convert("RGB")
        except Exception as e:
            raise FileNotFoundError(f"Cannot open image file: {file_path}") from e
        
        # Prepare inputs for zero-shot classification
        inputs = processor(
            text=CLASSIFICATION_LABELS,
            images=image,
            return_tensors="pt",
            padding=True
        )
        
        # Move inputs to device
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
        
        # Run inference with no gradient computation to save memory
        with torch.no_grad():
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)
        
        # Convert to CPU and extract probabilities
        probs = probs.cpu().numpy()[0]
        
        # Build complete results with descriptive labels
        all_scores_raw: Dict[str, float] = {}
        for label, prob in zip(CLASSIFICATION_LABELS, probs):
            category_name = LABEL_TO_CATEGORY[label]
            all_scores_raw[category_name] = float(prob)
        
        # Sort scores from highest to lowest for better readability
        all_scores_sorted = dict(sorted(all_scores_raw.items(), key=lambda x: x[1], reverse=True))
        
        # Find highest scoring category
        highest_category = max(all_scores_raw, key=all_scores_raw.get)
        highest_confidence = all_scores_raw[highest_category]
        
        # Threshold-based decision making
        # Check each harmful category independently against its threshold
        # This allows multiple categories to be flagged simultaneously
        triggered_categories: List[str] = []
        detected_categories: List[str] = []
        
        for category, confidence in all_scores_raw.items():
            # Skip safe category for detection logic
            if category == "Safe Image":
                continue
            
            # Add to detected if confidence > 0
            if confidence > 0:
                detected_categories.append(category)
            
            # Check if category exceeds its threshold
            if category in CATEGORY_THRESHOLDS:
                threshold = CATEGORY_THRESHOLDS[category]
                if confidence >= threshold:
                    triggered_categories.append(category)
                    logger.info(f"Triggered: {category} (confidence: {confidence:.2%}, threshold: {threshold:.2%})")
        
        # Determine overall status based on triggered categories
        # If ANY harmful category exceeds its threshold, mark as harmful
        status = "harmful" if triggered_categories else "safe"
        
        # Build comprehensive result
        result: Dict[str, Any] = {
            "source": "huggingface",
            "provider": "huggingface",
            "model": MODEL_NAME,
            "device": str(DEVICE),
            "status": status,
            "detected_categories": detected_categories,
            "triggered_categories": triggered_categories,
            "thresholds_used": CATEGORY_THRESHOLDS.copy(),
            "highest_category": highest_category,
            "highest_confidence": round(highest_confidence, 4),
            "all_scores": all_scores_sorted
        }
        
        logger.info(
            f"Analysis complete: {status.upper()} | "
            f"Highest: {highest_category} ({highest_confidence:.2%}) | "
            f"Triggered: {triggered_categories if triggered_categories else 'none'}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Hugging Face analysis failed for {file_path}: {e}", exc_info=True)
        raise
