import asyncio
from database import init_db, async_engine
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Iniciando inicialización de la base de datos")
    await init_db()
    logger.info("Inicialización completada")
    
    # Cierra la conexión
    await async_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())