from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from auth.auth_handler import AuthHandler
from database import get_db
from models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
auth_handler = AuthHandler()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependencia que obtiene el usuario actual basado en el token JWT.
    Se usa en endpoints que requieren autenticación.
    """
    token_data = auth_handler.decode_token(token)
    result = db.execute(select(User).where(User.email == token_data["sub"]))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user