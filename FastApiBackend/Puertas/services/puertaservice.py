import json
import asyncio
from datetime import datetime
from typing import Dict, Optional, Any
from fastapi import WebSocket, HTTPException
from config import get_database, publish_message, logger
from Puertas.repositories.puertapermisos import PuertaPermisosRepository
from Puertas.repositories.puertacache import PuertaCacheRepository

# Conexiones WebSocket activas
puertas_connections: Dict[str, WebSocket] = {}

async def add_websocket_connection(client_id: str, websocket: WebSocket):
    """Agrega una conexión WebSocket al registro"""
    puertas_connections[client_id] = websocket
    logger.info(f"Cliente de puertas {client_id} conectado")

async def remove_websocket_connection(client_id: str):
    """Elimina una conexión WebSocket del registro"""
    if client_id in puertas_connections:
        del puertas_connections[client_id]
        logger.info(f"Cliente de puertas {client_id} desconectado")

async def broadcast_to_all_clients(message: dict):
    """Envía un mensaje a todos los clientes WebSocket conectados"""
    for client_id, websocket in list(puertas_connections.items()):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error enviando a cliente WebSocket {client_id}: {e}")
            await remove_websocket_connection(client_id)

async def check_permission(user_id: str, puerta_id: str) -> bool:
    """
    Verifica si un usuario tiene permiso para abrir una puerta
    Utiliza caché para mejorar rendimiento
    """
    # Primero verificar en caché
    cached_permission = await PuertaCacheRepository.get_cached_permission(user_id, puerta_id)
    
    if cached_permission is not None:
        logger.info(f"Permiso encontrado en caché para usuario {user_id} y puerta {puerta_id}: {cached_permission}")
        return cached_permission
    
    # Si no está en caché, verificar en la base de datos
    has_permission = await PuertaPermisosRepository.check_user_permission(user_id, puerta_id)
    
    # Guardar resultado en caché
    await PuertaCacheRepository.set_permission_cache(user_id, puerta_id, has_permission)
    
    return has_permission

async def process_puerta_message(client_id: str, message: str):
    """Procesa mensajes relacionados con puertas y registra en MongoDB"""
    try:
        # Intentar parsear el mensaje como JSON
        try:
            data = json.loads(message)
            puerta_id = data.get("puerta_id")
            accion = data.get("accion", "abrir")
            user_id = data.get("user_id")
        except json.JSONDecodeError:
            # Si no es JSON, intentar extraer datos del formato "Usuario:1|Puerta:puerta1"
            if "|" in message:
                parts = message.split("|")
                user_part = next((p for p in parts if p.startswith("Usuario:")), None)
                puerta_part = next((p for p in parts if p.startswith("Puerta:")), None)
                
                user_id = user_part.split(":")[1] if user_part else None
                puerta_id = puerta_part.split(":")[1] if puerta_part else None
                accion = "abrir"
            else:
                # Si no tiene formato esperado, rechazar
                logger.warning(f"Formato de mensaje inválido: {message}")
                return False
        
        # Validaciones básicas
        if not puerta_id:
            logger.warning(f"Mensaje de puertas sin ID de puerta: {message}")
            return False
            
        if not user_id:
            logger.warning(f"Mensaje de puertas sin ID de usuario: {message}")
            return False
        
        # Verificar permisos
        has_permission = await check_permission(user_id, puerta_id)
        
        if not has_permission:
            logger.warning(f"Acceso denegado: Usuario {user_id} no tiene permiso para puerta {puerta_id}")
            
            # Notificar al cliente sobre la denegación
            if client_id in puertas_connections:
                await puertas_connections[client_id].send_text(json.dumps({
                    "event": "access_denied",
                    "puerta_id": puerta_id,
                    "user_id": user_id,
                    "message": "No tienes permiso para esta puerta"
                }))
                
            # Registrar intento fallido
            await PuertaCacheRepository.log_puerta_access(user_id, puerta_id, accion, "denied")
            await log_puerta_action(client_id, puerta_id, accion, user_id, "denied")
            return False
        
        # Si tiene permiso, proceder con la acción
        await log_puerta_action(client_id, puerta_id, accion, user_id, "success")
        
        # Publicar evento a MQTT si se requiere (corregido)
        try:
            # Importamos desde main en lugar de config
            from main import mqtt_client
            if mqtt_client:
                mqtt_message = json.dumps({
                    "puerta_id": puerta_id,
                    "accion": accion,
                    "timestamp": datetime.now().isoformat(),
                    "client_id": client_id,
                    "user_id": user_id
                })
                await publish_message(mqtt_client, "egal/puertas", mqtt_message)
        except ImportError:
            logger.warning("No se pudo importar mqtt_client, mensaje no publicado")
        
        # Notificar a todos los clientes conectados
        await broadcast_to_all_clients({
            "event": "puerta_update",
            "puerta_id": puerta_id,
            "accion": accion,
            "client_id": client_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Registrar acceso en Redis para análisis en tiempo real
        await PuertaCacheRepository.log_puerta_access(user_id, puerta_id, accion, "success")
        
        logger.info(f"Acción {accion} en puerta {puerta_id} procesada para usuario {user_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error procesando mensaje de puertas: {e}")
        return False

async def log_puerta_action(client_id: str, puerta_id: str, accion: str, user_id: str, status: str = "success"):
    """Registra una acción de puerta en MongoDB"""
    try:
        # Obtener conexión a la base de datos
        db = await get_database("egal")
        
        # Crear documento de log
        log_doc = {
            "puerta_id": puerta_id,
            "accion": accion,
            "client_id": client_id,
            "user_id": user_id,
            "timestamp": datetime.now(),
            "status": status
        }
        
        # Insertar en la colección de logs
        await db.logs_puertas.insert_one(log_doc)
        logger.info(f"Log de puerta {puerta_id} guardado en MongoDB")
        
        return True
    except Exception as e:
        logger.error(f"Error guardando log de puerta en MongoDB: {e}")
        return False

async def abrir_puerta(puerta_id: str, accion: str = "abrir", client_id: str = "rest_api", user_id: Optional[str] = None):
    """Inicia el proceso de abrir una puerta específica"""
    try:
        if not user_id:
            raise HTTPException(status_code=401, detail="Se requiere ID de usuario para esta acción")
        
        # Verificar permisos
        has_permission = await check_permission(user_id, puerta_id)
        
        if not has_permission:
            logger.warning(f"API: Acceso denegado para usuario {user_id} a puerta {puerta_id}")
            # Registrar intento fallido
            await log_puerta_action(client_id, puerta_id, accion, user_id, "denied")
            raise HTTPException(status_code=403, detail="No tienes permiso para abrir esta puerta")
        
        # Registrar la acción
        await log_puerta_action(client_id, puerta_id, accion, user_id)
        
        # Publicar en MQTT para hardware (corregido)
        try:
            from main import mqtt_client
            if mqtt_client:
                mqtt_message = json.dumps({
                    "puerta_id": puerta_id,
                    "accion": accion,
                    "timestamp": datetime.now().isoformat(),
                    "client_id": client_id,
                    "user_id": user_id
                })
                await publish_message(mqtt_client, "egal/puertas", mqtt_message)
        except ImportError:
            logger.warning("No se pudo importar mqtt_client, mensaje no publicado")
        
        # Notificar a todos los clientes WebSocket
        await broadcast_to_all_clients({
            "event": "puerta_update",
            "puerta_id": puerta_id,
            "accion": accion,
            "client_id": client_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Registrar en Redis para análisis en tiempo real
        await PuertaCacheRepository.log_puerta_access(user_id, puerta_id, accion, "success")
        
        logger.info(f"Comando de puerta enviado: {puerta_id}, acción: {accion}, usuario: {user_id}")
        return {
            "status": "success", 
            "message": f"Acción {accion} enviada a puerta {puerta_id}",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
    
    except HTTPException as he:
        # Reenviar excepciones HTTP
        raise he
    except Exception as e:
        logger.error(f"Error procesando comando de puerta: {e}")
        return {"status": "error", "message": str(e)}