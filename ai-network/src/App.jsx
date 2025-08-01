import { useState } from 'react'
import './App.css'

function App() {
  const [lightStates, setLightStates] = useState([false, false, false]) // [top, middle, bottom]
  const [selectedButton, setSelectedButton] = useState(null) // 'red' or 'green' or null
  const [isHidden, setIsHidden] = useState(false) // to track if traffic light section is hidden
  const [circleColors, setCircleColors] = useState(Array(12).fill('gray')) // track circle colors
  const [showCode, setShowCode] = useState(false) // to track if code/probabilities are shown
  const [hasRunRound1, setHasRunRound1] = useState(false) // to track if Run Round 1 has been executed
  const [inputSelections, setInputSelections] = useState(Array(9).fill('')) // track dropdown selections for C1-C9
  const [numericValues, setNumericValues] = useState(Array(9).fill('')) // track numeric input values for C1-C9

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
                  <th>X</th>
                  <th>Weight</th>
                  <th>=</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>C1</td>
                  <td className={inputSelections[0] === 'red' ? 'input-cell-red' : inputSelections[0] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[0]} onChange={(e) => handleInputChange(0, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[0]} 
                      onChange={(e) => handleNumericChange(0, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C2</td>
                  <td className={inputSelections[1] === 'red' ? 'input-cell-red' : inputSelections[1] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[1]} onChange={(e) => handleInputChange(1, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[1]} 
                      onChange={(e) => handleNumericChange(1, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C3</td>
                  <td className={inputSelections[2] === 'red' ? 'input-cell-red' : inputSelections[2] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[2]} onChange={(e) => handleInputChange(2, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[2]} 
                      onChange={(e) => handleNumericChange(2, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C4</td>
                  <td className={inputSelections[3] === 'red' ? 'input-cell-red' : inputSelections[3] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[3]} onChange={(e) => handleInputChange(3, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[3]} 
                      onChange={(e) => handleNumericChange(3, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C5</td>
                  <td className={inputSelections[4] === 'red' ? 'input-cell-red' : inputSelections[4] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[4]} onChange={(e) => handleInputChange(4, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[4]} 
                      onChange={(e) => handleNumericChange(4, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C6</td>
                  <td className={inputSelections[5] === 'red' ? 'input-cell-red' : inputSelections[5] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[5]} onChange={(e) => handleInputChange(5, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[5]} 
                      onChange={(e) => handleNumericChange(5, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C7</td>
                  <td className={inputSelections[6] === 'red' ? 'input-cell-red' : inputSelections[6] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[6]} onChange={(e) => handleInputChange(6, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[6]} 
                      onChange={(e) => handleNumericChange(6, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C8</td>
                  <td className={inputSelections[7] === 'red' ? 'input-cell-red' : inputSelections[7] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[7]} onChange={(e) => handleInputChange(7, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[7]} 
                      onChange={(e) => handleNumericChange(7, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>C9</td>
                  <td className={inputSelections[8] === 'red' ? 'input-cell-red' : inputSelections[8] === 'green' ? 'input-cell-green' : ''}>
                    <select value={inputSelections[8]} onChange={(e) => handleInputChange(8, e.target.value)}>
                      <option value="">Select</option>
                      <option value="red">Red</option>
                      <option value="green">Green</option>
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={numericValues[8]} 
                      onChange={(e) => handleNumericChange(8, e.target.value)}
                      placeholder="Enter value"
                    />
                  </td>
                  <td></td>
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
