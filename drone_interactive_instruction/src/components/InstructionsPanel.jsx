import { useState, useRef, useEffect, useCallback } from 'react'
import './InstructionsPanel.css'
import page1 from '../assets/images/pages/1.png'
import page2 from '../assets/images/pages/2.png'
import page3 from '../assets/images/pages/3.png'
import page4 from '../assets/images/pages/4.png'
import page5 from '../assets/images/pages/5.png'

function InstructionsPanel({ editorMode, onDimensionsCapture }) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [hasStarted, setHasStarted] = useState(false)
  // Track which pages have been visited/completed (button clicked)
  const [visitedPages, setVisitedPages] = useState(new Set())
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
  const pageWrapperRef = useRef(null)
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
  
  useEffect(() => {
    const updateContainerSize = () => {
      if (pageWrapperRef.current) {
        const rect = pageWrapperRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    
    updateContainerSize()
    
    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize()
    })
    
    if (pageWrapperRef.current) {
      resizeObserver.observe(pageWrapperRef.current)
    }
    
    // Also listen to window resize
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
    if (!pageWrapperRef.current || !imgRef.current) return null
    
    const wrapperRect = pageWrapperRef.current.getBoundingClientRect()
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

  return (
    <div className={`instructions-panel ${zoom === 100 ? 'no-scrollbars' : ''} ${editorMode ? 'editor-mode' : ''}`}>
      <div className="instructions-background">
        <div className="instructions-content">
          <div className={`page-container ${zoom === 100 ? 'no-scrollbars' : ''}`}>
            <div className="page-wrapper">
              <div 
                className="page-stage"
                ref={pageWrapperRef}
                style={{ cursor: editorMode ? 'default' : 'default' }}
              >
                <img 
                  ref={imgRef}
                  src={pages[currentPage]} 
                  alt={`Instruction page ${currentPage + 1}`}
                  className="instruction-page"
                  style={{ 
                    transform: `scale(${zoom / 100})`, 
                    transformOrigin: 'center center',
                    height: '100%',
                    width: 'auto',
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
                  const isDisabled = visitedPages.has(0)
                  const buttonStyle = getButtonStyle(buttonLeft, buttonTop, buttonWidth, buttonHeight)
                  
                  return (
                    <button 
                      onClick={handleStart}
                      disabled={isDisabled}
                      className={`page-start-button ${isDisabled ? 'disabled' : ''}`}
                      style={{
                        ...buttonStyle,
                        width: `calc(${buttonWidth}% + 3px)`,
                        border: '2px solid #0d6efd',
                        backgroundColor: 'white',
                        color: '#0d6efd',
                        cursor: isDisabled ? 'default' : 'pointer'
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
                  const isDisabled = visitedPages.has(1)
                  const buttonStyle = getButtonStyle(buttonLeft, buttonTop, buttonWidth, buttonHeight)
                  
                  return (
                    <button 
                      onClick={handlePage1Button}
                      disabled={isDisabled}
                      className={`page-start-button ${isDisabled ? 'disabled' : ''}`}
                      style={{
                        ...buttonStyle,
                        border: '2px solid #0d6efd',
                        backgroundColor: 'white',
                        color: 'black',
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '10px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        boxSizing: 'border-box',
                        cursor: isDisabled ? 'default' : 'pointer'
                      }}
                      aria-label="I'm ready to build a drone controller"
                    >
                      I'm ready to build a drone controller
                    </button>
                  )
                })()}
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

