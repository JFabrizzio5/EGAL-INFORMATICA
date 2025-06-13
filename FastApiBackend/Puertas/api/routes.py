# Ruta: Puertas/api/routes.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Query, Header
import asyncio
from typing import Optional
from starlette.responses import HTMLResponse
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
        # Generar HTML para solicitar login
        return HTMLResponse(content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Autenticación Requerida</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    padding: 20px;
                    text-align: center;
                    background-color: #f0f4f8;
                }}
                .icon {{
                    width: 80px;
                    height: 80px;
                    background-color: #e53e3e;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                }}
                .icon svg {{
                    width: 40px;
                    height: 40px;
                    fill: white;
                }}
                h1 {{
                    color: #2d3748;
                    margin-bottom: 10px;
                }}
                p {{
                    color: #4a5568;
                    margin-bottom: 30px;
                }}
                .button {{
                    display: inline-block;
                    background-color: #4299e1;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-weight: bold;
                }}
                .open-app {{
                    margin-top: 15px;
                    color: #4a5568;
                    text-decoration: underline;
                }}
            </style>
        </head>
        <body>
            <div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
            </div>
            <h1>Autenticación Requerida</h1>
            <p>Debes iniciar sesión para abrir esta puerta</p>
            
            <a href="egaldemo://home" class="button">Abrir App EGAL</a>
            <a href="/" class="open-app">O inicia sesión en el navegador</a>
        </body>
        </html>
        """, status_code=401)
    
    # Validar el token JWT
    from Auth.services.auth_service import decode_token, get_user_by_id
    
    payload = decode_token(jwt_token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )
    
    user_id = payload.get("sub")
    user = await get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para esta puerta
    has_permission = await check_permission(user_id, puerta_id)
    
    if not has_permission:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para abrir esta puerta"
        )
    
    # Abrir la puerta
    result = await abrir_puerta(
        puerta_id=puerta_id,
        accion="abrir",
        client_id="nfc",
        user_id=user_id
    )
    
    # Responder con HTML de éxito para navegadores web
    html_response = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Puerta Abierta</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
                background-color: #f0f4f8;
            }}
            .success-icon {{
                width: 80px;
                height: 80px;
                background-color: #48bb78;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
            }}
            .success-icon svg {{
                width: 40px;
                height: 40px;
                fill: white;
            }}
            h1 {{
                color: #2d3748;
                margin-bottom: 10px;
            }}
            p {{
                color: #4a5568;
                margin-bottom: 30px;
            }}
            .info {{
                background-color: #e6f6ff;
                border-left: 4px solid #3182ce;
                padding: 10px 15px;
                margin-bottom: 20px;
                width: 80%;
                max-width: 500px;
                text-align: left;
            }}
            .button {{
                display: inline-block;
                background-color: #4299e1;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 5px;
                font-weight: bold;
                margin-top: 20px;
            }}
            .open-app {{
                margin-top: 15px;
                color: #4a5568;
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
        </div>
        <h1>Puerta abierta con éxito</h1>
        <p>La puerta {puerta_id} ha sido abierta correctamente.</p>
        
        <div class="info">
            <strong>Usuario:</strong> {user["username"]}<br>
            <strong>Fecha:</strong> {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}
        </div>
        
        <a href="egaldemo://home" class="open-app">Abrir la aplicación EGAL</a>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_response)


