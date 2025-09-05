import { useState } from 'react'
import './App.css'

function FeedbackData() {
  const [selectedWorkshop, setSelectedWorkshop] = useState('AI')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [columnWidths, setColumnWidths] = useState(Array(15).fill(150))
  const [isResizing, setIsResizing] = useState(false)
  const [resizeColumn, setResizeColumn] = useState(null)
  const [cellsLocked, setCellsLocked] = useState(false)
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [cellData, setCellData] = useState({})

  const handleMouseDown = (e, columnIndex) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeColumn(columnIndex)
    
    const startX = e.clientX
    const startWidth = columnWidths[columnIndex]
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX) // Minimum width of 50px
      
      setColumnWidths(prev => {
        const newWidths = [...prev]
        newWidths[columnIndex] = newWidth
        return newWidths
      })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCellMouseDown = (e, rowIndex, colIndex) => {
    if (cellsLocked) return
    
    // Don't prevent default if clicking on input
    if (e.target.tagName === 'INPUT') return
    
    e.preventDefault()
    const cellId = `${rowIndex}-${colIndex}`
    setIsSelecting(true)
    setSelectionStart({ row: rowIndex, col: colIndex })
    
    // Clear previous selection and select this cell
    setSelectedCells(new Set([cellId]))
    
    const handleMouseMove = (e) => {
      if (!isSelecting || !selectionStart) return
      
      // Get mouse position relative to the spreadsheet
      const spreadsheetContainer = document.querySelector('.spreadsheet-container')
      if (!spreadsheetContainer) return
      
      const rect = spreadsheetContainer.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate which cell the mouse is over
      const rowHeaderWidth = 50
      const cellHeight = 24
      const headerHeight = 24 // Approximate header height
      
      // Find the row
      let targetRow = Math.floor((mouseY - headerHeight) / cellHeight)
      if (targetRow < 0) targetRow = 0
      if (targetRow >= 1000) targetRow = 999
      
      // Find the column
      let targetCol = -1
      let currentX = rowHeaderWidth
      for (let i = 0; i < columnWidths.length; i++) {
        if (mouseX >= currentX && mouseX < currentX + columnWidths[i]) {
          targetCol = i
          break
        }
        currentX += columnWidths[i]
      }
      
      if (targetCol === -1) return
      
      // Create selection range
      const startRow = Math.min(selectionStart.row, targetRow)
      const endRow = Math.max(selectionStart.row, targetRow)
      const startCol = Math.min(selectionStart.col, targetCol)
      const endCol = Math.max(selectionStart.col, targetCol)
      
      const newSelection = new Set()
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          newSelection.add(`${r}-${c}`)
        }
      }
      setSelectedCells(newSelection)
    }
    
    const handleMouseUp = () => {
      setIsSelecting(false)
      setSelectionStart(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCellClick = (e, rowIndex, colIndex) => {
    if (cellsLocked) return
    
    // Don't handle clicks on input elements
    if (e.target.tagName === 'INPUT') return
    
    const cellId = `${rowIndex}-${colIndex}`
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + click: toggle selection
      setSelectedCells(prev => {
        const newSelection = new Set(prev)
        if (newSelection.has(cellId)) {
          newSelection.delete(cellId)
        } else {
          newSelection.add(cellId)
        }
        return newSelection
      })
    } else {
      // Regular click: select only this cell
      setSelectedCells(new Set([cellId]))
    }
  }

  const handleCellChange = (rowIndex, colIndex, value) => {
    const cellId = `${rowIndex}-${colIndex}`
    setCellData(prev => ({
      ...prev,
      [cellId]: value
    }))
  }

  const clearSelectedCells = () => {
    const newCellData = { ...cellData }
    selectedCells.forEach(cellId => {
      newCellData[cellId] = ''
    })
    setCellData(newCellData)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedCells.size > 0) {
        clearSelectedCells()
      }
    }
  }

  const renderCharts = () => {
    const workshopType = selectedWorkshop
    const barColors = ['#939393', '#b18983', '#c06958', '#d85b49', '#f05f40']
    
    return (
      <>
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 1</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">60</div>
                  <div className="chart-bar" style={{height: '60%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">80</div>
                  <div className="chart-bar" style={{height: '80%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">40</div>
                  <div className="chart-bar" style={{height: '40%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">90</div>
                  <div className="chart-bar" style={{height: '90%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">30</div>
                  <div className="chart-bar" style={{height: '30%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 2</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">70</div>
                  <div className="chart-bar" style={{height: '70%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">50</div>
                  <div className="chart-bar" style={{height: '50%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">85</div>
                  <div className="chart-bar" style={{height: '85%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">35</div>
                  <div className="chart-bar" style={{height: '35%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">95</div>
                  <div className="chart-bar" style={{height: '95%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 3</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">45</div>
                  <div className="chart-bar" style={{height: '45%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">65</div>
                  <div className="chart-bar" style={{height: '65%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">25</div>
                  <div className="chart-bar" style={{height: '25%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">75</div>
                  <div className="chart-bar" style={{height: '75%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">55</div>
                  <div className="chart-bar" style={{height: '55%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 4</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">55</div>
                  <div className="chart-bar" style={{height: '55%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">70</div>
                  <div className="chart-bar" style={{height: '70%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">35</div>
                  <div className="chart-bar" style={{height: '35%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">85</div>
                  <div className="chart-bar" style={{height: '85%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">45</div>
                  <div className="chart-bar" style={{height: '45%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
        </div>
        
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 5</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">80</div>
                  <div className="chart-bar" style={{height: '80%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">40</div>
                  <div className="chart-bar" style={{height: '40%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">90</div>
                  <div className="chart-bar" style={{height: '90%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">25</div>
                  <div className="chart-bar" style={{height: '25%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">65</div>
                  <div className="chart-bar" style={{height: '65%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 6</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">30</div>
                  <div className="chart-bar" style={{height: '30%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">75</div>
                  <div className="chart-bar" style={{height: '75%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">50</div>
                  <div className="chart-bar" style={{height: '50%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">95</div>
                  <div className="chart-bar" style={{height: '95%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">60</div>
                  <div className="chart-bar" style={{height: '60%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 7</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">65</div>
                  <div className="chart-bar" style={{height: '65%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">40</div>
                  <div className="chart-bar" style={{height: '40%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">80</div>
                  <div className="chart-bar" style={{height: '80%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">35</div>
                  <div className="chart-bar" style={{height: '35%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">70</div>
                  <div className="chart-bar" style={{height: '70%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 8</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">45</div>
                  <div className="chart-bar" style={{height: '45%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">85</div>
                  <div className="chart-bar" style={{height: '85%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">30</div>
                  <div className="chart-bar" style={{height: '30%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">75</div>
                  <div className="chart-bar" style={{height: '75%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">50</div>
                  <div className="chart-bar" style={{height: '50%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="app" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="header-bar">
        <div className="header-left">Workshop Feedback Data</div>
        <div className="header-center"></div>
        <div className="header-right">STAGE ONE EDUCATION</div>
      </header>
      
      <div className="workshop-buttons-container" style={{ marginTop: '40px' }}>
        <div className="workshop-buttons">
          <button 
            className={`workshop-btn ${selectedWorkshop === 'AI' ? 'active' : ''}`}
            onClick={() => setSelectedWorkshop('AI')}
          >
            AI Workshop
          </button>
          <button 
            className={`workshop-btn ${selectedWorkshop === 'Robotics' ? 'active' : ''}`}
            onClick={() => setSelectedWorkshop('Robotics')}
          >
            Robotics Workshop
          </button>
          <button 
            className={`workshop-btn ${selectedWorkshop === 'Mechanical' ? 'active' : ''}`}
            onClick={() => setSelectedWorkshop('Mechanical')}
          >
            Mechanical Workshop
          </button>
        </div>
      </div>
      
      <div className="spreadsheet-controls" style={{ marginTop: '40px', marginLeft: '20px', marginRight: '20px', marginBottom: '10px' }}>
        <label className="lock-cells-checkbox">
          <input 
            type="checkbox" 
            checked={cellsLocked}
            onChange={(e) => setCellsLocked(e.target.checked)}
          />
          Lock Cells
        </label>
      </div>
      
      <div className="spreadsheet-container" style={{ marginTop: '10px', marginLeft: '20px', marginRight: '20px' }}>
        <div className="spreadsheet">
          <div className="spreadsheet-header">
            <div className="row-header"></div>
            {selectedWorkshop === 'AI' ? (
              [
                'Date',
                'I did this workshop in',
                'I had fun in this workshop',
                'My favorite part of this workshop was',
                'This workshop challenged me appropriately',
                'Before this workshop my comfort with AI tools was',
                'After this workshop my comfort with AI tools was',
                'Before this workshop my understanding of neural networks was',
                'After this workshop my understanding of neural networks was',
                'Which workshop instructor did you learn the most from?',
                'The Stage One instructor(s) were well prepared',
                'The Stage One instructor(s) were knowledgeable',
                'How does this workshop compare to rest of the activities during your trip?',
                'Comments/Suggestions/Ideas (we will read everything you write)',
                ''
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : selectedWorkshop === 'Robotics' ? (
              [
                'Date',
                'I did this workshop in',
                'I had fun in this workshop',
                'My favorite part of this workshop was',
                'This workshop challenged me appropriately',
                'I learned how to build and understand basic electronic systems',
                'After taking this workshop I feel confident in starting another similar electronics project',
                'In the next electronics workshop I want to learn how to _______',
                'I would recommend that this workshop be taught again next year',
                'Which workshop instructor did you learn the most from?',
                'The Stage One instructor(s) were well prepared',
                'The Stage One instructor(s) were knowledgeable',
                'How does this workshop compare to rest of the activities during your trip?',
                'Comments/Suggestions/Ideas (we will read everything you write)',
                ''
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : selectedWorkshop === 'Mechanical' ? (
              [
                'Date',
                'I did this workshop in',
                'I had fun in this workshop',
                'My favorite part of this workshop was',
                'I am more knowledgeable about 3D design after this workshop',
                'I think I can design something using CAD on my own',
                'Something I\'d like to try designing next is',
                'The workshop was well paced',
                'I would recommend that this workshop be taught again next year',
                'Which workshop instructor did you learn the most from?',
                'The Stage One instructor(s) were well prepared',
                'The Stage One instructor(s) were knowledgeable',
                'How does this workshop compare to rest of the activities during your trip?',
                'Comments/Suggestions/Ideas (we will read everything you write)',
                ''
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : (
              Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            )}
          </div>
          <div className="spreadsheet-body">
            {Array.from({ length: 1000 }, (_, rowIndex) => (
              <div key={rowIndex} className="spreadsheet-row">
                <div className="row-number">{rowIndex + 1}</div>
                {Array.from({ length: 15 }, (_, colIndex) => {
                  const cellId = `${rowIndex}-${colIndex}`
                  const isSelected = selectedCells.has(cellId)
                  const cellValue = cellData[cellId] || ''
                  
                  return (
                    <div 
                      key={colIndex} 
                      className={`spreadsheet-cell ${isSelected ? 'selected' : ''}`}
                      style={{ width: columnWidths[colIndex] }}
                      data-row={rowIndex}
                      data-col={colIndex}
                      onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                      onClick={(e) => handleCellClick(e, rowIndex, colIndex)}
                    >
                      <input 
                        type="text" 
                        className="cell-input"
                        placeholder=""
                        disabled={cellsLocked}
                        value={cellValue}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <div className="footer-content">
          © 2025 Stage One Education, LLC
        </div>
      </footer>
    </div>
  )
}

export default FeedbackData
