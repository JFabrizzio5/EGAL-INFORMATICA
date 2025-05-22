import asyncio
import websockets
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK

connected_clients = set()

async def handler(websocket):
    connected_clients.add(websocket)
    print("✅ Nuevo cliente conectado")
    try:
        async for message in websocket:
            print(f"📩 Mensaje recibido: {message}")
            if message == "2":
                await enviar_a_todos(message, exclude=websocket)
    except (ConnectionClosedError, ConnectionClosedOK) as e:
        print(f"⚠️ Cliente desconectado inesperadamente: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    finally:
        connected_clients.discard(websocket)
        print("🧹 Cliente eliminado de la lista")

async def enviar_a_todos(mensaje, exclude=None):
    print(f"📤 Reenviando '{mensaje}' a todos los clientes...")
    for client in connected_clients.copy():
        if client != exclude:
            try:
                await client.send(mensaje)
                print(f"✅ Mensaje enviado a un cliente")
            except Exception as e:
                print(f"❌ Error al enviar mensaje: {e}")

async def main():
    async with websockets.serve(
        handler,
        "0.0.0.0",
        8765,
        ping_interval=30,
        ping_timeout=60
    ):
        print("🚀 Servidor WebSocket corriendo en puerto 8765")
        await asyncio.Future()  # run forever

asyncio.run(main())
