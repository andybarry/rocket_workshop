import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState('AI')
  const [showFeedbackGraphs, setShowFeedbackGraphs] = useState(false)
  const [selectedYear, setSelectedYear] = useState('All')
  const [aiWorkshopData, setAiWorkshopData] = useState([])
  const [loading, setLoading] = useState(false)

  // Password protection function for dashboard
  const checkDashboardPassword = () => {
    // Check if password protection is disabled
    const isPasswordDisabled = localStorage.getItem('passwordProtectionDisabled') === 'true'
    if (isPasswordDisabled) {
      setIsAuthenticated(true)
      return true
    }
    
    const storedPassword = localStorage.getItem('dashboardPassword') || '1111'
    const password = prompt('Enter password to access Feedback Dashboard:')
    if (password === storedPassword) {
      setIsAuthenticated(true)
      return true
    } else if (password !== null) {
      alert('Incorrect password. Access denied.')
      return false
    }
    return false
  }

  // Check authentication on component mount
  useEffect(() => {
    checkDashboardPassword()
  }, [])

  // Fetch AI workshop data
  const fetchAiWorkshopData = async () => {
    if (selectedWorkshop !== 'AI') return
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/feedback/AI`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Filter data for the selected year
        const filteredData = data.filter(item => {
          if (!item.date) return false
          // If "All" is selected, return all data
          if (selectedYear === 'All') return true
          // Check if date contains the selected year
          return item.date.includes(selectedYear)
        })
        setAiWorkshopData(filteredData)
      }
    } catch (error) {
      console.error('Error fetching AI workshop data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when workshop or year changes
  useEffect(() => {
    if (selectedWorkshop === 'AI') {
      fetchAiWorkshopData()
    }
  }, [selectedWorkshop, selectedYear])

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

  // Process AI workshop data to create chart data
  const processAiWorkshopData = () => {
    if (!aiWorkshopData.length) return null

    const questions = [
      'had-fun',
      'challenged-appropriately', 
      'ai-tools-combined',
      'neural-networks-combined',
      'instructor-prepared',
      'instructor-knowledgeable',
      'workshop-comparison'
    ]

    const questionLabels = [
      'I had fun in this workshop',
      'This workshop challenged me appropriately',
      'Before/After this workshop my comfort with AI tools was',
      'Before/After this workshop my understanding of neural networks was',
      'The Stage One instructor(s) were well prepared',
      'The Stage One instructor(s) were knowledgeable',
      'How does this workshop compare to rest of the activities during your trip?'
    ]

    // Different response options for different question types
    const standardResponseOptions = [
      'Strongly Disagree',
      'Disagree', 
      'Neutral',
      'Agree',
      'Strongly Agree'
    ]

    const knowledgeResponseOptions = [
      'Minimal Knowledge',
      'Basic Understanding',
      'Average Understanding',
      'Advanced Understanding',
      'Strong Conceptual Understanding'
    ]

    const workshopComparisonResponseOptions = [
      'The worst so far',
      'Worse than most other activities',
      'About the same',
      'Better than most other activities',
      'The best so far'
    ]

    const chartData = questions.map((question, index) => {
      // Handle combined AI tools chart
      if (question === 'ai-tools-combined') {
        const beforeCounts = knowledgeResponseOptions.map(option => {
          return aiWorkshopData.filter(item => item['ai-tools-before'] === option).length
        })
        const afterCounts = knowledgeResponseOptions.map(option => {
          return aiWorkshopData.filter(item => item['ai-tools-after'] === option).length
        })
        
        return {
          question: questionLabels[index],
          counts: beforeCounts,
          afterCounts: afterCounts,
          total: aiWorkshopData.length,
          responseOptions: knowledgeResponseOptions,
          isCombined: true
        }
      }

      // Handle combined neural networks chart
      if (question === 'neural-networks-combined') {
        const beforeCounts = knowledgeResponseOptions.map(option => {
          return aiWorkshopData.filter(item => item['neural-networks-before'] === option).length
        })
        const afterCounts = knowledgeResponseOptions.map(option => {
          return aiWorkshopData.filter(item => item['neural-networks-after'] === option).length
        })
        
        return {
          question: questionLabels[index],
          counts: beforeCounts,
          afterCounts: afterCounts,
          total: aiWorkshopData.length,
          responseOptions: knowledgeResponseOptions,
          isCombined: true
        }
      }

      // Determine which response options to use based on the question
      let responseOptions
      if (['ai-tools-before', 'ai-tools-after'].includes(question)) {
        responseOptions = knowledgeResponseOptions
      } else if (question === 'workshop-comparison') {
        responseOptions = workshopComparisonResponseOptions
      } else {
        responseOptions = standardResponseOptions
      }

      const counts = responseOptions.map(option => {
        return aiWorkshopData.filter(item => item[question] === option).length
      })
      
      return {
        question: questionLabels[index],
        counts: counts,
        total: aiWorkshopData.length,
        responseOptions: responseOptions,
        isCombined: false
      }
    })

    return chartData
  }

  const renderCharts = () => {
    const workshopType = selectedWorkshop
    const barColors = ['#939393', '#b18983', '#c06958', '#d85b49', '#f05f40']
    
    // Use real data for AI workshop
    if (selectedWorkshop === 'AI') {
      const chartData = processAiWorkshopData()
      
      if (!chartData || loading) {
        return (
          <div className="loading-container">
            <div className="loading-text">
              {loading ? 'Loading AI workshop data...' : `No data available for AI workshop${selectedYear === 'All' ? '' : ` in ${selectedYear}`}`}
            </div>
          </div>
        )
      }

      return (
        <>
          <div className="bar-graphs-container">
            {chartData.slice(0, 3).map((data, index) => (
              <div key={index} className="chart-window">
                <div className="ai-workshop-text">Artificial Intelligence Workshop</div>
                <div className="chart-title">{data.question}</div>
                <div className="chart-surveyed-count">surveyed: {data.total}</div>
                {data.isCombined ? (
                  <>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#939393'}}></div>
                        <span>Before</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#f05f40'}}></div>
                        <span>After</span>
                      </div>
                    </div>
                    <div className="chart-content">
                      <div className="chart-bars">
                        {data.counts.map((count, barIndex) => {
                          const afterCount = data.afterCounts[barIndex]
                          const maxCount = Math.max(...data.counts, ...data.afterCounts)
                          const beforePercentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                          const afterPercentage = maxCount > 0 ? (afterCount / maxCount) * 100 : 0
                          return (
                            <div key={barIndex} className="combined-bar-container">
                              <div className="combined-bar-group">
                                <div className="combined-bar-value">{count}</div>
                                <div 
                                  className="combined-chart-bar before-bar" 
                                  style={{
                                    height: `${beforePercentage}%`, 
                                    backgroundColor: '#939393'
                                  }}
                                ></div>
                              </div>
                              <div className="combined-bar-group">
                                <div className="combined-bar-value">{afterCount}</div>
                                <div 
                                  className="combined-chart-bar after-bar" 
                                  style={{
                                    height: `${afterPercentage}%`, 
                                    backgroundColor: '#f05f40'
                                  }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="chart-content">
                      <div className="chart-bars">
                        {data.counts.map((count, barIndex) => {
                          const maxCount = Math.max(...data.counts)
                          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                          return (
                            <div key={barIndex} className="bar-container">
                              <div className="bar-value">{count}</div>
                              <div 
                                className="chart-bar" 
                                style={{
                                  height: `${percentage}%`, 
                                  backgroundColor: '#f05f40'
                                }}
                              ></div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="x-axis">
                  {data.responseOptions.map((option, optionIndex) => (
                    <div key={optionIndex} className="x-label">{option}</div>
                  ))}
                </div>
                <div className="stage-one-text">STAGE ONE EDUCATION</div>
              </div>
            ))}
          </div>
          
          <div className="bar-graphs-container">
            {chartData.slice(3, 6).map((data, index) => (
              <div key={index + 3} className="chart-window">
                <div className="ai-workshop-text">Artificial Intelligence Workshop</div>
                <div className="chart-title">{data.question}</div>
                <div className="chart-surveyed-count">surveyed: {data.total}</div>
                {data.isCombined ? (
                  <>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#939393'}}></div>
                        <span>Before</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{backgroundColor: '#f05f40'}}></div>
                        <span>After</span>
                      </div>
                    </div>
                    <div className="chart-content">
                      <div className="chart-bars">
                        {data.counts.map((count, barIndex) => {
                          const afterCount = data.afterCounts[barIndex]
                          const maxCount = Math.max(...data.counts, ...data.afterCounts)
                          const beforePercentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                          const afterPercentage = maxCount > 0 ? (afterCount / maxCount) * 100 : 0
                          return (
                            <div key={barIndex} className="combined-bar-container">
                              <div className="combined-bar-group">
                                <div className="combined-bar-value">{count}</div>
                                <div 
                                  className="combined-chart-bar before-bar" 
                                  style={{
                                    height: `${beforePercentage}%`, 
                                    backgroundColor: '#939393'
                                  }}
                                ></div>
                              </div>
                              <div className="combined-bar-group">
                                <div className="combined-bar-value">{afterCount}</div>
                                <div 
                                  className="combined-chart-bar after-bar" 
                                  style={{
                                    height: `${afterPercentage}%`, 
                                    backgroundColor: '#f05f40'
                                  }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="chart-content">
                      <div className="chart-bars">
                        {data.counts.map((count, barIndex) => {
                          const maxCount = Math.max(...data.counts)
                          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                          return (
                            <div key={barIndex} className="bar-container">
                              <div className="bar-value">{count}</div>
                              <div 
                                className="chart-bar" 
                                style={{
                                  height: `${percentage}%`, 
                                  backgroundColor: '#f05f40'
                                }}
                              ></div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="x-axis">
                  {data.responseOptions.map((option, optionIndex) => (
                    <div key={optionIndex} className="x-label">{option}</div>
                  ))}
                </div>
                <div className="stage-one-text">STAGE ONE EDUCATION</div>
              </div>
            ))}
          </div>
          
          <div className="bar-graphs-container">
            {chartData.slice(6, 9).map((data, index) => (
              <div key={index + 6} className="chart-window">
                <div className="ai-workshop-text">Artificial Intelligence Workshop</div>
                <div className="chart-title">{data.question}</div>
                <div className="chart-surveyed-count">surveyed: {data.total}</div>
                <div className="chart-content">
                  <div className="chart-bars">
                    {data.counts.map((count, barIndex) => {
                      const maxCount = Math.max(...data.counts)
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                      return (
                        <div key={barIndex} className="bar-container">
                          <div className="bar-value">{count}</div>
                          <div 
                            className="chart-bar" 
                            style={{
                              height: `${percentage}%`, 
                                backgroundColor: '#f05f40'
                            }}
                          ></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="x-axis">
                  {data.responseOptions.map((option, optionIndex) => (
                    <div key={optionIndex} className="x-label">{option}</div>
                  ))}
                </div>
                <div className="stage-one-text">STAGE ONE EDUCATION</div>
              </div>
            ))}
          </div>
        </>
      )
    }
    
    // Default charts for other workshops/years
    return (
      <>
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 1</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">60</div>
                  <div className="chart-bar" style={{height: '60%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">80</div>
                  <div className="chart-bar" style={{height: '80%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">40</div>
                  <div className="chart-bar" style={{height: '40%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">90</div>
                  <div className="chart-bar" style={{height: '90%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">30</div>
                  <div className="chart-bar" style={{height: '30%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 2</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">70</div>
                  <div className="chart-bar" style={{height: '70%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">50</div>
                  <div className="chart-bar" style={{height: '50%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">85</div>
                  <div className="chart-bar" style={{height: '85%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">35</div>
                  <div className="chart-bar" style={{height: '35%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">95</div>
                  <div className="chart-bar" style={{height: '95%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 3</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">45</div>
                  <div className="chart-bar" style={{height: '45%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">65</div>
                  <div className="chart-bar" style={{height: '65%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">25</div>
                  <div className="chart-bar" style={{height: '25%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">75</div>
                  <div className="chart-bar" style={{height: '75%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">55</div>
                  <div className="chart-bar" style={{height: '55%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 4</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">55</div>
                  <div className="chart-bar" style={{height: '55%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">70</div>
                  <div className="chart-bar" style={{height: '70%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">35</div>
                  <div className="chart-bar" style={{height: '35%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">85</div>
                  <div className="chart-bar" style={{height: '85%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">45</div>
                  <div className="chart-bar" style={{height: '45%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
        </div>
        
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 5</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">80</div>
                  <div className="chart-bar" style={{height: '80%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">40</div>
                  <div className="chart-bar" style={{height: '40%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">90</div>
                  <div className="chart-bar" style={{height: '90%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">25</div>
                  <div className="chart-bar" style={{height: '25%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">65</div>
                  <div className="chart-bar" style={{height: '65%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 6</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">30</div>
                  <div className="chart-bar" style={{height: '30%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">75</div>
                  <div className="chart-bar" style={{height: '75%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">50</div>
                  <div className="chart-bar" style={{height: '50%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">95</div>
                  <div className="chart-bar" style={{height: '95%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">60</div>
                  <div className="chart-bar" style={{height: '60%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 7</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">65</div>
                  <div className="chart-bar" style={{height: '65%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">40</div>
                  <div className="chart-bar" style={{height: '40%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">80</div>
                  <div className="chart-bar" style={{height: '80%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">35</div>
                  <div className="chart-bar" style={{height: '35%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">70</div>
                  <div className="chart-bar" style={{height: '70%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 8</div>
            <div className="chart-surveyed-count">surveyed: 25</div>
            <div className="chart-content">
              <div className="chart-bars">
                <div className="bar-container">
                  <div className="bar-value">45</div>
                  <div className="chart-bar" style={{height: '45%', backgroundColor: barColors[0]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">85</div>
                  <div className="chart-bar" style={{height: '85%', backgroundColor: barColors[1]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">30</div>
                  <div className="chart-bar" style={{height: '30%', backgroundColor: barColors[2]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">75</div>
                  <div className="chart-bar" style={{height: '75%', backgroundColor: barColors[3]}}></div>
                </div>
                <div className="bar-container">
                  <div className="bar-value">50</div>
                  <div className="chart-bar" style={{height: '50%', backgroundColor: barColors[4]}}></div>
                </div>
              </div>
            </div>
            <div className="x-axis">
              <div className="x-label">Strongly Disagree</div>
              <div className="x-label">Disagree</div>
              <div className="x-label">Neutral</div>
              <div className="x-label">Agree</div>
              <div className="x-label">Strongly Agree</div>
            </div>
            <div className="stage-one-text">STAGE ONE EDUCATION</div>
          </div>
        </div>
        
      </>
    )
  }

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e1e5e9'
        }}>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '1rem',
            fontFamily: 'Roboto, sans-serif'
          }}>
            Access Restricted
          </h2>
          <p style={{ 
            color: '#666', 
            marginBottom: '1.5rem',
            fontFamily: 'Roboto, sans-serif'
          }}>
            This page requires password authentication.
          </p>
          <button 
            onClick={checkDashboardPassword}
            style={{
              backgroundColor: '#f05f40',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              fontFamily: 'Roboto, sans-serif',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e04a2b'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f05f40'
            }}
          >
            Enter Password
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header-bar">
        <div className="header-left">
          <span>Workshop Feedback</span>
          <button 
            className="instructor-feedback-btn"
            onClick={() => window.open('http://localhost:5174/instructor-feedback-survey.html', '_blank')}
          >
            Instructor Feedback Survey
          </button>
        </div>
        <div className="header-center"></div>
        <div className="header-right">STAGE ONE EDUCATION</div>
      </header>
      <div className="gear-icon-container">
        <button 
          className="gear-icon-btn"
          onClick={() => {
            // Check if password protection is disabled
            const isPasswordDisabled = localStorage.getItem('passwordProtectionDisabled') === 'true';
            if (isPasswordDisabled) {
              window.open('http://localhost:5174/feedback-data.html', '_blank');
              return;
            }
            
            const storedPassword = localStorage.getItem('feedbackDataPassword') || '1234';
            const password = prompt('Enter password to access Feedback Data:');
            if (password === storedPassword) {
              window.open('http://localhost:5174/feedback-data.html', '_blank');
            } else if (password !== null) {
              alert('Incorrect password. Access denied.');
            }
          }}
          title="Feedback Data"
        >
          ⚙️
        </button>
      </div>
      <div className="workshop-feedback-container">
        <div className="charts-title">
          <h2>Cumulative Workshop Feedback</h2>
          <div className="year-dropdown-container">
            <select 
              id="year-select" 
              className="year-dropdown"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="All">All</option>
            </select>
          </div>
          <div className="workshop-dropdown-container">
            <div className="workshop-dropdown-group">
              <select 
                className="workshop-dropdown"
                value={selectedWorkshop}
                onChange={(e) => setSelectedWorkshop(e.target.value)}
              >
                <option value="AI">Artificial Intelligence Workshop</option>
                <option value="Robotics">Robotics Workshop</option>
                <option value="Mechanical">Mechanical Engineering Workshop</option>
              </select>
            </div>
          </div>
        </div>
        {renderCharts()}
      </div>
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
