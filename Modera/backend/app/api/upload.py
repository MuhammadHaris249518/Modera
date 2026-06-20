import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from app.services.ai_service import analyze_image
from app.services.verdict_engine import evaluate_verdict
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import CurrentUser
from datetime import datetime

router = APIRouter()

# Directory to save uploaded files locally
UPLOAD_DIR = "uploads"

# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image types and max size (5 MB)
ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/")
async def upload_image(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    db=Depends(get_db),
):
    # 1. Validate file type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )
    
    # 2. Validate file size
    # We read the file to check its size, then seek back to 0 to save it
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit."
        )
    
    # 3. Generate secure filename with UUID
    file_extension = CONTENT_TYPE_EXTENSIONS[file.content_type]
    new_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)
    
    # 4. Save file to the local directory
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
        
    # 5. Analyze image with the vision model
    try:
        ai_verdict = await analyze_image(file_path, file.content_type)
        
        # 6. Run Verdict Engine to determine final status
        final_verdict = await evaluate_verdict(ai_verdict, db)
        
        image_url = f"/static/{new_filename}"
        
        # 7. Save record to MongoDB
        record = {
            "filename": new_filename,
            "image_url": image_url,
            "ai_scores": ai_verdict,
            "final_verdict": final_verdict,
            "uploaded_by": current_user.id,
            "created_at": datetime.utcnow()
        }
        result = await db.uploads.insert_one(record)
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Image uploaded successfully",
                "upload_id": str(result.inserted_id),
                "filename": new_filename,
                "image_url": image_url,
                "ai_analysis": ai_verdict,
                "final_verdict": final_verdict
            }
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        ai_verdict = {"error": f"Failed to process image: {str(e)}"}
        final_verdict = "Error"
        image_url = f"/static/{new_filename}"
        await db.uploads.insert_one(
            {
                "filename": new_filename,
                "image_url": image_url,
                "ai_scores": ai_verdict,
                "final_verdict": final_verdict,
                "uploaded_by": current_user.id,
                "created_at": datetime.utcnow(),
                "error": str(e),
            }
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to process image: {str(e)}",
        )
