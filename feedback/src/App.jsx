import { useState, useEffect } from 'react'
import './App.css'
import Login from './Login'

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // Fetch current passwords when settings modal opens
  const fetchCurrentPasswords = async () => {
    try {
      // Fetch current standard password
      const standardResponse = await apiRequest('/api/auth/get-current-standard-password', {
        method: 'GET'
      })
      if (standardResponse.ok) {
        const standardData = await standardResponse.json()
        setCurrentStandardPassword(standardData.password || 'stageone8')
      }

      // Fetch current admin password
      const adminResponse = await apiRequest('/api/auth/get-current-admin-password', {
        method: 'GET'
      })
      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        setCurrentAdminPassword(adminData.password || 'cambridge9')
      }
    } catch (error) {
      console.error('Error fetching current passwords:', error)
      // Fallback to default values if API fails
      setCurrentStandardPassword('stageone8')
      setCurrentAdminPassword('cambridge9')
    }
  }

  // Settings state
  const [showSettings, setShowSettings] = useState(false)
  const [currentStandardPassword, setCurrentStandardPassword] = useState('')
  const [newStandardPassword, setNewStandardPassword] = useState('')
  const [confirmNewStandardPassword, setConfirmNewStandardPassword] = useState('')
  const [currentAdminPassword, setCurrentAdminPassword] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [confirmNewAdminPassword, setConfirmNewAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Helper function to normalize response text for consistent comparison
  const normalizeResponse = (response) => {
    if (!response || typeof response !== 'string') return ''
    return response.toLowerCase().trim()
  }

  // Helper function to check if two responses match (case-insensitive)
  const responsesMatch = (response1, response2) => {
    return normalizeResponse(response1) === normalizeResponse(response2)
  }

  // Authentication functions
  const checkAuthStatus = async () => {
    const storedSessionId = localStorage.getItem('sessionId')
    const storedExpires = localStorage.getItem('sessionExpires')
    const storedIsAdmin = localStorage.getItem('isAdmin')
    const parsedIsAdmin = storedIsAdmin ? JSON.parse(storedIsAdmin) : false
    
    if (!storedSessionId || !storedExpires) {
      setIsCheckingAuth(false)
      return
    }
    
    if (Date.now() > parseInt(storedExpires)) {
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionExpires')
      localStorage.removeItem('isAdmin')
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
        const data = await response.json()
        setIsAuthenticated(true)
        setSessionId(storedSessionId)
        setIsAdmin(data.isAdmin || false)
      } else {
        localStorage.removeItem('sessionId')
        localStorage.removeItem('sessionExpires')
        localStorage.removeItem('isAdmin')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionExpires')
      localStorage.removeItem('isAdmin')
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const handleLogin = (newSessionId, newIsAdmin) => {
    setIsAuthenticated(true)
    setSessionId(newSessionId)
    setIsAdmin(newIsAdmin || false)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('sessionId')
      localStorage.removeItem('sessionExpires')
      localStorage.removeItem('isAdmin')
      setIsAuthenticated(false)
      setSessionId(null)
      setIsAdmin(false)
    }
  }

  const handleStandardPasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newStandardPassword !== confirmNewStandardPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newStandardPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    try {
      const response = await apiRequest('/api/auth/set-standard-password', {
        method: 'POST',
        body: JSON.stringify({ password: newStandardPassword }),
      })

      if (response.ok) {
        setPasswordSuccess('Standard password changed successfully')
        setCurrentStandardPassword(newStandardPassword)
        setNewStandardPassword('')
        setConfirmNewStandardPassword('')
        setTimeout(() => {
          setPasswordSuccess('')
        }, 5000)
      } else {
        const data = await response.json()
        setPasswordError(data.error || 'Failed to change standard password')
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.')
    }
  }

  const handleAdminPasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newAdminPassword !== confirmNewAdminPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newAdminPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long')
      return
    }

    try {
      const response = await apiRequest('/api/auth/set-admin-password', {
        method: 'POST',
        body: JSON.stringify({ password: newAdminPassword }),
      })

      if (response.ok) {
        setPasswordSuccess('Admin password changed successfully')
        setCurrentAdminPassword(newAdminPassword)
        setNewAdminPassword('')
        setConfirmNewAdminPassword('')
        setTimeout(() => {
          setPasswordSuccess('')
        }, 5000)
      } else {
        const data = await response.json()
        setPasswordError(data.error || 'Failed to change admin password')
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.')
    }
  }

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

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
    })
  }
  // Specific Workshop Feedback state
  const [specificWorkshop, setSpecificWorkshop] = useState('')
  const [specificLocation, setSpecificLocation] = useState('')
  const [specificRange, setSpecificRange] = useState('')
  const [specificDate, setSpecificDate] = useState('')
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableDates, setAvailableDates] = useState([])
  const [specificWorkshopData, setSpecificWorkshopData] = useState([])
  const [showSpecificFeedback, setShowSpecificFeedback] = useState(false)



  // Handle specific workshop selection
  const handleSpecificWorkshopChange = async (e) => {
    const workshop = e.target.value
    setSpecificWorkshop(workshop)
    setSpecificLocation('')
    setSpecificRange('')
    setSpecificDate('')
    setAvailableLocations([])
    setAvailableDates([])
    setShowSpecificFeedback(false)
    
    if (workshop) {
      await fetchAvailableOptionsForWorkshop(workshop)
    }
  }

  // Handle specific location selection
  const handleSpecificLocationChange = async (e) => {
    const location = e.target.value
    setSpecificLocation(location)
    setSpecificRange('')
    setSpecificDate('')
    setShowSpecificFeedback(false)
    
    // If location is selected, update available dates for that location
    if (location && specificWorkshop) {
      if (location === 'all-locations') {
        // Show all dates for the workshop across all locations
        await fetchAvailableOptionsForWorkshop(specificWorkshop)
      } else {
        await fetchAvailableDatesForLocation(specificWorkshop, location)
      }
    } else if (!location && specificWorkshop) {
      // If location is cleared, show all dates for the workshop
      await fetchAvailableOptionsForWorkshop(specificWorkshop)
    }
  }

  // Handle specific range selection
  const handleSpecificRangeChange = async (e) => {
    const range = e.target.value
    setSpecificRange(range)
    setSpecificDate('')
    setShowSpecificFeedback(false)
    
    // Update the date dropdown based on range selection
    if (range && specificWorkshop) {
      if (specificLocation) {
        await fetchDatesBasedOnRange(specificWorkshop, specificLocation, range)
      } else {
        await fetchDatesBasedOnRange(specificWorkshop, '', range)
      }
    }
  }

  // Handle specific date selection
  const handleSpecificDateChange = async (e) => {
    const date = e.target.value
    setSpecificDate(date)
    setShowSpecificFeedback(false)
    
    // If date is selected, update available locations for that date/year
    if (date && specificWorkshop) {
      if (specificRange === 'year') {
        await fetchAvailableLocationsForYear(specificWorkshop, date)
      } else {
        await fetchAvailableLocationsForDate(specificWorkshop, date)
      }
    } else if (!date && specificWorkshop) {
      // If date is cleared, show all locations for the workshop
      await fetchAvailableOptionsForWorkshop(specificWorkshop)
    }
  }

  // Fetch available locations and dates for specific workshop
  const fetchAvailableOptionsForWorkshop = async (workshop) => {
    try {
      let workshopType = ''
      if (workshop === 'ai-workshop') workshopType = 'AI'
      else if (workshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (workshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await apiRequest(`/api/feedback/${workshopType}`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Extract unique locations (filter out null/undefined/empty)
        const locations = [...new Set(data.map(item => item['workshop-location']).filter(location => location && location.trim() !== ''))]
        setAvailableLocations(locations.sort())
        
        // Extract unique dates (filter out null/undefined/empty)
        const dates = [...new Set(data.map(item => item.date).filter(date => date && date.trim() !== ''))]
        setAvailableDates(dates.sort())
      }
    } catch (error) {
      console.error('Error fetching available options:', error)
    }
  }

  // Fetch available dates for a specific workshop and location
  const fetchAvailableDatesForLocation = async (workshop, location) => {
    try {
      let workshopType = ''
      if (workshop === 'ai-workshop') workshopType = 'AI'
      else if (workshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (workshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await apiRequest(`/api/feedback/${workshopType}`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Filter data by location and extract unique dates
        const filteredData = data.filter(item => item['workshop-location'] === location)
        const dates = [...new Set(filteredData.map(item => item.date).filter(date => date && date.trim() !== ''))]
        setAvailableDates(dates.sort())
      }
    } catch (error) {
      console.error('Error fetching available dates for location:', error)
    }
  }

  // Fetch available locations for a specific workshop and date
  const fetchAvailableLocationsForDate = async (workshop, date) => {
    try {
      let workshopType = ''
      if (workshop === 'ai-workshop') workshopType = 'AI'
      else if (workshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (workshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await apiRequest(`/api/feedback/${workshopType}`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Filter data by date and extract unique locations
        const filteredData = data.filter(item => item.date === date)
        const locations = [...new Set(filteredData.map(item => item['workshop-location']).filter(location => location && location.trim() !== ''))]
        
        // Preserve the currently selected location if it's still available
        const currentLocation = specificLocation
        setAvailableLocations(locations.sort())
        
        // If the current location is still available, keep it selected
        if (currentLocation && locations.includes(currentLocation)) {
          setSpecificLocation(currentLocation)
        } else if (currentLocation && currentLocation !== 'all-locations') {
          // If the current location is not available for this date, clear it
          setSpecificLocation('')
        }
      }
    } catch (error) {
      console.error('Error fetching available locations for date:', error)
    }
  }

  // Fetch available locations for a specific workshop and year
  const fetchAvailableLocationsForYear = async (workshop, year) => {
    try {
      let workshopType = ''
      if (workshop === 'ai-workshop') workshopType = 'AI'
      else if (workshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (workshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await apiRequest(`/api/feedback/${workshopType}`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Filter data by year and extract unique locations
        const filteredData = data.filter(item => {
          if (item.date) {
            const dateParts = item.date.split('/')
            if (dateParts.length === 3) {
              return dateParts[2] === year // Year is the third part in M/D/YYYY format
            }
          }
          return false
        })
        const locations = [...new Set(filteredData.map(item => item['workshop-location']).filter(location => location && location.trim() !== ''))]
        
        // Preserve the currently selected location if it's still available
        const currentLocation = specificLocation
        setAvailableLocations(locations.sort())
        
        // If the current location is still available, keep it selected
        if (currentLocation && locations.includes(currentLocation)) {
          setSpecificLocation(currentLocation)
        } else if (currentLocation && currentLocation !== 'all-locations') {
          // If the current location is not available for this year, clear it
          setSpecificLocation('')
        }
      }
    } catch (error) {
      console.error('Error fetching available locations for year:', error)
    }
  }

  // Fetch dates based on range selection
  const fetchDatesBasedOnRange = async (workshop, location = '', range) => {
    try {
      let workshopType = ''
      if (workshop === 'ai-workshop') workshopType = 'AI'
      else if (workshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (workshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await apiRequest(`/api/feedback/${workshopType}`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Filter by location if specified (but not if "all-locations" is selected)
        let filteredData = (location && location !== 'all-locations') ? data.filter(item => item['workshop-location'] === location) : data
        
        if (range === 'lifetime') {
          // For lifetime, we don't need dates in the dropdown since all data will be shown
          setAvailableDates([])
        } else if (range === 'year') {
          // Extract unique years from dates
          const years = [...new Set(filteredData.map(item => {
            if (item.date) {
              const dateParts = item.date.split('/')
              if (dateParts.length === 3) {
                return dateParts[2] // Year is the third part in M/D/YYYY format
              }
            }
            return null
          }).filter(year => year))]
          setAvailableDates(years.sort())
        } else if (range === 'date') {
          // Show all individual dates
          const dates = [...new Set(filteredData.map(item => item.date).filter(date => date && date.trim() !== ''))]
          setAvailableDates(dates.sort())
        }
      }
    } catch (error) {
      console.error('Error fetching dates based on range:', error)
    }
  }

  // Fetch specific workshop data
  const fetchSpecificWorkshopData = async () => {
    // Require workshop selection and either location or range selection
    if (!specificWorkshop || (!specificLocation && !specificRange)) return
    
    try {
      let workshopType = ''
      if (specificWorkshop === 'ai-workshop') workshopType = 'AI'
      else if (specificWorkshop === 'robotics-workshop') workshopType = 'Robotics'
      else if (specificWorkshop === 'mechanical-workshop') workshopType = 'Mechanical'
      
      const response = await apiRequest(`/api/feedback/${workshopType}`, {
        method: 'GET',
        mode: 'cors'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        let filteredData = data
        
        // First filter by location if specified (but not if "all-locations" is selected)
        if (specificLocation && specificLocation !== 'all-locations') {
          filteredData = filteredData.filter(item => 
            item['workshop-location'] === specificLocation
          )
        }
        
        // Then apply range-based filtering
        if (specificRange === 'lifetime') {
          // Show all data for the workshop (and location if specified)
          // filteredData is already correctly filtered above
        } else if (specificRange === 'year' && specificDate) {
          // Filter by year
          filteredData = filteredData.filter(item => {
            if (item.date) {
              const dateParts = item.date.split('/')
              if (dateParts.length === 3) {
                return dateParts[2] === specificDate // specificDate contains the year
              }
            }
            return false
          })
        } else if (specificRange === 'date' && specificDate) {
          // Filter by specific date
          filteredData = filteredData.filter(item => 
            item.date === specificDate
          )
        }
        
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

  // Get favorite part responses
  const getSpecificWorkshopFavoriteParts = () => {
    if (!specificWorkshopData.length) return []
    
    return specificWorkshopData
      .filter(item => item['favorite-part'] && item['favorite-part'].trim() !== '')
      .map(item => ({
        comment: item['favorite-part'],
        date: item.date,
        location: item['workshop-location']
      }))
  }

  // Get instructor responses
  const getSpecificWorkshopInstructors = () => {
    if (!specificWorkshopData.length) return []
    
    return specificWorkshopData
      .filter(item => item['instructor'] && item['instructor'].trim() !== '')
      .map(item => ({
        comment: item['instructor'],
        date: item.date,
        location: item['workshop-location']
      }))
  }

  // Get next electronics workshop responses (for Robotics)
  const getSpecificWorkshopNextElectronics = () => {
    if (!specificWorkshopData.length) return []
    
    return specificWorkshopData
      .filter(item => item['next-electronics'] && item['next-electronics'].trim() !== '')
      .map(item => ({
        comment: item['next-electronics'],
        date: item.date,
        location: item['workshop-location']
      }))
  }

  // Get next design responses (for Mechanical)
  const getSpecificWorkshopNextDesign = () => {
    if (!specificWorkshopData.length) return []
    
    return specificWorkshopData
      .filter(item => item['next-design'] && item['next-design'].trim() !== '')
      .map(item => ({
        comment: item['next-design'],
        date: item.date,
        location: item['workshop-location']
      }))
  }

  // Get filter display text based on user selections
  const getFilterDisplayText = () => {
    if (specificRange === 'lifetime') {
      if (specificLocation && specificLocation !== 'all-locations') {
        return `${specificLocation} - Lifetime`
      } else {
        return 'Lifetime'
      }
    } else if (specificRange === 'year' && specificDate) {
      if (specificLocation && specificLocation !== 'all-locations') {
        return `${specificLocation} - ${specificDate}`
      } else {
        return specificDate
      }
    } else if (specificRange === 'date' && specificDate) {
      if (specificLocation && specificLocation !== 'all-locations') {
        return `${specificLocation} - ${specificDate}`
      } else {
        return specificDate
      }
    } else if (specificLocation && specificLocation !== 'all-locations') {
      return specificLocation
    }
    return ''
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
          return data.filter(item => responsesMatch(item['ai-tools-before'], option)).length
        })
        const afterCounts = knowledgeResponseOptions.map(option => {
          return data.filter(item => responsesMatch(item['ai-tools-after'], option)).length
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
          return data.filter(item => responsesMatch(item['neural-networks-before'], option)).length
        })
        const afterCounts = knowledgeResponseOptions.map(option => {
          return data.filter(item => responsesMatch(item['neural-networks-after'], option)).length
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
        return data.filter(item => responsesMatch(item[question], option)).length
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
        return data.filter(item => responsesMatch(item[question], option)).length
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
        return data.filter(item => responsesMatch(item[question], option)).length
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

  // Render charts for specific feedback
  const renderSpecificCharts = () => {
    if (!showSpecificFeedback) return null
    
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

    const filterDisplayText = getFilterDisplayText()

    return (
      <>
        <div className="bar-graphs-container">
          {chartData.slice(0, 3).map((data, index) => (
            <div key={index} className="chart-window">
              <div className="chart-header">
                <div className="ai-workshop-text">{workshopName}</div>
                {filterDisplayText && <div className="chart-filter-info">{filterDisplayText}</div>}
              </div>
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
                        const beforeActualPercentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                        const afterActualPercentage = data.total > 0 ? Math.round((afterCount / data.total) * 100) : 0
                        return (
                          <div key={barIndex} className="combined-bar-container">
                            <div className="combined-bar-group">
                              <div className="combined-bar-value">
                                <div>{count}</div>
                                <div>({beforeActualPercentage}%)</div>
                              </div>
                              <div 
                                className="combined-chart-bar before-bar" 
                                style={{
                                  height: `${beforePercentage}%`, 
                                  backgroundColor: '#939393'
                                }}
                              ></div>
                            </div>
                            <div className="combined-bar-group">
                              <div className="combined-bar-value">
                                <div>{afterCount}</div>
                                <div>({afterActualPercentage}%)</div>
                              </div>
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
                        const actualPercentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                        return (
                          <div key={barIndex} className="bar-container">
                            <div className="bar-value">
                              <div>{count}</div>
                              <div>({actualPercentage}%)</div>
                            </div>
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
              <div className="chart-header">
                <div className="ai-workshop-text">{workshopName}</div>
                {filterDisplayText && <div className="chart-filter-info">{filterDisplayText}</div>}
              </div>
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
                        const beforeActualPercentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                        const afterActualPercentage = data.total > 0 ? Math.round((afterCount / data.total) * 100) : 0
                        return (
                          <div key={barIndex} className="combined-bar-container">
                            <div className="combined-bar-group">
                              <div className="combined-bar-value">
                                <div>{count}</div>
                                <div>({beforeActualPercentage}%)</div>
                              </div>
                              <div 
                                className="combined-chart-bar before-bar" 
                                style={{
                                  height: `${beforePercentage}%`, 
                                  backgroundColor: '#939393'
                                }}
                              ></div>
                            </div>
                            <div className="combined-bar-group">
                              <div className="combined-bar-value">
                                <div>{afterCount}</div>
                                <div>({afterActualPercentage}%)</div>
                              </div>
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
                        const actualPercentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                        return (
                          <div key={barIndex} className="bar-container">
                            <div className="bar-value">
                              <div>{count}</div>
                              <div>({actualPercentage}%)</div>
                            </div>
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
              <div className="chart-header">
                <div className="ai-workshop-text">{workshopName}</div>
                {filterDisplayText && <div className="chart-filter-info">{filterDisplayText}</div>}
              </div>
              <div className="chart-title">{data.question}</div>
              <div className="chart-surveyed-count">surveyed: {data.total}</div>
              <div className="chart-content">
                <div className="chart-bars">
                  {data.counts.map((count, barIndex) => {
                    const maxCount = Math.max(...data.counts)
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                    const actualPercentage = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                    return (
                      <div key={barIndex} className="bar-container">
                        <div className="bar-value">
                          <div>{count}</div>
                          <div>({actualPercentage}%)</div>
                        </div>
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

  // Show login component if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <header className="header-bar">
        <div className="header-left">
          <span><strong>STAGE ONE EDUCATION</strong> <span className="header-separator">|</span> Workshop Feedback</span>
        </div>
        <div className="header-center"></div>
        <div className="header-right">
          {isAdmin && (
            <>
              <button 
                className="gear-icon-btn"
                onClick={() => {
                  window.open('/feedback-data.html', '_blank');
                }}
                title="Feedback Data"
              >
                ⚙️
              </button>
              <button 
                className="settings-btn"
                onClick={() => {
                  setShowSettings(!showSettings)
                  if (!showSettings) {
                    fetchCurrentPasswords()
                  }
                }}
                title="Settings"
              >
                🔧
              </button>
            </>
          )}
          <button 
            className="instructor-feedback-btn"
            onClick={() => window.open('/instructor-feedback-survey.html', '_blank')}
          >
            Instructor Feedback Survey
          </button>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </header>
      <div className="specific-feedback-title">
        <div className="dropdown-and-button-wrapper">
          <div className="dropdown-container">
            <div className="dropdown-group">
              <select 
                id="workshop-select" 
                className={`dropdown-select ${specificWorkshop ? 'selected' : ''}`}
                value={specificWorkshop}
                onChange={handleSpecificWorkshopChange}
              >
                <option value="">Select Workshop</option>
                <option value="ai-workshop">Artificial Intelligence Workshop</option>
                <option value="robotics-workshop">Robotics Workshop</option>
                <option value="mechanical-workshop">Mechanical Workshop</option>
              </select>
            </div>
            <div className="dropdown-group">
              <select 
                id="location-select" 
                className={`dropdown-select ${specificLocation ? 'selected' : ''}`}
                value={specificLocation}
                onChange={handleSpecificLocationChange}
                disabled={!specificWorkshop}
              >
                <option value="">Select Location</option>
                {availableLocations.map((location, index) => (
                  <option key={index} value={location}>{location}</option>
                ))}
                <option value="all-locations">All Locations</option>
              </select>
            </div>
            <div className="dropdown-group">
              <select 
                id="range-select" 
                className={`dropdown-select ${specificRange ? 'selected' : ''}`}
                value={specificRange}
                onChange={handleSpecificRangeChange}
                disabled={!specificWorkshop}
              >
                <option value="">Select Range</option>
                <option value="lifetime">Lifetime</option>
                <option value="year">Year</option>
                <option value="date">Date</option>
              </select>
            </div>
            <div className="dropdown-group">
              <select 
                id="date-select" 
                className={`dropdown-select ${specificDate ? 'selected' : ''}`}
                value={specificDate}
                onChange={handleSpecificDateChange}
                disabled={!specificWorkshop || !specificRange || specificRange === 'lifetime'}
              >
                <option value="">
                  {specificRange === 'year' ? 'Select Year' : 
                   specificRange === 'date' ? 'Select Date' : 
                   'Select Date'}
                </option>
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
              disabled={!specificWorkshop || (!specificLocation && !specificRange) || 
                       (specificRange && specificRange !== 'lifetime' && !specificDate)}
            >
              Show Feedback
            </button>
          </div>
        </div>
        {showSpecificFeedback && (
          <div className="feedback-graphs-section">
            {renderSpecificCharts()}
            <div className="favorite-part-section">
              <div className="favorite-part-title">
                <h3>My favorite part of this workshop was</h3>
              </div>
              <div className="favorite-part-window">
                {getSpecificWorkshopFavoriteParts().length > 0 ? (
                  getSpecificWorkshopFavoriteParts().map((commentData, index) => (
                    <div key={index} className="feedback-comment">
                      <div className="comment-text">"{commentData.comment}"</div>
                      <div className="comment-meta">
                        <span className="comment-date">{commentData.date}</span>
                        <span>-</span>
                        <span className="comment-location">{commentData.location}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments-message">
                    No responses available for the selected workshop, location, and date combination.
                  </div>
                )}
              </div>
            </div>
            {specificWorkshop === 'robotics-workshop' && (
              <div className="next-electronics-section">
                <div className="next-electronics-title">
                  <h3>In the next electronics workshop I want to learn how to _______</h3>
                </div>
                <div className="next-electronics-window">
                  {getSpecificWorkshopNextElectronics().length > 0 ? (
                    getSpecificWorkshopNextElectronics().map((commentData, index) => (
                      <div key={index} className="feedback-comment">
                        <div className="comment-text">"{commentData.comment}"</div>
                        <div className="comment-meta">
                          <span className="comment-date">{commentData.date}</span>
                          <span>-</span>
                          <span className="comment-location">{commentData.location}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments-message">
                      No responses available for the selected workshop, location, and date combination.
                    </div>
                  )}
                </div>
              </div>
            )}
            {specificWorkshop === 'mechanical-workshop' && (
              <div className="next-design-section">
                <div className="next-design-title">
                  <h3>Something I'd like to try designing next is</h3>
                </div>
                <div className="next-design-window">
                  {getSpecificWorkshopNextDesign().length > 0 ? (
                    getSpecificWorkshopNextDesign().map((commentData, index) => (
                      <div key={index} className="feedback-comment">
                        <div className="comment-text">"{commentData.comment}"</div>
                        <div className="comment-meta">
                          <span className="comment-date">{commentData.date}</span>
                          <span>-</span>
                          <span className="comment-location">{commentData.location}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments-message">
                      No responses available for the selected workshop, location, and date combination.
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="instructor-section">
              <div className="instructor-title">
                <h3>Which workshop instructor did you learn the most from</h3>
              </div>
              <div className="instructor-window">
                {getSpecificWorkshopInstructors().length > 0 ? (
                  getSpecificWorkshopInstructors().map((commentData, index) => (
                    <div key={index} className="feedback-comment">
                      <div className="comment-text">"{commentData.comment}"</div>
                      <div className="comment-meta">
                        <span className="comment-date">{commentData.date}</span>
                        <span>-</span>
                        <span className="comment-location">{commentData.location}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments-message">
                    No responses available for the selected workshop, location, and date combination.
                  </div>
                )}
              </div>
            </div>
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
                        <span>-</span>
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
          <span className="footer-version">V25.10</span>
        </div>
      </footer>
      
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <div className="settings-header">
              <h3>Settings</h3>
              <button 
                className="close-settings-btn"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>
            <div className="settings-body">
              <div className="password-section">
                <h4>Standard Password</h4>
                
                <div className="current-password-display">
                  <span className="current-password-label">Current Standard Password:</span>
                  <span className="current-password-value">{currentStandardPassword}</span>
                </div>
                
                <form onSubmit={handleStandardPasswordChange}>
                  <div className="form-group">
                    <label htmlFor="newStandardPassword">New Standard Password:</label>
                    <input
                      type="text"
                      id="newStandardPassword"
                      value={newStandardPassword}
                      onChange={(e) => setNewStandardPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmNewStandardPassword">Confirm New Standard Password:</label>
                    <input
                      type="text"
                      id="confirmNewStandardPassword"
                      value={confirmNewStandardPassword}
                      onChange={(e) => setConfirmNewStandardPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="change-password-submit-btn">
                    Change Standard Password
                  </button>
                  {passwordSuccess && passwordSuccess.includes('Standard') && (
                    <div className="success-message">{passwordSuccess}</div>
                  )}
                  {passwordError && (passwordError.includes('Standard') || passwordError.includes('password')) && (
                    <div className="error-message">{passwordError}</div>
                  )}
                </form>
              </div>
              
              <div className="password-section-divider"></div>
              
              <div className="password-section">
                <h4>Admin Password</h4>
                
                <div className="current-password-display">
                  <span className="current-password-label">Current Admin Password:</span>
                  <span className="current-password-value">{currentAdminPassword}</span>
                </div>
                
                <form onSubmit={handleAdminPasswordChange}>
                  <div className="form-group">
                    <label htmlFor="newAdminPassword">New Admin Password:</label>
                    <input
                      type="text"
                      id="newAdminPassword"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmNewAdminPassword">Confirm New Admin Password:</label>
                    <input
                      type="text"
                      id="confirmNewAdminPassword"
                      value={confirmNewAdminPassword}
                      onChange={(e) => setConfirmNewAdminPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <button type="submit" className="change-password-submit-btn">
                    Change Admin Password
                  </button>
                  {passwordSuccess && passwordSuccess.includes('Admin') && (
                    <div className="success-message">{passwordSuccess}</div>
                  )}
                  {passwordError && (passwordError.includes('Admin') || passwordError.includes('password')) && (
                    <div className="error-message">{passwordError}</div>
                  )}
                </form>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
