import ResizablePanels from './components/ResizablePanels'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-header-text">Robotics Workshop</span>
          <span className="app-header-drone">Drone IDE</span>
        </div>
        <span className="app-header-stage">STAGE ONE EDUCATION</span>
      </header>
      <div className="app-header-bar"></div>
      <ResizablePanels />
    </div>
  )
}

export default App

