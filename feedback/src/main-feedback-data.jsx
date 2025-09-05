import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FeedbackData from './FeedbackData.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FeedbackData />
  </StrictMode>,
)
