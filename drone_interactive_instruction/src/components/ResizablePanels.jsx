import { useState, useRef } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import InstructionsPanel from './InstructionsPanel'
import MiddlePanel from './MiddlePanel'
import RightPanel from './RightPanel'

function ResizablePanels() {
  const [editorMode, setEditorMode] = useState(false)
  const [capturedDimensions, setCapturedDimensions] = useState(null)
  
  // Refs for each panel to control their sizes
  const leftPanelRef = useRef(null)
  const middlePanelRef = useRef(null)
  const rightPanelRef = useRef(null)

  // Function to reset all panels to equal spacing (33.33% each)
  const handleDoubleClickReset = () => {
    if (leftPanelRef.current && middlePanelRef.current && rightPanelRef.current) {
      // Reset all panels to approximately equal size
      // Using 33.33% for first two and 33.34% for the last to account for rounding
      leftPanelRef.current.resize(33.33)
      middlePanelRef.current.resize(33.33)
      rightPanelRef.current.resize(33.34)
    }
  }

  return (
    <PanelGroup direction="horizontal" className="panel-group">
      <Panel ref={leftPanelRef} defaultSize={33} minSize={20}>
        <InstructionsPanel 
          editorMode={editorMode}
          onDimensionsCapture={setCapturedDimensions}
        />
      </Panel>
      <PanelResizeHandle 
        className="panel-resize-handle" 
        onDoubleClick={handleDoubleClickReset}
        title="Double-click to reset panels to equal width"
      />
      <Panel ref={middlePanelRef} defaultSize={33} minSize={20}>
        <MiddlePanel />
      </Panel>
      <PanelResizeHandle 
        className="panel-resize-handle" 
        onDoubleClick={handleDoubleClickReset}
        title="Double-click to reset panels to equal width"
      />
      <Panel ref={rightPanelRef} defaultSize={34} minSize={20}>
        <RightPanel 
          editorMode={editorMode}
          onToggleEditorMode={setEditorMode}
          dimensions={capturedDimensions}
        />
      </Panel>
    </PanelGroup>
  )
}

export default ResizablePanels

