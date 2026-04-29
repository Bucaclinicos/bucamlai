"""
Servicio de clima para Bucaramanga usando Open-Meteo API (gratuita, sin API key).
Coordenadas Bucaramanga: lat=7.1254, lon=-73.1198

Provee:
  - Datos históricos mensuales (temperatura media, precipitación total)
  - Datos futuros estimados (promedio climatológico del mes + anomalía reciente)
  - Clasificación de temporada climática por mes
"""

import requests
import pandas as pd
from datetime import date, timedelta
from functools import lru_cache

LAT = 7.1254
LON = -73.1198

# Clasificación climática de Bucaramanga por mes (patrón bimodal colombiano)
# Temporadas: seca (dic-feb, jun-ago) / lluvias (mar-may, sep-nov)
_TEMPORADA_MES = {
    1:  {"temporada": "seca",    "label": "Temporada seca",    "emoji": "☀️"},
    2:  {"temporada": "seca",    "label": "Temporada seca",    "emoji": "☀️"},
    3:  {"temporada": "lluvias", "label": "Temporada de lluvias", "emoji": "🌧️"},
    4:  {"temporada": "lluvias", "label": "Temporada de lluvias", "emoji": "🌧️"},
    5:  {"temporada": "lluvias", "label": "Temporada de lluvias", "emoji": "🌧️"},
    6:  {"temporada": "seca",    "label": "Temporada seca",    "emoji": "⛅"},
    7:  {"temporada": "seca",    "label": "Temporada seca",    "emoji": "☀️"},
    8:  {"temporada": "seca",    "label": "Temporada seca",    "emoji": "☀️"},
    9:  {"temporada": "lluvias", "label": "Temporada de lluvias", "emoji": "🌧️"},
    10: {"temporada": "lluvias", "label": "Temporada de lluvias", "emoji": "🌧️"},
    11: {"temporada": "lluvias", "label": "Temporada de lluvias", "emoji": "🌧️"},
    12: {"temporada": "seca",    "label": "Temporada seca",    "emoji": "☀️"},
}

# Promedio climatológico histórico de Bucaramanga (temperatura °C / precipitación mm)
# Fuente: climatología IDEAM + Open-Meteo histórico
_CLIMATOLOGIA = {
    1:  {"temp": 27.2, "precip": 55},
    2:  {"temp": 27.8, "precip": 60},
    3:  {"temp": 27.1, "precip": 110},
    4:  {"temp": 26.5, "precip": 175},
    5:  {"temp": 26.2, "precip": 185},
    6:  {"temp": 26.8, "precip": 95},
    7:  {"temp": 27.3, "precip": 70},
    8:  {"temp": 27.5, "precip": 65},
    9:  {"temp": 26.9, "precip": 130},
    10: {"temp": 26.3, "precip": 200},
    11: {"temp": 26.1, "precip": 195},
    12: {"temp": 26.8, "precip": 90},
}


def _fetch_historico(fecha_inicio: str, fecha_fin: str) -> pd.DataFrame:
    """
    Consulta Open-Meteo Archive API para datos históricos diarios de Bucaramanga.
    Retorna DataFrame con columnas: date, temp_media, precipitacion.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": LAT,
        "longitude": LON,
        "start_date": fecha_inicio,
        "end_date": fecha_fin,
        "daily": "temperature_2m_mean,precipitation_sum",
        "timezone": "America/Bogota",
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        df = pd.DataFrame({
            "date": pd.to_datetime(data["daily"]["time"]),
            "temp_media": data["daily"]["temperature_2m_mean"],
            "precipitacion": data["daily"]["precipitation_sum"],
        })
        df["temp_media"] = pd.to_numeric(df["temp_media"], errors="coerce").fillna(0)
        df["precipitacion"] = pd.to_numeric(df["precipitacion"], errors="coerce").fillna(0)
        return df
    except Exception:
        return pd.DataFrame()


def obtener_clima_historico_mensual(fecha_inicio: str, fecha_fin: str) -> pd.DataFrame:
    """
    Retorna DataFrame mensual con temperatura media y precipitación total
    para el rango de fechas dado (formato 'YYYY-MM-DD').
    Columnas: ds (primer día del mes), temp_media, precipitacion, temporada
    """
    df_diario = _fetch_historico(fecha_inicio, fecha_fin)
    if df_diario.empty:
        return pd.DataFrame()

    df_diario["mes"] = df_diario["date"].dt.to_period("M")
    mensual = df_diario.groupby("mes").agg(
        temp_media=("temp_media", "mean"),
        precipitacion=("precipitacion", "sum"),
    ).reset_index()
    mensual["ds"] = mensual["mes"].dt.to_timestamp()
    mensual["temp_media"] = mensual["temp_media"].round(2)
    mensual["precipitacion"] = mensual["precipitacion"].round(1)
    mensual["temporada"] = mensual["ds"].dt.month.map(lambda m: _TEMPORADA_MES[m]["temporada"])
    return mensual[["ds", "temp_media", "precipitacion", "temporada"]].sort_values("ds")


def obtener_clima_futuro_mensual(fecha_inicio: pd.Timestamp, n_meses: int) -> pd.DataFrame:
    """
    Para fechas futuras usa el promedio climatológico del mes.
    Si el mes futuro ya pasó parcialmente, intenta datos reales primero.
    Retorna DataFrame con columnas: ds, temp_media, precipitacion, temporada, es_pronostico
    """
    hoy = date.today()
    filas = []

    for i in range(n_meses):
        mes_ts = fecha_inicio + pd.DateOffset(months=i)
        mes_num = mes_ts.month
        anio = mes_ts.year
        clima_mes = _CLIMATOLOGIA[mes_num]

        # Si el mes ya pasó o está en curso, intentar datos reales
        inicio_mes = date(anio, mes_num, 1)
        if inicio_mes <= hoy:
            fin_mes = min(hoy - timedelta(days=1), date(anio, mes_num, 28))
            df_real = _fetch_historico(inicio_mes.isoformat(), fin_mes.isoformat())
            if not df_real.empty:
                filas.append({
                    "ds": mes_ts,
                    "temp_media": round(df_real["temp_media"].mean(), 2),
                    "precipitacion": round(df_real["precipitacion"].sum(), 1),
                    "temporada": _TEMPORADA_MES[mes_num]["temporada"],
                    "es_pronostico": False,
                })
                continue

        # Usar climatología
        filas.append({
            "ds": mes_ts,
            "temp_media": clima_mes["temp"],
            "precipitacion": float(clima_mes["precip"]),
            "temporada": _TEMPORADA_MES[mes_num]["temporada"],
            "es_pronostico": True,
        })

    return pd.DataFrame(filas)


def obtener_clima_actual() -> dict:
    """
    Retorna el clima del mes actual en Bucaramanga con datos reales de Open-Meteo.
    Si falla la API, retorna la climatología del mes.
    """
    hoy = date.today()
    mes_actual = hoy.month
    inicio_mes = date(hoy.year, mes_actual, 1)
    fin = hoy - timedelta(days=1) if hoy.day > 1 else hoy

    df = _fetch_historico(inicio_mes.isoformat(), fin.isoformat())
    temporada_info = _TEMPORADA_MES[mes_actual]
    clima_base = _CLIMATOLOGIA[mes_actual]

    if not df.empty:
        temp = round(float(df["temp_media"].mean()), 1)
        precip = round(float(df["precipitacion"].sum()), 1)
        fuente = "real"
    else:
        temp = clima_base["temp"]
        precip = float(clima_base["precip"])
        fuente = "climatologia"

    return {
        "fecha": hoy.isoformat(),
        "ciudad": "Bucaramanga, Colombia",
        "temperatura_media": temp,
        "precipitacion_acumulada_mes": precip,
        "temporada": temporada_info["temporada"],
        "temporada_label": temporada_info["label"],
        "temporada_emoji": temporada_info["emoji"],
        "fuente": fuente,
        "impacto_farmaceutico": _impacto_farmaceutico(temporada_info["temporada"], precip),
    }


def _impacto_farmaceutico(temporada: str, precip: float) -> dict:
    """
    Retorna el impacto esperado en la demanda farmacéutica según la temporada.
    """
    if temporada == "lluvias":
        return {
            "descripcion": "Temporada de lluvias — mayor demanda de antigripales, antibióticos y antiparasitarios",
            "categorias_alta_demanda": ["Antigripales", "Antibióticos", "Antiparasitarios", "Antitusivos", "Broncodilatadores"],
            "categorias_baja_demanda": ["Protector solar", "Antihistamínicos estacionales"],
            "variacion_esperada": "+15% a +30% en respiratorios",
        }
    else:
        return {
            "descripcion": "Temporada seca — mayor demanda de antihistamínicos, hidratación y protección solar",
            "categorias_alta_demanda": ["Antihistamínicos", "Hidratación oral", "Protector solar", "Antidiarreicos"],
            "categorias_baja_demanda": ["Antigripales", "Broncodilatadores"],
            "variacion_esperada": "+10% a +20% en alérgicos y digestivos",
        }


def climatologia_para_periodo(periodo_str: str) -> dict:
    """
    Retorna datos climáticos para un período textual (ej: 'AGOSTO-2025').
    Primero intenta datos reales, luego usa climatología.
    """
    from services.constantes import MESES_MAP

    partes = periodo_str.strip().upper().split("-")
    mes_str = partes[0]
    anio = int(partes[1]) if len(partes) > 1 else date.today().year
    mes_num = MESES_MAP.get(mes_str, 1)

    inicio = f"{anio}-{mes_num:02d}-01"
    ultimo_dia = 28 if mes_num == 2 else (30 if mes_num in [4, 6, 9, 11] else 31)
    fin_fecha = date(anio, mes_num, ultimo_dia)
    hoy = date.today()

    if fin_fecha < hoy:
        df = _fetch_historico(inicio, fin_fecha.isoformat())
        if not df.empty:
            return {
                "periodo": periodo_str,
                "temp_media": round(float(df["temp_media"].mean()), 2),
                "precipitacion": round(float(df["precipitacion"].sum()), 1),
                "temporada": _TEMPORADA_MES[mes_num]["temporada"],
                "fuente": "real",
            }

    clima_base = _CLIMATOLOGIA[mes_num]
    return {
        "periodo": periodo_str,
        "temp_media": clima_base["temp"],
        "precipitacion": float(clima_base["precip"]),
        "temporada": _TEMPORADA_MES[mes_num]["temporada"],
        "fuente": "climatologia",
    }
