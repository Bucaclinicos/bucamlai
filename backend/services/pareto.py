import pandas as pd
from services.limpieza import obtener_df


def obtener_pareto() -> dict:
    """
    Analisis de Pareto / Clasificacion ABC basado en acumulado de ventas.
    Metodologia:
      - Se agrupa por producto y se suma VLR_VENTA en todos los periodos
      - Se ordena de mayor a menor venta
      - Se calcula el porcentaje acumulado (cumsum)
      - Categoria A: productos que acumulan el 80% de los ingresos
      - Categoria B: productos que acumulan el siguiente 15% (hasta 95%)
      - Categoria C: el 5% restante (mayor riesgo de vencimiento)

    Diferencia con KMeans:
      KMeans clasifica por multiples dimensiones (unidades, venta, rentabilidad).
      Pareto/ABC clasifica por un solo criterio (aporte al ingreso total),
      que es el metodo clasico de gestion de inventarios.
    """
    df = obtener_df()

    if "DESCRIPCION" not in df.columns or "VLR_VENTA" not in df.columns:
        return {"error": "Columnas insuficientes para analisis Pareto"}

    # Agregar ventas totales por producto
    df_prod = df.groupby("DESCRIPCION").agg(
        venta_total=("VLR_VENTA", "sum"),
        unidades_total=("UND_VEND", "sum"),
        rentabilidad_promedio=("RENTABILIDAD", "mean"),
    ).reset_index()

    df_prod = df_prod[df_prod["venta_total"] > 0].copy()
    df_prod = df_prod.sort_values("venta_total", ascending=False).reset_index(drop=True)

    venta_global = df_prod["venta_total"].sum()

    # Porcentaje individual y acumulado (curva de Pareto)
    df_prod["porcentaje"] = (df_prod["venta_total"] / venta_global * 100).round(4)
    df_prod["acumulado"] = df_prod["porcentaje"].cumsum().round(4)

    # Clasificacion ABC segun umbrales de Pareto
    df_prod["categoria_abc"] = df_prod["acumulado"].apply(
        lambda x: "A" if x <= 80 else ("B" if x <= 95 else "C")
    )

    # Resumen por categoria
    resumen_categorias = df_prod.groupby("categoria_abc").agg(
        cantidad_productos=("DESCRIPCION", "count"),
        venta_categoria=("venta_total", "sum"),
    ).reset_index()
    resumen_categorias["porcentaje_venta"] = (
        resumen_categorias["venta_categoria"] / venta_global * 100
    ).round(2)

    # Redondear valores para la respuesta
    df_prod["venta_total"] = df_prod["venta_total"].round(2)
    df_prod["unidades_total"] = df_prod["unidades_total"].round(2)
    df_prod["rentabilidad_promedio"] = df_prod["rentabilidad_promedio"].round(2)

    return {
        "total_productos": len(df_prod),
        "venta_total_global": round(venta_global, 2),
        "resumen_abc": resumen_categorias.to_dict(orient="records"),
        "productos": df_prod[
            ["DESCRIPCION", "venta_total", "unidades_total", "rentabilidad_promedio", "porcentaje", "acumulado", "categoria_abc"]
        ].to_dict(orient="records"),
    }
