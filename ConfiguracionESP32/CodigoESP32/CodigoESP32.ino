#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid = "INFINITUM05A4_2.4";
const char* password = "5XE5sd88pt";
const char* websocket_server = "192.168.1.159"; // IP de tu PC
const uint16_t websocket_port = 8765;

WebSocketsClient webSocket;

#define LED_PIN 2

// Variables de conexión
unsigned long lastReconnectAttempt = 0;

// Variables para controlar el parpadeo al conectar
bool blinkOnConnect = false;
unsigned long blinkStartTime = 0;
int blinkCount = 0;
bool ledState = LOW;

// Variables para mantener el LED encendido
bool keepLedOn = false;
unsigned long ledOnStartTime = 0;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Desconectado.");
      break;
    case WStype_CONNECTED:
      Serial.println("[WebSocket] Conectado.");
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
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado a WiFi");
  Serial.println(WiFi.localIP());

  connectWebSocket();
}

void connectWebSocket() {
  Serial.println("Intentando conectar al WebSocket...");
  webSocket.begin(websocket_server, websocket_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000); // Reintenta cada 5 segundos
}

void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Reintentando...");
    WiFi.begin(ssid, password);
    delay(5000);
    return;
  }

  // Reintento manual si no está conectado
  if (!webSocket.isConnected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      connectWebSocket(); // Intentar reconexión
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

  // LED encendido 5s al recibir "2"
  if (keepLedOn) {
    if (currentMillis - ledOnStartTime >= 5000) {
      digitalWrite(LED_PIN, LOW);
      keepLedOn = false;
    }
  }
}
