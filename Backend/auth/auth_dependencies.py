from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from .auth_handler import AuthHandler
from ..database import get_async_db
from ..models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
auth_handler = AuthHandler()

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_db)
) -> User:
    """
    Dependencia que obtiene el usuario actual basado en el token JWT.
    Se usa en endpoints que requieren autenticación.
    """
    token_data = auth_handler.decode_token(token)
    result = await db.execute(select(User).where(User.email == token_data["sub"]))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user