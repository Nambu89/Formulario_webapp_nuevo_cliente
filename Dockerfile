# ─────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for the Customer Onboarding web app.
# Stage 1: build the React frontend.
# Stage 2: Python backend serving the built frontend as static files.
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Frontend build ──────────────────────────────────
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Copy package files first to leverage Docker layer caching
COPY Frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source and build
COPY Frontend/ .
RUN npm run build

# ── Stage 2: Backend + static frontend ───────────────────────
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies for building Python packages and ODBC
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3-dev \
        libpq-dev \
        gcc \
        curl \
        gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Microsoft ODBC Driver 18 for SQL Server (needed for Azure SQL)
# Skip this block if you use PostgreSQL — it adds ~150 MB to the image.
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/microsoft-prod.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 unixodbc-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory (app.py, database.py, models.py,
# schemas.py, auth/, services/, etc.)
COPY Backend/ ./Backend/

# Copy the compiled frontend into the static directory
RUN mkdir -p static
COPY --from=frontend-builder /frontend/build/ ./static/
RUN chmod -R 755 /app/static

# Create uploads directory (app.py also creates it at startup, but this
# ensures the volume mount point exists)
RUN mkdir -p Backend/uploads/documents

EXPOSE 8000

ENV HOST=0.0.0.0
ENV PORT=8000
ENV ENVIRONMENT=production

# Run from the Backend directory so that imports (database, models, auth, ...)
# resolve correctly
WORKDIR /app/Backend
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
