# Ruta: Admin/api/routes.py

from fastapi import APIRouter
from Admin.models.user_models import UserCreateRequest
from Admin.services.main_user_service import register_user
from Admin.validations import validate_user_data, validate_email_format

router = APIRouter()

@router.post("/create")
async def create_user_endpoint(user: UserCreateRequest):
    await validate_user_data(user)
    await validate_email_format(user)
    user_data = await register_user(user)
    return user_data    

@router.get("/hola")
async def hello_user():
    return {"message": "Hola, mundo!"}
