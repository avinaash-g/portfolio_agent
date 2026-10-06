import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline_api_flow():
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"user_{unique_id}@example.com"
    # 1. Register User
    register_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "name": "Jordan Dev"
    })
    assert register_res.status_code == 200
    token = register_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Profile
    profile_res = client.put("/api/profile", json={
        "headline": "Full-Stack Engineer building high scale web apps",
        "about": "Jordan is a versatile full stack developer specializing in Python, React, and PostgreSQL.",
        "target_role": "Software Developer",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
        "education": [
            {
                "institution": "University of Technology",
                "degree": "B.S. in Computer Science",
                "year": "2024",
                "details": "Major in Software Systems"
            }
        ],
        "experience": [
            {
                "company": "Tech Labs",
                "role": "Software Engineering Intern",
                "duration": "Summer 2024",
                "location": "Remote",
                "highlights": [
                    "Engineered backend REST endpoints in FastAPI",
                    "Optimized SQL query performance"
                ]
            }
        ],
        "achievements": [
            {
                "title": "Hackathon 1st Place",
                "description": "Won first place at State Hackathon with an AI chatbot",
                "year": "2024"
            }
        ],
        "certifications": [],
        "links": {
            "github": "https://github.com/jordandev",
            "linkedin": "https://linkedin.com/in/jordandev",
            "email": "jordan@example.com"
        }
    }, headers=headers)
    assert profile_res.status_code == 200

    # 3. Create Projects
    proj1 = client.post("/api/projects", json={
        "name": "Cloud Task Hub",
        "description": "A collaborative task management application built with FastAPI and React.\nFeatures real-time state synchronization.\nRole: Lead backend developer.\nImplemented relational data schema and authentication.",
        "technologies": ["Python", "FastAPI", "React", "PostgreSQL"],
        "role": "Lead Backend Developer",
        "github_url": "https://github.com/jordandev/cloud-task-hub",
        "demo_url": "https://cloudtaskhub.example.com",
        "outcomes": "Supports active teams organizing agile sprints.",
        "is_featured": True
    }, headers=headers)
    assert proj1.status_code == 201

    proj2 = client.post("/api/projects", json={
        "name": "Data Stream Analyzer",
        "description": "Real-time streaming pipeline processing sensor data.\nConstructed message queues and automated alerts.\nRole: Data Engineer.",
        "technologies": ["Python", "Kafka", "PostgreSQL"],
        "role": "Data Engineer",
        "github_url": "https://github.com/jordandev/data-stream-analyzer",
        "is_featured": True
    }, headers=headers)
    assert proj2.status_code == 201

    # 4. Create Portfolio and trigger agent run
    portfolio_res = client.post("/api/portfolios", json={
        "title": "Jordan Dev's Engineering Portfolio",
        "target_role": "Software Developer",
        "template_id": "clean"
    }, headers=headers)
    assert portfolio_res.status_code == 201
    portfolio_data = portfolio_res.json()
    portfolio_id = portfolio_data["id"]

    # 5. Check Portfolio Details & Quality Report
    get_p = client.get(f"/api/portfolios/{portfolio_id}", headers=headers)
    assert get_p.status_code == 200
    p_info = get_p.json()
    assert p_info["current_version"] is not None
    quality_report = p_info["current_version"]["quality_report"]
    assert quality_report["score"] >= 80

    # 6. Test Natural Language Refinement
    nl_res = client.post(f"/api/portfolios/{portfolio_id}/edit", json={
        "instruction": "Make my project descriptions shorter and more concise"
    }, headers=headers)
    assert nl_res.status_code == 200
    assert "Shortened" in nl_res.json()["change_summary"]

    # 7. Test Export static site ZIP
    export_res = client.get(f"/api/portfolios/{portfolio_id}/export?template=clean")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"] == "application/zip"
    assert len(export_res.content) > 1000

    # 8. Test Live Preview HTML
    preview_res = client.get(f"/api/portfolios/{portfolio_id}/preview?template=dark")
    assert preview_res.status_code == 200
    assert "text/html" in preview_res.headers["content-type"]
    assert "Cloud Task Hub" in preview_res.text
