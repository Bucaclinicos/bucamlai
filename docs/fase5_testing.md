# Fase 5 — Testing y Evaluación
## Proyecto BUCAMLAI · Bucaclínicos S.A.S.

---

## ¿Qué es esta fase en CRISP-DM?

En CRISP-DM la Fase 5 se llama "Evaluación". Su propósito es verificar que los modelos construidos en la Fase 4 realmente resuelven los objetivos de negocio de la Fase 1. No basta con que el modelo "funcione" — hay que medir qué tan bien funciona y si los resultados tienen sentido para Bucaclínicos.

En el contexto del desarrollo de software (que es como está planteado el proyecto en la presentación técnica), esta fase también cubre el **Testing** de la aplicación: pruebas unitarias, pruebas de integración y pruebas de seguridad.

---

## Herramientas usadas

| Herramienta | Rol |
|-------------|-----|
| **pytest 9.0.3** | Framework de pruebas unitarias para Python. Valida funciones de limpieza, cálculos de rentabilidad y lógica de negocio. |
| **httpx + FastAPI TestClient** | Pruebas de integración sobre los endpoints REST. Valida que todos los endpoints respondan con los códigos HTTP y datos esperados. |

---

## Resultado real de las pruebas

```
68 passed en 14.85 segundos
```

Ejecutar con:
```bash
cd bucamlai/backend
venv/Scripts/pytest tests/ -v -k "not Asociacion"
```

> Nota: La prueba de Asociación (Apriori) se excluye del run estándar por rendimiento — el algoritmo tarda varios minutos con el dataset completo. Se ejecuta por separado con `pytest tests/ -k Asociacion`.

---

## Estructura de los archivos de prueba

```
backend/
└── tests/
    ├── __init__.py
    ├── test_limpieza.py   ← Pruebas unitarias (36 tests)
    └── test_api.py        ← Pruebas de integración (34 tests)
```

---

## Pruebas Unitarias — `test_limpieza.py` (36 tests)

Validan funciones individuales de forma aislada, sin necesidad de levantar el servidor.

### TestLimpiarNumero (8 tests)

Valida `_limpiar_numero()` — conversión del formato numérico colombiano a float estándar.

| Test | Entrada | Resultado esperado |
|------|---------|-------------------|
| `test_formato_colombiano_clasico` | `"14.850,00"` | `14850.0` |
| `test_entero_con_punto_miles` | `"1.200"` | `1200.0` |
| `test_cero_decimal` | `"0,00"` | `0.0` |
| `test_numero_simple_sin_formato` | `"33"` | `33.0` |
| `test_valor_nan_retorna_cero` | `float('nan')` | `0.0` |
| `test_valor_none_retorna_cero` | `None` | `0.0` |
| `test_texto_invalido_retorna_cero` | `"DESCRIPCION"` | `0.0` |
| `test_millon_formato_colombiano` | `"717.300.012,00"` | `717300012.0` |

**¿Por qué son críticas?** Si `_limpiar_numero()` falla, todos los modelos producen resultados incorrectos porque trabajan sobre datos mal convertidos.

### TestClasificarRentabilidad (12 tests)

Valida `_clasificar_rentabilidad()` — umbrales de clasificación por dominio farmacéutico.

| Test | Valor | Clasificación esperada |
|------|-------|----------------------|
| `test_rentabilidad_negativa_es_perdida` | `-5.0` | `PERDIDA` |
| `test_rentabilidad_muy_negativa` | `-618.0` | `PERDIDA` |
| `test_limite_inferior_bajo` | `0.0` | `BAJO` |
| `test_limite_superior_bajo` | `14.99` | `BAJO` |
| `test_limite_inferior_medio` | `15.0` | `MEDIO` |
| `test_limite_inferior_alto` | `25.0` | `ALTO` |
| `test_limite_inferior_excelente` | `50.0` | `EXCELENTE` |
| `test_rentabilidad_cien_por_ciento` | `100.0` | `EXCELENTE` |

**Dato real:** AMPICILINA 500MG tiene -618% de rentabilidad en los datos de Bucaclínicos. Este caso extremo está cubierto por `test_rentabilidad_muy_negativa`.

### TestDataFrame (7 tests)

Validan que el CSV limpio cargue con la estructura correcta.

- 3.204 registros exactos
- Columnas obligatorias presentes (`DESCRIPCION`, `LABORATORIO`, `UND_VEND`, `VLR_VENTA`, `RENTABILIDAD`, `CLASIFICACION`)
- Sin registros con `UND_VEND = 0`
- Exactamente 5 categorías de rentabilidad
- `PRECIO_UNITARIO`, `COSTO_UNITARIO`, `MARGEN_UNITARIO` presentes (variables derivadas del Paso 2)

### TestNormalizacion (4 tests)

Validan `normalizar_df()` — Min-Max Normalization implementada en el Paso 2.

- Las columnas `UND_VEND_N`, `VLR_VENTA_N`, `PRECIO_UNITARIO_N`, `COSTO_N` existen
- El rango de todos los valores normalizados está en `[0.0, 1.0]`
- `normalizar_df()` retorna una copia — no modifica el DataFrame original

### TestResumen (5 tests)

Validan `obtener_resumen()` — los datos que usa el Dashboard y el contexto del chatbot Gemini.

- `total_registros == 3204`
- `productos_unicos == 1593`
- Incluye `precio_unitario_promedio`, `costo_unitario_promedio`, `margen_unitario_promedio`

---

## Pruebas de Integración — `test_api.py` (34 tests)

Validan que los endpoints de la API respondan correctamente de punta a punta usando FastAPI TestClient (sin levantar servidor real).

### TestRaiz (3 tests)
- `GET /` → HTTP 200 con `"BUCAMLAI"` en el mensaje
- `GET /docs` → HTTP 200 (Swagger disponible)

### TestDatosResumen (6 tests)
- `GET /datos/resumen` → 200, `total_registros=3204`, `productos_unicos=1593`
- Incluye variables derivadas en la respuesta

### TestCargarArchivo (2 tests)
- PDF rechazado → HTTP 400
- Sin archivo → HTTP 422

### TestPrediccion (6 tests)
- DIPIRONA válida → 200, `unidades_predichas_por_mes > 0`
- 3 meses = 3× el mensual (con tolerancia de redondeo)
- Medicamento inexistente → `{"error": ..., "sugerencia": [...]}`
- Respuesta incluye `metricas_modelo` con `mae` y `rmse`
- Sin campo `medicamento` → HTTP 422

### TestClusters (5 tests)
- `GET /modelos/clusters` → 200, 1.593 productos, categorías `{A, B, C}`
- `silhouette_score` presente y **> 0.5** ✓ (resultado real: **0.7325**)

### TestPareto (7 tests)
- `GET /pareto/abc` → 200, 1.593 productos
- Categorías `{A, B, C}` presentes
- Categoría A genera entre 75% y 85% de las ventas ✓ (resultado real: **79.96%**)
- Último producto tiene acumulado ≈ 100%
- Productos ordenados de mayor a menor venta

### TestAsociacion (2 tests)
- `GET /asociacion/reglas` → 200 con campo `reglas`

### TestSeguridad (3 tests)
- Ruta inexistente → HTTP 404
- GET en endpoint que solo acepta POST → HTTP 405
- JSON con tipos incorrectos → HTTP 422

---

## Evaluación de los modelos de Machine Learning

### Random Forest Regressor — Métricas reales

**Metodología:** Train/Test Split 80/20 (`random_state=42`)

| Métrica | Valor real | Criterio de aceptación | ¿Cumple? |
|---------|-----------|----------------------|---------|
| MAE | 15.46 unidades/mes | < 10 | No aún |
| RMSE | 56.28 unidades | < 20 | No aún |

**¿Por qué no cumple todavía?**
El dataset tiene solo 3 períodos (~10 semanas). El modelo aprende del mismo período en el que entrena, lo que limita su capacidad de generalizar. Cuando Bucaclínicos entregue 12+ meses de datos, las métricas mejorarán sustancialmente (plan: migrar a Prophet o ARIMA según la presentación técnica).

**Las métricas se exponen en el endpoint:**
```json
POST /modelos/prediccion
{
  "metricas_modelo": {
    "mae": 15.4617,
    "rmse": 56.281,
    "mae_aceptable": false,
    "rmse_aceptable": false,
    "registros_entrenamiento": 2563,
    "registros_prueba": 641
  }
}
```

### KMeans — Silhouette Score real

| Métrica | Valor real | Criterio de aceptación | ¿Cumple? |
|---------|-----------|----------------------|---------|
| Silhouette Score | **0.7325** | > 0.5 | **Sí** |

Los clusters están bien definidos y separados. La clasificación A/B/C de los 1.593 productos es estadísticamente válida.

### Pareto / ABC — Validación de negocio

| Categoría | Productos | % de ventas | Criterio |
|-----------|-----------|-------------|---------|
| A | 484 | 79.96% | ≈ 80% ✓ |
| B | 485 | 15.03% | ≈ 15% ✓ |
| C | 624 | 5.01% | ≈ 5% ✓ |

El Principio de Pareto se cumple: el 30% de los productos (484/1.593) genera el 80% de los ingresos.

### Reglas de Asociación (Apriori)

**Limitación conocida:** Con solo 3 períodos como canastas, el soporte mínimo es 0.33. Las reglas generadas son válidas pero de alcance limitado. Cuando se tengan datos de tickets individuales por cliente, el Apriori producirá reglas mucho más específicas.

---

## ¿Por qué no saltarse esta fase?

> **"IEEE 830 + CRISP-DM = trazabilidad total. Cada requisito del negocio es rastreable hasta el modelo ML que lo satisface."**

Las 68 pruebas son la **evidencia formal** de que el sistema hace lo que dice que hace. Sin ellas, no se puede demostrar ante Bucaclínicos que:

- Los datos se limpian correctamente (conversión del formato colombiano)
- Los endpoints responden con los datos esperados
- El KMeans produce clusters estadísticamente válidos (Silhouette > 0.5)
- El Pareto cumple el principio de los 80/20
- El sistema rechaza correctamente entradas inválidas (HTTP 400, 422, 405)
