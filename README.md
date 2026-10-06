# Automated Portfolio Builder Agent

> **Goal-driven AI agent that turns raw developer experience into polished, role-tailored professional portfolios with strict factual integrity and offline-ready static site exports.**
> 
> *Compliant with Draft v1.0 Product Requirements Document (PRD).*

---

## 1. Key Architectural Guarantees

1. **STRICTLY NO DOCKER (PRD Key Constraint & Section 11.3)**:
   - Zero Dockerfiles, `docker-compose.yml`, or container manifests exist anywhere in this repository.
   - Runs natively on Python virtual environment (`venv`), Node.js `npm`, and SQLite (with 1-line toggle to PostgreSQL).

2. **FACTUAL INTEGRITY (PRD Section 9.5)**:
   - The AI **never** fabricates employers, dates, metrics (e.g. percentages), technologies, results, or links.
   - Any statement that cannot be verified from user input is omitted or flagged rather than guessed.
   - The Quality Checker includes an automated **unsupported-claim gate** that tests for ungrounded assertions.

3. **CLOSED QUALITY & IMPROVEMENT LOOP (PRD Section 8.9)**:
   - Evaluates the generated portfolio against an uncompromising 0–100 rubric across 9 criteria.
   - If the score is below 80 or any High-severity issue exists, the agent automatically executes up to 3 self-improvement rounds on affected sections.

4. **OFFLINE-READY STATIC EXPORT (PRD Section 8.11 & Acceptance Criterion 7)**:
   - Produces a self-contained ZIP file containing an offline-ready `index.html` (Tailwind via CDN + Google Fonts), `portfolio-data.json`, and deployment instructions.
   - Supports 2 visual templates: **Clean Light** and **Dark Obsidian** (with glassmorphism).

---

## 2. Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite (toggleable to PostgreSQL via `DATABASE_URL`), Jinja2, Pydantic v2.
- **LLM Engine**: Google Gemini API via `google-genai` SDK with structured JSON schema outputs and automatic retries. Includes an intelligent deterministic fallback engine for offline testing or execution without an API key.
- **Frontend**: React 19 (Vite) + Tailwind CSS + Lucide React.
- **Testing**: `pytest` for backend unit/integration tests; Vite build validation for frontend.

---

## 3. System Architecture & The 9 Pipeline Stages

```
User Input ➔ [Profile Analyzer] ➔ [Project Analyzer] ➔ [Gap Detector] 
                    │
                    ▼ (Follow-up Clarification)
            [Portfolio Planner] ➔ [Section Generator] ➔ [Case-Study Generator]
                    │
                    ▼
            [Quality Checker (0-100 Rubric)] ⇄ [Auto-Improver (≤ 3 Loops)]
                    │
                    ▼
            [Preview Studio] ⇄ [NL Refinement & Manual Editor] ➔ [Static Site ZIP Export]
```

| # | Pipeline Stage | Input | Output | Model & Type |
|---|----------------|-------|--------|--------------|
| 1 | **Profile Analyzer** | Raw user profile, target role | `ProfileAnalysis` JSON | LLM Structured Output |
| 2 | **Project Analyzer** | Raw project data | `ProjectAnalysis` JSON | LLM per project |
| 3 | **Gap Detector** | Profile + project analyses | Prioritized follow-up questions (≤ 8) | Rules + LLM |
| 4 | **Portfolio Planner** | Analyses, user answers, role | `PortfolioPlan` JSON (role-tailored sections & order) | LLM + role rules |
| 5 | **Section Generator** | Plan + user profile | Hero, About, Skills, Experience, Education, Contact | LLM |
| 6 | **Case-Study Generator** | Plan + project data | Structured case studies for featured projects; cards for others | LLM |
| 7 | **Quality Checker** | Portfolio + target role + raw data | Score (0-100), 9-point checklist, severity-tagged issues | Rules + LLM Rubric |
| 8 | **Improver** | Portfolio + quality issues | Revised sections only (max 3 loops if score < 80) | LLM |
| 9 | **Edit Interpreter** | Plain-English instruction | Structured edit operations & change summary | LLM |

---

## 4. Quick Start Guide (Native Launch)

### Prerequisites
- **Python 3.11+** (`python --version`)
- **Node.js 18+** & **npm** (`node --version`)

---

### Option A: 1-Click Native Launch Scripts

#### On Windows:
Double-click `setup.bat` or run:
```cmd
setup.bat
```

#### On Linux / macOS / WSL:
Make executable and run:
```bash
chmod +x setup.sh
./setup.sh
```

---

### Option B: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
# Create virtual environment
python -m venv backend/venv

# Activate virtual environment
# Windows:
.\backend\venv\Scripts\activate
# Linux/macOS:
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# (Optional) Add your Gemini API key to backend/.env
# If omitted, the agent seamlessly operates using the high-fidelity deterministic engine
echo "GEMINI_API_KEY=your_key_here" >> backend/.env

# Run FastAPI backend server (port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup (in a separate terminal)
```bash
cd frontend

# Install npm packages
npm install

# Start Vite dev server (port 5173)
npm run dev
```

Open your browser at **`http://localhost:5173`**.
API documentation is available at **`http://localhost:8000/docs`**.

---

## 5. Running the Test Suite

Run all unit tests, schema verifications, truthfulness guardrail tests, and API integration tests:
```bash
# Windows
.\backend\venv\Scripts\pytest backend\tests -v

# Linux / macOS
backend/venv/bin/pytest backend/tests -v
```

All 12 test suites will run and pass in ~1.5s:
- `test_schemas.py`: Pydantic validation schemas
- `test_gap_detector.py`: Gap severity, question limits (≤ 8), and priority ordering
- `test_planner.py`: Target-role personalization and section inclusion/omission
- `test_quality_checker.py`: 0-100 rubric & detection of ungrounded metrics (PRD 9.5)
- `test_renderer.py`: Standalone HTML rendering (Clean & Dark) and ZIP exporter
- `test_api_integration.py`: End-to-end API pipeline from register to ZIP download

---

## 6. API Reference (PRD Section 12)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Login and obtain JWT access token |
| `GET` | `/api/auth/me` | Fetch authenticated user details |
| `GET / PUT` | `/api/profile` | Read / update user profile data |
| `GET / POST` | `/api/projects` | List / create projects |
| `PUT / DELETE` | `/api/projects/{id}` | Update / delete individual project |
| `POST` | `/api/portfolios` | Create portfolio and initiate background agent run |
| `GET` | `/api/portfolios` | List all user portfolios |
| `GET` | `/api/portfolios/{id}` | Fetch current portfolio content, quality scorecard, and run state |
| `GET` | `/api/portfolios/{id}/runs/{run_id}/events` | Server-Sent Events (SSE) stream for live stage updates |
| `GET` | `/api/runs/{run_id}/questions` | Fetch detected information gaps / follow-up questions |
| `POST` | `/api/runs/{run_id}/answers` | Submit answers or skip to resume pipeline |
| `GET` | `/api/portfolios/{id}/plan` | View role-tailored layout architecture |
| `POST` | `/api/portfolios/{id}/plan/approve` | Approve or customize plan |
| `POST` | `/api/portfolios/{id}/edit` | Apply natural-language refinement instruction |
| `PATCH` | `/api/portfolios/{id}/content` | In-place manual content editing |
| `PUT` | `/api/portfolios/{id}/projects/order` | Reorder projects or promote/demote featured |
| `GET` | `/api/portfolios/{id}/versions` | View immutable version history |
| `POST` | `/api/portfolios/{id}/versions/{v}/restore` | Restore previous portfolio version |
| `GET` | `/api/portfolios/{id}/preview` | Live HTML rendering for preview iframe |
| `GET` | `/api/portfolios/{id}/export` | Download deployable static site ZIP archive |

---

## 7. Verifying Factual Truthfulness (PRD 9.5)

To verify the truthfulness guardrail:
1. Provide a project with a 1-sentence description and no numbers.
2. The agent will either ask targeted follow-up questions or generate a case study grounded **only** in the provided facts.
3. If an ungrounded metric (e.g. `"improved latency by 45%"`) is introduced into the text, the Quality Checker's `no_unsupported_claims` checklist criterion immediately triggers a **High-severity audit finding** and deducts 25 points, blocking the generation until corrected.
