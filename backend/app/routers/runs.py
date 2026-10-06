import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from datetime import datetime, timezone
from app.database import get_db
from app.models import AgentRun, AgentQuestion, Portfolio, PortfolioVersion
from app.schemas import QuestionOut, AnswersSubmitRequest, AgentRunOut
from app.auth import get_optional_user
from app.agent.orchestrator import orchestrator
from app.utils.sse import sse_manager

router = APIRouter(tags=["Agent Runs"])

def _build_run_snapshot(run_id: str, db: Session) -> dict | None:
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        return None
    portfolio = db.query(Portfolio).filter(Portfolio.id == run.portfolio_id).first()
    version = None
    if portfolio and portfolio.current_version_id:
        version = db.query(PortfolioVersion).filter(PortfolioVersion.id == portfolio.current_version_id).first()

    questions = db.query(AgentQuestion).filter(AgentQuestion.run_id == run_id).all()
    questions_data = [
        {
            "id": q.id,
            "target": q.target,
            "target_type": q.target_type,
            "field_name": q.field_name,
            "question": q.question,
            "placeholder": q.placeholder,
            "severity": q.severity,
            "status": q.status,
            "answer": q.answer
        }
        for q in questions
    ]

    progress_map = {
        "INPUT": 10,
        "ANALYZED": 40,
        "NEEDS_INFO": 45,
        "PLANNED": 65,
        "GENERATED": 75,
        "CHECKED": 85,
        "IMPROVING": 90,
        "READY": 100,
        "FAILED": 100
    }
    progress = 100 if run.state in ("READY", "COMPLETED") else progress_map.get(run.state, 10)

    payload = {}
    if questions_data and run.state == "NEEDS_INFO":
        payload["questions"] = questions_data
    if version:
        payload["version_id"] = version.id
        payload["content"] = version.content
        payload["quality_report"] = version.quality_report
        payload["plan"] = version.plan

    # Extract logs
    logs = list(run.logs or [])
    if not logs:
        # Check SSE manager history
        hist = sse_manager.get_history(run_id)
        logs = [item.get("data", {}) for item in hist if item.get("data", {}).get("message")]

    return {
        "run_id": run.id,
        "portfolio_id": run.portfolio_id,
        "state": run.state,
        "current_stage": run.current_stage or ("Finalized" if run.state in ("READY", "COMPLETED") else "Processing"),
        "progress": progress,
        "iteration": run.iteration,
        "error": run.error,
        "logs": logs,
        "payload": payload,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/portfolios/{portfolio_id}/runs/{run_id}/status")
@router.get("/runs/{run_id}/status")
def get_run_status(run_id: str, db: Session = Depends(get_db)):
    """Immediate state synchronization snapshot endpoint."""
    snapshot = _build_run_snapshot(run_id, db)
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return snapshot

@router.get("/portfolios/{portfolio_id}/runs/{run_id}/events")
async def stream_run_events(portfolio_id: str, run_id: str, db: Session = Depends(get_db)):
    """Server-Sent Events (SSE) endpoint streaming real-time stage progress with initial snapshot."""
    queue = sse_manager.subscribe(run_id, replay_history=True)

    async def event_generator():
        try:
            # 1. Yield initial connection heartbeat
            yield f"data: {json.dumps({'event': 'CONNECTED', 'data': {'run_id': run_id}})}\n\n"

            # 2. Yield current status snapshot so frontend gets instant state
            snapshot = _build_run_snapshot(run_id, db)
            if snapshot:
                yield f"data: {json.dumps({'event': 'CURRENT_STATE', 'data': snapshot})}\n\n"

                # If the run already completed or needs info before subscription, emit STAGE_UPDATE
                if snapshot.get("state") in ("READY", "COMPLETED"):
                    yield f"data: {json.dumps({'event': 'STAGE_UPDATE', 'data': snapshot})}\n\n"
                elif snapshot.get("state") == "NEEDS_INFO" and snapshot.get("payload", {}).get("questions"):
                    yield f"data: {json.dumps({'event': 'STAGE_UPDATE', 'data': snapshot})}\n\n"

            # 3. Stream queued/live events
            while True:
                msg = await queue.get()
                yield f"data: {msg}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.unsubscribe(run_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/runs/{run_id}/questions", response_model=list[QuestionOut])
def get_run_questions(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    
    return db.query(AgentQuestion).filter(AgentQuestion.run_id == run_id).all()

@router.post("/runs/{run_id}/answers")
def submit_answers(
    run_id: str,
    req: AnswersSubmitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")

    if isinstance(req.answers, dict):
        answers_list = [
            {"question_id": k, "answer": str(v).strip() if v else None, "action": "answer" if v else "skip"}
            for k, v in req.answers.items()
        ]
    else:
        answers_list = [
            a.model_dump() if hasattr(a, "model_dump") else a
            for a in req.answers
        ]

    # Resume the pipeline with user answers in the background
    background_tasks.add_task(
        orchestrator.resume_with_answers,
        run_id=run_id,
        answers=answers_list,
        generate_anyway=req.generate_anyway
    )

    return {"message": "Answers received, pipeline resumed."}
