# Ruta: Auth/validations/email_validation.py

from fastapi import HTTPException
from Auth.models.user_models import UserCreateRequest

async def validate_email_format(user: UserCreateRequest):
    if "@" not in user.email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    return user
