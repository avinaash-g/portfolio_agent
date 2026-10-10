from datetime import datetime
from typing import Optional, Any, Union
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# --- Auth & User ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Profile & Projects Data Models ---
class EducationItem(BaseModel):
    institution: str
    degree: str
    year: Optional[str] = None
    details: Optional[str] = None

class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str
    location: Optional[str] = None
    highlights: list[str] = Field(default_factory=list)

class AchievementItem(BaseModel):
    title: str
    description: Optional[str] = None
    year: Optional[str] = None

class CertificationItem(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[str] = None

class LinksDict(BaseModel):
    github: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None

class ProfileBase(BaseModel):
    headline: Optional[str] = None
    about: Optional[str] = None
    target_role: str
    skills: list[str] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    achievements: list[AchievementItem] = Field(default_factory=list)
    certifications: list[CertificationItem] = Field(default_factory=list)
    links: dict[str, Optional[str]] = Field(default_factory=dict)

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    name: str
    description: str
    technologies: list[str] = Field(default_factory=list)
    role: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    outcomes: Optional[str] = None
    display_order: int = 0
    is_featured: bool = True

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: str
    profile_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Agent Pipeline Schemas ---
class ProfileAnalysis(BaseModel):
    target_role: str
    experience_level: str = "Junior"
    primary_areas_of_expertise: list[str] = Field(default_factory=list)
    technical_skills_identified: list[str] = Field(default_factory=list)
    soft_skills_identified: list[str] = Field(default_factory=list)
    highlight_strengths: list[str] = Field(default_factory=list)
    role_alignment_notes: str = ""

class ProjectAnalysis(BaseModel):
    name: str
    category: str = "Full-Stack"
    technologies: list[str] = Field(default_factory=list)
    problem_solved: Optional[str] = None
    solution_summary: Optional[str] = None
    user_role: Optional[str] = None
    key_features: list[str] = Field(default_factory=list)
    skills_demonstrated: list[str] = Field(default_factory=list)
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    outcomes: Optional[str] = None
    role_relevance_score: int = 5
    completeness_score: int = 5

class GapItem(BaseModel):
    target: str
    target_type: str = "project"  # profile | project
    gap_description: str
    severity: str = "non-blocking"  # blocking | non-blocking
    suggested_question: str

class GapQuestion(BaseModel):
    target: str
    target_type: str = "project"
    question: str
    severity: str = "non-blocking"
    field_name: Optional[str] = None
    placeholder: Optional[str] = None

class GapDetectorOutput(BaseModel):
    gaps_found: list[GapItem] = Field(default_factory=list)
    questions: list[GapQuestion] = Field(default_factory=list)

class RoleEmphasis(BaseModel):
    primary_focus: str
    keywords: list[str] = Field(default_factory=list)
    storyline: str

class PortfolioPlan(BaseModel):
    target_role: str
    layout_id: str = "modern_grid"
    custom_layout_prompt: Optional[str] = None
    layout_config: Optional[dict[str, Any]] = None
    section_order: list[str] = Field(
        default_factory=lambda: [
            "hero", "about", "skills", "featured_projects", "other_projects",
            "experience", "education", "achievements", "contact"
        ]
    )
    included_sections: list[str] = Field(default_factory=list)
    omitted_sections: list[str] = Field(default_factory=list)
    featured_project_ids: list[str] = Field(default_factory=list)
    other_project_ids: list[str] = Field(default_factory=list)
    skill_categories: dict[str, list[str]] = Field(default_factory=dict)
    role_emphasis: RoleEmphasis = Field(
        default_factory=lambda: RoleEmphasis(
            primary_focus="Software Engineering",
            keywords=[],
            storyline="Grounded technical builder"
        )
    )

class HeroSection(BaseModel):
    title: str
    tagline: str

class ProjectLinks(BaseModel):
    github: Optional[str] = None
    demo: Optional[str] = None

class FeaturedProject(BaseModel):
    id: Optional[str] = None
    name: str
    overview: str
    problem: Optional[str] = None
    solution: str
    technologies: list[str] = Field(default_factory=list)
    key_features: list[str] = Field(default_factory=list)
    role: Optional[str] = None
    challenges: Optional[str] = None
    outcome: Optional[str] = None
    links: ProjectLinks = Field(default_factory=ProjectLinks)

class OtherProject(BaseModel):
    id: Optional[str] = None
    name: str
    summary: str
    technologies: list[str] = Field(default_factory=list)
    links: ProjectLinks = Field(default_factory=ProjectLinks)

class ContactSection(BaseModel):
    email: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    location: Optional[str] = None

class PortfolioContent(BaseModel):
    hero: HeroSection
    about: str
    skills: dict[str, list[str]] = Field(default_factory=dict)
    featured_projects: list[FeaturedProject] = Field(default_factory=list)
    other_projects: list[OtherProject] = Field(default_factory=list)
    experience: list[dict[str, Any]] = Field(default_factory=list)
    education: list[dict[str, Any]] = Field(default_factory=list)
    achievements: list[dict[str, Any]] = Field(default_factory=list)
    contact: ContactSection = Field(default_factory=ContactSection)
    theme: Optional[dict[str, Any]] = None
    layout_id: str = "modern_grid"
    custom_layout_prompt: Optional[str] = None
    layout_config: Optional[dict[str, Any]] = None
    section_order: list[str] = Field(
        default_factory=lambda: [
            "hero", "about", "skills", "featured_projects", "other_projects",
            "experience", "education", "achievements", "contact"
        ]
    )

class ChecklistItem(BaseModel):
    passed: bool
    score: int
    comment: str

class QualityIssue(BaseModel):
    severity: str  # High | Medium | Low
    location: str
    description: str
    suggestion: str

class QualityReport(BaseModel):
    score: int
    passed: bool
    checklist: dict[str, ChecklistItem] = Field(default_factory=dict)
    issues: list[QualityIssue] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    needs_improvement: bool = False
    improvement_targets: list[str] = Field(default_factory=list)

class SectionGenOutput(BaseModel):
    hero: HeroSection
    about: str
    skills: dict[str, list[str]] = Field(default_factory=dict)
    experience: list[dict[str, Any]] = Field(default_factory=list)
    education: list[dict[str, Any]] = Field(default_factory=list)
    achievements: list[dict[str, Any]] = Field(default_factory=list)
    contact: ContactSection = Field(default_factory=ContactSection)

class CaseStudyGenOutput(BaseModel):
    featured_projects: list[FeaturedProject] = Field(default_factory=list)
    other_projects: list[OtherProject] = Field(default_factory=list)

class ImproverOutput(BaseModel):
    revised_sections: list[str] = Field(default_factory=list)
    changes_applied: list[str] = Field(default_factory=list)
    content: PortfolioContent

class EditInterpreterOutput(BaseModel):
    affected_sections: list[str] = Field(default_factory=list)
    change_summary: str
    requires_more_info: bool = False
    follow_up_question: Optional[str] = None
    updated_content: PortfolioContent


# --- API Request/Response Schemas ---
class PortfolioCreateRequest(BaseModel):
    profile_id: Optional[str] = None
    title: str = "My Professional Portfolio"
    target_role: Optional[str] = None
    template_id: str = "clean"
    layout_id: Optional[str] = "modern_grid"
    custom_layout_prompt: Optional[str] = None
    theme_id: Optional[str] = "emerald"
    primary_color: Optional[str] = "#10b981"
    theme_config: Optional[dict[str, Any]] = None

class PortfolioThemeUpdate(BaseModel):
    theme_id: Optional[str] = None
    primary_color: Optional[str] = None
    template_id: Optional[str] = None
    layout_id: Optional[str] = None
    custom_layout_prompt: Optional[str] = None
    theme_config: Optional[dict[str, Any]] = None

class DeploymentRequest(BaseModel):
    provider: Optional[str] = "auto"
    token: Optional[str] = None
    custom_domain: Optional[str] = None

class DeploymentResponse(BaseModel):
    status: str
    url: str
    preview_url: Optional[str] = None
    provider: str
    slug: str
    deployed_at: datetime
    message: str

class AnswerItem(BaseModel):
    question_id: str
    answer: Optional[str] = None
    action: str = "answer"  # "answer" or "skip"

class AnswersSubmitRequest(BaseModel):
    answers: Union[list[AnswerItem], dict[str, Any]]
    generate_anyway: bool = False

class PlanApproveRequest(BaseModel):
    approved: bool = True
    custom_plan: Optional[PortfolioPlan] = None

class NLEditRequest(BaseModel):
    instruction: str

class ManualContentUpdate(BaseModel):
    content: PortfolioContent

class ProjectOrderUpdate(BaseModel):
    featured_project_ids: list[str]
    other_project_ids: list[str]

class QuestionOut(BaseModel):
    id: str
    run_id: str
    target: str
    target_type: str
    field_name: Optional[str]
    question: str
    placeholder: Optional[str]
    severity: str
    answer: Optional[str]
    status: str

    model_config = ConfigDict(from_attributes=True)

class AgentRunOut(BaseModel):
    id: str
    portfolio_id: str
    state: str
    current_stage: str
    iteration: int
    error: Optional[str]
    logs: list[Any]
    started_at: datetime
    finished_at: Optional[datetime]
    questions: list[QuestionOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class PortfolioVersionOut(BaseModel):
    id: str
    portfolio_id: str
    version_number: int
    plan: Optional[dict[str, Any]]
    content: dict[str, Any]
    quality_report: Optional[dict[str, Any]]
    created_by: str
    change_summary: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PortfolioOut(BaseModel):
    id: str
    user_id: str
    profile_id: str
    title: str
    target_role: str
    template_id: str
    layout_id: Optional[str] = "modern_grid"
    custom_layout_prompt: Optional[str] = None
    theme_id: Optional[str] = "emerald"
    primary_color: Optional[str] = "#10b981"
    theme_config: Optional[dict[str, Any]] = Field(default_factory=dict)
    deployment_url: Optional[str] = None
    deployment_status: Optional[str] = None
    deployed_at: Optional[datetime] = None
    current_version_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    current_version: Optional[PortfolioVersionOut] = None
    latest_run: Optional[AgentRunOut] = None

    model_config = ConfigDict(from_attributes=True)


# --- Developer Platform & API Key Schemas ---
class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Label for the API Key")

class ApiKeyCreatedResponse(BaseModel):
    id: str
    name: str
    api_key: str  # Only returned once on creation!
    key_prefix: str
    masked_key: str
    daily_limit: int
    requests_today: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApiKeyOut(BaseModel):
    id: str
    name: str
    key_prefix: str
    masked_key: str
    daily_limit: int
    requests_today: int
    remaining_today: int
    created_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class DeveloperGenerateProjectItem(BaseModel):
    name: str
    description: str
    technologies: list[str] = Field(default_factory=list)
    role: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    outcomes: Optional[str] = None
    is_featured: bool = True

class DeveloperGenerateRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Candidate name")
    target_role: str = Field(..., min_length=1, description="Target career role")
    headline: Optional[str] = None
    about: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    experience: list[dict[str, Any]] = Field(default_factory=list)
    education: list[dict[str, Any]] = Field(default_factory=list)
    achievements: list[dict[str, Any]] = Field(default_factory=list)
    links: dict[str, Optional[str]] = Field(default_factory=dict)
    projects: list[Union[DeveloperGenerateProjectItem, dict[str, Any]]] = Field(default_factory=list)
    layout_id: Optional[str] = "modern_grid"
    custom_layout_prompt: Optional[str] = None
    theme_id: Optional[str] = "electric_cobalt"
    primary_color: Optional[str] = "#2563EB"

class DeveloperGenerateUsage(BaseModel):
    requests_today: int
    daily_limit: int
    remaining_today: int

class DeveloperGenerateResponse(BaseModel):
    status: str = "success"
    portfolio: PortfolioContent
    quality_report: QualityReport
    usage: DeveloperGenerateUsage

