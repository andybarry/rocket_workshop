byte channel = 5;  // change this to brand and channel you have (see list of options below)
//  S107: A -> 0, B -> 1
//  Kingco / High Speed: A -> 8, B -> 9, C -> 10  (prior version A-5, B-6, C-7)
//  (HAK-303: A -> 2, B -> 3, C -> 4)

void ButtonPressed()
{
  Serial.println("You pressed the button and started the HoldCommands.");  // Test message: print to the serial port
  
  // HoldCommand takes 4 numbers - yaw (0 to 127), pitch (0 to 127), throttle (0 to 127), time to hold (in milliseconds)
  // REMINDER: HoldCommand(yaw, pitch, throttle, time)

  HoldCommand(63, 63, 100, 500); // example take-off with lots of throttle!
  HoldCommand(63, 63, 65, 2000); // hover for 2 seconds (2000ms) without tilting or turning
  HoldCommand(90, 127, 65, 2000); // spin in a circle for 2 seconds
  HoldCommand(63, 63, 35, 2000); // slow down for soft landing


  

}


// Ardunio Control of the S107G, Hak, and Kingco Helicopters
// Derived from: kodek.pde - ver 1.0 - S107G IR packet transmitter
// Modified by Andrew Barry, Dan Barry, Brandon Vasquez, Jacob Izraelevitz, Andy Pethan 2012-2023
//
// Usage: attach IR LEDs to pin 13 and use the Serial Monitor to control the helicopter 
//        and button (pin 8) to launch autonomous flight from code below

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
  
  //
  // -----------------------------
  // Implementation details below!
  // -----------------------------
  //

#define S107_CHANNEL_A       0  // don't change these numbers
#define S107_CHANNEL_B       1
#define HAK_CHANNEL_A        2
#define HAK_CHANNEL_B        3
#define HAK_CHANNEL_C        4
#define K_CHANNEL_A          5
#define K_CHANNEL_B          6
#define K_CHANNEL_C          7
#define K2_CHANNEL_A         8
#define K2_CHANNEL_B         9
#define K2_CHANNEL_C         10

byte yawCmd, pitchCmd, throttleCmd;
bool tx109_channel_b_delay_state = false;

void serialEvent()  // Called every time a command is recieved on the serial port
{
  char cmd = Serial.read();  // Reads in a command from the serial port

  if (cmd == '\n') {
    // ignore
    return;
  }
  
  // print out what command was received
  Serial.println();
  Serial.print("command received is ");
  Serial.println(cmd);

  int yawDelta = 5;
  int pitchDelta = 5;
  if (channel == K2_CHANNEL_A || channel == K2_CHANNEL_B || channel == K2_CHANNEL_C) {
    pitchDelta = 8;
  }
  

  switch (cmd) {
    
    case 'O':
    case 'o':
    case '0':
      Serial.print("Zeroing throttle. ");
      throttleCmd = 0;
      yawCmd = 63;
      pitchCmd = 63;
      break;
      
    case '5': // Attempt at hover throttle
      Serial.print("Got a throttle command.");
      throttleCmd = 60; // modify this slightly to make it easy to fly
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
      if (yawCmd - yawDelta >= 0) {
        yawCmd -= yawDelta;
      } else {
        yawCmd = 0;
      }
      Serial.print("Yaw is ");
      Serial.println(yawCmd);
      break;

    case 'D':
    case 'd':  // Causes the helicopter to rotate clockwise
      if (yawCmd + yawDelta <= 127) {
        yawCmd += yawDelta;
      } else {
        yawCmd = 127;
      }
      Serial.print("Yaw is ");
      Serial.println(yawCmd);
      break;

    case 'F':
    case 'f':  // Causes the helicopter to rotate clockwise
      if (pitchCmd - 1 <= 127) {
        pitchCmd -= 1;
      } else {
        pitchCmd = 0;
      }
      Serial.print("pitchCmd is ");
      Serial.println(pitchCmd);
      break;

    case 'G':
    case 'g':  // Causes the helicopter to rotate clockwise
      if (pitchCmd + 1 <= 127) {
        pitchCmd += 1;
      } else {
        pitchCmd = 127;
      }
      Serial.print("pitchCmd is ");
      Serial.println(pitchCmd);
      break;

    case 'W':
    case 'w':  // Causes the helicopter to pitch forward
      if (pitchCmd + pitchDelta <= 127) {
        pitchCmd += pitchDelta;
      } else {
        pitchCmd = 127;
      }
      
      Serial.print("Pitch is ");
      Serial.println(pitchCmd);
      break;

    case 'S':
    case 's':  // Causes the helicopter to pitch backwards
      if (pitchCmd - pitchDelta >= 0) {
        pitchCmd -= pitchDelta;
      } else {
        pitchCmd = 0;
      }
      
      Serial.print("Pitch is ");
      Serial.println(pitchCmd);
      break;

    case 'U':
    case 'u':  // Causes the helicopter to inc in throttle
      if (throttleCmd + 2 <= 127) {
        throttleCmd += 2;
      } else {
        throttleCmd = 127;
      }
      break;

    case 'J':
    case 'j':  // Causes the helicopter to dec in throttle
      if (throttleCmd - 6 >= 0) {
        throttleCmd -= 6;
      } else {
        throttleCmd = 0;
      }
      break;

    //case 'C':
    //case 'c':  // Changes the channel A = 0, B = 1
    //  Serial.println("Changing channel");
    //  if (channel == 1) {
    //    channel = 0;
    //  } else {
    //    channel = 1;
    //  }
    //  break;

    case 'R':
    case 'r':  // Reset
      Serial.println("Resetting yaw and pitch");
      yawCmd = 63;
      pitchCmd = 63;
      break;
      
    default:  // Bad command
      Serial.print("Unknown command:");
      Serial.println(cmd);
  }
  
  Serial.print("Throttle is at ");
  Serial.println(throttleCmd);
  //Serial.print("Trim is an extra +");
  //Serial.println(analogRead(A0)/60);
}

#define LED 13 // Pin connected to the infrared leds
#define BUTTON_INPUT 8
#define KNOB_INPUT A0
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

  // configure the knob as an analog input
  pinMode(KNOB_INPUT, INPUT);

  // initialize global command variables to be neutral.
  yawCmd = 63; // yaw: 0-127, 63 is no yaw
  pitchCmd = 63; // pitch: 0-127, 63 is no pitch
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
byte sendPacket_S107G(byte yaw, byte pitch, byte throttle)
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
  //dataP[3] = trim;  TODO remove
  
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

    if((dataP[4-countP] & maskB[--countR]) || (flag == 8 && countP == 2 && channel == S107_CHANNEL_B)) {
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

 
/*
 * Function that does the actual work of converting commands into
 * IR LED pulses and changes the pins in the appropriate manner.
 */
byte last_packet_num = 0;
byte sendPacket_Hak(byte yaw, byte pitch, byte throttle)
{
 int packetData[100];
 int pulseNum;
 byte delayValue;
 int i;

 if (last_packet_num == 0) {
    delayValue = 94;
    last_packet_num ++;
 } else if (last_packet_num == 1) {
    delayValue = 132;
    last_packet_num ++;
 } else {
    delayValue = 170;
    last_packet_num = 0;
 }
 
 
 digitalWrite(LED, HIGH);
 
 // First is always 1
 packetData[0] = 1;
 
 // throttle
 // 127 = zero throttle
 // 7 = full throttle
 // map from 0-127 to 7-127:
 int throttleOut = -120.0/127.0 * throttle + 127;
 
 packetData[1] = (throttleOut & 0b1000000) >> 6;
 packetData[2] = (throttleOut & 0b0100000) >> 5;
 packetData[3] = (throttleOut & 0b0010000) >> 4;
 packetData[4] = (throttleOut & 0b0001000) >> 3;
 packetData[5] = (throttleOut & 0b0000100) >> 2;
 packetData[6] = (throttleOut & 0b0000010) >> 1;
 packetData[7] = (throttleOut & 0b0000001);


  // yaw
  // map 0-127 to 17 - 0
  int yawMagnitude =  -abs(64-yaw) + 64;
  int yawOut = 15.0/63.0 * yawMagnitude;
 packetData[8] = (yawOut & 0b01000) >> 3;
 packetData[9] = (yawOut & 0b00100) >> 2;
 packetData[10] = (yawOut & 0b00010) >> 1;
 packetData[11] = (yawOut & 0b00001);

 // Direction bit
 packetData[16] = yaw < 63;
 
 
 // pitch
 int pitchMagnitude = -abs(64-pitch) + 64;
  int pitchOut = 15.0/63.0 * pitchMagnitude;
 packetData[12] = (pitchOut & 0b1000) >> 3;
 packetData[13] = (pitchOut & 0b0100) >> 2;
 packetData[14] = (pitchOut & 0b0010) >> 1;
 packetData[15] = (pitchOut & 0b0001);

 // Direction bit
 packetData[17] = pitch > 63;
 
  // yaw trim / yaw adjust (the little dial on the controller)
 // 6 bits
 packetData[18] = 0;
 packetData[19] = 1;
 packetData[20] = 0;
 packetData[21] = 1;
 packetData[22] = 1;
 packetData[23] = 1;

 if (channel == HAK_CHANNEL_A)
 {
   packetData[24] = 0;
   packetData[25] = 0;
 
 } else if (channel == HAK_CHANNEL_B)
 {
   packetData[24] = 1;
   packetData[25] = 0;
 
 } else {
   packetData[24] = 0;
   packetData[25] = 1;
 }
 
 // Compute checksum.
 int checksum = packetData[7] + 2*packetData[6] + 4*packetData[5] + 8*packetData[4] + 16*packetData[3] + 32*packetData[2] + 64*packetData[1] -68+ packetData[15] + 2*packetData[14] + 4*packetData[13] + 8*packetData[12] -15+ packetData[23] + 2*packetData[22] + 4*packetData[21] + 8*packetData[20] + 16*packetData[19] + 32*packetData[18] -10+ packetData[10] *32+ packetData[11]*16-48;
 
 packetData[26] = (checksum & 0b100000) >> 5;
 packetData[27] = (checksum & 0b010000) >> 4;
 packetData[28] = (checksum & 0b001000) >> 3;
 packetData[29] = (checksum & 0b000100) >> 2;
 packetData[30] = (checksum & 0b000010) >> 1;
 packetData[31] = (checksum & 0b000001);

 packetData[32] = 1;
 
 /*
  * Optional realtime display of packet data
  */
 bool displayPacketData = false;
 if (displayPacketData) {
   for (i=0; i<33; i++)
   {
     Serial.print(packetData[i]);
     if ((i+1)%4 == 0)
     {
       Serial.print(" ");
     }
   }
   Serial.println(" ");
 }

  
 // Send the packet by flashing the LEDs.
 for (i=-1; i<33; i++)
 {
   if (i < 0) {
       pulseNum = 130;
   } else {
       // a "0" bit is 13 pulses and a "1" bit is 28 pulses
       if (packetData[i] == 1)
       {
         pulseNum = 25;
       } else {
         pulseNum = 12;
       }
   }
 
   // flash pulseNum times
   // a "0" bit is 16 pulses and a "1" bit is 32 pulses
   while(pulseNum--)
   {
     digitalWrite(LED,LOW);
     delayMicroseconds(9);
     digitalWrite(LED,HIGH);
     delayMicroseconds(9);
   }
   // Delay between bits depends on if it was a 1 or a zero.
   // Total time is 1ms.

    if (i < 0) {
        delayMicroseconds(1000);
    } else {
       if (packetData[i] == 1) {
            delayMicroseconds(320);
        } else {
            delayMicroseconds(680);
        }
    }
 }

 // The delay value between the end of this packet and the next one.
 
 return(delayValue); // in milliseconds (ms)
 
}

 
/*
 * Function that does the actual work of converting commands into
 * IR LED pulses and changes the pins in the appropriate manner.
 */
byte sendPacket_Kingco(byte yaw, byte pitch, byte throttle)
{
 
 int packetData[100];
 int pulseNum;
 byte channelDelayValue;
 int i;

 digitalWrite(LED, HIGH);
 
 // throttle
 // 0 = zero throttle
 // 63 = full throttle
 // map from 0-127 to 0-63:
 int throttleOut = 63.0/127.0 * throttle;
 
 packetData[0] = (throttleOut & 0b0100000) >> 5;
 packetData[1] = (throttleOut & 0b0010000) >> 4;
 packetData[2] = (throttleOut & 0b0001000) >> 3;
 packetData[3] = (throttleOut & 0b0000100) >> 2;
 packetData[4] = (throttleOut & 0b0000010) >> 1;
 packetData[5] = (throttleOut & 0b0000001);


 // yaw
 // map 0-127 to 0-15
 // Max left is 7, minimum left is 0
 // Max right is 15, minimum right is 9
 // No yaw is 8
 int yawOut;
 if (yaw > 55 && yaw < 71) {
   yawOut = 0;
 } else if (yaw > 63) {
   yawOut = 15.0/127.0 * yaw;
 } else {
   yawOut = -7.0/55.0 * yaw + 7;
 }
 packetData[6] = (yawOut & 0b01000) >> 3;
 packetData[7] = (yawOut & 0b00100) >> 2;
 packetData[8] = (yawOut & 0b00010) >> 1;
 packetData[9] = (yawOut & 0b00001);

 int yawChecksum = packetData[9] + packetData[8]*2 + packetData[7]*4 + packetData[6]*8;

 // Bits 10 and 11 are always zero
 packetData[10] = 0;
 packetData[11] = 0;

 // Trim, we'll use always zero
 packetData[12] = 0;
 packetData[13] = 0;
 packetData[14] = 0;
 packetData[15] = 0;
 packetData[16] = 0;
 packetData[17] = 0;
 
 // pitch
 // Map 0-127 to 0-15
 // Values 1-7 are forward, 8-15 are reverse, 0 is no pitch
 int pitchOut;
 if (pitch < 71 && pitch > 55) {
   pitchOut = 0;
 } else if (pitch < 63) {
   // Backwards
   pitchOut = -7.0/55.0 * pitch + 15;
 } else {
   // Forwards
   pitchOut = 3.0/32.0 * pitch - 157.0/32.0;
 }
 packetData[18] = (pitchOut & 0b1000) >> 3;
 packetData[19] = (pitchOut & 0b0100) >> 2;
 packetData[20] = (pitchOut & 0b0010) >> 1;
 packetData[21] = (pitchOut & 0b0001);

 // Bits 22-27 are always 0
 packetData[22] = 0;
 packetData[23] = 0;
 packetData[24] = 0;
 packetData[25] = 0;
 packetData[26] = 0;
 packetData[27] = 0;


 if (channel == K_CHANNEL_A)
 {
   packetData[28] = 0;
   packetData[29] = 1;
   channelDelayValue = 119; // milliseconds
 
 } else if (channel == K_CHANNEL_B)
 {
   packetData[28] = 1;
   packetData[29] = 1;
   channelDelayValue = 89; // milliseconds
 
 } else {
   packetData[28] = 1;
   packetData[29] = 0;
   channelDelayValue = 89;
 }

 // Bits 30-31 are always 1
 packetData[30] = 1;
 packetData[31] = 1;

 //// TRIM IS ALWAYS 0
 //trim = 0;
 //int checksum = (253-64*trim - 4*packetData[29] - 8*packetData[28] - 4*packetData[5]-8*packetData[4]-16*packetData[3]-32*packetData[2]-64*packetData[1]-127*packetData[0] - 64*yawChecksum-4*pitchOut);

 //if (checksum < 0) {
    //int checksum2 = abs(checksum) % 255;
    //checksum = 255-checksum2;
 //}

 int channelVal = 2*packetData[28] + packetData[29];
 int forwardBackVal = 8*packetData[18] + 4*packetData[19] + 2*packetData[20] + packetData[21];
 int throttleVal = packetData[5] + 2*packetData[4] + 4*packetData[3] + 8*packetData[2] + 16*packetData[1] + 32*packetData[0];
 
 int checksum = 256-3*1-channelVal*4-4*forwardBackVal-64*packetData[17]-128*packetData[16]-packetData[15]-2*packetData[14]-4*packetData[13]-8*packetData[12]-64*packetData[9]-128*packetData[8]-packetData[7]-2*packetData[6]-4*throttleVal;

 if (checksum < 0) {
    int checksum2 = abs(checksum) % 256;
    checksum = 256-checksum2;
 }
 

 //int checksum = (253-64*trim - 4*packetData[29] - 8*packetData[28] - 4*packetData[5]-8*packetData[4]-16*packetData[3]-32*packetData[2]-64*packetData[1]-127*packetData[0]);

 packetData[32] = (checksum & 0b10000000) >> 7;
 packetData[33] = (checksum & 0b01000000) >> 6;
 packetData[34] = (checksum & 0b00100000) >> 5;
 packetData[35] = (checksum & 0b00010000) >> 4;
 packetData[36] = (checksum & 0b00001000) >> 3;
 packetData[37] = (checksum & 0b00000100) >> 2;
 packetData[38] = (checksum & 0b00000010) >> 1;
 packetData[39] = (checksum & 0b00000001);

 // Bits 40 and 41 are always zero
 packetData[40] = 0;
 packetData[41] = 0;
 
 /*
  * Optional realtime display of packet data
  */
 bool displayPacketData = false;
 if (displayPacketData) {
   for (i=0; i<42; i++)
   {
     Serial.print(packetData[i]);
     if ((i+1)%4 == 0)
     {
       Serial.print(" ");
     }
   }
   Serial.println(" ");
 }

 int shortDelay = 400; // microseconds
 int longDelay = 820;

 int smallNumPeaks = 15;
 int largeNumPeaks = 31;
 
 int delayAmount;
 int this_pair;
   
 // Send the packet by flashing the LEDs.
 for (i=-2; i<42; i+=2)
 {
   if (i < 0) {
       pulseNum = 60;
       delayAmount = shortDelay;
   } else {
       // Bits are sent in groups of two.
       this_pair = packetData[i]*2 + packetData[i+1];

       if (this_pair == 0) {
           pulseNum = smallNumPeaks;
           delayAmount = shortDelay; // microseconds
       } else if (this_pair == 1) {
           pulseNum = smallNumPeaks;
           delayAmount = longDelay;
       } else if (this_pair == 2) {
            pulseNum = largeNumPeaks;
           delayAmount = shortDelay;
       } else {
            pulseNum = largeNumPeaks;
           delayAmount = longDelay;
       }
   }

   // flash pulseNum times
   // a "0" bit is 16 pulses and a "1" bit is 32 pulses
   while(pulseNum--)
   {
     digitalWrite(LED,LOW);
     delayMicroseconds(9);
     digitalWrite(LED,HIGH);
     delayMicroseconds(8);
   }
   // Delay between bits depends on if it was a 1 or a zero.
   // Total time is 1ms.

    delayMicroseconds(delayAmount);
 }

 // The delay value between the end of this packet and the next one.
 
 return(channelDelayValue); // in milliseconds (ms)
 
}




/*
 * Function that does the actual work of converting commands into
 * IR LED pulses and changes the pins in the appropriate manner.
 */
byte sendPacket_Kingco_109tx(byte yaw, byte pitch, byte throttle)
{
   
   int packetData[100];
   int pulseNum;
   byte channelDelayValue;
   int i;
  
   digitalWrite(LED, HIGH);
   
   // throttle
   // 0 = zero throttle
   // 63 = full throttle
   // map from 0-127 to 0-90:
   int throttleOut = 90.0/127.0 * throttle;

   packetData[0] = (throttleOut & 0b1000000) >> 6;
   packetData[1] = (throttleOut & 0b0100000) >> 5;
   packetData[2] = (throttleOut & 0b0010000) >> 4;
   packetData[3] = (throttleOut & 0b0001000) >> 3;
   packetData[4] = (throttleOut & 0b0000100) >> 2;
   packetData[5] = (throttleOut & 0b0000010) >> 1;
   packetData[6] = (throttleOut & 0b0000001);

   // Bits 7, 8, 9, 10 are always zero
   packetData[7] = 0;
   packetData[8] = 0;
   packetData[9] = 0;
   packetData[10] = 0;
  
  // yaw
  // map 0-127 to 0-31
  //    Max left is 15, minimum left is 1
  //    Max right is 31, minimum right is 16?
  //    No yaw is 0
   int yawOut;
   if (yaw > 59 && yaw < 67) {
     yawOut = 0;
   } else if (yaw > 63) {
     yawOut = 1.0/4.0 * yaw -0.75; //5.0/21.0 * yaw + 16.0/21.0;
   } else {
     yawOut = -14.0/59.0 * yaw + 15; // -7.0/32.0 * yaw + 15;
   }
   packetData[11] = (yawOut & 0b10000) >> 4;
   packetData[12] = (yawOut & 0b01000) >> 3;
   packetData[13] = (yawOut & 0b00100) >> 2;
   packetData[14] = (yawOut & 0b00010) >> 1;
   packetData[15] = (yawOut & 0b00001);
  
   int yaw_val = packetData[15] + packetData[14]*2 + packetData[13]*4 + packetData[12]*8 + packetData[11]*16;
  

   // Bits 16-19 are forward/backwards
   // Map 0-127 to 0-15, but also use trim to get higher-resolution control.
   // Full trim is about 1 bit of change on main yaw.
   // Map 80% of trim to be the lower bits for yaw.
   int yawLowerBits = yaw % 4;
   
   // Values 8-15 are forward, 1-7 are reverse, 0 is no pitch
   //   Full backwards is 7, a little backwards is 1
   //   Full forwards is 15, a little forwards is 8
   int pitchOut;
   if (pitch < 67 && pitch > 59) {
     pitchOut = 0;
   } else if (pitch < 63) {
     // Backwards
     pitchOut = -6.0/55.0 * pitch + 7; //3.0/32.0 * pitch - 157.0/32.0;
   } else {
     // Forwards
     pitchOut = 7.0/60.0 * pitch + 11.0/60.0;
     if (pitchOut == 8) {
      pitchOut = 9; // 8 value does not spin the back prop
     }
   }
   packetData[16] = (pitchOut & 0b1000) >> 3;
   packetData[17] = (pitchOut & 0b0100) >> 2;
   packetData[18] = (pitchOut & 0b0010) >> 1;
   packetData[19] = (pitchOut & 0b0001);
  
   // Bits 20-23 are always zero
   packetData[20] = 0;
   packetData[21] = 0;
   packetData[22] = 0;
   packetData[23] = 0;

   // Bits 24 and 25 are the channel
   if (channel == K2_CHANNEL_A)
   {
     packetData[24] = 0;
     packetData[25] = 1;
     channelDelayValue = 136; // milliseconds
   
   } else if (channel == K2_CHANNEL_B)
   {
     packetData[24] = 1;
     packetData[25] = 1;

     // channel B sends a packet with a long delay, then a short delay, then a long, etc.
     if (tx109_channel_b_delay_state) {
       channelDelayValue = 158; // milliseconds
     } else {
       channelDelayValue = 96; // milliseconds
     }
     tx109_channel_b_delay_state = !tx109_channel_b_delay_state;
     
   
   } else {
     packetData[24] = 1;
     packetData[25] = 0;
     channelDelayValue = 188; // milliseconds
   }

  
  // Bits 26-31 are trim, the middle is 43
  int trimOut =  43;

  packetData[26] = (trimOut & 0b00100000) >> 5;
  packetData[27] = (trimOut & 0b00010000) >> 4;
  packetData[28] = (trimOut & 0b00001000) >> 3;
  packetData[29] = (trimOut & 0b00000100) >> 2;
  packetData[30] = (trimOut & 0b00000010) >> 1;
  packetData[31] = (trimOut & 0b00000001);
  


   // Bits 32-35 are always zero
   packetData[32] = 0;
   packetData[33] = 0;
   packetData[34] = 0;
   packetData[35] = 0;

   // Bits 36-39 are the checksum
  int nybbles[100];
  for (int i = 0; i < 10; i++) {
    nybbles[i] = (int(8*packetData[4*i] + 4*packetData[4*i+1] + 2*packetData[4*i+2] + packetData[4*i+3]));
  }

  int weights[8] = {1,1,4,4,1,1,1,1};

  int weighted_sum = 0;
  for (int i = 0; i < 8; i++) {
    weighted_sum += weights[i] * nybbles[i];
  }
  
  int carry = int((nybbles[0]+nybbles[4]+nybbles[7] + 4*nybbles[3]) / 16);
  int checksum =  (weighted_sum + carry) % 16;

   packetData[36] = (checksum & 0b00001000) >> 3;
   packetData[37] = (checksum & 0b00000100) >> 2;
   packetData[38] = (checksum & 0b00000010) >> 1;
   packetData[39] = (checksum & 0b00000001);

   // Bits 40-42 are always zero
   packetData[40] = 0;
   packetData[41] = 0;
   packetData[42] = 0;
   
   
   /*
    * Optional realtime display of packet data
    */
   bool displayPacketData = false;
   if (displayPacketData) {
     for (i=0; i<43; i++)
     {
       Serial.print(packetData[i]);
       if ((i+1)%4 == 0)
       {
         Serial.print(" ");
       }
     }
     //Serial.println(" ");
     //Serial.print(" -- checksum ");
     //Serial.println(checksum);
     Serial.print(" -- pitch ");
     Serial.print(pitchOut);
     Serial.print(" -- yaw ");
     Serial.print(yawOut);
     Serial.print(" -- yawLower ");
     Serial.print(yawLowerBits);
     Serial.print(" -- trim ");
     Serial.println(trimOut);
   }
  
   int shortDelay = 340;//330; //400; // microseconds
   int longDelay = 850;  //890;
  
   int smallNumPeaks = 13;
   int largeNumPeaks = 36;
   
   int delayAmount;
   int this_pair;
     
   // Send the packet by flashing the LEDs.
   for (i=-2; i<43; i+=2) // careful, we mess with _i_ when i == 0
   {
     if (i < 0) {
         pulseNum = 66;
         delayAmount = 0;
     } else if (i == 0) {
       // First bit is special.
       pulseNum = 0;
       if (packetData[0] == 0) {
         delayAmount = shortDelay;
       } else {
         delayAmount = longDelay;
       }
       // Offset the for loop by 1.
       i--;
     } else {
         // Bits are sent in groups of two.
         this_pair = packetData[i]*2 + packetData[i+1];
  
         if (this_pair == 0) {
             pulseNum = smallNumPeaks;
             delayAmount = shortDelay; // microseconds
         } else if (this_pair == 1) {
             pulseNum = smallNumPeaks;
             delayAmount = longDelay;
         } else if (this_pair == 2) {
              pulseNum = largeNumPeaks;
             delayAmount = shortDelay;
         } else {
              pulseNum = largeNumPeaks;
             delayAmount = longDelay;
         }
     }
  
     // flash pulseNum times
     // a "0" bit is 16 pulses and a "1" bit is 32 pulses
     while(pulseNum--)
     {
       digitalWrite(LED,LOW);
       delayMicroseconds(10);
       digitalWrite(LED,HIGH);
       delayMicroseconds(10);
     }
     // Delay between bits depends on if it was a 1 or a zero.
     // Total time is 1ms.
  
      delayMicroseconds(delayAmount);
   }
  
   // The delay value between the end of this packet and the next one.
   
   return(channelDelayValue); // in milliseconds (ms)
   
}










byte sendPacket(byte yaw, byte pitch, byte throttle)
{
  int throt_int = throttle;// + (analogRead(A0) / 60);  // includes trim addition
  
  if (throttle != 0) {  // kill command should actually kill it
    if (throt_int > 127) throttle = 127;  // throttle is a byte, so use the int to avoid overflow
    else if (throt_int < 0) throttle = 0;
    else throttle = throt_int;
  }
  
  if (channel == S107_CHANNEL_A || channel == S107_CHANNEL_B) {
    return sendPacket_S107G(yaw, pitch, throttle);
  } else if (channel == HAK_CHANNEL_A || channel == HAK_CHANNEL_B || channel == HAK_CHANNEL_C) {
    return sendPacket_Hak(yaw, pitch, throttle);
  } else if (channel == K_CHANNEL_A || channel == K_CHANNEL_B || channel == K_CHANNEL_C) {
    return sendPacket_Kingco(yaw, pitch, throttle);
  } else if (channel == K2_CHANNEL_A || channel == K2_CHANNEL_B || channel == K2_CHANNEL_C) {
    return sendPacket_Kingco_109tx(yaw, pitch, throttle);
  } else {
    Serial.print("\nUnknown channel value: ");
    Serial.print(channel);
    Serial.print(".  You need to set the \"channel\" variable.");
  }
}



void TestCopter() // Small function that tests the helicopters yaw, pitch and throttle at once
{
  yawCmd = 15;
  pitchCmd = 15;
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
  Serial.print("HoldingCommand running:\n\t---------------------------------------------------\n");
  Serial.print("\tYaw\tPitch\tThrottle\tTrim\tTime (ms)\n\t---------------------------------------------------\n\t");
  Serial.print(yawIn);
  Serial.print("\t");
  Serial.print(pitchIn);
  Serial.print("\t");
  Serial.print(throttleIn);
  Serial.print("\t\t");
  Serial.print((analogRead(A0) / 60));  // trim calculation
  Serial.print("\t");
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
    packetDelay = sendPacket(yawIn, pitchIn, throttleIn);
    
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
    delay(sendPacket(yawCmd,pitchCmd,throttleCmd));
    
    // check the button (we check for LOW since we've configured it to be pulled high)
    if (digitalRead(BUTTON_INPUT) == LOW) {
      ButtonPressed();
    }
}
