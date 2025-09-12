import { useState, useEffect } from 'react'
import './App.css'

function FeedbackData() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState('AI')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [columnWidths, setColumnWidths] = useState(() => {
    const widths = Array(15).fill(150)
    widths[0] = 100 // Date column - make it narrower
    widths[1] = 100 // Time column - make it narrower
    widths[14] = 300 // Comments/Suggestions/Ideas column - make it wider
    return widths
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeColumn, setResizeColumn] = useState(null)
  const [selectedCells, setSelectedCells] = useState(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [cellData, setCellData] = useState({})
  const [feedbackData, setFeedbackData] = useState([])
  const [sortedFeedbackData, setSortedFeedbackData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteRowIndex, setDeleteRowIndex] = useState(null)
  const [deletedRows, setDeletedRows] = useState({
    AI: [],
    Robotics: [],
    Mechanical: [],
    Instructor: []
  }) // Store deleted rows history for undo, organized by workshop type
  const [zoomLevel, setZoomLevel] = useState(65) // Zoom level percentage - 65% shows all columns, displayed as 100%
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState({})
  const [isImporting, setIsImporting] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])

  // Password protection function
  const checkPassword = () => {
    // Check if password protection is disabled
    const isPasswordDisabled = localStorage.getItem('passwordProtectionDisabled') === 'true'
    if (isPasswordDisabled) {
      setIsAuthenticated(true)
      return true
    }
    
    const storedPassword = localStorage.getItem('feedbackDataPassword') || '1234'
    const password = prompt('Enter password to access Feedback Data:')
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
    checkPassword()
  }, [])

  // Function to convert numeric values to text labels for instructor survey
  const convertInstructorValueToText = (value, fieldName) => {
    if (!value) return ''
    
    // Rating scale fields (1-5 scale)
    if (['venue-rating', 'content-relevance', 'schedule-timing'].includes(fieldName)) {
      const ratingMap = {
        '1': 'Poor',
        '2': 'Fair', 
        '3': 'Good',
        '4': 'Very Good',
        '5': 'Excellent'
      }
      return ratingMap[value] || value
    }
    
    // Future instruct field (1-5 scale)
    if (fieldName === 'future-instruct') {
      const futureMap = {
        '1': 'Definitely Not',
        '2': 'Probably Not',
        '3': 'Not Sure', 
        '4': 'Probably',
        '5': 'Definitely'
      }
      return futureMap[value] || value
    }
    
    // For other fields, return as is
    return value
  }

  // Color mapping function for feedback responses
  const getCellColor = (text) => {
    if (!text || typeof text !== 'string') return { backgroundColor: 'white', color: '#000' }
    
    const normalizedText = text.toLowerCase().trim()
    
    // Understanding level colors (highest priority)
    if (normalizedText.includes('strong conceptual understanding')) {
      return { backgroundColor: '#1155cc', color: '#000' }
    } else if (normalizedText.includes('advanced understanding')) {
      return { backgroundColor: '#3c78d8', color: '#000' }
    } else if (normalizedText.includes('average understanding')) {
      return { backgroundColor: '#6d9eeb', color: '#000' }
    } else if (normalizedText.includes('basic understanding')) {
      return { backgroundColor: '#a4c2f4', color: '#000' }
    } else if (normalizedText.includes('minimal knowledge')) {
      return { backgroundColor: '#c9daf8', color: '#000' }
    }
    
    // Agreement scale colors
    if (normalizedText.includes('strongly disagree')) {
      return { backgroundColor: '#e06666', color: '#000' }
    } else if (normalizedText.includes('disagree')) {
      return { backgroundColor: '#f4cccc', color: '#000' }
    } else if (normalizedText.includes('neutral')) {
      return { backgroundColor: 'white', color: '#000' }
    } else if (normalizedText.includes('agree') && !normalizedText.includes('strongly')) {
      return { backgroundColor: '#b7e1cd', color: '#000' }
    } else if (normalizedText.includes('strongly agree')) {
      return { backgroundColor: '#57bb8a', color: '#000' }
    }
    
    // Workshop comparison colors
    if (normalizedText.includes('the worst so far')) {
      return { backgroundColor: '#e06666', color: '#000' }
    } else if (normalizedText.includes('worse than most other activities')) {
      return { backgroundColor: '#f4cccc', color: '#000' }
    } else if (normalizedText.includes('about the same')) {
      return { backgroundColor: 'white', color: '#000' }
    } else if (normalizedText.includes('better than most other activities')) {
      return { backgroundColor: '#b7e1cd', color: '#000' }
    } else if (normalizedText.includes('the best so far')) {
      return { backgroundColor: '#57bb8a', color: '#000' }
    }
    
    // Instructor survey rating colors
    if (normalizedText.includes('poor')) {
      return { backgroundColor: '#e06666', color: '#000' } // Strongly Disagree red
    } else if (normalizedText.includes('fair')) {
      return { backgroundColor: '#f4cccc', color: '#000' } // Disagree light red
    } else if (normalizedText.includes('very good')) {
      return { backgroundColor: '#b7e1cd', color: '#000' } // Agree light green
    } else if (normalizedText.includes('good') && !normalizedText.includes('very')) {
      return { backgroundColor: 'white', color: '#000' } // Neutral white
    } else if (normalizedText.includes('excellent')) {
      return { backgroundColor: '#57bb8a', color: '#000' } // Strongly Agree green
    }
    
    // Instructor survey future instruct colors
    if (normalizedText.includes('definitely not')) {
      return { backgroundColor: '#e06666', color: '#000' }
    } else if (normalizedText.includes('probably not')) {
      return { backgroundColor: '#f4cccc', color: '#000' }
    } else if (normalizedText.includes('not sure')) {
      return { backgroundColor: 'white', color: '#000' }
    } else if (normalizedText.includes('probably')) {
      return { backgroundColor: '#b7e1cd', color: '#000' }
    } else if (normalizedText.includes('definitely')) {
      return { backgroundColor: '#57bb8a', color: '#000' }
    }
    
    // Default color for unmatched text
    return { backgroundColor: 'white', color: '#000' }
  }

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200)) // Max zoom 200%
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50)) // Min zoom 50%
  }

  // Print table function
  const printTable = () => {
    if (feedbackData.length === 0) {
      alert('No data available to print')
      return
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    // Get headers based on selected workshop
    let headers = []
    if (selectedWorkshop === 'AI') {
      headers = [
        'Date',
        'Time',
        'I did this workshop in',
        'I had fun in this workshop',
        'My favorite part of this workshop was',
        'This workshop challenged me appropriately',
        'Before this workshop my comfort with AI tools was',
        'After this workshop my comfort with AI tools was',
        'Before this workshop my understanding of neural networks was',
        'After this workshop my understanding of neural networks was',
        'Which workshop instructor did you learn the most from?',
        'The Stage One instructor(s) were well prepared',
        'The Stage One instructor(s) were knowledgeable',
        'How does this workshop compare to rest of the activities during your trip?',
        'Comments/Suggestions/Ideas (we will read everything you write)'
      ]
    } else if (selectedWorkshop === 'Robotics') {
      headers = [
        'Date',
        'Time',
        'I did this workshop in',
        'I had fun in this workshop',
        'My favorite part of this workshop was',
        'This workshop challenged me appropriately',
        'I learned how to build and understand basic electronic systems',
        'After taking this workshop I feel confident in starting another similar electronics project',
        'In the next electronics workshop I want to learn how to _______',
        'I would recommend that this workshop be taught again next year',
        'Which workshop instructor did you learn the most from?',
        'The Stage One instructor(s) were well prepared',
        'The Stage One instructor(s) were knowledgeable',
        'How does this workshop compare to rest of the activities during your trip?',
        'Comments/Suggestions/Ideas (we will read everything you write)'
      ]
    } else if (selectedWorkshop === 'Mechanical') {
      headers = [
        'Date',
        'Time',
        'I did this workshop in',
        'I had fun in this workshop',
        'My favorite part of this workshop was',
        'I am more knowledgeable about 3D design after this workshop',
        'I think I can design something using CAD on my own',
        'Something I\'d like to try designing next is',
        'The workshop was well paced',
        'I would recommend that this workshop be taught again next year',
        'Which workshop instructor did you learn the most from?',
        'The Stage One instructor(s) were well prepared',
        'The Stage One instructor(s) were knowledgeable',
        'How does this workshop compare to rest of the activities during your trip?',
        'Comments/Suggestions/Ideas (we will read everything you write)'
      ]
    } else if (selectedWorkshop === 'Instructor') {
      headers = [
        'Date',
        'Time',
        'I instructed a workshop in',
        'What type of session did you instruct?',
        'I felt well-prepared before the event began',
        'How would you rate the workshop venue?',
        'How would you rate the workshop content?',
        'How would you rate the workshop schedule and timing?',
        'Would you instruct future workshops with Stage One Education?',
        'Comments, suggestions, or ideas',
        '',
        '',
        ''
      ]
    }

    // Create HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedWorkshop} Workshop Feedback Data</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 10px; 
            font-size: 10px;
            line-height: 1.2;
          }
          h1 { 
            color: #333; 
            text-align: center; 
            margin-bottom: 20px; 
            font-size: 16px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            table-layout: fixed;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 4px; 
            text-align: left; 
            vertical-align: top; 
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-size: 9px;
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
            font-size: 9px;
            padding: 6px 4px;
          }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .print-date { 
            text-align: right; 
            margin-bottom: 15px; 
            font-size: 10px; 
            color: #666; 
          }
          .table-container {
            overflow: visible;
            width: 100%;
          }
          @media print {
            body { 
              margin: 5px; 
              font-size: 9px;
            }
            .print-date { 
              margin-bottom: 8px; 
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th, td {
              font-size: 8px;
              padding: 3px;
            }
            h1 {
              font-size: 14px;
              margin-bottom: 15px;
            }
          }
          @page {
            margin: 0.5in;
            size: A4 landscape;
          }
        </style>
      </head>
      <body>
        <div class="print-date">Printed on: ${new Date().toLocaleDateString()}</div>
        <h1>${selectedWorkshop} Workshop Feedback Data</h1>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${feedbackData.map(feedback => {
                let row = []
                if (selectedWorkshop === 'AI') {
                  const formattedDate = formatDateOnly(feedback.date)
                  const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
                  row = [
                    formattedDate,
                    formattedTime,
                    feedback['workshop-location'] || '',
                    feedback['had-fun'] || '',
                    feedback['favorite-part'] || '',
                    feedback['challenged-appropriately'] || '',
                    feedback['ai-tools-before'] || '',
                    feedback['ai-tools-after'] || '',
                    feedback['neural-networks-before'] || '',
                    feedback['neural-networks-after'] || '',
                    feedback['instructor'] || '',
                    feedback['instructor-prepared'] || '',
                    feedback['instructor-knowledgeable'] || '',
                    feedback['workshop-comparison'] || '',
                    feedback['comments'] || ''
                  ]
                } else if (selectedWorkshop === 'Robotics') {
                  const formattedDate = formatDateOnly(feedback.date)
                  const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
                  row = [
                    formattedDate,
                    formattedTime,
                    feedback['workshop-location'] || '',
                    feedback['had-fun'] || '',
                    feedback['favorite-part'] || '',
                    feedback['challenged-appropriately'] || '',
                    feedback['learned-electronics'] || '',
                    feedback['confident-electronics'] || '',
                    feedback['next-electronics'] || '',
                    feedback['recommend-workshop'] || '',
                    feedback['instructor'] || '',
                    feedback['instructor-prepared'] || '',
                    feedback['instructor-knowledgeable'] || '',
                    feedback['workshop-comparison'] || '',
                    feedback['comments'] || ''
                  ]
                } else if (selectedWorkshop === 'Mechanical') {
                  const formattedDate = formatDateOnly(feedback.date)
                  const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
                  row = [
                    formattedDate,
                    formattedTime,
                    feedback['workshop-location'] || '',
                    feedback['had-fun'] || '',
                    feedback['favorite-part'] || '',
                    feedback['knowledgeable-3d-design'] || '',
                    feedback['can-design-cad'] || '',
                    feedback['next-design'] || '',
                    feedback['well-paced'] || '',
                    feedback['recommend-workshop'] || '',
                    feedback['instructor'] || '',
                    feedback['instructor-prepared'] || '',
                    feedback['instructor-knowledgeable'] || '',
                    feedback['workshop-comparison'] || '',
                    feedback['comments'] || ''
                  ]
                } else if (selectedWorkshop === 'Instructor') {
                  const formattedDate = formatDateOnly(feedback.date)
                  const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
                  row = [
                    formattedDate,
                    formattedTime,
                    (() => {
            const locations = Array.isArray(feedback['instructed-location']) ? feedback['instructed-location'] : []
            const otherText = feedback['instructed-location-other-text'] || ''
            let result = locations.join(', ')
            if (locations.includes('Other') && otherText) {
              result = result.replace('Other', `Other: ${otherText}`)
            }
            return result
          })(),
                    (() => {
            const sessionType = feedback['session-type'] || ''
            const otherText = feedback['session-type-other-text'] || ''
            if (sessionType === 'Other' && otherText) {
              return `Other: ${otherText}`
            }
            return sessionType
          })(),
                    feedback['well-prepared'] || '',
                    convertInstructorValueToText(feedback['venue-rating'], 'venue-rating'),
                    convertInstructorValueToText(feedback['content-relevance'], 'content-relevance'),
                    convertInstructorValueToText(feedback['schedule-timing'], 'schedule-timing'),
                    convertInstructorValueToText(feedback['future-instruct'], 'future-instruct'),
                    feedback['comments'] || '',
                    '',
                    '',
                    ''
                  ]
                }
                return `<tr>${row.map(cell => `<td>${String(cell || '').replace(/"/g, '&quot;')}</td>`).join('')}</tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  // CSV download function
  const downloadCSV = () => {
    if (feedbackData.length === 0) {
      alert('No data available to download')
      return
    }

    // Get headers based on selected workshop
    let headers = []
    if (selectedWorkshop === 'AI') {
      headers = [
        'Date',
        'Time',
        'I did this workshop in',
        'I had fun in this workshop',
        'My favorite part of this workshop was',
        'This workshop challenged me appropriately',
        'Before this workshop my comfort with AI tools was',
        'After this workshop my comfort with AI tools was',
        'Before this workshop my understanding of neural networks was',
        'After this workshop my understanding of neural networks was',
        'Which workshop instructor did you learn the most from?',
        'The Stage One instructor(s) were well prepared',
        'The Stage One instructor(s) were knowledgeable',
        'How does this workshop compare to rest of the activities during your trip?',
        'Comments/Suggestions/Ideas (we will read everything you write)'
      ]
    } else if (selectedWorkshop === 'Robotics') {
      headers = [
        'Date',
        'Time',
        'I did this workshop in',
        'I had fun in this workshop',
        'My favorite part of this workshop was',
        'This workshop challenged me appropriately',
        'I learned how to build and understand basic electronic systems',
        'After taking this workshop I feel confident in starting another similar electronics project',
        'In the next electronics workshop I want to learn how to _______',
        'I would recommend that this workshop be taught again next year',
        'Which workshop instructor did you learn the most from?',
        'The Stage One instructor(s) were well prepared',
        'The Stage One instructor(s) were knowledgeable',
        'How does this workshop compare to rest of the activities during your trip?',
        'Comments/Suggestions/Ideas (we will read everything you write)'
      ]
    } else if (selectedWorkshop === 'Mechanical') {
      headers = [
        'Date',
        'Time',
        'I did this workshop in',
        'I had fun in this workshop',
        'My favorite part of this workshop was',
        'I am more knowledgeable about 3D design after this workshop',
        'I think I can design something using CAD on my own',
        'Something I\'d like to try designing next is',
        'The workshop was well paced',
        'I would recommend that this workshop be taught again next year',
        'Which workshop instructor did you learn the most from?',
        'The Stage One instructor(s) were well prepared',
        'The Stage One instructor(s) were knowledgeable',
        'How does this workshop compare to rest of the activities during your trip?',
        'Comments/Suggestions/Ideas (we will read everything you write)'
      ]
    } else if (selectedWorkshop === 'Instructor') {
      headers = [
        'Date',
        'Time',
        'I instructed a workshop in',
        'What type of session did you instruct?',
        'I felt well-prepared before the event began',
        'How would you rate the workshop venue?',
        'How would you rate the workshop content?',
        'How would you rate the workshop schedule and timing?',
        'Would you instruct future workshops with Stage One Education?',
        'Comments, suggestions, or ideas',
        '',
        '',
        ''
      ]
    }

    // Convert data to CSV format
    const csvContent = [
      headers.join(','),
      ...feedbackData.map(feedback => {
        let row = []
        if (selectedWorkshop === 'AI') {
          const formattedDate = formatDateOnly(feedback.date)
          const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
          row = [
            formattedDate,
            formattedTime,
            feedback['workshop-location'] || '',
            feedback['had-fun'] || '',
            feedback['favorite-part'] || '',
            feedback['challenged-appropriately'] || '',
            feedback['ai-tools-before'] || '',
            feedback['ai-tools-after'] || '',
            feedback['neural-networks-before'] || '',
            feedback['neural-networks-after'] || '',
            feedback['instructor'] || '',
            feedback['instructor-prepared'] || '',
            feedback['instructor-knowledgeable'] || '',
            feedback['workshop-comparison'] || '',
            feedback['comments'] || ''
          ]
        } else if (selectedWorkshop === 'Robotics') {
          const formattedDate = formatDateOnly(feedback.date)
          const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
          row = [
            formattedDate,
            formattedTime,
            feedback['workshop-location'] || '',
            feedback['had-fun'] || '',
            feedback['favorite-part'] || '',
            feedback['challenged-appropriately'] || '',
            feedback['learned-electronics'] || '',
            feedback['confident-electronics'] || '',
            feedback['next-electronics'] || '',
            feedback['recommend-workshop'] || '',
            feedback['instructor'] || '',
            feedback['instructor-prepared'] || '',
            feedback['instructor-knowledgeable'] || '',
            feedback['workshop-comparison'] || '',
            feedback['comments'] || ''
          ]
        } else if (selectedWorkshop === 'Mechanical') {
          const formattedDate = formatDateOnly(feedback.date)
          const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
          row = [
            formattedDate,
            formattedTime,
            feedback['workshop-location'] || '',
            feedback['had-fun'] || '',
            feedback['favorite-part'] || '',
            feedback['knowledgeable-3d-design'] || '',
            feedback['can-design-cad'] || '',
            feedback['next-design'] || '',
            feedback['well-paced'] || '',
            feedback['recommend-workshop'] || '',
            feedback['instructor'] || '',
            feedback['instructor-prepared'] || '',
            feedback['instructor-knowledgeable'] || '',
            feedback['workshop-comparison'] || '',
            feedback['comments'] || ''
          ]
        } else if (selectedWorkshop === 'Instructor') {
          const formattedDate = formatDateOnly(feedback.date)
          const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
          row = [
            formattedDate,
            formattedTime,
            (() => {
            const locations = Array.isArray(feedback['instructed-location']) ? feedback['instructed-location'] : []
            const otherText = feedback['instructed-location-other-text'] || ''
            let result = locations.join(', ')
            if (locations.includes('Other') && otherText) {
              result = result.replace('Other', `Other: ${otherText}`)
            }
            return result
          })(),
            (() => {
            const sessionType = feedback['session-type'] || ''
            const otherText = feedback['session-type-other-text'] || ''
            if (sessionType === 'Other' && otherText) {
              return `Other: ${otherText}`
            }
            return sessionType
          })(),
            feedback['well-prepared'] || '',
            convertInstructorValueToText(feedback['venue-rating'], 'venue-rating'),
            convertInstructorValueToText(feedback['content-relevance'], 'content-relevance'),
            convertInstructorValueToText(feedback['schedule-timing'], 'schedule-timing'),
            convertInstructorValueToText(feedback['future-instruct'], 'future-instruct'),
            feedback['comments'] || '',
            '',
            '',
            '',
            '',
            ''
          ]
        }
        
        // Escape CSV values (handle commas, quotes, newlines)
        return row.map(value => {
          const stringValue = String(value || '')
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      })
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedWorkshop}_Workshop_Feedback_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Check if server is running and provide helpful instructions
  const checkServerStatus = async () => {
    try {
      // Try to check if server is already running
      const healthCheck = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        mode: 'cors'
      })
      
      if (healthCheck.ok) {
        console.log('Server is already running')
        return true
      }
    } catch (err) {
      console.log('Server not running')
    }

    return false
  }


  // Fetch feedback data from backend
  const fetchFeedbackData = async () => {
    try {
      setLoading(true)
      console.log('Fetching data for workshop:', selectedWorkshop)
      
      // First check if server is running
      const serverRunning = await checkServerStatus()
      
      // Try multiple endpoints in case of connectivity issues
      const endpoints = [
        `http://localhost:3001/api/feedback/${selectedWorkshop}`,
        `http://127.0.0.1:3001/api/feedback/${selectedWorkshop}`
      ]
      
      let response = null
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint)
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors'
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
        const data = await response.json()
        console.log('Received data:', data)
        console.log('Sample data structure:', data[0]) // Log first item to see structure
        
        // Sort the data before setting it
        const sortedData = sortFeedbackData(data)
        setFeedbackData(sortedData)
        setError(null)
      } else {
        console.error('All endpoints failed')
        if (serverRunning) {
          setError('Failed to fetch feedback data - server may be starting up, please refresh in a moment')
        } else {
          setError('Failed to fetch feedback data - server is not running. The server should start automatically when you run "npm run dev". If the problem persists, please run "start.bat" to start both servers manually.')
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbackData()
    
    // Adjust column widths based on workshop type
    if (selectedWorkshop === 'Instructor') {
      const widths = Array(10).fill(150)
      widths[0] = 100 // Date column - make it narrower
      widths[1] = 100 // Time column - make it narrower
      widths[9] = 300 // Comments, suggestions, or ideas column - make it wider
      setColumnWidths(widths)
    } else {
      const widths = Array(15).fill(150)
      widths[0] = 100 // Date column - make it narrower
      widths[1] = 100 // Time column - make it narrower
      widths[14] = 300 // Comments/Suggestions/Ideas column - make it wider
      setColumnWidths(widths)
    }
  }, [selectedWorkshop])

  // Format date only (without timestamp)
  const formatDateOnly = (date) => {
    if (!date) return ''
    
    try {
      const dateObj = new Date(date)
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return date // Return original date if invalid
      }
      
      // Format date only in USA ET timezone
      const options = {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
      
      return dateObj.toLocaleDateString('en-US', options)
    } catch (error) {
      console.error('Error formatting date:', error)
      return date // Return original date if formatting fails
    }
  }

  // Format time only from timestamp in USA ET timezone
  const formatTimeOnly = (date, timestamp) => {
    if (!date) return ''
    
    try {
      // Use timestamp if available, otherwise use date
      const dateToUse = timestamp || date
      const dateObj = new Date(dateToUse)
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return '' // Return empty if invalid
      }
      
      // Format time only in USA ET timezone
      const options = {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      
      return dateObj.toLocaleTimeString('en-US', options)
    } catch (error) {
      console.error('Error formatting time:', error)
      return '' // Return empty if formatting fails
    }
  }

  // Convert feedback data to spreadsheet format
  const convertFeedbackToSpreadsheet = (dataToConvert = feedbackData) => {
    const spreadsheetData = {}
    
    dataToConvert.forEach((feedback, rowIndex) => {
      let columns = []
      
      if (selectedWorkshop === 'AI') {
        // Format date and time separately
        const formattedDate = formatDateOnly(feedback.date)
        const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
        
        columns = [
          formattedDate,
          formattedTime,
          feedback['workshop-location'] || '',
          feedback['had-fun'] || '',
          feedback['favorite-part'] || '',
          feedback['challenged-appropriately'] || '',
          feedback['ai-tools-before'] || '',
          feedback['ai-tools-after'] || '',
          feedback['neural-networks-before'] || '',
          feedback['neural-networks-after'] || '',
          feedback['instructor'] || '',
          feedback['instructor-prepared'] || '',
          feedback['instructor-knowledgeable'] || '',
          feedback['workshop-comparison'] || '',
          feedback['comments'] || ''
        ]
      } else if (selectedWorkshop === 'Robotics') {
        // Format date and time separately
        const formattedDate = formatDateOnly(feedback.date)
        const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
        
        columns = [
          formattedDate,
          formattedTime,
          feedback['workshop-location'] || '',
          feedback['had-fun'] || '',
          feedback['favorite-part'] || '',
          feedback['challenged-appropriately'] || '',
          feedback['learned-electronics'] || '',
          feedback['confident-electronics'] || '',
          feedback['next-electronics'] || '',
          feedback['recommend-workshop'] || '',
          feedback['instructor'] || '',
          feedback['instructor-prepared'] || '',
          feedback['instructor-knowledgeable'] || '',
          feedback['workshop-comparison'] || '',
          feedback['comments'] || ''
        ]
      } else if (selectedWorkshop === 'Mechanical') {
        // Format date and time separately
        const formattedDate = formatDateOnly(feedback.date)
        const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
        
        columns = [
          formattedDate,
          formattedTime,
          feedback['workshop-location'] || '',
          feedback['had-fun'] || '',
          feedback['favorite-part'] || '',
          feedback['knowledgeable-3d-design'] || '',
          feedback['can-design-cad'] || '',
          feedback['next-design'] || '',
          feedback['well-paced'] || '',
          feedback['recommend-workshop'] || '',
          feedback['instructor'] || '',
          feedback['instructor-prepared'] || '',
          feedback['instructor-knowledgeable'] || '',
          feedback['workshop-comparison'] || '',
          feedback['comments'] || ''
        ]
      } else if (selectedWorkshop === 'Instructor') {
        // Format date and time separately
        const formattedDate = formatDateOnly(feedback.date)
        const formattedTime = formatTimeOnly(feedback.date, feedback.timestamp)
        
        columns = [
          formattedDate,
          formattedTime,
          (() => {
            const locations = Array.isArray(feedback['instructed-location']) ? feedback['instructed-location'] : []
            const otherText = feedback['instructed-location-other-text'] || ''
            let result = locations.join(', ')
            if (locations.includes('Other') && otherText) {
              result = result.replace('Other', `Other: ${otherText}`)
            }
            return result
          })(),
          (() => {
            const sessionType = feedback['session-type'] || ''
            const otherText = feedback['session-type-other-text'] || ''
            if (sessionType === 'Other' && otherText) {
              return `Other: ${otherText}`
            }
            return sessionType
          })(),
          feedback['well-prepared'] || '',
          convertInstructorValueToText(feedback['venue-rating'], 'venue-rating'),
          convertInstructorValueToText(feedback['content-relevance'], 'content-relevance'),
          convertInstructorValueToText(feedback['schedule-timing'], 'schedule-timing'),
          convertInstructorValueToText(feedback['future-instruct'], 'future-instruct'),
          feedback['comments'] || ''
        ]
      } else {
        // Fallback for unknown workshop types
        columns = Array(14).fill('')
      }
      
      columns.forEach((value, colIndex) => {
        const cellId = `${rowIndex}-${colIndex}`
        spreadsheetData[cellId] = value
      })
    })
    
    return spreadsheetData
  }

  // Sort feedback data by date and timestamp (newest first)
  const sortFeedbackData = (data) => {
    return [...data].sort((a, b) => {
      // Helper function to parse date field (MM/DD/YYYY format)
      const parseDateField = (item) => {
        if (item.date) {
          // Try parsing MM/DD/YYYY format
          if (typeof item.date === 'string' && item.date.includes('/')) {
            const parts = item.date.split('/')
            if (parts.length === 3) {
              const month = parseInt(parts[0], 10)
              const day = parseInt(parts[1], 10)
              const year = parseInt(parts[2], 10)
              
              if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900) {
                const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                const date = new Date(isoDate)
                if (!isNaN(date.getTime())) {
                  console.log(`Parsed date field: ${item.date} -> ${isoDate} -> ${date.toISOString()}`)
                  return date
                }
              }
            }
          }
          
          // Try direct parsing for other date formats
          const date = new Date(item.date)
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            console.log(`Parsed date field directly: ${item.date} -> ${date.toISOString()}`)
            return date
          }
        }
        
        // Fallback to very old date
        console.log(`Could not parse date field for item:`, item)
        return new Date('1900-01-01')
      }
      
      // Helper function to parse timestamp field
      const parseTimestampField = (item) => {
        if (item.timestamp) {
          const timestampDate = new Date(item.timestamp)
          if (!isNaN(timestampDate.getTime()) && timestampDate.getFullYear() > 1900) {
            console.log(`Parsed timestamp: ${item.timestamp} -> ${timestampDate.toISOString()}`)
            return timestampDate
          }
        }
        return null
      }
      
      // Primary sort: by date field (newest first)
      const dateA = parseDateField(a)
      const dateB = parseDateField(b)
      const dateComparison = dateB.getTime() - dateA.getTime()
      
      if (dateComparison !== 0) {
        return dateComparison
      }
      
      // Secondary sort: by timestamp if dates are the same (newest first)
      const timestampA = parseTimestampField(a)
      const timestampB = parseTimestampField(b)
      
      if (timestampA && timestampB) {
        const timestampComparison = timestampB.getTime() - timestampA.getTime()
        if (timestampComparison !== 0) {
          return timestampComparison
        }
      } else if (timestampA && !timestampB) {
        return -1 // A has timestamp, B doesn't - A comes first
      } else if (!timestampA && timestampB) {
        return 1 // B has timestamp, A doesn't - B comes first
      }
      
      // Tertiary sort: by workshop location alphabetically
      const locationA = a['workshop-location'] || ''
      const locationB = b['workshop-location'] || ''
      return locationA.localeCompare(locationB)
    })
  }

  // Update cell data when feedback data changes
  useEffect(() => {
    if (feedbackData.length > 0) {
      // Sort feedback data by date and timestamp (newest first)
      const sortedData = sortFeedbackData(feedbackData)
      setSortedFeedbackData(sortedData)
      
      // Debug logging to verify sorting
      console.log('Original feedback data:', feedbackData.map(item => ({ 
        date: item.date, 
        timestamp: item.timestamp, 
        id: item.id 
      })))
      console.log('Sorted feedback data:', sortedData.map(item => ({ 
        date: item.date, 
        timestamp: item.timestamp, 
        id: item.id 
      })))
      
      const spreadsheetData = convertFeedbackToSpreadsheet(sortedData)
      setCellData(spreadsheetData)
    } else {
      setSortedFeedbackData([])
    }
  }, [feedbackData, selectedWorkshop])

  const handleMouseDown = (e, columnIndex) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeColumn(columnIndex)
    
    const startX = e.clientX
    const startWidth = columnWidths[columnIndex]
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX) // Minimum width of 50px
      
      setColumnWidths(prev => {
        const newWidths = [...prev]
        newWidths[columnIndex] = newWidth
        return newWidths
      })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCellMouseDown = (e, rowIndex, colIndex) => {
    // Don't prevent default if clicking on input
    if (e.target.tagName === 'INPUT') return
    
    e.preventDefault()
    const cellId = `${rowIndex}-${colIndex}`
    setIsSelecting(true)
    setSelectionStart({ row: rowIndex, col: colIndex })
    
    // Clear previous selection and select this cell
    setSelectedCells(new Set([cellId]))
    
    const handleMouseMove = (e) => {
      if (!isSelecting || !selectionStart) return
      
      // Get mouse position relative to the spreadsheet
      const spreadsheetContainer = document.querySelector('.spreadsheet-container')
      if (!spreadsheetContainer) return
      
      const rect = spreadsheetContainer.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate which cell the mouse is over
      const rowHeaderWidth = 50
      const cellHeight = 24
      const headerHeight = 24 // Approximate header height
      
      // Find the row
      let targetRow = Math.floor((mouseY - headerHeight) / cellHeight)
      if (targetRow < 0) targetRow = 0
      if (targetRow >= 1000) targetRow = 999
      
      // Find the column
      let targetCol = -1
      let currentX = rowHeaderWidth
      for (let i = 0; i < columnWidths.length; i++) {
        if (mouseX >= currentX && mouseX < currentX + columnWidths[i]) {
          targetCol = i
          break
        }
        currentX += columnWidths[i]
      }
      
      if (targetCol === -1) return
      
      // Create selection range
      const startRow = Math.min(selectionStart.row, targetRow)
      const endRow = Math.max(selectionStart.row, targetRow)
      const startCol = Math.min(selectionStart.col, targetCol)
      const endCol = Math.max(selectionStart.col, targetCol)
      
      const newSelection = new Set()
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          newSelection.add(`${r}-${c}`)
        }
      }
      setSelectedCells(newSelection)
    }
    
    const handleMouseUp = () => {
      setIsSelecting(false)
      setSelectionStart(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleCellClick = (e, rowIndex, colIndex) => {
    // Don't handle clicks on input elements
    if (e.target.tagName === 'INPUT') return
    
    const cellId = `${rowIndex}-${colIndex}`
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + click: toggle selection
      setSelectedCells(prev => {
        const newSelection = new Set(prev)
        if (newSelection.has(cellId)) {
          newSelection.delete(cellId)
        } else {
          newSelection.add(cellId)
        }
        return newSelection
      })
    } else {
      // Regular click: select only this cell
      setSelectedCells(new Set([cellId]))
    }
  }

  const handleCellChange = (rowIndex, colIndex, value) => {
    const cellId = `${rowIndex}-${colIndex}`
    setCellData(prev => ({
      ...prev,
      [cellId]: value
    }))
  }

  const clearSelectedCells = () => {
    const newCellData = { ...cellData }
    selectedCells.forEach(cellId => {
      newCellData[cellId] = ''
    })
    setCellData(newCellData)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedCells.size > 0) {
        clearSelectedCells()
      }
    }
  }

  const handleRowNumberDoubleClick = (rowIndex) => {
    // Only allow delete for rows that have actual data
    if (rowIndex < feedbackData.length) {
      setDeleteRowIndex(rowIndex)
    }
  }

  const handleUndoDelete = async () => {
    const currentWorkshopDeletedRows = deletedRows[selectedWorkshop]
    
    if (currentWorkshopDeletedRows.length === 0) {
      alert('No deleted rows to restore')
      return
    }

    // Get the most recently deleted row (last in the array)
    const deletedRow = currentWorkshopDeletedRows[currentWorkshopDeletedRows.length - 1]

    try {
      // Submit the deleted row back to the backend
      const endpoints = [
        'http://localhost:3001/api/feedback',
        'http://127.0.0.1:3001/api/feedback'
      ]
      
      let response = null
      for (const endpoint of endpoints) {
        try {
          console.log('Trying restore endpoint:', endpoint)
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
              workshopType: selectedWorkshop,
              feedbackData: deletedRow.data
            })
          })
          if (response.ok) {
            console.log('Success with restore endpoint:', endpoint)
            break
          }
        } catch (err) {
          console.log('Failed with restore endpoint:', endpoint, err.message)
          continue
        }
      }

      if (response && response.ok) {
        // Refresh the data from backend to get the updated state
        const fetchFeedbackData = async () => {
          try {
            setLoading(true)
            const endpoints = [
              `http://localhost:3001/api/feedback/${selectedWorkshop}`,
              `http://127.0.0.1:3001/api/feedback/${selectedWorkshop}`
            ]
            
            let response = null
            for (const endpoint of endpoints) {
              try {
                response = await fetch(endpoint, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  mode: 'cors'
                })
                if (response.ok) {
                  break
                }
              } catch (err) {
                continue
              }
            }
            
            if (response && response.ok) {
              const data = await response.json()
              setFeedbackData(data)
              setError(null)
            }
          } catch (err) {
            console.error('Error refreshing data:', err)
          } finally {
            setLoading(false)
          }
        }

        await fetchFeedbackData()

        // Remove the restored row from the deleted rows history for this workshop
        setDeletedRows(prev => ({
          ...prev,
          [selectedWorkshop]: prev[selectedWorkshop].slice(0, -1)
        }))
        
        console.log('Successfully restored deleted row')
      } else {
        console.error('Failed to restore feedback')
        alert('Failed to restore feedback. Please try again.')
      }
    } catch (err) {
      console.error('Error restoring row:', err)
      alert(`Error restoring row: ${err.message}`)
    }
  }

  // Handle row selection for multi-row delete
  const handleRowClick = (rowIndex, event) => {
    if (event.detail === 2) { // Double click
      if (selectedRows.length === 0) {
        // First selection - just select this row
        setSelectedRows([rowIndex])
        setDeleteRowIndex(rowIndex)
      } else {
        // Already have selections - add this row
        if (!selectedRows.includes(rowIndex)) {
          setSelectedRows(prev => [...prev, rowIndex])
        }
      }
    } else if (event.shiftKey && selectedRows.length > 0) {
      // Shift+click - select range
      const startRow = Math.min(...selectedRows)
      const endRow = Math.max(...selectedRows, rowIndex)
      const newSelection = []
      
      for (let i = Math.min(startRow, rowIndex); i <= Math.max(startRow, rowIndex); i++) {
        newSelection.push(i)
      }
      
      setSelectedRows(newSelection)
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+click - toggle selection
      if (selectedRows.includes(rowIndex)) {
        setSelectedRows(prev => prev.filter(r => r !== rowIndex))
      } else {
        setSelectedRows(prev => [...prev, rowIndex])
      }
    } else {
      // Regular click - clear selection and select this row
      setSelectedRows([rowIndex])
      setDeleteRowIndex(rowIndex)
    }
  }

  // Handle multi-row delete
  const handleMultiRowDelete = async () => {
    if (selectedRows.length === 0) return
    
    const sortedRows = [...selectedRows].sort((a, b) => a - b)
    
    try {
      // Delete rows in reverse order to maintain indices
      for (let i = sortedRows.length - 1; i >= 0; i--) {
        const rowIndex = sortedRows[i]
        if (rowIndex >= sortedFeedbackData.length) continue
        
        const feedbackToDelete = sortedFeedbackData[rowIndex]
        
        if (!feedbackToDelete.id) {
          console.error('No ID found for feedback entry:', feedbackToDelete)
          continue
        }
        
        // Delete from backend
        const deleteEndpoints = [
          `http://localhost:3001/api/feedback/${selectedWorkshop}/${feedbackToDelete.id}`,
          `http://127.0.0.1:3001/api/feedback/${selectedWorkshop}/${feedbackToDelete.id}`
        ]
        
        let response = null
        for (const endpoint of deleteEndpoints) {
          try {
            response = await fetch(endpoint, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              mode: 'cors'
            })
            if (response.ok) {
              break
            }
          } catch (err) {
            continue
          }
        }
        
        if (response && response.ok) {
          // Store deleted row for undo
          setDeletedRows(prev => ({
            ...prev,
            [selectedWorkshop]: [...prev[selectedWorkshop], {
              data: feedbackToDelete,
              originalIndex: rowIndex
            }]
          }))
        }
      }
      
      // Clear selection and refresh data
      setSelectedRows([])
      setDeleteRowIndex(null)
      await fetchFeedbackData()
      
      console.log(`Successfully deleted ${sortedRows.length} row(s)!`)
    } catch (err) {
      console.error('Error deleting rows:', err)
      alert(`Error deleting rows: ${err.message}`)
    }
  }

  const handleDeleteRow = async (rowIndex) => {
    if (rowIndex >= sortedFeedbackData.length) return
    
    const feedbackToDelete = sortedFeedbackData[rowIndex]
    console.log('Attempting to delete feedback:', feedbackToDelete)
    
    if (!feedbackToDelete.id) {
      console.error('No ID found for feedback entry:', feedbackToDelete)
      alert('Cannot delete: No ID found for this feedback entry.')
      return
    }

    try {
      // Delete from backend using the feedback ID
      const endpoints = [
        `http://localhost:3001/api/feedback/${selectedWorkshop}/${feedbackToDelete.id}`,
        `http://127.0.0.1:3001/api/feedback/${selectedWorkshop}/${feedbackToDelete.id}`
      ]
      
      let response = null
      let lastError = null
      
      for (const endpoint of endpoints) {
        try {
          console.log('Trying delete endpoint:', endpoint)
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'include'
          })
          console.log('Delete response status:', response.status)
          if (response.ok) {
            const responseData = await response.json()
            console.log('Delete response data:', responseData)
            break
          } else {
            const errorText = await response.text()
            console.error('Delete failed with status:', response.status, 'Error:', errorText)
            lastError = errorText
          }
        } catch (err) {
          console.error('Delete request failed:', err)
          lastError = err.message
          continue
        }
      }

      if (response && response.ok) {
        // Add the deleted row to the history for undo functionality for this workshop
        setDeletedRows(prev => ({
          ...prev,
          [selectedWorkshop]: [...prev[selectedWorkshop], {
            data: feedbackToDelete,
            originalIndex: rowIndex
          }]
        }))
        
        // Refresh data from backend to ensure consistency
        const refreshData = async () => {
          try {
            const endpoints = [
              `http://localhost:3001/api/feedback/${selectedWorkshop}`,
              `http://127.0.0.1:3001/api/feedback/${selectedWorkshop}`
            ]
            
            let response = null
            for (const endpoint of endpoints) {
              try {
                response = await fetch(endpoint, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  mode: 'cors'
                })
                if (response.ok) {
                  break
                }
              } catch (err) {
                continue
              }
            }
            
            if (response && response.ok) {
              const data = await response.json()
              setFeedbackData(data)
              setError(null)
            }
          } catch (err) {
            console.error('Error refreshing data:', err)
          }
        }

        await refreshData()
        
        // Hide delete button and clear selections
        setDeleteRowIndex(null)
        setSelectedRows([])
        console.log('Successfully deleted feedback entry')
      } else {
        console.error('Failed to delete feedback. Last error:', lastError)
        alert(`Failed to delete feedback: ${lastError || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert(`Error deleting feedback: ${err.message}`)
    }
  }

  // Add click-away functionality to hide delete button and clear selections when clicking anywhere
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Check if clicking outside the spreadsheet
      const isSpreadsheetClick = e.target.closest('.spreadsheet-container')
      const isDeleteButton = e.target.closest('.delete-button')
      
      if (!isSpreadsheetClick && !isDeleteButton) {
        // Clear selections when clicking outside
        setSelectedRows([])
        setDeleteRowIndex(null)
      }
    }

    // Add event listener to document with capture phase to catch events before stopPropagation
    document.addEventListener('click', handleDocumentClick, true)

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [])

  const renderCharts = () => {
    const workshopType = selectedWorkshop
    const barColors = ['#939393', '#b18983', '#c06958', '#d85b49', '#f05f40']
    
    return (
      <>
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 1</div>
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
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 2</div>
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
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 3</div>
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
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 4</div>
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
          </div>
        </div>
        
        <div className="bar-graphs-container">
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 5</div>
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
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 6</div>
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
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 7</div>
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
          </div>
          
          <div className="chart-window">
            <div className="chart-title">{workshopType} Workshop 8</div>
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
          </div>
        </div>
      </>
    )
  }

  // Handle import data submission
  const handleImportData = async () => {
    try {
      setIsImporting(true)
      // Get the column headers for the selected workshop
      let headers = []
      if (selectedWorkshop === 'AI') {
        headers = [
          'date',
          'timestamp',
          'workshop-location',
          'had-fun',
          'favorite-part',
          'challenged-appropriately',
          'ai-tools-before',
          'ai-tools-after',
          'neural-networks-before',
          'neural-networks-after',
          'instructor',
          'instructor-prepared',
          'instructor-knowledgeable',
          'workshop-comparison',
          'comments'
        ]
      } else if (selectedWorkshop === 'Robotics') {
        headers = [
          'date',
          'timestamp',
          'workshop-location',
          'had-fun',
          'favorite-part',
          'challenged-appropriately',
          'learned-electronics',
          'confident-electronics',
          'next-electronics',
          'recommend-workshop',
          'instructor',
          'instructor-prepared',
          'instructor-knowledgeable',
          'workshop-comparison',
          'comments'
        ]
      } else if (selectedWorkshop === 'Mechanical') {
        headers = [
          'date',
          'timestamp',
          'workshop-location',
          'had-fun',
          'favorite-part',
          'knowledgeable-3d-design',
          'can-design-cad',
          'next-design',
          'well-paced',
          'recommend-workshop',
          'instructor',
          'instructor-prepared',
          'instructor-knowledgeable',
          'workshop-comparison',
          'comments'
        ]
      } else if (selectedWorkshop === 'Instructor') {
        headers = [
          'date',
          'instructed-location',
          'session-type',
          'well-prepared',
          'venue-rating',
          'content-relevance',
          'schedule-timing',
          'future-instruct',
          'comments'
        ]
      }

      // Convert import data to feedback entries
      const importedEntries = []
      const maxRows = Math.max(...Object.values(importData).map(data => data.split('\n').length))
      
      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const entry = {}
        let hasData = false
        
        Object.keys(importData).forEach(columnIndex => {
          const columnData = importData[columnIndex].split('\n')
          const value = columnData[rowIndex]?.trim()
          if (value) {
            const fieldName = headers[columnIndex]
            if (fieldName === 'timestamp') {
              // For timestamp field, we need to combine it with date to create a proper datetime
              const dateValue = importData[0]?.split('\n')[rowIndex]?.trim() // Get date from first column
              if (dateValue) {
                // Create a proper datetime string by combining date and time
                entry[fieldName] = `${dateValue} ${value}`
              } else {
                entry[fieldName] = value
              }
            } else {
              entry[fieldName] = value
            }
            hasData = true
          }
        })
        
        if (hasData) {
          importedEntries.push(entry)
        }
      }

      if (importedEntries.length === 0) {
        alert('No data to import. Please paste data into at least one column.')
        setIsImporting(false)
        return
      }

      // Submit imported data to backend one by one
      const endpoints = [
        'http://localhost:3001/api/feedback',
        'http://127.0.0.1:3001/api/feedback'
      ]
      
      let successCount = 0
      let errorCount = 0
      
      for (const entry of importedEntries) {
        let response = null
        for (const endpoint of endpoints) {
          try {
            response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              mode: 'cors',
              body: JSON.stringify({
                workshopType: selectedWorkshop,
                feedbackData: entry
              })
            })
            if (response.ok) {
              successCount++
              break
            }
          } catch (err) {
            continue
          }
        }
        
        if (!response || !response.ok) {
          errorCount++
        }
      }

      if (successCount > 0) {
        alert(`Successfully imported ${successCount} entries!${errorCount > 0 ? ` ${errorCount} entries failed.` : ''}`)
        setShowImportModal(false)
        setImportData({})
        // Refresh the data
        await fetchFeedbackData()
      } else {
        alert('Failed to import data. Please try again.')
      }
    } catch (err) {
      console.error('Error importing data:', err)
      alert(`Error importing data: ${err.message}`)
    } finally {
      setIsImporting(false)
    }
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
            onClick={checkPassword}
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
    <div className="app" onKeyDown={handleKeyDown} tabIndex={0}>
      <header className="header-bar">
        <div className="header-left">
          <span>Workshop Feedback Data</span>
        </div>
        <div className="header-center"></div>
        <div className="header-right">STAGE ONE EDUCATION</div>
      </header>
      
      <div className="workshop-dropdown-container" style={{ marginTop: '20px', marginLeft: '20px', marginRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="workshop-dropdown-group">
          <select 
            className="workshop-dropdown"
            value={selectedWorkshop}
            onChange={(e) => setSelectedWorkshop(e.target.value)}
          >
            <option value="AI">Artificial Intelligence Workshop</option>
            <option value="Robotics">Robotics Workshop</option>
            <option value="Mechanical">Mechanical Engineering Workshop</option>
            <option value="Instructor">Instructor</option>
          </select>
          <a 
            href={
              selectedWorkshop === 'AI' ? "http://localhost:5174/artificial-intelligence-feedback-survey.html" :
              selectedWorkshop === 'Robotics' ? "http://localhost:5174/robotics-feedback-survey.html" :
              selectedWorkshop === 'Mechanical' ? "http://localhost:5174/mechanical-engineering-feedback-survey.html" :
              "http://localhost:5174/instructor-feedback-survey.html"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="survey-link"
            style={{
              fontSize: '12px',
              color: '#f05f40',
              textDecoration: 'none',
              fontWeight: '300',
              marginLeft: '10px',
              display: 'flex',
              alignItems: 'center',
              transition: 'font-weight 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.fontWeight = 'bold'
            }}
            onMouseLeave={(e) => {
              e.target.style.fontWeight = '300'
            }}
          >
            survey
          </a>
        </div>
        <button 
          className="feedback-dashboard-btn"
          onClick={() => window.open('http://localhost:5174/', '_blank')}
          style={{
            backgroundColor: 'white',
            color: '#f05f40',
            border: '1px solid #f05f40',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: '500',
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            height: 'fit-content'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f05f40'
            e.target.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white'
            e.target.style.color = '#f05f40'
          }}
          onMouseDown={(e) => {
            e.target.style.backgroundColor = '#e04a2f'
            e.target.style.color = 'white'
          }}
          onMouseUp={(e) => {
            e.target.style.backgroundColor = '#f05f40'
            e.target.style.color = 'white'
          }}
        >
          Feedback Dashboard
        </button>
      </div>
      
      <div className="spreadsheet-controls" style={{ marginTop: '10px', marginLeft: '20px', marginRight: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loading && <span style={{ color: '#666' }}>Loading...</span>}
          {error && <span style={{ color: 'red' }}>Error: {error}</span>}
          <button 
            onClick={fetchFeedbackData} 
            style={{ 
              padding: '2px 6px', 
              backgroundColor: 'white', 
              color: '#666666ff', 
              border: '1px solid #666666ff', 
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Refresh Data
          </button>
          <span style={{ color: '#666', fontSize: '14px' }}>
            {sortedFeedbackData.length} responses
          </span>
          {selectedRows.length > 0 && (
            <span style={{ 
              color: '#1976d2', 
              fontSize: '14px', 
              fontWeight: '500',
              marginLeft: '10px'
            }}>
              {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        
        {/* Zoom Controls - Right Justified */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>Zoom:</span>
          <button 
            onClick={handleZoomOut}
            style={{ 
              padding: '2px 6px', 
              backgroundColor: 'white', 
              color: '#666666ff', 
              border: '1px solid #666666ff', 
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              minWidth: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Zoom Out"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5'
              e.target.style.borderColor = '#555555'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white'
              e.target.style.borderColor = '#666666ff'
            }}
          >
            −
          </button>
          <span style={{ 
            color: '#333', 
            fontSize: '11px', 
            minWidth: '35px', 
            textAlign: 'center',
            fontWeight: '500',
            backgroundColor: '#f8f9fa',
            padding: '2px 6px',
            borderRadius: '3px',
            border: '1px solid #e9ecef'
          }}>
            {zoomLevel === 65 ? '100' : zoomLevel < 65 ? Math.round((zoomLevel / 65) * 100) : zoomLevel}%
          </span>
          <button 
            onClick={handleZoomIn}
            style={{ 
              padding: '2px 6px', 
              backgroundColor: 'white', 
              color: '#666666ff', 
              border: '1px solid #666666ff', 
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              minWidth: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title="Zoom In"
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5'
              e.target.style.borderColor = '#555555'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white'
              e.target.style.borderColor = '#666666ff'
            }}
          >
            +
          </button>
        </div>
      </div>
      
      <div className="spreadsheet-container" style={{ marginTop: '10px', marginLeft: '20px', marginRight: '20px' }}>
        <div className="spreadsheet">
          <div className="spreadsheet-content" style={{ zoom: `${zoomLevel / 100}` }}>
            <div className="spreadsheet-header">
            <div className="row-header">
              {deletedRows[selectedWorkshop].length > 0 && (
                <button
                  onClick={handleUndoDelete}
                  style={{
                    background: '#d3d3d3',
                    color: '#333',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Undo last delete"
                >
                  ← Undo
                </button>
              )}
            </div>
            {selectedWorkshop === 'AI' ? (
              [
                'Date',
                'Time',
                'I did this workshop in',
                'I had fun in this workshop',
                'My favorite part of this workshop was',
                'This workshop challenged me appropriately',
                'Before this workshop my comfort with AI tools was',
                'After this workshop my comfort with AI tools was',
                'Before this workshop my understanding of neural networks was',
                'After this workshop my understanding of neural networks was',
                'Which workshop instructor did you learn the most from?',
                'The Stage One instructor(s) were well prepared',
                'The Stage One instructor(s) were knowledgeable',
                'How does this workshop compare to rest of the activities during your trip?',
                'Comments/Suggestions/Ideas (we will read everything you write)'
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : selectedWorkshop === 'Robotics' ? (
              [
                'Date',
                'Time',
                'I did this workshop in',
                'I had fun in this workshop',
                'My favorite part of this workshop was',
                'This workshop challenged me appropriately',
                'I learned how to build and understand basic electronic systems',
                'After taking this workshop I feel confident in starting another similar electronics project',
                'In the next electronics workshop I want to learn how to _______',
                'I would recommend that this workshop be taught again next year',
                'Which workshop instructor did you learn the most from?',
                'The Stage One instructor(s) were well prepared',
                'The Stage One instructor(s) were knowledgeable',
                'How does this workshop compare to rest of the activities during your trip?',
                'Comments/Suggestions/Ideas (we will read everything you write)'
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : selectedWorkshop === 'Mechanical' ? (
              [
                'Date',
                'Time',
                'I did this workshop in',
                'I had fun in this workshop',
                'My favorite part of this workshop was',
                'I am more knowledgeable about 3D design after this workshop',
                'I think I can design something using CAD on my own',
                'Something I\'d like to try designing next is',
                'The workshop was well paced',
                'I would recommend that this workshop be taught again next year',
                'Which workshop instructor did you learn the most from?',
                'The Stage One instructor(s) were well prepared',
                'The Stage One instructor(s) were knowledgeable',
                'How does this workshop compare to rest of the activities during your trip?',
                'Comments/Suggestions/Ideas (we will read everything you write)'
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : selectedWorkshop === 'Instructor' ? (
              [
                'Date',
                'Time',
                'I instructed a workshop in',
                'What type of session did you instruct?',
                'I felt well-prepared before the event began',
                'How would you rate the workshop venue?',
                'How would you rate the workshop content?',
                'How would you rate the workshop schedule and timing?',
                'Would you instruct future workshops with Stage One Education?',
                'Comments, suggestions, or ideas'
              ].map((header, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {header}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            ) : (
              Array.from({ length: 14 }, (_, i) => (
                <div key={i} className="column-header-container">
                  <div 
                    className="column-header" 
                    style={{ width: columnWidths[i] }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div 
                    className="resize-handle"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                  ></div>
                </div>
              ))
            )}
            </div>
            <div className="spreadsheet-body">
            {Array.from({ length: sortedFeedbackData.length }, (_, rowIndex) => {
              return (
              <div 
                key={rowIndex} 
                className="spreadsheet-row"
                onClick={(e) => handleRowClick(rowIndex, e)}
                style={{
                  backgroundColor: selectedRows.includes(rowIndex) ? '#e3f2fd' : 'transparent',
                  cursor: rowIndex < sortedFeedbackData.length ? 'pointer' : 'default'
                }}
              >
                <div 
                  className="row-number" 
                  onDoubleClick={() => handleRowNumberDoubleClick(rowIndex)}
                  style={{ 
                    cursor: rowIndex < sortedFeedbackData.length ? 'pointer' : 'default',
                    backgroundColor: selectedRows.includes(rowIndex) ? '#1976d2' : 'transparent',
                    color: selectedRows.includes(rowIndex) ? 'white' : '#000'
                  }}
                >
                  {selectedRows.length > 0 && selectedRows.includes(rowIndex) ? (
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMultiRowDelete()
                      }}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    rowIndex + 1
                  )}
                </div>
                {Array.from({ length: selectedWorkshop === 'Instructor' ? 10 : 15 }, (_, colIndex) => {
                  const cellId = `${rowIndex}-${colIndex}`
                  const isSelected = selectedCells.has(cellId)
                  const cellValue = cellData[cellId] || ''
                  const cellColors = getCellColor(cellValue)
                  
                  return (
                    <div 
                      key={colIndex} 
                      className={`spreadsheet-cell ${isSelected ? 'selected' : ''}`}
                      style={{ 
                        width: columnWidths[colIndex],
                        backgroundColor: cellColors.backgroundColor
                      }}
                      data-row={rowIndex}
                      data-col={colIndex}
                      onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex)}
                      onClick={(e) => handleCellClick(e, rowIndex, colIndex)}
                    >
                      <input 
                        type="text" 
                        className="cell-input"
                        placeholder=""
                        disabled={true}
                        value={cellValue}
                        readOnly
                        style={{
                          backgroundColor: cellColors.backgroundColor,
                          color: cellColors.color
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )
                })}
              </div>
              )
            })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Print, CSV Download, and Password Management Buttons - Bottom Right */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginTop: '10px',
        marginRight: '20px',
        gap: '8px'
      }}>
        <button 
          onClick={printTable}
          style={{ 
            padding: '4px 8px', 
            backgroundColor: 'white', 
            color: '#666666ff', 
            border: '1px solid #666666ff', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            gap: '4px',
            height: '24px'
          }}
          title="Print Table"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5'
            e.target.style.borderColor = '#555555'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white'
            e.target.style.borderColor = '#666666ff'
          }}
        >
          Print
        </button>
        <button 
          onClick={downloadCSV}
          style={{ 
            padding: '4px 8px', 
            backgroundColor: 'white', 
            color: '#666666ff', 
            border: '1px solid #666666ff', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            gap: '4px',
            height: '24px'
          }}
          title="Download CSV"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5'
            e.target.style.borderColor = '#555555'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white'
            e.target.style.borderColor = '#666666ff'
          }}
        >
          Download CSV
        </button>
        <button 
          onClick={() => {
            const currentDataPassword = localStorage.getItem('feedbackDataPassword') || '1234';
            const currentDashboardPassword = localStorage.getItem('dashboardPassword') || '1111';
            const isPasswordDisabled = localStorage.getItem('passwordProtectionDisabled') === 'true';
            
            const passwordChoice = prompt(
              `Current passwords:\nDashboard: ${currentDashboardPassword}\nData: ${currentDataPassword}\n\nPassword Protection: ${isPasswordDisabled ? 'DISABLED' : 'ENABLED'}\n\nWhat would you like to do?\n1. Change Dashboard password\n2. Change Data password\n3. ${isPasswordDisabled ? 'Enable' : 'Disable'} password protection\n\nEnter 1, 2, or 3:`
            );
            
            if (passwordChoice === '1') {
              const newPassword = prompt(`Current Dashboard password: ${currentDashboardPassword}\n\nEnter new Dashboard password:`, currentDashboardPassword);
              if (newPassword !== null && newPassword.trim() !== '') {
                localStorage.setItem('dashboardPassword', newPassword.trim());
                alert('Dashboard password updated successfully!');
              }
            } else if (passwordChoice === '2') {
              const newPassword = prompt(`Current Data password: ${currentDataPassword}\n\nEnter new Data password:`, currentDataPassword);
              if (newPassword !== null && newPassword.trim() !== '') {
                localStorage.setItem('feedbackDataPassword', newPassword.trim());
                alert('Data password updated successfully!');
              }
            } else if (passwordChoice === '3') {
              if (isPasswordDisabled) {
                localStorage.removeItem('passwordProtectionDisabled');
                alert('Password protection has been enabled for both pages.');
              } else {
                const confirmDisable = confirm('Are you sure you want to disable password protection for both the dashboard and feedback data pages?');
                if (confirmDisable) {
                  localStorage.setItem('passwordProtectionDisabled', 'true');
                  alert('Password protection has been disabled for both pages. You can now access them without a password.');
                }
              }
            } else if (passwordChoice !== null) {
              alert('Invalid choice. Please enter 1, 2, or 3.');
            }
          }}
          style={{ 
            padding: '4px 8px', 
            backgroundColor: 'white', 
            color: '#666666ff', 
            border: '1px solid #666666ff', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            gap: '4px',
            height: '24px'
          }}
          title="Set Page Password"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5'
            e.target.style.borderColor = '#555555'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white'
            e.target.style.borderColor = '#666666ff'
          }}
        >
          Set Password
        </button>
        <button 
          onClick={() => setShowImportModal(true)}
          style={{ 
            padding: '4px 8px', 
            backgroundColor: 'white', 
            color: '#666666ff', 
            border: '1px solid #666666ff', 
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            gap: '4px',
            height: '24px'
          }}
          title="Import Data from Google Sheets"
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5'
            e.target.style.borderColor = '#555555'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white'
            e.target.style.borderColor = '#666666ff'
          }}
        >
          Import
        </button>
      </div>
      
      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
              Import Data - {selectedWorkshop} Workshop
            </h3>
            <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '14px' }}>
              Paste data from Google Sheets column by column. Each column should contain data for one field.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              {selectedWorkshop === 'AI' ? (
                [
                  'Date',
                  'Time',
                  'I did this workshop in',
                  'I had fun in this workshop',
                  'My favorite part of this workshop was',
                  'This workshop challenged me appropriately',
                  'Before this workshop my comfort with AI tools was',
                  'After this workshop my comfort with AI tools was',
                  'Before this workshop my understanding of neural networks was',
                  'After this workshop my understanding of neural networks was',
                  'Which workshop instructor did you learn the most from?',
                  'The Stage One instructor(s) were well prepared',
                  'The Stage One instructor(s) were knowledgeable',
                  'How does this workshop compare to rest of the activities during your trip?',
                  'Comments/Suggestions/Ideas (we will read everything you write)'
                ].map((columnName, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500',
                      fontSize: '13px',
                      color: '#333'
                    }}>
                      {columnName}:
                    </label>
                    <textarea
                      value={importData[index] || ''}
                      onChange={(e) => setImportData(prev => ({ ...prev, [index]: e.target.value }))}
                      placeholder={`Paste ${columnName} data here...`}
                      style={{
                        width: '100%',
                        height: '80px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ))
              ) : selectedWorkshop === 'Robotics' ? (
                [
                  'Date',
                  'Time',
                  'I did this workshop in',
                  'I had fun in this workshop',
                  'My favorite part of this workshop was',
                  'This workshop challenged me appropriately',
                  'I learned how to build and understand basic electronic systems',
                  'After taking this workshop I feel confident in starting another similar electronics project',
                  'In the next electronics workshop I want to learn how to _______',
                  'I would recommend that this workshop be taught again next year',
                  'Which workshop instructor did you learn the most from?',
                  'The Stage One instructor(s) were well prepared',
                  'The Stage One instructor(s) were knowledgeable',
                  'How does this workshop compare to rest of the activities during your trip?',
                  'Comments/Suggestions/Ideas (we will read everything you write)'
                ].map((columnName, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500',
                      fontSize: '13px',
                      color: '#333'
                    }}>
                      {columnName}:
                    </label>
                    <textarea
                      value={importData[index] || ''}
                      onChange={(e) => setImportData(prev => ({ ...prev, [index]: e.target.value }))}
                      placeholder={`Paste ${columnName} data here...`}
                      style={{
                        width: '100%',
                        height: '80px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ))
              ) : selectedWorkshop === 'Mechanical' ? (
                [
                  'Date',
                  'Time',
                  'I did this workshop in',
                  'I had fun in this workshop',
                  'My favorite part of this workshop was',
                  'I am more knowledgeable about 3D design after this workshop',
                  'I think I can design something using CAD on my own',
                  'Something I\'d like to try designing next is',
                  'The workshop was well paced',
                  'I would recommend that this workshop be taught again next year',
                  'Which workshop instructor did you learn the most from?',
                  'The Stage One instructor(s) were well prepared',
                  'The Stage One instructor(s) were knowledgeable',
                  'How does this workshop compare to rest of the activities during your trip?',
                  'Comments/Suggestions/Ideas (we will read everything you write)'
                ].map((columnName, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500',
                      fontSize: '13px',
                      color: '#333'
                    }}>
                      {columnName}:
                    </label>
                    <textarea
                      value={importData[index] || ''}
                      onChange={(e) => setImportData(prev => ({ ...prev, [index]: e.target.value }))}
                      placeholder={`Paste ${columnName} data here...`}
                      style={{
                        width: '100%',
                        height: '80px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ))
              ) : selectedWorkshop === 'Instructor' ? (
                [
                  'Date',
                  'Time',
                  'I instructed a workshop in',
                  'What type of session did you instruct?',
                  'I felt well-prepared before the event began',
                  'How would you rate the workshop venue?',
                  'How would you rate the workshop content?',
                  'How would you rate the workshop schedule and timing?',
                  'Would you instruct future workshops with Stage One Education?',
                  'Comments, suggestions, or ideas'
                ].map((columnName, index) => (
                  <div key={index} style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500',
                      fontSize: '13px',
                      color: '#333'
                    }}>
                      {columnName}:
                    </label>
                    <textarea
                      value={importData[index] || ''}
                      onChange={(e) => setImportData(prev => ({ ...prev, [index]: e.target.value }))}
                      placeholder={`Paste ${columnName} data here...`}
                      style={{
                        width: '100%',
                        height: '80px',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ))
              ) : null}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportData({})
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportData}
                disabled={isImporting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isImporting ? '#ccc' : '#f05f40',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isImporting ? 'Importing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="footer">
        <div className="footer-content">
          © 2025 Stage One Education, LLC
        </div>
      </footer>
    </div>
  )
}

export default FeedbackData
