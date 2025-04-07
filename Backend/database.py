from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import async_sessionmaker
from dotenv import load_dotenv
import os
import logging
import msal
import time
import asyncio

# Configuración del logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Cargamos las variables de entorno
load_dotenv()

# Configuración de Microsoft Entra ID
CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET")
TENANT_ID = os.getenv("AZURE_TENANT_ID")

if not all([CLIENT_ID, CLIENT_SECRET, TENANT_ID]):
    raise ValueError("Faltan variables de entorno: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID")

# Función para obtener el token de acceso
def get_access_token():
    authority = f"https://login.microsoftonline.com/{TENANT_ID}"
    app = msal.ConfidentialClientApplication(
        CLIENT_ID,
        authority=authority,
        client_credential=CLIENT_SECRET
    )
    scope = ["https://database.windows.net/.default"]
    result = app.acquire_token_for_client(scopes=scope)

    if "access_token" not in result:
        error_description = result.get("error_description", "No se proporcionó descripción del error")
        logger.error(f"Error al obtener el token de acceso: {error_description}")
        raise ValueError(f"Error al obtener el token de acceso: {error_description}")

    logger.info("Token de acceso obtenido correctamente")
    return result["access_token"]

# Obtener token inicial
access_token = get_access_token()

# Configuración de la conexión con autenticación de Microsoft Entra ID
conn_str = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=nuevosclientes.database.windows.net;"
    "DATABASE=registroclientes;"
    "Authentication=ActiveDirectoryServicePrincipal;"
    "Encrypt=yes;"
    f"UID={CLIENT_ID};"
    f"PWD={CLIENT_SECRET};"
    f"AccessToken={access_token}"
)

# URLs de la base de datos para SQLAlchemy
SYNC_DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={conn_str}"
ASYNC_DATABASE_URL = f"mssql+aioodbc:///?odbc_connect={conn_str}"

logger.info(f"Usando URL de base de datos: {SYNC_DATABASE_URL}")

# Configuración del engine síncrono para compatibilidad
engine = create_engine(
    SYNC_DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=1800  # Reciclar conexiones cada 30 minutos
)

# Configuración del engine asíncrono
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=1800,  # Reciclar conexiones cada 30 minutos
    pool_size=5,
    max_overflow=10
)

# Configuración de las sesiones
SessionLocal = sessionmaker(
    engine,
    expire_on_commit=False
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# Base para los modelos
Base = declarative_base()

# Función para verificar la conexión a la base de datos
def verify_database_connection():
    """Verifica la conexión a la base de datos."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("Conexión a la base de datos verificada con éxito")
            return True
    except Exception as e:
        logger.error(f"Error al verificar la conexión a la base de datos: {str(e)}")
        return False

# Función asíncrona para verificar la conexión
async def verify_database_connection_async():
    """Verifica la conexión a la base de datos de forma asíncrona."""
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("Conexión a la base de datos verificada con éxito (async)")
            return True
    except Exception as e:
        logger.error(f"Error al verificar la conexión a la base de datos (async): {str(e)}")
        return False

# Función para obtener una sesión síncrona
def get_db():
    """Genera una sesión síncrona de la base de datos."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

# Función para obtener una sesión asíncrona
async def get_async_db():
    """Genera una sesión asíncrona de la base de datos."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Función para inicializar la base de datos con operaciones asíncronas
async def init_db():
    """Inicializa la base de datos con datos de prueba."""
    try:
        # Crear todas las tablas - Using synchronous engine for schema creation
        # as it's a one-time operation and more reliable with pyodbc
        Base.metadata.create_all(bind=engine)
        
        # Crear una sesión para insertar datos
        async with AsyncSessionLocal() as session:
            from models import User, UserRole
            from auth.auth_handler import AuthHandler

            # Lista de usuarios a crear
            usuarios = [
                # Informático (tú)
                {
                    "email": "fernando.prada@svanelectro.com",
                    "nombre_completo": "Fernando Prada",
                    "rol": UserRole.admin,
                    "password": "contraseña123"
                },
            ]

            auth_handler = AuthHandler()

            for usuario_data in usuarios:
                # Verificar si el usuario ya existe
                result = await session.execute(
                    text("SELECT 1 FROM usuarios WHERE email = :email"),
                    {"email": usuario_data["email"]}
                )
                if not result.scalar():
                    # Crear el usuario si no existe
                    hashed_password = auth_handler.get_password_hash(usuario_data["password"])
                    nuevo_usuario = User(
                        email=usuario_data["email"],
                        password_hash=hashed_password,
                        nombre_completo=usuario_data["nombre_completo"],
                        rol=usuario_data["rol"],
                        activo=True
                    )
                    session.add(nuevo_usuario)
                    logger.info(f"Usuario {usuario_data['email']} creado correctamente")

            await session.commit()
            logger.info("Base de datos inicializada correctamente")
    except Exception as e:
        logger.error(f"Error al inicializar la base de datos: {str(e)}")
        raise

# Función con reintentos para manejar errores transitorios de conexión
async def execute_with_retry(func, max_retries=3, delay=1):
    """Ejecuta una función con reintentos en caso de error de conexión."""
    retries = 0
    while retries < max_retries:
        try:
            return await func()
        except Exception as e:
            if "08S01" in str(e) and retries < max_retries - 1:
                retries += 1
                logger.warning(f"Error de conexión. Reintentando ({retries}/{max_retries})...")
                await asyncio.sleep(delay)
            else:
                logger.error(f"Error después de {retries} intentos: {str(e)}")
                raise