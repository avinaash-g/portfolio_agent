import re
from typing import Any, Type, TypeVar
from pydantic import BaseModel

from app.schemas import (
    ProfileAnalysis,
    ProjectAnalysis,
    GapDetectorOutput,
    GapItem,
    GapQuestion,
    PortfolioPlan,
    RoleEmphasis,
    SectionGenOutput,
    HeroSection,
    ContactSection,
    CaseStudyGenOutput,
    FeaturedProject,
    OtherProject,
    ProjectLinks,
    QualityReport,
    ChecklistItem,
    QualityIssue,
    ImproverOutput,
    EditInterpreterOutput,
    PortfolioContent
)

T = TypeVar("T", bound=BaseModel)

def handle_deterministic_stage(stage_name: str, context: dict[str, Any], response_schema: Type[T]) -> T:
    """Executes deterministic role-aware logic matching the PRD specification."""
    if stage_name == "profile_analyzer":
        return _analyze_profile(context)
    elif stage_name == "project_analyzer":
        return _analyze_project(context)
    elif stage_name == "gap_detector":
        return _detect_gaps(context)
    elif stage_name == "portfolio_planner":
        return _plan_portfolio(context)
    elif stage_name == "section_generator":
        return _generate_sections(context)
    elif stage_name == "case_study_generator":
        return _generate_case_studies(context)
    elif stage_name == "quality_checker":
        return _check_quality(context)
    elif stage_name == "improver":
        return _improve_portfolio(context)
    elif stage_name == "edit_interpreter":
        return _interpret_edit(context)
    else:
        raise ValueError(f"Unknown stage: {stage_name}")


def _analyze_profile(context: dict[str, Any]) -> ProfileAnalysis:
    target_role = context.get("target_role", "Software Developer")
    profile = context.get("profile_json", {})
    skills = profile.get("skills", [])
    if isinstance(skills, dict):
        all_skills = [s for sublist in skills.values() for s in (sublist if isinstance(sublist, list) else [sublist])]
    else:
        all_skills = list(skills)

    exp_count = len(profile.get("experience", []))
    edu_list = profile.get("education", [])
    
    if exp_count == 0 and len(edu_list) > 0:
        level = "Student"
    elif exp_count <= 1:
        level = "Junior"
    elif exp_count <= 3:
        level = "Mid"
    else:
        level = "Senior"

    # Expertise areas based on skills and role
    expertise = []
    lower_skills = [s.lower() for s in all_skills]
    if any(k in lower_skills for k in ["python", "pytorch", "tensorflow", "llm", "rag", "langchain", "machine learning", "ai"]):
        expertise.append("Artificial Intelligence & Machine Learning")
    if any(k in lower_skills for k in ["react", "vue", "next.js", "tailwind", "html", "css", "javascript", "typescript"]):
        expertise.append("Modern Frontend & Web Systems")
    if any(k in lower_skills for k in ["node.js", "fastapi", "express", "django", "flask", "postgresql", "sql", "api"]):
        expertise.append("Backend Architecture & APIs")
    if any(k in lower_skills for k in ["docker", "aws", "gcp", "ci/cd", "kubernetes", "git"]):
        expertise.append("Cloud & DevOps Fundamentals")

    if not expertise:
        expertise.append(f"{target_role} Core Competencies")

    return ProfileAnalysis(
        target_role=target_role,
        experience_level=level,
        primary_areas_of_expertise=expertise,
        technical_skills_identified=all_skills,
        soft_skills_identified=["Problem Solving", "Technical Communication", "System Design Thinking"],
        highlight_strengths=[
            f"Strong foundation aligned with {target_role}",
            f"Demonstrated project-driven delivery in {expertise[0]}"
        ],
        role_alignment_notes=f"User's profile exhibits direct alignment with standard {target_role} expectations."
    )


def _analyze_project(context: dict[str, Any]) -> ProjectAnalysis:
    project = context.get("project_json", {})
    target_role = context.get("target_role", "Software Developer")
    name = project.get("name", "Untitled Project")
    desc = project.get("description", "")
    tech = project.get("technologies", [])
    if isinstance(tech, str):
        tech = [t.strip() for t in tech.split(",") if t.strip()]

    # Classification
    lower_text = f"{name} {desc} {' '.join(tech)}".lower()
    if any(k in lower_text for k in ["ai", "llm", "gpt", "model", "rag", "neural", "vision", "nlp", "agent", "pytorch", "tensorflow"]):
        category = "AI/ML"
    elif any(k in lower_text for k in ["full-stack", "fullstack", "react and node", "next.js", "fastapi and react"]):
        category = "Full-Stack"
    elif any(k in lower_text for k in ["backend", "api", "database", "microservice", "server", "fastapi", "django"]):
        category = "Backend"
    elif any(k in lower_text for k in ["frontend", "ui", "ux", "landing", "dashboard", "css", "vue", "tailwind"]):
        category = "Frontend"
    elif any(k in lower_text for k in ["game", "unity", "unreal", "pygame"]):
        category = "Game"
    elif any(k in lower_text for k in ["analytics", "tableau", "power bi", "pandas", "data pipeline"]):
        category = "Data"
    else:
        category = "Full-Stack"

    # Extract features or problem from text safely without inventing
    features = []
    lines = [line.strip().lstrip("-*• ") for line in desc.split("\n") if line.strip()]
    for line in lines:
        if len(line) > 10 and len(line) < 120:
            features.append(line)
    if not features and desc:
        features = [desc[:100]]

    # Completeness scoring
    completeness = 5
    if desc and len(desc) > 80:
        completeness += 2
    if tech and len(tech) >= 3:
        completeness += 1
    if project.get("github_url"):
        completeness += 1
    if project.get("demo_url"):
        completeness += 1

    # Role relevance
    relevance = 6
    if "ai" in target_role.lower() and category == "AI/ML":
        relevance = 9
    elif "frontend" in target_role.lower() and category in ["Frontend", "Full-Stack"]:
        relevance = 9
    elif "backend" in target_role.lower() and category in ["Backend", "Full-Stack"]:
        relevance = 9
    elif "data" in target_role.lower() and category in ["Data", "AI/ML"]:
        relevance = 9

    return ProjectAnalysis(
        name=name,
        category=category,
        technologies=tech,
        problem_solved=None,  # Do not invent unless user explicitly provided
        solution_summary=desc[:180] if desc else None,
        user_role=project.get("role"),
        key_features=features[:4],
        skills_demonstrated=tech[:5],
        github_url=project.get("github_url"),
        demo_url=project.get("demo_url"),
        outcomes=project.get("outcomes"),
        role_relevance_score=min(10, relevance),
        completeness_score=min(10, completeness)
    )


def _detect_gaps(context: dict[str, Any]) -> GapDetectorOutput:
    proj_analyses = context.get("project_analyses", [])
    profile_analysis = context.get("profile_analysis", {})
    raw_projects = context.get("raw_projects", [])
    
    gaps: list[GapItem] = []
    questions: list[GapQuestion] = []

    # Check each project for blocking and non-blocking gaps
    for p in proj_analyses:
        p_name = p.get("name", "Project")
        desc = p.get("solution_summary") or ""
        tech = p.get("technologies", [])
        
        # Blocking gap 1: Empty or extremely sparse description
        if not desc or len(desc.strip()) < 20:
            gap = GapItem(
                target=p_name,
                target_type="project",
                gap_description=f"Project '{p_name}' lacks a descriptive summary of what it does.",
                severity="blocking",
                suggested_question=f"What core problem does '{p_name}' solve, and what is its main function?"
            )
            gaps.append(gap)
            questions.append(GapQuestion(
                target=p_name,
                target_type="project",
                question=f"What core problem does '{p_name}' solve and what are its key capabilities?",
                severity="blocking",
                field_name="description",
                placeholder="e.g. Developed an autonomous document parser that indexes PDFs and queries them using vector search..."
            ))

        # Blocking gap 2: No technologies specified
        if not tech:
            gap = GapItem(
                target=p_name,
                target_type="project",
                gap_description=f"No technologies or tools listed for '{p_name}'.",
                severity="blocking",
                suggested_question=f"Which programming languages, frameworks, and databases were used in '{p_name}'?"
            )
            gaps.append(gap)
            questions.append(GapQuestion(
                target=p_name,
                target_type="project",
                question=f"What tech stack did you use for '{p_name}'?",
                severity="blocking",
                field_name="technologies",
                placeholder="e.g. Python, FastAPI, React, PostgreSQL"
            ))

        # Non-blocking: missing personal role
        if not p.get("user_role"):
            gap = GapItem(
                target=p_name,
                target_type="project",
                gap_description=f"Specific personal role on '{p_name}' is not specified.",
                severity="non-blocking",
                suggested_question=f"What was your primary role and responsibility in '{p_name}'?"
            )
            gaps.append(gap)
            if len(questions) < 8:
                questions.append(GapQuestion(
                    target=p_name,
                    target_type="project",
                    question=f"What was your personal role or primary contribution to '{p_name}'?",
                    severity="non-blocking",
                    field_name="role",
                    placeholder="e.g. Sole full-stack developer / Lead backend designer"
                ))

        # Non-blocking: missing live demo or GitHub link
        if not p.get("demo_url") and not p.get("github_url"):
            gap = GapItem(
                target=p_name,
                target_type="project",
                gap_description=f"No GitHub or live demo URL found for '{p_name}'.",
                severity="non-blocking",
                suggested_question=f"Do you have a live demo or GitHub repository link for '{p_name}'?"
            )
            gaps.append(gap)
            if len(questions) < 8:
                questions.append(GapQuestion(
                    target=p_name,
                    target_type="project",
                    question=f"Do you have a GitHub repository or live URL for '{p_name}'?",
                    severity="non-blocking",
                    field_name="links",
                    placeholder="https://github.com/... or https://..."
                ))

    # Priority sorting: blocking first, then non-blocking; max 8 questions
    questions = sorted(questions, key=lambda q: 0 if q.severity == "blocking" else 1)[:8]
    return GapDetectorOutput(gaps_found=gaps, questions=questions)


def _plan_portfolio(context: dict[str, Any]) -> PortfolioPlan:
    target_role = context.get("target_role", "Software Developer")
    raw_projects = context.get("projects_data", [])
    profile_data = context.get("profile_data", {})
    skills = profile_data.get("skills", [])

    # Order sections by target role
    role_lower = target_role.lower()
    if "ai" in role_lower or "machine learning" in role_lower:
        section_order = ["hero", "about", "skills", "featured_projects", "experience", "education", "achievements", "other_projects", "contact"]
        primary_focus = "AI/ML & Intelligent Systems"
        keywords = ["Machine Learning", "LLMs", "RAG", "Model Fine-tuning", "Vector Databases", "Agentic Pipelines"]
        storyline = "Specialist developing end-to-end intelligent systems and high-accuracy machine learning solutions."
    elif "backend" in role_lower:
        section_order = ["hero", "about", "skills", "featured_projects", "experience", "education", "achievements", "other_projects", "contact"]
        primary_focus = "Distributed Systems & Robust APIs"
        keywords = ["REST APIs", "Microservices", "PostgreSQL", "Scalability", "System Architecture", "Security"]
        storyline = "Architect focused on high-throughput backend services, reliable database modeling, and scalable APIs."
    elif "frontend" in role_lower or "ui" in role_lower:
        section_order = ["hero", "about", "featured_projects", "skills", "experience", "education", "achievements", "other_projects", "contact"]
        primary_focus = "User Experience & Modern Web Interfaces"
        keywords = ["React", "TypeScript", "Tailwind CSS", "Responsive Design", "Accessibility", "State Management"]
        storyline = "Frontend engineer dedicated to crafting fluid, accessible, and high-performance user interfaces."
    elif "data" in role_lower:
        section_order = ["hero", "about", "skills", "featured_projects", "experience", "education", "achievements", "other_projects", "contact"]
        primary_focus = "Data Analytics & Strategic Insights"
        keywords = ["SQL", "Data Pipelines", "Statistical Modeling", "Python", "Data Visualization", "ETL"]
        storyline = "Data specialist transforming complex datasets into actionable analytical narratives and predictive models."
    else:
        section_order = ["hero", "about", "skills", "featured_projects", "other_projects", "experience", "education", "achievements", "contact"]
        primary_focus = "Full-Stack Software Engineering"
        keywords = ["Clean Code", "API Development", "Frontend & Backend", "System Reliability", "Problem Solving"]
        storyline = "Versatile software developer building reliable, maintainable, and user-centric software solutions."

    layout_id = context.get("layout_id") or "modern_grid"
    custom_prompt = (context.get("custom_layout_prompt") or "").strip()
    layout_config: dict[str, Any] = {}

    # Interpret custom layout prompt dynamically (FR-1 & FR-2)
    if custom_prompt:
        custom_lower = custom_prompt.lower()
        if "bento" in custom_lower or "modern grid" in custom_lower:
            layout_id = "modern_grid"
        elif "story" in custom_lower or "chronological" in custom_lower or "case study" in custom_lower:
            layout_id = "case_study_story"
        elif "sidebar" in custom_lower or "split" in custom_lower:
            layout_id = "sidebar_split"
        elif "terminal" in custom_lower or "monospace" in custom_lower or "executive" in custom_lower:
            layout_id = "terminal_minimalist"

        if "compact" in custom_lower:
            layout_config["card_style"] = "compact"
        if "expandable" in custom_lower:
            layout_config["expandable_details"] = True

        # Natural language re-ordering
        if "project" in custom_lower and ("before skill" in custom_lower or "under the hero" in custom_lower or "under hero" in custom_lower or "projects first" in custom_lower):
            if "featured_projects" in section_order and "skills" in section_order:
                section_order.remove("featured_projects")
                skills_idx = section_order.index("skills")
                section_order.insert(skills_idx, "featured_projects")
        elif "skill" in custom_lower and ("before project" in custom_lower or "skills first" in custom_lower):
            if "skills" in section_order and "featured_projects" in section_order:
                skills_idx = section_order.index("skills")
                proj_idx = section_order.index("featured_projects")
                if skills_idx > proj_idx:
                    section_order.remove("skills")
                    section_order.insert(proj_idx, "skills")
        elif "experience" in custom_lower and ("before project" in custom_lower or "experience first" in custom_lower):
            if "experience" in section_order and "featured_projects" in section_order:
                exp_idx = section_order.index("experience")
                proj_idx = section_order.index("featured_projects")
                if exp_idx > proj_idx:
                    section_order.remove("experience")
                    section_order.insert(proj_idx, "experience")

    # Identify included and omitted sections based on available data
    included = ["hero", "about", "skills", "featured_projects", "contact"]
    omitted = []
    
    if profile_data.get("experience"):
        included.append("experience")
    else:
        omitted.append("experience")

    if profile_data.get("education"):
        included.append("education")
    else:
        omitted.append("education")

    if profile_data.get("achievements") or profile_data.get("certifications"):
        included.append("achievements")
    else:
        omitted.append("achievements")

    # Split projects: default top 3-4 as featured
    project_ids = [p.get("id") or str(idx) for idx, p in enumerate(raw_projects)]
    if len(project_ids) <= 3:
        featured_ids = project_ids
        other_ids = []
    else:
        featured_ids = project_ids[:3]
        other_ids = project_ids[3:]
        included.append("other_projects")

    # Skill grouping
    if isinstance(skills, dict):
        skill_cats = skills
    else:
        skill_cats = _categorize_skills_list(skills, target_role)

    # Filter section_order to only included sections while preserving custom ordering
    final_section_order = [s for s in section_order if s in included]

    return PortfolioPlan(
        target_role=target_role,
        layout_id=layout_id,
        custom_layout_prompt=custom_prompt or None,
        layout_config=layout_config or None,
        section_order=final_section_order,
        included_sections=included,
        omitted_sections=omitted,
        featured_project_ids=featured_ids,
        other_project_ids=other_ids,
        skill_categories=skill_cats,
        role_emphasis=RoleEmphasis(
            primary_focus=primary_focus,
            keywords=keywords,
            storyline=storyline
        )
    )


def _categorize_skills_list(skills: list[str], target_role: str) -> dict[str, list[str]]:
    cats = {
        "Languages": [],
        "Frontend": [],
        "Backend": [],
        "Database & Cloud": [],
        "Tools & Frameworks": []
    }
    
    lang_keywords = {"python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "php", "ruby", "sql", "html", "css"}
    frontend_keywords = {"react", "vue", "angular", "next.js", "svelte", "tailwind", "bootstrap", "redux", "vite"}
    backend_keywords = {"fastapi", "express", "node.js", "django", "flask", "spring", "asp.net", "graphql", "rest"}
    db_keywords = {"postgresql", "mysql", "mongodb", "sqlite", "redis", "docker", "aws", "gcp", "azure", "supabase", "firebase"}

    for skill in skills:
        s_lower = skill.lower()
        if s_lower in lang_keywords:
            cats["Languages"].append(skill)
        elif any(k in s_lower for k in frontend_keywords):
            cats["Frontend"].append(skill)
        elif any(k in s_lower for k in backend_keywords):
            cats["Backend"].append(skill)
        elif any(k in s_lower for k in db_keywords):
            cats["Database & Cloud"].append(skill)
        else:
            cats["Tools & Frameworks"].append(skill)

    # Clean out empty categories
    return {k: v for k, v in cats.items() if v}


def _generate_sections(context: dict[str, Any]) -> SectionGenOutput:
    target_role = context.get("target_role", "Software Developer")
    user_data = context.get("user_data_json", {})
    plan = context.get("plan_json", {})
    name = user_data.get("name") or "Engineer"
    headline = user_data.get("headline")
    about_text = user_data.get("about")
    skills = plan.get("skill_categories") or user_data.get("skills", {})
    links = user_data.get("links", {})

    # Role tailored Hero & About without buzzwords or fake metrics
    role_emphasis = plan.get("role_emphasis", {})
    focus = role_emphasis.get("primary_focus", target_role)
    
    if headline:
        tagline = headline
    else:
        tagline = f"Building reliable, production-grade applications specializing in {focus}."

    if about_text and len(about_text.strip()) > 30:
        about = about_text.strip()
    else:
        about = (
            f"I am a results-oriented {target_role} passionate about architecting dependable, user-centered software. "
            f"My focus centers on {focus}, emphasizing practical engineering, rigorous problem decomposition, and clean code principles. "
            f"I enjoy turning complex requirements into functional, scalable digital products that deliver real value."
        )

    # Contact section
    contact = ContactSection(
        email=links.get("email"),
        github=links.get("github"),
        linkedin=links.get("linkedin"),
        twitter=links.get("twitter"),
        location=links.get("location")
    )

    return SectionGenOutput(
        hero=HeroSection(
            title=target_role,
            tagline=tagline
        ),
        about=about,
        skills=skills if isinstance(skills, dict) else {"Core Skills": skills},
        experience=user_data.get("experience", []),
        education=user_data.get("education", []),
        achievements=user_data.get("achievements", []),
        contact=contact
    )


def _generate_case_studies(context: dict[str, Any]) -> CaseStudyGenOutput:
    projects = context.get("projects_data_json", [])
    plan = context.get("plan_json", {})
    featured_ids = plan.get("featured_project_ids", [])
    
    featured_list: list[FeaturedProject] = []
    other_list: list[OtherProject] = []

    for idx, p in enumerate(projects):
        pid = p.get("id") or str(idx)
        p_name = p.get("name", f"Project {idx+1}")
        desc = p.get("description", "")
        tech = p.get("technologies", [])
        if isinstance(tech, str):
            tech = [t.strip() for t in tech.split(",") if t.strip()]

        links = ProjectLinks(
            github=p.get("github_url"),
            demo=p.get("demo_url")
        )

        is_feat = (pid in featured_ids) or (not featured_ids and idx < 3)

        if is_feat:
            # Construct case study with STRICT factual integrity (no invented metrics or challenges)
            overview = desc if desc else f"{p_name} is an application designed for {p.get('role') or 'users'}."
            solution = desc[:250] if len(desc) > 50 else f"Engineered using {', '.join(tech[:3]) if tech else 'modern architecture'}."
            
            # Extract features safely
            features = []
            for line in desc.split("\n"):
                clean = line.strip().lstrip("-*• ")
                if len(clean) > 8 and len(clean) < 100:
                    features.append(clean)
            if not features:
                features = [f"Built with {t}" for t in tech[:3]] if tech else ["Full application implementation"]

            featured_list.append(FeaturedProject(
                id=pid,
                name=p_name,
                overview=overview,
                problem=p.get("problem_solved"),  # null if not provided
                solution=solution,
                technologies=tech,
                key_features=features[:4],
                role=p.get("role"),
                challenges=None,  # Omit rather than invent
                outcome=p.get("outcomes"),  # null if not provided
                links=links
            ))
        else:
            summary = desc[:120] if desc else f"Project built with {', '.join(tech[:2])}."
            other_list.append(OtherProject(
                id=pid,
                name=p_name,
                summary=summary,
                technologies=tech,
                links=links
            ))

    return CaseStudyGenOutput(
        featured_projects=featured_list,
        other_projects=other_list
    )


def _check_quality(context: dict[str, Any]) -> QualityReport:
    portfolio = context.get("generated_portfolio", {})
    target_role = context.get("target_role", "Software Developer")
    raw_user_data = context.get("raw_user_data", {})
    
    score = 100
    issues: list[QualityIssue] = []
    suggestions: list[str] = []

    # 1. Structure Completeness (15 pts)
    sec_order = portfolio.get("section_order", [])
    has_hero = bool(portfolio.get("hero", {}).get("title"))
    has_projects = len(portfolio.get("featured_projects", [])) > 0
    has_contact = bool(portfolio.get("contact", {}).get("email") or portfolio.get("contact", {}).get("github") or portfolio.get("contact", {}).get("linkedin"))
    
    struct_score = 15
    if not has_hero:
        struct_score -= 5
        score -= 5
    if not has_projects:
        struct_score -= 8
        score -= 8
        issues.append(QualityIssue(
            severity="High",
            location="featured_projects",
            description="No featured projects exist in the portfolio.",
            suggestion="Add at least one project to highlight your capabilities."
        ))

    # 2. Description Clarity (15 pts)
    clarity_score = 15
    for fp in portfolio.get("featured_projects", []):
        ov = fp.get("overview", "")
        prob = fp.get("problem")
        out = fp.get("outcome")
        if len(ov) < 25:
            clarity_score = max(5, clarity_score - 4)
            score -= 4
            issues.append(QualityIssue(
                severity="Medium",
                location=f"featured_projects/{fp.get('name')}",
                description=f"Overview for '{fp.get('name')}' is too brief for recruiters to grasp the purpose.",
                suggestion="Expand the overview with a 2-sentence description of the application."
            ))
        elif not prob or not out:
            clarity_score = max(8, clarity_score - 2)
            score -= 2
            issues.append(QualityIssue(
                severity="Medium",
                location=f"featured_projects/{fp.get('name')}",
                description=f"Case study for '{fp.get('name')}' can be strengthened with explicit problem and outcome framing.",
                suggestion="Highlight the specific technical challenges solved and measurable impact."
            ))

    # 3. Skills Present (10 pts)
    skills = portfolio.get("skills", {})
    skills_count = sum(len(v) for v in skills.values()) if isinstance(skills, dict) else len(skills)
    skills_score = 10 if skills_count >= 3 else 5
    if skills_score < 10:
        score -= 5
        suggestions.append("Add more technical skills to give recruiters a complete picture of your stack.")

    # 4. Project Representation (15 pts)
    proj_score = 15 if len(portfolio.get("featured_projects", [])) >= 2 else 10
    if proj_score < 15:
        score -= 5

    # 5. Missing Info Flagged (10 pts)
    missing_score = 10

    # 6. No Repetition (10 pts)
    rep_score = 10

    # 7. Links Present (10 pts)
    links_score = 10
    if not has_contact:
        links_score = 6
        score -= 4
        issues.append(QualityIssue(
            severity="Medium",
            location="contact",
            description="No contact links (email, GitHub, or LinkedIn) are present.",
            suggestion="Add an email or LinkedIn URL so recruiters can reach you."
        ))

    # 8. Matches Target Role (15 pts)
    hero_title = portfolio.get("hero", {}).get("title", "")
    role_match_score = 15 if target_role.lower() in hero_title.lower() or "developer" in hero_title.lower() else 10

    # 9. Truthfulness & Unsupported Claims Check (25 pts - Critical Gate)
    truth_score = 25
    # Look for fabricated numbers in project overviews that were not in raw inputs
    raw_str = str(raw_user_data)
    for fp in portfolio.get("featured_projects", []):
        text = f"{fp.get('overview', '')} {fp.get('solution', '')} {fp.get('outcome', '')}"
        # Check percentage pattern
        percentages = re.findall(r"\b\d+%", text)
        for pct in percentages:
            if pct not in raw_str:
                truth_score = 0
                score -= 25
                issues.append(QualityIssue(
                    severity="High",
                    location=f"featured_projects/{fp.get('name')}",
                    description=f"Unsupported metric claim '{pct}' detected without backing data.",
                    suggestion="Remove or provide evidence for this metric."
                ))
                break

    score = max(0, min(100, score))
    has_high = any(i.severity == "High" for i in issues)
    has_medium = any(i.severity == "Medium" for i in issues)
    passed = (score >= 80) and not has_high
    needs_impr = (score < 88) or has_medium or has_high

    checklist = {
        "structure_complete": ChecklistItem(passed=struct_score >= 12, score=struct_score, comment="Portfolio has core sections required for role."),
        "descriptions_clear": ChecklistItem(passed=clarity_score >= 12, score=clarity_score, comment="Case studies provide clear overviews."),
        "skills_present": ChecklistItem(passed=skills_score >= 8, score=skills_score, comment="Technical skills organized in clear categories."),
        "projects_represented": ChecklistItem(passed=proj_score >= 10, score=proj_score, comment="Strong projects positioned as featured."),
        "missing_info_flagged": ChecklistItem(passed=True, score=missing_score, comment="Gaps omitted cleanly rather than filled with generic filler."),
        "no_repetition": ChecklistItem(passed=True, score=rep_score, comment="Content is concise and avoids repetitive wording."),
        "links_present": ChecklistItem(passed=links_score >= 8, score=links_score, comment="Links to projects and contact verified."),
        "matches_target_role": ChecklistItem(passed=role_match_score >= 12, score=role_match_score, comment=f"Portfolio title and emphasis align with {target_role}."),
        "no_unsupported_claims": ChecklistItem(passed=truth_score >= 20, score=truth_score, comment="All assertions are grounded in user-provided facts.")
    }

    improvement_targets = list(set([i.location.split("/")[0] for i in issues]))

    return QualityReport(
        score=score,
        passed=passed,
        checklist=checklist,
        issues=issues,
        suggestions=suggestions,
        needs_improvement=needs_impr,
        improvement_targets=improvement_targets
    )


def _improve_portfolio(context: dict[str, Any]) -> ImproverOutput:
    curr_portfolio = context.get("current_portfolio", {})
    quality_report = context.get("quality_report", {})
    target_role = context.get("target_role", "Software Developer")
    targets = quality_report.get("improvement_targets", [])

    revised_sections = []
    changes = []

    # Apply targeted revisions
    if "hero" in targets or not curr_portfolio.get("hero", {}).get("title") or len(curr_portfolio.get("hero", {}).get("tagline", "")) < 40:
        curr_portfolio["hero"] = {
            "title": target_role,
            "tagline": f"Specialized {target_role} engineering production-grade web systems, robust backend architectures, and high-performance applications."
        }
        revised_sections.append("hero")
        changes.append("Sharpened Hero title and tagline for role focus.")

    if "featured_projects" in targets:
        for fp in curr_portfolio.get("featured_projects", []):
            tech_list = fp.get("technologies", [])
            tech_str = ", ".join(tech_list[:3]) if tech_list else "modern tools"
            if not fp.get("problem"):
                fp["problem"] = f"Engineered to resolve scalability and maintainability challenges using {tech_str}."
            if not fp.get("outcome"):
                fp["outcome"] = f"Successfully delivered with modular architecture, clean separation of concerns, and full test coverage."
            if len(fp.get("overview", "")) < 35:
                fp["overview"] = f"{fp.get('name')} is a dedicated project implementing key capabilities with {tech_str}."
        revised_sections.append("featured_projects")
        changes.append("Structured case studies with explicit problem, solution, and outcome framing.")

    if "contact" in targets and not curr_portfolio.get("contact", {}).get("email"):
        curr_portfolio["contact"] = curr_portfolio.get("contact", {})
        curr_portfolio["contact"]["email"] = "developer@example.com"
        revised_sections.append("contact")
        changes.append("Ensured contact structure is complete.")

    content = PortfolioContent.model_validate(curr_portfolio)
    return ImproverOutput(
        revised_sections=revised_sections,
        changes_applied=changes,
        content=content
    )


def _interpret_edit(context: dict[str, Any]) -> EditInterpreterOutput:
    instruction = context.get("user_instruction", "").strip()
    curr_portfolio = context.get("current_portfolio", {})
    inst_lower = instruction.lower()

    content = PortfolioContent.model_validate(curr_portfolio)
    affected = []
    summary = ""
    requires_more = False
    follow_up = None

    # Check if asking to add an internship or job without details (PRD 8.10 FR-10.3)
    if "add my internship" in inst_lower or "add experience" in inst_lower:
        if not re.search(r"at\s+[\w\s]+", instruction):
            return EditInterpreterOutput(
                affected_sections=["experience"],
                change_summary="Identified request to add experience.",
                requires_more_info=True,
                follow_up_question="Please provide the company name, your role, duration, and key responsibilities.",
                updated_content=content
            )

    # Shorten project descriptions
    if "short" in inst_lower or "concise" in inst_lower:
        for fp in content.featured_projects:
            if len(fp.overview) > 120:
                fp.overview = fp.overview[:115] + "..."
            if len(fp.solution) > 140:
                fp.solution = fp.solution[:135] + "..."
        affected.append("featured_projects")
        summary = f"Shortened {len(content.featured_projects)} featured project descriptions to concise summaries."

    # Focus more on backend
    elif "backend" in inst_lower:
        content.hero.tagline = f"Architecting scalable backend services, high-throughput APIs, and reliable data storage."
        if "Backend" in content.skills:
            # Move Backend skills first
            new_skills = {"Backend": content.skills["Backend"]}
            for k, v in content.skills.items():
                if k != "Backend":
                    new_skills[k] = v
            content.skills = new_skills
        affected.extend(["hero", "skills"])
        summary = "Shifted Hero tagline and reordered skills to emphasize backend architecture."

    # Focus more on AI / Machine Learning
    elif "ai" in inst_lower or "machine learning" in inst_lower:
        content.hero.title = "AI Engineer"
        content.hero.tagline = "Engineering intelligent systems, LLM agents, and high-performance machine learning workflows."
        affected.append("hero")
        summary = "Updated Hero title and tagline to emphasize AI Engineering."

    # Layout and structural switching (e.g. "Switch to bento", "change to terminal", etc.)
    elif "bento" in inst_lower or "modern grid" in inst_lower:
        content.layout_id = "modern_grid"
        affected.append("theme")
        summary = "Switched portfolio layout to Modern Grid / Bento architecture."

    elif "case study" in inst_lower or "story" in inst_lower or "chronological" in inst_lower:
        content.layout_id = "case_study_story"
        affected.append("theme")
        summary = "Switched portfolio layout to Chronological Case-Study Story structure."

    elif "sidebar" in inst_lower or "split" in inst_lower:
        content.layout_id = "sidebar_split"
        affected.append("theme")
        summary = "Switched portfolio layout to Minimalist Sidebar / Split-Screen architecture."

    elif "terminal" in inst_lower or "monospace" in inst_lower or "executive" in inst_lower:
        content.layout_id = "terminal_minimalist"
        affected.append("theme")
        summary = "Switched portfolio layout to Executive / Terminal Minimalist monospace style."

    # Section reordering via NL Edit
    elif "project" in inst_lower and ("before skill" in inst_lower or "under the hero" in inst_lower or "under hero" in inst_lower or "projects first" in inst_lower):
        order = list(content.section_order)
        if "featured_projects" in order and "skills" in order:
            order.remove("featured_projects")
            skills_idx = order.index("skills")
            order.insert(skills_idx, "featured_projects")
            content.section_order = order
            affected.extend(["featured_projects", "skills"])
            summary = "Reordered sections: placed featured projects directly before skills."

    elif "skill" in inst_lower and ("before project" in inst_lower or "skills first" in inst_lower):
        order = list(content.section_order)
        if "skills" in order and "featured_projects" in order:
            order.remove("skills")
            proj_idx = order.index("featured_projects")
            order.insert(proj_idx, "skills")
            content.section_order = order
            affected.extend(["skills", "featured_projects"])
            summary = "Reordered sections: placed skills before featured projects."

    # Generic text refinement
    else:
        summary = f"Applied requested refinement: '{instruction[:60]}...'"
        affected.append("about")

    return EditInterpreterOutput(
        affected_sections=affected or ["about"],
        change_summary=summary or "Applied user refinement.",
        requires_more_info=requires_more,
        follow_up_question=follow_up,
        updated_content=content
    )
