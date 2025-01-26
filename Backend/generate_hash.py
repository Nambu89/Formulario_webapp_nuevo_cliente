import bcrypt

def generate_test_hash():
    password = "contraseña_prueba"  # La contraseña que usarás para pruebas
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

if __name__ == "__main__":
    hash_generado = generate_test_hash()
    print(f"Contraseña de prueba: contraseña_prueba")
    print(f"Hash generado: {hash_generado}")