# server.py
import asyncio
import websockets

connected_clients = set()

async def handler(websocket, path):
    connected_clients.add(websocket)
    print("Nuevo cliente conectado")
    try:
        async for message in websocket:
            print(f"Mensaje recibido: {message}")
    finally:
        connected_clients.remove(websocket)
        print("Cliente desconectado")

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):  # Escucha en todos los adaptadores
        print("Servidor WebSocket en puerto 8765")
        await asyncio.Future()  # run forever

asyncio.run(main())
