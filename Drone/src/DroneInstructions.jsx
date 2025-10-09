import { useState, useEffect } from 'react';
import './DroneInstructions.css';

function DroneInstructions({ zoomLevel = 1 }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 6;
  
  // Track which checkboxes have been checked for each slide
  const [checkedBoxes, setCheckedBoxes] = useState({});
  
  // Track which boxes are locked (not yet available) - for 2 second delay on pages 3, 4, 5
  const [lockedBoxes, setLockedBoxes] = useState({});
  
  // Initialize locked boxes when entering pages 3, 4, or 5
  useEffect(() => {
    if (currentSlide === 3) {
      // Lock boxes 1 and 2 initially
      setLockedBoxes({
        'callout-3-1': true,
        'callout-3-2': true
      });
    } else if (currentSlide === 4) {
      // Lock boxes 1 and 3 initially
      setLockedBoxes({
        'callout-4-1': true,
        'callout-4-3': true
      });
    } else if (currentSlide === 5) {
      // Lock boxes 2 and 3 initially (box 1 is auto-hide)
      setLockedBoxes({
        'callout-5-2': true,
        'callout-5-3': true
      });
    } else {
      // Clear locks on other pages
      setLockedBoxes({});
    }
  }, [currentSlide]);
  
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
      { x: 1.35, y: 6.29 } // Optional checkbox at 15.85%, 57.18%
    ]
  };
  
  // Define interactive callouts - using pixel measurements from actual image
  // Adjust these values to match exactly by visual inspection
  const calloutPositionsBySlide = {
    3: [
      {
        left: '7.87%',
        top: '28.70%',
        width: '20.78%',
        height: '6.17%',
        triangle: {
          point1: {
            x: '16.25%',
            y: '28.70%',
            edge: 'top'
          },
          point2: {
            x: '11.23%',
            y: '28.70%',
            edge: 'top'
          },
          point3: {
            x: '17.40%',
            y: '25.66%'
          }
        },
        cssClass: 'callout-page3-box1'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '63.76%',
        top: '35.90%',
        width: '24.25%',
        height: '6.00%',
        
        // Lines from box to point
        lines: [
          {
            point1: { x: '67.36%', y: '41.91%' },
            point2: { x: '59.54%', y: '44.42%' }
          },
          {
            point1: { x: '73.18%', y: '41.91%' },
            point2: { x: '59.54%', y: '44.42%' }
          },
          {
            point1: { x: '66.92%', y: '41.57%' },
            point2: { x: '73.18%', y: '41.57%' },
            color: 'white',
            width: 4,
            zIndex: 20
          },
          {
            point1: { x: '66.92%', y: '41.91%' },
            point2: { x: '73.18%', y: '41.91%' },
            color: 'white',
            width: 10,
            zIndex: 30
          }
        ],
        
        // CSS Helper Values (for border gap between triangle contact points)
        css: {
          imageSize: '457px × 591px',
          trianglePoint1InBox: '13.06%', // from box left edge
          trianglePoint2InBox: '38.85%', // from box left edge
          borderGapLeftSegment: 'right: 86.94%', // Use in ::before
          borderGapRightSegment: 'left: 38.85%' // Use in ::after
        },
        
        cssClass: 'callout-page3-box2'
      },
      {
        left: '10.96%',
        top: '45.38%',
        width: '78.05%',
        height: '45.44%',
        cssClass: 'callout-page3-box3'
      }
    ],
    4: [
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '20.75%',
        top: '19.81%',
        width: '23.63%',
        height: '3.97%',
        
        // Line from box to point
        lines: [
          {
            point1: { x: '44.23%', y: '21.43%' },
            point2: { x: '50.51%', y: '19.29%' }
          },
          {
            point1: { x: '44.23%', y: '20.41%' },
            point2: { x: '50.51%', y: '19.29%' }
          }
        ],
        
        cssClass: 'callout-page4-box1'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '74.59%',
        top: '33.98%',
        width: '20.58%',
        height: '21.97%',
        
        // Line from box to point
        lines: [
          {
            point1: { x: '74.59%', y: '42.97%' },
            point2: { x: '71.70%', y: '39.25%' }
          },
          {
            point1: { x: '74.59%', y: '38.12%' },
            point2: { x: '71.70%', y: '39.25%' }
          }
        ],
        
        cssClass: 'callout-page4-box2'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '1.90%',
        top: '31.73%',
        width: '69.33%',
        height: '27.50%',
        cssClass: 'callout-page4-box3'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '20.22%',
        top: '64.66%',
        width: '58.75%',
        height: '7.31%',
        cssClass: 'callout-page4-box4'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '5.33%',
        top: '72.11%',
        width: '87.87%',
        height: '19.83%',
        cssClass: 'callout-page4-box5'
      }
    ],
    5: [
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '13.53%',
        top: '24.88%',
        width: '72.92%',
        height: '26.69%',
        cssClass: 'callout-page5-box0'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // No-edge auto-hide box that hides when box 0 is selected
        left: '18.25%',
        top: '52.82%',
        width: '64.01%',
        height: '4.26%',
        cssClass: 'callout-page5-box1'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '20.50%',
        top: '58.76%',
        width: '26.76%',
        height: '4.46%',
        
        // Line from box to point
        lines: [
          {
            point1: { x: '24.55%', y: '63.22%' },
            point2: { x: '16.80%', y: '65.83%' }
          },
          {
            point1: { x: '31.06%', y: '63.22%' },
            point2: { x: '16.80%', y: '65.83%' }
          }
        ],
        
        cssClass: 'callout-page5-box2'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        left: '19.25%',
        top: '76.26%',
        width: '29.26%',
        height: '9.29%',
        
        // Line from box to point
        lines: [
          {
            point1: { x: '31.06%', y: '76.26%' },
            point2: { x: '16.67%', y: '67.57%' }
          },
          {
            point1: { x: '24.05%', y: '76.26%' },
            point2: { x: '16.67%', y: '67.57%' }
          }
        ],
        
        cssClass: 'callout-page5-box3'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // No-edge box that displays when box 3 is selected
        left: '51.96%',
        top: '81.07%',
        width: '36.42%',
        height: '9.00%',
        cssClass: 'callout-page5-box4'
      }
    ]
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
    
    // Special case for page 4: Only require boxes 1, 2, and 4 (indices 0, 1, 3)
    // Boxes 3 and 5 (indices 2, 4) are auto-hide boxes
    if (currentSlide === 4) {
      const requiredBoxes = [0, 1, 3]; // Box 1 (top), Box 2 (middle right), Box 4 (bottom edge)
      const allRequiredChecked = requiredBoxes.every(index => {
        const calloutKey = `callout-4-${index}`;
        return checkedBoxes[calloutKey] === true;
      });
      return allRequiredChecked;
    }
    
    // Special case for page 5: Only require box 3 (bottom edge box, index 3)
    // Box 1 and 4 are auto-hide/auto-show boxes
    if (currentSlide === 5) {
      const requiredBoxes = [3]; // Box 3 (bottom edge)
      const allRequiredChecked = requiredBoxes.every(index => {
        const calloutKey = `callout-5-${index}`;
        return checkedBoxes[calloutKey] === true;
      });
      return allRequiredChecked;
    }
    
    // Only check if current slide has callouts (large blue boxes)
    const callouts = calloutPositionsBySlide[currentSlide];
    if (callouts && callouts.length > 0) {
      const allCalloutsChecked = callouts.every((_, index) => {
        const calloutKey = `callout-${currentSlide}-${index}`;
        return checkedBoxes[calloutKey] === true;
      });
      if (!allCalloutsChecked) return false;
    }
    
    return true; // Can proceed if no callout required
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (slideNumber, checkboxIndex) => {
    const checkboxKey = `${slideNumber}-${checkboxIndex}`;
    setCheckedBoxes(prev => ({
      ...prev,
      [checkboxKey]: !prev[checkboxKey]
    }));
  };
  
  // Handle callout toggle with sequential order enforcement for page 3, page 4, and page 5
  const handleCalloutToggle = (slideNumber, calloutIndex) => {
    // Check if box is locked (waiting for delay)
    const calloutKey = `callout-${slideNumber}-${calloutIndex}`;
    if (lockedBoxes[calloutKey]) {
      return; // Don't allow clicking locked boxes
    }
    
    // For page 3, enforce sequential selection order
    if (slideNumber === 3) {
      // Check if previous boxes are selected
      if (calloutIndex === 1) {
        // Box 2 - require box 1 (top left) to be selected first
        const box0Key = `callout-3-0`;
        if (!checkedBoxes[box0Key]) {
          return; // Don't allow clicking box 1 until box 0 is selected
        }
      } else if (calloutIndex === 2) {
        // Large bottom box - require boxes 0 and 1 to be selected first
        const box0Key = `callout-3-0`;
        const box1Key = `callout-3-1`;
        if (!checkedBoxes[box0Key] || !checkedBoxes[box1Key]) {
          return; // Don't allow clicking box 2 until boxes 0 and 1 are selected
        }
      }
    }
    
    // For page 4, enforce sequential selection order
    if (slideNumber === 4) {
      if (calloutIndex === 1) {
        // Box 2 (middle right) - require box 1 (top) to be selected first
        const box0Key = `callout-4-0`;
        if (!checkedBoxes[box0Key]) {
          return; // Don't allow clicking box 2 until box 1 is selected
        }
      } else if (calloutIndex === 3) {
        // Box 4 (bottom edge) - require boxes 1 and 2 to be selected first
        const box0Key = `callout-4-0`;
        const box1Key = `callout-4-1`;
        if (!checkedBoxes[box0Key] || !checkedBoxes[box1Key]) {
          return; // Don't allow clicking box 4 until boxes 1 and 2 are selected
        }
      }
      // Boxes 2 and 4 (no-edge boxes) are not clickable - they auto-hide
      if (calloutIndex === 2 || calloutIndex === 4) {
        return; // Don't allow clicking auto-hide boxes
      }
    }
    
    // For page 5, enforce sequential selection order
    if (slideNumber === 5) {
      // Box 1 is auto-hide box (not clickable)
      if (calloutIndex === 1) {
        return; // Don't allow clicking auto-hide box
      }
      if (calloutIndex === 2) {
        // Box 2 - require box 0 to be selected first
        const box0Key = `callout-5-0`;
        if (!checkedBoxes[box0Key]) {
          return; // Don't allow clicking box 2 until box 0 is selected
        }
      } else if (calloutIndex === 3) {
        // Box 3 - require boxes 0 and 2 to be selected first
        const box0Key = `callout-5-0`;
        const box2Key = `callout-5-2`;
        if (!checkedBoxes[box0Key] || !checkedBoxes[box2Key]) {
          return; // Don't allow clicking box 3 until boxes 0 and 2 are selected
        }
      }
    }
    
    // Update the checked state immediately (hide the box)
    setCheckedBoxes(prev => ({
      ...prev,
      [calloutKey]: !prev[calloutKey]
    }));
    
    // For pages 3, 4, and 5, lock the next box and unlock it after 2 seconds
    if (slideNumber === 3 || slideNumber === 4 || slideNumber === 5) {
      let nextBoxKey = null;
      
      // Determine which box is next in the sequence
      if (slideNumber === 3) {
        if (calloutIndex === 0) {
          nextBoxKey = 'callout-3-1'; // Unlock box 1 after box 0 is clicked
        } else if (calloutIndex === 1) {
          nextBoxKey = 'callout-3-2'; // Unlock box 2 after box 1 is clicked
        }
      } else if (slideNumber === 4) {
        if (calloutIndex === 0) {
          nextBoxKey = 'callout-4-1'; // Unlock box 1 after box 0 is clicked
        } else if (calloutIndex === 1) {
          nextBoxKey = 'callout-4-3'; // Unlock box 3 after box 1 is clicked
        }
      } else if (slideNumber === 5) {
        if (calloutIndex === 0) {
          nextBoxKey = 'callout-5-2'; // Unlock box 2 after box 0 is clicked (box 1 is auto-hide)
        } else if (calloutIndex === 2) {
          nextBoxKey = 'callout-5-3'; // Unlock box 3 after box 2 is clicked
        }
      }
      
      // If there's a next box, unlock it after 0.75 seconds
      if (nextBoxKey) {
        setTimeout(() => {
          setLockedBoxes(prev => ({
            ...prev,
            [nextBoxKey]: false
          }));
        }, 750); // 0.75 second delay
      }
    }
  };

  // Reset all checkboxes and callouts on all pages
  const handleReset = () => {
    // Clear all checked boxes across all slides
    setCheckedBoxes({});
    
    // Re-initialize locked boxes for the current slide
    if (currentSlide === 3) {
      setLockedBoxes({
        'callout-3-1': true,
        'callout-3-2': true
      });
    } else if (currentSlide === 4) {
      setLockedBoxes({
        'callout-4-1': true,
        'callout-4-3': true
      });
    } else if (currentSlide === 5) {
      setLockedBoxes({
        'callout-5-2': true,
        'callout-5-3': true
      });
    } else {
      setLockedBoxes({});
    }
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
    >
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
            let isSelected = checkedBoxes[calloutKey] || false;
            
            // Special case: On page 4, auto-hide box 3 (large no-edge box) when box 2 is selected
            if (currentSlide === 4 && index === 2) {
              isSelected = isSelected || checkedBoxes[`callout-4-1`] || false;
            }
            
            // Special case: On page 4, auto-hide box 5 (bottom no-edge box) when box 4 is selected
            if (currentSlide === 4 && index === 4) {
              isSelected = isSelected || checkedBoxes[`callout-4-3`] || false;
            }
            
            // Special case: On page 5, auto-hide box 1 (no-edge box) when box 0 is selected
            if (currentSlide === 5 && index === 1) {
              isSelected = isSelected || checkedBoxes[`callout-5-0`] || false;
            }
            
            // Special case: On page 5, hide box 4 (no-edge box) when box 3 is selected
            // Box is visible until box 3 is selected
            if (currentSlide === 5 && index === 4) {
              isSelected = isSelected || checkedBoxes[`callout-5-3`] || false;
            }
            
            // For page 3, page 4, and page 5, check if box is available based on sequential order
            let isDisabled = false;
            if (currentSlide === 3) {
              if (index === 1) {
                // Box 1 requires box 0 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-3-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 2) {
                // Box 2 (large bottom box) requires boxes 0 and 1 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-3-0`] || !checkedBoxes[`callout-3-1`] || (lockedBoxes[calloutKey] === true);
              }
            }
            if (currentSlide === 4) {
              if (index === 1) {
                // Box 2 (middle right) requires box 1 (top) to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-4-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 3) {
                // Box 4 (bottom edge) requires boxes 1 and 2 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-4-0`] || !checkedBoxes[`callout-4-1`] || (lockedBoxes[calloutKey] === true);
              }
              // Boxes 2 and 4 are auto-hide boxes (not interactive)
              if (index === 2 || index === 4) {
                isDisabled = true; // Always disabled - they auto-hide
              }
            }
            if (currentSlide === 5) {
              // Box 1 is auto-hide box (not interactive)
              if (index === 1) {
                isDisabled = true; // Always disabled - auto-hides
              } else if (index === 2) {
                // Box 2 requires box 0 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-5-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 3) {
                // Box 3 requires boxes 0 and 2 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-5-0`] || !checkedBoxes[`callout-5-2`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 4) {
                // Box 4 is auto-show box (not interactive)
                isDisabled = true; // Always disabled - auto-shows
              }
            }
            
            return (
              <div
                key={calloutKey}
                className={`callout-overlay ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${callout.triangle ? 'no-default-pointer' : ''} ${callout.pointerAngle ? `pointer-${callout.pointerAngle}` : ''} ${callout.cssClass || ''}`}
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
        
        {/* Custom SVG triangle pointers - rendered at slide level for proper positioning */}
        {calloutPositionsBySlide[currentSlide] && 
          calloutPositionsBySlide[currentSlide].map((callout, index) => {
            if (!callout.triangle) return null;
            
            const calloutKey = `callout-${currentSlide}-${index}`;
            const isSelected = checkedBoxes[calloutKey] || false;
            
            // For page 3, page 4, and page 5, check if box is available based on sequential order
            let isDisabled = false;
            if (currentSlide === 3) {
              if (index === 1) {
                // Box 1 requires box 0 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-3-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 2) {
                // Box 2 (large bottom box) requires boxes 0 and 1 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-3-0`] || !checkedBoxes[`callout-3-1`] || (lockedBoxes[calloutKey] === true);
              }
            }
            if (currentSlide === 4) {
              if (index === 1) {
                // Box 2 (middle right) requires box 1 (top) to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-4-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 3) {
                // Box 4 (bottom edge) requires boxes 1 and 2 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-4-0`] || !checkedBoxes[`callout-4-1`] || (lockedBoxes[calloutKey] === true);
              }
              // Boxes 2 and 4 are auto-hide boxes (not interactive)
              if (index === 2 || index === 4) {
                isDisabled = true; // Always disabled - they auto-hide
              }
            }
            if (currentSlide === 5) {
              // Box 1 is auto-hide box (not interactive)
              if (index === 1) {
                isDisabled = true; // Always disabled - auto-hides
              } else if (index === 2) {
                // Box 2 requires box 0 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-5-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 3) {
                // Box 3 requires boxes 0 and 2 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-5-0`] || !checkedBoxes[`callout-5-2`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 4) {
                // Box 4 is auto-show box (not interactive)
                isDisabled = true; // Always disabled - auto-shows
              }
            }
            
            // Calculate bounding box for the triangle
            const p1x = parseFloat(callout.triangle.point1.x);
            const p1y = parseFloat(callout.triangle.point1.y);
            const p2x = parseFloat(callout.triangle.point2.x);
            const p2y = parseFloat(callout.triangle.point2.y);
            const p3x = parseFloat(callout.triangle.point3.x);
            const p3y = parseFloat(callout.triangle.point3.y);
            
            // Find min/max for bounding box
            const minX = Math.min(p1x, p2x, p3x);
            const maxX = Math.max(p1x, p2x, p3x);
            const minY = Math.min(p1y, p2y, p3y);
            const maxY = Math.max(p1y, p2y, p3y);
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Convert points to be relative to the bounding box
            const relP1x = p1x - minX;
            const relP1y = p1y - minY;
            const relP2x = p2x - minX;
            const relP2y = p2y - minY;
            const relP3x = p3x - minX;
            const relP3y = p3y - minY;
            
            return (
              <svg 
                key={`triangle-${calloutKey}`} 
                className="callout-triangle-overlay"
                style={{
                  left: `${minX}%`,
                  top: `${minY}%`,
                  width: `${width}%`,
                  height: `${height}%`
                }}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
              >
                <polyline
                  points={`${relP1x},${relP1y} ${relP3x},${relP3y} ${relP2x},${relP2y}`}
                  className={`callout-triangle-shape ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            );
          })
        }
        
        {/* Custom SVG line pointers - rendered at slide level for proper positioning */}
        {calloutPositionsBySlide[currentSlide] && 
          calloutPositionsBySlide[currentSlide].map((callout, index) => {
            if (!callout.lines) return null;
            
            const calloutKey = `callout-${currentSlide}-${index}`;
            const isSelected = checkedBoxes[calloutKey] || false;
            
            // For page 3, page 4, and page 5, check if box is available based on sequential order
            let isDisabled = false;
            if (currentSlide === 3) {
              if (index === 1) {
                isDisabled = !checkedBoxes[`callout-3-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 2) {
                isDisabled = !checkedBoxes[`callout-3-0`] || !checkedBoxes[`callout-3-1`] || (lockedBoxes[calloutKey] === true);
              }
            }
            if (currentSlide === 4) {
              if (index === 1) {
                // Box 2 (middle right) requires box 1 (top) to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-4-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 3) {
                // Box 4 (bottom edge) requires boxes 1 and 2 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-4-0`] || !checkedBoxes[`callout-4-1`] || (lockedBoxes[calloutKey] === true);
              }
              // Boxes 2 and 4 are auto-hide boxes (not interactive)
              if (index === 2 || index === 4) {
                isDisabled = true; // Always disabled - they auto-hide
              }
            }
            if (currentSlide === 5) {
              // Box 1 is auto-hide box (not interactive)
              if (index === 1) {
                isDisabled = true; // Always disabled - auto-hides
              } else if (index === 2) {
                // Box 2 requires box 0 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-5-0`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 3) {
                // Box 3 requires boxes 0 and 2 to be selected AND not be locked
                isDisabled = !checkedBoxes[`callout-5-0`] || !checkedBoxes[`callout-5-2`] || (lockedBoxes[calloutKey] === true);
              } else if (index === 4) {
                // Box 4 is auto-show box (not interactive)
                isDisabled = true; // Always disabled - auto-shows
              }
            }
            
            // Render all lines for this callout
            return callout.lines.map((line, lineIndex) => {
              const p1x = parseFloat(line.point1.x);
              const p1y = parseFloat(line.point1.y);
              const p2x = parseFloat(line.point2.x);
              const p2y = parseFloat(line.point2.y);
              
              // Find bounding box for the line
              const minX = Math.min(p1x, p2x);
              const maxX = Math.max(p1x, p2x);
              const minY = Math.min(p1y, p2y);
              const maxY = Math.max(p1y, p2y);
              
              const width = maxX - minX;
              const height = maxY - minY;
              
              // Convert points to be relative to the bounding box
              const relP1x = p1x - minX;
              const relP1y = p1y - minY;
              const relP2x = p2x - minX;
              const relP2y = p2y - minY;
              
              return (
                <svg 
                  key={`line-${calloutKey}-${lineIndex}`} 
                  className="callout-line-overlay"
                  style={{
                    left: `${minX}%`,
                    top: `${minY}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    zIndex: line.zIndex || undefined
                  }}
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="none"
                >
                  <line
                    x1={relP1x}
                    y1={relP1y}
                    x2={relP2x}
                    y2={relP2y}
                    className={`callout-line-shape ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    vectorEffect="non-scaling-stroke"
                    style={{
                      stroke: line.color || undefined,
                      strokeWidth: line.width || undefined
                    }}
                  />
                </svg>
              );
            });
          })
        }
        </div>
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
        aria-label="Reset all selections on all pages"
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