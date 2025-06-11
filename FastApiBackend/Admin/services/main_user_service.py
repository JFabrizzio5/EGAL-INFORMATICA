# Ruta: Admin/services/main_user_service.py

from Admin.repositories.main_users_repository import create_user
from Admin.models.user_models import UserCreateRequest

async def register_user(user_data: UserCreateRequest):
    user_id = await create_user(user_data)
    return user_id
