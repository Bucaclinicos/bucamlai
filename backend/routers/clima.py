from fastapi import APIRouter
from services.clima_service import obtener_clima_actual, climatologia_para_periodo
from services.limpieza import obtener_df, obtener_resumen
import pandas as pd

router = APIRouter()


@router.get("/actual")
def clima_actual():
    """Retorna el clima real actual de Bucaramanga con impacto farmacéutico."""
    return obtener_clima_actual()


@router.get("/periodo/{periodo}")
def clima_periodo(periodo: str):
    """Retorna datos climáticos para un período textual. Ej: /clima/periodo/AGOSTO-2025"""
    return climatologia_para_periodo(periodo)


@router.get("/alertas")
def alertas_clima():
    """
    Cruza el clima actual de Bucaramanga con el historial de ventas del dataset
    para identificar qué medicamentos tienen mayor demanda en esta temporada
    y cuáles conviene reforzar en stock.
    """
    from services.clima_service import _TEMPORADA_MES

    from services.constantes import MESES_MAP as _MESES_MAP

    clima = obtener_clima_actual()
    temporada_actual = clima["temporada"]
    mes_actual = pd.Timestamp.now().month

    df = obtener_df()
    if df.empty or "DESCRIPCION" not in df.columns or "PERIODO" not in df.columns:
        return {"error": "No hay datos suficientes en el sistema."}

    # Convertir PERIODO a mes numérico
    def periodo_a_mes(p):
        partes = str(p).strip().upper().split("-")
        return _MESES_MAP.get(partes[0], 0)

    df = df.copy()
    df["MES_NUM"] = df["PERIODO"].apply(periodo_a_mes)

    # Meses de temporada seca y lluviosa según climatología colombiana
    MESES_LLUVIAS = {3, 4, 5, 9, 10, 11}
    MESES_SECA    = {1, 2, 6, 7, 8, 12}

    meses_temporada = MESES_LLUVIAS if temporada_actual == "lluvias" else MESES_SECA
    meses_opuesta   = MESES_SECA    if temporada_actual == "lluvias" else MESES_LLUVIAS

    df_temp   = df[df["MES_NUM"].isin(meses_temporada)]
    df_opuesta = df[df["MES_NUM"].isin(meses_opuesta)]

    if df_temp.empty:
        # Si no hay datos históricos de esta temporada, usar todo el dataset
        df_temp = df

    # Agrupar ventas por medicamento en cada temporada
    ventas_temp = (
        df_temp.groupby("DESCRIPCION")
        .agg(und_temporada=("UND_VEND", "sum"), venta_temporada=("VLR_VENTA", "sum"))
        .reset_index()
    )

    ventas_opuesta = (
        df_opuesta.groupby("DESCRIPCION")
        .agg(und_opuesta=("UND_VEND", "sum"))
        .reset_index()
    ) if not df_opuesta.empty else pd.DataFrame(columns=["DESCRIPCION", "und_opuesta"])

    merged = ventas_temp.merge(ventas_opuesta, on="DESCRIPCION", how="left")
    merged["und_opuesta"] = merged["und_opuesta"].fillna(0)

    # Calcular variación relativa entre temporadas
    merged["variacion_pct"] = merged.apply(
        lambda r: round(((r["und_temporada"] - r["und_opuesta"]) / r["und_opuesta"] * 100), 1)
        if r["und_opuesta"] > 0 else 0,
        axis=1
    )

    # Top 20 más vendidos en esta temporada
    top_temporada = (
        merged.sort_values("und_temporada", ascending=False)
        .head(20)
        [["DESCRIPCION", "und_temporada", "venta_temporada", "variacion_pct"]]
        .rename(columns={
            "DESCRIPCION": "medicamento",
            "und_temporada": "unidades_en_temporada",
            "venta_temporada": "venta_en_temporada",
        })
        .to_dict(orient="records")
    )

    # Top 10 con mayor incremento vs temporada opuesta (solo si hay comparación)
    top_incremento = []
    if not df_opuesta.empty:
        top_incremento = (
            merged[merged["und_opuesta"] > 0]
            .sort_values("variacion_pct", ascending=False)
            .head(10)
            [["DESCRIPCION", "und_temporada", "und_opuesta", "variacion_pct"]]
            .rename(columns={
                "DESCRIPCION": "medicamento",
                "und_temporada": "unidades_temporada_actual",
                "und_opuesta": "unidades_temporada_opuesta",
            })
            .to_dict(orient="records")
        )

    # Medicamentos con caída — posibles excesos de stock
    top_caida = []
    if not df_opuesta.empty:
        top_caida = (
            merged[merged["und_opuesta"] > 0]
            .sort_values("variacion_pct", ascending=True)
            .head(10)
            [["DESCRIPCION", "und_temporada", "und_opuesta", "variacion_pct"]]
            .rename(columns={
                "DESCRIPCION": "medicamento",
                "und_temporada": "unidades_temporada_actual",
                "und_opuesta": "unidades_temporada_opuesta",
            })
            .to_dict(orient="records")
        )

    periodos_analizados = sorted(df["PERIODO"].unique().tolist())

    return {
        "clima_actual": clima,
        "temporada_actual": temporada_actual,
        "meses_analizados_temporada": sorted(list(meses_temporada)),
        "periodos_en_dataset": periodos_analizados,
        "tiene_comparacion_historica": not df_opuesta.empty,
        "top_demanda_temporada": top_temporada,
        "top_incremento_vs_temporada_opuesta": top_incremento,
        "top_caida_vs_temporada_opuesta": top_caida,
        "resumen": {
            "total_medicamentos_analizados": len(merged),
            "medicamentos_con_incremento": len(merged[merged["variacion_pct"] > 10]),
            "medicamentos_con_caida": len(merged[merged["variacion_pct"] < -10]),
        }
    }
