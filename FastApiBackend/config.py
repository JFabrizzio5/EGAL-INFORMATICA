# config.py

import logging
from dotenv import load_dotenv
import os


import redis.asyncio as redis
from motor.motor_asyncio import AsyncIOMotorClient
from motor.core import Database
dotenv_path = "../.env"
load_dotenv(dotenv_path=dotenv_path)


####################### CONFIGURACIÓN DE MQTT ####################
import asyncio
from gmqtt import Client as MQTTClient

MQTT_HOST = os.getenv("MQTT_HOST", "172.22.82.26")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_CLIENT_ID = os.getenv("MQTT_CLIENT_ID", "mi_cliente_mqtt")
# Evento cuando llega un mensaje
def on_message(client, topic, payload, qos, properties):
    logger.info(f"Mensaje recibido en {topic}: {payload}")


# Crear cliente
def create_mqtt_client() -> MQTTClient:
    client = MQTTClient(MQTT_CLIENT_ID)
    client.on_message = on_message
    return client


# Conectar y suscribirse
async def connect_mqtt(topics: list[str] = None) -> MQTTClient:
    client = create_mqtt_client()
    await client.connect(MQTT_HOST, MQTT_PORT)
    logger.info(f"MQTT conectado a {MQTT_HOST}:{MQTT_PORT}")

    # Suscribirse a los topics si están definidos
    if topics:
        for topic in topics:
            client.subscribe(topic, qos=1)
            logger.info(f"Suscrito a {topic}")
    
    return client


# Publicar mensaje
async def publish_message(client: MQTTClient, topic: str, message: str):
    client.publish(topic, message, qos=1)
    logger.info(f"Publicado en {topic}: {message}")

######################## CONFIGUACIÓN DE MONGO DB ####################
MONGO_URL = os.getenv("MongoUrl", "mongodb://172.22.82.26:27019/")
# Log para verificar si se cargó MongoUrl correctamente
print(f"Valor de MongoUrl desde el archivo .env: {MONGO_URL}")
def get_client():
    if not MONGO_URL:
        raise ValueError("MongoUrl no está configurada correctamente")
    
    print(f"Conectando a MongoDB en: {MONGO_URL}")
    
    # Establecer el cliente de conexión
    client = AsyncIOMotorClient(MONGO_URL)
    return client
# Función para obtener todas las bases de datos
async def get_all_databases() -> list:
    client = get_client()
    db_names = await client.list_database_names()  # Obtener todas las bases de datos
    return db_names

# Función para obtener la conexión a una base de datos específica
async def get_database(db_name: str) -> Database:
    client = get_client()
    db = client[db_name]
    await db.command('ping')  # Verificar que la base de datos está en línea
    return db


######################### CONFIGURACIÓN DE REDIS ####################
REDIS_HOST = os.getenv("RedisHost", "172.22.82.26")  # Asegúrate de tener RedisHost en el .env

REDIS_PORT = 6379
REDIS_DB = 2  # Índice de la base de datos que deseas usar

# Conexión a Redis
async def get_redis():
    redis_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    redis_client = await redis.from_url(redis_url, decode_responses=True)
    return redis_client

async def get_redis_with_db(db: int = REDIS_DB):
    redis_url = f"redis://{REDIS_HOST}:{REDIS_PORT}/{db}"
    redis_client = await redis.from_url(redis_url, decode_responses=True)
    return redis_client

async def get_redis_keys():
    redis_client = await get_redis()
    keys = await redis_client.keys("*")
    return keys










# Configurar el logger
logger = logging.getLogger("fastapi")
logger.setLevel(logging.DEBUG)

# Crear un manejador para la consola
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Crear un formato de salida para los mensajes del logger
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Añadir el manejador al logger
logger.addHandler(console_handler)