from fastapi import APIRouter
from services.pareto import obtener_pareto

router = APIRouter()


@router.get("/abc")
def pareto_abc():
    """
    Analisis de Pareto / Clasificacion ABC.
    Clasifica los productos segun su aporte acumulado al ingreso total:
    - Categoria A: 80% de los ingresos (productos criticos)
    - Categoria B: siguiente 15% (productos importantes)
    - Categoria C: 5% restante (baja rotacion, riesgo de vencimiento)
    """
    return obtener_pareto()
