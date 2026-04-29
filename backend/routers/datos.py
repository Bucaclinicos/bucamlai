import re
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.limpieza import cargar_y_limpiar, obtener_resumen, obtener_periodos, invalidar_cache
from services.random_forest import reentrenar as rf_reentrenar
from services.kmeans import reentrenar as km_reentrenar

router = APIRouter()

# Formato esperado: NOMBRE_MES-ANIO  (ej: AGOSTO-2025, ENERO-2026)
_RE_PERIODO = re.compile(
    r"^(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)-\d{4}$"
)


@router.post("/cargar")
async def cargar_archivo(
    archivo: UploadFile = File(...),
    periodo: str = Form(...),
):
    """
    Sube un CSV o Excel de un período y lo acumula al dataset histórico.
    El parámetro 'periodo' identifica el mes/año (ej: 'AGOSTO-2025').
    Si el período ya existe, sus registros se reemplazan.
    Después de acumular, re-entrena automáticamente Random Forest y KMeans.
    Prophet se reentrena bajo demanda en la primera predicción del medicamento.
    """
    if not archivo.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV o Excel (.csv o .xlsx)")

    periodo_norm = periodo.strip().upper()
    if not periodo_norm:
        raise HTTPException(status_code=400, detail="El parámetro 'periodo' es obligatorio")
    if not _RE_PERIODO.match(periodo_norm):
        raise HTTPException(
            status_code=400,
            detail=f"Formato de período inválido: '{periodo_norm}'. Use MES-AÑO, ej: AGOSTO-2025"
        )

    contenido = await archivo.read()
    resultado = cargar_y_limpiar(contenido, archivo.filename, periodo_norm)

    # Invalidar cache y reentrenar RF + KMeans con el acumulado nuevo.
    # Prophet NO se reentrena aquí porque puede tardar varios minutos
    # (1.593 modelos individuales). Se reentrena bajo demanda en la primera
    # predicción de cada medicamento.
    invalidar_cache()
    rf = rf_reentrenar()
    km = km_reentrenar()

    resultado["reentrenamiento"] = {
        "random_forest": rf.get("metricas", {}),
        "kmeans": km.get("silhouette_score", None),
        "prophet": {
            "nota": "Se reentrena bajo demanda en la primera predicción de cada medicamento."
        },
    }

    return resultado


@router.get("/resumen")
def resumen():
    return obtener_resumen()


@router.get("/periodos")
def periodos():
    """Lista todos los períodos cargados con su cantidad de registros."""
    return {"periodos": obtener_periodos()}
