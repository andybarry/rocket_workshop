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
#define DRONE_WORKSHOP_VERSION_STRING "Drone workshop firmware: v4.1"

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
  autonomous_mode = 0;
  stopped = 1;
 
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
    packetString = stopped_packet_String;
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

//compute checksum given current control positions
// int compute_checksum(int moveleftright, int forwardback, int updown, int rotate) {
//   // int weighted_sum = moveleftright + forwardback + updown + rotate;

//   // int add_val = 132;
//   // int val_mod = 0;
//   // if (HIGH_SPEED_MODE) {
//   //   add_val = 124;
//   //   val_mod = 16;
//   // }
  
//   // int mod = ((weighted_sum + add_val) / 4) % 4;
//   // int val;

//   // switch (mod) {
//   //   case 3:
//   //     val = -8+val_mod;
//   //     break;
//   //   case 2:
//   //     val = 0;
//   //     break;
//   //   case 1:
//   //     val = 8;
//   //     break;
//   //   case 0:
//   //     val = -16+val_mod;
//   //     break;
//   // }

//   // int out = (weighted_sum + add_val) % 256 + val;

//   // if (out < 0) {
//   //   out += 256;
//   // } else if (out > 256) {
//   //   out -= 256;
//   // }
//   // return out;
//   return outd[5][5][5][5][4];
// }

// Function to compute the packet
// void compute_packet(int moveleftright, int forwardback, int updown, int rotate, char *hexstr) {
//   moveleftright = limit_val(moveleftright);
//   forwardback = limit_val(forwardback);
//   updown = limit_val(updown);
//   rotate = limit_val(rotate);

//   // hexStr must have been declared to be the length of 36

//   // Append moveleftright, forwardback, updown, rotate to the hex string
//   if (!HIGH_SPEED_MODE) {
//     sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x8080800c", moveleftright, forwardback, updown, rotate);
//   } else {
//     sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x80808004", moveleftright, forwardback, updown, rotate);
//   }

//   // Compute checksum
//   int checksum_val = compute_checksum(moveleftright, forwardback, updown, rotate);

//   // Append checksum to the hex string
//   sprintf(hexstr + 32, "%02x99", checksum_val);
// }

unsigned char outd[10][10][10][10][5] = {{{{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 22, 78, 242},{23, 58, 12, 101, 192},{28, 50, 0, 128, 42},{57, 23, 12, 153, 63},{24, 56, 22, 177, 3},{24, 56, 36, 202, 74},{30, 48, 46, 213, 81}
},{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 23, 77, 240},{37, 41, 21, 101, 248},{44, 34, 25, 128, 19},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{24, 56, 36, 202, 74},{30, 48, 46, 213, 81}
},{{37, 41, 55, 32, 159},{37, 41, 55, 32, 159},{38, 39, 43, 45, 131},{20, 62, 54, 81, 201},{12, 78, 52, 101, 151},{41, 36, 51, 128, 58},{56, 24, 58, 150, 8},{34, 44, 46, 185, 29},{57, 23, 54, 205, 81},{26, 54, 56, 224, 112}
},{{23, 58, 78, 14, 233},{47, 31, 73, 19, 238},{52, 27, 71, 45, 193},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{36, 41, 79, 128, 70},{75, 13, 79, 148, 25},{43, 35, 74, 188, 122},{45, 33, 81, 208, 9},{43, 35, 76, 228, 36}
},{{29, 49, 110, 3, 197},{55, 25, 107, 18, 211},{56, 24, 107, 47, 224},{42, 36, 103, 62, 211},{23, 58, 105, 95, 159},{44, 34, 101, 128, 111},{43, 35, 109, 141, 108},{40, 37, 105, 177, 81},{36, 41, 95, 212, 2},{24, 56, 111, 234, 33}
},{{55, 25, 125, 1, 214},{39, 38, 119, 19, 225},{56, 24, 133, 58, 27},{60, 23, 133, 63, 21},{26, 53, 124, 104, 191},{32, 45, 128, 128, 137},{18, 66, 123, 152, 55},{44, 34, 131, 185, 176},{22, 60, 134, 206, 230},{31, 46, 129, 234, 222}
},{{26, 53, 146, 3, 58},{42, 36, 158, 13, 25},{23, 58, 148, 60, 1},{64, 20, 145, 79, 14},{61, 24, 141, 101, 73},{23, 58, 153, 128, 176},{30, 48, 148, 152, 166},{48, 33, 155, 182, 184},{39, 39, 153, 214, 203},{32, 46, 153, 228, 247}
},{{26, 53, 174, 14, 11},{23, 58, 178, 18, 9},{26, 53, 180, 42, 53},{56, 24, 176, 74, 94},{23, 58, 174, 97, 102},{30, 48, 178, 128, 152},{31, 46, 186, 151, 152},{69, 17, 178, 181, 215},{32, 46, 185, 210, 225},{52, 27, 178, 231, 254}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{23, 58, 195, 52, 94},{26, 53, 205, 83, 53},{47, 31, 210, 99, 5},{56, 24, 203, 128, 239},{57, 23, 202, 155, 251},{68, 17, 206, 176, 175},{31, 46, 195, 207, 185},{25, 54, 193, 229, 143}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{55, 25, 217, 53, 70},{27, 52, 232, 76, 15},{56, 24, 233, 94, 19},{31, 46, 229, 128, 208},{57, 23, 226, 150, 222},{57, 23, 230, 174, 226},{24, 56, 217, 203, 182},{25, 54, 193, 229, 143}
}},{{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 22, 78, 242},{23, 58, 12, 101, 192},{28, 50, 0, 128, 42},{40, 41, 12, 154, 19},{24, 56, 22, 177, 3},{24, 56, 36, 202, 74},{30, 48, 46, 213, 81}
},{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 23, 77, 240},{37, 41, 21, 101, 248},{44, 34, 25, 128, 19},{26, 53, 13, 155, 61},{24, 56, 25, 182, 11},{24, 56, 36, 202, 74},{30, 48, 46, 213, 81}
},{{37, 41, 55, 32, 159},{37, 41, 55, 32, 159},{38, 39, 43, 45, 131},{20, 62, 54, 81, 201},{12, 78, 52, 101, 151},{41, 36, 51, 128, 58},{56, 24, 58, 150, 8},{34, 44, 46, 185, 29},{43, 35, 60, 205, 125},{26, 54, 56, 224, 112}
},{{23, 58, 78, 14, 233},{47, 31, 73, 19, 238},{52, 27, 71, 45, 193},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{36, 41, 79, 128, 70},{48, 30, 81, 140, 119},{43, 35, 74, 188, 122},{45, 33, 81, 208, 9},{43, 35, 76, 228, 36}
},{{29, 49, 110, 3, 197},{55, 25, 107, 18, 211},{28, 50, 91, 52, 197},{42, 36, 103, 62, 211},{23, 58, 105, 95, 159},{44, 34, 101, 128, 111},{43, 35, 109, 141, 108},{40, 37, 105, 177, 81},{36, 41, 95, 212, 2},{24, 56, 111, 234, 33}
},{{55, 25, 125, 1, 214},{39, 38, 119, 19, 225},{12, 79, 125, 49, 139},{56, 24, 133, 58, 27},{26, 53, 124, 104, 191},{32, 45, 128, 128, 137},{18, 66, 123, 152, 55},{44, 34, 131, 185, 176},{22, 60, 134, 206, 230},{31, 46, 129, 234, 222}
},{{26, 53, 146, 3, 58},{42, 36, 158, 13, 25},{23, 58, 148, 60, 1},{23, 58, 148, 60, 1},{61, 24, 141, 101, 73},{23, 58, 153, 128, 176},{30, 48, 148, 152, 166},{48, 33, 155, 182, 184},{39, 39, 153, 214, 203},{32, 46, 153, 228, 247}
},{{26, 53, 174, 14, 11},{23, 58, 178, 18, 9},{26, 53, 180, 42, 53},{56, 24, 176, 74, 94},{23, 58, 174, 97, 102},{30, 48, 178, 128, 152},{31, 46, 186, 151, 152},{31, 46, 189, 180, 188},{32, 46, 185, 210, 225},{52, 27, 178, 231, 254}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{23, 58, 195, 52, 94},{26, 53, 205, 83, 53},{47, 31, 210, 99, 5},{31, 47, 200, 128, 252},{46, 31, 206, 148, 239},{23, 60, 205, 185, 219},{31, 46, 195, 207, 185},{25, 54, 193, 229, 143}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{26, 53, 220, 57, 78},{27, 52, 232, 76, 15},{23, 58, 226, 110, 37},{31, 46, 229, 128, 208},{57, 23, 226, 150, 222},{57, 23, 230, 174, 226},{24, 56, 217, 203, 182},{25, 54, 193, 229, 143}
}},{{{23, 58, 46, 42, 173},{23, 58, 46, 42, 173},{19, 65, 32, 60, 202},{23, 58, 24, 75, 250},{23, 58, 12, 101, 192},{26, 53, 0, 128, 43},{26, 53, 13, 155, 61},{24, 56, 22, 177, 3},{24, 56, 36, 202, 74},{24, 55, 49, 217, 67}
},{{23, 58, 46, 42, 173},{23, 58, 46, 42, 173},{19, 65, 32, 60, 202},{23, 58, 24, 75, 250},{18, 66, 28, 106, 162},{23, 57, 26, 128, 48},{26, 53, 13, 155, 61},{24, 56, 25, 182, 11},{24, 56, 36, 202, 74},{24, 55, 49, 217, 67}
},{{23, 58, 65, 24, 240},{23, 58, 65, 24, 240},{23, 58, 46, 42, 173},{20, 62, 54, 81, 201},{12, 78, 52, 101, 151},{26, 54, 54, 128, 30},{27, 52, 46, 163, 38},{27, 52, 60, 176, 39},{24, 56, 57, 209, 76},{26, 54, 56, 224, 112}
},{{23, 58, 78, 14, 233},{26, 53, 72, 20, 247},{23, 58, 78, 40, 207},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{29, 50, 79, 128, 100},{24, 56, 64, 160, 68},{27, 52, 79, 191, 91},{22, 60, 82, 205, 49},{25, 55, 78, 231, 3}
},{{17, 68, 104, 4, 189},{26, 53, 112, 34, 249},{28, 50, 91, 52, 197},{23, 58, 85, 78, 178},{23, 58, 105, 95, 159},{23, 58, 101, 128, 76},{24, 56, 115, 149, 66},{24, 56, 105, 177, 124},{23, 57, 105, 191, 124},{24, 56, 111, 234, 33}
},{{26, 53, 129, 5, 47},{24, 56, 119, 19, 192},{12, 79, 125, 49, 139},{26, 53, 124, 104, 191},{26, 53, 124, 104, 191},{28, 51, 128, 128, 171},{18, 66, 123, 152, 55},{31, 46, 137, 173, 145},{22, 60, 134, 206, 230},{31, 46, 129, 234, 222}
},{{26, 53, 146, 3, 58},{26, 53, 139, 21, 53},{23, 58, 148, 60, 1},{23, 58, 148, 60, 1},{23, 58, 153, 128, 176},{23, 58, 153, 128, 176},{24, 56, 152, 146, 174},{30, 48, 148, 173, 147},{23, 59, 144, 209, 233},{25, 55, 153, 232, 219}
},{{26, 53, 174, 14, 11},{23, 58, 178, 18, 9},{26, 53, 180, 42, 53},{27, 51, 172, 60, 60},{23, 58, 174, 97, 102},{23, 58, 177, 128, 152},{13, 74, 174, 156, 241},{23, 57, 180, 188, 162},{25, 55, 182, 212, 200},{25, 54, 178, 219, 194}
},{{26, 53, 182, 18, 15},{16, 69, 199, 31, 9},{23, 58, 195, 52, 94},{26, 53, 205, 83, 53},{26, 63, 209, 99, 19},{23, 57, 209, 128, 251},{26, 68, 200, 155, 137},{23, 60, 205, 185, 219},{25, 54, 209, 213, 175},{25, 54, 193, 229, 143}
},{{26, 53, 211, 44, 84},{26, 53, 211, 44, 84},{26, 53, 220, 57, 78},{27, 52, 232, 76, 15},{23, 58, 226, 110, 37},{23, 58, 232, 128, 193},{24, 56, 242, 155, 205},{29, 49, 226, 167, 237},{24, 56, 217, 203, 182},{25, 54, 193, 229, 143}
}},{{{9, 85, 32, 60, 196},{9, 85, 32, 60, 196},{9, 85, 32, 60, 196},{11, 80, 23, 76, 132},{16, 68, 11, 104, 179},{13, 76, 0, 128, 69},{14, 74, 8, 142, 70},{8, 87, 25, 183, 117},{11, 79, 29, 187, 102},{8, 87, 63, 230, 2}
},{{9, 85, 32, 60, 196},{9, 85, 32, 60, 196},{9, 85, 32, 60, 196},{11, 80, 23, 76, 132},{12, 77, 26, 83, 140},{13, 76, 28, 128, 89},{13, 76, 28, 128, 89},{8, 87, 25, 183, 117},{11, 79, 29, 187, 102},{8, 87, 63, 230, 2}
},{{9, 86, 81, 16, 154},{30, 80, 61, 26, 237},{18, 67, 48, 62, 219},{15, 72, 54, 85, 160},{12, 78, 52, 101, 151},{7, 89, 53, 124, 147},{16, 81, 51, 179, 69},{16, 81, 51, 179, 69},{5, 96, 50, 213, 6},{8, 87, 63, 230, 2}
},{{9, 86, 81, 16, 154},{9, 86, 81, 16, 154},{10, 82, 81, 58, 183},{11, 79, 83, 78, 221},{14, 74, 80, 108, 252},{13, 75, 79, 128, 13},{15, 78, 74, 168, 39},{11, 81, 74, 188, 40},{9, 84, 66, 207, 84},{12, 79, 73, 238, 96}
},{{8, 89, 99, 6, 176},{13, 74, 119, 19, 167},{10, 82, 106, 56, 142},{11, 79, 83, 78, 221},{14, 74, 80, 108, 252},{16, 76, 110, 128, 54},{7, 91, 97, 139, 50},{10, 82, 95, 178, 49},{5, 97, 88, 201, 113},{11, 79, 105, 251, 82}
},{{13, 74, 119, 19, 167},{13, 74, 119, 19, 167},{12, 79, 125, 49, 139},{7, 90, 111, 84, 226},{12, 79, 128, 128, 199},{12, 79, 128, 128, 199},{18, 66, 123, 152, 55},{13, 75, 123, 194, 123},{13, 75, 123, 194, 123},{21, 78, 128, 238, 177}
},{{19, 80, 147, 7, 83},{14, 74, 154, 40, 114},{12, 78, 148, 43, 121},{12, 78, 148, 43, 121},{12, 78, 164, 128, 226},{12, 78, 164, 128, 226},{9, 86, 148, 151, 216},{9, 84, 142, 175, 248},{11, 80, 139, 207, 155},{12, 77, 142, 217, 146}
},{{17, 67, 182, 18, 114},{17, 67, 182, 18, 114},{14, 73, 171, 45, 69},{7, 89, 175, 60, 73},{23, 58, 174, 97, 102},{12, 78, 164, 128, 226},{13, 74, 174, 156, 241},{13, 74, 174, 156, 241},{13, 75, 195, 210, 211},{8, 86, 188, 233, 143}
},{{8, 88, 200, 32, 60},{8, 88, 200, 32, 60},{11, 81, 211, 47, 34},{12, 78, 210, 65, 85},{4, 102, 209, 99, 84},{13, 75, 199, 128, 133},{6, 93, 200, 158, 137},{16, 70, 207, 188, 161},{13, 75, 195, 210, 211},{8, 88, 192, 229, 241}
},{{11, 80, 216, 50, 53},{11, 80, 216, 50, 53},{11, 80, 216, 50, 53},{25, 84, 227, 83, 121},{10, 86, 229, 107, 86},{13, 75, 219, 128, 153},{4, 100, 226, 167, 161},{4, 100, 226, 167, 161},{13, 75, 195, 210, 211},{8, 88, 192, 229, 241}
}},{{{4, 102, 32, 60, 250},{4, 102, 32, 60, 250},{4, 102, 32, 60, 250},{4, 104, 27, 81, 162},{5, 97, 9, 112, 153},{3, 105, 1, 128, 111},{2, 116, 12, 155, 101},{6, 95, 18, 169, 102},{5, 96, 29, 191, 67},{5, 96, 50, 213, 6}
},{{4, 102, 32, 60, 250},{4, 102, 32, 60, 250},{4, 102, 32, 60, 250},{4, 104, 27, 81, 162},{4, 104, 27, 81, 162},{2, 110, 28, 128, 116},{1, 122, 28, 155, 120},{5, 96, 29, 191, 67},{5, 96, 29, 191, 67},{5, 96, 50, 213, 6}
},{{4, 100, 93, 8, 177},{1, 126, 53, 33, 239},{12, 103, 48, 62, 225},{4, 101, 62, 79, 148},{3, 107, 52, 128, 88},{3, 107, 52, 128, 88},{3, 107, 52, 128, 88},{2, 114, 44, 186, 98},{5, 96, 50, 213, 6},{5, 96, 50, 213, 6}
},{{4, 100, 93, 8, 177},{13, 114, 81, 22, 188},{19, 103, 78, 40, 150},{4, 101, 62, 79, 148},{28, 105, 73, 107, 211},{8, 92, 79, 128, 31},{6, 94, 80, 145, 29},{3, 106, 74, 188, 27},{5, 99, 74, 202, 98},{4, 101, 78, 241, 90}
},{{4, 102, 106, 4, 136},{4, 102, 106, 4, 136},{10, 102, 102, 62, 176},{10, 102, 102, 62, 176},{1, 129, 93, 103, 62},{4, 102, 118, 128, 16},{2, 111, 114, 141, 22},{7, 109, 87, 180, 13},{5, 97, 88, 201, 113},{1, 127, 95, 226, 71}
},{{4, 103, 141, 2, 104},{5, 97, 123, 41, 178},{5, 97, 123, 41, 178},{1, 118, 128, 79, 60},{4, 104, 128, 128, 232},{4, 104, 128, 128, 232},{6, 94, 139, 156, 203},{2, 129, 122, 184, 197},{5, 97, 137, 202, 163},{10, 95, 142, 220, 131}
},{{4, 103, 141, 2, 104},{1, 129, 150, 22, 132},{4, 102, 171, 45, 96},{1, 118, 128, 79, 60},{5, 96, 149, 128, 244},{5, 96, 149, 128, 244},{5, 96, 150, 150, 225},{1, 128, 163, 182, 16},{5, 97, 137, 202, 163},{3, 108, 159, 217, 173}
},{{2, 113, 176, 14, 73},{4, 100, 185, 20, 73},{4, 102, 171, 45, 96},{4, 100, 181, 62, 111},{3, 104, 176, 128, 223},{3, 104, 176, 128, 223},{4, 100, 175, 157, 214},{4, 100, 175, 157, 214},{3, 109, 194, 209, 249},{5, 96, 182, 237, 186}
},{{4, 100, 185, 20, 73},{3, 106, 204, 44, 13},{3, 106, 204, 44, 13},{3, 106, 199, 89, 115},{4, 102, 209, 99, 84},{7, 112, 206, 128, 189},{6, 93, 200, 158, 137},{5, 99, 200, 169, 131},{5, 99, 197, 209, 246},{2, 112, 207, 215, 238}
},{{4, 100, 185, 20, 73},{3, 106, 204, 44, 13},{8, 108, 226, 65, 67},{8, 108, 226, 65, 67},{9, 107, 226, 95, 91},{7, 113, 232, 128, 154},{4, 101, 235, 164, 170},{4, 100, 226, 167, 161},{2, 112, 215, 194, 227},{2, 112, 207, 215, 238}
}},{{{1, 126, 53, 33, 239},{1, 126, 53, 33, 239},{1, 129, 36, 55, 23},{7, 129, 25, 70, 93},{1, 129, 11, 106, 101},{1, 129, 0, 128, 132},{1, 127, 11, 150, 103},{1, 128, 23, 176, 162},{1, 127, 31, 194, 39},{1, 127, 46, 214, 2}
},{{1, 126, 53, 33, 239},{1, 126, 53, 33, 239},{1, 129, 36, 55, 23},{7, 129, 25, 70, 93},{1, 129, 11, 106, 101},{1, 129, 25, 128, 157},{1, 122, 28, 155, 120},{1, 127, 25, 182, 85},{1, 127, 31, 194, 39},{1, 127, 46, 214, 2}
},{{1, 126, 53, 33, 239},{1, 126, 53, 33, 239},{1, 129, 39, 49, 18},{1, 136, 58, 93, 106},{1, 136, 58, 93, 106},{1, 130, 50, 128, 181},{1, 128, 61, 145, 169},{2, 128, 44, 191, 149},{1, 127, 40, 206, 28},{1, 127, 51, 219, 18}
},{{1, 129, 86, 10, 88},{1, 129, 73, 18, 95},{1, 137, 62, 54, 4},{9, 129, 80, 73, 21},{1, 129, 76, 116, 60},{1, 129, 70, 128, 194},{1, 128, 61, 145, 169},{1, 128, 74, 188, 243},{1, 127, 76, 213, 99},{1, 127, 63, 230, 35}
},{{1, 129, 106, 4, 106},{1, 129, 106, 4, 106},{12, 121, 102, 62, 169},{6, 124, 100, 91, 193},{1, 129, 93, 103, 62},{1, 129, 106, 128, 238},{1, 132, 102, 147, 244},{1, 128, 91, 181, 235},{1, 127, 117, 199, 72},{1, 127, 95, 226, 71}
},{{2, 115, 130, 6, 113},{1, 134, 119, 19, 103},{10, 125, 138, 43, 82},{5, 128, 132, 74, 207},{1, 127, 128, 128, 250},{1, 127, 128, 128, 250},{1, 128, 120, 166, 219},{2, 129, 122, 184, 197},{1, 127, 136, 210, 160},{1, 127, 146, 225, 137}
},{{8, 128, 153, 11, 158},{1, 129, 150, 22, 132},{1, 129, 150, 22, 132},{5, 128, 132, 74, 207},{1, 129, 151, 128, 19},{1, 129, 151, 128, 19},{4, 122, 148, 156, 242},{1, 128, 163, 182, 16},{1, 127, 156, 208, 182},{1, 127, 146, 225, 137}
},{{2, 113, 176, 14, 73},{8, 127, 189, 23, 89},{13, 126, 171, 45, 113},{1, 129, 186, 73, 247},{1, 129, 172, 128, 40},{1, 129, 172, 128, 40},{1, 128, 183, 147, 33},{1, 128, 163, 182, 16},{1, 127, 156, 208, 182},{1, 127, 178, 239, 167}
},{{7, 128, 200, 32, 235},{7, 128, 200, 32, 235},{1, 129, 209, 42, 255},{1, 129, 186, 73, 247},{5, 122, 209, 99, 73},{1, 129, 208, 128, 84},{1, 127, 212, 165, 139},{1, 127, 207, 173, 152},{1, 127, 203, 198, 247},{1, 127, 194, 228, 220}
},{{1, 129, 209, 42, 255},{1, 129, 209, 42, 255},{1, 129, 223, 61, 230},{1, 129, 227, 66, 165},{1, 122, 216, 104, 79},{1, 128, 225, 128, 100},{1, 127, 240, 159, 149},{1, 127, 231, 181, 168},{1, 127, 217, 202, 233},{1, 127, 209, 214, 253}
}},{{{2, 146, 32, 60, 8},{2, 146, 32, 60, 8},{2, 146, 32, 60, 8},{12, 148, 25, 72, 77},{3, 151, 1, 128, 145},{3, 151, 1, 128, 145},{3, 151, 1, 128, 145},{8, 144, 23, 180, 191},{1, 139, 24, 181, 163},{5, 160, 51, 220, 206}
},{{2, 146, 32, 60, 8},{2, 146, 32, 60, 8},{2, 146, 32, 60, 8},{12, 148, 25, 72, 77},{4, 153, 28, 128, 133},{4, 153, 28, 128, 133},{4, 155, 31, 159, 155},{1, 139, 24, 181, 163},{2, 147, 42, 192, 255},{5, 160, 51, 220, 206}
},{{12, 148, 52, 35, 11},{12, 148, 52, 35, 11},{14, 152, 62, 50, 30},{14, 153, 55, 70, 98},{4, 155, 65, 99, 57},{1, 137, 49, 128, 189},{5, 156, 46, 150, 165},{2, 147, 42, 192, 255},{5, 160, 51, 220, 206},{5, 160, 51, 220, 206}
},{{3, 149, 99, 6, 119},{12, 149, 65, 24, 68},{14, 152, 62, 50, 30},{4, 153, 69, 103, 59},{4, 153, 69, 103, 59},{4, 154, 69, 128, 223},{3, 151, 79, 148, 203},{3, 152, 87, 182, 254},{1, 136, 74, 188, 251},{16, 145, 75, 238, 160}
},{{3, 149, 99, 6, 119},{14, 151, 102, 16, 107},{14, 154, 102, 62, 72},{14, 154, 102, 62, 72},{13, 146, 105, 101, 23},{5, 142, 109, 128, 226},{1, 132, 102, 147, 244},{4, 153, 105, 177, 193},{4, 156, 115, 210, 189},{7, 147, 104, 251, 131}
},{{12, 149, 121, 1, 101},{8, 157, 119, 19, 117},{13, 147, 123, 45, 76},{5, 128, 132, 74, 207},{3, 152, 128, 128, 31},{3, 152, 128, 128, 31},{3, 152, 128, 128, 31},{4, 153, 105, 177, 193},{3, 152, 133, 212, 78},{3, 152, 133, 212, 78}
},{{12, 149, 153, 5, 129},{14, 150, 159, 24, 155},{15, 146, 168, 46, 159},{3, 150, 180, 60, 153},{15, 152, 149, 115, 245},{10, 153, 157, 128, 10},{4, 143, 159, 157, 13},{16, 145, 158, 172, 55},{3, 147, 158, 215, 93},{6, 151, 144, 224, 101}
},{{12, 149, 176, 14, 163},{14, 150, 181, 29, 180},{3, 150, 180, 60, 153},{3, 150, 180, 60, 153},{3, 152, 209, 99, 173},{11, 154, 178, 128, 39},{4, 143, 178, 163, 30},{4, 143, 178, 163, 30},{10, 157, 180, 213, 114},{2, 146, 185, 235, 70}
},{{4, 155, 195, 28, 196},{4, 155, 195, 28, 196},{4, 153, 215, 65, 143},{4, 153, 215, 65, 143},{3, 152, 209, 99, 173},{4, 154, 210, 128, 72},{5, 160, 211, 158, 108},{1, 127, 207, 173, 152},{1, 127, 203, 198, 247},{5, 161, 191, 223, 64}
},{{4, 155, 195, 28, 196},{4, 155, 195, 28, 196},{7, 149, 226, 65, 181},{7, 149, 226, 65, 181},{3, 152, 209, 99, 173},{4, 155, 221, 128, 70},{4, 156, 226, 167, 89},{4, 156, 226, 167, 89},{16, 145, 218, 202, 21},{5, 161, 191, 223, 64}
}},{{{10, 173, 32, 60, 63},{10, 173, 32, 60, 63},{10, 173, 32, 60, 63},{13, 165, 23, 76, 119},{9, 172, 13, 100, 72},{10, 173, 0, 128, 163},{12, 180, 6, 134, 188},{15, 168, 23, 179, 135},{15, 185, 30, 193, 237},{5, 160, 51, 220, 206}
},{{10, 173, 32, 60, 63},{10, 173, 32, 60, 63},{10, 173, 32, 60, 63},{14, 183, 26, 70, 97},{9, 172, 13, 100, 72},{11, 177, 28, 128, 162},{10, 173, 34, 151, 150},{15, 168, 23, 179, 135},{15, 185, 30, 193, 237},{5, 160, 51, 220, 206}
},{{27, 181, 53, 33, 62},{27, 181, 53, 33, 62},{27, 183, 47, 53, 50},{26, 183, 55, 66, 92},{21, 186, 55, 93, 65},{16, 178, 48, 128, 150},{10, 173, 34, 151, 150},{7, 167, 40, 176, 188},{7, 166, 40, 200, 197},{5, 160, 51, 220, 206}
},{{10, 173, 86, 15, 122},{10, 173, 86, 15, 122},{33, 177, 72, 59, 103},{18, 180, 82, 93, 45},{18, 180, 82, 93, 45},{11, 174, 79, 128, 238},{14, 176, 76, 165, 211},{14, 176, 76, 165, 211},{20, 182, 73, 198, 169},{20, 174, 61, 228, 231}
},{{3, 149, 99, 6, 119},{10, 173, 86, 15, 122},{15, 185, 102, 62, 106},{15, 185, 102, 62, 106},{13, 179, 98, 99, 59},{6, 163, 109, 128, 204},{8, 170, 109, 167, 236},{9, 171, 105, 177, 254},{4, 156, 115, 210, 189},{12, 179, 104, 251, 168}
},{{11, 176, 129, 5, 187},{21, 172, 129, 23, 171},{33, 177, 122, 54, 88},{12, 179, 144, 97, 202},{12, 179, 144, 97, 202},{18, 177, 128, 128, 39},{19, 179, 147, 152, 47},{15, 185, 120, 184, 242},{19, 170, 125, 215, 151},{17, 164, 131, 233, 91}
},{{12, 174, 147, 7, 178},{12, 174, 147, 7, 178},{18, 172, 171, 45, 188},{12, 179, 144, 97, 202},{12, 179, 144, 97, 202},{10, 174, 150, 128, 54},{19, 179, 147, 152, 47},{19, 178, 159, 158, 36},{3, 147, 158, 215, 93},{6, 151, 144, 224, 101}
},{{6, 163, 181, 18, 134},{6, 163, 181, 18, 134},{18, 172, 171, 45, 188},{3, 150, 180, 60, 153},{33, 177, 171, 99, 220},{8, 169, 180, 128, 17},{20, 178, 173, 161, 46},{20, 178, 173, 161, 46},{34, 176, 179, 201, 108},{12, 179, 184, 236, 111}
},{{6, 163, 181, 18, 134},{4, 155, 195, 28, 196},{31, 178, 214, 48, 207},{28, 182, 206, 69, 165},{4, 156, 209, 99, 174},{11, 177, 191, 128, 1},{21, 178, 200, 153, 114},{23, 177, 207, 188, 81},{23, 177, 207, 188, 81},{12, 179, 184, 236, 111}
},{{6, 163, 181, 18, 134},{4, 155, 195, 28, 196},{19, 181, 227, 68, 133},{19, 181, 227, 68, 133},{15, 185, 227, 97, 176},{12, 179, 221, 128, 102},{8, 170, 226, 167, 99},{8, 170, 226, 167, 99},{34, 176, 223, 194, 11},{12, 179, 184, 236, 111}
}},{{{24, 200, 59, 29, 114},{24, 200, 59, 29, 114},{14, 183, 26, 70, 97},{23, 198, 15, 93, 7},{23, 198, 10, 108, 51},{25, 203, 0, 128, 214},{23, 198, 10, 148, 203},{23, 198, 23, 180, 246},{23, 198, 33, 198, 178},{24, 201, 43, 211, 173}
},{{24, 200, 59, 29, 114},{24, 200, 59, 29, 114},{14, 183, 26, 70, 97},{14, 183, 26, 70, 97},{23, 198, 14, 97, 58},{24, 200, 28, 128, 200},{23, 198, 13, 155, 195},{23, 198, 23, 180, 246},{23, 198, 33, 198, 178},{24, 201, 43, 211, 173}
},{{24, 200, 59, 29, 114},{24, 200, 59, 29, 114},{23, 198, 44, 44, 85},{38, 206, 46, 62, 124},{21, 186, 55, 93, 65},{21, 196, 48, 128, 229},{23, 198, 49, 167, 195},{23, 198, 49, 167, 195},{24, 201, 43, 211, 173},{22, 197, 58, 226, 143}
},{{27, 205, 93, 8, 7},{24, 200, 59, 29, 114},{30, 188, 78, 40, 64},{33, 212, 83, 78, 108},{20, 194, 80, 109, 111},{22, 197, 79, 128, 152},{22, 196, 82, 164, 160},{25, 198, 74, 188, 173},{15, 186, 72, 197, 188},{28, 196, 76, 239, 255}
},{{23, 198, 109, 3, 59},{26, 203, 119, 19, 49},{21, 195, 102, 62, 10},{21, 195, 102, 62, 10},{13, 179, 98, 99, 59},{18, 190, 95, 128, 247},{22, 198, 103, 160, 147},{26, 204, 98, 172, 156},{23, 198, 117, 203, 235},{24, 201, 104, 251, 198}
},{{23, 198, 133, 1, 209},{26, 203, 119, 19, 49},{27, 196, 135, 39, 251},{26, 200, 103, 62, 15},{26, 198, 130, 116, 174},{25, 200, 128, 128, 85},{23, 198, 120, 152, 181},{15, 185, 120, 184, 242},{23, 198, 117, 203, 235},{23, 198, 141, 228, 60}
},{{18, 191, 147, 7, 189},{18, 191, 147, 7, 189},{33, 204, 176, 59, 226},{12, 179, 144, 97, 202},{12, 179, 144, 97, 202},{28, 205, 153, 128, 76},{27, 201, 148, 156, 94},{32, 211, 155, 180, 88},{27, 205, 144, 209, 19},{23, 198, 141, 228, 60}
},{{15, 186, 159, 7, 169},{23, 199, 189, 23, 254},{29, 207, 178, 60, 216},{23, 198, 193, 75, 223},{23, 198, 192, 91, 206},{26, 203, 180, 128, 97},{23, 198, 176, 141, 104},{23, 198, 171, 173, 83},{23, 199, 182, 237, 15},{23, 199, 182, 237, 15}
},{{23, 199, 189, 23, 254},{23, 199, 189, 23, 254},{22, 197, 214, 65, 192},{23, 198, 193, 75, 223},{29, 199, 209, 99, 236},{26, 204, 199, 128, 21},{23, 198, 194, 154, 13},{26, 204, 207, 188, 33},{22, 198, 214, 207, 77},{23, 198, 200, 223, 66}
},{{23, 199, 189, 23, 254},{23, 199, 189, 23, 254},{27, 204, 232, 76, 247},{27, 204, 232, 76, 247},{15, 185, 227, 97, 176},{23, 198, 232, 128, 61},{23, 198, 242, 155, 60},{22, 197, 227, 188, 8},{23, 198, 218, 202, 69},{23, 198, 200, 223, 66}
}},{{{39, 218, 49, 38, 110},{39, 218, 49, 38, 110},{47, 226, 32, 60, 85},{44, 222, 26, 70, 42},{51, 229, 10, 107, 51},{33, 212, 0, 128, 241},{43, 222, 11, 151, 237},{32, 211, 23, 180, 212},{37, 215, 30, 192, 168},{24, 201, 43, 211, 173}
},{{39, 218, 49, 38, 110},{39, 218, 49, 38, 110},{47, 226, 32, 60, 85},{44, 222, 26, 70, 42},{43, 221, 22, 108, 8},{28, 206, 28, 128, 202},{52, 230, 37, 152, 235},{32, 211, 23, 180, 212},{37, 215, 30, 192, 168},{24, 201, 43, 211, 173}
},{{40, 216, 53, 33, 96},{40, 216, 53, 33, 96},{39, 218, 49, 38, 110},{38, 217, 46, 62, 107},{52, 229, 48, 124, 25},{30, 209, 45, 128, 230},{30, 208, 57, 148, 231},{36, 215, 56, 186, 245},{42, 220, 40, 206, 148},{22, 197, 58, 226, 143}
},{{54, 231, 83, 12, 10},{50, 224, 78, 40, 48},{50, 224, 78, 40, 48},{33, 212, 83, 78, 108},{36, 215, 77, 114, 72},{33, 212, 79, 128, 190},{33, 212, 82, 162, 129},{52, 230, 72, 184, 166},{49, 227, 71, 196, 213},{28, 196, 76, 239, 255}
},{{52, 230, 102, 5, 53},{52, 230, 102, 5, 53},{21, 195, 102, 62, 10},{21, 195, 102, 62, 10},{38, 215, 98, 93, 74},{18, 190, 95, 128, 247},{22, 198, 103, 160, 147},{30, 209, 105, 177, 147},{23, 198, 117, 203, 235},{51, 229, 100, 225, 215}
},{{33, 212, 129, 5, 245},{53, 230, 129, 23, 193},{47, 226, 140, 35, 230},{57, 207, 133, 72, 191},{26, 198, 130, 116, 174},{25, 200, 128, 128, 85},{46, 224, 126, 155, 175},{15, 185, 120, 184, 242},{23, 198, 117, 203, 235},{39, 218, 138, 230, 21}
},{{37, 216, 148, 4, 233},{46, 225, 155, 39, 247},{46, 225, 155, 39, 247},{42, 221, 172, 60, 227},{12, 179, 144, 97, 202},{28, 205, 153, 128, 76},{27, 201, 148, 156, 94},{32, 211, 155, 180, 88},{27, 205, 144, 209, 19},{39, 218, 138, 230, 21}
},{{34, 212, 179, 17, 208},{34, 212, 179, 17, 208},{29, 207, 178, 60, 216},{29, 207, 178, 60, 216},{36, 215, 179, 118, 178},{28, 207, 180, 128, 99},{23, 198, 176, 141, 104},{23, 198, 171, 173, 83},{43, 221, 180, 213, 19},{31, 210, 182, 237, 18}
},{{40, 219, 187, 22, 218},{47, 220, 195, 29, 169},{39, 218, 210, 47, 132},{37, 215, 204, 62, 132},{29, 199, 209, 99, 236},{29, 208, 206, 128, 7},{23, 198, 194, 154, 13},{26, 204, 207, 188, 33},{22, 198, 214, 207, 77},{23, 198, 200, 223, 66}
},{{40, 219, 187, 22, 218},{39, 218, 210, 47, 132},{48, 227, 227, 66, 246},{27, 204, 232, 76, 247},{15, 185, 227, 97, 176},{34, 212, 229, 128, 23},{37, 216, 226, 167, 60},{37, 216, 226, 167, 60},{23, 198, 218, 202, 69},{23, 198, 200, 223, 66}
}}},{{{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 22, 78, 242},{26, 53, 9, 110, 204},{28, 50, 0, 128, 42},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{28, 50, 30, 193, 117},{30, 48, 46, 213, 81}
},{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 23, 77, 240},{37, 41, 21, 101, 248},{44, 34, 25, 128, 19},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{28, 50, 30, 193, 117},{30, 48, 46, 213, 81}
},{{37, 41, 55, 32, 159},{37, 41, 55, 32, 159},{38, 39, 43, 45, 131},{50, 28, 49, 63, 164},{72, 15, 50, 97, 144},{41, 36, 51, 128, 58},{56, 24, 58, 150, 8},{34, 44, 46, 185, 29},{57, 23, 54, 205, 81},{26, 54, 56, 224, 112}
},{{55, 25, 75, 16, 241},{47, 31, 73, 19, 238},{52, 27, 71, 45, 193},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{36, 41, 79, 128, 70},{75, 13, 79, 148, 25},{43, 35, 74, 188, 122},{45, 33, 81, 208, 9},{43, 35, 76, 228, 36}
},{{29, 49, 110, 3, 197},{55, 25, 107, 18, 211},{56, 24, 107, 47, 224},{42, 36, 103, 62, 211},{23, 58, 105, 95, 159},{44, 34, 101, 128, 111},{43, 35, 109, 141, 108},{40, 37, 105, 177, 81},{36, 41, 95, 212, 2},{24, 56, 111, 234, 33}
},{{55, 25, 125, 1, 214},{39, 38, 119, 19, 225},{56, 24, 133, 58, 27},{60, 23, 133, 63, 21},{26, 53, 124, 104, 191},{32, 45, 128, 128, 137},{60, 22, 116, 157, 71},{44, 34, 131, 185, 176},{51, 28, 135, 209, 253},{31, 46, 129, 234, 222}
},{{26, 53, 146, 3, 58},{42, 36, 158, 13, 25},{23, 58, 148, 60, 1},{64, 20, 145, 79, 14},{61, 24, 141, 101, 73},{56, 24, 154, 128, 190},{30, 48, 148, 152, 166},{48, 33, 155, 182, 184},{39, 39, 153, 214, 203},{32, 46, 153, 228, 247}
},{{26, 53, 174, 14, 11},{26, 53, 182, 18, 15},{26, 53, 180, 42, 53},{56, 24, 176, 74, 94},{75, 13, 180, 101, 19},{30, 48, 178, 128, 152},{31, 46, 186, 151, 152},{69, 17, 178, 181, 215},{32, 46, 185, 210, 225},{52, 27, 178, 231, 254}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{26, 53, 211, 44, 84},{26, 53, 205, 83, 53},{47, 31, 210, 99, 5},{56, 24, 203, 128, 239},{57, 23, 202, 155, 251},{68, 17, 206, 176, 175},{31, 46, 195, 207, 185},{25, 54, 193, 229, 143}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{55, 25, 217, 53, 70},{27, 52, 232, 76, 15},{56, 24, 233, 94, 19},{31, 46, 229, 128, 208},{57, 23, 226, 150, 222},{57, 23, 230, 174, 226},{57, 23, 218, 202, 186},{25, 54, 193, 229, 143}
}},{{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 22, 78, 242},{26, 53, 9, 110, 204},{28, 50, 0, 128, 42},{40, 41, 12, 154, 19},{24, 56, 22, 177, 3},{28, 50, 30, 193, 117},{30, 48, 46, 213, 81}
},{{38, 39, 43, 45, 131},{38, 39, 43, 45, 131},{44, 34, 33, 58, 145},{55, 25, 23, 77, 240},{37, 41, 21, 101, 248},{44, 34, 25, 128, 19},{26, 53, 13, 155, 61},{45, 33, 25, 185, 40},{28, 50, 30, 193, 117},{30, 48, 46, 213, 81}
},{{37, 41, 55, 32, 159},{37, 41, 55, 32, 159},{38, 39, 43, 45, 131},{50, 28, 49, 63, 164},{27, 52, 59, 93, 205},{41, 36, 51, 128, 58},{56, 24, 58, 150, 8},{34, 44, 46, 185, 29},{43, 35, 60, 205, 125},{26, 54, 56, 224, 112}
},{{55, 25, 75, 16, 241},{47, 31, 73, 19, 238},{52, 27, 71, 45, 193},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{36, 41, 79, 128, 70},{48, 30, 81, 140, 119},{43, 35, 74, 188, 122},{45, 33, 81, 208, 9},{43, 35, 76, 228, 36}
},{{29, 49, 110, 3, 197},{55, 25, 107, 18, 211},{28, 50, 91, 52, 197},{42, 36, 103, 62, 211},{23, 58, 105, 95, 159},{44, 34, 101, 128, 111},{43, 35, 109, 141, 108},{40, 37, 105, 177, 81},{36, 41, 95, 212, 2},{24, 56, 111, 234, 33}
},{{55, 25, 125, 1, 214},{39, 38, 119, 19, 225},{56, 24, 133, 58, 27},{56, 24, 133, 58, 27},{26, 53, 124, 104, 191},{32, 45, 128, 128, 137},{24, 56, 115, 149, 66},{44, 34, 131, 185, 176},{51, 28, 135, 209, 253},{31, 46, 129, 234, 222}
},{{26, 53, 146, 3, 58},{42, 36, 158, 13, 25},{23, 58, 148, 60, 1},{50, 42, 158, 71, 69},{61, 24, 141, 101, 73},{26, 53, 150, 128, 189},{30, 48, 148, 152, 166},{48, 33, 155, 182, 184},{39, 39, 153, 214, 203},{32, 46, 153, 228, 247}
},{{26, 53, 174, 14, 11},{26, 53, 182, 18, 15},{26, 53, 180, 42, 53},{56, 24, 176, 74, 94},{23, 58, 174, 97, 102},{30, 48, 178, 128, 152},{31, 46, 186, 151, 152},{31, 46, 189, 180, 188},{32, 46, 185, 210, 225},{52, 27, 178, 231, 254}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{26, 53, 211, 44, 84},{26, 53, 205, 83, 53},{47, 31, 210, 99, 5},{31, 47, 200, 128, 252},{46, 31, 206, 148, 239},{31, 46, 189, 180, 188},{31, 46, 195, 207, 185},{25, 54, 193, 229, 143}
},{{38, 40, 202, 34, 98},{38, 40, 202, 34, 98},{26, 53, 220, 57, 78},{27, 52, 232, 76, 15},{27, 52, 242, 101, 60},{31, 46, 229, 128, 208},{57, 23, 226, 150, 222},{57, 23, 230, 174, 226},{31, 46, 225, 192, 148},{25, 54, 193, 229, 143}
}},{{{26, 53, 72, 20, 247},{23, 58, 46, 42, 173},{26, 53, 18, 87, 238},{26, 53, 18, 87, 238},{26, 53, 9, 110, 204},{26, 53, 0, 128, 43},{26, 53, 13, 155, 61},{24, 56, 22, 177, 3},{26, 53, 33, 196, 78},{26, 54, 56, 224, 112}
},{{26, 53, 72, 20, 247},{23, 58, 46, 42, 173},{31, 64, 32, 60, 199},{23, 58, 24, 75, 250},{27, 52, 13, 97, 199},{29, 49, 23, 128, 63},{26, 53, 13, 155, 61},{24, 56, 25, 182, 11},{26, 53, 33, 196, 78},{26, 54, 56, 224, 112}
},{{26, 53, 72, 20, 247},{23, 58, 65, 24, 240},{23, 58, 46, 42, 173},{20, 62, 54, 81, 201},{27, 52, 59, 93, 205},{26, 54, 54, 128, 30},{27, 52, 46, 163, 38},{27, 52, 60, 176, 39},{24, 56, 57, 209, 76},{26, 54, 56, 224, 112}
},{{23, 58, 78, 14, 233},{26, 53, 72, 20, 247},{28, 54, 78, 40, 200},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{29, 50, 79, 128, 100},{24, 56, 64, 160, 68},{27, 52, 79, 191, 91},{29, 50, 66, 207, 38},{25, 55, 78, 231, 3}
},{{29, 49, 110, 3, 197},{26, 53, 112, 34, 249},{28, 50, 91, 52, 197},{25, 55, 83, 78, 183},{23, 58, 105, 95, 159},{26, 53, 94, 128, 117},{24, 56, 115, 149, 66},{28, 50, 105, 177, 114},{24, 55, 94, 215, 34},{24, 56, 111, 234, 33}
},{{26, 53, 129, 5, 47},{26, 53, 139, 21, 53},{40, 58, 128, 59, 45},{26, 53, 124, 104, 191},{26, 53, 124, 104, 191},{28, 51, 128, 128, 171},{24, 56, 115, 149, 66},{31, 46, 137, 173, 145},{22, 60, 134, 206, 230},{31, 46, 129, 234, 222}
},{{26, 53, 146, 3, 58},{26, 53, 139, 21, 53},{23, 58, 148, 60, 1},{23, 58, 148, 60, 1},{26, 53, 150, 128, 189},{26, 53, 150, 128, 189},{30, 48, 148, 152, 166},{30, 48, 148, 173, 147},{23, 59, 144, 209, 233},{25, 55, 153, 232, 219}
},{{26, 53, 174, 14, 11},{26, 53, 182, 18, 15},{26, 53, 180, 42, 53},{27, 51, 172, 60, 60},{23, 58, 174, 97, 102},{30, 48, 178, 128, 152},{31, 46, 186, 151, 152},{23, 57, 180, 188, 162},{25, 55, 182, 212, 200},{25, 54, 178, 219, 194}
},{{26, 53, 182, 18, 15},{26, 53, 211, 44, 84},{26, 53, 211, 44, 84},{26, 53, 205, 83, 53},{26, 63, 209, 99, 19},{31, 47, 200, 128, 252},{26, 68, 200, 155, 137},{25, 55, 207, 188, 217},{25, 54, 209, 213, 175},{25, 54, 193, 229, 143}
},{{26, 53, 211, 44, 84},{26, 53, 211, 44, 84},{26, 53, 220, 57, 78},{27, 52, 232, 76, 15},{27, 52, 242, 101, 60},{31, 46, 229, 128, 208},{24, 56, 242, 155, 205},{29, 49, 226, 167, 237},{24, 56, 217, 203, 182},{25, 54, 193, 229, 143}
}},{{{30, 80, 61, 26, 237},{30, 80, 61, 26, 237},{34, 80, 25, 70, 169},{22, 86, 22, 78, 156},{26, 76, 1, 128, 83},{26, 76, 1, 128, 83},{26, 76, 1, 128, 83},{24, 56, 22, 177, 3},{27, 69, 28, 189, 123},{22, 74, 60, 219, 63}
},{{30, 80, 61, 26, 237},{30, 80, 61, 26, 237},{34, 80, 25, 70, 169},{22, 86, 22, 78, 156},{25, 71, 26, 118, 182},{25, 71, 26, 118, 182},{31, 87, 11, 150, 81},{25, 67, 27, 188, 121},{27, 69, 28, 189, 123},{22, 74, 60, 219, 63}
},{{30, 80, 61, 26, 237},{30, 80, 61, 26, 237},{28, 83, 46, 62, 219},{20, 93, 51, 81, 175},{12, 78, 52, 101, 151},{23, 72, 45, 128, 118},{30, 70, 67, 155, 4},{16, 81, 51, 179, 69},{22, 74, 60, 219, 63},{22, 74, 60, 219, 63}
},{{27, 75, 79, 21, 142},{27, 75, 79, 21, 142},{23, 77, 79, 37, 180},{23, 58, 80, 76, 181},{14, 74, 80, 108, 252},{23, 74, 79, 128, 22},{30, 70, 67, 155, 4},{24, 86, 74, 188, 60},{23, 84, 78, 205, 68},{22, 86, 78, 228, 110}
},{{17, 68, 104, 4, 189},{35, 87, 108, 23, 139},{32, 84, 103, 62, 169},{32, 84, 103, 62, 169},{23, 58, 105, 95, 159},{25, 83, 94, 128, 16},{25, 84, 90, 150, 5},{21, 78, 105, 177, 7},{39, 77, 92, 213, 103},{23, 85, 103, 251, 90}
},{{26, 53, 129, 5, 47},{32, 72, 119, 19, 136},{12, 79, 125, 49, 139},{25, 64, 137, 60, 104},{26, 53, 124, 104, 191},{27, 74, 128, 128, 213},{29, 72, 124, 161, 12},{29, 72, 124, 161, 12},{13, 75, 123, 194, 123},{21, 78, 128, 238, 177}
},{{19, 80, 147, 7, 83},{14, 74, 154, 40, 114},{14, 74, 154, 40, 114},{22, 87, 161, 88, 60},{22, 87, 161, 88, 60},{25, 84, 160, 128, 233},{23, 84, 153, 152, 198},{23, 89, 159, 183, 226},{23, 59, 144, 209, 233},{25, 55, 153, 232, 219}
},{{28, 67, 178, 16, 121},{28, 67, 178, 16, 121},{14, 73, 171, 45, 69},{15, 71, 172, 60, 92},{23, 58, 174, 97, 102},{30, 92, 180, 128, 242},{13, 74, 174, 156, 241},{19, 65, 179, 165, 192},{27, 56, 189, 204, 214},{29, 75, 182, 237, 137}
},{{20, 68, 198, 31, 13},{20, 68, 198, 31, 13},{20, 76, 212, 52, 60},{26, 53, 205, 83, 53},{26, 63, 209, 99, 19},{25, 84, 199, 128, 142},{26, 68, 200, 155, 137},{31, 73, 200, 185, 163},{13, 75, 195, 210, 211},{29, 75, 182, 237, 137}
},{{32, 75, 213, 47, 21},{32, 75, 213, 47, 21},{20, 76, 212, 52, 60},{25, 84, 227, 83, 121},{25, 84, 227, 83, 121},{23, 79, 219, 128, 135},{24, 67, 226, 167, 154},{24, 67, 226, 167, 154},{24, 56, 217, 203, 182},{29, 75, 182, 237, 137}
}},{{{22, 113, 32, 60, 255},{22, 113, 32, 60, 255},{22, 113, 32, 60, 255},{26, 105, 26, 83, 190},{23, 104, 1, 128, 122},{23, 104, 1, 128, 122},{26, 95, 8, 141, 68},{29, 104, 28, 190, 83},{29, 104, 28, 190, 83},{29, 104, 28, 190, 83}
},{{22, 113, 32, 60, 255},{22, 113, 32, 60, 255},{22, 113, 32, 60, 255},{26, 105, 26, 83, 190},{26, 105, 26, 83, 190},{25, 106, 28, 128, 107},{34, 100, 34, 163, 67},{29, 104, 28, 190, 83},{29, 104, 28, 190, 83},{29, 104, 28, 190, 83}
},{{44, 99, 55, 32, 220},{44, 99, 55, 32, 220},{32, 99, 48, 62, 201},{22, 95, 46, 74, 169},{27, 105, 52, 128, 66},{27, 105, 52, 128, 66},{27, 105, 52, 128, 66},{22, 98, 44, 191, 99},{22, 98, 44, 191, 99},{30, 98, 59, 217, 26}
},{{22, 112, 83, 12, 189},{19, 103, 78, 40, 150},{19, 103, 78, 40, 150},{17, 111, 87, 76, 225},{28, 105, 73, 107, 211},{20, 106, 79, 128, 53},{27, 95, 89, 148, 13},{17, 97, 79, 186, 1},{39, 101, 75, 199, 74},{22, 86, 78, 228, 110}
},{{20, 92, 98, 6, 168},{35, 87, 108, 23, 139},{10, 102, 102, 62, 176},{10, 102, 102, 62, 176},{27, 99, 90, 113, 215},{29, 100, 90, 138, 45},{27, 95, 89, 148, 13},{31, 80, 105, 177, 19},{33, 109, 113, 209, 104},{23, 85, 103, 251, 90}
},{{24, 105, 128, 1, 116},{31, 98, 128, 9, 112},{17, 101, 114, 37, 167},{1, 118, 128, 79, 60},{27, 103, 128, 128, 248},{27, 103, 128, 128, 248},{27, 103, 128, 128, 248},{54, 92, 125, 186, 41},{10, 98, 135, 206, 165},{21, 78, 128, 238, 177}
},{{29, 108, 147, 7, 97},{29, 108, 147, 7, 97},{22, 107, 171, 45, 127},{22, 87, 161, 88, 60},{41, 102, 141, 99, 37},{29, 96, 153, 128, 224},{17, 104, 154, 156, 251},{23, 89, 159, 183, 226},{20, 97, 149, 219, 191},{20, 97, 149, 219, 191}
},{{18, 91, 176, 14, 115},{18, 91, 176, 14, 115},{22, 107, 171, 45, 127},{50, 106, 180, 68, 44},{35, 102, 192, 93, 92},{30, 92, 180, 128, 242},{4, 100, 175, 157, 214},{20, 99, 186, 170, 227},{48, 94, 172, 205, 139},{26, 105, 182, 237, 172}
},{{26, 102, 207, 40, 31},{26, 102, 207, 40, 31},{26, 102, 207, 40, 31},{35, 102, 192, 93, 92},{29, 95, 209, 99, 116},{35, 93, 203, 128, 177},{25, 110, 196, 159, 168},{33, 103, 220, 181, 171},{35, 107, 206, 203, 201},{26, 105, 182, 237, 172}
},{{26, 102, 207, 40, 31},{26, 102, 207, 40, 31},{26, 102, 207, 40, 31},{25, 84, 227, 83, 121},{9, 107, 226, 95, 91},{19, 95, 230, 126, 80},{34, 109, 227, 154, 178},{32, 104, 223, 174, 189},{35, 107, 206, 203, 201},{26, 105, 182, 237, 172}
}},{{{18, 131, 32, 60, 9},{18, 131, 32, 60, 9},{18, 131, 32, 60, 9},{22, 120, 22, 78, 178},{26, 131, 5, 128, 152},{26, 131, 5, 128, 152},{24, 127, 10, 146, 123},{31, 140, 23, 179, 179},{18, 127, 28, 190, 75},{18, 127, 28, 190, 75}
},{{18, 131, 32, 60, 9},{18, 131, 32, 60, 9},{18, 131, 32, 60, 9},{22, 120, 22, 78, 178},{31, 130, 25, 91, 91},{30, 112, 28, 128, 118},{24, 127, 10, 146, 123},{25, 126, 33, 187, 121},{18, 127, 28, 190, 75},{18, 127, 28, 190, 75}
},{{9, 132, 51, 36, 30},{9, 132, 51, 36, 30},{26, 130, 48, 62, 18},{26, 130, 48, 62, 18},{17, 144, 55, 95, 109},{21, 130, 45, 128, 190},{20, 126, 69, 164, 15},{22, 128, 56, 186, 144},{22, 128, 56, 186, 144},{40, 126, 62, 230, 10}
},{{9, 131, 79, 14, 79},{10, 126, 77, 21, 168},{27, 133, 78, 40, 124},{9, 129, 80, 73, 21},{28, 105, 73, 107, 211},{18, 130, 79, 128, 219},{20, 126, 69, 164, 15},{23, 121, 74, 188, 28},{23, 125, 82, 202, 118},{10, 128, 68, 234, 160}
},{{23, 139, 105, 4, 117},{27, 132, 109, 24, 110},{29, 120, 102, 62, 185},{29, 120, 102, 62, 185},{9, 126, 98, 99, 242},{31, 125, 91, 128, 61},{1, 132, 102, 147, 244},{34, 133, 105, 177, 251},{23, 125, 82, 202, 118},{37, 128, 107, 220, 150}
},{{24, 105, 128, 1, 116},{28, 131, 119, 19, 127},{27, 135, 140, 57, 173},{5, 128, 132, 74, 207},{26, 125, 128, 128, 227},{26, 125, 128, 128, 227},{20, 137, 119, 156, 242},{16, 145, 129, 174, 42},{1, 127, 136, 210, 160},{6, 135, 124, 239, 150}
},{{8, 128, 153, 11, 158},{9, 130, 150, 19, 138},{27, 135, 140, 57, 173},{9, 129, 169, 70, 227},{20, 114, 145, 97, 18},{33, 132, 152, 128, 57},{47, 128, 145, 152, 34},{42, 130, 158, 183, 5},{1, 127, 156, 208, 182},{9, 128, 167, 226, 72}
},{{28, 133, 183, 23, 189},{28, 133, 183, 23, 189},{28, 131, 171, 45, 157},{20, 128, 172, 60, 128},{23, 124, 184, 115, 36},{25, 121, 165, 128, 193},{27, 125, 181, 164, 243},{27, 125, 181, 164, 243},{35, 131, 185, 212, 73},{24, 117, 186, 234, 185}
},{{28, 133, 183, 23, 189},{16, 127, 207, 40, 12},{16, 127, 207, 40, 12},{22, 134, 208, 62, 250},{31, 132, 215, 103, 175},{18, 122, 205, 128, 161},{25, 110, 196, 159, 168},{36, 128, 207, 188, 83},{36, 128, 207, 188, 83},{9, 127, 198, 225, 213}
},{{16, 127, 207, 40, 12},{16, 127, 207, 40, 12},{27, 142, 216, 61, 244},{11, 135, 227, 66, 169},{31, 132, 215, 103, 175},{25, 132, 235, 128, 114},{34, 109, 227, 154, 178},{1, 127, 231, 181, 168},{1, 127, 217, 202, 233},{9, 127, 198, 225, 213}
}},{{{29, 145, 62, 26, 44},{29, 145, 62, 26, 44},{24, 143, 32, 60, 15},{28, 158, 29, 79, 84},{16, 145, 12, 102, 111},{22, 146, 2, 128, 130},{16, 145, 14, 158, 149},{19, 158, 22, 177, 174},{30, 149, 31, 194, 210},{30, 149, 31, 194, 210}
},{{29, 145, 62, 26, 44},{29, 145, 62, 26, 44},{24, 143, 32, 60, 15},{28, 158, 29, 79, 84},{16, 145, 12, 102, 111},{22, 152, 32, 128, 170},{8, 145, 31, 152, 154},{19, 158, 22, 177, 174},{30, 149, 31, 194, 210},{30, 149, 31, 194, 210}
},{{29, 145, 62, 26, 44},{29, 145, 62, 26, 44},{14, 152, 62, 50, 30},{14, 153, 55, 70, 98},{15, 153, 66, 101, 53},{29, 151, 57, 128, 183},{5, 156, 46, 150, 165},{16, 145, 47, 176, 154},{22, 150, 44, 191, 151},{16, 145, 56, 224, 221}
},{{35, 151, 92, 8, 100},{24, 151, 78, 40, 109},{24, 151, 78, 40, 109},{39, 149, 84, 79, 45},{15, 153, 66, 101, 53},{17, 156, 79, 128, 198},{16, 145, 78, 150, 221},{23, 162, 74, 188, 199},{25, 168, 65, 207, 187},{16, 145, 75, 238, 160}
},{{23, 139, 105, 4, 117},{17, 153, 93, 22, 71},{24, 146, 103, 62, 87},{24, 146, 103, 62, 87},{20, 156, 99, 93, 50},{22, 154, 88, 128, 208},{16, 145, 103, 170, 200},{32, 148, 105, 177, 232},{26, 163, 123, 212, 146},{24, 153, 105, 251, 151}
},{{33, 157, 128, 3, 187},{21, 172, 129, 23, 171},{13, 147, 123, 45, 76},{15, 149, 135, 63, 166},{18, 144, 123, 96, 29},{27, 147, 128, 128, 12},{23, 159, 134, 163, 41},{16, 145, 129, 174, 42},{26, 163, 123, 212, 146},{17, 164, 131, 233, 91}
},{{12, 149, 153, 5, 129},{14, 150, 159, 24, 155},{30, 153, 171, 45, 133},{26, 160, 172, 60, 174},{15, 152, 149, 115, 245},{10, 153, 157, 128, 10},{35, 166, 148, 151, 2},{16, 145, 158, 172, 55},{32, 166, 144, 209, 67},{6, 151, 144, 224, 101}
},{{17, 157, 178, 16, 170},{14, 150, 181, 29, 180},{30, 153, 171, 45, 133},{26, 160, 172, 60, 174},{37, 146, 181, 118, 240},{11, 154, 178, 128, 39},{34, 177, 179, 156, 56},{16, 145, 187, 169, 23},{10, 157, 180, 213, 114},{27, 165, 174, 225, 117}
},{{35, 153, 193, 27, 228},{35, 153, 193, 27, 228},{15, 149, 214, 48, 248},{18, 144, 204, 84, 158},{30, 159, 209, 99, 183},{28, 158, 204, 129, 75},{28, 158, 204, 129, 75},{36, 166, 202, 186, 118},{16, 145, 216, 205, 16},{16, 145, 205, 218, 18}
},{{35, 153, 193, 27, 228},{35, 153, 193, 27, 228},{15, 149, 214, 48, 248},{22, 163, 216, 81, 184},{18, 144, 242, 100, 144},{26, 153, 220, 128, 91},{16, 145, 230, 163, 64},{16, 145, 228, 186, 91},{16, 145, 218, 202, 21},{16, 145, 205, 218, 18}
}},{{{27, 181, 53, 33, 62},{27, 181, 53, 33, 62},{29, 181, 32, 60, 48},{33, 177, 21, 80, 81},{33, 177, 13, 99, 122},{23, 175, 0, 128, 188},{34, 176, 12, 155, 129},{34, 176, 20, 173, 175},{34, 176, 37, 203, 248},{34, 176, 54, 223, 255}
},{{27, 181, 53, 33, 62},{27, 181, 53, 33, 62},{29, 181, 32, 60, 48},{22, 178, 29, 79, 114},{33, 177, 13, 99, 122},{34, 177, 21, 128, 130},{34, 176, 12, 155, 129},{32, 174, 25, 183, 164},{34, 176, 37, 203, 248},{34, 176, 54, 223, 255}
},{{27, 181, 53, 33, 62},{27, 181, 53, 33, 62},{27, 183, 47, 53, 50},{26, 183, 55, 66, 92},{33, 177, 48, 110, 74},{26, 177, 51, 128, 156},{34, 176, 57, 162, 141},{23, 166, 56, 186, 183},{34, 176, 39, 205, 252},{34, 176, 54, 223, 255}
},{{29, 181, 84, 12, 116},{28, 181, 73, 18, 118},{33, 177, 72, 59, 103},{26, 183, 63, 79, 89},{26, 183, 81, 98, 26},{17, 181, 79, 128, 239},{23, 171, 77, 146, 231},{26, 180, 74, 188, 220},{20, 182, 73, 198, 169},{34, 176, 78, 241, 169}
},{{29, 181, 115, 2, 93},{28, 180, 94, 14, 124},{20, 184, 103, 62, 113},{20, 184, 103, 62, 113},{13, 179, 98, 99, 59},{34, 176, 100, 128, 242},{34, 177, 96, 144, 231},{26, 178, 105, 177, 244},{26, 178, 105, 177, 244},{34, 177, 114, 234, 143}
},{{29, 181, 115, 2, 93},{21, 172, 129, 23, 171},{33, 177, 122, 54, 88},{33, 177, 122, 54, 88},{34, 176, 130, 107, 255},{31, 181, 128, 128, 46},{34, 177, 133, 155, 9},{26, 178, 105, 177, 244},{26, 163, 123, 212, 146},{34, 177, 134, 225, 112}
},{{33, 167, 153, 5, 158},{34, 177, 157, 16, 154},{33, 177, 173, 56, 129},{12, 179, 144, 97, 202},{34, 177, 145, 104, 238},{23, 175, 146, 128, 46},{19, 179, 147, 152, 47},{50, 182, 151, 180, 35},{27, 192, 144, 209, 30},{34, 177, 134, 225, 112}
},{{29, 179, 169, 11, 136},{29, 181, 181, 18, 139},{33, 177, 173, 56, 129},{33, 177, 173, 56, 129},{33, 177, 171, 99, 220},{25, 181, 176, 136, 16},{34, 177, 179, 156, 56},{20, 178, 173, 161, 46},{34, 176, 179, 201, 108},{23, 183, 182, 237, 127}
},{{30, 179, 199, 31, 241},{30, 179, 199, 31, 241},{31, 178, 214, 48, 207},{28, 182, 206, 69, 165},{29, 199, 209, 99, 236},{21, 179, 211, 134, 119},{21, 178, 200, 153, 114},{23, 177, 207, 188, 81},{23, 177, 207, 188, 81},{30, 191, 203, 221, 51}
},{{30, 179, 199, 31, 241},{30, 179, 199, 31, 241},{26, 183, 226, 65, 138},{33, 177, 229, 72, 185},{15, 185, 227, 97, 176},{21, 179, 233, 128, 75},{34, 176, 229, 146, 97},{34, 176, 230, 182, 70},{34, 176, 223, 194, 11},{34, 176, 208, 215, 17}
}},{{{24, 200, 59, 29, 114},{24, 200, 59, 29, 114},{23, 198, 44, 44, 85},{23, 198, 15, 93, 7},{23, 198, 10, 108, 51},{25, 203, 0, 128, 214},{23, 198, 10, 148, 203},{23, 198, 23, 180, 246},{23, 198, 33, 198, 178},{24, 201, 43, 211, 173}
},{{24, 200, 59, 29, 114},{24, 200, 59, 29, 114},{23, 198, 44, 44, 85},{30, 187, 29, 78, 114},{30, 209, 13, 99, 37},{28, 206, 28, 128, 202},{23, 198, 13, 155, 195},{23, 198, 23, 180, 246},{23, 198, 33, 198, 178},{24, 201, 43, 211, 173}
},{{24, 200, 59, 29, 114},{24, 200, 59, 29, 114},{23, 198, 44, 44, 85},{38, 206, 46, 62, 124},{21, 186, 55, 93, 65},{24, 201, 45, 128, 248},{30, 208, 57, 148, 231},{23, 198, 49, 167, 195},{24, 201, 43, 211, 173},{23, 198, 58, 226, 141}
},{{27, 205, 93, 8, 7},{24, 200, 59, 29, 114},{30, 188, 78, 40, 64},{33, 212, 83, 78, 108},{20, 194, 80, 109, 111},{28, 206, 79, 128, 153},{35, 189, 76, 155, 205},{25, 198, 74, 188, 173},{25, 198, 74, 188, 173},{28, 196, 76, 239, 255}
},{{23, 198, 109, 3, 59},{26, 203, 119, 19, 49},{26, 200, 103, 62, 15},{26, 200, 103, 62, 15},{38, 215, 98, 93, 74},{28, 206, 79, 128, 153},{22, 198, 103, 160, 147},{26, 204, 98, 172, 156},{23, 198, 117, 203, 235},{27, 205, 104, 251, 193}
},{{23, 198, 133, 1, 209},{26, 203, 119, 19, 49},{27, 196, 135, 39, 251},{26, 200, 103, 62, 15},{26, 198, 130, 116, 174},{25, 200, 128, 128, 85},{23, 198, 120, 152, 181},{30, 209, 105, 177, 147},{23, 198, 117, 203, 235},{23, 198, 141, 228, 60}
},{{29, 202, 141, 2, 220},{27, 196, 135, 39, 251},{33, 204, 176, 59, 226},{33, 204, 176, 59, 226},{28, 205, 153, 128, 76},{28, 205, 153, 128, 76},{27, 201, 148, 156, 94},{32, 211, 155, 180, 88},{27, 205, 144, 209, 19},{23, 198, 141, 228, 60}
},{{34, 212, 179, 17, 208},{23, 199, 189, 23, 254},{29, 207, 178, 60, 216},{29, 207, 178, 60, 216},{26, 203, 180, 128, 97},{26, 203, 180, 128, 97},{23, 198, 176, 141, 104},{23, 198, 171, 173, 83},{34, 176, 179, 201, 108},{23, 199, 182, 237, 15}
},{{23, 199, 189, 23, 254},{23, 199, 189, 23, 254},{41, 200, 211, 49, 135},{23, 198, 193, 75, 223},{29, 199, 209, 99, 236},{26, 204, 199, 128, 21},{23, 198, 194, 154, 13},{26, 204, 207, 188, 33},{26, 204, 207, 188, 33},{23, 198, 200, 223, 66}
},{{23, 199, 189, 23, 254},{23, 199, 189, 23, 254},{27, 204, 232, 76, 247},{27, 204, 232, 76, 247},{27, 204, 232, 76, 247},{26, 204, 222, 128, 12},{23, 198, 242, 155, 60},{22, 197, 227, 188, 8},{23, 198, 218, 202, 69},{23, 198, 200, 223, 66}
}},{{{39, 218, 49, 38, 110},{39, 218, 49, 38, 110},{47, 226, 32, 60, 85},{44, 222, 26, 70, 42},{51, 229, 10, 107, 51},{33, 212, 0, 128, 241},{43, 222, 11, 151, 237},{32, 211, 23, 180, 212},{37, 215, 30, 192, 168},{42, 220, 40, 206, 148}
},{{39, 218, 49, 38, 110},{39, 218, 49, 38, 110},{47, 226, 32, 60, 85},{44, 222, 26, 70, 42},{43, 221, 22, 108, 8},{28, 206, 28, 128, 202},{52, 230, 37, 152, 235},{32, 211, 23, 180, 212},{37, 215, 30, 192, 168},{42, 220, 40, 206, 148}
},{{40, 216, 53, 33, 96},{40, 216, 53, 33, 96},{39, 218, 49, 38, 110},{38, 217, 46, 62, 107},{52, 229, 48, 124, 25},{30, 209, 45, 128, 230},{30, 208, 57, 148, 231},{36, 215, 56, 186, 245},{42, 220, 40, 206, 148},{23, 198, 58, 226, 141}
},{{54, 231, 83, 12, 10},{50, 224, 78, 40, 48},{50, 224, 78, 40, 48},{33, 212, 83, 78, 108},{36, 215, 77, 114, 72},{33, 212, 79, 128, 190},{33, 212, 82, 162, 129},{52, 230, 72, 184, 166},{49, 227, 71, 196, 213},{28, 196, 76, 239, 255}
},{{52, 230, 102, 5, 53},{52, 230, 102, 5, 53},{26, 200, 103, 62, 15},{33, 212, 83, 78, 108},{38, 215, 98, 93, 74},{33, 212, 79, 128, 190},{46, 224, 112, 155, 161},{30, 209, 105, 177, 147},{51, 229, 100, 225, 215},{51, 229, 100, 225, 215}
},{{33, 212, 129, 5, 245},{53, 230, 129, 23, 193},{47, 226, 140, 35, 230},{57, 207, 133, 72, 191},{26, 198, 130, 116, 174},{41, 220, 129, 131, 115},{46, 224, 126, 155, 175},{30, 209, 105, 177, 147},{23, 198, 117, 203, 235},{39, 218, 138, 230, 21}
},{{37, 216, 148, 4, 233},{46, 225, 155, 39, 247},{46, 225, 155, 39, 247},{42, 221, 172, 60, 227},{28, 205, 153, 128, 76},{28, 205, 153, 128, 76},{27, 201, 148, 156, 94},{32, 211, 155, 180, 88},{27, 205, 144, 209, 19},{39, 218, 138, 230, 21}
},{{34, 212, 179, 17, 208},{34, 212, 179, 17, 208},{29, 207, 178, 60, 216},{29, 207, 178, 60, 216},{36, 215, 179, 118, 178},{28, 207, 180, 128, 99},{23, 198, 176, 141, 104},{23, 198, 171, 173, 83},{43, 221, 180, 213, 19},{31, 210, 182, 237, 18}
},{{40, 219, 187, 22, 218},{47, 220, 195, 29, 169},{39, 218, 210, 47, 132},{37, 215, 204, 62, 132},{29, 199, 209, 99, 236},{29, 208, 206, 128, 7},{23, 198, 194, 154, 13},{26, 204, 207, 188, 33},{26, 204, 207, 188, 33},{23, 198, 200, 223, 66}
},{{40, 219, 187, 22, 218},{39, 218, 210, 47, 132},{48, 227, 227, 66, 246},{27, 204, 232, 76, 247},{34, 212, 229, 128, 23},{34, 212, 229, 128, 23},{37, 216, 226, 167, 60},{37, 216, 226, 167, 60},{23, 198, 218, 202, 69},{23, 198, 200, 223, 66}
}}},{{{{54, 25, 64, 24, 243},{55, 25, 35, 55, 190},{55, 25, 35, 55, 190},{55, 25, 22, 78, 242},{57, 26, 13, 97, 203},{52, 27, 0, 128, 43},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{57, 24, 38, 204, 79},{57, 24, 43, 210, 92}
},{{54, 25, 64, 24, 243},{55, 25, 35, 55, 190},{55, 25, 35, 55, 190},{55, 25, 23, 77, 240},{72, 15, 23, 112, 164},{52, 27, 25, 128, 50},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{57, 24, 38, 204, 79},{57, 24, 43, 210, 92}
},{{54, 25, 64, 24, 243},{54, 25, 64, 24, 243},{56, 24, 55, 42, 185},{50, 28, 49, 63, 164},{72, 15, 50, 97, 144},{56, 24, 52, 128, 16},{56, 24, 58, 150, 8},{57, 23, 58, 176, 32},{57, 23, 54, 205, 81},{57, 23, 63, 230, 115}
},{{55, 25, 75, 16, 241},{55, 25, 75, 16, 241},{52, 27, 71, 45, 193},{53, 26, 83, 78, 182},{54, 25, 77, 114, 148},{51, 28, 79, 128, 100},{75, 13, 79, 148, 25},{56, 24, 79, 167, 76},{68, 17, 75, 202, 80},{57, 23, 79, 223, 58}
},{{55, 25, 111, 3, 198},{55, 25, 107, 18, 211},{56, 24, 107, 47, 224},{51, 28, 103, 62, 242},{72, 15, 96, 94, 253},{56, 24, 104, 128, 76},{76, 13, 107, 158, 48},{69, 17, 101, 182, 3},{68, 17, 102, 193, 118},{76, 13, 105, 235, 71}
},{{55, 25, 125, 1, 214},{68, 17, 132, 22, 67},{56, 24, 133, 58, 27},{60, 23, 133, 63, 21},{56, 24, 139, 97, 78},{56, 24, 128, 128, 164},{60, 22, 116, 157, 71},{57, 24, 133, 182, 150},{51, 28, 135, 209, 253},{61, 21, 130, 236, 194}
},{{55, 25, 148, 4, 58},{58, 23, 138, 23, 52},{61, 21, 171, 45, 42},{64, 20, 145, 79, 14},{61, 24, 141, 101, 73},{56, 24, 154, 128, 190},{57, 23, 145, 159, 164},{68, 17, 155, 175, 229},{57, 23, 149, 194, 253},{57, 23, 154, 244, 196}
},{{55, 25, 174, 14, 10},{55, 25, 182, 18, 14},{61, 21, 171, 45, 42},{56, 24, 176, 74, 94},{75, 13, 180, 101, 19},{55, 25, 180, 125, 99},{57, 23, 173, 157, 154},{69, 17, 178, 181, 215},{68, 17, 185, 200, 160},{52, 27, 178, 231, 254}
},{{55, 25, 200, 33, 67},{55, 25, 200, 33, 67},{55, 25, 213, 47, 80},{68, 17, 201, 73, 81},{55, 25, 210, 99, 27},{56, 24, 203, 128, 239},{57, 23, 202, 155, 251},{68, 17, 206, 176, 175},{57, 23, 214, 207, 179},{57, 23, 191, 231, 242}
},{{55, 25, 200, 33, 67},{55, 25, 200, 33, 67},{55, 25, 217, 53, 70},{50, 29, 232, 77, 14},{56, 24, 233, 94, 19},{56, 24, 229, 128, 193},{57, 23, 226, 150, 222},{57, 23, 230, 174, 226},{57, 23, 218, 202, 186},{57, 23, 209, 213, 174}
}},{{{54, 25, 64, 24, 243},{55, 25, 35, 55, 190},{55, 25, 35, 55, 190},{55, 25, 22, 78, 242},{57, 26, 13, 97, 203},{52, 27, 0, 128, 43},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{57, 24, 38, 204, 79},{57, 24, 43, 210, 92}
},{{54, 25, 64, 24, 243},{55, 25, 35, 55, 190},{55, 25, 35, 55, 190},{55, 25, 23, 77, 240},{57, 26, 13, 97, 203},{52, 27, 25, 128, 50},{57, 23, 12, 153, 63},{57, 23, 23, 180, 9},{57, 24, 38, 204, 79},{57, 24, 43, 210, 92}
},{{54, 25, 64, 24, 243},{54, 25, 64, 24, 243},{51, 27, 46, 62, 188},{50, 28, 49, 63, 164},{56, 24, 52, 128, 16},{56, 24, 52, 128, 16},{56, 24, 58, 150, 8},{57, 23, 58, 176, 32},{57, 23, 54, 205, 81},{57, 23, 63, 230, 115}
},{{55, 25, 75, 16, 241},{55, 25, 75, 16, 241},{52, 27, 71, 45, 193},{53, 26, 83, 78, 182},{54, 25, 77, 114, 148},{51, 28, 79, 128, 100},{56, 24, 79, 167, 76},{56, 24, 79, 167, 76},{45, 33, 81, 208, 9},{57, 23, 79, 223, 58}
},{{55, 25, 111, 3, 198},{55, 25, 107, 18, 211},{51, 28, 103, 62, 242},{51, 28, 103, 62, 242},{56, 24, 104, 128, 76},{56, 24, 104, 128, 76},{56, 24, 109, 137, 64},{45, 33, 97, 173, 68},{53, 27, 91, 197, 52},{53, 26, 105, 251, 57}
},{{55, 25, 125, 1, 214},{55, 25, 130, 12, 36},{56, 24, 133, 58, 27},{56, 24, 133, 58, 27},{56, 24, 139, 97, 78},{56, 24, 128, 128, 164},{57, 23, 119, 163, 126},{57, 24, 133, 182, 150},{51, 28, 135, 209, 253},{61, 21, 130, 236, 194}
},{{55, 25, 148, 4, 58},{58, 23, 138, 23, 52},{56, 24, 133, 58, 27},{50, 42, 158, 71, 69},{61, 24, 141, 101, 73},{56, 24, 154, 128, 190},{57, 23, 145, 159, 164},{48, 33, 155, 182, 184},{57, 23, 149, 194, 253},{57, 23, 154, 244, 196}
},{{55, 25, 174, 14, 10},{55, 25, 182, 18, 14},{44, 33, 171, 45, 15},{56, 24, 176, 74, 94},{55, 25, 180, 125, 99},{55, 25, 180, 125, 99},{57, 23, 173, 157, 154},{57, 23, 188, 178, 164},{52, 27, 178, 231, 254},{52, 27, 178, 231, 254}
},{{55, 25, 200, 33, 67},{55, 25, 200, 33, 67},{55, 25, 213, 47, 80},{56, 24, 216, 80, 44},{55, 25, 210, 99, 27},{56, 24, 203, 128, 239},{57, 23, 202, 155, 251},{57, 23, 188, 178, 164},{57, 23, 214, 207, 179},{57, 23, 191, 231, 242}
},{{55, 25, 200, 33, 67},{55, 25, 200, 33, 67},{55, 25, 217, 53, 70},{50, 29, 232, 77, 14},{56, 24, 233, 94, 19},{56, 24, 229, 128, 193},{57, 23, 226, 150, 222},{57, 23, 230, 174, 226},{57, 23, 218, 202, 186},{57, 23, 209, 213, 174}
}},{{{52, 50, 76, 16, 222},{37, 46, 55, 32, 152},{61, 51, 36, 63, 145},{39, 47, 22, 78, 212},{52, 55, 0, 128, 7},{52, 55, 0, 128, 7},{52, 55, 0, 128, 7},{46, 45, 20, 173, 62},{46, 45, 20, 173, 62},{30, 48, 46, 213, 81}
},{{52, 50, 76, 16, 222},{37, 46, 55, 32, 152},{61, 51, 36, 63, 145},{39, 47, 22, 78, 212},{37, 41, 21, 101, 248},{51, 46, 28, 128, 5},{51, 46, 28, 128, 5},{67, 50, 22, 178, 81},{35, 46, 32, 195, 106},{30, 48, 46, 213, 81}
},{{52, 50, 76, 16, 222},{37, 46, 55, 32, 152},{42, 46, 49, 62, 143},{60, 57, 56, 80, 233},{58, 63, 52, 101, 208},{46, 53, 53, 128, 42},{64, 51, 63, 151, 95},{51, 44, 42, 181, 4},{43, 35, 60, 205, 125},{30, 48, 50, 217, 65}
},{{52, 50, 76, 16, 222},{52, 50, 76, 16, 222},{56, 45, 84, 39, 226},{26, 53, 75, 74, 170},{26, 53, 73, 95, 189},{66, 53, 79, 128, 60},{64, 51, 63, 151, 95},{44, 55, 74, 188, 105},{58, 50, 81, 207, 18},{43, 35, 76, 228, 36}
},{{58, 61, 103, 4, 224},{52, 48, 119, 19, 228},{52, 56, 103, 62, 209},{52, 56, 103, 62, 209},{62, 61, 101, 93, 191},{44, 49, 90, 128, 67},{60, 55, 112, 156, 99},{58, 44, 105, 177, 74},{59, 51, 113, 214, 43},{59, 51, 113, 214, 43}
},{{33, 55, 124, 1, 239},{52, 48, 119, 19, 228},{40, 58, 128, 59, 45},{40, 58, 128, 59, 45},{59, 44, 124, 110, 129},{49, 54, 128, 128, 131},{65, 51, 130, 152, 236},{44, 34, 131, 185, 176},{59, 51, 113, 214, 43},{31, 46, 129, 234, 222}
},{{53, 41, 147, 7, 12},{44, 54, 174, 30, 46},{50, 42, 158, 71, 69},{50, 42, 158, 71, 69},{55, 48, 164, 128, 167},{55, 48, 164, 128, 167},{59, 58, 148, 156, 141},{48, 33, 155, 182, 184},{39, 39, 153, 214, 203},{32, 46, 153, 228, 247}
},{{54, 42, 177, 15, 38},{44, 54, 174, 30, 46},{46, 64, 171, 45, 108},{50, 42, 158, 71, 69},{69, 59, 178, 94, 22},{49, 42, 180, 128, 171},{31, 46, 186, 151, 152},{44, 42, 170, 187, 147},{32, 46, 185, 210, 225},{44, 50, 182, 237, 193}
},{{54, 42, 177, 15, 38},{60, 43, 195, 28, 76},{52, 36, 212, 45, 109},{61, 51, 212, 67, 29},{52, 62, 209, 99, 60},{55, 51, 191, 128, 191},{46, 31, 206, 148, 239},{63, 56, 207, 188, 240},{63, 56, 207, 188, 240},{44, 50, 182, 237, 193}
},{{52, 36, 212, 45, 109},{52, 36, 212, 45, 109},{47, 41, 222, 68, 24},{50, 29, 232, 77, 14},{59, 50, 221, 109, 61},{53, 53, 217, 128, 221},{64, 56, 226, 167, 185},{64, 56, 226, 167, 185},{31, 46, 225, 192, 148},{44, 50, 182, 237, 193}
}},{{{47, 67, 62, 26, 204},{47, 67, 62, 26, 204},{52, 79, 22, 78, 167},{52, 79, 22, 78, 167},{59, 87, 11, 106, 137},{54, 75, 4, 128, 125},{52, 86, 13, 157, 118},{53, 68, 23, 180, 86},{53, 68, 23, 180, 86},{49, 83, 59, 218, 7}
},{{47, 67, 62, 26, 204},{47, 67, 62, 26, 204},{47, 66, 32, 60, 245},{52, 79, 22, 78, 167},{61, 83, 25, 98, 145},{52, 74, 22, 128, 108},{52, 86, 13, 157, 118},{53, 68, 23, 180, 86},{37, 80, 29, 190, 82},{49, 83, 59, 218, 7}
},{{47, 67, 62, 26, 204},{47, 67, 62, 26, 204},{36, 74, 49, 62, 229},{55, 78, 64, 75, 246},{54, 77, 48, 91, 148},{58, 80, 52, 128, 90},{58, 80, 52, 128, 90},{47, 74, 56, 186, 99},{47, 74, 56, 186, 99},{49, 83, 59, 218, 7}
},{{61, 83, 80, 13, 183},{47, 67, 62, 26, 204},{56, 69, 78, 40, 159},{55, 78, 64, 75, 246},{61, 83, 61, 104, 191},{50, 81, 85, 128, 50},{60, 76, 82, 158, 56},{61, 83, 76, 179, 21},{39, 77, 92, 213, 103},{56, 87, 69, 233, 71}
},{{44, 64, 105, 4, 133},{44, 78, 113, 29, 138},{52, 86, 102, 62, 190},{52, 86, 102, 62, 190},{62, 61, 101, 93, 191},{58, 69, 106, 128, 17},{61, 83, 108, 155, 29},{40, 79, 105, 177, 59},{39, 77, 92, 213, 103},{42, 81, 102, 250, 99}
},{{57, 67, 130, 7, 123},{48, 82, 119, 19, 130},{56, 74, 123, 38, 171},{61, 83, 125, 75, 220},{51, 74, 128, 128, 253},{51, 74, 128, 128, 253},{51, 74, 128, 128, 253},{54, 92, 125, 186, 41},{55, 68, 144, 209, 182},{21, 78, 128, 238, 177}
},{{50, 67, 147, 7, 97},{50, 67, 147, 7, 97},{48, 96, 141, 48, 105},{61, 83, 147, 76, 53},{63, 77, 165, 106, 57},{42, 70, 161, 128, 201},{46, 75, 148, 156, 233},{43, 86, 150, 190, 209},{55, 68, 144, 209, 182},{34, 71, 163, 232, 170}
},{{50, 69, 165, 9, 95},{58, 65, 189, 23, 85},{46, 64, 171, 45, 108},{71, 85, 185, 76, 99},{53, 96, 177, 108, 12},{53, 88, 180, 128, 221},{50, 105, 180, 157, 246},{39, 57, 183, 168, 133},{48, 94, 172, 205, 139},{61, 82, 174, 224, 165}
},{{50, 69, 165, 9, 95},{58, 65, 189, 23, 85},{46, 80, 204, 58, 12},{56, 76, 212, 67, 103},{49, 69, 209, 99, 66},{44, 78, 206, 128, 168},{44, 78, 206, 128, 168},{44, 86, 207, 188, 141},{61, 82, 202, 221, 252},{61, 82, 202, 221, 252}
},{{61, 83, 209, 42, 17},{61, 83, 209, 42, 17},{51, 93, 214, 50, 14},{61, 83, 233, 79, 76},{49, 69, 209, 99, 66},{49, 80, 234, 128, 143},{49, 80, 234, 128, 143},{44, 86, 207, 188, 141},{44, 86, 207, 188, 141},{61, 82, 202, 221, 252}
}},{{{49, 102, 63, 25, 245},{49, 102, 63, 25, 245},{58, 111, 32, 60, 205},{46, 104, 25, 89, 130},{57, 103, 10, 108, 188},{52, 104, 0, 128, 88},{44, 101, 11, 150, 80},{44, 101, 11, 150, 80},{34, 96, 28, 190, 100},{61, 86, 45, 213, 23}
},{{49, 102, 63, 25, 245},{49, 102, 63, 25, 245},{58, 111, 32, 60, 205},{46, 104, 25, 89, 130},{46, 104, 25, 89, 130},{57, 108, 28, 128, 77},{44, 101, 11, 150, 80},{61, 87, 24, 182, 64},{34, 96, 28, 190, 100},{61, 86, 45, 213, 23}
},{{49, 102, 63, 25, 245},{49, 102, 63, 25, 245},{51, 103, 46, 62, 192},{51, 103, 46, 62, 192},{58, 103, 52, 106, 135},{62, 103, 51, 132, 106},{62, 103, 51, 132, 106},{56, 97, 43, 181, 67},{50, 109, 64, 195, 88},{49, 83, 59, 218, 7}
},{{49, 102, 63, 25, 245},{49, 102, 63, 25, 245},{50, 96, 78, 40, 176},{54, 114, 76, 93, 209},{54, 114, 76, 93, 209},{49, 102, 66, 128, 17},{62, 93, 80, 161, 22},{61, 83, 76, 179, 21},{39, 101, 75, 199, 74},{37, 107, 76, 240, 118}
},{{43, 121, 103, 4, 181},{53, 107, 119, 19, 190},{52, 86, 102, 62, 190},{52, 86, 102, 62, 190},{67, 109, 98, 95, 151},{49, 100, 95, 132, 10},{51, 101, 106, 167, 31},{51, 101, 106, 167, 31},{51, 112, 82, 208, 69},{60, 103, 93, 225, 99}
},{{51, 105, 129, 23, 72},{51, 105, 129, 23, 72},{48, 96, 141, 48, 105},{61, 83, 125, 75, 220},{41, 102, 141, 99, 37},{53, 102, 128, 128, 215},{53, 102, 128, 128, 215},{54, 92, 125, 186, 41},{47, 105, 144, 209, 131},{63, 102, 142, 218, 137}
},{{48, 106, 147, 7, 74},{51, 105, 129, 23, 72},{48, 96, 141, 48, 105},{61, 83, 147, 76, 53},{41, 102, 141, 99, 37},{47, 104, 154, 128, 217},{54, 101, 146, 160, 229},{54, 101, 146, 160, 229},{47, 105, 144, 209, 131},{63, 102, 142, 218, 137}
},{{48, 106, 147, 7, 74},{58, 91, 165, 16, 80},{50, 106, 180, 68, 44},{50, 106, 180, 68, 44},{53, 96, 177, 108, 12},{57, 105, 180, 128, 224},{50, 105, 180, 157, 246},{50, 105, 180, 157, 246},{48, 94, 172, 205, 139},{54, 107, 185, 235, 139}
},{{26, 102, 207, 40, 31},{26, 102, 207, 40, 31},{51, 93, 214, 50, 14},{56, 101, 192, 64, 89},{52, 104, 209, 99, 106},{60, 105, 197, 134, 146},{50, 105, 180, 157, 246},{63, 96, 207, 188, 168},{35, 107, 206, 203, 201},{54, 107, 185, 235, 139}
},{{51, 93, 214, 50, 14},{51, 93, 214, 50, 14},{51, 93, 214, 50, 14},{61, 83, 233, 79, 76},{52, 104, 209, 99, 106},{37, 107, 229, 128, 175},{34, 109, 227, 154, 178},{59, 109, 226, 167, 151},{35, 107, 206, 203, 201},{54, 107, 185, 235, 139}
}},{{{50, 136, 55, 32, 41},{50, 136, 55, 32, 41},{37, 130, 32, 60, 63},{54, 128, 11, 104, 81},{54, 128, 11, 104, 81},{53, 127, 0, 128, 78},{59, 133, 11, 152, 169},{63, 127, 13, 155, 82},{59, 132, 39, 205, 209},{59, 131, 57, 225, 228}
},{{50, 136, 55, 32, 41},{50, 136, 55, 32, 41},{37, 130, 32, 60, 63},{39, 125, 27, 83, 150},{55, 130, 18, 104, 75},{63, 124, 28, 128, 91},{49, 143, 30, 151, 179},{64, 137, 24, 182, 227},{59, 132, 39, 205, 209},{59, 131, 57, 225, 228}
},{{50, 136, 55, 32, 41},{50, 136, 55, 32, 41},{53, 128, 60, 49, 60},{45, 116, 60, 86, 183},{55, 133, 46, 114, 106},{58, 128, 55, 128, 137},{56, 130, 41, 140, 155},{51, 134, 44, 191, 162},{61, 128, 44, 209, 196},{59, 131, 57, 225, 228}
},{{52, 152, 75, 16, 115},{54, 133, 78, 40, 81},{53, 128, 60, 49, 60},{54, 114, 76, 93, 209},{54, 114, 76, 93, 209},{53, 123, 79, 128, 5},{58, 129, 72, 166, 209},{61, 127, 74, 188, 48},{36, 125, 82, 205, 66},{49, 134, 84, 237, 138}
},{{43, 121, 103, 4, 181},{44, 127, 119, 19, 179},{53, 119, 103, 62, 159},{53, 119, 103, 62, 159},{38, 120, 99, 104, 209},{56, 135, 107, 128, 208},{59, 134, 88, 150, 247},{34, 133, 105, 177, 251},{37, 128, 107, 220, 150},{37, 128, 107, 220, 150}
},{{49, 137, 126, 6, 68},{44, 127, 119, 19, 179},{49, 121, 140, 50, 114},{62, 121, 128, 97, 34},{62, 121, 128, 97, 34},{51, 125, 128, 128, 202},{47, 128, 145, 152, 34},{45, 140, 123, 186, 228},{48, 138, 136, 200, 126},{60, 132, 128, 226, 94}
},{{50, 145, 159, 7, 191},{50, 145, 159, 7, 191},{49, 121, 140, 50, 114},{59, 134, 143, 99, 213},{59, 134, 143, 99, 213},{49, 129, 165, 128, 17},{47, 128, 145, 152, 34},{42, 130, 158, 183, 5},{59, 133, 170, 204, 92},{60, 130, 155, 250, 91}
},{{50, 145, 159, 7, 191},{28, 133, 183, 23, 189},{54, 136, 171, 45, 188},{50, 106, 180, 68, 44},{62, 138, 180, 104, 236},{50, 124, 180, 128, 254},{55, 123, 177, 154, 227},{44, 137, 176, 170, 59},{59, 133, 170, 204, 92},{60, 131, 180, 238, 97}
},{{50, 145, 159, 7, 191},{28, 133, 183, 23, 189},{52, 115, 212, 67, 84},{52, 115, 212, 67, 84},{52, 148, 209, 99, 150},{54, 135, 204, 128, 121},{68, 140, 201, 150, 19},{36, 128, 207, 188, 83},{36, 128, 207, 188, 83},{60, 130, 195, 227, 26}
},{{50, 127, 226, 66, 105},{50, 127, 226, 66, 105},{50, 127, 226, 66, 105},{50, 127, 226, 66, 105},{49, 128, 239, 93, 135},{51, 127, 230, 128, 174},{51, 127, 230, 128, 174},{55, 144, 229, 184, 126},{55, 144, 229, 184, 126},{60, 130, 195, 227, 26}
}},{{{52, 152, 75, 16, 115},{49, 159, 59, 28, 13},{44, 154, 40, 48, 42},{58, 157, 21, 80, 102},{53, 156, 0, 128, 173},{53, 156, 0, 128, 173},{56, 160, 11, 152, 143},{56, 160, 11, 152, 143},{51, 147, 40, 207, 195},{50, 149, 52, 220, 203}
},{{52, 152, 75, 16, 115},{49, 159, 59, 28, 13},{44, 154, 40, 48, 42},{57, 157, 25, 72, 113},{58, 157, 16, 90, 105},{50, 150, 28, 128, 188},{49, 143, 30, 151, 179},{36, 165, 25, 184, 164},{51, 147, 40, 207, 195},{50, 149, 52, 220, 203}
},{{52, 152, 75, 16, 115},{49, 159, 59, 28, 13},{44, 154, 40, 48, 42},{58, 157, 41, 68, 78},{43, 151, 55, 96, 111},{50, 140, 48, 128, 138},{60, 149, 61, 155, 139},{49, 162, 56, 186, 149},{46, 154, 46, 198, 216},{50, 149, 52, 220, 203}
},{{52, 152, 75, 16, 115},{52, 152, 75, 16, 115},{59, 154, 70, 43, 72},{39, 149, 84, 79, 45},{53, 149, 79, 128, 235},{53, 149, 79, 128, 235},{56, 153, 89, 143, 243},{47, 155, 75, 198, 189},{47, 155, 75, 198, 189},{53, 145, 86, 245, 131}
},{{51, 177, 103, 4, 101},{51, 145, 119, 19, 66},{57, 161, 103, 62, 69},{57, 161, 103, 62, 69},{57, 157, 102, 109, 43},{50, 159, 103, 128, 206},{53, 154, 108, 161, 230},{47, 154, 105, 177, 233},{51, 162, 105, 185, 197},{50, 161, 106, 227, 158}
},{{51, 164, 129, 6, 148},{53, 147, 129, 23, 180},{58, 157, 113, 63, 109},{58, 157, 113, 63, 109},{52, 161, 128, 128, 17},{52, 161, 128, 128, 17},{58, 149, 126, 142, 219},{47, 154, 105, 177, 233},{48, 138, 136, 200, 126},{53, 153, 128, 254, 86}
},{{50, 145, 159, 7, 191},{56, 155, 162, 32, 165},{56, 155, 162, 32, 165},{58, 152, 172, 60, 182},{52, 140, 150, 113, 219},{57, 148, 156, 128, 53},{55, 142, 148, 156, 53},{50, 182, 151, 180, 35},{45, 152, 141, 215, 107},{45, 152, 141, 215, 107}
},{{50, 145, 159, 7, 191},{56, 155, 162, 32, 165},{58, 156, 182, 49, 165},{65, 155, 180, 66, 168},{62, 138, 180, 104, 236},{51, 145, 180, 128, 18},{59, 133, 178, 157, 21},{44, 137, 176, 170, 59},{54, 144, 183, 222, 75},{54, 144, 183, 222, 75}
},{{35, 153, 193, 27, 228},{35, 153, 193, 27, 228},{58, 155, 216, 51, 206},{48, 162, 212, 67, 129},{52, 148, 209, 99, 150},{52, 159, 205, 128, 98},{54, 150, 199, 161, 66},{54, 150, 199, 161, 66},{63, 138, 207, 188, 66},{54, 144, 183, 222, 75}
},{{58, 155, 216, 51, 206},{58, 155, 216, 51, 206},{58, 155, 216, 51, 206},{57, 154, 228, 69, 134},{52, 148, 209, 99, 150},{54, 139, 231, 128, 94},{53, 147, 226, 167, 103},{55, 144, 229, 184, 126},{55, 144, 229, 184, 126},{55, 144, 229, 184, 126}
}},{{{56, 179, 55, 32, 24},{56, 179, 55, 32, 24},{57, 178, 32, 60, 19},{44, 182, 29, 80, 83},{51, 176, 0, 128, 135},{51, 176, 0, 128, 135},{51, 176, 0, 128, 135},{51, 193, 21, 170, 201},{55, 184, 28, 189, 170},{55, 184, 28, 189, 170}
},{{56, 179, 55, 32, 24},{56, 179, 55, 32, 24},{57, 178, 32, 60, 19},{44, 182, 29, 80, 83},{55, 181, 29, 85, 78},{49, 174, 28, 128, 135},{37, 179, 12, 155, 133},{55, 184, 28, 189, 170},{55, 184, 28, 189, 170},{55, 184, 28, 189, 170}
},{{56, 179, 55, 32, 24},{56, 179, 55, 32, 24},{57, 183, 40, 49, 19},{64, 176, 46, 62, 100},{62, 182, 43, 99, 68},{50, 175, 49, 128, 168},{50, 175, 49, 128, 168},{56, 186, 50, 182, 130},{34, 176, 39, 205, 252},{34, 176, 54, 223, 255}
},{{51, 177, 103, 4, 101},{56, 179, 55, 32, 24},{61, 172, 69, 43, 123},{58, 164, 83, 80, 25},{82, 179, 76, 102, 79},{53, 175, 79, 128, 209},{48, 181, 80, 152, 201},{38, 186, 73, 182, 231},{49, 189, 82, 206, 148},{34, 176, 78, 241, 169}
},{{51, 177, 103, 4, 101},{51, 177, 103, 4, 101},{41, 187, 91, 47, 98},{64, 177, 97, 73, 93},{51, 183, 97, 95, 62},{47, 185, 104, 125, 7},{48, 181, 80, 152, 201},{51, 162, 105, 185, 197},{53, 190, 102, 200, 161},{50, 161, 106, 227, 158}
},{{51, 164, 129, 6, 148},{49, 180, 119, 19, 101},{36, 178, 128, 45, 191},{49, 179, 124, 97, 27},{49, 179, 124, 97, 27},{49, 175, 128, 128, 26},{34, 177, 133, 155, 9},{50, 182, 151, 180, 35},{51, 191, 131, 217, 82},{51, 191, 131, 217, 82}
},{{49, 184, 147, 7, 153},{49, 184, 147, 7, 153},{51, 189, 153, 59, 168},{51, 189, 153, 59, 168},{34, 177, 145, 104, 238},{59, 175, 156, 128, 12},{51, 169, 148, 156, 22},{50, 182, 151, 180, 35},{50, 182, 151, 180, 35},{54, 183, 156, 225, 120}
},{{67, 180, 169, 11, 209},{40, 172, 187, 22, 173},{45, 171, 180, 48, 134},{45, 171, 180, 48, 134},{53, 183, 179, 117, 192},{51, 167, 180, 128, 36},{34, 177, 179, 156, 56},{51, 187, 199, 179, 120},{34, 176, 179, 201, 108},{51, 181, 178, 240, 64}
},{{34, 177, 203, 35, 255},{34, 177, 203, 35, 255},{50, 174, 211, 57, 242},{59, 189, 203, 64, 137},{53, 174, 205, 114, 160},{53, 174, 205, 114, 160},{49, 172, 204, 154, 79},{51, 187, 199, 179, 120},{64, 178, 207, 188, 5},{34, 176, 208, 215, 17}
},{{58, 185, 219, 54, 234},{58, 185, 219, 54, 234},{58, 185, 219, 54, 234},{50, 179, 233, 78, 162},{55, 185, 237, 101, 130},{51, 178, 235, 126, 144},{47, 175, 237, 156, 117},{47, 180, 226, 167, 90},{34, 176, 223, 194, 11},{34, 176, 208, 215, 17}
}},{{{50, 207, 33, 58, 98},{50, 207, 33, 58, 98},{50, 207, 33, 58, 98},{57, 207, 24, 74, 32},{52, 204, 0, 128, 252},{52, 204, 0, 128, 252},{57, 207, 11, 152, 225},{57, 208, 23, 180, 206},{57, 207, 32, 195, 145},{59, 208, 46, 214, 151}
},{{50, 207, 33, 58, 98},{50, 207, 33, 58, 98},{50, 207, 33, 58, 98},{57, 207, 24, 74, 32},{48, 216, 14, 97, 3},{51, 211, 24, 128, 252},{51, 205, 19, 158, 247},{57, 208, 23, 180, 206},{57, 207, 32, 195, 145},{59, 208, 46, 214, 151}
},{{58, 205, 63, 25, 85},{58, 205, 63, 25, 85},{50, 207, 33, 58, 98},{44, 198, 46, 62, 126},{64, 196, 53, 101, 80},{49, 207, 45, 128, 215},{57, 207, 75, 155, 162},{43, 202, 56, 186, 231},{60, 208, 40, 207, 143},{59, 208, 46, 214, 151}
},{{48, 206, 105, 4, 23},{57, 207, 74, 29, 37},{57, 201, 78, 40, 18},{59, 201, 84, 79, 109},{46, 214, 64, 106, 86},{54, 201, 79, 128, 180},{57, 207, 75, 155, 162},{59, 208, 72, 185, 158},{49, 189, 82, 206, 148},{61, 208, 74, 238, 205}
},{{48, 206, 105, 4, 23},{50, 197, 90, 28, 53},{62, 195, 98, 47, 52},{59, 201, 84, 79, 109},{60, 216, 98, 99, 97},{57, 207, 97, 128, 147},{57, 207, 113, 158, 157},{51, 200, 105, 177, 167},{54, 197, 104, 202, 213},{51, 229, 100, 225, 215}
},{{49, 224, 125, 3, 43},{46, 202, 119, 19, 4},{65, 202, 129, 68, 202},{57, 207, 133, 72, 191},{48, 204, 141, 101, 144},{48, 204, 128, 128, 120},{57, 208, 131, 165, 75},{57, 207, 125, 176, 191},{52, 198, 131, 217, 44},{52, 198, 131, 217, 44}
},{{62, 205, 147, 7, 227},{57, 207, 148, 20, 242},{51, 189, 153, 59, 168},{55, 198, 152, 90, 183},{48, 204, 141, 101, 144},{57, 207, 149, 128, 103},{57, 208, 149, 154, 98},{50, 182, 151, 180, 35},{45, 203, 158, 215, 43},{45, 203, 158, 215, 43}
},{{45, 207, 179, 16, 197},{45, 207, 179, 16, 197},{44, 201, 171, 45, 231},{56, 198, 172, 60, 234},{52, 211, 177, 128, 82},{52, 211, 177, 128, 82},{57, 207, 172, 148, 74},{51, 187, 199, 179, 120},{43, 221, 180, 213, 19},{64, 210, 185, 235, 68}
},{{57, 207, 201, 33, 154},{57, 207, 201, 33, 154},{57, 207, 213, 47, 136},{57, 207, 210, 83, 243},{57, 207, 200, 93, 231},{47, 203, 190, 128, 94},{57, 207, 201, 156, 39},{57, 207, 209, 179, 16},{63, 208, 215, 205, 113},{63, 208, 206, 216, 125}
},{{57, 207, 201, 33, 154},{57, 207, 201, 33, 154},{57, 207, 219, 54, 159},{55, 205, 226, 65, 221},{57, 207, 241, 98, 225},{57, 207, 229, 128, 23},{57, 207, 230, 160, 52},{57, 207, 227, 188, 45},{57, 207, 227, 188, 45},{63, 208, 206, 216, 125}
}},{{{53, 227, 32, 60, 78},{53, 227, 32, 60, 78},{53, 227, 32, 60, 78},{51, 229, 10, 107, 51},{51, 229, 10, 107, 51},{51, 229, 0, 128, 210},{52, 229, 7, 137, 219},{57, 233, 23, 180, 247},{50, 228, 31, 193, 140},{50, 228, 31, 193, 140}
},{{53, 227, 32, 60, 78},{53, 227, 32, 60, 78},{53, 227, 32, 60, 78},{44, 222, 26, 70, 42},{51, 229, 10, 107, 51},{51, 228, 28, 128, 207},{52, 230, 37, 152, 235},{57, 233, 23, 180, 247},{50, 228, 31, 193, 140},{50, 228, 31, 193, 140}
},{{58, 232, 55, 32, 65},{58, 232, 55, 32, 65},{51, 229, 46, 62, 66},{51, 229, 46, 62, 66},{52, 229, 48, 124, 25},{52, 229, 48, 124, 25},{52, 230, 37, 152, 235},{52, 230, 72, 184, 166},{52, 218, 57, 211, 128},{52, 218, 57, 211, 128}
},{{54, 231, 83, 12, 10},{50, 224, 78, 40, 48},{50, 224, 78, 40, 48},{46, 225, 84, 79, 80},{61, 235, 80, 109, 111},{48, 227, 79, 128, 152},{58, 222, 79, 158, 177},{52, 230, 72, 184, 166},{49, 227, 71, 196, 213},{55, 232, 79, 241, 229}
},{{52, 230, 102, 5, 53},{52, 230, 102, 5, 53},{58, 225, 90, 37, 32},{46, 225, 84, 79, 80},{60, 216, 98, 99, 97},{48, 227, 79, 128, 152},{46, 224, 112, 155, 161},{48, 227, 105, 177, 143},{51, 229, 100, 225, 215},{51, 229, 100, 225, 215}
},{{49, 224, 125, 3, 43},{53, 230, 129, 23, 193},{53, 230, 129, 23, 193},{57, 207, 133, 72, 191},{59, 226, 128, 128, 93},{59, 226, 128, 128, 93},{46, 224, 126, 155, 175},{48, 227, 105, 177, 143},{66, 232, 131, 223, 114},{66, 232, 131, 223, 114}
},{{51, 229, 148, 4, 194},{46, 225, 155, 39, 247},{46, 225, 155, 39, 247},{57, 233, 172, 60, 196},{55, 222, 150, 118, 141},{47, 226, 159, 128, 86},{48, 212, 151, 158, 105},{32, 211, 155, 180, 88},{41, 220, 159, 215, 57},{39, 218, 138, 230, 21}
},{{51, 229, 188, 22, 248},{51, 229, 188, 22, 248},{47, 226, 171, 44, 206},{57, 233, 172, 60, 196},{36, 215, 179, 118, 178},{52, 211, 177, 128, 82},{58, 216, 181, 161, 114},{58, 216, 181, 161, 114},{43, 221, 180, 213, 19},{55, 232, 182, 237}
},{{51, 229, 188, 22, 248},{51, 229, 188, 22, 248},{58, 233, 209, 44, 170},{55, 232, 212, 67, 204},{72, 228, 209, 99, 154},{52, 228, 219, 128, 15},{57, 207, 201, 156, 39},{57, 207, 209, 179, 16},{71, 222, 204, 219, 10},{55, 232, 182, 237}
},{{51, 229, 188, 22, 248},{51, 229, 188, 22, 248},{48, 227, 227, 66, 246},{48, 227, 227, 66, 246},{61, 221, 223, 97, 218},{54, 230, 223, 128, 11},{65, 226, 234, 163, 110},{65, 226, 234, 163, 110},{69, 223, 219, 201, 12},{55, 232, 182, 237}
}}},{{{{76, 13, 56, 31, 226},{76, 13, 56, 31, 226},{83, 11, 32, 60, 192},{83, 10, 26, 83, 148},{72, 15, 13, 97, 175},{75, 13, 0, 128, 66},{75, 13, 12, 153, 87},{75, 13, 19, 172, 125},{76, 13, 36, 202, 43},{76, 13, 46, 214, 61}
},{{76, 13, 56, 31, 226},{76, 13, 56, 31, 226},{83, 11, 32, 60, 192},{83, 10, 26, 83, 148},{72, 15, 23, 112, 164},{76, 14, 28, 128, 90},{75, 13, 12, 153, 87},{72, 15, 22, 178, 103},{76, 13, 36, 202, 43},{76, 13, 46, 214, 61}
},{{76, 13, 56, 31, 226},{76, 13, 56, 31, 226},{75, 14, 46, 62, 209},{75, 14, 46, 62, 209},{72, 15, 50, 97, 144},{76, 13, 45, 128, 104},{69, 17, 47, 154, 101},{74, 14, 56, 186, 66},{76, 13, 46, 214, 61},{78, 12, 59, 227, 30}
},{{68, 17, 77, 19, 143},{79, 12, 89, 24, 134},{73, 14, 78, 40, 165},{69, 17, 79, 77, 210},{69, 17, 72, 104, 240},{70, 16, 79, 128, 29},{75, 13, 79, 148, 25},{75, 13, 77, 161, 46},{78, 12, 74, 211, 95},{76, 13, 76, 240, 121}
},{{72, 15, 104, 4, 175},{79, 12, 89, 24, 134},{83, 12, 103, 62, 130},{72, 15, 92, 81, 206},{72, 15, 96, 94, 253},{94, 6, 101, 128, 57},{76, 13, 107, 158, 48},{69, 17, 101, 182, 3},{75, 13, 85, 199, 80},{76, 13, 105, 235, 71}
},{{74, 14, 128, 1, 65},{77, 12, 119, 19, 161},{84, 12, 112, 52, 152},{79, 12, 138, 85, 24},{76, 13, 128, 128, 197},{76, 13, 128, 128, 197},{75, 13, 136, 158, 212},{75, 13, 132, 184, 254},{69, 16, 131, 199, 149},{77, 13, 128, 225, 165}
},{{72, 15, 147, 7, 87},{86, 9, 140, 28, 75},{77, 12, 172, 60, 85},{79, 12, 138, 85, 24},{87, 9, 147, 112, 57},{75, 13, 164, 128, 230},{78, 12, 147, 155, 206},{68, 17, 155, 175, 229},{79, 12, 158, 207, 150},{78, 12, 166, 230, 134}
},{{85, 9, 178, 16, 122},{85, 9, 178, 16, 122},{77, 12, 172, 60, 85},{68, 17, 179, 81, 51},{75, 13, 180, 101, 19},{78, 12, 184, 128, 254},{73, 14, 176, 157, 238},{69, 17, 178, 181, 215},{75, 13, 194, 206, 206},{77, 13, 185, 235, 150}
},{{86, 9, 198, 31, 2},{86, 9, 198, 31, 2},{72, 15, 201, 43, 33},{81, 11, 197, 72, 83},{87, 9, 192, 108, 118},{74, 14, 204, 129, 141},{75, 13, 208, 159, 141},{84, 10, 198, 184, 164},{75, 13, 194, 206, 206},{69, 17, 200, 223, 199}
},{{86, 9, 198, 31, 2},{86, 9, 198, 31, 2},{80, 11, 227, 68, 120},{81, 11, 234, 80, 100},{79, 12, 229, 112, 82},{78, 12, 230, 128, 160},{78, 12, 228, 151, 181},{75, 13, 232, 179, 153},{78, 12, 218, 202, 214},{79, 12, 214, 207, 222}
}},{{{78, 24, 26, 70, 142},{78, 24, 26, 70, 142},{78, 24, 26, 70, 142},{78, 24, 26, 70, 142},{77, 31, 0, 128, 86},{77, 31, 0, 128, 86},{75, 13, 12, 153, 87},{72, 15, 22, 178, 103},{76, 13, 36, 202, 43},{76, 13, 46, 214, 61}
},{{78, 24, 26, 70, 142},{78, 24, 26, 70, 142},{78, 24, 26, 70, 142},{78, 24, 26, 70, 142},{98, 27, 26, 104, 143},{77, 34, 25, 128, 114},{69, 17, 35, 152, 107},{72, 15, 22, 178, 103},{76, 13, 36, 202, 43},{76, 13, 46, 214, 61}
},{{71, 32, 56, 31, 196},{71, 32, 56, 31, 196},{75, 14, 46, 62, 209},{69, 17, 58, 70, 172},{72, 15, 50, 97, 144},{76, 26, 45, 128, 127},{69, 17, 47, 154, 101},{72, 34, 56, 186, 108},{68, 17, 51, 213, 55},{74, 14, 59, 227, 24}
},{{68, 17, 77, 19, 143},{72, 28, 67, 33, 178},{69, 21, 78, 40, 178},{69, 17, 79, 77, 210},{69, 17, 72, 104, 240},{86, 27, 78, 128, 7},{75, 13, 79, 148, 25},{76, 23, 69, 171, 49},{68, 17, 75, 202, 80},{76, 13, 76, 240, 121}
},{{72, 15, 104, 4, 175},{72, 29, 107, 19, 169},{72, 38, 97, 49, 186},{72, 15, 92, 81, 206},{72, 15, 96, 94, 253},{78, 33, 95, 128, 52},{76, 13, 107, 158, 48},{69, 17, 101, 182, 3},{75, 29, 97, 213, 102},{76, 13, 105, 235, 71}
},{{74, 14, 128, 1, 65},{75, 39, 134, 26, 116},{56, 24, 133, 58, 27},{79, 22, 146, 85, 26},{74, 26, 128, 128, 212},{74, 26, 128, 128, 212},{75, 13, 136, 158, 212},{75, 13, 132, 184, 254},{69, 16, 131, 199, 149},{77, 13, 128, 225, 165}
},{{72, 15, 147, 7, 87},{75, 39, 134, 26, 116},{79, 17, 171, 45, 92},{79, 22, 146, 85, 26},{61, 24, 141, 101, 73},{68, 17, 154, 128, 203},{78, 12, 147, 155, 206},{68, 17, 155, 175, 229},{79, 12, 158, 207, 150},{78, 12, 166, 230, 134}
},{{77, 13, 166, 10, 104},{72, 15, 181, 18, 100},{88, 26, 179, 60, 73},{68, 17, 179, 81, 51},{75, 13, 180, 101, 19},{69, 17, 178, 128, 226},{73, 14, 176, 157, 238},{69, 17, 178, 181, 215},{68, 17, 185, 200, 160},{65, 27, 182, 237, 133}
},{{72, 15, 198, 31, 26},{72, 15, 198, 31, 26},{72, 15, 201, 43, 33},{68, 17, 201, 73, 81},{70, 38, 210, 98, 84},{74, 14, 204, 129, 141},{75, 13, 208, 159, 141},{68, 17, 206, 176, 175},{69, 17, 197, 205, 216},{69, 17, 200, 223, 199}
},{{72, 15, 198, 31, 26},{72, 15, 198, 31, 26},{72, 15, 222, 59, 38},{68, 17, 229, 72, 124},{81, 32, 231, 90, 72},{78, 12, 230, 128, 160},{78, 12, 228, 151, 181},{75, 13, 232, 179, 153},{78, 12, 218, 202, 214},{69, 17, 200, 223, 199}
}},{{{70, 46, 56, 31, 203},{70, 46, 56, 31, 203},{77, 33, 32, 60, 244},{71, 63, 22, 78, 164},{78, 52, 6, 121, 129},{73, 56, 0, 128, 117},{73, 56, 0, 128, 117},{75, 44, 20, 174, 89},{75, 44, 20, 174, 89},{77, 56, 65, 232, 88}
},{{70, 46, 56, 31, 203},{70, 46, 56, 31, 203},{77, 33, 32, 60, 244},{69, 40, 28, 77, 184},{75, 51, 28, 128, 96},{75, 51, 28, 128, 96},{75, 51, 28, 128, 96},{67, 50, 22, 178, 81},{70, 38, 32, 195, 7},{77, 56, 65, 232, 88}
},{{70, 46, 56, 31, 203},{70, 46, 56, 31, 203},{88, 46, 46, 62, 226},{60, 57, 56, 80, 233},{76, 49, 49, 128, 72},{76, 49, 49, 128, 72},{70, 51, 65, 152, 40},{75, 56, 56, 186, 117},{75, 56, 56, 186, 117},{77, 56, 65, 232, 88}
},{{85, 59, 86, 10, 182},{65, 53, 79, 37, 154},{65, 53, 79, 37, 154},{90, 57, 82, 87, 226},{80, 65, 87, 101, 167},{66, 53, 79, 128, 60},{70, 51, 65, 152, 40},{78, 49, 74, 188, 13},{82, 53, 73, 198, 108},{77, 56, 65, 232, 88}
},{{58, 61, 103, 4, 224},{77, 41, 119, 19, 132},{76, 45, 103, 62, 188},{76, 45, 103, 62, 188},{82, 63, 98, 99, 232},{75, 50, 94, 128, 35},{77, 44, 111, 150, 28},{86, 50, 105, 177, 56},{75, 29, 97, 213, 102},{74, 43, 104, 251, 118}
},{{82, 43, 133, 1, 121},{75, 39, 134, 26, 116},{76, 45, 103, 62, 188},{76, 45, 103, 62, 188},{59, 44, 124, 110, 129},{83, 48, 128, 128, 231},{65, 51, 130, 152, 236},{78, 53, 125, 184, 58},{70, 45, 133, 208, 186},{83, 33, 132, 223, 173}
},{{70, 69, 154, 5, 24},{75, 39, 134, 26, 116},{61, 63, 171, 45},{91, 54, 148, 91, 38},{91, 54, 148, 91, 38},{81, 52, 169, 128, 200},{77, 51, 148, 156, 242},{76, 52, 146, 160, 206},{76, 48, 162, 200, 146},{76, 48, 162, 200, 146}
},{{54, 42, 177, 15, 38},{54, 42, 177, 15, 38},{71, 37, 181, 62, 109},{92, 57, 178, 70, 21},{69, 59, 178, 94, 22},{76, 46, 180, 128, 210},{71, 44, 174, 160, 225},{71, 44, 174, 160, 225},{76, 48, 162, 200, 146},{82, 39, 182, 237, 170}
},{{60, 43, 195, 28, 76},{60, 43, 195, 28, 76},{72, 50, 212, 67, 105},{72, 50, 212, 67, 105},{61, 55, 209, 99, 60},{79, 56, 202, 128, 185},{79, 56, 202, 128, 185},{63, 56, 207, 188, 240},{63, 56, 207, 188, 240},{82, 39, 182, 237, 170}
},{{75, 59, 225, 63, 42},{75, 59, 225, 63, 42},{75, 59, 225, 63, 42},{75, 59, 225, 63, 42},{59, 50, 221, 109, 61},{75, 46, 219, 128, 186},{73, 61, 226, 167, 181},{73, 61, 226, 167, 181},{100, 65, 217, 203, 179},{82, 39, 182, 237, 170}
}},{{{71, 70, 56, 31, 162},{71, 70, 56, 31, 162},{61, 83, 30, 62, 202},{71, 63, 22, 78, 164},{76, 77, 6, 121, 250},{71, 73, 0, 128, 10},{94, 76, 10, 149, 9},{83, 99, 23, 179, 16},{90, 63, 33, 197, 5},{61, 86, 45, 213, 23}
},{{71, 70, 56, 31, 162},{71, 70, 56, 31, 162},{61, 83, 30, 62, 202},{71, 63, 22, 78, 164},{61, 83, 25, 98, 145},{75, 76, 25, 128, 26},{75, 76, 25, 128, 26},{61, 87, 24, 182, 64},{90, 63, 33, 197, 5},{61, 86, 45, 213, 23}
},{{71, 70, 56, 31, 162},{71, 70, 56, 31, 162},{85, 83, 46, 62, 146},{73, 81, 53, 79, 230},{87, 65, 48, 108, 206},{71, 73, 52, 128, 62},{81, 101, 49, 154, 27},{74, 73, 56, 186, 5},{74, 73, 56, 186, 5},{77, 56, 65, 232, 88}
},{{61, 83, 80, 13, 183},{79, 71, 78, 40, 234},{79, 71, 78, 40, 234},{65, 71, 81, 83, 128},{80, 65, 87, 101, 167},{63, 77, 79, 128, 57},{60, 76, 82, 158, 56},{79, 80, 76, 190, 105},{79, 80, 76, 190, 105},{77, 56, 65, 232, 88}
},{{61, 83, 108, 4, 130},{82, 86, 100, 19, 247},{74, 91, 103, 64, 178},{74, 91, 103, 64, 178},{78, 70, 95, 104, 187},{75, 84, 103, 128, 124},{61, 83, 108, 155, 29},{75, 87, 105, 177, 64},{80, 93, 89, 210, 2},{86, 74, 105, 252, 13}
},{{75, 67, 131, 1, 14},{73, 73, 119, 19, 224},{56, 74, 123, 38, 171},{61, 83, 125, 75, 220},{74, 71, 128, 128, 137},{74, 71, 128, 128, 137},{83, 73, 148, 155, 145},{78, 53, 125, 184, 58},{70, 64, 144, 209, 195},{61, 84, 141, 244, 148}
},{{70, 69, 154, 5, 24},{70, 69, 154, 5, 24},{74, 72, 172, 60, 22},{61, 83, 147, 76, 53},{80, 85, 144, 96, 113},{81, 79, 165, 128, 191},{83, 73, 148, 155, 145},{82, 75, 167, 193, 251},{82, 75, 167, 193, 251},{79, 73, 182, 237, 217}
},{{73, 89, 183, 19, 48},{73, 89, 183, 19, 48},{74, 86, 178, 60, 22},{71, 85, 185, 76, 99},{63, 77, 165, 106, 57},{74, 72, 181, 128, 179},{74, 72, 181, 128, 179},{82, 75, 167, 193, 251},{79, 66, 186, 212, 231},{79, 73, 182, 237, 217}
},{{73, 89, 183, 19, 48},{73, 89, 183, 19, 48},{61, 83, 214, 48, 12},{71, 85, 185, 76, 99},{84, 75, 209, 99, 41},{77, 77, 198, 128, 194},{77, 77, 198, 128, 194},{89, 64, 207, 188, 238},{79, 66, 186, 212, 231},{61, 82, 202, 221, 252}
},{{73, 89, 183, 19, 48},{61, 83, 209, 42, 17},{75, 59, 225, 63, 42},{61, 83, 233, 79, 76},{84, 75, 209, 99, 41},{78, 79, 234, 128, 239},{78, 79, 234, 128, 239},{73, 61, 226, 167, 181},{83, 90, 224, 192, 173},{61, 82, 202, 221, 252}
}},{{{72, 117, 56, 31, 158},{72, 117, 56, 31, 158},{58, 111, 32, 60, 205},{98, 97, 22, 77, 220},{76, 108, 6, 121, 219},{79, 98, 0, 128, 41},{86, 102, 10, 149, 43},{83, 99, 23, 179, 16},{83, 99, 23, 179, 16},{83, 99, 23, 179, 16}
},{{72, 117, 56, 31, 158},{72, 117, 56, 31, 158},{58, 111, 32, 60, 205},{98, 97, 24, 75, 212},{72, 107, 15, 112, 216},{82, 94, 28, 128, 20},{86, 102, 10, 149, 43},{83, 99, 23, 179, 16},{83, 99, 23, 179, 16},{83, 99, 23, 179, 16}
},{{72, 117, 56, 31, 158},{72, 117, 56, 31, 158},{63, 108, 46, 62, 199},{73, 81, 53, 79, 230},{58, 103, 52, 106, 135},{77, 101, 45, 128, 1},{81, 101, 49, 154, 27},{79, 125, 52, 174, 44},{98, 97, 56, 203, 116},{70, 108, 66, 219, 55}
},{{73, 106, 94, 7, 254},{61, 109, 78, 40, 178},{61, 109, 78, 40, 178},{98, 97, 80, 69, 146},{54, 114, 76, 93, 209},{62, 106, 79, 128, 31},{69, 113, 86, 157, 123},{84, 99, 75, 192, 56},{84, 99, 75, 192, 56},{69, 109, 74, 238, 8}
},{{73, 106, 94, 7, 254},{82, 86, 100, 19, 247},{75, 96, 102, 62, 247},{75, 96, 102, 62, 247},{67, 109, 98, 95, 151},{87, 103, 103, 128, 83},{72, 107, 102, 152, 89},{83, 106, 106, 177, 102},{78, 104, 90, 196, 60},{73, 99, 99, 250, 55}
},{{88, 103, 142, 2, 55},{83, 108, 119, 19, 223},{75, 96, 102, 62, 247},{61, 83, 125, 75, 220},{78, 101, 128, 128, 175},{78, 101, 128, 128, 175},{74, 103, 137, 141, 173},{89, 108, 128, 191, 142},{74, 113, 136, 202, 253},{73, 119, 126, 217, 29}
},{{88, 103, 142, 2, 55},{78, 113, 170, 20, 5},{68, 100, 163, 51, 52},{76, 107, 156, 101, 90},{76, 107, 156, 101, 90},{83, 104, 142, 128, 177},{82, 98, 146, 160, 134},{82, 98, 146, 160, 134},{73, 110, 144, 209, 226},{63, 102, 142, 218, 137}
},{{73, 89, 183, 19, 48},{78, 113, 170, 20, 5},{68, 101, 171, 45, 35},{64, 99, 177, 78, 88},{76, 107, 156, 101, 90},{79, 97, 180, 128, 158},{79, 97, 180, 128, 158},{73, 125, 183, 168, 175},{91, 93, 185, 205, 246},{78, 110, 182, 237, 255}
},{{73, 89, 183, 19, 48},{98, 102, 199, 31, 88},{98, 100, 216, 51, 105},{66, 107, 212, 67, 58},{71, 105, 209, 99, 24},{88, 105, 202, 134, 249},{88, 105, 202, 134, 249},{82, 112, 207, 188, 213},{82, 112, 207, 188, 213},{98, 96, 203, 220, 145}
},{{73, 89, 183, 19, 48},{98, 102, 199, 31, 88},{98, 100, 216, 51, 105},{76, 105, 235, 84, 30},{76, 105, 235, 84, 30},{75, 107, 223, 128, 251},{78, 97, 226, 167, 238},{78, 97, 226, 167, 238},{83, 90, 224, 192, 173},{83, 90, 224, 192, 173}
}},{{{72, 117, 56, 31, 158},{72, 117, 56, 31, 158},{70, 137, 32, 60, 87},{54, 128, 11, 104, 81},{54, 128, 11, 104, 81},{76, 140, 1, 128, 197},{86, 124, 11, 150, 51},{64, 137, 24, 182, 227},{59, 132, 39, 205, 209},{85, 134, 59, 225, 141}
},{{72, 117, 56, 31, 158},{72, 117, 56, 31, 158},{70, 137, 32, 60, 87},{70, 137, 32, 60, 87},{76, 125, 22, 128, 35},{76, 125, 22, 128, 35},{63, 127, 13, 155, 82},{64, 137, 24, 182, 227},{59, 132, 39, 205, 209},{85, 134, 59, 225, 141}
},{{72, 117, 56, 31, 158},{72, 117, 56, 31, 158},{88, 124, 46, 62, 176},{88, 124, 46, 62, 176},{80, 125, 52, 120, 229},{80, 125, 52, 120, 229},{79, 125, 52, 174, 44},{79, 125, 52, 174, 44},{78, 128, 56, 186, 200},{85, 134, 59, 225, 141}
},{{88, 119, 90, 9, 248},{72, 117, 56, 31, 158},{54, 133, 78, 40, 81},{54, 114, 76, 93, 209},{74, 129, 80, 128, 159},{74, 129, 80, 128, 159},{69, 136, 84, 155, 134},{81, 125, 74, 188, 94},{81, 125, 74, 188, 94},{81, 122, 77, 240, 18}
},{{73, 106, 94, 7, 254},{73, 136, 119, 19, 33},{78, 140, 103, 62, 31},{78, 140, 103, 62, 31},{72, 128, 106, 128, 166},{72, 128, 106, 128, 166},{73, 110, 99, 152, 88},{92, 128, 105, 177, 128},{78, 104, 90, 196, 60},{85, 116, 97, 233, 45}
},{{87, 127, 145, 3, 62},{73, 136, 119, 19, 33},{49, 121, 140, 50, 114},{62, 121, 128, 97, 34},{62, 121, 128, 97, 34},{74, 128, 128, 128, 78},{85, 127, 114, 159, 67},{71, 140, 129, 171, 101},{73, 119, 126, 217, 29},{74, 129, 142, 234, 43}
},{{87, 127, 145, 3, 62},{78, 113, 170, 20, 5},{85, 128, 157, 68, 136},{85, 128, 157, 68, 136},{76, 107, 156, 101, 90},{81, 130, 151, 128, 64},{88, 129, 150, 159, 84},{67, 128, 161, 189, 91},{70, 137, 140, 201, 14},{74, 129, 142, 234, 43}
},{{78, 113, 170, 20, 5},{78, 113, 170, 20, 5},{78, 120, 171, 45, 52},{73, 129, 198, 68, 206},{62, 138, 180, 104, 236},{78, 130, 180, 128, 124},{65, 128, 178, 159, 104},{73, 125, 183, 168, 175},{82, 127, 183, 210, 204},{86, 120, 182, 237, 241}
},{{97, 122, 198, 31, 70},{97, 122, 198, 31, 70},{73, 129, 198, 68, 206},{73, 129, 198, 68, 206},{93, 124, 204, 104, 1},{73, 130, 206, 128, 1},{78, 129, 201, 134, 4},{82, 112, 207, 188, 213},{82, 127, 183, 210, 204},{60, 130, 195, 227, 26}
},{{73, 126, 219, 60, 84},{73, 126, 219, 60, 84},{73, 126, 219, 60, 84},{75, 117, 230, 74, 22},{74, 128, 236, 99, 193},{70, 129, 232, 128, 43},{82, 138, 226, 167, 25},{82, 138, 226, 167, 25},{82, 138, 226, 167, 25},{60, 130, 195, 227, 26}
}},{{{76, 146, 62, 34, 70},{76, 146, 62, 34, 70},{66, 155, 32, 60, 65},{58, 157, 21, 80, 102},{75, 150, 6, 121, 38},{77, 149, 0, 128, 220},{83, 158, 9, 146, 210},{73, 170, 21, 176, 194},{78, 147, 38, 199, 184},{77, 160, 51, 220, 134}
},{{76, 146, 62, 34, 70},{76, 146, 62, 34, 70},{66, 155, 32, 60, 65},{57, 157, 25, 72, 113},{76, 170, 29, 110, 17},{77, 156, 23, 128, 194},{77, 156, 23, 128, 194},{73, 170, 21, 176, 194},{78, 147, 38, 199, 184},{77, 160, 51, 220, 134}
},{{76, 146, 62, 34, 70},{76, 146, 62, 34, 70},{82, 154, 62, 56, 74},{80, 147, 46, 62, 87},{86, 152, 51, 128, 249},{86, 152, 51, 128, 249},{87, 141, 49, 151, 248},{88, 150, 52, 173, 211},{77, 160, 51, 220, 134},{77, 160, 51, 220, 134}
},{{57, 156, 76, 16, 125},{68, 149, 78, 40, 51},{68, 149, 78, 40, 51},{76, 162, 95, 87, 98},{82, 179, 76, 102, 79},{77, 152, 83, 128, 130},{91, 158, 72, 152, 145},{87, 162, 71, 182, 128},{83, 155, 74, 196, 194},{88, 140, 72, 236, 244}
},{{92, 155, 92, 8, 23},{83, 149, 97, 49, 18},{83, 149, 97, 49, 18},{76, 162, 95, 87, 98},{57, 157, 102, 109, 43},{72, 151, 100, 128, 191},{78, 163, 110, 148, 147},{65, 146, 105, 177, 143},{65, 161, 95, 213, 238},{83, 154, 95, 240, 226}
},{{83, 158, 142, 2, 197},{101, 154, 129, 23, 237},{73, 154, 141, 65, 155},{73, 154, 141, 65, 155},{86, 158, 132, 101, 173},{73, 152, 128, 128, 85},{73, 152, 128, 128, 85},{90, 145, 130, 178, 127},{74, 151, 132, 206, 19},{74, 151, 132, 206, 19}
},{{83, 158, 142, 2, 197},{69, 149, 147, 7, 192},{73, 154, 141, 65, 155},{73, 154, 141, 65, 155},{90, 144, 153, 104, 191},{77, 150, 166, 128, 121},{79, 148, 148, 166, 109},{73, 148, 156, 182, 115},{90, 156, 146, 202, 26},{77, 153, 182, 237, 11}
},{{89, 153, 186, 21, 235},{89, 153, 186, 21, 235},{76, 140, 171, 45, 194},{65, 155, 180, 66, 168},{78, 153, 180, 128, 103},{78, 153, 180, 128, 103},{78, 153, 179, 141, 109},{73, 148, 156, 182, 115},{77, 153, 182, 237, 11},{77, 153, 182, 237, 11}
},{{89, 153, 186, 21, 235},{97, 155, 198, 31, 167},{58, 155, 216, 51, 206},{68, 160, 212, 67, 247},{77, 143, 209, 99, 244},{74, 141, 204, 128, 15},{77, 151, 201, 159, 8},{77, 154, 207, 188, 32},{77, 154, 207, 188, 32},{77, 153, 182, 237, 11}
},{{89, 153, 186, 21, 235},{97, 155, 198, 31, 167},{58, 155, 216, 51, 206},{61, 157, 230, 74, 136},{70, 150, 239, 101, 222},{79, 150, 219, 128, 6},{64, 168, 227, 150, 25},{77, 154, 207, 188, 32},{77, 154, 207, 188, 32},{77, 153, 182, 237, 11}
}},{{{75, 170, 56, 31, 66},{75, 170, 56, 31, 66},{76, 168, 32, 60, 124},{86, 179, 22, 78, 57},{77, 179, 0, 128, 250},{77, 179, 0, 128, 250},{77, 179, 0, 128, 250},{73, 170, 21, 176, 194},{75, 175, 37, 195, 134},{75, 175, 37, 195, 134}
},{{75, 170, 56, 31, 66},{75, 170, 56, 31, 66},{76, 168, 32, 60, 124},{86, 179, 22, 78, 57},{76, 170, 29, 110, 17},{82, 175, 24, 128, 225},{82, 175, 24, 128, 225},{73, 170, 21, 176, 194},{75, 175, 37, 195, 134},{75, 175, 37, 195, 134}
},{{75, 170, 56, 31, 66},{75, 170, 56, 31, 66},{64, 176, 46, 62, 100},{64, 176, 46, 62, 100},{81, 180, 64, 96, 65},{75, 172, 45, 128, 206},{97, 172, 54, 156, 227},{90, 168, 51, 175, 234},{71, 179, 65, 202, 251},{77, 160, 51, 220, 134}
},{{98, 177, 80, 14, 9},{75, 170, 56, 31, 66},{67, 191, 78, 40, 30},{82, 179, 76, 102, 79},{82, 179, 76, 102, 79},{71, 174, 76, 128, 161},{66, 178, 78, 143, 181},{77, 185, 75, 175, 148},{71, 179, 65, 202, 251},{97, 172, 75, 239, 237}
},{{63, 185, 101, 5, 98},{79, 170, 118, 19, 4},{70, 188, 99, 56, 37},{64, 177, 97, 73, 93},{67, 174, 107, 102, 100},{83, 176, 108, 128, 139},{78, 163, 110, 148, 147},{75, 191, 105, 177, 168},{73, 184, 117, 218, 218},{98, 184, 105, 229, 210}
},{{101, 182, 135, 1, 209},{93, 183, 129, 23, 248},{97, 194, 134, 47, 142},{83, 181, 117, 85, 66},{78, 166, 142, 102, 132},{69, 180, 128, 128, 117},{85, 189, 134, 152, 114},{77, 180, 122, 186, 189},{77, 180, 122, 186, 189},{73, 184, 117, 218, 218}
},{{67, 180, 169, 11, 209},{87, 170, 168, 18, 195},{86, 180, 172, 60, 246},{96, 180, 169, 74, 179},{78, 166, 142, 102, 132},{77, 186, 161, 128, 82},{69, 195, 153, 150, 13},{92, 179, 147, 179, 75},{76, 165, 144, 209, 44},{96, 178, 147, 228, 33}
},{{67, 180, 169, 11, 209},{67, 180, 169, 11, 209},{86, 180, 172, 60, 246},{96, 180, 169, 74, 179},{74, 192, 178, 116, 200},{74, 191, 180, 128, 69},{84, 157, 180, 152, 97},{83, 196, 178, 194, 99},{83, 196, 178, 194, 99},{78, 174, 178, 240, 38}
},{{67, 180, 169, 11, 209},{72, 188, 208, 41, 137},{72, 188, 208, 41, 137},{74, 175, 209, 99, 211},{74, 175, 209, 99, 211},{75, 174, 200, 128, 41},{77, 188, 208, 148, 49},{64, 178, 207, 188, 5},{64, 178, 207, 188, 5},{80, 184, 182, 234, 48}
},{{72, 188, 208, 41, 137},{72, 188, 208, 41, 137},{58, 185, 219, 54, 234},{96, 175, 232, 76, 239},{96, 175, 234, 101, 196},{81, 180, 223, 128, 62},{89, 177, 220, 150, 38},{87, 183, 226, 167, 33},{97, 171, 221, 198, 85},{80, 184, 182, 234, 48}
}},{{{76, 200, 32, 60, 28},{76, 200, 32, 60, 28},{76, 200, 32, 60, 28},{78, 211, 19, 84, 94},{77, 194, 11, 104, 104},{78, 205, 0, 128, 135},{78, 205, 0, 128, 135},{77, 208, 23, 179, 189},{77, 208, 33, 197, 253},{77, 208, 33, 197, 253}
},{{76, 200, 32, 60, 28},{76, 200, 32, 60, 28},{76, 200, 32, 60, 28},{73, 216, 22, 78, 77},{78, 210, 25, 99, 98},{84, 206, 23, 128, 137},{75, 205, 44, 148, 186},{77, 208, 23, 179, 189},{77, 208, 33, 197, 253},{77, 208, 33, 197, 253}
},{{77, 212, 66, 22, 73},{77, 212, 66, 22, 73},{77, 212, 42, 47, 24},{76, 212, 49, 85, 120},{78, 211, 51, 95, 117},{78, 204, 49, 128, 183},{75, 205, 44, 148, 186},{68, 201, 44, 191, 154},{78, 210, 39, 205, 242},{70, 207, 55, 223, 229}
},{{77, 212, 66, 22, 73},{77, 212, 66, 22, 73},{61, 201, 69, 43, 30},{73, 204, 84, 89, 12},{73, 204, 84, 89, 12},{66, 203, 79, 128, 194},{65, 199, 77, 159, 208},{82, 201, 71, 184, 224},{82, 192, 82, 207, 139},{77, 208, 66, 233, 178}
},{{78, 211, 105, 24, 104},{78, 211, 105, 24, 104},{70, 212, 103, 62, 79},{76, 212, 117, 81, 56},{76, 204, 121, 97, 28},{79, 214, 101, 128, 248},{78, 210, 89, 138, 203},{65, 204, 105, 177, 209},{54, 197, 104, 202, 213},{78, 211, 111, 223, 169}
},{{77, 212, 128, 12, 145},{78, 199, 118, 19, 104},{65, 202, 129, 68, 202},{76, 212, 139, 76, 219},{76, 204, 121, 97, 28},{69, 207, 128, 128, 14},{78, 210, 148, 151, 27},{57, 207, 125, 176, 191},{66, 212, 126, 197, 169},{78, 211, 111, 223, 169}
},{{73, 208, 147, 7, 137},{72, 215, 158, 21, 144},{67, 214, 143, 54, 168},{74, 210, 148, 78, 198},{78, 210, 160, 110, 214},{72, 200, 165, 128, 33},{78, 210, 148, 151, 27},{69, 203, 148, 156, 2},{86, 207, 144, 209, 92},{77, 208, 175, 241, 71}
},{{78, 211, 173, 13, 185},{77, 212, 178, 33, 142},{77, 212, 172, 60, 141},{77, 212, 172, 60, 141},{74, 192, 178, 116, 200},{76, 207, 180, 128, 51},{78, 210, 166, 154, 36},{83, 196, 178, 194, 99},{83, 196, 178, 194, 99},{76, 207, 185, 235, 85}
},{{67, 203, 185, 20, 161},{89, 210, 205, 37, 231},{78, 211, 212, 46, 227},{78, 210, 203, 92, 143},{78, 210, 203, 92, 143},{78, 210, 198, 128, 94},{77, 188, 208, 148, 49},{84, 193, 205, 175, 115},{70, 210, 204, 219, 7},{77, 208, 198, 225, 62}
},{{78, 211, 212, 46, 227},{78, 211, 212, 46, 227},{78, 212, 216, 51, 245},{78, 211, 232, 76, 189},{78, 210, 232, 99, 147},{72, 207, 231, 128, 100},{57, 207, 230, 160, 52},{57, 207, 227, 188, 45},{63, 208, 217, 204, 126},{77, 208, 198, 225, 62}
}},{{{79, 230, 56, 31, 10},{79, 230, 56, 31, 10},{78, 232, 33, 59, 56},{73, 216, 22, 78, 77},{76, 234, 21, 104, 95},{79, 228, 0, 128, 175},{79, 228, 0, 128, 175},{81, 239, 23, 180, 153},{71, 241, 38, 204, 216},{77, 244, 44, 211, 194}
},{{79, 230, 56, 31, 10},{79, 230, 56, 31, 10},{78, 232, 33, 59, 56},{73, 216, 22, 78, 77},{76, 234, 21, 104, 95},{74, 243, 28, 128, 161},{85, 217, 31, 155, 140},{81, 239, 23, 180, 153},{71, 241, 38, 204, 216},{77, 244, 44, 211, 194}
},{{79, 230, 56, 31, 10},{79, 230, 56, 31, 10},{73, 225, 46, 62, 60},{76, 226, 54, 93, 65},{76, 226, 54, 93, 65},{77, 223, 45, 128, 187},{69, 240, 60, 157, 144},{88, 229, 56, 186, 187},{74, 229, 66, 213, 188},{74, 229, 66, 213, 188}
},{{67, 239, 83, 12, 119},{79, 230, 56, 31, 10},{68, 234, 78, 40, 76},{71, 241, 84, 79, 41},{83, 240, 73, 99, 13},{72, 233, 79, 128, 234},{70, 233, 73, 173, 207},{75, 222, 70, 179, 228},{74, 229, 66, 213, 188},{74, 243, 75, 239, 153}
},{{88, 224, 103, 4, 95},{77, 229, 118, 19, 73},{82, 246, 103, 62, 121},{77, 244, 87, 72, 34},{86, 234, 96, 99, 59},{81, 228, 91, 128, 234},{58, 221, 89, 153, 163},{76, 243, 105, 177, 227},{61, 235, 82, 205, 205},{71, 230, 105, 252, 176}
},{{65, 238, 125, 1, 87},{77, 229, 118, 19, 73},{77, 229, 118, 19, 73},{76, 212, 139, 76, 219},{71, 241, 141, 96, 223},{83, 225, 128, 128, 54},{79, 229, 128, 175, 1},{79, 229, 128, 175, 1},{79, 233, 144, 209, 99},{66, 232, 131, 223, 114}
},{{76, 242, 147, 7, 174},{72, 215, 158, 21, 144},{81, 228, 172, 60, 161},{74, 210, 148, 78, 198},{71, 241, 141, 96, 223},{78, 237, 164, 128, 3},{78, 210, 148, 151, 27},{74, 227, 165, 167, 47},{79, 233, 144, 209, 99},{79, 233, 144, 209, 99}
},{{70, 234, 179, 16, 139},{76, 233, 187, 22, 140},{70, 231, 175, 58, 176},{81, 228, 172, 60, 161},{77, 232, 209, 99, 147},{69, 219, 178, 128, 40},{76, 244, 182, 144, 26},{74, 227, 165, 167, 47},{79, 223, 171, 202, 117},{71, 233, 182, 237, 113}
},{{76, 233, 187, 22, 140},{76, 233, 187, 22, 140},{78, 212, 216, 51, 245},{78, 236, 212, 67, 177},{77, 232, 209, 99, 147},{72, 228, 206, 128, 102},{95, 240, 204, 155, 124},{69, 224, 207, 188, 82},{71, 222, 204, 219, 10},{71, 222, 204, 219, 10}
},{{76, 233, 187, 22, 140},{76, 233, 187, 22, 140},{88, 227, 226, 65, 156},{78, 211, 232, 76, 189},{86, 223, 236, 100, 133},{79, 230, 224, 128, 77},{89, 233, 233, 144, 77},{89, 225, 226, 167, 121},{69, 223, 219, 201, 12},{71, 222, 204, 219, 10}
}}},{{{{101, 5, 36, 54, 246},{101, 5, 36, 54, 246},{101, 5, 36, 54, 246},{107, 3, 22, 77, 183},{101, 10, 13, 99, 133},{102, 4, 0, 128, 102},{107, 3, 9, 144, 117},{106, 4, 25, 184, 75},{107, 3, 37, 202, 3},{107, 3, 43, 211, 20}
},{{101, 5, 36, 54, 246},{101, 5, 36, 54, 246},{101, 5, 36, 54, 246},{107, 3, 22, 77, 183},{109, 3, 36, 103, 169},{107, 3, 27, 128, 119},{107, 3, 29, 141, 124},{106, 4, 25, 184, 75},{107, 3, 37, 202, 3},{107, 3, 43, 211, 20}
},{{106, 4, 63, 40, 253},{106, 4, 63, 40, 253},{101, 5, 36, 54, 246},{107, 3, 45, 91, 154},{107, 3, 45, 91, 154},{105, 5, 45, 128, 69},{99, 5, 55, 165, 112},{99, 5, 56, 186, 96},{107, 3, 40, 207, 11},{108, 3, 62, 230, 51}
},{{95, 6, 104, 4, 177},{106, 4, 63, 40, 253},{107, 3, 66, 46, 128},{94, 6, 82, 89, 215},{113, 2, 77, 114, 200},{102, 4, 79, 128, 41},{99, 5, 89, 151, 44},{103, 4, 74, 188, 17},{108, 3, 80, 206, 117},{107, 3, 81, 231, 90}
},{{95, 6, 104, 4, 177},{108, 3, 105, 14, 140},{104, 4, 88, 57, 137},{120, 2, 103, 62, 167},{107, 3, 117, 95, 198},{94, 6, 101, 128, 57},{99, 5, 89, 151, 44},{108, 3, 105, 177, 51},{108, 3, 80, 206, 117},{98, 21, 104, 227, 120}
},{{99, 5, 147, 7, 118},{101, 19, 128, 24, 106},{103, 4, 148, 39, 84},{113, 2, 144, 83, 52},{107, 3, 117, 95, 198},{112, 4, 128, 128, 240},{101, 9, 120, 163, 51},{108, 3, 105, 177, 51},{107, 3, 136, 201, 173},{107, 3, 147, 236, 147}
},{{99, 5, 147, 7, 118},{107, 3, 156, 31, 111},{103, 4, 148, 39, 84},{107, 3, 156, 88, 40},{107, 3, 150, 90, 32},{107, 3, 155, 128, 247},{97, 6, 159, 159, 227},{99, 24, 157, 184, 218},{102, 7, 144, 209, 164},{107, 3, 147, 236, 147}
},{{107, 3, 163, 8, 71},{101, 4, 188, 28, 69},{117, 2, 172, 60, 99},{119, 2, 177, 83, 19},{113, 2, 177, 93, 27},{107, 3, 174, 128, 194},{97, 6, 159, 159, 227},{114, 20, 176, 175, 253},{107, 3, 187, 204, 155},{107, 3, 185, 232, 189}
},{{103, 4, 191, 25, 65},{103, 4, 191, 25, 65},{105, 4, 212, 46, 19},{107, 3, 199, 92, 119},{107, 3, 199, 92, 119},{101, 5, 203, 126, 81},{101, 5, 203, 126, 81},{107, 3, 207, 187, 152},{107, 3, 187, 204, 155},{107, 3, 198, 225, 203}
},{{103, 4, 191, 25, 65},{103, 4, 191, 25, 65},{107, 3, 216, 51, 7},{101, 5, 222, 60, 6},{102, 4, 226, 112, 116},{107, 3, 228, 128, 136},{107, 3, 228, 128, 136},{107, 3, 229, 186, 179},{107, 3, 222, 196, 246},{107, 3, 198, 225, 203}
}},{{{99, 21, 36, 54, 224},{99, 21, 36, 54, 224},{99, 21, 36, 54, 224},{99, 21, 19, 83, 178},{102, 25, 6, 121, 132},{103, 28, 0, 128, 127},{103, 28, 0, 128, 127},{99, 34, 16, 164, 113},{103, 31, 27, 187, 92},{98, 23, 43, 211, 9}
},{{99, 21, 36, 54, 224},{99, 21, 36, 54, 224},{99, 21, 36, 54, 224},{99, 21, 19, 83, 178},{98, 27, 26, 104, 143},{99, 21, 18, 128, 96},{99, 21, 29, 163, 76},{103, 31, 27, 187, 92},{103, 31, 27, 187, 92},{98, 23, 43, 211, 9}
},{{115, 21, 59, 29, 196},{115, 21, 59, 29, 196},{99, 21, 36, 54, 224},{89, 24, 46, 62, 213},{98, 27, 26, 104, 143},{104, 24, 45, 128, 89},{107, 28, 39, 153, 77},{108, 36, 56, 186, 78},{99, 16, 51, 196},{98, 23, 54, 221, 26}
},{{126, 25, 70, 20, 177},{89, 23, 78, 39, 163},{89, 23, 78, 39, 163},{99, 21, 78, 102, 218},{99, 21, 78, 102, 218},{99, 21, 81, 128, 35},{110, 30, 73, 135, 58},{114, 23, 79, 186, 20},{115, 26, 76, 199, 102},{94, 26, 75, 239, 100}
},{{95, 6, 104, 4, 177},{97, 24, 122, 22, 145},{111, 32, 103, 62, 146},{103, 33, 110, 68, 232},{99, 21, 78, 102, 218},{99, 21, 105, 128, 27},{115, 21, 108, 163, 45},{111, 17, 105, 177, 34},{98, 22, 89, 213, 124},{98, 21, 104, 227, 120}
},{{101, 19, 128, 24, 106},{101, 19, 128, 24, 106},{109, 25, 122, 60, 182},{109, 25, 122, 60, 182},{103, 33, 145, 106, 57},{104, 23, 128, 128, 251},{97, 25, 148, 156, 244},{113, 44, 125, 186, 30},{118, 25, 145, 205, 183},{115, 21, 114, 232, 120}
},{{92, 23, 147, 7, 91},{108, 25, 135, 28, 106},{109, 25, 171, 45, 118},{115, 20, 158, 79, 50},{103, 33, 145, 106, 57},{111, 22, 153, 118, 18},{97, 25, 148, 156, 244},{99, 24, 157, 184, 218},{98, 22, 163, 202, 153},{98, 21, 157, 238, 128}
},{{94, 6, 182, 18, 120},{115, 30, 188, 22, 67},{109, 25, 171, 45, 118},{100, 23, 175, 92, 4},{104, 30, 173, 105, 54},{108, 23, 180, 128, 203},{108, 23, 180, 128, 203},{114, 20, 176, 175, 253},{98, 21, 172, 206, 145},{104, 30, 182, 237, 169}
},{{99, 21, 201, 33, 26},{99, 21, 201, 33, 26},{99, 17, 209, 42, 13},{103, 26, 212, 67, 110},{99, 21, 203, 117, 76},{99, 21, 211, 128, 161},{98, 21, 220, 156, 179},{100, 8, 207, 188, 155},{100, 8, 207, 188, 155},{104, 30, 182, 237, 169}
},{{99, 21, 201, 33, 26},{99, 21, 201, 33, 26},{99, 21, 223, 60, 17},{99, 21, 226, 65, 81},{115, 21, 225, 105, 106},{98, 21, 230, 128, 149},{98, 21, 220, 156, 179},{98, 22, 235, 172, 183},{107, 3, 222, 196, 246},{104, 30, 182, 237, 169}
}},{{{109, 53, 56, 31, 251},{109, 53, 56, 31, 251},{96, 53, 29, 65, 141},{98, 58, 21, 81, 152},{98, 57, 12, 103, 180},{105, 51, 0, 128, 94},{101, 48, 10, 147, 72},{101, 50, 15, 163, 127},{101, 50, 15, 163, 127},{111, 55, 59, 219, 60}
},{{109, 53, 56, 31, 251},{109, 53, 56, 31, 251},{96, 53, 29, 65, 141},{98, 58, 25, 72, 141},{98, 57, 12, 103, 180},{111, 38, 25, 128, 84},{101, 46, 13, 156, 94},{101, 50, 15, 163, 127},{90, 63, 33, 197, 5},{111, 55, 59, 219, 60}
},{{109, 53, 56, 31, 251},{109, 53, 56, 31, 251},{109, 53, 56, 31, 251},{102, 42, 36, 63, 211},{100, 53, 49, 129, 101},{100, 53, 49, 129, 101},{115, 60, 52, 151, 104},{109, 49, 44, 191, 75},{101, 52, 61, 206, 38},{111, 55, 59, 219, 60}
},{{85, 59, 86, 10, 182},{107, 56, 78, 40, 177},{107, 56, 78, 40, 177},{90, 57, 82, 87, 226},{99, 21, 78, 102, 218},{92, 48, 79, 128, 39},{102, 54, 70, 158, 12},{100, 53, 77, 189, 37},{101, 52, 61, 206, 38},{105, 72, 76, 222, 55}
},{{100, 68, 103, 4, 199},{102, 49, 121, 22, 188},{95, 40, 112, 60, 191},{103, 33, 110, 68, 232},{82, 63, 98, 99, 232},{105, 58, 97, 128, 54},{99, 53, 81, 142, 13},{108, 45, 106, 177, 30},{108, 45, 106, 177, 30},{95, 54, 105, 252, 120}
},{{95, 65, 129, 1, 26},{102, 49, 121, 22, 188},{102, 49, 121, 22, 188},{103, 33, 110, 68, 232},{109, 45, 139, 100, 43},{101, 47, 128, 128, 206},{98, 51, 148, 156, 221},{113, 44, 125, 186, 30},{91, 52, 124, 194, 85},{97, 59, 135, 221, 132}
},{{93, 55, 147, 7, 122},{102, 49, 121, 22, 188},{102, 43, 171, 45, 79},{91, 54, 148, 91, 38},{103, 68, 157, 99, 89},{94, 55, 165, 128, 200},{98, 51, 148, 156, 221},{98, 51, 148, 156, 221},{101, 54, 149, 206, 140},{101, 54, 149, 206, 140}
},{{101, 71, 167, 10, 11},{102, 62, 197, 30, 7},{102, 43, 171, 45, 79},{92, 57, 178, 70, 21},{102, 37, 171, 111, 3},{88, 55, 180, 128, 223},{112, 44, 179, 164, 207},{100, 36, 169, 182, 219},{101, 54, 149, 206, 140},{100, 59, 182, 237, 128}
},{{102, 62, 197, 30, 7},{102, 62, 197, 30, 7},{101, 51, 212, 67, 69},{101, 51, 212, 67, 69},{105, 58, 209, 99, 101},{106, 54, 209, 128, 137},{106, 54, 209, 128, 137},{108, 45, 207, 188, 182},{101, 59, 203, 214, 199},{101, 59, 203, 214, 199}
},{{102, 62, 197, 30, 7},{102, 62, 197, 30, 7},{107, 60, 226, 66, 115},{110, 53, 235, 83, 103},{100, 44, 228, 115, 91},{109, 47, 219, 128, 157},{99, 31, 221, 161, 132},{118, 58, 226, 167, 141},{100, 65, 217, 203, 179},{101, 59, 203, 214, 199}
}},{{{103, 78, 65, 26, 246},{103, 78, 65, 26, 246},{90, 68, 32, 60, 134},{105, 78, 26, 83, 234},{106, 83, 13, 99, 211},{104, 76, 0, 128, 32},{94, 76, 10, 149, 9},{94, 76, 10, 149, 9},{90, 63, 33, 197, 5},{112, 75, 64, 232, 23}
},{{103, 78, 65, 26, 246},{103, 78, 65, 26, 246},{90, 68, 32, 60, 134},{105, 78, 26, 83, 234},{105, 78, 26, 83, 234},{106, 84, 21, 128, 47},{94, 76, 10, 149, 9},{118, 67, 31, 175, 1},{90, 63, 33, 197, 5},{112, 75, 64, 232, 23}
},{{103, 78, 65, 26, 246},{103, 78, 65, 26, 246},{105, 81, 56, 31, 155},{105, 91, 57, 88, 215},{102, 83, 74, 99, 152},{105, 76, 45, 128, 12},{115, 60, 52, 151, 104},{92, 80, 56, 186, 10},{98, 97, 56, 203, 116},{112, 75, 64, 232, 23}
},{{111, 74, 73, 24, 240},{103, 78, 65, 26, 246},{95, 87, 78, 40, 234},{105, 86, 75, 91, 171},{102, 83, 74, 99, 152},{101, 81, 58, 128, 10},{102, 54, 70, 158, 12},{103, 80, 74, 189, 68},{101, 70, 74, 197, 40},{105, 72, 76, 222, 55}
},{{100, 68, 103, 4, 199},{100, 68, 103, 4, 199},{98, 97, 100, 55, 212},{113, 84, 103, 62, 248},{98, 97, 100, 97, 130},{103, 84, 104, 128, 95},{103, 84, 104, 128, 95},{125, 73, 105, 178, 107},{117, 74, 105, 199, 21},{116, 80, 98, 228, 38}
},{{95, 65, 129, 1, 26},{103, 69, 126, 14, 214},{110, 83, 126, 52, 243},{110, 83, 122, 76, 143},{106, 92, 129, 99, 80},{106, 75, 128, 128, 165},{93, 73, 123, 143, 100},{128, 80, 125, 177, 152},{103, 82, 141, 201, 245},{108, 83, 108, 234, 61}
},{{102, 74, 144, 3, 59},{102, 74, 144, 3, 59},{110, 83, 126, 52, 243},{107, 64, 148, 87, 108},{103, 68, 157, 99, 89},{103, 85, 149, 126, 93},{95, 82, 148, 155, 134},{120, 86, 150, 179, 143},{103, 82, 141, 201, 245},{103, 82, 141, 201, 245}
},{{101, 71, 167, 10, 11},{101, 71, 167, 10, 11},{102, 58, 172, 60, 72},{98, 97, 184, 81, 110},{103, 68, 157, 99, 89},{98, 80, 175, 128, 153},{98, 80, 175, 128, 153},{119, 69, 182, 167, 167},{91, 93, 185, 205, 246},{100, 59, 182, 237, 128}
},{{102, 62, 197, 30, 7},{102, 62, 197, 30, 7},{111, 74, 195, 59, 89},{101, 80, 212, 67, 38},{100, 87, 209, 99, 5},{103, 74, 191, 128, 150},{118, 86, 204, 148, 252},{89, 64, 207, 188, 238},{99, 74, 218, 201, 190},{98, 96, 203, 220, 145}
},{{102, 62, 197, 30, 7},{102, 62, 197, 30, 7},{101, 80, 212, 67, 38},{101, 80, 212, 67, 38},{116, 76, 243, 104, 39},{116, 72, 232, 128, 208},{98, 97, 224, 146, 245},{99, 74, 218, 201, 190},{99, 74, 218, 201, 190},{99, 74, 218, 201, 190}
}},{{{98, 97, 42, 47, 130},{98, 97, 42, 47, 130},{98, 96, 32, 60, 154},{98, 97, 22, 77, 220},{98, 97, 10, 108, 225},{98, 97, 0, 128, 7},{98, 97, 10, 148, 25},{98, 97, 13, 156, 22},{94, 114, 33, 197, 76},{94, 114, 33, 197, 76}
},{{98, 97, 42, 47, 130},{98, 97, 42, 47, 130},{98, 96, 32, 60, 154},{98, 97, 24, 75, 212},{98, 97, 13, 98, 232},{98, 97, 31, 128, 24},{98, 97, 13, 156, 22},{83, 99, 23, 179, 16},{94, 114, 33, 197, 76},{94, 114, 33, 197, 76}
},{{98, 97, 57, 32, 158},{98, 97, 57, 32, 158},{98, 97, 42, 47, 130},{111, 116, 53, 83, 249},{105, 91, 57, 88, 215},{107, 99, 43, 128, 39},{81, 101, 49, 154, 27},{106, 94, 44, 191, 35},{98, 97, 56, 203, 116},{101, 110, 75, 224, 36}
},{{103, 96, 74, 17, 216},{103, 96, 74, 17, 216},{110, 99, 78, 40, 239},{98, 97, 80, 69, 146},{102, 83, 74, 99, 152},{93, 99, 79, 128, 117},{107, 100, 93, 156, 74},{103, 97, 90, 175, 119},{98, 97, 56, 203, 116},{101, 110, 75, 224, 36}
},{{100, 68, 103, 4, 199},{124, 111, 98, 25, 236},{98, 97, 100, 55, 212},{105, 103, 102, 62, 210},{98, 97, 100, 97, 130},{98, 97, 105, 128, 110},{107, 100, 93, 156, 74},{99, 98, 96, 181, 80},{116, 103, 101, 189, 79},{98, 97, 111, 240, 24}
},{{98, 97, 132, 6, 5},{105, 92, 118, 19, 212},{106, 105, 112, 48, 199},{98, 95, 120, 72, 137},{106, 92, 129, 99, 80},{100, 104, 128, 128, 136},{103, 121, 129, 156, 135},{104, 112, 130, 173, 179},{89, 108, 128, 191, 142},{98, 97, 111, 240, 24}
},{{88, 103, 142, 2, 55},{113, 104, 159, 28, 30},{114, 103, 160, 54, 7},{114, 103, 160, 54, 7},{76, 107, 156, 101, 90},{103, 94, 152, 128, 165},{94, 107, 148, 156, 185},{103, 115, 149, 181, 176},{110, 108, 147, 203, 222},{118, 98, 152, 221, 213}
},{{98, 97, 181, 18, 32},{98, 97, 181, 18, 32},{113, 111, 175, 58, 15},{98, 97, 184, 81, 110},{107, 96, 187, 88, 108},{101, 108, 180, 128, 185},{107, 108, 183, 168, 156},{107, 108, 183, 168, 156},{91, 93, 185, 205, 246},{98, 96, 187, 234, 215}
},{{98, 102, 199, 31, 88},{98, 102, 199, 31, 88},{98, 100, 216, 51, 105},{101, 103, 199, 70, 7},{105, 114, 209, 99, 45},{102, 94, 205, 128, 241},{117, 102, 202, 150, 203},{111, 97, 207, 188, 249},{98, 94, 210, 212, 190},{98, 96, 203, 220, 145}
},{{98, 102, 199, 31, 88},{98, 102, 199, 31, 88},{98, 100, 216, 51, 105},{98, 97, 234, 82, 63},{98, 98, 241, 97, 20},{98, 97, 229, 128, 226},{98, 97, 224, 146, 245},{125, 104, 226, 167, 212},{98, 86, 215, 205, 170},{98, 96, 203, 220, 145}
}},{{{101, 122, 56, 31, 188},{101, 122, 56, 31, 188},{128, 128, 34, 56, 158},{128, 128, 22, 79, 221},{103, 124, 6, 121, 224},{104, 124, 0, 128, 16},{104, 124, 0, 128, 16},{128, 128, 23, 179, 32},{94, 114, 33, 197, 76},{117, 128, 43, 210, 136}
},{{101, 122, 56, 31, 188},{101, 122, 56, 31, 188},{128, 128, 34, 56, 158},{128, 128, 22, 79, 221},{128, 128, 17, 105, 252},{117, 125, 25, 128, 21},{86, 124, 11, 150, 51},{128, 128, 23, 179, 32},{94, 114, 33, 197, 76},{117, 128, 43, 210, 136}
},{{101, 122, 56, 31, 188},{101, 122, 56, 31, 188},{101, 122, 56, 31, 188},{111, 116, 53, 83, 249},{101, 128, 45, 128, 204},{101, 128, 45, 128, 204},{100, 113, 54, 144, 55},{102, 128, 56, 186, 224},{102, 128, 56, 186, 224},{85, 134, 59, 225, 141}
},{{128, 128, 80, 14, 218},{101, 122, 56, 31, 188},{128, 128, 71, 45, 238},{128, 128, 80, 83, 135},{93, 128, 78, 128, 151},{93, 128, 78, 128, 151},{105, 126, 64, 134, 85},{105, 133, 74, 189, 159},{106, 121, 74, 197, 24},{107, 122, 78, 240, 43}
},{{128, 128, 105, 4, 233},{99, 130, 118, 19},{90, 126, 103, 62, 249},{90, 126, 103, 62, 249},{97, 128, 118, 101, 118},{111, 126, 106, 128, 127},{128, 128, 103, 159, 124},{104, 134, 105, 177, 178},{105, 124, 93, 189, 113},{85, 116, 97, 233, 45}
},{{111, 135, 136, 1, 229},{99, 130, 118, 19},{128, 128, 128, 50, 54},{128, 128, 124, 83, 171},{97, 128, 118, 101, 118},{101, 128, 128, 128, 97},{103, 121, 129, 156, 135},{104, 112, 130, 173, 179},{107, 127, 142, 201, 215},{128, 128, 126, 229, 31}
},{{95, 126, 147, 7, 49},{95, 126, 147, 7, 49},{128, 128, 148, 53, 37},{85, 128, 157, 68, 136},{90, 144, 153, 104, 191},{104, 131, 155, 128, 116},{88, 129, 150, 159, 84},{103, 115, 149, 181, 176},{107, 127, 142, 201, 215},{94, 126, 139, 222, 241}
},{{95, 126, 147, 7, 49},{97, 122, 198, 31, 70},{94, 128, 172, 60, 202},{94, 128, 172, 60, 202},{99, 160, 178, 102, 147},{102, 136, 180, 128, 94},{102, 136, 180, 128, 94},{128, 128, 178, 186, 140},{128, 128, 182, 204, 254},{110, 135, 185, 230, 50}
},{{97, 122, 198, 31, 70},{97, 122, 198, 31, 70},{97, 122, 198, 31, 70},{128, 128, 207, 72, 3},{93, 124, 204, 104, 1},{107, 128, 204, 128, 35},{107, 128, 204, 128, 35},{128, 128, 206, 180, 254},{128, 128, 209, 198, 147},{110, 135, 185, 230, 50}
},{{97, 122, 198, 31, 70},{97, 122, 198, 31, 70},{89, 138, 222, 60, 181},{89, 142, 232, 77, 246},{90, 129, 231, 102, 222},{103, 134, 224, 128, 5},{128, 128, 229, 152, 249},{118, 115, 226, 167, 196},{128, 128, 219, 200, 151},{110, 135, 185, 230, 50}
}},{{{107, 154, 32, 60, 105},{107, 154, 32, 60, 105},{107, 154, 32, 60, 105},{107, 154, 32, 60, 105},{104, 161, 0, 128, 205},{104, 161, 0, 128, 205},{105, 158, 10, 148, 237},{105, 158, 10, 148, 237},{89, 146, 33, 197, 171},{89, 146, 33, 197, 171}
},{{107, 154, 32, 60, 105},{107, 154, 32, 60, 105},{107, 154, 32, 60, 105},{107, 154, 32, 60, 105},{87, 157, 20, 114, 40},{101, 149, 40, 128, 220},{105, 158, 10, 148, 237},{125, 150, 23, 180, 204},{89, 146, 33, 197, 171},{89, 146, 33, 197, 171}
},{{97, 161, 56, 31, 99},{97, 161, 56, 31, 99},{111, 148, 57, 48, 118},{92, 161, 46, 62, 105},{115, 150, 58, 97, 58},{108, 154, 45, 128, 223},{97, 172, 54, 156, 227},{88, 150, 52, 173, 211},{106, 155, 44, 191, 230},{97, 172, 63, 230, 144}
},{{92, 155, 92, 8, 23},{97, 161, 56, 31, 99},{111, 148, 57, 48, 118},{96, 183, 82, 83, 82},{97, 172, 74, 103, 100},{106, 146, 76, 128, 176},{91, 158, 72, 152, 145},{101, 158, 74, 188, 137},{101, 158, 74, 188, 137},{109, 158, 75, 225, 221}
},{{92, 155, 92, 8, 23},{101, 154, 129, 23, 237},{83, 149, 97, 49, 18},{116, 170, 103, 62, 3},{102, 159, 99, 128, 158},{102, 159, 99, 128, 158},{102, 159, 99, 128, 158},{104, 134, 105, 177, 178},{124, 156, 94, 211, 233},{90, 143, 95, 223, 209}
},{{101, 154, 129, 23, 237},{101, 154, 129, 23, 237},{101, 154, 129, 23, 237},{97, 172, 141, 81, 149},{86, 158, 132, 101, 173},{99, 152, 131, 128, 124},{99, 152, 131, 128, 124},{99, 147, 133, 175, 94},{109, 154, 133, 207, 57},{109, 154, 133, 207, 57}
},{{101, 166, 144, 3, 212},{101, 154, 129, 23, 237},{104, 154, 175, 58, 227},{117, 166, 155, 79, 131},{90, 144, 153, 104, 191},{105, 161, 161, 128, 109},{111, 150, 153, 147, 119},{90, 147, 154, 181, 98},{90, 156, 146, 202, 26},{93, 169, 147, 223, 60}
},{{97, 172, 176, 14, 247},{89, 153, 186, 21, 235},{104, 154, 175, 58, 227},{104, 154, 175, 58, 227},{99, 160, 178, 102, 147},{103, 149, 180, 128, 66},{94, 151, 181, 156, 100},{94, 151, 181, 156, 100},{104, 162, 182, 212, 44},{110, 158, 193, 229, 80}
},{{97, 155, 198, 31, 167},{97, 155, 198, 31, 167},{99, 157, 212, 67, 237},{99, 157, 212, 67, 237},{97, 158, 209, 99, 201},{107, 153, 204, 128, 58},{107, 153, 204, 128, 58},{113, 140, 207, 188, 10},{92, 166, 204, 197, 119},{110, 158, 193, 229, 80}
},{{97, 155, 198, 31, 167},{97, 155, 198, 31, 167},{94, 162, 223, 60, 155},{97, 172, 230, 74, 229},{102, 140, 238, 111, 239},{106, 154, 220, 128, 40},{108, 162, 243, 152, 33},{97, 172, 231, 181, 27},{97, 171, 221, 198, 85},{110, 158, 193, 229, 80}
}},{{{97, 172, 49, 38, 94},{97, 172, 49, 38, 94},{87, 173, 34, 58, 102},{86, 179, 22, 78, 57},{104, 181, 0, 128, 217},{104, 181, 0, 128, 217},{97, 172, 10, 147, 208},{97, 173, 20, 173, 241},{97, 173, 40, 200, 168},{97, 172, 63, 230, 144}
},{{97, 172, 49, 38, 94},{97, 172, 49, 38, 94},{87, 173, 34, 58, 102},{86, 179, 22, 78, 57},{111, 184, 13, 99, 61},{104, 186, 22, 128, 192},{97, 172, 10, 147, 208},{97, 173, 20, 173, 241},{97, 173, 40, 200, 168},{97, 172, 63, 230, 144}
},{{97, 172, 52, 35, 94},{97, 172, 52, 35, 94},{97, 172, 49, 38, 94},{96, 190, 46, 62, 74},{103, 184, 53, 128, 238},{103, 184, 53, 128, 238},{97, 172, 54, 156, 227},{103, 195, 51, 171, 184},{97, 173, 40, 200, 168},{97, 172, 63, 230, 144}
},{{98, 177, 80, 14, 9},{98, 177, 80, 14, 9},{98, 190, 78, 40, 62},{96, 183, 82, 83, 82},{97, 172, 74, 103, 100},{97, 172, 75, 128, 130},{97, 172, 77, 151, 147},{102, 185, 73, 173, 191},{97, 183, 74, 196, 220},{97, 172, 75, 239, 237}
},{{105, 186, 110, 3, 58},{97, 172, 94, 18, 5},{104, 184, 96, 56, 12},{104, 184, 96, 56, 12},{99, 178, 102, 118, 69},{105, 178, 101, 128, 186},{105, 178, 101, 128, 186},{114, 164, 105, 177, 138},{99, 188, 119, 204, 224},{98, 184, 105, 229, 210}
},{{101, 182, 135, 1, 209},{93, 183, 129, 23, 248},{97, 194, 134, 47, 142},{97, 172, 141, 81, 149},{103, 181, 128, 128, 86},{103, 181, 128, 128, 86},{95, 183, 133, 153, 112},{97, 173, 124, 186, 142},{99, 188, 119, 204, 224},{97, 180, 116, 234, 207}
},{{104, 183, 145, 3, 201},{98, 185, 147, 7, 203},{113, 182, 171, 45, 197},{96, 180, 169, 74, 179},{92, 162, 155, 104, 137},{99, 181, 165, 128, 119},{110, 180, 150, 154, 82},{92, 179, 147, 179, 75},{104, 175, 133, 193, 7},{96, 178, 147, 228, 33}
},{{97, 172, 176, 14, 247},{97, 172, 176, 14, 247},{113, 182, 171, 45, 197},{96, 180, 169, 74, 179},{99, 160, 178, 102, 147},{94, 175, 180, 128, 65},{104, 177, 178, 165, 74},{104, 177, 178, 165, 74},{97, 172, 185, 196, 52},{97, 172, 173, 232, 12}
},{{97, 172, 202, 35, 160},{97, 172, 202, 35, 160},{97, 172, 202, 35, 160},{91, 173, 196, 67, 245},{99, 188, 209, 99, 233},{96, 177, 204, 128, 25},{101, 187, 201, 149, 6},{113, 180, 207, 188, 50},{97, 172, 213, 209, 77},{97, 171, 198, 225, 105}
},{{97, 172, 202, 35, 160},{97, 172, 202, 35, 160},{97, 172, 227, 66, 232},{96, 175, 232, 76, 239},{96, 175, 234, 101, 196},{96, 175, 233, 128, 34},{89, 177, 220, 150, 38},{97, 172, 231, 181, 27},{97, 171, 221, 198, 85},{97, 171, 198, 225, 105}
}},{{{90, 200, 56, 31, 49},{90, 200, 56, 31, 49},{104, 214, 46, 62, 42},{96, 197, 26, 89, 98},{102, 198, 6, 121, 91},{107, 208, 0, 128, 191},{105, 203, 7, 137, 168},{102, 216, 30, 181, 145},{109, 198, 28, 190, 141},{109, 198, 28, 190, 141}
},{{90, 200, 56, 31, 49},{90, 200, 56, 31, 49},{104, 214, 46, 62, 42},{96, 197, 26, 89, 98},{96, 197, 26, 89, 98},{97, 200, 24, 128, 181},{109, 212, 29, 157, 189},{102, 216, 30, 181, 145},{109, 198, 28, 190, 141},{109, 198, 28, 190, 141}
},{{90, 200, 56, 31, 49},{90, 200, 56, 31, 49},{104, 214, 46, 62, 42},{104, 214, 46, 62, 42},{78, 211, 51, 95, 117},{109, 202, 45, 128, 142},{103, 195, 51, 171, 184},{103, 195, 51, 171, 184},{108, 200, 44, 191, 179},{116, 220, 53, 222, 199}
},{{114, 200, 91, 8, 109},{98, 190, 78, 40, 62},{98, 190, 78, 40, 62},{115, 199, 82, 85, 55},{111, 206, 86, 97, 18},{100, 204, 75, 132, 227},{102, 202, 75, 135, 228},{113, 204, 72, 185, 200},{104, 197, 85, 199, 187},{110, 203, 88, 246, 143}
},{{105, 186, 110, 3, 58},{108, 198, 117, 20, 79},{110, 207, 96, 51, 118},{102, 198, 103, 62, 125},{102, 212, 96, 95, 9},{107, 208, 106, 128, 213},{107, 208, 106, 128, 213},{90, 203, 105, 177, 205},{104, 197, 85, 199, 187},{108, 202, 109, 220, 147}
},{{101, 182, 135, 1, 209},{108, 198, 117, 20, 79},{97, 194, 134, 47, 142},{88, 203, 123, 101, 9},{88, 203, 123, 101, 9},{100, 200, 128, 128, 40},{100, 200, 128, 128, 40},{115, 199, 129, 182, 7},{98, 195, 128, 216, 125},{98, 195, 128, 216, 125}
},{{112, 197, 142, 2, 189},{100, 222, 147, 7, 170},{97, 194, 134, 47, 142},{74, 210, 148, 78, 198},{121, 193, 153, 105, 204},{103, 196, 136, 128, 47},{98, 197, 148, 151, 32},{101, 194, 147, 167, 23},{105, 195, 138, 201, 109},{116, 220, 154, 227, 85}
},{{105, 220, 183, 19, 149},{105, 220, 183, 19, 149},{108, 218, 177, 59, 184},{108, 218, 177, 59, 184},{102, 211, 180, 128, 5},{102, 211, 180, 128, 5},{104, 188, 182, 158, 120},{93, 207, 189, 167, 12},{83, 196, 178, 194, 99},{91, 216, 179, 226, 86}
},{{89, 210, 205, 37, 231},{89, 210, 205, 37, 231},{103, 208, 212, 67, 164},{103, 208, 212, 67, 164},{99, 188, 209, 99, 233},{109, 206, 199, 128, 96},{110, 200, 201, 148, 127},{84, 193, 205, 175, 115},{116, 220, 200, 200, 44},{77, 208, 198, 225, 62}
},{{89, 210, 205, 37, 231},{89, 210, 205, 37, 231},{103, 208, 212, 67, 164},{103, 208, 212, 67, 164},{108, 196, 232, 97, 165},{101, 202, 235, 128, 64},{103, 206, 226, 167, 104},{103, 206, 226, 167, 104},{103, 206, 226, 167, 104},{77, 208, 198, 225, 62}
}},{{{101, 240, 64, 24, 73},{101, 244, 51, 36, 2},{102, 242, 33, 58, 11},{101, 244, 14, 95, 68},{101, 244, 11, 106, 116},{102, 224, 0, 128, 130},{99, 229, 7, 137, 140},{101, 244, 23, 178, 176},{102, 230, 44, 191, 151},{101, 247, 41, 208, 239}
},{{101, 240, 64, 24, 73},{101, 244, 51, 36, 2},{102, 242, 33, 58, 11},{101, 244, 32, 75, 126},{101, 244, 14, 97, 122},{106, 231, 24, 128, 145},{92, 221, 31, 159, 133},{103, 223, 31, 182, 149},{102, 230, 44, 191, 151},{101, 247, 41, 208, 239}
},{{101, 240, 64, 24, 73},{101, 244, 51, 36, 2},{101, 244, 51, 36, 2},{101, 244, 32, 75, 126},{108, 243, 51, 118, 94},{97, 219, 49, 128, 143},{103, 234, 42, 134, 165},{102, 230, 44, 191, 151},{102, 230, 44, 191, 151},{116, 220, 53, 222, 199}
},{{103, 228, 78, 40, 97},{103, 228, 78, 40, 97},{103, 228, 78, 40, 97},{114, 222, 77, 85, 48},{101, 244, 70, 95, 12},{109, 228, 79, 128, 194},{101, 244, 80, 157, 216},{100, 237, 74, 188, 251},{98, 236, 82, 207, 151},{113, 239, 73, 237, 190}
},{{101, 244, 102, 5, 118},{105, 219, 117, 20, 87},{98, 228, 103, 62, 91},{98, 228, 103, 62, 91},{86, 234, 96, 99, 59},{99, 245, 97, 128, 243},{98, 223, 97, 142, 214},{109, 226, 105, 177, 211},{98, 236, 82, 207, 151},{116, 222, 98, 230, 170}
},{{101, 244, 115, 2, 100},{105, 219, 117, 20, 87},{118, 218, 125, 45, 120},{101, 244, 139, 62, 160},{100, 229, 128, 128, 5},{100, 229, 128, 128, 5},{100, 229, 128, 128, 5},{107, 234, 120, 183, 202},{101, 244, 131, 209, 71},{101, 244, 131, 212, 66}
},{{101, 244, 154, 5, 138},{100, 222, 147, 7, 170},{101, 222, 171, 45, 185},{116, 220, 149, 65, 248},{101, 244, 162, 101, 210},{101, 244, 152, 128, 13},{110, 240, 148, 156, 18},{112, 217, 157, 190, 14},{84, 230, 144, 209, 119},{116, 220, 154, 227, 85}
},{{111, 234, 175, 18, 188},{105, 220, 183, 19, 149},{101, 222, 171, 45, 185},{108, 218, 177, 59, 184},{119, 233, 170, 102, 214},{101, 244, 175, 128, 58},{101, 244, 176, 148, 49},{106, 246, 184, 179, 19},{101, 244, 190, 209, 122},{93, 235, 182, 237, 105}
},{{105, 220, 183, 19, 149},{110, 220, 204, 37, 223},{111, 231, 193, 53, 248},{88, 226, 202, 89, 173},{115, 225, 209, 99, 164},{96, 226, 199, 128, 65},{95, 240, 204, 155, 124},{116, 221, 208, 178, 79},{101, 244, 217, 203, 7},{101, 245, 193, 230, 51}
},{{105, 220, 183, 19, 149},{101, 244, 215, 49, 243},{101, 244, 221, 58, 242},{118, 228, 234, 81, 173},{112, 227, 228, 98, 145},{102, 230, 222, 128, 90},{102, 239, 225, 168, 68},{102, 239, 225, 168, 68},{101, 244, 217, 203, 7},{101, 245, 193, 230, 51}
}}},{{{{130, 2, 32, 60, 24},{130, 2, 32, 60, 24},{130, 2, 32, 60, 24},{128, 2, 27, 79, 82},{128, 1, 0, 128, 133},{128, 1, 0, 128, 133},{128, 2, 7, 137, 136},{128, 2, 18, 169, 189},{128, 2, 18, 169, 189},{127, 2, 57, 220, 28}
},{{130, 2, 32, 60, 24},{130, 2, 32, 60, 24},{130, 2, 32, 60, 24},{128, 2, 27, 79, 82},{128, 2, 27, 79, 82},{127, 2, 28, 128, 101},{128, 2, 18, 169, 189},{135, 2, 27, 184, 162},{135, 2, 27, 184, 162},{127, 2, 57, 220, 28}
},{{129, 2, 100, 5, 102},{129, 2, 46, 62, 23},{129, 2, 46, 62, 23},{129, 2, 46, 62, 23},{128, 2, 45, 128, 171},{128, 2, 45, 128, 171},{123, 2, 59, 160, 102},{130, 2, 46, 169, 131},{127, 2, 57, 220, 28},{127, 2, 57, 220, 28}
},{{129, 2, 100, 5, 102},{125, 13, 74, 43, 149},{125, 13, 74, 43, 149},{128, 1, 82, 107, 60},{128, 1, 82, 107, 60},{131, 2, 76, 132, 205},{130, 2, 76, 135, 207},{126, 18, 77, 189, 24},{108, 3, 80, 206, 117},{124, 3, 74, 233, 88}
},{{129, 2, 100, 5, 102},{134, 7, 104, 26, 119},{128, 2, 103, 62, 95},{128, 2, 103, 62, 95},{130, 8, 100, 93, 55},{138, 2, 105, 128, 229},{152, 4, 96, 159, 231},{108, 3, 105, 177, 51},{131, 11, 97, 201, 164},{140, 2, 104, 236, 142}
},{{130, 2, 104, 4, 104},{122, 14, 117, 20, 145},{136, 9, 128, 68, 193},{136, 9, 128, 68, 193},{123, 8, 128, 128, 247},{123, 8, 128, 128, 247},{123, 8, 128, 128, 247},{134, 4, 113, 186, 205},{125, 2, 113, 194, 72},{128, 2, 130, 236, 104}
},{{128, 7, 158, 6, 155},{107, 3, 156, 31, 111},{135, 2, 168, 54, 159},{113, 2, 144, 83, 52},{141, 2, 150, 108, 241},{131, 2, 166, 127, 220},{126, 15, 151, 138, 232},{152, 4, 153, 189, 60},{127, 12, 156, 212, 191},{128, 2, 130, 236, 104}
},{{121, 2, 178, 16, 93},{121, 2, 178, 16, 93},{126, 2, 172, 60, 104},{119, 2, 177, 83, 19},{124, 2, 177, 100, 47},{129, 2, 180, 116, 199},{142, 6, 189, 152, 41},{114, 20, 176, 175, 253},{128, 2, 194, 201, 13},{112, 3, 182, 237, 172}
},{{121, 2, 178, 16, 93},{141, 2, 209, 42, 240},{136, 2, 200, 51, 245},{134, 2, 210, 72, 154},{142, 2, 201, 97, 160},{120, 2, 203, 128, 181},{125, 8, 217, 150, 190},{128, 2, 194, 201, 13},{128, 2, 194, 201, 13},{107, 3, 198, 225, 203}
},{{130, 2, 222, 58, 224},{130, 2, 222, 58, 224},{130, 2, 222, 58, 224},{125, 2, 227, 67, 91},{144, 3, 241, 97, 135},{120, 2, 228, 128, 154},{126, 2, 226, 167, 189},{126, 2, 226, 167, 189},{107, 3, 222, 196, 246},{107, 3, 198, 225, 203}
}},{{{128, 28, 69, 20, 73},{130, 34, 46, 42, 32},{136, 27, 32, 60, 11},{142, 28, 23, 75, 74},{136, 27, 9, 111, 113},{124, 23, 0, 128, 111},{124, 23, 0, 128, 111},{126, 12, 19, 171, 78},{118, 25, 32, 196, 15},{123, 28, 60, 227, 60}
},{{128, 28, 69, 20, 73},{130, 34, 46, 42, 32},{136, 27, 32, 60, 11},{142, 28, 23, 75, 74},{136, 27, 14, 110, 119},{129, 27, 24, 128, 134},{129, 27, 24, 128, 134},{136, 27, 25, 185, 183},{118, 25, 32, 196, 15},{123, 28, 60, 227, 60}
},{{128, 28, 69, 20, 73},{128, 28, 69, 20, 73},{130, 34, 46, 42, 32},{135, 26, 45, 70, 114},{130, 23, 54, 116, 83},{128, 25, 48, 132, 169},{121, 23, 54, 152, 68},{132, 24, 56, 186, 154},{136, 27, 41, 201, 247},{123, 28, 60, 227, 60}
},{{126, 25, 70, 20, 177},{126, 25, 70, 20, 177},{125, 13, 74, 43, 149},{136, 27, 84, 76, 15},{130, 23, 67, 110, 60},{126, 23, 79, 128, 34},{123, 33, 85, 143, 4},{125, 27, 77, 189, 18},{115, 26, 76, 199, 102},{123, 28, 60, 227, 60}
},{{135, 30, 110, 3, 112},{134, 7, 104, 26, 119},{134, 22, 103, 62, 77},{118, 23, 108, 79, 198},{116, 23, 111, 95, 215},{133, 22, 102, 128, 241},{136, 27, 102, 148, 229},{136, 27, 99, 186, 206},{136, 27, 105, 209, 175},{115, 21, 114, 232, 120}
},{{135, 30, 110, 3, 112},{127, 35, 125, 31, 186},{127, 35, 125, 31, 186},{118, 23, 108, 79, 198},{127, 28, 128, 128, 231},{127, 28, 128, 128, 231},{136, 27, 126, 143, 230},{136, 27, 137, 177, 47},{136, 27, 131, 212, 64},{136, 27, 131, 212, 64}
},{{143, 30, 152, 4, 137},{136, 27, 161, 29, 171},{136, 27, 157, 44, 166},{115, 20, 158, 79, 50},{136, 27, 161, 105, 223},{124, 33, 163, 128, 250},{128, 44, 147, 155, 32},{136, 27, 137, 177, 47},{118, 25, 145, 205, 183},{129, 39, 151, 228, 81}
},{{128, 7, 158, 6, 155},{115, 30, 188, 22, 67},{136, 27, 184, 47, 128},{123, 18, 172, 60, 125},{136, 27, 177, 114, 212},{116, 19, 180, 128, 215},{136, 27, 188, 158, 53},{114, 20, 176, 175, 253},{125, 27, 192, 213, 247},{136, 27, 183, 220, 124}
},{{115, 20, 202, 34, 11},{115, 20, 202, 34, 11},{130, 23, 212, 67, 134},{130, 23, 212, 67, 134},{136, 27, 207, 103, 191},{136, 27, 204, 128, 91},{136, 27, 201, 157, 67},{139, 23, 207, 188, 107},{136, 27, 215, 206, 14},{136, 27, 204, 219}
},{{124, 31, 223, 60, 4},{124, 31, 223, 60, 4},{124, 31, 223, 60, 4},{121, 29, 225, 87, 86},{115, 21, 225, 105, 106},{136, 27, 228, 128, 115},{125, 20, 226, 167, 168},{125, 20, 226, 167, 168},{136, 27, 220, 199, 12},{136, 27, 204, 219}
}},{{{128, 50, 33, 62, 41},{128, 50, 33, 62, 41},{128, 50, 33, 62, 41},{128, 50, 33, 62, 41},{128, 54, 0, 128, 178},{128, 54, 0, 128, 178},{128, 54, 0, 128, 178},{128, 54, 0, 128, 178},{136, 34, 25, 184, 143},{141, 57, 62, 230, 232}
},{{128, 50, 33, 62, 41},{128, 50, 33, 62, 41},{128, 50, 33, 62, 41},{128, 50, 33, 62, 41},{132, 52, 24, 128, 172},{132, 52, 24, 128, 172},{130, 46, 30, 138, 188},{136, 34, 25, 184, 143},{136, 34, 25, 184, 143},{141, 57, 62, 230, 232}
},{{134, 51, 73, 18, 106},{117, 58, 56, 31, 236},{124, 45, 46, 62, 197},{124, 45, 46, 62, 197},{127, 55, 65, 104, 229},{129, 52, 40, 128, 153},{115, 60, 52, 151, 104},{114, 56, 44, 184, 90},{101, 52, 61, 206, 38},{141, 57, 62, 230, 232}
},{{134, 51, 73, 18, 106},{134, 51, 73, 18, 106},{128, 54, 67, 36, 85},{136, 27, 84, 76, 15},{127, 55, 65, 104, 229},{128, 51, 79, 128, 248},{128, 51, 79, 128, 248},{122, 47, 74, 188, 39},{129, 64, 81, 206, 218},{141, 57, 62, 230, 232}
},{{132, 61, 88, 10, 111},{134, 52, 116, 20, 86},{133, 56, 103, 62, 96},{133, 56, 103, 62, 96},{145, 52, 99, 95, 29},{127, 53, 92, 128, 18},{137, 56, 92, 141, 228},{143, 51, 105, 177, 224},{129, 64, 81, 206, 218},{132, 60, 105, 252, 169}
},{{132, 64, 142, 2, 204},{128, 58, 139, 24, 173},{139, 52, 124, 49, 118},{125, 54, 132, 97, 42},{125, 54, 132, 97, 42},{128, 49, 128, 128, 53},{128, 49, 128, 128, 53},{113, 44, 125, 186, 30},{129, 72, 136, 202, 15},{129, 39, 151, 228, 81}
},{{136, 46, 147, 7, 182},{128, 58, 139, 24, 173},{136, 50, 168, 54, 160},{125, 54, 132, 97, 42},{125, 54, 132, 97, 42},{133, 49, 158, 128, 46},{124, 49, 148, 156, 193},{133, 46, 168, 175, 40},{142, 54, 147, 200, 103},{129, 39, 151, 228, 81}
},{{130, 60, 172, 21, 131},{130, 60, 172, 21, 131},{136, 50, 168, 54, 160},{141, 45, 175, 69, 206},{126, 53, 178, 128, 253},{126, 53, 178, 128, 253},{126, 53, 178, 128, 253},{131, 54, 185, 169, 33},{130, 49, 194, 206, 59},{121, 66, 182, 237, 228}
},{{138, 62, 188, 22, 154},{138, 62, 188, 22, 154},{118, 54, 197, 64, 65},{128, 41, 212, 67, 186},{118, 55, 210, 99, 116},{132, 49, 198, 128, 119},{132, 49, 198, 128, 119},{140, 48, 207, 188, 75},{130, 49, 194, 206, 59},{136, 34, 192, 230, 8}
},{{131, 42, 222, 59, 200},{131, 42, 222, 59, 200},{131, 42, 222, 59, 200},{110, 53, 235, 83, 103},{122, 56, 244, 107, 89},{124, 57, 228, 128, 165},{124, 58, 226, 167, 135},{124, 58, 226, 167, 135},{140, 63, 216, 205, 34},{140, 63, 216, 205, 34}
}},{{{123, 77, 56, 31, 149},{123, 77, 56, 31, 149},{127, 80, 32, 60, 183},{130, 101, 22, 77, 56},{128, 73, 0, 128, 205},{128, 73, 0, 128, 205},{125, 85, 11, 151, 48},{128, 91, 23, 179, 251},{128, 91, 23, 179, 251},{112, 75, 64, 232, 23}
},{{123, 77, 56, 31, 149},{123, 77, 56, 31, 149},{127, 80, 32, 60, 183},{127, 80, 32, 60, 183},{124, 70, 24, 128, 38},{124, 70, 24, 128, 38},{125, 85, 11, 151, 48},{128, 91, 23, 179, 251},{128, 91, 23, 179, 251},{112, 75, 64, 232, 23}
},{{123, 77, 56, 31, 149},{123, 77, 56, 31, 149},{130, 73, 46, 62, 95},{130, 73, 46, 62, 95},{132, 76, 54, 128, 250},{132, 76, 54, 128, 250},{131, 74, 50, 144, 239},{129, 85, 52, 173, 201},{141, 81, 44, 191, 203},{112, 75, 64, 232, 23}
},{{136, 77, 96, 7, 38},{136, 75, 67, 22, 18},{132, 68, 80, 37, 49},{124, 86, 94, 83, 163},{124, 70, 86, 103, 143},{127, 82, 79, 128, 102},{128, 76, 65, 164, 173},{130, 69, 76, 177, 190},{129, 64, 81, 206, 218},{141, 83, 75, 220, 205}
},{{136, 77, 96, 7, 38},{130, 78, 116, 20, 40},{113, 84, 103, 62, 248},{124, 86, 94, 83, 163},{124, 70, 86, 103, 143},{121, 77, 106, 128, 90},{129, 82, 110, 148, 173},{125, 73, 105, 178, 107},{117, 74, 105, 199, 21},{116, 80, 98, 228, 38}
},{{132, 64, 142, 2, 204},{130, 78, 116, 20, 40},{110, 83, 126, 52, 243},{110, 83, 122, 76, 143},{125, 76, 128, 128, 181},{125, 76, 128, 128, 181},{125, 76, 128, 128, 181},{128, 80, 125, 177, 152},{129, 72, 136, 202, 15},{132, 70, 131, 217, 28}
},{{136, 71, 145, 3, 217},{128, 58, 139, 24, 173},{128, 75, 171, 45, 201},{124, 69, 177, 68, 72},{118, 90, 153, 110, 95},{130, 76, 155, 128, 81},{122, 88, 148, 156, 174},{120, 86, 150, 179, 143},{129, 72, 136, 202, 15},{129, 64, 163, 216, 62}
},{{130, 60, 172, 21, 131},{128, 75, 171, 45, 201},{128, 75, 171, 45, 201},{124, 69, 177, 68, 72},{128, 82, 180, 128, 98},{128, 82, 180, 128, 98},{128, 82, 180, 128, 98},{119, 69, 182, 167, 167},{129, 64, 163, 216, 62},{121, 66, 182, 237, 228}
},{{138, 62, 188, 22, 154},{138, 62, 188, 22, 154},{111, 74, 195, 59, 89},{134, 82, 212, 67, 199},{128, 67, 209, 99, 245},{132, 86, 204, 128, 26},{118, 86, 204, 148, 252},{131, 74, 207, 188, 62},{131, 74, 207, 188, 62},{121, 66, 182, 237, 228}
},{{138, 62, 188, 22, 154},{147, 85, 222, 59, 167},{147, 85, 222, 59, 167},{115, 94, 226, 78, 5},{116, 76, 243, 104, 39},{116, 72, 232, 128, 208},{124, 58, 226, 167, 135},{124, 58, 226, 167, 135},{140, 63, 216, 205, 34},{140, 63, 216, 205, 34}
}},{{{128, 105, 56, 31, 74},{128, 105, 56, 31, 74},{130, 101, 22, 77, 56},{130, 101, 22, 77, 56},{126, 93, 0, 128, 39},{126, 93, 0, 128, 39},{125, 85, 11, 151, 48},{128, 91, 23, 179, 251},{128, 91, 23, 179, 251},{128, 91, 23, 179, 251}
},{{128, 105, 56, 31, 74},{128, 105, 56, 31, 74},{130, 101, 22, 77, 56},{130, 101, 22, 77, 56},{130, 101, 22, 77, 56},{129, 117, 24, 128, 232},{116, 106, 26, 168, 40},{128, 91, 23, 179, 251},{128, 91, 23, 179, 251},{128, 128, 59, 227, 92}
},{{128, 105, 56, 31, 74},{128, 105, 56, 31, 74},{134, 93, 58, 47, 74},{130, 101, 22, 77, 56},{115, 111, 58, 97, 195},{128, 108, 45, 128, 197},{128, 108, 45, 128, 197},{129, 85, 52, 173, 201},{136, 106, 56, 186, 228},{128, 128, 59, 227, 92}
},{{128, 101, 90, 20, 47},{128, 101, 90, 20, 47},{129, 115, 78, 40, 16},{130, 106, 82, 93, 99},{130, 106, 82, 93, 99},{129, 96, 79, 128, 170},{129, 96, 79, 128, 170},{140, 103, 77, 189, 159},{133, 92, 74, 197, 210},{123, 109, 72, 236, 54}
},{{128, 101, 90, 20, 47},{124, 111, 98, 25, 236},{128, 106, 102, 62, 54},{128, 106, 102, 62, 54},{138, 113, 97, 97, 127},{128, 92, 111, 128, 183},{137, 98, 96, 148, 155},{136, 93, 105, 177, 137},{116, 103, 101, 189, 79},{121, 99, 104, 251, 13}
},{{123, 114, 132, 1, 8},{140, 102, 129, 23, 248},{128, 128, 128, 50, 54},{126, 92, 110, 70, 142},{126, 104, 128, 128, 146},{126, 104, 128, 128, 146},{126, 104, 128, 128, 146},{125, 94, 128, 190, 153},{128, 104, 135, 214, 61},{128, 104, 135, 214, 61}
},{{130, 107, 147, 7, 249},{113, 104, 159, 28, 30},{114, 103, 160, 54, 7},{128, 128, 151, 87, 68},{118, 90, 153, 110, 95},{125, 103, 136, 128, 150},{124, 105, 148, 156, 153},{120, 86, 150, 179, 143},{128, 104, 135, 214, 61},{118, 98, 152, 221, 213}
},{{136, 101, 186, 21, 198},{136, 101, 186, 21, 198},{136, 100, 168, 54, 246},{128, 128, 174, 74, 96},{130, 90, 190, 95, 189},{131, 105, 180, 128, 90},{128, 99, 184, 169, 118},{128, 99, 184, 169, 118},{120, 99, 183, 213, 253},{120, 99, 183, 213, 253}
},{{136, 101, 186, 21, 198},{136, 101, 186, 21, 198},{128, 101, 212, 67, 246},{128, 101, 212, 67, 246},{124, 93, 204, 108, 5},{131, 106, 208, 128, 61},{117, 102, 202, 150, 203},{128, 128, 206, 180, 254},{128, 128, 209, 198, 147},{128, 128, 193, 229, 160}
},{{136, 101, 186, 21, 198},{136, 101, 186, 21, 198},{128, 101, 212, 67, 246},{115, 94, 226, 78, 5},{129, 109, 235, 110, 237},{134, 103, 235, 128, 14},{125, 104, 226, 167, 212},{125, 104, 226, 167, 212},{128, 128, 219, 200, 151},{128, 128, 193, 229, 160}
}},{{{128, 128, 42, 47, 129},{128, 128, 42, 47, 129},{128, 128, 34, 56, 158},{128, 128, 22, 79, 221},{128, 128, 17, 105, 252},{128, 128, 0, 128, 4},{128, 128, 12, 153, 17},{128, 128, 23, 179, 32},{128, 128, 38, 204, 110},{128, 128, 59, 227, 92}
},{{128, 128, 42, 47, 129},{128, 128, 42, 47, 129},{128, 128, 34, 56, 158},{128, 128, 22, 79, 221},{128, 128, 17, 105, 252},{128, 128, 25, 128, 29},{128, 128, 12, 153, 17},{128, 128, 23, 179, 32},{128, 128, 38, 204, 110},{128, 128, 59, 227, 92}
},{{128, 128, 67, 22, 209},{128, 128, 67, 22, 209},{128, 128, 55, 47, 156},{128, 128, 22, 79, 221},{128, 128, 51, 128, 55},{128, 128, 51, 128, 55},{128, 128, 49, 133, 48},{128, 128, 49, 180, 1},{128, 128, 38, 204, 110},{128, 128, 59, 227, 92}
},{{128, 128, 80, 14, 218},{128, 128, 67, 22, 209},{128, 128, 71, 45, 238},{128, 128, 80, 83, 135},{128, 128, 80, 83, 135},{128, 128, 76, 128, 72},{128, 128, 73, 135, 74},{128, 128, 78, 179, 121},{128, 128, 74, 189, 115},{128, 128, 69, 235, 42}
},{{128, 128, 105, 4, 233},{128, 128, 113, 33, 212},{128, 128, 101, 60, 221},{128, 128, 105, 74, 167},{128, 128, 102, 121, 155},{128, 128, 102, 128, 98},{128, 128, 103, 159, 124},{128, 128, 101, 181, 84},{128, 128, 97, 197, 32},{128, 128, 102, 250, 24}
},{{128, 128, 121, 1, 252},{128, 128, 128, 25, 29},{128, 128, 128, 50, 54},{128, 128, 124, 83, 171},{128, 128, 121, 110, 147},{128, 128, 128, 128, 132},{128, 128, 125, 150, 111},{128, 128, 125, 171, 82},{128, 128, 126, 209, 43},{128, 128, 126, 229, 31}
},{{128, 128, 148, 6, 22},{128, 128, 148, 8, 24},{128, 128, 148, 53, 37},{128, 128, 151, 87, 68},{128, 128, 148, 109, 125},{128, 128, 153, 128, 157},{128, 128, 143, 151, 156},{128, 128, 153, 180, 169},{128, 128, 145, 207, 218},{128, 128, 157, 249, 224}
},{{128, 128, 167, 10, 41},{128, 128, 187, 22, 41},{128, 128, 178, 56, 14},{128, 128, 174, 74, 96},{128, 128, 166, 88, 122},{128, 128, 178, 128, 182},{128, 128, 176, 146, 166},{128, 128, 178, 186, 140},{128, 128, 182, 204, 254},{128, 129, 182, 237, 222}
},{{128, 128, 194, 27, 93},{128, 128, 194, 27, 93},{128, 128, 204, 62, 118},{128, 128, 207, 72, 3},{128, 128, 209, 99, 54},{128, 128, 204, 128, 200},{128, 128, 202, 148, 218},{128, 128, 206, 180, 254},{128, 128, 209, 198, 147},{128, 128, 193, 229, 160}
},{{128, 128, 194, 27, 93},{128, 128, 194, 27, 93},{128, 128, 222, 60, 102},{128, 128, 228, 69, 37},{128, 128, 227, 110, 9},{128, 128, 230, 128, 226},{128, 128, 229, 152, 249},{128, 128, 207, 178, 249},{128, 128, 219, 200, 151},{128, 128, 193, 229, 160}
}},{{{131, 137, 56, 31, 169},{131, 137, 56, 31, 169},{116, 148, 32, 60, 120},{128, 128, 22, 79, 221},{129, 156, 6, 121, 230},{125, 148, 0, 128, 237},{125, 148, 0, 128, 237},{125, 150, 23, 180, 204},{125, 150, 23, 180, 204},{125, 150, 23, 180, 204}
},{{131, 137, 56, 31, 169},{131, 137, 56, 31, 169},{116, 148, 32, 60, 120},{128, 128, 22, 79, 221},{128, 128, 17, 105, 252},{123, 145, 24, 128, 246},{122, 158, 23, 155, 236},{125, 150, 23, 180, 204},{125, 150, 23, 180, 204},{125, 150, 23, 180, 204}
},{{131, 137, 56, 31, 169},{131, 137, 56, 31, 169},{111, 148, 57, 48, 118},{132, 148, 62, 71, 237},{115, 150, 58, 97, 58},{127, 138, 45, 128, 220},{128, 169, 51, 146, 12},{124, 161, 54, 180, 219},{129, 153, 44, 191, 15},{128, 128, 59, 227, 92}
},{{128, 128, 80, 14, 218},{130, 158, 78, 40, 254},{130, 158, 78, 40, 254},{132, 148, 62, 71, 237},{131, 147, 96, 97, 149},{135, 149, 79, 128, 89},{125, 160, 65, 160, 184},{121, 151, 76, 179, 149},{131, 153, 74, 197, 17},{109, 158, 75, 225, 221}
},{{128, 128, 105, 4, 233},{122, 149, 116, 20, 11},{134, 147, 111, 58, 196},{128, 128, 105, 74, 167},{131, 147, 96, 97, 149},{125, 149, 109, 128, 129},{128, 128, 103, 159, 124},{134, 149, 105, 178, 76},{124, 156, 94, 211, 233},{124, 156, 94, 211, 233}
},{{128, 150, 147, 7, 6},{128, 146, 129, 23},{128, 128, 128, 50, 54},{128, 128, 124, 83, 171},{126, 150, 128, 128, 108},{126, 150, 128, 128, 108},{127, 129, 130, 151, 111},{134, 149, 105, 178, 76},{109, 154, 133, 207, 57},{143, 156, 132, 229, 246}
},{{128, 150, 147, 7, 6},{128, 161, 152, 8, 53},{128, 128, 148, 53, 37},{117, 166, 155, 79, 131},{128, 128, 148, 109, 125},{122, 158, 164, 128, 68},{128, 141, 148, 153, 132},{128, 128, 153, 180, 169},{128, 128, 145, 207, 218},{119, 143, 140, 222, 46}
},{{128, 150, 147, 7, 6},{137, 151, 187, 22, 55},{132, 158, 171, 45, 24},{128, 128, 174, 74, 96},{109, 157, 182, 98, 160},{133, 154, 177, 128, 170},{133, 154, 177, 128, 170},{128, 128, 178, 186, 140},{128, 142, 170, 196, 228},{128, 148, 188, 233, 197}
},{{137, 151, 187, 22, 55},{137, 151, 187, 22, 55},{124, 146, 212, 67, 253},{124, 146, 212, 67, 253},{123, 171, 209, 99, 230},{121, 154, 208, 128, 55},{128, 128, 202, 148, 218},{128, 128, 206, 180, 254},{128, 128, 209, 198, 147},{128, 148, 188, 233, 197}
},{{137, 151, 187, 22, 55},{137, 151, 187, 22, 55},{128, 128, 222, 60, 102},{128, 128, 228, 69, 37},{124, 163, 242, 101, 204},{129, 149, 237, 128, 253},{125, 160, 226, 167, 28},{125, 160, 226, 167, 28},{128, 128, 219, 200, 151},{128, 148, 188, 233, 197}
}},{{{129, 183, 30, 63, 147},{129, 183, 30, 63, 147},{129, 183, 30, 63, 147},{123, 184, 22, 78, 31},{129, 176, 0, 128, 53},{129, 176, 0, 128, 53},{129, 183, 8, 142, 52},{128, 187, 23, 180, 28},{128, 187, 23, 180, 28},{128, 187, 23, 180, 28}
},{{129, 183, 30, 63, 147},{129, 183, 30, 63, 147},{129, 183, 30, 63, 147},{123, 184, 22, 78, 31},{119, 168, 13, 99, 53},{135, 180, 24, 128, 47},{138, 175, 30, 146, 45},{128, 187, 23, 180, 28},{128, 187, 23, 180, 28},{114, 173, 52, 215, 184}
},{{133, 172, 56, 31, 138},{133, 172, 56, 31, 138},{133, 172, 56, 31, 138},{136, 170, 64, 67, 165},{135, 167, 57, 96, 253},{130, 182, 45, 128, 29},{128, 169, 51, 146, 12},{142, 185, 51, 179, 51},{114, 173, 52, 215, 184},{114, 173, 52, 215, 184}
},{{120, 177, 93, 8, 24},{123, 194, 78, 14, 125},{130, 158, 78, 40, 254},{136, 170, 64, 67, 165},{133, 186, 91, 109, 141},{132, 186, 76, 128, 118},{138, 173, 73, 135, 109},{128, 180, 74, 189, 71},{128, 180, 74, 189, 71},{138, 191, 73, 225, 25}
},{{120, 177, 93, 8, 24},{128, 175, 116, 20, 203},{116, 170, 103, 62, 3},{116, 170, 103, 62, 3},{133, 186, 91, 109, 141},{105, 178, 101, 128, 186},{114, 181, 92, 143, 144},{132, 186, 105, 177, 98},{119, 179, 87, 191, 168},{127, 171, 105, 252, 197}
},{{129, 200, 120, 1, 180},{128, 168, 129, 23, 58},{129, 194, 113, 44, 154},{142, 178, 142, 76, 122},{128, 178, 128, 128, 182},{128, 178, 128, 128, 182},{128, 178, 128, 128, 182},{128, 188, 125, 192, 5},{132, 182, 135, 206, 255},{135, 181, 129, 221, 234}
},{{128, 161, 152, 8, 53},{128, 161, 152, 8, 53},{113, 182, 171, 45, 197},{142, 178, 142, 76, 122},{121, 193, 153, 105, 204},{133, 172, 153, 128, 180},{142, 179, 148, 152, 181},{128, 195, 142, 181, 252},{130, 176, 144, 209, 247},{118, 180, 136, 225, 47}
},{{147, 175, 185, 20, 21},{117, 178, 193, 26, 152},{127, 182, 180, 64, 185},{127, 182, 180, 64, 185},{128, 178, 180, 128, 130},{128, 178, 180, 128, 130},{128, 178, 180, 128, 130},{115, 166, 171, 172, 86},{138, 194, 181, 211, 170},{127, 172, 191, 231, 15}
},{{117, 178, 193, 26, 152},{117, 178, 193, 26, 152},{121, 185, 196, 64, 192},{131, 181, 201, 91, 32},{131, 181, 201, 91, 32},{131, 173, 204, 128, 230},{131, 173, 204, 128, 230},{125, 177, 207, 188, 59},{125, 177, 207, 188, 59},{127, 172, 191, 231, 15}
},{{117, 178, 193, 26, 152},{117, 178, 193, 26, 152},{141, 178, 212, 67, 44},{140, 193, 230, 72, 103},{127, 191, 221, 104, 241},{128, 169, 224, 128, 205},{125, 160, 226, 167, 28},{125, 177, 207, 188, 59},{125, 177, 207, 188, 59},{127, 172, 191, 231, 15}
}},{{{136, 206, 56, 31, 229},{136, 206, 56, 31, 229},{141, 205, 32, 60, 216},{143, 206, 20, 83, 130},{125, 200, 1, 128, 176},{125, 200, 1, 128, 176},{123, 200, 7, 137, 185},{128, 187, 23, 180, 28},{146, 199, 33, 198, 54},{146, 199, 33, 198, 54}
},{{136, 206, 56, 31, 229},{136, 206, 56, 31, 229},{141, 205, 32, 60, 216},{143, 206, 20, 83, 130},{122, 207, 24, 128, 169},{122, 207, 24, 128, 169},{129, 203, 30, 155, 75},{128, 187, 23, 180, 28},{146, 199, 33, 198, 54},{146, 199, 33, 198, 54}
},{{136, 206, 56, 31, 229},{136, 206, 56, 31, 229},{136, 199, 56, 48, 195},{126, 214, 46, 62, 60},{133, 207, 51, 106, 151},{126, 215, 53, 128, 152},{134, 198, 44, 153, 113},{125, 200, 51, 175, 173},{126, 197, 44, 191, 172},{116, 220, 53, 222, 199}
},{{123, 194, 78, 14, 125},{123, 194, 78, 14, 125},{136, 199, 56, 48, 195},{115, 199, 82, 85, 55},{111, 206, 86, 97, 18},{127, 197, 73, 128, 247},{133, 204, 63, 163, 81},{127, 204, 74, 188, 193},{127, 204, 74, 188, 193},{132, 204, 78, 241, 115}
},{{129, 200, 120, 1, 180},{137, 202, 99, 35, 135},{118, 204, 103, 62, 103},{118, 204, 103, 62, 103},{123, 205, 119, 98, 39},{120, 207, 104, 128, 219},{135, 202, 90, 140, 31},{118, 198, 105, 177, 236},{125, 199, 135, 202, 115},{116, 222, 98, 230, 170}
},{{129, 200, 120, 1, 180},{125, 214, 116, 20, 79},{118, 218, 125, 45, 120},{123, 205, 119, 98, 39},{123, 205, 119, 98, 39},{128, 204, 128, 128, 200},{131, 204, 132, 150, 217},{132, 213, 132, 176, 225},{125, 199, 135, 202, 115},{140, 206, 136, 227, 173}
},{{126, 195, 147, 7, 173},{126, 195, 147, 7, 173},{142, 203, 171, 45, 71},{116, 220, 149, 65, 248},{121, 193, 153, 105, 204},{133, 203, 143, 128, 197},{131, 204, 132, 150, 217},{128, 195, 142, 181, 252},{132, 192, 154, 200, 146},{116, 220, 154, 227, 85}
},{{126, 217, 185, 20, 142},{126, 217, 185, 20, 142},{142, 203, 171, 45, 71},{127, 182, 180, 64, 185},{131, 211, 178, 116, 18},{128, 204, 190, 128, 246},{137, 200, 175, 159, 245},{137, 200, 175, 159, 245},{138, 194, 181, 211, 170},{133, 186, 182, 237, 224}
},{{130, 194, 194, 27, 29},{130, 194, 194, 27, 29},{141, 204, 215, 50, 32},{137, 201, 214, 65, 83},{127, 191, 221, 104, 241},{131, 199, 202, 128, 138},{110, 200, 201, 148, 127},{121, 217, 207, 188, 87},{127, 215, 192, 194, 46},{116, 221, 206, 216, 59}
},{{130, 194, 194, 27, 29},{130, 194, 194, 27, 29},{141, 204, 215, 50, 32},{140, 193, 230, 72, 103},{127, 191, 221, 104, 241},{124, 200, 223, 128, 111},{126, 213, 226, 167, 106},{126, 213, 226, 167, 106},{117, 220, 222, 193, 50},{116, 221, 206, 216, 59}
}},{{{136, 230, 56, 31, 205},{136, 230, 56, 31, 205},{123, 221, 33, 59, 56},{116, 220, 22, 79, 117},{127, 230, 0, 128, 157},{127, 230, 0, 128, 157},{127, 230, 0, 128, 157},{128, 236, 25, 178, 67},{128, 236, 25, 178, 67},{117, 238, 51, 219, 247}
},{{136, 230, 56, 31, 205},{136, 230, 56, 31, 205},{123, 221, 33, 59, 56},{116, 220, 22, 79, 117},{119, 226, 13, 99, 127},{125, 226, 24, 128, 131},{119, 232, 14, 159, 138},{128, 236, 25, 178, 67},{128, 236, 25, 178, 67},{117, 238, 51, 219, 247}
},{{136, 230, 56, 31, 205},{136, 230, 56, 31, 205},{126, 214, 46, 62, 60},{126, 214, 46, 62, 60},{133, 207, 51, 106, 151},{126, 235, 49, 128, 160},{126, 235, 49, 128, 160},{124, 231, 64, 184, 231},{121, 229, 44, 191, 139},{117, 238, 51, 219, 247}
},{{123, 194, 78, 14, 125},{136, 230, 56, 31, 205},{103, 228, 78, 40, 97},{114, 222, 77, 85, 48},{128, 255, 78, 110, 219},{139, 228, 79, 128, 36},{120, 232, 79, 150, 205},{144, 230, 74, 177, 9},{136, 233, 76, 220, 117},{136, 233, 76, 220, 117}
},{{124, 255, 101, 5, 103},{116, 220, 109, 20, 85},{116, 220, 102, 54, 124},{122, 237, 103, 62, 74},{137, 225, 99, 95, 208},{135, 224, 99, 130, 2},{128, 244, 108, 152, 4},{132, 234, 105, 177, 50},{138, 222, 94, 193, 79},{116, 222, 98, 230, 170}
},{{119, 215, 134, 1, 163},{124, 255, 128, 23, 144},{118, 218, 125, 45, 120},{122, 237, 103, 62, 74},{128, 232, 128, 128, 236},{128, 232, 128, 128, 236},{128, 232, 128, 128, 236},{132, 213, 132, 176, 225},{128, 214, 144, 200, 138},{116, 220, 120, 236, 184}
},{{122, 235, 147, 7, 129},{122, 235, 147, 7, 129},{120, 255, 148, 50, 165},{116, 220, 149, 65, 248},{119, 233, 170, 102, 214},{128, 227, 159, 128, 248},{123, 227, 148, 156, 20},{123, 227, 148, 156, 20},{128, 214, 144, 200, 138},{116, 220, 154, 227, 85}
},{{126, 217, 185, 20, 142},{126, 217, 185, 20, 142},{116, 220, 173, 56, 185},{119, 244, 188, 76, 247},{119, 233, 170, 102, 214},{132, 231, 190, 128, 217},{135, 229, 186, 171, 247},{135, 229, 186, 171, 247},{132, 237, 182, 211, 136},{134, 232, 182, 237, 177}
},{{129, 225, 200, 33, 13},{129, 225, 200, 33, 13},{129, 225, 200, 33, 13},{138, 222, 210, 71, 69},{115, 225, 209, 99, 164},{119, 231, 200, 130, 94},{119, 231, 200, 130, 94},{116, 221, 208, 178, 79},{116, 220, 200, 200, 44},{116, 221, 206, 216, 59}
},{{129, 225, 200, 33, 13},{129, 225, 200, 33, 13},{116, 220, 229, 71, 142},{118, 228, 234, 81, 173},{126, 227, 239, 93, 171},{126, 229, 222, 128, 65},{129, 239, 226, 167, 175},{129, 239, 226, 167, 175},{117, 220, 222, 193, 50},{116, 221, 206, 216, 59}
}}},{{{{152, 4, 48, 39, 15},{152, 4, 48, 39, 15},{152, 4, 31, 62, 57},{152, 4, 29, 76, 73},{152, 4, 13, 98, 119},{153, 4, 0, 128, 153},{152, 4, 11, 151, 132},{152, 4, 24, 180, 180},{152, 4, 24, 180, 180},{151, 4, 47, 215, 239}
},{{152, 4, 48, 39, 15},{152, 4, 48, 39, 15},{152, 4, 31, 62, 57},{152, 4, 29, 76, 73},{152, 4, 13, 98, 119},{147, 3, 25, 128, 141},{152, 4, 23, 156, 147},{152, 4, 24, 180, 180},{152, 4, 24, 180, 180},{151, 4, 47, 215, 239}
},{{152, 4, 48, 39, 15},{152, 4, 48, 39, 15},{152, 4, 48, 39, 15},{152, 4, 29, 76, 73},{155, 5, 44, 93, 107},{151, 4, 53, 128, 162},{153, 4, 57, 151, 183},{167, 8, 51, 178, 170},{151, 4, 47, 215, 239},{151, 4, 60, 228, 207}
},{{152, 4, 81, 13, 68},{152, 4, 81, 13, 68},{155, 5, 78, 40, 124},{150, 4, 72, 93, 3},{152, 4, 81, 101, 44},{152, 4, 81, 128, 201},{147, 3, 63, 155, 176},{147, 3, 71, 165, 246},{149, 18, 76, 211, 156},{152, 4, 72, 234, 186}
},{{152, 4, 103, 4, 123},{152, 4, 103, 4, 123},{153, 4, 103, 62, 64},{153, 4, 103, 62, 64},{152, 4, 81, 101, 44},{144, 3, 100, 128, 243},{152, 4, 96, 159, 231},{152, 4, 96, 159, 231},{152, 4, 121, 197, 164},{140, 2, 104, 236, 142}
},{{163, 7, 132, 1, 165},{140, 10, 116, 20, 98},{153, 4, 103, 62, 64},{136, 9, 128, 68, 193},{151, 6, 128, 128, 21},{151, 6, 128, 128, 21},{154, 4, 112, 155, 241},{158, 11, 128, 182, 39},{152, 4, 121, 197, 164},{128, 2, 130, 236, 104}
},{{153, 4, 158, 6, 129},{153, 4, 158, 6, 129},{152, 4, 154, 66, 192},{152, 4, 154, 66, 192},{141, 2, 150, 108, 241},{152, 4, 147, 128, 11},{151, 4, 171, 150, 42},{152, 4, 153, 189, 60},{151, 4, 157, 197, 79},{144, 3, 155, 213, 89}
},{{153, 4, 174, 14, 185},{156, 5, 181, 18, 186},{142, 2, 168, 54, 150},{152, 5, 169, 89, 233},{152, 4, 181, 97, 204},{152, 4, 178, 128, 42},{151, 4, 171, 150, 42},{151, 9, 198, 179, 111},{163, 7, 194, 204, 46},{152, 4, 178, 238, 68}
},{{152, 4, 206, 39, 241},{152, 4, 206, 39, 241},{152, 4, 206, 39, 241},{134, 2, 210, 72, 154},{142, 2, 201, 97, 160},{152, 4, 204, 134, 82},{151, 4, 209, 146, 84},{152, 4, 204, 190, 106},{152, 4, 204, 190, 106},{148, 3, 182, 237, 72}
},{{152, 4, 206, 39, 241},{152, 4, 206, 39, 241},{152, 4, 227, 66, 185},{152, 4, 232, 78, 190},{155, 5, 219, 108, 173},{152, 4, 234, 128, 114},{151, 4, 217, 153, 87},{152, 4, 229, 184, 69},{152, 4, 220, 199, 3},{152, 4, 220, 199, 3}
}},{{{152, 30, 56, 31, 37},{152, 30, 56, 31, 37},{155, 28, 36, 64, 103},{142, 28, 23, 75, 74},{151, 27, 0, 128, 136},{151, 27, 0, 128, 136},{151, 27, 0, 128, 136},{152, 4, 24, 180, 180},{136, 27, 32, 196, 243},{136, 27, 32, 196, 243}
},{{152, 30, 56, 31, 37},{152, 30, 56, 31, 37},{155, 28, 36, 64, 103},{142, 28, 23, 75, 74},{149, 16, 25, 113, 105},{158, 23, 24, 128, 149},{158, 28, 32, 141, 171},{152, 4, 24, 180, 180},{136, 27, 32, 196, 243},{136, 27, 32, 196, 243}
},{{152, 30, 56, 31, 37},{152, 30, 56, 31, 37},{162, 27, 46, 62, 45},{160, 25, 59, 76, 74},{157, 26, 47, 128, 172},{157, 26, 47, 128, 172},{154, 27, 53, 171, 155},{154, 27, 53, 171, 155},{136, 27, 41, 201, 247},{151, 4, 60, 228, 207}
},{{155, 28, 95, 7, 91},{136, 27, 72, 28, 67},{161, 40, 75, 51, 117},{160, 25, 59, 76, 74},{152, 4, 81, 101, 44},{164, 25, 79, 128, 246},{159, 18, 83, 151, 205},{154, 31, 73, 174, 230},{149, 18, 76, 211, 156},{160, 37, 76, 219, 150}
},{{155, 28, 95, 7, 91},{155, 28, 95, 7, 91},{149, 42, 103, 62, 98},{161, 33, 107, 86, 57},{168, 22, 99, 93, 4},{158, 28, 103, 128, 225},{136, 27, 102, 148, 229},{145, 34, 105, 177, 239},{136, 27, 105, 209, 175},{152, 29, 110, 218, 181}
},{{176, 28, 126, 6, 80},{174, 22, 129, 23, 170},{165, 36, 126, 40, 83},{136, 9, 128, 68, 193},{154, 27, 128, 128, 5},{154, 27, 128, 128, 5},{154, 27, 128, 128, 5},{158, 11, 128, 182, 39},{152, 38, 123, 198, 135},{152, 29, 110, 218, 181}
},{{143, 30, 152, 4, 137},{136, 27, 161, 29, 171},{136, 27, 157, 44, 166},{152, 18, 146, 94, 194},{152, 18, 146, 94, 194},{154, 20, 165, 128, 47},{144, 10, 157, 164, 39},{152, 4, 153, 189, 60},{158, 27, 144, 209, 64},{158, 27, 144, 209, 64}
},{{153, 4, 174, 14, 185},{156, 5, 181, 18, 186},{144, 22, 181, 62, 137},{144, 22, 181, 62, 137},{148, 30, 177, 120, 199},{144, 28, 172, 128, 36},{136, 27, 188, 158, 53},{161, 17, 186, 184, 54},{159, 31, 187, 211, 108},{147, 24, 182, 237, 84}
},{{152, 4, 206, 39, 241},{152, 4, 206, 39, 241},{152, 4, 206, 39, 241},{168, 32, 212, 67, 155},{136, 27, 207, 103, 191},{156, 28, 213, 128, 81},{136, 27, 201, 157, 67},{151, 9, 198, 179, 111},{136, 27, 215, 206, 14},{136, 27, 204, 219}
},{{141, 23, 224, 62, 192},{141, 23, 224, 62, 192},{141, 23, 224, 62, 192},{145, 13, 231, 76, 179},{150, 34, 239, 114, 173},{155, 31, 219, 128, 91},{161, 30, 226, 167, 126},{161, 30, 226, 167, 126},{136, 27, 220, 199, 12},{136, 27, 204, 219}
}},{{{152, 49, 70, 20, 127},{160, 51, 56, 31, 48},{161, 63, 32, 60, 6},{149, 41, 26, 83, 113},{152, 59, 0, 128, 167},{152, 59, 0, 128, 167},{152, 59, 0, 128, 167},{167, 51, 35, 182, 133},{167, 51, 35, 182, 133},{141, 57, 62, 230, 232}
},{{152, 49, 70, 20, 127},{160, 51, 56, 31, 48},{161, 63, 32, 60, 6},{149, 41, 26, 83, 113},{165, 48, 29, 96, 108},{154, 51, 22, 128, 187},{154, 51, 22, 128, 187},{167, 51, 35, 182, 133},{167, 51, 35, 182, 133},{141, 57, 62, 230, 232}
},{{152, 49, 70, 20, 127},{160, 51, 56, 31, 48},{160, 51, 56, 31, 48},{158, 53, 56, 88, 79},{158, 53, 56, 88, 79},{156, 52, 51, 128, 159},{142, 52, 56, 146, 148},{155, 42, 56, 186, 183},{155, 42, 56, 186, 183},{141, 57, 62, 230, 232}
},{{152, 50, 71, 20, 125},{152, 50, 71, 20, 125},{161, 40, 75, 51, 117},{158, 53, 56, 88, 79},{164, 43, 67, 104, 32},{149, 57, 67, 128, 235},{160, 45, 72, 147, 210},{150, 50, 74, 173, 199},{138, 46, 73, 197, 172},{160, 37, 76, 219, 150}
},{{170, 51, 92, 8, 73},{154, 53, 97, 39, 109},{153, 47, 103, 62, 107},{153, 47, 103, 62, 107},{145, 52, 99, 95, 29},{146, 47, 103, 128, 222},{146, 47, 103, 128, 222},{147, 50, 105, 182, 250},{147, 50, 105, 182, 250},{152, 29, 110, 218, 181}
},{{161, 55, 143, 2, 159},{134, 52, 116, 20, 86},{139, 52, 124, 49, 118},{154, 55, 124, 94, 11},{154, 55, 124, 94, 11},{156, 53, 128, 128, 45},{159, 58, 133, 153, 61},{148, 35, 128, 168, 27},{152, 38, 123, 198, 135},{152, 38, 123, 198, 135}
},{{161, 55, 143, 2, 159},{153, 69, 160, 14, 246},{150, 60, 161, 42, 165},{141, 45, 175, 69, 206},{150, 55, 136, 104, 197},{157, 58, 149, 128, 54},{162, 51, 148, 156, 29},{162, 51, 148, 156, 29},{142, 54, 147, 200, 103},{129, 39, 151, 228, 81}
},{{162, 50, 174, 13, 183},{163, 50, 180, 17, 176},{141, 49, 178, 59, 177},{141, 45, 175, 69, 206},{148, 63, 180, 108, 247},{158, 54, 180, 128, 24},{157, 51, 183, 168, 53},{157, 51, 183, 168, 53},{162, 51, 171, 213, 107},{161, 40, 180, 228, 93}
},{{163, 50, 180, 17, 176},{163, 49, 182, 18, 178},{159, 37, 219, 55, 210},{166, 58, 212, 67, 143},{166, 51, 193, 107, 187},{155, 49, 211, 128, 125},{155, 49, 211, 128, 125},{140, 48, 207, 188, 75},{140, 48, 207, 188, 75},{146, 55, 182, 237, 122}
},{{163, 50, 180, 17, 176},{159, 37, 219, 55, 210},{159, 37, 219, 55, 210},{170, 44, 231, 76, 169},{173, 46, 230, 92, 189},{163, 49, 230, 128, 112},{163, 49, 230, 128, 112},{161, 30, 226, 167, 126},{140, 63, 216, 205, 34},{140, 63, 216, 205, 34}
}},{{{154, 82, 56, 31, 107},{154, 82, 56, 31, 107},{161, 63, 32, 60, 6},{159, 67, 21, 81, 28},{160, 69, 13, 99, 15},{149, 80, 0, 128, 193},{149, 80, 0, 128, 193},{156, 87, 37, 180, 222},{179, 77, 28, 190, 216},{162, 62, 66, 232, 178}
},{{154, 82, 56, 31, 107},{154, 82, 56, 31, 107},{161, 63, 32, 60, 6},{161, 67, 24, 74, 52},{160, 69, 13, 99, 15},{154, 77, 18, 128, 193},{154, 77, 18, 128, 193},{156, 87, 37, 180, 222},{179, 77, 28, 190, 216},{162, 62, 66, 232, 178}
},{{154, 82, 56, 31, 107},{154, 82, 56, 31, 107},{154, 82, 56, 31, 107},{163, 80, 57, 78},{153, 76, 59, 97, 11},{153, 66, 52, 128, 235},{155, 75, 47, 143, 244},{154, 84, 42, 180, 212},{144, 76, 56, 186, 218},{162, 62, 66, 232, 178}
},{{157, 67, 69, 21, 10},{155, 74, 65, 31, 11},{152, 69, 82, 37, 46},{163, 80, 57, 78},{153, 76, 59, 97, 11},{149, 73, 81, 124, 117},{153, 81, 70, 156, 150},{153, 75, 83, 166, 163},{162, 76, 79, 205, 232},{141, 83, 75, 220, 205}
},{{136, 77, 96, 7, 38},{152, 68, 84, 37, 41},{151, 88, 103, 62, 18},{147, 80, 108, 81, 122},{155, 62, 101, 112, 52},{149, 79, 96, 128, 190},{149, 86, 93, 148, 142},{150, 66, 105, 177, 136},{162, 76, 79, 205, 232},{173, 80, 110, 228, 243}
},{{157, 77, 142, 2, 216},{172, 90, 129, 23, 228},{139, 52, 124, 49, 118},{147, 80, 108, 81, 122},{153, 77, 128, 128, 80},{153, 77, 128, 128, 80},{153, 77, 128, 128, 80},{128, 80, 125, 177, 152},{156, 73, 142, 200, 23},{145, 96, 130, 223, 40}
},{{157, 77, 142, 2, 216},{153, 69, 160, 14, 246},{150, 60, 161, 42, 165},{147, 81, 143, 90, 147},{162, 69, 157, 97, 159},{159, 78, 150, 128, 67},{142, 82, 148, 156, 80},{156, 73, 142, 200, 23},{156, 73, 142, 200, 23},{144, 79, 144, 209, 26}
},{{149, 65, 163, 8, 251},{161, 79, 187, 22, 199},{157, 78, 176, 62, 217},{157, 78, 176, 62, 217},{148, 63, 180, 108, 247},{150, 90, 180, 128, 124},{155, 80, 211, 154, 6},{159, 82, 196, 188, 49},{178, 75, 175, 211, 1},{164, 78, 182, 237, 53}
},{{161, 79, 187, 22, 199},{163, 71, 194, 27, 185},{151, 84, 212, 69, 214},{151, 84, 212, 69, 214},{144, 77, 209, 99, 235},{150, 82, 205, 128, 13},{155, 80, 211, 154, 6},{159, 82, 196, 188, 49},{159, 82, 196, 188, 49},{164, 78, 182, 237, 53}
},{{161, 79, 187, 22, 199},{163, 71, 194, 27, 185},{147, 85, 222, 59, 167},{152, 85, 222, 64, 215},{144, 77, 209, 99, 235},{153, 78, 219, 128, 8},{155, 80, 211, 154, 6},{155, 87, 226, 167, 13},{140, 63, 216, 205, 34},{140, 63, 216, 205, 34}
}},{{{155, 97, 56, 31, 89},{155, 97, 56, 31, 89},{148, 107, 32, 60, 103},{154, 107, 13, 99, 27},{154, 107, 13, 99, 27},{148, 104, 0, 128, 248},{148, 104, 0, 128, 248},{155, 109, 23, 179, 214},{156, 108, 23, 180, 215},{156, 108, 23, 180, 215}
},{{155, 97, 56, 31, 89},{155, 97, 56, 31, 89},{148, 107, 32, 60, 103},{130, 101, 22, 77, 56},{154, 107, 13, 99, 27},{152, 100, 24, 128, 224},{152, 100, 24, 128, 224},{155, 109, 23, 179, 214},{156, 108, 23, 180, 215},{156, 108, 23, 180, 215}
},{{155, 97, 56, 31, 89},{155, 97, 56, 31, 89},{155, 97, 56, 31, 89},{163, 80, 57, 78},{157, 104, 76, 102, 91},{153, 97, 45, 128, 209},{165, 100, 52, 173, 220},{152, 97, 56, 186, 255},{158, 103, 44, 191, 238},{140, 101, 73, 238, 202}
},{{160, 104, 90, 9, 31},{155, 97, 56, 31, 89},{137, 89, 78, 40, 50},{157, 104, 76, 102, 91},{157, 104, 76, 102, 91},{153, 100, 78, 128, 183},{153, 104, 81, 169, 141},{156, 101, 71, 174, 148},{157, 97, 77, 197, 240},{140, 101, 73, 238, 202}
},{{160, 104, 90, 9, 31},{160, 104, 90, 9, 31},{144, 104, 102, 62, 36},{144, 104, 102, 62, 36},{155, 100, 82, 101, 76},{146, 90, 102, 128, 170},{137, 98, 96, 148, 155},{150, 122, 105, 177, 176},{147, 100, 91, 208, 248},{151, 107, 96, 248, 224}
},{{163, 110, 135, 10, 196},{140, 102, 129, 23, 248},{140, 102, 129, 23, 248},{151, 110, 103, 62, 36},{154, 101, 128, 128, 123},{154, 101, 128, 128, 123},{154, 101, 128, 128, 123},{150, 105, 123, 186, 186},{165, 101, 135, 207, 12},{145, 96, 130, 223, 40}
},{{165, 104, 157, 6, 210},{146, 105, 165, 35, 249},{136, 100, 168, 54, 246},{147, 81, 143, 90, 147},{167, 96, 154, 108, 181},{164, 93, 154, 128, 103},{150, 105, 148, 156, 115},{152, 102, 151, 166, 75},{156, 99, 147, 203, 35},{148, 98, 140, 222, 32}
},{{161, 102, 186, 21, 236},{161, 102, 186, 21, 236},{152, 86, 175, 58, 223},{152, 86, 175, 58, 223},{157, 98, 206, 102, 211},{142, 101, 180, 128, 91},{159, 103, 183, 168, 99},{164, 103, 177, 172, 90},{156, 99, 147, 203, 35},{144, 91, 182, 237, 20}
},{{161, 102, 186, 21, 236},{161, 102, 186, 21, 236},{168, 101, 221, 58, 174},{166, 112, 200, 75, 209},{157, 98, 206, 102, 211},{151, 105, 207, 128, 53},{155, 80, 211, 154, 6},{169, 103, 207, 188, 57},{145, 113, 196, 199, 103},{144, 91, 182, 237, 20}
},{{161, 102, 186, 21, 236},{161, 102, 186, 21, 236},{168, 101, 221, 58, 174},{152, 85, 222, 64, 215},{157, 98, 206, 102, 211},{151, 97, 237, 128, 31},{155, 87, 226, 167, 13},{155, 87, 226, 167, 13},{169, 103, 207, 188, 57},{144, 91, 182, 237, 20}
}},{{{155, 127, 56, 31, 71},{155, 127, 56, 31, 71},{145, 128, 32, 60, 137},{140, 126, 13, 99, 24},{152, 125, 6, 121, 30},{155, 134, 4, 128, 29},{155, 134, 4, 128, 29},{149, 115, 23, 180, 193},{157, 127, 37, 187, 248},{157, 127, 37, 187, 248}
},{{155, 127, 56, 31, 71},{155, 127, 56, 31, 71},{145, 128, 32, 60, 137},{128, 128, 22, 79, 221},{140, 126, 13, 99, 24},{153, 123, 23, 128, 241},{153, 123, 23, 128, 241},{149, 115, 23, 180, 193},{157, 127, 37, 187, 248},{157, 127, 37, 187, 248}
},{{155, 127, 56, 31, 71},{155, 127, 56, 31, 71},{155, 127, 56, 31, 71},{148, 130, 53, 87, 240},{148, 130, 53, 87, 240},{154, 135, 45, 128, 52},{152, 128, 65, 163, 126},{159, 128, 44, 191, 8},{159, 128, 44, 191, 8},{128, 128, 59, 227, 92}
},{{134, 131, 76, 16, 221},{156, 133, 78, 40, 251},{156, 133, 78, 40, 251},{128, 128, 80, 83, 135},{157, 104, 76, 102, 91},{166, 128, 79, 128, 109},{152, 128, 65, 163, 126},{153, 126, 71, 174, 138},{149, 126, 74, 197, 224},{128, 128, 69, 235, 42}
},{{144, 128, 95, 14, 197},{144, 128, 95, 14, 197},{159, 143, 104, 58, 198},{128, 128, 105, 74, 167},{157, 127, 103, 128, 129},{157, 127, 103, 128, 129},{157, 127, 103, 128, 129},{150, 122, 105, 177, 176},{128, 128, 97, 197, 32},{151, 128, 105, 252, 6}
},{{149, 134, 136, 1, 30},{135, 128, 129, 23, 21},{128, 128, 128, 50, 54},{128, 128, 124, 83, 171},{153, 126, 128, 128, 99},{153, 126, 128, 128, 99},{153, 126, 128, 128, 99},{166, 126, 128, 189, 97},{166, 126, 128, 189, 97},{128, 128, 126, 229, 31}
},{{149, 134, 136, 1, 30},{153, 129, 164, 44, 20},{151, 129, 167, 51, 6},{128, 128, 151, 87, 68},{151, 128, 149, 128, 134},{151, 128, 149, 128, 134},{158, 121, 147, 162, 82},{128, 128, 153, 180, 169},{146, 119, 144, 209, 32},{146, 119, 144, 209, 32}
},{{152, 130, 186, 21, 49},{152, 130, 186, 21, 49},{151, 129, 167, 51, 6},{128, 128, 174, 74, 96},{148, 134, 180, 128, 162},{148, 134, 180, 128, 162},{148, 128, 183, 168, 143},{148, 128, 183, 168, 143},{161, 131, 181, 212, 199},{142, 131, 182, 237, 210}
},{{152, 130, 186, 21, 49},{152, 130, 186, 21, 49},{128, 128, 204, 62, 118},{128, 128, 207, 72, 3},{159, 116, 209, 99, 221},{171, 128, 205, 128, 226},{128, 128, 202, 148, 218},{128, 128, 206, 180, 254},{137, 128, 193, 206, 130},{128, 128, 193, 229, 160}
},{{152, 130, 186, 21, 49},{152, 130, 186, 21, 49},{128, 128, 222, 60, 102},{128, 128, 228, 69, 37},{142, 136, 241, 99, 16},{151, 135, 226, 128, 246},{128, 128, 229, 152, 249},{149, 141, 226, 167, 217},{128, 128, 219, 200, 151},{128, 128, 193, 229, 160}
}},{{{157, 164, 56, 31, 154},{157, 164, 56, 31, 154},{142, 139, 34, 57, 154},{160, 146, 13, 99, 216},{160, 146, 13, 99, 216},{150, 150, 0, 128, 4},{150, 150, 0, 128, 4},{149, 156, 39, 176, 26},{163, 150, 44, 191, 34},{145, 155, 60, 217, 107}
},{{157, 164, 56, 31, 154},{157, 164, 56, 31, 154},{142, 139, 34, 57, 154},{160, 146, 13, 99, 216},{160, 146, 13, 99, 216},{157, 152, 27, 128, 26},{144, 149, 19, 161, 51},{149, 156, 39, 176, 26},{163, 150, 44, 191, 34},{145, 155, 60, 217, 107}
},{{157, 164, 56, 31, 154},{157, 164, 56, 31, 154},{157, 164, 56, 31, 154},{148, 130, 53, 87, 240},{171, 153, 54, 112, 240},{152, 153, 40, 128, 45},{147, 154, 67, 159, 81},{149, 156, 39, 176, 26},{145, 155, 60, 217, 107},{145, 155, 60, 217, 107}
},{{160, 160, 90, 9, 215},{162, 148, 83, 22, 247},{156, 133, 78, 40, 251},{159, 158, 108, 75, 162},{149, 161, 95, 97, 142},{135, 149, 79, 128, 89},{147, 154, 67, 159, 81},{152, 153, 74, 188, 115},{154, 152, 74, 194, 14},{159, 174, 74, 233, 22}
},{{161, 146, 98, 6, 211},{159, 158, 116, 20, 229},{156, 145, 103, 62, 208},{159, 158, 108, 75, 162},{149, 161, 95, 97, 142},{175, 152, 104, 128, 91},{153, 151, 105, 177, 82},{153, 151, 105, 177, 82},{153, 151, 105, 177, 82},{162, 149, 105, 252, 38}
},{{166, 163, 122, 1, 250},{159, 158, 116, 20, 229},{162, 169, 145, 52, 42},{159, 158, 108, 75, 162},{152, 153, 128, 128, 133},{152, 153, 128, 128, 133},{152, 153, 128, 128, 133},{153, 161, 119, 187, 112},{153, 161, 119, 187, 112},{143, 156, 132, 229, 246}
},{{154, 158, 149, 4, 17},{154, 158, 149, 4, 17},{152, 137, 164, 51, 2},{142, 178, 142, 76, 122},{146, 145, 153, 128, 158},{146, 145, 153, 128, 158},{151, 149, 160, 142, 168},{153, 142, 146, 160, 161},{144, 150, 143, 214, 219},{143, 156, 132, 229, 246}
},{{154, 158, 149, 4, 17},{159, 169, 180, 24, 30},{156, 148, 175, 58, 25},{156, 148, 175, 58, 25},{152, 156, 181, 113, 68},{154, 157, 180, 128, 183},{156, 155, 191, 145, 173},{158, 147, 180, 175, 146},{155, 159, 179, 211, 224},{155, 159, 179, 211, 224}
},{{147, 146, 185, 20, 40},{147, 146, 185, 20, 40},{156, 148, 175, 58, 25},{149, 157, 209, 99, 62},{149, 157, 209, 99, 62},{159, 151, 204, 128, 192},{156, 155, 191, 145, 173},{167, 152, 207, 188, 200},{156, 144, 208, 191, 231},{141, 161, 200, 223, 191}
},{{147, 146, 185, 20, 40},{147, 146, 185, 20, 40},{153, 192, 222, 59, 56},{149, 157, 209, 99, 62},{163, 165, 226, 103, 7},{144, 152, 226, 128, 238},{149, 141, 226, 167, 217},{149, 141, 226, 167, 217},{156, 144, 208, 191, 231},{141, 161, 200, 223, 191}
}},{{{149, 167, 56, 31, 145},{149, 167, 56, 31, 145},{152, 196, 32, 60, 196},{153, 179, 0, 128, 46},{153, 179, 0, 128, 46},{153, 179, 0, 128, 46},{153, 179, 0, 128, 46},{171, 176, 23, 180, 60},{159, 179, 46, 204, 74},{155, 177, 58, 215, 67}
},{{149, 167, 56, 31, 145},{149, 167, 56, 31, 145},{152, 196, 32, 60, 196},{178, 175, 27, 80, 210},{161, 177, 24, 128, 12},{161, 177, 24, 128, 12},{138, 175, 30, 146, 45},{171, 176, 23, 180, 60},{159, 179, 46, 204, 74},{155, 177, 58, 215, 67}
},{{149, 167, 56, 31, 145},{149, 167, 56, 31, 145},{148, 185, 46, 62, 185},{148, 185, 46, 62, 185},{135, 167, 57, 96, 253},{147, 178, 39, 128, 2},{149, 169, 59, 138, 9},{142, 185, 51, 179, 51},{159, 179, 46, 204, 74},{155, 177, 58, 215, 67}
},{{160, 160, 90, 9, 215},{149, 167, 56, 31, 145},{171, 173, 61, 49, 142},{136, 170, 64, 67, 165},{145, 173, 90, 117, 151},{151, 170, 73, 135, 119},{154, 199, 70, 157, 2},{150, 192, 71, 182, 35},{149, 174, 74, 197, 48},{159, 174, 74, 233, 22}
},{{160, 160, 90, 9, 215},{172, 174, 116, 20, 230},{155, 186, 103, 62, 252},{155, 186, 103, 62, 252},{149, 161, 95, 97, 142},{165, 177, 104, 128, 120},{148, 180, 91, 134, 121},{140, 181, 105, 177, 101},{168, 185, 104, 222, 35},{152, 181, 105, 252, 60}
},{{144, 184, 143, 2, 33},{128, 168, 129, 23, 58},{162, 169, 145, 52, 42},{153, 187, 119, 75, 154},{151, 177, 128, 128, 162},{151, 177, 128, 128, 162},{150, 181, 135, 152, 184},{153, 161, 119, 187, 112},{160, 183, 123, 215, 63},{160, 183, 123, 215, 63}
},{{144, 184, 143, 2, 33},{159, 169, 180, 24, 30},{162, 169, 145, 52, 42},{142, 178, 142, 76, 122},{173, 186, 153, 106, 96},{156, 185, 151, 128, 182},{147, 175, 150, 153, 183},{155, 183, 146, 160, 154},{130, 176, 144, 209, 247},{147, 167, 146, 252, 222}
},{{160, 182, 179, 16, 49},{159, 169, 180, 24, 30},{154, 184, 171, 59, 54},{167, 180, 165, 79, 125},{146, 177, 173, 97, 107},{158, 181, 172, 128, 131},{150, 189, 177, 171, 181},{150, 189, 177, 171, 181},{155, 159, 179, 211, 224},{167, 180, 182, 237, 204}
},{{147, 175, 185, 20, 21},{147, 175, 185, 20, 21},{141, 178, 212, 67, 44},{141, 178, 212, 67, 44},{146, 193, 209, 99, 101},{153, 176, 207, 127, 29},{160, 178, 194, 142, 218},{149, 182, 207, 188, 212},{152, 184, 199, 208, 179},{152, 184, 199, 208, 179}
},{{147, 175, 185, 20, 21},{153, 192, 222, 59, 56},{153, 192, 222, 59, 56},{140, 193, 230, 72, 103},{163, 165, 226, 103, 7},{155, 174, 221, 128, 236},{155, 174, 221, 128, 236},{149, 182, 207, 188, 212},{152, 184, 199, 208, 179},{152, 184, 199, 208, 179}
}},{{{150, 204, 56, 31, 249},{150, 204, 56, 31, 249},{152, 196, 32, 60, 196},{143, 206, 20, 83, 130},{157, 203, 0, 128, 82},{157, 203, 0, 128, 82},{157, 203, 0, 128, 82},{154, 217, 30, 181, 108},{146, 199, 33, 198, 54},{146, 199, 33, 198, 54}
},{{150, 204, 56, 31, 249},{150, 204, 56, 31, 249},{152, 196, 32, 60, 196},{143, 206, 20, 83, 130},{154, 199, 24, 128, 65},{154, 199, 24, 128, 65},{129, 203, 30, 155, 75},{154, 217, 30, 181, 108},{146, 199, 33, 198, 54},{146, 199, 33, 198, 54}
},{{150, 204, 56, 31, 249},{150, 204, 56, 31, 249},{150, 204, 56, 31, 249},{144, 196, 60, 87, 187},{133, 207, 51, 106, 151},{154, 201, 42, 128, 125},{154, 199, 70, 157, 2},{143, 209, 44, 184, 78},{146, 199, 33, 198, 54},{170, 202, 72, 227, 79}
},{{150, 204, 56, 31, 249},{150, 204, 56, 31, 249},{142, 215, 78, 40, 187},{162, 222, 73, 75, 250},{175, 205, 82, 96, 212},{159, 202, 82, 128, 3},{154, 199, 70, 157, 2},{150, 192, 71, 182, 35},{144, 207, 74, 189, 44},{170, 202, 72, 227, 79}
},{{146, 210, 116, 20, 164},{137, 202, 99, 35, 135},{155, 201, 112, 57, 159},{161, 194, 104, 85, 218},{161, 194, 104, 85, 218},{156, 216, 99, 128, 35},{163, 208, 91, 138, 38},{147, 230, 105, 177, 41},{160, 202, 103, 223, 86},{160, 202, 103, 223, 86}
},{{146, 217, 134, 1, 72},{165, 207, 129, 23, 120},{155, 201, 112, 57, 159},{153, 187, 119, 75, 154},{158, 200, 148, 100, 34},{148, 205, 128, 128, 221},{131, 204, 132, 150, 217},{137, 197, 122, 186, 8},{169, 205, 136, 200, 160},{140, 206, 136, 227, 173}
},{{159, 205, 147, 7, 66},{159, 205, 147, 7, 66},{150, 205, 168, 54, 65},{158, 200, 148, 100, 34},{158, 200, 148, 100, 34},{154, 210, 160, 128, 236},{150, 212, 148, 156, 206},{158, 209, 155, 175, 255},{166, 208, 161, 202, 153},{140, 206, 136, 227, 173}
},{{159, 205, 147, 7, 66},{155, 213, 190, 24, 108},{150, 205, 168, 54, 65},{150, 205, 168, 54, 65},{157, 202, 180, 128, 231},{157, 202, 180, 128, 231},{152, 198, 188, 149, 243},{154, 207, 181, 171, 207},{138, 194, 181, 211, 170},{152, 222, 182, 221, 169}
},{{155, 213, 190, 24, 108},{157, 212, 192, 25, 20},{141, 204, 215, 50, 32},{146, 206, 196, 64, 92},{146, 193, 209, 99, 101},{152, 205, 197, 128, 148},{152, 198, 188, 149, 243},{159, 191, 207, 188, 215},{152, 184, 199, 208, 179},{152, 184, 199, 208, 179}
},{{155, 213, 190, 24, 108},{157, 212, 192, 25, 20},{150, 196, 221, 57, 50},{140, 193, 230, 72, 103},{163, 194, 229, 99, 99},{155, 195, 224, 128, 188},{170, 200, 226, 167, 163},{170, 200, 226, 167, 163},{152, 184, 199, 208, 179},{152, 184, 199, 208, 179}
}},{{{148, 229, 56, 31, 210},{148, 229, 56, 31, 210},{153, 240, 32, 60, 241},{145, 240, 22, 78, 189},{153, 226, 3, 128, 124},{153, 226, 3, 128, 124},{156, 230, 7, 137, 112},{148, 223, 23, 180, 108},{148, 223, 23, 180, 108},{148, 223, 23, 180, 108}
},{{148, 229, 56, 31, 210},{148, 229, 56, 31, 210},{153, 240, 32, 60, 241},{145, 240, 22, 78, 189},{169, 227, 13, 99, 160},{140, 232, 24, 128, 120},{154, 252, 18, 156, 108},{148, 223, 23, 180, 108},{148, 223, 23, 180, 108},{150, 253, 55, 224, 56}
},{{148, 229, 56, 31, 210},{148, 229, 56, 31, 210},{149, 230, 46, 62, 231},{149, 230, 46, 62, 231},{165, 217, 56, 112, 176},{154, 217, 45, 128, 106},{145, 227, 68, 150, 36},{153, 231, 56, 186, 120},{153, 231, 56, 186, 120},{150, 253, 55, 224, 56}
},{{149, 248, 102, 4, 139},{148, 229, 56, 31, 210},{144, 241, 78, 40, 131},{162, 222, 73, 75, 250},{160, 226, 78, 128, 8},{160, 226, 78, 128, 8},{155, 233, 75, 167, 26},{157, 230, 72, 183},{150, 229, 71, 196, 116},{145, 218, 73, 237, 107}
},{{149, 248, 102, 4, 139},{173, 230, 116, 20, 175},{153, 220, 103, 62, 152},{153, 220, 103, 62, 152},{152, 243, 95, 95, 239},{156, 216, 99, 128, 35},{147, 230, 105, 177, 41},{147, 230, 105, 177, 41},{147, 230, 105, 177, 41},{149, 221, 105, 252, 89}
},{{148, 235, 117, 1, 143},{173, 230, 116, 20, 175},{153, 220, 103, 62, 152},{158, 226, 143, 97, 22},{158, 226, 143, 97, 22},{159, 229, 128, 128, 254},{162, 234, 129, 155, 214},{166, 221, 129, 185, 199},{157, 250, 131, 206, 174},{140, 253, 134, 233, 154}
},{{151, 236, 147, 7, 107},{151, 236, 147, 7, 107},{155, 233, 168, 54, 104},{158, 226, 143, 97, 22},{146, 232, 149, 109, 6},{150, 236, 165, 128, 219},{150, 212, 148, 156, 206},{158, 209, 155, 175, 255},{169, 229, 144, 209, 137},{169, 229, 144, 209, 137}
},{{151, 236, 147, 7, 107},{158, 233, 194, 27, 42},{151, 233, 175, 58, 111},{151, 233, 175, 58, 111},{155, 252, 179, 103, 55},{150, 226, 178, 127, 61},{150, 226, 178, 127, 61},{173, 233, 183, 175, 216},{152, 222, 182, 221, 169},{152, 222, 182, 221, 169}
},{{158, 233, 194, 27, 42},{158, 233, 194, 27, 42},{153, 233, 215, 50, 17},{149, 230, 212, 67, 96},{156, 222, 202, 110, 98},{158, 224, 203, 128, 177},{158, 224, 203, 128, 177},{153, 226, 207, 188, 140},{153, 226, 207, 188, 140},{152, 222, 182, 221, 169}
},{{153, 233, 215, 50, 17},{153, 233, 215, 50, 17},{153, 233, 215, 50, 17},{159, 224, 236, 87, 64},{148, 240, 235, 99, 104},{153, 228, 223, 128, 166},{153, 228, 223, 128, 166},{153, 226, 207, 188, 140},{153, 226, 207, 188, 140},{152, 222, 182, 221, 169}
}}},{{{{177, 12, 32, 60, 37},{177, 12, 32, 60, 37},{177, 12, 32, 60, 37},{178, 13, 23, 76, 96},{179, 13, 7, 119, 74},{176, 11, 0, 128, 191},{176, 11, 0, 128, 191},{167, 8, 26, 186, 139},{167, 8, 26, 186, 139},{179, 13, 51, 220, 213}
},{{177, 12, 32, 60, 37},{177, 12, 32, 60, 37},{177, 12, 32, 60, 37},{178, 13, 23, 76, 96},{174, 25, 19, 99, 67},{178, 12, 24, 128, 162},{171, 16, 20, 152, 179},{167, 8, 26, 186, 139},{167, 8, 26, 186, 139},{179, 13, 51, 220, 213}
},{{188, 17, 67, 22, 124},{188, 17, 67, 22, 124},{182, 14, 39, 50, 41},{175, 11, 47, 71, 72},{171, 16, 56, 95, 88},{177, 12, 45, 128, 148},{170, 9, 54, 149, 132},{167, 8, 51, 178, 170},{179, 13, 51, 220, 213},{179, 13, 51, 220, 213}
},{{188, 17, 83, 12, 118},{188, 17, 67, 22, 124},{170, 16, 78, 40, 88},{169, 9, 75, 71, 40},{170, 9, 77, 112, 26},{175, 11, 77, 128, 237},{165, 7, 69, 157, 254},{178, 23, 75, 177, 219},{180, 13, 80, 208, 189},{181, 14, 68, 225, 154}
},{{187, 17, 101, 5, 78},{187, 17, 97, 26, 85},{179, 13, 103, 62, 99},{179, 13, 103, 62, 99},{172, 10, 107, 94, 23},{170, 15, 96, 128, 193},{169, 14, 108, 148, 219},{173, 10, 110, 200, 133},{173, 10, 110, 200, 133},{183, 14, 97, 228, 184}
},{{173, 14, 123, 1, 93},{174, 22, 129, 23, 170},{172, 10, 146, 57, 137},{188, 17, 118, 79, 16},{169, 9, 146, 102, 208},{179, 13, 128, 128, 58},{188, 17, 128, 152, 49},{177, 12, 135, 171, 21},{173, 10, 110, 200, 133},{171, 10, 130, 235, 76}
},{{153, 4, 158, 6, 129},{173, 14, 161, 22, 144},{172, 10, 146, 57, 137},{175, 12, 153, 74, 244},{169, 9, 146, 102, 208},{175, 11, 155, 128, 59},{175, 11, 155, 128, 59},{168, 8, 151, 175, 28},{173, 10, 161, 189, 63},{182, 14, 150, 230, 76}
},{{164, 7, 178, 16, 133},{164, 7, 178, 16, 133},{190, 18, 168, 54, 182},{175, 12, 153, 74, 244},{174, 11, 182, 118, 225},{175, 11, 176, 128, 16},{194, 21, 177, 153, 123},{173, 10, 161, 189, 63},{163, 7, 194, 204, 46},{170, 10, 177, 240, 101}
},{{180, 13, 204, 36, 213},{180, 13, 204, 36, 213},{180, 13, 204, 36, 213},{188, 17, 203, 73, 171},{172, 10, 202, 91, 179},{183, 15, 197, 128, 121},{167, 8, 197, 155, 117},{176, 11, 207, 188, 76},{163, 7, 194, 204, 46},{188, 17, 204, 219, 62}
},{{180, 13, 204, 36, 213},{180, 13, 204, 36, 213},{188, 17, 224, 62, 247},{168, 8, 229, 78, 143},{185, 15, 228, 116, 162},{179, 13, 219, 128, 97},{182, 14, 226, 167, 121},{182, 14, 226, 167, 121},{152, 4, 220, 199, 3},{188, 17, 204, 219, 62}
}},{{{182, 14, 39, 50, 41},{182, 14, 39, 50, 41},{191, 27, 32, 60, 60},{178, 13, 23, 76, 96},{176, 26, 18, 97, 93},{176, 26, 0, 128, 174},{176, 26, 0, 128, 174},{170, 17, 14, 160, 145},{176, 20, 40, 207, 199},{176, 20, 40, 207, 199}
},{{182, 14, 39, 50, 41},{182, 14, 39, 50, 41},{191, 27, 32, 60, 60},{178, 13, 23, 76, 96},{174, 25, 19, 99, 67},{182, 28, 25, 128, 183},{171, 16, 20, 152, 179},{190, 19, 26, 186, 137},{176, 20, 40, 207, 199},{176, 20, 40, 207, 199}
},{{165, 29, 56, 31, 27},{165, 29, 56, 31, 27},{191, 19, 47, 55, 48},{183, 19, 47, 78, 65},{178, 26, 57, 96, 117},{174, 32, 49, 128, 187},{172, 10, 51, 143, 158},{186, 27, 44, 180, 189},{172, 23, 60, 202, 201},{179, 13, 51, 220, 213}
},{{188, 17, 83, 12, 118},{168, 23, 78, 39, 82},{176, 36, 78, 40, 118},{169, 9, 75, 71, 40},{178, 26, 57, 96, 117},{175, 18, 79, 128, 246},{187, 19, 70, 148, 254},{178, 23, 75, 177, 219},{179, 18, 80, 207, 186},{175, 23, 68, 221, 165}
},{{188, 30, 104, 4, 74},{187, 17, 97, 26, 85},{187, 17, 102, 52, 124},{174, 28, 103, 62, 111},{168, 22, 99, 93, 4},{180, 41, 103, 128, 254},{169, 14, 108, 148, 219},{178, 23, 75, 177, 219},{187, 17, 104, 214, 144},{183, 14, 97, 228, 184}
},{{176, 28, 126, 6, 80},{180, 33, 128, 25, 136},{180, 33, 128, 25, 136},{188, 17, 118, 79, 16},{173, 41, 120, 101, 29},{175, 29, 128, 128, 54},{188, 17, 128, 152, 49},{177, 12, 135, 171, 21},{201, 25, 131, 206, 25},{188, 17, 133, 227, 79}
},{{187, 27, 147, 7, 176},{188, 17, 146, 26, 161},{186, 28, 168, 54, 188},{175, 12, 153, 74, 244},{169, 9, 146, 102, 208},{183, 26, 149, 128, 60},{186, 29, 148, 156, 43},{188, 17, 146, 178, 9},{188, 17, 155, 191, 13},{182, 14, 150, 230, 76}
},{{173, 14, 167, 10, 138},{179, 28, 194, 27, 242},{186, 28, 168, 54, 188},{179, 34, 193, 93, 137},{179, 45, 188, 104, 206},{175, 32, 180, 128, 63},{194, 21, 177, 153, 123},{161, 17, 186, 184, 54},{187, 17, 194, 204, 32},{188, 17, 173, 228, 96}
},{{179, 28, 194, 27, 242},{179, 28, 194, 27, 242},{188, 17, 208, 47, 214},{191, 27, 210, 76, 190},{191, 27, 203, 101, 142},{188, 17, 204, 129, 100},{163, 31, 204, 163, 87},{178, 29, 207, 188, 88},{178, 29, 207, 188, 88},{188, 17, 204, 219, 62}
},{{179, 28, 194, 27, 242},{179, 28, 194, 27, 242},{188, 17, 224, 62, 247},{181, 21, 222, 77, 183},{182, 19, 216, 109, 148},{188, 17, 229, 128, 76},{171, 29, 226, 167, 119},{188, 17, 226, 182, 125},{178, 29, 207, 188, 88},{188, 17, 204, 219, 62}
}},{{{183, 57, 53, 33, 30},{183, 57, 53, 33, 30},{184, 63, 23, 75, 95},{184, 63, 23, 75, 95},{173, 53, 7, 119, 108},{176, 45, 0, 128, 153},{190, 53, 13, 155, 153},{181, 49, 23, 180, 163},{181, 49, 23, 180, 163},{178, 47, 54, 213, 250}
},{{183, 57, 53, 33, 30},{183, 57, 53, 33, 30},{167, 61, 27, 68, 65},{184, 63, 23, 75, 95},{165, 48, 29, 96, 108},{176, 62, 24, 128, 146},{190, 53, 13, 155, 153},{181, 49, 23, 180, 163},{181, 49, 23, 180, 163},{178, 47, 54, 213, 250}
},{{183, 57, 53, 33, 30},{183, 57, 53, 33, 30},{196, 48, 47, 56, 103},{169, 50, 46, 87, 102},{176, 44, 56, 97, 65},{175, 52, 55, 128, 168},{194, 52, 58, 152, 208},{182, 42, 56, 186, 154},{178, 47, 54, 213, 250},{178, 47, 54, 213, 250}
},{{170, 51, 92, 8, 73},{169, 57, 67, 23, 64},{172, 58, 68, 56, 110},{178, 55, 77, 89, 21},{183, 49, 79, 108, 33},{177, 57, 69, 128, 201},{179, 58, 73, 135, 195},{178, 23, 75, 177, 219},{183, 37, 76, 191, 229},{175, 60, 60, 218, 241}
},{{170, 51, 92, 8, 73},{182, 58, 116, 20, 104},{180, 55, 103, 62, 94},{180, 55, 103, 62, 94},{162, 44, 95, 101, 48},{180, 41, 103, 128, 254},{188, 58, 94, 140, 208},{179, 64, 105, 177, 175},{181, 42, 112, 218, 177},{181, 55, 105, 252, 147}
},{{176, 28, 126, 6, 80},{180, 33, 128, 25, 136},{180, 55, 103, 62, 94},{174, 46, 122, 87, 41},{173, 41, 120, 101, 29},{175, 49, 128, 128, 26},{182, 57, 139, 156, 28},{175, 47, 124, 186, 194},{175, 47, 124, 186, 194},{181, 42, 112, 218, 177}
},{{185, 59, 154, 5, 153},{170, 52, 160, 8, 178},{182, 51, 168, 54, 159},{182, 51, 168, 54, 159},{188, 45, 156, 111, 230},{166, 53, 155, 128, 12},{178, 39, 148, 156, 25},{187, 52, 152, 192, 83},{187, 52, 152, 192, 83},{182, 14, 150, 230, 76}
},{{165, 51, 181, 18, 181},{176, 60, 172, 22, 178},{182, 51, 168, 54, 159},{177, 51, 176, 97, 215},{177, 51, 176, 97, 215},{177, 44, 174, 128, 55},{175, 52, 186, 167, 2},{175, 52, 186, 167, 2},{166, 52, 163, 202, 127},{191, 47, 182, 237, 79}
},{{165, 51, 181, 18, 181},{170, 66, 204, 36, 132},{191, 58, 216, 50, 235},{196, 47, 205, 80, 242},{179, 64, 209, 99, 197},{172, 53, 211, 128, 78},{175, 52, 186, 167, 2},{176, 64, 207, 188, 7},{179, 34, 196, 212, 5},{179, 34, 196, 212, 5}
},{{165, 51, 181, 18, 181},{191, 58, 216, 50, 235},{191, 58, 216, 50, 235},{170, 44, 231, 76, 169},{173, 46, 230, 92, 189},{171, 43, 231, 128, 99},{174, 52, 219, 133, 64},{190, 64, 226, 167, 63},{176, 64, 207, 188, 7},{179, 34, 196, 212, 5}
}},{{{176, 79, 68, 21, 42},{176, 79, 68, 21, 42},{199, 79, 32, 60, 16},{184, 63, 23, 75, 95},{177, 69, 7, 119},{177, 68, 0, 128, 241},{177, 68, 0, 128, 241},{179, 77, 28, 190, 216},{179, 77, 28, 190, 216},{179, 77, 28, 190, 216}
},{{176, 79, 68, 21, 42},{176, 79, 68, 21, 42},{199, 79, 32, 60, 16},{184, 63, 23, 75, 95},{180, 86, 25, 118, 9},{179, 79, 32, 128, 216},{179, 79, 32, 128, 216},{179, 77, 28, 190, 216},{179, 77, 28, 190, 216},{179, 77, 28, 190, 216}
},{{176, 79, 68, 21, 42},{176, 79, 68, 21, 42},{190, 70, 45, 63, 110},{163, 80, 57, 78},{181, 78, 56, 128, 199},{181, 78, 56, 128, 199},{183, 75, 45, 169, 252},{178, 75, 44, 191, 238},{178, 75, 44, 191, 238},{184, 86, 61, 229, 178}
},{{187, 79, 88, 10, 34},{178, 76, 78, 40, 28},{178, 76, 78, 40, 28},{178, 63, 81, 71, 31},{178, 55, 77, 89, 21},{173, 85, 79, 128, 179},{182, 81, 74, 145, 184},{170, 79, 73, 177, 153},{185, 81, 75, 200, 239},{184, 86, 61, 229, 178}
},{{191, 86, 97, 6, 10},{177, 79, 116, 20, 26},{170, 76, 92, 45, 19},{185, 89, 106, 87, 89},{172, 96, 96, 97, 73},{181, 77, 93, 128, 161},{175, 74, 105, 177, 185},{175, 74, 105, 177, 185},{178, 79, 121, 204, 204},{176, 84, 100, 225, 229}
},{{181, 71, 142, 2, 250},{177, 79, 116, 20, 26},{193, 77, 131, 51, 184},{175, 57, 122, 87, 63},{187, 75, 128, 128, 116},{187, 75, 128, 128, 116},{187, 75, 128, 128, 116},{178, 68, 110, 180, 168},{178, 79, 121, 204, 204},{176, 80, 133, 217, 56}
},{{181, 71, 142, 2, 250},{180, 66, 147, 7, 230},{177, 70, 164, 51, 228},{183, 79, 161, 91, 134},{183, 79, 161, 91, 134},{180, 79, 148, 128, 107},{186, 87, 148, 156, 97},{166, 80, 146, 161, 65},{178, 75, 175, 211, 1},{176, 80, 133, 217, 56}
},{{179, 74, 190, 24, 219},{179, 74, 190, 24, 219},{167, 76, 182, 56, 225},{175, 68, 167, 66, 138},{177, 78, 180, 128, 79},{177, 78, 180, 128, 79},{177, 78, 180, 128, 79},{175, 87, 185, 167, 98},{178, 75, 175, 211, 1},{187, 77, 182, 237, 41}
},{{179, 74, 190, 24, 219},{179, 74, 190, 24, 219},{196, 76, 216, 50, 230},{181, 72, 205, 81, 229},{179, 64, 209, 99, 197},{179, 87, 204, 128, 44},{193, 78, 204, 148, 83},{176, 64, 207, 188, 7},{176, 64, 207, 188, 7},{187, 77, 182, 237, 41}
},{{179, 74, 190, 24, 219},{179, 74, 190, 24, 219},{196, 76, 216, 50, 230},{181, 72, 205, 81, 229},{174, 80, 229, 128, 31},{174, 80, 229, 128, 31},{172, 70, 226, 167, 43},{172, 70, 226, 167, 43},{176, 64, 207, 188, 7},{187, 77, 182, 237, 41}
}},{{{182, 97, 57, 31, 117},{182, 97, 57, 31, 117},{191, 91, 24, 75, 51},{191, 91, 24, 75, 51},{177, 108, 0, 128, 217},{177, 108, 0, 128, 217},{170, 94, 11, 151, 236},{169, 97, 23, 178, 233},{169, 97, 23, 178, 233},{186, 94, 47, 215, 152}
},{{182, 97, 57, 31, 117},{182, 97, 57, 31, 117},{192, 104, 45, 63, 62},{191, 91, 24, 75, 51},{170, 104, 40, 110},{177, 89, 28, 128, 240},{170, 94, 11, 151, 236},{169, 97, 23, 178, 233},{182, 107, 44, 191, 202},{186, 94, 47, 215, 152}
},{{182, 97, 57, 31, 117},{182, 97, 57, 31, 117},{183, 114, 46, 62, 81},{192, 104, 45, 63, 62},{186, 95, 58, 98, 57},{181, 99, 54, 128, 228},{181, 99, 54, 128, 228},{165, 100, 52, 173, 220},{182, 107, 44, 191, 202},{188, 95, 57, 221, 131}
},{{192, 107, 73, 18, 116},{192, 107, 73, 18, 116},{193, 113, 78, 40, 82},{185, 102, 102, 71, 122},{157, 104, 76, 102, 91},{172, 103, 70, 128, 137},{170, 105, 73, 135, 137},{174, 96, 88, 178, 160},{182, 101, 74, 197, 216},{179, 104, 72, 213, 194}
},{{177, 128, 99, 8, 222},{170, 113, 91, 27, 31},{177, 99, 103, 62, 15},{185, 102, 102, 71, 122},{179, 105, 97, 97, 94},{175, 97, 107, 128, 161},{202, 103, 102, 140, 195},{183, 92, 105, 177, 183},{188, 98, 94, 210, 214},{179, 93, 102, 227, 239}
},{{173, 106, 147, 7, 215},{172, 90, 129, 23, 228},{179, 87, 116, 41, 61},{185, 102, 102, 71, 122},{172, 111, 130, 112, 181},{178, 100, 128, 128, 82},{178, 100, 128, 128, 82},{161, 101, 122, 186, 128},{165, 101, 135, 207, 12},{168, 98, 139, 238, 43}
},{{173, 106, 147, 7, 215},{173, 106, 147, 7, 215},{178, 86, 168, 54, 254},{186, 119, 157, 59, 239},{167, 96, 154, 108, 181},{189, 106, 156, 128, 79},{178, 91, 155, 143, 121},{168, 108, 164, 186, 94},{165, 101, 144, 209, 5},{168, 98, 139, 238, 43}
},{{165, 104, 157, 6, 210},{196, 99, 174, 24, 149},{175, 114, 175, 56, 206},{173, 100, 197, 74, 194},{179, 107, 180, 128, 104},{179, 107, 180, 128, 104},{178, 94, 171, 161, 98},{164, 103, 177, 172, 90},{179, 130, 177, 211, 215},{184, 117, 182, 237, 18}
},{{161, 102, 186, 21, 236},{161, 102, 186, 21, 236},{168, 101, 221, 58, 174},{173, 100, 197, 74, 194},{167, 107, 209, 99, 250},{177, 107, 204, 128, 18},{180, 114, 201, 149, 30},{172, 102, 207, 188, 61},{172, 102, 207, 188, 61},{191, 115, 208, 214, 78}
},{{168, 101, 221, 58, 174},{168, 101, 221, 58, 174},{168, 101, 221, 58, 174},{203, 100, 229, 70, 136},{171, 110, 234, 115, 216},{174, 115, 224, 128, 57},{174, 114, 226, 167, 29},{174, 114, 226, 167, 29},{172, 102, 207, 188, 61},{191, 115, 208, 214, 78}
}},{{{184, 123, 57, 31, 97},{184, 123, 57, 31, 97},{199, 129, 32, 60, 222},{170, 128, 7, 119, 222},{170, 128, 7, 119, 222},{184, 130, 0, 128, 62},{184, 130, 0, 128, 62},{178, 127, 23, 180, 234},{178, 127, 23, 180, 234},{178, 127, 23, 180, 234}
},{{184, 123, 57, 31, 97},{184, 123, 57, 31, 97},{199, 129, 32, 60, 222},{198, 127, 37, 66, 90},{178, 128, 27, 128, 45},{178, 128, 27, 128, 45},{175, 122, 33, 151, 231},{178, 127, 23, 180, 234},{178, 127, 23, 180, 234},{178, 127, 23, 180, 234}
},{{184, 123, 57, 31, 97},{184, 123, 57, 31, 97},{191, 130, 46, 62, 169},{197, 135, 54, 81, 161},{179, 141, 57, 97, 226},{174, 133, 61, 128, 18},{175, 122, 33, 151, 231},{178, 131, 56, 186, 55},{178, 131, 56, 186, 55},{189, 138, 61, 229, 107}
},{{177, 128, 99, 8, 222},{181, 124, 73, 29, 25},{181, 124, 73, 29, 25},{197, 135, 54, 81, 161},{176, 139, 95, 97, 129},{166, 128, 79, 128, 109},{167, 121, 69, 157, 130},{181, 128, 74, 189, 70},{181, 128, 74, 189, 70},{180, 137, 72, 235, 26}
},{{177, 128, 99, 8, 222},{177, 128, 99, 8, 222},{173, 135, 103, 62, 247},{193, 127, 106, 85, 5},{176, 139, 95, 97, 129},{182, 128, 101, 128, 87},{185, 122, 91, 150, 138},{189, 143, 105, 177, 110},{179, 118, 106, 217, 242},{189, 130, 99, 237, 53}
},{{187, 145, 135, 1, 40},{173, 129, 116, 20, 200},{192, 128, 118, 49, 131},{192, 128, 122, 88, 230},{181, 128, 131, 118, 68},{179, 127, 130, 124, 182},{179, 123, 146, 160, 126},{166, 126, 128, 189, 97},{190, 126, 120, 207, 243},{188, 133, 110, 225, 50}
},{{183, 131, 147, 7, 36},{183, 131, 147, 7, 36},{186, 119, 157, 59, 239},{189, 134, 145, 82, 124},{190, 139, 153, 106, 66},{179, 128, 141, 128, 186},{172, 131, 148, 156, 163},{179, 123, 146, 160, 126},{186, 132, 143, 208, 229},{186, 132, 143, 208, 229}
},{{183, 131, 147, 7, 36},{179, 150, 178, 31, 12},{175, 132, 171, 45, 41},{173, 141, 171, 81, 94},{172, 139, 186, 94, 71},{171, 126, 180, 128, 101},{185, 120, 172, 142, 103},{191, 137, 185, 174, 165},{179, 130, 177, 211, 215},{179, 130, 177, 211, 215}
},{{195, 137, 204, 37, 39},{195, 137, 204, 37, 39},{179, 118, 212, 67, 214},{179, 118, 212, 67, 214},{171, 128, 205, 128, 226},{171, 128, 205, 128, 226},{180, 114, 201, 149, 30},{172, 102, 207, 188, 61},{190, 130, 194, 213, 175},{190, 130, 194, 213, 175}
},{{184, 140, 223, 61, 82},{184, 140, 223, 61, 82},{184, 140, 223, 61, 82},{191, 131, 224, 68, 28},{186, 128, 237, 99, 48},{183, 126, 237, 128, 32},{187, 125, 226, 167, 7},{187, 125, 226, 167, 7},{187, 125, 226, 167, 7},{191, 115, 208, 214, 78}
}},{{{187, 161, 57, 31, 184},{187, 161, 57, 31, 184},{187, 162, 26, 70, 193},{187, 162, 26, 70, 193},{185, 154, 0, 128, 39},{185, 154, 0, 128, 39},{184, 165, 12, 152, 13},{183, 140, 23, 180, 28},{183, 140, 23, 180, 28},{189, 138, 61, 229, 107}
},{{187, 161, 57, 31, 184},{187, 161, 57, 31, 184},{187, 162, 26, 70, 193},{187, 162, 26, 70, 193},{170, 162, 25, 122, 239},{169, 143, 24, 128, 58},{184, 165, 12, 152, 13},{183, 140, 23, 180, 28},{191, 139, 36, 201, 93},{189, 138, 61, 229, 107}
},{{187, 161, 57, 31, 184},{187, 161, 57, 31, 184},{191, 160, 55, 57, 149},{194, 150, 51, 95, 188},{171, 153, 54, 112, 240},{184, 160, 54, 128, 42},{174, 150, 51, 171, 36},{174, 150, 51, 171, 36},{183, 145, 44, 191, 49},{189, 138, 61, 229, 107}
},{{191, 158, 76, 16, 249},{191, 158, 76, 16, 249},{180, 165, 78, 40, 243},{179, 161, 66, 105, 189},{179, 161, 66, 105, 189},{192, 149, 79, 128, 30},{175, 171, 76, 142, 66},{167, 147, 71, 173, 90},{186, 150, 74, 197, 39},{180, 137, 72, 235, 26}
},{{181, 166, 94, 8, 193},{170, 143, 100, 14, 203},{173, 136, 103, 62, 248},{199, 158, 103, 76, 246},{176, 139, 95, 97, 129},{175, 152, 104, 128, 91},{175, 152, 104, 128, 91},{169, 149, 105, 177, 96},{191, 140, 97, 197, 19},{196, 137, 102, 223, 112}
},{{187, 145, 135, 1, 40},{181, 149, 129, 23, 50},{181, 149, 129, 23, 50},{182, 140, 143, 84, 101},{180, 155, 139, 106, 74},{171, 153, 128, 128, 182},{186, 163, 132, 150, 143},{174, 161, 122, 186, 75},{193, 153, 136, 200, 156},{196, 144, 137, 234, 179}
},{{176, 143, 151, 4, 40},{185, 150, 166, 22, 27},{184, 155, 168, 54, 57},{198, 147, 149, 74, 14},{180, 155, 139, 106, 74},{174, 161, 150, 128, 157},{184, 152, 148, 156, 172},{184, 152, 148, 156, 172},{167, 147, 144, 209, 241},{196, 144, 137, 234, 179}
},{{179, 150, 178, 31, 12},{179, 150, 178, 31, 12},{184, 155, 168, 54, 57},{173, 141, 171, 81, 94},{177, 152, 180, 128, 153},{177, 152, 180, 128, 153},{177, 152, 180, 128, 153},{158, 147, 180, 175, 146},{166, 161, 178, 211, 226},{180, 163, 182, 237, 200}
},{{179, 166, 194, 26, 73},{179, 166, 194, 26, 73},{179, 176, 196, 64, 3},{190, 147, 200, 81, 48},{165, 153, 209, 99, 10},{178, 147, 197, 128, 224},{178, 147, 197, 128, 224},{175, 156, 207, 188, 196},{175, 156, 207, 188, 196},{180, 163, 182, 237, 200}
},{{179, 166, 194, 26, 73},{179, 166, 194, 26, 73},{184, 140, 223, 61, 82},{177, 173, 227, 66, 57},{163, 165, 226, 103, 7},{175, 153, 220, 128, 238},{173, 159, 226, 167, 243},{173, 159, 226, 167, 243},{175, 156, 207, 188, 196},{180, 163, 182, 237, 200}
}},{{{182, 174, 32, 60, 128},{182, 174, 32, 60, 128},{182, 174, 32, 60, 128},{178, 175, 27, 80, 210},{179, 175, 7, 119, 232},{186, 177, 0, 128, 15},{184, 165, 12, 152, 13},{171, 176, 23, 180, 60},{171, 176, 23, 180, 60},{171, 176, 23, 180, 60}
},{{182, 174, 32, 60, 128},{182, 174, 32, 60, 128},{182, 174, 32, 60, 128},{178, 175, 27, 80, 210},{178, 175, 27, 80, 210},{183, 177, 23, 128, 21},{183, 175, 25, 169, 44},{171, 176, 23, 180, 60},{171, 176, 23, 180, 60},{191, 178, 72, 230, 39}
},{{168, 174, 57, 31, 164},{168, 174, 57, 31, 164},{171, 173, 61, 49, 142},{178, 175, 27, 80, 210},{179, 166, 51, 110, 204},{182, 184, 53, 128, 63},{183, 185, 67, 159, 86},{169, 185, 44, 191, 7},{159, 179, 46, 204, 74},{191, 178, 72, 230, 39}
},{{187, 184, 94, 8, 209},{180, 165, 78, 40, 243},{180, 165, 78, 40, 243},{177, 188, 96, 95, 182},{179, 161, 66, 105, 189},{168, 174, 79, 128, 77},{175, 171, 76, 142, 66},{192, 174, 85, 180, 11},{169, 174, 80, 205, 30},{191, 178, 72, 230, 39}
},{{187, 184, 94, 8, 209},{172, 174, 116, 20, 230},{170, 171, 103, 62, 220},{170, 171, 103, 62, 220},{177, 188, 96, 95, 182},{165, 177, 104, 128, 120},{185, 169, 89, 155, 86},{178, 184, 105, 177, 86},{204, 177, 101, 205, 81},{168, 185, 104, 222, 35}
},{{201, 179, 128, 1, 127},{172, 174, 116, 20, 230},{162, 169, 145, 52, 42},{171, 180, 117, 99, 141},{171, 180, 117, 99, 141},{177, 181, 126, 128, 126},{177, 181, 126, 128, 126},{178, 184, 105, 177, 86},{178, 185, 135, 202, 194},{173, 182, 120, 227, 4}
},{{182, 170, 147, 7, 12},{174, 185, 167, 18, 38},{162, 169, 145, 52, 42},{182, 186, 155, 85, 70},{173, 186, 153, 106, 96},{184, 180, 141, 128, 133},{173, 179, 154, 146, 146},{173, 179, 154, 146, 146},{182, 171, 144, 209, 216},{183, 183, 134, 218, 216}
},{{160, 182, 179, 16, 49},{179, 166, 194, 26, 73},{186, 191, 174, 60, 19},{176, 189, 181, 72, 116},{188, 167, 186, 101, 64},{165, 177, 177, 128, 161},{173, 179, 154, 146, 146},{179, 185, 207, 188, 253},{166, 161, 178, 211, 226},{167, 180, 182, 237, 204}
},{{179, 166, 194, 26, 73},{179, 166, 194, 26, 73},{179, 176, 196, 64, 3},{179, 175, 201, 86, 7},{178, 180, 209, 99, 48},{179, 175, 209, 128, 201},{181, 179, 201, 134, 205},{179, 185, 207, 188, 253},{179, 185, 207, 188, 253},{167, 180, 182, 237, 204}
},{{179, 166, 194, 26, 73},{179, 166, 194, 26, 73},{177, 173, 227, 66, 57},{177, 173, 227, 66, 57},{180, 183, 219, 96, 60},{179, 177, 221, 128, 219},{183, 178, 226, 167, 196},{183, 178, 226, 167, 196},{179, 185, 207, 188, 253},{197, 184, 212, 210, 255}
}},{{{175, 208, 32, 60, 231},{175, 208, 32, 60, 231},{175, 208, 32, 60, 231},{174, 226, 22, 78, 144},{181, 204, 0, 128, 125},{181, 204, 0, 128, 125},{181, 204, 0, 128, 125},{194, 198, 23, 176, 39},{172, 196, 35, 200, 7},{172, 196, 35, 200, 7}
},{{175, 208, 32, 60, 231},{175, 208, 32, 60, 231},{175, 208, 32, 60, 231},{175, 208, 32, 60, 231},{177, 202, 24, 128, 103},{177, 202, 24, 128, 103},{195, 203, 26, 157, 11},{180, 217, 31, 181, 67},{172, 196, 35, 200, 7},{172, 196, 35, 200, 7}
},{{192, 208, 57, 31, 178},{192, 208, 57, 31, 178},{175, 196, 60, 49, 226},{197, 198, 47, 74, 226},{172, 212, 61, 101, 164},{176, 192, 55, 128, 67},{179, 218, 53, 159, 71},{174, 209, 56, 186, 121},{180, 219, 43, 206, 14},{170, 202, 72, 227, 79}
},{{174, 213, 88, 19, 180},{188, 205, 78, 40, 147},{188, 205, 78, 40, 147},{175, 205, 82, 96, 212},{175, 205, 82, 96, 212},{188, 206, 79, 128, 57},{172, 218, 85, 151, 48},{175, 207, 71, 182, 21},{189, 208, 80, 206, 119},{170, 202, 72, 227, 79}
},{{187, 184, 94, 8, 209},{205, 201, 104, 27, 243},{168, 204, 103, 62, 185},{168, 204, 103, 62, 185},{175, 205, 82, 96, 212},{181, 200, 103, 128, 30},{181, 200, 103, 128, 30},{178, 184, 105, 177, 86},{178, 204, 89, 195, 96},{160, 202, 103, 223, 86}
},{{172, 208, 141, 2, 119},{165, 207, 129, 23, 120},{169, 201, 118, 45, 191},{180, 203, 133, 101, 27},{180, 203, 133, 101, 27},{183, 204, 128, 128, 255},{183, 204, 128, 128, 255},{190, 189, 129, 187, 189},{169, 205, 136, 200, 160},{184, 199, 136, 230, 149}
},{{182, 203, 147, 7, 109},{182, 203, 147, 7, 109},{165, 201, 168, 54, 118},{182, 186, 155, 85, 70},{180, 203, 133, 101, 27},{170, 217, 154, 128, 237},{168, 198, 148, 152, 230},{158, 209, 155, 175, 255},{175, 200, 144, 209, 162},{184, 199, 136, 230, 149}
},{{182, 203, 147, 7, 109},{180, 216, 171, 42, 105},{176, 203, 192, 58, 5},{176, 189, 181, 72, 116},{180, 205, 180, 128, 201},{180, 205, 180, 128, 201},{179, 219, 178, 166, 248},{179, 219, 178, 166, 248},{166, 208, 161, 202, 153},{175, 207, 182, 237, 191}
},{{172, 214, 203, 36, 17},{172, 214, 203, 36, 17},{186, 203, 207, 54, 12},{176, 203, 192, 58, 5},{175, 216, 203, 97, 89},{184, 198, 217, 128, 163},{177, 208, 201, 155, 183},{181, 216, 192, 175, 134},{188, 212, 211, 211, 236},{175, 207, 182, 237, 191}
},{{172, 214, 203, 36, 17},{172, 214, 203, 36, 17},{184, 200, 223, 68, 111},{176, 201, 234, 81, 70},{163, 194, 229, 99, 99},{185, 199, 221, 128, 167},{180, 199, 234, 147, 142},{170, 200, 226, 167, 163},{188, 212, 211, 211, 236},{188, 212, 211, 211, 236}
}},{{{191, 230, 48, 40, 197},{191, 230, 48, 40, 197},{174, 226, 22, 78, 144},{174, 226, 22, 78, 144},{169, 227, 13, 99, 160},{177, 231, 0, 128, 82},{177, 231, 0, 128, 82},{182, 243, 22, 177, 102},{186, 240, 38, 205, 37},{180, 219, 43, 206, 14}
},{{191, 230, 48, 40, 197},{191, 230, 48, 40, 197},{179, 211, 32, 60, 248},{174, 226, 22, 78, 144},{169, 227, 13, 99, 160},{177, 226, 24, 128, 79},{177, 226, 24, 128, 79},{181, 243, 23, 180, 97},{186, 240, 38, 205, 37},{180, 219, 43, 206, 14}
},{{183, 242, 57, 31, 231},{183, 242, 57, 31, 231},{191, 230, 48, 40, 197},{184, 223, 45, 63, 241},{186, 223, 54, 93, 138},{181, 227, 69, 128, 23},{179, 218, 53, 159, 71},{177, 229, 46, 167, 89},{180, 219, 43, 206, 14},{185, 241, 54, 222, 36}
},{{176, 245, 79, 14, 128},{176, 245, 79, 14, 128},{194, 236, 78, 40, 204},{162, 222, 73, 75, 250},{194, 235, 78, 110, 141},{175, 231, 75, 130, 5},{171, 234, 78, 156, 23},{175, 224, 71, 182, 58},{183, 232, 67, 198, 94},{174, 245, 73, 234, 124}
},{{196, 234, 103, 4, 201},{173, 230, 116, 20, 175},{170, 229, 103, 62, 146},{182, 228, 109, 74, 241},{174, 233, 103, 128, 36},{174, 233, 103, 128, 36},{200, 232, 109, 154, 83},{167, 231, 105, 177, 28},{187, 229, 89, 200, 75},{182, 235, 105, 252, 76}
},{{179, 235, 122, 1, 167},{173, 230, 116, 20, 175},{170, 229, 103, 62, 146},{182, 228, 109, 74, 241},{177, 225, 128, 128, 212},{177, 225, 128, 128, 212},{162, 234, 129, 155, 214},{178, 244, 119, 180, 1},{182, 232, 143, 198, 147},{184, 241, 126, 240, 67}
},{{183, 226, 147, 7, 69},{183, 226, 147, 7, 69},{193, 228, 168, 54, 63},{184, 241, 143, 94, 28},{177, 220, 162, 116, 63},{176, 235, 164, 128, 251},{185, 239, 153, 158, 213},{182, 232, 143, 198, 147},{182, 232, 143, 198, 147},{169, 229, 144, 209, 137}
},{{178, 231, 187, 22, 124},{178, 231, 187, 22, 124},{178, 244, 184, 49, 75},{172, 227, 173, 60, 90},{168, 237, 177, 116, 4},{187, 223, 177, 128, 209},{179, 219, 178, 166, 248},{173, 233, 183, 175, 216},{186, 240, 180, 212, 174},{187, 240, 181, 227, 153}
},{{178, 231, 187, 22, 124},{178, 231, 187, 22, 124},{169, 229, 208, 41, 49},{176, 228, 209, 99, 98},{176, 228, 209, 99, 98},{167, 230, 200, 130, 143},{177, 208, 201, 155, 183},{178, 226, 207, 188, 167},{178, 226, 207, 188, 167},{187, 240, 181, 227, 153}
},{{178, 231, 187, 22, 124},{169, 229, 208, 41, 49},{182, 232, 224, 62, 4},{191, 235, 230, 73, 127},{185, 234, 234, 103, 90},{178, 231, 221, 128, 140},{175, 218, 226, 167, 180},{175, 218, 226, 167, 180},{178, 226, 207, 188, 167},{188, 212, 211, 211, 236}
}}},{{{{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{197, 23, 22, 78, 14},{203, 26, 13, 99, 59},{204, 27, 0, 128, 211},{202, 26, 7, 137, 218},{202, 26, 27, 187, 244},{198, 23, 38, 205, 190},{203, 26, 42, 209, 174}
},{{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{205, 28, 24, 74, 7},{203, 26, 13, 99, 59},{197, 23, 24, 128, 206},{189, 18, 14, 159, 186},{202, 26, 27, 187, 244},{198, 23, 38, 205, 190},{203, 26, 42, 209, 174}
},{{188, 17, 67, 22, 124},{188, 17, 67, 22, 124},{193, 20, 47, 54, 72},{183, 19, 47, 78, 65},{203, 43, 45, 102, 47},{204, 27, 45, 128, 254},{170, 9, 54, 149, 132},{202, 26, 56, 186, 214},{203, 26, 42, 209, 174},{205, 28, 59, 227, 141}
},{{198, 23, 78, 15, 20},{198, 23, 78, 15, 20},{201, 25, 78, 40, 50},{206, 32, 75, 79, 110},{189, 18, 73, 91, 57},{203, 26, 77, 128, 152},{200, 24, 72, 165, 185},{206, 29, 77, 190, 164},{204, 27, 77, 209, 207},{207, 30, 71, 231, 245}
},{{187, 17, 101, 5, 78},{187, 17, 97, 26, 85},{187, 17, 102, 52, 124},{193, 20, 103, 62, 8},{198, 23, 102, 110, 93},{198, 23, 97, 128, 180},{193, 20, 96, 161, 144},{206, 31, 105, 177, 141},{208, 30, 99, 197, 236},{183, 14, 97, 228, 184}
},{{195, 21, 139, 2, 219},{188, 17, 120, 18, 67},{188, 17, 146, 55, 140},{195, 22, 121, 72, 96},{204, 28, 146, 99, 165},{203, 26, 128, 128, 85},{188, 17, 128, 152, 49},{207, 30, 128, 182, 99},{201, 25, 131, 206, 25},{199, 24, 131, 234, 50}
},{{195, 21, 139, 2, 219},{188, 17, 146, 26, 161},{188, 17, 146, 55, 140},{188, 17, 157, 81, 229},{204, 28, 146, 99, 165},{188, 17, 152, 128, 49},{188, 17, 138, 152, 59},{188, 17, 146, 178, 9},{198, 23, 144, 209, 20},{196, 22, 149, 228, 39}
},{{164, 7, 178, 16, 133},{188, 17, 188, 22, 131},{203, 26, 171, 45, 211},{188, 17, 199, 73, 167},{194, 21, 169, 112, 138},{202, 29, 180, 128, 103},{194, 21, 177, 153, 123},{201, 25, 169, 171, 86},{187, 17, 194, 204, 32},{188, 17, 173, 228, 96}
},{{188, 17, 192, 25, 240},{188, 17, 192, 25, 240},{188, 17, 208, 47, 214},{188, 17, 203, 73, 171},{194, 21, 200, 106, 241},{188, 17, 204, 129, 100},{205, 28, 204, 171, 50},{188, 17, 204, 179, 86},{187, 17, 194, 204, 32},{188, 17, 204, 219, 62}
},{{188, 17, 192, 25, 240},{188, 17, 192, 25, 240},{199, 24, 227, 66, 250},{188, 17, 231, 75, 133},{188, 17, 230, 89, 150},{198, 23, 229, 128, 48},{188, 17, 219, 155, 105},{188, 17, 226, 182, 125},{188, 17, 226, 182, 125},{188, 17, 204, 219, 62}
}},{{{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{205, 28, 24, 74, 7},{203, 26, 13, 99, 59},{204, 27, 0, 128, 211},{202, 26, 7, 137, 218},{202, 26, 27, 187, 244},{202, 26, 27, 187, 244},{203, 26, 42, 209, 174}
},{{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{200, 24, 32, 60, 72},{205, 28, 24, 74, 7},{203, 26, 13, 99, 59},{204, 27, 34, 128, 241},{204, 27, 34, 128, 241},{202, 26, 27, 187, 244},{202, 26, 27, 187, 244},{203, 26, 42, 209, 174}
},{{198, 23, 78, 15, 20},{213, 35, 62, 26, 86},{201, 25, 45, 63, 70},{201, 25, 45, 63, 70},{203, 43, 45, 102, 47},{204, 27, 45, 128, 254},{204, 27, 45, 128, 254},{202, 26, 56, 186, 214},{203, 26, 42, 209, 174},{205, 28, 59, 227, 141}
},{{198, 23, 78, 15, 20},{201, 25, 78, 40, 50},{201, 25, 78, 40, 50},{206, 32, 75, 79, 110},{203, 26, 77, 128, 152},{203, 26, 77, 128, 152},{200, 24, 72, 165, 185},{206, 29, 77, 190, 164},{204, 27, 77, 209, 207},{207, 30, 71, 231, 245}
},{{212, 34, 102, 5, 17},{187, 17, 97, 26, 85},{196, 29, 103, 62, 4},{196, 29, 103, 62, 4},{198, 23, 102, 110, 93},{204, 28, 99, 134, 177},{204, 28, 99, 134, 177},{206, 31, 105, 177, 141},{208, 30, 99, 197, 236},{208, 30, 111, 236, 201}
},{{195, 21, 139, 2, 219},{180, 33, 128, 25, 136},{216, 38, 136, 45, 223},{195, 22, 121, 72, 96},{204, 28, 146, 99, 165},{203, 26, 128, 128, 85},{188, 17, 128, 152, 49},{207, 30, 128, 182, 99},{201, 25, 131, 206, 25},{199, 24, 131, 234, 50}
},{{195, 21, 139, 2, 219},{188, 17, 146, 26, 161},{203, 26, 171, 45, 211},{204, 28, 146, 99, 165},{204, 28, 146, 99, 165},{202, 26, 169, 128, 125},{186, 29, 148, 156, 43},{201, 25, 169, 171, 86},{201, 29, 144, 209, 17},{196, 22, 149, 228, 39}
},{{211, 33, 189, 23, 220},{211, 33, 189, 23, 220},{203, 26, 171, 45, 211},{203, 26, 171, 45, 211},{215, 37, 180, 104, 170},{202, 29, 180, 128, 103},{194, 21, 177, 153, 123},{201, 25, 169, 171, 86},{187, 17, 194, 204, 32},{196, 23, 182, 237, 12}
},{{211, 33, 189, 23, 220},{211, 33, 190, 24, 208},{188, 17, 208, 47, 214},{191, 27, 210, 76, 190},{191, 27, 203, 101, 142},{204, 27, 219, 128, 8},{205, 28, 204, 171, 50},{205, 28, 204, 171, 50},{187, 17, 194, 204, 32},{188, 17, 204, 219, 62}
},{{199, 24, 227, 66, 250},{199, 24, 227, 66, 250},{199, 24, 227, 66, 250},{199, 24, 227, 66, 250},{198, 23, 229, 128, 48},{198, 23, 229, 128, 48},{210, 32, 226, 143, 27},{188, 17, 226, 182, 125},{188, 17, 226, 182, 125},{188, 17, 204, 219, 62}
}},{{{204, 53, 30, 69, 38},{204, 53, 30, 69, 38},{204, 53, 30, 69, 38},{204, 53, 30, 69, 38},{198, 49, 13, 99, 29},{201, 52, 1, 128, 248},{203, 60, 16, 155, 248},{195, 52, 33, 182, 228},{199, 54, 32, 186, 239},{210, 44, 43, 211, 130}
},{{204, 53, 30, 69, 38},{204, 53, 30, 69, 38},{204, 53, 30, 69, 38},{204, 53, 30, 69, 38},{198, 49, 13, 99, 29},{203, 45, 31, 128, 253},{203, 60, 16, 155, 248},{195, 52, 33, 182, 228},{199, 54, 32, 186, 239},{210, 44, 43, 211, 130}
},{{189, 52, 57, 31, 43},{189, 52, 57, 31, 43},{196, 48, 47, 56, 103},{204, 53, 30, 69, 38},{203, 43, 45, 102, 47},{211, 45, 61, 128, 199},{194, 52, 58, 152, 208},{191, 54, 50, 165, 154},{205, 59, 57, 198, 141},{196, 41, 63, 230, 176}
},{{211, 33, 74, 17, 45},{203, 37, 78, 38, 2},{203, 37, 78, 38, 2},{205, 56, 78, 82, 109},{205, 56, 78, 82, 109},{212, 51, 79, 128, 172},{200, 61, 77, 146, 174},{208, 56, 72, 182, 146},{199, 35, 70, 202, 236},{207, 30, 71, 231, 245}
},{{212, 34, 102, 5, 17},{224, 48, 116, 20, 52},{196, 59, 103, 62, 34},{196, 59, 103, 62, 34},{198, 37, 105, 93, 83},{201, 49, 90, 128, 166},{204, 55, 105, 177, 167},{204, 55, 105, 177, 167},{204, 59, 94, 215, 250},{204, 59, 94, 215, 250}
},{{215, 37, 137, 1, 254},{208, 65, 129, 23, 131},{216, 38, 136, 45, 223},{217, 39, 115, 75, 66},{205, 47, 128, 128, 102},{205, 47, 128, 128, 102},{205, 47, 128, 128, 102},{204, 55, 105, 177, 167},{201, 51, 144, 209, 63},{202, 74, 128, 237, 105}
},{{185, 59, 154, 5, 153},{208, 65, 129, 23, 131},{228, 52, 147, 50, 245},{203, 63, 146, 94, 188},{203, 63, 146, 94, 188},{196, 53, 154, 128, 111},{197, 49, 148, 156, 120},{201, 55, 150, 182, 90},{201, 51, 144, 209, 63},{201, 51, 144, 209, 63}
},{{220, 43, 172, 12, 211},{195, 65, 181, 17, 162},{209, 54, 171, 45, 229},{190, 47, 181, 62, 158},{215, 37, 180, 104, 170},{206, 53, 180, 128, 75},{208, 55, 185, 167, 125},{208, 55, 185, 167, 125},{205, 54, 186, 211, 22},{199, 53, 182, 237, 45}
},{{226, 49, 199, 32, 176},{226, 49, 199, 32, 176},{191, 58, 216, 50, 235},{212, 52, 202, 74, 228},{211, 50, 210, 99, 212},{208, 49, 208, 128, 53},{208, 49, 208, 128, 53},{210, 44, 207, 188, 9},{205, 54, 186, 211, 22},{199, 53, 182, 237, 45}
},{{191, 58, 216, 50, 235},{191, 58, 216, 50, 235},{213, 44, 226, 65, 222},{210, 42, 221, 70, 231},{211, 50, 210, 99, 212},{199, 50, 215, 128, 38},{213, 44, 227, 165, 59},{213, 44, 227, 165, 59},{230, 60, 222, 196, 68},{199, 53, 182, 237, 45}
}},{{{199, 79, 32, 60, 16},{199, 79, 32, 60, 16},{199, 79, 32, 60, 16},{191, 79, 17, 89, 60},{204, 79, 0, 128, 135},{204, 79, 0, 128, 135},{204, 79, 0, 128, 135},{208, 72, 17, 157, 144},{202, 84, 41, 207, 252},{202, 84, 41, 207, 252}
},{{199, 79, 32, 60, 16},{199, 79, 32, 60, 16},{199, 79, 32, 60, 16},{204, 99, 26, 83, 98},{214, 82, 31, 108, 115},{212, 74, 24, 128, 130},{208, 72, 17, 157, 144},{206, 65, 32, 181, 158},{202, 84, 41, 207, 252},{202, 84, 41, 207, 252}
},{{225, 72, 57, 30, 10},{225, 72, 57, 30, 10},{214, 79, 47, 54, 4},{199, 86, 44, 60, 5},{215, 82, 49, 106, 90},{208, 74, 58, 128, 164},{216, 75, 59, 146, 190},{213, 76, 48, 185, 148},{202, 84, 41, 207, 252},{198, 87, 66, 232, 191}
},{{187, 79, 88, 10, 34},{218, 77, 78, 40, 117},{218, 77, 78, 40, 117},{212, 70, 75, 85, 8},{212, 70, 75, 85, 8},{201, 79, 68, 128, 198},{199, 85, 82, 148, 208},{207, 77, 71, 182, 247},{216, 72, 78, 196, 158},{198, 87, 66, 232, 191}
},{{191, 86, 97, 6, 10},{220, 69, 116, 20, 125},{204, 98, 103, 62, 115},{204, 98, 103, 62, 115},{194, 88, 98, 94, 34},{202, 68, 102, 128, 236},{202, 68, 102, 128, 236},{215, 79, 105, 177, 196},{210, 78, 89, 196, 133},{211, 74, 103, 251, 129}
},{{197, 79, 142, 2, 130},{208, 65, 129, 23, 131},{193, 77, 131, 51, 184},{207, 83, 122, 93, 63},{207, 83, 122, 93, 63},{193, 78, 128, 128, 11},{204, 90, 141, 146, 13},{215, 79, 105, 177, 196},{200, 83, 144, 209, 94},{202, 74, 128, 237, 105}
},{{197, 79, 142, 2, 130},{208, 65, 129, 23, 131},{193, 77, 131, 51, 184},{203, 63, 146, 94, 188},{203, 63, 146, 94, 188},{204, 98, 153, 128, 51},{204, 90, 141, 146, 13},{201, 55, 150, 182, 90},{200, 83, 144, 209, 94},{202, 74, 128, 237, 105}
},{{199, 76, 186, 21, 160},{199, 76, 186, 21, 160},{197, 76, 184, 55, 130},{197, 76, 184, 55, 130},{209, 82, 180, 128, 51},{209, 82, 180, 128, 51},{210, 79, 187, 167, 5},{210, 79, 187, 167, 5},{210, 87, 168, 196, 109},{187, 77, 182, 237, 41}
},{{199, 76, 186, 21, 160},{199, 76, 186, 21, 160},{196, 76, 216, 50, 230},{181, 72, 205, 81, 229},{208, 73, 209, 99, 175},{203, 80, 192, 124, 163},{193, 78, 204, 148, 83},{207, 81, 207, 188, 105},{207, 81, 207, 188, 105},{187, 77, 182, 237, 41}
},{{199, 76, 186, 21, 160},{196, 76, 216, 50, 230},{196, 76, 216, 50, 230},{210, 71, 229, 72, 188},{208, 73, 209, 99, 175},{202, 74, 235, 128, 111},{197, 79, 226, 167, 75},{197, 79, 226, 167, 75},{207, 81, 207, 188, 105},{207, 81, 207, 188, 105}
}},{{{209, 102, 50, 37, 36},{209, 102, 50, 37, 36},{204, 99, 26, 83, 98},{204, 99, 26, 83, 98},{202, 104, 0, 128, 166},{202, 104, 0, 128, 166},{202, 104, 0, 128, 166},{204, 102, 22, 177, 137},{204, 102, 22, 177, 137},{204, 102, 22, 177, 137}
},{{209, 102, 50, 37, 36},{209, 102, 50, 37, 36},{204, 99, 26, 83, 98},{204, 99, 26, 83, 98},{204, 99, 26, 83, 98},{202, 95, 23, 128, 134},{204, 102, 22, 177, 137},{204, 102, 22, 177, 137},{204, 102, 22, 177, 137},{204, 102, 22, 177, 137}
},{{209, 102, 50, 37, 36},{209, 102, 50, 37, 36},{209, 102, 50, 37, 36},{204, 107, 58, 96, 121},{204, 107, 58, 96, 121},{204, 108, 45, 128, 137},{200, 101, 65, 150, 254},{212, 102, 51, 180, 177},{220, 99, 60, 205, 202},{188, 95, 57, 221, 131}
},{{205, 117, 85, 11, 98},{192, 107, 73, 18, 116},{193, 113, 78, 40, 82},{195, 85, 71, 81, 4},{204, 107, 58, 96, 121},{208, 103, 79, 128, 252},{200, 101, 65, 150, 254},{201, 87, 67, 180, 237},{206, 100, 76, 215, 181},{206, 100, 76, 215, 181}
},{{227, 96, 103, 4, 100},{227, 106, 102, 29, 118},{204, 98, 103, 62, 115},{204, 98, 103, 62, 115},{203, 107, 97, 92, 25},{202, 103, 102, 140, 195},{202, 103, 102, 140, 195},{208, 118, 105, 177, 250},{188, 98, 94, 210, 214},{212, 103, 105, 252, 162}
},{{201, 120, 141, 2, 186},{196, 116, 129, 23, 162},{204, 98, 103, 62, 115},{204, 98, 103, 62, 115},{198, 95, 129, 111, 243},{205, 107, 128, 128, 34},{191, 93, 132, 150, 116},{202, 122, 114, 180, 242},{201, 117, 144, 209, 121},{202, 74, 128, 237, 105}
},{{200, 91, 147, 3, 135},{196, 99, 174, 24, 149},{219, 106, 174, 53, 174},{206, 114, 156, 93, 249},{206, 114, 156, 93, 249},{204, 98, 153, 128, 51},{195, 112, 147, 152, 60},{191, 104, 147, 162, 98},{201, 117, 144, 209, 121},{205, 101, 182, 237, 119}
},{{196, 99, 174, 24, 149},{196, 99, 174, 24, 149},{219, 106, 174, 53, 174},{215, 98, 178, 90, 217},{215, 98, 178, 90, 217},{207, 105, 180, 128, 22},{207, 105, 180, 128, 22},{210, 87, 168, 196, 109},{192, 118, 182, 211, 87},{205, 101, 182, 237, 119}
},{{197, 91, 190, 24, 188},{197, 91, 190, 24, 188},{212, 88, 216, 51, 227},{203, 100, 229, 70, 136},{197, 89, 209, 99, 170},{198, 111, 205, 128, 96},{209, 96, 203, 159, 97},{209, 96, 203, 159, 97},{191, 115, 208, 214, 78},{205, 101, 182, 237, 119}
},{{203, 100, 229, 70, 136},{203, 100, 229, 70, 136},{203, 100, 229, 70, 136},{203, 100, 229, 70, 136},{206, 95, 220, 112, 185},{212, 98, 230, 128, 84},{211, 87, 228, 163, 71},{211, 87, 228, 163, 71},{191, 115, 208, 214, 78},{205, 101, 182, 237, 119}
}},{{{199, 129, 32, 60, 222},{199, 129, 32, 60, 222},{199, 129, 32, 60, 222},{202, 119, 17, 89, 113},{210, 128, 0, 128, 86},{210, 128, 0, 128, 86},{210, 128, 0, 128, 86},{204, 102, 22, 177, 137},{191, 139, 36, 201, 93},{211, 132, 62, 230, 11}
},{{199, 129, 32, 60, 222},{199, 129, 32, 60, 222},{199, 129, 32, 60, 222},{213, 136, 26, 83, 144},{210, 130, 23, 107, 168},{197, 118, 25, 128, 174},{192, 135, 11, 151, 95},{204, 102, 22, 177, 137},{191, 139, 36, 201, 93},{211, 132, 62, 230, 11}
},{{216, 126, 58, 29, 5},{216, 126, 58, 29, 5},{217, 128, 46, 56, 203},{197, 135, 54, 81, 161},{204, 107, 58, 96, 121},{201, 128, 45, 128, 96},{195, 131, 46, 159, 117},{199, 131, 56, 186, 66},{194, 126, 58, 194, 192},{211, 132, 62, 230, 11}
},{{205, 117, 85, 11, 98},{211, 122, 64, 24, 117},{215, 128, 78, 40, 181},{197, 135, 54, 81, 161},{208, 121, 79, 128, 226},{208, 121, 79, 128, 226},{212, 128, 82, 142, 12},{209, 130, 87, 180, 52},{201, 128, 74, 197, 66},{206, 132, 65, 232, 103}
},{{177, 128, 99, 8, 222},{203, 147, 116, 20, 188},{192, 128, 118, 49, 131},{193, 127, 106, 85, 5},{199, 137, 96, 96, 202},{213, 131, 92, 128, 14},{205, 127, 92, 141, 231},{208, 118, 105, 177, 250},{205, 133, 94, 212, 70},{196, 137, 102, 223, 112}
},{{201, 120, 141, 2, 186},{196, 116, 129, 23, 162},{192, 128, 118, 49, 131},{192, 128, 122, 88, 230},{205, 126, 128, 128, 55},{205, 126, 128, 128, 55},{200, 135, 137, 154, 216},{202, 122, 114, 180, 242},{204, 131, 142, 198, 131},{202, 134, 128, 223, 151}
},{{205, 121, 158, 6, 168},{205, 121, 158, 6, 168},{200, 142, 149, 62, 105},{198, 147, 149, 74, 14},{206, 114, 156, 93, 249},{202, 132, 147, 128, 217},{190, 125, 148, 156, 79},{204, 131, 142, 198, 131},{204, 131, 142, 198, 131},{202, 134, 128, 223, 151}
},{{198, 138, 177, 15, 118},{197, 141, 175, 26, 121},{197, 123, 178, 64, 200},{197, 123, 178, 64, 200},{210, 137, 177, 89, 55},{203, 126, 180, 128, 5},{224, 127, 179, 145, 57},{220, 128, 184, 167, 199},{213, 133, 182, 211, 177},{208, 135, 182, 237, 136}
},{{195, 137, 204, 37, 39},{195, 137, 204, 37, 39},{199, 128, 196, 63, 56},{199, 128, 196, 63, 56},{210, 117, 209, 99, 145},{195, 131, 206, 126, 116},{192, 137, 195, 155, 149},{202, 141, 207, 188, 176},{202, 141, 207, 188, 176},{208, 135, 182, 237, 136}
},{{195, 137, 204, 37, 39},{195, 137, 204, 37, 39},{192, 139, 221, 58, 40},{206, 110, 234, 80, 158},{186, 128, 237, 99, 48},{208, 117, 231, 128, 70},{212, 121, 228, 163, 110},{199, 135, 226, 167, 129},{231, 125, 216, 205, 11},{191, 115, 208, 214, 78}
}},{{{212, 153, 58, 29, 238},{212, 153, 58, 29, 238},{205, 142, 32, 60, 219},{204, 154, 7, 119, 162},{204, 154, 7, 119, 162},{204, 154, 7, 119, 162},{201, 175, 12, 153, 119},{209, 152, 25, 183, 99},{209, 152, 25, 183, 99},{209, 152, 25, 183, 99}
},{{212, 153, 58, 29, 238},{212, 153, 58, 29, 238},{205, 142, 32, 60, 219},{220, 163, 25, 72, 170},{219, 161, 22, 101, 141},{215, 145, 24, 128, 90},{209, 152, 25, 183, 99},{209, 152, 25, 183, 99},{209, 152, 25, 183, 99},{209, 152, 25, 183, 99}
},{{212, 153, 58, 29, 238},{212, 153, 58, 29, 238},{196, 150, 45, 62, 197},{215, 154, 45, 64, 164},{194, 150, 51, 95, 188},{210, 155, 54, 128, 123},{208, 162, 60, 150, 92},{207, 159, 56, 186, 86},{201, 150, 41, 196, 54},{199, 146, 60, 219, 54}
},{{217, 156, 81, 13, 157},{206, 154, 78, 40, 182},{206, 154, 78, 40, 182},{211, 157, 69, 81, 222},{211, 157, 67, 105, 224},{207, 153, 79, 128, 29},{207, 153, 79, 128, 29},{209, 150, 68, 180, 51},{189, 145, 76, 210, 54},{220, 150, 69, 232, 99}
},{{210, 153, 100, 18, 185},{210, 153, 100, 18, 185},{205, 149, 94, 49, 179},{199, 158, 103, 76, 246},{199, 137, 96, 96, 202},{199, 160, 103, 128, 4},{202, 151, 91, 138, 8},{205, 174, 105, 177, 63},{204, 177, 101, 205, 81},{196, 137, 102, 223, 112}
},{{207, 170, 128, 1, 96},{203, 147, 116, 20, 188},{204, 149, 103, 62, 132},{203, 162, 121, 89, 205},{203, 162, 121, 89, 205},{204, 160, 128, 128, 232},{202, 164, 121, 152, 11},{192, 150, 117, 184, 31},{193, 153, 136, 200, 156},{202, 134, 128, 223, 151}
},{{204, 182, 152, 4, 98},{185, 150, 166, 22, 27},{200, 142, 149, 62, 105},{198, 147, 149, 74, 14},{190, 139, 153, 106, 66},{201, 152, 165, 128, 240},{201, 155, 148, 156, 222},{201, 155, 148, 156, 222},{202, 161, 144, 209, 174},{209, 157, 138, 217, 155}
},{{215, 158, 181, 17, 105},{197, 141, 175, 26, 121},{198, 152, 174, 59, 79},{205, 163, 171, 81, 16},{205, 169, 177, 116, 37},{208, 151, 174, 128, 237},{214, 156, 160, 155, 245},{191, 137, 185, 174, 165},{206, 169, 181, 211, 133},{200, 152, 186, 234, 132}
},{{215, 158, 181, 17, 105},{195, 137, 204, 37, 39},{209, 160, 212, 67, 98},{195, 159, 192, 76, 84},{201, 145, 209, 99, 110},{200, 165, 206, 125, 90},{213, 170, 200, 148, 167},{202, 141, 207, 188, 176},{213, 163, 215, 205, 232},{200, 152, 186, 234, 132}
},{{215, 158, 181, 17, 105},{208, 156, 231, 76, 99},{208, 156, 231, 76, 99},{208, 156, 231, 76, 99},{204, 158, 240, 95, 121},{204, 142, 224, 127, 89},{213, 164, 228, 162, 179},{223, 149, 227, 167, 138},{213, 163, 215, 205, 232},{200, 152, 186, 234, 132}
}},{{{207, 170, 57, 31, 199},{207, 170, 57, 31, 199},{211, 181, 21, 79, 184},{211, 181, 21, 79, 184},{202, 181, 0, 128, 123},{202, 181, 0, 128, 123},{201, 175, 12, 153, 119},{204, 176, 14, 160, 86},{214, 186, 38, 204, 2},{215, 173, 45, 213, 6}
},{{207, 170, 57, 31, 199},{207, 170, 57, 31, 199},{200, 196, 39, 50, 157},{211, 181, 21, 79, 184},{211, 181, 21, 79, 184},{201, 195, 26, 128, 20},{201, 175, 12, 153, 119},{208, 166, 21, 175, 72},{214, 186, 38, 204, 2},{215, 173, 45, 213, 6}
},{{207, 170, 57, 31, 199},{207, 170, 57, 31, 199},{195, 184, 45, 62, 236},{202, 181, 56, 89, 154},{202, 181, 56, 89, 154},{204, 178, 61, 128, 71},{201, 195, 53, 150, 45},{209, 181, 56, 186, 98},{214, 186, 38, 204, 2},{204, 183, 71, 233, 81}
},{{203, 183, 80, 14, 166},{205, 169, 77, 35, 142},{205, 169, 77, 35, 142},{202, 181, 56, 89, 154},{208, 182, 79, 128, 45},{208, 182, 79, 128, 45},{212, 181, 75, 154, 52},{201, 179, 71, 196, 125},{201, 179, 71, 196, 125},{204, 183, 71, 233, 81}
},{{201, 179, 128, 1, 127},{205, 201, 104, 27, 243},{208, 182, 103, 62, 187},{210, 183, 107, 83, 217},{200, 185, 103, 91, 201},{201, 188, 103, 128, 22},{205, 174, 105, 177, 63},{205, 174, 105, 177, 63},{204, 177, 101, 205, 81},{204, 177, 101, 205, 81}
},{{201, 179, 128, 1, 127},{201, 179, 128, 1, 127},{208, 182, 103, 62, 187},{212, 182, 121, 89, 198},{204, 176, 142, 114, 4},{200, 179, 128, 128, 255},{202, 164, 121, 152, 11},{205, 174, 105, 177, 63},{204, 177, 101, 205, 81},{201, 194, 122, 234, 31}
},{{204, 182, 152, 4, 98},{204, 182, 152, 4, 98},{210, 180, 168, 54, 124},{201, 195, 157, 76, 95},{204, 176, 142, 114, 4},{207, 178, 160, 128, 217},{200, 170, 146, 160, 212},{206, 199, 153, 173, 185},{209, 175, 157, 205, 170},{209, 175, 157, 205, 170}
},{{204, 182, 152, 4, 98},{213, 181, 188, 22, 78},{210, 180, 168, 54, 124},{203, 198, 179, 72, 114},{201, 194, 181, 99, 89},{191, 182, 180, 128, 185},{212, 177, 184, 166, 255},{212, 177, 184, 166, 255},{206, 169, 181, 211, 133},{212, 171, 182, 237, 160}
},{{213, 181, 188, 22, 78},{204, 178, 193, 39, 28},{204, 178, 193, 39, 28},{207, 179, 195, 64, 123},{210, 176, 209, 99, 84},{215, 184, 204, 128, 167},{213, 170, 200, 148, 167},{194, 190, 207, 188, 139},{197, 184, 212, 210, 255},{197, 184, 212, 210, 255}
},{{213, 181, 188, 22, 78},{204, 178, 193, 39, 28},{210, 171, 220, 56, 25},{201, 194, 221, 76, 30},{201, 194, 227, 107, 7},{199, 181, 231, 128, 145},{200, 183, 226, 167, 190},{200, 183, 226, 167, 190},{197, 184, 212, 210, 255},{197, 184, 212, 210, 255}
}},{{{201, 203, 32, 60, 154},{201, 203, 32, 60, 154},{201, 203, 32, 60, 154},{201, 203, 32, 60, 154},{207, 203, 0, 128},{207, 203, 0, 128},{207, 203, 0, 128},{194, 198, 23, 176, 39},{216, 218, 38, 203, 107},{191, 213, 42, 209, 21}
},{{201, 203, 32, 60, 154},{201, 203, 32, 60, 154},{201, 203, 32, 60, 154},{201, 203, 32, 60, 154},{202, 200, 31, 113, 232},{206, 197, 24, 128, 23},{195, 203, 26, 157, 11},{194, 198, 23, 176, 39},{216, 218, 38, 203, 107},{191, 213, 42, 209, 21}
},{{200, 209, 57, 31, 187},{200, 209, 57, 31, 187},{200, 196, 39, 50, 157},{199, 207, 47, 80, 243},{189, 207, 49, 113, 182},{205, 203, 57, 128, 59},{201, 195, 53, 150, 45},{202, 209, 56, 186, 29},{202, 209, 56, 186, 29},{216, 218, 52, 221, 111}
},{{205, 201, 81, 18, 195},{205, 201, 71, 22, 209},{205, 201, 77, 38, 235},{214, 220, 75, 79, 138},{202, 199, 90, 101, 182},{205, 203, 81, 128, 83},{213, 198, 78, 149, 76},{203, 205, 83, 169, 120},{189, 208, 80, 206, 119},{202, 189, 72, 232, 83}
},{{223, 211, 103, 4, 235},{205, 201, 104, 27, 243},{212, 202, 103, 62, 195},{204, 200, 112, 79, 191},{202, 199, 90, 101, 182},{196, 208, 100, 128, 116},{207, 207, 108, 165, 77},{204, 191, 105, 177, 47},{204, 177, 101, 205, 81},{223, 211, 102, 230, 8}
},{{196, 213, 128, 1, 20},{201, 196, 135, 26, 20},{205, 201, 149, 43, 62},{204, 200, 112, 79, 191},{205, 203, 117, 88, 175},{206, 202, 128, 128, 128},{206, 202, 128, 128, 128},{229, 204, 136, 180, 145},{203, 207, 144, 209, 193},{201, 205, 129, 238, 239}
},{{205, 204, 147, 7, 17},{205, 204, 147, 7, 17},{205, 201, 149, 43, 62},{201, 195, 157, 76, 95},{205, 203, 152, 128, 154},{205, 203, 152, 128, 154},{205, 215, 148, 156, 150},{206, 199, 153, 173, 185},{203, 207, 144, 209, 193},{203, 207, 144, 209, 193}
},{{203, 211, 180, 17, 57},{203, 211, 180, 17, 57},{199, 208, 168, 54, 13},{203, 198, 179, 72, 114},{201, 194, 181, 99, 89},{202, 206, 180, 128, 180},{202, 206, 180, 128, 180},{212, 222, 179, 181, 136},{201, 194, 184, 203, 252},{214, 203, 182, 237, 194}
},{{203, 211, 180, 17, 57},{199, 212, 202, 34, 127},{205, 202, 212, 56, 111},{207, 201, 205, 79},{201, 194, 203, 112, 52},{204, 208, 201, 130, 211},{204, 208, 201, 130, 211},{194, 190, 207, 188, 139},{201, 194, 184, 203, 252},{214, 203, 182, 237, 194}
},{{205, 201, 216, 51, 107},{205, 201, 216, 51, 107},{205, 201, 216, 51, 107},{203, 206, 229, 72, 44},{201, 194, 227, 107, 7},{207, 204, 221, 128, 218},{214, 198, 228, 161, 209},{214, 198, 228, 161, 209},{230, 203, 223, 196, 178},{188, 212, 211, 211, 236}
}},{{{204, 229, 73, 18, 246},{208, 226, 40, 49, 175},{208, 226, 35, 56, 173},{204, 229, 29, 77, 253},{204, 229, 0, 128, 45},{204, 229, 0, 128, 45},{204, 229, 0, 128, 45},{215, 219, 23, 180, 43},{203, 230, 41, 207, 79},{203, 230, 41, 207, 79}
},{{204, 229, 73, 18, 246},{208, 226, 40, 49, 175},{208, 226, 35, 56, 173},{204, 229, 29, 77, 253},{200, 231, 31, 89, 237},{207, 227, 23, 128, 63},{199, 233, 30, 156, 40},{207, 227, 30, 193, 119},{203, 230, 41, 207, 79},{203, 230, 41, 207, 79}
},{{204, 229, 73, 18, 246},{193, 236, 57, 31, 143},{208, 226, 40, 49, 175},{202, 231, 47, 81, 215},{202, 231, 45, 89, 221},{206, 227, 42, 128, 3},{203, 230, 48, 140, 21},{206, 228, 44, 163, 33},{203, 230, 41, 207, 79},{216, 218, 52, 221, 111}
},{{204, 229, 73, 18, 246},{204, 229, 73, 18, 246},{197, 234, 78, 40, 205},{214, 220, 75, 79, 138},{194, 235, 78, 110, 141},{204, 229, 79, 128, 98},{208, 226, 76, 150, 108},{201, 231, 74, 171, 75},{202, 230, 67, 202, 33},{205, 228, 110, 228, 39}
},{{198, 233, 105, 4, 198},{206, 228, 114, 30, 194},{203, 230, 103, 62, 240},{203, 230, 103, 62, 240},{206, 222, 96, 92, 168},{201, 231, 89, 128, 115},{200, 232, 109, 154, 83},{207, 227, 102, 191, 113},{207, 227, 102, 191, 113},{205, 228, 110, 228, 39}
},{{196, 213, 128, 1, 20},{208, 226, 128, 23, 33},{209, 226, 134, 62, 15},{209, 226, 134, 62, 15},{204, 229, 128, 110, 67},{201, 231, 128, 128, 170},{200, 232, 109, 154, 83},{203, 230, 145, 182, 142},{208, 226, 128, 204, 250},{205, 228, 110, 228, 39}
},{{197, 229, 147, 7, 48},{197, 229, 147, 7, 48},{202, 230, 173, 50, 55},{209, 226, 134, 62, 15},{204, 229, 128, 110, 67},{199, 233, 165, 128, 143},{206, 227, 148, 156, 161},{203, 230, 145, 182, 142},{201, 227, 144, 209, 239},{201, 227, 144, 209, 239}
},{{198, 233, 177, 15, 21},{208, 226, 189, 23, 28},{202, 230, 173, 50, 55},{202, 230, 173, 50, 55},{215, 219, 168, 97, 65},{204, 229, 191, 128, 146},{192, 237, 177, 163, 187},{212, 222, 179, 181, 136},{211, 224, 180, 201, 202},{209, 226, 182, 237, 236}
},{{202, 230, 199, 32, 79},{202, 230, 199, 32, 79},{196, 229, 206, 41, 66},{198, 227, 212, 67, 54},{204, 226, 209, 99, 24},{206, 227, 206, 128, 231},{202, 231, 202, 164, 199},{200, 232, 207, 188, 215},{195, 230, 195, 209, 179},{209, 225, 186, 222, 208}
},{{202, 230, 199, 32, 79},{202, 230, 199, 32, 79},{202, 231, 226, 65, 10},{199, 233, 234, 81, 17},{205, 228, 239, 93, 31},{203, 230, 219, 128, 242},{206, 227, 219, 151, 229},{199, 233, 226, 167, 239},{200, 232, 207, 188, 215},{209, 225, 186, 222, 208}
}}},{{{{223, 45, 58, 29, 81},{223, 45, 58, 29, 81},{225, 48, 38, 51, 64},{209, 31, 18, 85, 13},{222, 44, 11, 104, 21},{208, 30, 0, 128, 202},{215, 38, 11, 150, 232},{213, 35, 25, 183, 220},{210, 32, 39, 205, 156},{225, 47, 54, 223, 163}
},{{223, 45, 58, 29, 81},{223, 45, 58, 29, 81},{225, 48, 38, 51, 64},{205, 28, 24, 74, 7},{222, 44, 19, 94, 59},{210, 32, 25, 128, 239},{215, 38, 11, 150, 232},{213, 35, 25, 183, 220},{210, 32, 39, 205, 156},{225, 47, 54, 223, 163}
},{{223, 45, 58, 29, 81},{223, 45, 58, 29, 81},{193, 20, 47, 54, 72},{217, 39, 46, 81, 5},{222, 44, 50, 95, 27},{224, 47, 47, 128, 228},{222, 44, 53, 139, 200},{202, 26, 56, 186, 214},{210, 32, 39, 205, 156},{225, 47, 54, 223, 163}
},{{211, 33, 74, 17, 45},{211, 33, 74, 17, 45},{208, 31, 78, 40, 45},{206, 32, 75, 79, 110},{220, 42, 77, 112, 79},{203, 26, 77, 128, 152},{220, 42, 76, 155, 165},{228, 51, 78, 180, 169},{204, 27, 77, 209, 207},{211, 33, 69, 229, 214}
},{{212, 34, 102, 5, 17},{187, 17, 97, 26, 85},{187, 17, 102, 52, 124},{217, 39, 115, 75, 66},{198, 23, 102, 110, 93},{198, 23, 97, 128, 180},{218, 40, 111, 153, 128},{212, 34, 105, 177, 170},{210, 32, 98, 199, 211},{183, 14, 97, 228, 184}
},{{215, 37, 137, 1, 254},{216, 38, 116, 20, 26},{216, 38, 136, 45, 223},{217, 39, 115, 75, 66},{210, 32, 120, 93, 83},{209, 31, 128, 128, 74},{188, 17, 128, 152, 49},{207, 30, 128, 182, 99},{201, 25, 131, 206, 25},{199, 24, 131, 234, 50}
},{{221, 43, 147, 7, 230},{188, 17, 146, 26, 161},{228, 52, 147, 50, 245},{188, 17, 157, 81, 229},{204, 28, 146, 99, 165},{216, 38, 148, 128, 110},{215, 37, 147, 151, 114},{188, 17, 146, 178, 9},{233, 59, 153, 203, 4},{196, 22, 149, 228, 39}
},{{220, 43, 172, 12, 211},{211, 33, 189, 23, 220},{228, 51, 168, 54, 205},{215, 37, 180, 104, 170},{215, 37, 180, 104, 170},{213, 35, 180, 128, 70},{194, 21, 177, 153, 123},{228, 51, 170, 175, 86},{187, 17, 194, 204, 32},{228, 51, 180, 233, 14}
},{{211, 33, 189, 23, 220},{226, 49, 199, 32, 176},{188, 17, 208, 47, 214},{188, 17, 203, 73, 171},{232, 57, 201, 101, 249},{211, 33, 196, 128, 50},{205, 28, 204, 171, 50},{188, 17, 204, 179, 86},{232, 57, 201, 203, 87},{188, 17, 204, 219, 62}
},{{211, 33, 189, 23, 220},{226, 49, 199, 32, 176},{199, 24, 227, 66, 250},{221, 43, 233, 79, 212},{233, 59, 222, 104, 224},{198, 23, 229, 128, 48},{227, 50, 223, 154, 16},{188, 17, 226, 182, 125},{230, 60, 222, 196, 68},{188, 17, 204, 219, 62}
}},{{{223, 45, 58, 29, 81},{223, 45, 58, 29, 81},{225, 48, 38, 51, 64},{209, 31, 18, 85, 13},{222, 44, 11, 104, 21},{208, 30, 0, 128, 202},{215, 38, 11, 150, 232},{213, 35, 25, 183, 220},{210, 32, 39, 205, 156},{225, 47, 54, 223, 163}
},{{223, 45, 58, 29, 81},{223, 45, 58, 29, 81},{225, 48, 38, 51, 64},{205, 28, 24, 74, 7},{222, 44, 19, 94, 59},{210, 32, 25, 128, 239},{215, 38, 11, 150, 232},{213, 35, 25, 183, 220},{210, 32, 39, 205, 156},{225, 47, 54, 223, 163}
},{{223, 45, 58, 29, 81},{223, 45, 58, 29, 81},{220, 42, 41, 48, 107},{217, 39, 46, 81, 5},{222, 44, 50, 95, 27},{224, 47, 47, 128, 228},{222, 44, 53, 139, 200},{202, 26, 56, 186, 214},{210, 32, 39, 205, 156},{225, 47, 54, 223, 163}
},{{211, 33, 74, 17, 45},{211, 33, 74, 17, 45},{208, 31, 78, 40, 45},{206, 32, 75, 79, 110},{220, 42, 77, 112, 79},{203, 26, 77, 128, 152},{220, 42, 76, 155, 165},{228, 51, 78, 180, 169},{204, 27, 77, 209, 207},{211, 33, 69, 229, 214}
},{{212, 34, 102, 5, 17},{216, 38, 116, 20, 26},{221, 43, 103, 62, 43},{217, 39, 115, 75, 66},{221, 43, 99, 92, 77},{227, 50, 111, 128, 186},{218, 40, 111, 153, 128},{212, 34, 105, 177, 170},{210, 32, 98, 199, 211},{208, 30, 111, 236, 201}
},{{215, 37, 137, 1, 254},{216, 38, 116, 20, 26},{216, 38, 136, 45, 223},{217, 39, 115, 75, 66},{210, 32, 120, 93, 83},{209, 31, 128, 128, 74},{218, 40, 111, 153, 128},{207, 30, 128, 182, 99},{201, 25, 131, 206, 25},{199, 24, 131, 234, 50}
},{{221, 43, 147, 7, 230},{221, 43, 147, 7, 230},{228, 52, 147, 50, 245},{204, 28, 146, 99, 165},{204, 28, 146, 99, 165},{216, 38, 148, 128, 110},{215, 37, 147, 151, 114},{228, 52, 152, 164, 104},{233, 59, 153, 203, 4},{209, 31, 149, 223}
},{{220, 43, 172, 12, 211},{211, 33, 189, 23, 220},{228, 51, 168, 54, 205},{215, 37, 180, 104, 170},{215, 37, 180, 104, 170},{213, 35, 180, 128, 70},{194, 21, 177, 153, 123},{228, 51, 170, 175, 86},{232, 62, 189, 201, 38},{228, 51, 180, 233, 14}
},{{211, 33, 189, 23, 220},{226, 49, 199, 32, 176},{233, 60, 211, 56, 186},{212, 34, 212, 67, 229},{232, 57, 201, 101, 249},{211, 33, 196, 128, 50},{205, 28, 204, 171, 50},{205, 28, 204, 171, 50},{232, 57, 201, 203, 87},{233, 59, 198, 222, 78}
},{{211, 33, 189, 23, 220},{226, 49, 199, 32, 176},{199, 24, 227, 66, 250},{221, 43, 233, 79, 212},{233, 59, 222, 104, 224},{198, 23, 229, 128, 48},{227, 50, 223, 154, 16},{232, 57, 226, 181, 2},{230, 60, 222, 196, 68},{230, 54, 208, 209, 85}
}},{{{225, 48, 66, 22, 1},{225, 48, 38, 51, 64},{225, 48, 38, 51, 64},{217, 56, 19, 85, 35},{227, 50, 7, 118, 36},{228, 51, 0, 128, 211},{228, 51, 7, 137, 221},{232, 57, 22, 177, 242},{232, 56, 31, 194, 137},{229, 52, 48, 215, 178}
},{{225, 48, 66, 22, 1},{225, 48, 38, 51, 64},{225, 48, 38, 51, 64},{221, 46, 26, 83, 62},{222, 44, 19, 94, 59},{228, 51, 27, 128, 200},{227, 50, 16, 164, 225},{232, 57, 22, 177, 242},{232, 56, 31, 194, 137},{229, 52, 48, 215, 178}
},{{225, 48, 66, 22, 1},{229, 62, 57, 31, 121},{225, 48, 38, 51, 64},{217, 39, 46, 81, 5},{222, 44, 50, 95, 27},{224, 47, 47, 128, 228},{224, 47, 71, 153, 149},{230, 53, 35, 181, 193},{229, 52, 48, 215, 178},{231, 55, 55, 223, 188}
},{{225, 48, 66, 22, 1},{225, 48, 66, 22, 1},{224, 62, 78, 40, 60},{224, 46, 70, 72, 68},{225, 47, 69, 114, 125},{226, 49, 73, 128, 158},{226, 49, 73, 151, 137},{228, 51, 78, 180, 169},{230, 54, 73, 186, 167},{223, 45, 72, 237, 211}
},{{224, 46, 101, 5, 42},{224, 48, 116, 20, 52},{228, 51, 103, 62, 10},{228, 51, 103, 62, 10},{221, 46, 102, 116, 101},{227, 50, 111, 128, 186},{229, 53, 105, 177, 140},{229, 53, 105, 177, 140},{232, 57, 109, 219, 227},{231, 55, 103, 243, 192}
},{{233, 58, 133, 1, 211},{224, 48, 116, 20, 52},{228, 52, 147, 50, 245},{221, 49, 120, 93, 77},{221, 49, 120, 93, 77},{231, 55, 128, 128, 84},{231, 55, 128, 128, 84},{233, 65, 128, 174, 2},{228, 51, 144, 209, 18},{228, 59, 135, 221, 1}
},{{226, 48, 147, 7, 194},{226, 48, 147, 7, 194},{228, 52, 147, 50, 245},{228, 52, 147, 50, 245},{230, 53, 141, 128, 90},{230, 53, 141, 128, 90},{228, 52, 152, 164, 104},{228, 52, 152, 164, 104},{233, 59, 153, 203, 4},{230, 54, 164, 228, 20}
},{{233, 59, 168, 10, 244},{230, 55, 188, 22, 255},{228, 51, 168, 54, 205},{228, 51, 168, 54, 205},{226, 48, 193, 97, 246},{227, 50, 176, 128, 101},{229, 53, 169, 171, 86},{228, 51, 170, 175, 86},{232, 62, 189, 201, 38},{228, 51, 180, 233, 14}
},{{230, 55, 188, 22, 255},{231, 55, 197, 30, 143},{233, 60, 211, 56, 186},{212, 52, 202, 74, 228},{232, 57, 201, 101, 249},{233, 60, 205, 128, 28},{227, 50, 223, 154, 16},{230, 61, 209, 180, 58},{232, 57, 201, 203, 87},{233, 59, 198, 222, 78}
},{{230, 55, 188, 22, 255},{231, 55, 197, 30, 143},{233, 59, 229, 71, 244},{233, 59, 229, 71, 244},{233, 59, 222, 104, 224},{228, 51, 219, 128, 8},{227, 50, 223, 154, 16},{232, 57, 226, 181, 2},{230, 60, 222, 196, 68},{230, 54, 208, 209, 85}
}},{{{229, 70, 57, 31, 1},{229, 70, 57, 31, 1},{232, 82, 32, 60, 34},{235, 72, 23, 76, 124},{228, 76, 2, 128, 174},{228, 76, 2, 128, 174},{228, 76, 2, 128, 174},{229, 82, 23, 180, 144},{229, 82, 23, 180, 144},{231, 71, 57, 225, 252}
},{{229, 70, 57, 31, 1},{229, 70, 57, 31, 1},{232, 82, 32, 60, 34},{235, 72, 23, 76, 124},{241, 73, 13, 99, 82},{243, 77, 24, 128, 162},{229, 82, 23, 180, 144},{229, 82, 23, 180, 144},{223, 69, 34, 198, 250},{231, 71, 57, 225, 252}
},{{229, 70, 57, 31, 1},{229, 70, 57, 31, 1},{214, 79, 47, 54, 4},{242, 75, 45, 64, 80},{215, 82, 49, 106, 90},{225, 80, 61, 128, 136},{233, 66, 48, 164, 187},{230, 76, 56, 186, 172},{241, 77, 54, 213, 219},{231, 71, 57, 225, 252}
},{{245, 81, 91, 9, 114},{223, 78, 78, 40, 115},{223, 78, 78, 40, 115},{226, 90, 78, 87, 37},{226, 90, 78, 87, 37},{222, 74, 79, 128, 223},{231, 71, 78, 158, 244},{230, 76, 56, 186, 172},{240, 77, 76, 210, 167},{231, 71, 57, 225, 252}
},{{237, 71, 105, 4, 67},{224, 81, 116, 20, 85},{229, 85, 103, 62, 109},{239, 73, 110, 79, 3},{244, 79, 108, 101, 54},{244, 78, 102, 128, 216},{243, 77, 102, 148, 200},{236, 83, 105, 177, 227},{240, 71, 93, 202, 164},{242, 74, 108, 219, 139}
},{{233, 58, 133, 1, 211},{224, 85, 128, 23, 166},{244, 79, 112, 49, 126},{239, 73, 110, 79, 3},{228, 72, 136, 97, 193},{233, 77, 128, 128, 32},{233, 77, 128, 128, 32},{233, 65, 128, 174, 2},{229, 79, 144, 209, 111},{245, 80, 125, 232, 180}
},{{233, 59, 148, 4, 198},{224, 85, 128, 23, 166},{228, 52, 147, 50, 245},{241, 72, 163, 79, 209},{228, 72, 136, 97, 193},{222, 71, 165, 128, 56},{231, 104, 148, 156, 3},{244, 79, 157, 173, 15},{229, 79, 144, 209, 111},{233, 64, 147, 227, 93}
},{{233, 91, 182, 18, 146},{233, 91, 182, 18, 146},{224, 78, 174, 58, 190},{224, 78, 174, 58, 190},{233, 74, 209, 99, 149},{229, 90, 180, 128, 15},{229, 90, 180, 128, 15},{228, 51, 170, 175, 86},{228, 91, 183, 212, 88},{235, 79, 182, 237, 123}
},{{233, 91, 182, 18, 146},{231, 55, 197, 30, 143},{220, 67, 200, 60, 239},{233, 71, 192, 68, 174},{233, 74, 209, 99, 149},{233, 60, 205, 128, 28},{240, 76, 212, 167, 75},{230, 61, 209, 180, 58},{228, 59, 203, 199, 87},{234, 89, 201, 221, 35}
},{{233, 91, 182, 18, 146},{217, 86, 212, 45, 242},{233, 59, 229, 71, 244},{233, 59, 229, 71, 244},{233, 74, 209, 99, 149},{244, 78, 219, 128, 101},{232, 57, 232, 161, 28},{238, 67, 232, 177, 112},{230, 60, 222, 196, 68},{234, 89, 201, 221, 35}
}},{{{227, 107, 57, 31, 42},{227, 107, 57, 31, 42},{233, 111, 32, 60, 30},{228, 110, 22, 77, 85},{227, 100, 7, 118, 114},{237, 103, 0, 128, 142},{232, 103, 6, 134, 139},{224, 105, 22, 177, 170},{224, 105, 22, 177, 170},{230, 99, 52, 221, 232}
},{{227, 107, 57, 31, 42},{227, 107, 57, 31, 42},{233, 111, 32, 60, 30},{228, 110, 22, 77, 85},{227, 95, 16, 92, 116},{235, 102, 32, 128, 169},{224, 105, 22, 177, 170},{224, 105, 22, 177, 170},{219, 110, 34, 198, 213},{230, 99, 52, 221, 232}
},{{227, 107, 57, 31, 42},{227, 107, 57, 31, 42},{227, 107, 57, 31, 42},{251, 101, 46, 81, 101},{228, 106, 54, 128, 188},{228, 106, 54, 128, 188},{237, 91, 60, 153, 151},{230, 104, 56, 186, 136},{230, 99, 52, 221, 232},{230, 99, 52, 221, 232}
},{{227, 96, 103, 4, 100},{226, 102, 78, 40, 102},{226, 102, 78, 40, 102},{226, 90, 78, 87, 37},{226, 90, 78, 87, 37},{234, 114, 79, 128, 211},{224, 95, 84, 161, 206},{231, 125, 76, 177, 227},{235, 94, 73, 196, 188},{231, 125, 78, 226, 178}
},{{227, 96, 103, 4, 100},{227, 106, 102, 29, 118},{227, 106, 102, 29, 118},{231, 125, 101, 71, 60},{239, 93, 102, 104, 56},{217, 105, 102, 128, 210},{230, 125, 107, 147, 231},{230, 93, 105, 177, 231},{249, 94, 96, 205, 142},{231, 125, 105, 235, 156}
},{{231, 125, 119, 1, 104},{224, 85, 128, 23, 166},{224, 85, 128, 23, 166},{229, 122, 136, 77, 222},{221, 107, 120, 93, 23},{234, 98, 128, 128, 12},{231, 104, 148, 156, 3},{231, 125, 125, 178, 209},{232, 125, 128, 210, 67},{242, 91, 133, 235, 67}
},{{235, 93, 147, 7, 166},{231, 125, 158, 28, 156},{232, 105, 170, 55, 152},{225, 114, 162, 76, 249},{214, 110, 149, 112, 217},{233, 101, 165, 128, 45},{231, 104, 148, 156, 3},{231, 104, 148, 156, 3},{231, 116, 144, 209, 86},{251, 99, 146, 226, 108}
},{{233, 91, 182, 18, 146},{231, 125, 178, 26, 182},{232, 100, 171, 56, 155},{239, 108, 187, 76, 240},{215, 98, 178, 90, 217},{235, 97, 180, 128, 58},{231, 125, 179, 146, 63},{235, 109, 185, 167, 28},{231, 98, 193, 204, 12},{231, 107, 177, 240, 73}
},{{227, 98, 203, 35, 237},{227, 98, 203, 35, 237},{227, 98, 203, 35, 237},{239, 108, 187, 76, 240},{240, 102, 209, 99, 160},{237, 109, 207, 128, 75},{252, 102, 210, 153, 85},{242, 105, 206, 174, 127},{231, 98, 193, 204, 12},{234, 89, 201, 221, 35}
},{{227, 98, 203, 35, 237},{227, 98, 203, 35, 237},{244, 99, 224, 62, 205},{230, 119, 231, 76, 190},{240, 102, 209, 99, 160},{212, 98, 230, 128, 84},{231, 125, 234, 153, 109},{245, 102, 231, 180, 68},{243, 96, 229, 186, 72},{234, 89, 201, 221, 35}
}},{{{231, 125, 53, 34, 9},{231, 125, 53, 34, 9},{226, 121, 25, 72, 78},{231, 125, 23, 86, 95},{231, 125, 12, 101, 119},{231, 125, 1, 128, 159},{231, 125, 11, 151, 130},{232, 125, 23, 178, 180},{231, 125, 36, 201, 243},{231, 125, 44, 212, 230}
},{{231, 125, 53, 34, 9},{231, 125, 53, 34, 9},{226, 121, 25, 72, 78},{226, 121, 25, 72, 78},{231, 125, 12, 101, 119},{231, 125, 29, 128, 131},{231, 125, 12, 152, 138},{232, 125, 23, 178, 180},{231, 125, 36, 201, 243},{231, 125, 44, 212, 230}
},{{231, 125, 53, 34, 9},{231, 125, 53, 34, 9},{231, 125, 57, 42, 13},{241, 133, 53, 68, 129},{231, 125, 74, 111, 59},{231, 126, 62, 128, 163},{231, 126, 49, 159, 179},{236, 128, 51, 172, 119},{231, 125, 44, 212, 230},{231, 125, 53, 221, 246}
},{{238, 128, 96, 6, 140},{232, 133, 66, 22, 189},{236, 125, 78, 40, 115},{231, 125, 101, 71, 60},{231, 125, 74, 111, 59},{231, 125, 81, 128, 207},{230, 125, 72, 162, 245},{231, 125, 76, 177, 227},{231, 126, 71, 200, 146},{231, 125, 78, 226, 178}
},{{238, 128, 96, 6, 140},{231, 125, 104, 42, 92},{231, 125, 104, 42, 92},{231, 125, 101, 71, 60},{222, 128, 120, 93, 255},{231, 125, 93, 128, 195},{230, 125, 107, 147, 231},{234, 118, 105, 175, 222},{231, 125, 106, 217, 173},{231, 125, 105, 235, 156}
},{{231, 125, 119, 1, 104},{227, 128, 116, 20, 135},{231, 125, 104, 42, 92},{229, 122, 136, 77, 222},{222, 128, 120, 93, 255},{231, 125, 128, 128, 30},{231, 125, 129, 147, 12},{231, 125, 125, 178, 209},{232, 125, 128, 210, 67},{232, 125, 128, 210, 67}
},{{231, 125, 154, 5, 129},{231, 125, 158, 28, 156},{231, 125, 160, 42, 148},{231, 125, 151, 74, 195},{231, 125, 150, 83, 219},{232, 124, 152, 128, 8},{228, 115, 148, 156, 27},{231, 125, 145, 194, 77},{231, 125, 149, 215, 92},{231, 125, 158, 220, 92}
},{{231, 125, 175, 14, 191},{231, 125, 178, 26, 182},{231, 125, 182, 58, 146},{231, 125, 182, 58, 146},{235, 128, 180, 128, 219},{235, 128, 180, 128, 219},{231, 125, 179, 146, 63},{231, 125, 177, 173, 2},{231, 125, 183, 195, 106},{231, 125, 173, 219, 104}
},{{231, 125, 196, 29, 199},{231, 125, 196, 29, 199},{231, 125, 207, 41, 248},{231, 125, 210, 66, 142},{233, 143, 209, 99, 80},{231, 125, 200, 128, 86},{231, 128, 199, 142, 170},{231, 125, 203, 174, 123},{231, 125, 216, 205, 11},{231, 125, 199, 223, 6}
},{{231, 125, 196, 29, 199},{231, 125, 196, 29, 199},{231, 125, 218, 54, 242},{231, 125, 232, 78, 184},{231, 126, 243, 102, 136},{231, 125, 232, 128, 118},{231, 125, 234, 153, 109},{232, 124, 223, 175, 96},{231, 125, 216, 205, 11},{231, 125, 210, 213, 25}
}},{{{228, 138, 57, 31, 204},{228, 138, 57, 31, 204},{229, 159, 23, 77, 164},{229, 159, 23, 77, 164},{223, 150, 7, 119, 189},{231, 163, 0, 128, 64},{231, 163, 0, 128, 64},{233, 147, 23, 180, 93},{233, 147, 23, 180, 93},{223, 158, 48, 217, 44}
},{{228, 138, 57, 31, 204},{228, 138, 57, 31, 204},{221, 146, 32, 60, 215},{229, 159, 23, 77, 164},{219, 161, 22, 101, 141},{232, 146, 24, 128, 102},{232, 146, 24, 128, 102},{233, 147, 23, 180, 93},{233, 147, 23, 180, 93},{223, 158, 48, 217, 44}
},{{228, 138, 57, 31, 204},{228, 138, 57, 31, 204},{222, 166, 47, 53, 230},{238, 148, 45, 64, 147},{219, 154, 57, 96, 156},{229, 140, 47, 128, 66},{218, 156, 62, 150, 106},{223, 152, 56, 186, 65},{248, 146, 51, 205, 16},{232, 143, 55, 223, 11}
},{{217, 156, 81, 13, 157},{229, 151, 78, 40, 144},{229, 151, 78, 40, 144},{211, 157, 69, 81, 222},{231, 154, 80, 128, 41},{231, 154, 80, 128, 41},{229, 159, 79, 132, 53},{222, 152, 79, 194, 79},{231, 149, 78, 205, 117},{220, 150, 69, 232, 99}
},{{240, 143, 103, 4, 152},{210, 153, 100, 18, 185},{224, 150, 103, 62, 171},{224, 150, 103, 62, 171},{223, 156, 105, 89, 247},{222, 153, 102, 128, 37},{232, 159, 109, 152, 6},{224, 145, 105, 177, 45},{231, 149, 78, 205, 117},{244, 153, 93, 234, 94}
},{{221, 143, 141, 2, 89},{240, 149, 129, 23, 119},{247, 170, 135, 52, 106},{229, 122, 136, 77, 222},{234, 144, 134, 98, 26},{229, 149, 128, 128, 244},{232, 159, 109, 152, 6},{229, 143, 134, 177, 217},{234, 157, 144, 209, 178},{247, 138, 124, 223, 90}
},{{244, 158, 147, 4, 121},{231, 125, 158, 28, 156},{232, 151, 171, 45, 125},{231, 125, 151, 74, 195},{222, 155, 145, 94, 14},{230, 156, 162, 138, 214},{224, 143, 153, 161, 211},{229, 143, 134, 177, 217},{234, 157, 144, 209, 178},{223, 149, 162, 240, 156}
},{{224, 150, 186, 21, 93},{229, 151, 182, 37, 101},{232, 151, 171, 45, 125},{226, 145, 170, 70, 27},{229, 145, 180, 128, 196},{229, 145, 180, 128, 196},{230, 156, 162, 138, 214},{248, 145, 177, 175, 243},{250, 157, 182, 211, 134},{232, 146, 182, 237, 165}
},{{224, 150, 186, 21, 93},{224, 150, 186, 21, 93},{222, 158, 209, 42, 63},{231, 150, 209, 99, 71},{231, 150, 209, 99, 71},{226, 150, 203, 128, 187},{226, 150, 203, 128, 187},{226, 157, 207, 188, 136},{226, 157, 207, 188, 136},{226, 142, 207, 216, 255}
},{{224, 150, 186, 21, 93},{222, 158, 209, 42, 63},{231, 164, 226, 65, 100},{249, 154, 230, 74, 75},{231, 150, 209, 99, 71},{229, 150, 219, 128, 172},{230, 157, 229, 172, 182},{230, 157, 229, 172, 182},{230, 157, 229, 172, 182},{226, 142, 207, 216, 255}
}},{{{234, 175, 46, 41, 198},{234, 175, 46, 41, 198},{227, 176, 32, 60, 203},{233, 183, 20, 83, 157},{231, 178, 0, 128, 81},{231, 178, 0, 128, 81},{231, 178, 0, 128, 81},{245, 174, 21, 176, 122},{242, 182, 37, 203, 46},{235, 177, 44, 212, 38}
},{{234, 175, 46, 41, 198},{234, 175, 46, 41, 198},{227, 176, 32, 60, 203},{233, 183, 20, 83, 157},{236, 176, 17, 89, 144},{243, 181, 25, 128, 91},{232, 176, 7, 137, 82},{245, 174, 21, 176, 122},{242, 182, 37, 203, 46},{235, 177, 44, 212, 38}
},{{229, 172, 57, 31, 235},{229, 172, 57, 31, 235},{236, 177, 58, 51, 208},{232, 176, 45, 64, 177},{246, 173, 55, 101, 141},{231, 189, 59, 128, 101},{238, 180, 65, 140, 19},{231, 182, 56, 186, 87},{239, 179, 56, 198, 38},{242, 182, 52, 220, 40}
},{{233, 187, 91, 9, 132},{229, 172, 57, 31, 235},{236, 177, 58, 51, 208},{232, 170, 97, 93, 250},{244, 177, 77, 111, 227},{228, 182, 79, 128, 25},{212, 181, 75, 154, 52},{244, 177, 76, 175, 34},{244, 179, 75, 198, 78},{240, 181, 69, 230, 98}
},{{245, 176, 103, 4, 162},{231, 165, 116, 20, 166},{239, 177, 103, 62, 131},{239, 177, 103, 62, 131},{241, 183, 103, 98, 199},{226, 174, 103, 128, 47},{232, 159, 109, 152, 6},{218, 170, 105, 177, 44},{204, 177, 101, 205, 81},{246, 172, 103, 227, 90}
},{{233, 192, 119, 1, 219},{245, 176, 128, 23, 86},{242, 182, 122, 54, 140},{231, 182, 120, 93, 240},{231, 182, 120, 93, 240},{228, 180, 128, 128, 212},{227, 171, 142, 155, 217},{240, 186, 120, 180, 2},{212, 177, 144, 209, 160},{239, 188, 131, 234, 190}
},{{231, 189, 150, 4, 76},{231, 189, 150, 4, 76},{240, 178, 168, 47, 65},{218, 167, 155, 89, 59},{246, 172, 144, 96, 46},{243, 180, 150, 128, 213},{239, 172, 153, 157, 195},{239, 172, 153, 157, 195},{209, 175, 157, 205, 170},{228, 178, 182, 237, 137}
},{{244, 177, 178, 16, 99},{244, 177, 178, 16, 99},{228, 183, 175, 58, 66},{228, 183, 175, 58, 66},{231, 179, 209, 99, 98},{226, 171, 180, 128, 249},{241, 184, 172, 142, 239},{226, 171, 187, 175, 217},{222, 187, 194, 201, 234},{228, 178, 182, 237, 137}
},{{222, 184, 201, 34, 9},{222, 184, 201, 34, 9},{226, 176, 194, 39, 51},{231, 179, 209, 99, 98},{231, 179, 209, 99, 98},{230, 175, 206, 121, 122},{216, 172, 201, 147, 170},{240, 186, 207, 188, 189},{240, 185, 204, 199, 198},{228, 178, 182, 237, 137}
},{{222, 184, 201, 34, 9},{222, 184, 201, 34, 9},{233, 191, 218, 54, 62},{240, 187, 230, 73, 96},{233, 175, 237, 97, 78},{235, 175, 221, 128, 157},{225, 190, 237, 150, 160},{230, 157, 229, 172, 182},{231, 202, 219, 200, 186},{228, 178, 182, 237, 137}
}},{{{229, 204, 57, 31, 139},{229, 204, 57, 31, 139},{217, 203, 32, 60, 138},{226, 208, 16, 91, 253},{229, 204, 0, 128, 45},{229, 204, 0, 128, 45},{229, 204, 15, 162},{229, 204, 21, 176, 8},{229, 204, 21, 176, 8},{229, 203, 54, 223, 67}
},{{229, 204, 57, 31, 139},{229, 204, 57, 31, 139},{217, 203, 32, 60, 138},{223, 211, 27, 68, 215},{226, 208, 16, 91, 253},{231, 201, 33, 128, 11},{229, 204, 15, 162},{229, 204, 21, 176, 8},{224, 210, 31, 194, 107},{229, 203, 54, 223, 67}
},{{229, 204, 57, 31, 139},{229, 204, 57, 31, 139},{225, 202, 45, 58, 184},{225, 209, 46, 81, 203},{231, 201, 51, 128, 25},{231, 201, 51, 128, 25},{231, 201, 51, 128, 25},{227, 204, 44, 191, 56},{226, 208, 48, 195, 69},{229, 203, 54, 223, 67}
},{{221, 197, 77, 15, 222},{233, 197, 86, 25, 231},{228, 206, 65, 60, 211},{222, 212, 79, 86, 151},{232, 200, 81, 112, 133},{229, 204, 79, 128, 98},{233, 197, 71, 161, 78},{232, 200, 79, 186, 81},{236, 193, 77, 205, 41},{229, 203, 75, 225}
},{{232, 200, 105, 4, 201},{233, 197, 86, 25, 231},{231, 201, 93, 64, 183},{231, 201, 101, 88, 151},{231, 201, 101, 88, 151},{231, 201, 105, 133, 70},{229, 204, 122, 155, 76},{231, 201, 85, 183, 72},{225, 209, 98, 207, 25},{231, 202, 110, 231, 32}
},{{226, 208, 128, 1, 55},{234, 196, 130, 25, 49},{231, 201, 137, 42, 9},{229, 204, 120, 93, 136},{229, 204, 120, 93, 136},{229, 203, 133, 128, 175},{229, 204, 122, 155, 76},{229, 204, 136, 180, 145},{229, 204, 144, 209, 236},{228, 205, 129, 243, 223}
},{{229, 203, 147, 7, 62},{229, 203, 147, 7, 62},{229, 204, 165, 42, 34},{225, 209, 154, 104, 70},{225, 209, 154, 104, 70},{230, 203, 157, 128, 180},{221, 190, 153, 150, 232},{229, 204, 139, 182, 144},{229, 204, 148, 196, 253},{230, 203, 173, 222, 218}
},{{237, 191, 178, 16, 116},{224, 210, 169, 26, 5},{231, 201, 168, 54, 52},{236, 192, 176, 85, 77},{221, 212, 181, 99, 91},{228, 205, 191, 128, 146},{225, 209, 180, 164, 164},{230, 202, 180, 186, 166},{230, 202, 180, 186, 166},{230, 203, 179, 239, 245}
},{{231, 201, 194, 27, 115},{231, 201, 194, 27, 115},{232, 200, 211, 44, 91},{229, 200, 223, 74, 60},{230, 196, 209, 99, 20},{229, 204, 202, 128, 231},{230, 202, 205, 137, 236},{229, 204, 207, 188, 222},{230, 203, 195, 209, 187},{230, 203, 195, 209, 187}
},{{231, 201, 194, 27, 115},{231, 201, 194, 27, 115},{231, 201, 218, 53, 69},{229, 204, 231, 76, 6},{226, 208, 237, 100, 63},{230, 203, 230, 128, 207},{221, 210, 235, 154, 250},{230, 202, 235, 172, 239},{230, 203, 223, 196, 178},{230, 203, 223, 196, 178}
}},{{{218, 216, 41, 47, 128},{218, 216, 41, 47, 128},{221, 214, 36, 54, 157},{209, 225, 18, 87, 241},{216, 219, 13, 99, 233},{212, 223, 0, 128, 15},{223, 212, 7, 137, 1},{222, 212, 21, 176, 43},{216, 218, 38, 203, 107},{216, 218, 52, 221, 111}
},{{218, 216, 41, 47, 128},{218, 216, 41, 47, 128},{221, 214, 36, 54, 157},{204, 229, 29, 77, 253},{213, 221, 31, 97, 242},{211, 223, 25, 128, 17},{220, 214, 28, 155, 9},{223, 212, 24, 180, 35},{216, 218, 38, 203, 107},{216, 218, 52, 221, 111}
},{{229, 204, 57, 31, 139},{229, 204, 57, 31, 139},{220, 215, 47, 54, 150},{225, 209, 46, 81, 203},{202, 231, 45, 89, 221},{225, 209, 46, 128, 26},{206, 227, 62, 157, 10},{210, 225, 38, 183, 38},{226, 208, 48, 195, 69},{216, 218, 52, 221, 111}
},{{204, 229, 73, 18, 246},{204, 229, 73, 18, 246},{224, 210, 65, 59, 204},{214, 220, 75, 79, 138},{215, 219, 87, 99, 188},{220, 214, 77, 128, 67},{208, 226, 76, 150, 108},{224, 211, 84, 172, 79},{215, 219, 76, 192, 4},{229, 203, 75, 225}
},{{223, 211, 103, 4, 235},{206, 228, 114, 30, 194},{212, 223, 103, 62, 214},{212, 223, 103, 62, 214},{215, 219, 87, 99, 188},{210, 216, 103, 128, 105},{200, 232, 109, 154, 83},{207, 227, 102, 191, 113},{225, 209, 98, 207, 25},{223, 211, 102, 230, 8}
},{{226, 208, 128, 1, 55},{208, 226, 128, 23, 33},{209, 226, 134, 62, 15},{221, 213, 121, 90, 175},{204, 229, 128, 110, 67},{207, 227, 128, 128, 168},{229, 204, 122, 155, 76},{229, 204, 136, 180, 145},{208, 226, 128, 204, 250},{228, 205, 129, 243, 223}
},{{229, 203, 147, 7, 62},{222, 212, 161, 30, 49},{211, 223, 168, 53, 21},{214, 217, 169, 82, 112},{225, 209, 154, 104, 70},{217, 217, 153, 128, 157},{206, 227, 148, 156, 161},{203, 230, 145, 182, 142},{229, 204, 148, 196, 253},{225, 209, 143, 211, 232}
},{{218, 216, 178, 16, 36},{224, 210, 169, 26, 5},{202, 230, 173, 50, 55},{214, 217, 169, 82, 112},{221, 212, 181, 99, 91},{209, 225, 185, 128, 141},{225, 209, 180, 164, 164},{212, 222, 179, 181, 136},{211, 224, 180, 201, 202},{209, 226, 182, 237, 236}
},{{219, 216, 199, 31, 95},{219, 216, 199, 31, 95},{212, 222, 214, 49, 105},{198, 227, 212, 67, 54},{211, 223, 209, 99, 58},{229, 204, 202, 128, 231},{202, 231, 202, 164, 199},{212, 223, 207, 188, 252},{225, 209, 194, 200, 190},{209, 225, 186, 222, 208}
},{{219, 216, 199, 31, 95},{219, 216, 199, 31, 95},{212, 222, 214, 49, 105},{229, 204, 231, 76, 6},{226, 208, 237, 100, 63},{230, 203, 230, 128, 207},{214, 220, 230, 159, 247},{209, 225, 226, 167, 241},{230, 203, 223, 196, 178},{230, 203, 223, 196, 178}
}}}};

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


  // Lookup the value.
  // Serial.print(moveleftright * 2/51);
  // Serial.print(" ");
  // Serial.print(forwardback * 2/51);
  // Serial.print(" ");
  // Serial.print(updown * 2/51);
  // Serial.print(" ");
  // Serial.println(rotate * 2/51);
  
  int moveleftright_index = max(0, min(9, moveleftright * 2/51));
  int forwardback_index = max(0, min(9, forwardback * 2/51));
  int updown_index = max(0, min(9, updown * 2/51));
  int rotate_index = max(0, min(9, rotate * 2/51));

  unsigned char *values = outd[moveleftright_index][forwardback_index][updown_index][rotate_index];
  // unsigned char *values = outd[5][5][5][updown/10];

  if (values[0] == 0 && values[1] == 0 && values[2] == 0 && values[3] == 0 && values[4] == 0) {
    // hexstr = "63630a00000b0066808080808080800c8c99";
    Serial.print("Value missing from checksum DB: ");
    Serial.print(moveleftright * 2/51);
    Serial.print(", ");
    Serial.print(forwardback * 2/51);
    Serial.print(", ");
    Serial.print(updown * 2/51);
    Serial.print(", ");
    Serial.println(rotate * 2/51);
    
    values = outd[5][5][5][5];
  }

  // Serial.print(values[0]);
  // Serial.print(" ");
  // Serial.print(values[1]);
  // Serial.print(" ");
  // Serial.print(values[2]);
  // Serial.print(" ");
  // Serial.print(values[3]);
  // Serial.print(" ");
  // Serial.println(values[4]);

  //                       63630a00000b0066808080808080800c8c99
  // sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x8080800c0099", moveleftright, forwardback, updown, rotate);
  sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x80808004%02x99", values[0], values[1], values[2], values[3], values[4]);
  // Serial.println(hexstr);
}
