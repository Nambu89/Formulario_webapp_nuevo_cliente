from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Cargamos las variables de entorno
load_dotenv()

# Configuramos la URL de la base de datos para conexiones asíncronas
# Nota: El formato es diferente al síncrono, usamos postgresql+asyncpg:// en lugar de postgresql://
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:Fer19891234@localhost:5432/svan_comerciales"
)

# Creamos el motor asíncrono
# El parámetro echo=True es útil durante el desarrollo para ver las consultas SQL
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True  # Habilita características futuras de SQLAlchemy
)

# Configuramos la sesión asíncrona
# Expire_on_commit=False mejora el rendimiento en aplicaciones web
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