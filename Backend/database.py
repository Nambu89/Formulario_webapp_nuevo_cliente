from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv
import os
import asyncio
import logging

# Configuración del logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Verificar instalación de asyncpg
try:
    import asyncpg
    logger.info("asyncpg está instalado correctamente")
except ImportError as e:
    logger.error(f"ERROR: asyncpg no está instalado: {e}")

# Cargamos las variables de entorno
load_dotenv()

# URL de la base de datos
DATABASE_URL = "postgresql+asyncpg://postgres:Fer19891234@localhost:5432/svan_comerciales"
logger.info(f"Usando URL de base de datos: {DATABASE_URL}")

# Configuración del engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True,
    pool_size=5,
    max_overflow=10
)

# Configuración de la sesión asíncrona
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base para los modelos
Base = declarative_base()

async def verify_database_connection():
    """Verifica la conexión a la base de datos."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("Conexión a la base de datos verificada exitosamente")
            return True
    except Exception as e:
        logger.error(f"Error al verificar la conexión a la base de datos: {str(e)}")
        return False

async def get_async_db():
    """Genera una sesión asíncrona de la base de datos."""
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()

# Función para inicializar la base de datos con datos de prueba
async def init_db():
    """Inicializa la base de datos con datos de prueba."""
    try:
        async with engine.begin() as conn:
            # Crear todas las tablas
            await conn.run_sync(Base.metadata.create_all)
            
        # Crear una sesión para insertar datos
        async with AsyncSessionLocal() as session:
            from models import User, UserRole
            from auth.auth_handler import AuthHandler

            # Verificar si ya existe el usuario admin
            result = await session.execute(
                text("SELECT 1 FROM usuarios WHERE email = 'fernando.prada@svanelectro.com'")
            )
            if not result.scalar():
                # Crear usuario admin si no existe
                auth_handler = AuthHandler()
                admin_user = User(
                    email='fernando.prada@svanelectro.com',
                    password_hash=auth_handler.get_password_hash('contraseña_prueba'),
                    nombre_completo='Fernando Prada',
                    rol=UserRole.admin
                )
                session.add(admin_user)
                await session.commit()
                logger.info("Usuario admin creado correctamente")
            
        logger.info("Base de datos inicializada correctamente")
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {str(e)}")
        raise