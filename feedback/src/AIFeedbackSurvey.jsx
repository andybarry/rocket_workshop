import { useState } from 'react'
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Check if at least one field is filled out
    const hasAnyAnswer = Object.values(formData).some(value => value.trim() !== '')
    
    if (!hasAnyAnswer) {
      alert('Please fill out at least one question before submitting.')
      return
    }
    
    console.log('Survey Data:', formData)
    setSubmitted(true)
  }

  if (submitted) {
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
        <h1>Artificial Intelligence Workshop Feedback Survey</h1>
        <p>Thank you for your feedback. Your responses are anonymous and help us improve future workshops.</p>
        
        <form className="survey-form" onSubmit={handleSubmit}>
          {/* Location Question */}
          <div className="form-group">
            <label className="required">I did this workshop in*</label>
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
            <label className="required">I had fun in this workshop*</label>
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
            <label className="required">This workshop challenged me appropriately*</label>
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
            <label className="required">Before this workshop, my comfort with AI tools was*</label>
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
            <label className="required">After this workshop, my comfort with AI tools was*</label>
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
            <label className="required">Before this workshop, my understanding of neural networks was*</label>
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
            <label className="required">After this workshop, my understanding of neural networks was*</label>
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
            <label className="required">The Stage One instructor(s) were well prepared*</label>
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
            <label className="required">The Stage One instructor(s) were knowledgeable*</label>
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
            <label className="required">How does this workshop compare to rest of the activities during your trip?*</label>
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
    </div>
  )
}

export default AIFeedbackSurvey
