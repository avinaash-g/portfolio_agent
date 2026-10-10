# CortexCrew-Portfolio Agent

An autonomous, multi-stage AI platform that transforms resumes, project details, and engineering artifacts into role-targeted portfolios.

## Overview

Portfolio Agent analyzes a user's professional background, extracts project context, identifies missing information, plans portfolio sections, and generates content tailored to a target role. It includes a quality evaluation and refinement loop designed to improve clarity, structure, and factual accuracy.

## Features

- **Profile Analysis:** Extracts skills, experience, and career information.
- **Project Analysis:** Identifies project objectives, technical details, and architecture.
- **Gap Detection:** Identifies missing or ambiguous information and generates clarification questions.
- **Role-Based Planning:** Structures portfolios around the user's target role.
- **Content Generation:** Creates portfolio sections and project case studies.
- **Quality Evaluation:** Scores generated content using a quality rubric.
- **Iterative Refinement:** Attempts to improve content that falls below the quality threshold.
- **Portfolio Preview and Editing:** Allows users to review and refine generated content.
- **Export and Deployment:** Supports static portfolio exports for hosting or offline use.
- **Developer API:** Provides API key authentication and rate limiting for supported API endpoints.

## Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Python, FastAPI
- **AI:** Google Gemini API
- **Database:** PostgreSQL / SQLite
- **ORM:** SQLAlchemy

## System Architecture

The platform follows a multi-stage agent pipeline:

1. Profile and Work Analyzer
2. Project Context Extractor
3. Gap Detector
4. Role-Tailored Planner
5. Portfolio Section Generator
6. Quality Evaluator
7. Self-Improvement Loop
8. Portfolio Preview and Refinement
9. Export and Deployment

The quality evaluation stage can trigger additional refinement cycles when generated content falls below the configured threshold.

## Getting Started

### Prerequisites

- Python 3.11 or later
- Node.js 18 or later
- npm
- Google Gemini API key
- PostgreSQL or SQLite, depending on your configuration

### 1. Clone the Repository

```bash
git clone https://github.com/avinaash-g/portfolio_agent.git
cd portfolio_agent
```

### 2. Set Up the Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**
```powershell
.\venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your environment variables using the provided `.env.example` file. Set the required Gemini API key and database configuration.

Start the backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API documentation will be available at:

`http://localhost:8000/docs`

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

`http://localhost:5173`

## Environment Variables

Configure the variables required by your application in the backend `.env` file.

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_database_url
```

Use the actual variable names expected by your application. Never commit API keys, passwords, or other secrets to GitHub.

## Testing

Run the backend test suite from the `backend` directory with the virtual environment activated:

```bash
pytest tests -v
```

## Repository Structure

```text
portfolio_agent/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── models.py
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Live Demo

- **Frontend:**https://portfolio-agent-henna-six.vercel.app
- **API Documentation:** https://portfolio-agent-backend-8b2p.onrender.com/docs

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
