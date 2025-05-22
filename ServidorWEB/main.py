import asyncio
import websockets

connected_clients = set()

async def handler(websocket):
    connected_clients.add(websocket)
    print("Nuevo cliente conectado")
    try:
        async for message in websocket:
            print(f"Mensaje recibido: {message}")
            # Si el mensaje recibido es "2", lo reenviamos a todos los demás clientes
            if message == "2":
                await enviar_a_todos(message, exclude=websocket)
    finally:
        connected_clients.remove(websocket)
        print("Cliente desconectado")

async def enviar_a_todos(mensaje, exclude=None):
    print(f"📤 Reenviando '{mensaje}' a todos los clientes...")
    for client in connected_clients.copy():
        if client != exclude:  # No se lo envía al mismo que lo mandó
            try:
                await client.send(mensaje)
            except Exception as e:
                print(f"❌ Error al enviar mensaje: {e}")

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("Servidor WebSocket en puerto 8765")
        await asyncio.Future()  # Run forever

asyncio.run(main())
