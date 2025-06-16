EGAL-INFORMATICA
================

EGAL-INFORMATICA es un sistema integral de control de acceso a puertas que combina hardware ESP32, backend FastAPI, aplicaciones móviles React Native y interfaces web para gestionar el acceso físico mediante NFC, QR codes y WebSockets.
![Descripción de la imagen](DiagramaFinalArquitectura.png) 

Enlace al diagrama completo
https://excalidraw.com/#room=d54cc58bbb26eb0f0f06,GAJHBUhlB1CitnK47gZ9KA

Arquitectura General
--------------------

*   **Backend FastAPI (CrearModulo.py:1-8)** API REST con autenticación JWT, scaffolding automático, WebSocket, integración con MongoDB, Redis y MQTT.
*   **Hardware ESP32 (CodigoESP32.ino:1-16)** Control de 4 relés para cerraduras electromagnéticas, comunicación WiFi y WebSocket, activación automática por 5 segundos y reconexión.
*   **Aplicación Móvil React Native (login.tsx:1-13)** Autenticación con roles, deep links para NFC/QR, generación de tokens de acceso y control remoto de puertas.
*   **Interfaces Web (index.html:1-6)** Panel de control ESP32 con WebSocket, autenticación NFC y monitoreo en tiempo real.

Funcionalidades Clave
---------------------

*   Control de Acceso: Apertura de puertas mediante tokens JWT, NFC tags y QR codes.
*   Gestión de Usuarios: Sistema de roles con permisos específicos por puerta.
*   Comunicación en Tiempo Real: WebSockets para estado de puertas y notificaciones.
*   Hardware Integration: Control directo de relés ESP32 para cerraduras físicas.
*   Scaffolding Automático: Generación de módulos FastAPI con estructura estándar.

Requisitos para Usar en GitHub
------------------------------

### Dependencias del Sistema

*   Backend: Python 3.11+, Docker y Docker Compose, MongoDB, Redis, Mosquitto MQTT
*   Mobile App: Node.js 18+, Expo CLI, React Native
*   Hardware: ESP32, Relay modules (4-channel), WiFi

Configuración Requerida
-----------------------

### Variables de Entorno

`# Backend API_URL=http://192.168.1.160:8000 WS_URL=ws://192.168.1.160:8000 MONGODB_URL=mongodb://localhost:27017 REDIS_URL=redis://localhost:6379 # ESP32 WIFI_SSID=tu_red_wifi WIFI_PASSWORD=tu_password WEBSOCKET_SERVER=192.168.1.159`

### Deep Links

Configurado en `app.config.js:4-28`

### Docker Services

Configurado en `Servicios.py:24-26`

Estructura de Deployment
------------------------

`EGAL-INFORMATICA/ ├── FastApiBackend/ ├── AppCelular/ ├── ServidorWEB/ ├── ConfiguracionESP32/ └── docker-compose.yml`

Comandos de Inicio
------------------

### Backend services

`cd FastApiBackend/ContenedoresDBMQTT python Servicios.py`

### Mobile App

`cd AppCelular/AppDemoEgal/EgalDemo npm install && expo start`

### ESP32 (Arduino IDE)

`Upload CodigoESP32.ino to ESP32 boards`

Notes
-----

El proyecto requiere configuración de red local específicamente en el rango 192.168.1.x y hardware ESP32 físico para funcionar. El script `CrearModulo.py` proporciona un mecanismo automático para extender el backend según sean necesarias nuevos módulos.
