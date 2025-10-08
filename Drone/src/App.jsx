import { useState } from 'react'
import DroneInstructions from './DroneInstructions.jsx'
import BoxPositioningTool from './BoxPositioningTool.jsx'
import './DroneInstructions.css'

function App() {
  // Toggle between positioning tool and actual instructions
  const [showPositioningTool, setShowPositioningTool] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  return (
    <div className="App">
      <button 
        onClick={() => setShowPositioningTool(!showPositioningTool)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 10000,
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}
      >
        {showPositioningTool ? 'Show Instructions' : 'Show Positioning Tool'}
      </button>

      {/* Zoom Controls - always visible */}
      <div style={{
        position: 'fixed',
        top: '70px',
        left: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button 
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          style={{
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            opacity: zoomLevel >= 3 ? 0.5 : 1
          }}
        >
          🔍+ Zoom In
        </button>
        <button 
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          style={{
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: zoomLevel <= 0.5 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            opacity: zoomLevel <= 0.5 ? 0.5 : 1
          }}
        >
          🔍- Zoom Out
        </button>
        <button 
          onClick={handleResetZoom}
          disabled={zoomLevel === 1}
          style={{
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: zoomLevel === 1 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            opacity: zoomLevel === 1 ? 0.5 : 1,
            fontSize: '12px'
          }}
        >
          Reset {Math.round(zoomLevel * 100)}%
        </button>
      </div>
      
      {showPositioningTool ? <BoxPositioningTool zoomLevel={zoomLevel} /> : <DroneInstructions zoomLevel={zoomLevel} />}
    </div>
  )
}

export default App
