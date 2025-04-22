// src/App.js

import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, Button, Spinner } from 'react-bootstrap';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { UnControlled as CodeMirrorUncontrolled } from 'react-codemirror2';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/selection/active-line.js';
import { Split } from '@geoffcox/react-splitter';
import ErrorBoundary from './ErrorBoundary';
import { ResetAllButton } from "./ResetAllButton";

import stageoneLogo from './stageone-logo-orange.png';
import DroneInstructionsPDF from './Drone_Instructions_TEST.pdf';
import AdvancedDroneInstructionsPDF from './Advanced_Drone_Instructions_TEST.pdf';

import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/dialog/dialog';
import './App.css';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/search/matchesonscrollbar.css';
import 'codemirror/addon/search/matchesonscrollbar';




// … your existing imports …

// ─── Add this (or replace your old) right after your imports ───
const DRIVER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>USB/UART Drivers</title>
  <style>
    body { margin:0; font-family: 'Roboto', sans-serif; }
    .workshop-top-bar {
      width:100%; height:30px; background:#f05f40; color:#fff;
      display:flex; align-items:center; padding:0 8px; gap:6px;
      font-size:14px; font-weight:600;
    }
    .workshop-divider {
      width:1px; height:60%; background:currentColor; opacity:.65;
      margin:0 6px;
    }
    .workshop-subtitle { font-weight:300; }
    .workshop-logo-link {
      margin-left:auto; text-decoration:none; color:#fff;
      font-size:10px; font-weight:700;
    }
    body { padding:2rem; line-height:1.5; }
    h1 { color:#f05f40; margin-top:1rem; }
    h2 { color:#333; margin-top:1.5rem; }
    ol, ul { margin-top:0.5em; padding-left:1.2em; }
    li { margin-bottom:0.75em; }
    code { background:#eee; padding:0.1em 0.3em; border-radius:3px; }
    a { color:#0066cc; text-decoration:none; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <!-- ──────────── Header ──────────── -->
  <header>
    <div class="workshop-top-bar">
      <span class="workshop-title">Robotics&nbsp;Workshop</span>
      <span class="workshop-divider" aria-hidden="true"></span>
      <span class="workshop-subtitle">USB/UART Drivers</span>
      <a href="https://stageoneeducation.com/" target="_blank" rel="noopener noreferrer" class="workshop-logo-link">
        STAGE ONE EDUCATION
      </a>
    </div>
  </header>

  <!-- ───────── Page content ───────── -->
  <h1>Connected the ESP32 UART port to the laptop USB port.
</h1>
<hr/>
  <h2>Check if the Driver is Installed:</h2>
  <ol>
    <li>
      <strong>Open Device Manager:</strong>
      Press <code>Windows + X</code> and select “Device Manager” from the menu.
    </li>
    <li>
      <strong>Expand Ports (COM &amp; LPT):</strong>
      Click the ▶︎ next to “Ports (COM &amp; LPT).”
    </li>
    <li>
      <strong>Look for Silicon Labs:</strong>
      You should see “Silicon Labs CP210x USB to UART Bridge.” That confirms the driver is installed.
    </li>
    <li>
      <strong>If you don’t see it, install the driver manually</strong>
        </ol><hr/>

      <h2>Download the Driver:</h2>
<ol>
      <h3>Step 1: Download the CP210x Universal Windows Driver</h3>
      <ul>
        <li>Go to the Silicon Labs CP210x download page:
          <br/>
          <a href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers?tab=downloads"
             target="_blank"
             rel="noopener noreferrer">
            Download CP210x Driver ZIP
          </a>
        </li>
      </ul>
      <h3>Step 2: Extract the Driver ZIP</h3>
      <ul>
        <li>Locate the downloaded ZIP file in your Downloads folder.</li>
        <li>Right‑click it and choose “Extract All…”</li>
        <li>Pick a destination (e.g., Desktop) and extract.</li>
      </ul>
      <h3>Step 3: Install the CP210x Driver</h3>
      <ul>
        <li>Open Device Manager again and expand “Ports (COM & LPT).”</li>
        <li>If you see an “Unknown device” or no CP210x, right‑click and choose “Update driver.”</li>
        <li>Select “Browse my computer for driver software.”</li>
        <li>Navigate to the folder where you extracted the ZIP, click “Next,” and let Windows install.</li>
      </ul>
      <h3>Step 4: Verify Installation</h3>
      <ul>
        <li>Once installation completes, you should see “Silicon Labs CP210x USB to UART Bridge” under Ports.</li>
        <li>Restart your PC if prompted, then re‑open Device Manager to confirm.</li>
      </ul>
    </li>
  </ol><hr/>
</body>
</html>`;













function isInt(value) {
  return !isNaN(value) &&
         parseInt(Number(value)) == value &&
         !isNaN(parseInt(value, 10));
}

const firmwareVersionString = "Drone workshop firmware: v";

// Defines which lines in the BASE_CODE are editable
const getInitialEditableLines = () => ({
  1:   { value: 'const char* quadcopter_id = "";',    remove: ['const char* quadcopter_id = "', '";'],    valid: ['string'], removeSpaces: true },
  2:   { value: 'const char* light_pole_id = "";',     remove: ['const char* light_pole_id = "', '";'],     valid: ['string'], removeSpaces: true },
  3:   { value: 'const bool yellow_button_connected = false;', remove: ['const bool yellow_button_connected = ', ';'], valid: ['true','false'], removeSpaces: true },
  4:   { value: 'const bool slide_connected = false;',  remove: ['const bool slide_connected = ', ';'],       valid: ['true','false'], removeSpaces: true },
  5:   { value: 'const bool blue_button_connected = false;', remove: ['const bool blue_button_connected = ', ';'], valid: ['true','false'], removeSpaces: true },
  137: { value: 'bool baro_height_limit_enabled = true;',  remove: ['bool baro_height_limit_enabled = ', ';'],   valid: ['true','false'], removeSpaces: true },
  138: { value: 'int baro_max_height_allowed_cm = 300;',   remove: ['int baro_max_height_allowed_cm = ', ';'],    valid: ['integer'],       removeSpaces: true },
  361: { value: '    duty = 4;',                          remove: ['    duty = ', ';'],                        valid: ['integer'],       removeSpaces: true },
  842: { value: '    Serial.println("Stop/Yellow button pressed");', remove: ['    Serial.println("','");'], valid: ['string'], removeSpaces: false },
});

function App() {
  // Serial & UI state
  const [port, setPort] = useState(null);
  const [data, setData] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const readerRef = useRef(null);

  // CodeMirror state
  const [editableLines, setEditableLines] = useState(getInitialEditableLines());
  const [codeText, setCodeText] = useState(BASE_CODE);
  const [codeError, setCodeError] = useState('');
  const holdCommandRef = useRef(null);

  // Layout toggles
  const [showInstructions, setShowInstructions] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [autonomousCollapsed, setAutonomousCollapsed] = useState(true);

  // Load / save state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('droneWorkshopState');
    if (!saved) return;
    const parsed = JSON.parse(saved);
    // ignore if older than 1 day
    if (parsed.date && new Date(parsed.date) < Date.now() - 86400000) return;
    setAutoScroll(parsed.autoScroll);
    setEditableLines(parsed.editableLines);
    holdCommandRef.current?.setValue(parsed.holdCommandText || HOLDCOMMAND_CODE);
  }, []);

  useEffect(() => {
    localStorage.setItem('droneWorkshopState', JSON.stringify({
      autoScroll,
      editableLines,
      holdCommandText: holdCommandRef.current?.getValue(),
      date: new Date().toISOString(),
    }));
  }, [autoScroll, editableLines]);

  // Serial connection effect
  useEffect(() => {
    if (!port) return;
    let cancelled = false;
    (async () => {
      await port.open({ baudRate: 115200 });
      setIsConnected(true);
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      while (!cancelled) {
        const { value, done } = await reader.read();
        if (done) break;
        setData(d => [...d, value]);
        if (value.includes(firmwareVersionString)) setIsUploading(false);
      }
    })().catch(() => setIsConnected(false));
    return () => {
      cancelled = true;
      readerRef.current?.cancel();
      port.close();
    };
  }, [port]);

  // Recompute code text when editableLines change
  useEffect(() => {
    setCodeText(computeCode());
  }, [editableLines]);

  // Auto‑scroll effect
  const textareaRef = useRef(null);
  useEffect(() => {
    if (autoScroll && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [data, autoScroll]);

  // Handlers
  const handleConnect = async () => {
    const selected = await navigator.serial.requestPort();
    setPort(selected);
  };
  const handleSend = async () => {
    setIsUploading(true);
    const msg = getValuesForChip();
    if (!msg) return;
    const writer = port.writable.getWriter();
    await writer.write(new TextEncoder().encode(msg));
    writer.releaseLock();
  };
  const handleCheckboxChange = () => setAutoScroll(s => !s);

  // CodeMirror beforeChange helper
  const handleBeforeChange = (editor, data, value) => {
    const ln = data.from.line;
    if (data.text.length > 1) {
      data.cancel();
      return;
    }
    if (ln in editableLines) {
      setEditableLines(lines => ({
        ...lines,
        [ln]: { ...lines[ln], value: value.split('\n')[ln] }
      }));
    }
  };
  // Preserve scroll on change
  const handleEditorScroll = (editor) => {
    const { left, top } = editor.getScrollInfo();
    editor.scrollTo(left, top);
  };

  // Generate the updated code from BASE_CODE + edits
  function computeCode() {
    return BASE_CODE
      .split('\n')
      .map((line, idx) =>
        idx in editableLines ? editableLines[idx].value : line
      )
      .join('\n');
  }

  // Collect values + hold commands into the chip message
  function getValuesForChip() {
    // (Re‑use your existing parseHoldCommand logic here)
    return ''; // placeholder
  }

  if (!navigator.serial) {
    return <p>Your browser doesn’t support Web Serial API.</p>;
  }

  const serialButtonText = isConnected ? 'Connected ✅' : 'Connect to Serial';
  const serialButtonVariant = isConnected ? 'outline-secondary' : 'primary';



  
  return (
    <ErrorBoundary>
      {/* ──────────── Header ──────────── */}
      <header>
        <div className="workshop-top-bar">
          <span className="workshop-title">Robotics&nbsp;Workshop</span>
          <span className="workshop-divider" aria-hidden="true" />
          <span className="workshop-subtitle">Drone&nbsp;IDE</span>
          <a
            href="https://stageoneeducation.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="workshop-logo-link"
          >
            <span className="workshop-logo-text">
              STAGE ONE EDUCATION
            </span>
          </a>
        </div>
        <div className="workshop-link-bar">
          <div className="download-links">
            <button
              className="instructions-link"
              onClick={() => setShowInstructions(s => !s)}
            >
              {showInstructions ? 'Hide Instructions' : 'Instructions'}
            </button>
            <button
  type="button"
  className="instructions-link"
  onClick={e => {
    e.preventDefault();
    const w = window.open("", "_blank");
    w.document.write(DRIVER_HTML);
    w.document.close();
  }}
>
  USB/UART Drivers
</button>


            <a
              href="https://stageoneeducation.com/QuadWiFiPoleBTWebSerialv3.ino"
              download
            >
              Firmware
            </a>
            <a
  href="https://feedback.stageoneeducation.com/workshop-feedback/robotics-feedback-survey/"
  target="_blank"
  rel="noopener noreferrer"
>
  Feedback
</a>            <a href="#tools">Tools</a>
          </div>
        </div>
      </header>

      {/* ───────── Main content (fills viewport) ───────── */}
      <div style={{ height: 'calc(100vh - 50px)' }}>
        {showInstructions ? (
          // ─── 3‑pane: PDF | code | serial ───
          <Split style={{ height: '100%' }} initialPrimarySize="20vw">
            {/* ─── PDF pane with toggle switch ─── */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                overflow: 'auto'
              }}
            >
              <iframe
                src={isAdvanced ? AdvancedDroneInstructionsPDF : DroneInstructionsPDF}
                title="Drone Instructions"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
              {/* toggle switch box */}
             {/* …inside your PDF pane… */}
             <div className="pdf-toggle-container">
  <span style={{ fontSize: '0.7rem', marginRight: '0.5rem' }}>
    Advanced Mode
  </span>
  <Form.Check
    type="switch"
    id="advanced-toggle"
    checked={isAdvanced}
    onChange={() => setIsAdvanced(a => !a)}
    className="form-check mb-0"
    style={{ padding: 0 }}
  />
</div>


            </div>

            {/* ─── nested 2‑pane: code editor | serial ─── */}
            <Split
              style={{ height: '100%' }}
              initialPrimarySize={autonomousCollapsed ? '65vw' : '50vw'}
            >
              {/* ─── Code pane ─── */}
              <div style={{ height: '100%', overflow: 'auto' }}>
                <Container className="pb-3 pt-0">
                  <div className="workshop-action-bar">
                    <Button
                      onClick={handleConnect}
                      className="connect-small-btn"
                      disabled={isConnected}
                    >
                      {serialButtonText}
                    </Button>
                    <Button
                      onClick={handleSend}
                      className="small-btn"
                      disabled={!isConnected || isUploading}
                      variant={serialButtonVariant}
                    >
                      {isUploading && (
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-1"
                        />
                      )}
                      {isUploading ? 'Uploading…' : 'Upload'}
                    </Button>
                  </div>
                  <span
                    style={{
                      color: 'red',
                      fontSize: '125%',
                      fontFamily: 'monospace'
                    }}
                  >
                    <b>{codeError}</b>
                  </span>
                  <CodeMirror
                    value={codeText}
                    className="stageoneEdit"
                    options={{
                      mode: 'text/x-c++src',
                      viewportMargin: 50,
                      theme: 'idea',
                      lineNumbers: true,
                      lineWrapping: true,
                      styleActiveLine: { nonEmpty: true },
                      smartIndent: false,
                      enterMode: 'flat',
                      electricChars: false,
                      extraKeys: {
                        'Ctrl-F': 'findPersistent',
                        'Ctrl-G': 'findNext',
                        'Shift-Ctrl-G': 'findPrev',
                        Enter: () => {}
                      }
                    }}
                    onBeforeChange={handleBeforeChange}
                    onChange={editor => handleEditorScroll(editor)}
                  />
<hr />
{/* ─── Autonomous command bar ─── */}
<div className="autonomous-bar">
<span className="autonomous-label">Autonomous Flight Commands</span>

  <Button
    onClick={handleSend}
    className="small-btn"
    disabled={!isConnected || isUploading}
    variant={serialButtonVariant}
  >
    {isUploading && (
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className="me-1"
      />
    )}
    {isUploading ? 'Uploading…' : 'Upload'}
  </Button>
</div>


                  <CodeMirrorUncontrolled
                    value={HOLDCOMMAND_CODE}
                    editorDidMount={editor => {
                      holdCommandRef.current = editor;
                    }}
                    className="stageoneEdit"
                    options={{
                      mode: 'text/x-c++src',
                      viewportMargin: 50,
                      theme: 'idea',
                      lineNumbers: true,
                      lineWrapping: true,
                      styleActiveLine: { nonEmpty: true },
                      smartIndent: false,
                      enterMode: 'flat',
                      electricChars: false
                    }}
                    onChange={() => {}}
                  />
                </Container>
              </div>

              {/* ─── Serial Monitor pane ─── */}
              <div style={{ height: '100%', overflow: 'auto' }}>
                <Container className="py-3">
                  <h5>Serial Monitor:</h5>
                  <Form.Check
                    type="checkbox"
                    label="Autoscroll"
                    checked={autoScroll}
                    onChange={handleCheckboxChange}
                  />
                  <Form.Control
                    as="textarea"
                    value={data.join('')}
                    ref={textareaRef}
                    readOnly
                    style={{
                      fontFamily: 'monospace',
                      height: '85vh',
                      overflowY: 'scroll'
                    }}
                  />
                  <div style={{ textAlign: 'right', marginTop: '10px' }}>
                    <ResetAllButton callback={() => window.location.reload()} />
                  </div>
                </Container>
              </div>
            </Split>
          </Split>
        ) : (
          // ─── 2‑pane: code | serial ───
          <Split
            style={{ height: '100%' }}
            initialPrimarySize={autonomousCollapsed ? '85vw' : '70vw'}
          >
            {/* Code pane */}
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Container className="pb-3 pt-0">
                <div className="workshop-action-bar">
                  <Button
                    onClick={handleConnect}
                    className="connect-small-btn"
                    disabled={isConnected}
                  >
                    {serialButtonText}
                  </Button>
                  <Button
                    onClick={handleSend}
                    className="small-btn"
                    disabled={!isConnected || isUploading}
                    variant={serialButtonVariant}
                  >
                    {isUploading && (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                    )}
                    {isUploading ? 'Uploading…' : 'Upload'}
                  </Button>
                </div>
                <span
                  style={{
                    color: 'red',
                    fontSize: '125%',
                    fontFamily: 'monospace'
                  }}
                >
                  <b>{codeError}</b>
                </span>
                <CodeMirror
                  value={codeText}
                  className="stageoneEdit"
                  options={{
                    mode: 'text/x-c++src',
                    viewportMargin: 50,
                    theme: 'idea',
                    lineNumbers: true,
                    lineWrapping: true,
                    styleActiveLine: { nonEmpty: true },
                    smartIndent: false,
                    enterMode: 'flat',
                    electricChars: false,
                    extraKeys: {
                      'Ctrl-F': 'findPersistent',
                      'Ctrl-G': 'findNext',
                      'Shift-Ctrl-G': 'findPrev',
                      Enter: () => {}
                    }
                  }}
                  onBeforeChange={handleBeforeChange}
                  onChange={editor => handleEditorScroll(editor)}
                />
               <hr />
{/* ─── Autonomous command bar ─── */}
<div className="autonomous-bar">
<span className="autonomous-label">Autonomous Flight Commands</span>

  <Button
    onClick={handleSend}
    className="small-btn"
    disabled={!isConnected || isUploading}
    variant={serialButtonVariant}
  >
    {isUploading && (
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className="me-1"
      />
    )}
    {isUploading ? 'Uploading…' : 'Upload'}
  </Button>
</div>

                <CodeMirrorUncontrolled
                  value={HOLDCOMMAND_CODE}
                  editorDidMount={editor => {
                    holdCommandRef.current = editor;
                  }}
                  className="stageoneEdit"
                  options={{
                    mode: 'text/x-c++src',
                    viewportMargin: 50,
                    theme: 'idea',
                    lineNumbers: true,
                    lineWrapping: true,
                    styleActiveLine: { nonEmpty: true },
                    smartIndent: false,
                    enterMode: 'flat',
                    electricChars: false
                  }}
                  onChange={() => {}}
                />
              </Container>
            </div>

            {/* Serial Monitor pane */}
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Container className="py-3">
                <h5>Serial Monitor:</h5>
                <Form.Check
                  type="checkbox"
                  label="Autoscroll"
                  checked={autoScroll}
                  onChange={handleCheckboxChange}
                />
                <Form.Control
                  as="textarea"
                  value={data.join('')}
                  ref={textareaRef}
                  readOnly
                  style={{
                    fontFamily: 'monospace',
                    height: '85vh',
                    overflowY: 'scroll'
                  }}
                />
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <ResetAllButton callback={() => window.location.reload()} />
                </div>
              </Container>
            </div>
          </Split>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;


const HOLDCOMMAND_CODE = `
// holdCommand(left/right, forward/back, throttle/speed, rotation, time-ms, neopixel color);
//
// all values (except time) are in range 0 to 100, higher is right/forward/faster
//
// Colors are:
//   white, red, green, blue, yellow, orange, purple
//
holdCommand(50, 50, 55, 50, 500, "blue");  // straight up 0.5 sec
holdCommand(50, 50, 55, 100, 750, "purple"); // spin in place 0.75 sec
holdCommand(50, 50, 55, 0, 750, "orange");   // spin in place the other way 0.75 sec
`

const BASE_CODE = `
const char* quadcopter_id = "";
const char* light_pole_id = "";
const bool yellow_button_connected = false;
const bool slide_connected = false;
const bool blue_button_connected = false;


// Include files (you can ignore these)
// --------------------------------------
#include "FastIMU.h"
#include <Adafruit_NeoPixel.h>
#include <WiFi.h> // Include the WiFi library
#include <WiFiUdp.h>
#include "driver/ledc.h"
#include <NimBLEDevice.h> // Bluetooth low-energy library
// --------------------------------------


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
  // holdCommand(50, 50, 55, 50, 500, "blue");  // straight up 0.5 sec
  // holdCommand(50, 50, 55, 100, 750, "purple"); // spin in place 0.75 sec
  // holdCommand(50, 50, 55, 0, 750, "orange");   // spin in place the other way 0.75 sec

  // <<< holdCommand filled in here >>> //
}


// IO pins

#define GREEN_BUTTON_PIN 4  // take-off/gyro-reset button (base circuit)
#define GREEN_LED_PIN_BASE 5  // take-off indicator (base circuit)
#define GREEN_LED_PIN_REMOTE 11  // take-off indicator (remote)

#define YELLOW_BUTTON_PIN_BASE 6  // stop button (base circuit)
#define YELLOW_BUTTON_PIN_REMOTE 10  // stop button (remote)
#define WHITE_LED_PIN_BASE 7  // stop indicator (base circuit)
#define WHITE_LED_PIN_REMOTE 14  // stop indicator (remote)

#define BLUE_BUTTON_PIN 17  // autonomous button (base circuit)
#define BLUE_LED_PIN 16  // autonomous indicator (base circuit)

#define ALTITUDE_SLIDER_PIN 15  // throttle slider, purple wire (base circuit)

#define IMU_SDA_PIN 13  // accelerometer/gyro SDA data pin (remote)
#define IMU_SCL_PIN 12  // accelerometer/gyro SCL data pin (remote)

// Define the GPIO pin and PWM properties
#define LEDC_MODE LEDC_LOW_SPEED_MODE // High-speed mode
#define LEDC_FREQUENCY 5000          // Frequency in Hz
#define LEDC_RESOLUTION LEDC_TIMER_13_BIT // 13-bit resolution

static BLEUUID serviceUUID("0000fff0-0000-1000-8000-00805f9b34fb");
static BLEUUID charUUID("0000fff3-0000-1000-8000-00805f9b34fb");
static BLEAddress bleAddress(light_pole_id);
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

int NUM_PIXELS = 50;

int NUM_LEDS = sizeof(LED_TIMER_MAPPING) / sizeof(LED_TIMER_MAPPING[0]);
bool HIGH_SPEED_MODE = true; // if we should be in "L" or "H" mode
bool last_green_button = false;

#define NEOPIX_PIN 38  // pin 18 built-in NeoPixel AND light bar
Adafruit_NeoPixel pixel(200, NEOPIX_PIN, NEO_GRB + NEO_KHZ800);

// Accelerometer/gyro setup
#define IMU_ADDRESS 0x68  // set IMU address
MPU6050 IMU;  // define a variable to reference the accelerometer/gyro
calData calib = { 0 };  // define default calibration data
AccelData accelData;  // accel sensor data
GyroData gyroData;  // gyro sensor data

// Define the server IP and port to send data
const char * udpAddress = "192.168.0.1";
const int udpPort = 40000;
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
int baro_max_height_throttle_at_limit = 45;
bool first_udp_packet = true;
bool g_in_flight = false;

//quadrotor Comms setup
#define init_packet_String "63630100000000"
#define idle_packet_String "63630a00000b0066808080808080800c8c99"
#define take_off_packet_String "63630a00000b0066808080808080801c9c99"
#define landing_packet_String "63630a00000b0066808080808080802cac99"
#define stopped_packet_String "63630a00000b0066808080808080804ccc99"

// Function to set the neopixel color
void setNeoPixel(int r, int g, int b, bool alsoSetPole = true) {
  for (int i=0; i<100; i++) {
    pixel.setPixelColor(i, r, g, b, 0);
  }
  pixel.show();
  if (connectedBT && alsoSetPole) {
    setBluetoothPoleColor(r, g, b);
  }
}

// Function to set all lights to "stopped" state
void lightsStopped() {  
  setLed(GREEN_LED_PIN_BASE, LOW);
  setLed(GREEN_LED_PIN_REMOTE, LOW);
  setLed(WHITE_LED_PIN_BASE, HIGH);
  setLed(WHITE_LED_PIN_REMOTE, HIGH);
  setLed(BLUE_LED_PIN, LOW);
  setNeoPixel(0, 0, 0); // off
}

// Function to set all lights to "go" state
void lightsGo() {
  setLed(GREEN_LED_PIN_BASE, HIGH);
  setLed(GREEN_LED_PIN_REMOTE, HIGH);
  setLed(WHITE_LED_PIN_BASE, LOW);
  setLed(WHITE_LED_PIN_REMOTE, LOW);
  setNeoPixel(0, 255, 0); // green
}

// Function to set all lights to "autonomous" state
void lightsAutonomous() {
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
  Serial.println("Blue/Autonomous Button Pressed");
  lightsAutonomous();
  
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

// Executes the various serial-command routines for colors and testing wiring
void serialInput(char in_val) {
  switch (in_val) {
    case 'w':
      setNeoPixel(255, 255, 255); // white
      break;
    case 'r':
      setNeoPixel(255, 0, 0); // red
      break;
    case 'g':
      setNeoPixel(0, 255, 0); // green
      break;
    case 'b':
      setNeoPixel(0, 0, 255); // blue
      break;
    case 'y':
      setNeoPixel(255, 255, 0); // yellow
      break;
    case 'o':
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
  Serial.printf("holdCommand x:%3d, y:%3d, throttle:%3d, rotate:%3d, time-ms:%4d (100-center)\n", lr, fb, ud, ro, mill);

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
    duty = 400;
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
      setBluetoothPoleNumPixels((int)map(altitude, 50, 210, 10, 96));
    }
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
      forward_back = 127;  // no pitch
    }
    float roll = atan2(accY, accZ) * 180 / M_PI;
    // Build in a "deadzone" for a more stable center with the accelerometer values
    if (roll > acc_dead_zone || roll < -1 * acc_dead_zone ) {
      left_right = map(constrain(roll, -90, 90), -90, 90, 255, 0);
    } else {
      left_right = 127;  // no roll
    }
  
    // Calculate if a rotation is requested by user jolt of z-gyro, filter out noise and tilts
    go_rotate = 127;  // default to no rotation
    if (turning == 0) {  // listen for turn if not already mid-turn
      if ((left_right == 127) && (forward_back == 127)) {  // only consider rotation in the tilt deadzone
        recent_gyro[packet_counter%4] = (int) gyroData.gyroZ;
        int gyro_tot = 0;
        for (int i=0; i<4; i++) {
          gyro_tot += recent_gyro[i];
        }
        // only actually turn if there was a jolt left/right in the past 4 cycles
        if (gyro_tot > gyro_threshold) {
          turning = 4;  // left
          for (int i=0; i<4; i++) {
            recent_gyro[i] = 0;  // clear recent buffer
          }
        } else if (gyro_tot < -1*gyro_threshold) {
          turning = -4;  //right
          for (int i=0; i<4; i++) {
            recent_gyro[i] = 0;  // clear recent buffer
          }
        }
      }
    } else {  // if turning
      if (turning > 0) {  //left
        go_rotate = 0;
        turning--;
      } else {  // right
        go_rotate = 255;
        turning++;
      }
    }
  } else {  // if accelerometer failed / is disconnected, use safe default values*/
    left_right = 127;
    forward_back = 127;
    go_rotate = 127;
  }

  // display current inputs being fed into the packet computations
  if (packet_counter % 20 == 0 && connected) {
    if (acc_status < 0)  Serial.print("No accelerometer. ");  // Check accelerometer status
    if (slide_connected == 0)  Serial.print("No throttle. ");  // Check throttle variable at line 2
    Serial.printf("%4d: Pitch: %3d Roll: %3d, Yaw:%3d, Altitude: %3d\n", packet_counter, forward_back, left_right, go_rotate, altitude);
  }

  // put an idle packet in there to set the length
  char tmpHexStr[] = "63630a00000b0066808080808080800c8c99";
  
  if (take_off > 0) { // takeoff sequence in progress
    sendPacket(take_off_packet_String);
    take_off--;
  } else {
    compute_packet(left_right, forward_back, altitude, go_rotate, tmpHexStr);
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

void setBluetoothPoleNumPixels(int num_pixels_in) {
  if (NUM_PIXELS != num_pixels_in) {
    uint8_t command[9] = {0x7e, 0x07, 0x21, num_pixels_in, 0x00, 0x00, 0xFF, 0x00, 0xEF};
    pRemoteCharacteristic->writeValue(command, sizeof(command), true);
    NUM_PIXELS = num_pixels_in;
  }
}

void setBluetoothPoleColor(uint8_t red, uint8_t green, uint8_t blue) {
    // setBluetoothPoleNumPixels(num_pixels_in);
    uint8_t command[9] = {126, 0, 5, 3, red, green, blue, 0, 239};  // Equivalent of 0x7E and 0xEF in decimal
    // uint8_t command[9] = {0x7e, 0x07, 0x21, 20, red, green, blue, 0x00, 0xEF};
    pRemoteCharacteristic->writeValue(command, sizeof(command), false);
    // setBluetoothPoleColorSegment(100, 255, 0, 0);
}

void setBluetoothPoleColorSegment(uint8_t segment, uint8_t red, uint8_t green, uint8_t blue) {
    uint8_t command[10] = {126, 0, 6, 4, segment, red, green, blue, 0, 239};  // Including segment information
    pRemoteCharacteristic->writeValue(command, sizeof(command), false);
}

void setBluetoothPoleHalfOn(uint8_t red, uint8_t green, uint8_t blue, uint8_t totalSegments) {
    uint8_t halfSegments = totalSegments / 2;

    // Set the top half to the desired color
    for (uint8_t i = 0; i < halfSegments; i++) {
        setBluetoothPoleColorSegment(i, red, green, blue);
    }

    // Set the bottom half to off
    for (uint8_t i = halfSegments; i < totalSegments; i++) {
        setBluetoothPoleColorSegment(i, 0, 0, 0);  // Assuming 0, 0, 0 turns the segment off
    }
}



// Initial program run when microcontroller boots up
void setup() {
  Serial.begin(115200);  // serial monitor setup
  
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

  pixel.setBrightness(5);  // turn down brightness
  pixel.begin();  // initialize NeoPixel
  lightsStopped();  // function to set all led lights to "stopped" state

  //Connect to the WiFi network
  if (quadcopter_id != "") {
    char network_name[18];
    strcpy(network_name, "udirc-WiFi-");
    strcat(network_name, quadcopter_id);
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

void loop() {
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

  // Read serial input
  if (Serial.available()) {
    char in_char = (char)Serial.read();  // get the new byte:
    switch (in_char) {
      case '\0':
      case '\r\n':
      case '\n':
        break;  // these are the "enter" key, ignore
      case 'v':
      case 's':
      case 'w':
      case 'r':
      case 'g':
      case 'b':
      case 'y':
      case 'o':
      case 'p':
        serialInput(in_char);
        break;
      default:
        Serial.printf("Invalid input '%c'. Please enter a valid input.\n", in_char);
        break;
    }
  }

  // Read the altitude slider and the accelerometer and send flight commmands
  doManualFlightUpdate();
}


//void sendBluetoothToLightPole(char color) {
//  uint8_t command[9];
//  switch (color) {
//    case 'r':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0xFF; // Red
//      command[5] = 0x00;
//      command[6] = 0x00;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to red");
//      break;
//    case 'b':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0x00;
//      command[5] = 0x00;
//      command[6] = 0xFF; // Blue
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to blue");
//      break;
//    case 'g':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0x00;
//      command[5] = 0xFF; // Green
//      command[6] = 0x00;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to green");
//      break;
//    case 'y':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0xFF; // Yellow
//      command[5] = 0xFF;
//      command[6] = 0x00;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to yellow");
//      break;
//    case 'c':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0x00;
//      command[5] = 0xFF; // Cyan
//      command[6] = 0xFF;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to cyan");
//      break;
//    case 'm':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0xFF; // Magenta
//      command[5] = 0x00;
//      command[6] = 0xFF;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to magenta");
//      break;
//    case 'w':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0xFF; // White
//      command[5] = 0xFF;
//      command[6] = 0xFF;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Changed to white");
//      break;
//    case 'o':
//      command[0] = 0x7E;
//      command[1] = 0x00;
//      command[2] = 0x05;
//      command[3] = 0x03;
//      command[4] = 0x00; // Off
//      command[5] = 0x00;
//      command[6] = 0x00;
//      command[7] = 0x00;
//      command[8] = 0xEF;
//      pRemoteCharacteristic->writeValue(command, sizeof(command), true);
//      Serial.println("Turned off");
//      break;
//    default:
//      //Serial.println("Invalid input");
//      break;
//  }
//}


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
    Serial.println("Stop/Yellow button pressed");
    stopPressed();
  }
  if (stopped) {
    packetString = stopped_packet_String;
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
  hexStringToBytes(packetString, packet, byteLen);

  // Send the packet
  udp.beginPacket(udpAddress, udpPort);
  udp.write(packet, sizeof(packet));
  udp.endPacket();

  if (packet_counter % 20 == 1) {
    sendPacket(init_packet_String);
  }
}

void connectToWiFi(const char * ssid, const char * pwd) {
  Serial.println("Connecting to WiFi network: " + String(ssid));

  // delete old config
  WiFi.disconnect(true);
  //register event handler
  WiFi.onEvent(WiFiEvent);
  //Initiate connection
  WiFi.begin(ssid);
  Serial.println("Waiting for WIFI connection...");

}

//wifi event handler
void WiFiEvent(WiFiEvent_t event) {
  switch (event) {
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
      //When connected set
      Serial.print("\nWiFi connected! IP address: ");
      Serial.println(WiFi.localIP());
      //initializes the UDP state and transfer buffer
      udp.begin(WiFi.localIP(), udpPort);
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
int compute_checksum(int moveleftright, int forwardback, int updown, int rotate) {
  int weighted_sum = moveleftright + forwardback + updown + rotate;

  int add_val = 132;
  int val_mod = 0;
  if (HIGH_SPEED_MODE) {
    add_val = 124;
    val_mod = 16;
  }
  
  int mod = (weighted_sum + add_val) / 4 % 4;
  int val;

  switch (mod) {
    case 3:
      val = -8+val_mod;
      break;
    case 2:
      val = 0;
      break;
    case 1:
      val = 8;
      break;
    case 0:
      val = -16+val_mod;
      break;
  }

  int out = (weighted_sum + 132) % 256 + val;

  if (out < 0) {
    out += 256;
  } else if (out > 256) {
    out -= 256;
  }
  return out;
}

// Function to compute the packet
void compute_packet(int moveleftright, int forwardback, int updown, int rotate, char *hexstr) {
  moveleftright = limit_val(moveleftright);
  forwardback = limit_val(forwardback);
  updown = limit_val(updown);
  rotate = limit_val(rotate);

  // hexStr must have been declared to be the length of 36

  // Append moveleftright, forwardback, updown, rotate to the hex string
  if (!HIGH_SPEED_MODE) {
    sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x8080800c", moveleftright, forwardback, updown, rotate);
  } else {
    sprintf(hexstr, "63630a00000b0066%02x%02x%02x%02x80808004", moveleftright, forwardback, updown, rotate);
  }

  // Compute checksum
  int checksum_val = compute_checksum(moveleftright, forwardback, updown, rotate);

  // Append checksum to the hex string
  sprintf(hexstr + 32, "%02x99", checksum_val);
}
`