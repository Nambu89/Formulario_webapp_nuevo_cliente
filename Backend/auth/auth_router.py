from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_async_db
from auth.auth_service import AuthService

router = APIRouter(tags=["auth"])

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endpoint para obtener un token JWT mediante credenciales de usuario.
    """
    auth_service = AuthService(db)
    result = await auth_service.authenticate_user(form_data.username, form_data.password)
    return result