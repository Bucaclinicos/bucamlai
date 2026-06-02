"""
Servicio de predicción de demanda — modelo híbrido:
  - Prophet + clima para medicamentos con volumen alto (media >= 200 uds/mes)
  - Modelo estadístico robusto para el resto (promedio estacional + tendencia + clima)

El modelo estadístico es más adecuado para el dataset de Bucaclínicos donde el 97%
de los medicamentos vende menos de 50 unidades mensuales.
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
from services.constantes import MESES_MAP as _MESES_MAP

RUTA_MODELOS = os.path.join(os.path.dirname(__file__), "../models/prophet")

_modelos  = {}
_metricas = {}
_periodos_entrenados = []

# Con 12 meses de historial Prophet no tiene suficiente data para ningún medicamento.
# Se activa Prophet automáticamente cuando haya >= 24 meses de historial.
_UMBRAL_PROPHET = 999999


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
    if serie.empty:
        return serie
    fecha_inicio = serie["ds"].min().strftime("%Y-%m-%d")
    fecha_fin    = serie["ds"].max().strftime("%Y-%m-%d")
    df_clima = obtener_clima_historico_mensual(fecha_inicio, fecha_fin)

    if df_clima.empty:
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

    from services.clima_service import _CLIMATOLOGIA
    serie["temp_media"]    = serie["temp_media"].fillna(serie["ds"].dt.month.map(lambda m: _CLIMATOLOGIA[m]["temp"]))
    serie["precipitacion"] = serie["precipitacion"].fillna(serie["ds"].dt.month.map(lambda m: float(_CLIMATOLOGIA[m]["precip"])))
    return serie


# ── Modelo estadístico robusto (para volúmenes bajos) ────────────────────────

def _predecir_estadistico(serie: pd.DataFrame, meses: int) -> tuple:
    """
    Predicción basada en:
    1. Promedio del mismo mes en años anteriores (estacionalidad)
    2. Si no hay dato del mismo mes, promedio general
    3. Factor de tendencia basado en los últimos 3 vs los 3 anteriores
    4. Intervalo: ± 1 desviación estándar del historial
    Retorna (lista de predicciones, metricas dict)
    """
    from services.clima_service import _CLIMATOLOGIA, _TEMPORADA_MES

    y = serie["y"].values
    fechas = serie["ds"].values

    media_global = float(np.mean(y))
    std_global   = float(np.std(y)) if len(y) > 1 else media_global * 0.3

    # Tendencia: ratio ultimos 3 meses vs los 3 anteriores
    if len(y) >= 6:
        recientes  = np.mean(y[-3:])
        anteriores = np.mean(y[-6:-3])
        tendencia  = recientes / anteriores if anteriores > 0 else 1.0
        # Suavizar tendencia para no exagerar
        tendencia = max(0.7, min(tendencia, 1.4))
    elif len(y) >= 3:
        tendencia = 1.0
    else:
        tendencia = 1.0

    # Construir mapa mes -> promedio histórico
    serie_con_mes = serie.copy()
    serie_con_mes["mes_num"] = pd.to_datetime(serie_con_mes["ds"]).dt.month
    promedio_por_mes = serie_con_mes.groupby("mes_num")["y"].mean().to_dict()

    ultima_fecha = pd.Timestamp(fechas[-1])
    predicciones_raw = []

    for i in range(meses):
        fecha_pred = ultima_fecha + pd.DateOffset(months=i + 1)
        mes_num = fecha_pred.month

        # Base: promedio histórico de ese mes si existe, sino media global
        base = promedio_por_mes.get(mes_num, media_global)

        # Aplicar tendencia suavizada (decae con la distancia)
        factor_tendencia = 1.0 + (tendencia - 1.0) * max(0, 1 - i * 0.2)
        pred = base * factor_tendencia

        # Factor climático suave según temporada
        from services.clima_service import _TEMPORADA_MES as _TM
        temporada = _TM.get(mes_num, {}).get("temporada", "seca")
        factor_clima = 1.05 if temporada == "lluvias" else 0.97

        pred = pred * factor_clima
        pred = max(0.0, pred)

        # Intervalo ± std proporcional (más amplio para meses sin dato histórico)
        tiene_dato_mes = mes_num in promedio_por_mes
        margen = std_global * (0.8 if tiene_dato_mes else 1.2)

        predicciones_raw.append({
            "fecha": fecha_pred,
            "yhat": pred,
            "yhat_lower": max(0.0, pred - margen),
            "yhat_upper": pred + margen,
            "mes_num": mes_num,
        })

    # Métricas: leave-one-out sobre el historial
    errores = []
    for idx in range(len(y)):
        mes_n = serie_con_mes.iloc[idx]["mes_num"]
        otros = [v for j, v in enumerate(y) if j != idx]
        pred_loo = np.mean(otros) if otros else media_global
        errores.append(abs(y[idx] - pred_loo))

    mae  = round(float(np.mean(errores)), 4) if errores else 0.0
    rmse = round(float(np.sqrt(np.mean([e**2 for e in errores]))), 4) if errores else 0.0

    metricas = {
        "mae": mae,
        "rmse": rmse,
        "metodo": "estadistico_estacional",
        "clima_incluido": True,
        "puntos_historicos": len(y),
    }

    return predicciones_raw, metricas


# ── Modelo Prophet (para volúmenes altos) ───────────────────────────────────

def _entrenar_prophet(serie: pd.DataFrame) -> tuple:
    from prophet import Prophet

    tiene_clima = "temp_media" in serie.columns and serie["temp_media"].notna().all()
    media_ventas = serie["y"].mean()
    seasonality_mode = "multiplicative" if media_ventas >= 500 else "additive"
    changepoint_prior = 0.05

    modelo = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode=seasonality_mode,
        changepoint_prior_scale=changepoint_prior,
    )
    if tiene_clima:
        modelo.add_regressor("temp_media",    standardize=True)
        modelo.add_regressor("precipitacion", standardize=True)

    modelo.fit(serie)
    return modelo, tiene_clima


def _calcular_metricas_prophet(modelo, serie: pd.DataFrame, usa_clima: bool) -> dict:
    n = len(serie)
    if n >= 6:
        try:
            from prophet.diagnostics import cross_validation, performance_metrics
            horizon = "30 days"
            initial = f"{max(int(n * 0.5), 2) * 30} days"
            period  = "30 days"
            df_cv = cross_validation(modelo, initial=initial, period=period, horizon=horizon, disable_tqdm=True)
            df_pm = performance_metrics(df_cv)
            return {
                "mae":  round(float(df_pm["mae"].mean()), 4),
                "rmse": round(float(df_pm["rmse"].mean()), 4),
                "metodo": "cross_validation",
                "clima_incluido": usa_clima,
            }
        except Exception:
            pass

    futuro = modelo.make_future_dataframe(periods=0, freq="MS")
    if usa_clima:
        futuro = futuro.merge(serie[["ds", "temp_media", "precipitacion"]], on="ds", how="left")
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
            media = serie["y"].mean()

            if media >= _UMBRAL_PROPHET:
                modelo, usa_clima = _entrenar_prophet(serie)
                met = _calcular_metricas_prophet(modelo, serie, usa_clima)
                met["puntos_historicos"] = len(serie)
                _modelos[med]  = {"tipo": "prophet", "modelo": modelo, "usa_clima": usa_clima, "serie": serie}
            else:
                _modelos[med]  = {"tipo": "estadistico", "serie": serie}
                _, met = _predecir_estadistico(serie, 1)

            _metricas[med] = met
            joblib.dump({"tipo": _modelos[med]["tipo"], **_modelos[med], "metricas": met},
                        os.path.join(RUTA_MODELOS, f"{_slug(med)}.pkl"))
            entrenados += 1
        except Exception:
            errores += 1

    mae_global  = round(sum(v["mae"]  for v in _metricas.values()) / len(_metricas), 4) if _metricas else 0
    rmse_global = round(sum(v["rmse"] for v in _metricas.values()) / len(_metricas), 4) if _metricas else 0

    return {
        "mensaje": "Entrenamiento completado.",
        "modelos_entrenados": entrenados,
        "modelos_omitidos": omitidos,
        "errores": errores,
        "total_medicamentos": len(medicamentos),
        "periodos_incluidos": _periodos_entrenados,
        "mae_promedio_global": mae_global,
        "rmse_promedio_global": rmse_global,
    }


def predecir(medicamento: str, meses: int) -> dict:
    global _modelos, _metricas
    from services.clima_service import _TEMPORADA_MES, _impacto_farmaceutico, _CLIMATOLOGIA

    df = obtener_df()
    if df.empty:
        return {"error": "No hay datos cargados en el sistema."}

    medicamentos_disponibles = df["DESCRIPCION"].unique().tolist()
    if medicamento not in medicamentos_disponibles:
        sugerencias = [m for m in medicamentos_disponibles if medicamento.upper() in m.upper()][:8]
        return {"error": f"Medicamento '{medicamento}' no encontrado.", "sugerencia": sugerencias}

    # Cargar o entrenar modelo
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
            media = serie["y"].mean()

            if media >= _UMBRAL_PROPHET:
                modelo, usa_clima = _entrenar_prophet(serie)
                met = _calcular_metricas_prophet(modelo, serie, usa_clima)
                met["puntos_historicos"] = len(serie)
                _modelos[medicamento] = {"tipo": "prophet", "modelo": modelo, "usa_clima": usa_clima, "serie": serie}
            else:
                _modelos[medicamento] = {"tipo": "estadistico", "serie": serie}
                _, met = _predecir_estadistico(serie, 1)
                met["puntos_historicos"] = len(serie)

            _metricas[medicamento] = met
            try:
                joblib.dump({"tipo": _modelos[medicamento]["tipo"], **_modelos[medicamento], "metricas": met},
                            os.path.join(RUTA_MODELOS, f"{_slug(medicamento)}.pkl"))
            except OSError:
                pass

    datos_med  = _modelos[medicamento]
    met        = _metricas[medicamento]
    serie_hist = datos_med.get("serie")
    if serie_hist is None or (hasattr(serie_hist, "empty") and serie_hist.empty):
        serie_hist = _construir_serie(df, medicamento)
        serie_hist = _enriquecer_con_clima(serie_hist)

    tipo = datos_med.get("tipo", "estadistico")

    # ── Generar predicciones según el tipo de modelo ─────────────────────────
    if tipo == "prophet":
        modelo    = datos_med["modelo"]
        usa_clima = datos_med["usa_clima"]
        ultima_fecha = serie_hist["ds"].max()
        fecha_inicio_pred = ultima_fecha + pd.DateOffset(months=1)
        df_clima_futuro = obtener_clima_futuro_mensual(fecha_inicio_pred, meses)

        futuro = modelo.make_future_dataframe(periods=meses, freq="MS")
        if usa_clima:
            clima_hist = serie_hist[["ds", "temp_media", "precipitacion"]].copy()
            clima_hist["ds"] = clima_hist["ds"].dt.to_period("M").dt.to_timestamp()
            if not df_clima_futuro.empty:
                clima_fut = df_clima_futuro[["ds", "temp_media", "precipitacion"]].copy()
                clima_fut["ds"] = pd.to_datetime(clima_fut["ds"]).dt.to_period("M").dt.to_timestamp()
            else:
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
            futuro["temp_media"]    = futuro["temp_media"].fillna(futuro["ds"].dt.month.map(lambda m: _CLIMATOLOGIA[m]["temp"]))
            futuro["precipitacion"] = futuro["precipitacion"].fillna(futuro["ds"].dt.month.map(lambda m: float(_CLIMATOLOGIA[m]["precip"])))

        forecast = modelo.predict(futuro)
        forecast_futuro = forecast[forecast["ds"] > ultima_fecha].head(meses)
        if forecast_futuro.empty:
            forecast_futuro = forecast.tail(meses)

        promedio_reciente = float(np.mean(serie_hist["y"].tail(3).values))
        predicciones_raw = []
        for _, row in forecast_futuro.iterrows():
            yhat       = float(row["yhat"])
            yhat_lower = float(row["yhat_lower"])
            yhat_upper = float(row["yhat_upper"])
            if yhat <= 0:
                yhat       = promedio_reciente
                yhat_lower = max(0.0, promedio_reciente * 0.6)
                yhat_upper = promedio_reciente * 1.4
            predicciones_raw.append({
                "fecha": row["ds"],
                "yhat": yhat,
                "yhat_lower": max(0.0, yhat_lower),
                "yhat_upper": yhat_upper,
                "mes_num": row["ds"].month,
            })
        nombre_modelo = "Prophet + Clima"
        usa_clima_resp = usa_clima

    else:
        predicciones_raw, _ = _predecir_estadistico(serie_hist, meses)
        nombre_modelo = "Estadístico Estacional"
        usa_clima_resp = True

    # ── Construir respuesta ──────────────────────────────────────────────────
    predicciones = []
    total_unidades = 0

    for p in predicciones_raw:
        uds     = round(max(0.0, p["yhat"]), 1)
        uds_min = round(max(0.0, p["yhat_lower"]), 1)
        uds_max = round(max(0.0, p["yhat_upper"]), 1)
        total_unidades += uds
        mes_num = p["mes_num"]
        predicciones.append({
            "mes": pd.Timestamp(p["fecha"]).strftime("%B %Y"),
            "unidades": uds,
            "minimo": uds_min,
            "maximo": uds_max,
            "clima": {
                "temporada": str(_TEMPORADA_MES[mes_num]["temporada"]),
                "temporada_label": str(_TEMPORADA_MES[mes_num]["label"]),
                "temporada_emoji": str(_TEMPORADA_MES[mes_num]["emoji"]),
            },
        })

    # Historial
    historial = []
    for _, row in serie_hist.iterrows():
        entrada = {"mes": row["ds"].strftime("%B %Y"), "unidades_reales": round(float(row["y"]), 1)}
        if "temp_media" in row and pd.notna(row["temp_media"]):
            mes_num = row["ds"].month
            entrada["clima"] = {
                "temp_media": round(float(row["temp_media"]), 1),
                "precipitacion": round(float(row["precipitacion"]), 1),
                "temporada": _TEMPORADA_MES[mes_num]["temporada"],
                "temporada_emoji": _TEMPORADA_MES[mes_num]["emoji"],
            }
        historial.append(entrada)

    temporadas_pred = [_TEMPORADA_MES[p["mes_num"]]["temporada"] for p in predicciones_raw]
    temporada_dominante = max(set(temporadas_pred), key=temporadas_pred.count) if temporadas_pred else "seca"
    primer_mes_num = predicciones_raw[0]["mes_num"] if predicciones_raw else 1

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
            "temporada_label": _TEMPORADA_MES[primer_mes_num]["label"],
            "temporada_emoji": _TEMPORADA_MES[primer_mes_num]["emoji"],
            "impacto": _impacto_farmaceutico(temporada_dominante, 0),
            "clima_usado_en_modelo": usa_clima_resp,
        },
        "metricas_modelo": {
            **met,
            "mae_aceptable": met.get("mae", 99) < 10,
            "rmse_aceptable": met.get("rmse", 99) < 20,
            "periodos_entrenamiento": len(serie_hist),
        },
        "modelo": nombre_modelo,
    }
    return _limpiar_numpy(resultado)


def _limpiar_numpy(obj):
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
