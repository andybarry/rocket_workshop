import { useState, useEffect } from 'react'
import './App.css'

function AIFeedbackSurvey() {
  const [formData, setFormData] = useState({
    'workshop-location': '',
    'had-fun': '',
    'favorite-part': '',
    'challenged-appropriately': '',
    'ai-tools-before': '',
    'ai-tools-after': '',
    'neural-networks-before': '',
    'neural-networks-after': '',
    'instructor': '',
    'instructor-prepared': '',
    'instructor-knowledgeable': '',
    'workshop-comparison': '',
    'comments': ''
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    document.title = 'Artificial Intelligence Workshop Feedback Survey'
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if at least one field is filled out
    const hasAnyAnswer = Object.values(formData).some(value => value.trim() !== '')
    
    if (!hasAnyAnswer) {
      alert('Please fill out at least one question before submitting.')
      return
    }
    
    try {
      // Add current date to the form data
      const submissionData = {
        ...formData,
        date: new Date().toLocaleDateString()
      }
      
      console.log('Submitting data:', submissionData)
      
      // Try multiple endpoints in case of connectivity issues
      const endpoints = [
        'http://localhost:3001/api/feedback',
        'http://127.0.0.1:3001/api/feedback'
      ]
      
      let response = null
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint)
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
              workshopType: 'AI',
              feedbackData: submissionData
            })
          })
          if (response.ok) {
            console.log('Success with endpoint:', endpoint)
            break
          }
        } catch (err) {
          console.log('Failed with endpoint:', endpoint, err.message)
          continue
        }
      }
      
      if (response && response.ok) {
        const result = await response.json()
        console.log('Survey Data submitted successfully:', result)
        setSubmitted(true)
      } else {
        console.error('All endpoints failed or response not ok')
        alert('Failed to submit feedback. Please check that the server is running and try again.')
      }
    } catch (error) {
      console.error('Network error:', error)
      alert('Network error. Please check your connection and try again.')
    }
  }

  if (submitted) {
    // Simple fade transition to Stage One Education website after 5 seconds
    setTimeout(() => {
      // Add fade out effect to current page
      document.body.style.transition = 'opacity 1s ease-in-out'
      document.body.style.opacity = '0'
      
      // Redirect after fade completes
      setTimeout(() => {
        window.location.href = 'https://stageoneeducation.com/index.html'
      }, 1000)
    }, 5000)

    return (
      <div className="app">
        <header className="header-bar">
          <div className="header-left">Artificial Intelligence Feedback Survey</div>
          <div className="header-center"></div>
          <div className="header-right">STAGE ONE EDUCATION</div>
        </header>
        
        <main className="main-content">
          <div className="success-message">
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully. We appreciate your input!</p>
          </div>
        </main>
        
        <footer className="footer">
          <div className="footer-content">
            © 2025 Stage One Education, LLC
            <span className="footer-version">V25.9</span>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header-bar">
        <div className="header-left">Artificial Intelligence Feedback Survey</div>
        <div className="header-center"></div>
        <div className="header-right">STAGE ONE EDUCATION</div>
      </header>
      
      <main className="main-content">
        <form className="survey-form" onSubmit={handleSubmit}>
          <div className="survey-title-section">
            <div className="stage-one-branding">STAGE ONE EDUCATION</div>
            <h1>Artificial Intelligence Workshop<br />Feedback Survey</h1>
            <p>Thank you for your feedback. Your responses are anonymous and help us improve future workshops.</p>
          </div>
          {/* Location Question */}
          <div className="form-group">
            <label>I did this workshop in</label>
            <div className="radio-options">
              {['Ann Arbor, MI', 'Atlanta, GA', 'Berkeley, CA', 'Boston, MA', 'Houston, TX', 'Los Angeles, CA', 'New Haven, CT', 'Orlando, FL', 'Washington, D.C.'].map((location, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`location-${index}`} 
                    name="workshop-location" 
                    value={location} 
                    checked={formData['workshop-location'] === location}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`location-${index}`}>{location}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Fun Question */}
          <div className="form-group">
            <label>I had fun in this workshop</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`fun-${index}`} 
                    name="had-fun" 
                    value={option} 
                    checked={formData['had-fun'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`fun-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Part */}
          <div className="form-group">
            <label>My favorite part of this workshop was</label>
            <input 
              type="text" 
              name="favorite-part" 
              placeholder="Your answer"
              value={formData['favorite-part']}
              onChange={handleInputChange}
            />
          </div>

          {/* Challenge Question */}
          <div className="form-group">
            <label>This workshop challenged me appropriately</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`challenge-${index}`} 
                    name="challenged-appropriately" 
                    value={option} 
                    checked={formData['challenged-appropriately'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`challenge-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tools Before */}
          <div className="form-group">
            <label>Before this workshop, my comfort with AI tools was</label>
            <div className="radio-options">
              {['Minimal Knowledge', 'Basic Understanding', 'Average Understanding', 'Advanced Understanding', 'Strong Conceptual Understanding'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`ai-before-${index}`} 
                    name="ai-tools-before" 
                    value={option} 
                    checked={formData['ai-tools-before'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`ai-before-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tools After */}
          <div className="form-group">
            <label>After this workshop, my comfort with AI tools was</label>
            <div className="radio-options">
              {['Minimal Knowledge', 'Basic Understanding', 'Average Understanding', 'Advanced Understanding', 'Strong Conceptual Understanding'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`ai-after-${index}`} 
                    name="ai-tools-after" 
                    value={option} 
                    checked={formData['ai-tools-after'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`ai-after-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Networks Before */}
          <div className="form-group">
            <label>Before this workshop, my understanding of neural networks was</label>
            <div className="radio-options">
              {['Minimal Knowledge', 'Basic Understanding', 'Average Understanding', 'Advanced Understanding', 'Strong Conceptual Understanding'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`nn-before-${index}`} 
                    name="neural-networks-before" 
                    value={option} 
                    checked={formData['neural-networks-before'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`nn-before-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Networks After */}
          <div className="form-group">
            <label>After this workshop, my understanding of neural networks was</label>
            <div className="radio-options">
              {['Minimal Knowledge', 'Basic Understanding', 'Average Understanding', 'Advanced Understanding', 'Strong Conceptual Understanding'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`nn-after-${index}`} 
                    name="neural-networks-after" 
                    value={option} 
                    checked={formData['neural-networks-after'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`nn-after-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Question */}
          <div className="form-group">
            <label>Which workshop instructor did you learn the most from?</label>
            <input 
              type="text" 
              name="instructor" 
              placeholder="Your answer"
              value={formData['instructor']}
              onChange={handleInputChange}
            />
          </div>

          {/* Instructor Preparation */}
          <div className="form-group">
            <label>The Stage One instructor(s) were well prepared</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`prepared-${index}`} 
                    name="instructor-prepared" 
                    value={option} 
                    checked={formData['instructor-prepared'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`prepared-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Instructor Knowledge */}
          <div className="form-group">
            <label>The Stage One instructor(s) were knowledgeable</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`knowledgeable-${index}`} 
                    name="instructor-knowledgeable" 
                    value={option} 
                    checked={formData['instructor-knowledgeable'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`knowledgeable-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Question */}
          <div className="form-group">
            <label>How does this workshop compare to rest of the activities during your trip?</label>
            <div className="radio-options">
              {['The best so far', 'Better than most other activities', 'About the same', 'Worse than most other activities', 'The worst so far'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`comparison-${index}`} 
                    name="workshop-comparison" 
                    value={option} 
                    checked={formData['workshop-comparison'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`comparison-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="form-group">
            <label>Comments/Suggestions/Ideas (we will read everything you write)</label>
            <textarea 
              name="comments" 
              placeholder="Your answer" 
              rows="4"
              value={formData['comments']}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="submit-button">Submit Feedback</button>
        </form>
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          © 2025 Stage One Education, LLC
          <span className="footer-version">V25.9</span>
        </div>
      </footer>
    </div>
  )
}

export default AIFeedbackSurvey
