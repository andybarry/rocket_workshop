String quadcopter_id = "";
String light_pole_id = "";
bool yellow_button_connected = false;
bool slide_connected = false;
bool blue_button_connected = false;


// Include files (you can ignore these)
// --------------------------------------
#include <FastIMU.h>
#include <Adafruit_NeoPixel.h>
#include <WiFi.h> // Include the WiFi library
#include <WiFiUdp.h>
#include "driver/ledc.h"
#include <NimBLEDevice.h> // Bluetooth low-energy library
// --------------------------------------

struct HoldCommand {
  int roll;
  int pitch;
  int throttle;
  int yaw;
  int time_in_milliseconds;
  String color;
};

#define MAX_HOLDCOMMANDS 50

HoldCommand commands[MAX_HOLDCOMMANDS];
int commandCount = 0;

void AutonomousFlightFromBlueButton() {
  Serial.println("Running automous commands!");
  // Commands to send to the quadcopter in order
  //
  // holdCommand(left/right, forward/back, throttle/speed, rotation, time-ms, neopixel color);
  //
  // all values (except time) are in range 0 to 100, higher is right/forward/faster
  //
  // Colors are:
  //    white
  //    red
  //    green
  //    blue
  //    yellow
  //    orange
  //    purple
  //

  // loop through the hold command list.

  // holdCommand(50, 50, 55, 50, 500, "blue");  // straight up 0.5 sec
  // holdCommand(50, 50, 55, 100, 750, "purple"); // spin in place 0.75 sec
  // holdCommand(50, 50, 55, 0, 750, "orange");   // spin in place the other way 0.75 sec
  // Serial.println(commandCount);
  for (int i = 0; i < commandCount; i++) {
    holdCommand(commands[i].roll, commands[i].pitch, commands[i].throttle, commands[i].yaw, commands[i].time_in_milliseconds, commands[i].color);
  }
}

// Changelog:
// v1.0
// v2.0
// v3.0
// v4.0: adds support for more versions of the ESP board
// v4.1: adds support for baro_max_height_throttle_at_limit from website, fixes drone reconnect losing altitude bug
// v4.2: replaces the 50KB checksum lookup table with the exact CRC-8 (poly 0x01) checksum, sends exact stick values
// v4.3.0: emergency-stop flag is now pulsed for ~1 second then cleared (idle packets after),
//        matching the Android app which auto-clears the one-shot bits (0x10/0x20/0x40) after 1001 ms
#define DRONE_WORKSHOP_VERSION_MAJOR 4
#define DRONE_WORKSHOP_VERSION_MINOR 3
#define DRONE_WORKSHOP_VERSION_PATCH 0
#define DRONE_WORKSHOP_STR2(x) #x
#define DRONE_WORKSHOP_STR(x) DRONE_WORKSHOP_STR2(x)
#define DRONE_WORKSHOP_VERSION_STRING \
  "Drone workshop firmware: v" DRONE_WORKSHOP_STR(DRONE_WORKSHOP_VERSION_MAJOR) \
  "." DRONE_WORKSHOP_STR(DRONE_WORKSHOP_VERSION_MINOR) \
  "." DRONE_WORKSHOP_STR(DRONE_WORKSHOP_VERSION_PATCH)

// IO pins

#define GREEN_BUTTON_PIN 4  // take-off/gyro-reset button (base circuit)
#define GREEN_LED_PIN_BASE 5  // take-off indicator (base circuit)
#define GREEN_LED_PIN_REMOTE 10  // take-off indicator (remote)

#define YELLOW_BUTTON_PIN_BASE 6  // stop button (base circuit)
#define YELLOW_BUTTON_PIN_REMOTE 14  // stop button (remote)
#define WHITE_LED_PIN_BASE 7  // stop indicator (base circuit)
#define WHITE_LED_PIN_REMOTE 11  // stop indicator (remote)

#define BLUE_BUTTON_PIN 17  // autonomous button (base circuit)
#define BLUE_LED_PIN 16  // autonomous indicator (base circuit)

#define ALTITUDE_SLIDER_PIN 15  // throttle slider, purple wire (base circuit)

#define IMU_SDA_PIN 12  // accelerometer/gyro SDA data pin (remote)
#define IMU_SCL_PIN 13  // accelerometer/gyro SCL data pin (remote)

// Define the GPIO pin and PWM properties
#define LEDC_MODE LEDC_LOW_SPEED_MODE // High-speed mode
#define LEDC_FREQUENCY 5000          // Frequency in Hz
#define LEDC_RESOLUTION LEDC_TIMER_13_BIT // 13-bit resolution

#define CENTER 128




static BLEUUID serviceUUID("0000fff0-0000-1000-8000-00805f9b34fb");
static BLEUUID charUUID("0000fff3-0000-1000-8000-00805f9b34fb");
static BLEAddress bleAddress(light_pole_id.c_str());
BLEClient* pClient;
BLERemoteCharacteristic* pRemoteCharacteristic;
bool connectedBT = false;

int LED_TIMER_MAPPING[] = {
  GREEN_LED_PIN_BASE,
  GREEN_LED_PIN_REMOTE,
  WHITE_LED_PIN_BASE,
  WHITE_LED_PIN_REMOTE,
  BLUE_LED_PIN
};

int NUM_LEDS = sizeof(LED_TIMER_MAPPING) / sizeof(LED_TIMER_MAPPING[0]);
bool HIGH_SPEED_MODE = false; // if we should be in "L" or "H" mode
bool last_green_button = false;

// Use two newopixel objects on different pins to support board with different neopixel pin numbers at the same time.
#define NEOPIX_PIN1 48  // built-in NeoPixel on some boards
#define NEOPIX_PIN2 38  // built-in NeoPixel on other boards
Adafruit_NeoPixel pixel1(200, NEOPIX_PIN1, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel pixel2(200, NEOPIX_PIN2, NEO_GRB + NEO_KHZ800);

// Accelerometer/gyro setup
#define IMU_ADDRESS 0x68  // set IMU address
MPU6050 IMU;  // define a variable to reference the accelerometer/gyro
calData calib = { 0 };  // define default calibration data
AccelData accelData;  // accel sensor data
GyroData gyroData;  // gyro sensor data

// Define the server IP and port to send data
const char * udpAddress = "192.168.0.1";
const int udpPort = 40000;
const int udpRxPort = 10000;
const char * networkPswd = "";  // WiFi network pw (none)
WiFiUDP udp;  // initialize the UDP client

// Constants
const int t_delta = 50;  // 50 milliseconds between packets
const int acc_dead_zone = 15;
const int gyro_threshold = 400;
  
// Initial Values
int packet_counter = 0;
int stopped_at = 0;
bool running = true;
int left_right = 128;
int forward_back = 128;
int altitude = 128;
int go_rotate = 0;
int take_off = 0;
bool stopped = 0;
bool take_off_toggle = true; ////
int autonomous_mode = 0;
boolean connected = false;  //Are we currently connected?
int turning = 0;
int recent_gyro[4];
int acc_status = -1;  // default accelerometer status
char neopixel_color = 'w';
int first_flight_time = 20;
int first_flight_counter = 0;
bool first_flight_is_in_flight = false;
bool lastNoWifiRed = false;
unsigned long previousMillis = 0;  // will store last time LED was updated
const long interval = 125;         // interval at which to blink (milliseconds)
unsigned long previousMillisBlue = 0;
bool lastBlueLightBlinkingOn = true;
int16_t baro_altitude_cm = 0;
int16_t baro_altitude_cm_flight_start = 0;
bool baro_height_limit_enabled = true;
int baro_max_height_allowed_cm = 300; // 3 meters
int baro_max_height_throttle_at_limit = 100;
bool first_udp_packet = true;
bool g_in_flight = false;

int led_duty_cycle = 4000;
String yellow_button_print_text = "Stop/Yellow button pressed";

//quadrotor Comms setup
#define init_packet_String "63630100000000"
#define idle_packet_String "63630a00000b0066808080808080800c8c99"
#define take_off_packet_String "63630a00000b0066808080808080801c9c99"
#define landing_packet_String "63630a00000b0066808080808080802cac99"
#define stopped_packet_String "63630a00000b0066808080808080804ccc99"

// The Android app (liblewei_uartprotol.so, GetUdircUartCTLData) treats the
// takeoff (0x10), landing (0x20) and emergency-stop (0x40) flag bits as
// one-shots: it sends each for ~1 second (1001 ms gate on GetTickCount),
// then clears the bit and keeps streaming plain idle packets while the
// drone stays disarmed. take_off=20 already pulses the takeoff bit for
// ~1 s; this counter does the same for the stop bit so we don't keep
// re-commanding emergency stop on every packet while parked.
#define ONE_SHOT_PACKETS 20  // ~1 second of packets at 50 ms each
int stop_packets_remaining = 0;

// Function to set the neopixel color
void setNeoPixel(int r, int g, int b, bool alsoSetPole = true) {
  for (int i=0; i<100; i++) {
    pixel1.setPixelColor(i, r, g, b, 0);
    pixel2.setPixelColor(i, r, g, b, 0);
  }
  pixel1.show();
  pixel2.show();
  if (connectedBT && alsoSetPole) {
    setBluetoothPoleColor(r, g, b);
  }
}


void parseInput(String input) {
  int index = 0;
  int startIndex = 0;
  int partIndex = 0;
  commandCount = 0;

  if (input == "test_all_drones") {
    testAllDrones(0);
    return;
  } else if (input == "test_all_drones_flying1") {
    testAllDrones(1);
    return;
  } else if (input == "test_all_drones_flying2") {
    testAllDrones(2);
    return;
  }

  Serial.println(DRONE_WORKSHOP_VERSION_STRING);

  if (input == "version") {
    return;
  }

  while ((index = input.indexOf('@', startIndex)) != -1) {
    String part = input.substring(startIndex, index);
    processPart(part, partIndex);
    startIndex = index + 1;
    partIndex++;
  }

  // Process the last part
  processPart(input.substring(startIndex), partIndex);
}

void processPart(String part, int partIndex) {
  String newId;
  switch (partIndex) {
    case 0:
      // Extract and assign quadcopter_id
      newId = part;
      if (quadcopter_id != newId || !connected) {

        WiFi.disconnect();
        quadcopter_id = newId;
        if (quadcopter_id != "") {
          char network_name[18];
          strcpy(network_name, "udirc-WiFi-");
          strcat(network_name, quadcopter_id.c_str());
          connectToWiFi(network_name, networkPswd);
        }
      }
      break;
    case 1:
      if (light_pole_id != part || !connectedBT) {
        light_pole_id = part;
        bleAddress = BLEAddress(light_pole_id.c_str());
        connectToBluetoothPole();
      }
      break;
    case 2:
      yellow_button_connected = (part == "true");
      break;
    case 3:
      slide_connected = (part == "true");
      break;
    case 4:
      blue_button_connected = (part == "true");
      if (blue_button_connected) {
        setLed(BLUE_LED_PIN, false);
      }
      break;
    case 5:
      baro_height_limit_enabled = (part == "true");
      break;
    case 6:
      baro_max_height_allowed_cm = part.toInt();
      break;
    case 7:
      led_duty_cycle = part.toInt();
      setLed(WHITE_LED_PIN_BASE, HIGH);
      setLed(WHITE_LED_PIN_REMOTE, HIGH);
      break;
    case 8:
      yellow_button_print_text = part;
      break;
    case 9:
      baro_max_height_throttle_at_limit = part.toInt();
      break;
    default:
      if (partIndex >= 9 && commandCount < MAX_HOLDCOMMANDS) {
        commands[commandCount] = parseCommand(part);
        commandCount++;
      }
      break;
  }
}

HoldCommand parseCommand(String commandString) {
  HoldCommand command;
  int params[5];
  int paramIndex = 0;
  int startIndex = 0;
  int index = 0;

  while ((index = commandString.indexOf(',', startIndex)) != -1 && paramIndex < 5) {
    String param = commandString.substring(startIndex, index);
    params[paramIndex++] = param.toInt();
    startIndex = index + 1;
  }

  // Last parameter before color
  if (paramIndex < 5) {
    params[paramIndex++] = commandString.substring(startIndex, commandString.lastIndexOf(',')).toInt();
  }

  // Color
  command.color = commandString.substring(commandString.lastIndexOf(',') + 1);

  // Assign parsed params
  command.roll = params[0];
  command.pitch = params[1];
  command.throttle = params[2];
  command.yaw = params[3];
  command.time_in_milliseconds = params[4];

  return command;
}




// Function to set all lights to "stopped" state
void lightsStopped() {  
  g_in_flight = false;
  setLed(GREEN_LED_PIN_BASE, LOW);
  setLed(GREEN_LED_PIN_REMOTE, LOW);
  setLed(WHITE_LED_PIN_BASE, HIGH);
  setLed(WHITE_LED_PIN_REMOTE, HIGH);
  setLed(BLUE_LED_PIN, LOW);
  setNeoPixel(0, 0, 0); // off
}

// Function to set all lights to "go" state
void lightsGo() {
  g_in_flight = true;
  setLed(GREEN_LED_PIN_BASE, HIGH);
  setLed(GREEN_LED_PIN_REMOTE, HIGH);
  setLed(WHITE_LED_PIN_BASE, LOW);
  setLed(WHITE_LED_PIN_REMOTE, LOW);
  setNeoPixel(0, 255, 0); // green
}

// Function to set all lights to "autonomous" state
void lightsAutonomous() {
  g_in_flight = true;
  setLed(BLUE_LED_PIN, HIGH);  // turn on blue light
  lightsGo();  // since everything else is identical to "go", just call that function to reuse that code here!
}

// Stop button initialization
void stopPressed() {
  if (!stopped) {
    stopped_at = packet_counter;  // for flight recorder end packet
    lightsStopped();  // update light state
    stopped = 1;
    stop_packets_remaining = ONE_SHOT_PACKETS;  // pulse the stop bit for ~1 s like the app
    autonomous_mode = 0;
    first_flight_is_in_flight = false;
  }
}

// Take-off button action
void takeOffPressed() {
  Serial.println("Green/Take-Off Button Pressed");
  lightsGo();
  acc_status = IMU.init(calib, IMU_ADDRESS);  // calibrate accelerometer at moment of take-off 
  take_off = 20;  // set take-off count but not if off-wifi
  packet_counter = 0;
  stopped = 0;
  first_flight_counter = first_flight_time;
  first_flight_is_in_flight = true;
}

// Autonomous sequence
void autonomousPressed() {
  if (!blue_button_connected) {
    Serial.println("Blue/Autonomous button pressed, but blue_button_connected = false, doing nothing.");
    return;
  }
  Serial.println("Blue/Autonomous Button Pressed");
  lightsAutonomous();

  baro_altitude_cm_flight_start = baro_altitude_cm;
  
  autonomous_mode = 1;
  stopped = 0;
  
  // required take-off packets (minimum 5)
  for (int i = 0; i < 20; i++) {
    sendPacket(take_off_packet_String);
  }

  AutonomousFlightFromBlueButton();

  // kill at end of sequence
  stopPressed();
}

void testAllDrones(int flying_mode) {
  Serial.println("\n--- Wi-Fi scan ---");
  WiFi.disconnect(true);
  delay(200);

  int found = WiFi.scanNetworks(false, true);
  if (found <= 0) {
    Serial.println("No networks found (or error).");
    WiFi.scanDelete();
    return;
  }

  int num_drones = 0;
  for (int i=0; i<found; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.startsWith("udirc") &&
        WiFi.encryptionType(i) == WIFI_AUTH_OPEN) {
          num_drones ++;
          Serial.printf("Found: %s\n", ssid.c_str());
    }
  }
  Serial.println("Found " + String(num_drones) + " drone(s).");

  for (int i=0; i<found; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.startsWith("udirc") &&
        WiFi.encryptionType(i) == WIFI_AUTH_OPEN) {
      Serial.printf("Connecting to: %s\n", ssid.c_str());

      connectToWiFi(ssid.c_str(), "");

      for (int i = 0; i < 100; i++) {
        if (connected) {
          break;
        }
        delay(50);
      }
      if (!connected) {
        Serial.println("Failed to connect to: " + ssid + " giving up.");
        continue;
      }

      quadcopter_id = ssid;
      autonomous_mode = 1;
      stopped = 0;

      int flying_for_loop_n = 10;
      if (flying_mode == 1) {
        flying_for_loop_n = 10;
      } else if (flying_mode == 2) {
        flying_for_loop_n = 20;
      }


      // Init the drone
      for (int i = 0; i < 20; i++) {
        // put an idle packet in there to set the length
        char tmpHexStr[] = "63630a00000b0066808080808080800c8c99";
        
        compute_packet(128, 128, 128, 128, tmpHexStr);
        // Serial.println(tmpHexStr);
        sendPacket(String(tmpHexStr));  // has built in t_delta delay
      }

      // Take off
      // required take-off packets (minimum 5)
      for (int i = 0; i < 15; i++) {
        sendPacket(take_off_packet_String);
      }

      if (flying_mode > 0) {
        // compute_packet(lr, fb, ud, ro, tmpHexStr);
        char tmpHexStr[] = "63630a00000b0066808080808080800c8c99";
        compute_packet(128, 128, 128, 128, tmpHexStr);
        // Serial.println(tmpHexStr);

        for (int i = 0; i < flying_for_loop_n; i++) {
          sendPacket(String(tmpHexStr));  // has built in t_delta delay
        }
      }

      // Stop
      for (int i = 0; i < 10; i++) {
        sendPacket(stopped_packet_String);
      }

      Serial.println("Done testing: " + ssid);
    }
  }

  Serial.println("-----------------------");
  Serial.println("Done testing all drones");
  Serial.println("-----------------------");


  quadcopter_id = "";
  stopPressed();  // sets autonomous_mode=0, stopped=1, updates lights, arms the stop pulse
}

// Executes the various serial-command routines for colors and testing wiring
void serialInput(char in_val) {
  switch (in_val) {
    case 'w':
      // Serial.println("Neopixel white command received");
      setNeoPixel(255, 255, 255); // white
      break;
    case 'r':
      // Serial.println("Neopixel red command received");
      setNeoPixel(255, 0, 0); // red
      break;
    case 'g':
      // Serial.println("Neopixel green command received");
      setNeoPixel(0, 255, 0); // green
      break;
    case 'b':
      // Serial.println("Neopixel blue command received");
      setNeoPixel(0, 0, 255); // blue
      break;
    case 'y':
      // Serial.println("Neopixel yellow command received");
      setNeoPixel(255, 255, 0); // yellow
      break;
    case 'o':
      // Serial.println("Neopixel orange command received");
      setNeoPixel(255, 127, 0); // orange
      break;
    case 'p':
      // Serial.println("Neopixel purple command received");
      setNeoPixel(200, 0, 255); // purple
      break;
    default:
      break;
  }
}

// executes a hold command as specified and converts time to cycles to loop through each command every ~50ms
void holdCommand(int lr, int fb, int ud, int ro, int mill, String colorStr) {
  holdCommandDetail(lr, fb, ud, ro, mill, colorStr, true);
}

void holdCommandDetail(int lr, int fb, int ud, int ro, int mill, String colorStr, bool print) {
  if (print) {
    Serial.printf("holdCommand roll:%3d, pitch:%3d, throttle:%3d, yaw:%3d, time-ms:%4d\n", lr, fb, ud, ro, mill);
  }

  char color = colorToChar(colorStr);
  
  // Convert from 0-100 to 0-255
  lr = 2.55*lr;
  fb = 2.55*fb;
  ud = 2.55*ud;
  ro = 2.55*ro;
  
  char tmpHexStr[] = "63630a00000b0066808080808080800c8c99";
  compute_packet(lr, fb, ud, ro, tmpHexStr);
  int cycles = (mill / t_delta) - (mill / 1000);  // desired millis / per-cycle delay, minus 1 cycle/sec for room for keep-alive packet
  switch (color) {
    case 'v':
    case 's':
    case 'w':
    case 'r':
    case 'g':
    case 'b':
    case 'y':
    case 'o':
    case 'p':
      serialInput(color);
      break;
    default:
      break;
  }
  for (int i = 0; i < cycles; i++) {
    if (stopped)  return;  // in case yellow/stop button was pressed
    if (!autonomous_mode)  return;  // in case the green button was pressed
    
    // Check for manual override button behind held down
    if (digitalRead(GREEN_BUTTON_PIN) == LOW) {
      doManualFlightUpdate();
      i --;
      // Flash the blue LED when in override mode
      unsigned long currentMillisBlue = millis();
      if (currentMillisBlue - previousMillisBlue >= interval) {
        // save the last time we blinked the LED
        previousMillisBlue = currentMillisBlue;
  
        // If the LED is off turn it on and vice-versa
        if (lastBlueLightBlinkingOn) {
          setLed(BLUE_LED_PIN, LOW);  // Turn off the LED
        } else {
          setLed(BLUE_LED_PIN, HIGH);  // Turn on the LED
        }
        lastBlueLightBlinkingOn = !lastBlueLightBlinkingOn;
      }
    } else {
      setLed(BLUE_LED_PIN, HIGH);
      sendPacket(String(tmpHexStr));  // has built in t_delta delay
    }
  }
}

char colorToChar(String color) {
    color.toLowerCase(); // Convert the string to lowercase for consistency

    if (color == "white") return 'w';
    if (color == "red") return 'r';
    if (color == "green") return 'g';
    if (color == "blue") return 'b';
    if (color == "yellow") return 'y';
    if (color == "orange") return 'o';
    if (color == "purple") return 'p';

    return '-';
}


void setupLedTimers() {
  for (int i = 0; i < NUM_LEDS; i++) {
    // Configure the LEDC timer
    ledc_timer_config_t ledc_timer = {
        .speed_mode = LEDC_MODE,
        .duty_resolution = LEDC_RESOLUTION,
        .timer_num = (ledc_timer_t)0,
        .freq_hz = LEDC_FREQUENCY,
        .clk_cfg = LEDC_AUTO_CLK
    };
    ledc_timer_config(&ledc_timer);
    
    // Configure the LEDC channel
    ledc_channel_config_t ledc_channel = {
        .gpio_num = LED_TIMER_MAPPING[i],
        .speed_mode = LEDC_MODE,
        .channel = (ledc_channel_t)i,
        .intr_type = LEDC_INTR_DISABLE,
        .timer_sel = (ledc_timer_t)0,
        .duty = 0, // Set duty cycle to 0 initially
        .hpoint = 0
    };
    ledc_channel_config(&ledc_channel);
  }
}

void setLed(int pin_num, bool on_off) {
  int duty = 0;
  if (on_off) {
    duty = led_duty_cycle;
  }
  setLedDutyCycle(pin_num, duty);
}

void setLedDutyCycle(int pin_num, int duty_cycle) {
  // Find the timer
  int timer_num = -1;
  for (int i = 0; i < NUM_LEDS; i++) {
    if (pin_num == LED_TIMER_MAPPING[i]) {
      timer_num = i;
      break;
    }
  }
  if (timer_num < 0) {
    Serial.print("Could not find pin");
    Serial.print(pin_num);
    Serial.println(" in LED timer list!");
    return;
  }

  ledc_set_duty(LEDC_MODE, (ledc_channel_t)timer_num, duty_cycle);
  ledc_update_duty(LEDC_MODE, (ledc_channel_t)timer_num);
  
}

void doManualFlightUpdate() {
  // Read altitude slider if connected
  if (slide_connected) {
    int altitude_value = analogRead(ALTITUDE_SLIDER_PIN);  // read the slider's voltage / convert to integer
    altitude = map(altitude_value,0,4096,50,210);  // remaps 0-8191 value to a number 60-180 (full 0-255 range is chaotic)

    if (!blue_button_connected) {
      // Set the blue LED brightness corresponding to the altitude slider
      setLedDutyCycle(BLUE_LED_PIN, (int)map(altitude, 50, 210, 50, 600));
    }
  } else {
    altitude = 128;
  }

  // Read MPU6050 data (accelerometer/gyro)
  if (acc_status >= 0) {
    IMU.update();
    IMU.getAccel(&accelData);
    IMU.getGyro(&gyroData);
    
    float accX = accelData.accelX / 16384.0; // Convert to m/s^2 (assuming +/-2g sensitivity)
    float accY = accelData.accelY / 16384.0; // Convert to m/s^2 (assuming +/-2g sensitivity)
    float accZ = accelData.accelZ / 16384.0; // Convert to m/s^2 (assuming +/-2g sensitivity)
  
    // Calculate pitch and roll using accelerometer data
    float pitch = atan2(-accX, sqrt(accY * accY + accZ * accZ)) * 180 / M_PI;
    if (pitch > acc_dead_zone || pitch < -1 * acc_dead_zone ) {
      forward_back = map(constrain(pitch, -90, 90), -90, 90, 255, 0);
    } else {
      forward_back = CENTER;  // no pitch
    }
    float roll = atan2(accY, accZ) * 180 / M_PI;
    // Build in a "deadzone" for a more stable center with the accelerometer values
    if (roll > acc_dead_zone || roll < -1 * acc_dead_zone ) {
      left_right = map(constrain(roll, -90, 90), -90, 90, 255, 0);
    } else {
      left_right = CENTER;  // no roll
    }
  
    // Calculate if a rotation is requested by user jolt of z-gyro, filter out noise and tilts
    go_rotate = CENTER;  // default to no rotation
  } else {  // if accelerometer failed / is disconnected, use safe default values*/
    left_right = CENTER;
    forward_back = CENTER;
    go_rotate = CENTER;
  }
  // altitude=128;
  // left_right=128;
  // go_rotate=128;
  // forward_back = 1;

  // display current inputs being fed into the packet computations
  if (packet_counter % 20 == 0 && connected) {
    if (acc_status < 0)  Serial.println("No accelerometer. ");  // Check accelerometer status
    if (slide_connected == 0)  Serial.println("No throttle. ");  // Check throttle variable at line 2
    float current_height = float(baro_altitude_cm - baro_altitude_cm_flight_start)/100.0f;
    // Serial.printf("%4d: Pitch: %3d Roll: %3d\n\tYaw:%3d, Throttle: %3d, Current altitude (meters): %.2f\n", packet_counter, forward_back, left_right, go_rotate, altitude, current_height);
    // if (packet_counter % 200 == 0) {
        Serial.println("Roll | Pitch | Yaw | Throttle | Alt (m)");
        Serial.println("----------------------------------------");
    // }
    Serial.printf("%5d | %4d | %3d | %8d | %7.2f\n", 
                map(left_right, 0, 255, 0, 100), map(forward_back, 0, 255, 0, 100),
                map(go_rotate, 0, 255, 0, 100), map(altitude, 0, 255, 0, 100), current_height);
  }

  // put an idle packet in there to set the length
  char tmpHexStr[] = "63630a00000b0066808080808080800c8c99";
  
  if (take_off > 0) { // takeoff sequence in progress
    sendPacket(take_off_packet_String);
    take_off--;
  } else {
    compute_packet(left_right, forward_back, altitude, go_rotate, tmpHexStr);
    // Serial.println(tmpHexStr);
    sendPacket(String(tmpHexStr));  // has built in t_delta delay
  }
}

bool connectToBluetoothPole() {

    pClient = BLEDevice::createClient();
    pClient->setConnectTimeout(3);

//    pClient->setClientCallbacks(new MyClientCallback());
    Serial.print("Attempting to connect to Bluetooth light pole...");
    if (pClient->connect(bleAddress)) {
        Serial.println(" connected.");
    } else {
        Serial.println(" failed.");
        return false;
    }

    // Obtain a reference to the service
    BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
    if (pRemoteService == nullptr) {
        Serial.println("Failed to find our service UUID: ");
        Serial.println(serviceUUID.toString().c_str());
        pClient->disconnect();
        return false;
    }
//    Serial.println(" - Found our service");

    // Obtain a reference to the characteristic
    pRemoteCharacteristic = pRemoteService->getCharacteristic(charUUID);
    if (pRemoteCharacteristic == nullptr) {
        Serial.println("Failed to find our characteristic UUID: ");
        Serial.println(charUUID.toString().c_str());
        pClient->disconnect();
        return false;
    }
//    Serial.println(" - Found our characteristic");
    connectedBT = true;

    // You can read or write the characteristic here
    // Example: pRemoteCharacteristic->readValue();

    return true;
}

void setBluetoothPoleColor(uint8_t red, uint8_t green, uint8_t blue) {
    uint8_t command[9] = {126, 0, 5, 3, red, green, blue, 0, 239};  // Equivalent of 0x7E and 0xEF in decimal
    pRemoteCharacteristic->writeValue(command, sizeof(command), false);
}

// Initial program run when microcontroller boots up
void setup() {
  Serial.begin(115200);  // serial monitor setup
  Serial.println("");
  Serial.println("");
  Serial.println("----------- ROBOTICS WORKSHOP ------------");
  Serial.println("---------- STAGE ONE EDUCATION -----------");
  Serial.println("");
  Wire.begin(IMU_SDA_PIN, IMU_SCL_PIN); // accelerometer setup
  Wire.setClock(400000);  // accelerometer 400khz clock setup
  
  pinMode(GREEN_BUTTON_PIN, INPUT_PULLUP);  // keep input end of button at 3.3V
  pinMode(YELLOW_BUTTON_PIN_BASE, INPUT_PULLUP);  // keep input end of button at 3.3V
  pinMode(YELLOW_BUTTON_PIN_REMOTE, INPUT_PULLUP);  // keep input end of button at 3.3V
  pinMode(BLUE_BUTTON_PIN, INPUT_PULLUP);  // keep input end of button at 3.3V
  pinMode(ALTITUDE_SLIDER_PIN, INPUT_PULLUP);

  pinMode(GREEN_LED_PIN_BASE, OUTPUT);
  pinMode(GREEN_LED_PIN_REMOTE, OUTPUT);

  pinMode(WHITE_LED_PIN_BASE, OUTPUT);
  pinMode(WHITE_LED_PIN_REMOTE, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);

  BLEDevice::init("NimBLE_Client");
  if (light_pole_id != "") {
    if (connectToBluetoothPole()) {
        Serial.println("Connected to the Bluetooth light pole.");
    } else {
        Serial.println("Failed to connect to the Bluetooth light pole.");
    }
  }

  setupLedTimers();

  pixel1.setBrightness(5);  // turn down brightness
  pixel1.begin();  // initialize NeoPixel
  pixel2.setBrightness(5);  // turn down brightness
  pixel2.begin();  // initialize NeoPixel
  lightsStopped();  // function to set all led lights to "stopped" state

  //register event handler
  WiFi.onEvent(WiFiEvent);

  //Connect to the WiFi network
  if (quadcopter_id != "") {
    char network_name[18];
    strcpy(network_name, "udirc-WiFi-");
    strcat(network_name, quadcopter_id.c_str());
    connectToWiFi(network_name, networkPswd);
  }

   acc_status = IMU.init(calib, IMU_ADDRESS);
   lightsStopped();
}

void loopWithoutQuad() {
  // Read take-off (green) button
  if (digitalRead(GREEN_BUTTON_PIN) == LOW) {
    if (!last_green_button) {
      Serial.println("Green button pressed");
      last_green_button = true;
    }
    setLed(GREEN_LED_PIN_BASE, HIGH);
    setLed(GREEN_LED_PIN_REMOTE, HIGH);
    setNeoPixel(0, 255, 0); // green
  } else {
    // Green button not pressed.
    if (last_green_button) {
      Serial.println("Green button released");
      last_green_button = false;
    }
    setLed(GREEN_LED_PIN_BASE, LOW);
    setLed(GREEN_LED_PIN_REMOTE, LOW);
    setNeoPixel(0, 0, 0); // off
  }
}

void printTrueFalse(bool val) {
  if (val) {
    Serial.println("true");
  } else {
    Serial.println("false");
  }
}

void loop() {
  if (Serial.available()) {
    String message = Serial.readStringUntil('\n');
    parseInput(message);
  
    // Print parsed data
    Serial.println("Device ID: " + quadcopter_id);
    Serial.println("Light Pole ID: " + light_pole_id);
    Serial.print("Yellow Button Connected: "); printTrueFalse(yellow_button_connected);
    Serial.print("Slide Connected: "); printTrueFalse(slide_connected);
    Serial.print("Blue Button Connected: "); printTrueFalse(blue_button_connected);
    

    for (int i = 0; i < commandCount; i++) {
      Serial.print("Command "); Serial.print(i); Serial.print(": ");
      Serial.print(commands[i].roll); Serial.print(", ");
      Serial.print(commands[i].pitch); Serial.print(", ");
      Serial.print(commands[i].throttle); Serial.print(", ");
      Serial.print(commands[i].yaw); Serial.print(", ");
      Serial.print(commands[i].time_in_milliseconds); Serial.print(", ");
      Serial.println(commands[i].color);
    }
  }

  const int MAX_PACKET_SIZE = 255;
  // Read the altitude packet
  char incomingPacket[MAX_PACKET_SIZE];  // buffer for incoming packets
  int packetSize = udp.parsePacket();
  if (packetSize) {
        // Check if the packet size exceeds the maximum size
    if (packetSize != 15) {
      // Serial.printf("Received a too large packet of %d bytes from %s, port %d, discarding it\n", packetSize, udp.remoteIP().toString().c_str(), udp.remotePort());
      // Discard the packet by reading it but doing nothing with it
      while (udp.available()) {
        udp.read();
      }
      return;
    }
    

    // receive incoming UDP packets
    // Serial.printf("Received %d bytes from %s, port %d\n", packetSize, udp.remoteIP().toString().c_str(), udp.remotePort());
    int len = udp.read(incomingPacket, MAX_PACKET_SIZE);
    if (len > 0) {
      incomingPacket[len] = 0;  // null-terminate the string
    }


    // Print raw bytes as hex values
    if (len > 12) {
      // for (int i = 9; i < 11; i++) {
      //   Serial.printf("%02X ", (unsigned char)incomingPacket[i]);
      // }
      baro_altitude_cm = (incomingPacket[9] << 8) | (incomingPacket[10] & 0xFF);
      if (first_udp_packet) {
        baro_altitude_cm_flight_start = baro_altitude_cm;
        first_udp_packet = false;
      }
    }
  }



  unsigned long currentMillis = millis();

  // If not connected to wifi wait and retry, flash LED red
  if ((quadcopter_id != "") && (!connected)) {
    
    if (currentMillis - previousMillis >= interval) {
      // save the last time we blinked the LED
      previousMillis = currentMillis;

      // If the LED is off turn it on and vice-versa
      if (lastNoWifiRed) {
        setNeoPixel(0, 0, 0, false);  // Turn off the LED
      } else {
        setNeoPixel(255, 0, 0, true);  // Turn on the LED red
      }
      // Toggle the state of lastNoWifiRed
      lastNoWifiRed = !lastNoWifiRed;
    }
  } else if (quadcopter_id == "") {
    loopWithoutQuad();
    return;
  }

  if (!yellow_button_connected && take_off <= 0) {
    // We are in the first-flight mode.
    if (first_flight_is_in_flight && first_flight_counter <= 0) {
      stopPressed();
    } else {
      first_flight_counter --;
    }
  }

  // Read take-off (green) button
  if (digitalRead(GREEN_BUTTON_PIN) == LOW) {
    if (!last_green_button) {
      Serial.println("Green button pressed");
      baro_altitude_cm_flight_start = baro_altitude_cm;
      if (neopixel_color != 'g') {
        setNeoPixel(0, 255, 0); // green
      } else {
        setNeoPixel(255, 255, 255); // white
      }
      takeOffPressed();  // start the takeoff sequence
    }
    last_green_button = true;
  } else {
    last_green_button = false;
  }

  // Read autonomous (blue) button
  if (digitalRead(BLUE_BUTTON_PIN) == LOW) {
    autonomousPressed();  // start the autonomous loop
  }
  

  // Read the altitude slider and the accelerometer and send flight commmands
  doManualFlightUpdate();
}


// Function to convert a string of hex values to bytes
void hexStringToBytes(String hexString, uint8_t* byteArray, int byteLen) {
  // Convert the packet to bytes
  for (int i = 0; i < byteLen; i++) {
    byteArray[i] = strtoul(hexString.substring(i * 2, i * 2 + 2).c_str(), NULL, 16);
  }
}

// Sends the actual command to the drone
void sendPacket(String packetString) {
  // Always check for stopped here since this function is run with EVERY packet sent
  if ((digitalRead(YELLOW_BUTTON_PIN_BASE) == LOW) || (digitalRead(YELLOW_BUTTON_PIN_REMOTE) == LOW)) {
    Serial.println(yellow_button_print_text);
    stopPressed();
  }
  if (stopped) {
    // Pulse the emergency-stop flag for ~1 second, then fall back to idle
    // packets (the app clears the 0x40 bit after 1001 ms and keeps the drone
    // disarmed with plain idle packets rather than repeating the stop).
    if (stop_packets_remaining > 0) {
      stop_packets_remaining--;
      packetString = stopped_packet_String;
    } else {
      packetString = idle_packet_String;
    }
  }

  if (packet_counter % 20 == 0) {
    int len = String(init_packet_String).length();
    int byteLen = len / 2;
    // Convert the packet to bytes
    uint8_t packet[byteLen];
    hexStringToBytes(init_packet_String, packet, byteLen);

    // Send the packet
    udp.beginPacket(udpAddress, udpPort);
    udp.write(packet, sizeof(packet));
    udp.endPacket();
    delay(t_delta);
  }

  delay(t_delta);  // sleep 50 millis between packets
  packet_counter++;
  
  if (quadcopter_id == "")  return;
  
  //Serial.print("sending Packet:");
  //Serial.println(packetString.c_str());

  // Calculate the length of the string and the number of bytes required
  int len = packetString.length();
  int byteLen = len / 2;

  // Convert the packet to bytes
  uint8_t packet[byteLen];
  // Serial.println(packetString);
  hexStringToBytes(packetString, packet, byteLen);
  // Serial.print("Packet: ");
  //   for (size_t i = 0; i < byteLen; ++i) {
  //       if (packet[i] < 0x10) {
  //           Serial.print("0");  // Print leading zero for single digit values
  //       }
  //       Serial.print(packet[i], HEX);  // Print the byte as a hexadecimal value
  //       Serial.print("");  // Add a space between hex values
  //   }
  //   Serial.println();  // End with a new line


  // Send the packet
  udp.beginPacket(udpAddress, udpPort);
  udp.write(packet, sizeof(packet));
  udp.endPacket();
}

void connectToWiFi(const char * ssid, const char * pwd) {
  Serial.println("Connecting to WiFi network: " + String(ssid));

  // delete old config
  WiFi.disconnect(true);
  
  WiFi.begin(ssid);
  Serial.println("Waiting for WIFI connection...");

}

//wifi event handler
void WiFiEvent(WiFiEvent_t event) {
  uint8_t res1 = 0;
  uint8_t res2 = 0;
  switch (event) {
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      //When connected set
      Serial.print("\nWiFi connected! IP address: ");
      Serial.println(WiFi.localIP());
      //initializes the UDP state and transfer buffer
      udp.stop(); // this line is required to release the udpRxPort, otherwise the new udp object will fail to get data
      udp = WiFiUDP();
      res1 = udp.begin(WiFi.localIP(), udpPort);
      res2 = udp.begin(WiFi.localIP(), udpRxPort);
      connected = true;
      // Make sure the neopixel isn't left in a blinking red state.
      setNeoPixel(0, 0, 0);  // Turn off the LED
      break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
      Serial.println("WiFi not connected (turn drone off and back on)");  // lost connection
      connected = false;
      packet_counter = 0;
      break;
    default: 
      break;
  }
}

// Function to limit values to the range [0, 255]
int limit_val(int val) {
  return (val < 0) ? 0 : ((val > 255) ? 255 : val);
}

// Checksum for the quadcopter packets: CRC-8, polynomial 0x01, init 0x00,
// no reflection, no final XOR, over the 8 data bytes between the header and
// the 0x99 trailer. Reverse engineered from packet captures (see
// checksum4.ipynb); replaces the old ~50KB lookup table and also fixes the
// 28 table cells whose checksum value had been lost.
uint8_t crc8(const uint8_t *data, int len) {
  uint8_t crc = 0;
  for (int i = 0; i < len; i++) {
    crc ^= data[i];
    for (int bit = 0; bit < 8; bit++) {
      crc = (crc & 0x80) ? (uint8_t)((crc << 1) ^ 0x01) : (uint8_t)(crc << 1);
    }
  }
  return crc;
}

// Function to compute the packet
void compute_packet(int moveleftright, int forwardback, int updown, int rotate, char *hexstr) {
  moveleftright = limit_val(moveleftright);
  forwardback = limit_val(forwardback);
  updown = limit_val(updown);
  rotate = limit_val(rotate);

  // Do barometric altitude limiter.
  if (baro_height_limit_enabled && g_in_flight) {
    int current_height = baro_altitude_cm - baro_altitude_cm_flight_start;
    if (current_height > baro_max_height_allowed_cm && updown > baro_max_height_throttle_at_limit) {
      // Limit the throttle!
      updown = baro_max_height_throttle_at_limit;

      if (packet_counter % 5 == 0) {
        Serial.println("Exceeded maximum height, limiting throttle");
      }
    }
  }

  // 63 63 0a 00 00 0b 00 66 | d0 d1 d2 d3 80 80 80 04 | CRC | 99
  uint8_t body[8] = { (uint8_t)moveleftright, (uint8_t)forwardback, (uint8_t)updown,
                      (uint8_t)rotate, 0x80, 0x80, 0x80, 0x04 };
  sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x80808004%02x99",
          body[0], body[1], body[2], body[3], crc8(body, 8));
}
