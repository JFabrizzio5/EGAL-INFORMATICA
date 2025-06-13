# Ruta: Puertas/services/main_user_service.py

from Puertas.repositories.main_users_repository import create_user
from Puertas.models.user_models import UserCreateRequest

async def register_user(user_data: UserCreateRequest):
    user_id = await create_user(user_data)
    return user_id
