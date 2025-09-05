import { useState } from 'react'
import './App.css'

function App() {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (feedback.trim()) {
      setSubmitted(true)
      // Here you would typically send the feedback to a server
      console.log('Feedback submitted:', feedback)
    }
  }

  return (
    <div className="feedback-container">
              <h1>Feedback Form</h1>
      {!submitted ? (
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label htmlFor="feedback">Share your feedback:</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              rows="6"
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            Submit Feedback
          </button>
        </form>
      ) : (
        <div className="success-message">
          <h2>Thank you for your feedback!</h2>
          <p>Your feedback has been submitted successfully.</p>
          <button onClick={() => { setSubmitted(false); setFeedback('') }} className="new-feedback-btn">
            Submit Another Feedback
          </button>
        </div>
      )}
    </div>
  )
}

export default App
