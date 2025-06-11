from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import get_redis, get_database,get_all_databases, connect_mqtt, logger
from motor.motor_asyncio import AsyncIOMotorClient
app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia esto al origen de tu frontend
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)

# Verifica las rutas que FastAPI ha registrado
@app.on_event("startup")
async def startup_event():
    print("Rutas registradas:")
    for route in app.routes:
        print(route.path)


@app.get("/")
async def Testeo_De_Logs_Y_Online():
    logger.info("Este es un mensaje informativo.")
    logger.debug("Este es un mensaje de depuración.")
    logger.warning("Este es un mensaje de advertencia.")
    return {"message": "Hola, mundo!"}

@app.get("/mongotest")
async def mongo_test():
    try:
        db = await get_database("admin")  # O el nombre de alguna base válida
        await db.command("ping")
        status["mongo"] = True
        db = await get_all_databases()
        logger.info(f"Base de datos MongoDB: {db}")
    except Exception as e:
        logger.error(f"MongoDB Error: {e}")
    return {"message": "MongoDB está funcionando correctamente."}

@app.get("/t")
async def healthcheck():
    status = {
        "mongo": False,
        "redis": False,
        "mqtt": False,
    }

    # MongoDB
    try:
        db = await get_database("admin")  # O el nombre de alguna base válida
        await db.command("ping")
        status["mongo"] = True
    except Exception as e:
        logger.error(f"MongoDB Error: {e}")

    # Redis
    try:
        redis_client = await get_redis()
        await redis_client.ping()
        status["redis"] = True
    except Exception as e:
        logger.error(f"Redis Error: {e}")

    # MQTT
    try:
        mqtt_client = await connect_mqtt()  # Esto también se puede cachear
        await mqtt_client.disconnect()  # Cerramos la conexión después de probarla
        status["mqtt"] = True
    except Exception as e:
        logger.error(f"MQTT Error: {e}")

    return {"status": status}

#Micoservicio de admin
from Admin.api.routes import router as admin_router
app.include_router(admin_router, prefix='/admin/v1', tags=['admin'])

#Microservicio para administracio de huespedes y accesos
from Huesped.api.routes import router as huesped_router
app.include_router(huesped_router, prefix='/huesped/v1', tags=['huesped'])

#Microservicio de autenticacion
from Auth.api.routes import router as auth_router
app.include_router(auth_router, prefix='/auth/v1', tags=['auth'])