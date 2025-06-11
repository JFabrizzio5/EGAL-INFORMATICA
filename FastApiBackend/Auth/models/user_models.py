# Ruta: Auth/models/user_models.py

from pydantic import BaseModel

class UserCreateRequest(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str


