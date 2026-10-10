from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from sqlalchemy import text
    import app.models  # ensure models are registered on Base
    Base.metadata.create_all(bind=engine)
    new_cols = [
        ("theme_id", "VARCHAR(50) DEFAULT 'emerald'"),
        ("primary_color", "VARCHAR(50) DEFAULT '#10b981'"),
        ("theme_config", "JSON DEFAULT '{}'"),
        ("layout_id", "VARCHAR(50) DEFAULT 'modern_grid'"),
        ("custom_layout_prompt", "TEXT"),
        ("deployment_url", "VARCHAR(512)"),
        ("deployment_status", "VARCHAR(50)"),
        ("deployed_at", "TIMESTAMP")
    ]
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.execute(text("PRAGMA table_info(portfolios)"))
                cols = [r[1] for r in res.fetchall()]
                for col_name, col_def in new_cols:
                    if cols and col_name not in cols:
                        conn.execute(text(f"ALTER TABLE portfolios ADD COLUMN {col_name} {col_def}"))
                conn.commit()
            except Exception:
                pass
    elif "postgres" in settings.DATABASE_URL:
        with engine.connect() as conn:
            try:
                for col_name, col_def in new_cols:
                    conn.execute(text(f"ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS {col_name} {col_def}"))
                conn.commit()
            except Exception:
                pass

