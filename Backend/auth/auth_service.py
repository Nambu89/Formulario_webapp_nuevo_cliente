from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from models import User
from auth.auth_handler import AuthHandler
import logging

# Configuración básica de logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_handler = AuthHandler()

    async def authenticate_user(self, email: str, password: str):
        """
        Autentica un usuario verificando sus credenciales.
        
        Args:
            email: Correo electrónico del usuario
            password: Contraseña del usuario
            
        Returns:
            dict: Diccionario con el token de acceso y la información del usuario
            
        Raises:
            HTTPException: Si las credenciales son inválidas
        """
        logger.debug(f"Intentando autenticar al usuario: {email}")

        # Buscar usuario
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"Usuario con email {email} no encontrado")
            raise HTTPException(
                status_code=401,
                detail="Credenciales incorrectas"
            )

        logger.debug(f"Usuario encontrado: {user.email}")
        logger.debug(f"Contraseña proporcionada: {password}")
        logger.debug(f"Hash almacenado: {user.password_hash}")

        # Verificar contraseña
        if not self.auth_handler.verify_password(password, user.password_hash):
            logger.error("La contraseña no coincide")
            raise HTTPException(
                status_code=401,
                detail="Credenciales incorrectas"
            )

        logger.debug("Contraseña verificada correctamente")

        # Actualizar último acceso
        user.ultimo_acceso = datetime.utcnow()
        await self.db.commit()

        # Crear token
        access_token = self.auth_handler.create_access_token(
            data={"sub": user.email, "rol": user.rol.value}
        )

        # Devolver respuesta estructurada
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user.rol.value,
            "user_email": user.email,
            "user_name": user.nombre_completo
        }