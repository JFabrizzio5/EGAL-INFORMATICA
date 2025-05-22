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
bool isConnected = false;

// Variables para parpadeo
bool blinkOnConnect = false;
unsigned long blinkStartTime = 0;
int blinkCount = 0;
bool ledState = LOW;

// Variables para mantener el LED encendido
bool keepLedOn = false;
unsigned long ledOnStartTime = 0;

// Evento del WebSocket
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Desconectado.");
      isConnected = false;
      break;

    case WStype_CONNECTED:
      Serial.println("[WebSocket] Conectado.");
      isConnected = true;
      lastWebSocketConnectionTime = millis();
      blinkOnConnect = true;
      blinkStartTime = millis();
      blinkCount = 0;
      ledState = LOW;
      digitalWrite(LED_PIN, ledState);
      break;

    case WStype_TEXT:
      Serial.printf("[WebSocket] Mensaje recibido: %s\n", payload);
      if (strcmp((char*)payload, "2") == 0) {
        keepLedOn = true;
        ledOnStartTime = millis();
        digitalWrite(LED_PIN, HIGH);
      }
      break;

    case WStype_PING:
      Serial.println("[WebSocket] Ping recibido");
      break;

    case WStype_PONG:
      Serial.println("[WebSocket] Pong recibido");
      break;
  }
}

void connectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Reintentando...");
    WiFi.begin(ssid, password);
    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi reconectado con éxito");
    } else {
      Serial.println("\nNo se pudo reconectar al WiFi");
    }
  }
}

void connectWebSocket() {
  Serial.println("Intentando conectar al WebSocket...");
  webSocket.begin(websocket_server, websocket_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Reintento automático
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  connectWiFi();
  Serial.println(WiFi.localIP());

  connectWebSocket();
}

void loop() {
  // WiFi reconexión
  connectWiFi();

  // Reintento manual de WebSocket si está desconectado
  if (!webSocket.isConnected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      Serial.println("WebSocket desconectado. Intentando reconectar...");
      connectWebSocket();
    }
  }

  webSocket.loop();

  unsigned long currentMillis = millis();

  // Parpadeo al conectar (3 veces)
  if (blinkOnConnect && !keepLedOn) {
    if (currentMillis - blinkStartTime >= 100) {
      blinkStartTime = currentMillis;
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      if (!ledState) {
        blinkCount++;
        if (blinkCount >= 3) {
          blinkOnConnect = false;
          digitalWrite(LED_PIN, LOW);
        }
      }
    }
  }

  // LED encendido por 5s tras recibir "2"
  if (keepLedOn) {
    if (currentMillis - ledOnStartTime >= 5000) {
      digitalWrite(LED_PIN, LOW);
      Serial.println("Se ejecutó con éxito");
      keepLedOn = false;
    }
  }
}
