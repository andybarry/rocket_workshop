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
  const [roboticsWorkshopData, setRoboticsWorkshopData] = useState([])
  const [mechanicalWorkshopData, setMechanicalWorkshopData] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Specific Workshop Feedback state
  const [specificWorkshop, setSpecificWorkshop] = useState('')
  const [specificLocation, setSpecificLocation] = useState('')
  const [specificDate, setSpecificDate] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const [specificWorkshopData, setSpecificWorkshopData] = useState([])
  const [showSpecificFeedback, setShowSpecificFeedback] = useState(false)

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

  // Fetch Robotics workshop data
  const fetchRoboticsWorkshopData = async () => {
    if (selectedWorkshop !== 'Robotics') return
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/feedback/Robotics`, {
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
        setRoboticsWorkshopData(filteredData)
      }
    } catch (error) {
      console.error('Error fetching Robotics workshop data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Mechanical Engineering workshop data
  const fetchMechanicalWorkshopData = async () => {
    if (selectedWorkshop !== 'Mechanical') return
    
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/feedback/Mechanical`, {
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
        setMechanicalWorkshopData(filteredData)
      }
    } catch (error) {
      console.error('Error fetching Mechanical Engineering workshop data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when workshop or year changes
  useEffect(() => {
    if (selectedWorkshop === 'AI') {
      fetchAiWorkshopData()
    } else if (selectedWorkshop === 'Robotics') {
      fetchRoboticsWorkshopData()
    } else if (selectedWorkshop === 'Mechanical') {
      fetchMechanicalWorkshopData()
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

  // Handle specific workshop selection
  const handleSpecificWorkshopChange = async (e) => {
    const workshop = e.target.value
    setSpecificWorkshop(workshop)
    setSpecificLocation('')
    setSpecificDate('')
    setAvailableDates([])
    setShowSpecificFeedback(false)
    
    if (workshop) {
      await fetchAvailableDates(workshop)
    }
  }

  // Handle specific location selection
  const handleSpecificLocationChange = async (e) => {
    const location = e.target.value
    setSpecificLocation(location)
    setSpecificDate('')
    setShowSpecificFeedback(false)
    
    if (specificWorkshop && location) {
      await fetchAvailableDates(specificWorkshop, location)
    }
  }

  // Handle specific date selection
  const handleSpecificDateChange = (e) => {
    setSpecificDate(e.target.value)
    setShowSpecificFeedback(false)
  }

  // Fetch available dates for specific workshop and location
  const fetchAvailableDates = async (workshop, location = '') => {
    try {
      let workshopType = ''
      if (workshop === 'ai-workshop') workshopType = 'AI'
      else if (workshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (workshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await fetch(`http://localhost:3001/api/feedback/${workshopType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        let filteredData = data
        
        // Filter by location if specified
        if (location) {
          const locationMap = {
            'ann-arbor': 'Ann Arbor, MI',
            'atlanta': 'Atlanta, GA',
            'berkeley': 'Berkeley, CA',
            'boston': 'Boston, MA',
            'houston': 'Houston, TX',
            'los-angeles': 'Los Angeles, CA',
            'new-haven': 'New Haven, CT',
            'orlando': 'Orlando, FL',
            'san-francisco': 'San Francisco, CA',
            'washington-dc': 'Washington, D.C.'
          }
          const fullLocationName = locationMap[location]
          filteredData = data.filter(item => item['workshop-location'] === fullLocationName)
        }
        
        // Extract unique dates
        const dates = [...new Set(filteredData.map(item => item.date))].filter(date => date)
        setAvailableDates(dates.sort())
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    }
  }

  // Fetch specific workshop data
  const fetchSpecificWorkshopData = async () => {
    if (!specificWorkshop || !specificLocation || !specificDate) return
    
    try {
      let workshopType = ''
      if (specificWorkshop === 'ai-workshop') workshopType = 'AI'
      else if (specificWorkshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (specificWorkshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await fetch(`http://localhost:3001/api/feedback/${workshopType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Filter by location and date
        const locationMap = {
          'ann-arbor': 'Ann Arbor, MI',
          'atlanta': 'Atlanta, GA',
          'berkeley': 'Berkeley, CA',
          'boston': 'Boston, MA',
          'houston': 'Houston, TX',
          'los-angeles': 'Los Angeles, CA',
          'new-haven': 'New Haven, CT',
          'orlando': 'Orlando, FL',
          'san-francisco': 'San Francisco, CA',
          'washington-dc': 'Washington, D.C.'
        }
        const fullLocationName = locationMap[specificLocation]
        
        const filteredData = data.filter(item => 
          item['workshop-location'] === fullLocationName && 
          item.date === specificDate
        )
        
        setSpecificWorkshopData(filteredData)
        setShowSpecificFeedback(true)
      }
    } catch (error) {
      console.error('Error fetching specific workshop data:', error)
    }
  }

  // Handle show specific feedback button
  const handleShowSpecificFeedback = () => {
    fetchSpecificWorkshopData()
  }

  // Get filtered comments for specific workshop feedback
  const getSpecificWorkshopComments = () => {
    if (!specificWorkshopData.length) return []
    
    return specificWorkshopData
      .filter(item => item.comments && item.comments.trim() !== '')
      .map(item => ({
        comment: item.comments,
        date: item.date,
        location: item['workshop-location']
      }))
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

  // Process Robotics workshop data to create chart data
  const processRoboticsWorkshopData = () => {
    if (!roboticsWorkshopData.length) return null

    const questions = [
      'had-fun',
      'challenged-appropriately', 
      'learned-electronics',
      'confident-electronics',
      'recommend-workshop',
      'instructor-prepared',
      'instructor-knowledgeable',
      'workshop-comparison'
    ]

    const questionLabels = [
      'I had fun in this workshop',
      'This workshop challenged me appropriately',
      'I learned how to build and understand basic electronic systems',
      'After taking this workshop I feel confident in starting another similar electronics project',
      'I would recommend that this workshop be taught again next year',
      'The Stage One instructor(s) were well prepared',
      'The Stage One instructor(s) were knowledgeable',
      'How does this workshop compare to rest of the activities during your trip?'
    ]

    // Response options for different question types
    const standardResponseOptions = [
      'Strongly Disagree',
      'Disagree', 
      'Neutral',
      'Agree',
      'Strongly Agree'
    ]

    const workshopComparisonResponseOptions = [
      'The worst so far',
      'Worse than most other activities',
      'About the same',
      'Better than most other activities',
      'The best so far'
    ]

    const chartData = questions.map((question, index) => {
      // Determine which response options to use based on the question
      let responseOptions
      if (question === 'workshop-comparison') {
        responseOptions = workshopComparisonResponseOptions
      } else {
        responseOptions = standardResponseOptions
      }

      const counts = responseOptions.map(option => {
        return roboticsWorkshopData.filter(item => item[question] === option).length
      })
      
      return {
        question: questionLabels[index],
        counts: counts,
        total: roboticsWorkshopData.length,
        responseOptions: responseOptions,
        isCombined: false
      }
    })

    return chartData
  }

  // Process Mechanical Engineering workshop data to create chart data
  const processMechanicalWorkshopData = () => {
    if (!mechanicalWorkshopData.length) return null

    const questions = [
      'had-fun',
      'knowledgeable-3d-design', 
      'can-design-cad',
      'well-paced',
      'recommend-workshop',
      'instructor-prepared',
      'instructor-knowledgeable',
      'workshop-comparison'
    ]

    const questionLabels = [
      'I had fun in this workshop',
      'I am more knowledgeable about 3D design after this workshop',
      'I think I can design something using CAD on my own',
      'The workshop was well paced',
      'I would recommend that this workshop be taught again next year',
      'The Stage One instructor(s) were well prepared',
      'The Stage One instructor(s) were knowledgeable',
      'How does this workshop compare to rest of the activities during your trip?'
    ]

    // Response options for different question types
    const standardResponseOptions = [
      'Strongly Disagree',
      'Disagree', 
      'Neutral',
      'Agree',
      'Strongly Agree'
    ]

    const workshopComparisonResponseOptions = [
      'The worst so far',
      'Worse than most other activities',
      'About the same',
      'Better than most other activities',
      'The best so far'
    ]

    const chartData = questions.map((question, index) => {
      // Determine which response options to use based on the question
      let responseOptions
      if (question === 'workshop-comparison') {
        responseOptions = workshopComparisonResponseOptions
      } else {
        responseOptions = standardResponseOptions
      }

      const counts = responseOptions.map(option => {
        return mechanicalWorkshopData.filter(item => item[question] === option).length
      })
      
      return {
        question: questionLabels[index],
        counts: counts,
        total: mechanicalWorkshopData.length,
        responseOptions: responseOptions,
        isCombined: false
      }
    })

    return chartData
  }

  // Process specific workshop data to create chart data
  const processSpecificWorkshopData = () => {
    if (!specificWorkshopData.length) return null

    if (specificWorkshop === 'ai-workshop') {
      return processAiWorkshopDataForSpecific(specificWorkshopData)
    } else if (specificWorkshop === 'robotics-workshop') {
      return processRoboticsWorkshopDataForSpecific(specificWorkshopData)
    } else if (specificWorkshop === 'mechanical-workshop') {
      return processMechanicalWorkshopDataForSpecific(specificWorkshopData)
    }
    return null
  }

  // Process AI workshop data for specific feedback
  const processAiWorkshopDataForSpecific = (data) => {
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
          return data.filter(item => item['ai-tools-before'] === option).length
        })
        const afterCounts = knowledgeResponseOptions.map(option => {
          return data.filter(item => item['ai-tools-after'] === option).length
        })
        
        return {
          question: questionLabels[index],
          counts: beforeCounts,
          afterCounts: afterCounts,
          total: data.length,
          responseOptions: knowledgeResponseOptions,
          isCombined: true
        }
      }

      // Handle combined neural networks chart
      if (question === 'neural-networks-combined') {
        const beforeCounts = knowledgeResponseOptions.map(option => {
          return data.filter(item => item['neural-networks-before'] === option).length
        })
        const afterCounts = knowledgeResponseOptions.map(option => {
          return data.filter(item => item['neural-networks-after'] === option).length
        })
        
        return {
          question: questionLabels[index],
          counts: beforeCounts,
          afterCounts: afterCounts,
          total: data.length,
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
        return data.filter(item => item[question] === option).length
      })
      
      return {
        question: questionLabels[index],
        counts: counts,
        total: data.length,
        responseOptions: responseOptions,
        isCombined: false
      }
    })

    return chartData
  }

  // Process Robotics workshop data for specific feedback
  const processRoboticsWorkshopDataForSpecific = (data) => {
    const questions = [
      'had-fun',
      'challenged-appropriately', 
      'learned-electronics',
      'confident-electronics',
      'recommend-workshop',
      'instructor-prepared',
      'instructor-knowledgeable',
      'workshop-comparison'
    ]

    const questionLabels = [
      'I had fun in this workshop',
      'This workshop challenged me appropriately',
      'I learned how to build and understand basic electronic systems',
      'After taking this workshop I feel confident in starting another similar electronics project',
      'I would recommend that this workshop be taught again next year',
      'The Stage One instructor(s) were well prepared',
      'The Stage One instructor(s) were knowledgeable',
      'How does this workshop compare to rest of the activities during your trip?'
    ]

    const standardResponseOptions = [
      'Strongly Disagree',
      'Disagree', 
      'Neutral',
      'Agree',
      'Strongly Agree'
    ]

    const workshopComparisonResponseOptions = [
      'The worst so far',
      'Worse than most other activities',
      'About the same',
      'Better than most other activities',
      'The best so far'
    ]

    const chartData = questions.map((question, index) => {
      let responseOptions
      if (question === 'workshop-comparison') {
        responseOptions = workshopComparisonResponseOptions
      } else {
        responseOptions = standardResponseOptions
      }

      const counts = responseOptions.map(option => {
        return data.filter(item => item[question] === option).length
      })
      
      return {
        question: questionLabels[index],
        counts: counts,
        total: data.length,
        responseOptions: responseOptions,
        isCombined: false
      }
    })

    return chartData
  }

  // Process Mechanical Engineering workshop data for specific feedback
  const processMechanicalWorkshopDataForSpecific = (data) => {
    const questions = [
      'had-fun',
      'knowledgeable-3d-design', 
      'can-design-cad',
      'well-paced',
      'recommend-workshop',
      'instructor-prepared',
      'instructor-knowledgeable',
      'workshop-comparison'
    ]

    const questionLabels = [
      'I had fun in this workshop',
      'I am more knowledgeable about 3D design after this workshop',
      'I think I can design something using CAD on my own',
      'The workshop was well paced',
      'I would recommend that this workshop be taught again next year',
      'The Stage One instructor(s) were well prepared',
      'The Stage One instructor(s) were knowledgeable',
      'How does this workshop compare to rest of the activities during your trip?'
    ]

    const standardResponseOptions = [
      'Strongly Disagree',
      'Disagree', 
      'Neutral',
      'Agree',
      'Strongly Agree'
    ]

    const workshopComparisonResponseOptions = [
      'The worst so far',
      'Worse than most other activities',
      'About the same',
      'Better than most other activities',
      'The best so far'
    ]

    const chartData = questions.map((question, index) => {
      let responseOptions
      if (question === 'workshop-comparison') {
        responseOptions = workshopComparisonResponseOptions
      } else {
        responseOptions = standardResponseOptions
      }

      const counts = responseOptions.map(option => {
        return data.filter(item => item[question] === option).length
      })
      
      return {
        question: questionLabels[index],
        counts: counts,
        total: data.length,
        responseOptions: responseOptions,
        isCombined: false
      }
    })

    return chartData
  }

  const renderCharts = (isSpecificFeedback = false) => {
    const workshopType = selectedWorkshop
    const barColors = ['#939393', '#b18983', '#c06958', '#d85b49', '#f05f40']
    
    // Handle specific feedback
    if (isSpecificFeedback && showSpecificFeedback) {
      const chartData = processSpecificWorkshopData()
      
      if (!chartData || chartData.length === 0) {
        return (
          <div className="loading-container">
            <div className="loading-text">
              No data available for the selected workshop, location, and date combination.
            </div>
          </div>
        )
      }

      const workshopName = specificWorkshop === 'ai-workshop' ? 'Artificial Intelligence Workshop' :
                          specificWorkshop === 'robotics-workshop' ? 'Robotics Workshop' :
                          specificWorkshop === 'mechanical-workshop' ? 'Mechanical Engineering Workshop' : 'Workshop'

      return (
        <>
          <div className="bar-graphs-container">
            {chartData.slice(0, 3).map((data, index) => (
              <div key={index} className="chart-window">
                <div className="ai-workshop-text">{workshopName}</div>
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
                <div className="ai-workshop-text">{workshopName}</div>
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
                <div className="ai-workshop-text">{workshopName}</div>
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

    // Use real data for Robotics workshop
    if (selectedWorkshop === 'Robotics') {
      const chartData = processRoboticsWorkshopData()
      
      if (!chartData || loading) {
        return (
          <div className="loading-container">
            <div className="loading-text">
              {loading ? 'Loading Robotics workshop data...' : `No data available for Robotics workshop${selectedYear === 'All' ? '' : ` in ${selectedYear}`}`}
            </div>
          </div>
        )
      }

      return (
        <>
          <div className="bar-graphs-container">
            {chartData.slice(0, 3).map((data, index) => (
              <div key={index} className="chart-window">
                <div className="ai-workshop-text">Robotics Workshop</div>
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
          
          <div className="bar-graphs-container">
            {chartData.slice(3, 6).map((data, index) => (
              <div key={index + 3} className="chart-window">
                <div className="ai-workshop-text">Robotics Workshop</div>
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
          
          <div className="bar-graphs-container">
            {chartData.slice(6, 9).map((data, index) => (
              <div key={index + 6} className="chart-window">
                <div className="ai-workshop-text">Robotics Workshop</div>
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

    // Use real data for Mechanical Engineering workshop
    if (selectedWorkshop === 'Mechanical') {
      const chartData = processMechanicalWorkshopData()
      
      if (!chartData || loading) {
        return (
          <div className="loading-container">
            <div className="loading-text">
              {loading ? 'Loading Mechanical Engineering workshop data...' : `No data available for Mechanical Engineering workshop${selectedYear === 'All' ? '' : ` in ${selectedYear}`}`}
            </div>
          </div>
        )
      }

      return (
        <>
          <div className="bar-graphs-container">
            {chartData.slice(0, 3).map((data, index) => (
              <div key={index} className="chart-window">
                <div className="ai-workshop-text">Mechanical Engineering Workshop</div>
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
          
          <div className="bar-graphs-container">
            {chartData.slice(3, 6).map((data, index) => (
              <div key={index + 3} className="chart-window">
                <div className="ai-workshop-text">Mechanical Engineering Workshop</div>
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
          
          <div className="bar-graphs-container">
            {chartData.slice(6, 9).map((data, index) => (
              <div key={index + 6} className="chart-window">
                <div className="ai-workshop-text">Mechanical Engineering Workshop</div>
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
            <select 
              id="workshop-select" 
              className="dropdown-select"
              value={specificWorkshop}
              onChange={handleSpecificWorkshopChange}
            >
              <option value="">Select Workshop</option>
              <option value="ai-workshop">AI Workshop</option>
              <option value="robotics-workshop">Robotics Workshop</option>
              <option value="mechanical-workshop">Mechanical Workshop</option>
            </select>
          </div>
          <div className="dropdown-group">
            <label htmlFor="location-select">Location:</label>
            <select 
              id="location-select" 
              className="dropdown-select"
              value={specificLocation}
              onChange={handleSpecificLocationChange}
              disabled={!specificWorkshop}
            >
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
            <select 
              id="date-select" 
              className="dropdown-select"
              value={specificDate}
              onChange={handleSpecificDateChange}
              disabled={!specificLocation}
            >
              <option value="">Select Date</option>
              {availableDates.map((date, index) => (
                <option key={index} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="show-feedback-container">
          <button 
            className="show-feedback-btn" 
            onClick={handleShowSpecificFeedback}
            disabled={!specificWorkshop || !specificLocation || !specificDate}
          >
            Show Feedback
          </button>
        </div>
        {showSpecificFeedback && (
          <div className="feedback-graphs-section">
            {renderCharts(true)}
            <div className="feedback-comments-section">
              <div className="feedback-comments-title">
                <h3>Feedback Comments</h3>
              </div>
              <div className="feedback-comments-window">
                {getSpecificWorkshopComments().length > 0 ? (
                  getSpecificWorkshopComments().map((commentData, index) => (
                    <div key={index} className="feedback-comment">
                      <div className="comment-text">"{commentData.comment}"</div>
                      <div className="comment-meta">
                        <span className="comment-date">{commentData.date}</span>
                        <span className="comment-location">{commentData.location}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments-message">
                    No comments available for the selected workshop, location, and date combination.
                  </div>
                )}
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
