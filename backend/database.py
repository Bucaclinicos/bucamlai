import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bucamlai")

from sqlalchemy.pool import NullPool

connect_args = {"sslmode": "require"} if "clever-cloud.com" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, poolclass=NullPool)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
