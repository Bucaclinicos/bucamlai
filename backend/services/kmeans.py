import os
import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from services.limpieza import obtener_df

RUTA_MODELOS   = os.path.join(os.path.dirname(__file__), "../models")
PKL_KMEANS     = os.path.join(RUTA_MODELOS, "kmeans.pkl")
PKL_SCALER     = os.path.join(RUTA_MODELOS, "kmeans_scaler.pkl")
PKL_ETIQUETAS  = os.path.join(RUTA_MODELOS, "kmeans_etiquetas.pkl")
PKL_RESULTADO  = os.path.join(RUTA_MODELOS, "kmeans_resultado.pkl")

_cache = None  # dict con el resultado completo


def _entrenar_y_guardar():
    """Entrena KMeans desde cero y persiste en disco como .pkl."""
    global _cache

    os.makedirs(RUTA_MODELOS, exist_ok=True)

    df = obtener_df()

    cols = {"DESCRIPCION", "UND_VEND", "VLR_VENTA", "RENTABILIDAD"}
    if not cols.issubset(df.columns):
        return None

    df_agg = df.groupby("DESCRIPCION").agg(
        unidades=("UND_VEND", "sum"),
        venta=("VLR_VENTA", "sum"),
        rentabilidad=("RENTABILIDAD", "mean"),
    ).reset_index()

    df_agg = df_agg[df_agg["unidades"] > 0].copy()

    X = df_agg[["unidades", "venta", "rentabilidad"]].fillna(0)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    df_agg["cluster"] = labels

    # Silhouette Score — objetivo: > 0.5
    sil_score = round(float(silhouette_score(X_scaled, labels)), 4)

    # Etiquetar A (alta rotacion), B (media), C (baja)
    resumen = df_agg.groupby("cluster")["unidades"].mean().sort_values(ascending=False)
    etiquetas = {int(resumen.index[0]): "A", int(resumen.index[1]): "B", int(resumen.index[2]): "C"}
    df_agg["categoria"] = df_agg["cluster"].map(etiquetas)

    resultado = df_agg[["DESCRIPCION", "unidades", "venta", "rentabilidad", "categoria"]].copy()
    resultado["unidades"]     = resultado["unidades"].round(2)
    resultado["venta"]        = resultado["venta"].round(2)
    resultado["rentabilidad"] = resultado["rentabilidad"].round(2)

    _cache = {
        "total_productos": len(resultado),
        "silhouette_score": sil_score,
        "silhouette_interpretacion": "Bien definido (>0.5)" if sil_score > 0.5 else "Clusters solapados (<=0.5)",
        "productos": resultado.to_dict(orient="records"),
    }

    # Persistir en disco
    joblib.dump(kmeans,    PKL_KMEANS)
    joblib.dump(scaler,    PKL_SCALER)
    joblib.dump(etiquetas, PKL_ETIQUETAS)
    joblib.dump(_cache,    PKL_RESULTADO)

    return _cache


def _cargar_o_entrenar():
    """Carga el .pkl si existe; si no, entrena y lo guarda."""
    global _cache

    if os.path.exists(PKL_RESULTADO):
        _cache = joblib.load(PKL_RESULTADO)
    else:
        _entrenar_y_guardar()


def reentrenar() -> dict:
    """Fuerza re-entrenamiento completo y sobreescribe los .pkl."""
    resultado = _entrenar_y_guardar()
    return {"mensaje": "Modelo KMeans reentrenado y guardado.", "silhouette_score": resultado["silhouette_score"]}


def obtener_clusters() -> dict:
    global _cache

    if _cache is None:
        _cargar_o_entrenar()

    if _cache is None:
        return {"error": "No se pudo cargar ni entrenar el modelo KMeans."}

    return _cache
