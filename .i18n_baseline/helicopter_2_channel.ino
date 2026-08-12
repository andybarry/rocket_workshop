//
// Ardunio Control of the S107 Helicopter
//
// Dervived from: kodek.pde - ver 1.0 - S107G IR packet transmitter
//
// Modified by Andrew Barry, Dan Barry, Brandon Vasquez, Jacob Izraelevitz 2012-2015
//
//
// Usage: attach IR LEDs to pin 13 and use the Serial Monitor to control
// the helicopter


// --- Initial setup code (don't worry about this too much) ---
#define CHANNEL_A 0
#define CHANNEL_B 1

byte channel = CHANNEL_A;
// --- end initial setup code ---



/*
 * HoldCommand (for your reference)
 *  Inputs:
 *    yawIn: Turn left/right.
 *      0 = maximum left turn
 *      63 = no turn
 *      127 = maximum right turn
 *
 *    pitchIn: pitch the helicopter to fly forwards and backwards
 *      0 = maxmimum backwards flight
 *      63 = hover
 *      127 = maximum forward flight
 *
 *    throttleIn: speed of the rotors (go up and down or hover)
 *      0 = no throttle
 *      65 = approximate hover throttle
 *      127 = max throttle (will go up FAST!)
 *
 *    holdTime: Time to hold this command for in milliseconds
 *      0 = do nothing
 *      500 = hold command for a half second
 *      1000 = hold for one second
 *
 *  Outputs:
 *      None.
 *
 *  Example:
 *      Hover for one half of a second
 *        HoldCommand(63, 63, 77, 500)
 *          63; don't turn left or right
 *          63: don't move forward or backwards
 *          60: approximate hover throttle
 *          500: do this for 500ms (aka half a second)
 *   
**/


/*
 * This function is called when the button is pressed.
 */
void ButtonPressed()
{
  // print to the serial port
  Serial.println();
  Serial.println("You hit the button.");
  Serial.println();
  
  
  // HoldCommand takes 4 numbers - yaw (0 to 127), pitch (0 to 127), throttle (0 to 127), time to hold (in milliseconds)
   
  // REMINDER: HoldCommand(yaw, pitch, throttle, time)
  
  //HoldCommand(63, 63, 110, 500); // example take-off
                                   // start with lots of throttle!
                                   
  //HoldCommand(63, 63, 65, 1000); // hover for 1 second
    
  // ------------------------
  //    ADD YOUR CODE HERE
  // ------------------------
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  //
  // -----------------------------
  // Implementation details below!
  // -----------------------------
  //
  
  
  
  
  
  
}


byte yawCmd, pitchCmd, throttleCmd, trimCmd;

void serialEvent()  // Called every time a command is recieved on the serial port
{
  char cmd = Serial.read();  // Reads in a command from the serial port
  
  // print out what command was received
  Serial.println();
  Serial.print("command received is ");
  Serial.println(cmd);

  switch (cmd) {
    
    case 'O':
    case 'o':
    case '0':
      Serial.print("Killing throttle. ");
      throttleCmd = 0;
      yawCmd = 63;
      pitchCmd = 63;
      break;
      
    case '5': // Attempt at hover throttle
      Serial.print("Got a throttle command.");
      throttleCmd = 77; // modify this slightly to make it easy to fly
      break;
      
    case '1':
    case '2':
    case '3':
    case '4':
    case '6':
    case '7':
    case '8':
    case '9':
      Serial.println("Got a throttle command.");
      throttleCmd = atoi(&cmd) * 14;  // Single character, so we can go from 0 to 124 by inputting 0 to 9 in the serial monitor
      break;

    case 'A':
    case 'a':  // Causes the helicopter to rotate counter-clockwise
      if (yawCmd - 5 >= 0) {
        yawCmd -= 5;
      } else {
        yawCmd = 0;
      }
      Serial.print("Yaw is ");
      Serial.println(yawCmd);
      break;

    case 'D':
    case 'd':  // Causes the helicopter to rotate clockwise
      if (yawCmd + 5 <= 127) {
        yawCmd += 5;
      } else {
        yawCmd = 127;
      }
      Serial.print("Yaw is ");
      Serial.println(yawCmd);
      break;

    case 'W':
    case 'w':  // Causes the helicopter to pitch forward
      if (pitchCmd + 5 <= 127) {
        pitchCmd += 5;
      } else {
        pitchCmd = 127;
      }
      
      Serial.print("Pitch is ");
      Serial.println(pitchCmd);
      break;

    case 'S':
    case 's':  // Causes the helicopter to pitch backwards
      if (pitchCmd - 5 >= 0) {
        pitchCmd -= 5;
      } else {
        pitchCmd = 0;
      }
      
      Serial.print("Pitch is ");
      Serial.println(pitchCmd);
      break;

    case 'U':
    case 'u':  // Causes the helicopter to inc in throttle
      if (throttleCmd + 6 <= 127) {
        throttleCmd += 6;
      } else {
        throttleCmd = 127;
      }
      
      Serial.print("Throttle is ");
      Serial.println(throttleCmd);
      break;

    case 'J':
    case 'j':  // Causes the helicopter to dec in throttle
      if (throttleCmd - 6 >= 0) {
        throttleCmd -= 6;
      } else {
        throttleCmd = 0;
      }
      
      Serial.print("Trottle is ");
      Serial.println(throttleCmd);
      break;

    case 'C':
    case 'c':  // Changes the channel A = 0, B = 1
      Serial.println("Changing channel");
      if (channel == 1) {
        channel = 0;
      } else {
        channel = 1;
      }
      break;

    case 'R':
    case 'r':  // Reset
      Serial.println("Resetting yaw and pitch");
      yawCmd = 63;
      pitchCmd = 63;
      break;
      
    default:  // Bad command
      Serial.println("Unknown command");
  }
  
  Serial.print("Throttle is at ");
  Serial.println(throttleCmd);
}

#define LED 13 // Pin connected to the infrared leds
#define BUTTON_INPUT 8
#define TAKEOFF_THROTTLE 110
#define HOLDING_THROTTLE 58
#define DELAY_CONST 50

/* Setup runs once, when the Arduino starts */
void setup()
{
  // Start the serial port communications
  Serial.begin(9600);

  // set the IR LED pin to be an output, take it to 0 volts
  pinMode(LED,OUTPUT);
  digitalWrite(LED,LOW);
  
  // configure the button input to be a pullup,
  // so we can connect the pin through the button
  // to ground
  pinMode(BUTTON_INPUT, INPUT_PULLUP);

  // initialize global command variables to be neutral.
  yawCmd = 63; // yaw: 0-127, 63 is no yaw
  pitchCmd = 63; // pitch: 0-127, 63 is no pitch
  trimCmd = 0;
  throttleCmd = 0; // throttle: 0-127, 0 is no throttle
  
  // send the first serial communication
  Serial.println("throttle = 0, standing by for commands.");
}


/*
 * Function to send a packet to the helicopter
 *
 * Inputs: yaw, pitch, throttle, trim
 *
 * Yaw: 0-127, 63 = no yaw
 * Pitch: 0-127, 63 = no pitch
 * Throttle: 0-127, 0 = off
 * Trim: 0-127, 0 = no trim
 *
 * Outputs:
 *  time it took to send the packet
 */
byte sendPacket(byte yaw,byte pitch,byte throttle,byte trim)
{
  pitch = 127-pitch; // reverse pitch so fowards is higher numbers
  yaw = 127-yaw; // reverse yaw to that left is lower and right is higher numbers
  
  static byte markL, countP, countR, one, zero, flag;
  static bool data;
  static const byte maskB[] = {1,2,4,8,16,32,64,128};
  static byte dataP[4];

  dataP[0] = yaw;
  dataP[1] = pitch;
  dataP[2] = throttle;
  dataP[3] = trim;
  
  markL = 77;
  countP = 4;
  countR = 8;
  one = 0;
  zero = 0;
  data = true;
  
  // flash the IR LED 77 times
  while(markL--)
  {
    digitalWrite(LED,LOW);
    delayMicroseconds(10);
    digitalWrite(LED,HIGH);
    delayMicroseconds(10);
  }

  // wait 2ms
  delayMicroseconds(1998);
  markL = 12;
  
  while(data)
  {
    // flash 12 times
    while(markL--)
    {
      digitalWrite(LED,LOW);
      delayMicroseconds(10);
      digitalWrite(LED,HIGH);
      delayMicroseconds(10);
    }
    markL = 12;
    flag = countR;

    if((dataP[4-countP] & maskB[--countR]) || (flag == 8 && countP == 2 && channel == 1)) {
      one++;
      //Serial.print("1");
      delayMicroseconds(688);
    } else {
      //Serial.print("0");
      zero++;

      delayMicroseconds(288);
    }

    if(!countR) {
      countR = 8;
      countP--;
      //Serial.println("... next command");
    }

    if(!countP) {
      data = false;
    }

  }

  while(markL--) {
    digitalWrite(LED,LOW);
    delayMicroseconds(10);
    digitalWrite(LED,HIGH);
    delayMicroseconds(10);
  }
  
  return((.1-.014296-one*.000688-zero*.000288)*1000); // in ms.
}

void TestCopter() // Small function that tests the helicopters yaw, pitch and throttle at once
{
  yawCmd = 15;
  pitchCmd = 15;
  trimCmd = 0;
  throttleCmd = TAKEOFF_THROTTLE;
  HoldCommand(yawCmd, pitchCmd, throttleCmd, 500);
  
  throttleCmd = 0;
  yawCmd = 63;
  pitchCmd = 63;
}


/*
 * HoldCommand
 *  Inputs:
 *    yawIn: Turn left/right.
 *      0 = maximum right turn
 *      63 = no turn
 *      127 = maximum left turn
 *
 *    pitchIn: pitch the helicopter to fly forwards and backwards
 *      0 = maxmimum backwards flight
 *      63 = hover
 *      127 = maximum forwards flight
 *
 *    throttleIn: speed of the rotors (go up and down or hover)
 *      0 = no throttle
 *      77 = apporximate hover throttle
 *      127 = max throttle (will go up FAST!)
 *
 *    holdTime: Time to hold this command for in milliseconds
 *      0 = do nothing
 *      500 = hold command for a half second
 *      1000 = hold for one second
 *
 *  Outputs:
 *      None.
 *
 *      
 * 
 */
void HoldCommand(int yawIn, int pitchIn, int throttleIn, int holdTime)
{
  // print out status messages to the serial port
  Serial.print("HoldingCommand running:\n\t-----------------------------------------\n");
  Serial.print("\tYaw\tPitch\tThrottle\tTime (ms)\n\t-----------------------------------------\n\t");
  Serial.print(yawIn);
  Serial.print("\t");
  Serial.print(pitchIn);
  Serial.print("\t");
  Serial.print(throttleIn);
  Serial.print("\t\t");
  Serial.println(holdTime);

  // initialize variables
  int delayAmount = holdTime/DELAY_CONST;
  int packetDelay;

  // loop until we're done holding the command
  while (holdTime > 0) {
    
    // check to see if we should abort because of a message
    // on the serial port
    if (Serial.available() == true) {
      
      // abort
      Serial.println("HOLD COMMAND ABORTED");
      break;
    }

    // send a packet to the heliocopter containing the command
    // we're holding
    packetDelay = sendPacket(yawIn, pitchIn, throttleIn, trimCmd);
    
    // remember how long we've held this for and subtract
    // from our total time
    holdTime = holdTime - packetDelay;

    // wait until the next packet
    delay(packetDelay);

    // delay a bit more
    delay(delayAmount);
    holdTime = holdTime - delayAmount;
  }
  
  // print out that we're done
  Serial.println("done.");
  Serial.println();
  
}



void loop()
{
    // Note that serialEvent() gets called on each path of the loop
    // and runs if there is data at the serial port

    delay(sendPacket(yawCmd,pitchCmd,throttleCmd,trimCmd));
    
    // check the button (we check for LOW since we've configured it to be pulled high)
    if (digitalRead(BUTTON_INPUT) == LOW) {
      ButtonPressed();
    }
}

