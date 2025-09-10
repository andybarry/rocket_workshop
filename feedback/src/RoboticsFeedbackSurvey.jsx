import { useState, useEffect } from 'react'
import './App.css'

function RoboticsFeedbackSurvey() {
  const [formData, setFormData] = useState({
    'workshop-location': '',
    'had-fun': '',
    'favorite-part': '',
    'challenged-appropriately': '',
    'learned-electronics': '',
    'confident-electronics': '',
    'next-electronics': '',
    'recommend-workshop': '',
    'instructor': '',
    'instructor-prepared': '',
    'instructor-knowledgeable': '',
    'workshop-comparison': '',
    'comments': ''
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    document.title = 'Robotics Workshop Feedback Survey'
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
              workshopType: 'Robotics',
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
          <div className="header-left">Robotics Feedback Survey</div>
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
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header-bar">
        <div className="header-left">Robotics Feedback Survey</div>
        <div className="header-center"></div>
        <div className="header-right">STAGE ONE EDUCATION</div>
      </header>
      
      <main className="main-content">
        <form className="survey-form" onSubmit={handleSubmit}>
          <div className="survey-title-section">
            <div className="stage-one-branding">STAGE ONE EDUCATION</div>
            <h1>Robotics Workshop<br />Feedback Survey</h1>
            <p>Thank you for your feedback. Your responses are anonymous and help us improve future workshops.</p>
          </div>
          {/* Location Question */}
          <div className="form-group">
            <label>I did this workshop in</label>
            <div className="radio-options">
              {['Ann Arbor, MI', 'Atlanta, GA', 'Berkeley, CA', 'Boston, MA', 'Houston, TX', 'Los Angeles, CA', 'New Haven, CT', 'Orlando, FL', 'San Francisco, CA', 'Washington, D.C.'].map((location, index) => (
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

          {/* Learned Electronics */}
          <div className="form-group">
            <label>I learned how to build and understand basic electronic systems</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`learned-electronics-${index}`} 
                    name="learned-electronics" 
                    value={option} 
                    checked={formData['learned-electronics'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`learned-electronics-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Confident Electronics */}
          <div className="form-group">
            <label>After taking this workshop, I feel confident in starting another similar electronics project</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`confident-electronics-${index}`} 
                    name="confident-electronics" 
                    value={option} 
                    checked={formData['confident-electronics'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`confident-electronics-${index}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Next Electronics */}
          <div className="form-group">
            <label>In the next electronics workshop, I want to learn how to _______</label>
            <input 
              type="text" 
              name="next-electronics" 
              placeholder="Your answer"
              value={formData['next-electronics']}
              onChange={handleInputChange}
            />
          </div>

          {/* Recommend Workshop */}
          <div className="form-group">
            <label>I would recommend that this workshop be taught again next year</label>
            <div className="radio-options">
              {['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'].map((option, index) => (
                <div key={index} className="radio-option">
                  <input 
                    type="radio" 
                    id={`recommend-workshop-${index}`} 
                    name="recommend-workshop" 
                    value={option} 
                    checked={formData['recommend-workshop'] === option}
                    onChange={handleInputChange}
                  />
                  <label htmlFor={`recommend-workshop-${index}`}>{option}</label>
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
        </div>
      </footer>
    </div>
  )
}

export default RoboticsFeedbackSurvey
