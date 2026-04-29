import io
import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

RUTA_DATA = os.path.join(os.path.dirname(__file__), "../data")
RUTA_ACUMULADO = os.path.join(RUTA_DATA, "dataset_acumulado.csv")
RUTA_LIMPIO_LEGACY = os.path.join(RUTA_DATA, "RENTA2026-3_LIMPIO.csv")

_df = None


def _limpiar_numero(valor):
    if pd.isna(valor):
        return 0.0
    texto = str(valor).strip().replace(".", "").replace(",", ".")
    try:
        return float(texto)
    except ValueError:
        return 0.0


def _clasificar_rentabilidad(rent):
    if rent < 0:
        return "PERDIDA"
    elif rent < 15:
        return "BAJO"
    elif rent < 25:
        return "MEDIO"
    elif rent < 50:
        return "ALTO"
    else:
        return "EXCELENTE"


def _detectar_formato(df_crudo: pd.DataFrame) -> str:
    """
    Detecta si el CSV viene en formato nuevo (9 cols: COD;DESC;;LAB;COSTO;UND;VENTA;UTIL;RENT)
    o formato legacy (8 cols: COD;DESC;LAB;COSTO;UND;VENTA;UTIL;RENT).
    El formato nuevo tiene una columna vacía entre DESCRIPCION y LABORATORIO.
    """
    for _, fila in df_crudo.iterrows():
        vals = [str(v).strip() for v in fila]
        # Fila de datos real: primera celda es código numérico
        if vals[0].replace("0", "").isdigit() and len(vals[0]) >= 4:
            if len(vals) >= 9:
                # Si la columna 2 (índice 2) está vacía o es nan → formato nuevo de 9 cols
                if vals[2] in ("", "nan", "None"):
                    return "nuevo"
            return "legacy"
    return "legacy"


def _procesar_df(df_crudo: pd.DataFrame, periodo: str) -> pd.DataFrame:
    # Filtrar filas de metadata del encabezado del reporte
    palabras_meta = [
        "empresa", "nit", "cod", "descripcion", "fecha", "bucaclinicos",
        "dia", "prod", "rentabilidad", "informe", "carrera", "pag"
    ]
    mascara = df_crudo.iloc[:, 0].astype(str).str.lower().str.strip().apply(
        lambda x: any(p in x for p in palabras_meta) or x == "" or x == "nan"
    )
    df = df_crudo[~mascara].copy()
    df = df.dropna(how="all")
    df = df.reset_index(drop=True)

    if df.empty:
        return df

    fmt = _detectar_formato(df)

    if fmt == "nuevo":
        # Formato exportado por el sistema de facturación de Bucaclínicos:
        # col0=COD, col1=DESCRIPCION, col2=vacía (overflow del nombre), col3=LABORATORIO,
        # col4=COSTO, col5=UND_VEND, col6=VLR_VENTA, col7=UTILIDAD, col8=RENTABILIDAD
        df = df.iloc[:, [0, 1, 3, 4, 5, 6, 7, 8]]
        df.columns = ["COD", "DESCRIPCION", "LABORATORIO", "COSTO", "UND_VEND", "VLR_VENTA", "UTILIDAD", "RENTABILIDAD"]
    else:
        # Formato legacy de 8 columnas
        nombres = ["COD", "DESCRIPCION", "LABORATORIO", "COSTO", "UND_VEND", "VLR_VENTA", "UTILIDAD", "RENTABILIDAD"]
        df.columns = nombres[:len(df.columns)]

    for col in ["COSTO", "UND_VEND", "VLR_VENTA", "UTILIDAD", "RENTABILIDAD"]:
        if col in df.columns:
            df[col] = df[col].apply(_limpiar_numero)

    df = df[df["UND_VEND"] > 0].copy()

    # Limpiar asteriscos del inicio de nombres de productos (ej: *FEXOFENADINA...)
    if "DESCRIPCION" in df.columns:
        df["DESCRIPCION"] = df["DESCRIPCION"].astype(str).str.lstrip("*").str.strip()

    if "RENTABILIDAD" in df.columns:
        df["CLASIFICACION"] = df["RENTABILIDAD"].apply(_clasificar_rentabilidad)

    if "VLR_VENTA" in df.columns and "UND_VEND" in df.columns:
        df["PRECIO_UNITARIO"] = (df["VLR_VENTA"] / df["UND_VEND"]).round(2)

    if "COSTO" in df.columns and "UND_VEND" in df.columns:
        df["COSTO_UNITARIO"] = (df["COSTO"] / df["UND_VEND"]).replace([np.inf, -np.inf], 0).fillna(0).round(2)

    if "PRECIO_UNITARIO" in df.columns and "COSTO_UNITARIO" in df.columns:
        df["MARGEN_UNITARIO"] = (df["PRECIO_UNITARIO"] - df["COSTO_UNITARIO"]).round(2)

    # Agregar columna PERIODO al inicio
    df.insert(0, "PERIODO", periodo.strip().upper())

    df = df.reset_index(drop=True)
    return df


def _cargar_acumulado() -> pd.DataFrame:
    """Carga el dataset acumulado desde disco. Si no existe, carga el legacy."""
    if os.path.exists(RUTA_ACUMULADO):
        df = pd.read_csv(RUTA_ACUMULADO, sep=";", encoding="utf-8-sig")
    elif os.path.exists(RUTA_LIMPIO_LEGACY):
        df = pd.read_csv(RUTA_LIMPIO_LEGACY, sep=";", encoding="utf-8-sig")
    else:
        return pd.DataFrame()

    df.columns = [c.strip().lstrip("﻿").upper() for c in df.columns]

    # Compatibilidad: PRODUCTO → DESCRIPCION
    if "PRODUCTO" in df.columns and "DESCRIPCION" not in df.columns:
        df = df.rename(columns={"PRODUCTO": "DESCRIPCION"})

    # Recalcular variables derivadas si faltan
    if "PRECIO_UNITARIO" not in df.columns and "VLR_VENTA" in df.columns and "UND_VEND" in df.columns:
        df["PRECIO_UNITARIO"] = (df["VLR_VENTA"] / df["UND_VEND"]).round(2)
    if "COSTO_UNITARIO" not in df.columns and "COSTO" in df.columns and "UND_VEND" in df.columns:
        df["COSTO_UNITARIO"] = (df["COSTO"] / df["UND_VEND"]).replace([np.inf, -np.inf], 0).fillna(0).round(2)
    if "MARGEN_UNITARIO" not in df.columns and "PRECIO_UNITARIO" in df.columns and "COSTO_UNITARIO" in df.columns:
        df["MARGEN_UNITARIO"] = (df["PRECIO_UNITARIO"] - df["COSTO_UNITARIO"]).round(2)

    # Asegurar que PERIODO existe
    if "PERIODO" not in df.columns:
        df.insert(0, "PERIODO", "DESCONOCIDO")

    return df


def _guardar_acumulado(df: pd.DataFrame):
    os.makedirs(RUTA_DATA, exist_ok=True)
    df.to_csv(RUTA_ACUMULADO, sep=";", index=False, encoding="utf-8-sig")


def cargar_y_limpiar(contenido: bytes, nombre_archivo: str, periodo: str) -> dict:
    """
    Procesa un CSV/Excel nuevo y lo acumula al dataset histórico.
    Si el período ya existe, reemplaza sus registros (permite corrección).
    """
    global _df

    if nombre_archivo.endswith(".xlsx"):
        df_crudo = pd.read_excel(io.BytesIO(contenido), header=None)
    else:
        df_crudo = pd.read_csv(io.BytesIO(contenido), sep=";", header=None, encoding="latin-1")

    df_nuevo = _procesar_df(df_crudo, periodo)

    # Cargar acumulado actual
    df_actual = _cargar_acumulado()

    periodo_norm = periodo.strip().upper()
    periodo_existia = False
    registros_anteriores = 0

    if not df_actual.empty and "PERIODO" in df_actual.columns:
        registros_anteriores = len(df_actual[df_actual["PERIODO"] == periodo_norm])
        if registros_anteriores > 0:
            periodo_existia = True
            # Reemplazar registros del período
            df_actual = df_actual[df_actual["PERIODO"] != periodo_norm]

    if df_actual.empty:
        df_combinado = df_nuevo
    else:
        df_combinado = pd.concat([df_actual, df_nuevo], ignore_index=True)

    _guardar_acumulado(df_combinado)
    _df = df_combinado

    periodos_en_sistema = sorted(df_combinado["PERIODO"].unique().tolist())

    return {
        "mensaje": f"Período '{periodo_norm}' cargado correctamente.",
        "periodo_reemplazado": periodo_existia,
        "registros_anteriores_del_periodo": registros_anteriores,
        "registros_nuevos": len(df_nuevo),
        "total_registros_acumulados": len(df_combinado),
        "periodos_en_sistema": periodos_en_sistema,
        "total_periodos": len(periodos_en_sistema),
        "columnas": list(df_nuevo.columns),
    }


def obtener_df() -> pd.DataFrame:
    global _df
    if _df is None:
        _df = _cargar_acumulado()
    return _df


def invalidar_cache():
    """Fuerza recarga del dataset desde disco en la próxima llamada a obtener_df()."""
    global _df
    _df = None


def obtener_periodos() -> list:
    """Retorna lista de períodos disponibles con conteo de registros."""
    df = obtener_df()
    if df.empty or "PERIODO" not in df.columns:
        return []
    resumen = (
        df.groupby("PERIODO")
        .agg(registros=("PERIODO", "count"))
        .reset_index()
        .sort_values("PERIODO")
    )
    return resumen.rename(columns={"PERIODO": "periodo", "registros": "registros"}).to_dict(orient="records")


def obtener_resumen() -> dict:
    df = obtener_df()
    if df.empty:
        return {"error": "No hay datos cargados"}

    resumen = {
        "total_registros": len(df),
        "productos_unicos": df["DESCRIPCION"].nunique() if "DESCRIPCION" in df.columns else 0,
        "laboratorios_unicos": df["LABORATORIO"].nunique() if "LABORATORIO" in df.columns else 0,
        "clasificacion": df["CLASIFICACION"].value_counts().to_dict() if "CLASIFICACION" in df.columns else {},
        "venta_total": round(df["VLR_VENTA"].sum(), 2) if "VLR_VENTA" in df.columns else 0,
        "utilidad_total": round(df["UTILIDAD"].sum(), 2) if "UTILIDAD" in df.columns else 0,
        "periodos_disponibles": sorted(df["PERIODO"].unique().tolist()) if "PERIODO" in df.columns else [],
        "total_periodos": df["PERIODO"].nunique() if "PERIODO" in df.columns else 0,
    }

    if "PRECIO_UNITARIO" in df.columns:
        resumen["precio_unitario_promedio"] = round(df["PRECIO_UNITARIO"].mean(), 2)
    if "MARGEN_UNITARIO" in df.columns:
        resumen["margen_unitario_promedio"] = round(df["MARGEN_UNITARIO"].mean(), 2)
    if "COSTO_UNITARIO" in df.columns:
        resumen["costo_unitario_promedio"] = round(df["COSTO_UNITARIO"].mean(), 2)

    return resumen


def normalizar_df(df: pd.DataFrame) -> pd.DataFrame:
    df_norm = df.copy()
    cols_a_normalizar = [c for c in ["UND_VEND", "VLR_VENTA", "PRECIO_UNITARIO", "COSTO"] if c in df_norm.columns]
    if cols_a_normalizar:
        scaler = MinMaxScaler()
        valores_normalizados = scaler.fit_transform(df_norm[cols_a_normalizar])
        for i, col in enumerate(cols_a_normalizar):
            df_norm[f"{col}_N"] = valores_normalizados[:, i].round(4)
    return df_norm
