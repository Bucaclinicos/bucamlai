import json
from pathlib import Path
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "bucamlai-secret-2026"
ALGORITHM = "HS256"
TOKEN_MINUTES = 480  # 8 horas

pwd_ctx = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

USUARIOS_PATH = Path(__file__).parent.parent / "usuarios.json"

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


def _cargar_usuarios():
    return json.loads(USUARIOS_PATH.read_text(encoding="utf-8"))


def _crear_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login")
def login(body: LoginRequest):
    usuarios = _cargar_usuarios()
    usuario = next((u for u in usuarios if u["username"] == body.username), None)

    if not usuario or not pwd_ctx.verify(body.password, usuario["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    token = _crear_token({"sub": usuario["username"], "role": usuario["role"], "nombre": usuario["nombre"]})
    return {"access_token": token, "token_type": "bearer", "role": usuario["role"], "nombre": usuario["nombre"]}
