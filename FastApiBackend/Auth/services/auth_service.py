import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from config import get_database, logger

# Configuración JWT
SECRET_KEY = "egal_super_secreto_2025"  # En producción, usar variable de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

async def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Autentica a un usuario por username y password
    """
    try:
        db = await get_database("egal")
        user = await db.usuarios.find_one({"username": username})
        
        if not user:
            return None
            
        # Verificar contraseña
        if not bcrypt.checkpw(password.encode(), user["password"].encode()):
            return None
            
        # No devolver la contraseña en la respuesta
        user.pop("password", None)
        return user
        
    except Exception as e:
        logger.error(f"Error en autenticación: {e}")
        return None

def create_access_token(data: dict):
    """
    Crear token JWT
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene un usuario por su ID
    """
    try:
        db = await get_database("egal")
        user = await db.usuarios.find_one({"_id": user_id})
        
        if user:
            user.pop("password", None)
            
        return user
    except Exception as e:
        logger.error(f"Error obteniendo usuario por ID: {e}")
        return None

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica un token JWT
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        logger.error(f"Error decodificando token: {e}")
        return None