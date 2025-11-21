import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import InstructionsPanel from './InstructionsPanel'
import MiddlePanel from './MiddlePanel'
import RightPanel from './RightPanel'

function ResizablePanels() {
  const [editorMode, setEditorMode] = useState(false)
  const [capturedDimensions, setCapturedDimensions] = useState(null)

  return (
    <PanelGroup direction="horizontal" className="panel-group">
      <Panel defaultSize={33} minSize={20}>
        <InstructionsPanel 
          editorMode={editorMode}
          onDimensionsCapture={setCapturedDimensions}
        />
      </Panel>
      <PanelResizeHandle className="panel-resize-handle" />
      <Panel defaultSize={33} minSize={20}>
        <MiddlePanel />
      </Panel>
      <PanelResizeHandle className="panel-resize-handle" />
      <Panel defaultSize={34} minSize={20}>
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

