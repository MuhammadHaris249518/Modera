from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import CurrentUser, RoleEnum

router = APIRouter()

# Schema for updating policies
class PolicyUpdate(BaseModel):
    category: str
    flag_threshold: float
    block_threshold: float

@router.get("/queue")
async def get_flagged_queue(
    _: CurrentUser = Depends(require_role(RoleEnum.ADMIN)),
    db=Depends(get_db),
):
    """Fetch all uploads that were flagged by AI for human review."""
    cursor = db.uploads.find({"final_verdict": "Flagged"}).sort("created_at", -1)
    documents = await cursor.to_list(length=100)
    
    # Format ObjectId for JSON serialization
    for doc in documents:
        doc["_id"] = str(doc["_id"])
        
    return {"queue": documents}

@router.post("/verdict/{upload_id}")
async def override_verdict(
    upload_id: str,
    new_verdict: str,
    current_user: CurrentUser = Depends(require_role(RoleEnum.ADMIN)),
    db=Depends(get_db),
):
    """Admin manually overrides an AI verdict to Approved or Blocked."""
    if new_verdict not in ["Approved", "Blocked"]:
        raise HTTPException(status_code=400, detail="Verdict must be 'Approved' or 'Blocked'")
        
    try:
        upload_object_id = ObjectId(upload_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid upload id")

    result = await db.uploads.update_one(
        {"_id": upload_object_id},
        {"$set": {
            "final_verdict": new_verdict,
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow(),
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Upload not found")
        
    return {"message": f"Verdict updated to {new_verdict}"}

@router.get("/policies")
async def get_policies(
    _: CurrentUser = Depends(require_role(RoleEnum.ADMIN)),
    db=Depends(get_db),
):
    """Get all current AI threshold policies."""
    policies = await db.policies.find().to_list(length=100)
    for p in policies:
        p["_id"] = str(p["_id"])
    return {"policies": policies}

@router.put("/policies")
async def update_policies(
    updates: List[PolicyUpdate],
    _: CurrentUser = Depends(require_role(RoleEnum.ADMIN)),
    db=Depends(get_db),
):
    """Update AI threshold policies dynamically."""
    for update in updates:
        if update.flag_threshold < 0 or update.block_threshold < 0:
            raise HTTPException(status_code=400, detail="Thresholds must be non-negative")
        if update.flag_threshold > update.block_threshold:
            raise HTTPException(
                status_code=400,
                detail=f"Policy '{update.category}' has flag_threshold above block_threshold",
            )
        await db.policies.update_one(
            {"category": update.category},
            {"$set": {
                "flag_threshold": update.flag_threshold,
                "block_threshold": update.block_threshold
            }}
        )
    return {"message": "Policies updated successfully"}

class AppealResolveRequest(BaseModel):
    action: str

@router.get("/appeals")
async def get_appeals(
    _: CurrentUser = Depends(require_role(RoleEnum.ADMIN)),
    db=Depends(get_db),
):
    appeals = await db.appeals.find().sort("created_at", -1).to_list(length=100)
    response = []
    for appeal in appeals:
        upload = await db.uploads.find_one({"_id": appeal["upload_id"]})
        response.append(
            {
                "id": str(appeal["_id"]),
                "upload_id": str(appeal["upload_id"]),
                "reason": appeal["reason"],
                "status": appeal["status"],
                "requested_by": appeal["requested_by"],
                "created_at": appeal["created_at"],
                "updated_at": appeal.get("updated_at"),
                "reviewed_by": appeal.get("reviewed_by"),
                "reviewed_at": appeal.get("reviewed_at"),
                "image_url": upload["image_url"] if upload else None,
                "final_verdict": upload["final_verdict"] if upload else None,
                "filename": upload["filename"] if upload else None,
            }
        )
    return {"appeals": response}

@router.post("/appeals/{appeal_id}/resolve")
async def resolve_appeal(
    appeal_id: str,
    payload: AppealResolveRequest,
    current_user: CurrentUser = Depends(require_role(RoleEnum.ADMIN)),
    db=Depends(get_db),
):
    if payload.action not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVED or REJECTED")

    try:
        appeal_object_id = ObjectId(appeal_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid appeal id")

    appeal = await db.appeals.find_one({"_id": appeal_object_id})
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    if appeal.get("status") != "PENDING":
        raise HTTPException(status_code=400, detail="Appeal has already been resolved")

    update_fields = {
        "status": payload.action,
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    await db.appeals.update_one({"_id": appeal_object_id}, {"$set": update_fields})

    if payload.action == "APPROVED":
        await db.uploads.update_one(
            {"_id": appeal["upload_id"]},
            {"$set": {"final_verdict": "Approved", "reviewed_by": current_user.id, "reviewed_at": datetime.utcnow()}},
        )

    return {"message": f"Appeal {payload.action.lower()} successfully"}
