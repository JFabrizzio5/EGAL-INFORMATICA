# main.py
from fastapi import FastAPI, APIRouter, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
from typing import Dict, Set
from config import get_redis, get_database, get_all_databases, logger
from contextlib import asynccontextmanager

# Almacén global para conexiones WebSocket
websocket_connections: Dict[str, WebSocket] = {}
mqtt_client = None

# Context manager para el ciclo de vida de la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global mqtt_client
    try:
        # Inicializar MQTT de forma no bloqueante
        mqtt_client = await initialize_mqtt_async()
        logger.info("MQTT client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MQTT: {e}")
    
    # Imprimir rutas registradas
    logger.info("Rutas registradas:")
    for route in app.routes:
        logger.info(f"  {route.path}")
    
    yield
    
    # Shutdown
    if mqtt_client:
        try:
            await mqtt_client.disconnect()
            logger.info("MQTT client disconnected")
        except Exception as e:
            logger.error(f"Error disconnecting MQTT: {e}")

app = FastAPI(lifespan=lifespan)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Función para inicializar MQTT de forma asíncrona
async def initialize_mqtt_async():
    from config import create_mqtt_client, MQTT_HOST, MQTT_PORT
    try:
        client = create_mqtt_client()
        # Usar asyncio.wait_for para evitar bloqueos infinitos
        await asyncio.wait_for(
            client.connect(MQTT_HOST, MQTT_PORT), 
            timeout=5.0
        )
        return client
    except asyncio.TimeoutError:
        logger.error("MQTT connection timeout")
        return None
    except Exception as e:
        logger.error(f"MQTT connection error: {e}")
        return None

@app.get("/")
async def test_logs():
    logger.info("Este es un mensaje informativo.")
    logger.debug("Este es un mensaje de depuración.")
    logger.warning("Este es un mensaje de advertencia.")
    return {"message": "Hola, mundo!", "status": "ok"}

@app.get("/mongotest")
async def mongo_test():
    try:
        # Usar timeout para evitar bloqueos
        db = await asyncio.wait_for(get_database("admin"), timeout=5.0)
        await asyncio.wait_for(db.command("ping"), timeout=3.0)
        
        databases = await asyncio.wait_for(get_all_databases(), timeout=5.0)
        logger.info(f"Base de datos MongoDB: {databases}")
        
        return {
            "message": "MongoDB está funcionando correctamente.",
            "databases": databases
        }
    except asyncio.TimeoutError:
        logger.error("MongoDB connection timeout")
        return {"error": "MongoDB timeout"}, 500
    except Exception as e:
        logger.error(f"MongoDB Error: {e}")
        return {"error": str(e)}, 500

@app.get("/healthcheck")
async def healthcheck():
    status = {
        "mongo": False,
        "redis": False,
        "mqtt": False,
    }
    
    # Ejecutar verificaciones en paralelo con timeouts
    async def check_mongo():
        try:
            db = await asyncio.wait_for(get_database("admin"), timeout=3.0)
            await asyncio.wait_for(db.command("ping"), timeout=2.0)
            return True
        except Exception as e:
            logger.error(f"MongoDB Error: {e}")
            return False
    
    async def check_redis():
        try:
            redis_client = await asyncio.wait_for(get_redis(), timeout=3.0)
            await asyncio.wait_for(redis_client.ping(), timeout=2.0)
            await redis_client.close()
            return True
        except Exception as e:
            logger.error(f"Redis Error: {e}")
            return False
    
    async def check_mqtt():
        global mqtt_client
        if mqtt_client:
            return True
        return False
    
    # Ejecutar todas las verificaciones en paralelo
    mongo_task = asyncio.create_task(check_mongo())
    redis_task = asyncio.create_task(check_redis())
    mqtt_task = asyncio.create_task(check_mqtt())
    
    # Esperar todas las tareas con timeout global
    try:
        results = await asyncio.wait_for(
            asyncio.gather(mongo_task, redis_task, mqtt_task, return_exceptions=True),
            timeout=10.0
        )
        
        status["mongo"] = results[0] if not isinstance(results[0], Exception) else False
        status["redis"] = results[1] if not isinstance(results[1], Exception) else False
        status["mqtt"] = results[2] if not isinstance(results[2], Exception) else False
        
    except asyncio.TimeoutError:
        logger.error("Healthcheck timeout")
    
    return {"status": status}

# WebSocket manager class para mejor organización
class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.connections[client_id] = websocket
        logger.info(f"Cliente {client_id} conectado")
    
    def disconnect(self, client_id: str):
        if client_id in self.connections:
            del self.connections[client_id]
            logger.info(f"Cliente {client_id} desconectado")
    
    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.connections:
            await self.connections[client_id].send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.connections.values():
            try:
                await connection.send_text(message)
            except:
                pass  # Conexión cerrada

manager = WebSocketManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Usar timeout para evitar bloqueos en receive
            data = await asyncio.wait_for(
                websocket.receive_text(), 
                timeout=30.0
            )
            
            logger.info(f"Mensaje de {client_id}: {data}")
            
            # Procesar mensaje de forma no bloqueante
            await process_websocket_message(client_id, data)
            
            # Enviar respuesta
            await manager.send_personal_message(
                f"Servidor recibió: {data}", 
                client_id
            )
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except asyncio.TimeoutError:
        logger.warning(f"WebSocket timeout para cliente {client_id}")
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"Error en WebSocket {client_id}: {e}")
        manager.disconnect(client_id)

async def process_websocket_message(client_id: str, message: str):
    """Procesa mensajes WebSocket de forma asíncrona"""
    try:
        # Ejemplo: publicar a MQTT si está disponible
        global mqtt_client
        if mqtt_client:
            topic = "egal/eventos"
            payload = json.dumps({
                "client_id": client_id,
                "message": message,
                "timestamp": asyncio.get_event_loop().time()
            })
            
            # Publicar de forma no bloqueante
            await asyncio.create_task(
                publish_to_mqtt(mqtt_client, topic, payload)
            )
            
    except Exception as e:
        logger.error(f"Error procesando mensaje: {e}")

async def publish_to_mqtt(client, topic: str, message: str):
    """Publica mensaje a MQTT de forma asíncrona"""
    try:
        await asyncio.wait_for(
            client.publish(topic, message, qos=1),
            timeout=2.0
        )
        logger.info(f"Publicado en {topic}: {message}")
    except Exception as e:
        logger.error(f"Error publicando MQTT: {e}")

# Endpoint para enviar eventos manualmente (útil para testing)
@app.post("/send-event")
async def send_event(background_tasks: BackgroundTasks, message: str):
    """Envía un evento a todos los clientes WebSocket conectados"""
    background_tasks.add_task(manager.broadcast, message)
    return {"message": "Evento enviado", "clients_count": len(manager.connections)}

# Incluir routers de microservicios
try:
    from Admin.api.routes import router as admin_router
    app.include_router(admin_router, prefix='/admin/v1', tags=['admin'])
except ImportError:
    logger.warning("Admin router no disponible")

try:
    from Huesped.api.routes import router as huesped_router
    app.include_router(huesped_router, prefix='/huesped/v1', tags=['huesped'])
except ImportError:
    logger.warning("Huesped router no disponible")

try:
    from Auth.api.routes import router as auth_router
    app.include_router(auth_router, prefix='/auth/v1', tags=['auth'])
except ImportError:
    logger.warning("Auth router no disponible")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )