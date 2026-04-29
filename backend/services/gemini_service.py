import os
from dotenv import load_dotenv
import google.generativeai as genai
import pandas as pd
from services.limpieza import obtener_df, obtener_resumen

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
_model = genai.GenerativeModel("gemini-2.5-flash")

_MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]

# Climatología de Bucaramanga por mes para contexto de clima
_CLIMA_BGA = {
    1:  {"temp": 27.2, "precip": 55,  "temporada": "seca"},
    2:  {"temp": 27.8, "precip": 60,  "temporada": "seca"},
    3:  {"temp": 27.1, "precip": 110, "temporada": "lluvias"},
    4:  {"temp": 26.5, "precip": 175, "temporada": "lluvias"},
    5:  {"temp": 26.2, "precip": 185, "temporada": "lluvias"},
    6:  {"temp": 26.8, "precip": 95,  "temporada": "seca"},
    7:  {"temp": 27.3, "precip": 70,  "temporada": "seca"},
    8:  {"temp": 27.5, "precip": 65,  "temporada": "seca"},
    9:  {"temp": 26.9, "precip": 130, "temporada": "lluvias"},
    10: {"temp": 26.3, "precip": 200, "temporada": "lluvias"},
    11: {"temp": 26.1, "precip": 195, "temporada": "lluvias"},
    12: {"temp": 26.8, "precip": 90,  "temporada": "seca"},
}

_MESES_NUM = {
    "ENERO": 1, "FEBRERO": 2, "MARZO": 3, "ABRIL": 4,
    "MAYO": 5, "JUNIO": 6, "JULIO": 7, "AGOSTO": 8,
    "SEPTIEMBRE": 9, "OCTUBRE": 10, "NOVIEMBRE": 11, "DICIEMBRE": 12,
}


def _detectar_periodos_en_pregunta(pregunta: str, periodos_disponibles: list) -> list:
    pregunta_lower = pregunta.lower()
    encontrados = []
    for p in periodos_disponibles:
        p_lower = p.lower()
        if p_lower in pregunta_lower:
            encontrados.append(p)
            continue
        for mes in _MESES:
            if mes in pregunta_lower and mes in p_lower:
                if p not in encontrados:
                    encontrados.append(p)
    return encontrados


def _construir_contexto(df: pd.DataFrame, periodos_filtro: list = None) -> str:
    resumen = obtener_resumen()
    periodos_disponibles = resumen.get("periodos_disponibles", [])

    if periodos_filtro:
        df_ctx = df[df["PERIODO"].isin(periodos_filtro)].copy()
        scope = f"período(s): {', '.join(periodos_filtro)}"
    else:
        df_ctx = df.copy()
        scope = "todos los períodos disponibles"

    if df_ctx.empty:
        return f"No hay datos para {scope}."

    # ── BLOQUE 1: Resumen general ──────────────────────────────────────────
    margen_prom = round(df_ctx["RENTABILIDAD"].mean(), 2) if "RENTABILIDAD" in df_ctx.columns else 0
    utilidad = df_ctx["UTILIDAD"].sum() if "UTILIDAD" in df_ctx.columns else 0
    venta = df_ctx["VLR_VENTA"].sum() if "VLR_VENTA" in df_ctx.columns else 0

    bloque_general = f"""
=== DATOS GENERALES — BUCACLÍNICOS S.A.S. (Bucaramanga, Colombia) ===
Períodos en el sistema: {', '.join(periodos_disponibles)}
Alcance de esta consulta: {scope}
Total registros: {len(df_ctx):,}
Productos únicos: {df_ctx['DESCRIPCION'].nunique() if 'DESCRIPCION' in df_ctx.columns else 'N/D'}
Laboratorios únicos: {df_ctx['LABORATORIO'].nunique() if 'LABORATORIO' in df_ctx.columns else 'N/D'}
Venta total: ${venta:,.0f} COP
Utilidad total: ${utilidad:,.0f} COP
Margen de rentabilidad promedio: {margen_prom}%
"""

    # ── BLOQUE 2: Resumen por período con clima ────────────────────────────
    bloque_periodos = "\n=== VENTAS Y CLIMA POR PERÍODO ===\n"
    if "PERIODO" in df_ctx.columns:
        por_periodo = (
            df_ctx.groupby("PERIODO")
            .agg(
                registros=("PERIODO", "count"),
                venta_total=("VLR_VENTA", "sum"),
                utilidad_total=("UTILIDAD", "sum"),
                unidades_total=("UND_VEND", "sum"),
                rentabilidad_prom=("RENTABILIDAD", "mean"),
                productos_unicos=("DESCRIPCION", "nunique"),
            )
            .reset_index()
            .sort_values("PERIODO")
        )
        for _, row in por_periodo.iterrows():
            periodo_str = str(row["PERIODO"])
            mes_str = periodo_str.split("-")[0]
            mes_num = _MESES_NUM.get(mes_str, 0)
            clima = _CLIMA_BGA.get(mes_num, {})
            bloque_periodos += (
                f"  {periodo_str}: {int(row['registros'])} registros | "
                f"Unidades: {int(row['unidades_total']):,} | "
                f"Venta: ${row['venta_total']:,.0f} | "
                f"Utilidad: ${row['utilidad_total']:,.0f} | "
                f"Margen prom: {round(row['rentabilidad_prom'], 1)}% | "
                f"Temp: {clima.get('temp', '?')}°C | "
                f"Precip: {clima.get('precip', '?')}mm | "
                f"Temporada: {clima.get('temporada', '?')}\n"
            )

    # ── BLOQUE 3: TODOS los productos con métricas completas ──────────────
    bloque_productos = "\n=== CATÁLOGO COMPLETO DE PRODUCTOS (ordenado por venta total) ===\n"
    if "DESCRIPCION" in df_ctx.columns:
        agg = (
            df_ctx.groupby("DESCRIPCION")
            .agg(
                unidades=("UND_VEND", "sum"),
                venta=("VLR_VENTA", "sum"),
                utilidad=("UTILIDAD", "sum"),
                rentabilidad_prom=("RENTABILIDAD", "mean"),
                costo_total=("COSTO", "sum"),
                periodos_presentes=("PERIODO", "nunique"),
                laboratorio=("LABORATORIO", "first"),
            )
            .reset_index()
            .sort_values("venta", ascending=False)
        )
        agg["clasificacion"] = agg["rentabilidad_prom"].apply(
            lambda r: "PERDIDA" if r < 0 else ("BAJO" if r < 15 else ("MEDIO" if r < 25 else ("ALTO" if r < 50 else "EXCELENTE")))
        )
        for _, row in agg.iterrows():
            bloque_productos += (
                f"  {row['DESCRIPCION']} | Lab: {row['laboratorio']} | "
                f"Uds: {int(row['unidades']):,} | Venta: ${row['venta']:,.0f} | "
                f"Utilidad: ${row['utilidad']:,.0f} | Margen: {round(row['rentabilidad_prom'], 1)}% | "
                f"Clasificación: {row['clasificacion']} | "
                f"Períodos presentes: {int(row['periodos_presentes'])}/{len(periodos_disponibles)}\n"
            )

    # ── BLOQUE 4: Evolución mensual de cada producto ───────────────────────
    bloque_evolucion = "\n=== EVOLUCIÓN MENSUAL POR PRODUCTO (top 100 por venta) ===\n"
    if "DESCRIPCION" in df_ctx.columns and "PERIODO" in df_ctx.columns:
        top100 = (
            df_ctx.groupby("DESCRIPCION")["VLR_VENTA"]
            .sum()
            .sort_values(ascending=False)
            .head(100)
            .index.tolist()
        )
        df_top = df_ctx[df_ctx["DESCRIPCION"].isin(top100)]
        pivot = (
            df_top.groupby(["DESCRIPCION", "PERIODO"])
            .agg(unidades=("UND_VEND", "sum"), venta=("VLR_VENTA", "sum"))
            .reset_index()
        )
        for med in top100:
            filas = pivot[pivot["DESCRIPCION"] == med].sort_values("PERIODO")
            if filas.empty:
                continue
            meses_data = " | ".join(
                f"{row['PERIODO']}: {int(row['unidades'])}uds ${row['venta']:,.0f}"
                for _, row in filas.iterrows()
            )
            bloque_evolucion += f"  {med}: {meses_data}\n"

    # ── BLOQUE 5: Productos en pérdida ────────────────────────────────────
    bloque_perdida = "\n=== PRODUCTOS EN PÉRDIDA (rentabilidad < 0%) ===\n"
    if "CLASIFICACION" in df_ctx.columns:
        perdida = (
            df_ctx[df_ctx["CLASIFICACION"] == "PERDIDA"]
            .groupby("DESCRIPCION")
            .agg(
                unidades=("UND_VEND", "sum"),
                venta=("VLR_VENTA", "sum"),
                rentabilidad_prom=("RENTABILIDAD", "mean"),
                laboratorio=("LABORATORIO", "first"),
            )
            .reset_index()
            .sort_values("rentabilidad_prom")
        )
        if perdida.empty:
            bloque_perdida += "  Sin productos en pérdida.\n"
        else:
            for _, row in perdida.iterrows():
                bloque_perdida += (
                    f"  {row['DESCRIPCION']} | Lab: {row['laboratorio']} | "
                    f"Margen: {round(row['rentabilidad_prom'], 1)}% | "
                    f"Uds: {int(row['unidades']):,} | Venta: ${row['venta']:,.0f}\n"
                )

    # ── BLOQUE 6: Top 20 laboratorios ────────────────────────────────────
    bloque_labs = "\n=== TOP 20 LABORATORIOS POR VENTA ===\n"
    if "LABORATORIO" in df_ctx.columns:
        top_labs = (
            df_ctx.groupby("LABORATORIO")
            .agg(
                venta=("VLR_VENTA", "sum"),
                unidades=("UND_VEND", "sum"),
                productos=("DESCRIPCION", "nunique"),
                rentabilidad_prom=("RENTABILIDAD", "mean"),
            )
            .reset_index()
            .sort_values("venta", ascending=False)
            .head(20)
        )
        for i, (_, row) in enumerate(top_labs.iterrows(), 1):
            bloque_labs += (
                f"  {i}. {row['LABORATORIO']}: Venta ${row['venta']:,.0f} | "
                f"Uds: {int(row['unidades']):,} | Productos: {int(row['productos'])} | "
                f"Margen prom: {round(row['rentabilidad_prom'], 1)}%\n"
            )

    # ── BLOQUE 7: Distribución de rentabilidad ───────────────────────────
    bloque_dist = "\n=== DISTRIBUCIÓN DE RENTABILIDAD ===\n"
    if "CLASIFICACION" in df_ctx.columns:
        orden = ["PERDIDA", "BAJO", "MEDIO", "ALTO", "EXCELENTE"]
        vc = df_ctx["CLASIFICACION"].value_counts()
        total = len(df_ctx)
        for cat in orden:
            cnt = int(vc.get(cat, 0))
            bloque_dist += f"  {cat}: {cnt:,} registros ({cnt/total*100:.1f}%)\n"

    # ── BLOQUE 8: Contexto climático de Bucaramanga ──────────────────────
    bloque_clima = "\n=== CONTEXTO CLIMÁTICO BUCARAMANGA (referencia para análisis) ===\n"
    bloque_clima += "Patrón bimodal colombiano — dos temporadas de lluvias al año:\n"
    bloque_clima += "  Temporada SECA: enero, febrero, junio, julio, agosto, diciembre\n"
    bloque_clima += "  Temporada LLUVIAS: marzo, abril, mayo, septiembre, octubre, noviembre\n\n"
    bloque_clima += "Datos históricos por mes:\n"
    for mes_num, datos in _CLIMA_BGA.items():
        mes_nombre = [k for k, v in _MESES_NUM.items() if v == mes_num][0]
        bloque_clima += (
            f"  {mes_nombre}: {datos['temp']}°C | {datos['precip']}mm precip | "
            f"Temporada: {datos['temporada'].upper()}\n"
        )
    bloque_clima += """
Medicamentos de ALTA demanda en temporada de LLUVIAS:
  Antigripales, Antibióticos, Antiparasitarios, Antitusivos, Broncodilatadores,
  Antipiréticos, Antidiarreicos, Sueros de rehidratación oral

Medicamentos de ALTA demanda en temporada SECA:
  Antihistamínicos, Protector solar, Hidratación oral, Antialérgicos,
  Descongestionantes nasales, Cremas hidratantes
"""

    instruccion = """Eres un asistente analítico experto en inventario farmacéutico para Bucaclínicos S.A.S.,
una farmacia ubicada en Bucaramanga, Colombia.

CAPACIDADES:
- Tienes acceso COMPLETO al dataset histórico de ventas con TODOS los productos.
- Puedes analizar tendencias, comparar períodos, identificar patrones de demanda.
- Conoces el contexto climático de Bucaramanga y su relación con la demanda farmacéutica.
- Puedes cruzar datos de ventas históricas con el clima para hacer proyecciones razonadas.
- Puedes identificar qué medicamentos tienen mayor potencial de aumento según la temporada.

INSTRUCCIONES:
- Responde SIEMPRE en español, de forma clara y directa.
- Cita SIEMPRE datos específicos del dataset (unidades, pesos, porcentajes, períodos).
- Cuando te pregunten sobre un medicamento y el clima, analiza su evolución mensual,
  identifica si vende más en lluvias o en seca, y proyecta razonadamente.
- Si no tienes datos suficientes de un producto, dilo claramente.
- Sé analítico, no genérico. Usa los números reales del inventario.
- Cuando hagas proyecciones, basa tu razonamiento en el historial del producto
  cruzado con el patrón climático del mes consultado.

"""

    return (
        instruccion
        + bloque_general
        + bloque_periodos
        + bloque_productos
        + bloque_evolucion
        + bloque_perdida
        + bloque_labs
        + bloque_dist
        + bloque_clima
    )


def consultar(pregunta: str, periodos_filtro: list = None) -> dict:
    df = obtener_df()

    if df.empty:
        return {"error": "No hay datos cargados en el sistema."}

    periodos_disponibles = sorted(df["PERIODO"].unique().tolist()) if "PERIODO" in df.columns else []

    if not periodos_filtro:
        periodos_filtro = _detectar_periodos_en_pregunta(pregunta, periodos_disponibles)

    contexto = _construir_contexto(df, periodos_filtro if periodos_filtro else None)

    prompt = contexto + f"\n\nPREGUNTA DEL USUARIO: {pregunta}"

    try:
        respuesta = _model.generate_content(prompt)
        return {
            "respuesta": respuesta.text,
            "periodos_analizados": periodos_filtro if periodos_filtro else periodos_disponibles,
        }
    except Exception as e:
        return {"error": f"Error al consultar Gemini: {str(e)}"}
