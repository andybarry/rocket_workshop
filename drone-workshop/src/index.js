import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import EditorApp from './EditorApp';
import DroneInstructionsPage from './DroneInstructionsPage';
import reportWebVitals from './reportWebVitals';

const MOBILE_BREAKPOINT_PX = 768;

function DroneAppOrRedirect() {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile === null) return null;
  if (isMobile) return <Navigate to="/drone-instructions" replace />;
  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <BrowserRouter basename="/drone">
    <Routes>
      <Route path="/" element={<DroneAppOrRedirect />} />
      <Route path="/drone-instructions" element={<DroneInstructionsPage />} />
      <Route path="/editor" element={<EditorApp />} />
    </Routes>
  </BrowserRouter>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
