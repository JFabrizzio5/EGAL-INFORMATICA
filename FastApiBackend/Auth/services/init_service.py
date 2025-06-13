import bcrypt
import asyncio
from datetime import datetime
from bson import ObjectId
from config import get_database, logger

async def init_users():
    """
    Inicializa los usuarios predeterminados si no existen
    """
    try:
        db = await get_database("egal")
        users_collection = db.usuarios
        
        # Verificar si ya existen usuarios
        users_count = await users_collection.count_documents({})
        
        if users_count > 0:
            logger.info(f"Ya existen {users_count} usuarios en la base de datos")
            return
        
        # Crear usuarios por defecto
        default_users = [
            {
                "_id": str(ObjectId()),
                "username": "user1",
                "email": "user1@egal.com",
                "password": bcrypt.hashpw("password1".encode(), bcrypt.gensalt()).decode(),
                "is_admin": False,
                "puertas_acceso": ["puerta1"],
                "created_at": datetime.now()
            },
            {
                "_id": str(ObjectId()),
                "username": "user2",
                "email": "user2@egal.com",
                "password": bcrypt.hashpw("password2".encode(), bcrypt.gensalt()).decode(),
                "is_admin": False,
                "puertas_acceso": ["puerta2"],
                "created_at": datetime.now()
            },
            {
                "_id": str(ObjectId()),
                "username": "admin",
                "email": "admin@egal.com",
                "password": bcrypt.hashpw("adminpass".encode(), bcrypt.gensalt()).decode(),
                "is_admin": True,
                "puertas_acceso": ["puerta1", "puerta2", "puerta3"],
                "created_at": datetime.now()
            }
        ]
        
        # Insertar usuarios
        result = await users_collection.insert_many(default_users)
        logger.info(f"Usuarios iniciales creados: {len(result.inserted_ids)}")
        
        # Crear índices
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("username", unique=True)
        
        return True
    except Exception as e:
        logger.error(f"Error inicializando usuarios: {e}")
        return False