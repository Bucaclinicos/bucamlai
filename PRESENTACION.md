# BUCAMLAI
## Sistema Analítico de Inventario Farmacéutico con Machine Learning

**Cliente:** Bucaclínicos S.A.S.
**Proyecto Integrador II · 6° Semestre**
**Metodología:** CRISP-DM + IEEE 830

---

## 1. ¿Qué es BUCAMLAI?

BUCAMLAI es una plataforma web que aplica **Machine Learning** e **IA generativa** al inventario de la farmacia Bucaclínicos para responder tres preguntas críticas del negocio:

1. **¿Cuántas unidades de cada medicamento se venderán el próximo mes?**
2. **¿Qué productos son los que realmente sostienen el negocio?**
3. **¿Qué medicamentos suelen venderse juntos?**

El sistema convierte un reporte de facturación POS (`RENTA2026-3.csv`) en un dashboard inteligente con predicciones, alertas y consultas en lenguaje natural.

---

## 2. Problema de negocio

El sistema POS de Bucaclínicos genera reportes diseñados para verse en pantalla, no para análisis. Esto produce 8 problemas de calidad de datos:

- Números en formato colombiano (`14.850,00`) que Python interpreta mal
- Filas de metadata mezcladas con productos reales
- Sin columna de fecha por registro
- Sin precio unitario
- Productos en consignación con costo cero
- Rentabilidades extremas (-618% en AMPICILINA 500MG)

**Resultado:** el equipo de farmacia toma decisiones de compra sin datos confiables — sobrecompra de productos de baja rotación y desabasto de los de alta demanda.

---

## 3. Objetivos

### Objetivo general
Desarrollar una plataforma analítica basada en **Machine Learning** e **IA generativa** que transforme los datos transaccionales del POS de Bucaclínicos en información estratégica para la toma de decisiones sobre el inventario farmacéutico, sustituyendo la intuición por evidencia cuantitativa.

### Objetivos específicos
1. **Limpiar y estandarizar** los reportes del POS mediante 8 técnicas de preparación de datos (CRISP-DM Fase 3), garantizando un dataset confiable para el análisis.
2. **Predecir la demanda** mensual de cada medicamento a horizontes de 1, 3 y 6 meses usando un modelo Random Forest entrenado con el histórico de ventas.
3. **Clasificar el inventario** en categorías A/B/C mediante KMeans y el principio de Pareto, identificando los productos que sostienen el 80% de los ingresos.
4. **Descubrir patrones de compra** con reglas de asociación (Apriori) que revelen qué medicamentos suelen venderse juntos.
5. **Habilitar consultas en lenguaje natural** sobre el inventario integrando Gemini 2.5 Flash, respetando la Ley 1581 de 2012 sobre protección de datos personales.
6. **Garantizar la seguridad** mediante autenticación JWT, cifrado bcrypt, HTTPS obligatorio y un panel administrativo para la gestión de usuarios.
7. **Desplegar el sistema** en AWS EC2 con PostgreSQL gestionada en Clever Cloud, disponible 24/7 para el personal autorizado de Bucaclínicos.

---

## 4. Justificación y valor que aporta la aplicación

### ¿Por qué se necesita BUCAMLAI?
El POS actual de Bucaclínicos produce reportes pensados para visualización en pantalla, no para análisis. Como consecuencia, el equipo de farmacia compra "a ojo": sobrestockea medicamentos de baja rotación (capital inmovilizado) y se queda sin existencias de los más vendidos (ventas perdidas). Sin un análisis sistemático, los **43 productos en pérdida** del catálogo siguen comercializándose y los **484 productos estrella** que generan el 80% del negocio no reciben la atención que merecen.

### Valor que aporta al negocio

| Eje de valor | Aporte concreto |
|--------------|-----------------|
| **Decisiones basadas en datos** | Sustituye la intuición por modelos validados estadísticamente (Silhouette 0.73 · Pareto 79.96%) |
| **Reducción de capital inmovilizado** | La clasificación A/B/C identifica los productos de baja rotación a recortar del pedido |
| **Eliminación de productos en pérdida** | Detecta automáticamente los 43 medicamentos con rentabilidad negativa para revisión inmediata |
| **Anticipación de demanda** | Predice ventas futuras a 1/3/6 meses, evitando desabastos en productos de alta rotación |
| **Ventas cruzadas** | Las reglas de asociación permiten sugerir productos complementarios y reorganizar la góndola |
| **Democratización del análisis** | El chat con Gemini permite que personal no técnico consulte el inventario en lenguaje natural |
| **Cumplimiento legal** | Anonimización estricta antes de cualquier consulta externa, conforme a la Ley 1581 de 2012 |
| **Disponibilidad 24/7** | Despliegue en AWS EC2 con HTTPS, accesible desde cualquier dispositivo autorizado |

### Valor académico
- Aplica de forma integral la metodología **CRISP-DM** sobre un caso real con datos reales del cliente.
- Combina **3 algoritmos clásicos de ML** (Random Forest, KMeans, Apriori) con **IA generativa** moderna (Gemini 2.5 Flash).
- Demuestra trazabilidad **IEEE 830 → CRISP-DM**: cada requisito de negocio se rastrea hasta el modelo que lo satisface y las pruebas que lo validan.

### Valor diferencial frente a alternativas
- **Frente a Excel manual:** automatiza la limpieza (8 técnicas), elimina errores humanos y se reejecuta en segundos.
- **Frente a BI genérico (Power BI / Tableau):** añade **predicción** y **patrones de asociación**, no solo visualización descriptiva.
- **Frente a soluciones SaaS:** está adaptado al formato POS específico de Bucaclínicos y a la normativa colombiana.

---

## 5. Stack tecnológico

Cada tecnología fue elegida por el aporte concreto que hace a la aplicación:

| Capa | Tecnología | ¿Qué aporta a la aplicación? |
|------|------------|------------------------------|
| Backend | **FastAPI** (Python 3.12) — puerto 8080 | API rápida y asíncrona que expone los modelos de ML como endpoints REST seguros |
| Frontend | **React + Vite + MUI 9** — puerto 5173 | Interfaz moderna, responsiva y con componentes listos para mostrar gráficos y dashboards |
| Base de datos | **PostgreSQL** (Clever Cloud) | Almacena usuarios, roles y sesiones de forma persistente y escalable, con claurespaldo gestionado |
| Machine Learning | scikit-learn 1.5.2 · mlxtend 0.23.1 | Implementa los 3 modelos (Random Forest, KMeans, Apriori) con algoritmos probados y eficientes |
| IA Generativa | Google **Gemini 2.5 Flash** | Convierte preguntas en lenguaje natural en respuestas analíticas sobre el inventario |
| Testing | pytest 9.0.3 · httpx · FastAPI TestClient | Garantiza la calidad del sistema con 68 pruebas automatizadas (unitarias + integración) |
| Despliegue | AWS EC2 · Nginx · Let's Encrypt | Pone el sistema en producción 24/7 con HTTPS gratuito y proxy inverso eficiente |
| Autenticación | JWT (HS256) + bcrypt + email | Protege el acceso con tokens firmados, contraseñas cifradas y recuperación por correo |

---

## 6. Metodología CRISP-DM aplicada

### Fase 3 — Preparación de Datos
8 técnicas implementadas en `backend/services/limpieza.py`:

1. Conversión del formato numérico colombiano (`14.850,00` → `14850.0`)
2. Eliminación de filas de metadata
3. Eliminación de registros con `UND_VEND = 0`
4. Cálculo de variables derivadas (PRECIO_UNITARIO, COSTO_UNITARIO, MARGEN_UNITARIO)
5. Clasificación por umbrales de rentabilidad (PERDIDA/BAJO/MEDIO/ALTO/EXCELENTE)
6. Asignación de variable temporal PERIODO
7. Normalización Min-Max (corrige distorsión por períodos de distinta duración)
8. Detección de atípicos por dominio farmacéutico

**Resultado:** de 3.306 filas crudas → **3.204 registros válidos**.

### Fase 4 — Modelado
3 modelos de ML + 1 capa de IA generativa:

| Modelo | Algoritmo | Objetivo de negocio |
|--------|-----------|--------------------|
| Predicción de demanda | **Random Forest Regressor** | Cuántas unidades vender en 1/3/6 meses |
| Clasificación de inventario | **KMeans (k=3)** + Pareto/ABC | A (alta), B (media), C (baja rotación) |
| Patrones de compra | **Apriori** | Medicamentos que se venden juntos |
| Consultas inteligentes | **Gemini 2.5 Flash** | Preguntas en lenguaje natural sobre el inventario |

### Fase 5 — Testing
- **68 pruebas automatizadas** ejecutadas con pytest (14.85 s)
- 36 pruebas unitarias (`test_limpieza.py`)
- 34 pruebas de integración sobre endpoints (`test_api.py`)
- Cobertura: limpieza, clasificación, normalización, endpoints, seguridad

### Fase 6 — Despliegue
Arquitectura objetivo:
```
INTERNET → https://bucamlai.bucaclinicos.com
                    ↓
            AWS EC2 (2 vCPU · 4 GB RAM)
                    ↓
              Nginx (proxy inverso + HTTPS)
                ├── React (estáticos) → :443
                └── FastAPI → :8000
                    ↓
        Clever Cloud PostgreSQL (gestionada)
```

---

## 7. Resultados reales sobre los datos de Bucaclínicos

### Dataset
| Métrica | Valor |
|---------|-------|
| Registros válidos | **3.204** |
| Productos únicos | **1.593** |
| Laboratorios | **165** |
| Venta total | **$717.300.012 COP** |
| Utilidad total | **$247.667.180 COP** |
| Margen general | **34.5%** |

### Distribución de rentabilidad
| Clasificación | Productos | % |
|--------------|-----------|---|
| BUENO (25–50%) | 1.741 | 54.3% |
| EXCELENTE (>50%) | 1.122 | 35.0% |
| MEDIO (15–25%) | 247 | 7.7% |
| BAJO (0–15%) | 51 | 1.6% |
| **PERDIDA (<0%)** | **43** | **1.3%** ← alerta inmediata |

### Métricas de los modelos
| Modelo | Métrica | Resultado | Criterio | ¿Cumple? |
|--------|--------|-----------|----------|----------|
| KMeans | Silhouette Score | **0.7325** | > 0.5 | ✅ Sí |
| Pareto/ABC | Categoría A genera | **79.96%** de ventas | ~80% | ✅ Sí |
| Random Forest | MAE | 15.46 unidades/mes | < 10 | ⚠ Mejora con más datos |
| Random Forest | RMSE | 56.28 unidades | < 20 | ⚠ Mejora con más datos |

> **Principio de Pareto confirmado:** el 30% de los productos (484/1.593) genera el 80% de los ingresos.

---

## 8. Funcionalidades de la aplicación

### Para el administrador
- Carga de archivos CSV del POS
- Panel `/admin` — alta, edición, activación y borrado de usuarios
- Acceso completo a todos los módulos analíticos

### Para el analista
- Dashboard con KPIs: ventas, utilidad, margen, top productos
- **Predicción** de demanda por medicamento (1/3/6 meses, por temporada)
- **Clusters A/B/C** con clasificación de los 1.593 productos
- **Curva de Pareto** y análisis ABC
- **Reglas de asociación** (qué productos van juntos)
- **Chat con Gemini** para consultas en lenguaje natural sobre el inventario
- Recuperación de contraseña por email

---

## 9. Seguridad y cumplimiento legal

- **JWT** en todos los endpoints (expira en 8 h)
- **bcrypt** para contraseñas (nunca en texto plano)
- Bloqueo tras 5 intentos fallidos
- **HTTPS/TLS 1.2+** obligatorio en producción
- **Ley 1581 de 2012** (Protección de Datos Personales de Colombia):
  los datos enviados a Gemini son **agregados y anónimos** — nunca datos de clientes ni información médica individual
- API Keys gestionadas como variables de entorno, nunca en el código

---

## 10. Arquitectura del pipeline

```
RENTA2026-3.csv (3.306 filas crudas)
        ↓
[Limpieza · 8 técnicas]
        ↓
RENTA2026-3_LIMPIO.csv (3.204 registros)
        ↓
   ┌────────────┬─────────────┬──────────────┐
   ↓            ↓             ↓              ↓
Random Forest  KMeans       Pareto/ABC    Apriori
(predicción) (clusters)   (curva 80/20)  (reglas)
   ↓            ↓             ↓              ↓
        FastAPI Endpoints (JWT protegidos)
                    ↓
              React Frontend
              (Dashboard + Gráficas)
                    ↓
          Gemini 2.5 Flash (lenguaje natural)
```

---

## 11. Estado actual del proyecto

| Componente | Estado |
|------------|--------|
| Limpieza y procesamiento (Fase 3) | ✅ Completo |
| 3 modelos ML + Gemini (Fase 4) | ✅ Completo |
| 68 pruebas automatizadas (Fase 5) | ✅ Completo |
| Frontend React + dashboard | ✅ Completo |
| Panel admin + recuperación de contraseña | ✅ Completo |
| Migración a PostgreSQL | ✅ Completo |
| Despliegue en AWS EC2 (Fase 6) | 🔄 Pendiente |
| Más datos históricos (12 meses) | 🔄 En espera del cliente |

---

## 12. Conclusiones

- BUCAMLAI integra **CRISP-DM** (ciencia de datos) con **IEEE 830** (ingeniería de requisitos) para garantizar trazabilidad total: cada requisito de negocio se rastrea hasta el modelo ML que lo satisface.
- Los modelos ya producen resultados estadísticamente válidos: el **KMeans logra 0.73 de Silhouette** y el **Pareto se cumple en 79.96%**, ambos por encima de sus criterios de aceptación.
- La limitación actual del Random Forest es el tamaño del dataset (3 períodos). Con 12 meses de historial se migrará a **Prophet o ARIMA** para capturar estacionalidad.
- El sistema cumple con la **Ley 1581 de 2012** mediante anonimización estricta antes de cualquier consulta a Gemini.
- El despliegue final en AWS EC2 + Clever Cloud llevará el sistema a estar disponible 24/7 con HTTPS para todo el personal de Bucaclínicos.
