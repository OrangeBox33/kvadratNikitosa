#include <WiFi.h>
#include <WebSocketsClient.h>
#include <FastLED.h>
#include <Preferences.h>
#include <HTTPUpdate.h>  // OTA по http. НЕ подключаем WiFiClientSecure — иначе линкуется mbedTLS и бинарь пухнет.

#define NUM_LEDS 256
#define DATA_PIN 13

CRGB leds[NUM_LEDS];

const char* default_ssid = "test";
const char* default_password = "testtest";
const char* serverIp = "193.124.203.221";
const uint16_t serverPort = 81;
const char* serverURL = "/";

// URL готового .bin для OTA. Обязательно ПЛОСКИЙ http (без редиректа на https),
// иначе понадобится TLS и раздуется прошивка. Кладём сюда свежую сборку перед обновлением.
const char* firmwareUrl = "http://193.124.203.221/fw/kvadrat.bin";


WebSocketsClient webSocket;
Preferences preferences;

// Функция для сохранения SSID и пароля
void saveWiFiCredentials(const char* ssid, const char* password) {
    preferences.begin("wifi", false);  // Открываем пространство имен "wifi" для записи
    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.end();  // Закрываем пространство имен
}

// Функция для чтения SSID и пароля
void loadWiFiCredentials(String &ssid, String &password) {
    preferences.begin("wifi", true);   // Открываем пространство имен "wifi" для чтения
    ssid = preferences.getString("ssid", "");  // Читаем SSID или возвращаем пустую строку по умолчанию
    password = preferences.getString("password", "");  // Читаем пароль или возвращаем пустую строку по умолчанию
    preferences.end();  // Закрываем пространство имен
}



// Попытка подключения к одной сети: до 10 секунд ожидания.
// Возвращает true, если удалось подключиться.
bool tryConnect(const char* ssid, const char* password) {
  Serial.print("Connecting to Wi-Fi ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    Serial.print(".");
    delay(1000);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("Failed");
  return false;
}

// Функция для подключения к Wi-Fi
void connectToWiFi() {
  String ssid, password;
  loadWiFiCredentials(ssid, password);

  // Сначала пробуем сохранённые данные (если они есть)
  if (ssid.length() > 0 && password.length() > 0) {
    if (tryConnect(ssid.c_str(), password.c_str())) {
      return;
    }
  }

  // Фолбэк на дефолтную сеть
  tryConnect(default_ssid, default_password);
}




void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  if (type == WStype_DISCONNECTED) {
    Serial.print("Disconnected from server");

    if (payload != nullptr && length > 0) {
      Serial.print(". Reason: ");
      Serial.write(payload, length);
    }

    Serial.println();
    return;
  } else if (type == WStype_ERROR) {
    Serial.println("Error occurred");
    Serial.printf("Error code: %d\n", payload[0]);
    return;
  } else if (type == WStype_BIN && length > 0) {



    if (payload[0] == 1 || payload[0] == 2) {
      // рисуем пиксели
      for (uint32_t i = 1; i < length; i += 4) {
        leds[payload[i+3]] = CRGB(payload[i], payload[i+1], payload[i+2]);
      }
      FastLED.show();


      
    } else if (payload[0] == 3) {
      // анимация
      uint32_t currentIndex = 1;
      
      while (currentIndex < length) {
        if (payload[currentIndex] == 255) { // 255 знак разделения
          currentIndex++;

          FastLED.show();
          delay(25);
        } else {
          leds[payload[currentIndex + 3]] = CRGB(
            payload[currentIndex],
            payload[currentIndex + 1],
            payload[currentIndex + 2]
          );

          currentIndex += 4;
        }
      }
    }

    
  } else if (type == WStype_TEXT ) {
    // в этом блоке сохраняем пароль
    // Предполагаем, что формат сообщения: "SSID:password"
    String message = String((char*)payload);
    message.replace("\"", "");
    Serial.println(message.c_str());

    // OTA-триггер: сервер прислал команду "OTA" -> сами качаем прошивку по http и шьёмся.
    if (message == "OTA") {
      Serial.println("OTA: старт обновления прошивки");
      webSocket.disconnect();  // освобождаем сокет, чтобы heartbeat не рвал загрузку

      WiFiClient client;  // ПЛОСКИЙ клиент, без TLS
      httpUpdate.rebootOnUpdate(true);
      t_httpUpdate_return ret = httpUpdate.update(client, firmwareUrl);

      switch (ret) {
        case HTTP_UPDATE_FAILED:
          Serial.printf("OTA failed (%d): %s\n", httpUpdate.getLastError(),
                        httpUpdate.getLastErrorString().c_str());
          initializeWebSocket();  // не вышло — переподключаемся и живём дальше
          break;
        case HTTP_UPDATE_NO_UPDATES:
          Serial.println("OTA: обновлений нет");
          initializeWebSocket();
          break;
        case HTTP_UPDATE_OK:
          Serial.println("OTA OK");  // сюда обычно не доходим: rebootOnUpdate перезагрузит
          break;
      }
      return;
    }

    int separatorIndex = message.indexOf(':');

    if (separatorIndex != -1) {
      String ssid = message.substring(0, separatorIndex);
      String password = message.substring(separatorIndex + 1);
      
      // Сохранение SSID и пароля
      saveWiFiCredentials(ssid.c_str(), password.c_str());
      
      Serial.println("Received and saved new Wi-Fi credentials:");
      Serial.print("SSID: ");
      Serial.println(ssid);
      Serial.print("Password: ");
      Serial.println(password);
      Serial.println("Перезапуск устройства...");
      ESP.restart();
      delay(5000);
      
      // Можно отправить подтверждение клиенту
      // webSocket.sendTXT(num, "Credentials saved successfully.");
    } else {
      Serial.println("Invalid message format. Expected format: SSID:password");
      // webSocket.sendTXT(num, "Invalid message format. Expected format: SSID:password");
    }
  } else if (type == WStype_CONNECTED) {
    Serial.println("Connected to WebSocket server");
    // Получение уникального идентификатора чипа
    uint64_t chipId = ESP.getEfuseMac();
    String chipIdStr = String((uint16_t)(chipId >> 32), HEX) + String((uint32_t)chipId, HEX);
    chipIdStr.toUpperCase();
    
    // Отправка уникального идентификатора чипа на сервер
    webSocket.sendTXT(chipIdStr);
    Serial.printf("Sent Chip ID: %s\n", chipIdStr.c_str());
  }
}



void initializeWebSocket() {
  webSocket.begin(serverIp, serverPort, serverURL);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(30000, 1000, 100);
}



void setup() {
    Serial.begin(115200);

    uint64_t chipId = ESP.getEfuseMac();
    Serial.printf("Chip ID: %04X%08X\n", (uint16_t)(chipId >> 32), (uint32_t)chipId);

    connectToWiFi();

    initializeWebSocket();

    delay(2000);
    FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
}





void loop() {
  webSocket.loop();

  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    delay(2000);
    connectToWiFi();
  }
}