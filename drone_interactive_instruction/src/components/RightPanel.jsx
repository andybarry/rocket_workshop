import { useState } from 'react'
import './RightPanel.css'
import page1 from '../assets/images/pages/1.png'
import page2 from '../assets/images/pages/2.png'
import page3 from '../assets/images/pages/3.png'
import page4 from '../assets/images/pages/4.png'
import page5 from '../assets/images/pages/5.png'
import page5_1 from '../assets/images/pages/5.1.png'
import page6 from '../assets/images/pages/6.png'
import page7 from '../assets/images/pages/7.png'
import page7_1 from '../assets/images/pages/7.1.png'
import page8 from '../assets/images/pages/8.png'
import page8_1 from '../assets/images/pages/8.1.png'
import page9 from '../assets/images/pages/9.png'
import page10 from '../assets/images/pages/10.png'
import page10_1 from '../assets/images/pages/10.1.png'
import page11 from '../assets/images/pages/11.png'
import page12 from '../assets/images/pages/12.png'
import page12_1 from '../assets/images/pages/12.1.png'
import page13 from '../assets/images/pages/13.png'
import page14 from '../assets/images/pages/14.png'
import page15 from '../assets/images/pages/15.png'
import page15_1 from '../assets/images/pages/15.1.png'
import page16 from '../assets/images/pages/16.png'
import page17 from '../assets/images/pages/17.png'
import page18 from '../assets/images/pages/18.png'
import page18_1 from '../assets/images/pages/18.1.png'
import page19 from '../assets/images/pages/19.png'
import page20 from '../assets/images/pages/20.png'
import page21 from '../assets/images/pages/21.png'
import page21_1 from '../assets/images/pages/21.1.png'
import page22 from '../assets/images/pages/22.png'
import page23 from '../assets/images/pages/23.png'
import page23_1 from '../assets/images/pages/23.1.png'
import page24 from '../assets/images/pages/24.png'
import page24_1 from '../assets/images/pages/24.1.png'
import page25 from '../assets/images/pages/25.png'
import page26 from '../assets/images/pages/26.png'
import page27 from '../assets/images/pages/27.png'
import page27_1 from '../assets/images/pages/27.1.png'
import page27_2 from '../assets/images/pages/27.2.png'
import page27_3 from '../assets/images/pages/27.3.png'
import page27_4 from '../assets/images/pages/27.4.png'
import page27_5 from '../assets/images/pages/27.5.png'
import page28 from '../assets/images/pages/28.png'
import page29 from '../assets/images/pages/29.png'
import page30 from '../assets/images/pages/30.png'
import page31 from '../assets/images/pages/31.png'
import page32 from '../assets/images/pages/32.png'
import page33 from '../assets/images/pages/33.png'
import page34 from '../assets/images/pages/34.png'

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
            <div className="image-selector-item" onClick={() => onPageSelect(0, false, false, false, false)}>
              <img src={page1} alt="Page 1" className="image-selector-thumbnail" />
              <span className="image-selector-label">1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(1, false, false, false, false)}>
              <img src={page2} alt="Page 2" className="image-selector-thumbnail" />
              <span className="image-selector-label">2.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(2, false, false, false, false)}>
              <img src={page3} alt="Page 3" className="image-selector-thumbnail" />
              <span className="image-selector-label">3.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(3, false, false, false, false)}>
              <img src={page4} alt="Page 4" className="image-selector-thumbnail" />
              <span className="image-selector-label">4.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(4, false, false, false, false)}>
              <img src={page5} alt="Page 5" className="image-selector-thumbnail" />
              <span className="image-selector-label">5.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(4, false, false, false, false, false, true)}>
              <img src={page5_1} alt="Page 5.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">5.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(5, false, false, false, false)}>
              <img src={page6} alt="Page 6" className="image-selector-thumbnail" />
              <span className="image-selector-label">6.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(6, false, false, false, false)}>
              <img src={page7} alt="Page 7" className="image-selector-thumbnail" />
              <span className="image-selector-label">7.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(6, true, false, false, false)}>
              <img src={page7_1} alt="Page 7.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">7.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(7, false, false, false, false)}>
              <img src={page8} alt="Page 8" className="image-selector-thumbnail" />
              <span className="image-selector-label">8.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(7, false, true, false, false)}>
              <img src={page8_1} alt="Page 8.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">8.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(8, false, false, false, false)}>
              <img src={page9} alt="Page 9" className="image-selector-thumbnail" />
              <span className="image-selector-label">9.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(9, false, false, true, false)}>
              <img src={page10_1} alt="Page 10.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">10.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(9, false, false, false, true)}>
              <img src={page10} alt="Page 10" className="image-selector-thumbnail" />
              <span className="image-selector-label">10.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(10, false, false, false, false)}>
              <img src={page11} alt="Page 11" className="image-selector-thumbnail" />
              <span className="image-selector-label">11.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(11, false, false, false, false)}>
              <img src={page12} alt="Page 12" className="image-selector-thumbnail" />
              <span className="image-selector-label">12.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(11, false, false, false, false, true)}>
              <img src={page12_1} alt="Page 12.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">12.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(12, false, false, false, false)}>
              <img src={page13} alt="Page 13" className="image-selector-thumbnail" />
              <span className="image-selector-label">13.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(13, false, false, false, false)}>
              <img src={page14} alt="Page 14" className="image-selector-thumbnail" />
              <span className="image-selector-label">14.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(14, false, false, false, false)}>
              <img src={page15_1} alt="Page 15.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">15.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(14, false, false, false, false, true)}>
              <img src={page15} alt="Page 15" className="image-selector-thumbnail" />
              <span className="image-selector-label">15.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(15, false, false, false, false)}>
              <img src={page16} alt="Page 16" className="image-selector-thumbnail" />
              <span className="image-selector-label">16.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(16, false, false, false, false)}>
              <img src={page17} alt="Page 17" className="image-selector-thumbnail" />
              <span className="image-selector-label">17.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(17, false, false, false, false)}>
              <img src={page18} alt="Page 18" className="image-selector-thumbnail" />
              <span className="image-selector-label">18.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(17, false, false, false, false, false, false, true)}>
              <img src={page18_1} alt="Page 18.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">18.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(18, false, false, false, false)}>
              <img src={page19} alt="Page 19" className="image-selector-thumbnail" />
              <span className="image-selector-label">19.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(19, false, false, false, false)}>
              <img src={page20} alt="Page 20" className="image-selector-thumbnail" />
              <span className="image-selector-label">20.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(20, false, false, false, false, false, false, false, false, true)}>
              <img src={page21} alt="Page 21" className="image-selector-thumbnail" />
              <span className="image-selector-label">21.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(20, false, false, false, false, false, false, false, true)}>
              <img src={page21_1} alt="Page 21.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">21.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(21, false, false, false, false)}>
              <img src={page22} alt="Page 22" className="image-selector-thumbnail" />
              <span className="image-selector-label">22.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(22, false, false, false, false)}>
              <img src={page23} alt="Page 23" className="image-selector-thumbnail" />
              <span className="image-selector-label">23.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(22, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page23_1} alt="Page 23.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">23.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(23, false, false, false, false)}>
              <img src={page24} alt="Page 24" className="image-selector-thumbnail" />
              <span className="image-selector-label">24.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(23, false, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page24_1} alt="Page 24.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">24.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(24, false, false, false, false)}>
              <img src={page25} alt="Page 25" className="image-selector-thumbnail" />
              <span className="image-selector-label">25.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(25, false, false, false, false)}>
              <img src={page26} alt="Page 26" className="image-selector-thumbnail" />
              <span className="image-selector-label">26.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(26, false, false, false, false)}>
              <img src={page27} alt="Page 27" className="image-selector-thumbnail" />
              <span className="image-selector-label">27.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(26, false, false, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page27_1} alt="Page 27.1" className="image-selector-thumbnail" />
              <span className="image-selector-label">27.1.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(26, false, false, false, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page27_2} alt="Page 27.2" className="image-selector-thumbnail" />
              <span className="image-selector-label">27.2.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(26, false, false, false, false, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page27_3} alt="Page 27.3" className="image-selector-thumbnail" />
              <span className="image-selector-label">27.3.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(26, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page27_4} alt="Page 27.4" className="image-selector-thumbnail" />
              <span className="image-selector-label">27.4.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(26, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true)}>
              <img src={page27_5} alt="Page 27.5" className="image-selector-thumbnail" />
              <span className="image-selector-label">27.5.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(27, false, false, false, false)}>
              <img src={page28} alt="Page 28" className="image-selector-thumbnail" />
              <span className="image-selector-label">28.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(28, false, false, false, false)}>
              <img src={page29} alt="Page 29" className="image-selector-thumbnail" />
              <span className="image-selector-label">29.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(29, false, false, false, false)}>
              <img src={page30} alt="Page 30" className="image-selector-thumbnail" />
              <span className="image-selector-label">30.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(30, false, false, false, false)}>
              <img src={page31} alt="Page 31" className="image-selector-thumbnail" />
              <span className="image-selector-label">31.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(31, false, false, false, false)}>
              <img src={page32} alt="Page 32" className="image-selector-thumbnail" />
              <span className="image-selector-label">32.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(32, false, false, false, false)}>
              <img src={page33} alt="Page 33" className="image-selector-thumbnail" />
              <span className="image-selector-label">33.png</span>
            </div>
            <div className="image-selector-item" onClick={() => onPageSelect(33, false, false, false, false)}>
              <img src={page34} alt="Page 34" className="image-selector-thumbnail" />
              <span className="image-selector-label">34.png</span>
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

