from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Profile, Project
from app.schemas import ProjectOut, ProjectCreate, ProjectUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=list[ProjectOut])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        return []
    return db.query(Project).filter(Project.profile_id == profile.id).order_by(Project.display_order).all()

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id, target_role="Software Developer")
        db.add(profile)
        db.commit()
        db.refresh(profile)

    count = db.query(Project).filter(Project.profile_id == profile.id).count()

    project = Project(
        profile_id=profile.id,
        name=project_in.name,
        description=project_in.description,
        technologies=project_in.technologies,
        role=project_in.role,
        github_url=project_in.github_url,
        demo_url=project_in.demo_url,
        outcomes=project_in.outcomes,
        display_order=count,
        is_featured=project_in.is_featured
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).join(Profile).filter(
        Project.id == project_id,
        Profile.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.name = project_in.name
    project.description = project_in.description
    project.technologies = project_in.technologies
    project.role = project_in.role
    project.github_url = project_in.github_url
    project.demo_url = project_in.demo_url
    project.outcomes = project_in.outcomes
    project.is_featured = project_in.is_featured
    project.display_order = project_in.display_order

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).join(Profile).filter(
        Project.id == project_id,
        Profile.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.commit()
    return None
