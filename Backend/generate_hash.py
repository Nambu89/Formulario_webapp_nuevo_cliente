import bcrypt

password = "contraseña_temporal_hash"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
print(f"Hash generado: {hashed.decode('utf-8')}")