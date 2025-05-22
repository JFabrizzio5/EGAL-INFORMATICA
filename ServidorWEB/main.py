import asyncio
import websockets

connected_clients = set()

async def handler(websocket):
    connected_clients.add(websocket)
    print("Nuevo cliente conectado")
    try:
        async for message in websocket:
            print(f"Mensaje recibido: {message}")
    finally:
        connected_clients.remove(websocket)
        print("Cliente desconectado")

async def enviar_mensajes_periodicos():
    while True:
        await asyncio.sleep(10)
        print("🔁 Enviando mensaje '2' a todos los clientes...")
        for client in connected_clients.copy():
            try:
                await client.send("2")
            except Exception as e:
                print(f"❌ Error al enviar mensaje: {e}")

async def main():
    server = websockets.serve(handler, "0.0.0.0", 8765)
    await asyncio.gather(server, enviar_mensajes_periodicos())

asyncio.run(main())
