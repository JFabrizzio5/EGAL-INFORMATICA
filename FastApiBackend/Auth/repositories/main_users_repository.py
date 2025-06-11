# Ruta: Auth/repositories/main_users_repository.py

from config import get_database, logger
from Auth.models.user_models import UserCreateRequest
from motor.motor_asyncio import AsyncIOMotorCollection

async def get_users_collection() -> AsyncIOMotorCollection:
    db = get_database("auth_db")
    collection = db.get_collection("auth_users")
    try:
        await collection.find_one()
    except CollectionInvalid:
        print("Colección 'auth_users' no existe, creando...")
        await db.create_collection("auth_users")
    return collection

async def create_user(user: UserCreateRequest):
    collection = await get_users_collection()
    logger.info("Se creó el usuario.")
    result = await collection.insert_one(user.dict())
    return str(result.inserted_id)
