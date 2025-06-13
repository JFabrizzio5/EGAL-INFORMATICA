from fastapi import APIRouter
from .endpoints import puertas, door_web_access  # Importa el nuevo módulo

api_router = APIRouter()

# Agrega tus rutas existentes
# ...

# Agrega la nueva ruta para acceso web
api_router.include_router(door_web_access.router, prefix="/v1")