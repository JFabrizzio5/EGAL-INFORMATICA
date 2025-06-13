# Ruta: Auth/api/routes.py

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from Auth.models.auth_models import LoginRequest, TokenResponse, UserInfo
from Auth.models.user_models import UserCreateRequest
from Auth.services.auth_service import authenticate_user, create_access_token, get_user_by_id, decode_token
from Auth.services.main_user_service import register_user
from Auth.validations import validate_user_data, validate_email_format
from config import logger

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

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Endpoint para iniciar sesión y obtener un token JWT
    """
    user = await authenticate_user(request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Credenciales incorrectas"
        )
    
    # Crear token JWT
    token_data = {
        "sub": user["_id"],
        "username": user["username"],
        "is_admin": user.get("is_admin", False)
    }
    
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "user_id": user["_id"],
        "username": user["username"],
        "is_admin": user.get("is_admin", False),
        "puertas_acceso": user.get("puertas_acceso", [])
    }

@router.get("/me", response_model=UserInfo)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Obtiene información del usuario actual a partir del token
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Token no proporcionado o formato inválido"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Token malformado"
        )
    
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )
    
    return {
        "id": user["_id"],
        "username": user["username"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False),
        "puertas_acceso": user.get("puertas_acceso", [])
    }

@router.get("/validate-token")
async def validate_token(token: str):
    """
    Endpoint para validar un token (puede ser leído desde NFC, sticker o URL)
    """
    try:
        # Decodificar el token
        payload = decode_token(token)
        
        if not payload:
            return {
                "valid": False,
                "message": "Token inválido o expirado"
            }
        
        # Obtener información del usuario
        user_id = payload.get("sub")
        if not user_id:
            return {
                "valid": False,
                "message": "Token malformado"
            }
        
        user = await get_user_by_id(user_id)
        if not user:
            return {
                "valid": False,
                "message": "Usuario no encontrado"
            }
        
        # Devolver información del usuario y token válido
        return {
            "valid": True,
            "user_id": user["_id"],
            "username": user["username"],
            "is_admin": user.get("is_admin", False),
            "puertas_acceso": user.get("puertas_acceso", []),
            "expires_at": payload.get("exp")
        }
        
    except Exception as e:
        logger.error(f"Error validando token: {e}")
        return {
            "valid": False,
            "message": "Error al procesar el token"
        }

# Endpoint para generar un token NFC/URL
@router.get("/generate-access-token/{user_id}")
async def generate_access_token(user_id: str, authorization: Optional[str] = Header(None)):
    """
    Genera un token que puede ser usado en NFC o URL para acceso rápido
    Solo administradores pueden generar tokens para otros usuarios
    """
    # Verificar autenticación del solicitante
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Autenticación requerida"
        )
    
    # Decodificar token del solicitante
    requester_token = authorization.split(" ")[1]
    requester_payload = decode_token(requester_token)
    
    if not requester_payload:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )
    
    requester_id = requester_payload.get("sub")
    requester = await get_user_by_id(requester_id)
    
    # Solo admins pueden generar tokens para otros usuarios
    # Los usuarios normales solo pueden generar tokens para sí mismos
    if requester_id != user_id and not requester.get("is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para generar tokens para otros usuarios"
        )
    
    # Obtener información del usuario destino
    target_user = await get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )
    
    # Crear token con duración extendida (7 días)
    token_data = {
        "sub": target_user["_id"],
        "username": target_user["username"],
        "is_admin": target_user.get("is_admin", False),
        "type": "nfc_access"
    }
    
    from datetime import timedelta
    access_token = create_access_token(token_data, expires_delta=timedelta(days=7))
    
    # URL de validación
    validation_url = f"/auth/v1/validate-token?token={access_token}"
    
    return {
        "access_token": access_token,
        "user_id": target_user["_id"],
        "username": target_user["username"],
        "validation_url": validation_url,
        "expires_in_days": 7
    }
