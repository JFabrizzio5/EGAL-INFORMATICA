# config.py

import logging
import asyncio
from dotenv import load_dotenv
import os
from typing import Optional, List
import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient
from motor.core import Database

dotenv_path = "../.env"
load_dotenv(dotenv_path=dotenv_path)

####################### CONFIGURACIÓN DE MQTT ####################
from gmqtt import Client as MQTTClient

MQTT_HOST = os.getenv("MQTT_HOST", "172.22.82.26")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "mi_cliente_mqtt")

# Configurar el logger primero
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("fastapi")

def on_message(client, topic, payload, qos, properties):
    """Callback para mensajes MQTT recibidos"""
    try:
        logger.info(f"Mensaje MQTT recibido en {topic}: {payload.decode()}")
    except Exception as e:
        logger.error(f"Error procesando mensaje MQTT: {e}")

def on_connect(client, flags, rc, properties):
    """Callback para conexión MQTT"""
    if rc == 0:
        logger.info(f"MQTT conectado exitosamente")
    else:
        logger.error(f"MQTT conexión falló con código: {rc}")

def on_disconnect(client, packet, exc=None):
    """Callback para desconexión MQTT"""
    logger.info("MQTT desconectado")

def create_mqtt_client() -> MQTTClient:
    """Crea un cliente MQTT con callbacks configurados"""
    client = MQTTClient(MQTT_CLIENT_ID)
    client.on_message = on_message
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    return client

async def connect_mqtt(topics: Optional[List[str]] = None) -> Optional[MQTTClient]:
    """
    Conecta al broker MQTT de forma asíncrona con timeout
    """
    client = None
    try:
        client = create_mqtt_client()
        
        # Conectar con timeout
        await asyncio.wait_for(
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60),
            timeout=10.0
        )
        
        logger.info(f"MQTT conectado a {MQTT_HOST}:{MQTT_PORT}")

        # Suscribirse a los topics si están definidos
        if topics:
            for topic in topics:
                client.subscribe(topic, qos=1)
                logger.info(f"Suscrito a {topic}")

        return client
        
    except asyncio.TimeoutError:
        logger.error("Timeout conectando a MQTT")
        if client:
            try:
                await client.disconnect()
            except:
                pass
        return None
    except Exception as e:
        logger.error(f"Error conectando MQTT: {e}")
        if client:
            try:
                await client.disconnect()
            except:
                pass
        return None

async def publish_message(client: MQTTClient, topic: str, message: str, timeout: float = 5.0):
    """Publica mensaje MQTT (gmqtt.publish no es awaitable)"""
    try:
        # gmqtt.publish() es síncrono, no necesita await
        client.publish(topic, message, qos=1)
        logger.info(f"MQTT publicado en {topic}: {message}")
        return True
    except Exception as e:
        logger.error(f"Error publicando MQTT: {e}")
        return False

######################## CONFIGURACIÓN DE MONGO DB ####################

MONGO_URL = os.getenv("MongoUrl", "mongodb://172.22.82.26:27019/")
logger.info(f"MongoDB URL configurada: {MONGO_URL}")

# Pool de conexiones MongoDB (singleton)
_mongo_client: Optional[AsyncIOMotorClient] = None

def get_client() -> AsyncIOMotorClient:
    """Obtiene el cliente MongoDB (singleton)"""
    global _mongo_client
    
    if not MONGO_URL:
        raise ValueError("MongoUrl no está configurada correctamente")
    
    if _mongo_client is None:
        logger.info(f"Creando cliente MongoDB: {MONGO_URL}")
        _mongo_client = AsyncIOMotorClient(
            MONGO_URL,
            maxPoolSize=50,
            minPoolSize=10,
            maxIdleTimeMS=30000,
            waitQueueTimeoutMS=5000,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
    
    return _mongo_client

async def get_all_databases() -> List[str]:
    """Obtiene todas las bases de datos con timeout"""
    try:
        client = get_client()
        db_names = await asyncio.wait_for(
            client.list_database_names(),
            timeout=10.0
        )
        return db_names
    except asyncio.TimeoutError:
        logger.error("Timeout obteniendo bases de datos")
        raise
    except Exception as e:
        logger.error(f"Error obteniendo bases de datos: {e}")
        raise

async def get_database(db_name: str) -> Database:
    """Obtiene conexión a base de datos específica con timeout"""
    try:
        client = get_client()
        db = client[db_name]
        
        # Verificar conectividad con timeout
        await asyncio.wait_for(
            db.command('ping'),
            timeout=5.0
        )
        
        return db
    except asyncio.TimeoutError:
        logger.error(f"Timeout conectando a base de datos {db_name}")
        raise
    except Exception as e:
        logger.error(f"Error conectando a base de datos {db_name}: {e}")
        raise

async def close_mongo_connection():
    """Cierra la conexión MongoDB"""
    global _mongo_client
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        logger.info("Conexión MongoDB cerrada")

######################### CONFIGURACIÓN DE REDIS ####################

REDIS_HOST = os.getenv("RedisHost", "172.22.82.26")
REDIS_PORT = int(os.getenv("RedisPort", "6379"))
REDIS_DB = int(os.getenv("RedisDB", "2"))

# Pool de conexiones Redis
_redis_pool = None

async def get_redis_pool():
    """Obtiene el pool de conexiones Redis (singleton)"""
    global _redis_pool
    if _redis_pool is None:
        redis_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
        _redis_pool = redis.ConnectionPool.from_url(
            redis_url,
            decode_responses=True,
            max_connections=20,
            retry_on_timeout=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
    return _redis_pool

async def get_redis():
    """Obtiene cliente Redis del pool"""
    try:
        pool = await get_redis_pool()
        redis_client = redis.Redis(connection_pool=pool)
        return redis_client
    except Exception as e:
        logger.error(f"Error conectando a Redis: {e}")
        raise

async def get_redis_with_db(db: int = REDIS_DB):
    """Obtiene cliente Redis para base de datos específica"""
    try:
        redis_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{db}"
        redis_client = await redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        return redis_client
    except Exception as e:
        logger.error(f"Error conectando a Redis DB {db}: {e}")
        raise

async def get_redis_keys(pattern: str = "*"):
    """Obtiene claves Redis con timeout"""
    try:
        redis_client = await get_redis()
        keys = await asyncio.wait_for(
            redis_client.keys(pattern),
            timeout=10.0
        )
        await redis_client.close()
        return keys
    except asyncio.TimeoutError:
        logger.error("Timeout obteniendo claves Redis")
        raise
    except Exception as e:
        logger.error(f"Error obteniendo claves Redis: {e}")
        raise

async def close_redis_connections():
    """Cierra conexiones Redis"""
    global _redis_pool
    if _redis_pool:
        await _redis_pool.disconnect()
        _redis_pool = None
        logger.info("Pool Redis cerrado")

# Función de limpieza general
async def cleanup_connections():
    """Limpia todas las conexiones"""
    await close_mongo_connection()
    await close_redis_connections()
    logger.info("Todas las conexiones cerradas")