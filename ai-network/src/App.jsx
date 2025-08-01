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
  const [previousValueResults, setPreviousValueResults] = useState(Array(9).fill('')) // track previous value results
  const [isAutoValueActive, setIsAutoValueActive] = useState(false) // track if auto value is active
  const [sumOfValues, setSumOfValues] = useState('') // track sum of C node values
  const [networkDecision, setNetworkDecision] = useState('') // track network decision
  const [roundNumber, setRoundNumber] = useState(1) // track current round
  const [networkStatus, setNetworkStatus] = useState('') // track if network decision is correct

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

  const handleInputChange = (index, value) => {
    const newSelections = [...inputSelections]
    newSelections[index] = value
    setInputSelections(newSelections)
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

  const calculateSummary = () => {
    // Calculate sum of all values
    const sum = valueResults.reduce((total, value) => {
      return total + (value === '' ? 0 : parseFloat(value))
    }, 0)
    
    setSumOfValues(sum.toString())
    
    // Determine network decision
    if (sum > 0) {
      setNetworkDecision('Green')
    } else if (sum < 0) {
      setNetworkDecision('Red')
    } else {
      setNetworkDecision('Undecided')
    }

    // Determine network status
    if (sum === 0) {
      setNetworkStatus('Undecided')
    } else if (selectedButton === 'red' && networkDecision === 'Red') {
      setNetworkStatus('Correct')
    } else if (selectedButton === 'green' && networkDecision === 'Green') {
      setNetworkStatus('Correct')
    } else if (selectedButton === 'red' && networkDecision === 'Green') {
      setNetworkStatus('Incorrect')
    } else if (selectedButton === 'green' && networkDecision === 'Red') {
      setNetworkStatus('Incorrect')
    } else {
      setNetworkStatus('')
    }
  }

  useEffect(() => {
    calculateSummary()
  }, [valueResults])

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
      {/* Header Bar */}
      <header className="header-bar">
        <div className="header-content">
          <span className="header-bold">STAGE ONE EDUCATION</span>
          <div className="header-divider"></div>
          <span className="header-regular">Artificial Intelligence Workshop</span>
        </div>
      </header>

      <div className="main-content">
        <div className="title-section">
          <h2 className="round-title">Round 1</h2>
          <h3 className="network-title">Human Neural Network - 27</h3>
          <div className="horizontal-line"></div>
          <div className="image-container">
            <img src="/27-nn.png" alt="27 participant human neural network" className="content-image" />
          </div>
          <div className="text-box">
            <span className="text-box-content">Sensor Nodes (A)</span>
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
          <div className="hide-button-container">
            <button 
              className={`hide-button ${isHidden ? 'selected' : ''}`}
              onClick={toggleHide}
            >
              {isHidden ? 'Show Traffic Light' : 'Hide Traffic Light'}
            </button>
          </div>
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
          <div className="hidden-layer-text-box">
            <span className="hidden-layer-text-content">Hidden Layer Nodes (B&C)</span>
          </div>
          <div className="node-instructions">
            <p className="b-node-instruction">(B) Nodes: Write down sensor input and roll the dice</p>
            <p className="c-node-instruction">(C) Nodes: Find your connections, write down your input, and roll the dice</p>
          </div>
          <div className="output-text-box">
            <span className="output-text-box-content">Output Node (OUT)</span>
          </div>
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
                <tr>
                  <td>C1</td>
                  <td className={inputSelections[0] === 'red' ? 'input-cell-red' : inputSelections[0] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[0]} 
                      onChange={(e) => handleInputChange(0, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 0, 1)}
                      data-row="0" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[0]} 
                      onChange={(e) => handleNumericChange(0, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 0, 2)}
                      data-row="0" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[0]} 
                      onChange={(e) => handleWeightChange(0, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 0, 4)}
                      data-row="0" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[0]} 
                      onChange={(e) => handleValueChange(0, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 0, 6)}
                      data-row="0" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C2</td>
                  <td className={inputSelections[1] === 'red' ? 'input-cell-red' : inputSelections[1] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[1]} 
                      onChange={(e) => handleInputChange(1, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 1, 1)}
                      data-row="1" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[1]} 
                      onChange={(e) => handleNumericChange(1, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 1, 2)}
                      data-row="1" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[1]} 
                      onChange={(e) => handleWeightChange(1, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 1, 4)}
                      data-row="1" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[1]} 
                      onChange={(e) => handleValueChange(1, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 1, 6)}
                      data-row="1" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C3</td>
                  <td className={inputSelections[2] === 'red' ? 'input-cell-red' : inputSelections[2] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[2]} 
                      onChange={(e) => handleInputChange(2, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 2, 1)}
                      data-row="2" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[2]} 
                      onChange={(e) => handleNumericChange(2, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 2, 2)}
                      data-row="2" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[2]} 
                      onChange={(e) => handleWeightChange(2, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 2, 4)}
                      data-row="2" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[2]} 
                      onChange={(e) => handleValueChange(2, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 2, 6)}
                      data-row="2" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C4</td>
                  <td className={inputSelections[3] === 'red' ? 'input-cell-red' : inputSelections[3] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[3]} 
                      onChange={(e) => handleInputChange(3, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 3, 1)}
                      data-row="3" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[3]} 
                      onChange={(e) => handleNumericChange(3, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 3, 2)}
                      data-row="3" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[3]} 
                      onChange={(e) => handleWeightChange(3, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 3, 4)}
                      data-row="3" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[3]} 
                      onChange={(e) => handleValueChange(3, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 3, 6)}
                      data-row="3" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C5</td>
                  <td className={inputSelections[4] === 'red' ? 'input-cell-red' : inputSelections[4] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[4]} 
                      onChange={(e) => handleInputChange(4, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 4, 1)}
                      data-row="4" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[4]} 
                      onChange={(e) => handleNumericChange(4, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 4, 2)}
                      data-row="4" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[4]} 
                      onChange={(e) => handleWeightChange(4, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 4, 4)}
                      data-row="4" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[4]} 
                      onChange={(e) => handleValueChange(4, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 4, 6)}
                      data-row="4" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C6</td>
                  <td className={inputSelections[5] === 'red' ? 'input-cell-red' : inputSelections[5] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[5]} 
                      onChange={(e) => handleInputChange(5, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 5, 1)}
                      data-row="5" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[5]} 
                      onChange={(e) => handleNumericChange(5, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 5, 2)}
                      data-row="5" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[5]} 
                      onChange={(e) => handleWeightChange(5, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 5, 4)}
                      data-row="5" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[5]} 
                      onChange={(e) => handleValueChange(5, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 5, 6)}
                      data-row="5" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C7</td>
                  <td className={inputSelections[6] === 'red' ? 'input-cell-red' : inputSelections[6] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[6]} 
                      onChange={(e) => handleInputChange(6, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 6, 1)}
                      data-row="6" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[6]} 
                      onChange={(e) => handleNumericChange(6, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 6, 2)}
                      data-row="6" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[6]} 
                      onChange={(e) => handleWeightChange(6, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 6, 4)}
                      data-row="6" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[6]} 
                      onChange={(e) => handleValueChange(6, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 6, 6)}
                      data-row="6" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C8</td>
                  <td className={inputSelections[7] === 'red' ? 'input-cell-red' : inputSelections[7] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[7]} 
                      onChange={(e) => handleInputChange(7, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 7, 1)}
                      data-row="7" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[7]} 
                      onChange={(e) => handleNumericChange(7, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 7, 2)}
                      data-row="7" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[7]} 
                      onChange={(e) => handleWeightChange(7, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 7, 4)}
                      data-row="7" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[7]} 
                      onChange={(e) => handleValueChange(7, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 7, 6)}
                      data-row="7" 
                      data-column="6"
                    />
                  </td>
                </tr>
                <tr>
                  <td>C9</td>
                  <td className={inputSelections[8] === 'red' ? 'input-cell-red' : inputSelections[8] === 'green' ? 'input-cell-green' : ''}>
                    <select 
                      value={inputSelections[8]} 
                      onChange={(e) => handleInputChange(8, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 8, 1)}
                      data-row="8" 
                      data-column="1"
                    >
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      value={numericValues[8]} 
                      onChange={(e) => handleNumericChange(8, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 8, 2)}
                      data-row="8" 
                      data-column="2"
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="-1">-1</option>
                    </select>
                  </td>
                  <td>×</td>
                  <td>
                    <input 
                      type="text" 
                      value={weightValues[8]} 
                      onChange={(e) => handleWeightChange(8, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 8, 4)}
                      data-row="8" 
                      data-column="4"
                    />
                  </td>
                  <td>=</td>
                  <td>
                    <input 
                      type="text" 
                      value={valueResults[8]} 
                      onChange={(e) => handleValueChange(8, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 8, 6)}
                      data-row="8" 
                      data-column="6"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="auto-buttons-container">
            <div className="auto-button-column">
              <button className={`auto-button ${isAutoNumericActive ? 'active' : ''}`} onClick={handleAutoNumeric}>
                Auto
              </button>
            </div>
            <div className="auto-button-column">
              <button className={`auto-button ${isAutoWeightActive ? 'active' : ''}`} onClick={handleAutoWeight}>
                Auto
              </button>
            </div>
            <div className="auto-button-column">
              <button className={`auto-button ${isAutoValueActive ? 'active' : ''}`} onClick={handleAutoValue}>
                Auto
              </button>
            </div>
          </div>
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
          <div className="summary-text-box">
            <span className="summary-text-box-content">Summary</span>
          </div>
          <div className="summary-details-container">
            <table className="summary-details-table">
              <tbody>
                <tr>
                  <td>Round</td>
                  <td>Network Status</td>
                  <td>Sum</td>
                </tr>
                <tr>
                  <td>{roundNumber}</td>
                  <td>{networkStatus}</td>
                  <td>{sumOfValues}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
