import { useState } from 'react'
import './RightPanel.css'

function RightPanel({ editorMode, onToggleEditorMode, dimensions }) {
  const [copied, setCopied] = useState(false)

  const handleCopyDimensions = () => {
    if (!dimensions) return
    
    const dimensionText = `Page: ${dimensions.page}
Left: ${dimensions.left}%
Top: ${dimensions.top}%
Width: ${dimensions.width}%
Height: ${dimensions.height}%
Right: ${dimensions.right}%
Bottom: ${dimensions.bottom}%`
    
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

