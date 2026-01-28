import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Split } from '@geoffcox/react-splitter';
import InstructionsPanel from './components/InstructionsPanel';
import EditorPanel from './components/EditorPanel';
import './App.css';

function EditorApp() {
  const [editorMode, setEditorMode] = useState(true);
  const [capturedDimensions, setCapturedDimensions] = useState(null);
  const refreshHandlerRef = useRef(null);
  const pageSelectHandlerRef = useRef(null);
  
  // Password protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === 'uptonogood') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  // Show password screen if not authenticated
  if (!isAuthenticated) {
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
              <span className="heading-pipe" aria-hidden="true" />
              <span className="drone-workshop">Editor Mode</span>
            </h1>
            <span className="stageone-org">STAGE ONE EDUCATION</span>
          </div>
          <div className="download-links">
            <Link to="/" style={{ marginLeft: '15px' }}>← Back to Workshop</Link>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 58px)',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center' }}>
              Editor Access
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
                {passwordError && (
                  <p style={{ color: 'red', marginTop: '8px', marginBottom: '0' }}>{passwordError}</p>
                )}
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  backgroundColor: '#f05f40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="heading-pipe" aria-hidden="true" />
            <span className="drone-workshop">Editor Mode</span>
          </h1>

          <span className="stageone-org">STAGE ONE EDUCATION</span>
        </div>

        <div className="download-links">
          <Link to="/" style={{ marginLeft: '15px' }}>← Back to Workshop</Link>
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
