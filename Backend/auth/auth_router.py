from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from auth.auth_service import AuthService

router = APIRouter(tags=["auth"])

@router.post("/token")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Endpoint para obtener un token JWT mediante credenciales de usuario.
    """
    auth_service = AuthService(db)
    result = auth_service.authenticate_user(form_data.username, form_data.password)
    return result