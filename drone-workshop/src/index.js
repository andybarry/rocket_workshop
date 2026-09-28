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

function DroneInstructionsOrRedirect() {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile === null) return null;
  if (!isMobile) return <Navigate to="/" replace />;
  return <DroneInstructionsPage />;
}

// When the app is opened from an external entry point that appends ?reset=1
// (e.g. the "stageoneeducation.com/drone/?reset=1" links on the marketing
// site), clear any saved instructions progress so the left-hand instructions
// panel starts fresh on page 1. The flag is then removed from the URL via
// replaceState so a manual refresh afterwards does NOT wipe progress again.
(function handleResetParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === '1') {
      localStorage.removeItem('droneWorkshopInstructionsState');
      params.delete('reset');
      const query = params.toString();
      const newUrl = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  } catch (e) {
    // If storage or history is unavailable, just continue loading normally.
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <BrowserRouter basename="/drone">
    <Routes>
      <Route path="/" element={<DroneAppOrRedirect />} />
      <Route path="/drone-instructions" element={<DroneInstructionsOrRedirect />} />
      <Route path="/editor" element={<EditorApp />} />
    </Routes>
  </BrowserRouter>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
