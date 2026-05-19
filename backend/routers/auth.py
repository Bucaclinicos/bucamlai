import os
import secrets
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from db_models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "bucamlai-secret-2026")
ALGORITHM = "HS256"
TOKEN_MINUTES = 480

pwd_ctx = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _crear_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _get_mail_conf():
    username = os.getenv("MAIL_USERNAME", "")
    password = os.getenv("MAIL_PASSWORD", "")
    mail_from = os.getenv("MAIL_FROM", "")
    server = os.getenv("MAIL_SERVER", "")
    if not all([username, password, mail_from, server,
                "tu_correo" not in username, "tu_app" not in password]):
        return None
    try:
        from fastapi_mail import ConnectionConfig
        return ConnectionConfig(
            MAIL_USERNAME=username,
            MAIL_PASSWORD=password,
            MAIL_FROM=mail_from,
            MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
            MAIL_SERVER=server,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            MAIL_DEBUG=False,
        )
    except Exception:
        return None


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not user.is_active or not pwd_ctx.verify(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    token = _crear_token({"sub": user.username, "role": user.role, "nombre": user.nombre})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "nombre": user.nombre}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.strip().lower()).first()

    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        config = _get_mail_conf()
        if config:
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            reset_link = f"{frontend_url}/reset-password?token={token}"
            try:
                from fastapi_mail import FastMail, MessageSchema
                message = MessageSchema(
                    subject="Restablecimiento de contraseña - BUCAMLAI",
                    recipients=[user.email],
                    body=f"""
                    <html><body style="font-family:sans-serif;padding:20px;">
                    <h2 style="color:#C0392B;">BUCAMLAI — Restablecimiento de contraseña</h2>
                    <p>Hola <strong>{user.nombre}</strong>,</p>
                    <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón:</p>
                    <p style="margin:24px 0;">
                      <a href="{reset_link}"
                         style="background:#C0392B;color:#fff;padding:12px 24px;
                                text-decoration:none;border-radius:6px;font-weight:bold;">
                        Restablecer contraseña
                      </a>
                    </p>
                    <p>El enlace expira en <strong>1 hora</strong>.</p>
                    <p style="color:#999;font-size:12px;">
                      Si no solicitaste esto, puedes ignorar este correo.
                    </p>
                    </body></html>
                    """,
                    subtype="html",
                )
                fm = FastMail(config)
                await fm.send_message(message)
            except Exception:
                pass

    return {"message": "Si el correo existe, recibirás un enlace para restablecer tu contraseña"}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == body.token).first()
    if (not user
            or not user.reset_token_expires
            or user.reset_token_expires < datetime.utcnow()):
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    user.password_hash = pwd_ctx.hash(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Contraseña restablecida exitosamente"}
