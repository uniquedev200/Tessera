import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException
from app.models.schemas import ProfileCreateRequest, ProfileResponse
from app.db.supabase_client import db

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

@router.post("/device", response_model=ProfileResponse)
async def get_or_create_device_profile(payload: dict):
    """
    Guarantees 100% strict DB-level device isolation without sign-in:
    - Each device generates a persistent random device_id
    - Maps to a unique device email in Supabase: device_{device_id}@tessera.edu
    - Returns or creates that device's dedicated profile
    """
    try:
        device_id = payload.get("device_id")
        hobby = payload.get("hobby_anchor") or "Music Production"
        if not device_id:
            device_id = uuid.uuid4().hex[:12]
        clean_dev = "".join(c for c in device_id if c.isalnum() or c in "-_")[:32]
        device_email = f"device_{clean_dev.lower()}@tessera.edu"
        short_tag = clean_dev[-4:].upper()
        display_name = f"Explorer #{short_tag}"
        profile = db.get_or_create_profile(
            email=device_email,
            display_name=display_name,
            hobby_anchor=hobby
        )
        return ProfileResponse(
            id=str(profile["id"]),
            email=profile["email"],
            display_name=profile.get("display_name") or display_name,
            hobby_anchor=profile.get("hobby_anchor") or hobby
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register device profile: {str(e)}")

@router.post("/guest", response_model=ProfileResponse)
async def create_guest_profile(payload: Optional[dict] = None):
    try:
        hobby = (payload or {}).get("hobby_anchor") or "Music Production"
        guest_suffix = uuid.uuid4().hex[:8].upper()
        guest_email = f"guest_{guest_suffix.lower()}@tessera.edu"
        display_name = f"Learner #{guest_suffix[:4]}"
        profile = db.get_or_create_profile(
            email=guest_email,
            display_name=display_name,
            hobby_anchor=hobby
        )
        return ProfileResponse(
            id=str(profile["id"]),
            email=profile["email"],
            display_name=profile.get("display_name") or display_name,
            hobby_anchor=profile.get("hobby_anchor") or hobby
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create guest profile: {str(e)}")

@router.post("/profile", response_model=ProfileResponse)
async def create_or_get_profile(req: ProfileCreateRequest):
    try:
        profile = db.get_or_create_profile(
            email=req.email,
            display_name=req.display_name,
            hobby_anchor=req.hobby_anchor
        )
        return ProfileResponse(
            id=str(profile["id"]),
            email=profile["email"],
            display_name=profile.get("display_name") or req.email.split("@")[0],
            hobby_anchor=profile.get("hobby_anchor") or "Music Production"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create/get profile: {str(e)}")

@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str):
    profile = db.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse(
        id=str(profile["id"]),
        email=profile["email"],
        display_name=profile.get("display_name") or "Learner",
        hobby_anchor=profile.get("hobby_anchor") or "Music Production"
    )

@router.post("/hobby")
async def update_hobby_anchor(payload: dict):
    user_id = payload.get("user_id")
    hobby_anchor = payload.get("hobby_anchor")
    if not user_id or not hobby_anchor:
        raise HTTPException(status_code=400, detail="user_id and hobby_anchor are required")
    updated = db.update_profile_hobby(user_id, hobby_anchor)
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"status": "success", "hobby_anchor": hobby_anchor}
