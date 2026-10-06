import asyncio
import logging
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Response, Query, Body
from sqlalchemy.orm import Session

logger = logging.getLogger("routers.portfolios")

from app.database import get_db
from app.models import User, Profile, Project, Portfolio, PortfolioVersion, AgentRun
from app.schemas import (
    PortfolioOut,
    PortfolioCreateRequest,
    PlanApproveRequest,
    NLEditRequest,
    ManualContentUpdate,
    ProjectOrderUpdate,
    PortfolioVersionOut,
    PortfolioContent,
    PortfolioPlan,
    PortfolioThemeUpdate,
    DeploymentRequest,
    DeploymentResponse
)
from app.auth import get_current_user, get_optional_user
from app.agent.orchestrator import orchestrator
from app.export.renderer import render_portfolio_html, export_portfolio_zip
from app.services.deployer import deploy_portfolio

router = APIRouter(prefix="/portfolios", tags=["Portfolios"])

@router.post("", response_model=PortfolioOut, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    req: PortfolioCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile not initialized. Please complete profile details first."
        )

    # PRD FR-1.4: Only name, target_role, and at least one project or one skill/experience entry are mandatory
    target_role = req.target_role or profile.target_role
    projects = db.query(Project).filter(Project.profile_id == profile.id).all()
    has_skills = bool(profile.skills)
    has_experience = bool(profile.experience)
    
    if not projects and not has_skills and not has_experience:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one project, skill, or experience entry is required to build a portfolio."
        )

    # Create Portfolio with selected theme & accent color & chosen layout
    portfolio = Portfolio(
        user_id=current_user.id,
        profile_id=profile.id,
        title=req.title,
        target_role=target_role,
        template_id=req.template_id,
        layout_id=req.layout_id or "modern_grid",
        custom_layout_prompt=req.custom_layout_prompt,
        theme_id=req.theme_id or "emerald",
        primary_color=req.primary_color or "#10b981",
        theme_config=req.theme_config or {},
        status="draft"
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    # Create initial AgentRun
    run = AgentRun(
        portfolio_id=portfolio.id,
        state="INPUT",
        current_stage="Initiating Analysis",
        iteration=0
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    # Launch background orchestration
    background_tasks.add_task(orchestrator.start_pipeline, run.id)

    return _load_portfolio_out(portfolio.id, db)


@router.get("", response_model=list[PortfolioOut])
def list_portfolios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).order_by(Portfolio.created_at.desc()).all()
    return [_load_portfolio_out(p.id, db) for p in portfolios]


@router.get("/{portfolio_id}", response_model=PortfolioOut)
def get_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return _load_portfolio_out(portfolio.id, db)


@router.get("/{portfolio_id}/plan")
def get_portfolio_plan(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio or not portfolio.current_version_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not available yet")
    
    version = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
    return version.plan or {}


@router.post("/{portfolio_id}/plan/approve")
def approve_plan(
    portfolio_id: str,
    req: PlanApproveRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    latest_run = db.query(AgentRun).filter(AgentRun.portfolio_id == portfolio_id).order_by(AgentRun.started_at.desc()).first()
    if not latest_run:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active run to approve")

    # If custom plan provided, resume execution with plan
    return {"message": "Plan approved, proceeding with generation."}


@router.post("/{portfolio_id}/edit", response_model=PortfolioVersionOut)
def edit_portfolio_nl(
    portfolio_id: str,
    req: NLEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    if not portfolio.current_version_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Portfolio not yet generated")

    new_version = orchestrator.apply_nl_edit(portfolio_id, req.instruction, db)
    return new_version


@router.patch("/{portfolio_id}/content", response_model=PortfolioVersionOut)
def update_portfolio_content_manual(
    portfolio_id: str,
    req: ManualContentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    curr_ver = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()

    # Re-evaluate quality on manual change
    quality = orchestrator.quality_checker.check(
        req.content,
        portfolio.target_role,
        portfolio.profile.skills or {}
    )

    count = db.query(PortfolioVersion).filter(PortfolioVersion.portfolio_id == portfolio.id).count()
    new_version = PortfolioVersion(
        portfolio_id=portfolio.id,
        version_number=count + 1,
        plan=curr_ver.plan if curr_ver else None,
        content=req.content.model_dump(),
        quality_report=quality.model_dump(),
        created_by="user",
        change_summary="Manual content update directly from editor."
    )
    db.add(new_version)
    db.flush()

    portfolio.current_version_id = new_version.id
    db.commit()
    return new_version


@router.put("/{portfolio_id}/projects/order", response_model=PortfolioVersionOut)
def reorder_projects(
    portfolio_id: str,
    req: ProjectOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio or not portfolio.current_version_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    curr_ver = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
    content_dict = dict(curr_ver.content)

    all_feat = {p["id"]: p for p in content_dict.get("featured_projects", [])}
    all_other = {p["id"]: p for p in content_dict.get("other_projects", [])}
    all_projects = {**all_feat, **all_other}

    # Reassemble featured
    new_featured = []
    for pid in req.featured_project_ids:
        if pid in all_projects:
            p = all_projects[pid]
            # Ensure full case study fields exist
            new_featured.append({
                "id": pid,
                "name": p.get("name", ""),
                "overview": p.get("overview") or p.get("summary", ""),
                "problem": p.get("problem"),
                "solution": p.get("solution") or p.get("summary", ""),
                "technologies": p.get("technologies", []),
                "key_features": p.get("key_features", []),
                "role": p.get("role"),
                "challenges": p.get("challenges"),
                "outcome": p.get("outcome"),
                "links": p.get("links", {})
            })

    # Reassemble other
    new_other = []
    for pid in req.other_project_ids:
        if pid in all_projects:
            p = all_projects[pid]
            new_other.append({
                "id": pid,
                "name": p.get("name", ""),
                "summary": p.get("summary") or p.get("overview", "")[:120],
                "technologies": p.get("technologies", []),
                "links": p.get("links", {})
            })

    content_dict["featured_projects"] = new_featured
    content_dict["other_projects"] = new_other

    count = db.query(PortfolioVersion).filter(PortfolioVersion.portfolio_id == portfolio.id).count()
    new_version = PortfolioVersion(
        portfolio_id=portfolio.id,
        version_number=count + 1,
        plan=curr_ver.plan,
        content=content_dict,
        quality_report=curr_ver.quality_report,
        created_by="user",
        change_summary="Reordered and moved projects between featured and other."
    )
    db.add(new_version)
    db.flush()

    portfolio.current_version_id = new_version.id
    db.commit()
    return new_version


@router.get("/{portfolio_id}/versions", response_model=list[PortfolioVersionOut])
def get_version_history(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    
    return db.query(PortfolioVersion).filter(
        PortfolioVersion.portfolio_id == portfolio_id
    ).order_by(PortfolioVersion.version_number.desc()).all()


@router.post("/{portfolio_id}/versions/{version_id}/restore", response_model=PortfolioOut)
def restore_version(
    portfolio_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    target_ver = db.query(PortfolioVersion).filter(
        PortfolioVersion.id == version_id,
        PortfolioVersion.portfolio_id == portfolio_id
    ).first()
    if not target_ver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target version not found")

    portfolio.current_version_id = target_ver.id
    db.commit()
    return _load_portfolio_out(portfolio.id, db)


@router.patch("/{portfolio_id}/theme", response_model=PortfolioOut)
def update_portfolio_theme(
    portfolio_id: str,
    req: PortfolioThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows user to update theme, primary accent color, and layout dynamically."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    if req.theme_id:
        portfolio.theme_id = req.theme_id
    if req.primary_color:
        portfolio.primary_color = req.primary_color
    if req.template_id:
        portfolio.template_id = req.template_id
    if req.layout_id:
        portfolio.layout_id = req.layout_id
    if req.custom_layout_prompt is not None:
        portfolio.custom_layout_prompt = req.custom_layout_prompt
    if req.theme_config is not None:
        portfolio.theme_config = req.theme_config

    # Also update current version content theme & layout config if available
    if portfolio.current_version_id:
        curr_ver = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
        if curr_ver and curr_ver.content:
            c = dict(curr_ver.content)
            c["theme"] = {
                "theme_id": portfolio.theme_id,
                "primary_color": portfolio.primary_color,
                "theme_config": portfolio.theme_config
            }
            if req.layout_id:
                c["layout_id"] = req.layout_id
            if req.custom_layout_prompt is not None:
                c["custom_layout_prompt"] = req.custom_layout_prompt
            curr_ver.content = c

    db.commit()
    return _load_portfolio_out(portfolio.id, db)


@router.get("/{portfolio_id}/preview")
def preview_portfolio_html(
    portfolio_id: str,
    template: str = Query("clean"),
    layout: str | None = Query(None),
    theme: str | None = Query(None),
    accent: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Renders HTML directly for live preview iframe with dynamic layout and theme colors."""
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or not portfolio.current_version_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio preview not ready")

    version = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
    user_name = portfolio.user.name if portfolio.user else "Candidate"

    chosen_theme = theme or getattr(portfolio, "theme_id", "emerald") or "emerald"
    chosen_accent = accent or getattr(portfolio, "primary_color", "#10b981") or "#10b981"
    chosen_layout = layout or getattr(portfolio, "layout_id", None) or version.content.get("layout_id") or template
    
    html = render_portfolio_html(
        content=version.content,
        template_id=template,
        user_name=user_name,
        theme_id=chosen_theme,
        primary_color=chosen_accent,
        layout_id=chosen_layout
    )
    return Response(content=html, media_type="text/html")


@router.get("/{portfolio_id}/export")
def export_portfolio(
    portfolio_id: str,
    template: str = Query("clean"),
    layout: str | None = Query(None),
    theme: str | None = Query(None),
    accent: str | None = Query(None),
    db: Session = Depends(get_db)
):
    """Downloads deployable static site ZIP archive with user's chosen layout, theme, and accent color."""
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio or not portfolio.current_version_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not ready for export")

    version = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
    user_name = portfolio.user.name if portfolio.user else "Candidate"

    chosen_theme = theme or getattr(portfolio, "theme_id", "emerald") or "emerald"
    chosen_accent = accent or getattr(portfolio, "primary_color", "#10b981") or "#10b981"
    chosen_layout = layout or getattr(portfolio, "layout_id", None) or version.content.get("layout_id") or template

    zip_buffer = export_portfolio_zip(
        content=version.content,
        template_id=template,
        user_name=user_name,
        theme_id=chosen_theme,
        primary_color=chosen_accent,
        layout_id=chosen_layout
    )

    filename = f"{user_name.lower().replace(' ', '_')}_portfolio_{chosen_layout}_{chosen_theme}.zip"
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/{portfolio_id}/deploy", response_model=DeploymentResponse)
def deploy_portfolio_endpoint(
    portfolio_id: str,
    req: Optional[DeploymentRequest] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deploys static portfolio live via Netlify Zip API or guaranteed local preview fallback."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    options = req.model_dump() if req else {}
    try:
        return deploy_portfolio(portfolio_id, db, options)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deployment failed for portfolio {portfolio_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deployment failed: {str(e)}"
        )


def _load_portfolio_out(portfolio_id: str, db: Session) -> PortfolioOut:
    p = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    curr_ver = None
    if p.current_version_id:
        v = db.query(PortfolioVersion).filter(PortfolioVersion.id == p.current_version_id).first()
        if v:
            curr_ver = PortfolioVersionOut.model_validate(v)

    latest_run = None
    r = db.query(AgentRun).filter(AgentRun.portfolio_id == p.id).order_by(AgentRun.started_at.desc()).first()
    if r:
        latest_run = r

    return PortfolioOut(
        id=p.id,
        user_id=p.user_id,
        profile_id=p.profile_id,
        title=p.title,
        target_role=p.target_role,
        template_id=p.template_id,
        layout_id=getattr(p, "layout_id", "modern_grid") or "modern_grid",
        custom_layout_prompt=getattr(p, "custom_layout_prompt", None),
        theme_id=getattr(p, "theme_id", "emerald") or "emerald",
        primary_color=getattr(p, "primary_color", "#10b981") or "#10b981",
        theme_config=getattr(p, "theme_config", {}) or {},
        deployment_url=getattr(p, "deployment_url", None),
        deployment_status=getattr(p, "deployment_status", None),
        deployed_at=getattr(p, "deployed_at", None),
        current_version_id=p.current_version_id,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
        current_version=curr_ver,
        latest_run=latest_run
    )
