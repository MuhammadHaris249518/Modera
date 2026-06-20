from datetime import datetime
from typing import List

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import CurrentUser

router = APIRouter()

class AppealCreateRequest(BaseModel):
    upload_id: str
    reason: str = Field(..., min_length=10, max_length=500)

class AppealResponse(BaseModel):
    id: str
    upload_id: str
    reason: str
    status: str
    created_at: datetime

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_appeal(
    payload: AppealCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db=Depends(get_db),
):
    try:
        upload_object_id = ObjectId(payload.upload_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid upload id")

    upload = await db.uploads.find_one({"_id": upload_object_id, "uploaded_by": current_user.id})
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if upload.get("final_verdict") not in ["Flagged", "Blocked"]:
        raise HTTPException(
            status_code=400,
            detail="Only flagged or blocked uploads are eligible for review requests.",
        )

    existing_appeal = await db.appeals.find_one(
        {
            "upload_id": upload_object_id,
            "requested_by": current_user.id,
            "status": "PENDING",
        }
    )
    if existing_appeal:
        raise HTTPException(status_code=409, detail="A pending appeal already exists for this upload.")

    appeal_doc = {
        "upload_id": upload_object_id,
        "requested_by": current_user.id,
        "reason": payload.reason.strip(),
        "status": "PENDING",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.appeals.insert_one(appeal_doc)
    return {
        "id": str(result.inserted_id),
        "upload_id": payload.upload_id,
        "reason": appeal_doc["reason"],
        "status": appeal_doc["status"],
        "created_at": appeal_doc["created_at"],
    }

@router.get("/", response_model=List[AppealResponse])
async def list_user_appeals(
    current_user: CurrentUser = Depends(get_current_user),
    db=Depends(get_db),
):
    appeals = await db.appeals.find({"requested_by": current_user.id}).sort("created_at", -1).to_list(length=100)
    response = []
    for appeal in appeals:
        response.append(
            {
                "id": str(appeal["_id"]),
                "upload_id": str(appeal["upload_id"]),
                "reason": appeal["reason"],
                "status": appeal["status"],
                "created_at": appeal["created_at"],
            }
        )
    return response
