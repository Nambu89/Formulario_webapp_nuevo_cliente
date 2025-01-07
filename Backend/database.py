from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import asyncio
from contextlib import asynccontextmanager


# Cargamos las variables de entorno
load_dotenv()

# Añadimos verificaciones de las dependencias
try:
    import asyncpg
    print("asyncpg está instalado correctamente")
except ImportError:
    print("ERROR: asyncpg no está instalado")

try:
    import psycopg2
    print("psycopg2 está instalado correctamente")
except ImportError:
    print("ERROR: psycopg2 no está instalado")


# Modificamos la URL para forzar el uso de asyncpg
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:Fer19891234@localhost:5432/svan_comerciales"
)

# Simplificamos la configuración inicial para diagnosticar problemas
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True,
    # Removemos temporalmente las configuraciones adicionales para aislar el problema
)

# Configuramos la sesión asíncrona con mejor manejo de recursos
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base para los modelos
Base = declarative_base()

# Función mejorada para obtener la conexión a la base de datos
async def get_async_db():
    """
    Genera una sesión asíncrona de la base de datos con reintentos y mejor
    manejo de errores.
    """
    retries = 3
    retry_delay = 1  # Tiempo inicial de espera entre reintentos
    session = None
    
    for attempt in range(retries):
        try:
            session = AsyncSessionLocal()
            await session.connection()  # Verificamos la conexión
            yield session
            return
        except Exception as e:
            if session:
                await session.close()
            
            if attempt == retries - 1:  # Último intento
                raise Exception(f"No se pudo conectar a la base de datos después de {retries} intentos: {str(e)}")
            
            # Retraso exponencial entre reintentos
            wait_time = retry_delay * (2 ** attempt)
            print(f"Intento {attempt + 1} falló. Esperando {wait_time} segundos antes de reintentar...")
            await asyncio.sleep(wait_time)
    
    if session:
        await session.close()

# Función de utilidad para verificar la conexión
async def verify_database_connection():
    """
    Verifica que la conexión a la base de datos funciona correctamente.
    Útil para diagnóstico durante el inicio de la aplicación.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
            print("Conexión a la base de datos verificada exitosamente")
        return True
    except Exception as e:
        print(f"Error al verificar la conexión a la base de datos: {str(e)}")
        return False