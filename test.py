import asyncio
import asyncpg

async def test_connection():
    try:
        conn = await asyncpg.connect(
            user="postgres",
            password="Fer19891234",
            database="svan_comerciales",
            host="localhost",
            port=5432
        )
        print("Conexión realizada con éxito!")
        await conn.close()
    except Exception as e:
        print(f"Error de conexión: {e}")

asyncio.run(test_connection())