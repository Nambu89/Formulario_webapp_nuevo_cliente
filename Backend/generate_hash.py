from passlib.context import CryptContext

# Configuración del contexto de hash (igual que en auth_handler.py)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

# Contraseña que estás usando en el frontend
password = "contraseña123"

# Genera el hash de la contraseña
password_hash = pwd_context.hash(password)
print(f"Hash de la contraseña '{password}': {password_hash}")