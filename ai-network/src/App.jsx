import { useState } from 'react'
import './App.css'
import { useEffect } from 'react'

function App() {
  const [lightStates, setLightStates] = useState([false, false, false]) // [top, middle, bottom]
  const [selectedButton, setSelectedButton] = useState(null) // 'red' or 'green' or null
  const [isHidden, setIsHidden] = useState(false) // to track if traffic light section is hidden
  const [circleColors, setCircleColors] = useState(Array(12).fill('gray')) // track circle colors
  const [showCode, setShowCode] = useState(false) // to track if code/probabilities are shown
  const [hasRunRound1, setHasRunRound1] = useState(false) // to track if Run Round 1 has been executed
  const [inputSelections, setInputSelections] = useState(Array(9).fill('')) // track dropdown selections for C1-C9
  const [numericValues, setNumericValues] = useState(Array(9).fill('')) // track numeric input values for C1-C9
  const [weightValues, setWeightValues] = useState(Array(9).fill('')) // track weight input values for C1-C9
  const [valueResults, setValueResults] = useState(Array(9).fill('')) // track value results for C1-C9
  const [previousNumericValues, setPreviousNumericValues] = useState(Array(9).fill('')) // track previous numeric values
  const [isAutoNumericActive, setIsAutoNumericActive] = useState(false) // track if auto numeric is active
  const [previousWeightValues, setPreviousWeightValues] = useState(Array(9).fill('')) // track previous weight values
  const [isAutoWeightActive, setIsAutoWeightActive] = useState(false) // track if auto weight is active
  const [isUpdateWeightsAutoActive, setIsUpdateWeightsAutoActive] = useState(false) // track if update weights auto is active
  const [updateWeightsValues, setUpdateWeightsValues] = useState(Array(9).fill('')) // track independent weight values for update weights table
  const [previousUpdateWeightsValues, setPreviousUpdateWeightsValues] = useState(Array(9).fill('')) // track previous update weights values
  const [previousValueResults, setPreviousValueResults] = useState(Array(9).fill('')) // track previous value results
  const [isAutoValueActive, setIsAutoValueActive] = useState(false) // track if auto value is active
  const [sumOfValues, setSumOfValues] = useState('') // track sum of C node values
  const [networkDecision, setNetworkDecision] = useState('') // track network decision

  const [networkStatus, setNetworkStatus] = useState('') // track if network decision is correct
  const [showNetworkDecision, setShowNetworkDecision] = useState(false)
  const [showTrafficLight, setShowTrafficLight] = useState(false) // track if network decision table is shown
  const [showUpdateWeightsTable, setShowUpdateWeightsTable] = useState(false) // track if update weights table is shown
  const [isHiddenLayerExpanded, setIsHiddenLayerExpanded] = useState(false) // track if hidden layer content is expanded
  const [isOutputNodeExpanded, setIsOutputNodeExpanded] = useState(false) // track if output node content is expanded
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false) // track if summary content is expanded
  // Round selection removed - only Round 1 is displayed





  const handleSensorBoxClick = () => {
    // Scroll to position where Sensor Nodes A appears right below the horizontal line
    const sensorBox = document.querySelector('.text-box')
    if (sensorBox) {
      const rect = sensorBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const handleHiddenLayerBoxClick = () => {
    // Scroll to position where Hidden Layer Nodes appears right below the horizontal line
    const hiddenLayerBox = document.querySelector('.hidden-layer-text-box')
    if (hiddenLayerBox) {
      const rect = hiddenLayerBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const handleOutputBoxClick = () => {
    // Scroll to position where Output Node appears right below the horizontal line
    const outputBox = document.querySelector('.output-text-box')
    if (outputBox) {
      const rect = outputBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const handleSummaryBoxClick = () => {
    // Scroll to position where Summary appears right below the horizontal line
    const summaryBox = document.querySelector('.summary-text-box')
    if (summaryBox) {
      const rect = summaryBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const toggleHiddenLayer = () => {
    setIsHiddenLayerExpanded(!isHiddenLayerExpanded)
  }

  const toggleOutputNode = () => {
    setIsOutputNodeExpanded(!isOutputNodeExpanded)
  }

  const toggleSummary = () => {
    setIsSummaryExpanded(!isSummaryExpanded)
  }

  // Round selection removed - only Round 1 is displayed

  // Round offset calculation removed - no longer needed

  // Round selection removed - only Round 1 is displayed

  // Round offset calculation removed - only centering Round 1

  const handleUpdateWeights = () => {
    // Show the update weights table
    setShowUpdateWeightsTable(true)
    
    // Scroll to position where Output Node table appears right below the horizontal line
    const outputBox = document.querySelector('.output-text-box')
    if (outputBox) {
      const rect = outputBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const cycleLights = () => {
    setLightStates(prevStates => {
      const newStates = [...prevStates]
      
      // Find the first false (off) light and turn it on
      const firstOffIndex = newStates.findIndex(state => !state)
      
      if (firstOffIndex !== -1) {
        // Turn on the first off light
        newStates[firstOffIndex] = true
      } else {
        // All lights are on, turn them all off
        newStates.fill(false)
      }
      
      return newStates
    })
  }

  const handleButtonClick = (buttonType) => {
    setSelectedButton(buttonType)
  }

  const toggleHide = () => {
    setIsHidden(!isHidden)
  }

  const toggleShowCode = () => {
    setShowCode(!showCode)
  }

  const toggleNetworkDecision = () => {
    const newShowState = !showNetworkDecision
    setShowNetworkDecision(newShowState)
    // Calculate summary when showing the network decision
    if (newShowState) {
      calculateSummary()
    }
  }

  const toggleTrafficLight = () => {
    setShowTrafficLight(!showTrafficLight)
  }

  const handleInputChange = (index, value) => {
    const newSelections = [...inputSelections]
    newSelections[index] = value
    setInputSelections(newSelections)
    
    // If auto numeric is active, update numeric values
    if (isAutoNumericActive) {
      const newNumericValues = [...numericValues]
      if (value === 'red') {
        newNumericValues[index] = '-1'
      } else if (value === 'green') {
        newNumericValues[index] = '1'
      } else {
        newNumericValues[index] = ''
      }
      setNumericValues(newNumericValues)
    }
  }

  const handleNumericChange = (index, value) => {
    const newNumericValues = [...numericValues]
    newNumericValues[index] = value
    setNumericValues(newNumericValues)
  }

  const handleWeightChange = (index, value) => {
    const newWeightValues = [...weightValues]
    newWeightValues[index] = value
    setWeightValues(newWeightValues)
  }

  const handleUpdateWeightChange = (index, value) => {
    const newUpdateWeightsValues = [...updateWeightsValues]
    newUpdateWeightsValues[index] = value
    setUpdateWeightsValues(newUpdateWeightsValues)
  }

  const handleValueChange = (index, value) => {
    const newValueResults = [...valueResults]
    newValueResults[index] = value
    setValueResults(newValueResults)
  }

  const handleAutoNumeric = () => {
    if (!isAutoNumericActive) {
      // Save current values and apply auto-fill
      setPreviousNumericValues([...numericValues])
      const newNumericValues = inputSelections.map(input => {
        if (input === 'red') {
          return '-1'
        } else if (input === 'green') {
          return '1'
        } else {
          return '' // Keep empty if no input selection
        }
      })
      setNumericValues(newNumericValues)
      setIsAutoNumericActive(true)
    } else {
      // Restore previous values
      setNumericValues([...previousNumericValues])
      setIsAutoNumericActive(false)
    }
  }

  const handleAutoWeight = () => {
    if (!isAutoWeightActive) {
      // Save current values and apply auto-fill
      setPreviousWeightValues([...weightValues])
      const newWeightValues = Array(9).fill('20')
      setWeightValues(newWeightValues)
      setIsAutoWeightActive(true)
    } else {
      // Restore previous values
      setWeightValues([...previousWeightValues])
      setIsAutoWeightActive(false)
    }
  }

  const handleUpdateWeightsAuto = () => {
    if (!isUpdateWeightsAutoActive) {
      // Save current values and apply learning algorithm
      setPreviousUpdateWeightsValues([...updateWeightsValues])
      setPreviousWeightValues([...weightValues])
      
      if (!selectedButton) {
        alert('Please select a traffic light color first!')
        return
      }
      
      // Initialize updateWeightsValues with current weightValues if they're empty
      const currentUpdateWeights = updateWeightsValues.every(val => val === '') ? [...weightValues] : [...updateWeightsValues]
      
      const newUpdateWeightsValues = [...currentUpdateWeights]
      const newMainWeightsValues = [...weightValues]
      
      // Apply learning algorithm: +10 if C node input matches the selected traffic light, -10 if doesn't match
      for (let i = 0; i < 9; i++) {
        const cNodeInput = inputSelections[i] // This is what's displayed in the main table's Input column
        const currentUpdateWeight = parseFloat(currentUpdateWeights[i]) || 0
        const currentMainWeight = parseFloat(weightValues[i]) || 0
        
        if (cNodeInput === selectedButton) {
          // C node input matches the selected traffic light: add 10 to both tables
          newUpdateWeightsValues[i] = (currentUpdateWeight + 10).toString()
          newMainWeightsValues[i] = (currentMainWeight + 10).toString()
        } else if (cNodeInput === 'red' || cNodeInput === 'green') {
          // C node input doesn't match the selected traffic light: subtract 10 from both tables
          // Note: weights can be negative or zero
          newUpdateWeightsValues[i] = (currentUpdateWeight - 10).toString()
          newMainWeightsValues[i] = (currentMainWeight - 10).toString()
        } else {
          // No input selected: keep current weights
          newUpdateWeightsValues[i] = currentUpdateWeight.toString()
          newMainWeightsValues[i] = currentMainWeight.toString()
        }
      }
      
      setUpdateWeightsValues(newUpdateWeightsValues)
      setWeightValues(newMainWeightsValues)
      setIsUpdateWeightsAutoActive(true)
    } else {
      // Restore previous values for both tables
      setUpdateWeightsValues([...previousUpdateWeightsValues])
      setWeightValues([...previousWeightValues])
      setIsUpdateWeightsAutoActive(false)
    }
  }

  const handleAutoValue = () => {
    if (!isAutoValueActive) {
      // Save current values and apply auto-fill
      setPreviousValueResults([...valueResults])
      const newValueResults = Array(9).fill('')
      for (let i = 0; i < 9; i++) {
        const numericValue = numericValues[i] === '' ? 0 : parseFloat(numericValues[i])
        const weightValue = weightValues[i] === '' ? 0 : parseFloat(weightValues[i])
        newValueResults[i] = Math.round(numericValue * weightValue).toString()
      }
      setValueResults(newValueResults)
      setIsAutoValueActive(true)
    } else {
      // Restore previous values
      setValueResults([...previousValueResults])
      setIsAutoValueActive(false)
    }
  }

  // Function to calculate values automatically when inputs change
  const calculateValues = () => {
    // Update numeric values if auto numeric is active
    if (isAutoNumericActive) {
      const newNumericValues = inputSelections.map(input => {
        if (input === 'red') {
          return '-1'
        } else if (input === 'green') {
          return '1'
        } else {
          return ''
        }
      })
      setNumericValues(newNumericValues)
    }
    
    // Update weight values if auto weight is active
    if (isAutoWeightActive) {
      const newWeightValues = Array(9).fill('20')
      setWeightValues(newWeightValues)
    }
    
    // Update value results if auto value is active
    if (isAutoValueActive) {
      const newValueResults = Array(9).fill('')
      for (let i = 0; i < 9; i++) {
        const numericValue = numericValues[i] === '' ? 0 : parseFloat(numericValues[i])
        const weightValue = weightValues[i] === '' ? 0 : parseFloat(weightValues[i])
        newValueResults[i] = Math.round(numericValue * weightValue).toString()
      }
      setValueResults(newValueResults)
    }
  }

  const calculateSummary = () => {
    // Calculate sum of all values
    const sum = valueResults.reduce((total, value) => {
      return total + (value === '' ? 0 : parseFloat(value))
    }, 0)
    
    setSumOfValues(sum.toString())
    
    // Determine network decision locally first
    let decision
    if (sum > 0) {
      decision = 'Green'
    } else if (sum < 0) {
      decision = 'Red'
    } else {
      decision = 'Undecided'
    }
    
    setNetworkDecision(decision)

    // Determine network status using the local decision
    if (!selectedButton) {
      setNetworkStatus('') // No traffic light selected
    } else if (sum === 0) {
      setNetworkStatus('Undecided')
    } else if (selectedButton === 'red' && decision === 'Red') {
      setNetworkStatus('Correct')
    } else if (selectedButton === 'green' && decision === 'Green') {
      setNetworkStatus('Correct')
    } else if (selectedButton === 'red' && decision === 'Green') {
      setNetworkStatus('Incorrect')
    } else if (selectedButton === 'green' && decision === 'Red') {
      setNetworkStatus('Incorrect')
    } else {
      setNetworkStatus('')
    }
  }

  useEffect(() => {
    calculateValues()
    calculateSummary()
  }, [numericValues, weightValues, isAutoValueActive, isAutoNumericActive, isAutoWeightActive, isUpdateWeightsAutoActive, updateWeightsValues, valueResults, selectedButton, inputSelections])











  const handleKeyDown = (e, rowIndex, columnIndex) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      
      // Calculate next row and column
      let nextRow = rowIndex
      let nextColumn = columnIndex
      
      if (columnIndex === 1) { // Input column
        nextRow = rowIndex + 1
        nextColumn = 1
      } else if (columnIndex === 2) { // Numeric column
        nextRow = rowIndex + 1
        nextColumn = 2
      } else if (columnIndex === 4) { // Weight column
        nextRow = rowIndex + 1
        nextColumn = 4
      } else if (columnIndex === 6) { // Value column
        nextRow = rowIndex + 1
        nextColumn = 6
      }
      
      // If we're at the last row, wrap to the first row
      if (nextRow >= 9) {
        nextRow = 0
      }
      
      // Focus the next element
      const nextElement = document.querySelector(`[data-row="${nextRow}"][data-column="${nextColumn}"]`)
      if (nextElement) {
        nextElement.focus()
      }
    }
  }

  // Weighted probability system for circles
  const circleWeights = [
    { weight: 5 }, // A1
    { weight: 2 }, // A2
    { weight: 1 }, // A3
    { weight: 4 }, // A4
    { weight: 1 }, // A5
    { weight: 5 }, // A6
    { weight: 2 }, // A7
    { weight: 1 }, // A8
    { weight: 4 }, // A9
    { weight: 1 }, // A10
    { weight: 5 }, // A11
    { weight: 2 }  // A12
  ]

  const handleRunRound1 = () => {
    if (!selectedButton) {
      alert('Please select a traffic light color first!')
      return
    }

    const newCircleColors = circleWeights.map((circle, index) => {
      const weight = circle.weight
      const randomValue = Math.random() * 6 // Random value between 0 and 6
      
      // If random value is less than weight, circle matches selected color
      // Otherwise, it's the opposite color
      if (randomValue < weight) {
        return selectedButton // red or green
      } else {
        return selectedButton === 'red' ? 'green' : 'red'
      }
    })

    setCircleColors(newCircleColors)
    setHasRunRound1(true)
  }

  return (
    <div className="app">
      {/* Fixed Header Section */}
      <div className="fixed-header">
        {/* Header Bar */}
        <header className="header-bar">
          <div className="header-content">
            <span className="header-left">Artificial Intelligence Workshop</span>
            <div className="header-divider"></div>
            <span className="header-center">Human Neural Network</span>
            <div className="header-spacer"></div>
            <span className="header-right">STAGE ONE EDUCATION</span>
          </div>
        </header>

                {/* Fixed Title Section */}
        <div className="fixed-title-section">
          <div className="round-titles-container">
                         <div className="round-titles-wrapper">
               <div className="left-container">
                 {/* Left container content can go here */}
               </div>
               <div className="centered-round-container">
                 <div className="triangle-left"></div>
                 <span className="round-title-main">
                   <h2>Round 1</h2>
                 </span>
                 <div className="triangle-right"></div>
               </div>
               <div className="right-rounds-container">
                 {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((roundNum) => (
                   <span key={roundNum} className="round-number-box">
                     Round {roundNum}
                   </span>
                 ))}
               </div>
             </div>
          </div>
          <div className="horizontal-line"></div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="scrollable-content">
        <div className="main-content">
          <div className="title-section">
            <div className="image-title-box">
              <span className="image-title-text">27 participant Human Neural Network</span>
            </div>
            <div className="image-container">
              <img src="/27-nn.png" alt="27 participant human neural network" className="content-image" />
            </div>
            <div 
              className="text-box"
              onClick={handleSensorBoxClick}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-box-content">Sensor Nodes</span>
            </div>
            
            {!isHidden && (
              <div className="traffic-light-section">
                <p className="instruction-text">Select state of the traffic light</p>
                <div className="button-container">
                  <button 
                    className={`red-button ${selectedButton === 'red' ? 'selected' : ''}`}
                    onClick={() => handleButtonClick('red')}
                  >
                    Red
                  </button>
                  <button 
                    className={`green-button ${selectedButton === 'green' ? 'selected' : ''}`}
                    onClick={() => handleButtonClick('green')}
                  >
                    Green
                  </button>
                </div>
                <div className="hide-button-container">
                  <button 
                    className={`hide-button ${isHidden ? 'selected' : ''}`}
                    onClick={toggleHide}
                  >
                    {isHidden ? 'Show Traffic Light' : 'Hide Traffic Light'}
                  </button>
                </div>
                <div className="traffic-light-display">
                  <div className="traffic-light-housing">
                    <div 
                      className={`traffic-light-red ${selectedButton === 'red' ? 'active' : 'inactive'}`}
                    ></div>
                    <div 
                      className={`traffic-light-green ${selectedButton === 'green' ? 'active' : 'inactive'}`}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {isHidden && (
              <div className="hide-button-container">
                <button 
                  className={`hide-button ${isHidden ? 'selected' : ''}`}
                  onClick={toggleHide}
                >
                  {isHidden ? 'Show Traffic Light' : 'Hide Traffic Light'}
                </button>
              </div>
            )}
            
            <div className="run-button-container">
              <button 
                className={`run-button ${hasRunRound1 ? 'selected' : ''}`}
                onClick={handleRunRound1}
              >
                Run Round 1
              </button>
            </div>
            
            <div className="circles-section">
              <div className="circles-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <div key={num} className="circle-item">
                    <span className="circle-label">A{num}</span>
                    {showCode && (
                      <span className="probability-text">
                        {((circleWeights[num-1].weight / 6) * 100).toFixed(1)}%
                      </span>
                    )}
                    <div className={`circle ${circleColors[num-1]}`}>
                      {circleColors[num-1] === 'red' && <span className="circle-text">R</span>}
                      {circleColors[num-1] === 'green' && <span className="circle-text">G</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="show-code-button-container">
              <button 
                className={`show-code-button ${showCode ? 'selected' : ''}`}
                onClick={toggleShowCode}
              >
                {showCode ? 'Hide Code' : 'Show Code'}
              </button>
            </div>
            
            <div 
              className="hidden-layer-text-box"
              onClick={toggleHiddenLayer}
              style={{ cursor: 'pointer' }}
            >
              <span className="hidden-layer-text-content">Hidden Layer Nodes</span>
              <span className="expand-text">{isHiddenLayerExpanded ? '(Collapse)' : '(Expand)'}</span>
            </div>
            
            {isHiddenLayerExpanded && (
              <div className="node-instructions">
                <div className="b-node-section">
                  <h3 className="b-node-title">B Nodes</h3>
                  <p className="b-node-instruction"><span className="step-number">1.</span> Bubble in your <span className="sensor-node-text">Sensor Node</span> inputs</p>
                  <p className="b-node-instruction"><span className="step-number">2.</span> Roll the <img src="/die.png" alt="die" className="die-image" /></p>
                  <p className="b-node-instruction"><span className="step-number">3.</span> Bubble in your output</p>
                </div>
                
                <div className="center-section">
                  <h3 className="everyone-text">Everyone get up!</h3>
                  <p className="connections-text">Find your connections</p>
                </div>
                
                <div className="c-node-section">
                  <h3 className="c-node-title">C Nodes</h3>
                  <p className="c-node-instruction"><span className="step-number">1.</span> Bubble in your <span className="b-node-text">B Node</span> inputs</p>
                  <p className="c-node-instruction"><span className="step-number">2.</span> Roll the <img src="/die.png" alt="die" className="die-image" /></p>
                  <p className="c-node-instruction"><span className="step-number">3.</span> Bubble in your output</p>
                </div>
              </div>
            )}
            
            <div 
              className="output-text-box"
              onClick={toggleOutputNode}
              style={{ cursor: 'pointer' }}
            >
              <span className="output-text-box-content">Output Node</span>
              <span className="expand-text">{isOutputNodeExpanded ? '(Collapse)' : '(Expand)'}</span>
            </div>
            
            {isOutputNodeExpanded && (
              <div className="tables-wrapper">
                <div className="table-container">

                  <table className="output-table">
                  <thead>
                    <tr>
                      <th>Node</th>
                      <th>Input</th>
                      <th>Numeric</th>
                      <th>×</th>
                      <th>Weight</th>
                      <th>=</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                      <tr key={index}>
                        <td>C{index}</td>
                        <td className={inputSelections[index-1] === 'red' ? 'input-cell-red' : inputSelections[index-1] === 'green' ? 'input-cell-green' : ''}>
                          <select 
                            value={inputSelections[index-1]} 
                            onChange={(e) => handleInputChange(index-1, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index-1, 1)}
                            data-row={index-1} 
                            data-column="1"
                          >
                            <option value="">Select</option>
                            <option value="red">Red</option>
                            <option value="green">Green</option>
                          </select>
                        </td>
                        <td>
                          {isAutoNumericActive ? (
                            <span>{numericValues[index-1]}</span>
                          ) : (
                            <select 
                              value={numericValues[index-1]} 
                              onChange={(e) => handleNumericChange(index-1, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index-1, 2)}
                              data-row={index-1} 
                              data-column="2"
                            >
                              <option value="">Select</option>
                              <option value="1">1</option>
                              <option value="-1">-1</option>
                            </select>
                          )}
                        </td>
                        <td>×</td>
                        <td>
                          {isAutoWeightActive ? (
                            <span>{weightValues[index-1]}</span>
                          ) : (
                            <input 
                              type="text" 
                              value={weightValues[index-1]} 
                              onChange={(e) => handleWeightChange(index-1, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index-1, 4)}
                              data-row={index-1} 
                              data-column="4"
                            />
                          )}
                        </td>
                        <td>=</td>
                        <td>
                          {isAutoValueActive ? (
                            <span>{valueResults[index-1]}</span>
                          ) : (
                            <input 
                              type="text" 
                              value={valueResults[index-1]} 
                              onChange={(e) => handleValueChange(index-1, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, index-1, 6)}
                              data-row={index-1} 
                              data-column="6"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Auto buttons row */}
                    <tr className="auto-buttons-row">
                      <td></td> {/* Node column - empty */}
                      <td></td> {/* Input column - empty */}
                      <td>
                        <button className={`auto-button ${isAutoNumericActive ? 'active' : ''}`} onClick={handleAutoNumeric}>
                          Auto
                        </button>
                      </td>
                      <td></td> {/* × column - empty */}
                      <td>
                        <button className={`auto-button ${isAutoWeightActive ? 'active' : ''}`} onClick={handleAutoWeight}>
                          Auto
                        </button>
                      </td>
                      <td></td> {/* = column - empty */}
                      <td>
                        <button className={`auto-button ${isAutoValueActive ? 'active' : ''}`} onClick={handleAutoValue}>
                          Auto
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {showUpdateWeightsTable && (
                <div className="update-weights-table-container">
                  <table className="update-weights-table">
                    <thead>
                      <tr>
                        <th>Node</th>
                        <th>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                        <tr key={index}>
                          <td>C{index}</td>
                          <td>
                            {isUpdateWeightsAutoActive ? (
                              <span>{updateWeightsValues[index-1]}</span>
                            ) : (
                              <input 
                                type="text" 
                                value={updateWeightsValues[index-1]} 
                                onChange={(e) => handleUpdateWeightChange(index-1, e.target.value)}
                                className="update-weight-input"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Auto button row for update weights table */}
                      <tr className="update-weights-auto-row">
                        <td></td> {/* Node column - empty */}
                        <td>
                          <button className={`auto-button ${isUpdateWeightsAutoActive ? 'active' : ''}`} onClick={handleUpdateWeightsAuto}>
                            Auto
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                            )}
            </div>
            )}
            
            {isOutputNodeExpanded && (
              <>
                <div className="orange-horizontal-line"></div>
            
            <div className="compute-decision-button-container">
              <button 
                className={`compute-decision-button ${showNetworkDecision ? 'selected' : ''}`}
                onClick={toggleNetworkDecision}
              >
                Compute the Network Decision
              </button>
            </div>

            {showNetworkDecision && (
              <div className="summary-table-container">
                <table className="summary-table">
                  <tbody>
                    <tr>
                      <td>Sum of (C) Node Values</td>
                      <td>Network Decision</td>
                    </tr>
                    <tr>
                      <td className={networkDecision === 'Red' ? 'summary-cell-red' : networkDecision === 'Green' ? 'summary-cell-green' : ''}>{sumOfValues}</td>
                      <td className={networkDecision === 'Red' ? 'summary-cell-red' : networkDecision === 'Green' ? 'summary-cell-green' : ''}>{networkDecision}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="summary-horizontal-line"></div>
            
            <div className="traffic-light-state-button-container">
              <button 
                className={`traffic-light-state-button ${showTrafficLight ? 'selected' : ''}`}
                onClick={toggleTrafficLight}
              >
                Traffic Light State
              </button>
            </div>

            {showTrafficLight && (
              <div className="traffic-light-display">
                <div className="traffic-light-housing">
                  <div
                    className={`traffic-light-red ${selectedButton === 'red' ? 'active' : 'inactive'}`}
                  >
                    {selectedButton === 'red' && <span className="traffic-light-letter">R</span>}
                  </div>
                  <div
                    className={`traffic-light-green ${selectedButton === 'green' ? 'active' : 'inactive'}`}
                  >
                    {selectedButton === 'green' && <span className="traffic-light-letter">G</span>}
                  </div>
                </div>
              </div>
            )}
              </>
            )}
            
            <div 
              className="summary-text-box"
              onClick={toggleSummary}
              style={{ cursor: 'pointer' }}
            >
              <span className="summary-text-box-content">Summary</span>
              <span className="expand-text">{isSummaryExpanded ? '(Collapse)' : '(Expand)'}</span>
            </div>
            
            {isSummaryExpanded && (
              <>
                <div className="summary-details-container">
                  <table className="summary-details-table">
                    <tbody>
                      <tr>
                        <td>Network Status</td>
                        <td>Sum</td>
                      </tr>
                      <tr>
                        <td>{networkStatus}</td>
                        <td>{sumOfValues}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="summary-table-horizontal-line"></div>
                
                <div className="bar-graph-container">
                  <h3 className="bar-graph-title">C Node Weights</h3>
                  <div className="bar-graph-wrapper">
                    <div className="bar-graph">
                      <div className="bar-graph-chart">
                        <div className="bar-graph-axes">
                          <div className="bar-graph-y-axis"></div>
                          <div className="bar-graph-zero-line"></div>
                          <div className="bars-container">
                            {weightValues.map((weight, index) => {
                              const weightNum = parseFloat(weight) || 0;
                              // Domain: [-120, 120], so 20 is a very small bar
                              const maxHeight = 100; // 100px for full scale (-120 to 120 range)
                              const barHeight = Math.max(1, Math.abs(weightNum / 120) * maxHeight); // Scale to -120 to 120 range
                              const isNegative = weightNum < 0;
                              
                              return (
                                <div key={index} className="bar-column">
                                  <div className="bar-wrapper">
                                    <div 
                                      className={`bar ${isNegative ? 'negative' : ''}`}
                                      style={{
                                        height: `${barHeight}px`,
                                        marginTop: isNegative ? `${100 + barHeight}px` : `${100 - barHeight}px`
                                      }}
                                    >
                                      <div className={`bar-value ${isNegative ? 'bar-value-negative' : ''}`}>
                                        {weightNum}
                                      </div>
                                      <div className={`bar-label ${isNegative ? 'bar-label-negative' : ''}`}>C{index + 1}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="update-weights-button-container">
                  <button className="update-weights-button" onClick={handleUpdateWeights}>
                    Update Weights
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="copyright-footer">
        © 2025 Stage One Education, LLC
      </div>
    </div>
  )
}

export default App
