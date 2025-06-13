from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    is_admin: bool
    puertas_acceso: List[str]

class UserInfo(BaseModel):
    id: str
    username: str
    email: str
    is_admin: bool
    puertas_acceso: List[str]