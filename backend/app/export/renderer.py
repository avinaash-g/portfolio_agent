import io
import json
import zipfile
import re
from pathlib import Path
from typing import Any
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"])
)

# 5 Curated Themes matching editorial taste-skill requirements
CURATED_THEMES = {
    "emerald": {
        "name": "Editorial Ink",
        "primary": "#18181b",
        "mode": "light",
        "bg_color": "#ffffff",
        "surface_color": "#ffffff",
        "border_color": "#e4e4e7",
        "accent_secondary": "#3f3f46"
    },
    "indigo": {
        "name": "Modern Slate",
        "primary": "#334155",
        "mode": "light",
        "bg_color": "#ffffff",
        "surface_color": "#f8fafc",
        "border_color": "#e2e8f0",
        "accent_secondary": "#475569"
    },
    "amber": {
        "name": "Warm Editorial",
        "primary": "#78716c",
        "mode": "light",
        "bg_color": "#fdfdfc",
        "surface_color": "#ffffff",
        "border_color": "#e7e5e4",
        "accent_secondary": "#57534e"
    },
    "cyber": {
        "name": "Minimalist Pine",
        "primary": "#166534",
        "mode": "light",
        "bg_color": "#ffffff",
        "surface_color": "#ffffff",
        "border_color": "#e4e4e7",
        "accent_secondary": "#15803d"
    },
    "rose": {
        "name": "Deep Navy",
        "primary": "#1e3a8a",
        "mode": "light",
        "bg_color": "#ffffff",
        "surface_color": "#ffffff",
        "border_color": "#e2e8f0",
        "accent_secondary": "#1d4ed8"
    }
}

def _hex_to_rgb(hex_code: str) -> tuple[int, int, int]:
    """Converts a HEX string (#rrggbb or #rgb) to an (R, G, B) tuple."""
    clean = hex_code.lstrip("#").strip()
    if len(clean) == 3:
        clean = "".join(c * 2 for c in clean)
    if len(clean) != 6:
        return (24, 24, 27)  # default zinc-900
    try:
        return tuple(int(clean[i:i+2], 16) for i in (0, 2, 4))
    except ValueError:
        return (24, 24, 27)

def _adjust_color(hex_code: str, factor: float = 0.85) -> str:
    """Darkens or lightens a HEX color."""
    r, g, b = _hex_to_rgb(hex_code)
    r = max(0, min(255, int(r * factor)))
    g = max(0, min(255, int(g * factor)))
    b = max(0, min(255, int(b * factor)))
    return f"#{r:02x}{g:02x}{b:02x}"

LAYOUT_TEMPLATES = {
    "modern_grid": "layouts/modern_grid.html",
    "case_study_story": "layouts/case_study_story.html",
    "sidebar_split": "layouts/sidebar_split.html",
    "terminal_minimalist": "layouts/terminal_minimalist.html",
}

LAYOUT_NAMES = {
    "modern_grid": "Modern Grid / Bento",
    "case_study_story": "Chronological Case-Study Story",
    "sidebar_split": "Minimalist Sidebar / Split-Screen",
    "terminal_minimalist": "Executive / Terminal Minimalist",
}

def render_portfolio_html(
    content: dict[str, Any],
    template_id: str = "clean",
    user_name: str = "Candidate",
    theme_id: str = "emerald",
    primary_color: str | None = None,
    layout_id: str | None = None
) -> str:
    """
    Renders portfolio content into a standalone HTML file using the chosen Jinja2 template/layout variant
    and dynamically injecting user-selected theme styles and primary accent colors.
    """
    theme_meta = CURATED_THEMES.get(theme_id.lower(), CURATED_THEMES["emerald"])
    
    # Selected or custom primary color
    active_primary = primary_color if primary_color and primary_color.startswith("#") else theme_meta["primary"]
    r, g, b = _hex_to_rgb(active_primary)
    rgb_str = f"{r}, {g}, {b}"
    primary_hover = _adjust_color(active_primary, 0.85)

    # Determine layout template dynamically
    resolved_layout = layout_id or content.get("layout_id")

    if resolved_layout and resolved_layout.lower() in LAYOUT_TEMPLATES:
        template_name = LAYOUT_TEMPLATES[resolved_layout.lower()]
        current_layout_key = resolved_layout.lower()
    elif template_id.lower() in LAYOUT_TEMPLATES:
        template_name = LAYOUT_TEMPLATES[template_id.lower()]
        current_layout_key = template_id.lower()
    elif template_id.lower() == "dark":
        template_name = "dark.html"
        current_layout_key = "clean_dark"
    elif template_id.lower() == "clean":
        template_name = "clean.html"
        current_layout_key = "clean"
    else:
        template_name = "layouts/modern_grid.html"
        current_layout_key = "modern_grid"

    template = jinja_env.get_template(template_name)
    
    render_data = {
        "user_name": user_name or "Candidate",
        "hero": content.get("hero", {}),
        "about": content.get("about", ""),
        "skills": content.get("skills", {}),
        "featured_projects": content.get("featured_projects", []),
        "other_projects": content.get("other_projects", []),
        "experience": content.get("experience", []),
        "education": content.get("education", []),
        "achievements": content.get("achievements", []),
        "contact": content.get("contact", {}),
        "section_order": content.get("section_order", []),
        "layout_id": current_layout_key,
        "layout_name": LAYOUT_NAMES.get(current_layout_key, current_layout_key.title()),
        "layout_config": content.get("layout_config", {}),
        # Dynamic Theme Tokens
        "theme_id": theme_id,
        "theme_name": theme_meta["name"],
        "primary_color": active_primary,
        "primary_rgb": rgb_str,
        "primary_hover": primary_hover,
        "bg_color": theme_meta.get("bg_color", "#090d16"),
        "surface_color": theme_meta.get("surface_color", "rgba(17, 24, 39, 0.75)"),
        "border_color": theme_meta.get("border_color", "rgba(255, 255, 255, 0.08)"),
        "accent_secondary": theme_meta.get("accent_secondary", active_primary)
    }

    rendered = template.render(**render_data)

    # Verify no unrendered Jinja syntax remains
    unrendered_tags = re.findall(r"\{\{.*?\}\}", rendered)
    if unrendered_tags:
        rendered = re.sub(r"\{\{.*?\}\}", "", rendered)

    return rendered


def export_portfolio_zip(
    content: dict[str, Any],
    template_id: str = "clean",
    user_name: str = "Candidate",
    theme_id: str = "emerald",
    primary_color: str | None = None,
    layout_id: str | None = None
) -> io.BytesIO:
    """
    Creates a deployable self-contained static site ZIP package containing:
    - index.html (self-contained HTML matching the exact selected layout variant)
    - portfolio-data.json (raw structured data)
    - README.md (quick start offline & hosting guide)
    """
    html_content = render_portfolio_html(
        content=content,
        template_id=template_id,
        user_name=user_name,
        theme_id=theme_id,
        primary_color=primary_color,
        layout_id=layout_id
    )
    json_data = json.dumps(content, indent=2)

    active_theme = CURATED_THEMES.get(theme_id.lower(), CURATED_THEMES["emerald"])
    chosen_color = primary_color or active_theme["primary"]
    resolved_layout = layout_id or content.get("layout_id") or template_id
    layout_name = LAYOUT_NAMES.get(resolved_layout, resolved_layout.title())

    readme_content = f"""# {user_name}'s Professional Portfolio
Generated by Automated Portfolio Builder Agent.

## Architecture & Visual Configuration
- **Layout Architecture**: {layout_name}
- **Visual Personality**: {active_theme['name']}
- **Primary Accent**: `{chosen_color}`

## Quick Start (Offline Viewing)
Simply double-click `index.html` or open it in any modern web browser (Chrome, Safari, Edge, Firefox).
No server, backend, node.js, or Docker container is required.

## 1-Click Deployment (Autonomous / Free)
You can deploy this static website for free on any modern hosting provider:
- **Netlify**: Instant zero-config hosting via Netlify Drop (app.netlify.com/drop) or one-click API deployment.
- **GitHub Pages**: Push this directory to a GitHub repo and enable GitHub Pages on `main`.
- **Vercel**: Drag and drop this unzipped folder into your Vercel dashboard.

## Contents
- `index.html`: Fully styled, responsive static portfolio page matching your exact chosen layout.
- `portfolio-data.json`: Structured source JSON data.
- `README.md`: Hosting & offline guide.
"""

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("index.html", html_content)
        zip_file.writestr("portfolio-data.json", json_data)
        zip_file.writestr("README.md", readme_content)

    buffer.seek(0)
    return buffer
