# Fase 6 — Despliegue
## Proyecto BUCAMLAI · Bucaclínicos S.A.S.

---

## ¿Qué es esta fase en CRISP-DM?

La Fase 6 es la última de CRISP-DM. Es donde el sistema deja de vivir en la computadora del desarrollador y pasa a estar disponible para los usuarios reales de Bucaclínicos (el administrador y el farmacéutico) desde cualquier dispositivo con navegador.

En esta fase el código no cambia — lo que cambia es el entorno donde corre: de `localhost` en Windows a un servidor en la nube accesible 24/7 con cifrado HTTPS.

---

## Arquitectura de producción

```
INTERNET
    │
    ▼
[Dominio público]
https://bucamlai.bucaclinicos.com
    │
    ▼
[AWS EC2 — Servidor en la nube]
2 vCPUs · 4 GB RAM · 20 GB SSD
    │
    ├──► [Nginx — Proxy inverso]
    │         │
    │         ├──► Archivos React (estáticos) → puerto 80/443
    │         └──► FastAPI Python → puerto 8000 interno
    │
    └──► [Clever Cloud — PostgreSQL gestionado]
              Backups automáticos diarios
              Alta disponibilidad
```

---

## Herramientas definidas en la presentación técnica

### AWS EC2 — Servidor de aplicación

**¿Por qué AWS EC2?**
Es la plataforma de infraestructura en la nube más usada en el mundo. Permite escalar el servidor automáticamente si la demanda aumenta (por ejemplo si Bucaclínicos abre nuevas sucursales). El costo estimado es USD $15-30/mes para la especificación mínima requerida.

**Especificación mínima requerida:**
| Recurso | Mínimo | Justificación |
|---------|--------|---------------|
| CPU | 2 vCPUs | Procesar requests de FastAPI + modelos ML en paralelo |
| RAM | 4 GB | Cargar el DataFrame de 3.204 registros + modelos scikit-learn en memoria |
| Almacenamiento | 20 GB SSD | Sistema operativo + Python + dependencias + datasets |
| Conexión | >1 Gbps | Comunicación con Gemini API sin latencia |

**SLA (Acuerdo de Nivel de Servicio):** AWS garantiza 99.99% de disponibilidad para EC2, lo que supera el requisito no funcional RNF-14 del 98%.

---

### Nginx — Servidor Web y Proxy Inverso

**¿Por qué Nginx y no servir FastAPI directamente?**

FastAPI (con Uvicorn) es excelente para procesar peticiones de la API, pero no está optimizado para servir archivos estáticos (HTML, CSS, JavaScript de React) ni para manejar HTTPS. Nginx resuelve ambos problemas:

| Función | Cómo lo hace Nginx |
|---------|--------------------|
| Servir React | Sirve los archivos del build de React directamente desde el disco, sin pasar por Python |
| Proxy inverso | Recibe peticiones a `/api/` y las redirige al puerto 8000 donde corre FastAPI |
| HTTPS/TLS | Gestiona el certificado SSL y el cifrado de toda la comunicación |
| Balanceo de carga | Si se despliegan múltiples instancias de FastAPI, Nginx distribuye la carga |

**Configuración básica de Nginx para este proyecto:**
```nginx
server {
    listen 443 ssl;
    server_name bucamlai.bucaclinicos.com;

    # Certificado SSL
    ssl_certificate     /etc/letsencrypt/live/bucamlai.bucaclinicos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bucamlai.bucaclinicos.com/privkey.pem;

    # Servir React (frontend)
    location / {
        root /var/www/bucamlai/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy hacia FastAPI (backend)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### HTTPS / TLS 1.2+

**¿Por qué es obligatorio en producción?**

1. **Seguridad:** Sin HTTPS, los datos que viajan entre el navegador del farmacéutico y el servidor (incluyendo passwords y datos del inventario) viajarían en texto plano y cualquiera en la misma red podría interceptarlos.

2. **Cumplimiento legal:** La **Ley 1581 de 2012** (Ley de Protección de Datos Personales de Colombia) exige que los datos sensibles estén protegidos. El HTTPS es el mecanismo estándar de cifrado en tránsito.

3. **Gemini API:** Google requiere HTTPS para todas las comunicaciones con su API.

**Certificado SSL:** Se obtiene gratuitamente con **Let's Encrypt** mediante Certbot. Se renueva automáticamente cada 90 días.

---

### Clever Cloud — Base de Datos PostgreSQL Gestionada

**¿Por qué Clever Cloud y no PostgreSQL directamente en EC2?**

Administrar una base de datos directamente en el servidor significa hacerse cargo de:
- Backups manuales
- Actualizaciones de seguridad
- Monitoreo de espacio en disco
- Recuperación ante fallos

Clever Cloud gestiona todo eso automáticamente. El equipo de desarrollo solo se conecta con una cadena de conexión y trabaja con la base de datos sin preocuparse por la infraestructura.

**¿Para qué se usa PostgreSQL en este proyecto?**
El estado actual del sistema guarda los datos en archivos CSV en memoria. Para producción, todos los datos deben persistir en PostgreSQL:
- Catálogo de medicamentos
- Historial de predicciones generadas
- Usuarios del sistema (con contraseñas en bcrypt)
- Logs de auditoría de acciones
- Resultados de clasificación ABC

---

## Seguridad en producción

### Autenticación JWT

Todos los endpoints de la API (excepto `/login`) requieren un token JWT válido en el header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
```

- **Expiración:** 8 horas
- **Algoritmo:** HS256
- **Bloqueo:** Cuenta bloqueada temporalmente tras 5 intentos fallidos consecutivos
- **Roles:** Administrador (acceso completo) y Operador (solo consultas)

### Contraseñas

Las contraseñas nunca se guardan en texto plano. Se usa **bcrypt** con sal aleatoria:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = pwd_context.hash("contraseña_del_usuario")
```

### API Key de Gemini

La API Key de Gemini NUNCA va en el código fuente. Se gestiona como variable de entorno del sistema operativo en EC2:
```bash
export GEMINI_API_KEY="AIzaSyAPxcnxk2583MyPFFakB-2ZSkRyOpG5CQ0"
```

En el código se lee con:
```python
import os
api_key = os.getenv("GEMINI_API_KEY")
```

### Anonimización de datos (Ley 1581 de 2012)

Antes de enviar cualquier dato a Gemini o cualquier servicio externo, se aplica anonimización:
- Solo se envían estadísticas agregadas (totales, promedios, conteos)
- Nunca se envían nombres de clientes, datos médicos individuales o información personal
- Los datos que salen del servidor colombiano deben cumplir con la Superintendencia de Industria y Comercio (SIC)

---

## Garantías de producción (RNF del sistema)

| Requisito No Funcional | Meta | Cómo se cumple |
|------------------------|------|----------------|
| RNF-14: Disponibilidad | 98% | AWS EC2 SLA: 99.99% |
| RNF-01: Tiempo de respuesta | < 3 segundos | Nginx + FastAPI async + caché en memoria |
| RNF-02: Predicciones | < 8 segundos | Random Forest pre-entrenado, no reentrena en cada request |
| RNF-03: Usuarios concurrentes | 5 simultáneos | Uvicorn con workers múltiples |
| RNF-09: JWT en todos los endpoints | 100% | Middleware de autenticación en FastAPI |

---

## Estado actual y pasos para desplegar

| Paso | Tarea | Estado |
|------|-------|--------|
| 1 | Build del frontend React | `npm run build` → carpeta `dist/` |
| 2 | Crear instancia EC2 en AWS | Pendiente |
| 3 | Instalar Python 3.12, pip, venv en EC2 | Pendiente |
| 4 | Subir código al servidor (git clone o scp) | Pendiente |
| 5 | Configurar variables de entorno (.env) en EC2 | Pendiente |
| 6 | Instalar y configurar Nginx | Pendiente |
| 7 | Obtener certificado SSL con Certbot (Let's Encrypt) | Pendiente |
| 8 | Configurar PostgreSQL en Clever Cloud | Pendiente |
| 9 | Migrar datos CSV a PostgreSQL | Pendiente |
| 10 | Configurar Uvicorn como servicio systemd (arranque automático) | Pendiente |
| 11 | Pruebas finales en producción | Pendiente |

---

## Comando para el build del frontend (primer paso)

```bash
cd bucamlai/frontend
npm run build
# Genera la carpeta dist/ con los archivos estáticos de React listos para Nginx
```

## Comando para levantar el backend en producción

```bash
cd bucamlai/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

El flag `--workers 4` lanza 4 procesos de FastAPI en paralelo, lo que permite atender los 5 usuarios concurrentes requeridos (RNF-03) con margen.
