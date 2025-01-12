import bcrypt

password = "contraseña_prueba"  # Cambia esto por la contraseña que deseas hashear
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
print(f"Hash generado: {hashed.decode('utf-8')}")