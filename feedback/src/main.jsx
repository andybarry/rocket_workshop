import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AIFeedbackSurvey from './AIFeedbackSurvey.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/artificial-intelligence-feedback-survey.html" element={<AIFeedbackSurvey />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
