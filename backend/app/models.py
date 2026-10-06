import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    headline = Column(String(255), nullable=True)
    about = Column(Text, nullable=True)
    target_role = Column(String(100), nullable=False)
    education = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    achievements = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    links = Column(JSON, default=dict)
    skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="profiles")
    projects = relationship("Project", back_populates="profile", cascade="all, delete-orphan", order_by="Project.display_order")
    portfolios = relationship("Portfolio", back_populates="profile", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    profile_id = Column(String(36), ForeignKey("profiles.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    technologies = Column(JSON, default=list)
    role = Column(String(255), nullable=True)
    github_url = Column(String(512), nullable=True)
    demo_url = Column(String(512), nullable=True)
    outcomes = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    is_featured = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    profile = relationship("Profile", back_populates="projects")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    profile_id = Column(String(36), ForeignKey("profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    target_role = Column(String(100), nullable=False)
    template_id = Column(String(50), default="clean")
    layout_id = Column(String(50), default="modern_grid")
    custom_layout_prompt = Column(Text, nullable=True)
    theme_id = Column(String(50), default="emerald")
    primary_color = Column(String(50), default="#10b981")
    theme_config = Column(JSON, default=dict)
    deployment_url = Column(String(512), nullable=True)
    deployment_status = Column(String(50), nullable=True)
    deployed_at = Column(DateTime, nullable=True)
    current_version_id = Column(String(36), nullable=True)
    status = Column(String(50), default="draft")  # draft, ready
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="portfolios")
    profile = relationship("Profile", back_populates="portfolios")
    versions = relationship("PortfolioVersion", back_populates="portfolio", cascade="all, delete-orphan", order_by="desc(PortfolioVersion.version_number)")
    runs = relationship("AgentRun", back_populates="portfolio", cascade="all, delete-orphan", order_by="desc(AgentRun.started_at)")


class PortfolioVersion(Base):
    __tablename__ = "portfolio_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    portfolio_id = Column(String(36), ForeignKey("portfolios.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    plan = Column(JSON, nullable=True)
    content = Column(JSON, nullable=False)
    quality_report = Column(JSON, nullable=True)
    created_by = Column(String(50), default="agent")  # agent, user, nl_edit
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    portfolio = relationship("Portfolio", back_populates="versions")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    portfolio_id = Column(String(36), ForeignKey("portfolios.id"), nullable=False)
    state = Column(String(50), default="INPUT")  # INPUT, ANALYZED, NEEDS_INFO, PLANNED, GENERATED, CHECKED, IMPROVING, READY, FAILED
    current_stage = Column(String(50), default="Init")
    iteration = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    logs = Column(JSON, default=list)
    started_at = Column(DateTime, default=utc_now)
    finished_at = Column(DateTime, nullable=True)

    portfolio = relationship("Portfolio", back_populates="runs")
    questions = relationship("AgentQuestion", back_populates="run", cascade="all, delete-orphan")


class AgentQuestion(Base):
    __tablename__ = "agent_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_id = Column(String(36), ForeignKey("agent_runs.id"), nullable=False)
    target = Column(String(255), nullable=False)  # profile or project id/name
    target_type = Column(String(50), default="project")  # profile or project
    field_name = Column(String(100), nullable=True)
    question = Column(Text, nullable=False)
    placeholder = Column(String(255), nullable=True)
    severity = Column(String(50), default="non-blocking")  # blocking, non-blocking
    answer = Column(Text, nullable=True)
    status = Column(String(50), default="open")  # open, answered, skipped

    run = relationship("AgentRun", back_populates="questions")
