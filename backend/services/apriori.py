import pandas as pd
from services.limpieza import obtener_df


def obtener_reglas() -> dict:
    """
    Analiza que productos aparecen juntos en todos los periodos (Enero, Febrero, Marzo).
    Un producto 'aparece' en un periodo si tiene UND_VEND > 0.
    Esto permite encontrar medicamentos con demanda constante y consistente.
    """
    df = obtener_df()

    if "DESCRIPCION" not in df.columns or "PERIODO" not in df.columns:
        return {"error": "Datos insuficientes para analisis de asociacion"}

    try:
        from mlxtend.frequent_patterns import apriori, association_rules

        periodos = df["PERIODO"].unique()

        # Usar solo top 100 productos por volumen de ventas para mantener performance
        top_productos = (
            df.groupby("DESCRIPCION")["UND_VEND"]
            .sum()
            .sort_values(ascending=False)
            .head(100)
            .index.tolist()
        )
        df_filtrado = df[df["DESCRIPCION"].isin(top_productos)]

        # Canasta = lista de productos vendidos en cada periodo
        canastas = []
        for periodo in periodos:
            productos = df_filtrado[df_filtrado["PERIODO"] == periodo]["DESCRIPCION"].unique().tolist()
            canastas.append(productos)

        if len(canastas) < 2:
            return {"mensaje": "Se necesitan al menos 2 periodos para analisis de asociacion"}

        # Construir matriz binaria
        todos = sorted(set(p for c in canastas for p in c))
        matriz = []
        for canasta in canastas:
            fila = {p: (p in canasta) for p in todos}
            matriz.append(fila)

        df_enc = pd.DataFrame(matriz)

        # Soporte minimo: aparece en al menos 2 de los 3 periodos (~0.6)
        frecuentes = apriori(df_enc, min_support=0.6, use_colnames=True)

        if frecuentes.empty:
            return {"mensaje": "No se encontraron productos frecuentes en multiples periodos"}

        reglas = association_rules(frecuentes, metric="lift", min_threshold=1.0, num_itemsets=len(frecuentes))
        reglas = reglas.sort_values("lift", ascending=False).head(15)

        resultado = []
        for _, row in reglas.iterrows():
            resultado.append({
                "antecedente": list(row["antecedents"]),
                "consecuente": list(row["consequents"]),
                "soporte": round(float(row["support"]), 3),
                "confianza": round(float(row["confidence"]), 3),
                "lift": round(float(row["lift"]), 3),
            })

        return {
            "nota": "Productos que aparecen juntos en multiples periodos de venta",
            "periodos_analizados": list(periodos),
            "total_reglas": len(resultado),
            "reglas": resultado,
        }

    except Exception as e:
        return {"error": str(e)}
