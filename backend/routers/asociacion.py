from fastapi import APIRouter
from services.apriori import obtener_reglas

router = APIRouter()


@router.get("/reglas")
def reglas():
    return obtener_reglas()
