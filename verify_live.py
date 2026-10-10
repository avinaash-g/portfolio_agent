"""
Live Web Deployment Verification Script
Tests real public web deployment for Portfolio Agent.
Uploads portfolio to public cloud, probes the returned live HTTPS URL,
and verifies worldwide accessibility without localhost.
"""
import sys
import httpx
from datetime import datetime

# Sample recruiter-ready portfolio content
sample_portfolio = {
    "user": {
        "name": "Avinaash G",
        "title": "Senior AI Systems & Full Stack Engineer",
        "bio": "Designing autonomous multi-agent developer workflows, distributed systems, and real-time cloud architectures.",
        "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Cloudflare", "TailwindCSS"]
    },
    "projects": [
        {
            "title": "Autonomous Portfolio Builder Agent",
            "description": "Multi-agent autonomous system that ingests resumes, analyzes talent rubrics, generates interactive recruiter-ready portfolios, and deploys zero-config live web apps.",
            "technologies": ["Python", "FastAPI", "React", "Netlify API", "DeedPage Cloud"],
            "github_url": "https://github.com/avinaash-g/portfolio_agent",
            "live_url": "https://portfolio-agent.live"
        },
        {
            "title": "Chronos Distributed Key-Value Store",
            "description": "High-throughput distributed storage engine with Raft consensus, sub-millisecond p99 latencies, and automated failover.",
            "technologies": ["Go", "Raft", "gRPC", "Docker"],
            "github_url": "https://github.com/avinaash-g/chronos-kv",
            "live_url": ""
        }
    ],
    "work_experience": [
        {
            "company": "DeepMind Partner Labs",
            "role": "Lead Systems Architect",
            "duration": "2023 - Present",
            "highlights": [
                "Led architecture of autonomous multi-agent code generation pipelines",
                "Reduced deployment latency by 78% with zero-config edge caching"
            ]
        }
    ],
    "education": [
        {
            "institution": "University of Engineering",
            "degree": "B.Tech in Computer Science & Engineering",
            "year": "2022"
        }
    ],
    "contact": {
        "email": "avinaashavi1212@gmail.com",
        "github": "https://github.com/avinaash-g",
        "linkedin": "https://linkedin.com/in/avinaash"
    }
}

def verify_live_deployment():
    print("=" * 70)
    print("PORTFOLIO AGENT: REAL ZERO-CONFIG PUBLIC DEPLOYMENT VERIFICATION")
    print("=" * 70)
    
    # Import deployer service
    sys.path.insert(0, "backend")
    from app.services.deployer import deploy_portfolio
    
    print("\n[1/3] Packaging portfolio bundle and initiating cloud deployment...")
    response = deploy_portfolio(
        content=sample_portfolio,
        user_name="Avinaash G",
        slug="avinaash-portfolio-live",
        layout_id="modern_grid",
        template_id="clean",
        theme_id="emerald",
        primary_color="#10b981",
        provider="auto"
    )
    
    print(f"\n[2/3] Deployment completed successfully!")
    print(f"      - Status:       {response.status}")
    print(f"      - Provider:     {response.provider}")
    print(f"      - Public URL:   {response.url}")
    print(f"      - Preview Path: {response.preview_url}")
    print(f"      - Deployed At:  {response.deployed_at}")

    # Validate that under no circumstances is localhost returned
    assert "localhost" not in response.url, "FAILURE: Deployment URL returned localhost!"
    assert "127.0.0.1" not in response.url, "FAILURE: Deployment URL returned 127.0.0.1!"
    assert response.url.startswith("https://"), "FAILURE: Deployment URL is not secure HTTPS!"

    print(f"\n[3/3] Probing public HTTPS endpoint for worldwide accessibility...")
    probe = httpx.get(response.url, timeout=12.0, follow_redirects=True)
    print(f"      - HTTP Status:     {probe.status_code}")
    print(f"      - Content Length:  {len(probe.text)} bytes")
    print(f"      - Contains Name:   {'Avinaash G' in probe.text}")
    print(f"      - Contains Project:{'Autonomous Portfolio Builder Agent' in probe.text}")

    assert probe.status_code == 200, f"FAILURE: Public endpoint returned HTTP {probe.status_code}"
    assert "Avinaash G" in probe.text, "FAILURE: Portfolio content not found in live page"

    print("\n" + "=" * 70)
    print(f"SUCCESS: Portfolio is 100% LIVE and ACCESSIBLE GLOBALLY at:")
    print(f"--> {response.url}")
    print("=" * 70)

if __name__ == "__main__":
    verify_live_deployment()
