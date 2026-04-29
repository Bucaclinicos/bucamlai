"""
Pruebas de Integracion — Fase 5: Evaluacion
Proyecto BUCAMLAI · Bucaclinicos S.A.S.

Validan que los endpoints REST respondan correctamente de punta a punta,
sin levantar un servidor real (usa FastAPI TestClient).

Herramienta: httpx + FastAPI TestClient
Ejecutar: cd backend && pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ─── RF: Raiz de la API ───────────────────────────────────────────────────────

class TestRaiz:
    def test_root_responde_200(self):
        r = client.get("/")
        assert r.status_code == 200

    def test_root_contiene_bucamlai(self):
        r = client.get("/")
        assert "BUCAMLAI" in r.json()["mensaje"]

    def test_docs_accesibles(self):
        r = client.get("/docs")
        assert r.status_code == 200


# ─── RF: Datos / Resumen ──────────────────────────────────────────────────────

class TestDatosResumen:
    """Valida RF asociado a la carga y consulta del dataset."""

    def test_resumen_retorna_200(self):
        r = client.get("/datos/resumen")
        assert r.status_code == 200

    def test_resumen_total_registros(self):
        r = client.get("/datos/resumen")
        assert r.json()["total_registros"] > 0

    def test_resumen_productos_unicos(self):
        r = client.get("/datos/resumen")
        assert r.json()["productos_unicos"] > 0

    def test_resumen_venta_total_positiva(self):
        r = client.get("/datos/resumen")
        assert r.json()["venta_total"] > 0

    def test_resumen_tiene_clasificacion(self):
        r = client.get("/datos/resumen")
        assert "clasificacion" in r.json()
        assert isinstance(r.json()["clasificacion"], dict)

    def test_resumen_tiene_variables_derivadas(self):
        r = client.get("/datos/resumen")
        body = r.json()
        assert "precio_unitario_promedio" in body
        assert "margen_unitario_promedio" in body


# ─── RF: Carga de archivo ────────────────────────────────────────────────────

class TestCargarArchivo:
    def test_cargar_formato_invalido_retorna_400(self):
        """Un PDF no es un formato valido — debe rechazarse con HTTP 400"""
        r = client.post("/datos/cargar",
            files={"archivo": ("datos.pdf", b"contenido invalido", "application/pdf")},
            data={"periodo": "ENERO-2026"},
        )
        assert r.status_code == 400

    def test_cargar_sin_archivo_retorna_422(self):
        """Sin archivo en el body -> 422 Unprocessable Entity"""
        r = client.post("/datos/cargar")
        assert r.status_code == 422


# ─── RF-03: Prediccion de demanda ────────────────────────────────────────────

class TestPrediccion:
    """Valida el endpoint POST /modelos/prediccion (Random Forest — usar_prophet=False)."""

    # Usamos usar_prophet=False para que los tests no dependan de la API externa de clima
    # y sean deterministas y rápidos. Los tests de Prophet se hacen manualmente.
    _PAYLOAD_BASE = {
        "medicamento": "DIPIRONA 1 GR / 2 ML X AMP",
        "meses": 1,
        "temporada": "normal",
        "usar_prophet": False,
    }

    def test_prediccion_medicamento_valido_retorna_200(self):
        r = client.post("/modelos/prediccion", json=self._PAYLOAD_BASE)
        assert r.status_code == 200

    def test_prediccion_retorna_unidades_positivas(self):
        r = client.post("/modelos/prediccion", json=self._PAYLOAD_BASE)
        assert r.json()["unidades_predichas_por_mes"] > 0

    def test_prediccion_tres_meses_es_triple_del_mensual(self):
        """El total para 3 meses debe ser 3x la prediccion mensual (tolerancia de redondeo)"""
        payload = {**self._PAYLOAD_BASE, "meses": 3}
        r = client.post("/modelos/prediccion", json=payload)
        body = r.json()
        esperado = body["unidades_predichas_por_mes"] * 3
        assert abs(body["unidades_predichas_total"] - esperado) < 0.05

    def test_prediccion_medicamento_invalido_retorna_error_y_sugerencia(self):
        r = client.post("/modelos/prediccion", json={
            **self._PAYLOAD_BASE,
            "medicamento": "MEDICAMENTO_QUE_NO_EXISTE_XYZ",
        })
        assert r.status_code == 200
        body = r.json()
        assert "error" in body
        assert "sugerencia" in body

    def test_prediccion_incluye_metricas_mae_rmse(self):
        """La respuesta debe incluir MAE y RMSE del modelo"""
        r = client.post("/modelos/prediccion", json=self._PAYLOAD_BASE)
        body = r.json()
        assert "metricas_modelo" in body
        assert "mae" in body["metricas_modelo"]
        assert "rmse" in body["metricas_modelo"]

    def test_prediccion_sin_medicamento_retorna_422(self):
        r = client.post("/modelos/prediccion", json={"meses": 1, "usar_prophet": False})
        assert r.status_code == 422

    def test_prediccion_meses_fuera_de_rango_retorna_422(self):
        """meses debe estar entre 1 y 24"""
        r = client.post("/modelos/prediccion", json={**self._PAYLOAD_BASE, "meses": 100})
        assert r.status_code == 422


# ─── RF-04: Clusters / Inventario ABC (KMeans) ───────────────────────────────

class TestClusters:
    """Valida el endpoint GET /modelos/clusters (KMeans k=3)."""

    def test_clusters_retorna_200(self):
        r = client.get("/modelos/clusters")
        assert r.status_code == 200

    def test_clusters_total_productos(self):
        r = client.get("/modelos/clusters")
        assert r.json()["total_productos"] > 0

    def test_clusters_categorias_son_abc(self):
        r = client.get("/modelos/clusters")
        categorias = {p["categoria"] for p in r.json()["productos"]}
        assert categorias == {"A", "B", "C"}

    def test_clusters_incluye_silhouette_score(self):
        """El Silhouette Score debe estar presente (Paso 2)"""
        r = client.get("/modelos/clusters")
        body = r.json()
        assert "silhouette_score" in body
        assert isinstance(body["silhouette_score"], float)

    def test_clusters_silhouette_supera_umbral(self):
        """Criterio de aceptacion: Silhouette Score > 0.5"""
        r = client.get("/modelos/clusters")
        assert r.json()["silhouette_score"] > 0.5


# ─── RF: Pareto / Analisis ABC ───────────────────────────────────────────────

class TestPareto:
    """Valida el endpoint GET /pareto/abc (Analisis de Pareto con cumsum)."""

    def test_pareto_retorna_200(self):
        r = client.get("/pareto/abc")
        assert r.status_code == 200

    def test_pareto_total_productos(self):
        r = client.get("/pareto/abc")
        assert r.json()["total_productos"] > 0

    def test_pareto_tres_categorias_abc(self):
        r = client.get("/pareto/abc")
        categorias = {c["categoria_abc"] for c in r.json()["resumen_abc"]}
        assert categorias == {"A", "B", "C"}

    def test_pareto_categoria_a_genera_80_por_ciento(self):
        """La categoria A debe acumular ~80% de las ventas (Principio de Pareto)"""
        r = client.get("/pareto/abc")
        cat_a = next(c for c in r.json()["resumen_abc"] if c["categoria_abc"] == "A")
        assert 75 <= cat_a["porcentaje_venta"] <= 85

    def test_pareto_acumulado_llega_a_100(self):
        """El ultimo producto debe tener acumulado == 100%"""
        r = client.get("/pareto/abc")
        ultimo = r.json()["productos"][-1]
        assert abs(ultimo["acumulado"] - 100.0) < 0.5

    def test_pareto_productos_ordenados_por_venta_descendente(self):
        """Los productos deben estar ordenados de mayor a menor venta"""
        r = client.get("/pareto/abc")
        ventas = [p["venta_total"] for p in r.json()["productos"]]
        assert ventas == sorted(ventas, reverse=True)

    def test_pareto_venta_total_global_positiva(self):
        r = client.get("/pareto/abc")
        assert r.json()["venta_total_global"] > 0


# ─── RF: Reglas de Asociacion ────────────────────────────────────────────────

class TestAsociacion:
    """Valida el endpoint GET /asociacion/reglas (Apriori)."""

    def test_reglas_retorna_200(self):
        r = client.get("/asociacion/reglas")
        assert r.status_code == 200

    def test_reglas_tiene_campo_reglas(self):
        r = client.get("/asociacion/reglas")
        assert "reglas" in r.json()


# ─── Seguridad basica ─────────────────────────────────────────────────────────

class TestSeguridad:
    """
    Pruebas de seguridad basica segun la presentacion tecnica.
    Nota: JWT completo pendiente de implementacion en Fase 6.
    """

    def test_endpoint_inexistente_retorna_404(self):
        r = client.get("/ruta/que/no/existe")
        assert r.status_code == 404

    def test_metodo_incorrecto_retorna_405(self):
        """GET en un endpoint que solo acepta POST debe retornar 405"""
        r = client.get("/modelos/prediccion")
        assert r.status_code == 405

    def test_json_malformado_retorna_422(self):
        """Body con tipos incorrectos debe retornar 422"""
        r = client.post("/modelos/prediccion", json={
            "medicamento": 12345,
            "meses": "no_es_numero",
            "temporada": "normal"
        })
        assert r.status_code == 422
