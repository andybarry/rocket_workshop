import { useState } from 'react'
import './App.css'

function App() {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState('AI')
  const [showFeedbackGraphs, setShowFeedbackGraphs] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (feedback.trim()) {
      setSubmitted(true)
      // Here you would typically send the feedback to a server
      console.log('Feedback submitted:', feedback)
    }
  }

  const handleShowFeedback = () => {
    setShowFeedbackGraphs(true)
  }

  const renderCharts = () => {
    const workshopType = selectedWorkshop
    let barColor = '#4a90e2' // Default blue for AI
    if (selectedWorkshop === 'Robotics') {
      barColor = '#28a745' // Green for Robotics
    } else if (selectedWorkshop === 'Mechanical') {
      barColor = '#dc3545' // Red for Mechanical
    }
    
    return (
      <>
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 1</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '60%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '80%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '40%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '90%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '30%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 2</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '70%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '50%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '85%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '35%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '95%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 3</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '45%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '65%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '25%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '75%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '55%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 4</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '55%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '70%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '35%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '85%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '45%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
        </div>
        
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 5</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '80%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '40%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '90%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '25%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '65%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 6</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '30%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '75%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '50%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '95%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '60%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 7</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '65%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '40%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '80%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '35%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '70%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 8</div>
            <div className="chart-content">
              <div className="y-axis">
                <div className="y-label">100</div>
                <div className="y-label">75</div>
                <div className="y-label">50</div>
                <div className="y-label">25</div>
                <div className="y-label">0</div>
              </div>
              <div className="chart-bars">
                <div className="chart-bar" style={{height: '45%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '85%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '30%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '75%', backgroundColor: barColor}}></div>
                <div className="chart-bar" style={{height: '50%', backgroundColor: barColor}}></div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">A</div>
              <div className="x-label">B</div>
              <div className="x-label">C</div>
              <div className="x-label">D</div>
              <div className="x-label">E</div>
            </div>
          </div>
        </div>
        
      </>
    )
  }

  return (
    <div className="app">
      <header className="header-bar">
        <div className="header-left">Feedback Portal</div>
        <div className="header-center"></div>
        <div className="header-right">STAGE ONE EDUCATION</div>
      </header>
      <div className="charts-title">
        <h2>2025 Workshop Feedback</h2>
        <div className="workshop-buttons">
          <button 
            className={`workshop-btn ${selectedWorkshop === 'AI' ? 'active' : ''}`}
            onClick={() => setSelectedWorkshop('AI')}
          >
            AI Workshop
          </button>
          <button 
            className={`workshop-btn ${selectedWorkshop === 'Robotics' ? 'active' : ''}`}
            onClick={() => setSelectedWorkshop('Robotics')}
          >
            Robotics Workshop
          </button>
          <button 
            className={`workshop-btn ${selectedWorkshop === 'Mechanical' ? 'active' : ''}`}
            onClick={() => setSelectedWorkshop('Mechanical')}
          >
            Mechanical Workshop
          </button>
        </div>
      </div>
      {renderCharts()}
      <div className="specific-feedback-title">
        <h2>Specific Workshop Feedback</h2>
        <div className="dropdown-container">
          <div className="dropdown-group">
            <label htmlFor="workshop-select">Workshop:</label>
            <select id="workshop-select" className="dropdown-select">
              <option value="">Select Workshop</option>
              <option value="ai-workshop">AI Workshop</option>
              <option value="robotics-workshop">Robotics Workshop</option>
              <option value="mechanical-workshop">Mechanical Workshop</option>
            </select>
          </div>
          <div className="dropdown-group">
            <label htmlFor="location-select">Location:</label>
            <select id="location-select" className="dropdown-select">
              <option value="">Select Location</option>
              <option value="ann-arbor">Ann Arbor, MI</option>
              <option value="atlanta">Atlanta, GA</option>
              <option value="berkeley">Berkeley, CA</option>
              <option value="boston">Boston, MA</option>
              <option value="houston">Houston, TX</option>
              <option value="los-angeles">Los Angeles, CA</option>
              <option value="new-haven">New Haven, CT</option>
              <option value="orlando">Orlando, FL</option>
              <option value="san-francisco">San Francisco, CA</option>
              <option value="washington-dc">Washington D.C., DC</option>
            </select>
          </div>
          <div className="dropdown-group">
            <label htmlFor="date-select">Date:</label>
            <select id="date-select" className="dropdown-select">
              <option value="">Select Date</option>
              <option value="2025-01-15">January 15, 2025</option>
              <option value="2025-01-22">January 22, 2025</option>
              <option value="2025-01-29">January 29, 2025</option>
              <option value="2025-02-05">February 5, 2025</option>
              <option value="2025-02-12">February 12, 2025</option>
              <option value="2025-02-19">February 19, 2025</option>
              <option value="2025-02-26">February 26, 2025</option>
              <option value="2025-03-05">March 5, 2025</option>
              <option value="2025-03-12">March 12, 2025</option>
              <option value="2025-03-19">March 19, 2025</option>
            </select>
          </div>
        </div>
        <div className="show-feedback-container">
          <button className="show-feedback-btn" onClick={handleShowFeedback}>Show Feedback</button>
        </div>
        {showFeedbackGraphs && (
          <div className="feedback-graphs-section">
            {renderCharts()}
            <div className="feedback-comments-section">
              <div className="feedback-comments-title">
                <h3>Feedback Comments</h3>
              </div>
              <div className="feedback-comments-window">
                <div className="feedback-comment">
                  "The AI workshop was incredibly informative and well-structured. The instructor explained complex concepts in an easy-to-understand way."
                </div>
                <div className="feedback-comment">
                  "Excellent workshop! The robotics demonstrations were engaging and the practical applications were very relevant."
                </div>
                <div className="feedback-comment">
                  "Great hands-on experience with mechanical systems. The instructor was knowledgeable and patient with questions."
                </div>
                <div className="feedback-comment">
                  "The AI concepts were explained clearly and the examples were practical. I learned a lot about machine learning applications."
                </div>
                <div className="feedback-comment">
                  "Fantastic workshop! The robotics projects were challenging but achievable. The instructor provided excellent guidance."
                </div>
                <div className="feedback-comment">
                  "Very informative session on mechanical engineering principles. The hands-on activities helped solidify the theoretical concepts."
                </div>
                <div className="feedback-comment">
                  "Outstanding workshop! The AI algorithms were well-explained and the coding exercises were engaging."
                </div>
                <div className="feedback-comment">
                  "Excellent robotics workshop with practical applications. The instructor was very knowledgeable and made complex topics accessible."
                </div>
                <div className="feedback-comment">
                  "The workshop exceeded my expectations. Great balance of theory and practical application."
                </div>
                <div className="feedback-comment">
                  "Would definitely recommend to others. The content was relevant and the instructor was engaging."
                </div>
                <div className="feedback-comment">
                  "I feel much more confident about AI applications now. The hands-on exercises were particularly helpful."
                </div>
                <div className="feedback-comment">
                  "The mechanical engineering concepts were well-presented and easy to follow. Great workshop overall."
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
        <div className="footer-content">
          © 2025 Stage One Education, LLC
        </div>
      </footer>
    </div>
  )
}

export default App
