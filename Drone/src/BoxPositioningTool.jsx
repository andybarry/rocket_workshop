import { useState, useRef } from 'react';
import './BoxPositioningTool.css';

function BoxPositioningTool({ zoomLevel = 1 }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 6;
  
  // Box state - position and size
  const [box, setBox] = useState({
    left: 20,  // percentage
    top: 20,   // percentage
    width: 200, // pixels
    height: 100 // pixels
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

  // Calculate box edges in percentage
  const getBoxEdges = () => {
    if (!imageRef.current) return { left: 0, right: 0, top: 0, bottom: 0 };
    const imgRect = imageRef.current.getBoundingClientRect();
    return {
      left: box.left,
      right: box.left + (box.width / imgRect.width) * 100,
      top: box.top,
      bottom: box.top + (box.height / imgRect.height) * 100
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
      
      // Get box size as percentage for boundary checking
      const boxWidthPercent = (box.width / imgRect.width) * 100;
      const boxHeightPercent = (box.height / imgRect.height) * 100;
      
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
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setBox(prev => {
        let newBox = { ...prev };
        const leftPx = (dragStart.boxLeft / 100) * imgRect.width;
        const topPx = (dragStart.boxTop / 100) * imgRect.height;
        
        if (resizeEdge === 'left') {
          const newWidth = Math.max(50, dragStart.boxWidth - deltaX);
          const widthDiff = dragStart.boxWidth - newWidth;
          newBox.width = newWidth;
          newBox.left = ((leftPx + widthDiff) / imgRect.width) * 100;
        } else if (resizeEdge === 'right') {
          newBox.width = Math.max(50, dragStart.boxWidth + deltaX);
        } else if (resizeEdge === 'top') {
          const newHeight = Math.max(30, dragStart.boxHeight - deltaY);
          const heightDiff = dragStart.boxHeight - newHeight;
          newBox.height = newHeight;
          newBox.top = ((topPx + heightDiff) / imgRect.height) * 100;
        } else if (resizeEdge === 'bottom') {
          newBox.height = Math.max(30, dragStart.boxHeight + deltaY);
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

  // Calculate pixel positions for display
  const getPixelPositions = () => {
    if (!imageRef.current) return { leftPx: 0, topPx: 0 };
    const imgRect = imageRef.current.getBoundingClientRect();
    const leftPx = Math.round((box.left / 100) * imgRect.width);
    const topPx = Math.round((box.top / 100) * imgRect.height);
    return { leftPx, topPx };
  };

  // Enhanced copy to clipboard with all triangle data
  const copyToClipboard = () => {
    const text = `{
  // Box positioning
  left: '${box.left.toFixed(2)}%',
  top: '${box.top.toFixed(2)}%',
  width: '${box.width}px',
  height: '${box.height}px',
  
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
  }
}`;
    navigator.clipboard.writeText(text);
    alert('Box and triangle values copied to clipboard!\nReady to paste into your code.');
  };

  // Reset box to default position
  const handleReset = () => {
    setBox({
      left: 20,
      top: 20,
      width: 200,
      height: 100
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
      style={{
        overflow: zoomLevel > 1 ? 'auto' : 'hidden'
      }}
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
          <div className="section-title">Box Size</div>
          <div className="value-row">
            <span className="label">width:</span>
            <span className="value">{box.width}px</span>
          </div>
          <div className="value-row">
            <span className="label">height:</span>
            <span className="value">{box.height}px</span>
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

        <button onClick={copyToClipboard} className="copy-button">
          📋 Copy for Code
        </button>
      </div>

      <div className="slide-wrapper" style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease'
      }}>
        <img 
          ref={imageRef}
          src={`/drone/workshop-slides/${currentSlide}-drone-instructions.png`}
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
            r="6"
            className="triangle-handle"
            onMouseDown={(e) => handleTriangleMouseDown(e, 0)}
          />
          <circle
            cx={`${triangle.point2.x}%`}
            cy={`${triangle.point2.y}%`}
            r="6"
            className="triangle-handle"
            onMouseDown={(e) => handleTriangleMouseDown(e, 1)}
          />
          <circle
            cx={`${triangle.point3.x}%`}
            cy={`${triangle.point3.y}%`}
            r="6"
            className="triangle-handle tip"
            onMouseDown={(e) => handleTriangleMouseDown(e, 2)}
          />
        </svg>
        
        {/* Draggable/Resizable Box */}
        <div
          className={`position-box ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
          style={{
            left: `${box.left}%`,
            top: `${box.top}%`,
            width: `${box.width}px`,
            height: `${box.height}px`
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
