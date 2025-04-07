"""
Script simple para crear usuarios de prueba
"""

import asyncio
import uuid
from sqlalchemy import text
from database import init_db, AsyncSessionLocal
from auth.auth_handler import AuthHandler
from datetime import datetime

async def crear_usuarios():
    """Crear los usuarios de prueba"""
    async with AsyncSessionLocal() as db:
        auth_handler = AuthHandler()
        
        # Lista de usuarios a crear
        usuarios = [
            {
                "email": "director@example.com",
                "nombre": "Director Comercial",
                "rol": "director"
            },
            {
                "email": "pedidos@example.com",
                "nombre": "Responsable de Pedidos",
                "rol": "pedidos"
            },
            {
                "email": "admin@example.com",
                "nombre": "Responsable de Administración",
                "rol": "admin"
            },
            {
                "email": "comercial@example.com",
                "nombre": "Comercial Ejemplo",
                "rol": "comercial"
            }
        ]
        
        # Crear cada usuario si no existe
        for usuario in usuarios:
            result = await db.execute(
                text("SELECT 1 FROM usuarios WHERE email = :email"),
                {"email": usuario["email"]}
            )
            
            if not result.scalar():
                password_hash = auth_handler.get_password_hash('password123')
                await db.execute(
                    text("""
                        INSERT INTO usuarios (id, email, password_hash, nombre_completo, rol, activo, creado_en)
                        VALUES (:id, :email, :password_hash, :nombre, :rol, true, :creado_en)
                    """),
                    {
                        "id": uuid.uuid4(),
                        "email": usuario["email"],
                        "password_hash": password_hash,
                        "nombre": usuario["nombre"],
                        "rol": usuario["rol"],
                        "creado_en": datetime.utcnow()
                    }
                )
                print(f"Usuario {usuario['email']} ({usuario['rol']}) creado")
            else:
                print(f"Usuario {usuario['email']} ya existe")
                
        await db.commit()
        print("Todos los usuarios creados con éxito")

async def main():
    """Función principal"""
    try:
        # Inicializar la base de datos
        await init_db()
        print("Base de datos inicializada")
        
        # Crear usuarios
        await crear_usuarios()
        
        print("Script completado con éxito")
    except Exception as e:
        print(f"Error al ejecutar el script: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())