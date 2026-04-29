from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from services.gemini_service import consultar

router = APIRouter()


class Pregunta(BaseModel):
    pregunta: str
    periodos_filtro: Optional[List[str]] = None


@router.post("/consulta")
def consulta(body: Pregunta):
    return consultar(body.pregunta, body.periodos_filtro)
