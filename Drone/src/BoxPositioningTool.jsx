import { useState, useRef } from 'react';
import './BoxPositioningTool.css';

function BoxPositioningTool({ zoomLevel = 1 }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 8;
  
  // Box state - position and size (all percentages for consistency)
  const [box, setBox] = useState({
    left: 20,  // percentage
    top: 20,   // percentage
    width: 20, // percentage
    height: 9  // percentage
  });
  
  // Triangle pointer state - positions relative to image (%)
  const [triangle, setTriangle] = useState({
    point1: { x: 30, y: 30, edge: 'bottom' }, // On box edge
    point2: { x: 35, y: 30, edge: 'bottom' }, // On box edge
    point3: { x: 32.5, y: 40 } // Free point (tip of arrow)
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingTriangle, setIsDraggingTriangle] = useState(false);
  const [trianglePointIndex, setTrianglePointIndex] = useState(null);
  const [resizeEdge, setResizeEdge] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, boxLeft: 0, boxTop: 0 });
  const imageRef = useRef(null);

  const handlePrevious = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Calculate box edges in percentage (all percentages now)
  const getBoxEdges = () => {
    if (!imageRef.current) return { left: 0, right: 0, top: 0, bottom: 0 };
    return {
      left: box.left,
      right: box.left + box.width,
      top: box.top,
      bottom: box.top + box.height
    };
  };

  // Constrain point to nearest box edge and detect which edge
  const constrainToBoxEdge = (x, y) => {
    const edges = getBoxEdges();
    
    // Calculate distances to each edge
    const distToTop = Math.abs(y - edges.top);
    const distToBottom = Math.abs(y - edges.bottom);
    const distToLeft = Math.abs(x - edges.left);
    const distToRight = Math.abs(x - edges.right);
    
    // Find the minimum distance
    const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
    
    // Snap to the nearest edge
    if (minDist === distToTop) {
      return { 
        x: Math.max(edges.left, Math.min(edges.right, x)), 
        y: edges.top, 
        edge: 'top' 
      };
    } else if (minDist === distToBottom) {
      return { 
        x: Math.max(edges.left, Math.min(edges.right, x)), 
        y: edges.bottom, 
        edge: 'bottom' 
      };
    } else if (minDist === distToLeft) {
      return { 
        x: edges.left, 
        y: Math.max(edges.top, Math.min(edges.bottom, y)), 
        edge: 'left' 
      };
    } else {
      return { 
        x: edges.right, 
        y: Math.max(edges.top, Math.min(edges.bottom, y)), 
        edge: 'right' 
      };
    }
  };

  // Start dragging triangle point
  const handleTriangleMouseDown = (e, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTriangle(true);
    setTrianglePointIndex(pointIndex);
  };

  // Start dragging the box
  const handleBoxMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) return;
    e.preventDefault();
    
    if (!imageRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      boxLeft: box.left,
      boxTop: box.top
    });
  };

  // Start resizing
  const handleResizeMouseDown = (e, edge) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageRef.current) return;
    
    setIsResizing(true);
    setResizeEdge(edge);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      boxLeft: box.left,
      boxTop: box.top,
      boxWidth: box.width,
      boxHeight: box.height
    });
  };

  // Handle mouse move - smooth dragging
  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    
    const imgRect = imageRef.current.getBoundingClientRect();
    
    if (isDragging) {
      // Calculate the delta in pixels
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Convert delta to percentage
      const deltaXPercent = (deltaX / imgRect.width) * 100;
      const deltaYPercent = (deltaY / imgRect.height) * 100;
      
      // Calculate new position
      const newLeft = dragStart.boxLeft + deltaXPercent;
      const newTop = dragStart.boxTop + deltaYPercent;
      
      // Box size is already in percentages
      const boxWidthPercent = box.width;
      const boxHeightPercent = box.height;
      
      // Clamp to image boundaries
      const clampedLeft = Math.max(0, Math.min(100 - boxWidthPercent, newLeft));
      const clampedTop = Math.max(0, Math.min(100 - boxHeightPercent, newTop));
      
      // Move triangle with box
      const deltaLeft = clampedLeft - box.left;
      const deltaTop = clampedTop - box.top;
      
      setBox(prev => ({ ...prev, left: clampedLeft, top: clampedTop }));
      setTriangle(prev => ({
        point1: { ...prev.point1, x: prev.point1.x + deltaLeft, y: prev.point1.y + deltaTop },
        point2: { ...prev.point2, x: prev.point2.x + deltaLeft, y: prev.point2.y + deltaTop },
        point3: { x: prev.point3.x + deltaLeft, y: prev.point3.y + deltaTop }
      }));
    } else if (isResizing) {
      // Calculate the delta in pixels then convert to percentage
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Convert delta to percentage
      const deltaXPercent = (deltaX / imgRect.width) * 100;
      const deltaYPercent = (deltaY / imgRect.height) * 100;
      
      setBox(prev => {
        let newBox = { ...prev };
        
        if (resizeEdge === 'left') {
          const newWidth = Math.max(5, dragStart.boxWidth - deltaXPercent);
          const widthDiff = dragStart.boxWidth - newWidth;
          newBox.width = newWidth;
          newBox.left = dragStart.boxLeft + widthDiff;
        } else if (resizeEdge === 'right') {
          newBox.width = Math.max(5, dragStart.boxWidth + deltaXPercent);
        } else if (resizeEdge === 'top') {
          const newHeight = Math.max(3, dragStart.boxHeight - deltaYPercent);
          const heightDiff = dragStart.boxHeight - newHeight;
          newBox.height = newHeight;
          newBox.top = dragStart.boxTop + heightDiff;
        } else if (resizeEdge === 'bottom') {
          newBox.height = Math.max(3, dragStart.boxHeight + deltaYPercent);
        }
        
        return newBox;
      });
    } else if (isDraggingTriangle && trianglePointIndex !== null) {
      // Calculate mouse position as percentage
      const mouseX = ((e.clientX - imgRect.left) / imgRect.width) * 100;
      const mouseY = ((e.clientY - imgRect.top) / imgRect.height) * 100;
      
      setTriangle(prev => {
        const newTriangle = { ...prev };
        const pointKey = `point${trianglePointIndex + 1}`;
        
        if (trianglePointIndex < 2) {
          // Points 1 and 2 can move around all box edges
          const constrained = constrainToBoxEdge(mouseX, mouseY);
          newTriangle[pointKey] = constrained;
        } else {
          // Point 3 is free
          newTriangle[pointKey] = { x: mouseX, y: mouseY };
        }
        
        return newTriangle;
      });
    }
  };

  // Stop dragging/resizing
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeEdge(null);
    setIsDraggingTriangle(false);
    setTrianglePointIndex(null);
  };

  // Calculate pixel positions for display (for reference only)
  const getPixelPositions = () => {
    if (!imageRef.current) return { leftPx: 0, topPx: 0, widthPx: 0, heightPx: 0 };
    const imgRect = imageRef.current.getBoundingClientRect();
    // Account for zoom level - display unscaled pixel positions
    const unscaledWidth = imgRect.width / zoomLevel;
    const unscaledHeight = imgRect.height / zoomLevel;
    const leftPx = Math.round((box.left / 100) * unscaledWidth);
    const topPx = Math.round((box.top / 100) * unscaledHeight);
    const widthPx = Math.round((box.width / 100) * unscaledWidth);
    const heightPx = Math.round((box.height / 100) * unscaledHeight);
    return { leftPx, topPx, widthPx, heightPx };
  };

  // Enhanced copy to clipboard with all triangle data (all percentages)
  const copyToClipboard = () => {
    // Calculate triangle points relative to box (for border gap calculation)
    // Now much simpler since everything is in percentages!
    const point1RelativeToBox = ((triangle.point1.x - box.left) / box.width) * 100;
    const point2RelativeToBox = ((triangle.point2.x - box.left) / box.width) * 100;
    
    // Calculate gap positions for CSS (right% for left segment, left% for right segment)
    const leftSegmentEndsAt = 100 - point1RelativeToBox; // right: X%
    const rightSegmentStartsAt = point2RelativeToBox; // left: X%
    
    const imgRect = imageRef.current?.getBoundingClientRect();
    const imgWidth = imgRect ? Math.round(imgRect.width / zoomLevel) : 0;
    const imgHeight = imgRect ? Math.round(imgRect.height / zoomLevel) : 0;
    
    const text = `{
  // Box positioning (all percentages for consistency and responsiveness)
  left: '${box.left.toFixed(2)}%',
  top: '${box.top.toFixed(2)}%',
  width: '${box.width.toFixed(2)}%',
  height: '${box.height.toFixed(2)}%',
  
  // Triangle pointer
  triangle: {
    point1: {
      x: '${triangle.point1.x.toFixed(2)}%',
      y: '${triangle.point1.y.toFixed(2)}%',
      edge: '${triangle.point1.edge}'
    },
    point2: {
      x: '${triangle.point2.x.toFixed(2)}%',
      y: '${triangle.point2.y.toFixed(2)}%',
      edge: '${triangle.point2.edge}'
    },
    point3: {
      x: '${triangle.point3.x.toFixed(2)}%',
      y: '${triangle.point3.y.toFixed(2)}%'
    }
  },
  
  // CSS Helper Values (for border gap between triangle contact points)
  css: {
    imageSize: '${imgWidth}px × ${imgHeight}px',
    trianglePoint1InBox: '${point1RelativeToBox.toFixed(2)}%', // from box left edge
    trianglePoint2InBox: '${point2RelativeToBox.toFixed(2)}%', // from box left edge
    borderGapLeftSegment: 'right: ${leftSegmentEndsAt.toFixed(2)}%', // Use in ::before
    borderGapRightSegment: 'left: ${rightSegmentStartsAt.toFixed(2)}%' // Use in ::after
  }
}`;
    navigator.clipboard.writeText(text);
    alert('Box and triangle values copied to clipboard!\n✅ All percentages - easy to implement!\n✅ Includes CSS border gap values.');
  };

  // Reset box to default position
  const handleReset = () => {
    setBox({
      left: 20,
      top: 20,
      width: 20,
      height: 9
    });
    setTriangle({
      point1: { x: 30, y: 30, edge: 'bottom' },
      point2: { x: 35, y: 30, edge: 'bottom' },
      point3: { x: 32.5, y: 40 }
    });
    setCurrentSlide(1);
  };

  return (
    <div 
      className={`positioning-tool-container ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Value Display - Top Right */}
      <div className="value-display">
        <h3>Box Values (Slide {currentSlide})</h3>
        
        <div className="value-section">
          <div className="section-title">Box Position (%)</div>
          <div className="value-row">
            <span className="label">left:</span>
            <span className="value">{box.left.toFixed(2)}%</span>
          </div>
          <div className="value-row">
            <span className="label">top:</span>
            <span className="value">{box.top.toFixed(2)}%</span>
          </div>
        </div>

        <div className="value-section">
          <div className="section-title">Box Position (px)</div>
          <div className="value-row">
            <span className="label">left:</span>
            <span className="value">{getPixelPositions().leftPx}px</span>
          </div>
          <div className="value-row">
            <span className="label">top:</span>
            <span className="value">{getPixelPositions().topPx}px</span>
          </div>
        </div>

        <div className="value-section">
          <div className="section-title">Box Size (%)</div>
          <div className="value-row">
            <span className="label">width:</span>
            <span className="value">{box.width.toFixed(2)}%</span>
          </div>
          <div className="value-row">
            <span className="label">height:</span>
            <span className="value">{box.height.toFixed(2)}%</span>
          </div>
        </div>

        <div className="value-section">
          <div className="section-title">Box Size (px reference)</div>
          <div className="value-row">
            <span className="label">width:</span>
            <span className="value">{getPixelPositions().widthPx}px</span>
          </div>
          <div className="value-row">
            <span className="label">height:</span>
            <span className="value">{getPixelPositions().heightPx}px</span>
          </div>
        </div>

        <div className="value-section triangle-section">
          <div className="section-title">Triangle Points (%)</div>
          <div className="value-row">
            <span className="label">Point 1:</span>
            <span className="value">
              x: {triangle.point1.x.toFixed(2)}%, y: {triangle.point1.y.toFixed(2)}%
            </span>
          </div>
          <div className="value-row sub-row">
            <span className="label">edge:</span>
            <span className="value">{triangle.point1.edge}</span>
          </div>
          <div className="value-row">
            <span className="label">Point 2:</span>
            <span className="value">
              x: {triangle.point2.x.toFixed(2)}%, y: {triangle.point2.y.toFixed(2)}%
            </span>
          </div>
          <div className="value-row sub-row">
            <span className="label">edge:</span>
            <span className="value">{triangle.point2.edge}</span>
          </div>
          <div className="value-row">
            <span className="label">Point 3 (tip):</span>
            <span className="value">
              x: {triangle.point3.x.toFixed(2)}%, y: {triangle.point3.y.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="value-section css-helper-section">
          <div className="section-title">CSS Border Gap Helper</div>
          <div className="value-row">
            <span className="label">Point1 in box:</span>
            <span className="value">
              {(((triangle.point1.x - box.left) / box.width) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="value-row">
            <span className="label">Point2 in box:</span>
            <span className="value">
              {(((triangle.point2.x - box.left) / box.width) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="value-row sub-row">
            <span className="label">Left segment:</span>
            <span className="value css-code">
              right: {(100 - ((triangle.point1.x - box.left) / box.width) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="value-row sub-row">
            <span className="label">Right segment:</span>
            <span className="value css-code">
              left: {(((triangle.point2.x - box.left) / box.width) * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <button onClick={copyToClipboard} className="copy-button">
          📋 Copy for Code
        </button>
      </div>

      <div style={{
        width: `${100 * zoomLevel}%`,
        height: `${100 * zoomLevel}%`,
        display: 'inline-block',
        transition: 'all 0.3s ease'
      }}>
        <div className="slide-wrapper" style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.3s ease'
        }}>
        <img 
          ref={imageRef}
          src={currentSlide === 6
            ? `/drone/workshop-slides/6.1-drone-instructions.png`
            : currentSlide === 8
            ? `/drone/workshop-slides/10-drone-instructions.png`
            : `/drone/workshop-slides/${currentSlide}-drone-instructions.png`}
          alt={`Drone instructions slide ${currentSlide}`}
          className="slide-image"
          draggable="false"
        />
        
        {/* SVG for triangle */}
        <svg className="triangle-overlay">
          <polygon
            points={`${triangle.point1.x}%,${triangle.point1.y}% ${triangle.point2.x}%,${triangle.point2.y}% ${triangle.point3.x}%,${triangle.point3.y}%`}
            className="triangle-shape"
          />
          
          {/* Lines connecting red dot to blue dots */}
          <line
            x1={`${triangle.point3.x}%`}
            y1={`${triangle.point3.y}%`}
            x2={`${triangle.point1.x}%`}
            y2={`${triangle.point1.y}%`}
            className="triangle-line"
          />
          <line
            x1={`${triangle.point3.x}%`}
            y1={`${triangle.point3.y}%`}
            x2={`${triangle.point2.x}%`}
            y2={`${triangle.point2.y}%`}
            className="triangle-line"
          />
          
          {/* Draggable triangle points */}
          <circle
            cx={`${triangle.point1.x}%`}
            cy={`${triangle.point1.y}%`}
            r="4"
            className="triangle-handle"
            onMouseDown={(e) => handleTriangleMouseDown(e, 0)}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx={`${triangle.point2.x}%`}
            cy={`${triangle.point2.y}%`}
            r="4"
            className="triangle-handle"
            onMouseDown={(e) => handleTriangleMouseDown(e, 1)}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx={`${triangle.point3.x}%`}
            cy={`${triangle.point3.y}%`}
            r="4"
            className="triangle-handle tip"
            onMouseDown={(e) => handleTriangleMouseDown(e, 2)}
            style={{ cursor: 'pointer' }}
          />
        </svg>
        
        {/* Draggable/Resizable Box */}
        <div
          className={`position-box ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
          style={{
            left: `${box.left}%`,
            top: `${box.top}%`,
            width: `${box.width}%`,
            height: `${box.height}%`
          }}
          onMouseDown={handleBoxMouseDown}
        >
          {/* Resize handles */}
          <div 
            className="resize-handle left"
            onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
          />
          <div 
            className="resize-handle right"
            onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
          />
          <div 
            className="resize-handle top"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
          />
          <div 
            className="resize-handle bottom"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
          />
          <div className="box-label">Drag me!</div>
        </div>
        </div>
      </div>

      <div className="navigation-controls">
        <button 
          onClick={handlePrevious}
          disabled={currentSlide === 1}
          className="nav-arrow left-arrow"
        >
          ← Previous
        </button>

        <span className="slide-counter">
          {currentSlide} / {totalSlides}
        </span>

        <button 
          onClick={handleNext}
          disabled={currentSlide >= totalSlides}
          className="nav-arrow right-arrow"
        >
          Next →
        </button>
      </div>

      {/* Complete Page button - bottom right */}
      <button 
        onClick={handleReset}
        className="complete-page-button"
        aria-label="Reset box position and return to slide 1"
      >
        ✓ Complete Page
      </button>
    </div>
  );
}

export default BoxPositioningTool;
