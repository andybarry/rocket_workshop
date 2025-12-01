import { useState, useRef, useEffect, useCallback } from 'react'
import './InstructionsPanel.css'
import page1 from '../assets/images/pages/1.png'
import page2 from '../assets/images/pages/2.png'
import page3 from '../assets/images/pages/3.png'
import page4 from '../assets/images/pages/4.png'
import page5 from '../assets/images/pages/5.png'

const DEFAULT_PAGE_ASPECT = 0.75
const STAGE_FRAME_PADDING = 6
const START_BUTTON_SMALL_THRESHOLD = 80 // px width threshold to shrink border

function InstructionsPanel({ editorMode, onDimensionsCapture }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [hasStarted, setHasStarted] = useState(false)
  // Track which pages have been visited/completed (button clicked)
  const [visitedPages, setVisitedPages] = useState(new Set())
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
  const stageRef = useRef(null)
  const stageFrameRef = useRef(null)
  const imgRef = useRef(null)
  const boxRef = useRef(null)
  const pages = [page1, page2, page3, page4, page5]

  const handlePrevious = () => {
    if (currentPage > 0) {
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
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      setZoom(100)
    }
  }

  const handleStart = () => {
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
    // Mark page 1 as visited
    setVisitedPages(prev => new Set(prev).add(1))
    // Move to next page
    if (currentPage < pages.length - 1) {
      setCurrentPage(prev => prev + 1)
      setZoom(100)
    }
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
      const dimensions = {
        page: currentPage + 1,
        left: boxPosition.left.toFixed(2),
        top: boxPosition.top.toFixed(2),
        width: boxPosition.width.toFixed(2),
        height: boxPosition.height.toFixed(2),
        right: (boxPosition.left + boxPosition.width).toFixed(2),
        bottom: (boxPosition.top + boxPosition.height).toFixed(2)
      }
      onDimensionsCapture(dimensions)
    }
  }, [editorMode, currentPage, boxPosition]) // Update when mode, page, or position changes

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


  // Handle mouse down on box or resize handle
  const handleBoxMouseDown = (e) => {
    if (!editorMode) return
    
    const handle = e.target.dataset.handle
    if (handle && ['n', 's', 'e', 'w'].includes(handle)) {
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

  // Handle mouse move for dragging or resizing
  const handleMouseMove = useCallback((e) => {
    if (!editorMode) return
    
    const coords = getRelativeCoordinates(e.clientX, e.clientY)
    if (!coords) return

    if (isDragging) {
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
  }, [editorMode, isDragging, isResizing, resizeHandle, dragStart, boxStart, zoom])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
      // Dimensions will be updated by the useEffect watching boxPosition
    }
  }, [isDragging, isResizing])

  // Set up global mouse event listeners
  useEffect(() => {
    if (editorMode && (isDragging || isResizing)) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [editorMode, isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Update dimensions whenever box position changes (debounced after drag/resize)
  useEffect(() => {
    if (editorMode && !isDragging && !isResizing) {
      const timeoutId = setTimeout(() => {
        const dimensions = {
          page: currentPage + 1,
          left: boxPosition.left.toFixed(2),
          top: boxPosition.top.toFixed(2),
          width: boxPosition.width.toFixed(2),
          height: boxPosition.height.toFixed(2),
          right: (boxPosition.left + boxPosition.width).toFixed(2),
          bottom: (boxPosition.top + boxPosition.height).toFixed(2)
        }
        onDimensionsCapture(dimensions)
      }, 100) // Small delay to batch updates
      
      return () => clearTimeout(timeoutId)
    }
  }, [boxPosition, editorMode, isDragging, isResizing, currentPage, onDimensionsCapture])

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
                  {editorMode && (
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
                    </div>
                  )}
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
                        className={`page-start-button ${isDisabled ? 'disabled' : ''} ${isDisabled ? 'selected' : ''}`}
                        style={{
                          ...expandedButtonStyle,
                          backgroundColor: 'white',
                          color: '#0d6efd',
                          cursor: isDisabled ? 'default' : 'pointer',
                          fontSize: `${startFontSize}px`,
                          fontFamily: 'Roboto, sans-serif'
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
                    const isDisabled = visitedPages.has(1)
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
                        className={`page-start-button ${isDisabled ? 'disabled' : ''} ${isDisabled ? 'selected' : ''}`}
                        style={{
                          ...expandedButtonStyle,
                          backgroundColor: 'white',
                          color: '#0d6efd',
                          cursor: isDisabled ? 'default' : 'pointer',
                          fontSize: `${readyFontSize}px`,
                          fontFamily: 'Roboto, sans-serif'
                        }}
                        aria-label="I'm ready to build a drone controller"
                      >
                        I'm ready to build a drone controller
                      </button>
                    )
                  })()}
                  {/* White boxes on page 2 (2.png) */}
                  {currentPage === 1 && !editorMode && visitedPages.has(0) && (() => {
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
              (currentPage === 1 && !visitedPages.has(1))
            }
            className="btn-modern btn-nav"
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

