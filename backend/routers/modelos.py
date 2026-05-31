import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.random_forest import predecir_demanda, reentrenar as rf_reentrenar
from services.kmeans import obtener_clusters, reentrenar as km_reentrenar
from services.prophet_service import predecir as prophet_predecir, reentrenar as prophet_reentrenar, obtener_medicamentos

router = APIRouter()


class SolicitudPrediccion(BaseModel):
    medicamento: str
    meses: int = Field(default=1, ge=1, le=24)
    temporada: str = "normal"
    usar_prophet: bool = True


@router.post("/prediccion")
def prediccion(solicitud: SolicitudPrediccion):
    try:
        if solicitud.usar_prophet:
            return prophet_predecir(solicitud.medicamento, solicitud.meses)
        return predecir_demanda(solicitud.medicamento, solicitud.meses, solicitud.temporada)
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR /prediccion] {e}\n{tb}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": tb})


@router.get("/medicamentos")
def medicamentos():
    """Lista todos los medicamentos disponibles en el dataset."""
    return {"medicamentos": obtener_medicamentos()}


@router.get("/clusters")
def clusters():
    return obtener_clusters()


@router.post("/reentrenar")
def reentrenar():
    """Re-entrena Random Forest, KMeans y Prophet con el dataset acumulado."""
    rf = rf_reentrenar()
    km = km_reentrenar()
    prophet = prophet_reentrenar()
    return {"random_forest": rf, "kmeans": km, "prophet": prophet}
