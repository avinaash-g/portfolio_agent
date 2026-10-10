import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ApiKey
from app.schemas import (
    ApiKeyCreateRequest,
    ApiKeyCreatedResponse,
    ApiKeyOut,
    DeveloperGenerateRequest,
    DeveloperGenerateResponse,
    DeveloperGenerateUsage,
    PortfolioContent,
    QualityReport
)
from app.auth import get_current_user
from app.agent.orchestrator import orchestrator

developer_router = APIRouter(prefix="/developer/keys", tags=["Developer API Keys"])
public_v1_router = APIRouter(prefix="/v1", tags=["Public Developer API v1"])


def _hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()


def _get_utc_today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def verify_developer_api_key(
    response: Response,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
) -> ApiKey:
    """
    Middleware/Dependency that verifies API key validity,
    resets daily counter at 00:00 UTC, enforces daily rate limit (requests_today < daily_limit),
    increments usage count, and injects rate limit headers.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing 'X-API-Key' header. Please provide your developer API key (e.g., 'pa_live_...')."
        )

    if not x_api_key.startswith("pa_live_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key format. Expected prefix 'pa_live_'."
        )

    key_hash = _hash_api_key(x_api_key)
    api_key_record = db.query(ApiKey).filter(
        ApiKey.key_hash == key_hash,
        ApiKey.is_active == True
    ).first()

    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked developer API key."
        )

    # Daily quota reset check
    today_str = _get_utc_today_str()
    if api_key_record.last_reset_date != today_str:
        api_key_record.requests_today = 0
        api_key_record.last_reset_date = today_str
        db.commit()

    # Rate limiting enforcement
    if api_key_record.requests_today >= api_key_record.daily_limit:
        rate_headers = {
            "X-RateLimit-Limit": str(api_key_record.daily_limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": f"{today_str}T23:59:59Z"
        }
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Daily API request limit exceeded ({api_key_record.requests_today}/{api_key_record.daily_limit} used). "
                f"Quotas reset at 00:00 UTC. Contact developer platform support for Pro tier limits."
            ),
            headers=rate_headers
        )

    # Increment counter
    api_key_record.requests_today += 1
    db.commit()
    db.refresh(api_key_record)

    remaining = max(0, api_key_record.daily_limit - api_key_record.requests_today)
    response.headers["X-RateLimit-Limit"] = str(api_key_record.daily_limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = f"{today_str}T23:59:59Z"

    return api_key_record


# -------------------------------------------------------------
# Developer Key Management Endpoints
# -------------------------------------------------------------

@developer_router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    req: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new developer API key.
    The unmasked secret key is returned strictly ONCE in this response.
    """
    raw_token = secrets.token_hex(20)
    raw_key = f"pa_live_{raw_token}"
    key_hash = _hash_api_key(raw_key)
    key_prefix = raw_key[:12]
    masked_key = f"{key_prefix}...{raw_key[-4:]}"

    api_key_obj = ApiKey(
        user_id=current_user.id,
        key_hash=key_hash,
        key_prefix=key_prefix,
        name=req.name.strip(),
        daily_limit=10,
        requests_today=0,
        last_reset_date=_get_utc_today_str(),
        is_active=True
    )
    db.add(api_key_obj)
    db.commit()
    db.refresh(api_key_obj)

    return ApiKeyCreatedResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        api_key=raw_key,
        key_prefix=key_prefix,
        masked_key=masked_key,
        daily_limit=api_key_obj.daily_limit,
        requests_today=api_key_obj.requests_today,
        created_at=api_key_obj.created_at
    )


@developer_router.get("", response_model=list[ApiKeyOut])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all active developer API keys for the current authenticated user,
    with current daily usage counters and remaining quotas.
    """
    today_str = _get_utc_today_str()
    keys = db.query(ApiKey).filter(
        ApiKey.user_id == current_user.id,
        ApiKey.is_active == True
    ).order_by(ApiKey.created_at.desc()).all()

    results = []
    for k in keys:
        if k.last_reset_date != today_str:
            k.requests_today = 0
            k.last_reset_date = today_str
            db.commit()

        masked = f"{k.key_prefix}...{k.id[-4:]}"
        remaining = max(0, k.daily_limit - k.requests_today)
        results.append(
            ApiKeyOut(
                id=k.id,
                name=k.name,
                key_prefix=k.key_prefix,
                masked_key=masked,
                daily_limit=k.daily_limit,
                requests_today=k.requests_today,
                remaining_today=remaining,
                created_at=k.created_at,
                is_active=k.is_active
            )
        )

    return results


@developer_router.delete("/{key_id}")
def revoke_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a developer API key immediately.
    """
    api_key_obj = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.user_id == current_user.id
    ).first()

    if not api_key_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    api_key_obj.is_active = False
    db.commit()
    return {"detail": "Developer API key revoked successfully", "id": key_id}


# -------------------------------------------------------------
# Public Programmatic Developer Endpoint with Rate Limiting
# -------------------------------------------------------------

@public_v1_router.post("/generate", response_model=DeveloperGenerateResponse)
def developer_generate_portfolio(
    req: DeveloperGenerateRequest,
    api_key: ApiKey = Depends(verify_developer_api_key)
):
    """
    Programmatic REST API for automated portfolio generation.
    Authenticates with 'X-API-Key: pa_live_...', performs zero-hallucination case study synthesis,
    and returns full structured portfolio JSON with quality scorecard.
    """
    target_role = req.target_role.strip()
    profile_data = {
        "headline": req.headline or f"{req.name} | {target_role}",
        "about": req.about or f"{req.name} is a results-driven {target_role} specializing in modern software architectures.",
        "target_role": target_role,
        "skills": req.skills,
        "education": req.education,
        "experience": req.experience,
        "achievements": req.achievements,
        "certifications": [],
        "links": req.links,
        "name": req.name
    }

    raw_projects = []
    for idx, p in enumerate(req.projects):
        if hasattr(p, "model_dump"):
            p_dict = p.model_dump()
        elif isinstance(p, dict):
            p_dict = dict(p)
        else:
            p_dict = {"name": str(p), "description": ""}
        p_dict["id"] = p_dict.get("id") or f"dev-proj-{idx+1}"
        p_dict["is_featured"] = p_dict.get("is_featured", True)
        raw_projects.append(p_dict)

    # 1. Profile & Project Analysis
    profile_analysis = orchestrator.profile_analyzer.analyze(profile_data, target_role)
    project_analyses = [orchestrator.project_analyzer.analyze(p, target_role) for p in raw_projects]

    # 2. Portfolio Planning
    chosen_layout_id = req.layout_id or "modern_grid"
    plan = orchestrator.portfolio_planner.plan(
        profile_analysis=profile_analysis,
        project_analyses=project_analyses,
        target_role=target_role,
        clarification_answers={},
        profile_data=profile_data,
        projects_data=raw_projects,
        layout_id=chosen_layout_id,
        custom_layout_prompt=req.custom_layout_prompt
    )

    # 3. Section and Case Study Generation
    sec_output = orchestrator.section_generator.generate(plan, profile_data, target_role)
    case_studies = orchestrator.case_study_generator.generate(plan, raw_projects, target_role)

    theme_meta = {
        "theme_id": req.theme_id or "electric_cobalt",
        "primary_color": req.primary_color or "#2563EB",
        "theme_config": {}
    }

    content = PortfolioContent(
        hero=sec_output.hero,
        about=sec_output.about,
        skills=sec_output.skills,
        featured_projects=case_studies.featured_projects,
        other_projects=case_studies.other_projects,
        experience=sec_output.experience,
        education=sec_output.education,
        achievements=sec_output.achievements,
        contact=sec_output.contact,
        layout_id=plan.layout_id or chosen_layout_id,
        custom_layout_prompt=plan.custom_layout_prompt or req.custom_layout_prompt,
        layout_config=getattr(plan, "layout_config", None),
        section_order=plan.section_order,
        theme=theme_meta
    )

    # 4. Quality Audit
    combined_user_data = {**profile_data, "projects": raw_projects}
    quality_report = orchestrator.quality_checker.check(content, target_role, combined_user_data)

    # 5. Improvement Loop if needed
    if quality_report.needs_improvement:
        improver_output = orchestrator.improver.improve(content, quality_report, target_role, combined_user_data)
        content = improver_output.content
        quality_report = orchestrator.quality_checker.check(content, target_role, combined_user_data)

    remaining = max(0, api_key.daily_limit - api_key.requests_today)

    return DeveloperGenerateResponse(
        status="success",
        portfolio=content,
        quality_report=quality_report,
        usage=DeveloperGenerateUsage(
            requests_today=api_key.requests_today,
            daily_limit=api_key.daily_limit,
            remaining_today=remaining
        )
    )
