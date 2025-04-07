# auth_service.py
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.sql import select
from fastapi import HTTPException
from models import User
from auth.auth_handler import AuthHandler
import logging
import uuid
from schemas import UserCreate, UserUpdate, UserResponse, PasswordChange

# Configuración del logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.auth_handler = AuthHandler()

    def authenticate_user(self, email: str, password: str):
        """Autentica un usuario."""
        try:
            logger.debug(f"Iniciando autenticación para usuario: {email}")

            # Buscar usuario
            logger.debug("Ejecutando consulta para buscar usuario...")
            result = self.db.execute(
                select(User).where(User.email == email)
            )
            logger.debug(f"Resultado de la consulta: {result}")
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"Usuario no encontrado: {email}")
                raise HTTPException(
                    status_code=401,
                    detail="Credenciales incorrectas"
                )

            logger.debug(f"Usuario encontrado: {user.email}")
            logger.debug(f"Hash almacenado: {user.password_hash}")
            logger.debug(f"Verificando contraseña...")

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
            self.db.commit()

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
                "user_name": user.nombre_completo,
                "is_temporary_password": user.is_temporary_password  # Indicador de contraseña temporal
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error inesperado en authenticate_user: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error interno del servidor"
            )

    def create_user(self, user: UserCreate):
        """Crea un nuevo usuario con una contraseña temporal."""
        try:
            logger.debug(f"Creando usuario con email: {user.email}")

            # Verificar si el usuario ya existe
            existing_user = self.db.execute(
                select(User).where(User.email == user.email)
            ).scalar_one_or_none()
            if existing_user:
                logger.error(f"El email ya está registrado: {user.email}")
                raise HTTPException(
                    status_code=400,
                    detail="El email ya está registrado"
                )

            # Generar una contraseña temporal
            temporary_password = self.auth_handler.generate_temporary_password()
            password_hash = self.auth_handler.get_password_hash(temporary_password)

            # Crear el nuevo usuario
            new_user = User(
                id=uuid.uuid4(),
                email=user.email,
                password_hash=password_hash,
                nombre_completo=user.nombre_completo,
                rol=user.rol,
                activo=user.activo,
                is_temporary_password=True  # Marcar la contraseña como temporal
            )

            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)

            logger.info(f"Usuario creado con éxito: {new_user.email}")

            return {
                "user": UserResponse.from_orm(new_user),
                "temporary_password": temporary_password
            }
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al crear usuario: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error al crear el usuario"
            )

    def delete_user(self, user_id: str):
        """Elimina un usuario por su ID."""
        try:
            logger.debug(f"Eliminando usuario con ID: {user_id}")

            user = self.db.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()
            if not user:
                logger.error(f"Usuario no encontrado: {user_id}")
                raise HTTPException(
                    status_code=404,
                    detail="Usuario no encontrado"
                )

            self.db.delete(user)
            self.db.commit()

            logger.info(f"Usuario eliminado con éxito: {user_id}")

            return {"message": "Usuario eliminado correctamente"}
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al eliminar usuario: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error al eliminar el usuario"
            )

    def update_user(self, user_id: str, user_update: UserUpdate):
        """Actualiza los datos de un usuario."""
        try:
            logger.debug(f"Actualizando usuario con ID: {user_id}")

            user = self.db.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()
            if not user:
                logger.error(f"Usuario no encontrado: {user_id}")
                raise HTTPException(
                    status_code=404,
                    detail="Usuario no encontrado"
                )

            if user_update.nombre_completo is not None:
                user.nombre_completo = user_update.nombre_completo
            if user_update.rol is not None:
                user.rol = user_update.rol
            if user_update.activo is not None:
                user.activo = user_update.activo
            if user_update.password is not None:
                user.password_hash = self.auth_handler.get_password_hash(user_update.password)
                user.is_temporary_password = False  # Si se cambia la contraseña, ya no es temporal

            self.db.commit()
            self.db.refresh(user)

            logger.info(f"Usuario actualizado con éxito: {user_id}")

            return UserResponse.from_orm(user)
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al actualizar usuario: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error al actualizar el usuario"
            )

    def get_all_users(self):
        """Obtiene todos los usuarios."""
        try:
            logger.debug("Obteniendo todos los usuarios")

            result = self.db.execute(select(User))
            users = result.scalars().all()

            logger.info(f"Se encontraron {len(users)} usuarios")

            return [UserResponse.from_orm(user) for user in users]
        except Exception as e:
            logger.error(f"Error al obtener usuarios: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error al obtener los usuarios"
            )

    def change_password(self, user: User, password_change: PasswordChange):
        """Permite a un usuario cambiar su contraseña."""
        try:
            logger.debug(f"Cambiando contraseña para usuario: {user.email}")

            # Verificar la contraseña actual
            if not self.auth_handler.verify_password(password_change.current_password, user.password_hash):
                logger.error("Contraseña actual incorrecta")
                raise HTTPException(
                    status_code=401,
                    detail="Contraseña actual incorrecta"
                )

            # Actualizar la contraseña
            user.password_hash = self.auth_handler.get_password_hash(password_change.new_password)
            user.is_temporary_password = False  # La contraseña ya no es temporal
            user.ultimo_acceso = datetime.utcnow()
            self.db.commit()
            self.db.refresh(user)

            logger.info(f"Contraseña cambiada con éxito para usuario: {user.email}")

            return {"message": "Contraseña actualizada correctamente"}
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al cambiar contraseña: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Error al cambiar la contraseña"
            )