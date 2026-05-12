"""
Ejecutar una sola vez para crear tablas e insertar usuarios por defecto:
    python init_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from database import engine, Base, SessionLocal
from db_models import User
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def init_db():
    print("Creando tablas en PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas.")

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                email="admin@bucamlai.com",
                nombre="Administrador",
                password_hash=pwd_ctx.hash("admin123"),
                role="admin",
            ))
            print("Usuario 'admin' creado  (pass: admin123)")

        if not db.query(User).filter(User.username == "analista").first():
            db.add(User(
                username="analista",
                email="analista@bucamlai.com",
                nombre="Analista",
                password_hash=pwd_ctx.hash("analista123"),
                role="analista",
            ))
            print("Usuario 'analista' creado  (pass: analista123)")

        db.commit()
        print("\nBase de datos inicializada correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
