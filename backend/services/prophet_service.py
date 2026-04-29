"""
Servicio de predicción de demanda con Prophet + regresores externos de clima.
Cada medicamento tiene su propio modelo entrenado con:
  - Serie temporal de unidades vendidas por mes
  - Temperatura media mensual de Bucaramanga (Open-Meteo)
  - Precipitación mensual de Bucaramanga (Open-Meteo)
"""

import os
import re
import joblib
import numpy as np
import pandas as pd
from services.limpieza import obtener_df
from services.clima_service import (
    obtener_clima_historico_mensual,
    obtener_clima_futuro_mensual,
)

RUTA_MODELOS = os.path.join(os.path.dirname(__file__), "../models/prophet")

_modelos  = {}   # { medicamento: modelo_prophet }
_metricas = {}   # { medicamento: dict }
_periodos_entrenados = []

from services.constantes import MESES_MAP as _MESES_MAP


# ── Utilidades ──────────────────────────────────────────────────────────────

def _periodo_a_fecha(periodo: str) -> pd.Timestamp:
    partes = periodo.strip().upper().split("-")
    mes_str = partes[0]
    anio = int(partes[1]) if len(partes) > 1 else pd.Timestamp.now().year
    mes = _MESES_MAP.get(mes_str)
    if mes is None:
        try:
            mes = int(mes_str)
        except ValueError:
            mes = 1
    return pd.Timestamp(year=anio, month=mes, day=1)


def _slug(texto: str) -> str:
    return re.sub(r"[^\w]", "_", texto.strip())[:80]


def _construir_serie(df: pd.DataFrame, medicamento: str) -> pd.DataFrame:
    """Serie temporal mensual de un medicamento con columnas ds y y."""
    df_med = df[df["DESCRIPCION"] == medicamento].copy()
    if df_med.empty:
        return pd.DataFrame()
    df_med["ds"] = df_med["PERIODO"].apply(_periodo_a_fecha)
    return (
        df_med.groupby("ds")["UND_VEND"]
        .sum()
        .reset_index()
        .rename(columns={"UND_VEND": "y"})
        .sort_values("ds")
        .reset_index(drop=True)
    )


def _enriquecer_con_clima(serie: pd.DataFrame) -> pd.DataFrame:
    """
    Agrega columnas temp_media y precipitacion a la serie histórica.
    Consulta Open-Meteo para datos reales; usa climatología si falla.
    """
    if serie.empty:
        return serie

    fecha_inicio = serie["ds"].min().strftime("%Y-%m-%d")
    fecha_fin    = serie["ds"].max().strftime("%Y-%m-%d")

    df_clima = obtener_clima_historico_mensual(fecha_inicio, fecha_fin)

    if df_clima.empty:
        # Fallback: climatología por número de mes
        from services.clima_service import _CLIMATOLOGIA
        serie = serie.copy()
        serie["temp_media"]    = serie["ds"].dt.month.map(lambda m: _CLIMATOLOGIA[m]["temp"])
        serie["precipitacion"] = serie["ds"].dt.month.map(lambda m: float(_CLIMATOLOGIA[m]["precip"]))
        return serie

    df_clima["ds"] = pd.to_datetime(df_clima["ds"]).dt.to_period("M").dt.to_timestamp()
    serie = serie.copy()
    serie["ds_key"] = serie["ds"].dt.to_period("M").dt.to_timestamp()
    df_clima["ds_key"] = df_clima["ds"].dt.to_period("M").dt.to_timestamp()

    serie = serie.merge(
        df_clima[["ds_key", "temp_media", "precipitacion"]],
        on="ds_key", how="left"
    ).drop(columns=["ds_key"])

    # Rellenar huecos con climatología
    from services.clima_service import _CLIMATOLOGIA
    serie["temp_media"]    = serie["temp_media"].fillna(serie["ds"].dt.month.map(lambda m: _CLIMATOLOGIA[m]["temp"]))
    serie["precipitacion"] = serie["precipitacion"].fillna(serie["ds"].dt.month.map(lambda m: float(_CLIMATOLOGIA[m]["precip"])))

    return serie


# ── Entrenamiento ────────────────────────────────────────────────────────────

def _entrenar_modelo(serie: pd.DataFrame) -> tuple:
    """
    Entrena Prophet con regresores de clima (temp_media, precipitacion).
    Retorna (modelo, usa_clima: bool).
    """
    from prophet import Prophet

    tiene_clima = "temp_media" in serie.columns and serie["temp_media"].notna().all()

    modelo = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        changepoint_prior_scale=0.1,
    )

    if tiene_clima:
        modelo.add_regressor("temp_media",    standardize=True)
        modelo.add_regressor("precipitacion", standardize=True)

    modelo.fit(serie)
    return modelo, tiene_clima


def _calcular_metricas(modelo, serie: pd.DataFrame, usa_clima: bool) -> dict:
    n = len(serie)
    if n >= 6:
        try:
            from prophet.diagnostics import cross_validation, performance_metrics
            horizon  = "30 days"
            initial  = f"{max(int(n * 0.5), 2) * 30} days"
            period   = "30 days"
            df_cv = cross_validation(modelo, initial=initial, period=period, horizon=horizon, disable_tqdm=True)
            df_pm = performance_metrics(df_cv)
            return {
                "mae": round(float(df_pm["mae"].mean()), 4),
                "rmse": round(float(df_pm["rmse"].mean()), 4),
                "metodo": "cross_validation",
                "clima_incluido": usa_clima,
            }
        except Exception:
            pass

    futuro = modelo.make_future_dataframe(periods=0, freq="MS")
    if usa_clima:
        futuro = futuro.merge(
            serie[["ds", "temp_media", "precipitacion"]],
            on="ds", how="left"
        )
        from services.clima_service import _CLIMATOLOGIA
        futuro["temp_media"]    = futuro["temp_media"].fillna(futuro["ds"].dt.month.map(lambda m: _CLIMATOLOGIA[m]["temp"]))
        futuro["precipitacion"] = futuro["precipitacion"].fillna(futuro["ds"].dt.month.map(lambda m: float(_CLIMATOLOGIA[m]["precip"])))

    forecast = modelo.predict(futuro)
    y_pred = forecast["yhat"].values
    y_real = serie["y"].values
    n_min  = min(len(y_pred), len(y_real))
    return {
        "mae":  round(float(np.mean(np.abs(y_pred[:n_min] - y_real[:n_min]))), 4),
        "rmse": round(float(np.sqrt(np.mean((y_pred[:n_min] - y_real[:n_min]) ** 2))), 4),
        "metodo": "fitted_vs_real",
        "clima_incluido": usa_clima,
    }


# ── API pública ──────────────────────────────────────────────────────────────

def entrenar_todos(forzar: bool = False) -> dict:
    global _modelos, _metricas, _periodos_entrenados
    os.makedirs(RUTA_MODELOS, exist_ok=True)

    df = obtener_df()
    if df.empty or "DESCRIPCION" not in df.columns:
        return {"error": "No hay datos disponibles para entrenar."}

    _periodos_entrenados = sorted(df["PERIODO"].unique().tolist())
    medicamentos = df["DESCRIPCION"].unique().tolist()

    entrenados = omitidos = errores = 0

    for med in medicamentos:
        if not forzar and med in _modelos:
            omitidos += 1
            continue

        serie = _construir_serie(df, med)
        if len(serie) < 2:
            omitidos += 1
            continue

        try:
            serie = _enriquecer_con_clima(serie)
            modelo, usa_clima = _entrenar_modelo(serie)
            met = _calcular_metricas(modelo, serie, usa_clima)
            met["puntos_historicos"] = len(serie)

            _modelos[med]  = {"modelo": modelo, "usa_clima": usa_clima, "serie": serie}
            _metricas[med] = met

            joblib.dump({"modelo": modelo, "usa_clima": usa_clima, "serie": serie, "metricas": met},
                        os.path.join(RUTA_MODELOS, f"{_slug(med)}.pkl"))
            entrenados += 1
        except Exception:
            errores += 1

    mae_global  = round(sum(v["mae"]  for v in _metricas.values()) / len(_metricas), 4) if _metricas else 0
    rmse_global = round(sum(v["rmse"] for v in _metricas.values()) / len(_metricas), 4) if _metricas else 0

    return {
        "mensaje": "Entrenamiento Prophet + clima completado.",
        "modelos_entrenados": entrenados,
        "modelos_omitidos": omitidos,
        "errores": errores,
        "total_medicamentos": len(medicamentos),
        "periodos_incluidos": _periodos_entrenados,
        "total_periodos": len(_periodos_entrenados),
        "mae_promedio_global": mae_global,
        "rmse_promedio_global": rmse_global,
        "clima_integrado": True,
    }


def predecir(medicamento: str, meses: int) -> dict:
    global _modelos, _metricas

    df = obtener_df()
    if df.empty:
        return {"error": "No hay datos cargados en el sistema."}

    medicamentos_disponibles = df["DESCRIPCION"].unique().tolist()
    if medicamento not in medicamentos_disponibles:
        sugerencias = [m for m in medicamentos_disponibles if medicamento.upper() in m.upper()][:8]
        return {"error": f"Medicamento '{medicamento}' no encontrado.", "sugerencia": sugerencias}

    # Cargar desde disco si no está en memoria
    if medicamento not in _modelos:
        pkl_path = os.path.join(RUTA_MODELOS, f"{_slug(medicamento)}.pkl")
        if os.path.exists(pkl_path):
            datos = joblib.load(pkl_path)
            _modelos[medicamento]  = datos
            _metricas[medicamento] = datos["metricas"]
        else:
            serie = _construir_serie(df, medicamento)
            if len(serie) < 2:
                return {"error": f"'{medicamento}' tiene solo {len(serie)} período(s). Mínimo 2 para predecir."}
            os.makedirs(RUTA_MODELOS, exist_ok=True)
            serie = _enriquecer_con_clima(serie)
            modelo, usa_clima = _entrenar_modelo(serie)
            met = _calcular_metricas(modelo, serie, usa_clima)
            met["puntos_historicos"] = len(serie)
            _modelos[medicamento]  = {"modelo": modelo, "usa_clima": usa_clima, "serie": serie}
            _metricas[medicamento] = met
            joblib.dump({"modelo": modelo, "usa_clima": usa_clima, "serie": serie, "metricas": met},
                        os.path.join(RUTA_MODELOS, f"{_slug(medicamento)}.pkl"))

    datos_med = _modelos[medicamento]
    modelo    = datos_med["modelo"]
    usa_clima = datos_med["usa_clima"]
    serie_hist = datos_med.get("serie")
    if serie_hist is None or (hasattr(serie_hist, "empty") and serie_hist.empty):
        serie_hist = _construir_serie(df, medicamento)
    met        = _metricas[medicamento]

    # Obtener clima futuro para los meses a predecir
    ultima_fecha = serie_hist["ds"].max()
    fecha_inicio_pred = ultima_fecha + pd.DateOffset(months=1)
    df_clima_futuro = obtener_clima_futuro_mensual(fecha_inicio_pred, meses)

    # Construir DataFrame futuro para Prophet
    futuro = modelo.make_future_dataframe(periods=meses, freq="MS")
    if usa_clima:
        # Clima histórico del entrenamiento
        clima_hist = serie_hist[["ds", "temp_media", "precipitacion"]].copy()
        clima_hist["ds"] = clima_hist["ds"].dt.to_period("M").dt.to_timestamp()

        # Clima futuro
        if not df_clima_futuro.empty:
            clima_fut = df_clima_futuro[["ds", "temp_media", "precipitacion"]].copy()
            clima_fut["ds"] = pd.to_datetime(clima_fut["ds"]).dt.to_period("M").dt.to_timestamp()
        else:
            from services.clima_service import _CLIMATOLOGIA
            clima_fut = pd.DataFrame([{
                "ds": (fecha_inicio_pred + pd.DateOffset(months=i)).to_period("M").to_timestamp(),
                "temp_media": _CLIMATOLOGIA[(fecha_inicio_pred + pd.DateOffset(months=i)).month]["temp"],
                "precipitacion": float(_CLIMATOLOGIA[(fecha_inicio_pred + pd.DateOffset(months=i)).month]["precip"]),
            } for i in range(meses)])

        clima_total = pd.concat([clima_hist, clima_fut], ignore_index=True)
        clima_total["ds"] = clima_total["ds"].dt.to_period("M").dt.to_timestamp()
        futuro["ds_key"] = futuro["ds"].dt.to_period("M").dt.to_timestamp()
        clima_total["ds_key"] = clima_total["ds"]
        futuro = futuro.merge(clima_total[["ds_key", "temp_media", "precipitacion"]], on="ds_key", how="left").drop(columns=["ds_key"])

        from services.clima_service import _CLIMATOLOGIA
        futuro["temp_media"]    = futuro["temp_media"].fillna(futuro["ds"].dt.month.map(lambda m: _CLIMATOLOGIA[m]["temp"]))
        futuro["precipitacion"] = futuro["precipitacion"].fillna(futuro["ds"].dt.month.map(lambda m: float(_CLIMATOLOGIA[m]["precip"])))

    forecast = modelo.predict(futuro)
    forecast_futuro = forecast[forecast["ds"] > ultima_fecha].head(meses)
    if forecast_futuro.empty:
        forecast_futuro = forecast.tail(meses)

    # Construir respuesta de predicciones
    from services.clima_service import _TEMPORADA_MES, _impacto_farmaceutico
    predicciones = []
    total_unidades = 0

    for i, (_, row) in enumerate(forecast_futuro.iterrows()):
        uds     = max(0, round(float(row["yhat"]), 1))
        uds_min = max(0, round(float(row["yhat_lower"]), 1))
        uds_max = max(0, round(float(row["yhat_upper"]), 1))
        total_unidades += uds
        mes_num = row["ds"].month

        clima_mes = {}
        if not df_clima_futuro.empty and i < len(df_clima_futuro):
            fila_clima = df_clima_futuro.iloc[i]
            es_pron = fila_clima.get("es_pronostico", True)
            clima_mes = {
                "temp_media": round(float(fila_clima["temp_media"]), 1),
                "precipitacion": round(float(fila_clima["precipitacion"]), 1),
                "temporada": str(_TEMPORADA_MES[mes_num]["temporada"]),
                "temporada_label": str(_TEMPORADA_MES[mes_num]["label"]),
                "temporada_emoji": str(_TEMPORADA_MES[mes_num]["emoji"]),
                "es_pronostico": bool(es_pron) if not isinstance(es_pron, bool) else es_pron,
            }

        predicciones.append({
            "mes": row["ds"].strftime("%B %Y"),
            "unidades": uds,
            "minimo": uds_min,
            "maximo": uds_max,
            "clima": clima_mes,
        })

    # Historial con clima
    historial = []
    for _, row in serie_hist.iterrows():
        entrada = {
            "mes": row["ds"].strftime("%B %Y"),
            "unidades_reales": round(float(row["y"]), 1),
        }
        if "temp_media" in row and pd.notna(row["temp_media"]):
            mes_num = row["ds"].month
            entrada["clima"] = {
                "temp_media": round(float(row["temp_media"]), 1),
                "precipitacion": round(float(row["precipitacion"]), 1),
                "temporada": _TEMPORADA_MES[mes_num]["temporada"],
                "temporada_emoji": _TEMPORADA_MES[mes_num]["emoji"],
            }
        historial.append(entrada)

    # Temporada dominante en el período predicho
    meses_pred = [p["mes"] for p in predicciones]
    temporadas_pred = [_TEMPORADA_MES[forecast_futuro.iloc[i]["ds"].month]["temporada"] for i in range(len(predicciones))]
    temporada_dominante = max(set(temporadas_pred), key=temporadas_pred.count) if temporadas_pred else "seca"

    resultado = {
        "medicamento": medicamento,
        "meses_predichos": meses,
        "total_unidades_predichas": round(total_unidades, 1),
        "promedio_mensual": round(total_unidades / meses, 1) if meses > 0 else 0,
        "predicciones": predicciones,
        "historial": historial,
        "clima_contexto": {
            "ciudad": "Bucaramanga, Colombia",
            "temporada_dominante": temporada_dominante,
            "temporada_label": _TEMPORADA_MES[forecast_futuro.iloc[0]["ds"].month]["label"] if not forecast_futuro.empty else "",
            "temporada_emoji": _TEMPORADA_MES[forecast_futuro.iloc[0]["ds"].month]["emoji"] if not forecast_futuro.empty else "",
            "impacto": _impacto_farmaceutico(temporada_dominante, 0),
            "clima_usado_en_modelo": usa_clima,
        },
        "metricas_modelo": {
            **met,
            "mae_aceptable": met.get("mae", 99) < 10,
            "rmse_aceptable": met.get("rmse", 99) < 20,
            "periodos_entrenamiento": len(serie_hist),
        },
        "modelo": "Prophet + Clima",
    }
    return _limpiar_numpy(resultado)


def _limpiar_numpy(obj):
    """Convierte recursivamente tipos numpy a tipos Python nativos."""
    if isinstance(obj, dict):
        return {k: _limpiar_numpy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_limpiar_numpy(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj


def reentrenar() -> dict:
    global _modelos, _metricas
    _modelos  = {}
    _metricas = {}
    return entrenar_todos(forzar=True)


def obtener_medicamentos() -> list:
    df = obtener_df()
    if df.empty or "DESCRIPCION" not in df.columns:
        return []
    return sorted(df["DESCRIPCION"].unique().tolist())
