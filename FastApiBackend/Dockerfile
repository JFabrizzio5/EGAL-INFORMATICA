# Usar una imagen base de Python
FROM python:3.11-slim

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app
# Actualizar pip dentro del entorno virtual
RUN pip install --upgrade pip
# Instalar virtualenv si no está instalado
RUN pip install --no-cache-dir virtualenv

# Crear un entorno virtual fuera de /app
RUN python -m venv /venv

# Verificar que el entorno virtual se haya creado
RUN ls /venv

# Actualizar pip dentro del entorno virtual
RUN /venv/bin/pip install --upgrade pip

# Copiar el archivo de requerimientos al contenedor
COPY requirements.txt /app/requirements.txt

# Instalar las dependencias dentro del entorno virtual
RUN /venv/bin/pip install --no-cache-dir -r /app/requirements.txt

# Copiar el código de la aplicación
COPY . /app

# Exponer el puerto 8000
EXPOSE 8000

# Usar el entorno virtual para ejecutar el comando uvicorn
CMD ["/venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "660", "--reload", "--reload-dir", "/app"]