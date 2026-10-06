export const SAMPLE_PROFILES = {
  software_developer: {
    name: "Alex Rivera",
    target_role: "Software Developer",
    headline: "Full-Stack Software Engineer building scalable cloud applications",
    about: "Full-stack engineer with hands-on experience developing web applications, distributed APIs, and reliable database architectures. Passionate about writing clean, maintainable code and solving complex performance challenges.",
    skills: ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Tailwind CSS", "Redis", "Git", "Docker"],
    links: {
      email: "alex.rivera@example.com",
      github: "https://github.com/alexrivera",
      linkedin: "https://linkedin.com/in/alexrivera-dev"
    },
    experience: [
      {
        company: "Nexus Tech Solutions",
        role: "Software Engineering Intern",
        duration: "Jun 2024 - Sep 2024",
        location: "San Francisco, CA",
        highlights: [
          "Developed RESTful API microservices handling user authentication and payment processing",
          "Reduced SQL query latency across analytics endpoints by restructuring database indexes"
        ]
      }
    ],
    education: [
      {
        institution: "California Institute of Technology",
        degree: "B.S. in Computer Science",
        year: "2024",
        details: "Coursework in Data Structures, Database Systems, Computer Networks, and Cloud Computing"
      }
    ],
    achievements: [
      {
        title: "1st Place - University Hackathon",
        description: "Built a collaborative project organizer with real-time sync in 36 hours",
        year: "2023"
      }
    ],
    projects: [
      {
        name: "DevSync Cloud Platform",
        description: "Collaborative developer workspace with real-time code execution and shared notebooks.\nEngineered async WebSocket server handling concurrent state updates.\nIntegrated PostgreSQL for session storage and user authentication.\nDesigned modern responsive dashboard in React and Tailwind CSS.",
        technologies: ["React", "FastAPI", "PostgreSQL", "WebSockets", "Tailwind CSS"],
        role: "Lead Full-Stack Developer",
        github_url: "https://github.com/alexrivera/devsync-platform",
        demo_url: "https://devsync-demo.example.com",
        outcomes: "Adopted by student teams to conduct live pair-programming sessions.",
        is_featured: true
      },
      {
        name: "Pulse API Gateway & Cache",
        description: "High-performance reverse proxy and API rate limiter built with Python and Redis.\nImplements sliding-window token bucket algorithm to prevent API abuse.\nProvides configurable routing and automated request metric logging.",
        technologies: ["Python", "FastAPI", "Redis", "Docker"],
        role: "Backend Architect",
        github_url: "https://github.com/alexrivera/pulse-gateway",
        outcomes: "Ensures reliable traffic throttling for microservices.",
        is_featured: true
      },
      {
        name: "MetricViz Analytics Dashboard",
        description: "Interactive data visualization tool for monitoring server health metrics and response times.\nFeatures custom chart components, dark mode UI, and CSV export capabilities.",
        technologies: ["React", "TypeScript", "Chart.js", "Tailwind CSS"],
        role: "Frontend Developer",
        github_url: "https://github.com/alexrivera/metricviz",
        demo_url: "https://metricviz.example.com",
        is_featured: true
      }
    ]
  },

  ai_engineer: {
    name: "Dr. Elena Vance",
    target_role: "AI Engineer",
    headline: "AI Engineer specializing in LLMs, RAG Pipelines, and Autonomous Agent Architectures",
    about: "Specializing in operationalizing large language models, retrieval-augmented generation (RAG), and agentic workflows. Focused on reducing inference hallucination, optimizing vector search embeddings, and building robust production pipelines.",
    skills: ["Python", "PyTorch", "LangChain", "Gemini API", "ChromaDB", "FastAPI", "Hugging Face", "Vector Search", "Docker"],
    links: {
      email: "elena.vance@example.com",
      github: "https://github.com/elenavance",
      linkedin: "https://linkedin.com/in/elena-vance-ai"
    },
    experience: [
      {
        company: "Synthetix Intelligence",
        role: "Machine Learning Researcher",
        duration: "2023 - Present",
        location: "Boston, MA",
        highlights: [
          "Implemented semantic search pipelines indexing enterprise documentation using hybrid dense-sparse retrieval",
          "Fine-tuned open-source LLMs on domain-specific engineering documentation"
        ]
      }
    ],
    education: [
      {
        institution: "Massachusetts Institute of Technology",
        degree: "M.S. in Artificial Intelligence",
        year: "2023",
        details: "Thesis on verifiable grounded reasoning in autonomous LLM agents"
      }
    ],
    achievements: [
      {
        title: "Best Paper Finalist - AI Systems Workshop",
        description: "Published research on reducing vector search latency in multi-turn dialogues",
        year: "2023"
      }
    ],
    projects: [
      {
        name: "OmniRAG Knowledge Engine",
        description: "Enterprise retrieval-augmented generation system supporting complex PDF parsing and tabular data extraction.\nEmploys hybrid chunking and semantic re-ranking to yield grounded answers.\nIncludes citation linking to source passages and conversational memory.",
        technologies: ["Python", "FastAPI", "Gemini API", "ChromaDB", "LangChain"],
        role: "Sole AI Architect",
        github_url: "https://github.com/elenavance/omnirag-engine",
        demo_url: "https://omnirag-live.example.com",
        outcomes: "Processes over 5,000 queries daily with zero ungrounded hallucinations.",
        is_featured: true
      },
      {
        name: "AgentFlow Autonomous Pipeline",
        description: "Multi-agent orchestration framework coordinating autonomous coding, testing, and deployment bots.\nFeatures structured tool-calling, self-correction loops, and execution logging.",
        technologies: ["Python", "Google GenAI SDK", "FastAPI", "Pydantic"],
        role: "Lead Agent Engineer",
        github_url: "https://github.com/elenavance/agentflow",
        is_featured: true
      },
      {
        name: "VisionScribe Multimodal OCR",
        description: "Vision-language model pipeline that converts handwritten whiteboard architectural diagrams into structured code diagrams and markdown.",
        technologies: ["PyTorch", "Hugging Face", "FastAPI", "React"],
        role: "Computer Vision Specialist",
        github_url: "https://github.com/elenavance/visionscribe",
        is_featured: true
      }
    ]
  },

  sparse_profile: {
    name: "Sam Taylor",
    target_role: "Software Developer",
    headline: "Junior Developer",
    about: "Recent graduate looking for entry-level developer opportunities.",
    skills: ["Python", "JavaScript"],
    links: {
      email: "sam.taylor@example.com"
    },
    experience: [],
    education: [
      {
        institution: "State University",
        degree: "B.S. in Computer Science",
        year: "2024"
      }
    ],
    achievements: [],
    projects: [
      {
        name: "Recipe Book",
        description: "A small web app.",  // Sparse description to test Gap Detector follow-up questions!
        technologies: [],                 // Empty tech stack: triggers blocking gap!
        role: "",
        github_url: "",
        demo_url: "",
        is_featured: true
      }
    ]
  }
};
