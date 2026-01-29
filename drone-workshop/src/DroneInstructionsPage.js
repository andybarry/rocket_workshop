import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import InstructionsPanel from './components/InstructionsPanel';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function DroneInstructionsPage() {
  const [resetInstructionsFunc, setResetInstructionsFunc] = useState(null);
  const [pageJumpApi, setPageJumpApi] = useState(null);

  const resetInstructionsOnly = () => {
    localStorage.removeItem('droneWorkshopInstructionsState');
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      {/* Fixed header: stays at top even when user zooms (pinch) */}
      <div className="drone-instructions-fixed-header">
        <div
          className="drone-instructions-header"
          style={{
            alignItems: 'center',
            backgroundColor: '#f05f40ff',
          }}
        >
          {/* Mobile: STAGE ONE EDUCATION below, pipe spans both lines */}
          <div className="orange-bar drone-instructions-orange-bar-mobile">
            <div className="drone-instructions-heading-row">
              <div className="drone-instructions-heading-left">
                <span className="stageone-education">Robotics Workshop</span>
                <span className="stageone-org">STAGE ONE EDUCATION</span>
              </div>
              <span className="heading-pipe drone-instructions-pipe" aria-hidden="true" />
              <span className="drone-workshop">Instructions</span>
            </div>
          </div>
          {/* Desktop: single row, STAGE ONE EDUCATION on the right */}
          <div className="orange-bar drone-instructions-orange-bar-desktop">
            <h1 className="stageone-heading">
              <span className="stageone-education">Robotics Workshop</span>
              <span className="heading-pipe" aria-hidden="true" />
              <span className="drone-workshop">Instructions</span>
            </h1>
            <span className="stageone-org">STAGE ONE EDUCATION</span>
          </div>

          <div className="download-links">
            <a
              href="https://stageoneeducation.com/UART-USB-Driver.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              USB/UART Drivers
            </a>
            <a href="https://input.stageoneeducation.com/robotics-feedback-survey.html" target="_blank">
              Feedback
            </a>
          </div>
        </div>

        {/* Mobile only: notice bar below gray bar, same height as orange bar */}
        <div className="drone-instructions-mobile-notice">
          Instructions only. Laptop required for the Drone IDE.
        </div>
      </div>

      <div
        className="drone-instructions-panel-wrapper"
        style={{
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <InstructionsPanel
          editorMode={false}
          showZoomControls={false}
          showCenterNavControls={true}
          onResetInstructionsReady={(fn) => setResetInstructionsFunc(() => fn)}
          onPageJumpSlotReady={(api) => setPageJumpApi(api)}
          onResetAll={resetInstructionsOnly}
        />
      </div>
    </ErrorBoundary>
  );
}

export default DroneInstructionsPage;
