from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from ..models import User
from .auth_handler import AuthHandler

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
            tuple: (Usuario autenticado, Token de acceso)
            
        Raises:
            HTTPException: Si las credenciales son inválidas
        """
        # Buscar usuario
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not self.auth_handler.verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Credenciales incorrectas"
            )

        # Actualizar último acceso
        user.ultimo_acceso = datetime.utcnow()
        await self.db.commit()

        # Crear token
        access_token = self.auth_handler.create_access_token(
            data={"sub": user.email, "rol": user.rol.value}
        )

        return user, access_token