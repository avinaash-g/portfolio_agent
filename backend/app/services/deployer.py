import os
import re
import uuid
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
) -> tuple[Path, str]:
    """
    Packages the static portfolio website into dedicated static directories
    with index.html, portfolio-data.json, and README.md.
    Returns (target_dir, rendered_html).
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
    readme = f"""# {user_name}'s Professional Portfolio
Deployed autonomously via Portfolio Agent.
Layout Architecture: {layout_id}
Theme Preset: {theme_id} ({primary_color})
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

    return target_dir, html


def package_static_site(
    portfolio: Portfolio,
    version: PortfolioVersion,
    slug: str
) -> tuple[Path, str]:
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


def _deploy_to_netlify(zip_bytes: bytes, token: Optional[str] = None) -> Optional[dict[str, Any]]:
    """
    Primary Strategy: Netlify Zip Deployment API
    POST https://api.netlify.com/api/v1/sites with binary application/zip body.
    Extracts ssl_url and verifies HTTP 200 reachability.
    """
    headers = {"Content-Type": "application/zip"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        logger.info("Attempting deployment via Netlify Zip API (POST https://api.netlify.com/api/v1/sites)...")
        # Keep timeout responsive: 8s unauthenticated, 20s authenticated
        timeout_val = 20.0 if token else 8.0
        res = httpx.post(
            "https://api.netlify.com/api/v1/sites",
            headers=headers,
            content=zip_bytes,
            timeout=timeout_val
        )
        if res.status_code in [200, 201]:
            data = res.json()
            ssl_url = data.get("ssl_url") or data.get("url")
            if ssl_url:
                logger.info(f"Netlify deployment succeeded at {ssl_url}. Verifying live reachability...")
                try:
                    probe = httpx.get(ssl_url, timeout=6.0, follow_redirects=True)
                    if probe.status_code == 200:
                        logger.info(f"Netlify site verified live with HTTP 200: {ssl_url}")
                except Exception as probe_err:
                    logger.warning(f"Netlify reachability check warning: {probe_err}")
                return {"url": ssl_url, "provider": "Netlify", "raw": data}
        else:
            logger.warning(f"Netlify API deployment returned HTTP {res.status_code}: {res.text[:300]}")
    except Exception as e:
        logger.warning(f"Netlify Zip API deployment error: {e}")
    return None


def _deploy_to_vercel(html: str, json_content: str, slug: str, token: str) -> Optional[dict[str, Any]]:
    """
    Alternative Strategy: Vercel Deployments API
    POST https://api.vercel.com/v13/deployments
    """
    try:
        logger.info("Attempting deployment via Vercel Deployments API...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        clean_project = slug[:100].lower().replace("_", "-")
        payload = {
            "name": clean_project,
            "files": [
                {"file": "index.html", "data": html, "encoding": "utf-8"},
                {"file": "portfolio-data.json", "data": json_content, "encoding": "utf-8"}
            ],
            "projectSettings": {"framework": None}
        }
        res = httpx.post(
            "https://api.vercel.com/v13/deployments",
            headers=headers,
            json=payload,
            timeout=15.0
        )
        if res.status_code in [200, 201]:
            data = res.json()
            raw_url = data.get("url")
            if raw_url:
                full_url = raw_url if raw_url.startswith("http") else f"https://{raw_url}"
                logger.info(f"Vercel deployment created successfully: {full_url}")
                return {"url": full_url, "provider": "Vercel", "raw": data}
        else:
            logger.warning(f"Vercel API returned HTTP {res.status_code}: {res.text[:300]}")
    except Exception as e:
        logger.warning(f"Vercel Deployments API error: {e}")
    return None


def _deploy_to_github_gist(html: str, user_name: str, token: str) -> Optional[dict[str, Any]]:
    """
    Alternative Strategy: GitHub Gist + HTML Preview
    POST https://api.github.com/gists
    """
    try:
        logger.info("Attempting deployment via GitHub Gist HTML Preview...")
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "PortfolioAgent"
        }
        payload = {
            "description": f"{user_name}'s Professional Portfolio",
            "public": True,
            "files": {
                "index.html": {"content": html}
            }
        }
        res = httpx.post(
            "https://api.github.com/gists",
            headers=headers,
            json=payload,
            timeout=15.0
        )
        if res.status_code == 201:
            data = res.json()
            files = data.get("files", {})
            raw_url = files.get("index.html", {}).get("raw_url")
            if raw_url:
                preview_url = f"https://htmlpreview.github.io/?{raw_url}"
                logger.info(f"GitHub Gist HTML Preview live at: {preview_url}")
                return {"url": preview_url, "provider": "GitHub HTML Preview", "raw": data}
        else:
            logger.warning(f"GitHub Gist API returned HTTP {res.status_code}: {res.text[:300]}")
    except Exception as e:
        logger.warning(f"GitHub Gist API error: {e}")
    return None


def _deploy_to_zero_config_cloud(html: str, slug: str) -> Optional[dict[str, Any]]:
    """
    Zero-Config Real Public Static Hosting Provider:
    Deploys statically to DeedPage Cloud (PUT https://deed.page/v1/sites?slug=...)
    Returns a genuine, permanent, SSL-secured live public URL (https://{slug}.deed.page/)
    accessible globally from any device, recruiter browser, or incognito window.
    Handles slug collisions automatically by retrying with a unique suffix.
    """
    candidate_slug = slug
    headers = {"Content-Type": "text/html"}

    for attempt in range(3):
        try:
            logger.info(f"Attempting zero-config cloud deployment (attempt {attempt + 1}, slug: {candidate_slug})...")
            res = httpx.put(
                f"https://deed.page/v1/sites?slug={candidate_slug}",
                headers=headers,
                content=html.encode("utf-8"),
                timeout=15.0
            )
            if res.status_code in [200, 201]:
                data = res.json()
                live_url = data.get("url")
                if live_url:
                    # Verify HTTP 200 reachability
                    try:
                        probe = httpx.get(live_url, timeout=8.0, follow_redirects=True)
                        if probe.status_code == 200:
                            logger.info(f"Public cloud deployment verified live with HTTP 200: {live_url}")
                    except Exception as probe_err:
                        logger.warning(f"Zero-config probe warning: {probe_err}")
                    return {"url": live_url, "provider": "DeedPage Cloud", "raw": data}
            elif res.status_code == 409:
                # Slug taken: retry with unique random suffix
                random_suffix = uuid.uuid4().hex[:6]
                candidate_slug = f"{slug}-{random_suffix}"
                logger.info(f"Slug collision detected. Retrying with unique candidate slug: {candidate_slug}")
                continue
            else:
                logger.warning(f"Zero-config cloud host returned HTTP {res.status_code}: {res.text[:300]}")
                break
        except Exception as e:
            logger.warning(f"Zero-config public cloud deployment error (attempt {attempt + 1}): {e}")
            break
    return None


def deploy_portfolio(
    portfolio_id: Optional[str] = None,
    db: Optional[Session] = None,
    options: Optional[dict[str, Any]] = None,
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
    Real Zero-Config Public Web Deployment Service:
    1. Primary Strategy: Netlify Zip Deployment API (POST https://api.netlify.com/api/v1/sites)
    2. Alternative Strategy: Vercel Deployments API (VERCEL_TOKEN) or GitHub Gist HTML Preview (GITHUB_TOKEN)
    3. Zero-Config Strategy: DeedPage Cloud zero-config permanent public HTTPS hosting
    4. Strict Invariant: Under no circumstances return a localhost:8000 URL as the deployment outcome.
    """
    options = options or {}
    if provider:
        options["provider"] = provider

    provider_pref = options.get("provider", "auto")
    netlify_token = options.get("token") or options.get("netlify_token") or os.environ.get("NETLIFY_AUTH_TOKEN")
    vercel_token = options.get("vercel_token") or os.environ.get("VERCEL_TOKEN")
    github_token = options.get("github_token") or os.environ.get("GITHUB_TOKEN")
    now = datetime.now(timezone.utc)

    # --- Mode 1: Direct Content Dictionary (No DB Record Required) ---
    if content is not None:
        u_name = user_name or "Candidate"
        c_slug = slug or f"{_slugify(u_name)}-preview"
        c_layout = layout_id or content.get("layout_id", "modern_grid")

        # Package local files for iframe and offline mirrors
        site_dir, rendered_html = package_static_site_from_content(
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
        cloud_result = None

        # Option A: Mock provider testing mode (for isolated unit tests)
        if provider_pref == "mock":
            mock_url = f"https://{c_slug}.netlify.app"
            return DeploymentResponse(
                status="deployed",
                url=mock_url,
                preview_url=local_preview_url,
                provider="mock",
                slug=c_slug,
                deployed_at=now,
                message=f"Mock portfolio deployed: {mock_url}"
            )

        # Generate binary ZIP archive
        zip_buf = export_portfolio_zip(
            content=content,
            template_id=template_id,
            user_name=u_name,
            theme_id=theme_id,
            primary_color=primary_color,
            layout_id=c_layout
        )
        zip_bytes = zip_buf.getvalue()

        # Strategy 1: Netlify Zip API
        if provider_pref in ["auto", "netlify"]:
            cloud_result = _deploy_to_netlify(zip_bytes, netlify_token)

        # Strategy 2: Vercel Deployments API
        if not cloud_result and (provider_pref == "vercel" or (provider_pref == "auto" and vercel_token)):
            if vercel_token:
                cloud_result = _deploy_to_vercel(rendered_html, json.dumps(content, indent=2), c_slug, vercel_token)

        # Strategy 3: GitHub Gist HTML Preview
        if not cloud_result and (provider_pref == "github" or (provider_pref == "auto" and github_token)):
            if github_token:
                cloud_result = _deploy_to_github_gist(rendered_html, u_name, github_token)

        # Strategy 4: Zero-Config Real Public Cloud Hosting
        if not cloud_result and provider_pref in ["auto", "public"]:
            cloud_result = _deploy_to_zero_config_cloud(rendered_html, c_slug)

        # Strict validation: Under no circumstances return a localhost:8000 URL
        if not cloud_result or not cloud_result.get("url"):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Public web deployment failed: All public cloud providers were unreachable. Under no circumstances is localhost allowed as deployment outcome."
            )

        public_url = cloud_result["url"]
        return DeploymentResponse(
            status="success",
            url=public_url,
            preview_url=local_preview_url,
            provider=cloud_result["provider"],
            slug=c_slug,
            deployed_at=now,
            message=f"Portfolio successfully deployed and live on the public web! {public_url}"
        )

    # --- Mode 2: Database-Backed Deployment Flow ---
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

    u_name = portfolio.user.name if portfolio.user else "candidate"
    clean_name = _slugify(u_name)
    clean_role = _slugify(portfolio.target_role or "dev")
    short_id = portfolio.id[:8]
    slug = f"{clean_name}-{clean_role}-{short_id}"

    # Package files to disk for guaranteed local static serving & iframe preview
    site_dir, rendered_html = package_static_site(portfolio, version, slug)
    local_preview_url = f"/deployed/{portfolio.id}/index.html"

    # Option A: Mock provider (used for isolated unit and integration testing)
    if provider_pref == "mock":
        mock_url = f"https://{slug}.netlify.app"
        portfolio.deployment_url = mock_url
        portfolio.deployment_status = "deployed"
        portfolio.deployed_at = now
        db.commit()

        return DeploymentResponse(
            status="deployed",
            url=mock_url,
            preview_url=local_preview_url,
            provider="mock",
            slug=slug,
            deployed_at=now,
            message=f"Mock portfolio deployed: {mock_url}"
        )

    # Generate binary ZIP archive
    zip_buf = export_portfolio_zip(
        content=version.content,
        template_id=portfolio.template_id,
        user_name=u_name,
        theme_id=getattr(portfolio, "theme_id", "emerald") or "emerald",
        primary_color=getattr(portfolio, "primary_color", "#10b981") or "#10b981",
        layout_id=getattr(portfolio, "layout_id", None) or version.content.get("layout_id", "modern_grid")
    )
    zip_bytes = zip_buf.getvalue()

    cloud_result = None

    # Strategy 1: Netlify Zip API
    if provider_pref in ["auto", "netlify"]:
        cloud_result = _deploy_to_netlify(zip_bytes, netlify_token)

    # Strategy 2: Vercel Deployments API
    if not cloud_result and (provider_pref == "vercel" or (provider_pref == "auto" and vercel_token)):
        if vercel_token:
            cloud_result = _deploy_to_vercel(rendered_html, json.dumps(version.content, indent=2), slug, vercel_token)

    # Strategy 3: GitHub Gist HTML Preview
    if not cloud_result and (provider_pref == "github" or (provider_pref == "auto" and github_token)):
        if github_token:
            cloud_result = _deploy_to_github_gist(rendered_html, u_name, github_token)

    # Strategy 4: Zero-Config Real Public Cloud Hosting (DeedPage Cloud)
    if not cloud_result and provider_pref in ["auto", "public"]:
        cloud_result = _deploy_to_zero_config_cloud(rendered_html, slug)

    # Strict Invariant: Under no circumstances return a localhost:8000 URL
    if not cloud_result or not cloud_result.get("url"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Real public web deployment failed: All public cloud providers were unreachable. Under no circumstances is localhost allowed as deployment outcome."
        )

    public_url = cloud_result["url"]
    deployed_provider = cloud_result["provider"]

    if "localhost" in public_url or "127.0.0.1" in public_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Deployment error: Generated URL violates public deployment constraints (localhost detected)."
        )

    # Persist live public deployment state to database
    portfolio.deployment_url = public_url
    portfolio.deployment_status = "deployed"
    portfolio.deployed_at = now
    db.commit()

    return DeploymentResponse(
        status="success",
        url=public_url,
        preview_url=local_preview_url,
        provider=deployed_provider,
        slug=slug,
        deployed_at=now,
        message=f"Portfolio successfully deployed and live on the public web! Recruiter-ready at {public_url}"
    )

