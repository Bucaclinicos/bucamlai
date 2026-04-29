# Técnicas de Procesamiento de Datos
## Proyecto BUCAMLAI · Bucaclínicos S.A.S.

---

## Contexto

El archivo fuente `RENTA2026-3.csv` es un reporte exportado directamente del sistema de facturación POS de Bucaclínicos. Fue diseñado para visualización en pantalla, no para análisis de datos. Por eso contiene 8 problemas de calidad que deben resolverse antes de cualquier modelo de Machine Learning.

**Archivo:** `backend/services/limpieza.py`
**Resultado:** de 3.306 filas crudas → 3.204 registros válidos y limpios

---

## Técnicas Aplicadas

### Técnica 1 — Transformación del Formato Numérico Colombiano

**Problema:** El sistema POS exporta los números con formato colombiano:
- Separador de miles: punto → `14.850`
- Separador decimal: coma → `14.850,00`

Python interpreta `14.850,00` como texto o como `14.85` (catorce punto ochenta y cinco), no como `14850.00`. Esto hace que todas las sumas y cálculos sean incorrectos.

**Solución implementada:**
```python
def _limpiar_numero(valor):
    texto = str(valor).strip().replace(".", "").replace(",", ".")
    return float(texto)
```

**Columnas afectadas:** `COSTO`, `UND_VEND`, `VLR_VENTA`, `UTILIDAD`, `RENTABILIDAD`

**Validación:** 8 pruebas unitarias en `tests/test_limpieza.py` → `TestLimpiarNumero`

---

### Técnica 2 — Eliminación de Filas de Metadata

**Problema:** El CSV repite el encabezado de la empresa al inicio de cada período:
```
BUCACLÍNICOS S.A.S.
NIT: 900.XXX.XXX-X
RENTA DE PRODUCTOS ENERO 2026
COD;DESCRIPCION;LABORATORIO;...   ← encabezado de columnas
```

Estas filas no son registros de productos. Si se dejan, los encoders de scikit-learn y pandas fallan al intentar convertirlas.

**Solución implementada:**
```python
palabras_meta = ["empresa", "nit", "cod", "descripcion", "fecha", "bucaclinicos"]
mascara = df_crudo.iloc[:, 0].astype(str).str.lower().str.strip().apply(
    lambda x: any(p in x for p in palabras_meta) or x == "" or x == "nan"
)
df = df_crudo[~mascara].copy()
df = df.dropna(how="all")
```

**Registros eliminados:** ~102 filas de metadata y líneas vacías separadoras

---

### Técnica 3 — Eliminación de Registros sin Venta Real

**Problema:** El dataset incluye productos con `UND_VEND = 0`. Estos registros aparecen porque el sistema registra productos que estaban en el catálogo durante el período pero no tuvieron movimiento. No aportan información para los modelos de predicción de demanda.

**Solución implementada:**
```python
df = df[df["UND_VEND"] > 0].copy()
```

**Efecto:** De ~3.306 registros crudos → 3.204 registros con venta real.

---

### Técnica 4 — Estimación de Variables Derivadas

**Problema:** El CSV tiene el valor total de ventas (`VLR_VENTA`) y unidades vendidas (`UND_VEND`), pero no el precio por unidad. Sin esta variable, no es posible comparar precios entre productos ni detectar precios desactualizados.

**Variables calculadas:**

| Variable | Fórmula | Propósito |
|----------|---------|-----------|
| `PRECIO_UNITARIO` | `VLR_VENTA / UND_VEND` | Precio real por unidad vendida |
| `COSTO_UNITARIO` | `COSTO / UND_VEND` | Costo real por unidad |
| `MARGEN_UNITARIO` | `PRECIO_UNITARIO - COSTO_UNITARIO` | Ganancia neta por unidad |

**Código:**
```python
df["PRECIO_UNITARIO"] = (df["VLR_VENTA"] / df["UND_VEND"]).round(2)
df["COSTO_UNITARIO"]  = (df["COSTO"] / df["UND_VEND"]).replace([np.inf, -np.inf], 0).round(2)
df["MARGEN_UNITARIO"] = (df["PRECIO_UNITARIO"] - df["COSTO_UNITARIO"]).round(2)
```

**Resultado en los datos reales:**
- Precio unitario promedio: $27.458 COP
- Costo unitario promedio: $18.779 COP
- Margen unitario promedio: $8.679 COP

---

### Técnica 5 — Clasificación por Umbrales de Rentabilidad

**Problema:** La columna `RENTABILIDAD` es un número continuo (puede ir de -618% a +100%). Para generar alertas, mostrar colores en el dashboard y alimentar el modelo de clasificación, se necesita convertirla en categorías discretas con significado de negocio.

**Umbrales definidos según dominio farmacéutico:**

| Rango | Clasificación | Significado | Cantidad | % |
|-------|--------------|-------------|----------|---|
| < 0% | PERDIDA | Venta bajo costo. Acción inmediata. | 43 | 1.3% |
| 0% – 15% | BAJO | Margen muy bajo. Revisar proveedor. | 51 | 1.6% |
| 15% – 25% | MEDIO | Margen aceptable. Monitoreo periódico. | 247 | 7.7% |
| 25% – 50% | ALTO | Margen saludable. | 1.741 | 54.3% |
| > 50% | EXCELENTE | Margen alto. Incluye consignación. | 1.122 | 35.0% |

**Casos extremos identificados:**
- `AMPICILINA 500MG`: -618% — por cada peso ingresado, la farmacia pierde 6.18
- `ENOXAPARINA 40MG`: -276%
- ~10 productos con COSTO = 0 (consignación/donación) → se conservan marcados

**Código:**
```python
def _clasificar_rentabilidad(rent):
    if rent < 0:    return "PERDIDA"
    elif rent < 15: return "BAJO"
    elif rent < 25: return "MEDIO"
    elif rent < 50: return "ALTO"
    else:           return "EXCELENTE"
```

---

### Técnica 6 — Asignación de Variable Temporal (PERIODO)

**Problema:** El CSV no tiene una columna de fecha por fila. La fecha se infiere por la sección del documento donde aparece el registro. Sin esta variable, los modelos no pueden detectar estacionalidad ni tendencias.

**Solución:** Se detecta el bloque del archivo al que pertenece cada registro y se asigna la etiqueta:

| Bloque | PERIODO asignado | Días cubiertos |
|--------|-----------------|----------------|
| Bloque 1 | `Enero` | ~30 días |
| Bloque 2 | `Febrero` | ~30 días |
| Bloque 3 | `Primera Sem. Marzo` | ~7 días |

**Importancia:** Sin esta corrección, el modelo interpreta que en Marzo se vende menos (porque los valores absolutos son menores) cuando en realidad la tasa diaria es la misma. La Normalización Min-Max corrige esta distorsión.

---

### Técnica 7 — Normalización Min-Max

**Problema:** Los tres períodos tienen duraciones muy distintas: Enero y Febrero cubren ~30 días pero la Primera Semana de Marzo solo ~7 días. Sin normalizar, el modelo ve que Marzo tiene menos ventas y lo interpreta como baja demanda, cuando en realidad la tasa diaria es igual o mayor.

**Fórmula:**
```
X_normalizado = (X - X_mínimo) / (X_máximo - X_mínimo)
```

Escala todos los valores al rango [0, 1], haciendo comparables períodos de distinta duración.

**Variables normalizadas:**

| Variable original | Variable normalizada | Rango resultante |
|-------------------|---------------------|-----------------|
| `UND_VEND` | `UND_VEND_N` | [0.0, 1.0] |
| `VLR_VENTA` | `VLR_VENTA_N` | [0.0, 1.0] |
| `PRECIO_UNITARIO` | `PRECIO_UNITARIO_N` | [0.0, 1.0] |
| `COSTO` | `COSTO_N` | [0.0, 1.0] |

**Código:**
```python
from sklearn.preprocessing import MinMaxScaler

def normalizar_df(df):
    df_norm = df.copy()
    cols = ["UND_VEND", "VLR_VENTA", "PRECIO_UNITARIO", "COSTO"]
    scaler = MinMaxScaler()
    valores = scaler.fit_transform(df_norm[cols])
    for i, col in enumerate(cols):
        df_norm[f"{col}_N"] = valores[:, i].round(4)
    return df_norm
```

**Librería:** `scikit-learn · MinMaxScaler`

---

### Técnica 8 — Detección de Atípicos por Dominio

**Problema:** Los outliers estadísticos no siempre son errores. En el contexto farmacéutico, `COSTO = 0` no es un error matemático sino un producto en consignación. Si se eliminan, se pierden datos válidos. Si se dejan sin marcar, distorsionan los promedios.

**Tratamiento por caso:**

| Caso | Cantidad | Tratamiento |
|------|----------|-------------|
| `COSTO = 0` | ~10-15 productos | Conservar. RENTABILIDAD = 100% no refleja margen comercial real |
| `RENTABILIDAD < -100%` | ~5 productos | Conservar como alertas críticas de precio |
| Duplicados por laboratorio alterno | Varios | Conservar como registros separados para análisis de proveedor |

---

## Pipeline completo de procesamiento

```
RENTA2026-3.csv
   3.306 filas crudas
        │
        ▼
[Técnica 2] Eliminar metadata y encabezados de empresa
        │
        ▼
[Técnica 1] Convertir formato numérico colombiano → float
        │
        ▼
[Técnica 3] Eliminar registros con UND_VEND = 0
        │
        ▼
[Técnica 4] Calcular variables derivadas
            PRECIO_UNITARIO, COSTO_UNITARIO, MARGEN_UNITARIO
        │
        ▼
[Técnica 5] Clasificar por umbrales de rentabilidad
            PERDIDA / BAJO / MEDIO / ALTO / EXCELENTE
        │
        ▼
[Técnica 6] Asignar variable temporal PERIODO
            Enero / Febrero / Primera Sem. Marzo
        │
        ▼
[Técnica 8] Marcar atípicos por dominio
            (conservar con anotación)
        │
        ▼
RENTA2026-3_LIMPIO.csv
   3.204 registros válidos
        │
        ▼
[Técnica 7] Normalización Min-Max → UND_VEND_N, VLR_VENTA_N...
        │
        ├──► Random Forest Regressor
        ├──► KMeans Clustering
        ├──► Análisis de Pareto / ABC
        └──► Reglas de Asociación (Apriori)
```

---

## Dataset resultante: RENTA2026-3_LIMPIO.csv

| Columna | Tipo | Origen |
|---------|------|--------|
| `PERIODO` | texto | Técnica 6 — bloque del archivo |
| `COD` | texto | Original |
| `DESCRIPCION` | texto | Original (limpiada de * y espacios) |
| `LABORATORIO` | texto | Original |
| `COSTO` | float | Técnica 1 — conversión colombiana |
| `UND_VEND` | float | Técnica 1 |
| `VLR_VENTA` | float | Técnica 1 |
| `UTILIDAD` | float | Técnica 1 |
| `RENTABILIDAD` | float | Técnica 1 |
| `CLASIFICACION` | texto | **Técnica 5** — umbrales de rentabilidad |
| `PRECIO_UNITARIO` | float | **Técnica 4** — variable derivada |
| `COSTO_UNITARIO` | float | **Técnica 4** — variable derivada |
| `MARGEN_UNITARIO` | float | **Técnica 4** — variable derivada |

**Estadísticas finales del dataset limpio:**
- Total registros: **3.204**
- Productos únicos: **1.593**
- Laboratorios únicos: **165**
- Venta total acumulada: **$717.300.012 COP**
- Utilidad total: **$247.667.180 COP**
- Margen general: **34.5%**
- Precio unitario promedio: **$27.458 COP**
- Costo unitario promedio: **$18.779 COP**
- Margen unitario promedio: **$8.679 COP**
