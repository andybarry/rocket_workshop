import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'
import { SITE_CONFIG } from './config'

function InstructorFeedbackSurvey() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const [formData, setFormData] = useState({
    'instructed-location': [],
    'instructed-location-other-text': '',
    'session-type': '',
    'session-type-other-text': '',
    'well-prepared': '',
    'venue-rating': '',
    'content-relevance': '',
    'schedule-timing': '',
    'future-instruct': '',
    'comments': ''
  })
  const [submitted, setSubmitted] = useState(false)

  // Authentication functions
  const checkAuthStatus = async () => {
    const storedSessionId = localStorage.getItem('sessionId')
    const storedExpires = localStorage.getItem('sessionExpires')
    
    if (!storedSessionId || !storedExpires) {
      setIsCheckingAuth(false)
      return
    }
    
    if (Date.now() > parseInt(storedExpires)) {
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionExpires')
      setIsCheckingAuth(false)
      return
    }
    
    try {
      const response = await fetch('/api/auth/status', {
        headers: {
          'Authorization': `Bearer ${storedSessionId}`,
        },
      })
      
      if (response.ok) {
        setIsAuthenticated(true)
        setSessionId(storedSessionId)
      } else {
        localStorage.removeItem('sessionId')
        localStorage.removeItem('sessionExpires')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionExpires')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // Add authentication header to all API requests
  const apiRequest = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`
    }
    
    return fetch(url, {
      ...options,
      headers,
      mode: 'cors'
    })
  }

  useEffect(() => {
    document.title = 'Instructor Feedback Survey'
    checkAuthStatus()
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
    const hasAnyAnswer = Object.entries(formData).some(([key, value]) => {
      if (key === 'instructed-location') {
        return Array.isArray(value) && value.length > 0
      }
      // Check for any non-empty string value
      return value && typeof value === 'string' && value.trim() !== ''
    })
    
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
        '/api/instructor-feedback'
      ]
      
      let response = null
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint)
          response = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
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

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h2>Loading...</h2>
            <p>Checking authentication status</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={(sessionId, expires) => {
      setSessionId(sessionId)
      setIsAuthenticated(true)
      localStorage.setItem('sessionId', sessionId)
      localStorage.setItem('sessionExpires', expires.toString())
    }} />
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
          <div className="header-left">
            <span><strong>STAGE ONE EDUCATION</strong><span className="header-separator"> | </span><span className="survey-name">Instructor Survey</span></span>
          </div>
          <div className="header-center"></div>
          <div className="header-right"></div>
        </header>
        
        <main className="main-content">
          <div className="success-message">
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully. We appreciate your input!</p>
          </div>
        </main>
        
        <footer className="footer">
          <div className="footer-content">
            © {SITE_CONFIG.copyrightYear} {SITE_CONFIG.companyName}
            <span className="footer-version">{SITE_CONFIG.version}</span>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header-bar">
        <div className="header-left">
          <span><strong>STAGE ONE EDUCATION</strong><span className="header-separator"> | </span><span className="survey-name">Instructor Survey</span></span>
        </div>
        <div className="header-center"></div>
        <div className="header-right"></div>
      </header>
      
      <main className="main-content">
        <form className="survey-form" onSubmit={handleSubmit}>
          <div className="survey-title-section">
            <h1>Instructor<br /><span className="feedback-survey-text">Feedback Survey</span><span className="thank-you-text">Thank you for your feedback. Your responses help us improve future workshops.</span></h1>
          </div>
          {/* Location Question */}
          <div className="form-group">
            <label>I instructed a workshop in</label>
            <div style={{ marginBottom: '10px', marginTop: '-0.5rem', fontSize: '14px', color: '#666' }}>Select all that apply</div>
            <div className="radio-options">
              {['Ann Arbor, MI', 'Atlanta, GA', 'Berkeley, CA', 'Boston, MA', 'Houston, TX', 'Los Angeles, CA', 'New Haven, CT', 'Orlando, FL', 'San Francisco, CA', 'Washington, D.C.'].map((location, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="checkbox" 
                    id={`location-${index}`} 
                    name="instructed-location" 
                    value={location} 
                    checked={formData['instructed-location'] && formData['instructed-location'].includes(location)}
                    onChange={(e) => {
                      const currentLocations = formData['instructed-location'] || []
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          'instructed-location': [...currentLocations, location]
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          'instructed-location': currentLocations.filter(loc => loc !== location)
                        }))
                      }
                    }}
                  />
                  <label htmlFor={`location-${index}`}>{location}</label>
                </div>
              ))}
            </div>
            <div className="radio-option">
              <input 
                type="checkbox" 
                id="location-other" 
                name="instructed-location-other" 
                checked={formData['instructed-location'] && formData['instructed-location'].includes('Other')}
                onChange={(e) => {
                  const currentLocations = formData['instructed-location'] || []
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      'instructed-location': [...currentLocations, 'Other']
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      'instructed-location': currentLocations.filter(loc => loc !== 'Other')
                    }))
                  }
                }}
              />
              <label htmlFor="location-other">Other:</label>
              {formData['instructed-location'] && formData['instructed-location'].includes('Other') && (
                <input 
                  type="text" 
                  name="instructed-location-other-text" 
                  placeholder="Please specify"
                  value={formData['instructed-location-other-text']}
                  onChange={handleInputChange}
                  style={{ marginLeft: '10px' }}
                />
              )}
            </div>
          </div>

          {/* Session Type Question */}
          <div className="form-group">
            <label>What type of session did you instruct?</label>
            <div className="radio-options">
              {['Mechanical Engineering Workshop', 'Robotics Workshop', 'Artificial Intelligence Workshop', 'Presentation Event'].map((type, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`session-type-${index}`} 
                    name="session-type" 
                    value={type} 
                    checked={formData['session-type'] === type}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`session-type-${index}`}>{type}</label>
                </div>
              ))}
            </div>
            <div className="radio-option">
              <input 
                type="radio" 
                id="session-type-other" 
                name="session-type" 
                value="Other" 
                checked={formData['session-type'] === 'Other'}
                onChange={handleInputChange}
              />
              <label htmlFor="session-type-other">Other:</label>
              {formData['session-type'] === 'Other' && (
                <input 
                  type="text" 
                  name="session-type-other-text" 
                  placeholder="Please specify"
                  value={formData['session-type-other-text']}
                  onChange={handleInputChange}
                  style={{ marginLeft: '10px' }}
                />
              )}
            </div>
          </div>

          {/* Well Prepared Question */}
          <div className="form-group">
            <label>I felt well-prepared before the event began.</label>
            <div className="radio-options">
              {[
                { value: 'Strongly Agree', label: 'Strongly Agree' },
                { value: 'Agree', label: 'Agree' },
                { value: 'Neutral', label: 'Neutral' },
                { value: 'Disagree', label: 'Disagree' },
                { value: 'Strongly Disagree', label: 'Strongly Disagree' }
              ].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`prepared-${index}`} 
                    name="well-prepared" 
                    value={option.value} 
                    checked={formData['well-prepared'] === option.value}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`prepared-${index}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Rating Question */}
          <div className="form-group">
            <label>How would you rate the workshop venue?</label>
            <div className="radio-options">
              {[
                { value: '1', label: 'Poor' },
                { value: '2', label: 'Fair' },
                { value: '3', label: 'Good' },
                { value: '4', label: 'Very Good' },
                { value: '5', label: 'Excellent' }
              ].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`venue-${index}`} 
                    name="venue-rating" 
                    value={option.value} 
                    checked={formData['venue-rating'] === option.value}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`venue-${index}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Content Relevance Question */}
          <div className="form-group">
            <label>How would you rate the workshop content?</label>
            <div className="radio-options">
              {[
                { value: '1', label: 'Poor' },
                { value: '2', label: 'Fair' },
                { value: '3', label: 'Good' },
                { value: '4', label: 'Very Good' },
                { value: '5', label: 'Excellent' }
              ].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`content-${index}`} 
                    name="content-relevance" 
                    value={option.value} 
                    checked={formData['content-relevance'] === option.value}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`content-${index}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Timing Question */}
          <div className="form-group">
            <label>How would you rate the workshop schedule and timing?</label>
            <div className="radio-options">
              {[
                { value: '1', label: 'Poor' },
                { value: '2', label: 'Fair' },
                { value: '3', label: 'Good' },
                { value: '4', label: 'Very Good' },
                { value: '5', label: 'Excellent' }
              ].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`schedule-${index}`} 
                    name="schedule-timing" 
                    value={option.value} 
                    checked={formData['schedule-timing'] === option.value}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`schedule-${index}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Future Instruct Question */}
          <div className="form-group">
            <label>Would you instruct future workshops with Stage One Education?</label>
            <div className="radio-options">
              {[
                { value: '1', label: 'Definitely Not' },
                { value: '2', label: 'Probably Not' },
                { value: '3', label: 'Not Sure' },
                { value: '4', label: 'Probably' },
                { value: '5', label: 'Definitely' }
              ].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`future-${index}`} 
                    name="future-instruct" 
                    value={option.value} 
                    checked={formData['future-instruct'] === option.value}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`future-${index}`}>{option.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="form-group">
            <label>Comments, suggestions, or ideas:</label>
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
          © {SITE_CONFIG.copyrightYear} {SITE_CONFIG.companyName}
          <span className="footer-version">{SITE_CONFIG.version}</span>
        </div>
      </footer>
    </div>
  )
}

export default InstructorFeedbackSurvey
