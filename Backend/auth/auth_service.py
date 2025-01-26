from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from models import User
from auth.auth_handler import AuthHandler
import logging

# Configuración del logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_handler = AuthHandler()

    async def authenticate_user(self, email: str, password: str):
        """Autentica un usuario."""
        try:
            logger.debug(f"Iniciando autenticación para usuario: {email}")

            # Buscar usuario
            result = await self.db.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"Usuario no encontrado: {email}")
                raise HTTPException(
                    status_code=401,
                    detail="Credenciales incorrectas"
                )

            logger.debug(f"Usuario encontrado: {user.email}")
            logger.debug(f"Verificando contraseña")

            # Verificar contraseña
            if not self.auth_handler.verify_password(password, user.password_hash):
                logger.error("Verificación de contraseña fallida")
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

            logger.debug("Token de acceso generado correctamente")

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_role": user.rol.value,
                "user_email": user.email,
                "user_name": user.nombre_completo
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error inesperado en authenticate_user: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Error interno del servidor"
            )