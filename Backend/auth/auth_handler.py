from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException

class AuthHandler:
    def __init__(self):
        self.secret_key = 'tu_clave_secreta' # En producción, cambiar a variables de entorno
        self.algorithm = 'HS256'
        self.access_token_expire_minutes = 30
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifica si una contraseña coincide con su hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password:str) -> str:
        """Genera un hash seguro para una contraseña."""
        return self.pwd_context.hash(password)
    
    def create_acces_token(self, data:dict, expires_delta:Optional[timedelta]=None) -> str:
        """
        Crea un token JWT con los datos proporcionados.
        
        Args:
            data: Diccionario con los datos a codificar en el token
            expires_delta: Tiempo opcional de expiración del token
            
        Returns:
            str: Token JWT codificado
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes = self.access_token_expire_minutes))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.secret_key, algorithm = self.algorithm)
    
    def decode_token(self, token:str) -> dict:
        """
        Decodifica y verifica un token JWT.
        
        Args:
            token: Token JWT a decodificar
            
        Returns:
            dict: Datos decodificados del token
            
        Raises:
            HTTPException: Si el token es inválido o ha expirado
        """
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except JWTError:
            raise HTTPException(
                status_code=401, 
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )

