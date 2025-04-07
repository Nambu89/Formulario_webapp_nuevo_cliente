"""
Script simplificado para crear datos de ejemplo en la base de datos.
Esta versión usa json.dumps para convertir los diccionarios a cadenas JSON.
"""

import asyncio
import uuid
import json
from datetime import datetime, timedelta
import sys
import os

# Ajustar el path para importar los módulos del proyecto
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from auth.auth_handler import AuthHandler
from database import init_db, AsyncSessionLocal

# Datos de ejemplo para clientes
CLIENTES_EJEMPLO = [
    {
        "nombre": "Electrodomésticos Martínez S.L.",
        "direccion": "Calle Industria 123",
        "poblacion": "Valencia",
        "codigo_postal": "46001",
        "nombre_contacto": "Juan Martínez",
        "telefono": "963123456",
        "correo": "info@electromartinez.es",
        "cif_nif": "B98765432",
        "tipo_carga": "COMP",
        "metodo_pago": "REMESA",
        "sepa_documento": "/uploads/sepa/demo_sepa1.pdf",
        "marcas_aprobadas": ["SV", "WD"],
        "tarifa_aprobada": "XEGC"
    },
    {
        "nombre": "Distribuciones Electro Sur",
        "direccion": "Avenida Andalucía 45",
        "poblacion": "Sevilla",
        "codigo_postal": "41001",
        "nombre_contacto": "María Gómez",
        "telefono": "954567890",
        "correo": "contacto@electrosur.es",
        "cif_nif": "B87654321",
        "tipo_carga": "CROSS",
        "metodo_pago": "TRANSFERENCIA",
        "sepa_documento": None,
        "marcas_aprobadas": ["SV", "AS", "HY"],
        "tarifa_aprobada": "DZLM"
    },
    {
        "nombre": "Hogar & Cocina Barcelona",
        "direccion": "Gran Vía 78",
        "poblacion": "Barcelona",
        "codigo_postal": "08001",
        "nombre_contacto": "Carlos Ruiz",
        "telefono": "932234567",
        "correo": "ventas@hogarcocina.com",
        "cif_nif": "B76543210",
        "tipo_carga": "GRUP",
        "metodo_pago": "REMESA",
        "sepa_documento": "/uploads/sepa/demo_sepa2.pdf",
        "marcas_aprobadas": ["WD", "HY"],
        "tarifa_aprobada": "AFDZLM"
    },
    {
        "nombre": "Electrohogar Madrid Centro",
        "direccion": "Calle Goya 15",
        "poblacion": "Madrid",
        "codigo_postal": "28001",
        "nombre_contacto": "Ana Fernández",
        "telefono": "915678901",
        "correo": "comercial@electrohogar.es",
        "cif_nif": "B65432109",
        "tipo_carga": "COMP",
        "metodo_pago": "TRANSFERENCIA",
        "sepa_documento": None
    },
    {
        "nombre": "Electrodomésticos Norte S.A.",
        "direccion": "Avenida Cantabria 25",
        "poblacion": "Bilbao",
        "codigo_postal": "48001",
        "nombre_contacto": "Javier Echevarría",
        "telefono": "944567890",
        "correo": "info@electronorte.com",
        "cif_nif": "A54321098",
        "tipo_carga": "GRUP",
        "metodo_pago": "REMESA",
        "sepa_documento": "/uploads/sepa/demo_sepa3.pdf"
    }
]

async def crear_datos_ejemplo():
    """Crear los datos de ejemplo"""
    async with AsyncSessionLocal() as db:
        # Crear usuarios si no existen
        await crear_usuarios(db)
        
        # Obtener información de usuarios
        usuario_comercial = await obtener_usuario(db, 'comercial@example.com')
        
        # Crear archivos SEPA si no existen
        crear_archivos_sepa()
        
        # Eliminar solicitudes anteriores
        await db.execute(text("DELETE FROM solicitudes"))
        print("Solicitudes anteriores eliminadas")
        
        # Crear nuevas solicitudes
        await crear_solicitudes(db, usuario_comercial)
        
        await db.commit()
        print("Datos de ejemplo creados con éxito")

async def crear_usuarios(db):
    """Crear usuarios de ejemplo"""
    # Comprobar y crear usuario director
    if not await usuario_existe(db, 'director@example.com'):
        auth_handler = AuthHandler()
        password_hash = auth_handler.get_password_hash('password123')
        
        await db.execute(
            text("""
                INSERT INTO usuarios (id, email, password_hash, nombre_completo, rol, activo, creado_en)
                VALUES (:id, :email, :password_hash, :nombre, 'director', true, :creado_en)
            """),
            {
                "id": uuid.uuid4(),
                "email": 'director@example.com',
                "password_hash": password_hash,
                "nombre": 'Director Comercial',
                "creado_en": datetime.utcnow()
            }
        )
        print("Usuario director creado")
    else:
        print("Usuario director ya existe")
        
    # Comprobar y crear usuario pedidos
    if not await usuario_existe(db, 'pedidos@example.com'):
        auth_handler = AuthHandler()
        password_hash = auth_handler.get_password_hash('password123')
        
        await db.execute(
            text("""
                INSERT INTO usuarios (id, email, password_hash, nombre_completo, rol, activo, creado_en)
                VALUES (:id, :email, :password_hash, :nombre, 'pedidos', true, :creado_en)
            """),
            {
                "id": uuid.uuid4(),
                "email": 'pedidos@example.com',
                "password_hash": password_hash,
                "nombre": 'Responsable de Pedidos',
                "creado_en": datetime.utcnow()
            }
        )
        print("Usuario pedidos creado")
    else:
        print("Usuario pedidos ya existe")
        
    # Comprobar y crear usuario comercial
    if not await usuario_existe(db, 'comercial@example.com'):
        auth_handler = AuthHandler()
        password_hash = auth_handler.get_password_hash('password123')
        
        await db.execute(
            text("""
                INSERT INTO usuarios (id, email, password_hash, nombre_completo, rol, activo, creado_en)
                VALUES (:id, :email, :password_hash, :nombre, 'comercial', true, :creado_en)
            """),
            {
                "id": uuid.uuid4(),
                "email": 'comercial@example.com',
                "password_hash": password_hash,
                "nombre": 'Comercial Ejemplo',
                "creado_en": datetime.utcnow()
            }
        )
        print("Usuario comercial creado")
    else:
        print("Usuario comercial ya existe")

async def usuario_existe(db, email):
    """Verificar si un usuario existe por email"""
    result = await db.execute(text("SELECT 1 FROM usuarios WHERE email = :email"), {"email": email})
    return result.scalar() is not None

async def obtener_usuario(db, email):
    """Obtener un usuario por email"""
    result = await db.execute(text("SELECT id FROM usuarios WHERE email = :email"), {"email": email})
    row = result.fetchone()
    if row:
        return row[0]
    return None

def crear_archivos_sepa():
    """Crear archivos SEPA de ejemplo"""
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads", "sepa")
    os.makedirs(uploads_dir, exist_ok=True)
    
    for i in range(1, 4):
        file_path = os.path.join(uploads_dir, f"demo_sepa{i}.pdf")
        if not os.path.exists(file_path):
            with open(file_path, 'w') as f:
                f.write(f"Archivo SEPA de demostración {i}")
            print(f"Archivo SEPA {i} creado")
        else:
            print(f"Archivo SEPA {i} ya existe")

async def crear_solicitudes(db, comercial_id):
    """Crear solicitudes de ejemplo"""
    # Solicitud 1: Completada
    solicitud_id1 = uuid.uuid4()
    await db.execute(
        text("INSERT INTO solicitudes (id, comercial_id, datos_cliente, estado, aprobado_director, aprobado_pedidos, aprobado_admin, notas, creado_en, actualizado_en) VALUES (:id, :comercial_id, :datos_cliente, 'COMPLETADO', true, true, true, :notas, :creado_en, :actualizado_en)"),
        {
            "id": solicitud_id1,
            "comercial_id": comercial_id,
            "datos_cliente": json.dumps(CLIENTES_EJEMPLO[0]),
            "notas": json.dumps({
                "director": "Cliente con buena trayectoria. Aprobado.",
                "pedidos": "Stock disponible para sus productos habituales.",
                "admin": "Documentación completa y verificada."
            }),
            "creado_en": datetime.utcnow() - timedelta(days=7),
            "actualizado_en": datetime.utcnow() - timedelta(days=1)
        }
    )
    print("Solicitud 1 (COMPLETADO) creada")
    
    # Solicitud 2: Pendiente de admin
    solicitud_id2 = uuid.uuid4()
    await db.execute(
        text("INSERT INTO solicitudes (id, comercial_id, datos_cliente, estado, aprobado_director, aprobado_pedidos, aprobado_admin, notas, creado_en, actualizado_en) VALUES (:id, :comercial_id, :datos_cliente, 'PENDIENTE_ADMIN', true, true, false, :notas, :creado_en, :actualizado_en)"),
        {
            "id": solicitud_id2,
            "comercial_id": comercial_id,
            "datos_cliente": json.dumps(CLIENTES_EJEMPLO[1]),
            "notas": json.dumps({
                "director": "Cliente recomendado por distribuidor. Aprobado con margen comercial estándar.",
                "pedidos": "Configurado en sistema. Pendiente de primera entrega."
            }),
            "creado_en": datetime.utcnow() - timedelta(days=6),
            "actualizado_en": datetime.utcnow() - timedelta(days=2)
        }
    )
    print("Solicitud 2 (PENDIENTE_ADMIN) creada")
    
    # Solicitud 3: Pendiente de pedidos
    solicitud_id3 = uuid.uuid4()
    await db.execute(
        text("INSERT INTO solicitudes (id, comercial_id, datos_cliente, estado, aprobado_director, aprobado_pedidos, aprobado_admin, notas, creado_en, actualizado_en) VALUES (:id, :comercial_id, :datos_cliente, 'PENDIENTE_PEDIDOS', true, false, false, :notas, :creado_en, :actualizado_en)"),
        {
            "id": solicitud_id3,
            "comercial_id": comercial_id,
            "datos_cliente": json.dumps(CLIENTES_EJEMPLO[2]),
            "notas": json.dumps({
                "director": "Cliente con potencial en la zona. Aprobado con seguimiento trimestral."
            }),
            "creado_en": datetime.utcnow() - timedelta(days=3),
            "actualizado_en": datetime.utcnow() - timedelta(days=1)
        }
    )
    print("Solicitud 3 (PENDIENTE_PEDIDOS) creada")
    
    # Solicitud 4: Pendiente de director
    solicitud_id4 = uuid.uuid4()
    await db.execute(
        text("INSERT INTO solicitudes (id, comercial_id, datos_cliente, estado, aprobado_director, aprobado_pedidos, aprobado_admin, notas, creado_en, actualizado_en) VALUES (:id, :comercial_id, :datos_cliente, 'PENDIENTE_DIRECTOR', false, false, false, :notas, :creado_en, :actualizado_en)"),
        {
            "id": solicitud_id4,
            "comercial_id": comercial_id,
            "datos_cliente": json.dumps(CLIENTES_EJEMPLO[3]),
            "notas": json.dumps({}),
            "creado_en": datetime.utcnow() - timedelta(days=1),
            "actualizado_en": datetime.utcnow() - timedelta(days=1)
        }
    )
    print("Solicitud 4 (PENDIENTE_DIRECTOR) creada")
    
    # Solicitud 5: Rechazada
    solicitud_id5 = uuid.uuid4()
    await db.execute(
        text("INSERT INTO solicitudes (id, comercial_id, datos_cliente, estado, aprobado_director, aprobado_pedidos, aprobado_admin, notas, creado_en, actualizado_en) VALUES (:id, :comercial_id, :datos_cliente, 'RECHAZADO', false, false, false, :notas, :creado_en, :actualizado_en)"),
        {
            "id": solicitud_id5,
            "comercial_id": comercial_id,
            "datos_cliente": json.dumps(CLIENTES_EJEMPLO[4]),
            "notas": json.dumps({
                "director": "Cliente con histórico de impagos. Solicitar garantías adicionales."
            }),
            "creado_en": datetime.utcnow() - timedelta(days=5),
            "actualizado_en": datetime.utcnow() - timedelta(days=4)
        }
    )
    print("Solicitud 5 (RECHAZADO) creada")

async def main():
    """Función principal"""
    try:
        # Inicializar la base de datos
        await init_db()
        print("Base de datos inicializada")
        
        # Crear datos de ejemplo
        await crear_datos_ejemplo()
        
        print("Script completado con éxito")
    except Exception as e:
        print(f"Error al ejecutar el script: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())