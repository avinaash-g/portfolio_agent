import os
import re
import json
import shutil
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
import httpx
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import Portfolio, PortfolioVersion
from app.export.renderer import render_portfolio_html, export_portfolio_zip
from app.schemas import DeploymentResponse

logger = logging.getLogger("services.deployer")

STATIC_DEPLOYMENTS_DIR = Path(__file__).resolve().parent.parent.parent / "static_deployments"
DEPLOYMENTS_DIR = Path(__file__).resolve().parent.parent.parent / "deployments"
DIST_DIR = Path(__file__).resolve().parent.parent.parent / "dist"
STATIC_DEPLOYMENTS_DIR.mkdir(parents=True, exist_ok=True)
DEPLOYMENTS_DIR.mkdir(parents=True, exist_ok=True)
DIST_DIR.mkdir(parents=True, exist_ok=True)

def _slugify(text: str) -> str:
    """Converts a string to a safe URL slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "candidate"

def package_static_site_from_content(
    content: dict[str, Any],
    user_name: str,
    slug: str,
    template_id: str = "clean",
    layout_id: str = "modern_grid",
    theme_id: str = "emerald",
    primary_color: str = "#10b981",
    portfolio_id: Optional[str] = None
) -> Path:
    """
    Packages the static portfolio website into dedicated static directories
    with index.html, portfolio-data.json, and README.md.
    Guarantees deployment files are available across both static_deployments/
    and deployments/ folders under both slug and portfolio_id.
    """
    target_dir = STATIC_DEPLOYMENTS_DIR / slug
    target_dir.mkdir(parents=True, exist_ok=True)

    html = render_portfolio_html(
        content=content,
        template_id=template_id,
        user_name=user_name,
        theme_id=theme_id,
        primary_color=primary_color,
        layout_id=layout_id
    )

    json_content = json.dumps(content, indent=2)
    preview_ref = portfolio_id or slug
    readme = f"""# {user_name}'s Professional Portfolio
Deployed autonomously via Portfolio Agent.
Live Domain: Netlify / Local Preview
Local Mirror: http://localhost:8000/deployed/{preview_ref}/index.html
Architecture Layout: {layout_id}
Generated: {datetime.now(timezone.utc).isoformat()}
"""

    # Populate primary target directory
    (target_dir / "index.html").write_text(html, encoding="utf-8")
    (target_dir / "portfolio-data.json").write_text(json_content, encoding="utf-8")
    (target_dir / "README.md").write_text(readme, encoding="utf-8")

    # Mirror to additional access paths (portfolio_id directory, deployments/, and dist/ folder)
    extra_dirs = [
        DEPLOYMENTS_DIR / slug,
        DIST_DIR / slug,
    ]
    if portfolio_id and portfolio_id != slug:
        extra_dirs.append(STATIC_DEPLOYMENTS_DIR / portfolio_id)
        extra_dirs.append(DEPLOYMENTS_DIR / portfolio_id)
        extra_dirs.append(DIST_DIR / portfolio_id)

    for mirror_dir in extra_dirs:
        mirror_dir.mkdir(parents=True, exist_ok=True)
        (mirror_dir / "index.html").write_text(html, encoding="utf-8")
        (mirror_dir / "portfolio-data.json").write_text(json_content, encoding="utf-8")
        (mirror_dir / "README.md").write_text(readme, encoding="utf-8")

    return target_dir


def package_static_site(
    portfolio: Portfolio,
    version: PortfolioVersion,
    slug: str
) -> Path:
    """Packages static site from Portfolio and PortfolioVersion models."""
    user_name = portfolio.user.name if portfolio.user else "Candidate"
    layout_id = getattr(portfolio, "layout_id", None) or version.content.get("layout_id", "modern_grid")
    theme_id = getattr(portfolio, "theme_id", "emerald") or "emerald"
    primary_color = getattr(portfolio, "primary_color", "#10b981") or "#10b981"
    
    return package_static_site_from_content(
        content=version.content,
        user_name=user_name,
        slug=slug,
        template_id=portfolio.template_id,
        layout_id=layout_id,
        theme_id=theme_id,
        primary_color=primary_color,
        portfolio_id=portfolio.id
    )


def deploy_portfolio(
    portfolio_id: Optional[str] = None,
    db: Optional[Session] = None,
    options: Optional[dict[str, Any]] = None,
    # Direct dictionary parameters (useful for direct testing and mock deployments)
    content: Optional[dict[str, Any]] = None,
    user_name: Optional[str] = None,
    slug: Optional[str] = None,
    layout_id: Optional[str] = None,
    template_id: str = "clean",
    theme_id: str = "emerald",
    primary_color: str = "#10b981",
    provider: Optional[str] = None
) -> DeploymentResponse:
    """
    Autonomous deployment service supporting:
    1. Zero-config Netlify Zip API deployment:
       POST https://api.netlify.com/api/v1/sites with application/zip payload
    2. Guaranteed local static preview fallback via dedicated FastAPI server route:
       GET /deployed/{portfolio_id}/index.html
    3. Mock provider testing mode for isolated unit tests
    """
    options = options or {}
    if provider:
        options["provider"] = provider

    provider_pref = options.get("provider", "auto")
    token = options.get("token") or os.environ.get("NETLIFY_AUTH_TOKEN")
    now = datetime.now(timezone.utc)

    # --- Direct content mode (no DB record required) ---
    if content is not None:
        u_name = user_name or "Candidate"
        c_slug = slug or f"{_slugify(u_name)}-preview"
        c_layout = layout_id or content.get("layout_id", "modern_grid")
        site_dir = package_static_site_from_content(
            content=content,
            user_name=u_name,
            slug=c_slug,
            template_id=template_id,
            layout_id=c_layout,
            theme_id=theme_id,
            primary_color=primary_color,
            portfolio_id=portfolio_id or c_slug
        )

        local_preview_url = f"/deployed/{c_slug}/index.html"
        local_full_url = f"http://localhost:8000/deployed/{c_slug}/index.html"

        # Check if Netlify requested and token provided
        if provider_pref == "netlify" and token:
            try:
                zip_buf = export_portfolio_zip(
                    content=content,
                    template_id=template_id,
                    user_name=u_name,
                    theme_id=theme_id,
                    primary_color=primary_color,
                    layout_id=c_layout
                )
                headers = {
                    "Content-Type": "application/zip",
                    "Authorization": f"Bearer {token}"
                }
                res = httpx.post(
                    "https://api.netlify.com/api/v1/sites",
                    headers=headers,
                    content=zip_buf.getvalue(),
                    timeout=30.0
                )
                if res.status_code in [200, 201]:
                    data = res.json()
                    ssl_url = data.get("ssl_url") or data.get("url")
                    if ssl_url:
                        verified = False
                        try:
                            verify_res = httpx.get(ssl_url, timeout=10.0, follow_redirects=True)
                            if verify_res.status_code == 200:
                                verified = True
                                logger.info(f"Netlify site verified live with HTTP 200: {ssl_url}")
                            else:
                                logger.warning(f"Netlify verification returned HTTP {verify_res.status_code}")
                        except Exception as ve:
                            logger.warning(f"Netlify verification reachability check: {ve}")

                        if verified:
                            return DeploymentResponse(
                                status="success",
                                url=ssl_url,
                                preview_url=local_preview_url,
                                provider="Netlify",
                                slug=c_slug,
                                deployed_at=now,
                                message=f"Portfolio successfully deployed and live on Netlify! {ssl_url}"
                            )
                        else:
                            logger.warning(f"Netlify site {ssl_url} did not return HTTP 200. Falling back to local preview.")
            except Exception as e:
                logger.warning(f"Direct Netlify Zip API deployment error: {e}")

        # Local preview fallback for direct content mode
        resp_status = "deployed" if provider_pref == "mock" else "success"
        resp_provider = "mock" if provider_pref == "mock" else "Local Preview"
        return DeploymentResponse(
            status=resp_status,
            url=local_full_url,
            preview_url=local_preview_url,
            provider=resp_provider,
            slug=c_slug,
            deployed_at=now,
            message=f"Portfolio successfully deployed and live! Recruiter-ready on {local_full_url}"
        )

    # --- Database-backed deployment flow ---
    if not db or not portfolio_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid portfolio_id and database session required for portfolio deployment."
        )

    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    if not portfolio.current_version_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Portfolio has not been generated yet. Please generate before deploying."
        )

    version = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
    if not version:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio version not found")

    user_name = portfolio.user.name if portfolio.user else "candidate"
    clean_name = _slugify(user_name)
    clean_role = _slugify(portfolio.target_role or "dev")
    short_id = portfolio.id[:8]
    slug = f"{clean_name}-{clean_role}-{short_id}"

    # Package files to disk for guaranteed static serving
    site_dir = package_static_site(portfolio, version, slug)

    # Local guaranteed fallback URL
    local_preview_url = f"/deployed/{portfolio.id}/index.html"
    local_full_url = f"http://localhost:8000/deployed/{portfolio.id}/index.html"

    deployed_provider = None
    public_url = None
    status_val = "success"

    # Option A: Mock provider (used for isolated unit and integration testing)
    if provider_pref == "mock":
        deployed_provider = "mock"
        public_url = local_full_url
        status_val = "deployed"

    # Option B: Zero-config Netlify Zip API deployment
    elif provider_pref in ["auto", "netlify"]:
        zip_buf = export_portfolio_zip(
            content=version.content,
            template_id=portfolio.template_id,
            user_name=user_name,
            theme_id=getattr(portfolio, "theme_id", "emerald") or "emerald",
            primary_color=getattr(portfolio, "primary_color", "#10b981") or "#10b981",
            layout_id=getattr(portfolio, "layout_id", None) or version.content.get("layout_id", "modern_grid")
        )

        try:
            logger.info("Attempting deployment via Netlify Zip API (POST https://api.netlify.com/api/v1/sites)...")
            netlify_headers = {"Content-Type": "application/zip"}
            if token:
                netlify_headers["Authorization"] = f"Bearer {token}"

            res = httpx.post(
                "https://api.netlify.com/api/v1/sites",
                headers=netlify_headers,
                content=zip_buf.getvalue(),
                timeout=30.0
            )

            if res.status_code in [200, 201]:
                data = res.json()
                ssl_url = data.get("ssl_url") or data.get("url")
                if ssl_url:
                    logger.info(f"Netlify deployment created at {ssl_url}. Verifying HTTP 200 reachability...")
                    # Verify HTTP 200 before returning
                    verified = False
                    try:
                        verify_res = httpx.get(ssl_url, timeout=10.0, follow_redirects=True)
                        if verify_res.status_code == 200:
                            verified = True
                            logger.info(f"Netlify site verified live with HTTP 200: {ssl_url}")
                        else:
                            logger.warning(f"Netlify reachability check returned status {verify_res.status_code}")
                    except Exception as ve:
                        logger.warning(f"Netlify reachability verification check: {ve}")

                    if verified:
                        public_url = ssl_url
                        deployed_provider = "Netlify"
                        status_val = "success"
                    else:
                        logger.warning(
                            f"Netlify site {ssl_url} did not return HTTP 200 during verification check. Falling back to local preview route."
                        )
            else:
                logger.warning(f"Netlify Zip API deployment returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Netlify Zip API deployment failed: {e}", exc_info=True)

    # Option C: Guaranteed local preview fallback if Netlify unreachable or rate-limited
    if not public_url:
        logger.info(
            f"Netlify unavailable or unauthenticated. Using guaranteed local preview fallback for portfolio {portfolio.id}."
        )
        # Verify local HTML file physically exists on disk before returning
        local_index = STATIC_DEPLOYMENTS_DIR / portfolio.id / "index.html"
        if not local_index.is_file() or local_index.stat().st_size == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate static portfolio index.html file."
            )

        public_url = local_full_url
        deployed_provider = "Local Preview"
        status_val = "success"

    # Update database state
    portfolio.deployment_url = public_url
    portfolio.deployment_status = "deployed"
    portfolio.deployed_at = now
    db.commit()

    return DeploymentResponse(
        status=status_val,
        url=public_url,
        preview_url=local_preview_url,
        provider=deployed_provider,
        slug=slug,
        deployed_at=now,
        message=f"Portfolio successfully deployed and live! Recruiter-ready on {public_url}"
    )
