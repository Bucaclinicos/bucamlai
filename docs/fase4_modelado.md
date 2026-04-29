# Fase 4 — Modelado
## Proyecto BUCAMLAI · Bucaclínicos S.A.S.

---

## ¿Qué es esta fase en CRISP-DM?

La Fase 4 es donde se aplican los algoritmos de Machine Learning sobre el dataset limpio generado en la Fase 3. Se seleccionan las técnicas, se entrenan los modelos, se ajustan los parámetros y se obtienen los primeros resultados. Cada modelo responde a uno de los objetivos de negocio definidos en la Fase 1.

---

## Objetivos que cubre esta fase

| Objetivo de negocio | Modelo que lo resuelve |
|---------------------|----------------------|
| OBJ-1: Predecir demanda mensual por medicamento | Random Forest Regressor |
| OBJ-2: Clasificar productos por nivel de rotación | KMeans Clustering + Análisis ABC (Pareto) |
| OBJ-3: Identificar medicamentos que se compran juntos | Apriori — Reglas de Asociación |

---

## Modelo 1 — Random Forest Regressor

**Archivo:** `backend/services/random_forest.py`
**Librería:** `scikit-learn 1.5.2`
**Objetivo:** Predecir cuántas unidades de un medicamento se venderán en 1, 3 o 6 meses.

### ¿Por qué Random Forest y no Regresión Lineal?

La presentación técnica propone comenzar con Regresión Lineal y escalar a Random Forest. Se implementó directamente Random Forest por dos razones:

1. **El dataset es no lineal**: la relación entre temporada epidemiológica y ventas no es lineal (un brote de dengue puede triplicar la demanda de antipiréticos de forma abrupta, no gradual).
2. **Maneja bien datasets pequeños**: con solo 3 períodos de datos, Random Forest es más robusto que modelos de series de tiempo como ARIMA o Prophet, que requieren al menos 12 meses de historial.

**Nota:** Cuando se acumulen 12 meses de datos, se migrará a Prophet o ARIMA según lo planificado en la presentación técnica.

### ¿Cómo funciona en este proyecto?

**Paso 1 — Preparación de features:**
El modelo necesita que los datos categóricos (texto) se conviertan a números. Se usa `LabelEncoder` de scikit-learn:
- `DESCRIPCION` (nombre del medicamento) → número entero único por producto
- `TEMPORADA` (normal, epidemia_dengue, epidemia_gripe, etc.) → número entero

**Paso 2 — Entrenamiento:**
```python
modelo = RandomForestRegressor(n_estimators=100, random_state=42)
modelo.fit(X, y)
```
- `n_estimators=100`: el bosque tiene 100 árboles de decisión independientes
- `random_state=42`: semilla fija para que los resultados sean reproducibles
- Variable objetivo (`y`): `UND_VEND` — unidades vendidas
- Features (`X`): medicamento codificado + temporada codificada

**Paso 3 — Predicción:**
Cuando el usuario ingresa un medicamento, un período (1, 3 o 6 meses) y una temporada, el modelo predice cuántas unidades se venderán por mes y multiplica por el número de meses.

### Resultado real con datos de Bucaclínicos

| Medicamento | Temporada | Predicción/mes | Total 3 meses |
|-------------|-----------|---------------|---------------|
| DIPIRONA 1 GR / 2 ML X AMP | normal | 33.47 unidades | 100.42 unidades |

### Métricas de evaluación

Según la presentación técnica, las métricas objetivo son:

- **MAE (Error Absoluto Medio):** cuántas unidades se equivoca el modelo en promedio. Un MAE de 5 significa que el modelo se equivoca en ±5 unidades por medicamento por mes.
- **RMSE (Raíz del Error Cuadrático Medio):** igual que MAE pero penaliza más los errores grandes. Más útil para medicamentos de alta rotación donde equivocarse mucho es muy costoso.

**Estado actual:** El modelo predice correctamente pero el cálculo de MAE/RMSE sobre un conjunto de prueba separado está pendiente (Paso 4 del plan de trabajo).

### Limitación actual y por qué existe

El dataset actual tiene solo 3 períodos (~10 semanas). Esto significa que el modelo aprende del mismo período en el que entrena, lo que limita su capacidad de generalizar. A medida que Bucaclínicos proporcione más datos mensuales, el modelo mejorará sustancialmente su precisión.

---

## Modelo 2 — KMeans Clustering

**Archivo:** `backend/services/kmeans.py`
**Librería:** `scikit-learn 1.5.2`
**Objetivo:** Clasificar automáticamente los 1.593 productos en categorías A (alta rotación), B (media rotación) y C (baja rotación).

### ¿Por qué KMeans y no solo Análisis ABC?

El Análisis de Pareto/ABC (propuesta P2 de la presentación) clasifica productos según **un solo criterio**: el porcentaje acumulado de ventas. KMeans los clasifica según **múltiples dimensiones simultáneamente**: unidades vendidas, valor de venta y rentabilidad.

Esto permite detectar perfiles que el ABC simple no captura. Por ejemplo:
- **Alta rotación + bajo margen** → genéricos masivos (aspirinas, ibuprofeno genérico)
- **Baja rotación + alto margen** → medicamentos especializados (oncológicos, anticoagulantes)
- **Alta rotación + alto margen** → productos estrella (la combinación ideal)
- **Baja rotación + bajo margen** → candidatos a descontinuar

### ¿Cómo funciona en este proyecto?

**Paso 1 — Agregación por producto:**
Primero se suman las ventas de cada producto en los 3 períodos para obtener el total acumulado:
```python
df_agg = df.groupby("DESCRIPCION").agg(
    unidades=("UND_VEND", "sum"),
    venta=("VLR_VENTA", "sum"),
    rentabilidad=("RENTABILIDAD", "mean")
)
```

**Paso 2 — Normalización:**
Se aplica `StandardScaler` para que ninguna variable domine sobre las otras. Sin esto, `venta` (en millones de pesos) dominaría sobre `rentabilidad` (en porcentaje) y los clusters no serían útiles.
```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

**Paso 3 — Clustering:**
```python
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
clusters = kmeans.fit_predict(X_scaled)
```
- `n_clusters=3`: tres grupos (A, B, C) alineados con la clasificación ABC del negocio
- `n_init=10`: el algoritmo corre 10 veces con inicializaciones distintas y toma el mejor resultado

**Paso 4 — Etiquetado:**
Los clusters se etiquetan automáticamente según el promedio de unidades vendidas:
- El cluster con mayor promedio de unidades → **A** (alta rotación)
- El del medio → **B** (media rotación)
- El menor → **C** (baja rotación)

### Resultado real con datos de Bucaclínicos

- **Total productos clasificados:** 1.593
- Cada producto tiene su etiqueta A, B o C disponible en el endpoint `/modelos/clusters`

### Métricas de evaluación

**Silhouette Score:** mide qué tan bien separados están los clusters. Va de -1 a 1:
- Cercano a 1: los clusters están bien definidos y separados
- Cercano a 0: los clusters se solapan
- Negativo: los productos están en el cluster equivocado

**Objetivo:** Silhouette Score > 0.5 según la presentación técnica.

**Estado actual:** El modelo clasifica correctamente pero el cálculo del Silhouette Score está pendiente (Paso 4 del plan).

### Análisis de Pareto/ABC (Pendiente — Paso 3 del plan)

Además del KMeans, la presentación técnica propone implementar el **Análisis de Pareto** con acumulación:

```python
df_sorted = df.sort_values("VLR_VENTA", ascending=False)
df_sorted["ACUMULADO"] = df_sorted["VLR_VENTA"].cumsum() / df_sorted["VLR_VENTA"].sum() * 100
df_sorted["ABC"] = df_sorted["ACUMULADO"].apply(
    lambda x: "A" if x <= 80 else ("B" if x <= 95 else "C")
)
```

Esto genera la **curva de Pareto** y clasifica los productos según su aporte acumulado:
- **Categoría A:** productos que generan el 80% de los ingresos
- **Categoría B:** productos que generan el siguiente 15%
- **Categoría C:** el 5% restante — mayor riesgo de vencimiento y capital inmovilizado

---

## Modelo 3 — Reglas de Asociación (Apriori)

**Archivo:** `backend/services/apriori.py`
**Librería:** `mlxtend 0.23.1`
**Objetivo:** Detectar qué medicamentos aparecen juntos en los mismos períodos de venta para estrategias de cross-selling y acomodo en bodega.

### ¿Qué es el Algoritmo Apriori?

Apriori es el algoritmo clásico de **Market Basket Analysis** (análisis de canasta de mercado). Fue diseñado originalmente para supermercados: si el 70% de los clientes que compran pan también compran mantequilla, esa es una regla de asociación útil para poner ambos productos cerca o hacer promociones combinadas.

En Bucaclínicos, la misma lógica aplica: si cada vez que hay temporada de gripe se venden juntos antibióticos, antihistamínicos y probióticos, la farmacia puede preparar el stock de los tres de forma coordinada.

### ¿Cómo funciona en este proyecto?

**Adaptación al dataset:** El CSV de Bucaclínicos no tiene transacciones por cliente (lo que sería ideal para Apriori). En cambio tiene ventas totales por período. La "canasta" se construye por período: cada período es una "compra" que contiene todos los productos vendidos en ese mes.

**Para el análisis se usan los top 100 productos por volumen** para mantener el rendimiento del sistema.

**Las métricas que calcula:**

| Métrica | Definición | Interpretación en Bucaclínicos |
|---------|------------|-------------------------------|
| **Soporte** | Frecuencia con que aparece el conjunto | 0.66 = aparece en 2 de 3 períodos |
| **Confianza** | P(B dado A) | Si se vende el antibiótico, ¿qué tan probable es que también se venda el probiótico? |
| **Lift** | Cuánto más probable es B con A vs. sin A | Lift > 1 = asociación real, no coincidencia |

**Regla de ejemplo esperada:**
```
SI {Antibiótico + Antiinflamatorio} → ENTONCES {Probiótico}
Soporte: 0.66 · Confianza: 0.85 · Lift: 1.92
```

### Limitación actual

Con solo 3 períodos como canastas, el soporte mínimo es 0.33 (aparece en 1 de 3). Esto limita las reglas que se pueden generar. Cuando se tengan datos de tickets individuales por cliente (tipo de dato transaccional real), el Apriori producirá reglas mucho más valiosas y específicas.

---

## Integración con Gemini API — Capa de IA Generativa

**Archivo:** `backend/services/gemini_service.py`
**Modelo:** `gemini-2.5-flash`
**Librería:** `google-generativeai 0.8.3`

Esta capa no es un modelo de ML tradicional sino **inteligencia artificial generativa**. Su función es distinta: toma los resultados numéricos de los modelos anteriores y los convierte en lenguaje natural comprensible para el personal de la farmacia (que no son científicos de datos).

**¿Cómo funciona?**
1. El sistema construye un contexto con los datos reales del inventario:
   - Total de registros, productos únicos, laboratorios
   - Venta total, utilidad total, margen
   - Distribución de clasificaciones de rentabilidad
2. El usuario hace una pregunta en lenguaje natural
3. Gemini recibe el contexto + la pregunta y genera una respuesta

**Restricción de privacidad (Ley 1581 de 2012):**
Los datos que se envían a Gemini son estadísticas agregadas y anónimas. Nunca se envían nombres de clientes, datos personales o información médica individual. Esto cumple la ley colombiana de protección de datos personales.

---

## Arquitectura del pipeline de modelado

```
RENTA2026-3_LIMPIO.csv
        ↓
[limpieza.py] → DataFrame en memoria
        ↓
    ┌───────────────────────────────┐
    │                               │
[random_forest.py]  [kmeans.py]  [apriori.py]
Predicción demanda  Clustering    Asociaciones
    │                   │              │
    └───────────────────┴──────────────┘
                        ↓
              FastAPI Endpoints
              /modelos/prediccion
              /modelos/clusters
              /asociacion/reglas
                        ↓
              React Frontend
              Dashboard + Gráficas
```

---

## Resumen de modelos implementados

| Modelo | Algoritmo | Librería | Endpoint | Métrica |
|--------|-----------|----------|----------|---------|
| Predicción de demanda | RandomForestRegressor | scikit-learn | POST /modelos/prediccion | MAE, RMSE |
| Clasificación inventario | KMeans (k=3) | scikit-learn | GET /modelos/clusters | Silhouette Score |
| Patrones de compra | Apriori | mlxtend | GET /asociacion/reglas | Soporte, Confianza, Lift |
| Consultas inteligentes | Gemini 2.5 Flash | google-generativeai | POST /gemini/consulta | Calidad de respuesta |
