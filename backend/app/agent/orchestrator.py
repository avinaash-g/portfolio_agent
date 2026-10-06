import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Portfolio, PortfolioVersion, AgentRun, AgentQuestion, Profile, Project
from app.schemas import (
    PortfolioPlan,
    PortfolioContent,
    QualityReport,
    ProfileAnalysis,
    ProjectAnalysis,
    GapDetectorOutput
)
from app.agent.llm_client import LLMClient
from app.agent.profile_analyzer import ProfileAnalyzer
from app.agent.project_analyzer import ProjectAnalyzer
from app.agent.gap_detector import GapDetector
from app.agent.portfolio_planner import PortfolioPlanner
from app.agent.section_generator import SectionGenerator
from app.agent.case_study_generator import CaseStudyGenerator
from app.agent.quality_checker import QualityChecker
from app.agent.improver import PortfolioImprover
from app.agent.edit_interpreter import EditInterpreter
from app.utils.sse import sse_manager

logger = logging.getLogger("agent.orchestrator")

class AgentOrchestrator:
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()
        self.profile_analyzer = ProfileAnalyzer(self.llm_client)
        self.project_analyzer = ProjectAnalyzer(self.llm_client)
        self.gap_detector = GapDetector(self.llm_client)
        self.portfolio_planner = PortfolioPlanner(self.llm_client)
        self.section_generator = SectionGenerator(self.llm_client)
        self.case_study_generator = CaseStudyGenerator(self.llm_client)
        self.quality_checker = QualityChecker(self.llm_client)
        self.improver = PortfolioImprover(self.llm_client)
        self.edit_interpreter = EditInterpreter(self.llm_client)

    async def _emit_log(self, run_id: str, stage: str, message: str, progress: int, state: str, payload: Any = None):
        logger.info(f"[{run_id}] [{stage}] ({progress}%) {message}")
        data = {
            "run_id": run_id,
            "stage": stage,
            "message": message,
            "progress": progress,
            "state": state,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Persist log in DB so any client reconnecting gets full log history
        db = SessionLocal()
        try:
            db_run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
            if db_run:
                existing = list(db_run.logs or [])
                existing.append({
                    "stage": stage,
                    "message": message,
                    "progress": progress,
                    "state": state,
                    "timestamp": data["timestamp"]
                })
                db_run.logs = existing
                db_run.current_stage = stage
                db_run.state = state
                db.commit()
        except Exception as e:
            logger.warning(f"Could not persist log to db: {e}")
        finally:
            db.close()

        await sse_manager.broadcast(run_id, "STAGE_UPDATE", data)
        # Visual pacing to allow SSE consumers and UI to observe progress
        await asyncio.sleep(0.25)

    async def start_pipeline(self, run_id: str):
        """Starts the pipeline state machine asynchronously."""
        db: Session = SessionLocal()
        try:
            run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
            if not run:
                logger.error(f"Run {run_id} not found.")
                return

            portfolio = db.query(Portfolio).filter(Portfolio.id == run.portfolio_id).first()
            profile = db.query(Profile).filter(Profile.id == portfolio.profile_id).first()
            projects = db.query(Project).filter(Project.profile_id == profile.id).order_by(Project.display_order).all()

            target_role = portfolio.target_role

            # 1. INPUT -> ANALYZED (Stage 1 & 2)
            run.state = "INPUT"
            run.current_stage = "Profile Analysis"
            db.commit()
            await self._emit_log(run_id, "Profile Analysis", f"Analyzing profile for target role '{target_role}'...", 10, "INPUT")

            profile_data = {
                "headline": profile.headline,
                "about": profile.about,
                "target_role": target_role,
                "skills": profile.skills,
                "education": profile.education,
                "experience": profile.experience,
                "achievements": profile.achievements,
                "certifications": profile.certifications,
                "links": profile.links,
                "name": profile.user.name if profile.user else "Candidate"
            }

            profile_analysis = self.profile_analyzer.analyze(profile_data, target_role)

            run.current_stage = "Project Analysis"
            db.commit()
            await self._emit_log(run_id, "Project Analysis", f"Analyzing {len(projects)} submitted projects...", 25, "INPUT")

            project_analyses: list[ProjectAnalysis] = []
            raw_projects_dict = []
            for p in projects:
                p_dict = {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "technologies": p.technologies,
                    "role": p.role,
                    "github_url": p.github_url,
                    "demo_url": p.demo_url,
                    "outcomes": p.outcomes,
                    "is_featured": p.is_featured
                }
                raw_projects_dict.append(p_dict)
                p_analysis = self.project_analyzer.analyze(p_dict, target_role)
                project_analyses.append(p_analysis)

            run.state = "ANALYZED"
            run.current_stage = "Gap Detection"
            db.commit()
            await self._emit_log(run_id, "Gap Detection", "Detecting missing information and weak signals...", 40, "ANALYZED")

            # 2. Stage 3: Gap Detection
            gap_output: GapDetectorOutput = self.gap_detector.detect(
                profile_analysis,
                project_analyses,
                target_role,
                raw_projects_dict
            )

            # Store questions if any
            if gap_output.questions:
                for q in gap_output.questions:
                    db_q = AgentQuestion(
                        run_id=run.id,
                        target=q.target,
                        target_type=q.target_type,
                        field_name=q.field_name,
                        question=q.question,
                        placeholder=q.placeholder,
                        severity=q.severity,
                        status="open"
                    )
                    db.add(db_q)
                
                run.state = "NEEDS_INFO"
                run.current_stage = "Clarification"
                db.commit()

                questions_payload = [
                    {
                        "id": q.id,
                        "target": q.target,
                        "target_type": q.target_type,
                        "field_name": q.field_name,
                        "question": q.question,
                        "placeholder": q.placeholder,
                        "severity": q.severity,
                        "status": q.status
                    }
                    for q in run.questions
                ]

                await self._emit_log(
                    run_id,
                    "Clarification",
                    f"Identified {len(gap_output.questions)} clarifying questions to improve case studies.",
                    45,
                    "NEEDS_INFO",
                    payload={"questions": questions_payload}
                )
                # Pause and wait for user to answer questions or skip
                return

            # If no gaps, proceed straight to planning
            await self._run_planner_and_generation(run, profile_analysis, project_analyses, {}, profile_data, raw_projects_dict, db)

        except Exception as e:
            logger.exception(f"Error in pipeline run {run_id}: {e}")
            run.state = "FAILED"
            run.error = str(e)
            db.commit()
            await self._emit_log(run_id, "Error", f"Agent pipeline encountered an error: {str(e)}", 100, "FAILED")
        finally:
            db.close()

    async def resume_with_answers(self, run_id: str, answers: list[dict[str, Any]], generate_anyway: bool):
        """Resumes pipeline after user answered or skipped questions."""
        db: Session = SessionLocal()
        try:
            run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
            if not run:
                return

            answers_dict = {}
            for ans in answers:
                qid = ans.get("question_id")
                q_db = db.query(AgentQuestion).filter(AgentQuestion.id == qid).first()
                if q_db:
                    if ans.get("action") == "skip" or generate_anyway:
                        q_db.status = "skipped"
                    else:
                        q_db.answer = ans.get("answer")
                        q_db.status = "answered"
                        answers_dict[f"{q_db.target}:{q_db.field_name or 'info'}"] = ans.get("answer")
            db.commit()

            portfolio = db.query(Portfolio).filter(Portfolio.id == run.portfolio_id).first()
            profile = db.query(Profile).filter(Profile.id == portfolio.profile_id).first()
            projects = db.query(Project).filter(Project.profile_id == profile.id).order_by(Project.display_order).all()
            target_role = portfolio.target_role

            profile_data = {
                "headline": profile.headline,
                "about": profile.about,
                "target_role": target_role,
                "skills": profile.skills,
                "education": profile.education,
                "experience": profile.experience,
                "achievements": profile.achievements,
                "certifications": profile.certifications,
                "links": profile.links,
                "name": profile.user.name if profile.user else "Candidate"
            }

            raw_projects_dict = []
            for p in projects:
                raw_projects_dict.append({
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "technologies": p.technologies,
                    "role": p.role,
                    "github_url": p.github_url,
                    "demo_url": p.demo_url,
                    "outcomes": p.outcomes,
                    "is_featured": p.is_featured
                })

            profile_analysis = self.profile_analyzer.analyze(profile_data, target_role)
            project_analyses = [self.project_analyzer.analyze(p, target_role) for p in raw_projects_dict]

            await self._run_planner_and_generation(run, profile_analysis, project_analyses, answers_dict, profile_data, raw_projects_dict, db)

        except Exception as e:
            logger.exception(f"Error resuming pipeline {run_id}: {e}")
            run.state = "FAILED"
            run.error = str(e)
            db.commit()
            await self._emit_log(run_id, "Error", f"Error resuming run: {str(e)}", 100, "FAILED")
        finally:
            db.close()

    async def _run_planner_and_generation(
        self,
        run: AgentRun,
        profile_analysis: ProfileAnalysis,
        project_analyses: list[ProjectAnalysis],
        answers_dict: dict[str, str],
        profile_data: dict[str, Any],
        raw_projects_dict: list[dict[str, Any]],
        db: Session
    ):
        target_role = profile_analysis.target_role
        run_id = run.id

        # 3. Stage 4: Portfolio Planner
        run.state = "PLANNED"
        run.current_stage = "Portfolio Planning"
        db.commit()
        await self._emit_log(run_id, "Portfolio Planning", f"Structuring portfolio plan tailored for '{target_role}'...", 55, "PLANNED")

        portfolio_record = db.query(Portfolio).filter(Portfolio.id == run.portfolio_id).first()
        chosen_layout_id = getattr(portfolio_record, "layout_id", "modern_grid") or "modern_grid"
        chosen_custom_prompt = getattr(portfolio_record, "custom_layout_prompt", None)

        plan: PortfolioPlan = self.portfolio_planner.plan(
            profile_analysis=profile_analysis,
            project_analyses=project_analyses,
            target_role=target_role,
            clarification_answers=answers_dict,
            profile_data=profile_data,
            projects_data=raw_projects_dict,
            layout_id=chosen_layout_id,
            custom_layout_prompt=chosen_custom_prompt
        )

        await self._emit_log(
            run_id,
            "Plan Created",
            f"Role-specific plan formulated with {len(plan.featured_project_ids)} featured case studies.",
            65,
            "PLANNED",
            payload={"plan": plan.model_dump()}
        )

        # 4. Stage 5 & 6: Content Generation & Case Studies
        run.state = "GENERATED"
        run.current_stage = "Content Generation"
        db.commit()
        await self._emit_log(run_id, "Content Generation", "Generating Hero, About narrative, and categorized skills...", 72, "GENERATED")

        sec_output = self.section_generator.generate(plan, profile_data, target_role)

        run.current_stage = "Case Study Writing"
        db.commit()
        await self._emit_log(run_id, "Case Study Writing", "Synthesizing recruiter-ready STAR case studies...", 78, "GENERATED")
        case_studies = self.case_study_generator.generate(plan, raw_projects_dict, target_role)

        theme_meta = {
            "theme_id": getattr(portfolio_record, "theme_id", "emerald") or "emerald",
            "primary_color": getattr(portfolio_record, "primary_color", "#10b981") or "#10b981",
            "theme_config": getattr(portfolio_record, "theme_config", {}) or {}
        } if portfolio_record else {}

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
            custom_layout_prompt=plan.custom_layout_prompt or chosen_custom_prompt,
            layout_config=getattr(plan, "layout_config", None),
            section_order=plan.section_order,
            theme=theme_meta
        )

        # 5. Stage 7 & 8: Quality Checker & Improvement Loop (PRD 8.9)
        run.state = "CHECKED"
        run.current_stage = "Quality Check"
        db.commit()
        await self._emit_log(run_id, "Quality Check", "Auditing portfolio completeness, readability, and truthfulness...", 85, "CHECKED")

        combined_user_data = {
            **profile_data,
            "projects": raw_projects_dict
        }

        quality_report = self.quality_checker.check(content, target_role, combined_user_data)
        iteration = 0
        max_iterations = 3

        while quality_report.needs_improvement and iteration < max_iterations:
            iteration += 1
            run.iteration = iteration
            run.state = "IMPROVING"
            run.current_stage = f"Self-Improvement Loop (Round {iteration}/{max_iterations})"
            db.commit()

            issues_desc = ", ".join([i.description for i in quality_report.issues[:2]])
            await self._emit_log(
                run_id,
                run.current_stage,
                f"Score {quality_report.score}/100 below target. Addressing: {issues_desc}",
                85 + iteration * 3,
                "IMPROVING"
            )

            improver_output = self.improver.improve(content, quality_report, target_role, combined_user_data)
            content = improver_output.content

            # Re-check quality
            quality_report = self.quality_checker.check(content, target_role, combined_user_data)

        # 6. Save Version & Finalize
        run.state = "READY"
        run.current_stage = "Finalized"
        run.finished_at = datetime.now(timezone.utc)

        portfolio = db.query(Portfolio).filter(Portfolio.id == run.portfolio_id).first()
        version_count = db.query(PortfolioVersion).filter(PortfolioVersion.portfolio_id == portfolio.id).count()

        new_version = PortfolioVersion(
            portfolio_id=portfolio.id,
            version_number=version_count + 1,
            plan=plan.model_dump(),
            content=content.model_dump(),
            quality_report=quality_report.model_dump(),
            created_by="agent",
            change_summary="Initial role-tailored portfolio generated by agent pipeline."
        )
        db.add(new_version)
        db.flush()

        portfolio.current_version_id = new_version.id
        portfolio.status = "ready"
        db.commit()

        await self._emit_log(
            run_id,
            "Completed",
            f"Portfolio generation complete! Quality Score: {quality_report.score}/100.",
            100,
            "READY",
            payload={
                "version_id": new_version.id,
                "content": content.model_dump(),
                "quality_report": quality_report.model_dump(),
                "plan": plan.model_dump()
            }
        )

    def apply_nl_edit(
        self,
        portfolio_id: str,
        instruction: str,
        db: Session
    ) -> PortfolioVersion:
        """Applies a natural language edit and produces a new immutable portfolio version."""
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            raise ValueError("Portfolio not found")

        current_ver = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()
        if not current_ver:
            raise ValueError("No active version found for portfolio")

        curr_content = PortfolioContent.model_validate(current_ver.content)
        edit_result = self.edit_interpreter.interpret(instruction, curr_content)

        # Run quality check on revised content
        quality = self.quality_checker.check(
            edit_result.updated_content,
            portfolio.target_role,
            portfolio.profile.skills or {}
        )

        version_count = db.query(PortfolioVersion).filter(PortfolioVersion.portfolio_id == portfolio.id).count()
        new_version = PortfolioVersion(
            portfolio_id=portfolio.id,
            version_number=version_count + 1,
            plan=current_ver.plan,
            content=edit_result.updated_content.model_dump(),
            quality_report=quality.model_dump(),
            created_by="nl_edit",
            change_summary=edit_result.change_summary
        )
        db.add(new_version)
        db.flush()

        portfolio.current_version_id = new_version.id
        db.commit()
        return new_version

orchestrator = AgentOrchestrator()
