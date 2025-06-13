# Ruta: Puertas/validations/user_validation.py

from fastapi import HTTPException
from Puertas.models.user_models import UserCreateRequest

async def validate_user_data(user: UserCreateRequest):
    if not user.name:
        raise HTTPException(status_code=400, detail="Name is required")
    if "juan" in user.name.lower():
        raise HTTPException(status_code=400, detail="Name cannot contain 'Juan'")
    return user
