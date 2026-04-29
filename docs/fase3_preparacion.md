# Fase 3 — Preparación de Datos
## Proyecto BUCAMLAI · Bucaclínicos S.A.S.

---

## ¿Qué es esta fase en CRISP-DM?

La Fase 3 de CRISP-DM es donde se toma el dataset crudo identificado en la Fase 2 y se transforma en un dataset limpio, estructurado y listo para que los modelos de Machine Learning puedan trabajar con él. Es la fase más crítica del proyecto: si los datos entran sucios, los modelos producen resultados incorrectos sin importar qué tan sofisticados sean.

En términos simples: **basura entra, basura sale**. Esta fase evita eso.

---

## Problema que resuelve en Bucaclínicos

El archivo `RENTA2026-3.csv` viene directamente del sistema de facturación de la farmacia. Ese sistema fue diseñado para generar reportes visuales en pantalla, no para alimentar modelos de IA. Por eso el archivo tiene 8 problemas de calidad identificados en la Fase 2 que deben resolverse antes de cualquier análisis.

---

## Técnicas aplicadas en esta fase

### Técnica 1 — Transformación y Limpieza de Datos
**Archivo:** `backend/services/limpieza.py`

**¿Por qué se necesita?**
El sistema de facturación de Bucaclínicos exporta los números en formato colombiano: los miles se separan con punto y los decimales con coma. Por ejemplo, `14.850,00` significa catorce mil ochocientos cincuenta pesos, no catorce punto ochocientos cincuenta. Python y pandas interpretan esto al revés y producen errores o datos incorrectos.

**¿Cómo se hace?**
```python
def _limpiar_numero(valor):
    texto = str(valor).strip().replace(".", "").replace(",", ".")
    return float(texto)
```
Se elimina el punto (separador de miles) y se reemplaza la coma por punto (separador decimal estándar).

**¿Qué más se limpia?**
- Filas de metadata: el archivo repite el encabezado de la empresa (nombre, NIT, dirección) al inicio de cada período. Estas filas se detectan y eliminan porque no son registros de productos.
- Filas vacías separadoras: líneas que solo contienen `;` entre bloques de períodos. Se eliminan con `dropna(how='all')`.
- Columna vacía extra: artefacto de la exportación del sistema POS, se ignora.
- Caracteres especiales: algunos nombres de productos tienen asteriscos (`*`) al inicio o fin, usados por la farmacia para destacar productos. Se limpian.
- Registros con UND_VEND = 0: productos sin venta real en el período. No aportan información para el modelado y se eliminan.

**Resultado:**
De **3.306 filas brutas** → **3.204 registros válidos y limpios**.

---

### Técnica 2 — Estimación de Variables Derivadas
**Archivo:** `backend/services/limpieza.py`

**¿Por qué se necesita?**
El CSV tiene el valor total de ventas (`VLR_VENTA`) y las unidades vendidas (`UND_VEND`), pero no tiene el precio por unidad. Los modelos de ML necesitan trabajar a nivel de unidad individual para hacer predicciones útiles, no a nivel de lote.

**Variables que se calculan:**
```
PRECIO_UNITARIO = VLR_VENTA / UND_VEND
```

Esta variable nueva permite:
- Comparar precios entre productos de diferentes presentaciones
- Detectar productos con precios desactualizados
- Ser usada como feature en el Random Forest

**Pendiente de implementar (paso 2 del plan):**
```
COSTO_UNITARIO  = COSTO / UND_VEND
MARGEN_UNITARIO = PRECIO_UNITARIO - COSTO_UNITARIO
```
Estas dos variables adicionales mejorarán la precisión del modelo de predicción.

---

### Técnica 3 — Clasificación por Umbrales de Rentabilidad
**Archivo:** `backend/services/limpieza.py`

**¿Por qué se necesita?**
La columna `RENTABILIDAD` es un número continuo (puede ser -618% o +100%). Para que el sistema pueda generar alertas, mostrar colores en el dashboard y alimentar el modelo de clasificación, necesita convertirse en categorías discretas con significado de negocio.

**Umbrales definidos con base en el dominio farmacéutico:**

| Rango de Rentabilidad | Clasificación | Significado para Bucaclínicos |
|-----------------------|---------------|-------------------------------|
| Menor a 0% | PÉRDIDA | Se vende por debajo del costo. Precio desactualizado o error de registro. Acción inmediata. |
| 0% a 15% | BAJO | Margen muy bajo. Revisar proveedor o ajustar precio. |
| 15% a 25% | MEDIO | Margen aceptable. Monitoreo periódico. |
| 25% a 50% | BUENO | Margen saludable. Categoría más numerosa del catálogo. |
| Mayor a 50% | EXCELENTE | Margen alto. Incluye productos en consignación (costo = 0). |

**Resultado real en los datos de Bucaclínicos:**

| Clasificación | Cantidad | % del catálogo |
|---------------|----------|----------------|
| BUENO | 1.741 | 54.3% |
| EXCELENTE | 1.122 | 35.0% |
| MEDIO | 247 | 7.7% |
| BAJO | 51 | 1.6% |
| PÉRDIDA | 43 | 1.3% |

**Dato importante:** 43 productos (1.3%) se venden a pérdida. Ejemplos identificados en los datos: AMPICILINA 500MG con -618% y ENOXAPARINA 40MG con -276%. Esto significa que por cada peso que ingresa, la farmacia pierde más de 6 pesos en el primer caso.

---

### Técnica 4 — Asignación de Variable Temporal (PERIODO)
**Archivo:** `backend/services/limpieza.py`

**¿Por qué se necesita?**
El CSV no tiene una columna de fecha por fila. La fecha se infiere por la sección del documento a la que pertenece cada registro. Para que los modelos de series de tiempo y el análisis estacional funcionen, cada registro necesita saber a qué período pertenece.

**¿Cómo se resuelve?**
Se detecta el bloque del archivo al que pertenece cada registro y se asigna la etiqueta correspondiente:
- Bloque 1 → `Enero`
- Bloque 2 → `Febrero`
- Bloque 3 → `Primera Sem. Marzo`

Esta variable `PERIODO` es la que permite al sistema comparar demanda entre meses y detectar tendencias estacionales.

---

### Técnica 5 — Detección de Atípicos por Dominio
**Archivo:** `backend/services/limpieza.py`

**¿Por qué se necesita?**
Los outliers estadísticos (valores alejados del promedio) no siempre son errores. En el contexto farmacéutico, un producto con COSTO = 0 no es un error matemático sino un producto en consignación o donación. Si se eliminan sin criterio, se pierden datos válidos. Si se dejan sin marcar, distorsionan los cálculos de rentabilidad promedio.

**Casos identificados y tratamiento:**
- **COSTO = 0** (~10-15 productos): Se conservan pero se marca que la rentabilidad del 100% no refleja un margen real de operación comercial.
- **RENTABILIDAD < -100%** (~5 productos como AMPICILINA -618%): Se conservan como alertas de precio crítico.
- **Duplicados por laboratorio alterno**: El mismo medicamento aparece con dos proveedores distintos. Se conservan como registros separados para análisis de proveedor.

---

## Normalización Min-Max (Pendiente — Paso 2 del plan)

Según la presentación técnica del proyecto, antes de alimentar KMeans y el modelo de regresión se debe aplicar **Normalización Min-Max**:

```
X_normalizado = (X - X_mínimo) / (X_máximo - X_mínimo)
```

**¿Por qué es necesaria en este dataset específico?**
Enero y Febrero cubren ~30 días cada uno, pero la Primera Semana de Marzo cubre solo ~7 días. Sin normalizar, el modelo interpreta que en Marzo se vendió menos (porque los valores absolutos son menores) cuando en realidad la demanda diaria es la misma. La normalización corrige esta distorsión por período incompleto.

**Variables a normalizar:**
- `UND_VEND` → `UND_VEND_N`
- `VLR_VENTA` → `VLR_VENTA_N`
- `PRECIO_UNITARIO` → `PRECIO_UNITARIO_N`
- `COSTO` → `COSTO_N`

**Librería:** `scikit-learn · MinMaxScaler`

---

## Dataset resultante: RENTA2026-3_LIMPIO.csv

**Ubicación:** `backend/data/RENTA2026-3_LIMPIO.csv`

**Columnas del dataset limpio:**

| Columna | Tipo | Origen |
|---------|------|--------|
| PERIODO | texto | Calculada — bloque del archivo |
| COD | texto | Original |
| DESCRIPCION | texto | Original (limpiada de *) |
| LABORATORIO | texto | Original |
| COSTO | float | Convertida desde formato colombiano |
| UND_VEND | float | Convertida desde formato colombiano |
| VLR_VENTA | float | Convertida desde formato colombiano |
| UTILIDAD | float | Convertida desde formato colombiano |
| RENTABILIDAD | float | Convertida desde formato colombiano |
| CLASIFICACION | texto | **Calculada** — umbrales de rentabilidad |
| PRECIO_UNITARIO | float | **Calculada** — VLR_VENTA / UND_VEND |

**Estadísticas finales:**
- Total registros: **3.204**
- Productos únicos: **1.593**
- Laboratorios únicos: **165**
- Venta total acumulada: **$717.300.012 COP**
- Utilidad total: **$247.667.180 COP**
- Margen general: **34.5%**

---

## ¿Por qué esta fase es la más importante?

Sin la Fase 3, los modelos de la Fase 4 recibirían:
- Números como texto (`"14.850,00"`) que no se pueden sumar
- Registros de la empresa mezclados con productos reales
- Sin clasificación de rentabilidad para las alertas del dashboard
- Sin variable temporal para detectar estacionalidad

La Fase 3 es la que convierte un reporte de facturación en un dataset de ciencia de datos.
