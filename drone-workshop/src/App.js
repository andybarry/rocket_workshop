import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { Controlled as CodeMirror } from 'react-codemirror2'
import { UnControlled as CodeMirrorUncontrolled } from 'react-codemirror2'
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/selection/active-line.js';
import { Split } from '@geoffcox/react-splitter';
import ErrorBoundary from './ErrorBoundary';
import { ResetAllButton } from "./ResetAllButton";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import DroneInstructionsPDF from './Drone_Instructions.pdf';
import AdvancedDroneInstructionsPDF from './Advanced_Drone_Instructions.pdf';


// Import search-related addons
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import 'codemirror/addon/dialog/dialog.css';
import 'codemirror/addon/dialog/dialog';

import './App.css';

// Add keymap for search
import 'codemirror/keymap/sublime';
import 'codemirror/addon/search/matchesonscrollbar.css';
import 'codemirror/addon/search/matchesonscrollbar';

function isInt(value) {
  return !isNaN(value) &&
    parseInt(Number(value)) == value &&
    !isNaN(parseInt(value, 10));
}

const firmwareVersionString = "Drone workshop firmware: v"

const getInitialEditableLines = () => {
  let initialLines = {
    1: {
      'value': 'const char* quadcopter_id = "";', //DE6684
      'remove': ['const char* quadcopter_id = "', '";'],
      'valid': ['string'],
      'removeSpaces': true,
      'chipIndex': 0,
      'version': 0,
    },
    2: {
      'value': 'const bool yellow_button_connected = false;',
      'remove': ['const bool yellow_button_connected = ', ';'],
      'valid': ['true', 'false'],
      'removeSpaces': true,
      'chipIndex': 2,
      'version': 0,
    },
    3: {
      'value': 'const bool slide_connected = false;',
      'remove': ['const bool slide_connected = ', ';'],
      'valid': ['true', 'false'],
      'removeSpaces': true,
      'chipIndex': 3,
      'version': 0,
    },
    4: {
      'value': 'const bool blue_button_connected = false;',
      'remove': ['const bool blue_button_connected = ', ';'],
      'valid': ['true', 'false'],
      'removeSpaces': true,
      'chipIndex': 4,
      'version': 0,
    },
    17: {
      'value': 'const char* light_pole_id = "";', // be:16:e0:00:3a:ec  be:16:c8:00:0db:ec
      'remove': ['const char* light_pole_id = "', '";'],
      'valid': ['string'],
      'removeSpaces': true,
      'chipIndex': 1,
      'version': 0,
    },
    137: {
      'value': 'bool baro_height_limit_enabled = false;',
      'remove': ['bool baro_height_limit_enabled = ', ';'],
      'valid': ['true', 'false'],
      'removeSpaces': true,
      'chipIndex': 5,
      'version': 0,
    },
    138: {
      'value': 'int baro_max_height_allowed_cm = 150;',
      'remove': ['int baro_max_height_allowed_cm = ', ';'],
      'valid': ['integer'],
      'removeSpaces': true,
      'chipIndex': 6,
      'version': 0,
    },
    139: {
      'value': 'int baro_max_height_throttle_at_limit = 100;',
      'remove': ['int baro_max_height_throttle_at_limit = ', ';'],
      'valid': ['integer'],
      'removeSpaces': true,
      'chipIndex': 9,
      'version': 4.1,
    },
    361: {
      'value': '    duty = 4;',
      'remove': ['    duty = ', ';'],
      'valid': ['integer'],
      'removeSpaces': true,
      'chipIndex': 7,
      'version': 0,
    },
    842: {
      'value': '    Serial.println("Stop/Yellow button pressed");',
      'remove': ['    Serial.println("', '");'],
      'valid': ['string'],
      'removeSpaces': false,
      'chipIndex': 8,
      'version': 0,
    },
  }

  return initialLines
}

// SerialMonitor component
const SerialMonitor = ({
  data,
  autoScroll,
  onAutoScrollChange,
  onClear,
  height = '85vh',
  title = "Serial Monitor"
}) => {
  const localTextareaRef = useRef(null);

  // Handle autoscrolling within the component
  useEffect(() => {
    if (autoScroll && localTextareaRef.current) {
      localTextareaRef.current.scrollTop = localTextareaRef.current.scrollHeight;
    }
  }, [data, autoScroll]);

  return (
    <>
      <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
        <div style={{ flex: '0 1 auto' }}>
          <h5>{title}</h5>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Form.Check
              type="checkbox"
              label="Autoscroll"
              id="autoscroll-checkbox"
              checked={autoScroll}
              onChange={onAutoScrollChange}
            />
            <Button
              variant="outline-primary"
              onClick={onClear}
              size="sm"
              style={{ color: '#f05f40', borderColor: '#f05f40', backgroundColor: 'transparent' }}
              className="orange-btn"
            >
              Clear
            </Button>
          </div>
        </div>

        <div style={{ flex: '1 1 auto' }}>
          <Form.Control
            as="textarea"
            value={data.join('')}
            ref={localTextareaRef}
            readOnly
            style={{
              fontFamily: 'monospace',
              fontSize: '80%',
              height: height,
              overflowY: 'scroll',
              marginBottom: '0.5rem'
            }}
          />
        </div>
      </div>
    </>
  );
};

function App() {
  const [port, setPort] = useState(null);
  const [outputValue, setOutputValue] = useState('');
  const [data, setData] = useState([]);
  const [isSupported, setIsSupported] = useState(true);
  const readerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [firmwareVersion, setFirmwareVersion] = useState(0);

  const [codeText, setCodeText] = React.useState(BASE_CODE);
  const [codeError, setCodeError] = React.useState('');
  const [codeMirrorHeight, setCodeMirrorHeight] = useState('88vh');
  const [showAutonomous, setShowAutonomous] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const [editableLines, setEditableLines] = useState(getInitialEditableLines());


  const holdCommandRef = useRef(null);

  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [droneTestingString, setDroneTestingString] = useState("");
  const passwordInputRef = useRef(null);

  const LOCAL_STORAGE_VERSION = "1.0"

  // Effect to load data from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('droneWorkshopState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.date && new Date(parsedState.date) < new Date() - 1000 * 3600 * 24) {
        // Ignore state older than 1 day
        return;
      }
      if (!parsedState.version || parsedState.version != LOCAL_STORAGE_VERSION) {
        // older version
        return;
      }
      setAutoScroll(parsedState.autoScroll ?? true);

      const init_lines = getInitialEditableLines()
      if (parsedState.editableLines) {
        
        const len_initial_lines = Object.keys(init_lines).length
        const len_storage_lines = Object.keys(parsedState.editableLines).length

        if (len_initial_lines != len_storage_lines) {
          setEditableLines(init_lines);
        } else {
          setEditableLines(parsedState.editableLines);
        }
      } else {
        setEditableLines(init_lines);
      }
      holdCommandRef.current.setValue(parsedState.holdCommandText || HOLDCOMMAND_CODE);
    }
  }, []);

  const getCodeLineOrder = () => {
    let out = []
    let out2 = []
    console.log("editableLines", editableLines)
    for (let val in editableLines) {
      out.push([editableLines[val]['chipIndex'], val])
    }
    for (let val of out.sort((a, b) => a[0] - b[0])) {
      out2.push(val[1])
    }
    console.log(out2)
    return out2
  }

  useEffect(() => {
    const adjustCodeMirrorHeight = () => {
      const windowHeight = window.innerHeight;
      let elementPosition = document.getElementById('codeMirror1')?.getBoundingClientRect();
      if (!elementPosition) return;

      const padding = 30;

      let elementHeight = windowHeight - elementPosition.top - padding;

      if (showAutonomous) {
        let autonomousTitle = document.getElementById('autonomousDiv')?.getBoundingClientRect();
        if (!autonomousTitle) return;
        // Get the height of the autonomous title
        const autonomousHeight = autonomousTitle.height;

        // Recompute the element height with 2 code mirrors and the title
        const heightAvilable = windowHeight - elementPosition.top - padding - autonomousHeight;
        elementHeight = heightAvilable / 2;
      }
      let codemirrorSize = `${elementHeight}px`;
      setCodeMirrorHeight(codemirrorSize);
    };

    // Adjust on mount
    adjustCodeMirrorHeight();

    // Adjust on resize
    window.addEventListener('resize', adjustCodeMirrorHeight);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', adjustCodeMirrorHeight);
    };
  }, [codeMirrorHeight, showAutonomous]);

  useEffect(() => {
    const element = document.querySelector('.CodeMirror');

    if (element) {
      const currentStyle = element.getAttribute('style') || '';
      const minHeightRule = `min-height: ${codeMirrorHeight} !important`;

      // Remove any existing min-height rule and trim excess semicolons
      let cleanedStyle = currentStyle
        .replace(/min-height:[^;]*;?/gi, '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean) // Remove empty strings
        .join('; ');

      // Append new min-height rule correctly
      const newStyle = cleanedStyle
        ? `${cleanedStyle}; ${minHeightRule};`
        : `${minHeightRule};`;

      element.setAttribute('style', newStyle);
    }
  }, [codeMirrorHeight]);


  // Effect to save state to localStorage whenever any state changes
  useEffect(() => {
    saveState();
  }, [autoScroll, editableLines]);

  const saveState = () => {
    const stateToSave = {
      autoScroll,
      editableLines,
      holdCommandText: holdCommandRef.current.getValue(),
      date: new Date().toISOString(),
      version: LOCAL_STORAGE_VERSION,
    };
    localStorage.setItem('droneWorkshopState', JSON.stringify(stateToSave));
  }

  useEffect(() => {

    const checkSerialSupport = () => {
      if ('serial' in navigator) {
        setIsSupported(true);
        setConnectionError('');
      } else {
        setIsSupported(false);
      }
    };

    const connectToSerial = async () => {
      if (!port) return;

      try {
        await port.open({ baudRate: 115200 }).catch(e => console.log(e.message));
        setIsConnected(true);

        // Send a blank message to the serial port to trigger the firmware to send its version
        setTimeout(handleSend, 100);

        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;

        reader.closed.then(() => {
          setIsConnected(false);
          setConnectionError('Serial connection closed');
        }).catch(error => {
          let extraMessage = "";
          if (error.message.includes("Buffer overrun")) {
            extraMessage = " (try refreshing the page)";
          }
          setConnectionError(`Error: ${error.message} ${extraMessage}`);
          setIsConnected(false)
        });

        try {
          let last_line = 0
          while (true) {
            let value = null
            let done = null
            let out = null
            try {
              out = await reader.read()//.catch(e => console.log(e.message));
            } catch (error) {
              setIsConnected(false)
            }
            value = out['value']
            done = out['done']
            if (done) {
              break;
            }

            setData((prevData) => {
              const newData = [...prevData, value];

              // Join the array into a string, then split by newline, take the last 5 elements, and join them again
              const lines = newData.join('').split('\n')
              const num_new_lines = lines.length - last_line + 1;
              let recentLines = []
              if (num_new_lines > 0) {
                recentLines = lines.slice(-num_new_lines)
              }

              last_line = lines.length;


              // Check for the upload string and drone test completion
              for (let line of recentLines) {
                if (line.includes(firmwareVersionString)) {
                  const version_num = parseFloat(line.replace(firmwareVersionString, ''))
                  setFirmwareVersion(version_num)
                  setIsUploading(false);
                }
                if (line.includes("Done testing all drones")) {
                  setDroneTestingString("");
                }
              }

              return newData;
            });
          }
        } catch (error) {
          setConnectionError(`Error reading from serial port: ${error.message}`);
          setIsConnected(false)
        }
      } catch (error) {
        setConnectionError(`Error connecting to serial port: ${error.message}`);
        setIsConnected(false)
      }
    };

    checkSerialSupport();
    connectToSerial();

    return () => {
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => { });
        readerRef.current.releaseLock();
      }
      if (port && port.close) {
        port.close().catch(() => { });
      }
    };
  }, [port]);



  useEffect(() => {
    setCodeText(computeCode());
    const showAutonomous = (editableLines[4].value.includes("true"));
    setShowAutonomous(showAutonomous);
  }, [editableLines]);

  const getValuesForChip = () => {
    const chipVersion = parseFloat(firmwareVersion)
    console.log("Getting values for chip version: " + chipVersion)
    let holdcmd = parseHoldCommand();
    if (holdcmd === null) {
      return "";
    }
    let out = []
    let no_errors = true;
    for (let linenum of getCodeLineOrder()) {
      // console.log("Checking line: " + linenum)
      let line = editableLines[linenum];
      let value = line['value'];
      let humanLineNumber = parseInt(linenum) + 1;
      let version = line['version']

      if (version > chipVersion && chipVersion > 0) {
        console.log(`Skipping ${value} for firmware version: required ${version} > chip ${chipVersion}`)
        continue
      }

      // Remove comments
      value = value.replace(/\/\/.*$/, '');
      if (line['removeSpaces']) {
        value = value.replaceAll(' ', '')
      }
      for (let remove of line['remove']) {
        let remove2 = remove
        if (line['removeSpaces']) {
          remove2 = remove.replaceAll(' ', '')
        }
        if (!value.includes(remove2)) {
          no_errors = false

          // let all_remove = ""
          // for (let r of line['remove']) {
          //   all_remove += r
          // }

          setCodeError('Error: Line ' + humanLineNumber + ' is missing: ' + remove)
        }
        value = value.replaceAll(remove2, '')
      }

      // Check for valid
      let found_valid = false;
      let show_default_error = true;
      if (value.includes('@')) {
        setCodeError('Error: Line ' + humanLineNumber + ' should not contain an @');
        no_errors = false
      } else {
        for (let allowed of line['valid']) {
          if (allowed == 'string') {
            found_valid = true
            out.push(value)
            break;
          } else if (allowed == 'integer') {
            if (isInt(value)) {
              found_valid = true
              out.push(value)
              break;
            } else {
              no_errors = false
              show_default_error = false
              setCodeError('Error: Line ' + humanLineNumber + ' must be an integer');
            }
          } else if (allowed == value) {
            found_valid = true
            out.push(value)
            break;
          }
        }
        if (!found_valid && show_default_error) {
          no_errors = false
          setCodeError('Error: Line ' + humanLineNumber + ' should have something that looks like ' + line['valid']);
        }
      }
    }
    if (no_errors) {
      setCodeError('')
    } else {
      return "";
    }
    for (let command of holdcmd) {
      out.push(command['param1'] + ',' + command['param2'] + ',' + command['param3'] + ',' + command['param4'] + ',' + command['param5'] + ',' + command['color'])
    }
    return out.join('@');
  }

  const computeCode = () => {
    const newCode = codeText.split('\n').map((line, index) => {
      if (index in editableLines) {
        return editableLines[index]['value'];
      }
      return line;
    }).join('\n');
    return newCode;
  }

  const handleCheckboxChange = () => {
    setAutoScroll(!autoScroll);
  };


  const parseHoldCommand = () => {
    // Commands look like:
    // holdCommand(50, 50, 55, 50, 500, "blue");  // straight up 0.5 sec
    // holdCommand(50, 50, 55, 100, 750, "purple"); // spin in place 0.75 sec
    // holdCommand(50, 50, 55, 0, 750, "orange");   // spin in place the other way 0.75 sec

    // Get holdCommand text from the ref
    if (holdCommandRef.current) {
      const holdCommandText = holdCommandRef.current.getValue();

      // Split each line
      const lines = holdCommandText.split('\n');

      // Process each line
      let commands = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // Remove comments
        const cleanLine = line.replace(/\/\/.*$/, '').trim();

        if (cleanLine.length === 0) {
          continue;
        }

        // Validate each line parses correctly
        const match = cleanLine.match(/holdCommand\(([^)]+)\);/);
        if (!match) {
          console.log(`Invalid command: ${line}`);
          setCodeError(`Autonomous flight commands: error on line ${i + 1}: invalid command: ${line}`);
          return null;
        }

        // Extract parameters and color
        const params = match[1].split(',').map(param => param.trim());
        if (params.length !== 6) {
          console.log(`Invalid number of parameters: ${line}`);
          setCodeError(`Autonomous flight commands: error on line ${i + 1}: invalid number of parameters: ${line}`);

          return null;
        }

        const [param1, param2, param3, param4, param5, color] = params;
        const parsedColor = color.replace(/"/g, '');

        // Validate parameters
        if (isNaN(param1) || isNaN(param2) || isNaN(param3) || isNaN(param4) || isNaN(param5) || !parsedColor) {
          console.log(`Invalid parameters: ${line}`);
          setCodeError(`Autonomous flight commands: error on line ${i + 1}: invalid parameters: ${line}`);
          return null;
        }

        if (param1 > 100 || param2 > 100 || param3 > 100 || param4 > 100) {
          console.log(`Invalid parameters: ${line}`);
          setCodeError(`Autonomous flight commands: error on line ${i + 1}: parameter > 100: ${line}`);
          return null;
        }

        if (param1 < 0 || param2 < 0 || param3 < 0 || param4 < 0) {
          console.log(`Invalid parameters: ${line}`);
          setCodeError(`Autonomous flight commands: error on line ${i + 1}: parameter > 100: ${line}`);
          return null;
        }

        if (param5 < 0) {
          console.log(`Invalid parameters: ${line}`);
          setCodeError(`Autonomous flight commands: error on line ${i + 1}: time < 0: ${line}`);
          return null;
        }

        commands.push({
          param1: Number(param1),
          param2: Number(param2),
          param3: Number(param3),
          param4: Number(param4),
          param5: Number(param5),
          color: parsedColor,
        });
      }

      return commands;
    }
  }

  const resetAll = () => {
    localStorage.setItem("droneWorkshopState", JSON.stringify([]));
    window.location.reload();
  }

  const handleConnect = async () => {
    try {
      const port = await navigator.serial.requestPort();
      setPort(port);

    } catch (error) {
      console.error('There was an error requesting the serial port:', error);
    }
  };

  const handleSend = async () => {
    setIsUploading(true);
    const message = getValuesForChip();
    console.log(message)
    if (message == "") {
      console.log("No message to send")
      setIsUploading(false);
      return;
    }
    if (port) {
      const textEncoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(textEncoder.encode(message));
      writer.releaseLock();
      setOutputValue(message);
    }
    // setTimeout(() => {
    //   setIsUploading(false);
    // }, 500)
  };

  const handleAdminDialogOpen = () => {
    setShowAdminDialog(true);
    setPassword('');
    setPasswordError('');
    setIsAuthenticated(false);
  };

  const handleAdminDialogClose = () => {
    setShowAdminDialog(false);
    setDroneTestingString(""); // Reset testing state when dialog closes
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === 'uptonogood') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleTestAllDrones = async (serial_string) => {
    // send the command "test_all_drones"

    setDroneTestingString(serial_string);

    if (port) {
      const textEncoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(textEncoder.encode(serial_string));
      writer.releaseLock();
    }
  };

  const handleClearSerialData = () => {
    setData([]);
  };

  if (!isSupported) {
    return <p>Your browser does not support the Web Serial API. Please use a compatible browser like Chrome or Edge.</p>
  }

  let firmwareText = "";
  if (firmwareVersion !== 0) {
    firmwareText = `(v${firmwareVersion}) `
  }
  const serialButtonText = isConnected ? 'Connected ' + firmwareText + '✅' : 'Connect to Serial';
  const connectButtonVariant = 'primary'; // Always use primary
  const connectButtonStyle = isConnected ? { backgroundColor: '#e6e6e6', borderColor: '#d5d5d5', color: '#333' } : {};

  const uploadButtonClass = 'outline-primary';
  const uploadButtonColor = isConnected ? { backgroundColor: '#f05f40', borderColor: '#f05f40', color: 'white' } : {};

  let autonomousDisp = "none"
  let codemirrorSize = "88vh"
  if (showAutonomous) {
    autonomousDisp = ""
    codemirrorSize = "38vh"
  }

  const basePdf = isAdvanced
    ? AdvancedDroneInstructionsPDF   // e.g. "/docs/advanced.pdf"
    : DroneInstructionsPDF;          // e.g. "/docs/basic.pdf"

  // Important: put the hash *after* any query string the URL might already have
  const pdfUrl =
    `${basePdf}#view=FitH&navpanes=0&toolbar=1&scrollbar=0`;  // or …#zoom=page-width


  return (
    <ErrorBoundary>
      <div
        style={{
          alignItems: 'center',
          backgroundColor: "#f05f40ff",
        }}>

        <div className="orange-bar">
          <h1 className="stageone-heading">
            <span className="stageone-education">Robotics Workshop</span>
            <span className="drone-workshop"> | Drone IDE</span>
          </h1>

          <span className="stageone-org">STAGE ONE EDUCATION</span>
        </div>

        <div className="download-links">
          <label
            htmlFor="advanced-mode"
            className="advanced-toggle"
            style={{
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              marginRight: "0.75rem",      // space before the first link
              color: 'white',
              marginLeft: '15px',
            }}
          >
            <input
              id="advanced-mode"
              type="checkbox"
              checked={isAdvanced}
              onChange={(e) => setIsAdvanced(e.target.checked)}
              style={{ marginRight: "0.35rem" }}
            />
            Advanced mode
          </label>

          <a href={pdfUrl} target="_blank">Instructions</a>
          <a
            href="https://stageoneeducation.com/UART-USB-Driver.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            USB/UART Drivers
          </a>
          <a
            href="https://stageoneeducation.com/QuadWiFiPoleBTWebSerialv4_1.ino"
            download="QuadWiFiPoleBTWebSerialv4_1.ino"
            target="_blank"
          >
            Firmware
          </a>
          <a href="https://feedback.stageoneeducation.com/workshop-feedback/robotics-feedback-survey/" target="_blank">Feedback</a>
        </div>
      </div>

      {/* 614
      893
      401 */}

      <Split initialPrimarySize={"32vw"} minPrimarySize={"5vw"} minSecondarySize={"10vw"}>
        <div style={{
          height: '100%',
        }}
        >
          <iframe
            src={pdfUrl}
            title="Drone Instructions"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
        <div>
          <Split initialPrimarySize={"60%"} minPrimarySize={"10%"} minSecondarySize={"10%"}>
            <div style={{ height: '100%', overflow: 'auto' }}>
              <Container className="py-3" style={{ backgroundColor: '#F7F7F7' }}>


                <span style={{ fontSize: '150%', color: 'red', fontFamily: 'monospace' }}>{connectionError}</span>
                <Form>
                  <Button
                    onClick={handleConnect}
                    className="mb-3 connect-serial-button"
                    disabled={isConnected}
                    style={connectButtonStyle}
                    variant={connectButtonVariant}
                  >
                    {serialButtonText}
                  </Button>

                  {/* <Button onClick={handleSend} className="mb-3" style={{ marginLeft: '10px' }} disabled={!isConnected} variant={uploadButtonVariant} >Upload</Button> */}
                  <Button
                    onClick={handleSend}
                    className="mb-3"
                    style={{ marginLeft: '10px', ...uploadButtonColor }}
                    disabled={!isConnected || isUploading} // Disable during upload for better UX
                    variant={uploadButtonClass}
                  >
                    {isUploading ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        style={{ marginRight: '5px' }} // Optional: to add spacing between spinner and text
                      />
                    ) : null}
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </Form>
                <span style={{ color: 'red', fontSize: '125%', fontFamily: 'monospace' }}><b>{codeError}</b></span>
                <div id="codeMirror1">
                  <CodeMirror
                    value={codeText}
                    className="full-height"
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
                      // keyMap: 'sublime', // Include this to enable search with shortcuts like Ctrl+F
                      extraKeys: {
                        'Ctrl-F': 'findPersistent', // Persistent search dialog
                        'Ctrl-G': 'findNext', // Find next match
                        'Shift-Ctrl-G': 'findPrev', // Find previous match
                        "Enter": () => { },
                      },
                      // scrollbarStyle: 'simple' // Custom scrollbar style
                    }}


                    onBeforeChange={(editor, data, value) => {
                      const lineNum = data.from.line;
                      if (data.text.length > 1) {
                        // new line, ignore
                        data.cancel();
                        console.log('bail!')
                        return
                      }
                      if (lineNum in editableLines) {
                        // Update that line
                        setEditableLines({
                          ...editableLines,
                          [lineNum]: {
                            'value': value.split('\n')[lineNum],
                            'remove': editableLines[lineNum]['remove'],
                            'valid': editableLines[lineNum]['valid'],
                            'removeSpaces': editableLines[lineNum]['removeSpaces'],
                            'chipIndex': editableLines[lineNum]['chipIndex'],
                            'version': editableLines[lineNum]['version'],
                          }
                        });
                      }
                    }}
                    onChange={(editor, data, value) => {
                      const scrollInfo = editor.getScrollInfo(); // Save scroll position
                      editor.scrollTo(scrollInfo.left, scrollInfo.top); // Restore scroll position
                    }}
                  />
                </div>
                <div style={{ display: autonomousDisp, marginTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }} id="autonomousDiv">
                    <div style={{ marginBottom: '15px' }}><b>Autonomous Flight Commands</b></div>
                    <Button
                      onClick={handleSend}
                      className="mb-3"
                      style={{ marginLeft: '20px', ...uploadButtonColor }}
                      disabled={!isConnected || isUploading}
                      variant={uploadButtonClass}
                    >
                      {isUploading ? (
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          style={{ marginRight: '5px' }} // Optional: to add spacing between spinner and text
                        />
                      ) : null}
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>

                  <div id="codeMirror2">
                    <CodeMirrorUncontrolled
                      value={HOLDCOMMAND_CODE}
                      // ref={holdCommandRef}
                      className="stageoneEdit"
                      editorDidMount={(editor) => { holdCommandRef.current = editor }}
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
                      }}
                      onChange={saveState}
                    />
                  </div>
                </div>
              </Container >
            </div>
            <div style={{ display: 'flex', flexFlow: 'column', height: '100%', backgroundColor: '#F7F7F7', overflow: 'auto', padding: '10px' }}>
              <div className="serial-monitor">
                <h4>Serial Monitor</h4>
              </div>              <SerialMonitor
                data={data}
                autoScroll={autoScroll}
                onAutoScrollChange={handleCheckboxChange}
                onClear={handleClearSerialData}
                height="100%"
                title=""
              />
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <a className="gear-icon" style={{ marginRight: '10px' }} onClick={handleAdminDialogOpen}>
                  <FontAwesomeIcon icon={faCog} />
                </a>
                <ResetAllButton
                  callback={resetAll}
                />
              </div>
            </div>
          </Split>
        </div>
      </Split >

      <Modal
        show={showAdminDialog}
        onHide={handleAdminDialogClose}
        onEntered={() => passwordInputRef.current?.focus()}
        size="lg"
        fullscreen="lg-down"
        dialogClassName="modal-90w"
        contentClassName="modal-content"
      >
        <Modal.Header closeButton className="text-orange">
          <Modal.Title>Drone Tester</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isAuthenticated ? (
            <Form onSubmit={handlePasswordSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                />
                {passwordError && (
                  <Form.Text className="text-danger">{passwordError}</Form.Text>
                )}
              </Form.Group>
              <Button
                variant="outline-primary"
                type="submit"
                style={{ backgroundColor: '#f05f40', borderColor: '#f05f40', color: 'white' }}
                className="orange-btn"
              >
                Submit
              </Button>
            </Form>
          ) : (
            <div>
              {!isConnected ? (
                <div className="text-danger mb-3">
                  Board not connected. Please connect board first.
                </div>
              ) : firmwareVersion === 0 ? (
                <div className="text-danger mb-3">
                  Firmware version not detected. Please upload firmware first.
                </div>
              ) : firmwareVersion < 4 ? (
                <div className="text-danger mb-3">
                  Firmware version {firmwareVersion} does not support testing drones (firmware must be v4 or higher)
                </div>
              ) : null}
              <Button
                variant={uploadButtonClass}
                onClick={() => { handleTestAllDrones("test_all_drones") }}
                disabled={!isConnected || isUploading}
                style={{ marginLeft: '10px', ...uploadButtonColor }}
                className={isConnected ? "orange-btn" : ""}
              >
                {droneTestingString == "test_all_drones" ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      style={{ marginRight: '5px' }}
                    />
                    Testing...
                  </>
                ) : (
                  'Spin up all drones'
                )}
              </Button>

              <Button
                variant={uploadButtonClass}
                onClick={() => { handleTestAllDrones("test_all_drones_flying2") }}
                disabled={!isConnected || isUploading}
                style={{ marginLeft: '10px', ...uploadButtonColor }}
                className={isConnected ? "orange-btn" : ""}
              >
                {droneTestingString == "test_all_drones_flying2" ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      style={{ marginRight: '5px' }}
                    />
                    Testing...
                  </>
                ) : (
                  'Pop up all drones'
                )}
              </Button>

              <div className="mt-4">
                <SerialMonitor
                  data={data}
                  autoScroll={autoScroll}
                  onAutoScrollChange={handleCheckboxChange}
                  onClear={handleClearSerialData}
                  height="calc(75vh - 180px)"
                  title=""
                />
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
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
holdCommand(50, 50, 25, 0, 750, "yellow");   // land
`

const BASE_CODE = `
const char* quadcopter_id = "";
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

const char* light_pole_id = "";

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
