from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Profile
from app.schemas import ProfileOut, ProfileUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=ProfileOut)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        # Create profile if not yet created
        profile = Profile(
            user_id=current_user.id,
            target_role="Software Developer",
            headline=f"{current_user.name} | Software Developer",
            skills=[],
            links={"email": current_user.email}
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("", response_model=ProfileOut)
def update_user_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    profile.headline = profile_in.headline
    profile.about = profile_in.about
    profile.target_role = profile_in.target_role
    profile.skills = profile_in.skills
    profile.education = [e.model_dump() for e in profile_in.education]
    profile.experience = [e.model_dump() for e in profile_in.experience]
    profile.achievements = [a.model_dump() for a in profile_in.achievements]
    profile.certifications = [c.model_dump() for c in profile_in.certifications]
    profile.links = profile_in.links

    db.commit()
    db.refresh(profile)
    return profile
