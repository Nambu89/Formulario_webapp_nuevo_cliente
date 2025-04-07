# auth_handler.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException
import logging
import os
import secrets
import string

# Configuración del logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AuthHandler:
    def __init__(self):
        # En producción, usar variables de entorno
        self.secret_key = os.getenv('JWT_SECRET_KEY', 'tu_clave_secreta_muy_segura_y_larga')
        self.algorithm = 'HS256'
        self.access_token_expire_minutes = 30
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=12
        )

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica si una contraseña coincide con su hash."""
        try:
            logger.debug("Iniciando verificación de contraseña")
            logger.debug(f"Longitud de contraseña plana: {len(plain_password)}")
            logger.debug(f"Longitud de hash: {len(hashed_password)}")
            
            result = self.pwd_context.verify(plain_password, hashed_password)
            logger.debug(f"Resultado de verificación: {result}")
            return result
        except Exception as e:
            logger.error(f"Error en verify_password: {str(e)}")
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Genera un hash seguro para una contraseña."""
        try:
            logger.debug("Generando hash para contraseña")
            hashed = self.pwd_context.hash(password)
            logger.debug(f"Hash generado con éxito. Longitud: {len(hashed)}")
            return hashed
        except Exception as e:
            logger.error(f"Error al generar hash: {str(e)}")
            raise
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Crea un token JWT."""
        try:
            logger.debug(f"Creando token JWT para los datos: {data}")
            to_encode = data.copy()
            expire = datetime.utcnow() + (
                expires_delta or timedelta(minutes=self.access_token_expire_minutes)
            )
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(
                to_encode,
                self.secret_key,
                algorithm=self.algorithm
            )
            logger.debug("Token JWT creado con éxito")
            return encoded_jwt
        except Exception as e:
            logger.error(f"Error al crear token JWT: {str(e)}")
            raise
    
    def decode_token(self, token: str) -> dict:
        """Decodifica y verifica un token JWT."""
        try:
            logger.debug("Intentando decodificar token JWT")
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            logger.debug("Token JWT decodificado con éxito")
            return payload
        except JWTError as e:
            logger.error(f"Error al decodificar token JWT: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def generate_temporary_password(self) -> str:
        """Genera una contraseña temporal segura de 12 caracteres."""
        try:
            logger.debug("Generando contraseña temporal")
            characters = string.ascii_letters + string.digits + string.punctuation
            temp_password = ''.join(secrets.choice(characters) for _ in range(12))
            logger.debug(f"Contraseña temporal generada: {temp_password}")
            return temp_password
        except Exception as e:
            logger.error(f"Error al generar contraseña temporal: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Error al generar contraseña temporal"
            )