"""
Database configuration module.

All connection parameters are read from environment variables (see .env.example).
Supports two authentication modes for Azure SQL:

1. **Connection-string mode** (default): the ``DATABASE_URL`` env var contains
   the full SQLAlchemy URL, optionally with embedded credentials
   (``user:password@host``). Works with any database backend.

2. **Entra ID service-principal mode**: set ``AZURE_CLIENT_ID``,
   ``AZURE_TENANT_ID`` and ``AZURE_CLIENT_SECRET``. The module acquires an
   Azure AD token via MSAL and injects it into the ODBC connection string.
   ``DATABASE_URL`` should still point at the server/database (credentials
   are not needed in the URL in this mode).
"""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import async_sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus
import os
import logging
import msal
import time
import asyncio

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

# ── Entra ID (optional) ──────────────────────────────────────────
CLIENT_ID = os.getenv("AZURE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET", "")
TENANT_ID = os.getenv("AZURE_TENANT_ID", "")

USE_ENTRA_AUTH = bool(CLIENT_ID and CLIENT_SECRET and TENANT_ID)


def get_access_token() -> str:
    """Acquire an Azure AD access token for the database resource."""
    authority = f"https://login.microsoftonline.com/{TENANT_ID}"
    app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=authority,
        client_credential=CLIENT_SECRET,
    )
    scope = ["https://database.windows.net/.default"]
    result = app.acquire_token_for_client(scopes=scope)

    if "access_token" not in result:
        error_description = result.get(
            "error_description", "No error description provided"
        )
        logger.error("Failed to acquire access token: %s", error_description)
        raise ValueError(f"Failed to acquire access token: {error_description}")

    logger.info("Access token acquired successfully")
    return result["access_token"]


# ── Build the SQLAlchemy URLs ────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is not set. "
        "Copy Backend/.env.example to Backend/.env and configure it."
    )

if USE_ENTRA_AUTH:
    # Entra ID service-principal mode: build an ODBC connection string
    # with the acquired token. DATABASE_URL is expected to be an
    # aioodbc URL whose query portion contains the server/database.
    access_token = get_access_token()
    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={os.getenv('DB_SERVER', '')};"
        f"DATABASE={os.getenv('DB_NAME', '')};"
        "Authentication=ActiveDirectoryServicePrincipal;"
        "Encrypt=yes;"
        f"UID={CLIENT_ID};"
        f"PWD={CLIENT_SECRET};"
        f"AccessToken={access_token}"
    )
    encoded = quote_plus(conn_str)
    SYNC_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={encoded}"
    ASYNC_DATABASE_URL = f"mssql+aioodbc:///?odbc_connect={encoded}"
else:
    # Connection-string mode: use DATABASE_URL directly.
    SYNC_DATABASE_URL = DATABASE_URL
    # Derive the async URL from the sync URL for common drivers.
    if DATABASE_URL.startswith("mssql+pyodbc://"):
        ASYNC_DATABASE_URL = DATABASE_URL.replace(
            "mssql+pyodbc://", "mssql+aioodbc://", 1
        )
    else:
        ASYNC_DATABASE_URL = DATABASE_URL

logger.info("Database URL configured (credentials hidden)")

# ── Engines ──────────────────────────────────────────────────────
engine = create_engine(
    SYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=1800,
)

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=10,
)

# ── Sessions ─────────────────────────────────────────────────────
SessionLocal = sessionmaker(engine, expire_on_commit=False)

AsyncSessionLocal = async_sessionmaker(
    async_engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()


# ── Connection verification ─────────────────────────────────────
def verify_database_connection() -> bool:
    """Verify the database connection (synchronous)."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully")
        return True
    except Exception as e:
        logger.error("Error verifying database connection: %s", e)
        return False


async def verify_database_connection_async() -> bool:
    """Verify the database connection (asynchronous)."""
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully (async)")
        return True
    except Exception as e:
        logger.error("Error verifying database connection (async): %s", e)
        return False


# ── Session dependencies ────────────────────────────────────────
def get_db():
    """Yield a synchronous database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


async def get_async_db():
    """Yield an asynchronous database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ── Initialization ──────────────────────────────────────────────
async def init_db():
    """
    Create all tables and optionally seed a default admin user.

    The seed admin credentials are read from environment variables:
      SEED_ADMIN_EMAIL (default: admin@example.com)
      SEED_ADMIN_PASSWORD (default: changeme123)
      SEED_ADMIN_NAME (default: Administrator)

    In production, set these to secure values or remove seeding entirely
    by leaving SEED_ADMIN_EMAIL empty.
    """
    try:
        Base.metadata.create_all(bind=engine)

        seed_email = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
        seed_password = os.getenv("SEED_ADMIN_PASSWORD", "changeme123")
        seed_name = os.getenv("SEED_ADMIN_NAME", "Administrator")

        if seed_email:
            async with AsyncSessionLocal() as session:
                from models import User, UserRole
                from auth.auth_handler import AuthHandler

                result = await session.execute(
                    text("SELECT 1 FROM usuarios WHERE email = :email"),
                    {"email": seed_email},
                )
                if not result.scalar():
                    auth_handler = AuthHandler()
                    hashed_password = auth_handler.get_password_hash(seed_password)
                    nuevo_usuario = User(
                        email=seed_email,
                        password_hash=hashed_password,
                        nombre_completo=seed_name,
                        rol=UserRole.admin,
                        activo=True,
                    )
                    session.add(nuevo_usuario)
                    logger.info("Seed admin user created: %s", seed_email)

                await session.commit()
                logger.info("Database initialized successfully")
    except Exception as e:
        logger.error("Error initializing database: %s", e)
        raise


# ── Retry helper ────────────────────────────────────────────────
async def execute_with_retry(func, max_retries=3, delay=1):
    """Execute an async function with retry on transient connection errors."""
    retries = 0
    while retries < max_retries:
        try:
            return await func()
        except Exception as e:
            if "08S01" in str(e) and retries < max_retries - 1:
                retries += 1
                logger.warning(
                    "Connection error. Retrying (%d/%d)...", retries, max_retries
                )
                await asyncio.sleep(delay)
            else:
                logger.error("Error after %d attempts: %s", retries, e)
                raise
