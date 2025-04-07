"""
Script para verificar los valores del enum EstadoSolicitud en la base de datos.
"""

import asyncio
from sqlalchemy import text
from database import init_db, AsyncSessionLocal

async def verificar_enum():
    """Verifica los valores válidos del enum EstadoSolicitud"""
    print("Verificando valores del enum EstadoSolicitud...")
    
    async with AsyncSessionLocal() as db:
        # Consulta para obtener los valores del enum
        result = await db.execute(text("""
            SELECT enum_range(NULL::estadosolicitud)::text[];
        """))
        valores = result.scalar()
        
        print(f"Valores válidos para EstadoSolicitud: {valores}")
        
        # Consulta para verificar el modelo Solicitud
        result = await db.execute(text("""
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'solicitudes';
        """))
        
        columnas = result.fetchall()
        print("\nColumnas de la tabla 'solicitudes':")
        for col in columnas:
            print(f"  {col[0]}: {col[1]} ({col[2]})")

async def main():
    try:
        await init_db()
        await verificar_enum()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())