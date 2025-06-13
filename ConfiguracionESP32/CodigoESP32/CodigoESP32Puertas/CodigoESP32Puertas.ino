#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// Configuración WiFi
const char *ssid = "INFINITUM05A4_2.4";
const char *password = "5XE5sd88pt";

// Configuración MQTT
const char *mqtt_server = "172.22.82.26"; // IP de tu servidor MQTT
const int mqtt_port = 1883;
const char *mqtt_topic = "egal/puertas"; // Topic para escuchar comandos de puertas
const char *mqtt_client_id = "esp32_puertas_controller";

// Pines GPIO para los relevadores
#define RELAY_1 16 // Puerta 1
#define RELAY_2 17 // Puerta 2
#define RELAY_3 18 // Puerta 3
#define LED_PIN 2  // LED integrado

// Mapeo de IDs de puertas a relays
struct PuertaConfig
{
    const char *id;
    int pin;
    const char *nombre;
};

// Definición de puertas disponibles
PuertaConfig puertas[] = {
    {"puerta1", RELAY_1, "Puerta 1"},
    {"puerta2", RELAY_2, "Puerta 2"},
    {"puerta3", RELAY_3, "Puerta 3"}};
const int NUM_PUERTAS = 3;

// Variables para controlar relés por tiempo
bool relayTimers[3] = {false, false, false};
unsigned long relayStartTimes[3] = {0, 0, 0};
const unsigned long RELAY_ON_DURATION = 5000; // 5 segundos

// Variables para estado y reconexión
unsigned long lastReconnectAttempt = 0;
unsigned long lastStatusTime = 0;
unsigned long lastActivityTime = 0;
bool wifiConnected = false;

// Objetos WiFi y MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);

void setup()
{
    // Inicializar serial para debugging
    Serial.begin(115200);
    Serial.println("\n=== ESP32 Sistema de Control de Puertas EGAL v1.0 ===");

    // Inicializar LED de estado
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    // Inicializar relés
    initRelays();

    // Configurar WiFi
    setupWifi();

    // Configurar MQTT
    mqttClient.setServer(mqtt_server, mqtt_port);
    mqttClient.setCallback(mqttCallback);

    // Conectar a MQTT
    reconnectMQTT();

    Serial.println("Inicialización completada");
    blinkLED(3, 200); // Parpadear 3 veces para indicar inicio exitoso
}

void loop()
{
    // Mantener conexión WiFi
    if (WiFi.status() != WL_CONNECTED)
    {
        if (wifiConnected)
        {
            Serial.println("WiFi desconectado. Intentando reconexión...");
            wifiConnected = false;
        }
        setupWifi();
    }

    // Mantener conexión MQTT
    if (!mqttClient.connected())
    {
        unsigned long now = millis();
        if (now - lastReconnectAttempt > 5000)
        {
            lastReconnectAttempt = now;
            if (reconnectMQTT())
            {
                lastReconnectAttempt = 0;
            }
        }
    }
    else
    {
        mqttClient.loop();
    }

    // Manejar temporizadores de relés
    handleRelayTimers();

    // Publicar estado periódicamente
    publishStatus();

    // Pequeña pausa
    delay(10);
}

// Función para inicializar los relés
void initRelays()
{
    for (int i = 0; i < NUM_PUERTAS; i++)
    {
        pinMode(puertas[i].pin, OUTPUT);
        digitalWrite(puertas[i].pin, HIGH); // Relés son activos en LOW
    }
    Serial.println("Relés inicializados");
}

// Configuración WiFi
void setupWifi()
{
    if (WiFi.status() == WL_CONNECTED)
    {
        wifiConnected = true;
        return;
    }

    Serial.print("Conectando a WiFi: ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    // Esperar hasta 20 segundos por conexión
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40)
    {
        delay(500);
        Serial.print(".");
        attempts++;

        // Parpadear LED durante la conexión
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println();
        Serial.print("WiFi conectado. IP: ");
        Serial.println(WiFi.localIP());
        wifiConnected = true;
        digitalWrite(LED_PIN, HIGH); // LED encendido cuando conectado
    }
    else
    {
        Serial.println();
        Serial.println("Error conectando a WiFi");
        digitalWrite(LED_PIN, LOW);
    }
}

// Reconexión a MQTT
bool reconnectMQTT()
{
    if (!wifiConnected)
        return false;

    Serial.print("Intentando conexión MQTT... ");

    if (mqttClient.connect(mqtt_client_id))
    {
        Serial.println("conectado!");

        // Suscribirse al topic de puertas
        mqttClient.subscribe(mqtt_topic);
        Serial.print("Suscrito al topic: ");
        Serial.println(mqtt_topic);

        // Enviar mensaje de conexión
        char msg[100];
        snprintf(msg, 100, "{\"status\":\"online\",\"device\":\"esp32_puertas\",\"ip\":\"%s\"}", WiFi.localIP().toString().c_str());
        mqttClient.publish("egal/devices/status", msg);

        blinkLED(2, 300); // Indicar conexión exitosa
        return true;
    }
    else
    {
        Serial.print("falló, rc=");
        Serial.print(mqttClient.state());
        Serial.println(" intentando nuevamente en 5 segundos");
        return false;
    }
}

// Callback para mensajes MQTT
void mqttCallback(char *topic, byte *payload, unsigned int length)
{
    Serial.print("Mensaje recibido [");
    Serial.print(topic);
    Serial.print("]: ");

    // Crear un buffer para el mensaje recibido (con terminador nulo)
    char message[length + 1];
    for (unsigned int i = 0; i < length; i++)
    {
        message[i] = (char)payload[i];
        Serial.print((char)payload[i]);
    }
    message[length] = '\0';
    Serial.println();

    // Intentar parsear como JSON
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, message);

    if (error)
    {
        Serial.print("Error parseando JSON: ");
        Serial.println(error.c_str());
        return;
    }

    // Extraer datos
    const char *puertaId = doc["puerta_id"];
    const char *accion = doc["accion"] | "abrir";

    if (!puertaId)
    {
        Serial.println("Mensaje sin ID de puerta");
        return;
    }

    // Procesar acción
    procesarAccionPuerta(puertaId, accion);

    // Registrar actividad
    lastActivityTime = millis();
}

// Procesar acción de puerta
void procesarAccionPuerta(const char *puertaId, const char *accion)
{
    Serial.print("Procesando acción '");
    Serial.print(accion);
    Serial.print("' para puerta '");
    Serial.print(puertaId);
    Serial.println("'");

    // Buscar la puerta correspondiente
    int puertaIndex = -1;
    for (int i = 0; i < NUM_PUERTAS; i++)
    {
        if (strcmp(puertas[i].id, puertaId) == 0)
        {
            puertaIndex = i;
            break;
        }
    }

    if (puertaIndex == -1)
    {
        Serial.println("Puerta no encontrada");
        return;
    }

    // Procesar acción
    if (strcmp(accion, "abrir") == 0)
    {
        abrirPuerta(puertaIndex);
    }
    else if (strcmp(accion, "cerrar") == 0)
    {
        cerrarPuerta(puertaIndex);
    }
    else
    {
        Serial.print("Acción desconocida: ");
        Serial.println(accion);
    }
}

// Abrir puerta (activar relé)
void abrirPuerta(int puertaIndex)
{
    int relayPin = puertas[puertaIndex].pin;
    Serial.print("Abriendo puerta: ");
    Serial.println(puertas[puertaIndex].nombre);

    // Activar relé (LOW para activar)
    digitalWrite(relayPin, LOW);

    // Iniciar temporizador
    relayTimers[puertaIndex] = true;
    relayStartTimes[puertaIndex] = millis();

    // Encender LED para indicar actividad
    digitalWrite(LED_PIN, HIGH);

    // Publicar estado
    char msg[100];
    snprintf(msg, 100, "{\"puerta_id\":\"%s\",\"estado\":\"abierta\",\"device\":\"esp32\"}",
             puertas[puertaIndex].id);
    mqttClient.publish("egal/puertas/estado", msg);
}

// Cerrar puerta (desactivar relé)
void cerrarPuerta(int puertaIndex)
{
    int relayPin = puertas[puertaIndex].pin;
    Serial.print("Cerrando puerta: ");
    Serial.println(puertas[puertaIndex].nombre);

    // Desactivar relé (HIGH para desactivar)
    digitalWrite(relayPin, HIGH);

    // Detener temporizador
    relayTimers[puertaIndex] = false;

    // Publicar estado
    char msg[100];
    snprintf(msg, 100, "{\"puerta_id\":\"%s\",\"estado\":\"cerrada\",\"device\":\"esp32\"}",
             puertas[puertaIndex].id);
    mqttClient.publish("egal/puertas/estado", msg);
}

// Manejar temporizadores de relés
void handleRelayTimers()
{
    unsigned long currentTime = millis();

    for (int i = 0; i < NUM_PUERTAS; i++)
    {
        if (relayTimers[i] && (currentTime - relayStartTimes[i] >= RELAY_ON_DURATION))
        {
            // Tiempo expirado, cerrar puerta
            cerrarPuerta(i);
        }
    }
}

// Publicar estado periódicamente
void publishStatus()
{
    unsigned long currentTime = millis();

    if (currentTime - lastStatusTime >= 30000) // Cada 30 segundos
    {
        lastStatusTime = currentTime;

        if (mqttClient.connected())
        {
            // Crear mensaje de estado
            DynamicJsonDocument statusDoc(1024);
            statusDoc["device"] = "esp32_puertas";
            statusDoc["status"] = "online";
            statusDoc["ip"] = WiFi.localIP().toString();
            statusDoc["uptime"] = currentTime / 1000; // segundos

            JsonArray puertasArray = statusDoc.createNestedArray("puertas");

            for (int i = 0; i < NUM_PUERTAS; i++)
            {
                JsonObject puertaObj = puertasArray.createNestedObject();
                puertaObj["id"] = puertas[i].id;
                puertaObj["nombre"] = puertas[i].nombre;
                puertaObj["estado"] = digitalRead(puertas[i].pin) == HIGH ? "cerrada" : "abierta";
            }

            // Serializar a JSON
            char statusBuffer[512];
            serializeJson(statusDoc, statusBuffer);

            // Publicar
            mqttClient.publish("egal/devices/puertas/status", statusBuffer);
        }
    }
}

// Hacer parpadear el LED
void blinkLED(int times, int delayMs)
{
    for (int i = 0; i < times; i++)
    {
        digitalWrite(LED_PIN, HIGH);
        delay(delayMs);
        digitalWrite(LED_PIN, LOW);
        delay(delayMs);
    }
}

/*
<!-- Añadir esto en AndroidManifest.xml (dentro del archivo app.json o app.config.js en Expo) -->
<manifest>
  <application>
    <activity android:name=".MainActivity">
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="egaldemo" />
      </intent-filter>

      <!-- Para abrir desde URLs web -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="http" android:host="172.22.82.26" android:pathPrefix="/puertas/v1/abrir" />
        <data android:scheme="https" android:host="172.22.82.26" android:pathPrefix="/puertas/v1/abrir" />
      </intent-filter>
    </activity>
  </application>
</manifest>
*/