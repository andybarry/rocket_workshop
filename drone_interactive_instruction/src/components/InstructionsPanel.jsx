import { useState, useRef, useEffect, useCallback } from 'react'
import './InstructionsPanel.css'
import page1 from '../assets/images/pages/1.png'
import page2 from '../assets/images/pages/2.png'
import page3 from '../assets/images/pages/3.png'
import page4 from '../assets/images/pages/4.png'
import page5 from '../assets/images/pages/5.png'
import page6 from '../assets/images/pages/6.png'
import page7 from '../assets/images/pages/7.png'
import page7_1 from '../assets/images/pages/7.1.png'
import page8 from '../assets/images/pages/8.png'
import page9 from '../assets/images/pages/9.png'
import page10 from '../assets/images/pages/10.png'
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
  // Track page 4 checkbox states (team member checkboxes in large button)
  const [page4Checkbox1, setPage4Checkbox1] = useState(false)
  const [page4Checkbox2, setPage4Checkbox2] = useState(false)
  const [page4Checkbox3, setPage4Checkbox3] = useState(false)
  // Track page 5 button states
  const [page5Button1Clicked, setPage5Button1Clicked] = useState(false)
  const [page5Button2Clicked, setPage5Button2Clicked] = useState(false)
  // Track page 5 blue edge dot selection
  const [page5BlueDotSelected, setPage5BlueDotSelected] = useState(false)
  // Track page 5 green dot connection selection
  const [page5GreenDotSelected, setPage5GreenDotSelected] = useState(false)
  // Track page 6 button states
  const [page6Button1Clicked, setPage6Button1Clicked] = useState(false)
  const [page6Button2Clicked, setPage6Button2Clicked] = useState(false)
  // Track page 6 green checkbox selection
  const [page6GreenCheckboxSelected, setPage6GreenCheckboxSelected] = useState(false)
  // Track page 7 box states
  const [page7Box1Selected, setPage7Box1Selected] = useState(false)
  const [page7Box2Selected, setPage7Box2Selected] = useState(false)
  const [page7Box3Selected, setPage7Box3Selected] = useState(false)
  const [page7Box4Selected, setPage7Box4Selected] = useState(false)
  const [page7Box4Hovered, setPage7Box4Hovered] = useState(false)
  // Track if page 7 has been visited (to hide white box on subsequent visits)
  const [page7Visited, setPage7Visited] = useState(false)
  // Track if box 4 has ever been selected (to enable Next button on 7.png after visiting 7.1.png)
  const [page7Box4EverSelected, setPage7Box4EverSelected] = useState(false)
  // Track page 8 box states
  const [page8Box1Selected, setPage8Box1Selected] = useState(false)
  const [page8Box2Selected, setPage8Box2Selected] = useState(false)
  const [page8Box3Selected, setPage8Box3Selected] = useState(false)
  const [page8Box4Selected, setPage8Box4Selected] = useState(false)
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
  // Track white box fade states for page 4
  const [page4Box1Fading, setPage4Box1Fading] = useState(false)
  const [page4Box2Fading, setPage4Box2Fading] = useState(false)
  const [page4Box3Fading, setPage4Box3Fading] = useState(false)
  // Track if page 4 has been visited for the first time
  const [page4FirstVisit, setPage4FirstVisit] = useState(false)
  // Track if safety glasses should animate (pop effect)
  const [safetyGlassesPop, setSafetyGlassesPop] = useState(false)
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
  const pages = [page1, page2, page3, page4, page5, page6, page7, page8, page9, page10]

  const handlePrevious = () => {
    if (currentPage > 0) {
      const previousPage = currentPage - 1
      // Mark page 7 as visited when navigating back to it from page 8
      if (currentPage === 7) {
        setPage7Visited(true)
      }
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
    // For page 5 (index 4), require green active button to be selected
    if (currentPage === 4 && !page5GreenDotSelected) {
      return
    }
    // For page 6 (index 5), require both buttons to be clicked
    if (currentPage === 5 && (!page6Button1Clicked || !page6Button2Clicked)) {
      return
    }
    // For page 7 (index 6), require box 4 to have been selected at least once (visited 7.1.png)
    if (currentPage === 6 && !page7Box4EverSelected) {
      return
    }
    if (currentPage < pages.length - 1) {
      // Mark page 7 as visited when navigating to it from page 6
      if (currentPage === 5) {
        setPage7Visited(true)
      }
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

  // Handler for page 5 buttons
  const handlePage5Button1 = () => {
    setPage5Button1Clicked(true)
  }

  const handlePage5Button2 = () => {
    setPage5Button2Clicked(true)
  }

  // Handler for page 5 blue edge dot
  const handlePage5BlueDot = () => {
    setPage5BlueDotSelected(true)
  }

  const handlePage5GreenDot = () => {
    setPage5GreenDotSelected(true)
  }

  // Handler for page 6 buttons
  const handlePage6Button1 = () => {
    setPage6Button1Clicked(true)
  }

  const handlePage6Button2 = () => {
    setPage6Button2Clicked(true)
  }

  // Handler for page 6 green checkbox
  const handlePage6GreenCheckbox = () => {
    setPage6GreenCheckboxSelected(prev => !prev)
  }

  // Handler for page 7 boxes
  const handlePage7Box1 = () => {
    setPage7Box1Selected(prev => !prev)
  }

  const handlePage7Box2 = () => {
    setPage7Box2Selected(prev => !prev)
  }

  const handlePage7Box3 = () => {
    setPage7Box3Selected(prev => !prev)
  }

  const handlePage7Box4 = () => {
    setPage7Box4Selected(prev => {
      const newValue = !prev
      // Track if box 4 has ever been selected
      if (newValue) {
        setPage7Box4EverSelected(true)
      }
      return newValue
    })
  }

  // Handler for page 8 button box
  const handlePage8Box1 = () => {
    setPage8Box1Selected(true)
  }

  const handlePage8Box2 = () => {
    setPage8Box2Selected(prev => !prev)
  }

  const handlePage8Box3 = () => {
    setPage8Box3Selected(prev => !prev)
  }

  const handlePage8Box4 = () => {
    setPage8Box4Selected(prev => !prev)
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

  // Trigger white boxes fade on page 4 when buttons are clicked
  useEffect(() => {
    if (currentPage === 3 && !editorMode) {
      // Check if all items have been selected (for returning to page 4)
      const checkedCount = (page4Checkbox1 ? 1 : 0) + (page4Checkbox2 ? 1 : 0) + (page4Checkbox3 ? 1 : 0)
      const allItemsSelected = page4SpeechBubbleClicked && 
                               checkedCount >= 2 && 
                               page4Button2Clicked && 
                               page4Button3Clicked && 
                               page4Button4Clicked && 
                               page4Button5Clicked
      
      // If all items are selected, immediately hide all boxes (no fade animation)
      if (allItemsSelected) {
        setPage4Box1Fading(true)
        setPage4Box2Fading(true)
        setPage4Box3Fading(true)
      } else {
        // Box 1: fade when speech bubble is clicked
        if (page4SpeechBubbleClicked) {
          setPage4Box1Fading(true)
        }
        
        // Box 2: fade when at least two checkboxes are selected
        if (checkedCount >= 2) {
          setPage4Box2Fading(true)
        }
        
        // Box 3: fade when all three small buttons (2, 3, 4) are clicked
        if (page4Button2Clicked && page4Button3Clicked && page4Button4Clicked) {
          setPage4Box3Fading(true)
        }
      }
    } else {
      // Reset fade states when leaving page 4 (only if not all items are selected)
      // If all items are selected, keep fade states so boxes remain hidden when returning
      const checkedCount = (page4Checkbox1 ? 1 : 0) + (page4Checkbox2 ? 1 : 0) + (page4Checkbox3 ? 1 : 0)
      const allItemsSelected = page4SpeechBubbleClicked && 
                               checkedCount >= 2 && 
                               page4Button2Clicked && 
                               page4Button3Clicked && 
                               page4Button4Clicked && 
                               page4Button5Clicked
      
      if (!allItemsSelected) {
        setPage4Box1Fading(false)
        setPage4Box2Fading(false)
        setPage4Box3Fading(false)
      }
      // Don't reset checkbox states - they should persist across page navigation
    }
  }, [currentPage, editorMode, page4SpeechBubbleClicked, page4Button1Clicked, page4Button2Clicked, page4Button3Clicked, page4Button4Clicked, page4Button5Clicked, page4Checkbox1, page4Checkbox2, page4Checkbox3])

  // Trigger safety glasses pop animation when landing on page 4 for the first time
  useEffect(() => {
    if (currentPage === 3 && !editorMode && !page4FirstVisit) {
      // Mark page 4 as visited
      setPage4FirstVisit(true)
      // Trigger the pop animation
      setSafetyGlassesPop(true)
      // Reset the animation state after animation completes (1000ms)
      const timer = setTimeout(() => {
        setSafetyGlassesPop(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentPage, editorMode, page4FirstVisit])

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
  
  // Calculate padding for wrapper when zoomed to create scrollable space
  const wrapperPadding = (() => {
    if (zoom === 100 || !stageHeightPx || !stageWidthPx) {
      return {}
    }
    const scale = zoom / 100
    // When image scales from center, it extends (scale - 1) / 2 on each side
    const paddingMultiplier = (scale - 1) / 2
    const paddingTop = stageHeightPx * paddingMultiplier
    const paddingBottom = stageHeightPx * paddingMultiplier
    const paddingLeft = stageWidthPx * paddingMultiplier
    const paddingRight = stageWidthPx * paddingMultiplier
    
    return {
      paddingTop: `${paddingTop}px`,
      paddingBottom: `${paddingBottom}px`,
      paddingLeft: `${paddingLeft}px`,
      paddingRight: `${paddingRight}px`
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
            <div className="page-wrapper" style={wrapperPadding}>
              <div className="page-stage-frame" ref={stageFrameRef}>
                <div 
                  className="page-stage"
                  ref={stageRef}
                  style={stageStyle}
                >
                  <img 
                    ref={imgRef}
                    src={currentPage === 6 && page7Box4Selected ? page7_1 : pages[currentPage]} 
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
                  {/* Number "2" at Dot 3 position on page 2 */}
                  {currentPage === 1 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      2
                    </span>
                  )}
                  {/* Number "3" at Dot 3 position on page 3 */}
                  {currentPage === 2 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      3
                    </span>
                  )}
                  {/* Number "4" at Dot 3 position on page 4 */}
                  {currentPage === 3 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      4
                    </span>
                  )}
                  {/* Number "5" at Dot 3 position on page 5 */}
                  {currentPage === 4 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      5
                    </span>
                  )}
                  {/* Number "6" at Dot 3 position on page 6 */}
                  {currentPage === 5 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      6
                    </span>
                  )}
                  {/* Number "7" at Dot 3 position on page 7 */}
                  {currentPage === 6 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      7
                    </span>
                  )}
                  {/* Number "8" at Dot 3 position on page 8 */}
                  {currentPage === 7 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      8
                    </span>
                  )}
                  {/* White box on page 8 - displayed until button box is selected */}
                  {currentPage === 7 && !editorMode && !page8Box1Selected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '3.95%',
                        top: '39.83%',
                        width: '89.84%',
                        height: '50.17%',
                        backgroundColor: 'white',
                        border: 'none',
                        pointerEvents: 'none',
                        zIndex: 9
                      }}
                    />
                  )}
                  {/* Button box on page 8 */}
                  {currentPage === 7 && !editorMode && (
                    <>
                      {(() => {
                      const boxLeft = 22.42
                      const boxTop = 24.14
                      const boxWidth = 19.14
                      const boxHeight = 11.22
                      const dot1X = 41.56
                      const dot1Y = 30.94
                      const dot2X = 41.56
                      const dot2Y = 33.35
                      const dot3X = 49.33
                      const dot3Y = 32.77
                      const isSelected = page8Box1Selected
                      
                      const pixelIncrease = 3
                      const halfPixelIncrease = pixelIncrease / 2
                      const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                      const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                      const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                      const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                      const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                      
                      const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust)
                      const adjustedTop = Math.max(0, boxTop - topOffsetAdjust)
                      const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust)
                      const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust)
                      const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                      
                      // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                      const triangleBaseLeft = dot1X
                      const triangleBaseRight = dot2X
                      const triangleBaseY = adjustedTop + expandedHeight
                      const triangleTipX = dot3X
                      const triangleTipY = dot3Y
                      
                      const borderRadiusPx = Math.min(15, Math.max(6, 15 * stageRelativeScale))
                      const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                      const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                      const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                      const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                      
                      const topLeft = 0
                      const topRight = 100
                      const topY = 0
                      const bottomY = 100
                      
                      const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                      const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                      const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                      const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                      
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
                      
                      const leftBorderPath = `
                        M ${topLeft + borderRadiusWrapperX},${topY}
                        Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                        L ${topLeft},${bottomY - borderRadiusWrapperY}
                        Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                        ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                      `
                      
                      const triangleLeftLegPath = `
                        M ${triangleBaseLeftWrapper},${bottomY}
                        L ${triangleTipXWrapper},${triangleTipYWrapper}
                      `
                      const triangleRightLegPath = `
                        M ${triangleBaseRightWrapper},${bottomY}
                        L ${triangleTipXWrapper},${triangleTipYWrapper}
                      `
                      
                      const rightBorderPath = `
                        M ${triangleBaseRightWrapper},${bottomY}
                        ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                        Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                        L ${topRight},${topY + borderRadiusWrapperY}
                        Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                      `
                      
                      const topBorderPath = `
                        M ${topLeft + borderRadiusWrapperX},${topY}
                        L ${topRight - borderRadiusWrapperX},${topY}
                      `
                      
                      return (
                        <div 
                          className={`speech-bubble-wrapper ${isSelected ? 'has-selected' : ''}`}
                          style={buttonStyle}
                        >
                          <div
                            className={`speech-bubble-box ${isSelected ? 'disabled selected' : ''}`}
                            onClick={!isSelected ? handlePage8Box1 : undefined}
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: '100%',
                              height: '100%',
                              pointerEvents: isSelected ? 'none' : 'auto',
                              cursor: isSelected ? 'default' : 'pointer',
                              zIndex: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? '#000' : 'rgba(0, 0, 0, 0.05)',
                              fontSize: `${bubbleFontSize}px`,
                              fontFamily: 'Roboto, sans-serif',
                              textAlign: 'center',
                              padding: '4px 8px',
                              boxSizing: 'border-box'
                            }}
                          >
                          </div>
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
                            <path
                              d={speechBubblePath}
                              fill={isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                              style={{ fill: isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                            />
                            <g className="speech-bubble-border-group">
                              <path
                                d={leftBorderPath}
                                fill="none"
                                stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                strokeWidth={isSelected ? "2" : "1"}
                                className="speech-bubble-border"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                d={triangleLeftLegPath}
                                fill="none"
                                stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                strokeWidth={isSelected ? "2" : "1"}
                                className="speech-bubble-border"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                d={triangleRightLegPath}
                                fill="none"
                                stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                strokeWidth={isSelected ? "2" : "1"}
                                className="speech-bubble-border"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                d={rightBorderPath}
                                fill="none"
                                stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                strokeWidth={isSelected ? "2" : "1"}
                                className="speech-bubble-border"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                d={topBorderPath}
                                fill="none"
                                stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                strokeWidth={isSelected ? "2" : "1"}
                                className="speech-bubble-border"
                                vectorEffect="non-scaling-stroke"
                              />
                            </g>
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
                    </>
                  )}
                  {/* Number "9" at Dot 3 position on page 9 */}
                  {currentPage === 8 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      9
                    </span>
                  )}
                  {/* Number "10" at Dot 3 position on page 10 */}
                  {currentPage === 9 && !editorMode && (
                    <span
                      style={{
                        position: 'absolute',
                        left: '94.83%',
                        top: '95.96%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'Roboto, sans-serif',
                        color: '#595959',
                        fontSize: `${12 * stageRelativeScale}px`,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      10
                    </span>
                  )}
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
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Reduce height by 3px (was 5px, now increased by 2px = 3px reduction)
                    const heightReductionPx = 3
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    // Move the box down by 3px
                    const moveDownByPx = 3
                    const moveDownByPercent = stageHeightPx > 0 ? (moveDownByPx / stageHeightPx) * 100 : 0
                    
                    // Additional adjustments: left edge inwards 4px, right edge inwards 8px, bottom edge up 5px
                    const leftEdgeInwardPx = 4
                    const leftEdgeInwardPercent = stageWidthPx > 0 ? (leftEdgeInwardPx / stageWidthPx) * 100 : 0
                    const rightEdgeInwardPx = 8
                    const rightEdgeInwardPercent = stageWidthPx > 0 ? (rightEdgeInwardPx / stageWidthPx) * 100 : 0
                    const bottomEdgeUpPx = 5
                    const bottomEdgeUpPercent = stageHeightPx > 0 ? (bottomEdgeUpPx / stageHeightPx) * 100 : 0
                    
                    // Adjust dot3: move left 2px and down 3px
                    const dot3LeftOffsetPx = 2
                    const dot3DownOffsetPx = 3
                    const dot3LeftOffsetPercent = stageWidthPx > 0 ? (dot3LeftOffsetPx / stageWidthPx) * 100 : 0
                    const dot3DownOffsetPercent = stageHeightPx > 0 ? (dot3DownOffsetPx / stageHeightPx) * 100 : 0
                    const adjustedDot3X = dot3X - dot3LeftOffsetPercent
                    const adjustedDot3Y = dot3Y + dot3DownOffsetPercent
                    
                    const adjustedLeft = Math.max(0, bubbleLeft - leftOffsetAdjust + leftEdgeInwardPercent)
                    const adjustedTop = Math.max(0, bubbleTop - topOffsetAdjust + moveDownByPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, bubbleWidth + widthPercentAdjust - rightEdgeInwardPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, bubbleHeight + heightPercentAdjust - heightReductionPercent - bottomEdgeUpPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Font size scales exactly with image using stageRelativeScale - no min/max to maintain exact scale
                    // This ensures text maintains same visual appearance at 100% zoom regardless of panel width
                    const bubbleFontSize = 16 * stageRelativeScale
                    // Padding scales proportionally with button size
                    const buttonHeightPx = (expandedHeight / 100) * stageHeightPx
                    const buttonWidthPx = (expandedWidth / 100) * stageWidthPx
                    const paddingTopBottom = buttonHeightPx * 0.05
                    const paddingLeftRight = buttonWidthPx * 0.02
                    
                    // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                    // Dot3 is ABOVE the box (27.72% < 30.42%), so triangle points upward
                    const triangleBaseLeft = dot1X  // Left point on top edge
                    const triangleBaseRight = dot2X  // Right point on top edge
                    const triangleBaseY = bubbleTop  // Top edge Y position (30.42%)
                    const triangleTipX = adjustedDot3X  // Triangle tip X (adjusted)
                    const triangleTipY = adjustedDot3Y  // Triangle tip Y (adjusted)
                    
                    // Calculate rounded rectangle corner radius (reduced for speech bubbles)
                    const borderRadiusPx = Math.min(10, Math.max(4, 10 * stageRelativeScale))
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: `${paddingTopBottom}px ${paddingLeftRight}px`,
                            boxSizing: 'border-box'
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
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          {/* Border paths with pulse animation - excluding the top edge between the two points */}
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle left leg */}
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle right leg */}
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={bottomBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
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
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Reduce height by 3px
                    const heightReductionPx = 3
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    // Additional adjustments: top edge down 5px, left edge right 4px, right edge left 9px, bottom edge up 7px
                    const topEdgeDownPx = 5
                    const topEdgeDownPercent = stageHeightPx > 0 ? (topEdgeDownPx / stageHeightPx) * 100 : 0
                    const leftEdgeRightPx = 4
                    const leftEdgeRightPercent = stageWidthPx > 0 ? (leftEdgeRightPx / stageWidthPx) * 100 : 0
                    const rightEdgeLeftPx = 9
                    const rightEdgeLeftPercent = stageWidthPx > 0 ? (rightEdgeLeftPx / stageWidthPx) * 100 : 0
                    const bottomEdgeUpPx = 7
                    const bottomEdgeUpPercent = stageHeightPx > 0 ? (bottomEdgeUpPx / stageHeightPx) * 100 : 0
                    
                    // Adjust dot1: move right 7px
                    const dot1RightOffsetPx = 7
                    const dot1RightOffsetPercent = stageWidthPx > 0 ? (dot1RightOffsetPx / stageWidthPx) * 100 : 0
                    const adjustedDot1X = dot1X + dot1RightOffsetPercent
                    
                    // Adjust dot2: move right 4px
                    const dot2RightOffsetPx = 4
                    const dot2RightOffsetPercent = stageWidthPx > 0 ? (dot2RightOffsetPx / stageWidthPx) * 100 : 0
                    const adjustedDot2X = dot2X + dot2RightOffsetPercent
                    
                    const adjustedLeft = Math.max(0, bubble2Left - leftOffsetAdjust + leftEdgeRightPercent)
                    const adjustedTop = Math.max(0, bubble2Top - topOffsetAdjust + topEdgeDownPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, bubble2Width + widthPercentAdjust - rightEdgeLeftPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, bubble2Height + heightPercentAdjust - heightReductionPercent - bottomEdgeUpPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Use stageRelativeScale (same as pages 1 and 2) to scale exactly with the image
                    // Calculate padding that scales with button size
                    // Font size scales exactly with image using stageRelativeScale - no min/max to maintain exact scale
                    // Reduced base size to 14px (from 16px) to fit longer text
                    // This ensures text maintains same visual appearance at 100% zoom regardless of panel width
                    const bubbleFontSize = 14 * stageRelativeScale
                    // Padding scales proportionally with button size
                    const buttonHeightPx = (expandedHeight / 100) * stageHeightPx
                    const buttonWidthPx = (expandedWidth / 100) * stageWidthPx
                    const paddingTopBottom = buttonHeightPx * 0.05
                    const paddingLeftRight = buttonWidthPx * 0.02
                    
                    // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                    // Dot3 is BELOW the box (42.69% > 40.38%), so triangle points downward
                    const triangleBaseLeft = adjustedDot1X  // Left point on bottom edge (adjusted)
                    const triangleBaseRight = adjustedDot2X  // Right point on bottom edge (adjusted)
                    const triangleBaseY = adjustedTop + expandedHeight  // Bottom edge Y position
                    const triangleTipX = dot3X  // Triangle tip X (56.98%)
                    const triangleTipY = dot3Y  // Triangle tip Y (42.69% - below the box)
                    
                    // Calculate rounded rectangle corner radius (reduced for speech bubbles)
                    const borderRadiusPx = Math.min(10, Math.max(4, 10 * stageRelativeScale))
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 700,
                            textAlign: 'center',
                            lineHeight: '1.3',
                            padding: `${paddingTopBottom}px ${paddingLeftRight}px`,
                            boxSizing: 'border-box',
                            flexDirection: 'column'
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
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          {/* Border paths with pulse animation - excluding the bottom edge between the two points */}
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle left leg */}
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle right leg */}
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={topBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
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
                    // Fixed pixel size for all boxes - 20px × 20px squares (increased from 10px)
                    // Convert box size to percentages based on image natural size (not stage size)
                    // This ensures boxes scale correctly when panel width changes
                    const boxSizePx = 20
                    const boxSizeWidthPercent = imageNaturalSize.width > 0 ? (boxSizePx / imageNaturalSize.width) * 100 : 0
                    const boxSizeHeightPercent = imageNaturalSize.height > 0 ? (boxSizePx / imageNaturalSize.height) * 100 : 0
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
                          
                          // Convert pixel offsets to percentages based on image natural size (not stage size)
                          // This ensures offsets scale correctly when panel width changes
                          const leftOffsetPercent = imageNaturalSize.width > 0 ? (leftOffsetPx / imageNaturalSize.width) * 100 : 0
                          const topOffsetPercent = imageNaturalSize.height > 0 ? (topOffsetPx / imageNaturalSize.height) * 100 : 0
                          
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
                    // Font size scales exactly with image using stageRelativeScale - no min/max to maintain exact scale
                    const bubbleFontSize = 16 * stageRelativeScale
                    // Calculate adjustments based on image natural size for consistent scaling (like safety glasses image)
                    const widthPercentAdjust = imageNaturalSize.width > 0 ? (pixelIncrease / imageNaturalSize.width) * 100 : 0
                    const heightPercentAdjust = imageNaturalSize.height > 0 ? (pixelIncrease / imageNaturalSize.height) * 100 : 0
                    const leftOffsetAdjust = imageNaturalSize.width > 0 ? (halfPixelIncrease / imageNaturalSize.width) * 100 : 0
                    const topOffsetAdjust = imageNaturalSize.height > 0 ? (halfPixelIncrease / imageNaturalSize.height) * 100 : 0
                    
                    // Extend height down by 2px (reduce height reduction from 3px to 1px)
                    const heightReductionPx = 1
                    const heightReductionPercent = imageNaturalSize.height > 0 ? (heightReductionPx / imageNaturalSize.height) * 100 : 0
                    
                    // Additional adjustments: top edge down 4px, right edge left 2px, bottom edge up 5px
                    const topEdgeDownPx = 4
                    const topEdgeDownPercent = imageNaturalSize.height > 0 ? (topEdgeDownPx / imageNaturalSize.height) * 100 : 0
                    const rightEdgeLeftPx = 2
                    const rightEdgeLeftPercent = imageNaturalSize.width > 0 ? (rightEdgeLeftPx / imageNaturalSize.width) * 100 : 0
                    const bottomEdgeUpPx = 5
                    const bottomEdgeUpPercent = imageNaturalSize.height > 0 ? (bottomEdgeUpPx / imageNaturalSize.height) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, bubbleLeft - leftOffsetAdjust)
                    const adjustedTop = Math.max(0, bubbleTop - topOffsetAdjust + topEdgeDownPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, bubbleWidth + widthPercentAdjust - rightEdgeLeftPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, bubbleHeight + heightPercentAdjust - heightReductionPercent - bottomEdgeUpPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Adjust dot2: move left 11px
                    const dot2LeftOffsetPx = 11
                    const dot2LeftOffsetPercent = imageNaturalSize.width > 0 ? (dot2LeftOffsetPx / imageNaturalSize.width) * 100 : 0
                    const adjustedDot2X = dot2X - dot2LeftOffsetPercent
                    
                    // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                    // Dot3 is ABOVE the box (20.15% < 22.05%), so triangle points upward
                    const triangleBaseLeft = dot1X  // Left point on top edge
                    const triangleBaseRight = adjustedDot2X  // Right point on top edge
                    const triangleBaseY = bubbleTop  // Top edge Y position (22.05%)
                    const triangleTipX = dot3X  // Triangle tip X (52.04%)
                    const triangleTipY = dot3Y  // Triangle tip Y (20.15% - above the box)
                    
                    // Calculate rounded rectangle corner radius (reduced for speech bubbles) - scales exactly with image
                    const borderRadiusPx = 10 * stageRelativeScale
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
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
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          {/* Border paths with pulse animation - excluding the top edge between the two points */}
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle left leg */}
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            {/* Triangle right leg */}
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={bottomBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
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
                  {/* White infill boxes on page 4 (4.png) - hide when buttons are clicked */}
                  {currentPage === 3 && !editorMode && (() => {
                    // Box 1: Left: 0.00%, Top: 28.63%, Width: 100.00%, Height: 17.07%
                    const page4Box1Style = getButtonStyle(0.00, 28.63, 100.00, 17.07)
                    const page4Box1ExpandedStyle = {
                      ...page4Box1Style,
                      left: '0.00%',
                      top: '28.63%',
                      width: '100.00%',
                      height: '17.07%',
                      backgroundColor: 'white',
                      opacity: page4Box1Fading ? 0 : 1,
                      transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'none',
                      border: 'none',
                      zIndex: 4000
                    }

                    // Box 2: Left: 0.00%, Top: 45.34%, Width: 100.00%, Height: 25.69%
                    const page4Box2Style = getButtonStyle(0.00, 45.34, 100.00, 25.69)
                    const page4Box2ExpandedStyle = {
                      ...page4Box2Style,
                      left: '0.00%',
                      top: '45.34%',
                      width: '100.00%',
                      height: '25.69%',
                      backgroundColor: 'white',
                      opacity: page4Box2Fading ? 0 : 1,
                      transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'none',
                      border: 'none',
                      zIndex: 4000
                    }

                    // Box 3: Left: 0.00%, Top: 72.57%, Width: 100.00%, Height: 30.00%
                    // Reduce width by 150px total (reduced by 10px from 140px)
                    const widthReductionPx = 150
                    const widthReductionPercent = imageNaturalSize.width > 0 ? (widthReductionPx / imageNaturalSize.width) * 100 : 0
                    const adjustedBox3Width = 100.00 - widthReductionPercent
                    // Center the box after width reduction
                    const adjustedBox3Left = widthReductionPercent / 2
                    // Reduce height by bringing bottom edge up - calculate based on image natural size
                    const heightReductionPx = 55
                    const heightReductionPercent = imageNaturalSize.height > 0 ? (heightReductionPx / imageNaturalSize.height) * 100 : 0
                    const adjustedBox3Height = 30.00 - heightReductionPercent
                    const page4Box3Style = getButtonStyle(adjustedBox3Left, 72.57, adjustedBox3Width, adjustedBox3Height)
                    const page4Box3ExpandedStyle = {
                      ...page4Box3Style,
                      left: `${adjustedBox3Left}%`,
                      top: '72.57%',
                      width: `${adjustedBox3Width}%`,
                      height: `${adjustedBox3Height}%`,
                      backgroundColor: 'white',
                      opacity: page4Box3Fading ? 0 : 1,
                      transition: 'opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      pointerEvents: 'none',
                      border: 'none',
                      zIndex: 4000
                    }

                    return (
                      <>
                        <div style={page4Box1ExpandedStyle} />
                        <div style={page4Box2ExpandedStyle} />
                        <div style={page4Box3ExpandedStyle} />
                      </>
                    )
                  })()}
                  {/* Safety glasses image on page 4 (4.png) */}
                  {currentPage === 3 && !editorMode && (() => {
                    // Move 5px left and 13px up (moved up 2px more) - calculate offsets based on image natural size for consistent scaling
                    const leftOffsetPx = -5
                    const topOffsetPx = -13
                    const leftOffsetPercent = imageNaturalSize.width > 0 ? (leftOffsetPx / imageNaturalSize.width) * 100 : 0
                    const topOffsetPercent = imageNaturalSize.height > 0 ? (topOffsetPx / imageNaturalSize.height) * 100 : 0
                    const adjustedLeft = 13.07 + leftOffsetPercent
                    const adjustedTop = 14.91 + topOffsetPercent
                    
                    // Increase width by 5px proportionally - calculate based on image natural size
                    const widthIncreasePx = 5
                    const widthIncreasePercent = imageNaturalSize.width > 0 ? (widthIncreasePx / imageNaturalSize.width) * 100 : 0
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
                    
                    // Calculate 100px expansion in all directions as percentages
                    // 100px expansion means: left moves -100px, top moves -100px, width increases 200px, height increases 200px
                    // Use safety glasses natural size for percentage calculation
                    const expansionPx = 100
                    const leftExpansionPercent = safetyGlassesSize.width > 0 ? (expansionPx / safetyGlassesSize.width) * 100 : 0
                    const topExpansionPercent = safetyGlassesSize.height > 0 ? (expansionPx / safetyGlassesSize.height) * 100 : 0
                    const widthExpansionPercent = safetyGlassesSize.width > 0 ? ((expansionPx * 2) / safetyGlassesSize.width) * 100 : 0
                    const heightExpansionPercent = safetyGlassesSize.height > 0 ? ((expansionPx * 2) / safetyGlassesSize.height) * 100 : 0
                    
                    return (
                      <img
                        src={safetyGlasses}
                        alt="Safety glasses"
                        onLoad={handleSafetyGlassesLoad}
                        className={safetyGlassesPop ? 'safety-glasses-pop' : ''}
                        style={{
                          ...imageBaseStyle,
                          // Don't override height - use the calculated percentage for proper transform origin
                          zIndex: 10,
                          pointerEvents: 'none',
                          objectFit: 'contain', // Maintain aspect ratio within the bounds
                          // Pass base values and expansion values to CSS for animation
                          ['--base-left']: imageBaseStyle.left,
                          ['--base-top']: imageBaseStyle.top,
                          ['--base-width']: imageBaseStyle.width,
                          ['--base-height']: imageBaseStyle.height,
                          ['--left-expansion']: `${leftExpansionPercent}%`,
                          ['--top-expansion']: `${topExpansionPercent}%`,
                          ['--width-expansion']: `${widthExpansionPercent}%`,
                          ['--height-expansion']: `${heightExpansionPercent}%`
                        }}
                      />
                    )
                  })()}
                  {/* Buttons on page 4 (4.png) - rounded corner boxes without pointers */}
                  {currentPage === 3 && !editorMode && (() => {
                    // Button 1: Left: 13.19%, Top: 30.08%, Width: 68.40% (reduced from 73.40%), Height: 14.48%
                    const button1Left = 13.19
                    const button1Top = 30.08
                    const button1Width = 68.40
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
                    // Font size scales exactly with image using stageRelativeScale - no min/max to maintain exact scale
                    const buttonFontSize = 16 * stageRelativeScale
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Calculate border radius for rounded corners - scales exactly with image
                    const borderRadiusPx = 32 * stageRelativeScale
                    
                    const createButton = (left, top, width, height, isDisabled, onClick, buttonIndex) => {
                      // Add 25px extra width for button 1
                      const extraWidthPx = buttonIndex === 1 ? 25 : 0
                      const extraWidthPercent = stageWidthPx > 0 ? (extraWidthPx / stageWidthPx) * 100 : 0
                      // Reduce width by 2px for button 2 (far left small box) - moves right edge to the left
                      // Reduce width by 1px for button 3 (middle small box)
                      // Reduce width by 1px for button 4 (far right small box)
                      // Reduce width by 1px for button 5 (bottom button)
                      const widthReductionPx = buttonIndex === 2 ? 2 : (buttonIndex === 3 ? 1 : (buttonIndex === 4 ? 1 : (buttonIndex === 5 ? 1 : 0)))
                      const widthReductionPercent = stageWidthPx > 0 ? (widthReductionPx / stageWidthPx) * 100 : 0
                      const totalWidth = width + widthPercentAdjust + extraWidthPercent - widthReductionPercent
                      
                      // Center button 1 on the image
                      let adjustedLeft
                      if (buttonIndex === 1) {
                        // Center the button: left = 50% - (width / 2)
                        adjustedLeft = Math.max(0, 50 - (totalWidth / 2))
                      } else {
                        // For button 2 (far left small box), move right by 1px
                        // For button 3 (middle small box), move right by 1px
                        const leftAdjustPx = buttonIndex === 2 ? 1 : (buttonIndex === 3 ? 1 : 0)
                        const leftAdjustPercent = stageWidthPx > 0 ? (leftAdjustPx / stageWidthPx) * 100 : 0
                        adjustedLeft = Math.max(0, left - leftOffsetAdjust + leftAdjustPercent)
                      }
                      
                      // For button 3 (middle small box), move down by 1px
                      // For button 5 (bottom button), move down by 1px
                      const topAdjustPx = buttonIndex === 3 ? 1 : (buttonIndex === 5 ? 1 : 0)
                      const topAdjustPercent = stageHeightPx > 0 ? (topAdjustPx / stageHeightPx) * 100 : 0
                      const adjustedTop = Math.max(0, top - topOffsetAdjust + topAdjustPercent)
                      const expandedWidth = Math.min(100 - adjustedLeft, totalWidth)
                      // Reduce height by 2px for button 2 (far left small box)
                      // Reduce height by 2px for button 3 (middle small box)
                      // Reduce height by 2px for button 4 (far right small box)
                      // Reduce height by 3px for button 5 (bottom button)
                      const heightReductionPx = buttonIndex === 2 ? 2 : (buttonIndex === 3 ? 2 : (buttonIndex === 4 ? 2 : (buttonIndex === 5 ? 3 : 0)))
                      const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                      const expandedHeight = Math.min(100 - adjustedTop, height + heightPercentAdjust - heightReductionPercent)
                      const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                      
                      const isButton1 = buttonIndex === 1
                      const isSmallButton = buttonIndex === 2 || buttonIndex === 3 || buttonIndex === 4
                      
                      // For button 1, check if 2+ checkboxes are selected to determine disabled state
                      const checkedCount = (page4Checkbox1 ? 1 : 0) + (page4Checkbox2 ? 1 : 0) + (page4Checkbox3 ? 1 : 0)
                      const button1ShouldBeDisabled = isButton1 && checkedCount >= 2
                      const finalIsDisabled = isButton1 ? button1ShouldBeDisabled : isDisabled
                      
                      // Use smaller border radius for small horizontal boxes (buttons 2, 3, 4)
                      // Use slightly larger border radius for button 5 (bottom button)
                      // All scale exactly with image - no min/max constraints
                      const buttonBorderRadiusPx = isSmallButton 
                        ? 26 * stageRelativeScale
                        : (buttonIndex === 5 
                            ? 38 * stageRelativeScale
                            : borderRadiusPx)
                      
                      const expandedButtonStyle = {
                        ...buttonStyle,
                        left: `${adjustedLeft}%`,
                        top: `${adjustedTop}%`,
                        width: `${Math.max(0, expandedWidth)}%`,
                        height: `${Math.max(0, expandedHeight)}%`,
                        backgroundColor: isSmallButton 
                          ? (finalIsDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)')
                          : (buttonIndex === 5 
                              ? (finalIsDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)')
                              : 'white'),
                        color: '#000',
                        cursor: finalIsDisabled ? 'default' : 'pointer',
                        fontSize: `${buttonFontSize}px`,
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 700,
                        borderRadius: `${buttonBorderRadiusPx}px`,
                        border: finalIsDisabled ? '2px solid #f05f40' : '2px solid #0d6efd',
                        display: 'flex',
                        flexDirection: isButton1 ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        zIndex: 11,
                        padding: isButton1 ? `${8 * stageRelativeScale}px` : '0',
                        boxSizing: 'border-box',
                        lineHeight: '1.4',
                        // Allow pointer events on children (checkboxes) even when button is disabled
                        pointerEvents: isButton1 && finalIsDisabled ? 'auto' : undefined
                      }
                      
                      return (
                        <button
                          key={`page4-button-${buttonIndex}`}
                          onClick={(e) => {
                            // Prevent button click if disabled, but allow checkbox clicks to bubble through
                            if (!finalIsDisabled) {
                              onClick()
                            }
                          }}
                          disabled={false}
                          className={`page4-button ${finalIsDisabled ? 'disabled selected' : ''}`}
                          style={expandedButtonStyle}
                        >
                          {isButton1 && (
                            <>
                              <div style={{ marginBottom: `${4 * stageRelativeScale}px` }}>
                                I am wearing safety glasses and<br />will keep them on for the entire Robotics Workshop
                              </div>
                              <div style={{ marginBottom: `${4 * stageRelativeScale}px` }}></div>
                              <div style={{ marginBottom: `${2 * stageRelativeScale}px`, fontWeight: 'normal', position: 'relative', display: 'inline-block', pointerEvents: 'auto' }}>
                                Team member 1:  <span style={{ position: 'relative', display: 'inline-block', marginLeft: `${4 * stageRelativeScale}px`, pointerEvents: 'auto' }}>
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      setPage4Checkbox1(!page4Checkbox1)
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    style={{
                                      position: 'relative',
                                      width: `${16 * stageRelativeScale}px`,
                                      height: `${16 * stageRelativeScale}px`,
                                      backgroundColor: page4Checkbox1 ? '#f05f40' : 'transparent',
                                      border: `${2 * stageRelativeScale}px solid ${page4Checkbox1 ? '#f05f40' : '#0d6efd'}`,
                                      borderRadius: `${3 * stageRelativeScale}px`,
                                      zIndex: 15,
                                      cursor: 'pointer',
                                      display: 'inline-block',
                                      verticalAlign: 'middle',
                                      pointerEvents: 'auto'
                                    }} 
                                  />
                                </span>
                              </div>
                              <div style={{ marginBottom: `${2 * stageRelativeScale}px`, fontWeight: 'normal', position: 'relative', display: 'inline-block', pointerEvents: 'auto' }}>
                                Team member 2:  <span style={{ position: 'relative', display: 'inline-block', marginLeft: `${4 * stageRelativeScale}px`, pointerEvents: 'auto' }}>
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      setPage4Checkbox2(!page4Checkbox2)
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    style={{
                                      position: 'relative',
                                      width: `${16 * stageRelativeScale}px`,
                                      height: `${16 * stageRelativeScale}px`,
                                      backgroundColor: page4Checkbox2 ? '#f05f40' : 'transparent',
                                      border: `${2 * stageRelativeScale}px solid ${page4Checkbox2 ? '#f05f40' : '#0d6efd'}`,
                                      borderRadius: `${3 * stageRelativeScale}px`,
                                      zIndex: 15,
                                      cursor: 'pointer',
                                      display: 'inline-block',
                                      verticalAlign: 'middle',
                                      pointerEvents: 'auto'
                                    }} 
                                  />
                                </span>
                              </div>
                              <div style={{ fontWeight: 'normal', position: 'relative', display: 'inline-block', pointerEvents: 'auto' }}>
                                Team member 3:  <span style={{ position: 'relative', display: 'inline-block', marginLeft: `${4 * stageRelativeScale}px`, pointerEvents: 'auto' }}>
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      setPage4Checkbox3(!page4Checkbox3)
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation()
                                    }}
                                    style={{
                                      position: 'relative',
                                      width: `${16 * stageRelativeScale}px`,
                                      height: `${16 * stageRelativeScale}px`,
                                      backgroundColor: page4Checkbox3 ? '#f05f40' : 'transparent',
                                      border: `${2 * stageRelativeScale}px solid ${page4Checkbox3 ? '#f05f40' : '#0d6efd'}`,
                                      borderRadius: `${3 * stageRelativeScale}px`,
                                      zIndex: 15,
                                      cursor: 'pointer',
                                      display: 'inline-block',
                                      verticalAlign: 'middle',
                                      pointerEvents: 'auto'
                                    }} 
                                  />
                                </span>
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
                  {/* Speech bubble buttons on page 5 (5.png) */}
                  {currentPage === 4 && !editorMode && (() => {
                    // Button 1: Left: 32.64%, Top: 47.41%, Width: 35.84%, Height: 5.87%
                    const button1Left = 32.64
                    const button1Top = 47.41
                    const button1Width = 35.84
                    const button1Height = 5.87
                    const dot1X = 38.59
                    const dot1Y = 53.28
                    const dot2X = 47.06
                    const dot2Y = 53.28
                    const dot3X = 33.05
                    const dot3Y = 57.24
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const isDisabled = page5Button1Clicked
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Adjust dot2: move right 1px (additional, so total 2px right from original)
                    const dot2RightOffsetPx = 2  // Total 2px right (1px from previous + 1px new)
                    const dot2RightOffsetPercent = stageWidthPx > 0 ? (dot2RightOffsetPx / stageWidthPx) * 100 : 0
                    const adjustedDot2X = dot2X + dot2RightOffsetPercent
                    
                    // Adjust dot3: move left 1px (additional to previous left 1px, so total 2px left from original) and down 1px
                    const dot3LeftOffsetPx = 2  // Total 2px left (1px from previous + 1px new)
                    const dot3DownOffsetPx = 1
                    const dot3LeftOffsetPercent = stageWidthPx > 0 ? (dot3LeftOffsetPx / stageWidthPx) * 100 : 0
                    const dot3DownOffsetPercent = stageHeightPx > 0 ? (dot3DownOffsetPx / stageHeightPx) * 100 : 0
                    const adjustedDot3X = dot3X - dot3LeftOffsetPercent
                    const adjustedDot3Y = dot3Y + dot3DownOffsetPercent
                    
                    const heightReductionPx = 3
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    // Additional adjustments for box 1: left edge right 2px, right edge left 4px, top edge down 2px, bottom edge up 2px
                    const leftEdgeRightPx = 2
                    const leftEdgeRightPercent = stageWidthPx > 0 ? (leftEdgeRightPx / stageWidthPx) * 100 : 0
                    const rightEdgeLeftPx = 4
                    const rightEdgeLeftPercent = stageWidthPx > 0 ? (rightEdgeLeftPx / stageWidthPx) * 100 : 0
                    const topEdgeDownPx = 2
                    const topEdgeDownPercent = stageHeightPx > 0 ? (topEdgeDownPx / stageHeightPx) * 100 : 0
                    const bottomEdgeUpPx = 2
                    const bottomEdgeUpPercent = stageHeightPx > 0 ? (bottomEdgeUpPx / stageHeightPx) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, button1Left - leftOffsetAdjust + leftEdgeRightPercent)
                    const adjustedTop = Math.max(0, button1Top - topOffsetAdjust + topEdgeDownPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, button1Width + widthPercentAdjust - rightEdgeLeftPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, button1Height + heightPercentAdjust - heightReductionPercent - bottomEdgeUpPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                    // Dot3 is BELOW the box (57.24% > 53.28%), so triangle points downward
                    const triangleBaseLeft = dot1X
                    const triangleBaseRight = adjustedDot2X
                    const triangleBaseY = adjustedTop + expandedHeight
                    const triangleTipX = adjustedDot3X
                    const triangleTipY = adjustedDot3Y
                    
                    const borderRadiusPx = Math.min(10, Math.max(4, 10 * stageRelativeScale))
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
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
                    
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                      L ${topLeft},${bottomY - borderRadiusWrapperY}
                      Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                    `
                    
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${bottomY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${bottomY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${bottomY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                      Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                      L ${topRight},${topY + borderRadiusWrapperY}
                      Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                    `
                    
                    const topBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      L ${topRight - borderRadiusWrapperX},${topY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={buttonStyle}
                      >
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage5Button1 : undefined}
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            textAlign: 'center',
                            padding: '4px 8px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <span style={{ color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)', lineHeight: '1.3', display: 'block', fontWeight: 'normal' }}>
                          </span>
                        </div>
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
                          <path
                            d={speechBubblePath}
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={topBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
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
                  {/* Second speech bubble button on page 5 (5.png) */}
                  {currentPage === 4 && !editorMode && (() => {
                    // Button 2: Left: 32.64%, Top: 84.81%, Width: 35.84%, Height: 5.87%
                    const button2Left = 32.64
                    const button2Top = 84.81
                    const button2Width = 35.84
                    const button2Height = 5.87
                    const dot1X = 38.14
                    const dot1Y = 84.81
                    const dot2X = 46.39
                    const dot2Y = 84.81
                    const dot3X = 31.04
                    const dot3Y = 82.40
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const isDisabled = page5Button2Clicked
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Adjust dot1: move right 3px
                    const dot1RightOffsetPx = 3
                    const dot1RightOffsetPercent = stageWidthPx > 0 ? (dot1RightOffsetPx / stageWidthPx) * 100 : 0
                    const adjustedDot1X = dot1X + dot1RightOffsetPercent
                    
                    // Adjust dot3: move left 1px and up 1px
                    const dot3LeftOffsetPx = 1
                    const dot3UpOffsetPx = 1
                    const dot3LeftOffsetPercent = stageWidthPx > 0 ? (dot3LeftOffsetPx / stageWidthPx) * 100 : 0
                    const dot3UpOffsetPercent = stageHeightPx > 0 ? (dot3UpOffsetPx / stageHeightPx) * 100 : 0
                    const adjustedDot3X = dot3X - dot3LeftOffsetPercent
                    const adjustedDot3Y = dot3Y - dot3UpOffsetPercent
                    
                    const heightReductionPx = 3
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    // Additional adjustments for box 2: top edge down 2px, left and right edges inwards 2px, bottom edge up 1px, right edge left 2px more
                    const topEdgeDownPx = 2
                    const topEdgeDownPercent = stageHeightPx > 0 ? (topEdgeDownPx / stageHeightPx) * 100 : 0
                    const leftEdgeInwardPx = 2
                    const leftEdgeInwardPercent = stageWidthPx > 0 ? (leftEdgeInwardPx / stageWidthPx) * 100 : 0
                    const rightEdgeInwardPx = 4
                    const rightEdgeInwardPercent = stageWidthPx > 0 ? (rightEdgeInwardPx / stageWidthPx) * 100 : 0
                    const bottomEdgeUpPx = 1
                    const bottomEdgeUpPercent = stageHeightPx > 0 ? (bottomEdgeUpPx / stageHeightPx) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, button2Left - leftOffsetAdjust + leftEdgeInwardPercent)
                    const adjustedTop = Math.max(0, button2Top - topOffsetAdjust + topEdgeDownPercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, button2Width + widthPercentAdjust - rightEdgeInwardPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, button2Height + heightPercentAdjust - heightReductionPercent - bottomEdgeUpPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                    // Dot3 is ABOVE the box (82.40% < 84.81%), so triangle points upward
                    const triangleBaseLeft = adjustedDot1X
                    const triangleBaseRight = dot2X
                    const triangleBaseY = button2Top
                    const triangleTipX = adjustedDot3X
                    const triangleTipY = adjustedDot3Y
                    
                    const borderRadiusPx = Math.min(10, Math.max(4, 10 * stageRelativeScale))
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
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
                    
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                      L ${topLeft},${topY + borderRadiusWrapperY}
                      Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                    `
                    
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                      Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                      L ${topRight},${bottomY - borderRadiusWrapperY}
                      Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    const bottomBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      L ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={buttonStyle}
                      >
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage5Button2 : undefined}
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            textAlign: 'center',
                            padding: '4px 8px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <span style={{ color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)', lineHeight: '1.3', display: 'block', fontWeight: 'normal' }}>
                          </span>
                        </div>
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
                          <path
                            d={speechBubblePath}
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={bottomBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#3bbf6b" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
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
                  {/* Red dot on page 5 (5.png) - appears at 2x size and shrinks when button is selected */}
                  {currentPage === 4 && !editorMode && page5Button1Clicked && (() => {
                    const dotX = 18.55
                    const dotY = 66.89
                    const dotSizePx = 7
                    const dotSizeWidthPercent = stageWidthPx > 0 ? (dotSizePx / stageWidthPx) * 100 : 0
                    const dotSizeHeightPercent = stageHeightPx > 0 ? (dotSizePx / stageHeightPx) * 100 : 0
                    
                    // Center the dot on the specified coordinates
                    const dotLeft = dotX - (dotSizeWidthPercent / 2)
                    const dotTop = dotY - (dotSizeHeightPercent / 2)
                    
                    const dotStyle = getButtonStyle(dotLeft, dotTop, dotSizeWidthPercent, dotSizeHeightPercent)
                    
                    return (
                      <div
                        style={{
                          ...dotStyle,
                          backgroundColor: '#dd1712',
                          borderRadius: '50%',
                          pointerEvents: 'none',
                          zIndex: 12,
                          transformOrigin: 'center',
                          animation: 'shrinkDot 0.5s ease-out forwards'
                        }}
                      />
                    )
                  })()}
                  {/* White dot with blue edge on page 5 (5.png) - hidden until button is selected */}
                  {currentPage === 4 && !editorMode && page5Button1Clicked && (() => {
                    const dotX = 18.55
                    const dotY = 63.62
                    const dotSizePx = 7
                    const dotSizeWidthPercent = stageWidthPx > 0 ? (dotSizePx / stageWidthPx) * 100 : 0
                    const dotSizeHeightPercent = stageHeightPx > 0 ? (dotSizePx / stageHeightPx) * 100 : 0
                    
                    // Center the dot on the specified coordinates
                    const dotLeft = dotX - (dotSizeWidthPercent / 2)
                    const dotTop = dotY - (dotSizeHeightPercent / 2)
                    
                    const dotStyle = getButtonStyle(dotLeft, dotTop, dotSizeWidthPercent, dotSizeHeightPercent)
                    
                    return (
                      <div
                        onClick={!page5BlueDotSelected ? handlePage5BlueDot : undefined}
                        style={{
                          ...dotStyle,
                          backgroundColor: page5BlueDotSelected ? '#dd1712' : 'white',
                          border: page5BlueDotSelected ? '1px solid #dd1712' : '1px solid #0d6efd',
                          borderRadius: '50%',
                          pointerEvents: page5BlueDotSelected ? 'none' : 'auto',
                          cursor: page5BlueDotSelected ? 'default' : 'pointer',
                          zIndex: 12
                        }}
                      />
                    )
                  })()}
                  {/* Green dot on page 5 (5.png) - hidden until button is selected */}
                  {currentPage === 4 && !editorMode && page5Button2Clicked && (() => {
                    const dotX = 15.88
                    const dotY = 78.44
                    const dotSizePx = 7
                    const dotSizeWidthPercent = stageWidthPx > 0 ? (dotSizePx / stageWidthPx) * 100 : 0
                    const dotSizeHeightPercent = stageHeightPx > 0 ? (dotSizePx / stageHeightPx) * 100 : 0
                    
                    // Center the dot on the specified coordinates
                    const dotLeft = dotX - (dotSizeWidthPercent / 2)
                    const dotTop = dotY - (dotSizeHeightPercent / 2)
                    
                    const dotStyle = getButtonStyle(dotLeft, dotTop, dotSizeWidthPercent, dotSizeHeightPercent)
                    
                    return (
                      <div
                        style={{
                          ...dotStyle,
                          backgroundColor: '#3bbf6b',
                          borderRadius: '50%',
                          pointerEvents: 'none',
                          zIndex: 12,
                          transformOrigin: 'center',
                          animation: 'shrinkDot 0.5s ease-out forwards'
                        }}
                      />
                    )
                  })()}
                  {/* Blue edge white infill dot that connects to green dot on page 5 (5.png) - hidden until button is selected, inactive until green dot is displayed */}
                  {currentPage === 4 && !editorMode && page5Button1Clicked && (() => {
                    const dotX = 44.46
                    const dotY = 78.39
                    const dotSizePx = 7
                    const dotSizeWidthPercent = stageWidthPx > 0 ? (dotSizePx / stageWidthPx) * 100 : 0
                    const dotSizeHeightPercent = stageHeightPx > 0 ? (dotSizePx / stageHeightPx) * 100 : 0
                    
                    // Center the dot on the specified coordinates
                    const dotLeft = dotX - (dotSizeWidthPercent / 2)
                    const dotTop = dotY - (dotSizeHeightPercent / 2)
                    
                    const dotStyle = getButtonStyle(dotLeft, dotTop, dotSizeWidthPercent, dotSizeHeightPercent)
                    
                    return (
                      <div
                        onClick={!page5GreenDotSelected && page5Button2Clicked ? handlePage5GreenDot : undefined}
                        style={{
                          ...dotStyle,
                          backgroundColor: page5GreenDotSelected ? '#3bbf6b' : 'white',
                          border: page5GreenDotSelected ? '1px solid #3bbf6b' : '1px solid #0d6efd',
                          borderRadius: '50%',
                          pointerEvents: page5GreenDotSelected ? 'none' : (page5Button2Clicked ? 'auto' : 'none'),
                          cursor: page5GreenDotSelected ? 'default' : (page5Button2Clicked ? 'pointer' : 'default'),
                          opacity: 1,
                          zIndex: 12
                        }}
                      />
                    )
                  })()}
                  {/* Dummy blue edge white infill dots on page 5 (5.png) - hidden until button is selected */}
                  {currentPage === 4 && !editorMode && page5Button1Clicked && (() => {
                    const dots = [
                      { x: 24.09, y: 68.11 },
                      { x: 32.43, y: 64.80 },
                      { x: 78.39, y: 63.75 },
                      { x: 12.15, y: 59.58 },
                      { x: 22.96, y: 60.45 },
                      { x: 84.02, y: 59.58 },
                      { x: 54.06, y: 79.42 },
                      { x: 18.59, y: 73.22 },
                      { x: 11.90, y: 72.18 },
                      { x: 89.30, y: 73.22 }
                    ]
                    const dotSizePx = 7
                    const dotSizeWidthPercent = stageWidthPx > 0 ? (dotSizePx / stageWidthPx) * 100 : 0
                    const dotSizeHeightPercent = stageHeightPx > 0 ? (dotSizePx / stageHeightPx) * 100 : 0
                    // Move dot #1 up by 6px (2px + 4px additional)
                    const moveUp6pxPercent = stageHeightPx > 0 ? (6 / stageHeightPx) * 100 : 0
                    
                    return dots.map((dot, index) => {
                      // Apply 6px upward adjustment to dot #1 (index 0)
                      const adjustedY = index === 0 ? dot.y - moveUp6pxPercent : dot.y
                      const dotLeft = dot.x - (dotSizeWidthPercent / 2)
                      const dotTop = adjustedY - (dotSizeHeightPercent / 2)
                      const dotStyle = getButtonStyle(dotLeft, dotTop, dotSizeWidthPercent, dotSizeHeightPercent)
                      
                      return (
                        <div
                          key={`dummy-dot-${index}`}
                          style={{
                            ...dotStyle,
                            backgroundColor: 'white',
                            border: '1px solid #0d6efd',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            zIndex: 12
                          }}
                        />
                      )
                    })
                  })()}
                  {/* Red line connecting red dot to selected blue edge dot on page 5 */}
                  {currentPage === 4 && !editorMode && page5BlueDotSelected && (() => {
                    const redDotX = 18.55
                    const redDotY = 66.89
                    const selectedDotX = 18.55
                    const selectedDotY = 63.62
                    
                    return (
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 11
                        }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1={redDotX}
                          y1={redDotY}
                          x2={selectedDotX}
                          y2={selectedDotY}
                          stroke="#dd1712"
                          strokeWidth="3"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    )
                  })()}
                  {/* Green line connecting selected dot to green dot horizontally on page 5 */}
                  {currentPage === 4 && !editorMode && page5GreenDotSelected && (() => {
                    const greenDotX = 15.88
                    const greenDotY = 78.44
                    const selectedDotX = 44.46
                    const selectedDotY = 78.39
                    
                    return (
                      <svg
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 11
                        }}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <line
                          x1={selectedDotX}
                          y1={selectedDotY}
                          x2={greenDotX}
                          y2={selectedDotY}
                          stroke="#3bbf6b"
                          strokeWidth="3"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    )
                  })()}
                  {/* White box on page 5 (5.png) - visible when user first lands on page, hides when red active button is selected */}
                  {currentPage === 4 && !editorMode && !page5BlueDotSelected && (() => {
                    const whiteBoxStyle = getButtonStyle(27.73, 81.71, 45.65, 14.83)
                    return (
                      <div
                        style={{
                          ...whiteBoxStyle,
                          left: '27.73%',
                          top: '81.71%',
                          width: '45.65%',
                          height: '14.83%',
                          backgroundColor: 'white',
                          pointerEvents: 'none',
                          border: 'none',
                          zIndex: 5000
                        }}
                      />
                    )
                  })()}
                  {/* Speech bubble buttons on page 6 (6.png) */}
                  {currentPage === 5 && !editorMode && (() => {
                    // Button 1: Left: 20.62%, Top: 58.98%, Width: 26.53%, Height: 4.38%
                    const button1Left = 20.62
                    const button1Top = 58.98
                    const button1Width = 26.53
                    const button1Height = 4.38
                    const dot1X = 23.88
                    const dot1Y = 63.36
                    const dot2X = 30.95
                    const dot2Y = 63.36
                    const dot3X = 17.10
                    const dot3Y = 65.76
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const isDisabled = page6Button1Clicked
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Additional adjustments: width in 1px each side, bottom up 2px, top down 1px
                    const widthReductionPx = 2  // 1px from each side
                    const widthReductionPercent = stageWidthPx > 0 ? (widthReductionPx / stageWidthPx) * 100 : 0
                    const leftIncreasePx = 1  // Move left edge right by 1px
                    const leftIncreasePercent = stageWidthPx > 0 ? (leftIncreasePx / stageWidthPx) * 100 : 0
                    const topIncreasePx = 1  // Move top down by 1px
                    const topIncreasePercent = stageHeightPx > 0 ? (topIncreasePx / stageHeightPx) * 100 : 0
                    const heightReductionPx = 3  // Move bottom up by 3px (2px + 1px)
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    // Move dot1 to the right by 3px (2px + 1px)
                    const dot1RightOffsetPx = 3
                    const dot1RightOffsetPercent = stageWidthPx > 0 ? (dot1RightOffsetPx / stageWidthPx) * 100 : 0
                    const adjustedDot1X = dot1X + dot1RightOffsetPercent
                    
                    const adjustedLeft = Math.max(0, button1Left - leftOffsetAdjust + leftIncreasePercent)
                    const adjustedTop = Math.max(0, button1Top - topOffsetAdjust + topIncreasePercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, button1Width + widthPercentAdjust - widthReductionPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, button1Height + heightPercentAdjust - heightReductionPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                    // Dot3 is BELOW the box (65.76% > 63.36%), so triangle points downward
                    const triangleBaseLeft = adjustedDot1X
                    const triangleBaseRight = dot2X
                    const triangleBaseY = adjustedTop + expandedHeight
                    const triangleTipX = dot3X
                    const triangleTipY = dot3Y
                    
                    const borderRadiusPx = Math.min(10, Math.max(4, 10 * stageRelativeScale))
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
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
                    
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                      L ${topLeft},${bottomY - borderRadiusWrapperY}
                      Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                    `
                    
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${bottomY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${bottomY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${bottomY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                      Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                      L ${topRight},${topY + borderRadiusWrapperY}
                      Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                    `
                    
                    const topBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${topY}
                      L ${topRight - borderRadiusWrapperX},${topY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={buttonStyle}
                      >
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage6Button1 : undefined}
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            textAlign: 'center',
                            padding: '4px 8px',
                            boxSizing: 'border-box'
                          }}
                        >
                        </div>
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
                          <path
                            d={speechBubblePath}
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={topBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
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
                  {/* Second speech bubble button on page 6 (6.png) */}
                  {currentPage === 5 && !editorMode && (() => {
                    // Button 2: Left: 19.29%, Top: 76.21%, Width: 29.21%, Height: 9.21%
                    const button2Left = 19.29
                    const button2Top = 76.21
                    const button2Width = 29.21
                    const button2Height = 9.21
                    const dot1X = 24.09
                    const dot1Y = 76.21
                    const dot2X = 31.00
                    const dot2Y = 76.21
                    const dot3X = 16.88
                    const dot3Y = 67.83
                    
                    const pixelIncrease = 3
                    const halfPixelIncrease = pixelIncrease / 2
                    const isDisabled = page6Button2Clicked
                    const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                    const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                    const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                    const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                    const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                    
                    // Additional adjustments: left and right edges in 1px each, top down 2px, bottom up 1px
                    const widthReductionPx = 2  // 1px from each side
                    const widthReductionPercent = stageWidthPx > 0 ? (widthReductionPx / stageWidthPx) * 100 : 0
                    const leftIncreasePx = 1  // Move left edge right by 1px
                    const leftIncreasePercent = stageWidthPx > 0 ? (leftIncreasePx / stageWidthPx) * 100 : 0
                    const topIncreasePx = 2  // Move top down by 2px
                    const topIncreasePercent = stageHeightPx > 0 ? (topIncreasePx / stageHeightPx) * 100 : 0
                    const heightReductionPx = 3  // Move bottom up by 3px (1px + 2px)
                    const heightReductionPercent = stageHeightPx > 0 ? (heightReductionPx / stageHeightPx) * 100 : 0
                    
                    const adjustedLeft = Math.max(0, button2Left - leftOffsetAdjust + leftIncreasePercent)
                    const adjustedTop = Math.max(0, button2Top - topOffsetAdjust + topIncreasePercent)
                    const expandedWidth = Math.min(100 - adjustedLeft, button2Width + widthPercentAdjust - widthReductionPercent)
                    const expandedHeight = Math.min(100 - adjustedTop, button2Height + heightPercentAdjust - heightReductionPercent)
                    const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                    
                    // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                    // Dot3 is ABOVE the box (67.83% < 76.21%), so triangle points upward
                    // Move dot3 up 1px and left 1px
                    const dot3LeftOffsetPx = 1
                    const dot3UpOffsetPx = 1
                    const dot3LeftOffsetPercent = stageWidthPx > 0 ? (dot3LeftOffsetPx / stageWidthPx) * 100 : 0
                    const dot3UpOffsetPercent = stageHeightPx > 0 ? (dot3UpOffsetPx / stageHeightPx) * 100 : 0
                    const adjustedDot3X = dot3X - dot3LeftOffsetPercent
                    const adjustedDot3Y = dot3Y - dot3UpOffsetPercent
                    
                    // Move dot2 to the right by 1px
                    const dot2RightOffsetPx = 1
                    const dot2RightOffsetPercent = stageWidthPx > 0 ? (dot2RightOffsetPx / stageWidthPx) * 100 : 0
                    const adjustedDot2X = dot2X + dot2RightOffsetPercent
                    
                    const triangleBaseLeft = dot1X
                    const triangleBaseRight = adjustedDot2X
                    const triangleBaseY = button2Top
                    const triangleTipX = adjustedDot3X
                    const triangleTipY = adjustedDot3Y
                    
                    const borderRadiusPx = Math.min(20, Math.max(10, 20 * stageRelativeScale))
                    const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                    const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                    const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                    const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                    
                    const topLeft = 0
                    const topRight = 100
                    const topY = 0
                    const bottomY = 100
                    
                    const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                    const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                    const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                    const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                    
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
                    
                    const leftBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                      L ${topLeft},${topY + borderRadiusWrapperY}
                      Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                      ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                    `
                    
                    const triangleLeftLegPath = `
                      M ${triangleBaseLeftWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    const triangleRightLegPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      L ${triangleTipXWrapper},${triangleTipYWrapper}
                    `
                    
                    const rightBorderPath = `
                      M ${triangleBaseRightWrapper},${topY}
                      ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                      Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                      L ${topRight},${bottomY - borderRadiusWrapperY}
                      Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    const bottomBorderPath = `
                      M ${topLeft + borderRadiusWrapperX},${bottomY}
                      L ${topRight - borderRadiusWrapperX},${bottomY}
                    `
                    
                    return (
                      <div 
                        className={`speech-bubble-wrapper ${isDisabled ? 'has-selected' : ''}`}
                        style={buttonStyle}
                      >
                        <div
                          className={`speech-bubble-box ${isDisabled ? 'disabled selected' : ''}`}
                          onClick={!isDisabled ? handlePage6Button2 : undefined}
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
                            color: isDisabled ? '#000' : 'rgba(0, 0, 0, 0.05)',
                            fontSize: `${bubbleFontSize}px`,
                            fontFamily: 'Roboto, sans-serif',
                            textAlign: 'center',
                            padding: '4px 8px',
                            boxSizing: 'border-box'
                          }}
                        >
                        </div>
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
                          <path
                            d={speechBubblePath}
                            fill={isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                            style={{ fill: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                          />
                          <g className="speech-bubble-border-group">
                            <path
                              d={leftBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleLeftLegPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={triangleRightLegPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={rightBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={bottomBorderPath}
                              fill="none"
                              stroke={isDisabled ? "#ff8c00" : "#0d6efd"}
                              strokeWidth={isDisabled ? "2" : "1"}
                              className="speech-bubble-border"
                              vectorEffect="non-scaling-stroke"
                            />
                          </g>
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
                  {/* Green selection checkbox on page 6 (6.png) */}
                  {currentPage === 5 && !editorMode && (() => {
                    const checkboxLeft = 8.01
                    const checkboxTop = 65.59
                    const checkboxWidth = 2.00
                    const checkboxHeight = 2.00
                    
                    // Use fixed pixel size like other green boxes (20px)
                    const boxSizePx = 20
                    const boxSizeWidthPercent = imageNaturalSize.width > 0 ? (boxSizePx / imageNaturalSize.width) * 100 : 0
                    const boxSizeHeightPercent = imageNaturalSize.height > 0 ? (boxSizePx / imageNaturalSize.height) * 100 : 0
                    const borderRadiusPx = 2
                    
                    // Move down and to the right by 9px (4px + 5px)
                    const rightOffsetPx = 9
                    const downOffsetPx = 9
                    const rightOffsetPercent = imageNaturalSize.width > 0 ? (rightOffsetPx / imageNaturalSize.width) * 100 : 0
                    const downOffsetPercent = imageNaturalSize.height > 0 ? (downOffsetPx / imageNaturalSize.height) * 100 : 0
                    
                    // Center the box on the specified coordinates, then apply offsets
                    const checkboxLeftAdjusted = checkboxLeft - (boxSizeWidthPercent / 2) + rightOffsetPercent
                    const checkboxTopAdjusted = checkboxTop - (boxSizeHeightPercent / 2) + downOffsetPercent
                    
                    const checkboxStyle = getButtonStyle(checkboxLeftAdjusted, checkboxTopAdjusted, boxSizeWidthPercent, boxSizeHeightPercent)
                    
                    return (
                      <div
                        onClick={handlePage6GreenCheckbox}
                        style={{
                          ...checkboxStyle,
                          left: `${checkboxLeftAdjusted}%`,
                          top: `${checkboxTopAdjusted}%`,
                          width: `${boxSizeWidthPercent}%`,
                          height: `${boxSizeHeightPercent}%`,
                          backgroundColor: page6GreenCheckboxSelected ? '#3bbf6b' : 'white',
                          border: '1px solid #3bbf6b',
                          borderRadius: `${borderRadiusPx}px`,
                          cursor: 'pointer',
                          zIndex: 12
                        }}
                      />
                    )
                  })()}
                  {/* Page 7 boxes with blue edges and dots */}
                  {currentPage === 6 && !editorMode && (
                    <>
                      {/* Box 1 - triangle points downward */}
                      {(() => {
                        const boxLeft = 46.53
                        const boxTop = 39.13
                        const boxWidth = 29.46
                        const boxHeight = 5.95
                        const dot1X = 50.47
                        const dot1Y = 45.08
                        const dot2X = 58.80
                        const dot2Y = 45.08
                        const dot3X = 45.94
                        const dot3Y = 46.69
                        // Box 1 is selected if it's clicked OR if box 4 is selected (showing 7.1.png)
                        const isSelected = page7Box1Selected || page7Box4Selected
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        // Move box 1 top edge down by 5px
                        const topDownOffsetPx = 5
                        const topDownOffsetPercent = imageNaturalSize.height > 0 ? (topDownOffsetPx / imageNaturalSize.height) * 100 : 0
                        
                        // Move box 1 bottom edge up by 9px (reduce height: 8px + 1px)
                        const heightReductionPx = 9
                        const heightReductionPercent = imageNaturalSize.height > 0 ? (heightReductionPx / imageNaturalSize.height) * 100 : 0
                        
                        // Move box 1 left edge right by 4px and right edge left by 3px (reduce width)
                        const leftEdgeRightPx = 4
                        const rightEdgeLeftPx = 3
                        const leftEdgeRightPercent = imageNaturalSize.width > 0 ? (leftEdgeRightPx / imageNaturalSize.width) * 100 : 0
                        const rightEdgeLeftPercent = imageNaturalSize.width > 0 ? (rightEdgeLeftPx / imageNaturalSize.width) * 100 : 0
                        const totalWidthReductionPercent = leftEdgeRightPercent + rightEdgeLeftPercent
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust + leftEdgeRightPercent)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust + topDownOffsetPercent)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust - totalWidthReductionPercent)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust - heightReductionPercent)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        // Move dot 1 to the right by 9px (8px + 1px)
                        const dot1RightOffsetPx = 9
                        const dot1RightOffsetPercent = imageNaturalSize.width > 0 ? (dot1RightOffsetPx / imageNaturalSize.width) * 100 : 0
                        const adjustedDot1X = dot1X + dot1RightOffsetPercent
                        
                        // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                        const triangleBaseLeft = adjustedDot1X
                        const triangleBaseRight = dot2X
                        const triangleBaseY = adjustedTop + expandedHeight
                        const triangleTipX = dot3X
                        const triangleTipY = dot3Y
                        
                        const borderRadiusPx = Math.min(15, Math.max(6, 15 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                        const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                        const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                        const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                        
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
                        
                        const leftBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                          ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                        `
                        
                        const triangleLeftLegPath = `
                          M ${triangleBaseLeftWrapper},${bottomY}
                          L ${triangleTipXWrapper},${triangleTipYWrapper}
                        `
                        const triangleRightLegPath = `
                          M ${triangleBaseRightWrapper},${bottomY}
                          L ${triangleTipXWrapper},${triangleTipYWrapper}
                        `
                        
                        const rightBorderPath = `
                          M ${triangleBaseRightWrapper},${bottomY}
                          ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const topBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          L ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        return (
                          <div 
                            className={`speech-bubble-wrapper ${isSelected ? 'has-selected' : ''}`}
                            style={buttonStyle}
                          >
                            <div
                              className={`speech-bubble-box ${isSelected ? 'disabled selected' : ''}`}
                              onClick={!isSelected ? handlePage7Box1 : undefined}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: isSelected ? 'none' : 'auto',
                                cursor: isSelected ? 'default' : 'pointer',
                                zIndex: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#000' : 'rgba(0, 0, 0, 0.05)',
                                fontSize: `${bubbleFontSize}px`,
                                fontFamily: 'Roboto, sans-serif',
                                textAlign: 'center',
                                padding: '4px 8px',
                                boxSizing: 'border-box',
                                userSelect: page7Box4Selected ? 'none' : 'auto',
                                WebkitUserSelect: page7Box4Selected ? 'none' : 'auto'
                              }}
                            >
                            </div>
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
                              <path
                                d={speechBubblePath}
                                fill={isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                                style={{ fill: isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                              />
                              <g className="speech-bubble-border-group">
                                <path
                                  d={leftBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={triangleLeftLegPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={triangleRightLegPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={rightBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={topBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </g>
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
                      {/* Box 2 - triangle points downward */}
                      {(() => {
                        const boxLeft = 51.94
                        const boxTop = 54.45
                        const boxWidth = 25.18
                        const boxHeight = 7.51
                        const dot1X = 56.29
                        const dot1Y = 61.96
                        const dot2X = 62.09
                        const dot2Y = 61.96
                        const dot3X = 51.13
                        const dot3Y = 64.45
                        // Box 2 is selected if it's clicked OR if box 4 is selected (showing 7.1.png)
                        const isSelected = page7Box2Selected || page7Box4Selected
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        // Move box 2 top edge down by 4px (reduce height)
                        const topDownOffsetPx = 4
                        const topDownOffsetPercent = imageNaturalSize.height > 0 ? (topDownOffsetPx / imageNaturalSize.height) * 100 : 0
                        // Move box 2 bottom edge up by 8px (reduce height)
                        const heightReductionPx = 8
                        const heightReductionPercent = imageNaturalSize.height > 0 ? (heightReductionPx / imageNaturalSize.height) * 100 : 0
                        
                        // Move box 2 left edge to the right by 5px and right edge to the left by 4px (reduce width)
                        const leftEdgeRightPx = 5
                        const rightEdgeLeftPx = 4
                        const leftEdgeRightPercent = imageNaturalSize.width > 0 ? (leftEdgeRightPx / imageNaturalSize.width) * 100 : 0
                        const rightEdgeLeftPercent = imageNaturalSize.width > 0 ? (rightEdgeLeftPx / imageNaturalSize.width) * 100 : 0
                        const totalWidthReductionPercent = leftEdgeRightPercent + rightEdgeLeftPercent
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust + leftEdgeRightPercent)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust + topDownOffsetPercent)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust - totalWidthReductionPercent)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust - heightReductionPercent)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        // Move dot 1 to the right by 2px
                        const dot1RightOffsetPx = 2
                        const dot1RightOffsetPercent = imageNaturalSize.width > 0 ? (dot1RightOffsetPx / imageNaturalSize.width) * 100 : 0
                        const adjustedDot1X = dot1X + dot1RightOffsetPercent
                        
                        // Calculate triangle - it extends DOWNWARD from the bottom edge (between dot1 and dot2) to dot3
                        const triangleBaseLeft = adjustedDot1X
                        const triangleBaseRight = dot2X
                        const triangleBaseY = adjustedTop + expandedHeight
                        const triangleTipX = dot3X
                        const triangleTipY = dot3Y
                        
                        const borderRadiusPx = Math.min(15, Math.max(6, 15 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                        const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                        const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                        const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                        
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
                        
                        const leftBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                          ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${bottomY}` : ''}
                        `
                        
                        const triangleLeftLegPath = `
                          M ${triangleBaseLeftWrapper},${bottomY}
                          L ${triangleTipXWrapper},${triangleTipYWrapper}
                        `
                        const triangleRightLegPath = `
                          M ${triangleBaseRightWrapper},${bottomY}
                          L ${triangleTipXWrapper},${triangleTipYWrapper}
                        `
                        
                        const rightBorderPath = `
                          M ${triangleBaseRightWrapper},${bottomY}
                          ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${bottomY}` : ''}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const topBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          L ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        return (
                          <div 
                            className={`speech-bubble-wrapper ${isSelected ? 'has-selected' : ''}`}
                            style={buttonStyle}
                          >
                            <div
                              className={`speech-bubble-box ${isSelected ? 'disabled selected' : ''}`}
                              onClick={!isSelected ? handlePage7Box2 : undefined}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: isSelected ? 'none' : 'auto',
                                cursor: isSelected ? 'default' : 'pointer',
                                zIndex: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#000' : 'rgba(0, 0, 0, 0.05)',
                                fontSize: `${bubbleFontSize}px`,
                                fontFamily: 'Roboto, sans-serif',
                                textAlign: 'center',
                                padding: '4px 8px',
                                boxSizing: 'border-box',
                                userSelect: page7Box4Selected ? 'none' : 'auto',
                                WebkitUserSelect: page7Box4Selected ? 'none' : 'auto'
                              }}
                            >
                            </div>
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
                              <path
                                d={speechBubblePath}
                                fill={isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                                style={{ fill: isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                              />
                              <g className="speech-bubble-border-group">
                                <path
                                  d={leftBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={triangleLeftLegPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={triangleRightLegPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={rightBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={topBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </g>
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
                      {/* Box 3 - triangle points upward */}
                      {(() => {
                        const boxLeft = 12.74
                        const boxTop = 69.77
                        const boxWidth = 47.26
                        const boxHeight = 5.25
                        const dot1X = 21.85
                        const dot1Y = 69.77
                        const dot2X = 32.44
                        const dot2Y = 69.77
                        const dot3X = 35.81
                        const dot3Y = 67.06
                        // Box 3 is selected if it's clicked OR if box 4 is selected (showing 7.1.png)
                        const isSelected = page7Box3Selected || page7Box4Selected
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const bubbleFontSize = Math.min(16, Math.max(6, 16 * stageRelativeScale))
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        // Move box 3 top edge down by 3px (reduce height)
                        const topDownOffsetPx = 3
                        const topDownOffsetPercent = imageNaturalSize.height > 0 ? (topDownOffsetPx / imageNaturalSize.height) * 100 : 0
                        // Move box 3 bottom edge up by 4px (reduce height)
                        const heightReductionPx = 7  // 3px from top + 4px from bottom
                        const heightReductionPercent = imageNaturalSize.height > 0 ? (heightReductionPx / imageNaturalSize.height) * 100 : 0
                        
                        // Move box 3 left edge to the right by 3px and right edge to the left by 5px (reduce width)
                        const leftEdgeRightPx = 3
                        const rightEdgeLeftPx = 5
                        const leftEdgeRightPercent = imageNaturalSize.width > 0 ? (leftEdgeRightPx / imageNaturalSize.width) * 100 : 0
                        const rightEdgeLeftPercent = imageNaturalSize.width > 0 ? (rightEdgeLeftPx / imageNaturalSize.width) * 100 : 0
                        const totalWidthReductionPercent = leftEdgeRightPercent + rightEdgeLeftPercent
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust + leftEdgeRightPercent)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust + topDownOffsetPercent)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust - totalWidthReductionPercent)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust - heightReductionPercent)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        // Calculate triangle - it extends UPWARD from the top edge (between dot1 and dot2) to dot3
                        const triangleBaseLeft = dot1X
                        const triangleBaseRight = dot2X
                        const triangleBaseY = boxTop
                        const triangleTipX = dot3X
                        const triangleTipY = dot3Y
                        
                        const borderRadiusPx = Math.min(15, Math.max(6, 15 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const triangleBaseLeftWrapper = ((triangleBaseLeft - adjustedLeft) / expandedWidth) * 100
                        const triangleBaseRightWrapper = ((triangleBaseRight - adjustedLeft) / expandedWidth) * 100
                        const triangleTipXWrapper = ((triangleTipX - adjustedLeft) / expandedWidth) * 100
                        const triangleTipYWrapper = ((triangleTipY - adjustedTop) / expandedHeight) * 100
                        
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
                        
                        const leftBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${bottomY}
                          Q ${topLeft},${bottomY} ${topLeft},${bottomY - borderRadiusWrapperY}
                          L ${topLeft},${topY + borderRadiusWrapperY}
                          Q ${topLeft},${topY} ${topLeft + borderRadiusWrapperX},${topY}
                          ${triangleBaseLeftWrapper > topLeft + borderRadiusWrapperX ? `L ${triangleBaseLeftWrapper},${topY}` : ''}
                        `
                        
                        const triangleLeftLegPath = `
                          M ${triangleBaseLeftWrapper},${topY}
                          L ${triangleTipXWrapper},${triangleTipYWrapper}
                        `
                        const triangleRightLegPath = `
                          M ${triangleBaseRightWrapper},${topY}
                          L ${triangleTipXWrapper},${triangleTipYWrapper}
                        `
                        
                        const rightBorderPath = `
                          M ${triangleBaseRightWrapper},${topY}
                          ${triangleBaseRightWrapper < topRight - borderRadiusWrapperX ? `L ${topRight - borderRadiusWrapperX},${topY}` : ''}
                          Q ${topRight},${topY} ${topRight},${topY + borderRadiusWrapperY}
                          L ${topRight},${bottomY - borderRadiusWrapperY}
                          Q ${topRight},${bottomY} ${topRight - borderRadiusWrapperX},${bottomY}
                        `
                        
                        const bottomBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                        `
                        
                        return (
                          <div 
                            className={`speech-bubble-wrapper ${isSelected ? 'has-selected' : ''}`}
                            style={buttonStyle}
                          >
                            <div
                              className={`speech-bubble-box ${isSelected ? 'disabled selected' : ''}`}
                              onClick={!isSelected ? handlePage7Box3 : undefined}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: isSelected ? 'none' : 'auto',
                                cursor: isSelected ? 'default' : 'pointer',
                                zIndex: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#000' : 'rgba(0, 0, 0, 0.05)',
                                fontSize: `${bubbleFontSize}px`,
                                fontFamily: 'Roboto, sans-serif',
                                textAlign: 'center',
                                padding: '4px 8px',
                                boxSizing: 'border-box',
                                userSelect: page7Box4Selected ? 'none' : 'auto',
                                WebkitUserSelect: page7Box4Selected ? 'none' : 'auto'
                              }}
                            >
                            </div>
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
                              <path
                                d={speechBubblePath}
                                fill={isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)'}
                                style={{ fill: isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.95)' }}
                              />
                              <g className="speech-bubble-border-group">
                                <path
                                  d={leftBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={triangleLeftLegPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={triangleRightLegPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={rightBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={bottomBorderPath}
                                  fill="none"
                                  stroke={isSelected ? "#ff8c00" : "#0d6efd"}
                                  strokeWidth={isSelected ? "2" : "1"}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </g>
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
                      {/* Box 4 - no pointer, simple rounded rectangle */}
                      {(() => {
                        const boxLeft = 8.23
                        const boxTop = 38.78
                        const boxWidth = 15.49
                        const boxHeight = 4.21
                        const isSelected = page7Box4Selected
                        // Box 4 is disabled on 7.png until boxes 1, 2, and 3 are all selected
                        // Box 4 is always active on 7.1.png
                        const allBoxesSelected = page7Box1Selected && page7Box2Selected && page7Box3Selected
                        const isDisabled = page7Box4Selected ? false : !allBoxesSelected
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        // Move box 4 down by 30px (50px - 15px - 5px)
                        const downOffsetPx = 30
                        const downOffsetPercent = imageNaturalSize.height > 0 ? (downOffsetPx / imageNaturalSize.height) * 100 : 0
                        
                        // Move box 4 top edge down by 6px (7px - 1px) and bottom edge up by 3px (reduce height)
                        const topDownOffsetPx = 6  // 7px - 1px (moved up 1px)
                        const topDownOffsetPercent = imageNaturalSize.height > 0 ? (topDownOffsetPx / imageNaturalSize.height) * 100 : 0
                        const heightReductionPx = 9  // 6px from top + 3px from bottom
                        const heightReductionPercent = imageNaturalSize.height > 0 ? (heightReductionPx / imageNaturalSize.height) * 100 : 0
                        
                        // Move box 4 left edge to the right by 6px and right edge to the left by 6px (5px + 1px) (reduce width)
                        const leftEdgeRightPx = 6
                        const rightEdgeLeftPx = 6
                        const leftEdgeRightPercent = imageNaturalSize.width > 0 ? (leftEdgeRightPx / imageNaturalSize.width) * 100 : 0
                        const rightEdgeLeftPercent = imageNaturalSize.width > 0 ? (rightEdgeLeftPx / imageNaturalSize.width) * 100 : 0
                        const totalWidthReductionPercent = leftEdgeRightPercent + rightEdgeLeftPercent
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust + leftEdgeRightPercent)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust + topDownOffsetPercent + downOffsetPercent)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust - totalWidthReductionPercent)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust - heightReductionPercent)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        const borderRadiusPx = Math.min(8, Math.max(3, 8 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const roundedRectPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                          Z
                        `
                        
                        const leftBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                        `
                        
                        const rightBorderPath = `
                          M ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const topBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          L ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const bottomBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                        `
                        
                        // Determine stroke color and width for box 4
                        const isHovered = page7Box4Hovered && !isDisabled
                        // Box 4 is always blue, no orange, but gray when disabled
                        const strokeColor = isDisabled ? "#999999" : "#0d6efd"
                        // When showing 7.1.png (page7Box4Selected is true), box 4 shows thin edge unless hovered
                        // On 7.png: thin (1px) when not selected/not hovered, thick (2px) when selected or hovered
                        // On 7.1.png: thin (1px) always unless hovered, then thick (2px)
                        const strokeWidth = page7Box4Selected 
                          ? (isHovered ? "2" : "1")  // On 7.1.png: thin unless hovered
                          : ((isSelected || isHovered) ? "2" : "1")  // On 7.png: normal behavior
                        
                        // Box 4 should pulse when all boxes are selected but box 4 is not yet selected
                        const shouldPulse = allBoxesSelected && !isSelected && !page7Box4Selected
                        
                        return (
                          <div 
                            className={`speech-bubble-wrapper ${shouldPulse ? '' : 'no-pulse'}`}
                            style={{...buttonStyle, zIndex: 12}}
                            onMouseEnter={() => !isDisabled && setPage7Box4Hovered(true)}
                            onMouseLeave={() => !isDisabled && setPage7Box4Hovered(false)}
                          >
                            <div
                              className={`speech-bubble-box ${isSelected ? 'disabled selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                              onClick={!isDisabled ? handlePage7Box4 : undefined}
                              onMouseEnter={() => !isDisabled && setPage7Box4Hovered(true)}
                              onMouseLeave={() => !isDisabled && setPage7Box4Hovered(false)}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: isDisabled ? 'none' : 'auto',
                                cursor: isDisabled ? 'not-allowed' : (isSelected ? 'default' : 'pointer'),
                                zIndex: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#000' : 'rgba(0, 0, 0, 0.05)',
                                fontSize: `${Math.min(16, Math.max(6, 16 * stageRelativeScale))}px`,
                                fontFamily: 'Roboto, sans-serif',
                                textAlign: 'center',
                                padding: '4px 8px',
                                boxSizing: 'border-box',
                                opacity: isDisabled ? 0.5 : 1,
                                userSelect: page7Box4Selected ? 'none' : 'auto',
                                WebkitUserSelect: page7Box4Selected ? 'none' : 'auto'
                              }}
                            >
                            </div>
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
                              <path
                                d={roundedRectPath}
                                fill="transparent"
                                style={{ fill: 'transparent' }}
                              />
                              <g className="speech-bubble-border-group">
                                <path
                                  d={leftBorderPath}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeWidth}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={rightBorderPath}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeWidth}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={topBorderPath}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeWidth}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={bottomBorderPath}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeWidth}
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </g>
                            </svg>
                          </div>
                        )
                      })()}
                      {/* White box on 7.png - displayed over box 4 until all boxes 1-3 are selected */}
                      {currentPage === 6 && !editorMode && !page7Box4Selected && !(page7Box1Selected && page7Box2Selected && page7Box3Selected) && (() => {
                        const boxLeft = 5.21
                        const boxTop = 39.66
                        const boxWidth = 21.12
                        const boxHeight = 7.76
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        const borderRadiusPx = Math.min(8, Math.max(3, 8 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const roundedRectPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                          Z
                        `
                        
                        return (
                          <div 
                            className="speech-bubble-wrapper no-pulse"
                            style={{...buttonStyle, zIndex: 14}}
                          >
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
                                zIndex: 14
                              }}
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <defs>
                              </defs>
                              <path
                                d={roundedRectPath}
                                fill="#ffffff"
                                style={{ fill: '#ffffff' }}
                              />
                            </svg>
                          </div>
                        )
                      })()}
                    </>
                  )}
                  {/* Button boxes on 7.1.png only */}
                  {currentPage === 6 && !editorMode && page7Box4Selected && (
                    <>
                      {/* Button box */}
                      {(() => {
                        const boxLeft = 44.28
                        const boxTop = 57.58
                        const boxWidth = 7.16
                        const boxHeight = 2.00
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        // Reduce button box height by 5px and width by 15px, then additional reductions
                        const heightReductionPx = 5
                        const widthReductionPx = 15
                        // Additional reductions for height and width
                        const additionalHeightReductionPx = 5  // Increased from 3px to 5px
                        const additionalWidthReductionPx = 5
                        const totalHeightReductionPx = heightReductionPx + additionalHeightReductionPx
                        const totalWidthReductionPx = widthReductionPx + additionalWidthReductionPx
                        const heightReductionPercent = imageNaturalSize.height > 0 ? (totalHeightReductionPx / imageNaturalSize.height) * 100 : 0
                        const widthReductionPercent = imageNaturalSize.width > 0 ? (totalWidthReductionPx / imageNaturalSize.width) * 100 : 0
                        
                        // Move button box: right 10px, then left 4px, then right 3px (net: right 9px), and down 10px
                        const rightOffsetPx = 10
                        const leftOffsetPx = 4
                        const additionalRightOffsetPx = 3
                        const downOffsetPx = 10
                        const rightOffsetPercent = imageNaturalSize.width > 0 ? (rightOffsetPx / imageNaturalSize.width) * 100 : 0
                        const leftOffsetPercent = imageNaturalSize.width > 0 ? (leftOffsetPx / imageNaturalSize.width) * 100 : 0
                        const additionalRightOffsetPercent = imageNaturalSize.width > 0 ? (additionalRightOffsetPx / imageNaturalSize.width) * 100 : 0
                        const downOffsetPercent = imageNaturalSize.height > 0 ? (downOffsetPx / imageNaturalSize.height) * 100 : 0
                        const netRightOffsetPercent = rightOffsetPercent - leftOffsetPercent + additionalRightOffsetPercent
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust + netRightOffsetPercent)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust + downOffsetPercent)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust - widthReductionPercent)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust - heightReductionPercent)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        // Reduced corner radius for button box only
                        const borderRadiusPx = Math.min(4, Math.max(2, 4 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const roundedRectPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                          Z
                        `
                        
                        const leftBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                        `
                        
                        const rightBorderPath = `
                          M ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const topBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          L ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const bottomBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                        `
                        
                        // Font size scales exactly with image using stageRelativeScale
                        const buttonFontSize = 10.5 * stageRelativeScale
                        
                        return (
                          <div 
                            className="speech-bubble-wrapper no-pulse"
                            style={buttonStyle}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: `${buttonFontSize}px`,
                                fontFamily: 'Roboto, sans-serif',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                boxSizing: 'border-box',
                                userSelect: 'none',
                                WebkitUserSelect: 'none'
                              }}
                            >
                              Button
                            </div>
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
                              <path
                                d={roundedRectPath}
                                fill="#099b4d"
                                style={{ fill: '#099b4d' }}
                              />
                              <g className="speech-bubble-border-group">
                                <path
                                  d={leftBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={rightBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={topBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={bottomBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </g>
                            </svg>
                          </div>
                        )
                      })()}
                      {/* Duplicate button box on 7.1.png - "Ground" button */}
                      {(() => {
                        const boxLeft = 44.28
                        const boxTop = 57.58
                        const boxWidth = 7.16
                        const boxHeight = 2.00
                        
                        const pixelIncrease = 3
                        const halfPixelIncrease = pixelIncrease / 2
                        const widthPercentAdjust = stageWidthPx > 0 ? (pixelIncrease / stageWidthPx) * 100 : 0
                        const heightPercentAdjust = stageHeightPx > 0 ? (pixelIncrease / stageHeightPx) * 100 : 0
                        const leftOffsetAdjust = stageWidthPx > 0 ? (halfPixelIncrease / stageWidthPx) * 100 : 0
                        const topOffsetAdjust = stageHeightPx > 0 ? (halfPixelIncrease / stageHeightPx) * 100 : 0
                        
                        // Reduce button box height by 5px and width by 15px, then additional reductions
                        const heightReductionPx = 5
                        const widthReductionPx = 15
                        // Additional reductions for height and width
                        const additionalHeightReductionPx = 5
                        const additionalWidthReductionPx = 5
                        const totalHeightReductionPx = heightReductionPx + additionalHeightReductionPx
                        const totalWidthReductionPx = widthReductionPx + additionalWidthReductionPx
                        const heightReductionPercent = imageNaturalSize.height > 0 ? (totalHeightReductionPx / imageNaturalSize.height) * 100 : 0
                        const widthReductionPercent = imageNaturalSize.width > 0 ? (totalWidthReductionPx / imageNaturalSize.width) * 100 : 0
                        
                        // Move button box: right 10px, then left 4px, then right 3px (net: right 9px), and down 10px
                        // Then for duplicate: left 25px (15px + 10px) and down 86px (50px + 40px - 4px)
                        const rightOffsetPx = 10
                        const leftOffsetPx = 4
                        const additionalRightOffsetPx = 3
                        const downOffsetPx = 10
                        const duplicateLeftOffsetPx = 25
                        const duplicateDownOffsetPx = 86
                        const rightOffsetPercent = imageNaturalSize.width > 0 ? (rightOffsetPx / imageNaturalSize.width) * 100 : 0
                        const leftOffsetPercent = imageNaturalSize.width > 0 ? (leftOffsetPx / imageNaturalSize.width) * 100 : 0
                        const additionalRightOffsetPercent = imageNaturalSize.width > 0 ? (additionalRightOffsetPx / imageNaturalSize.width) * 100 : 0
                        const downOffsetPercent = imageNaturalSize.height > 0 ? (downOffsetPx / imageNaturalSize.height) * 100 : 0
                        const duplicateLeftOffsetPercent = imageNaturalSize.width > 0 ? (duplicateLeftOffsetPx / imageNaturalSize.width) * 100 : 0
                        const duplicateDownOffsetPercent = imageNaturalSize.height > 0 ? (duplicateDownOffsetPx / imageNaturalSize.height) * 100 : 0
                        const netRightOffsetPercent = rightOffsetPercent - leftOffsetPercent + additionalRightOffsetPercent - duplicateLeftOffsetPercent
                        
                        const adjustedLeft = Math.max(0, boxLeft - leftOffsetAdjust + netRightOffsetPercent)
                        const adjustedTop = Math.max(0, boxTop - topOffsetAdjust + downOffsetPercent + duplicateDownOffsetPercent)
                        const expandedWidth = Math.min(100 - adjustedLeft, boxWidth + widthPercentAdjust - widthReductionPercent)
                        const expandedHeight = Math.min(100 - adjustedTop, boxHeight + heightPercentAdjust - heightReductionPercent)
                        const buttonStyle = getButtonStyle(adjustedLeft, adjustedTop, expandedWidth, expandedHeight)
                        
                        // Reduced corner radius for button box only
                        const borderRadiusPx = Math.min(4, Math.max(2, 4 * stageRelativeScale))
                        const wrapperWidthPx = (expandedWidth / 100) * stageWidthPx
                        const wrapperHeightPx = (expandedHeight / 100) * stageHeightPx
                        const borderRadiusWrapperX = Math.min(wrapperWidthPx > 0 ? (borderRadiusPx / wrapperWidthPx) * 100 : 0, 50)
                        const borderRadiusWrapperY = Math.min(wrapperHeightPx > 0 ? (borderRadiusPx / wrapperHeightPx) * 100 : 0, 50)
                        
                        const topLeft = 0
                        const topRight = 100
                        const topY = 0
                        const bottomY = 100
                        
                        const roundedRectPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                          Z
                        `
                        
                        const leftBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          Q ${topLeft},${topY} ${topLeft},${topY + borderRadiusWrapperY}
                          L ${topLeft},${bottomY - borderRadiusWrapperY}
                          Q ${topLeft},${bottomY} ${topLeft + borderRadiusWrapperX},${bottomY}
                        `
                        
                        const rightBorderPath = `
                          M ${topRight - borderRadiusWrapperX},${bottomY}
                          Q ${topRight},${bottomY} ${topRight},${bottomY - borderRadiusWrapperY}
                          L ${topRight},${topY + borderRadiusWrapperY}
                          Q ${topRight},${topY} ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const topBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${topY}
                          L ${topRight - borderRadiusWrapperX},${topY}
                        `
                        
                        const bottomBorderPath = `
                          M ${topLeft + borderRadiusWrapperX},${bottomY}
                          L ${topRight - borderRadiusWrapperX},${bottomY}
                        `
                        
                        // Font size scales exactly with image using stageRelativeScale
                        const buttonFontSize = 10.5 * stageRelativeScale
                        
                        return (
                          <div 
                            className="speech-bubble-wrapper no-pulse"
                            style={buttonStyle}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#595959',
                                fontSize: `${buttonFontSize}px`,
                                fontFamily: 'Roboto, sans-serif',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                boxSizing: 'border-box',
                                userSelect: 'none',
                                WebkitUserSelect: 'none'
                              }}
                            >
                              Ground
                            </div>
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
                              <path
                                d={roundedRectPath}
                                fill="#ffffff"
                                style={{ fill: '#ffffff' }}
                              />
                              <g className="speech-bubble-border-group">
                                <path
                                  d={leftBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={rightBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={topBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                                <path
                                  d={bottomBorderPath}
                                  fill="none"
                                  stroke="#595959"
                                  strokeWidth="1"
                                  className="speech-bubble-border"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </g>
                            </svg>
                          </div>
                        )
                      })()}
                    </>
                  )}
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
              className="btn-modern btn-nav btn-nav-previous"
              aria-label="Previous page"
            >
              Back
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
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
              (currentPage === 2 && (!page3ButtonClicked || !page3SecondButtonClicked)) ||
              (currentPage === 3 && !page4Button5Clicked) ||
              (currentPage === 4 && !page5GreenDotSelected) ||
              (currentPage === 5 && (!page6Button1Clicked || !page6Button2Clicked)) ||
              (currentPage === 6 && !page7Box4EverSelected)
            }
            className={`btn-modern btn-nav ${(currentPage === 2 && page3SecondButtonClicked && !returningToPage3AfterSecondButton) || (currentPage === 3 && page4Button5Clicked) || (currentPage === 4 && page5GreenDotSelected) || (currentPage === 5 && page6Button1Clicked && page6Button2Clicked) || (currentPage === 6 && page7Box4EverSelected) ? 'btn-nav-blue' : ''}`}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstructionsPanel

