# Ruta: Puertas/models/user_models.py

from pydantic import BaseModel, Field
from typing import Optional, List

class UserCreateRequest(BaseModel):
    name: str
    email: str
    age: int

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    age: int

class PuertaAccionRequest(BaseModel):
    puerta_id: str = Field(..., description="ID de la puerta a controlar")
    accion: str = Field(default="abrir", description="Acción a realizar (abrir, cerrar)")
    user_id: Optional[str] = Field(None, description="ID del usuario que solicita la acción")

class PuertaWebsocketMessage(BaseModel):
    puerta_id: str
    accion: str = "abrir"
    user_id: str
    timestamp: Optional[str] = None
