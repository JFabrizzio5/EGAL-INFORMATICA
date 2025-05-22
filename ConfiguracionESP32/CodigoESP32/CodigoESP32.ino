#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid = "INFINITUM05A4_2.4";
const char* password = "5XE5sd88pt";
const char* websocket_server = "192.168.1.159";
const uint16_t websocket_port = 8765;

WebSocketsClient webSocket;

#define LED_PIN 2

// Variables de conexión
unsigned long lastReconnectAttempt = 0;
unsigned long lastPingCheck = 0;
unsigned long lastWebSocketConnectionTime = 0;
unsigned long lastPongTime = 0;
unsigned long lastHeartbeat = 0;
bool isConnected = false;
bool wifiWasConnected = true;

// Variables para parpadeo
bool blinkOnConnect = false;
unsigned long blinkStartTime = 0;
int blinkCount = 0;
bool ledState = LOW;

// Variables para mantener el LED encendido
bool keepLedOn = false;
unsigned long ledOnStartTime = 0;

// Variables para watchdog y health check
unsigned long lastLoopTime = 0;
unsigned long connectionStartTime = 0;
int reconnectAttempts = 0;

// Evento del WebSocket
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Desconectado.");
      isConnected = false;
      reconnectAttempts = 0;
      break;
     
    case WStype_CONNECTED:
      Serial.printf("[WebSocket] Conectado a: %s\n", payload);
      isConnected = true;
      lastWebSocketConnectionTime = millis();
      lastPongTime = millis();
      lastHeartbeat = millis();
      connectionStartTime = millis();
      reconnectAttempts = 0;
      
      // Parpadeo de confirmación
      blinkOnConnect = true;
      blinkStartTime = millis();
      blinkCount = 0;
      ledState = LOW;
      digitalWrite(LED_PIN, ledState);
      
      Serial.println("[WebSocket] Enviando ping inicial...");
      webSocket.sendPing();
      break;
     
    case WStype_TEXT:
      Serial.printf("[WebSocket] Mensaje recibido: %s\n", payload);
      lastHeartbeat = millis(); // Actualizar heartbeat en cualquier mensaje
      
      if (strcmp((char*)payload, "2") == 0) {
        keepLedOn = true;
        ledOnStartTime = millis();
        digitalWrite(LED_PIN, HIGH);
        Serial.println("[APP] Comando '2' recibido - LED encendido");
      }
      break;
     
    case WStype_PING:
      Serial.println("[WebSocket] Ping recibido del servidor");
      lastHeartbeat = millis();
      // La librería responde automáticamente con PONG
      break;
     
    case WStype_PONG:
      Serial.println("[WebSocket] Pong recibido del servidor");
      lastPongTime = millis();
      lastHeartbeat = millis();
      break;
      
    case WStype_ERROR:
      Serial.printf("[WebSocket] Error: %s\n", payload);
      break;
      
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      Serial.println("[WebSocket] Fragmento recibido");
      break;
  }
}

void connectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    if (wifiWasConnected) {
      Serial.println("[WiFi] Conexión perdida. Reintentando...");
      wifiWasConnected = false;
    }
    
    WiFi.disconnect();
    delay(100);
    WiFi.begin(ssid, password);
    
    unsigned long startAttemptTime = millis();
    int attempts = 0;
    
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 15000) {
      delay(500);
      Serial.print(".");
      attempts++;
      
      // Si tarda mucho, reiniciar el proceso
      if (attempts > 20) {
        Serial.println("\n[WiFi] Reiniciando proceso de conexión...");
        WiFi.disconnect();
        delay(1000);
        WiFi.begin(ssid, password);
        attempts = 0;
        startAttemptTime = millis();
      }
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("\n[WiFi] Reconectado. IP: %s\n", WiFi.localIP().toString().c_str());
      Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
      wifiWasConnected = true;
    } else {
      Serial.println("\n[WiFi] FALLO: No se pudo reconectar");
    }
  }
}

void connectWebSocket() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WebSocket] WiFi no conectado, no se puede conectar WebSocket");
    return;
  }
  
  Serial.printf("[WebSocket] Conectando a ws://%s:%d/\n", websocket_server, websocket_port);
  
  // Configuraciones adicionales para mayor estabilidad
  webSocket.begin(websocket_server, websocket_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(15000, 3000, 2); // ping cada 15s, timeout 3s, 2 intentos
  
  reconnectAttempts++;
  Serial.printf("[WebSocket] Intento de conexión #%d\n", reconnectAttempts);
}

void checkWebSocketHealth() {
  unsigned long currentMillis = millis();
  
  // Verificar si el WebSocket está realmente activo
  if (isConnected) {
    // Si no hemos recibido nada en 30 segundos, algo está mal
    if (currentMillis - lastHeartbeat > 30000) {
      Serial.println("[Health] WebSocket sin actividad por 30s - forzando reconexión");
      webSocket.disconnect();
      isConnected = false;
      return;
    }
    
    // Enviar ping manual cada 20 segundos si estamos conectados
    if (currentMillis - lastPingCheck > 20000) {
      lastPingCheck = currentMillis;
      Serial.println("[Health] Enviando ping manual...");
      webSocket.sendPing();
    }
    
    // Verificar si llevamos mucho tiempo sin recibir pong
    if (currentMillis - lastPongTime > 45000) {
      Serial.println("[Health] Sin PONG por 45s - conexión probablemente muerta");
      webSocket.disconnect();
      isConnected = false;
      return;
    }
  }
}

void printStatus() {
  static unsigned long lastStatusPrint = 0;
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastStatusPrint > 30000) { // Cada 30 segundos
    lastStatusPrint = currentMillis;
    
    Serial.println("\n=== STATUS REPORT ===");
    Serial.printf("WiFi: %s (RSSI: %d dBm)\n", 
                  WiFi.status() == WL_CONNECTED ? "OK" : "DESCONECTADO", 
                  WiFi.RSSI());
    Serial.printf("WebSocket: %s\n", isConnected ? "CONECTADO" : "DESCONECTADO");
    Serial.printf("Uptime: %lu ms\n", currentMillis);
    Serial.printf("Heap libre: %d bytes\n", ESP.getFreeHeap());
    Serial.printf("Último heartbeat: hace %lu ms\n", currentMillis - lastHeartbeat);
    Serial.printf("Último pong: hace %lu ms\n", currentMillis - lastPongTime);
    Serial.printf("Intentos reconexión: %d\n", reconnectAttempts);
    Serial.println("==================\n");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== ESP32 WebSocket Client v2.0 ===");
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Configuraciones WiFi adicionales para estabilidad
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  
  connectWiFi();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("IP asignada: %s\n", WiFi.localIP().toString().c_str());
    connectWebSocket();
  }
  
  lastLoopTime = millis();
  lastHeartbeat = millis();
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Watchdog - detectar si el loop se bloquea
  if (currentMillis - lastLoopTime > 5000) {
    Serial.println("[WATCHDOG] Loop bloqueado detectado - reiniciando...");
    ESP.restart();
  }
  lastLoopTime = currentMillis;
  
  // Verificar y mantener WiFi
  connectWiFi();
  
  // Solo proceder si WiFi está conectado
  if (WiFi.status() == WL_CONNECTED) {
    
    // Reintento de WebSocket si está desconectado
    if (!webSocket.isConnected()) {
      if (currentMillis - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = currentMillis;
        Serial.println("[WebSocket] Desconectado. Intentando reconectar...");
        connectWebSocket();
      }
    }
    
    // Ejecutar el loop del WebSocket
    webSocket.loop();
    
    // Verificar salud de la conexión WebSocket
    checkWebSocketHealth();
    
  } else {
    // Si no hay WiFi, marcar WebSocket como desconectado
    isConnected = false;
  }
  
  // Parpadeo al conectar (3 veces)
  if (blinkOnConnect && !keepLedOn) {
    if (currentMillis - blinkStartTime >= 200) {
      blinkStartTime = currentMillis;
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      if (!ledState) {
        blinkCount++;
        if (blinkCount >= 3) {
          blinkOnConnect = false;
          digitalWrite(LED_PIN, LOW);
          Serial.println("[LED] Parpadeo de conexión completado");
        }
      }
    }
  }
  
  // LED encendido por 5s tras recibir "2"
  if (keepLedOn) {
    if (currentMillis - ledOnStartTime >= 5000) {
      digitalWrite(LED_PIN, LOW);
      Serial.println("[APP] Comando ejecutado - LED apagado");
      keepLedOn = false;
    }
  }
  
  // Imprimir estado periódicamente
  printStatus();
  
  // Reinicio preventivo si hay demasiados intentos fallidos
  if (reconnectAttempts > 50) {
    Serial.println("[RECOVERY] Demasiados intentos fallidos - reiniciando ESP32...");
    delay(1000);
    ESP.restart();
  }
  
  // Pequeña pausa para no saturar el CPU
  delay(10);
}