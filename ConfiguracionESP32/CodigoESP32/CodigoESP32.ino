#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid = "INFINITUM05A4_2.4";
const char* password = "5XE5sd88pt";
const char* websocket_server = "192.168.1.159"; // IP de tu PC
const uint16_t websocket_port = 8765;           // Puerto del servidor WebSocket

WebSocketsClient webSocket;

#define LED_PIN 2

// Variables para controlar el parpadeo al conectar
bool blinkOnConnect = false;
unsigned long blinkStartTime = 0;
int blinkCount = 0;
bool ledState = LOW;

// Variables para controlar el encendido prolongado al recibir "2"
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

  webSocket.begin(websocket_server, websocket_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();

  unsigned long currentMillis = millis();

  // Control parpadeo cuando conecta: 3 parpadeos rápidos (100ms ON, 100ms OFF)
  if (blinkOnConnect && !keepLedOn) {
    if (currentMillis - blinkStartTime >= 100) {
      blinkStartTime = currentMillis;
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      if (!ledState) { // Cada vez que se apaga, contamos un ciclo completo
        blinkCount++;
        if (blinkCount >= 3) {
          blinkOnConnect = false;  // Termina el parpadeo
          digitalWrite(LED_PIN, LOW);
        }
      }
    }
  }

  // Control para mantener LED encendido 5 segundos cuando recibe "2"
  if (keepLedOn) {
    if (currentMillis - ledOnStartTime >= 5000) {
      digitalWrite(LED_PIN, LOW);
      keepLedOn = false;
    }
  }
}
