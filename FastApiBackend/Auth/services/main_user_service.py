# Ruta: Auth/services/main_user_service.py

from Auth.repositories.main_users_repository import create_user
from Auth.models.user_models import UserCreateRequest

async def register_user(user_data: UserCreateRequest):
    user_id = await create_user(user_data)
    return user_id
