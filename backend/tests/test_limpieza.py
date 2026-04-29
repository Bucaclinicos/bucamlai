"""
Pruebas Unitarias — Fase 5: Evaluacion
Proyecto BUCAMLAI · Bucaclinicos S.A.S.

Validan las funciones individuales de limpieza y preparacion de datos
sin necesidad de levantar el servidor.

Herramienta: pytest
Ejecutar: cd backend && pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
import pytest
from services.limpieza import (
    _limpiar_numero,
    _clasificar_rentabilidad,
    obtener_df,
    obtener_resumen,
    normalizar_df,
)


# ─── Pruebas de _limpiar_numero ───────────────────────────────────────────────

class TestLimpiarNumero:
    """
    Valida la conversion del formato numerico colombiano a float estandar.
    El sistema de facturacion exporta: "14.850,00" (miles=punto, decimal=coma).
    Python necesita: 14850.0
    """

    def test_formato_colombiano_clasico(self):
        """14.850,00 -> 14850.0  (miles con punto, decimal con coma)"""
        assert _limpiar_numero("14.850,00") == 14850.0

    def test_entero_con_punto_miles(self):
        """1.200 -> 1200.0"""
        assert _limpiar_numero("1.200") == 1200.0

    def test_cero_decimal(self):
        """0,00 -> 0.0"""
        assert _limpiar_numero("0,00") == 0.0

    def test_numero_simple_sin_formato(self):
        """33 -> 33.0"""
        assert _limpiar_numero("33") == 33.0

    def test_valor_nan_retorna_cero(self):
        """Los valores NaN del CSV se convierten a 0.0"""
        assert _limpiar_numero(float("nan")) == 0.0

    def test_valor_none_retorna_cero(self):
        assert _limpiar_numero(None) == 0.0

    def test_texto_invalido_retorna_cero(self):
        """Texto que no es numero retorna 0.0 sin lanzar excepcion"""
        assert _limpiar_numero("DESCRIPCION") == 0.0

    def test_millon_formato_colombiano(self):
        """717.300.012,00 -> 717300012.0"""
        assert _limpiar_numero("717.300.012,00") == 717300012.0


# ─── Pruebas de _clasificar_rentabilidad ─────────────────────────────────────

class TestClasificarRentabilidad:
    """
    Valida la clasificacion de rentabilidad por umbrales definidos
    segun el dominio farmaceutico de Bucaclinicos.
    """

    def test_rentabilidad_negativa_es_perdida(self):
        assert _clasificar_rentabilidad(-5.0) == "PERDIDA"

    def test_rentabilidad_muy_negativa(self):
        """AMPICILINA 500MG tiene -618% en los datos reales"""
        assert _clasificar_rentabilidad(-618.0) == "PERDIDA"

    def test_limite_inferior_bajo(self):
        """Exactamente 0% -> BAJO"""
        assert _clasificar_rentabilidad(0.0) == "BAJO"

    def test_rentabilidad_baja(self):
        assert _clasificar_rentabilidad(10.0) == "BAJO"

    def test_limite_superior_bajo(self):
        """14.99% -> BAJO (el limite es < 15)"""
        assert _clasificar_rentabilidad(14.99) == "BAJO"

    def test_limite_inferior_medio(self):
        """15% -> MEDIO"""
        assert _clasificar_rentabilidad(15.0) == "MEDIO"

    def test_rentabilidad_media(self):
        assert _clasificar_rentabilidad(20.0) == "MEDIO"

    def test_limite_inferior_alto(self):
        """25% -> ALTO"""
        assert _clasificar_rentabilidad(25.0) == "ALTO"

    def test_rentabilidad_alta(self):
        assert _clasificar_rentabilidad(40.0) == "ALTO"

    def test_limite_inferior_excelente(self):
        """50% -> EXCELENTE"""
        assert _clasificar_rentabilidad(50.0) == "EXCELENTE"

    def test_rentabilidad_excelente(self):
        assert _clasificar_rentabilidad(75.0) == "EXCELENTE"

    def test_rentabilidad_cien_por_ciento(self):
        """100% ocurre en productos en consignacion (COSTO=0)"""
        assert _clasificar_rentabilidad(100.0) == "EXCELENTE"


# ─── Pruebas del DataFrame limpio ────────────────────────────────────────────

class TestDataFrame:
    """
    Valida que el dataset RENTA2026-3_LIMPIO.csv cargue correctamente
    y tenga la estructura esperada.
    """

    def test_df_carga_sin_error(self):
        df = obtener_df()
        assert df is not None
        assert len(df) > 0

    def test_df_tiene_registros_esperados(self):
        """El dataset limpio debe tener exactamente 3204 registros validos"""
        df = obtener_df()
        assert len(df) == 3204

    def test_df_tiene_columnas_obligatorias(self):
        df = obtener_df()
        columnas_requeridas = ["DESCRIPCION", "LABORATORIO", "UND_VEND", "VLR_VENTA", "RENTABILIDAD", "CLASIFICACION"]
        for col in columnas_requeridas:
            assert col in df.columns, f"Columna faltante: {col}"

    def test_df_sin_unidades_cero(self):
        """No debe haber registros con UND_VEND = 0 (se eliminaron en la limpieza)"""
        df = obtener_df()
        assert (df["UND_VEND"] == 0).sum() == 0

    def test_df_clasificacion_tiene_cinco_categorias(self):
        df = obtener_df()
        categorias = set(df["CLASIFICACION"].unique())
        # El CSV puede tener "PÉRDIDA"/"PERDIDA" y "BUENO"/"ALTO" segun la version
        # Se valida que haya exactamente 5 categorias distintas
        assert len(categorias) == 5

    def test_df_precio_unitario_calculado(self):
        """PRECIO_UNITARIO debe estar calculado y presente en el DataFrame.
        La mayoria son positivos; algunos pueden ser negativos (devoluciones)
        o cero. Se valida que mas del 95% sean valores positivos."""
        df = obtener_df()
        assert "PRECIO_UNITARIO" in df.columns
        assert df["PRECIO_UNITARIO"].notna().all()
        assert (df["PRECIO_UNITARIO"] > 0).sum() > len(df) * 0.95

    def test_df_variables_derivadas_presentes(self):
        """COSTO_UNITARIO y MARGEN_UNITARIO deben existir (Paso 2)"""
        df = obtener_df()
        assert "COSTO_UNITARIO" in df.columns
        assert "MARGEN_UNITARIO" in df.columns


# ─── Pruebas de normalizacion Min-Max ────────────────────────────────────────

class TestNormalizacion:
    """
    Valida la Normalizacion Min-Max (Fase 3 — tecnica pendiente de la presentacion).
    Corrige la distorsion de la Primera Semana de Marzo (~7 dias vs ~30 dias).
    """

    def test_normalizar_retorna_df(self):
        df = obtener_df()
        df_n = normalizar_df(df)
        assert isinstance(df_n, pd.DataFrame)

    def test_columnas_normalizadas_existen(self):
        df = obtener_df()
        df_n = normalizar_df(df)
        for col in ["UND_VEND_N", "VLR_VENTA_N", "PRECIO_UNITARIO_N", "COSTO_N"]:
            assert col in df_n.columns, f"Columna normalizada faltante: {col}"

    def test_rango_normalizado_entre_0_y_1(self):
        """Min-Max garantiza que todos los valores queden en [0, 1]"""
        df = obtener_df()
        df_n = normalizar_df(df)
        for col in ["UND_VEND_N", "VLR_VENTA_N", "PRECIO_UNITARIO_N"]:
            assert df_n[col].min() >= 0.0, f"{col} tiene valores < 0"
            assert df_n[col].max() <= 1.0, f"{col} tiene valores > 1"

    def test_normalizacion_no_modifica_df_original(self):
        """normalizar_df debe retornar una copia, no modificar el original"""
        df = obtener_df()
        columnas_originales = set(df.columns)
        normalizar_df(df)
        assert set(df.columns) == columnas_originales


# ─── Pruebas del resumen ──────────────────────────────────────────────────────

class TestResumen:
    """
    Valida que obtener_resumen() retorne los campos y valores correctos
    que usa el Dashboard y el contexto del chatbot Gemini.
    """

    def test_resumen_retorna_campos_correctos(self):
        r = obtener_resumen()
        campos = ["total_registros", "productos_unicos", "laboratorios_unicos",
                  "clasificacion", "venta_total", "utilidad_total"]
        for campo in campos:
            assert campo in r, f"Campo faltante en resumen: {campo}"

    def test_resumen_total_registros(self):
        assert obtener_resumen()["total_registros"] == 3204

    def test_resumen_productos_unicos(self):
        assert obtener_resumen()["productos_unicos"] == 1593

    def test_resumen_venta_total_positiva(self):
        assert obtener_resumen()["venta_total"] > 0

    def test_resumen_incluye_variables_derivadas(self):
        """El resumen debe incluir estadisticas de las nuevas variables (Paso 2)"""
        r = obtener_resumen()
        assert "precio_unitario_promedio" in r
        assert "costo_unitario_promedio" in r
        assert "margen_unitario_promedio" in r
