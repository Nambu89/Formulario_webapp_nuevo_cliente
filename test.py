"""
Quick database connectivity test.

Reads connection parameters from environment variables (or .env).
Usage:
    python test.py

Make sure Backend/.env is configured with a valid DATABASE_URL.
"""

import asyncio
import os
import sys

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL is not set. Copy .env.example to .env and configure it.")
    sys.exit(1)


async def test_connection():
    """Test the database connection using the configured DATABASE_URL."""
    try:
        # Use SQLAlchemy async engine (same as the application)
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text

        async_url = DATABASE_URL
        if async_url.startswith("mssql+pyodbc://"):
            async_url = async_url.replace("mssql+pyodbc://", "mssql+aioodbc://", 1)

        engine = create_async_engine(async_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.fetchone()
            print(f"Connection successful! Query returned: {row[0]}")
        await engine.dispose()
    except Exception as e:
        print(f"Connection error: {e}")


if __name__ == "__main__":
    asyncio.run(test_connection())
