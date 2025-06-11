# Ruta: Huesped/models/user_models.py

from pydantic import BaseModel

class UserCreateRequest(BaseModel):
    name: str
    email: str
    age: int

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    age: int
