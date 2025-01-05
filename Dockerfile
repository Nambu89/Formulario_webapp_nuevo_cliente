# Primera etapa: Construir el frontend
FROM node:18-alpine as frontend-builder

# Establecemos el directorio de trabajo para el frontend
WORKDIR /frontend

# Copiamos los archivos de configuración del frontend
# Primero solo package.json y package-lock.json para aprovechar la caché de Docker
COPY Frontend/package*.json ./

# Instalamos las dependencias del frontend
RUN npm install

# Copiamos todo el código fuente del frontend
# Esto incluye src/, public/ y otros archivos de configuración
COPY Frontend/ .

# Construimos la aplicación React
# Esto generará la carpeta build/ con los archivos estáticos optimizados
RUN npm run build

# Segunda etapa: Configurar el backend y combinar con el frontend
FROM python:3.12-slim

# Configuración de Python para optimizar su uso en Docker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Establecemos el directorio de trabajo para la aplicación
WORKDIR /app

# Instalamos las dependencias del sistema necesarias
# Incluimos todas las herramientas necesarias para compilar las dependencias de Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3-dev \
        libpq-dev \
        gcc \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Actualizamos pip e instalamos wheel
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel

# Copiamos e instalamos los requisitos de Python
COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código del backend
COPY Backend/app.py .

# Creamos el directorio static y copiamos los archivos compilados del frontend
# Este paso es crucial para servir los archivos estáticos desde FastAPI
RUN mkdir -p static
COPY --from=frontend-builder /frontend/build/ ./static/

# Aseguramos que los permisos sean correctos
RUN chmod -R 755 /app/static

# Exponemos el puerto que usará FastAPI
# Este es el puerto que deberá mapearse al ejecutar el contenedor
EXPOSE 8000

# Variables de entorno adicionales para producción
ENV PORT=8000
ENV HOST=0.0.0.0
ENV ENVIRONMENT=production

# Comando para iniciar la aplicación
# Usamos uvicorn con configuraciones optimizadas para producción
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]