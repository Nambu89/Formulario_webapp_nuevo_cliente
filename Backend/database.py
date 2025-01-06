from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Cargamos las variables de entorno
load_dotenv()

# Configuramos la URL de la base de datos para conexiones asíncronas
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:Fer19891234@localhost:5432/svan_comerciales"
)

# Aseguramos que la URL use el driver correcto
if not DATABASE_URL.startswith("postgresql+asyncpg://"):
    # Si la URL comienza con postgresql://, la convertimos al formato correcto
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        raise ValueError(
            "La URL de la base de datos debe comenzar con 'postgresql://' o 'postgresql+asyncpg://'"
        )

# Creamos el motor asíncrono
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True,
    pool_size=20, # Tamaño del pool de conexiones
    max_overflow=10, # Máximo número de conexiones adicionales
)

# Configuramos la sesión asíncrona
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base para los modelos
Base = declarative_base()

# Función asíncrona para obtener la sesión de la base de datos
async def get_async_db():
    """
    Genera una sesión asíncrona de la base de datos.
    Se usa como dependencia en FastAPI para manejar las conexiones.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()