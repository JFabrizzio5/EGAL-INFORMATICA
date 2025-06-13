from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

router = APIRouter(tags=["Acceso Web a Puertas"])

# Ruta a los archivos estáticos
static_path = Path("static")

@router.get("/abrir/{puerta_id}", response_class=HTMLResponse)
async def open_door_web(puerta_id: str):
    """
    Endpoint que muestra una interfaz web para abrir puertas.
    Si el usuario no está autenticado, muestra formulario de login.
    Si está autenticado, muestra botón para abrir la puerta si tiene permisos.
    """
    # Simplemente devuelve el archivo HTML que maneja toda la lógica en el cliente
    return FileResponse(static_path / "nfc-auth.html")