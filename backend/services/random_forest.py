import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from services.limpieza import obtener_df

RUTA_MODELOS = os.path.join(os.path.dirname(__file__), "../models")
PKL_MODELO   = os.path.join(RUTA_MODELOS, "random_forest.pkl")
PKL_ENC_MED  = os.path.join(RUTA_MODELOS, "encoder_medicamento.pkl")
PKL_ENC_TEMP = os.path.join(RUTA_MODELOS, "encoder_temporada.pkl")
PKL_ENC_PER  = os.path.join(RUTA_MODELOS, "encoder_periodo.pkl")
PKL_METRICAS = os.path.join(RUTA_MODELOS, "rf_metricas.pkl")

_modelo = None
_encoder_medicamento = None
_encoder_temporada = None
_encoder_periodo = None
_metricas = {}


def _entrenar_y_guardar():
    global _modelo, _encoder_medicamento, _encoder_temporada, _encoder_periodo, _metricas

    os.makedirs(RUTA_MODELOS, exist_ok=True)

    df = obtener_df()

    cols_requeridas = {"DESCRIPCION", "UND_VEND"}
    if not cols_requeridas.issubset(df.columns):
        return

    df = df[df["UND_VEND"] > 0].copy()

    # TEMPORADA: si no existe en el dataset se asigna "normal"
    if "TEMPORADA" not in df.columns:
        df["TEMPORADA"] = "normal"

    # PERIODO: si no existe se asigna "DESCONOCIDO"
    if "PERIODO" not in df.columns:
        df["PERIODO"] = "DESCONOCIDO"

    _encoder_medicamento = LabelEncoder()
    _encoder_temporada   = LabelEncoder()
    _encoder_periodo     = LabelEncoder()

    df["MED_ENC"]  = _encoder_medicamento.fit_transform(df["DESCRIPCION"].astype(str))
    df["TEMP_ENC"] = _encoder_temporada.fit_transform(df["TEMPORADA"].astype(str))
    df["PER_ENC"]  = _encoder_periodo.fit_transform(df["PERIODO"].astype(str))

    X = df[["MED_ENC", "TEMP_ENC", "PER_ENC"]]
    y = df["UND_VEND"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    _modelo = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    _modelo.fit(X_train, y_train)

    predicciones = _modelo.predict(X_test)
    mae  = round(float(mean_absolute_error(y_test, predicciones)), 4)
    rmse = round(float(np.sqrt(mean_squared_error(y_test, predicciones))), 4)

    periodos_entrenados = sorted(df["PERIODO"].unique().tolist())

    _metricas = {
        "mae": mae,
        "rmse": rmse,
        "mae_aceptable": mae < 10,
        "rmse_aceptable": rmse < 20,
        "registros_entrenamiento": len(X_train),
        "registros_prueba": len(X_test),
        "periodos_incluidos": periodos_entrenados,
        "total_periodos": len(periodos_entrenados),
    }

    joblib.dump(_modelo,              PKL_MODELO)
    joblib.dump(_encoder_medicamento, PKL_ENC_MED)
    joblib.dump(_encoder_temporada,   PKL_ENC_TEMP)
    joblib.dump(_encoder_periodo,     PKL_ENC_PER)
    joblib.dump(_metricas,            PKL_METRICAS)


def _cargar_o_entrenar():
    global _modelo, _encoder_medicamento, _encoder_temporada, _encoder_periodo, _metricas

    if os.path.exists(PKL_MODELO) and os.path.exists(PKL_ENC_PER):
        _modelo              = joblib.load(PKL_MODELO)
        _encoder_medicamento = joblib.load(PKL_ENC_MED)
        _encoder_temporada   = joblib.load(PKL_ENC_TEMP)
        _encoder_periodo     = joblib.load(PKL_ENC_PER)
        _metricas            = joblib.load(PKL_METRICAS)
    else:
        _entrenar_y_guardar()


def reentrenar() -> dict:
    _entrenar_y_guardar()
    return {"mensaje": "Modelo Random Forest reentrenado.", "metricas": _metricas}


def predecir_demanda(medicamento: str, meses: int, temporada: str, periodo: str = None) -> dict:
    global _modelo, _encoder_medicamento, _encoder_temporada, _encoder_periodo

    if _modelo is None:
        _cargar_o_entrenar()

    if _modelo is None:
        return {"error": "No se pudo cargar ni entrenar el modelo."}

    clases_med = list(_encoder_medicamento.classes_)
    if medicamento not in clases_med:
        return {
            "error": f"Medicamento '{medicamento}' no encontrado.",
            "sugerencia": clases_med[:10],
        }

    clases_temp = list(_encoder_temporada.classes_)
    temp_entrada = temporada if temporada in clases_temp else clases_temp[0]

    clases_per = list(_encoder_periodo.classes_)
    # Si no se pasa período, usar el último disponible (más reciente)
    if periodo and periodo.upper() in clases_per:
        per_entrada = periodo.upper()
    else:
        per_entrada = clases_per[-1]

    med_enc  = _encoder_medicamento.transform([medicamento])[0]
    temp_enc = _encoder_temporada.transform([temp_entrada])[0]
    per_enc  = _encoder_periodo.transform([per_entrada])[0]

    pred_mes   = float(_modelo.predict([[med_enc, temp_enc, per_enc]])[0])
    pred_total = round(pred_mes * meses, 2)

    return {
        "medicamento": medicamento,
        "temporada": temporada,
        "periodo_referencia": per_entrada,
        "meses": meses,
        "unidades_predichas_por_mes": round(pred_mes, 2),
        "unidades_predichas_total": pred_total,
        "metricas_modelo": _metricas,
    }
