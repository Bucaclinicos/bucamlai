import uuid
import os
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv

from database import get_db
from db_models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "bucamlai-secret-2026")
ALGORITHM = "HS256"
VALID_ROLES = ["admin", "analista"]

pwd_ctx = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

router = APIRouter()


def require_admin(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Acceso denegado: se requiere rol admin")
        user = db.query(User).filter(User.username == payload.get("sub")).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Sesión inválida")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


class CreateUserRequest(BaseModel):
    username: str
    email: str
    nombre: str
    password: str
    role: str


class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    nombre: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


def _user_to_dict(u: User) -> dict:
    return {
        "id": str(u.id),
        "username": u.username,
        "email": u.email,
        "nombre": u.nombre,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("/users")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at).all()
    return [_user_to_dict(u) for u in users]


@router.post("/users", status_code=201)
def create_user(
    body: CreateUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Permitidos: {', '.join(VALID_ROLES)}")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    if db.query(User).filter(User.username == body.username.strip()).first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    if db.query(User).filter(User.email == body.email.strip().lower()).first():
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

    new_user = User(
        username=body.username.strip(),
        email=body.email.strip().lower(),
        nombre=body.nombre.strip(),
        password_hash=pwd_ctx.hash(body.password),
        role=body.role,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Usuario creado exitosamente", "id": str(new_user.id)}


@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    body: UpdateUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if body.email is not None:
        email_lower = body.email.strip().lower()
        if db.query(User).filter(User.email == email_lower, User.id != uid).first():
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
        user.email = email_lower

    if body.nombre is not None:
        user.nombre = body.nombre.strip()

    if body.role is not None:
        if body.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Rol inválido. Permitidos: {', '.join(VALID_ROLES)}")
        user.role = body.role

    if body.is_active is not None:
        if not body.is_active and user.username == admin.username:
            raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")
        user.is_active = body.is_active

    if body.password is not None:
        if len(body.password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        user.password_hash = pwd_ctx.hash(body.password)

    db.commit()
    return {"message": "Usuario actualizado exitosamente"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de usuario inválido")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.username == admin.username:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")

    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado exitosamente"}
