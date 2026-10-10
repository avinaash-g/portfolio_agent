import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import ApiKey

client = TestClient(app)

def _register_and_get_auth_headers():
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"dev_{unique_id}@example.com"
    res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "DevPassword123!",
        "name": "Alex DevPlatform"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_api_key_lifecycle_and_rate_limiting():
    headers = _register_and_get_auth_headers()

    # 1. Create API Key
    create_res = client.post("/api/developer/keys", json={
        "name": "Integration Test Key"
    }, headers=headers)
    assert create_res.status_code == 201
    key_data = create_res.json()
    assert key_data["name"] == "Integration Test Key"
    assert key_data["api_key"].startswith("pa_live_")
    assert key_data["daily_limit"] == 10
    assert key_data["requests_today"] == 0
    raw_key = key_data["api_key"]
    key_id = key_data["id"]

    # 2. List API Keys
    list_res = client.get("/api/developer/keys", headers=headers)
    assert list_res.status_code == 200
    keys_list = list_res.json()
    assert len(keys_list) >= 1
    matching_key = next((k for k in keys_list if k["id"] == key_id), None)
    assert matching_key is not None
    assert matching_key["remaining_today"] == 10
    assert "..." in matching_key["masked_key"]
    # Secret raw key should NOT be exposed in list endpoint
    assert raw_key not in matching_key["masked_key"]

    # 3. Test Public /api/v1/generate without header -> 401
    no_key_res = client.post("/api/v1/generate", json={
        "name": "Jane Coder",
        "target_role": "Backend Engineer",
        "skills": ["Go", "Kubernetes"],
        "projects": [
            {
                "name": "Microservice Router",
                "description": "High performance router in Go",
                "technologies": ["Go", "Docker"]
            }
        ]
    })
    assert no_key_res.status_code == 401
    assert "Missing 'X-API-Key' header" in no_key_res.json()["detail"]

    # 4. Test Public /api/v1/generate with invalid key -> 401
    bad_key_res = client.post("/api/v1/generate", json={
        "name": "Jane Coder",
        "target_role": "Backend Engineer"
    }, headers={"X-API-Key": "pa_live_invalidkey1234567890"})
    assert bad_key_res.status_code == 401

    # 5. Test Public /api/v1/generate with valid key -> 200
    dev_payload = {
        "name": "Jane Coder",
        "target_role": "Full-Stack Engineer",
        "headline": "Lead Full-Stack Engineer specializing in React & Python",
        "about": "Jane is an experienced engineer focused on scalable microservices and intuitive UIs.",
        "skills": ["TypeScript", "React", "Python", "FastAPI", "PostgreSQL", "Docker"],
        "experience": [
            {
                "company": "Vanguard Tech",
                "role": "Senior Engineer",
                "duration": "2023 - Present",
                "highlights": ["Designed event streaming pipelines", "Managed cloud infrastructure"]
            }
        ],
        "projects": [
            {
                "name": "Distributed Data Lakehouse",
                "description": "Real-time query engine processing millions of records.\nRole: Lead Architect.\nDesigned partitioning strategies and query caching.",
                "technologies": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                "role": "Lead Architect",
                "github_url": "https://github.com/janecoder/lakehouse",
                "demo_url": "https://lakehouse.example.com",
                "outcomes": "Reduced p95 query latency by 45%.",
                "is_featured": True
            }
        ],
        "layout_id": "modern_grid",
        "theme_id": "electric_cobalt"
    }

    gen_res = client.post("/api/v1/generate", json=dev_payload, headers={"X-API-Key": raw_key})
    assert gen_res.status_code == 200
    gen_data = gen_res.json()

    assert gen_data["status"] == "success"
    assert "portfolio" in gen_data
    assert "hero" in gen_data["portfolio"]
    assert "skills" in gen_data["portfolio"]
    assert "featured_projects" in gen_data["portfolio"]
    assert len(gen_data["portfolio"]["featured_projects"]) >= 1
    assert "quality_report" in gen_data
    assert gen_data["quality_report"]["score"] >= 80

    # Usage quota tracking
    assert gen_data["usage"]["requests_today"] == 1
    assert gen_data["usage"]["daily_limit"] == 10
    assert gen_data["usage"]["remaining_today"] == 9
    assert gen_res.headers.get("X-RateLimit-Limit") == "10"
    assert gen_res.headers.get("X-RateLimit-Remaining") == "9"

    # 6. Test Rate Limiting by setting requests_today to limit in DB
    db = SessionLocal()
    try:
        k_db = db.query(ApiKey).filter(ApiKey.id == key_id).first()
        k_db.requests_today = 10  # simulate limit reached
        db.commit()
    finally:
        db.close()

    # Next request should be rejected with 429 Too Many Requests
    rate_limited_res = client.post("/api/v1/generate", json=dev_payload, headers={"X-API-Key": raw_key})
    assert rate_limited_res.status_code == 429
    assert "limit exceeded" in rate_limited_res.json()["detail"].lower()
    assert rate_limited_res.headers.get("X-RateLimit-Remaining") == "0"

    # 7. Revoke API Key via DELETE
    revoke_res = client.delete(f"/api/developer/keys/{key_id}", headers=headers)
    assert revoke_res.status_code == 200
    assert revoke_res.json()["id"] == key_id

    # Revoked key should now return 401
    after_revoke_res = client.post("/api/v1/generate", json=dev_payload, headers={"X-API-Key": raw_key})
    assert after_revoke_res.status_code == 401
