import { useState, useRef, useEffect, useCallback } from 'react'
import './InstructionsPanel.css'
import page1 from '../assets/images/pages/1.png'
import page2 from '../assets/images/pages/2.png'
import page3 from '../assets/images/pages/3.png'
import page4 from '../assets/images/pages/4.png'
import page5 from '../assets/images/pages/5.png'
import safetyGlasses from '../assets/images/safety-glasses.png'

const DEFAULT_PAGE_ASPECT = 0.75
const STAGE_FRAME_PADDING = 6
const START_BUTTON_SMALL_THRESHOLD = 80 // px width threshold to shrink border

function InstructionsPanel({ editorMode, onDimensionsCapture }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [hasStarted, setHasStarted] = useState(false)
  // Track which pages have been visited/completed (button clicked)
  const [visitedPages, setVisitedPages] = useState(new Set())
  // Track page 3 button state
  const [page3ButtonClicked, setPage3ButtonClicked] = useState(false)
  // Track page 3 second button state
  const [page3SecondButtonClicked, setPage3SecondButtonClicked] = useState(false)
  // Track page 4 button states
  const [page4Button1Clicked, setPage4Button1Clicked] = useState(false)
  const [page4Button2Clicked, setPage4Button2Clicked] = useState(false)
  const [page4Button3Clicked, setPage4Button3Clicked] = useState(false)
  const [page4Button4Clicked, setPage4Button4Clicked] = useState(false)
  const [page4Button5Clicked, setPage4Button5Clicked] = useState(false)
  // Track page 4 speech bubble button state
  const [page4SpeechBubbleClicked, setPage4SpeechBubbleClicked] = useState(false)
  // Track selected green boxes on page 3
  const [selectedGreenBoxes, setSelectedGreenBoxes] = useState(new Set())
  // Track if returning from page 3 to page 2
  const [returningFromPage3, setReturningFromPage3] = useState(false)
  // Track if returning from page 2 to page 1
  const [returningFromPage2, setReturningFromPage2] = useState(false)
  // Track if returning to page 3 after second button was clicked
  const [returningToPage3AfterSecondButton, setReturningToPage3AfterSecondButton] = useState(false)
  // Track white box fade states for page 2
  const [box1Fading, setBox1Fading] = useState(false)
  const [box2Fading, setBox2Fading] = useState(false)
  const [box3Fading, setBox3Fading] = useState(false)
  // Default box position - will be set based on current page
  const getDefaultBoxPosition = (pageIndex) => {
    if (pageIndex === 0) {
      // Page 1 specific dimensions
      return { left: 36.82, top: 70.73, width: 26.76, height: 8.24 }
    }
    // Default for other pages
    return { left: 40, top: 40, width: 20, height: 15 }
  }
  
  const [boxPosition, setBoxPosition] = useState(getDefaultBoxPosition(0))
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState(null) // 'n', 's', 'e', 'w'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [boxStart, setBoxStart] = useState({ left: 0, top: 0, width: 0, height: 0 })
  // Dot positions along the perimeter (0-100%, where 0% = top-left, 25% = top-right, 50% = bottom-right, 75% = bottom-left)
  const [dot1Position, setDot1Position] = useState(10) // Start at 10% along perimeter
  const [dot2Position, setDot2Position] = useState(60) // Start at 60% along perimeter
  const [isDraggingDot, setIsDraggingDot] = useState(null) // null, 'dot1', 'dot2', or 'dot3'
  const [dotDragStart, setDotDragStart] = useState({ x: 0, y: 0, perimeter: 0 })
  // Third dot position (x, y as percentages relative to image)
  const [dot3Position, setDot3Position] = useState({ x: 50, y: 50 }) // Start at center
  const stageRef = useRef(null)
  const stageFrameRef = useRef(null)
  const imgRef = useRef(null)
  const boxRef = useRef(null)
  const pages = [page1, page2, page3, page4, page5]

  const handlePrevious = () => {
    if (currentPage > 0) {
      const previousPage = currentPage - 1
      // Track if we're returning from page 3 to page 2
      if (currentPage === 2) {
        setReturningFromPage3(true)
        setReturningFromPage2(false)
        setReturningToPage3AfterSecondButton(false)
      } else if (currentPage === 1) {
        // Track if we're returning from page 2 to page 1
        setReturningFromPage2(true)
        setReturningFromPage3(false)
        setReturningToPage3AfterSecondButton(false)
      } else {
        setReturningFromPage3(false)
        setReturningFromPage2(false)
        // returningToPage3AfterSecondButton will be set in useEffect when arriving at page 3
      }
      setCurrentPage(prev => prev - 1)
      setZoom(100)
    }
  }

  const handleNext = () => {
    // If on page 1 (index 0), require start button to be clicked first (only on first visit)
    if (currentPage === 0 && !visitedPages.has(0)) {
      return
    }
    // For page 1 (index 1), require button click only on first visit
    if (currentPage === 1 && !visitedPages.has(1)) {
      return
    }
    // For page 3 (index 2), require both buttons to be clicked
    if (currentPage === 2 && (!page3ButtonClicked || !page3SecondButtonClicked)) {
      return
    }
    if (currentPage < pages.length - 1) {
      // Reset returning states when navigating forward (except returningToPage3AfterSecondButton which is set in useEffect)
      setReturningFromPage3(false)
      setReturningFromPage2(false)
      // Don't reset returningToPage3AfterSecondButton here - it will be set in useEffect when arriving at page 3
      setCurrentPage(prev => prev + 1)
      setZoom(100)
    }
  }

  const handleStart = () => {
    // Reset returning state when button is clicked
    setReturningFromPage2(false)
    setHasStarted(true)
    // Mark page 0 as visited
    setVisitedPages(prev => new Set(prev).add(0))
    // Move to next page after clicking Start
    if (currentPage < pages.length - 1) {
      setCurrentPage(1)
      setZoom(100)
    }
  }

  // Handler for page 1 button
  const handlePage1Button = () => {
    // Button is disabled once clicked, so this should only execute on first click
    // Reset returning state when button is clicked
    setReturningFromPage3(false)
    // Mark page 1 as visited
    setVisitedPages(prev => new Set(prev).add(1))
    // Move to next page
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      setZoom(100)
    }
  }

  // Handler for page 4 buttons
  const handlePage4Button1 = () => {
    setPage4Button1Clicked(true)
    setVisitedPages(prev => new Set(prev).add(3))
  }

  const handlePage4Button2 = () => {
    setPage4Button2Clicked(true)
  }

  const handlePage4Button3 = () => {
    setPage4Button3Clicked(true)
  }

  const handlePage4Button4 = () => {
    setPage4Button4Clicked(true)
  }

  const handlePage4Button5 = () => {
    setPage4Button5Clicked(true)
  }

  // Handler for page 4 speech bubble button
  const handlePage4SpeechBubble = () => {
    setPage4SpeechBubbleClicked(true)
  }

  // Handler for page 3 speech bubble button
  const handlePage3Button = () => {
    setPage3ButtonClicked(true)
    // Don't navigate immediately - wait for second box to be clicked
  }

  const handlePage3SecondButton = () => {
    // Enable Next button when second box is clicked (don't navigate automatically)
    setPage3SecondButtonClicked(true)
  }

  // Handler for green box clicks on page 3
  const handleGreenBoxClick = (index) => {
    setSelectedGreenBoxes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index) // Toggle off if already selected
      } else {
        newSet.add(index) // Toggle on if not selected
      }
      return newSet
    })
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleReset = () => {
    setZoom(100)
  }

  // Track container size changes to ensure buttons scale correctly with panel resizing
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [imageAspect, setImageAspect] = useState(DEFAULT_PAGE_ASPECT)
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
  const [safetyGlassesSize, setSafetyGlassesSize] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    const updateContainerSize = () => {
      if (stageFrameRef.current) {
        const rect = stageFrameRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    
    updateContainerSize()
    
    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize()
    })
    
    if (stageFrameRef.current) {
      resizeObserver.observe(stageFrameRef.current)
    }
    
    window.addEventListener('resize', updateContainerSize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateContainerSize)
    }
  }, [currentPage])

  // Initialize box when editor mode is enabled or page changes
  useEffect(() => {
    // Reset box position when page changes
    const defaultPosition = getDefaultBoxPosition(currentPage)
    setBoxPosition(defaultPosition)
    // Reset dot positions to default when page changes
    setDot1Position(10)
    setDot2Position(60)
    setDot3Position({ x: 50, y: 50 })
    // Reset page 3 button states when leaving page 3 (but keep page3SecondButtonClicked and selectedGreenBoxes to track state)
    if (currentPage !== 2) {
      setPage3ButtonClicked(false)
      // Don't reset page3SecondButtonClicked - we need to know if it was clicked when returning
      // Don't reset selectedGreenBoxes - we need to preserve selected state when returning
    }
    // When arriving at page 3, if second button was previously clicked, set returning state
    // This means the user has completed the page 3 flow and is returning
    if (currentPage === 2 && page3SecondButtonClicked) {
      setReturningToPage3AfterSecondButton(true)
      // Also set page3ButtonClicked to true so first button shows as disabled
      setPage3ButtonClicked(true)
    }
    // Reset returningFromPage3 when not on page 2
    if (currentPage !== 1) {
      setReturningFromPage3(false)
    }
    // Reset returningFromPage2 when not on page 1
    if (currentPage !== 0) {
      setReturningFromPage2(false)
    }
    // Reset returningToPage3AfterSecondButton when not on page 3
    if (currentPage !== 2) {
      setReturningToPage3AfterSecondButton(false)
    }
  }, [currentPage])

  // Trigger white boxes fade on page 2 when Start button was clicked
  useEffect(() => {
    if (currentPage === 1 && visitedPages.has(0) && !editorMode) {
      // Box 1: fade after 2 seconds
      const timer1 = setTimeout(() => {
        setBox1Fading(true)
      }, 2000)

      // Box 2: fade after 4 seconds
      const timer2 = setTimeout(() => {
        setBox2Fading(true)
      }, 4000)

      // Box 3: fade after 6 seconds
      const timer3 = setTimeout(() => {
        setBox3Fading(true)
      }, 6000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    } else {
      // Reset fade states when leaving page 2
      setBox1Fading(false)
      setBox2Fading(false)
      setBox3Fading(false)
    }
  }, [currentPage, visitedPages, editorMode])

  // Update dimensions when editor mode is enabled or page changes
  useEffect(() => {
    if (editorMode && boxPosition) {
      const dot1Coords = perimeterToCoordinates(dot1Position)
      const dot2Coords = perimeterToCoordinates(dot2Position)
      const dimensions = {
        page: currentPage + 1,
        left: boxPosition.left.toFixed(2),
        top: boxPosition.top.toFixed(2),
        width: boxPosition.width.toFixed(2),
        height: boxPosition.height.toFixed(2),
        right: (boxPosition.left + boxPosition.width).toFixed(2),
        bottom: (boxPosition.top + boxPosition.height).toFixed(2),
        dot1: {
          x: dot1Coords.x.toFixed(2),
          y: dot1Coords.y.toFixed(2),
          perimeter: dot1Position.toFixed(2)
        },
        dot2: {
          x: dot2Coords.x.toFixed(2),
          y: dot2Coords.y.toFixed(2),
          perimeter: dot2Position.toFixed(2)
        },
        dot3: {
          x: dot3Position.x.toFixed(2),
          y: dot3Position.y.toFixed(2)
        }
      }
      onDimensionsCapture(dimensions)
    }
  }, [editorMode, currentPage, boxPosition, dot1Position, dot2Position]) // Update when mode, page, position, or dot positions change

  // Get coordinates relative to image as percentage (always at 100% zoom level)
  const getRelativeCoordinates = (clientX, clientY) => {
    if (!stageRef.current || !imgRef.current) return null
    
    const wrapperRect = stageRef.current.getBoundingClientRect()
    const imgRect = imgRef.current.getBoundingClientRect()
    
    // Calculate the scale factor
    const scale = zoom / 100
    
    // Get the image's current display dimensions (already includes CSS transform scale)
    const imgScaledWidth = imgRect.width
    const imgScaledHeight = imgRect.height
    
    // Calculate the image dimensions at 100% zoom (divide by scale)
    const imgNaturalWidth = imgScaledWidth / scale
    const imgNaturalHeight = imgScaledHeight / scale
    
    // Get the center point of the image (center of wrapper since image is centered)
    const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2
    const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2
    
    // Calculate mouse position relative to wrapper center
    const mouseXFromCenter = clientX - wrapperCenterX
    const mouseYFromCenter = clientY - wrapperCenterY
    
    // Convert to image coordinates at 100% zoom
    // Since image scales from center, divide by scale to get 100% zoom coordinates
    const imgXAt100Zoom = mouseXFromCenter / scale
    const imgYAt100Zoom = mouseYFromCenter / scale
    
    // Convert to percentage relative to image size at 100% zoom
    // 0% = left/top edge of image, 50% = center, 100% = right/bottom edge
    const percentX = (imgXAt100Zoom / imgNaturalWidth) * 100 + 50
    const percentY = (imgYAt100Zoom / imgNaturalHeight) * 100 + 50
    
    return { 
      x: Math.max(0, Math.min(100, percentX)), 
      y: Math.max(0, Math.min(100, percentY)) 
    }
  }

  // Convert perimeter percentage (0-100) to x,y coordinates on the box edge
  // Perimeter: 0% = top-left, 25% = top-right, 50% = bottom-right, 75% = bottom-left, 100% = top-left
  const perimeterToCoordinates = (perimeterPercent) => {
    const { left, top, width, height } = boxPosition
    const perimeter = perimeterPercent % 100
    
    if (perimeter <= 25) {
      // Top edge: left to right
      const t = perimeter / 25
      return {
        x: left + width * t,
        y: top
      }
    } else if (perimeter <= 50) {
      // Right edge: top to bottom
      const t = (perimeter - 25) / 25
      return {
        x: left + width,
        y: top + height * t
      }
    } else if (perimeter <= 75) {
      // Bottom edge: right to left
      const t = (perimeter - 50) / 25
      return {
        x: left + width * (1 - t),
        y: top + height
      }
    } else {
      // Left edge: bottom to top
      const t = (perimeter - 75) / 25
      return {
        x: left,
        y: top + height * (1 - t)
      }
    }
  }

  // Convert x,y coordinates to perimeter percentage
  // Finds the closest point on the box perimeter to the given coordinates
  const coordinatesToPerimeter = (x, y) => {
    const { left, top, width, height } = boxPosition
    const right = left + width
    const bottom = top + height
    
    // Project point onto each edge and calculate distance
    // Top edge: from (left, top) to (right, top)
    const topT = Math.max(0, Math.min(1, (x - left) / width))
    const topProjX = left + width * topT
    const topProjY = top
    const distToTop = Math.sqrt(Math.pow(x - topProjX, 2) + Math.pow(y - topProjY, 2))
    
    // Right edge: from (right, top) to (right, bottom)
    const rightT = Math.max(0, Math.min(1, (y - top) / height))
    const rightProjX = right
    const rightProjY = top + height * rightT
    const distToRight = Math.sqrt(Math.pow(x - rightProjX, 2) + Math.pow(y - rightProjY, 2))
    
    // Bottom edge: from (right, bottom) to (left, bottom)
    const bottomT = Math.max(0, Math.min(1, (right - x) / width))
    const bottomProjX = right - width * bottomT
    const bottomProjY = bottom
    const distToBottom = Math.sqrt(Math.pow(x - bottomProjX, 2) + Math.pow(y - bottomProjY, 2))
    
    // Left edge: from (left, bottom) to (left, top)
    const leftT = Math.max(0, Math.min(1, (bottom - y) / height))
    const leftProjX = left
    const leftProjY = bottom - height * leftT
    const distToLeft = Math.sqrt(Math.pow(x - leftProjX, 2) + Math.pow(y - leftProjY, 2))
    
    // Find the closest edge
    const minDist = Math.min(distToTop, distToRight, distToBottom, distToLeft)
    
    let perimeter = 0
    
    if (minDist === distToTop) {
      // On top edge
      perimeter = topT * 25
    } else if (minDist === distToRight) {
      // On right edge
      perimeter = 25 + rightT * 25
    } else if (minDist === distToBottom) {
      // On bottom edge
      perimeter = 50 + bottomT * 25
    } else {
      // On left edge
      perimeter = 75 + leftT * 25
    }
    
    return perimeter
  }


  // Handle mouse down on box, resize handle, or dot
  const handleBoxMouseDown = (e) => {
    if (!editorMode) return
    
    const handle = e.target.dataset.handle
    const dotId = e.target.dataset.dot
    
    if (dotId === 'dot1' || dotId === 'dot2' || dotId === 'dot3') {
      // Starting dot drag
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingDot(dotId)
      const coords = getRelativeCoordinates(e.clientX, e.clientY)
      if (coords) {
        if (dotId === 'dot3') {
          // For dot3, store the current position
          setDotDragStart({ x: coords.x, y: coords.y, startX: dot3Position.x, startY: dot3Position.y })
        } else {
          // For edge dots, store perimeter
          const currentPerimeter = dotId === 'dot1' ? dot1Position : dot2Position
          setDotDragStart({ x: coords.x, y: coords.y, perimeter: currentPerimeter })
        }
      }
    } else if (handle && ['n', 's', 'e', 'w'].includes(handle)) {
      // Starting resize on edge
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeHandle(handle)
      const coords = getRelativeCoordinates(e.clientX, e.clientY)
      if (coords) {
        setDragStart(coords)
        setBoxStart(boxPosition)
      }
    } else if (e.target.classList.contains('resizable-box-content') || e.target.classList.contains('resizable-box')) {
      // Starting drag
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      const coords = getRelativeCoordinates(e.clientX, e.clientY)
      if (coords) {
        setDragStart(coords)
        setBoxStart(boxPosition)
      }
    }
  }

  // Handle mouse move for dragging, resizing, or dot dragging
  const handleMouseMove = useCallback((e) => {
    if (!editorMode) return
    
    const coords = getRelativeCoordinates(e.clientX, e.clientY)
    if (!coords) return

    if (isDraggingDot) {
      if (isDraggingDot === 'dot3') {
        // Dot3 can move anywhere on the page
        const deltaX = coords.x - dotDragStart.x
        const deltaY = coords.y - dotDragStart.y
        let newX = dotDragStart.startX + deltaX
        let newY = dotDragStart.startY + deltaY
        // Keep within image bounds (0-100%)
        newX = Math.max(0, Math.min(100, newX))
        newY = Math.max(0, Math.min(100, newY))
        setDot3Position({ x: newX, y: newY })
      } else {
        // Calculate new dot position along perimeter for edge dots
        const newPerimeter = coordinatesToPerimeter(coords.x, coords.y)
        if (isDraggingDot === 'dot1') {
          setDot1Position(newPerimeter)
        } else if (isDraggingDot === 'dot2') {
          setDot2Position(newPerimeter)
        }
      }
    } else if (isDragging) {
      // Calculate new position
      const deltaX = coords.x - dragStart.x
      const deltaY = coords.y - dragStart.y
      
      let newLeft = boxStart.left + deltaX
      let newTop = boxStart.top + deltaY
      
      // Keep box within image bounds
      newLeft = Math.max(0, Math.min(100 - boxStart.width, newLeft))
      newTop = Math.max(0, Math.min(100 - boxStart.height, newTop))
      
      setBoxPosition(prev => ({
        ...prev,
        left: newLeft,
        top: newTop
      }))
    } else if (isResizing && resizeHandle) {
      // Calculate new size and position based on edge handle
      const deltaX = coords.x - dragStart.x
      const deltaY = coords.y - dragStart.y
      
      let newLeft = boxStart.left
      let newTop = boxStart.top
      let newWidth = boxStart.width
      let newHeight = boxStart.height
      
      // Handle different resize directions (only edges, not corners)
      if (resizeHandle === 'w') {
        // Resize from left edge
        newLeft = Math.max(0, boxStart.left + deltaX)
        newWidth = Math.max(2, boxStart.width - deltaX)
        if (newLeft + newWidth > 100) {
          newWidth = 100 - newLeft
        }
      } else if (resizeHandle === 'e') {
        // Resize from right edge
        newWidth = Math.max(2, boxStart.width + deltaX)
        if (newLeft + newWidth > 100) {
          newWidth = 100 - newLeft
        }
      } else if (resizeHandle === 'n') {
        // Resize from top edge
        newTop = Math.max(0, boxStart.top + deltaY)
        newHeight = Math.max(2, boxStart.height - deltaY)
        if (newTop + newHeight > 100) {
          newHeight = 100 - newTop
        }
      } else if (resizeHandle === 's') {
        // Resize from bottom edge
        newHeight = Math.max(2, boxStart.height + deltaY)
        if (newTop + newHeight > 100) {
          newHeight = 100 - newTop
        }
      }
      
      setBoxPosition(prev => ({
        ...prev,
        left: newLeft,
        top: newTop,
        width: newWidth,
        height: newHeight
      }))
    }
  }, [editorMode, isDragging, isResizing, isDraggingDot, resizeHandle, dragStart, boxStart, dotDragStart, dot3Position, zoom, boxPosition])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing || isDraggingDot) {
      setIsDragging(false)
      setIsResizing(false)
      setIsDraggingDot(null)
      setResizeHandle(null)
      // Dimensions will be updated by the useEffect watching boxPosition and dot positions
    }
  }, [isDragging, isResizing, isDraggingDot])

  // Set up global mouse event listeners
  useEffect(() => {
    if (editorMode && (isDragging || isResizing || isDraggingDot)) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [editorMode, isDragging, isResizing, isDraggingDot, handleMouseMove, handleMouseUp])

  // Update dimensions whenever box position or dot positions change (debounced after drag/resize)
  useEffect(() => {
    if (editorMode && !isDragging && !isResizing && !isDraggingDot) {
      const timeoutId = setTimeout(() => {
        const dot1Coords = perimeterToCoordinates(dot1Position)
        const dot2Coords = perimeterToCoordinates(dot2Position)
        const dimensions = {
          page: currentPage + 1,
          left: boxPosition.left.toFixed(2),
          top: boxPosition.top.toFixed(2),
          width: boxPosition.width.toFixed(2),
          height: boxPosition.height.toFixed(2),
          right: (boxPosition.left + boxPosition.width).toFixed(2),
          bottom: (boxPosition.top + boxPosition.height).toFixed(2),
          dot1: {
            x: dot1Coords.x.toFixed(2),
            y: dot1Coords.y.toFixed(2),
            perimeter: dot1Position.toFixed(2)
          },
          dot2: {
            x: dot2Coords.x.toFixed(2),
            y: dot2Coords.y.toFixed(2),
            perimeter: dot2Position.toFixed(2)
          },
          dot3: {
            x: dot3Position.x.toFixed(2),
            y: dot3Position.y.toFixed(2)
          }
        }
        onDimensionsCapture(dimensions)
      }, 100) // Small delay to batch updates
      
      return () => clearTimeout(timeoutId)
    }
  }, [boxPosition, dot1Position, dot2Position, dot3Position, editorMode, isDragging, isResizing, isDraggingDot, currentPage, onDimensionsCapture])

  // Calculate box style - scales with zoom (same as image)
  const getBoxStyle = () => {
    const scale = zoom / 100
    
    // To make the box scale from wrapper center (50%, 50%) like the image does,
    // we need to calculate where the wrapper center point is relative to the box itself
    // Wrapper center is at 50% 50% of wrapper
    // Box is positioned at boxPosition.left% boxPosition.top% of wrapper
    
    // The wrapper center point relative to the box:
    // X: How far into the box is the wrapper center horizontally
    const wrapperCenterRelativeToBoxLeft = (50 - boxPosition.left) / boxPosition.width * 100
    // Y: How far into the box is the wrapper center vertically  
    const wrapperCenterRelativeToBoxTop = (50 - boxPosition.top) / boxPosition.height * 100
    
    return {
      position: 'absolute',
      left: `${boxPosition.left}%`,
      top: `${boxPosition.top}%`,
      width: `${boxPosition.width}%`,
      height: `${boxPosition.height}%`,
      transform: `scale(${scale})`,
      transformOrigin: `${wrapperCenterRelativeToBoxLeft}% ${wrapperCenterRelativeToBoxTop}%`,
      border: '2px solid #0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      cursor: isDragging ? 'move' : 'default',
      zIndex: 20,
      boxSizing: 'border-box'
    }
  }

  // Calculate dot style - positions dot on the edge of the box
  const getDotStyle = (perimeterPercent) => {
    const coords = perimeterToCoordinates(perimeterPercent)
    const { left, top, width, height } = boxPosition
    
    // Calculate position relative to box (0-100% within box)
    const relativeX = ((coords.x - left) / width) * 100
    const relativeY = ((coords.y - top) / height) * 100
    
    return {
      position: 'absolute',
      left: `${relativeX}%`,
      top: `${relativeY}%`,
      width: '8px',
      height: '8px',
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      backgroundColor: '#ff6b6b',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
      zIndex: 25,
      pointerEvents: 'auto'
    }
  }

  // Calculate dot3 style - positions dot anywhere on the page
  const getDot3Style = () => {
    const scale = zoom / 100
    
    return {
      position: 'absolute',
      left: `${dot3Position.x}%`,
      top: `${dot3Position.y}%`,
      width: '8px',
      height: '8px',
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      backgroundColor: '#4ecdc4',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
      zIndex: 25,
      pointerEvents: 'auto'
    }
  }


  // Calculate button style - scales with zoom exactly like the image (from wrapper center)
  const getButtonStyle = (buttonLeft, buttonTop, buttonWidth, buttonHeight) => {
    const scale = zoom / 100
    
    // Calculate transform origin so button scales from wrapper center (50%, 50%) like the image does
    // The wrapper center point relative to the button:
    // X: How far into the button is the wrapper center horizontally
    const wrapperCenterRelativeToButtonLeft = (50 - buttonLeft) / buttonWidth * 100
    // Y: How far into the button is the wrapper center vertically  
    const wrapperCenterRelativeToButtonTop = (50 - buttonTop) / buttonHeight * 100
    
    return {
      position: 'absolute',
      left: `${buttonLeft}%`,
      top: `${buttonTop}%`,
      width: `${buttonWidth}%`,
      height: `${buttonHeight}%`,
      transform: `scale(${scale})`,
      transformOrigin: `${wrapperCenterRelativeToButtonLeft}% ${wrapperCenterRelativeToButtonTop}%`
    }
  }

  const handleImageLoad = useCallback((event) => {
    if (!event?.target) return
    const { naturalWidth, naturalHeight } = event.target
    if (!naturalWidth || !naturalHeight) return
    const aspect = naturalWidth / naturalHeight
    setImageAspect(prev => {
      const previousAspect = prev ?? DEFAULT_PAGE_ASPECT
      if (Math.abs(previousAspect - aspect) < 0.0001) {
        return previousAspect
      }
      return aspect
    })
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight })
  }, [])

  let stageWidthPx = 0
  let stageHeightPx = 0

  const stageStyle = (() => {
    const baseStyle = { cursor: editorMode ? 'default' : 'default' }
    if (!containerSize.width || !containerSize.height) {
      return baseStyle
    }
    const availableWidth = Math.max(containerSize.width - STAGE_FRAME_PADDING, 0)
    const availableHeight = Math.max(containerSize.height - STAGE_FRAME_PADDING, 0)
    if (!availableWidth || !availableHeight) {
      return baseStyle
    }
    const aspect = imageAspect || DEFAULT_PAGE_ASPECT
    let stageWidth = availableWidth
    let stageHeight = stageWidth / aspect
    
    if (stageHeight > availableHeight) {
      stageHeight = availableHeight
      stageWidth = stageHeight * aspect
    }
    
    stageWidthPx = stageWidth
    stageHeightPx = stageHeight
    
    return {
      ...baseStyle,
      width: `${stageWidth}px`,
      height: `${stageHeight}px`
    }
  })()

  const stageRelativeScale = imageNaturalSize.height > 0 && stageHeightPx > 0
    ? stageHeightPx / imageNaturalSize.height
    : 1
  const buttonBorderWidth = Math.max(1, Math.min(2, 2 * stageRelativeScale))

  return (
    <div className={`instructions-panel ${zoom === 100 ? 'no-scrollbars' : ''} ${editorMode ? 'editor-mode' : ''}`}>
      <div className="instructions-background">
        <div className="instructions-content">
          <div className={`page-container ${zoom === 100 ? 'no-scrollbars' : ''}`}>
            <div className="page-wrapper">
              <div className="page-stage-frame" ref={stageFrameRef}>
                <div 
                  className="page-stage"
                  ref={stageRef}
                  style={stageStyle}
                >
                  <img 
                    ref={imgRef}
                    src={pages[currentPage]} 
                    alt={`Instruction page ${currentPage + 1}`}
                    className="instruction-page"
                    onLoad={handleImageLoad}
                    style={{ 
                      transform: `scale(${zoom / 100})`, 
                      transformOrigin: 'center center',
                      pointerEvents: editorMode ? 'none' : 'auto'
                    }}
                  />
                  {editorMode && (() => {
                    const dot1Coords = perimeterToCoordinates(dot1Position)
                    const dot2Coords = perimeterToCoordinates(dot2Position)
                    
                    return (
                      <>
                        {/* SVG for precise line rendering - using viewBox for percentage coordinates */}
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 23
                          }}
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          {/* Connecting line from dot1 to dot3 */}
                          <line
                            x1={dot1Coords.x}
                            y1={dot1Coords.y}
                            x2={dot3Position.x}
                            y2={dot3Position.y}
                            stroke="#4ecdc4"
                            strokeWidth="0.3"
                          />
                          {/* Connecting line from dot2 to dot3 */}
                          <line
                            x1={dot2Coords.x}
                            y1={dot2Coords.y}
                            x2={dot3Position.x}
                            y2={dot3Position.y}
                            stroke="#4ecdc4"
                            strokeWidth="0.3"
                          />
                        </svg>
                        {/* Resizable box with edge dots */}
                    <div 
                      ref={boxRef}
                      className="resizable-box"
                      style={getBoxStyle()}
                      onMouseDown={handleBoxMouseDown}
                    >
                      <div className="resizable-box-content" />
                      <div className="resize-handle resize-handle-n" data-handle="n" />
                      <div className="resize-handle resize-handle-s" data-handle="s" />
                      <div className="resize-handle resize-handle-e" data-handle="e" />
                      <div className="resize-handle resize-handle-w" data-handle="w" />
                          <div 
                            className="edge-dot"
                            data-dot="dot1"
                            style={getDotStyle(dot1Position)}
                            onMouseDown={handleBoxMouseDown}
                          />
                          <div 
                            className="edge-dot"
                            data-dot="dot2"
                            style={getDotStyle(dot2Position)}
                            onMouseDown={handleBoxMouseDown}
                          />
                    </div>
                        {/* Dot3 - positioned at the end of the connection lines */}
                        <div 
                          className="edge-dot dot3"
                          data-dot="dot3"
                          style={getDot3Style()}
                          onMouseDown={handleBoxMouseDown}
                        />
                      </>
                    )
                  })()}
                  {currentPage === 0 && !editorMode && (() => {
                    const buttonLeft = 44.36
                    const buttonTop = 59.30
                    const buttonWidth = 10.96
                    const buttonHeight = 3.86
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const isDisabled = visitedPages.has(0)
                    const startFontSize = Math.min(24, Math.max(8, 24 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    const adjustedLeft = Math.max(0, buttonLeft - leftOffsetAdjust)
                    const adjustedTop = Math.max(0, buttonTop - topOffsetAdjust)
                    const expandedWidth = Math.min(100 - adjustedLeft, buttonWidth + widthPercentAdjust)
                    const expandedHeight = Math.min(100 - adjustedTop, buttonHeight + heightPercentAdjust)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    const buttonWidthPx = stageWidthPx > 0 ? (expandedWidth / 100) * stageWidthPx : 0
                    const displayWidthPx = buttonWidthPx * (zoom / 100)
                    const isStartButtonSmall = displayWidthPx > 0 && displayWidthPx <= START_BUTTON_SMALL_THRESHOLD
                    const startButtonBorderWidth = isStartButtonSmall ? 2 : 3
                    const expandedButtonStyle = {
                      ...buttonStyle,
                      left: `${adjustedLeft}%`,
                      top: `${adjustedTop}%`,
                      width: `${Math.max(0, expandedWidth)}%`,
                      height: `${Math.max(0, expandedHeight)}%`
                    }
                    
                    return (
                      <button 
                        onClick={handleStart}
                        disabled={isDisabled}
                        className={`page-start-button ${isDisabled ? 'disabled' : ''} ${isDisabled ? 'selected' : ''} ${returningFromPage2 ? 'returning-from-page2' : ''}`}
                        style={{
                          ...expandedButtonStyle,
                          backgroundColor: 'white',
                          color: returningFromPage2 ? '#f05f40' : '#0d6efd',
                          cursor: isDisabled ? 'default' : 'pointer',
                          fontSize: `${startFontSize}px`,
                          fontFamily: 'Roboto, sans-serif',
                          border: returningFromPage2 ? '2px solid #f05f40' : undefined
                        }}
                        aria-label="Start"
                      >
                        Start
                      </button>
                    )
                  })()}
                  {currentPage === 1 && !editorMode && (() => {
                    const buttonLeft = 29.77
                    const buttonTop = 83.75
                    const buttonWidth = 40.45
                    const buttonHeight = 4.22
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    // Once button has been clicked, it should always be disabled when returning to page 2
                    const isDisabled = visitedPages.has(1)
                    // Show orange edge if button has been clicked (regardless of where returning from)
                    const showOrangeEdge = visitedPages.has(1)
                    const readyFontSize = Math.min(18, Math.max(6, 18 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    // Calculate 43px downward offset as percentage of image natural height (fixed, doesn't change with panel resize)
                    const downwardOffset43pxPercent = imageNaturalSize.height > 0 ? (43 / imageNaturalSize.height) * 100 : 0
                    const adjustedLeft = Math.max(0, buttonLeft - leftOffsetAdjust)
                    const adjustedTop = Math.max(0, buttonTop - topOffsetAdjust + downwardOffset43pxPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, buttonWidth + widthPercentAdjust)
                    const expandedHeight = Math.min(100 - adjustedTop, buttonHeight + heightPercentAdjust)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    const buttonWidthPx = stageWidthPx > 0 ? (expandedWidth / 100) * stageWidthPx : 0
                    const displayWidthPx = buttonWidthPx * (zoom / 100)
                    const isReadyButtonSmall = displayWidthPx > 0 && displayWidthPx <= START_BUTTON_SMALL_THRESHOLD
                    const readyButtonBorderWidth = isReadyButtonSmall ? 2 : 3
                    const expandedButtonStyle = {
                      ...buttonStyle,
                      left: `${adjustedLeft}%`,
                      top: `${adjustedTop}%`,
                      width: `${Math.max(0, expandedWidth)}%`,
                      height: `${Math.max(0, expandedHeight)}%`
                    }
                    
                    return (
                      <button 
                        onClick={handlePage1Button}
                        disabled={isDisabled}
                        className={`page-start-button ${isDisabled ? 'disabled' : ''} ${isDisabled ? 'selected' : ''} ${showOrangeEdge ? 'returning-from-page3' : ''}`}
                        style={{
                          ...expandedButtonStyle,
                          backgroundColor: 'white',
                          color: '#000',
                          cursor: isDisabled ? 'default' : 'pointer',
                          fontSize: `${readyFontSize}px`,
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 700,
                          border: showOrangeEdge ? '2px solid #f05f40' : undefined
                        }}
                        aria-label="I'm ready to build a drone controller"
                      >
                        I'm ready to build a drone controller
                      </button>
                    )
                  })()}
                  {/* Speech bubble button on page 3 (3.png) */}
                  {currentPage === 2 && !editorMode && (() => {
                    // Speech bubble dimensions from provided data
                    const bubbleLeft = 9.81
                    const bubbleTop = 30.42
                    const bubbleWidth = 18.42
                    const bubbleHeight = 4.38
                    const dot1X = 13.07
                    const dot1Y = 30.42
                    const dot2X = 17.80
                    const dot2Y = 30.42
                    const dot3X = 19.13
                    const dot3Y = 27.72
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    // If returning after second button was clicked, show as disabled with orange edge
                    const isDisabled = page3ButtonClicked || returningToPage3AfterSecondButton
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Reduce height by 3px (was 5px, now increased by 2px = 3px reduction)
                    const heightReductionPx = 3
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    // Move the box down by 1px
                    const moveDownByPx = 1
                    const moveDownByPercent = stageHeightPx > 0 ? (moveDownByPx / stageHeightPx) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, bubbleLeft - leftOffsetAdjust)
                    const adjustedTop = Math.max(0, bubbleTop - topOffsetAdjust + moveDownByPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, bubbleWidth + widthPercentAdjust)
                    const expandedHeight = Math.min(100 - adjustedTop, bubbleHeight + heightPercentAdjust - heightReductionPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                    // Dot3 is ABOVE the box (27.72% < 30.42%), so triangle points upward
                    const triangleBaseLeft = dot1X  // Left point on top edge
                    const triangleBaseRight = dot2X  // Right point on top edge
                    const triangleBaseY = bubbleTop  // Top edge Y position (30.42%)
                    const triangleTipX = dot3X  // Triangle tip X (19.13%)
                    const triangleTipY = dot3Y  // Triangle tip Y (27.72% - above the box)
                    
                    // Calculate rounded rectangle corner radius (reduced for speech bubbles)
                    const borderRadiusPx = Math.min(8, Math.max(4, 8 * stageRelativeScale))
                    // Convert to wrapper-relative SVG coordinates (0-100)
                    // The wrapper dimensions in pixels
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    // CSS border-radius applies the same pixel value to all corners
                    // Convert to SVG coordinates: use separate X and Y radius values
                    // Horizontal curves (left/right edges) use radius as % of width
                    // Vertical curves (top/bottom edges) use radius as % of height
                    // CSS caps each at 50% of its respective dimension
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    // Convert coordinates from page coordinates to wrapper-relative (0-100)
                    // Wrapper is at adjustedLeft, adjustedTop with size expandedWidth, expandedHeight
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    // Convert triangle points to wrapper-relative coordinates
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
                    // Build path: rounded rectangle with triangle protrusion on top edge (using wrapper-relative coordinates)
                    // Use borderRadiusWrapperX for horizontal curves (left/right), borderRadiusWrapperY for vertical curves (top/bottom)
                    const speechBubblePath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                      L ${topLeft},${topY + borderRadiusWrapperY}
                      Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                      L ${triangleBaseRightWrapper},${topY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                      Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                      L ${topRight},${bottomY - borderRadiusWrapperY}
                      Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                      Z
                    `
                    
                    // Border paths - separate segments to exclude top edge between the two points
                    // Left border: from bottom-left corner up to first point on top edge
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                      L ${topLeft},${topY + borderRadiusWrapperY}
                      Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                    `
                    
                    // Triangle border: two legs only (not the base between the points)
                    // Left leg: from dot1 to tip
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    // Right leg: from dot2 to tip
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    // Right border: from second point on top edge down to bottom-right corner
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                      Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                      L ${topRight},${bottomY - borderRadiusWrapperY}
                      Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    // Bottom border: complete bottom edge
                    const bottomBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      L ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={buttonStyle}
                      >
                        {/* Clickable box area - only the rounded rectangle part, not the triangle */}
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage3Button : undefined}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: isDisabled ? 'none' : 'auto',
                            cursor: isDisabled ? 'default' : 'pointer',
                            zIndex: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        >
                          connect to power
                        </div>
                        {/* SVG for speech bubble shape - single unified shape */}
                        <svg
                          className="speech-bubble-svg"
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 10
                          }}
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <defs>
                          </defs>
                          {/* Main filled shape */}
                          <path
                            d={speechBubblePath}
                            fill="#ffffff"
                            style={{ fill: '#ffffff' }}
                          />
                          {/* Border paths with pulse animation - excluding the top edge between the two points */}
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle left leg */}
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle right leg */}
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={bottomBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
                          {/* Top edge between the two points - no glow, no border */}
                          <path
                            d={`M ${triangleBaseLeftWrapper},${topY} L ${triangleBaseRightWrapper},${topY}`}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="0.3"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    )
                  })()}
                  {/* Second speech bubble button on page 3 (3.png) - appears after connect to power is clicked or when returning after second button */}
                  {currentPage === 2 && !editorMode && (page3ButtonClicked || returningToPage3AfterSecondButton) && (() => {
                    // Speech bubble dimensions from provided data
                    const bubble2Left = 62.30
                    const bubble2Top = 33.73
                    const bubble2Width = 25.18
                    const bubble2Height = 6.64
                    const dot1X = 65.11
                    const dot1Y = 40.38
                    const dot2X = 71.64
                    const dot2Y = 40.38
                    const dot3X = 56.98
                    const dot3Y = 42.69
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    // If returning after second button was clicked, show as disabled with orange edge
                    const isDisabled = page3SecondButtonClicked || returningToPage3AfterSecondButton
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Reduce height by 3px
                    const heightReductionPx = 3
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, bubble2Left - leftOffsetAdjust)
                    const adjustedTop = Math.max(0, bubble2Top - topOffsetAdjust)
                    const expandedWidth = Math.min(100 - adjustedLeft, bubble2Width + widthPercentAdjust)
                    const expandedHeight = Math.min(100 - adjustedTop, bubble2Height + heightPercentAdjust - heightReductionPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                    // Dot3 is BELOW the box (42.69% > 40.38%), so triangle points downward
                    const triangleBaseLeft = dot1X  // Left point on bottom edge
                    const triangleBaseRight = dot2X  // Right point on bottom edge
                    const triangleBaseY = adjustedTop + expandedHeight  // Bottom edge Y position
                    const triangleTipX = dot3X  // Triangle tip X (56.98%)
                    const triangleTipY = dot3Y  // Triangle tip Y (42.69% - below the box)
                    
                    // Calculate rounded rectangle corner radius (reduced for speech bubbles)
                    const borderRadiusPx = Math.min(8, Math.max(4, 8 * stageRelativeScale))
                    // Convert to wrapper-relative SVG coordinates (0-100)
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    // CSS border-radius applies the same pixel value to all corners
                    // Convert to SVG coordinates: use separate X and Y radius values
                    // Horizontal curves (left/right edges) use radius as % of width
                    // Vertical curves (top/bottom edges) use radius as % of height
                    // CSS caps each at 50% of its respective dimension
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    // Convert coordinates from page coordinates to wrapper-relative (0-100)
                    // Wrapper is at adjustedLeft, adjustedTop with size expandedWidth, expandedHeight
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    // Convert triangle points to wrapper-relative coordinates
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
                    // Build path: rounded rectangle with triangle protrusion on bottom edge (using wrapper-relative coordinates)
                    // Use borderRadiusWrapperX for horizontal curves (left/right), borderRadiusWrapperY for vertical curves (top/bottom)
                    const speechBubblePath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                      L ${topLeft},${bottomY - borderRadiusWrapperY}
                      Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                      L ${triangleBaseRightWrapper},${bottomY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                      Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                      L ${topRight},${topY + borderRadiusWrapperY}
                      Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                      Z
                    `
                    
                    // Border paths - separate segments to exclude bottom edge between the two points
                    // Left border: from top-left corner down to first point on bottom edge
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                      L ${topLeft},${bottomY - borderRadiusWrapperY}
                      Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                    `
                    
                    // Triangle border: two legs only (not the base between the points)
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${bottomY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${bottomY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    // Right border: from second point on bottom edge up to top-right corner
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${bottomY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                      Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                      L ${topRight},${topY + borderRadiusWrapperY}
                      Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                    `
                    
                    // Top border: complete top edge
                    const topBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      L ${topRight - borderRadiusWrapperX},${topY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={{ ...buttonStyle, zIndex: 2000 }}
                      >
                        {/* Clickable box area - only the rounded rectangle part, not the triangle */}
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage3SecondButton : undefined}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: isDisabled ? 'none' : 'auto',
                            cursor: isDisabled ? 'default' : 'pointer',
                            zIndex: 2001,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 700,
                            textAlign: 'center',
                            lineHeight: '1.3',
                            padding: '2px 4px',
                            boxSizing: 'border-box',
                            flexDirection: 'column'
                          }}
                        >
                          <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                            Check that you have all the<br />parts we will use today
                          </div>
                        </div>
                        {/* SVG for speech bubble shape - single unified shape */}
                        <svg
                          className="speech-bubble-svg"
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 2000
                          }}
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <defs>
                          </defs>
                          {/* Main filled shape */}
                          <path
                            d={speechBubblePath}
                            fill="#ffffff"
                            style={{ fill: '#ffffff' }}
                          />
                          {/* Border paths with pulse animation - excluding the bottom edge between the two points */}
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle left leg */}
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle right leg */}
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={topBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
                          {/* Bottom edge between the two points - no border */}
                          <path
                            d={`M ${triangleBaseLeftWrapper},${bottomY} L ${triangleBaseRightWrapper},${bottomY}`}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="0.3"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    )
                  })()}
                  {/* White boxes on page 3 (3.png) - hide when first box is selected or when returning after second button */}
                  {currentPage === 2 && !editorMode && !page3ButtonClicked && !returningToPage3AfterSecondButton && (() => {
                    // Box 1: Left: 6.88%, Top: 41.74%, Width: 86.24%, Height: 54.35%
                    const page3Box1Style = getButtonStyle(6.88, 41.74, 86.24, 54.35)
                    const page3Box1ExpandedStyle = {
                      ...page3Box1Style,
                      left: '6.88%',
                      top: '41.74%',
                      width: '86.24%',
                      height: '54.35%',
                      backgroundColor: 'white',
                      pointerEvents: 'none',
                      zIndex: 1000
                    }

                    // Box 2: Left: 57.80%, Top: 33.38%, Width: 30.81%, Height: 9.60%
                    const page3Box2Style = getButtonStyle(57.80, 33.38, 30.81, 9.60)
                    const page3Box2ExpandedStyle = {
                      ...page3Box2Style,
                      left: '57.80%',
                      top: '33.38%',
                      width: '30.81%',
                      height: '9.60%',
                      backgroundColor: 'white',
                      pointerEvents: 'none',
                      zIndex: 1000
                    }

                    return (
                      <>
                        <div style={page3Box1ExpandedStyle} />
                        <div style={page3Box2ExpandedStyle} />
                      </>
                    )
                  })()}
                  {/* White box with rounded corners on page 3 (3.png) - hide when second button is selected or when returning */}
                  {currentPage === 2 && !editorMode && !page3SecondButtonClicked && !returningToPage3AfterSecondButton && (() => {
                    // Box: Left: 12.51%, Top: 43.83%, Width: 75.20%, Height: 46.69%
                    const page3Box3Style = getButtonStyle(12.51, 43.83, 75.20, 46.69)
                    // Calculate border radius - increased for more rounded corners
                    const borderRadiusPx = Math.min(20, Math.max(12, 20 * stageRelativeScale))
                    const page3Box3ExpandedStyle = {
                      ...page3Box3Style,
                      left: '12.51%',
                      top: '43.83%',
                      width: '75.20%',
                      height: '46.69%',
                      backgroundColor: 'white',
                      borderRadius: `${borderRadiusPx}px`,
                      pointerEvents: 'none',
                      zIndex: 1000
                    }

                    return (
                      <div style={page3Box3ExpandedStyle} />
                    )
                  })()}
                  {/* Small green boxes on page 3 (3.png) - always displayed when white box is hidden, even when returning */}
                  {currentPage === 2 && !editorMode && page3SecondButtonClicked && (() => {
                    // Fixed pixel size for all boxes - 10px × 10px squares
                    const boxSizePx = 10
                    // Convert box size to percentages
                    const boxSizeWidthPercent = stageWidthPx > 0 ? (boxSizePx / stageWidthPx) * 100 : 0
                    const boxSizeHeightPercent = stageHeightPx > 0 ? (boxSizePx / stageHeightPx) * 100 : 0
                    // Calculate border radius for rounded corners
                    const borderRadiusPx = 2
                    // Standardized row positions (percentages) - moved up and left
                    const row1Top = 55.84
                    const row2Top = 72.62
                    const row3Top = 87.99
                    
                    // Row 1 boxes (aligned at 55.84%) - moved left by 5px more
                    const greenBoxes = [
                      { left: 19.46, top: row1Top },
                      { left: 40.63, top: row1Top },
                      { left: 62.25, top: row1Top },
                      { left: 78.96, top: row1Top },
                      // Row 2 boxes (aligned at 72.62%) - moved left
                      { left: 19.55, top: row2Top },
                      { left: 40.45, top: row2Top },
                      { left: 61.79, top: row2Top },
                      { left: 79.05, top: row2Top },
                      // Row 3 boxes (aligned at 87.99%) - moved left
                      { left: 40.08, top: row3Top },
                      { left: 61.52, top: row3Top }
                    ]

                    return (
                      <>
                        {greenBoxes.map((box, index) => {
                          const isSelected = selectedGreenBoxes.has(index)
                          // Calculate position adjustments in percentages
                          // Move right 5px and down 5px for all boxes (reduced for previous location)
                          // Row 2 boxes (indices 4-7) get additional offset: down 1px
                          // First row far right box (index 3) and second row far right box (index 7) get additional offset: left 1px
                          // Third row far left box (index 8) gets additional offset: right 1px
                          const isRow1 = index >= 0 && index <= 3
                          const isRow2 = index >= 4 && index <= 7
                          const isRow3 = index >= 8 && index <= 9
                          const isRow1FarRight = index === 3
                          const isRow2FarRight = index === 7
                          const isRow3FarLeft = index === 8
                          const isTopLeft = index === 0
                          // Row 1 boxes: moved left 5px, then adjusted right 2px and down 1px (net: left 3px, up 4px)
                          // Row 2 boxes: moved left 3px and up 2px
                          // Row 3 boxes: moved left 3px and up 3px
                          // Top left box (index 0): move right 1px
                          const baseLeftOffsetPx = (isRow1FarRight || isRow2FarRight) ? 4 : (isRow3FarLeft ? 6 : 5)
                          const row1LeftOffset = isTopLeft ? (baseLeftOffsetPx - 2) : (baseLeftOffsetPx - 3) // Top left: -2px (move right 1px from -3), others: -3px
                          const leftOffsetPx = isRow1 ? row1LeftOffset : (isRow2 ? (baseLeftOffsetPx - 3) : (isRow3 ? (baseLeftOffsetPx - 3) : baseLeftOffsetPx)) // Row 1: -2px for top left, -3px for others; Row 2: -3px; Row 3: -3px
                          const baseTopOffsetPx = isRow2 ? 4 : 3
                          const topOffsetPx = isRow1 ? (baseTopOffsetPx - 4) : (isRow2 ? (baseTopOffsetPx - 2) : (isRow3 ? (baseTopOffsetPx - 3) : baseTopOffsetPx)) // Row 1: -4px, Row 2: -2px, Row 3: -3px (3-3=0)
                          
                          // Convert pixel offsets to percentages
                          const leftOffsetPercent = stageWidthPx > 0 ? (leftOffsetPx / stageWidthPx) * 100 : 0
                          const topOffsetPercent = stageHeightPx > 0 ? (topOffsetPx / stageHeightPx) * 100 : 0
                          
                          // Calculate adjusted position (center of box) in percentages
                          const adjustedLeft = box.left + leftOffsetPercent
                          const adjustedTop = box.top + topOffsetPercent
                          
                          // Get the base style with proper scaling from wrapper center
                          const baseStyle = getButtonStyle(adjustedLeft, adjustedTop, boxSizeWidthPercent, boxSizeHeightPercent)
                          
                          const greenBoxStyle = {
                            ...baseStyle,
                            backgroundColor: isSelected ? '#3bbf6b' : 'white',
                            border: `0.5px solid #3bbf6b`,
                            borderRadius: `${borderRadiusPx}px`,
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                            zIndex: 3000, // Very high z-index to ensure clickability above everything
                            boxSizing: 'border-box',
                            userSelect: 'none'
                          }
                          return (
                            <div 
                              key={`green-box-${index}`} 
                              style={greenBoxStyle}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleGreenBoxClick(index)
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation()
                              }}
                            />
                          )
                        })}
                      </>
                    )
                  })()}
                  {/* White boxes on page 2 (2.png) - hide once button has been clicked */}
                  {currentPage === 1 && !editorMode && visitedPages.has(0) && !visitedPages.has(1) && (() => {
                    // Box 1: Left: 9.81%, Top: 42.09%, Width: 79.25%, Height: 31.36%
                    const box1Style = getButtonStyle(9.81, 42.09, 79.25, 31.36)
                    const box1ExpandedStyle = {
                      ...box1Style,
                      left: '9.81%',
                      top: '42.09%',
                      width: '79.25%',
                      height: '31.36%',
                      backgroundColor: 'white',
                      opacity: box1Fading ? 0 : 1,
                      transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'none',
                      zIndex: 5
                    }

                    // Box 2: Left: 13.89%, Top: 72.32%, Width: 74.76%, Height: 11.43%
                    const box2Style = getButtonStyle(13.89, 72.32, 74.76, 11.43)
                    const box2ExpandedStyle = {
                      ...box2Style,
                      left: '13.89%',
                      top: '72.32%',
                      width: '74.76%',
                      height: '11.43%',
                      backgroundColor: 'white',
                      opacity: box2Fading ? 0 : 1,
                      transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'none',
                      zIndex: 5
                    }

                    // Box 3: Left: 13.43%, Top: 84.81%, Width: 74.76%, Height: 11.43%
                    const box3Style = getButtonStyle(13.43, 84.81, 74.76, 11.43)
                    const box3ExpandedStyle = {
                      ...box3Style,
                      left: '13.43%',
                      top: '84.81%',
                      width: '74.76%',
                      height: '11.43%',
                      backgroundColor: 'white',
                      opacity: box3Fading ? 0 : 1,
                      transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'none',
                      zIndex: 1000
                    }

                    return (
                      <>
                        <div style={box1ExpandedStyle} />
                        <div style={box2ExpandedStyle} />
                        <div style={box3ExpandedStyle} />
                      </>
                    )
                  })()}
                  {/* Speech bubble button on page 4 (4.png) */}
                  {currentPage === 3 && !editorMode && (() => {
                    // Speech bubble dimensions from provided data
                    const bubbleLeft = 25.99
                    const bubbleTop = 22.05
                    const bubbleWidth = 24.87
                    const bubbleHeight = 4.21
                    const dot1X = 41.58
                    const dot1Y = 22.05
                    const dot2X = 48.03
                    const dot2Y = 22.05
                    const dot3X = 52.04
                    const dot3Y = 20.15
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const isDisabled = page4SpeechBubbleClicked
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Extend height down by 2px (reduce height reduction from 3px to 1px)
                    const heightReductionPx = 1
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, bubbleLeft - leftOffsetAdjust)
                    const adjustedTop = Math.max(0, bubbleTop - topOffsetAdjust)
                    const expandedWidth = Math.min(100 - adjustedLeft, bubbleWidth + widthPercentAdjust)
                    const expandedHeight = Math.min(100 - adjustedTop, bubbleHeight + heightPercentAdjust - heightReductionPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                    // Dot3 is ABOVE the box (20.15% < 22.05%), so triangle points upward
                    const triangleBaseLeft = dot1X  // Left point on top edge
                    const triangleBaseRight = dot2X  // Right point on top edge
                    const triangleBaseY = bubbleTop  // Top edge Y position (22.05%)
                    const triangleTipX = dot3X  // Triangle tip X (52.04%)
                    const triangleTipY = dot3Y  // Triangle tip Y (20.15% - above the box)
                    
                    // Calculate rounded rectangle corner radius (reduced for speech bubbles)
                    const borderRadiusPx = Math.min(8, Math.max(4, 8 * stageRelativeScale))
                    // Convert to wrapper-relative SVG coordinates (0-100)
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    // CSS border-radius applies the same pixel value to all corners
                    // Convert to SVG coordinates: use separate X and Y radius values
                    // Horizontal curves (left/right edges) use radius as % of width
                    // Vertical curves (top/bottom edges) use radius as % of height
                    // CSS caps each at 50% of its respective dimension
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    // Convert coordinates from page coordinates to wrapper-relative (0-100)
                    // Wrapper is at adjustedLeft, adjustedTop with size expandedWidth, expandedHeight
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    // Convert triangle points to wrapper-relative coordinates
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
                    // Build path: rounded rectangle with triangle protrusion on top edge (using wrapper-relative coordinates)
                    // Use borderRadiusWrapperX for horizontal curves (left/right), borderRadiusWrapperY for vertical curves (top/bottom)
                    const speechBubblePath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                      L ${topLeft},${topY + borderRadiusWrapperY}
                      Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                      L ${triangleBaseRightWrapper},${topY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                      Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                      L ${topRight},${bottomY - borderRadiusWrapperY}
                      Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                      Z
                    `
                    
                    // Border paths - separate segments to exclude top edge between the two points
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                      L ${topLeft},${topY + borderRadiusWrapperY}
                      Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                    `
                    
                    // Triangle border: two legs only (not the base between the points)
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    // Right border: from second point on top edge down to bottom-right corner
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                      Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                      L ${topRight},${bottomY - borderRadiusWrapperY}
                      Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    // Bottom border: complete bottom edge
                    const bottomBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      L ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={buttonStyle}
                      >
                        {/* Clickable box area - only the rounded rectangle part, not the triangle */}
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage4SpeechBubble : undefined}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: isDisabled ? 'none' : 'auto',
                            cursor: isDisabled ? 'default' : 'pointer',
                            zIndex: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        >
                        </div>
                        {/* SVG for speech bubble shape - single unified shape */}
                        <svg
                          className="speech-bubble-svg"
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 10
                          }}
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <defs>
                          </defs>
                          {/* Main filled shape */}
                          <path
                            d={speechBubblePath}
                            fill="#ffffff"
                            style={{ fill: '#ffffff' }}
                          />
                          {/* Border paths with pulse animation - excluding the top edge between the two points */}
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle left leg */}
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle right leg */}
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={bottomBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#f05f40ff" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
                          {/* Top edge between the two points - no glow, no border */}
                          <path
                            d={`M ${triangleBaseLeftWrapper},${topY} L ${triangleBaseRightWrapper},${topY}`}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="0.3"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    )
                  })()}
                  {/* Safety glasses image on page 4 (4.png) */}
                  {currentPage === 3 && !editorMode && (() => {
                    // Move 5px left and 8px up (moved up 5px more from -3)
                    const leftOffsetPx = -5
                    const topOffsetPx = -8
                    const leftOffsetPercent = stageWidthPx > 0 ? (leftOffsetPx / stageWidthPx) * 100 : 0
                    const topOffsetPercent = stageHeightPx > 0 ? (topOffsetPx / stageHeightPx) * 100 : 0
                    const adjustedLeft = 13.07 + leftOffsetPercent
                    const adjustedTop = 14.91 + topOffsetPercent
                    
                    // Increase width by 5px proportionally
                    const widthIncreasePx = 5
                    const widthIncreasePercent = stageWidthPx > 0 ? (widthIncreasePx / stageWidthPx) * 100 : 0
                    const adjustedWidth = 75 + widthIncreasePercent
                    
                    // Calculate height percentage for transform origin (but use 'auto' for actual height)
                    const handleSafetyGlassesLoad = (e) => {
                      if (e.target) {
                        const { naturalWidth, naturalHeight } = e.target
                        if (naturalWidth && naturalHeight) {
                          setSafetyGlassesSize({ width: naturalWidth, height: naturalHeight })
                        }
                      }
                    }
                    
                    // Calculate height percentage based on aspect ratio for transform origin
                    // Use a default aspect ratio if image hasn't loaded yet
                    const imageAspectRatio = safetyGlassesSize.width > 0 && safetyGlassesSize.height > 0 
                      ? safetyGlassesSize.width / safetyGlassesSize.height 
                      : 1 // Default to square if not loaded
                    const adjustedHeight = adjustedWidth / imageAspectRatio
                    
                    // Use getButtonStyle for correct scaling from wrapper center
                    const imageBaseStyle = getButtonStyle(adjustedLeft, adjustedTop, adjustedWidth, adjustedHeight)
                    
                    return (
                      <img
                        src={safetyGlasses}
                        alt="Safety glasses"
                        onLoad={handleSafetyGlassesLoad}
                        style={{
                          ...imageBaseStyle,
                          // Don't override height - use the calculated percentage for proper transform origin
                          zIndex: 10,
                          pointerEvents: 'none',
                          objectFit: 'contain' // Maintain aspect ratio within the bounds
                        }}
                      />
                    )
                  })()}
                  {/* Buttons on page 4 (4.png) - rounded corner boxes without pointers */}
                  {currentPage === 3 && !editorMode && (() => {
                    // Button 1: Left: 13.19%, Top: 30.08%, Width: 73.40%, Height: 14.48%
                    const button1Left = 13.19
                    const button1Top = 30.08
                    const button1Width = 73.40
                    const button1Height = 14.48
                    
                    // Button 2: Left: 13.87%, Top: 55.49%, Width: 20.45%, Height: 14.48%
                    const button2Left = 13.87
                    const button2Top = 55.49
                    const button2Width = 20.45
                    const button2Height = 14.48
                    
                    // Button 3: Left: 39.55%, Top: 55.32%, Width: 20.45%, Height: 14.48%
                    const button3Left = 39.55
                    const button3Top = 55.32
                    const button3Width = 20.45
                    const button3Height = 14.48
                    
                    // Button 4: Left: 65.68%, Top: 55.49%, Width: 20.45%, Height: 14.48%
                    const button4Left = 65.68
                    const button4Top = 55.49
                    const button4Width = 20.45
                    const button4Height = 14.48
                    
                    // Button 5: Left: 25.81%, Top: 73.77%, Width: 48.39%, Height: 20.40%
                    const button5Left = 25.81
                    const button5Top = 73.77
                    const button5Width = 48.39
                    const button5Height = 20.40
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const buttonFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Calculate border radius for rounded corners
                    const borderRadiusPx = Math.min(32, Math.max(16, 32 * stageRelativeScale))
                    
                    const createButton = (left, top, width, height, isDisabled, onClick, buttonIndex) => {
                      // Add 25px extra width for button 1
                      const extraWidthPx = buttonIndex === 1 ? 25 : 0
                      const extraWidthPercent = stageWidthPx > 0 ? (extraWidthPx / stageWidthPx) * 100 : 0
                      const totalWidth = width + widthPercentAdjust + extraWidthPercent
                      
                      // Center button 1 on the image
                      let adjustedLeft
                      if (buttonIndex === 1) {
                        // Center the button: left = 50% - (width / 2)
                        adjustedLeft = Math.max(0, 50 - (totalWidth / 2))
                      } else {
                        adjustedLeft = Math.max(0, left - leftOffsetAdjust)
                      }
                      
                      const adjustedTop = Math.max(0, top - topOffsetAdjust)
                      const expandedWidth = Math.min(100 - adjustedLeft, totalWidth)
                      // Reduce height by 2px for button 2 (far left small box)
                      const heightReductionPx = buttonIndex === 2 ? 2 : 0
                      const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                      const expandedHeight = Math.min(100 - adjustedTop, height + heightPercentAdjust - heightReductionPercent)
                      const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                      
                      const isButton1 = buttonIndex === 1
                      const isSmallButton = buttonIndex === 2 || buttonIndex === 3 || buttonIndex === 4
                      
                      const expandedButtonStyle = {
                        ...buttonStyle,
                        left: `${adjustedLeft}%`,
                        top: `${adjustedTop}%`,
                        width: `${Math.max(0, expandedWidth)}%`,
                        height: `${Math.max(0, expandedHeight)}%`,
                        backgroundColor: isSmallButton ? 'transparent' : 'white',
                        color: '#000',
                        cursor: isDisabled ? 'default' : 'pointer',
                        fontSize: `${buttonFontSize}px`,
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 700,
                        borderRadius: `${borderRadiusPx}px`,
                        border: isDisabled ? '2px solid #f05f40' : '2px solid #0d6efd',
                        display: 'flex',
                        flexDirection: isButton1 ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        zIndex: 11,
                        padding: isButton1 ? '8px' : '0',
                        boxSizing: 'border-box',
                        lineHeight: '1.4'
                      }
                      
                      return (
                        <button
                          key={`page4-button-${buttonIndex}`}
                          onClick={onClick}
                          disabled={isDisabled}
                          className={`page4-button ${isDisabled ? 'disabled selected' : ''}`}
                          style={expandedButtonStyle}
                        >
                          {isButton1 && (
                            <>
                              <div style={{ marginBottom: '4px' }}>
                                I am wearing safety glasses and will keep them on for the entire Robotics Workshop
                              </div>
                              <div style={{ marginBottom: '4px' }}></div>
                              <div style={{ marginBottom: '2px', fontWeight: 'normal' }}>
                                Team member 1:  X
                              </div>
                              <div style={{ marginBottom: '2px', fontWeight: 'normal' }}>
                                Team member 2:  X
                              </div>
                              <div style={{ fontWeight: 'normal' }}>
                                Team member 3:  X
                              </div>
                            </>
                          )}
                        </button>
                      )
                    }
                    
                    return (
                      <>
                        {createButton(button1Left, button1Top, button1Width, button1Height, page4Button1Clicked, handlePage4Button1, 1)}
                        {createButton(button2Left, button2Top, button2Width, button2Height, page4Button2Clicked, handlePage4Button2, 2)}
                        {createButton(button3Left, button3Top, button3Width, button3Height, page4Button3Clicked, handlePage4Button3, 3)}
                        {createButton(button4Left, button4Top, button4Width, button4Height, page4Button4Clicked, handlePage4Button4, 4)}
                        {createButton(button5Left, button5Top, button5Width, button5Height, page4Button5Clicked, handlePage4Button5, 5)}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="page-navigation">
        <div className="nav-button-left">
          {currentPage >= 1 && (
            <button 
              onClick={handlePrevious}
              className="btn-modern btn-nav"
              aria-label="Previous page"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Previous
            </button>
          )}
        </div>
        <div className="zoom-controls">
          <button 
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="btn-modern btn-zoom"
            aria-label="Zoom out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8"/>
            </svg>
          </button>
          <div className="reset-button-container">
            {zoom !== 100 ? (
              <button 
                onClick={handleReset}
                className="btn-modern btn-zoom btn-reset"
                aria-label="Reset zoom"
              >
                Reset
              </button>
            ) : (
              <span className="zoom-text">zoom</span>
            )}
          </div>
          <button 
            onClick={handleZoomIn}
            disabled={zoom >= 300}
            className="btn-modern btn-zoom"
            aria-label="Zoom in"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </button>
        </div>
        <div className="nav-button-right">
          <button 
            onClick={handleNext}
            disabled={
              currentPage === pages.length - 1 || 
              (currentPage === 0 && !visitedPages.has(0)) ||
              (currentPage === 1 && !visitedPages.has(1)) ||
              (currentPage === 2 && (!page3ButtonClicked || !page3SecondButtonClicked))
            }
            className={`btn-modern btn-nav ${currentPage === 2 && page3SecondButtonClicked && !returningToPage3AfterSecondButton ? 'btn-nav-blue' : ''}`}
            aria-label="Next page"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstructionsPanel

