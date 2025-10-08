import { useState } from 'react';
import './DroneInstructions.css';

function DroneInstructions({ zoomLevel = 1 }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 6;
  
  // Track which checkboxes have been checked for each slide
  const [checkedBoxes, setCheckedBoxes] = useState({});
  
  // Define checkbox positions for each slide (X, Y in inches on 8.5x11 page)
  const checkboxPositionsBySlide = {
    3: [
      { x: 1.8, y: 6.47 },
      { x: 3.59, y: 6.47 },
      { x: 5.43, y: 6.47 },
      { x: 6.82, y: 6.48 },
      { x: 6.83, y: 8.27 },
      { x: 5.39, y: 8.27 },
      { x: 3.59, y: 8.27 },
      { x: 1.77, y: 8.27 },
      { x: 3.58, y: 9.79 },
      { x: 5.4, y: 9.8 }
    ],
    4: [
      { x: 2.78, y: 2.59 }
    ],
  };
  
  // Define interactive callouts - using pixel measurements from actual image
  // Adjust these values to match exactly by visual inspection
  const calloutPositionsBySlide = {
    // Slide 5 callout removed
  };

  const handlePrevious = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  
  // Check if user can proceed to next slide
  const canProceed = () => {
    if (currentSlide >= totalSlides) return false;
    
    // Check if current slide has checkboxes
    const checkboxes = checkboxPositionsBySlide[currentSlide];
    if (checkboxes && checkboxes.length > 0) {
      const allCheckboxesChecked = checkboxes.every((_, index) => {
        const checkboxKey = `${currentSlide}-${index}`;
        return checkedBoxes[checkboxKey] === true;
      });
      if (!allCheckboxesChecked) return false;
    }
    
    // Check if current slide has callouts
    const callouts = calloutPositionsBySlide[currentSlide];
    if (callouts && callouts.length > 0) {
      const allCalloutsChecked = callouts.every((_, index) => {
        const calloutKey = `callout-${currentSlide}-${index}`;
        return checkedBoxes[calloutKey] === true;
      });
      if (!allCalloutsChecked) return false;
    }
    
    return true; // Can proceed if no checkbox or callout required
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (slideNumber, checkboxIndex) => {
    const checkboxKey = `${slideNumber}-${checkboxIndex}`;
    setCheckedBoxes(prev => ({
      ...prev,
      [checkboxKey]: !prev[checkboxKey]
    }));
  };
  
  // Handle callout toggle
  const handleCalloutToggle = (slideNumber, calloutIndex) => {
    const calloutKey = `callout-${slideNumber}-${calloutIndex}`;
    setCheckedBoxes(prev => ({
      ...prev,
      [calloutKey]: !prev[calloutKey]
    }));
  };

  // Reset all checkboxes and return to page 1
  const handleReset = () => {
    setCheckedBoxes({});
    setCurrentSlide(1);
  };
  
  // Auto-complete all selections on current page
  const handleCompletePage = () => {
    const newCheckedBoxes = { ...checkedBoxes };
    
    // Check all checkboxes on current slide
    const checkboxes = checkboxPositionsBySlide[currentSlide];
    if (checkboxes) {
      checkboxes.forEach((_, index) => {
        const checkboxKey = `${currentSlide}-${index}`;
        newCheckedBoxes[checkboxKey] = true;
      });
    }
    
    // Check all callouts on current slide
    const callouts = calloutPositionsBySlide[currentSlide];
    if (callouts) {
      callouts.forEach((_, index) => {
        const calloutKey = `callout-${currentSlide}-${index}`;
        newCheckedBoxes[calloutKey] = true;
      });
    }
    
    setCheckedBoxes(newCheckedBoxes);
  };

  // Keyboard navigation
  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <div 
      className="instructions-container" 
      onKeyDown={handleKeyPress}
      tabIndex={0}
      style={{
        overflow: zoomLevel > 1 ? 'auto' : 'hidden'
      }}
    >
      <div className="slide-wrapper" style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease'
      }}>
        <img 
          src={`/drone/workshop-slides/${currentSlide}-drone-instructions.png`}
          alt={`Drone instructions slide ${currentSlide}`}
          className="slide-image"
        />
        
        {/* Checkbox overlays - only show on slides with defined checkboxes */}
        {checkboxPositionsBySlide[currentSlide] && 
          checkboxPositionsBySlide[currentSlide].map((position, index) => {
            const checkboxKey = `${currentSlide}-${index}`;
            const xPercent = (position.x / 8.5) * 100;
            const yPercent = (position.y / 11) * 100;
            
            return (
              <input
                key={checkboxKey}
                type="checkbox"
                checked={checkedBoxes[checkboxKey] || false}
                onChange={() => handleCheckboxChange(currentSlide, index)}
                className="checkbox-input"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`
                }}
              />
            );
          })
        }
        
        {/* Callout overlays - simple CSS-based approach */}
        {calloutPositionsBySlide[currentSlide] && 
          calloutPositionsBySlide[currentSlide].map((callout, index) => {
            const calloutKey = `callout-${currentSlide}-${index}`;
            const isSelected = checkedBoxes[calloutKey] || false;
            
            return (
              <div
                key={calloutKey}
                className={`callout-overlay ${isSelected ? 'selected' : ''} pointer-${callout.pointerAngle}`}
                onClick={() => handleCalloutToggle(currentSlide, index)}
                style={{
                  left: callout.left,
                  top: callout.top,
                  width: callout.width,
                  height: callout.height,
                  '--pointer-left': callout.pointerLeft
                }}
              />
            );
          })
        }
      </div>

      <div className="navigation-controls">
        <button 
          onClick={handlePrevious}
          disabled={currentSlide === 1}
          className="nav-arrow left-arrow"
          aria-label="Previous slide"
        >
          ← Previous
        </button>

        <span className="slide-counter">
          {currentSlide} / {totalSlides}
        </span>

        <button 
          onClick={handleNext}
          disabled={!canProceed()}
          className="nav-arrow right-arrow"
          aria-label="Next slide"
        >
          Next →
        </button>
      </div>

      {/* Slide indicator dots */}
      <div className="slide-indicators">
        {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slide) => (
          <button
            key={slide}
            className={`indicator-dot ${currentSlide === slide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(slide)}
            aria-label={`Go to slide ${slide}`}
          />
        ))}
      </div>

      {/* Reset button */}
      <button 
        onClick={handleReset}
        className="reset-button"
        aria-label="Reset all checkboxes and return to page 1"
      >
        Reset
      </button>
      
      {/* Complete Page button - bottom right */}
      <button 
        onClick={handleCompletePage}
        className="complete-page-button"
        aria-label="Auto-complete all selections on current page"
        disabled={canProceed()}
      >
        ✓ Complete Page
      </button>
    </div>
  );
}

export default DroneInstructions;