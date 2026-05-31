# Gaps: PRESENTACION.md vs Guía de Sustentación (expo.txt)

Comparación punto por punto entre lo que ya está en `PRESENTACION.md` y lo que exige la guía de expo para la sustentación del Proyecto de Aula.

---

## Resumen ejecutivo

| Sección requerida | Estado |
|-------------------|--------|
| 1. Contexto del negocio y problema | ✅ Cubierto |
| 2. Encaje Propuesta de Valor / Segmento de Mercado | ⚠️ Parcial — faltan Jobs, Pains/Gains y Canvas formal |
| 3. Selección de la solución tecnológica (Buy vs Make) | ❌ Ausente |
| 4. Matriz Ponderada y Toma de Decisiones | ❌ Ausente |
| 5. Plan de Implementación Tecnológica | ❌ Ausente |
| 6. Cronograma / Diagrama de Gantt | ❌ Ausente |
| 7. Monitoreo y Control del Proyecto (KPIs de proyecto) | ❌ Ausente |
| 8. Negociación Tecnológica y Solución de Conflictos | ❌ Ausente |
| 9. Acta de Negociación y Cierre de Acuerdos | ❌ Ausente |
| 10. Conclusiones Estratégicas | ⚠️ Parcial — faltan viabilidad financiera y escalabilidad futura |

**Evidencias visuales obligatorias para la diapositiva:**

| Evidencia | Estado |
|-----------|--------|
| Canvas (Value Proposition Canvas o Business Model Canvas) | ⚠️ Parcial — solo tabla de valor, no canvas formal |
| Matriz Ponderada | ❌ Ausente |
| Cronograma / Gantt | ❌ Ausente |
| Acta de Negociación | ❌ Ausente |
| Arquitectura o solución tecnológica | ✅ Cubierto (sección 10 de PRESENTACION.md) |

---

## Detalle por sección

### 1. Contexto del Negocio y Problema Organizacional

**Lo que pide expo.txt:**
- Situación actual de la empresa
- Problemas identificados
- Impacto operativo y tecnológico
- Necesidades del cliente

**Lo que tiene PRESENTACION.md:**
- Sección 2 describe los 8 problemas concretos del POS ✅
- Menciona el impacto operativo (sobrecompra, desabasto) ✅
- Sección 1 describe la empresa brevemente ✅

**Falta en la presentación:**
- Agregar la estructura organizacional de Bucaclínicos (administrador, farmacéuticos, personal).
- Cuantificar el impacto financiero explícitamente ($717M COP, 43 productos en pérdida, 34.5% margen).

---

### 2. Encaje entre Propuesta de Valor y Segmento de Mercado

**Lo que pide expo.txt:**
- Qué problema resuelve la tecnología
- Cómo se relaciona con el cliente objetivo
- **Jobs to be done**
- **Dolores y ganancias (Pains & Gains)**
- **Value Proposition Canvas**

**Lo que tiene PRESENTACION.md:**
- Tabla de valor en sección 4 (qué aporta al negocio) ✅ parcial
- Menciona a quién va dirigido implícitamente ✅ parcial

**Falta en la presentación — CRÍTICO:**
- Diapositiva con **Jobs-to-be-done** explícitos (funcionales, sociales, emocionales).
- Diapositiva de **Pains & Gains** con las frustraciones y ganancias del cliente.
- **Value Proposition Canvas visual** (el diagrama de los dos círculos/cuadrados con productos/servicios, aliviadores de pains, creadores de gains vs. perfil del cliente).

---

### 3. Selección de la Solución Tecnológica

**Lo que pide expo.txt:**
- Alternativas evaluadas
- Comparación tecnológica
- Criterios utilizados
- Justificación de la solución elegida
- Temas: ERP, SaaS, Open Source, Desarrollo a medida, Escalabilidad, Compatibilidad, Seguridad, ROI/TCO

**Lo que tiene PRESENTACION.md:**
- Sección 4.3 compara BUCAMLAI frente a Excel manual y BI genérico ✅ parcial

**Falta en la presentación — CRÍTICO:**
- Diapositiva de **comparación Buy vs. Make** con características, ventajas y desventajas de cada estrategia.
- Tabla comparativa explícita (no solo mencionar que es mejor que Excel).
- Justificación formal de por qué se eligió el Buy sobre el Make.

---

### 4. Matriz Ponderada y Toma de Decisiones

**Lo que pide expo.txt:**
- Cómo se construyó la matriz
- Criterios evaluados y sus pesos
- Calificaciones de cada alternativa
- Resultado final con sustento cuantitativo

**Lo que tiene PRESENTACION.md:**
- **Nada.** Esta sección está completamente ausente.

**Falta en la presentación — CRÍTICO:**
- Diapositiva con la **tabla de matriz ponderada** (criterios, pesos, calificaciones Buy vs Make, puntaje final).
- Explicación de por qué se asignaron esos pesos.
- Conclusión: Buy = 4.54/5.0 vs. Make = 2.18/5.0.

---

### 5. Plan de Implementación Tecnológica

**Lo que pide expo.txt:**
- Fases del proyecto
- Actividades principales por fase
- Responsables
- Recursos (humanos, técnicos, financieros)
- Riesgos
- Entregables

**Lo que tiene PRESENTACION.md:**
- Sección 11 menciona "Despliegue en AWS EC2 (Fase 6): Pendiente" ⚠️ solo estado
- No hay plan estructurado por fases.

**Falta en la presentación — CRÍTICO:**
- Diapositiva con las **7 fases del plan** (diagnóstico → go-live → soporte).
- Tabla de actividades, responsables y recursos por fase.
- Tabla de riesgos con probabilidad, impacto y mitigación.

---

### 6. Cronograma / Diagrama de Gantt

**Lo que pide expo.txt:**
- Secuencia lógica de actividades
- Dependencias entre actividades
- Duraciones estimadas
- Responsables
- Fechas estimadas

**Lo que tiene PRESENTACION.md:**
- **Nada.** Esta sección está completamente ausente.

**Falta en la presentación — CRÍTICO:**
- Diapositiva con **Gantt visual** (tabla o imagen) que muestre las 13 semanas de implementación.
- Puede hacerse en Excel, Trello, Asana o como tabla en la presentación.

---

### 7. Monitoreo y Control del Proyecto

**Lo que pide expo.txt:**
- Cómo se hizo el seguimiento al proyecto
- KPIs de seguimiento
- Gestión de incidencias
- Acciones correctivas
- Soporte y monitoreo

**Lo que tiene PRESENTACION.md:**
- Sección 7 menciona métricas de los modelos ML (Silhouette 0.73, Pareto 79.96%, MAE) ⚠️ solo métricas técnicas de ML

**Falta en la presentación:**
- Diferenciar entre **KPIs técnicos del sistema** (uptime, tiempo de respuesta, cobertura de tests) y **KPIs de negocio** (reducción de capital inmovilizado, adopción).
- Tabla de **gestión de incidencias** (crítica, alta, media, baja con tiempos de respuesta).
- Plan de **acciones correctivas** por desviación de KPI.

---

### 8. Negociación Tecnológica y Solución de Conflictos

**Lo que pide expo.txt:**
- Técnicas de negociación utilizadas
- Estrategia ganar-ganar
- Manejo de conflictos
- Comunicación técnica
- Liderazgo negociador

**Lo que tiene PRESENTACION.md:**
- **Nada.** Esta sección está completamente ausente.

**Falta en la presentación — CRÍTICO:**
- Diapositiva explicando la **técnica ganar-ganar** aplicada.
- Tabla de **BATNA** (alternativa del proveedor vs. alternativa del cliente).
- Tabla de **puntos negociados** (precio, plazo, soporte, datos históricos, capacitaciones).
- Descripción de los **conflictos surgidos y cómo se resolvieron** (datos insuficientes, precio académico, tiempo de soporte).

---

### 9. Acta de Negociación y Cierre de Acuerdos

**Lo que pide expo.txt:**
- Condiciones del acuerdo
- Precio y forma de pago
- Soporte y garantías
- Plazos de implementación
- Compromisos de las partes

**Elementos obligatorios según expo.txt:**
- Cliente, Proveedor, Alcance funcional, Garantías, SLA, Firmas

**Lo que tiene PRESENTACION.md:**
- **Nada.** Esta sección está completamente ausente.

**Falta en la presentación — CRÍTICO:**
- Diapositiva que muestre el **acta formal** (encabezado, condiciones, compromisos de ambas partes, firmas).
- El acta completa está en `INFORME_FINAL.md` sección 9 — usar como base para la diapositiva.

---

### 10. Conclusiones Estratégicas del Proyecto

**Lo que pide expo.txt:**
- Beneficios esperados
- Impacto organizacional
- Viabilidad técnica
- Viabilidad financiera
- Escalabilidad futura
- Valor agregado de la solución

**Lo que tiene PRESENTACION.md:**
- Sección 12 tiene conclusiones sólidas sobre validación de modelos, limitaciones del dataset y Ley 1581 ✅

**Falta en la presentación:**
- **Viabilidad financiera explícita:** mencionar el costo de implementación ($1.200.000 COP) vs. el valor recuperable (43 productos en pérdida, reducción de sobrestock).
- **Escalabilidad futura:** la arquitectura FastAPI + PostgreSQL + cloud escala horizontalmente para nuevas sucursales.
- **Impacto organizacional concreto:** cuantificar el beneficio esperado (ej. reducción 15% de capital inmovilizado en 3 meses).

---

## Plan de acción para la expo

Acciones ordenadas por prioridad para completar la presentación:

| Prioridad | Acción | Diapositiva sugerida |
|-----------|--------|----------------------|
| 1 | Crear diapositiva de Value Proposition Canvas (visual) | Slide 3 |
| 2 | Crear diapositiva de Jobs-to-be-done / Pains & Gains | Slide 4 |
| 3 | Crear diapositiva de comparación Buy vs. Make | Slide 6 |
| 4 | Crear diapositiva de Matriz Ponderada (tabla con puntajes) | Slide 7 |
| 5 | Crear diapositiva del Plan de Implementación (7 fases) | Slide 8 |
| 6 | Crear diapositiva del Gantt (13 semanas) | Slide 9 |
| 7 | Crear diapositiva de KPIs de monitoreo | Slide 10 |
| 8 | Crear diapositiva de Negociación (técnica + conflictos) | Slide 11 |
| 9 | Crear diapositiva resumen del Acta de Negociación | Slide 12 |
| 10 | Actualizar conclusiones con viabilidad financiera y escalabilidad | Slide 14 |

**Tiempo estimado:** 15–20 minutos de exposición → aproximadamente 14–16 diapositivas en total.

---

## Lo que PRESENTACION.md tiene bien y debe conservarse

Estos contenidos son sólidos y deben mantenerse tal cual en la presentación:

- Descripción del problema de negocio con los 8 defectos de calidad de datos ✅
- Objetivos específicos trazables a cada modelo ML ✅
- Stack tecnológico con justificación de cada tecnología ✅
- Resultados reales del dataset (3.204 registros, $717M COP, métricas ML) ✅
- Diagrama de arquitectura del pipeline ✅
- Sección de seguridad y cumplimiento legal (Ley 1581) ✅
- Descripción de funcionalidades por rol (admin y analista) ✅

Todo el contenido faltante (secciones 2–9 incompletas) está desarrollado en `INFORME_FINAL.md` y puede usarse directamente para construir las diapositivas correspondientes.
