# INFORME FINAL INTEGRADOR
## Selección, Implementación y Negociación Tecnológica

---

## PORTADA

|  |  |
|--|--|
| **Institución** | [NOMBRE DE LA INSTITUCIÓN] |
| **Programa** | [NOMBRE DEL PROGRAMA] |
| **Curso** | Selección y Evaluación de Tecnología |
| **Corte** | III · Semestre VI |
| **Proyecto** | BUCAMLAI — Sistema Analítico de Inventario Farmacéutico con Machine Learning |
| **Cliente** | Bucaclínicos S.A.S. |
| **Equipo proveedor** | [NOMBRES DE LOS INTEGRANTES] |
| **Docente** | [NOMBRE DEL DOCENTE] |
| **Fecha de entrega** | 31 de mayo de 2026 |
| **Peso** | 30 % de la nota final |

---

## Objetivo Principal

Elaborar un informe integrador que articule los resultados del II y III corte académico, documentando el proceso completo de selección, implementación y negociación tecnológica de BUCAMLAI: plataforma analítica basada en Machine Learning e IA generativa para la gestión de inventario farmacéutico de Bucaclínicos S.A.S., bajo la metodología CRISP-DM y los estándares IEEE 830.

---

## Objetivos Específicos

*(Relacionados con las actividades planteadas en el Diagrama de Gantt)*

1. Describir el contexto organizacional de Bucaclínicos S.A.S. y el problema tecnológico que justifica el proyecto BUCAMLAI, sustentando el análisis de encaje entre la propuesta de valor y el segmento de mercado.
2. Evaluar las estrategias de adquisición tecnológica Buy vs. Make mediante una matriz ponderada que fundamente la decisión de seleccionar la solución desarrollada externamente por el equipo proveedor.
3. Planificar la implementación técnica de BUCAMLAI en las fases de configuración de infraestructura, migración de datos y entrenamiento de modelos, con responsables y recursos claramente definidos.
4. Diseñar el cronograma de las fases de pruebas de aceptación (UAT), capacitación del personal y puesta en producción (go-live), con indicadores de monitoreo y control.
5. Documentar formalmente el proceso de negociación tecnológica y los compromisos pactados entre el Proveedor (Equipo BUCAMLAI) y el Cliente (Bucaclínicos S.A.S.) en el acta de cierre de acuerdos.

---

## INFORME FINAL

### 1. Contexto del Negocio y Problema Organizacional

#### 1.1 Descripción de la empresa

Bucaclínicos S.A.S. es una farmacia de mediano tamaño ubicada en Colombia, dedicada a la comercialización de medicamentos y productos de salud al detal. Opera con un sistema POS (Point of Sale) que registra todas las transacciones de venta, generando reportes periódicos del comportamiento de inventario.

La empresa gestiona un catálogo de **1.593 productos** de **165 laboratorios**, con ventas totales por **$717.300.012 COP** y una utilidad de **$247.667.180 COP** (margen general del 34.5 %) en el período analizado. Su estructura organizacional es básica: un administrador general, farmacéuticos con rol de analistas y personal operativo de caja. No cuenta con un área de tecnología ni de ciencia de datos interna.

#### 1.2 Problema identificado

El sistema POS genera reportes diseñados para visualización en pantalla, no para análisis cuantitativo. Esto produce ocho problemas concretos de calidad de datos que hacen inviable cualquier análisis sin un proceso previo de limpieza y estandarización:

1. Números en formato colombiano (`14.850,00`) que herramientas de análisis como Python interpretan incorrectamente.
2. Filas de metadata mezcladas con registros de productos reales.
3. Ausencia de columna de fecha por registro individual.
4. Ausencia de precio unitario desagregado por transacción.
5. Productos en consignación registrados con costo cero.
6. Rentabilidades extremas no detectadas automáticamente (ejemplo: −618 % en AMPICILINA 500MG).
7. Sin clasificación automática de productos por nivel de rotación.
8. Sin capacidad predictiva de demanda futura.

**Impacto operativo:** el equipo de farmacia toma decisiones de compra "a intuición", generando sobrestock de productos de baja rotación (capital inmovilizado) y desabasto de los de alta demanda (ventas perdidas).

**Impacto financiero:** 43 productos del catálogo operan con rentabilidad negativa y continúan comercializándose sin que la dirección lo detecte. Al mismo tiempo, los **484 productos de categoría A**, que generan el **80 % de los ingresos**, no reciben la atención diferenciada que su peso en el negocio requiere.

---

### 2. Encaje entre Propuesta de Valor y Segmento de Mercado

#### 2.1 Segmento de clientes

| Perfil | Rol en Bucaclínicos | Necesidad principal |
|--------|---------------------|---------------------|
| Administrador general | Dueño / gestor de compras | Visibilidad financiera del inventario y control de rentabilidad por producto |
| Farmacéuticos / analistas | Gestión operativa del stock | Datos confiables para decisiones de reposición y detección de productos en pérdida |
| Personal de caja | Usuario operativo | Consultas rápidas sobre existencias sin requerir conocimientos técnicos |

#### 2.2 Jobs-to-be-done

| Tipo | Trabajo que hace el cliente |
|------|-----------------------------|
| Funcional | Saber cuántas unidades de cada medicamento comprar el próximo mes, sin sobrestock ni desabasto |
| Funcional | Identificar qué productos generan pérdidas para tomar acción inmediata |
| Social | Demostrar a socios y proveedores que las decisiones de compra están basadas en datos |
| Emocional | Reducir la incertidumbre de gestionar 1.593 productos sin herramientas analíticas |

#### 2.3 Dolores (Pains)

- Tomar decisiones de compra sin soporte cuantitativo.
- No detectar que un producto lleva meses operando en pérdida.
- Desabasto de medicamentos de alta demanda, con ventas perdidas directas.
- Datos del POS en formato inutilizable para análisis externo.
- Tiempo excesivo invertido en procesamiento manual de reportes.
- Sin capacidad de anticipar picos de demanda estacionales.

#### 2.4 Ganancias (Gains)

- Predicciones de demanda a 1, 3 y 6 meses mediante modelos de Machine Learning validados con datos reales del cliente.
- Alertas automáticas sobre los 43 productos con rentabilidad negativa.
- Clasificación A/B/C de los 1.593 productos para priorizar el pedido de reposición.
- Dashboard con KPIs de ventas, utilidad y margen general del negocio.
- Consultas al inventario en lenguaje natural vía Gemini 2.5 Flash, sin necesidad de conocimientos técnicos.
- Descubrimiento de patrones de compra conjunta mediante reglas de asociación (Apriori).

#### 2.5 Propuesta de valor

BUCAMLAI convierte los reportes crudos del POS de Bucaclínicos en inteligencia de negocio accionable mediante tres modelos de Machine Learning (Random Forest, KMeans, Apriori) y una capa de IA generativa, eliminando las decisiones por intuición y sustituyéndolas por evidencia estadística validada. Todo esto sin requerir que el personal de la farmacia tenga conocimientos en ciencia de datos o programación.

#### 2.6 Encaje Valor–Mercado

| Dolor / Ganancia del cliente | Alivio / Creación en BUCAMLAI |
|------------------------------|-------------------------------|
| Datos del POS en formato ilegible para análisis | Limpieza automática con 8 técnicas (CRISP-DM Fase 3): de 3.306 filas crudas a 3.204 registros válidos |
| Sin predicción de demanda | Random Forest Regressor: predicción de ventas a 1, 3 y 6 meses por medicamento |
| Sin clasificación del inventario por rotación | KMeans (k=3) + Pareto/ABC: identifica los 484 productos A que generan el 80 % de los ingresos (Silhouette Score: 0.73) |
| Patrones de compra conjunta desconocidos | Reglas de Asociación con Apriori: qué medicamentos se compran juntos |
| Análisis reservado a expertos en datos | Chat Gemini 2.5 Flash en lenguaje natural para todo el personal |
| 43 productos en pérdida sin detectar | Clasificación automática por umbral de rentabilidad con alerta inmediata |
| Dependencia de terceros para acceder a sus propios datos | Panel admin con carga de CSV, gestión de usuarios y control de acceso |

---

### 3. Selección de la Solución Tecnológica (Buy vs. Make)

#### 3.1 Estrategia Buy — BUCAMLAI *(seleccionada)*

**Descripción:** adquisición de BUCAMLAI, desarrollado externamente por el equipo estudiante como proveedor tecnológico especializado en ciencia de datos aplicada al sector farmacéutico.

**Características de la solución:**

| Capa | Tecnología | Aporte |
|------|------------|--------|
| Backend | FastAPI (Python 3.12) | API asíncrona que expone los modelos ML como endpoints REST con autenticación JWT |
| Frontend | React + Vite + MUI 9 | Dashboard interactivo con gráficas, alertas y módulos analíticos |
| Base de datos | PostgreSQL (Clever Cloud) | Almacenamiento persistente de usuarios, roles y sesiones con respaldo gestionado |
| Machine Learning | scikit-learn 1.5.2 · mlxtend 0.23.1 | Random Forest (predicción), KMeans (clustering A/B/C), Apriori (reglas de asociación) |
| IA Generativa | Gemini 2.5 Flash | Consultas en lenguaje natural sobre el inventario con datos anonimizados |
| Testing | pytest 9.0.3 + FastAPI TestClient | 68 pruebas automatizadas: 36 unitarias + 34 de integración |
| Despliegue | AWS EC2 + Nginx + Let's Encrypt | Sistema disponible 24/7 con HTTPS en `bucamlai.bucaclinicos.com` |
| Autenticación | JWT (HS256) + bcrypt | Tokens firmados, contraseñas cifradas, bloqueo tras 5 intentos fallidos |

**Ventajas:**
- Solución validada con datos reales de Bucaclínicos (3.204 registros procesados del POS).
- Adaptada específicamente al formato POS de Bucaclínicos y a la normativa colombiana (Ley 1581 de 2012).
- No requiere contratar personal técnico interno con perfil en ciencia de datos.
- Tiempo de implementación reducido: el sistema ya existe, está probado y puede desplegarse.
- Soporte técnico incluido durante el período inicial de operación.

**Desventajas:**
- Dependencia del proveedor externo para evoluciones futuras del sistema.
- Costos de infraestructura cloud recurrentes (~$120.000 COP/mes para AWS EC2 + Clever Cloud).

#### 3.2 Estrategia Make — Desarrollo interno *(descartada)*

**Descripción:** Bucaclínicos contrata y gestiona internamente el desarrollo de su propia solución analítica de inventario.

**Características hipotéticas:**
- Contratación de 1–2 desarrolladores con perfil en ciencia de datos y desarrollo web.
- Construcción desde cero de la pipeline de limpieza, modelado y visualización.
- Gestión interna del servidor, base de datos y mantenimiento continuo.

**Ventajas:**
- Control total sobre el código fuente y los datos.
- Adaptabilidad inmediata ante cambios internos sin depender del proveedor.

**Desventajas:**
- Tiempo estimado de desarrollo: 8–12 meses desde cero.
- Costo elevado: salarios de desarrolladores con perfil en ML superan los $5.000.000 COP/mes.
- Alto riesgo técnico: la empresa no tiene experiencia previa en ciencia de datos.
- Sin garantía de calidad comparable a la solución Buy, que ya fue validada con datos reales.

---

### 4. Matriz Ponderada y Toma de Decisiones

| Criterio | Peso | Buy — BUCAMLAI (1–5) | Puntaje Buy | Make — Interno (1–5) | Puntaje Make |
|----------|:----:|:--------------------:|:-----------:|:--------------------:|:------------:|
| Costo total de adquisición e implementación | 20 % | 4.5 | 0.90 | 2.0 | 0.40 |
| Tiempo hasta puesta en marcha | 20 % | 4.8 | 0.96 | 1.5 | 0.30 |
| Calidad técnica y validación con datos reales | 15 % | 4.5 | 0.68 | 2.5 | 0.38 |
| Adaptación al negocio del cliente | 15 % | 5.0 | 0.75 | 2.0 | 0.30 |
| Soporte y mantenimiento incluido | 10 % | 4.0 | 0.40 | 2.0 | 0.20 |
| Escalabilidad futura | 10 % | 4.0 | 0.40 | 3.5 | 0.35 |
| Seguridad y cumplimiento legal (Ley 1581/2012) | 10 % | 4.5 | 0.45 | 2.5 | 0.25 |
| **TOTAL** | **100 %** | | **4.54** | | **2.18** |

*Escala: 1.0 (muy deficiente) → 5.0 (excelente)*

**Decisión:** la estrategia **Buy** obtiene **4.54 / 5.0** frente a **2.18 / 5.0** del Make. BUCAMLAI es seleccionado como la solución tecnológica para Bucaclínicos S.A.S.

**Argumentación:** la brecha más significativa se concentra en tiempo hasta puesta en marcha (BUCAMLAI ya está desarrollado y validado) y en adaptación al negocio del cliente (fue construido específicamente sobre el formato POS de Bucaclínicos con datos reales). La estrategia Make representaría un riesgo financiero y técnico desproporcionado para una empresa sin capacidad interna en ciencia de datos: 8–12 meses de espera frente a la implementación inmediata que ofrece la solución Buy.

---

### 5. Plan de Implementación Tecnológica

#### 5.1 Fases del proyecto

| # | Fase | Duración | Responsable principal |
|---|------|----------|-----------------------|
| 1 | Diagnóstico y entrega de datos | 1 semana | Proveedor + Administrador |
| 2 | Configuración del entorno de producción | 1 semana | Proveedor — Backend |
| 3 | Migración, limpieza y entrenamiento de modelos | 3 semanas | Proveedor — Data Science |
| 4 | Pruebas de aceptación (UAT) | 2 semanas | Proveedor + Farmacéuticos |
| 5 | Capacitación del personal | 1 semana | Proveedor |
| 6 | Puesta en producción (go-live) | 1 semana | Proveedor + Administrador |
| 7 | Soporte post-implementación | 4 semanas | Proveedor |

**Duración total estimada:** 13 semanas (~3 meses desde la firma del acta)

#### 5.2 Actividades detalladas por fase

**Fase 1 — Diagnóstico:**
- Revisión del formato actual del POS y de los reportes CSV disponibles.
- Entrega formal de al menos 3 períodos de reportes históricos por parte del cliente.
- Validación de credenciales de acceso, permisos de red y entorno del servidor.

**Fase 2 — Configuración de infraestructura:**
- Provisionamiento de instancia AWS EC2 (2 vCPU · 4 GB RAM) como servidor de aplicación.
- Configuración de la base de datos PostgreSQL en Clever Cloud con respaldo automático.
- Despliegue de backend FastAPI y frontend React bajo Nginx con HTTPS.
- Registro y configuración del dominio `bucamlai.bucaclinicos.com` con certificado SSL (Let's Encrypt).

**Fase 3 — Migración y modelado:**
- Carga del histórico POS a través de la pipeline de limpieza (8 técnicas CRISP-DM Fase 3).
- Validación de los 3.204 registros resultantes antes del entrenamiento.
- Entrenamiento de los modelos Random Forest, KMeans (k=3) y Apriori con el histórico validado.
- Configuración del módulo Gemini 2.5 Flash con datos anonimizados conforme a la Ley 1581 de 2012.

**Fase 4 — Pruebas de aceptación (UAT):**
- Ejecución de las 68 pruebas automatizadas (pytest) con entrega del informe de resultados al cliente.
- Validación del dashboard con datos reales del cliente por parte del equipo de la farmacia.
- Aprobación formal escrita del cliente antes de proceder al go-live.

**Fase 5 — Capacitación:**
- Sesión 1 (4 h): administrador — panel admin, gestión de usuarios, carga de CSV, alertas de rentabilidad.
- Sesión 2 (3 h): farmacéuticos — dashboard, predicciones, clasificación A/B/C, reglas de asociación, chat Gemini.
- Entrega del manual de usuario en formato digital (PDF).

**Fase 6 — Go-live:**
- Apertura del sistema en producción con acceso para todo el personal autorizado.
- Monitoreo intensivo durante las primeras 48 horas de operación.
- Recolección de retroalimentación inicial del equipo de la farmacia.

**Fase 7 — Soporte:**
- Canal de soporte por correo electrónico y mensajería durante 30 días calendario.
- Corrección de incidencias críticas en un máximo de 2 horas hábiles.
- Entrega de informe de uso al cierre del período de soporte.

#### 5.3 Recursos del proyecto

| Tipo | Recurso | Detalle |
|------|---------|---------|
| Humano | 3 integrantes del equipo proveedor | Perfiles: backend/ML, frontend, data science |
| Humano | Administrador de Bucaclínicos | Contraparte en validaciones, UAT y decisiones |
| Técnico | AWS EC2 t2.medium | 2 vCPU · 4 GB RAM · 30 GB SSD |
| Técnico | Clever Cloud PostgreSQL | Base de datos gestionada con respaldo automático |
| Técnico | Dominio + SSL Let's Encrypt | `bucamlai.bucaclinicos.com` |
| Financiero | Infraestructura mensual estimada | ~$120.000 COP/mes (AWS + Clever Cloud) |

#### 5.4 Entregables del proyecto

| Entregable | Responsable | Fecha límite |
|------------|-------------|:------------:|
| Sistema desplegado en producción | Proveedor | Semana 8 |
| Informe de 68 pruebas automatizadas (pytest) | Proveedor | Semana 7 |
| Manual de usuario (PDF) | Proveedor | Semana 8 |
| Informe de uso post-implementación | Proveedor | Semana 13 |

---

### 6. Cronograma — Diagrama de Gantt

*(S = semana desde la firma del acta de negociación — 30 de mayo de 2026)*

| Actividad | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | S11 | S12 | S13 |
|-----------|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|
| Diagnóstico y entrega de datos | ██ | | | | | | | | | | | | |
| Configuración de infraestructura AWS | | ██ | | | | | | | | | | | |
| Limpieza, migración y validación de datos | | | ██ | ██ | | | | | | | | | |
| Entrenamiento de modelos ML (RF · KMeans · Apriori) | | | | ██ | ██ | ██ | | | | | | | |
| Pruebas de aceptación UAT | | | | | | ██ | ██ | | | | | | |
| Capacitación del personal | | | | | | | ██ | | | | | | |
| Go-live y puesta en producción | | | | | | | | ██ | | | | | |
| Soporte post-implementación | | | | | | | | | ██ | ██ | ██ | ██ | |
| Informe final de uso | | | | | | | | | | | | | ██ |

---

### 7. Monitoreo y Control del Proyecto

#### 7.1 KPIs técnicos del sistema

| KPI | Métrica objetivo | Frecuencia | Responsable | Acción correctiva |
|-----|:----------------:|:----------:|-------------|-------------------|
| Disponibilidad del sistema | Uptime ≥ 99 % | Diaria | Proveedor | Reinicio automático + alerta por correo en < 5 min |
| Calidad del clustering A/B/C | Silhouette Score ≥ 0.65 | Mensual | Proveedor | Ajuste del parámetro k en KMeans |
| Tiempo de respuesta de la API | < 2 s por endpoint | Diaria | Proveedor | Optimización de consultas SQL o caché |
| Cobertura de pruebas automatizadas | 68 pruebas en verde | Cada despliegue | Proveedor | Corrección inmediata de regresiones detectadas |
| Precisión del modelo de predicción | Re-entrenamiento mensual con nuevos datos | Mensual | Proveedor | Incorporar reporte POS del mes anterior |

#### 7.2 KPIs de negocio

| KPI | Métrica objetivo | Frecuencia | Responsable | Acción correctiva |
|-----|:----------------:|:----------:|-------------|-------------------|
| Productos en pérdida activos | 0 productos con rentabilidad negativa en catálogo activo | Semanal | Administrador | Revisión y decisión de descontinuación o ajuste de precio |
| Reducción de capital inmovilizado | Disminución ≥ 15 % en 3 meses | Trimestral | Administrador | Ajuste del plan de compras según clasificación A/B/C |
| Adopción del sistema | ≥ 80 % del personal capacitado usando el dashboard | Mensual | Administrador | Sesión adicional de apoyo o soporte individual |

#### 7.3 Gestión de incidencias

| Prioridad | Definición | Tiempo de respuesta | Tiempo de resolución |
|-----------|------------|:-------------------:|:--------------------:|
| Crítica | Sistema completamente caído o datos corruptos | 2 horas hábiles | 24 horas |
| Alta | Funcionalidad principal no disponible | 24 horas | 48 horas |
| Media | Error no bloqueante o resultado inesperado | 48 horas | 1 semana |
| Baja | Mejora visual o ajuste de presentación | 1 semana | Backlog del proveedor |

---

### 8. Negociación Tecnológica y Solución de Conflictos

#### 8.1 Técnica principal: Negociación Integrativa (Ganar-Ganar)

El equipo proveedor y Bucaclínicos S.A.S. identificaron intereses complementarios: el proveedor requiere validar su solución en un entorno real con datos reales (valor académico y profesional); Bucaclínicos necesita una herramienta analítica especializada sin incurrir en el costo de un desarrollo interno. Esta alineación de intereses generó las condiciones para una negociación colaborativa en la que ambas partes obtienen beneficios concretos.

#### 8.2 BATNA (Best Alternative to a Negotiated Agreement)

- **BATNA del proveedor:** presentar el proyecto únicamente en el ámbito académico, sin implementación real en el cliente ni validación en producción.
- **BATNA del cliente:** continuar con hojas de cálculo manuales o adquirir un BI genérico (Power BI / Tableau) sin personalización para el formato POS específico de Bucaclínicos.

El BATNA del cliente es significativamente inferior al acuerdo propuesto, dado que ninguna solución genérica resuelve los 8 problemas de calidad de datos identificados ni incluye predicción de demanda adaptada al catálogo real de la farmacia. Esto fortaleció la posición del proveedor en los puntos de precio y plazo de soporte.

#### 8.3 Puntos negociados

| Punto | Posición inicial — Proveedor | Posición inicial — Cliente | Acuerdo final |
|-------|------------------------------|---------------------------|---------------|
| Precio de implementación | $2.500.000 COP | $0 (contexto académico) | $1.200.000 COP (descuento académico del 52 %) |
| Plazo de implementación | 16 semanas | 6 semanas | 13 semanas |
| Soporte post-implementación | 15 días | 60 días | 30 días con opción de renovación mensual |
| Datos históricos requeridos | 12 meses | 3 meses disponibles | 3 meses actuales + compromiso de entrega mensual futura |
| Sesiones de capacitación | 1 sesión general | 3 sesiones por rol | 2 sesiones diferenciadas (administrador y farmacéuticos) |

#### 8.4 Conflictos surgidos y resolución

**Conflicto 1 — Datos históricos insuficientes:**
Bucaclínicos disponía únicamente de 3 períodos de datos POS, por debajo del óptimo para capturar estacionalidad. El proveedor explicó la limitación técnica y su impacto en la precisión del modelo de predicción. Resolución: proceder con los datos actuales y formalizar en el acta el compromiso del cliente de entregar reportes mensuales para re-entrenar el modelo de forma continua. El proveedor asumió el riesgo técnico con transparencia, documentando la limitación en el informe de resultados entregado al cliente.

**Conflicto 2 — Precio en contexto académico:**
Bucaclínicos consideró inicialmente que, al tratarse de un proyecto de grado, la solución no debía tener costo monetario. El proveedor presentó el valor cuantificable generado: $717.300.012 COP en ventas analizadas, 43 productos en pérdida detectados, Silhouette Score de 0.73, cumplimiento del principio de Pareto al 79.96 %, además de los costos reales de infraestructura (AWS EC2, Clever Cloud, dominio). Se acordó un precio reducido del 52 % con pago en dos cuotas vinculadas a hitos del proyecto.

**Conflicto 3 — Período de soporte:**
El cliente solicitaba 60 días de soporte post-implementación sin costo adicional. El proveedor argumentó que este plazo excede la disponibilidad de un equipo pequeño sin remuneración proporcional. Resolución: 30 días formales incluidos en el precio acordado, con opción de renovación mensual a $200.000 COP/mes, lo que le da al cliente control sobre extender el soporte según su necesidad real.

---

### 9. Acta de Negociación y Cierre de Acuerdos

---

**ACTA DE NEGOCIACIÓN Y CIERRE DE ACUERDOS**

| Campo | Dato |
|-------|------|
| **Nombre del proyecto** | BUCAMLAI — Sistema Analítico de Inventario Farmacéutico con Machine Learning |
| **Cliente** | Bucaclínicos S.A.S. |
| **Proveedor** | Equipo BUCAMLAI — [NOMBRES DE LOS INTEGRANTES] |
| **Fecha** | 30 de mayo de 2026 |
| **Lugar** | Instalaciones de Bucaclínicos S.A.S., Colombia |

---

**Introducción**

El presente documento formaliza los acuerdos alcanzados entre Bucaclínicos S.A.S. (en adelante "el Cliente") y el Equipo BUCAMLAI (en adelante "el Proveedor") para la adquisición, implementación y soporte de la plataforma analítica BUCAMLAI. Las partes declaran haber negociado de buena fe bajo una estrategia integrativa ganar-ganar y manifiestan su conformidad plena con los términos aquí consignados.

---

**Condiciones del Acuerdo**

**1. Solución tecnológica seleccionada**

BUCAMLAI: plataforma web de análisis de inventario farmacéutico con Machine Learning e IA generativa, compuesta por:

- Backend FastAPI (Python 3.12) con 3 modelos de ML: Random Forest Regressor (predicción de demanda a 1/3/6 meses), KMeans k=3 (clasificación A/B/C de inventario), Apriori (reglas de asociación entre medicamentos).
- Frontend React + Vite + MUI 9 con dashboard interactivo de KPIs, gráficas y alertas.
- Base de datos PostgreSQL gestionada en Clever Cloud con respaldo automático.
- Módulo de IA generativa con Google Gemini 2.5 Flash para consultas en lenguaje natural sobre el inventario.
- Panel administrativo para gestión de usuarios, activación/desactivación de cuentas y carga de archivos CSV del POS.
- Sistema de autenticación JWT (HS256) + bcrypt + bloqueo automático tras 5 intentos fallidos.
- Recuperación de contraseña por correo electrónico.
- 68 pruebas automatizadas (pytest) que garantizan la calidad del sistema.

*Exclusiones del alcance:* integración directa con el software POS actual, módulos de nómina o contabilidad, soporte técnico en idiomas distintos al español, funcionalidades de e-commerce.

---

**2. Precio y condiciones de pago**

| Concepto | Valor COP |
|----------|----------:|
| Licencia de implementación de BUCAMLAI | $ 1.000.000 |
| Configuración de infraestructura y migración de datos | $ 200.000 |
| **Total acordado** | **$ 1.200.000** |

- **Primer pago (50 % = $600.000):** al inicio de la Fase 2 — configuración de infraestructura (semana 2).
- **Segundo pago (50 % = $600.000):** al go-live exitoso en producción (semana 8).
- **Método de pago:** transferencia bancaria a cuenta designada por el Proveedor.
- **Penalidad por mora:** 1 % mensual sobre el valor del pago vencido.
- **Soporte adicional (opcional):** $200.000 COP/mes, renovación mensual a partir del día 31 post-go-live.

---

**3. Plazos de implementación**

| Hito | Fecha comprometida |
|------|:-----------------:|
| Firma del acta / inicio del proyecto | 30 de mayo de 2026 |
| Fin de configuración de infraestructura | 13 de junio de 2026 |
| Fin de migración, limpieza y modelos entrenados | 4 de julio de 2026 |
| Fin de pruebas de aceptación (UAT) | 18 de julio de 2026 |
| Go-live en producción | 1 de agosto de 2026 |
| Fin del soporte post-implementación incluido | 31 de agosto de 2026 |

El incumplimiento de algún hito por causas atribuibles al Proveedor genera un plazo de gracia de 5 días hábiles antes de aplicar penalidades.

---

**4. Soporte y mantenimiento**

- **Duración del soporte incluido:** 30 días calendario desde el go-live.
- **Canales de soporte:** correo electrónico + mensajería (WhatsApp Business).
- **Tiempo de respuesta — incidencia crítica:** máximo 2 horas hábiles.
- **Tiempo de respuesta — incidencia alta:** máximo 24 horas hábiles.
- **Soporte adicional:** $200.000 COP/mes (renovación mensual opcional).

---

**5. Garantías**

- El Proveedor garantiza el funcionamiento de BUCAMLAI conforme a las especificaciones documentadas durante **90 días calendario** desde el go-live.
- La garantía cubre: defectos de software, errores en los modelos de ML y fallos en el módulo de autenticación.
- La garantía **no cubre:** cambios realizados unilateralmente por el Cliente en el formato CSV del POS, daños por uso inadecuado del sistema, o fallas de conectividad atribuibles a la red del Cliente.
- **Activación de la garantía:** el Cliente debe reportar el defecto por escrito dentro de las 48 horas hábiles de detectarlo.
- **Tiempo de respuesta para iniciar la corrección:** máximo 5 días hábiles desde el reporte.

---

**Compromisos de ambas partes**

**Compromisos del Proveedor (Equipo BUCAMLAI):**

1. Entregar el sistema funcional y probado según el cronograma acordado.
2. Ejecutar las 68 pruebas automatizadas y compartir el informe completo de resultados antes del go-live.
3. Capacitar al personal de Bucaclínicos en 2 sesiones diferenciadas (administrador y farmacéuticos/analistas).
4. Garantizar disponibilidad del sistema ≥ 99 % durante los primeros 30 días posteriores al go-live.
5. Entregar el manual de usuario en formato PDF antes de la puesta en producción.
6. Mantener la confidencialidad de los datos del Cliente conforme a la Ley 1581 de 2012, garantizando que los datos enviados a Gemini sean siempre agregados y anónimos.

**Compromisos del Cliente (Bucaclínicos S.A.S.):**

1. Entregar los reportes POS históricos en el formato CSV acordado dentro de los 3 primeros días hábiles tras la firma del acta.
2. Entregar reportes POS mensuales para el re-entrenamiento continuo de los modelos de ML.
3. Designar un interlocutor técnico responsable de validaciones y pruebas de aceptación UAT.
4. Realizar los pagos en las fechas y condiciones pactadas.
5. Garantizar acceso a las instalaciones y al personal para las sesiones de capacitación.
6. Notificar al Proveedor cualquier cambio en el formato de exportación del POS con un mínimo de 15 días de anticipación.

---

**Firmas de las partes**

| Parte | Representante | Cargo | Firma | Fecha |
|-------|---------------|-------|-------|:-----:|
| Cliente — Bucaclínicos S.A.S. | _________________________________ | Administrador General | _____________ | 30/05/2026 |
| Proveedor — Equipo BUCAMLAI | _________________________________ | Representante del Equipo | _____________ | 30/05/2026 |

---

**Anexos**

- Anexo A: Especificaciones técnicas de BUCAMLAI (stack completo, endpoints, modelos ML con métricas de validación).
- Anexo B: Informe de resultados de las 68 pruebas automatizadas (pytest).
- Anexo C: Manual de usuario (entrega antes del go-live — 1 de agosto de 2026).

---

### 10. Conclusiones Estratégicas del Proyecto

#### 10.1 Aprendizajes del proceso

El proyecto BUCAMLAI demostró que la transformación digital de una empresa de mediano tamaño no requiere grandes presupuestos, sino una alineación precisa entre el problema de negocio y la solución tecnológica. La metodología CRISP-DM garantizó que cada decisión técnica tuviera un correlato directo en el problema operativo del cliente, haciendo trazable cada requisito desde el IEEE 830 hasta el modelo de ML que lo satisface.

La aplicación del análisis Buy vs. Make reveló que Bucaclínicos no está en posición de desarrollar internamente una solución de ciencia de datos: no tiene el talento técnico, el tiempo ni el presupuesto para hacerlo. La estrategia Buy no solo es más eficiente económicamente, sino que entrega una solución ya validada con los datos reales de la propia empresa.

#### 10.2 ¿La solución responde realmente al problema?

Sí. BUCAMLAI aborda de forma directa los 8 problemas de calidad de datos identificados en el diagnóstico y genera valor medible en tres dimensiones:

- **Financiero:** identifica los 43 productos en pérdida (1.3 % del catálogo) que operan con rentabilidad negativa, habilitando su revisión o descontinuación inmediata por parte del administrador.
- **Operativo:** clasifica los 484 productos de categoría A que generan el 80 % de los ingresos (Pareto al 79.96 %, Silhouette Score 0.73), y predice la demanda a 1, 3 y 6 meses para optimizar el plan de compras.
- **Estratégico:** democratiza el análisis mediante IA generativa (Gemini 2.5 Flash), poniendo el poder del dato en manos de todo el personal de la farmacia sin requerir conocimientos técnicos.

#### 10.3 Riesgos pendientes para la etapa de ejecución real

- **Despliegue en AWS EC2:** el sistema está completo y probado; la puesta en producción en AWS es el único paso pendiente y está condicionado al inicio del acuerdo formal con el cliente.
- **Costos de infraestructura recurrentes:** AWS EC2 y Clever Cloud representan ~$120.000 COP/mes que Bucaclínicos debe presupuestar como gasto operativo permanente del sistema.
- **Adopción organizacional:** el personal no técnico puede mostrar resistencia al cambio hacia decisiones basadas en datos. Las sesiones de capacitación y el seguimiento de la tasa de adopción son críticos para el éxito sostenido del sistema.
- **Crecimiento del histórico de datos:** con el compromiso del cliente de entregar reportes mensuales, el modelo de predicción mejorará progresivamente a medida que se acumule mayor volumen de datos históricos.

#### 10.4 Recomendaciones estratégicas

1. **Corto plazo (0–3 meses):** ejecutar la revisión de los 43 productos con rentabilidad negativa detectados por BUCAMLAI — decidir descontinuación o ajuste de precio de venta para cada uno.
2. **Mediano plazo (3–6 meses):** alimentar el sistema con los reportes POS mensuales para mejorar la precisión del modelo de predicción con mayor volumen de datos históricos.
3. **Largo plazo (6–12 meses):** evaluar la integración directa del POS con la pipeline de BUCAMLAI para eliminar la carga manual de CSV y automatizar el análisis periódico.
4. **Escalabilidad:** la arquitectura FastAPI + PostgreSQL en cloud permite escalar horizontalmente si Bucaclínicos abre nuevas sucursales, incorporando simplemente nuevos reportes POS al pipeline sin rediseñar el sistema.

---

## Referencias

*Formato APA 7.ª edición*

Chapman, P., Clinton, J., Kerber, R., Khabaza, T., Reinartz, T., Shearer, C., & Wirth, R. (2000). *CRISP-DM 1.0: Step-by-step data mining guide*. SPSS Inc.

Congreso de Colombia. (2012). *Ley 1581 de 2012: Por la cual se dictan disposiciones generales para la protección de datos personales*. Diario Oficial No. 48.587.

Google DeepMind. (2025). *Gemini 2.5 Flash: Technical documentation and API reference*. Google LLC.

Han, J., Pei, J., & Tong, H. (2022). *Data mining: Concepts and techniques* (4.ª ed.). Morgan Kaufmann.

IEEE Computer Society. (1998). *IEEE Std 830-1998: Recommended practice for software requirements specifications*. IEEE Press.

Osterwalder, A., & Pigneur, Y. (2010). *Business model generation: A handbook for visionaries, game changers, and challengers*. Wiley.

Osterwalder, A., Pigneur, Y., Bernarda, G., & Smith, A. (2014). *Value proposition design: How to create products and services customers want*. Wiley.

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M., Perrot, M., & Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research*, *12*, 2825–2830.
