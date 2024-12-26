# Etapa de construcción del frontend
FROM node:18-alpine as frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Etapa final con Python
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalamos dependencias necesarias
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiamos y instalamos requisitos de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código backend
COPY app.py .

# Copiamos los archivos construidos del frontend
COPY --from=frontend-builder /frontend/build /app/static

# Exponemos el puerto
EXPOSE 8000

# Iniciamos la aplicación
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]