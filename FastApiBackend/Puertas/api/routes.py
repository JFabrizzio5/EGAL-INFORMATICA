# Ruta: Puertas/api/routes.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query, Header
import asyncio
from typing import Optional
from starlette.responses import HTMLResponse, RedirectResponse
from Puertas.models.user_models import UserCreateRequest, PuertaAccionRequest
from Puertas.services.main_user_service import register_user
from Puertas.validations import validate_user_data, validate_email_format
from Puertas.services.puertaservice import (
    add_websocket_connection, 
    remove_websocket_connection, 
    process_puerta_message, 
    abrir_puerta,
    check_permission
)
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

@router.websocket("/ws/{client_id}")
async def puertas_websocket(websocket: WebSocket, client_id: str):
    await websocket.accept()
    await add_websocket_connection(client_id, websocket)
    
    try:
        while True:
            # Recibir datos con timeout para evitar bloqueos
            data = await asyncio.wait_for(
                websocket.receive_text(),
                timeout=30.0
            )
            
            # Procesar el mensaje en el servicio
            result = await process_puerta_message(client_id, data)
            
            # Enviar confirmación solo si no se envió una respuesta específica
            if result:
                await websocket.send_text(f"Acción recibida: {data}")
            
    except WebSocketDisconnect:
        await remove_websocket_connection(client_id)
    except asyncio.TimeoutError:
        logger.warning(f"Timeout en conexión WebSocket de puertas para cliente {client_id}")
        await remove_websocket_connection(client_id)
    except Exception as e:
        logger.error(f"Error en WebSocket de puertas para cliente {client_id}: {e}")
        await remove_websocket_connection(client_id)

# Endpoint REST para abrir puertas (alternativa al WebSocket)
@router.post("/abrir")
async def abrir_puerta_endpoint(request: PuertaAccionRequest):
    """Endpoint REST para abrir una puerta específica"""
    if not request.user_id:
        raise HTTPException(status_code=401, detail="Se requiere ID de usuario para esta acción")
        
    return await abrir_puerta(
        puerta_id=request.puerta_id,
        accion=request.accion,
        client_id="rest_api",
        user_id=request.user_id
    )

# Endpoint para verificar permisos de puerta
@router.get("/permisos/{user_id}/{puerta_id}")
async def verificar_permiso(user_id: str, puerta_id: str):
    """Verifica si un usuario tiene permiso para una puerta específica"""
    
    has_permission = await check_permission(user_id, puerta_id)
    
    return {
        "user_id": user_id,
        "puerta_id": puerta_id,
        "has_permission": has_permission
    }

# Modificar el endpoint de abrir puerta con NFC

@router.get("/abrir/{puerta_id}")
async def abrir_puerta_nfc(
    puerta_id: str, 
    token: Optional[str] = Query(None),
    validate: bool = Query(False),
    authorization: Optional[str] = Header(None)
):
    """
    Endpoint para abrir puerta directamente desde NFC o deeplink
    Acepta token JWT como query param o header de Authorization
    """
    # Obtener token de authorization header o query param
    jwt_token = None
    if authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ")[1]
    elif token:
        jwt_token = token
    
    if not jwt_token:
        # Redireccionar al frontend para autenticación
        return RedirectResponse(url=f"/static/nfc-auth.html?puerta_id={puerta_id}")
    
    # Validar el token JWT
    from Auth.services.auth_service import decode_token, get_user_by_id
    
    payload = decode_token(jwt_token)
    if not payload:
        if validate:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token inválido o expirado"}
            )
        # Redireccionar al frontend para autenticación
        return RedirectResponse(url=f"/static/nfc-auth.html?puerta_id={puerta_id}")
    
    user_id = payload.get("sub")
    user = await get_user_by_id(user_id)
    
    if not user:
        if validate:
            return JSONResponse(
                status_code=404,
                content={"detail": "Usuario no encontrado"}
            )
        # Redireccionar al frontend
        return RedirectResponse(url=f"/static/nfc-auth.html?puerta_id={puerta_id}")
    
    # Verificar si el usuario tiene permiso para esta puerta
    has_permission = await check_permission(user_id, puerta_id)
    
    if not has_permission:
        if validate:
            return JSONResponse(
                status_code=403,
                content={"detail": "No tienes permiso para esta puerta"}
            )
        # Redireccionar al frontend
        return RedirectResponse(url=f"/static/nfc-auth.html?puerta_id={puerta_id}")
    
    # Si es solo validación, responder con éxito
    if validate:
        return {
            "valid": True,
            "user": {
                "id": user_id,
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "is_admin": user.get("is_admin", False)
            }
        }
    
    # Abrir la puerta
    result = await abrir_puerta(
        puerta_id=puerta_id,
        accion="abrir",
        client_id="nfc",
        user_id=user_id
    )
    
    # Redireccionar a la página de éxito con el token
    return RedirectResponse(url=f"/static/nfc-auth.html?puerta_id={puerta_id}&token={jwt_token}")


