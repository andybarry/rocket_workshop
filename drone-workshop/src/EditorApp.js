import React, { useState, useRef } from 'react';
import { Split } from '@geoffcox/react-splitter';
import InstructionsPanel from './components/InstructionsPanel';
import EditorPanel from './components/EditorPanel';
import './App.css';

function EditorApp() {
  const [editorMode, setEditorMode] = useState(true);
  const [capturedDimensions, setCapturedDimensions] = useState(null);
  const refreshHandlerRef = useRef(null);
  const pageSelectHandlerRef = useRef(null);

  return (
    <div>
      <div
        style={{
          alignItems: 'center',
          backgroundColor: "#f05f40ff",
        }}>

        <div className="orange-bar">
          <h1 className="stageone-heading">
            <span className="stageone-education">Robotics Workshop</span>
            <span className="drone-workshop"> | Editor Mode</span>
          </h1>

          <span className="stageone-org">STAGE ONE EDUCATION</span>
        </div>

        <div className="download-links">
          <a href="/" style={{ marginLeft: '15px' }}>← Back to Workshop</a>
        </div>
      </div>

      <Split initialPrimarySize={"65vw"} minPrimarySize={"30vw"} minSecondarySize={"20vw"}>
        <div style={{ height: 'calc(100vh - 58px)' }}>
          <InstructionsPanel 
            editorMode={editorMode}
            onDimensionsCapture={setCapturedDimensions}
            onRefresh={(handler) => { refreshHandlerRef.current = handler }}
            onPageSelect={(handler) => { pageSelectHandlerRef.current = handler }}
          />
        </div>
        <div style={{ height: 'calc(100vh - 58px)', overflow: 'auto' }}>
          <EditorPanel 
            editorMode={editorMode}
            onToggleEditorMode={setEditorMode}
            dimensions={capturedDimensions}
            onRefresh={() => refreshHandlerRef.current?.()}
            onPageSelect={(pageIndex, isPage7_1, isPage8_1, isPage10_1, isPage10, isPage12_1, isPage5_1, isPage18_1, isPage21_1, isPage21, isPage23_1, isPage24_1, isPage27_1, isPage27_2, isPage27_3, isPage27_4, isPage27_5) => 
              pageSelectHandlerRef.current?.(pageIndex, isPage7_1, isPage8_1, isPage10_1, isPage10, isPage12_1, isPage5_1, isPage18_1, isPage21_1, isPage21, isPage23_1, isPage24_1, isPage27_1, isPage27_2, isPage27_3, isPage27_4, isPage27_5)
            }
          />
        </div>
      </Split>
    </div>
  );
}

export default EditorApp;
