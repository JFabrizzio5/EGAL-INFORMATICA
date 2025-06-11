# Ruta: Admin/validations/email_validation.py

from fastapi import HTTPException
from Admin.models.user_models import UserCreateRequest

async def validate_email_format(user: UserCreateRequest):
    if "@" not in user.email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    return user
