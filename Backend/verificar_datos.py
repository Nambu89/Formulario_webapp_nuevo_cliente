"""
Script simplificado para verificar que los datos de ejemplo se han creado correctamente.
Este script consulta la base de datos y muestra información sobre usuarios y solicitudes.
"""

import asyncio
import sys
import os

# Ajustar el path para importar los módulos del proyecto
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import init_db, AsyncSessionLocal

async def verificar_datos():
    """Verifica que los datos de ejemplo se han creado correctamente"""
    print("Verificando datos en la base de datos...")
    
    async with AsyncSessionLocal() as db:
        # 1. Verificar usuarios
        print("\n=== USUARIOS ===")
        result = await db.execute(text("SELECT id, email, nombre_completo, rol FROM usuarios"))
        usuarios = result.fetchall()
        
        for usuario in usuarios:
            print(f"ID: {usuario[0]}, Email: {usuario[1]}, Nombre: {usuario[2]}, Rol: {usuario[3]}")
        
        # 2. Verificar solicitudes
        print("\n=== SOLICITUDES ===")
        result = await db.execute(text("SELECT id, estado, aprobado_director, aprobado_pedidos, aprobado_admin FROM solicitudes"))
        solicitudes = result.fetchall()
        
        for solicitud in solicitudes:
            print(f"ID: {solicitud[0]}, Estado: {solicitud[1]}, Director: {solicitud[2]}, Pedidos: {solicitud[3]}, Admin: {solicitud[4]}")
        
        # 3. Verificar detalles de la primera solicitud
        print("\n=== DETALLE DE LA PRIMERA SOLICITUD ===")
        result = await db.execute(text("SELECT datos_cliente, notas FROM solicitudes LIMIT 1"))
        detalle = result.fetchone()
        
        if detalle:
            print("Datos del cliente:")
            for clave, valor in detalle[0].items():
                print(f"  {clave}: {valor}")
            
            print("\nNotas:")
            for rol, nota in detalle[1].items():
                print(f"  {rol}: {nota}")

async def main():
    """Función principal del script"""
    try:
        # Inicializar la base de datos
        await init_db()
        
        # Verificar datos
        await verificar_datos()
        
        print("\nVerificación completada con éxito")
    except Exception as e:
        print(f"Error al ejecutar el script: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())