from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv
import os
import asyncio

# Al principio del archivo, después de los imports
try:
    import asyncpg
    print("asyncpg está instalado correctamente")
except ImportError as e:
    print(f"ERROR: asyncpg no está instalado: {e}")

# Cargamos las variables de entorno
load_dotenv()

# Imprimir la URL para diagnóstico
DATABASE_URL = "postgresql+asyncpg://postgres:Fer19891234@localhost:5432/svan_comerciales"
print(f"Usando URL de base de datos: {DATABASE_URL}")

# Configuración simplificada del engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True
)

# Configuramos la sesión asíncrona
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base para los modelos
Base = declarative_base()

# Aquí va la función de verificación de conexión
async def verify_database_connection():
    """
    Verifica que la conexión a la base de datos funciona correctamente.
    Esta función intenta establecer una conexión y ejecutar una consulta simple
    para asegurarse de que todo está funcionando como se espera.
    
    Returns:
        bool: True si la conexión es exitosa, False en caso contrario
    """
    try:
        async with engine.begin() as conn:
            # Intentamos ejecutar una consulta simple
            await conn.execute(text("SELECT 1"))
            print("Conexión a la base de datos verificada exitosamente")
            return True
    except Exception as e:
        print(f"Error al verificar la conexión a la base de datos: {str(e)}")
        return False

# Función para obtener la sesión de base de datos
async def get_async_db():
    """Genera una sesión asíncrona de la base de datos con reintentos."""
    retries = 3
    for attempt in range(retries):
        try:
            async with AsyncSessionLocal() as session:
                yield session
        except Exception as e:
            if attempt == retries - 1:
                raise
            await asyncio.sleep(1)
        finally:
            await session.close()