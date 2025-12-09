import { useState } from 'react'
import './RightPanel.css'
import page1 from '../assets/images/pages/1.png'
import page2 from '../assets/images/pages/2.png'
import page3 from '../assets/images/pages/3.png'
import page4 from '../assets/images/pages/4.png'
import page5 from '../assets/images/pages/5.png'
import page6 from '../assets/images/pages/6.png'
import page7 from '../assets/images/pages/7.png'
import page7_1 from '../assets/images/pages/7.1.png'
import page8 from '../assets/images/pages/8.png'
import page9 from '../assets/images/pages/9.png'
import page10 from '../assets/images/pages/10.png'
import page10_1 from '../assets/images/pages/10.1.png'
import page11 from '../assets/images/pages/11.png'
import page12 from '../assets/images/pages/12.png'
import page13 from '../assets/images/pages/13.png'
import page14 from '../assets/images/pages/14.png'

function RightPanel({ editorMode, onToggleEditorMode, dimensions, onRefresh, onPageSelect }) {
  const [copied, setCopied] = useState(false)

  const handleCopyDimensions = () => {
    if (!dimensions) return
    
    let dimensionText = `Page: ${dimensions.page}
Left: ${dimensions.left}%
Top: ${dimensions.top}%
Width: ${dimensions.width}%
Height: ${dimensions.height}%
Right: ${dimensions.right}%
Bottom: ${dimensions.bottom}%`
    
    if (dimensions.dot1) {
      dimensionText += `
Dot 1 X: ${dimensions.dot1.x}%
Dot 1 Y: ${dimensions.dot1.y}%
Dot 1 Perimeter: ${dimensions.dot1.perimeter}%`
    }
    
    if (dimensions.dot2) {
      dimensionText += `
Dot 2 X: ${dimensions.dot2.x}%
Dot 2 Y: ${dimensions.dot2.y}%
Dot 2 Perimeter: ${dimensions.dot2.perimeter}%`
    }
    
    if (dimensions.dot3) {
      dimensionText += `
Dot 3 X: ${dimensions.dot3.x}%
Dot 3 Y: ${dimensions.dot3.y}%`
    }
    
    navigator.clipboard.writeText(dimensionText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const getDimensionJSON = () => {
    if (!dimensions) return ''
    return JSON.stringify(dimensions, null, 2)
  }

  return (
    <div className="right-panel">
      <div className="right-panel-content">
        <div className="editor-controls">
          <button
            onClick={() => onToggleEditorMode(!editorMode)}
            className={`editor-toggle-btn ${editorMode ? 'active' : ''}`}
          >
            {editorMode ? 'Exit Editor' : 'Editor Mode'}
          </button>
          {/* Development feature - remove before public release */}
          <button
            onClick={onRefresh}
            className="refresh-btn"
          >
            Refresh
          </button>
        </div>
        
        {/* Development feature - image selector - remove before public release */}
        <div className="image-selector-container">
          <h4 className="image-selector-title">Jump to Page</h4>
          <div className="image-selector-scroll">
            <div className="image-selector-item" onClick={() => onPageSelect(0, false)}>
              <img src={page1} alt="Page 1" className="image-selector-thumbnail" />
              <span className="image-selector-label">1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(1, false)}>
              <img src={page2} alt="Page 2" className="image-selector-thumbnail" />
              <span className="image-selector-label">2.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(2, false)}>
              <img src={page3} alt="Page 3" className="image-selector-thumbnail" />
              <span className="image-selector-label">3.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(3, false)}>
              <img src={page4} alt="Page 4" className="image-selector-thumbnail" />
              <span className="image-selector-label">4.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(4, false)}>
              <img src={page5} alt="Page 5" className="image-selector-thumbnail" />
              <span className="image-selector-label">5.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(5, false)}>
              <img src={page6} alt="Page 6" className="image-selector-thumbnail" />
              <span className="image-selector-label">6.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(6, false)}>
              <img src={page7} alt="Page 7" className="image-selector-thumbnail" />
              <span className="image-selector-label">7.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(6, true)}>
              <img src={page7_1} alt="Page 7.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">7.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(7, false)}>
              <img src={page8} alt="Page 8" className="image-selector-thumbnail" />
              <span className="image-selector-label">8.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(8, false)}>
              <img src={page9} alt="Page 9" className="image-selector-thumbnail" />
              <span className="image-selector-label">9.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(9, false, true)}>
              <img src={page10_1} alt="Page 10.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">10.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(9, false, false, true)}>
              <img src={page10} alt="Page 10" className="image-selector-thumbnail" />
              <span className="image-selector-label">10.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(10, false)}>
              <img src={page11} alt="Page 11" className="image-selector-thumbnail" />
              <span className="image-selector-label">11.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(11, false)}>
              <img src={page12} alt="Page 12" className="image-selector-thumbnail" />
              <span className="image-selector-label">12.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(12, false)}>
              <img src={page13} alt="Page 13" className="image-selector-thumbnail" />
              <span className="image-selector-label">13.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(13, false)}>
              <img src={page14} alt="Page 14" className="image-selector-thumbnail" />
              <span className="image-selector-label">14.png</span>
            </div>
          </div>
        </div>
        
        {editorMode && (
          <>
            <div className="editor-info">
              <h3>Editor Mode Active</h3>
              <p>Drag the box to move it, drag handles to resize</p>
            </div>
            
            {dimensions && (
              <div className="dimensions-display">
                <h3>Captured Dimensions</h3>
                <div className="dimension-info">
                  <div className="dimension-item">
                    <label>Page:</label>
                    <span>{dimensions.page}</span>
                  </div>
                  <div className="dimension-item">
                    <label>Left:</label>
                    <span>{dimensions.left}%</span>
                  </div>
                  <div className="dimension-item">
                    <label>Top:</label>
                    <span>{dimensions.top}%</span>
                  </div>
                  <div className="dimension-item">
                    <label>Width:</label>
                    <span>{dimensions.width}%</span>
                  </div>
                  <div className="dimension-item">
                    <label>Height:</label>
                    <span>{dimensions.height}%</span>
                  </div>
                  <div className="dimension-item">
                    <label>Right:</label>
                    <span>{dimensions.right}%</span>
                  </div>
                  <div className="dimension-item">
                    <label>Bottom:</label>
                    <span>{dimensions.bottom}%</span>
                  </div>
                  {dimensions.dot1 && (
                    <>
                      <div className="dimension-item">
                        <label>Dot 1 X:</label>
                        <span>{dimensions.dot1.x}%</span>
                      </div>
                      <div className="dimension-item">
                        <label>Dot 1 Y:</label>
                        <span>{dimensions.dot1.y}%</span>
                      </div>
                      <div className="dimension-item">
                        <label>Dot 1 Perimeter:</label>
                        <span>{dimensions.dot1.perimeter}%</span>
                      </div>
                    </>
                  )}
                  {dimensions.dot2 && (
                    <>
                      <div className="dimension-item">
                        <label>Dot 2 X:</label>
                        <span>{dimensions.dot2.x}%</span>
                      </div>
                      <div className="dimension-item">
                        <label>Dot 2 Y:</label>
                        <span>{dimensions.dot2.y}%</span>
                      </div>
                      <div className="dimension-item">
                        <label>Dot 2 Perimeter:</label>
                        <span>{dimensions.dot2.perimeter}%</span>
                      </div>
                    </>
                  )}
                  {dimensions.dot3 && (
                    <>
                      <div className="dimension-item">
                        <label>Dot 3 X:</label>
                        <span>{dimensions.dot3.x}%</span>
                      </div>
                      <div className="dimension-item">
                        <label>Dot 3 Y:</label>
                        <span>{dimensions.dot3.y}%</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="dimension-actions">
                  <button
                    onClick={handleCopyDimensions}
                    className="copy-dimensions-btn"
                  >
                    {copied ? 'Copied!' : 'Copy Dimensions'}
                  </button>
                </div>
                
                <div className="dimension-json">
                  <h4>JSON Format:</h4>
                  <pre>{getDimensionJSON()}</pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RightPanel

