#include <WiFi.h>
#include <WebSocketsClient.h>
#include <FastLED.h>
#include <Preferences.h>
#include <HTTPUpdate.h>  // OTA по http. НЕ подключаем WiFiClientSecure — иначе линкуется mbedTLS и бинарь пухнет.
// Больше НИЧЕГО не подключаем: бинарь и так впритык влезает в OTA-слот.
// Вся диагностика ниже — на ESP.* и esp_reset_reason() из Arduino.h, без новых библиотек.

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

// OTA не запускаем прямо в колбэке WebSocket: качать 1.1 МБ внутри обработчика
// события, у которого под ногами рвётся сокет, — верный способ поймать креш и
// уйти в ребут (снаружи это выглядит как «подключился и сразу отвалился»).
// Колбэк только взводит флаг, а сама прошивка происходит в loop().
bool otaRequested = false;

unsigned long lastConnectedMs = 0;  // когда установилось текущее WS-соединение
unsigned long lastStatusMs = 0;     // когда печатали строку состояния


// Человекочитаемая причина последней перезагрузки: сразу видно, был ли креш/WDT
// (то есть панель уходит в ребут-цикл) или это обычное включение питания.
const char* resetReasonText(esp_reset_reason_t reason) {
  switch (reason) {
    case ESP_RST_POWERON:   return "POWERON (подали питание)";
    case ESP_RST_SW:        return "SW (ESP.restart)";
    case ESP_RST_PANIC:     return "PANIC (креш!)";
    case ESP_RST_INT_WDT:   return "INT_WDT (watchdog прерываний!)";
    case ESP_RST_TASK_WDT:  return "TASK_WDT (watchdog задачи!)";
    case ESP_RST_WDT:       return "WDT (watchdog!)";
    case ESP_RST_BROWNOUT:  return "BROWNOUT (просадка питания!)";
    case ESP_RST_DEEPSLEEP: return "DEEPSLEEP";
    case ESP_RST_EXT:       return "EXT (внешний reset)";
    default:                return "UNKNOWN";
  }
}

// Место под OTA и куча. getFreeSketchSpace() внутри спрашивает следующий OTA-раздел,
// поэтому 0 означает «схема разделов без OTA» — тогда httpUpdate обречён (Not Enough Space).
// Если значение меньше размера нового .bin — тоже не влезет, нужна схема с бОльшим app-слотом.
void printFirmwareInfo() {
  Serial.printf("Прошивка: занято %u байт, свободно под новую (OTA-слот) %u байт\n",
                ESP.getSketchSize(), ESP.getFreeSketchSpace());

  if (ESP.getFreeSketchSpace() == 0) {
    Serial.println("ВНИМАНИЕ: OTA-слот нулевой — схема разделов без OTA, обновление по воздуху невозможно.");
  }

  Serial.printf("Куча: свободно %u, минимум за сеанс %u, макс. блок %u\n",
                ESP.getFreeHeap(), ESP.getMinFreeHeap(), ESP.getMaxAllocHeap());
}

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
    Serial.print("WS: отключились от сервера");

    // Сколько прожило соединение: «сразу же» = доли секунды, тогда дело не в heartbeat.
    if (lastConnectedMs != 0) {
      Serial.printf(", прожило %lu мс", millis() - lastConnectedMs);
      lastConnectedMs = 0;
    }

    Serial.printf(", Wi-Fi: %s, куча %u",
                  WiFi.status() == WL_CONNECTED ? "на связи" : "ОТВАЛИЛСЯ", ESP.getFreeHeap());

    if (payload != nullptr && length > 0) {
      Serial.print(", причина: ");
      Serial.write(payload, length);
    }

    Serial.println();
    return;
  } else if (type == WStype_ERROR) {
    Serial.println("WS: ошибка");
    if (payload != nullptr && length > 0) {
      Serial.printf("WS: код ошибки %d\n", payload[0]);
    }
    return;
  } else if (type == WStype_PING) {
    Serial.println("WS: ping от сервера (ответит библиотека)");
    return;
  } else if (type == WStype_PONG) {
    Serial.println("WS: pong от сервера — heartbeat живой");
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
    Serial.printf("WS: текст от сервера (%u байт): %s\n", (unsigned)length, message.c_str());

    // OTA-триггер: сервер прислал команду "OTA".
    // Здесь только взводим флаг — сама прошивка в loop(), см. runOta().
    if (message == "OTA") {
      Serial.println("OTA: получена команда от сервера, ставим в очередь на выполнение в loop()");
      otaRequested = true;
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
    lastConnectedMs = millis();
    Serial.printf("WS: подключились к серверу %s:%u, RSSI %d dBm, куча %u\n",
                  serverIp, serverPort, WiFi.RSSI(), ESP.getFreeHeap());
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
  Serial.printf("WS: подключаемся к ws://%s:%u%s\n", serverIp, serverPort, serverURL);
  webSocket.begin(serverIp, serverPort, serverURL);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(30000, 1000, 100);
}



// Собственно OTA. Вызывается ТОЛЬКО из loop(), когда колбэк взвёл otaRequested,
// чтобы блокирующая загрузка не выполнялась внутри обработчика события WebSocket.
void runOta() {
  otaRequested = false;

  Serial.println("=== OTA: старт обновления прошивки ===");
  Serial.printf("OTA: URL %s\n", firmwareUrl);
  printFirmwareInfo();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("OTA: отмена — нет Wi-Fi");
    return;
  }

  webSocket.disconnect();  // освобождаем сокет, чтобы heartbeat не рвал загрузку
  Serial.printf("OTA: WebSocket отключён, куча перед загрузкой %u\n", ESP.getFreeHeap());

  WiFiClient client;  // ПЛОСКИЙ клиент, без TLS

  // Прогресс: печатаем каждые 10%, чтобы видеть, оборвалась загрузка или дошла до конца.
  httpUpdate.onProgress([](int done, int total) {
    static int lastTenth = -1;
    int percent = total > 0 ? (int)((int64_t)done * 100 / total) : 0;

    if (percent / 10 != lastTenth) {
      lastTenth = percent / 10;
      Serial.printf("OTA: %d%% (%d из %d байт)\n", percent, done, total);
    }
  });

  // Редиректы запрещаем явно: уход на https потребовал бы TLS, которого тут нет.
  // Лучше увидеть в логе честную ошибку 301, чем гадать.
  httpUpdate.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
  httpUpdate.rebootOnUpdate(true);

  t_httpUpdate_return ret = httpUpdate.update(client, firmwareUrl);

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("OTA: ОШИБКА (%d): %s\n", httpUpdate.getLastError(),
                    httpUpdate.getLastErrorString().c_str());
      Serial.printf("OTA: куча после провала %u, OTA-слот %u\n",
                    ESP.getFreeHeap(), ESP.getFreeSketchSpace());
      Serial.println("OTA: работаем на старой прошивке, переподключаемся к серверу");
      initializeWebSocket();  // не вышло — переподключаемся и живём дальше
      break;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("OTA: сервер ответил «обновлений нет» (обычно это 304)");
      initializeWebSocket();
      break;
    case HTTP_UPDATE_OK:
      Serial.println("OTA: OK");  // сюда обычно не доходим: rebootOnUpdate перезагрузит
      break;
  }

  Serial.println("=== OTA: конец ===");
}



void setup() {
    Serial.begin(115200);
    delay(200);  // даём порту подняться, иначе первые строки теряются

    uint64_t chipId = ESP.getEfuseMac();
    Serial.println();
    Serial.println("=== Загрузка ===");
    Serial.printf("Chip ID: %04X%08X\n", (uint16_t)(chipId >> 32), (uint32_t)chipId);
    // Если тут PANIC/WDT — панель уходит в ребут-цикл, и «дисконнект сразу после
    // коннекта» объясняется перезагрузкой, а не сервером.
    Serial.printf("Причина перезагрузки: %s\n", resetReasonText(esp_reset_reason()));
    printFirmwareInfo();

    connectToWiFi();

    initializeWebSocket();

    delay(2000);
    FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
}





void loop() {
  // Прошиваемся тут, а не в колбэке WebSocket: пока update() блокирует,
  // loop() просто не крутится, и библиотека не пытается переподключаться.
  if (otaRequested) {
    runOta();
    return;
  }

  webSocket.loop();

  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi отвалился, переподключаемся...");
    delay(2000);
    connectToWiFi();
  }

  // Строка состояния раз в 10 секунд: по ней видно ребут-цикл (millis сбрасывается),
  // утечку кучи и живость соединения.
  if (millis() - lastStatusMs > 10000) {
    lastStatusMs = millis();
    Serial.printf("Статус: uptime %lu с, WS %s, Wi-Fi %s, RSSI %d, куча %u\n",
                  millis() / 1000,
                  webSocket.isConnected() ? "подключён" : "НЕТ",
                  WiFi.status() == WL_CONNECTED ? "ок" : "НЕТ",
                  WiFi.RSSI(),
                  ESP.getFreeHeap());
  }
}