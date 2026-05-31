# INFORME FINAL INTEGRADOR
## Selección, Implementación y Negociación Tecnológica

---

## PORTADA

| | |
|---|---|
| **Título** | Informe Final Integrador: Selección, Implementación y Negociación Tecnológica |
| **Proyecto** | BUCAMLAI — Sistema Analítico de Inventario Farmacéutico con Machine Learning |
| **Cliente** | Bucaclínicos S.A.S. |
| **Asignatura** | Selección y Evaluación de Tecnología |
| **Semestre** | VI · Corte III |
| **Docente** | Alexander Anchicoque |
| **Institución** | Unidades Tecnológicas de Santander |
| **Fecha de entrega** | 31 de mayo de 2026 |
| **Peso** | 30 % de la nota final |

**Integrantes:**
- Iván Andrés Vargas Hernández
- Javier Steven Becerra Mantilla
- Angel Santiago Jaimes Moreno
- Yeison Stiven Segura Rincon
- Jhon Fredi Martínez Diaz

---

## Objetivo Principal

Elaborar un informe integrador que articule los resultados de las fases II y III del proceso académico, documentando la selección, implementación y negociación tecnológica de BUCAMLAI: plataforma analítica con Machine Learning e IA generativa para la gestión del inventario farmacéutico de Bucaclínicos S.A.S., aplicando los marcos conceptuales de TCO, Make vs. Buy, SLA y ciclo de vida tecnológico.

---

## Objetivos Específicos

*(Relacionados con las actividades planteadas en el Diagrama de Gantt)*

1. Describir el contexto organizacional de Bucaclínicos S.A.S. y el problema tecnológico que justifica la adquisición de BUCAMLAI, sustentando el análisis en los datos reales del inventario.
2. Demostrar el encaje entre la propuesta de valor de BUCAMLAI y el segmento de clientes de Bucaclínicos mediante el análisis de jobs-to-be-done, dolores y ganancias.
3. Evaluar las estrategias de adquisición tecnológica Buy vs. Make a través de los cinco criterios definidos (TCO, SLA, personalización, seguridad, escalabilidad) y la matriz ponderada.
4. Planificar las actividades de implementación en producción: configuración de infraestructura, migración de datos, entrenamiento de modelos, pruebas UAT y capacitación del personal.
5. Formalizar los compromisos acordados entre el Proveedor (Equipo BUCAMLAI) y el Cliente (Bucaclínicos S.A.S.) en el acta de cierre de negociación.

---

## INFORME FINAL

---

### 1. Contexto del Negocio y Problema Organizacional

#### 1.1 Descripción de la empresa

Bucaclínicos S.A.S. (NIT: 901.157.386-0) es una farmacia ubicada en la carrera 22 #54-50 de Bucaramanga, Santander, dedicada a la comercialización de medicamentos y productos de salud al detal. La empresa gestiona un catálogo de **1.593 productos** de **165 laboratorios**, con ventas totales por **$717.300.012 COP** y una utilidad de **$247.667.180 COP** (margen general del 34.5 %) en el período analizado. Su estructura organizacional es básica: un administrador general, farmacéuticos con rol de analistas y personal operativo de caja. No cuenta con área de tecnología ni de ciencia de datos interna.

#### 1.2 Problema identificado

La empresa gestiona su inventario de manera empírica, sin ningún sistema tecnológico que le permita anticipar la demanda, detectar productos próximos a vencerse o identificar patrones de compra. Esta situación genera dos problemas críticos que afectan directamente la rentabilidad:

**a) Exceso de stock en medicamentos de baja rotación:** productos que llegan a su fecha de vencimiento en bodega sin haberse vendido, representando pérdidas económicas que el análisis del catálogo sitúa entre el 5 % y el 10 % del inventario activo.

**b) Desabastecimiento en temporadas de alta demanda:** durante los períodos de lluvias en Bucaramanga (marzo–mayo y septiembre–noviembre) se incrementa la demanda de antibióticos, antihistamínicos y antiparasitarios. La farmacia no puede anticipar esos picos y pierde ventas en los momentos de mayor necesidad.

El sistema POS que utiliza Bucaclínicos genera reportes diseñados para visualización en pantalla, no para análisis cuantitativo. Esto produce ocho problemas concretos de calidad de datos que hacen inviable cualquier análisis sin un proceso de limpieza y estandarización:

1. Números en formato colombiano (`14.850,00`) que herramientas como Python interpretan incorrectamente.
2. Filas de metadata mezcladas con registros de productos reales.
3. Ausencia de columna de fecha por registro individual.
4. Ausencia de precio unitario desagregado por transacción.
5. Productos en consignación registrados con costo cero.
6. Rentabilidades extremas no detectadas automáticamente (−618 % en AMPICILINA 500MG).
7. Sin clasificación automática de productos por nivel de rotación.
8. Sin capacidad predictiva de demanda futura.

**Impacto financiero comprobado con datos reales:** de las 3.204 transacciones válidas analizadas, 43 productos (1.3 % del catálogo) operan con rentabilidad negativa y continúan siendo comercializados. Los 484 productos de categoría A, que generan el **80 % de los ingresos**, no reciben la atención diferenciada que su peso en el negocio requiere.

---

### 2. Encaje entre Propuesta de Valor y Segmento de Mercado

#### 2.1 Segmento de clientes

| Perfil | Rol en Bucaclínicos | Necesidad principal |
|--------|---------------------|---------------------|
| Administrador general | Dueño / gestor de compras | Visibilidad financiera del inventario y control de rentabilidad por producto |
| Farmacéuticos / analistas | Gestión operativa del stock | Datos confiables para decisiones de reposición y detección de productos en pérdida |
| Personal de caja | Usuario operativo | Consultas rápidas sin conocimientos técnicos |

#### 2.2 Jobs-to-be-done

| Tipo | Trabajo del cliente |
|------|---------------------|
| Funcional | Saber cuántas unidades de cada medicamento comprar el próximo mes, sin sobrestock ni desabasto |
| Funcional | Identificar qué productos generan pérdidas para tomar acción inmediata |
| Social | Demostrar a socios y proveedores que las decisiones de compra están basadas en datos |
| Emocional | Reducir la incertidumbre de gestionar 1.593 productos sin herramientas analíticas |

#### 2.3 Dolores (Pains)

- Tomar decisiones de compra sin soporte cuantitativo: intuición como único criterio.
- No detectar que un producto lleva meses operando con rentabilidad negativa.
- Desabasto de medicamentos de alta demanda, con ventas perdidas directas.
- Datos del POS en formato inutilizable para cualquier análisis externo.
- Tiempo excesivo en procesamiento manual de reportes.
- Sin capacidad de anticipar picos de demanda estacionales.

#### 2.4 Ganancias (Gains)

- Predicciones de demanda a 1, 3 y 6 meses mediante modelos de ML validados con datos reales del cliente.
- Alertas automáticas sobre los 43 productos con rentabilidad negativa.
- Clasificación A/B/C de los 1.593 productos para priorizar el pedido de reposición.
- Dashboard con KPIs de ventas, utilidad y margen general del negocio.
- Consultas al inventario en lenguaje natural vía Gemini 2.5 Flash, sin necesidad de conocimientos técnicos.
- Descubrimiento de patrones de compra conjunta: qué medicamentos se venden juntos.

#### 2.5 Propuesta de valor

BUCAMLAI convierte los reportes crudos del POS de Bucaclínicos en inteligencia de negocio accionable mediante tres modelos de Machine Learning (Random Forest, KMeans, Apriori) y una capa de IA generativa (Gemini 2.5 Flash), eliminando las decisiones por intuición y sustituyéndolas por evidencia estadística. Todo esto sin requerir que el personal de la farmacia tenga conocimientos en ciencia de datos.

#### 2.6 Encaje Valor–Mercado

| Dolor / Ganancia del cliente | Cómo BUCAMLAI lo resuelve |
|------------------------------|---------------------------|
| Datos del POS ilegibles para análisis | Limpieza automática con 8 técnicas CRISP-DM: de 3.306 filas crudas a 3.204 registros válidos |
| Sin predicción de demanda | Random Forest Regressor: predicción de ventas a 1, 3 y 6 meses por medicamento |
| Sin clasificación del inventario | KMeans (k=3) + Pareto/ABC: identifica los 484 productos A que generan el 80 % de ingresos |
| Patrones de compra conjunta desconocidos | Reglas de Asociación con Apriori: qué medicamentos se compran juntos |
| Análisis reservado a expertos | Chat Gemini 2.5 Flash en lenguaje natural para todo el personal |
| 43 productos en pérdida sin detectar | Clasificación automática por umbral de rentabilidad con alerta inmediata |
| Dependencia de terceros para acceder a sus datos | Panel admin con carga de CSV, gestión de usuarios y control de acceso propio |

---

### 3. Selección de la Solución Tecnológica (Buy vs. Make)

Para determinar la estrategia de adquisición más adecuada para Bucaclínicos se evaluaron dos alternativas, aplicando los criterios de decisión Make vs. Buy del Playbook Estratégico de Adquisición Tecnológica visto en clase: se opta por **Make** cuando se requiere control total y ventaja competitiva diferencial; se opta por **Buy** cuando la solución ya existe, el tiempo es crítico y la empresa carece de capacidades técnicas internas.

#### 3.1 Estrategia Buy — BUCAMLAI *(seleccionada)*

**Descripción:** adquisición de BUCAMLAI, desarrollado externamente por el Equipo Proveedor como solución especializada para Bucaclínicos. El equipo actúa como proveedor tecnológico con experiencia en ciencia de datos y desarrollo web.

**Características de la solución:**

| Capa | Tecnología | Función |
|------|------------|---------|
| Backend | FastAPI (Python 3.12) — puerto 8080 | API asíncrona que expone los modelos ML como endpoints REST con autenticación JWT |
| Frontend | React + Vite + MUI 9 — puerto 5173 | Dashboard interactivo con gráficas, alertas y módulos analíticos |
| Base de datos | PostgreSQL (Clever Cloud) | Almacenamiento persistente de usuarios, roles y sesiones con respaldo automático |
| Machine Learning | scikit-learn 1.5.2 · mlxtend 0.23.1 | Random Forest (predicción), KMeans k=3 (clusters A/B/C), Apriori (reglas de asociación) |
| IA Generativa | Google Gemini 2.5 Flash | Consultas en lenguaje natural sobre el inventario con datos anonimizados |
| Testing | pytest 9.0.3 + FastAPI TestClient | 68 pruebas automatizadas: 36 unitarias + 34 de integración |
| Despliegue | AWS EC2 + Nginx + Let's Encrypt | Sistema 24/7 con HTTPS en `bucamlai.bucaclinicos.com` |
| Autenticación | JWT (HS256) + bcrypt | Tokens firmados, contraseñas cifradas, bloqueo tras 5 intentos fallidos |

**Ventajas:**
- Solución ya desarrollada y validada con los datos reales de Bucaclínicos (3.204 registros procesados).
- Adaptada específicamente al formato POS de Bucaclínicos y a la normativa colombiana (Ley 1581 de 2012).
- No requiere contratar personal técnico con perfil en ciencia de datos.
- Tiempo de implementación mínimo: el sistema existe, está probado con 68 pruebas automatizadas y puede desplegarse de inmediato.
- Componentes de infraestructura (AWS EC2, Clever Cloud) adquiridos como servicio, transfiriendo el riesgo de obsolescencia de hardware al proveedor de nube.

**Desventajas:**
- Dependencia del Proveedor para evoluciones futuras del sistema.
- Costos de infraestructura cloud recurrentes (~$120.000 COP/mes).

#### 3.2 Estrategia Make — Desarrollo interno *(descartada)*

**Descripción:** Bucaclínicos contrata y gestiona internamente el desarrollo de su propia solución analítica.

**Características hipotéticas:**
- Contratación de 1–2 desarrolladores con perfil en ciencia de datos y desarrollo web.
- Construcción desde cero de la pipeline de limpieza, modelado y visualización.
- Administración interna del servidor, base de datos y mantenimiento.

**Ventajas:**
- Control total sobre el código fuente y los datos.
- Sin dependencia de proveedor externo para cambios futuros.

**Desventajas:**
- Tiempo de desarrollo estimado: 8–12 meses desde cero.
- Costo elevado: perfiles en Machine Learning superan los $5.000.000 COP/mes en Colombia.
- Alto riesgo técnico: Bucaclínicos no tiene experiencia previa en ciencia de datos.
- El sistema de predicción de demanda con ML no está disponible en soluciones comerciales estándar para farmacias de este tamaño en Colombia, lo que significaría desarrollarlo completamente desde cero sin garantía de calidad.

---

### 4. Matriz Ponderada y Toma de Decisiones

Los cinco criterios de evaluación se derivan directamente de los conceptos de TCO, SLA, Make vs. Buy, seguridad y ciclo de vida tecnológico estudiados en la asignatura.

| Criterio | Peso | Buy — BUCAMLAI (1–5) | Puntaje Buy | Make — Interno (1–5) | Puntaje Make |
|----------|:----:|:--------------------:|:-----------:|:--------------------:|:------------:|
| Costo Total de Propiedad (TCO a 5 años) | 20 % | 5.0 | 1.00 | 1.5 | 0.30 |
| Disponibilidad y nivel de servicio (SLA) | 20 % | 4.5 | 0.90 | 2.0 | 0.40 |
| Personalización y adaptación al negocio | 20 % | 5.0 | 1.00 | 2.5 | 0.50 |
| Seguridad y cumplimiento normativo (Ley 1581) | 20 % | 4.5 | 0.90 | 2.0 | 0.40 |
| Escalabilidad y gestión de obsolescencia | 20 % | 4.5 | 0.90 | 2.0 | 0.40 |
| **TOTAL** | **100 %** | | **4.70** | | **2.00** |

*Escala: 1.0 (muy deficiente) → 5.0 (excelente)*

**Sustentación de cada criterio:**

**TCO:** el Buy (BUCAMLAI) tiene un TCO proyectado a 5 años de ~$10.800.000 COP (implementación $1.200.000 + infraestructura cloud $120.000/mes × 60 meses = $7.200.000 + soporte opcional $2.400.000), muy por debajo del límite aceptable de $18.000.000. El Make, en cambio, solo el desarrollo costaría $60.000.000 (1 desarrollador ML a $5.000.000/mes × 12 meses), superando 3 veces el límite máximo.

**SLA:** AWS EC2 garantiza 99.5 % de disponibilidad anual con SLA documentado, cumpliendo el mínimo requerido de 98 %. El Make dependería de infraestructura propia sin garantías formales ni soporte técnico especializado.

**Personalización:** BUCAMLAI fue construido específicamente sobre el formato POS de Bucaclínicos con los datos reales del cliente. No existe una solución comercial empaquetada con análisis ABC, predicción de demanda y chat en lenguaje natural adaptados al catálogo de esta farmacia en Colombia.

**Seguridad:** BUCAMLAI implementa JWT + bcrypt + TLS 1.2+ + anonimización de datos ante Gemini, cumpliendo los tres pilares ISO 27001 y la Ley 1581 de 2012 desde el diseño inicial. El Make requeriría construir estas capas desde cero sin garantía de calidad.

**Escalabilidad:** la arquitectura FastAPI + PostgreSQL + AWS EC2 es modular y escalable. La nube transfiere el riesgo de obsolescencia de hardware al proveedor de infraestructura, con un plan de vida tecnológico previsible.

**Decisión:** la estrategia **Buy (BUCAMLAI)** obtiene **4.70 / 5.0** frente a **2.00 / 5.0** del Make. BUCAMLAI es seleccionado como la solución tecnológica para Bucaclínicos S.A.S.

---

### 5. Plan de Implementación Tecnológica

El sistema BUCAMLAI tiene su desarrollo completamente terminado y validado. El plan de implementación cubre exclusivamente las fases de despliegue en producción, desde la firma del acta hasta la estabilización del sistema en el entorno real de Bucaclínicos.

#### 5.1 Fases de implementación

| # | Fase | Duración | Responsable |
|---|------|:--------:|-------------|
| 1 | Configuración del entorno de producción en AWS | 2 semanas | Iván Vargas — Backend |
| 2 | Migración de datos y entrenamiento de modelos | 3 semanas | Jhon Fredi Martínez — Data Science |
| 3 | Pruebas de aceptación con el cliente (UAT) | 2 semanas | Todo el equipo + Administrador |
| 4 | Capacitación del personal de Bucaclínicos | 1 semana | Equipo Proveedor |
| 5 | Puesta en producción (go-live) | 1 semana | Iván Vargas + Administrador |
| 6 | Soporte post-go-live | 4 semanas | Equipo Proveedor |

**Duración total estimada:** 13 semanas desde la firma del acta (30 de mayo de 2026)

#### 5.2 Actividades por fase

**Fase 1 — Configuración de infraestructura:**
- Provisionamiento de instancia AWS EC2 (2 vCPU, 4 GB RAM) como servidor de aplicación.
- Configuración de PostgreSQL en Clever Cloud con respaldo automático diario (retención mínima 30 días).
- Despliegue de backend FastAPI y frontend React bajo Nginx como proxy inverso.
- Habilitación de TLS 1.2+ con certificado Let's Encrypt para el dominio `bucamlai.bucaclinicos.com`.

**Fase 2 — Migración de datos y modelado:**
- Carga del histórico POS de Bucaclínicos a la pipeline de limpieza (8 técnicas CRISP-DM).
- Validación de los 3.204 registros resultantes antes del entrenamiento.
- Entrenamiento de los modelos Random Forest, KMeans (k=3) y Apriori con el histórico validado.
- Configuración del módulo Gemini 2.5 Flash con anonimización de datos conforme a la Ley 1581 de 2012.

**Fase 3 — Pruebas de aceptación (UAT):**
- Ejecución de las 68 pruebas automatizadas (pytest) con entrega del informe de resultados al cliente.
- Validación del dashboard con datos reales del cliente por el equipo de la farmacia.
- Aprobación formal escrita del cliente antes del go-live.

**Fase 4 — Capacitación:**
- Sesión 1 (4 h): administrador — panel admin, gestión de usuarios, carga de CSV, alertas de rentabilidad.
- Sesión 2 (3 h): farmacéuticos — dashboard, predicciones, clasificación A/B/C, chat Gemini.
- Entrega del manual de usuario en formato digital.

**Fase 5 — Go-live:**
- Apertura del sistema en producción con acceso para todo el personal autorizado.
- Monitoreo intensivo durante las primeras 48 horas de operación.

**Fase 6 — Soporte:**
- Canal de soporte por correo electrónico durante 30 días calendario.
- Corrección de incidencias críticas en máximo 2 horas hábiles.

#### 5.3 Recursos

| Tipo | Recurso | Detalle |
|------|---------|---------|
| Humano | Iván Andrés Vargas | Liderazgo, backend FastAPI, PostgreSQL, modelos ML |
| Humano | Yeison Stiven Segura | Frontend React, interfaz de usuario y dashboard |
| Humano | Jhon Fredi Martínez | Ciencia de datos, entrenamiento y validación de modelos |
| Humano | Javier Becerra / Angel Jaimes | Apoyo en pruebas, documentación y capacitación |
| Humano | Administrador de Bucaclínicos | Contraparte en UAT, decisiones y validaciones |
| Técnico | AWS EC2 t2.medium | 2 vCPU · 4 GB RAM · 30 GB SSD |
| Técnico | Clever Cloud PostgreSQL | Base de datos gestionada con respaldo automático |
| Técnico | Dominio + SSL | `bucamlai.bucaclinicos.com` con TLS 1.2+ |
| Financiero | Infraestructura mensual | ~$120.000 COP/mes (AWS + Clever Cloud) |

#### 5.4 Riesgos y mitigación

| Riesgo | Probabilidad | Mitigación |
|--------|:------------:|------------|
| Datos históricos insuficientes para capturar estacionalidad | Alta | Proceder con los 3 períodos disponibles; formalizar en acta el compromiso de entrega mensual futura |
| Cambio en el formato de exportación del POS | Baja | Pipeline de limpieza parametrizable; aviso previo de 15 días según acta |
| Resistencia al cambio del personal | Media | Capacitación diferenciada por rol y manual de usuario simplificado |
| Fallo de conectividad AWS | Baja | Monitoreo automático con alerta por correo en < 5 minutos |

---

### 6. Cronograma — Diagrama de Gantt

*(Semanas desde la firma del acta — 30 de mayo de 2026)*

| Actividad | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | S11 | S12 | S13 |
|-----------|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|
| Configuración infraestructura AWS + Nginx | ██ | ██ | | | | | | | | | | | |
| Migración de datos POS y limpieza | | ██ | ██ | | | | | | | | | | |
| Entrenamiento de modelos ML (RF · KMeans · Apriori) | | | ██ | ██ | ██ | | | | | | | | |
| Pruebas de aceptación UAT | | | | | ██ | ██ | | | | | | | |
| Capacitación del personal | | | | | | ██ | ██ | | | | | | |
| Go-live y puesta en producción | | | | | | | | ██ | | | | | |
| Soporte activo (30 días) | | | | | | | | | ██ | ██ | ██ | ██ | |

*Fechas orientativas: S1 = 2 jun · S8 = 21 jul · Fin soporte = 20 ago 2026*

---

### 7. Monitoreo y Control del Proyecto

#### 7.1 KPIs técnicos

| KPI | Valor objetivo | Frecuencia de revisión | Responsable | Acción correctiva |
|-----|:--------------:|:---------------------:|-------------|-------------------|
| Disponibilidad del sistema (SLA) | ≥ 98 % anual | Diaria | Equipo Proveedor | Reinicio automático + alerta por correo en < 5 min |
| Calidad del clustering A/B/C | Silhouette Score ≥ 0.65 | Mensual | Equipo Proveedor | Ajuste del parámetro k en KMeans |
| Tiempo de respuesta de la API | < 2 s por endpoint | Diaria | Equipo Proveedor | Optimización de consultas SQL |
| Cobertura de pruebas automatizadas | 68 pruebas en verde | Cada despliegue | Equipo Proveedor | Corrección inmediata de regresiones |
| Precisión del modelo de predicción | MAE mejora con datos mensuales | Mensual | Equipo Proveedor | Re-entrenamiento con el reporte POS del mes |

#### 7.2 KPIs de negocio

| KPI | Valor objetivo | Frecuencia | Responsable | Acción correctiva |
|-----|:--------------:|:----------:|-------------|-------------------|
| Productos con rentabilidad negativa activos | 0 productos en pérdida sin revisión | Semanal | Administrador | Decisión de descontinuación o ajuste de precio |
| Reducción de capital inmovilizado | ≥ 15 % en 3 meses | Trimestral | Administrador | Ajuste del plan de compras según clasificación A/B/C |
| Adopción del sistema | ≥ 80 % del personal capacitado usando el dashboard | Mensual | Administrador | Sesión adicional de apoyo o soporte individual |

#### 7.3 Gestión de incidencias

| Prioridad | Definición | Tiempo de respuesta | Tiempo de resolución |
|-----------|------------|:-------------------:|:--------------------:|
| Crítica | Sistema caído o datos corruptos | 2 horas hábiles | 24 horas |
| Alta | Funcionalidad principal no disponible | 24 horas | 48 horas |
| Media | Error no bloqueante | 48 horas | 1 semana |
| Baja | Mejora visual o ajuste de presentación | 1 semana | Backlog del Proveedor |

---

### 8. Negociación Tecnológica y Solución de Conflictos

#### 8.1 Técnica aplicada: Negociación Integrativa (Ganar-Ganar)

El equipo Proveedor y Bucaclínicos identificaron intereses complementarios: el Proveedor requiere validar la solución en un entorno real con datos reales (valor académico y profesional); Bucaclínicos necesita una herramienta analítica especializada sin incurrir en el costo de un desarrollo interno. Esta alineación de intereses permitió aplicar la estrategia ganar-ganar, en la que ambas partes ceden en puntos secundarios para obtener valor en los puntos prioritarios.

#### 8.2 BATNA

- **BATNA del Proveedor:** presentar el proyecto únicamente en el ámbito académico, sin implementación real ni validación en producción.
- **BATNA del Cliente:** continuar con el manejo empírico del inventario, o adquirir un ERP farmacéutico genérico sin personalización para el formato POS de Bucaclínicos ni capacidad de ML.

El BATNA del cliente es significativamente inferior al acuerdo propuesto, dado que ninguna solución comercial disponible para farmacias pequeñas en Colombia integra análisis ABC, predicción de demanda con ML y consultas en lenguaje natural adaptadas al catálogo real del cliente.

#### 8.3 Puntos negociados

| Punto | Posición inicial — Proveedor | Posición inicial — Cliente | Acuerdo final |
|-------|------------------------------|---------------------------|---------------|
| Precio de implementación | $2.500.000 COP | $0 (contexto académico) | $1.200.000 COP (descuento académico del 52 %) |
| Plazo de implementación | 16 semanas | 6 semanas | 13 semanas |
| Período de soporte incluido | 15 días | 60 días | 30 días con opción de renovación mensual |
| Datos históricos requeridos | 12 meses | 3 meses disponibles | 3 meses actuales + entrega mensual formal |
| Sesiones de capacitación | 1 sesión general | 3 sesiones diferenciadas | 2 sesiones por rol (admin y farmacéuticos) |

#### 8.4 Conflictos y resolución

**Conflicto 1 — Datos históricos insuficientes:**
Bucaclínicos disponía únicamente de 3 períodos de datos POS. El Proveedor explicó el impacto técnico y propuso proceder con los datos disponibles, formalizando en el acta el compromiso del cliente de entregar reportes mensuales para el re-entrenamiento continuo del modelo. El Proveedor documentó la limitación con transparencia ante el cliente.

**Conflicto 2 — Precio en contexto académico:**
El cliente consideró inicialmente que un proyecto académico no debía tener costo monetario. El Proveedor presentó el valor cuantificable entregado: $717.300.012 COP en ventas analizadas, 43 productos en pérdida detectados, Silhouette Score de 0.73, cumplimiento del principio de Pareto al 79.96 %, más los costos reales de infraestructura cloud. Se acordó un precio reducido del 52 % con pagos en dos hitos.

**Conflicto 3 — Período de soporte:**
El cliente solicitaba 60 días de soporte sin costo. El Proveedor argumentó la inviabilidad para un equipo de cinco estudiantes. Resolución: 30 días formales incluidos en el precio, con opción de renovación mensual a $200.000 COP, dando al cliente control sobre extender el soporte según su necesidad real.

---

### 9. Acta de Negociación y Cierre de Acuerdos

---

**ACTA DE NEGOCIACIÓN Y CIERRE DE ACUERDOS**

| Campo | Dato |
|-------|------|
| **Nombre del proyecto** | BUCAMLAI — Sistema Analítico de Inventario Farmacéutico con Machine Learning |
| **Cliente** | Bucaclínicos S.A.S. — NIT 901.157.386-0 |
| **Proveedor** | Equipo BUCAMLAI — Unidades Tecnológicas de Santander |
| **Fecha** | 30 de mayo de 2026 |
| **Lugar** | Instalaciones de Bucaclínicos S.A.S., Cra. 22 #54-50, Bucaramanga |

---

**Introducción**

El presente documento formaliza los acuerdos alcanzados entre Bucaclínicos S.A.S. (en adelante "el Cliente") y el Equipo BUCAMLAI (en adelante "el Proveedor") para la adquisición, implementación y soporte de la plataforma analítica BUCAMLAI. Las partes declaran haber negociado de buena fe bajo una estrategia integrativa y manifiestan conformidad plena con los términos consignados.

---

**Condiciones del Acuerdo**

**1. Solución tecnológica seleccionada**

BUCAMLAI: plataforma web de análisis de inventario farmacéutico con Machine Learning, que incluye:

- Backend FastAPI (Python 3.12) con 3 modelos ML: Random Forest Regressor (predicción de demanda), KMeans k=3 (clasificación A/B/C), Apriori (reglas de asociación).
- Frontend React + Vite + MUI 9 con dashboard de KPIs, gráficas y alertas.
- Base de datos PostgreSQL en Clever Cloud con respaldo automático diario.
- Módulo de IA generativa con Google Gemini 2.5 Flash para consultas en lenguaje natural.
- Panel administrativo: gestión de usuarios, carga de CSV y control de acceso.
- Autenticación JWT (HS256) + bcrypt + bloqueo automático tras 5 intentos fallidos.
- 68 pruebas automatizadas (pytest) que garantizan la calidad del sistema.

*Exclusiones:* integración directa con el software POS actual, módulos de nómina o contabilidad, soporte en idiomas distintos al español.

---

**2. Precio y condiciones de pago**

| Concepto | Valor COP |
|----------|----------:|
| Licencia de implementación de BUCAMLAI | $ 1.000.000 |
| Configuración de infraestructura y migración de datos | $ 200.000 |
| **Total acordado** | **$ 1.200.000** |

- **Primer pago (50 % = $600.000):** al inicio de la Fase 1 — configuración de infraestructura (semana 1).
- **Segundo pago (50 % = $600.000):** al go-live exitoso en producción (semana 8).
- **Método de pago:** transferencia bancaria a cuenta designada por el Proveedor.
- **Penalidad por mora:** 1 % mensual sobre el valor del pago vencido.
- **Soporte adicional (opcional):** $200.000 COP/mes, renovación mensual a partir del día 31 post-go-live.

---

**3. Plazos de implementación**

| Hito | Fecha comprometida |
|------|:-----------------:|
| Firma del acta / inicio del proyecto | 30 de mayo de 2026 |
| Fin de configuración de infraestructura AWS | 13 de junio de 2026 |
| Fin de migración de datos y modelos entrenados | 4 de julio de 2026 |
| Fin de pruebas de aceptación (UAT) | 18 de julio de 2026 |
| Go-live en producción | 21 de julio de 2026 |
| Fin del soporte incluido | 20 de agosto de 2026 |

El incumplimiento de algún hito por causas atribuibles al Proveedor genera un plazo de gracia de 5 días hábiles antes de aplicar penalidades.

---

**4. Soporte y mantenimiento**

- **Duración del soporte incluido:** 30 días calendario desde el go-live.
- **Canales:** correo electrónico + mensajería.
- **Incidencia crítica:** respuesta máxima en 2 horas hábiles.
- **Incidencia alta:** respuesta máxima en 24 horas hábiles.
- **Soporte adicional:** $200.000 COP/mes (renovación mensual opcional).

---

**5. Garantías**

- El Proveedor garantiza el funcionamiento de BUCAMLAI conforme a las especificaciones documentadas durante **90 días calendario** desde el go-live.
- **Cobertura:** defectos de software, errores en los modelos ML y fallos en el módulo de autenticación.
- **No cubre:** cambios unilaterales del Cliente en el formato CSV del POS, daños por uso inadecuado o fallas de conectividad atribuibles a la red del Cliente.
- **Activación:** el Cliente reporta el defecto por escrito en máximo 48 horas hábiles desde su detección.
- **Tiempo de corrección:** máximo 5 días hábiles desde el reporte.

---

**Compromisos de ambas partes**

**Proveedor (Equipo BUCAMLAI):**

1. Entregar el sistema funcional y probado según el cronograma acordado.
2. Ejecutar las 68 pruebas automatizadas y compartir el informe de resultados antes del go-live.
3. Capacitar al personal en 2 sesiones diferenciadas (administrador y farmacéuticos).
4. Garantizar disponibilidad del sistema ≥ 98 % durante los primeros 30 días post-go-live.
5. Entregar el manual de usuario en formato PDF antes de la puesta en producción.
6. Garantizar que los datos enviados a Gemini sean siempre agregados y anónimos, conforme a la Ley 1581 de 2012.

**Cliente (Bucaclínicos S.A.S.):**

1. Entregar los reportes POS históricos en formato CSV dentro de los 3 primeros días hábiles desde la firma.
2. Comprometerse a entregar reportes POS mensuales para el re-entrenamiento continuo de los modelos.
3. Designar un interlocutor responsable de validaciones y pruebas de aceptación UAT.
4. Realizar los pagos en las fechas y condiciones pactadas.
5. Notificar al Proveedor cualquier cambio en el formato de exportación del POS con un mínimo de 15 días de anticipación.

---

**Firmas de las partes**

| Parte | Representante | Cargo | Firma | Fecha |
|-------|---------------|-------|-------|:-----:|
| Cliente — Bucaclínicos S.A.S. | _________________________________ | Administrador General | _____________ | 30/05/2026 |
| Proveedor — Equipo BUCAMLAI | _________________________________ | Representante del Equipo | _____________ | 30/05/2026 |

---

**Anexos**

- Anexo A: Especificaciones técnicas de BUCAMLAI (stack, endpoints, métricas de validación de los modelos ML).
- Anexo B: Informe de resultados de las 68 pruebas automatizadas (pytest).
- Anexo C: Manual de usuario (entrega antes del go-live).

---

### 10. Conclusiones Estratégicas del Proyecto

#### 10.1 Aprendizajes del proceso

El proyecto BUCAMLAI demostró que la transformación digital de una empresa de mediano tamaño no requiere grandes presupuestos, sino una alineación precisa entre el problema de negocio y la solución tecnológica. La metodología CRISP-DM garantizó que cada decisión técnica tuviera un correlato directo en el problema operativo del cliente. La trazabilidad IEEE 830 → CRISP-DM → modelos ML → pruebas automatizadas hace que cada requisito de negocio pueda rastrearse hasta el código que lo satisface.

El análisis Buy vs. Make evidenció que Bucaclínicos no tiene las condiciones para desarrollar internamente una solución de ciencia de datos: ni el talento técnico, ni el tiempo, ni el presupuesto. La estrategia Buy no solo es más eficiente en términos de TCO, sino que entrega una solución ya validada con los datos reales de la propia farmacia.

#### 10.2 ¿La solución responde al problema?

Sí. BUCAMLAI aborda los 8 problemas de calidad de datos identificados y genera valor medible en tres dimensiones alineadas con los objetivos estratégicos de Bucaclínicos:

- **Económico:** identifica los 43 productos con rentabilidad negativa (1.3 % del catálogo) habilitando su revisión inmediata. El análisis ABC confirma que el 30 % de los productos (484 de 1.593) genera el 79.96 % de los ingresos, validando el principio de Pareto.
- **Operacional:** predice la demanda a 1, 3 y 6 meses para los 1.593 productos y automatiza la clasificación del inventario, liberando al personal de tareas manuales repetitivas.
- **Estratégico:** el chat Gemini 2.5 Flash democratiza el análisis, poniendo el poder del dato en manos de todo el personal sin requerir conocimientos técnicos. La arquitectura en nube (AWS + Clever Cloud) permite escalar a nuevas sucursales sin rediseñar el sistema.

#### 10.3 Riesgos para la etapa de ejecución

- **Despliegue en AWS EC2:** único componente pendiente; condicionado al inicio del acuerdo formal con el cliente.
- **Costos de infraestructura:** ~$120.000 COP/mes que el cliente debe presupuestar como gasto operativo permanente.
- **Adopción organizacional:** la capacitación diferenciada por rol y el seguimiento mensual de la tasa de adopción son críticos para el éxito sostenido del sistema.
- **Crecimiento del historial de datos:** con la entrega mensual de reportes POS, el modelo de predicción mejorará progresivamente, permitiendo en el futuro capturar la estacionalidad propia de Bucaramanga.

#### 10.4 Recomendaciones estratégicas

1. **Corto plazo (0–3 meses):** revisar y decidir sobre los 43 productos con rentabilidad negativa detectados — discontinuación o ajuste de precio de venta.
2. **Mediano plazo (3–6 meses):** alimentar el sistema con reportes POS mensuales para consolidar el historial y mejorar la precisión del modelo de predicción de demanda.
3. **Largo plazo (6–12 meses):** evaluar la integración directa con el POS para eliminar la carga manual de CSV y explorar la integración con datos epidemiológicos oficiales del Ministerio de Salud para anticipar picos de demanda estacionales en Bucaramanga.

---

## Referencias

*Formato APA 7.ª edición*

Chapman, P., Clinton, J., Kerber, R., Khabaza, T., Reinartz, T., Shearer, C., & Wirth, R. (2000). *CRISP-DM 1.0: Step-by-step data mining guide*. SPSS Inc.

Congreso de Colombia. (2012). *Ley 1581 de 2012: Por la cual se dictan disposiciones generales para la protección de datos personales*. Diario Oficial No. 48.587.

Google DeepMind. (2025). *Gemini 2.5 Flash: Technical documentation and API reference*. Google LLC.

IEEE Computer Society. (1998). *IEEE Std 830-1998: Recommended practice for software requirements specifications*. IEEE Press.

Osterwalder, A., Pigneur, Y., Bernarda, G., & Smith, A. (2014). *Value proposition design: How to create products and services customers want*. Wiley.

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M., Perrot, M., & Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research*, *12*, 2825–2830.

Project Management Institute. (2021). *A guide to the project management body of knowledge (PMBOK guide)* (7.ª ed.). Project Management Institute.

Unidades Tecnológicas de Santander. (2026). *Material de clase: Dominando el TCO de TI* [Diapositiva de presentación]. Asignatura Selección y Evaluación de Tecnología, Semestre VI.

Unidades Tecnológicas de Santander. (2026). *Playbook Estratégico de Adquisición Tecnológica* [Diapositiva de presentación]. Asignatura Selección y Evaluación de Tecnología, Semestre VI.

Unidades Tecnológicas de Santander. (2026). *Plan Estratégico de TI: Ciclo de vida, seguridad y disponibilidad* [Diapositiva de presentación]. Asignatura Selección y Evaluación de Tecnología, Semestre VI.

Vargas Hernández, I. A., Becerra Mantilla, J. S., Jaimes Moreno, A. S., Segura Rincon, Y. S., & Martínez Diaz, J. F. (2026). *Informe de selección y evaluación de tecnología: Diseño y análisis de estrategias de adquisición tecnológica — Bucaclínicos S.A.S.* Unidades Tecnológicas de Santander.
