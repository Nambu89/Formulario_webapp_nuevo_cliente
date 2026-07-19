# Customer Onboarding & Request Approval System

A full-stack web application for managing new customer onboarding requests with a
multi-role approval workflow. Built with **FastAPI** (Python) + **React** (JavaScript)
and designed for deployment on **Microsoft Azure**.

## Azure MVP Architecture

![Azure MVP Architecture](docs/diagrams/azure-mvp-architecture.jpg)

---

## Sistema de Alta de Nuevos Clientes y Aprobación de Solicitudes

Aplicación web full-stack para gestionar altas de nuevos clientes con un flujo de
aprobación multi-rol. Construida con **FastAPI** (Python) + **React** (JavaScript)
y diseñada para desplegarse en **Microsoft Azure**.

---

## Table of Contents / Tabla de Contenidos

1. [Features / Características](#features--características)
2. [Architecture / Arquitectura](#architecture--arquitectura)
3. [Prerequisites / Requisitos previos](#prerequisites--requisitos-previos)
4. [Quick Start (Local) / Inicio rápido (Local)](#quick-start-local--inicio-rápido-local)
5. [Docker](#docker)
6. [Configuration / Configuración](#configuration--configuración)
7. [Deployment on Azure / Despliegue en Azure](#deployment-on-azure--despliegue-en-azure)
8. [Project Structure / Estructura del proyecto](#project-structure--estructura-del-proyecto)
9. [Security Notes / Notas de seguridad](#security-notes--notas-de-seguridad)
10. [Contributing / Contribuir](#contributing--contribuir)
11. [License / Licencia](#license--licencia)

---

## Features / Características

**English:**
- Multi-role approval workflow: `comercial` → `director` → `pedidos` → `admin`
- JWT-based authentication with temporary password support
- Customer onboarding form with document upload (SEPA mandates)
- Dashboard with request status summary
- User management (admin only)
- Real `/health` endpoint for Azure probes
- Configurable for Azure SQL, PostgreSQL, or SQL Server
- Docker-ready multi-stage build

**Español:**
- Flujo de aprobación multi-rol: `comercial` → `director` → `pedidos` → `admin`
- Autenticación JWT con soporte de contraseñas temporales
- Formulario de alta de cliente con subida de documentos (mandatos SEPA)
- Dashboard con resumen de estado de solicitudes
- Gestión de usuarios (solo admin)
- Endpoint real `/health` para sondas de Azure
- Configurable para Azure SQL, PostgreSQL o SQL Server
- Build multi-stage listo para Docker

---

## Architecture / Arquitectura

```
┌─────────────────┐     HTTP/JSON      ┌──────────────────────┐
│   React Frontend │ ◄────────────────► │   FastAPI Backend    │
│ (Vite + Tailwind)│                    │  (uvicorn ASGI)      │
│    Port 3000     │                    │  Port 8000           │
└─────────────────┘                    └──────────┬───────────┘
                                                  │
                                       ┌──────────▼───────────┐
                                       │   Database           │
                                       │ (Azure SQL / PG /    │
                                       │  SQL Server)         │
                                       └──────────────────────┘
```

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 8, Tailwind CSS, Radix UI, Axios |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, python-jose (JWT) |
| Database | Azure SQL Database (default), PostgreSQL, or SQL Server |
| Auth | JWT tokens (local), optional Microsoft Entra ID for DB auth |
| Container | Docker multi-stage (Node 18 → Python 3.12-slim) |

> **Diagram markers / Marcadores de diagramas:** use [`docs/diagrams/README.md`](docs/diagrams/README.md) as the canonical place to add the architecture, approval workflow, and deployment diagrams.

For an Azure MVP, the repository is intended to run behind HTTPS with restricted
CORS, health probes, and secrets injected via environment variables / Key Vault
rather than hardcoded in code or seed scripts.

Para un MVP en Azure, el repositorio está pensado para ejecutarse detrás de
HTTPS con CORS restringido, sondas de salud y secretos inyectados por variables
de entorno / Key Vault en lugar de hardcodeados en código o scripts de seed.

Azure architecture diagram for the repository:
- [docs/arquitectura_azure_mvp.md](docs/arquitectura_azure_mvp.md)

---

## Prerequisites / Requisitos previos

**English:**
- Python 3.12+
- Node.js 20.19+ or 22.12+
- A database (Azure SQL, PostgreSQL, or local SQL Server)
- ODBC Driver 18 for SQL Server (if using Azure SQL / SQL Server)

**Español:**
- Python 3.12+
- Node.js 20.19+ or 22.12+
- Una base de datos (Azure SQL, PostgreSQL o SQL Server local)
- ODBC Driver 18 for SQL Server (si usas Azure SQL / SQL Server)

---

## Quick Start (Local) / Inicio rápido (Local)

### 1. Clone the repository

```bash
git clone https://github.com/Nambu89/Formulario_webapp_nuevo_cliente.git
cd Formulario_webapp_nuevo_cliente
```

### 2. Configure environment variables

**Backend:**
```bash
cd Backend
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET_KEY, etc.
```

Generate a strong JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

**Frontend:**
```bash
cd ../Frontend
cp .env.example .env
# Edit .env — set VITE_API_URL to your backend URL (default: http://localhost:8000)
```

### 3. Start the backend

```bash
cd ../Backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r ../requirements.txt
python app.py
```

The API will be available at `http://127.0.0.1:8000`.
Interactive docs (Swagger UI) at `http://127.0.0.1:8000/docs`.

### 4. Start the frontend

```bash
cd ../Frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

The frontend now uses `Vite`, but `npm start` is preserved as an alias for
`npm run dev` to avoid changing the local workflow.

### 5. Seed demo data (optional)

```bash
cd Backend
set DEMO_USER_PASSWORD=replace-with-a-strong-demo-password
python seed_demo_data.py
```

This is for local demo environments only. The automatic admin bootstrap in
`init_db()` is disabled by default and only runs if you explicitly set both
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

Esto es solo para entornos locales de demostración. El bootstrap automático de
admin en `init_db()` está desactivado por defecto y solo se ejecuta si defines
explícitamente `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`.

The demo scripts also require `DEMO_USER_PASSWORD`; no weak demo password is
embedded in the repository.

Los scripts de demo también requieren `DEMO_USER_PASSWORD`; el repositorio ya
no incluye ninguna contraseña débil embebida.

Health check for local/Azure probes:

```bash
curl http://127.0.0.1:8000/health
```

---

## Docker

Build and run the entire application in a single container:

```bash
# Build
docker build -t customer-onboarding .

# Run (make sure to pass your .env variables)
docker run -p 8000:8000 \
  --env-file Backend/.env \
  -v $(pwd)/uploads:/app/Backend/uploads \
  customer-onboarding
```

The app will be available at `http://localhost:8000`.

> **Note:** The Docker image includes the ODBC Driver 18 for SQL Server.
> If you use PostgreSQL, you can remove that block from the Dockerfile to
> reduce image size.

---

## Configuration / Configuración

All configuration is via environment variables. See `Backend/.env.example` and
`Frontend/.env.example` for the full list.

### Key variables / Variables clave

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy connection URL | *(required)* |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens | *(required)* |
| `AZURE_CLIENT_ID` | Entra ID client ID (optional, for SP auth) | *(empty)* |
| `AZURE_TENANT_ID` | Entra ID tenant ID (optional) | *(empty)* |
| `AZURE_CLIENT_SECRET` | Entra ID client secret (optional) | *(empty)* |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,...` |
| `HOST` | Bind address (use `127.0.0.1` locally) | `127.0.0.1` |
| `PORT` | Backend port | `8000` |
| `UVICORN_LOG_LEVEL` | Backend log level | `info` |
| `SEED_ADMIN_EMAIL` | Optional admin bootstrap email (leave empty to disable) | *(empty)* |
| `SEED_ADMIN_PASSWORD` | Password for the optional admin bootstrap | *(empty)* |
| `VITE_API_URL` | Backend URL for the frontend | `http://localhost:8000` |

> **Logo:** Place your organization's logo as `Frontend/public/logo.png`.
> The app references `/logo.png` in the navigation bar and login page.

### Database URL examples / Ejemplos de URL de base de datos

```
# Azure SQL with embedded credentials
DATABASE_URL=mssql+aioodbc://user:password@your-server.database.windows.net/your-db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes

# Azure SQL with Entra ID service principal
# (set AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
DATABASE_URL=mssql+aioodbc://your-server.database.windows.net/your-db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes

# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/your-db

# Local SQL Server
DATABASE_URL=mssql+pyodbc://localhost/your-db?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no
```

---

## Deployment on Azure / Despliegue en Azure

### Option A: Azure Container Apps (recommended)

**English:** Container Apps provides a serverless container hosting experience
with built-in load balancing and autoscaling.

**Español:** Container Apps ofrece una experiencia de hosting de contenedores
serverless con balanceo de carga y autoescalado integrados.

```bash
# Create resource group
az group create --name rg-onboarding --location westeurope

# Create Container Apps environment
az containerapp env create \
  --name onboarding-env \
  --resource-group rg-onboarding \
  --location westeurope

# Deploy the container
az containerapp create \
  --name customer-onboarding \
  --resource-group rg-onboarding \
  --environment onboarding-env \
  --image <your-registry>.azurecr.io/customer-onboarding:latest \
  --target-port 8000 \
  --ingress external \
  --env-vars DATABASE_URL=<your-db-url> JWT_SECRET_KEY=<your-secret> \
  --registry-server <your-registry>.azurecr.io
```

### Option B: Azure App Service (Linux)

```bash
az appservice plan create \
  --name onboarding-plan \
  --resource-group rg-onboarding \
  --sku B2 --is-linux

az webapp create \
  --name customer-onboarding \
  --resource-group rg-onboarding \
  --plan onboarding-plan \
  --deployment-container-image-name <your-registry>.azurecr.io/customer-onboarding:latest

# Configure environment variables
az webapp config appsettings set \
  --name customer-onboarding \
  --resource-group rg-onboarding \
  --settings DATABASE_URL=<your-db-url> JWT_SECRET_KEY=<your-secret> CORS_ORIGINS=https://customer-onboarding.azurewebsites.net
```

### Database: Azure SQL Database

```bash
az sql server create \
  --name onboarding-sql \
  --resource-group rg-onboarding \
  --location westeurope \
  --admin-user sqladmin \
  --admin-password <strong-password>

az sql db create \
  --name onboarding \
  --server onboarding-sql \
  --resource-group rg-onboarding \
  --service-objective S0
```

### Secrets: Azure Key Vault

**English:** Store sensitive values (DATABASE_URL, JWT_SECRET_KEY,
AZURE_CLIENT_SECRET) in Key Vault and reference them from App Service /
Container Apps via Key Vault references.

**Español:** Guarda los valores sensibles (DATABASE_URL, JWT_SECRET_KEY,
AZURE_CLIENT_SECRET) en Key Vault y referéncialos desde App Service /
Container Apps mediante referencias a Key Vault.

```bash
az keyvault create \
  --name onboarding-kv \
  --resource-group rg-onboarding \
  --location westeurope

az keyvault secret set \
  --vault-name onboarding-kv \
  --name DatabaseUrl \
  --value "<your-connection-string>"
```

### Monitoring: Application Insights

**English:** Enable Application Insights for automatic request tracking,
dependency monitoring, and log analytics.

**Español:** Habilita Application Insights para seguimiento automático de
peticiones, monitorización de dependencias y análisis de logs.

```bash
az monitor app-insights component create \
  --app onboarding-ai \
  --location westeurope \
  --resource-group rg-onboarding
```

Set `APPLICATIONINSIGHTS_CONNECTION_STRING` as an app setting.

### Health probes

Configure the platform health probe against `GET /health`. The endpoint checks
process readiness and database connectivity, and returns `503` if the database
is unreachable.

Configura la sonda de salud de la plataforma contra `GET /health`. El endpoint
comprueba la disponibilidad del proceso y la conectividad con base de datos, y
devuelve `503` si la base de datos no está accesible.

### Authentication: Microsoft Entra ID (optional)

**English:** The application uses local JWT authentication by default. To
integrate with Microsoft Entra ID for user authentication, you would replace
the `auth_service.py` login flow with MSAL-based token validation. The
database layer already supports Entra ID service-principal authentication
for connecting to Azure SQL.

**Español:** La aplicación usa autenticación JWT local por defecto. Para
integrar con Microsoft Entra ID para la autenticación de usuarios, reemplaza
el flujo de login en `auth_service.py` con validación de tokens MSAL. La
capa de base de datos ya soporta autenticación de service principal de
Entra ID para conectar a Azure SQL.

---

## Project Structure / Estructura del proyecto

```
.
├── Backend/
│   ├── app.py                 # FastAPI app, all endpoints
│   ├── database.py            # SQLAlchemy engine, sessions, init_db
│   ├── models.py              # ORM models (User, Solicitud)
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── auth/
│   │   ├── auth_handler.py    # JWT creation/verification, password hashing
│   │   ├── auth_service.py    # User CRUD, authentication logic
│   │   ├── auth_router.py     # /token login endpoint
│   │   └── auth_dependencies.py # get_current_user dependency
│   ├── services/
│   │   └── solicitud_service.py
│   ├── seed_demo_data.py      # Demo data seeder
│   ├── crear_usuarios.py      # User creation script
│   ├── .env.example           # Environment template
│   └── .env                   # Your local config (gitignored)
├── Frontend/
│   ├── src/
│   │   ├── App.jsx            # Router + navigation
│   │   ├── config.js          # API_BASE_URL from env
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js    # Axios API client
│   │   ├── utils/axiosConfig.js
│   │   ├── pages/             # Dashboard, Login, MisSolicitudes, ...
│   │   └── components/        # Forms, tables, UI primitives
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── .env.example
│   └── package.json
├── Dockerfile                 # Multi-stage build
├── requirements.txt           # Python dependencies
├── .gitignore
└── README.md
```

---

## Security Notes / Notas de seguridad

**English:**
- **Never commit `.env` files.** They are gitignored. If you accidentally
  committed secrets in the past, rotate them immediately.
- The JWT secret must be a strong random string. The app will refuse to
  start without `JWT_SECRET_KEY` set.
- Default admin seeding is disabled. If you enable bootstrap users, provide the
  credentials through environment variables and rotate them after first use.
- CORS origins should be restricted to your frontend URL(s) in production.
- Use HTTPS in production (Azure App Service / Container Apps provide this
  automatically).
- Frontend and backend debug logging was reduced to avoid leaking tokens,
  password hashes, temporary passwords, or full request payloads.
- Temporary passwords should be delivered through an out-of-band admin process
  and changed on first login.
- Consider replacing local JWT auth with Microsoft Entra ID for enterprise
  deployments.

**Español:**
- **Nunca subas los archivos `.env` a git.** Están en `.gitignore`. Si
  accidentalmente subiste secretos en el pasado, rótalos inmediatamente.
- El secreto JWT debe ser una cadena aleatoria fuerte. La aplicación no
  arrancará sin `JWT_SECRET_KEY` configurado.
- El seed de administrador por defecto está desactivado. Si habilitas usuarios
  bootstrap, pasa las credenciales por variables de entorno y rótalas tras el
  primer uso.
- Los orígenes CORS deben restringirse a la(s) URL(s) de tu frontend en
  producción.
- Usa HTTPS en producción (Azure App Service / Container Apps lo proporcionan
  automáticamente).
- El logging de frontend y backend se ha reducido para evitar fugas de tokens,
  hashes de contraseña, contraseñas temporales o payloads completos.
- Las contraseñas temporales deben entregarse por un canal administrativo
  separado y cambiarse en el primer acceso.
- Considera reemplazar la autenticación JWT local con Microsoft Entra ID
  para despliegues empresariales.

---

## Contributing / Contribuir

Contributions are welcome! Please open an issue first to discuss what you
would like to change.

Las contribuciones son bienvenidas. Por favor, abre un issue primero para
discutir los cambios que te gustaría hacer.

---

## License / Licencia

[MIT](LICENSE)
