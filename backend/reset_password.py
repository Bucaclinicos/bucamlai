"""
Resetea la contraseña de un usuario directamente en la base de datos.
Uso:
    python reset_password.py <username> <nueva_contraseña>
Ejemplo:
    python reset_password.py admin admin123
"""
import sys
from passlib.context import CryptContext
from database import SessionLocal
from db_models import User

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def main():
    if len(sys.argv) != 3:
        print("Uso: python reset_password.py <username> <nueva_contraseña>")
        sys.exit(1)

    username = sys.argv[1]
    new_password = sys.argv[2]

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"[ERROR] No existe el usuario '{username}'")
            sys.exit(1)

        user.password_hash = pwd_context.hash(new_password)
        db.commit()
        print(f"[OK] Contraseña de '{username}' actualizada correctamente.")
        print(f"     Email: {user.email}  |  Rol: {user.role}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
