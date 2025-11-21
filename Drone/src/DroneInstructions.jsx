import { useState, useEffect } from 'react';
import './DroneInstructions.css';

function DroneInstructions({ zoomLevel = 1 }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 8;
  
  // Track which checkboxes have been checked for each slide
  const [checkedBoxes, setCheckedBoxes] = useState({});
  
  // Track which boxes are locked (not yet available) - for 2 second delay on pages 3, 4, 5
  const [lockedBoxes, setLockedBoxes] = useState({});
  
  // Track whether page 6 shows wiring diagram (6.1) or breadboard (6)
  const [showPage6Wiring, setShowPage6Wiring] = useState(true);
  
  // Track whether box 5 on page 6.1 has been clicked (to hide it on subsequent visits to 6.1)
  const [page6Box0Clicked, setPage6Box0Clicked] = useState(false);
  
  // Track whether box 6 (no-edge box) should be hidden (delayed after box 0 is clicked)
  const [page6Box6Hidden, setPage6Box6Hidden] = useState(false);
  
  // Track whether box 7 (large no-edge box) should be hidden (delayed after box 0 is clicked)
  const [page6Box7Hidden, setPage6Box7Hidden] = useState(false);
  
  // Track whether box 8 (bottom no-edge box) should be hidden (delayed after box 0 is clicked)
  const [page6Box8Hidden, setPage6Box8Hidden] = useState(false);
  
  // Track whether toggle button should be shown on page 6.1
  const [showPage6ToggleButton, setShowPage6ToggleButton] = useState(false);
  
  // Track whether box 5 (no-edge box) on page 5 should be hidden (delayed)
  const [page5Box5Hidden, setPage5Box5Hidden] = useState(false);
  
  // Track whether page 8 shows 10 or 10.1 image
  const [showPage8Detail, setShowPage8Detail] = useState(false);
  
  // Initialize locked boxes when entering pages 3, 4, or 5, and reset page 6 state
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
      // Reset page 5 box 5 hidden state
      setPage5Box5Hidden(false);
    } else if (currentSlide === 6) {
      // Reset page 6 to show wiring diagram (6.1) when entering page 6
      setShowPage6Wiring(true);
      // Reset box 5 clicked state when entering page 6 from another page
      setPage6Box0Clicked(false);
      // Reset box 6, 7, and 8 hidden states
      setPage6Box6Hidden(false);
      setPage6Box7Hidden(false);
      setPage6Box8Hidden(false);
      // Reset toggle button visibility
      setShowPage6ToggleButton(false);
      // Lock boxes 2 and 5 initially (only box 0 is active, boxes 3 and 4 are always disabled)
      setLockedBoxes({
        'callout-6-2': true,
        'callout-6-5': true
      });
    } else if (currentSlide === 8) {
      // Reset page 8 to show 10 image when entering page 8
      setShowPage8Detail(false);
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
    ],
    5: [
      { x: 0.695, y: 7.31 } // Optional checkbox at 8.18%, 66.48%
    ],
    6: [
      { x: 2.31, y: 8.89 } // Optional checkbox at 27.23%, moved up slightly
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
      },
      {
        // Box 6 - No-edge auto-hide box that hides when box 1 (index 0) is selected
        left: '0.00%',
        top: '24.93%',
        width: '100.19%',
        height: '6.39%',
        cssClass: 'callout-page4-box6'
      },
      {
        // Box 7 - No-edge auto-hide box that hides when box 2 (index 1) is selected
        left: '0.00%',
        top: '58.67%',
        width: '100.19%',
        height: '6.39%',
        cssClass: 'callout-page4-box7'
      },
      {
        // Box 8 - No-edge auto-hide box that hides when box 1 (index 0) is selected
        left: '70.90%',
        top: '32.01%',
        width: '25.58%',
        height: '25.75%',
        cssClass: 'callout-page4-box8'
      },
      {
        // Box 9 - No-edge auto-hide box
        left: '0.52%',
        top: '64.50%',
        width: '98.38%',
        height: '7.48%',
        cssClass: 'callout-page4-box9'
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
            point2: { x: '16.80%', y: '65.83%' },
            dynamicZIndex: true // Lines will use same z-index as box state
          },
          {
            point1: { x: '31.06%', y: '63.22%' },
            point2: { x: '16.80%', y: '65.83%' },
            dynamicZIndex: true // Lines will use same z-index as box state
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
            point2: { x: '16.67%', y: '67.57%' },
            dynamicZIndex: true
          },
          {
            point1: { x: '24.05%', y: '76.26%' },
            point2: { x: '16.67%', y: '67.57%' },
            dynamicZIndex: true
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
      },
      {
        // Box 5 - No-edge auto-hide box
        left: '4.46%',
        top: '56.71%',
        width: '86.99%',
        height: '34.88%',
        cssClass: 'callout-page5-box5'
      }
    ],
    6: [
      {
        // Box positioning for page 6.1 (wiring diagram)
        // No pointer
        left: '8.49%',
        top: '25.22%',
        width: '83.18%',
        height: '10.93%',
        cssClass: 'callout-page6-box0'
      },
      {
        // Toggle button between wiring diagram (6.1) and breadboard (6)
        // Always visible and blue on both states
        left: '9.00%',
        top: '37.30%',
        width: '14.94%',
        height: '4.19%',
        cssClass: 'callout-page6-toggle'
      },
      {
        // Box 2 for page 6.1 (wiring diagram)
        // Lines to point - linked with box color
        left: '46.80%',
        top: '39.29%',
        width: '29.28%',
        height: '5.75%',
        
        // Lines from box to point
        lines: [
          {
            point1: { x: '58.40%', y: '45.04%' },
            point2: { x: '45.35%', y: '46.62%' }
          },
          {
            point1: { x: '51.74%', y: '45.04%' },
            point2: { x: '45.35%', y: '46.62%' }
          }
        ],
        
        cssClass: 'callout-page6-box2'
      },
      {
        // Box 3 for page 6.1 (wiring diagram)
        left: '52.14%',
        top: '54.44%',
        width: '25.08%',
        height: '7.51%',
        
        // Lines from box to point
        lines: [
          {
            point1: { x: '56.03%', y: '61.95%' },
            point2: { x: '50.95%', y: '64.56%' }
          },
          {
            point1: { x: '61.72%', y: '61.95%' },
            point2: { x: '50.95%', y: '64.56%' }
          }
        ],
        
        cssClass: 'callout-page6-box3'
      },
      {
        // Box 4 for page 6.1 (wiring diagram)
        left: '16.23%',
        top: '70.14%',
        width: '47.32%',
        height: '5.41%',
        
        // Lines from box to point
        lines: [
          {
            point1: { x: '24.94%', y: '70.14%' },
            point2: { x: '39.66%', y: '67.60%' }
          },
          {
            point1: { x: '35.98%', y: '70.14%' },
            point2: { x: '39.66%', y: '67.60%' }
          }
        ],
        
        cssClass: 'callout-page6-box4'
      },
      {
        // Box 5 for page 6.1 (wiring diagram)
        // No pointer
        left: '8.35%',
        top: '78.67%',
        width: '83.31%',
        height: '10.69%',
        cssClass: 'callout-page6-box5'
      },
      {
        // Box 6 - No-edge auto-hide box that hides when box 0 is selected
        left: '8.40%',
        top: '41.82%',
        width: '82.83%',
        height: '27.44%',
        cssClass: 'callout-page6-box6'
      },
      {
        // Box 7 - No-edge auto-hide box that hides when box 0 is selected
        left: '4.89%',
        top: '36.58%',
        width: '91.15%',
        height: '40.13%',
        cssClass: 'callout-page6-box7'
      },
      {
        // Box 8 - No-edge auto-hide box at bottom
        left: '3.80%',
        top: '76.84%',
        width: '91.37%',
        height: '13.57%',
        cssClass: 'callout-page6-box8'
      }
    ],
    8: [
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 0 - shows on image 10
        left: '8.91%',
        top: '37.09%',
        width: '14.89%',
        height: '4.38%',
        
        cssClass: 'callout-page8-box0'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 1 - shows on image 10.1 (same location as box 0)
        left: '8.91%',
        top: '37.09%',
        width: '14.89%',
        height: '4.38%',
        
        cssClass: 'callout-page8-box1'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 2 - shows on image 10 only (no triangle pointer)
        left: '7.77%',
        top: '23.21%',
        width: '84.56%',
        height: '12.97%',
        
        cssClass: 'callout-page8-box2'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 3 - shows on image 10 only (no triangle pointer)
        left: '3.62%',
        top: '36.63%',
        width: '91.90%',
        height: '54.16%', // Extended by 40px (7.56% of 529px image height)
        
        cssClass: 'callout-page8-box3'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 4 - shows on image 10 only when box 2 is selected (far left box with triangle)
        left: '22.12%',
        top: '45.20%',
        width: '25.22%',
        height: '4.97%',
        
        // Triangle pointer
        triangle: {
          point1: {
            x: '26.93%',
            y: '50.16%',
            edge: 'bottom'
          },
          point2: {
            x: '33.19%',
            y: '50.16%',
            edge: 'bottom'
          },
          point3: {
            x: '34.36%',
            y: '52.76%'
          }
        },
        
        cssClass: 'callout-page8-box4'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 5 - shows on image 10 only when box 2 is selected (middle box with triangle)
        left: '46.48%',
        top: '39.22%',
        width: '23.85%',
        height: '4.97%',
        
        // Triangle pointer
        triangle: {
          point1: {
            x: '50.79%',
            y: '44.19%',
            edge: 'bottom'
          },
          point2: {
            x: '56.27%',
            y: '44.19%',
            edge: 'bottom'
          },
          point3: {
            x: '57.54%',
            y: '51.17%'
          }
        },
        
        cssClass: 'callout-page8-box5'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 6 - shows on image 10 only when box 2 is selected (far right box with triangle)
        left: '67.31%',
        top: '45.27%',
        width: '25.31%',
        height: '5.12%',
        
        // Triangle pointer
        triangle: {
          point1: {
            x: '82.09%',
            y: '50.39%',
            edge: 'bottom'
          },
          point2: {
            x: '87.77%',
            y: '50.39%',
            edge: 'bottom'
          },
          point3: {
            x: '82.58%',
            y: '51.93%'
          }
        },
        
        cssClass: 'callout-page8-box6'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 7 - transparent hover box on image 10
        left: '49.35%',
        top: '73.02%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box7 hover-ground-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 8 - transparent hover box on image 10
        left: '49.35%',
        top: '73.02%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box8 hover-ground-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 9 - transparent hover box on image 10
        left: '54.10%',
        top: '73.13%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box9 hover-ground-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 10 - transparent hover box on image 10
        left: '41.66%',
        top: '73.13%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box10 hover-ground-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 11 - transparent hover box on image 10
        left: '49.59%',
        top: '69.13%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box11 hover-button-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 12 - transparent hover box on image 10
        left: '60.23%',
        top: '68.75%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box12 hover-button-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 13 - transparent hover box on image 10
        left: '53.75%',
        top: '69.32%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box13 hover-led-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 14 - transparent hover box on image 10
        left: '53.75%',
        top: '69.32%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box14 hover-led-box'
      },
      {
        // Box positioning (all percentages for consistency and responsiveness)
        // Box 15 - transparent hover box on image 10
        left: '76.00%',
        top: '69.41%',
        width: '5.00%',
        height: '3.00%',
        
        cssClass: 'callout-page8-box15 hover-led-box'
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
    
    // Special case for page 6: Can proceed once all boxes are clicked (regardless of wiring/breadboard view)
    if (currentSlide === 6) {
      // All clickable boxes (0, 2, 5) should be checked (boxes 3 and 4 hide automatically with box 2)
      const requiredBoxes = [0, 2, 5];
      const allRequiredChecked = requiredBoxes.every(index => {
        const calloutKey = `callout-6-${index}`;
        return checkedBoxes[calloutKey] === true;
      });
      return allRequiredChecked;
    }
    
    // Special case for page 8: Can proceed when box 2 and box 4 are selected
    if (currentSlide === 8) {
      const requiredBoxes = [2, 4]; // Box 2 (top) and box 4 (far left)
      const allRequiredChecked = requiredBoxes.every(index => {
        const calloutKey = `callout-8-${index}`;
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
    // Don't allow clicking transparent hover boxes (page 8 boxes 7, 8, 9, 10, 11, 12, 13, 14, 15)
    if (slideNumber === 8 && (calloutIndex === 7 || calloutIndex === 8 || calloutIndex === 9 || calloutIndex === 10 || calloutIndex === 11 || calloutIndex === 12 || calloutIndex === 13 || calloutIndex === 14 || calloutIndex === 15)) {
      return; // Transparent hover boxes are not clickable
    }
    
    // Check if box is locked (waiting for delay)
    const calloutKey = `callout-${slideNumber}-${calloutIndex}`;
    if (lockedBoxes[calloutKey]) {
      return; // Don't allow clicking locked boxes
    }
    
    // Special case for page 8: Toggle between 10 and 10.1 image
    if (slideNumber === 8) {
      // Button 0 (on image 10) switches to 10.1
      if (calloutIndex === 0) {
        setShowPage8Detail(true);
        return;
      }
      // Button 1 (on image 10.1) switches back to 10
      if (calloutIndex === 1) {
        setShowPage8Detail(false);
        return;
      }
      // Box 4 (far left) - when selected, hide all three boxes (4, 5, 6)
      if (calloutIndex === 4) {
        setCheckedBoxes(prev => ({
          ...prev,
          'callout-8-4': true,
          'callout-8-5': true,
          'callout-8-6': true
        }));
        return;
      }
    }
    
    // Special case for page 6: Sequential activation and page switching
    if (slideNumber === 6) {
      // Toggle button (index 1) switches between wiring and breadboard
      if (calloutIndex === 1) {
        setShowPage6Wiring(!showPage6Wiring);
        setShowPage6ToggleButton(true); // Keep toggle button visible
        return;
      }
      
      // Box 5 handling - switches to breadboard view if on wiring, or just marks as clicked if on breadboard
      if (calloutIndex === 5) {
        setCheckedBoxes(prev => ({ ...prev, [calloutKey]: true }));
        setPage6Box0Clicked(true);
        if (showPage6Wiring) {
          // If on wiring diagram, switch to breadboard view
          setShowPage6Wiring(false);
        }
        setShowPage6ToggleButton(true); // Show toggle button
        return;
      }
      
      // Sequential activation: hide current box and unlock next box
      if (showPage6Wiring) {
        if (calloutIndex === 0) {
          // Box 0 clicked - hide it, unlock box 2, and hide boxes 6, 7, and 8 after delay
          setCheckedBoxes(prev => ({ ...prev, [calloutKey]: true }));
          setTimeout(() => {
            setLockedBoxes(prev => ({ ...prev, 'callout-6-2': false }));
            setPage6Box6Hidden(true); // Hide box 6 after 0.75s delay
            setPage6Box7Hidden(true); // Hide box 7 after 0.75s delay
            setPage6Box8Hidden(true); // Hide box 8 after 0.75s delay
          }, 750);
          return;
        } else if (calloutIndex === 2) {
          // Box 2 clicked - hide boxes 2, 3, 4, unlock box 5, and show toggle button
          setCheckedBoxes(prev => ({ 
            ...prev, 
            'callout-6-2': true,
            'callout-6-3': true,
            'callout-6-4': true
          }));
          setShowPage6ToggleButton(true); // Show toggle button
          setTimeout(() => {
            setLockedBoxes(prev => ({ ...prev, 'callout-6-5': false }));
          }, 750);
          return;
        } else if (calloutIndex === 3 || calloutIndex === 4) {
          // Boxes 3 and 4 should not be clickable (they hide with box 2)
          return;
        }
      }
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
      
      // For page 5, hide box 5 (no-edge box) immediately when box 2 is clicked
      if (slideNumber === 5 && calloutIndex === 2) {
        setPage5Box5Hidden(true);
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
      setPage5Box5Hidden(false);
    } else if (currentSlide === 6) {
      setLockedBoxes({
        'callout-6-2': true,
        'callout-6-5': true
      });
      // Reset page 6 state
      setShowPage6Wiring(true);
      setPage6Box0Clicked(false);
      setPage6Box6Hidden(false);
      setPage6Box7Hidden(false);
      setPage6Box8Hidden(false);
      setShowPage6ToggleButton(false);
    } else if (currentSlide === 8) {
      // Reset page 8 state
      setShowPage8Detail(false);
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
          src={currentSlide === 6 && showPage6Wiring 
            ? `/drone/workshop-slides/6.1-drone-instructions.png`
            : currentSlide === 8 && showPage8Detail
            ? `/drone/workshop-slides/10.1-drone-instructions.png`
            : currentSlide === 8
            ? `/drone/workshop-slides/10-drone-instructions.png`
            : `/drone/workshop-slides/${currentSlide}-drone-instructions.png`}
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
            
            // For page 6, handle visibility based on wiring/breadboard state
            if (currentSlide === 6) {
              // Box 0 only shows on wiring view (6.1)
              if (index === 0) {
                if (!showPage6Wiring) {
                  return null; // Hide if on breadboard view
                }
              }
              // Toggle button (index 1) shows when toggle button is enabled OR on breadboard view (6)
              if (index === 1) {
                if (!showPage6ToggleButton && showPage6Wiring) {
                  return null; // Hide on wiring diagram until toggle button is enabled
                }
              }
              // Boxes 2, 3, 4 only show on wiring view (6.1)
              if (index === 2 || index === 3 || index === 4) {
                if (!showPage6Wiring) {
                  return null; // Hide if on breadboard view
                }
              }
              // Box 5 shows on either view if not yet clicked
              if (index === 5) {
                if (page6Box0Clicked) {
                  return null; // Hide only if already clicked
                }
                // Show on wiring view (6.1) OR breadboard view (6) if unlocked
                if (!showPage6Wiring && lockedBoxes['callout-6-5']) {
                  return null; // Hide on breadboard if still locked
                }
              }
              // Box 6 (auto-hide) only shows on wiring view (6.1)
              if (index === 6) {
                if (!showPage6Wiring) {
                  return null; // Hide if on breadboard view
                }
              }
              // Box 7 (auto-hide) only shows on wiring view (6.1)
              if (index === 7) {
                if (!showPage6Wiring) {
                  return null; // Hide if on breadboard view
                }
              }
              // Box 8 (auto-hide) only shows on wiring view (6.1)
              if (index === 8) {
                if (!showPage6Wiring) {
                  return null; // Hide if on breadboard view
                }
              }
            }
            
            // For page 8, handle visibility based on which image is shown
            if (currentSlide === 8) {
              // Box 0 only shows on image 10 (when showPage8Detail is false)
              if (index === 0) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
              }
              // Box 1 only shows on image 10.1 (when showPage8Detail is true)
              if (index === 1) {
                if (!showPage8Detail) {
                  return null; // Hide if on 10 image
                }
              }
              // Box 2 only shows on image 10 (when showPage8Detail is false)
              if (index === 2) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
              }
              // Box 3 only shows on image 10 (when showPage8Detail is false)
              if (index === 3) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
              }
              // Boxes 4, 5, 6 only show on image 10 when box 2 is selected (box 3 is hidden)
              if (index === 4 || index === 5 || index === 6) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
                // Only show if box 2 is selected (which hides box 3)
                if (!checkedBoxes['callout-8-2']) {
                  return null; // Hide if box 2 is not selected
                }
              }
              // Boxes 7, 8, 9, 10 (transparent hover boxes) only show on image 10 when box 2 is selected
              // (box 2 selection hides box 3 and shows boxes 4, 5, 6)
              if (index === 7 || index === 8 || index === 9 || index === 10) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
                // Only show if box 2 is selected (which hides box 3 and shows boxes 4, 5, 6)
                if (!checkedBoxes['callout-8-2']) {
                  return null; // Hide if box 2 is not selected
                }
              }
              // Boxes 11, 12 (transparent hover boxes) only show on image 10 when box 2 is selected
              if (index === 11 || index === 12) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
                // Only show if box 2 is selected (which hides box 3 and shows boxes 4, 5, 6)
                if (!checkedBoxes['callout-8-2']) {
                  return null; // Hide if box 2 is not selected
                }
              }
              // Boxes 13, 14, 15 (transparent hover boxes) only show on image 10 when box 2 is selected
              if (index === 13 || index === 14 || index === 15) {
                if (showPage8Detail) {
                  return null; // Hide if on 10.1 image
                }
                // Only show if box 2 is selected (which hides box 3 and shows boxes 4, 5, 6)
                if (!checkedBoxes['callout-8-2']) {
                  return null; // Hide if box 2 is not selected
                }
              }
            }
            
            // Special case: On page 4, auto-hide box 3 (large no-edge box) when box 2 is selected
            if (currentSlide === 4 && index === 2) {
              isSelected = isSelected || checkedBoxes[`callout-4-1`] || false;
            }
            
            // Special case: On page 4, auto-hide box 5 (bottom no-edge box) when box 4 is selected
            if (currentSlide === 4 && index === 4) {
              isSelected = isSelected || checkedBoxes[`callout-4-3`] || false;
            }
            
            // Special case: On page 4, auto-hide box 6 when box 1 (index 0) is selected
            if (currentSlide === 4 && index === 5) {
              isSelected = isSelected || checkedBoxes[`callout-4-0`] || false;
            }
            
            // Special case: On page 4, auto-hide box 7 when box 2 (index 1) is selected
            if (currentSlide === 4 && index === 6) {
              isSelected = isSelected || checkedBoxes[`callout-4-1`] || false;
            }
            
            // Special case: On page 4, auto-hide box 8 when box 1 (index 0) is selected
            if (currentSlide === 4 && index === 7) {
              isSelected = isSelected || checkedBoxes[`callout-4-0`] || false;
            }
            
            // Special case: On page 4, auto-hide box 9 when box 2 (index 1) is selected
            if (currentSlide === 4 && index === 8) {
              isSelected = isSelected || checkedBoxes[`callout-4-1`] || false;
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
            
            // Special case: On page 5, auto-hide box 5 when hidden state is set
            if (currentSlide === 5 && index === 5) {
              isSelected = isSelected || page5Box5Hidden;
            }
            
            // Special case: On page 6, toggle button (index 1) is never selected/hidden
            if (currentSlide === 6 && index === 1) {
              isSelected = false;
            }
            
            // Special case: On page 8, boxes 0 and 1 are never selected/hidden (they toggle images)
            // Box 2 can be selected/hidden normally
            // Box 3 hides when box 2 is selected
            if (currentSlide === 8 && (index === 0 || index === 1)) {
              isSelected = false;
            }
            
            // Special case: On page 8, box 3 hides when box 2 is selected
            if (currentSlide === 8 && index === 3) {
              isSelected = isSelected || checkedBoxes[`callout-8-2`] || false;
            }
            
            // Special case: On page 8, boxes 7, 8, 9, 10 are never selected/hidden (transparent hover boxes)
            if (currentSlide === 8 && (index === 7 || index === 8 || index === 9 || index === 10)) {
              isSelected = false;
            }
            
            // Special case: On page 8, boxes 11, 12 are never selected/hidden (transparent hover boxes)
            if (currentSlide === 8 && (index === 11 || index === 12)) {
              isSelected = false;
            }
            
            // Special case: On page 8, boxes 13, 14, 15 are never selected/hidden (transparent hover boxes)
            if (currentSlide === 8 && (index === 13 || index === 14 || index === 15)) {
              isSelected = false;
            }
            
            // Special case: On page 6, box 5 can be selected normally
            // (No special override needed - it uses normal checked state)
            
            // Special case: On page 6, auto-hide box 6 when hidden state is set
            if (currentSlide === 6 && index === 6) {
              isSelected = isSelected || page6Box6Hidden;
            }
            
            // Special case: On page 6, auto-hide box 7 when hidden state is set
            if (currentSlide === 6 && index === 7) {
              isSelected = isSelected || page6Box7Hidden;
            }
            
            // Special case: On page 6, auto-hide box 8 when hidden state is set
            if (currentSlide === 6 && index === 8) {
              isSelected = isSelected || page6Box8Hidden;
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
              // Boxes 2, 4, 6, 7, 8, and 9 are auto-hide boxes (not interactive)
              if (index === 2 || index === 4 || index === 5 || index === 6 || index === 7 || index === 8) {
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
              } else if (index === 4 || index === 5) {
                // Boxes 4 and 5 are auto-hide boxes (not interactive)
                isDisabled = true; // Always disabled - auto-hide
              }
            }
            if (currentSlide === 6) {
              // Toggle button (index 1) is never disabled - always blue and interactive
              if (index === 1) {
                isDisabled = false;
              }
              // Box 0, 2 are disabled when locked
              if (index === 0 || index === 2) {
                isDisabled = lockedBoxes[calloutKey] === true;
              }
              // Box 5 is disabled when locked (can be clicked on both views)
              if (index === 5) {
                isDisabled = lockedBoxes[calloutKey] === true;
              }
              // Boxes 3 and 4 are not individually clickable (they hide with box 2)
              if (index === 3 || index === 4) {
                isDisabled = true;
              }
              // Boxes 6, 7, and 8 are auto-hide boxes (not interactive)
              if (index === 6 || index === 7 || index === 8) {
                isDisabled = true;
              }
            }
            if (currentSlide === 8) {
              // Boxes 7, 8, 9, 10 are transparent hover boxes (not clickable)
              if (index === 7 || index === 8 || index === 9 || index === 10) {
                isDisabled = true;
              }
              // Boxes 11, 12 are transparent hover boxes (not clickable)
              if (index === 11 || index === 12) {
                isDisabled = true;
              }
              // Boxes 13, 14, 15 are transparent hover boxes (not clickable)
              if (index === 13 || index === 14 || index === 15) {
                isDisabled = true;
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
              >
                {/* Add text for page 6 toggle button when on wiring diagram (6.1) */}
                {currentSlide === 6 && index === 1 && showPage6Wiring && (
                  <div className="toggle-button-text">
                    <div>Hide</div>
                    <div>Wiring Diagram</div>
                  </div>
                )}
                {/* Add hover text for page 8 transparent boxes */}
                {currentSlide === 8 && (index === 7 || index === 8 || index === 9 || index === 10) && (
                  <div className="ground-hover-text">Ground</div>
                )}
                {/* Add hover text for page 8 button boxes */}
                {currentSlide === 8 && (index === 11 || index === 12) && (
                  <div className="button-hover-text">Button</div>
                )}
                {/* Add hover text for page 8 LED boxes */}
                {currentSlide === 8 && (index === 13 || index === 14 || index === 15) && (
                  <div className="led-hover-text">LED</div>
                )}
              </div>
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
              // Boxes 2, 4, 6, 7, 8, and 9 are auto-hide boxes (not interactive)
              if (index === 2 || index === 4 || index === 5 || index === 6 || index === 7 || index === 8) {
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
              } else if (index === 4 || index === 5) {
                // Boxes 4 and 5 are auto-hide boxes (not interactive)
                isDisabled = true; // Always disabled - auto-hide
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
                  height: `${height}%`,
                  zIndex: (currentSlide === 8 && (index === 4 || index === 5 || index === 6)) ? 9 : undefined
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
              // Boxes 2, 4, 6, 7, 8, and 9 are auto-hide boxes (not interactive)
              if (index === 2 || index === 4 || index === 5 || index === 6 || index === 7 || index === 8) {
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
              } else if (index === 4 || index === 5) {
                // Boxes 4 and 5 are auto-hide boxes (not interactive)
                isDisabled = true; // Always disabled - auto-hide
              }
            }
            if (currentSlide === 6) {
              // Box 2 is disabled when locked
              if (index === 2) {
                isDisabled = lockedBoxes[calloutKey] === true;
              }
              // Boxes 3 and 4 are always disabled (not individually clickable)
              if (index === 3 || index === 4) {
                isDisabled = true;
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
              
              // For dynamic z-index, use 3 when disabled, 10 when active
              const lineZIndex = line.dynamicZIndex 
                ? (isDisabled ? 3 : 10) 
                : (line.zIndex || undefined);
              
              return (
                <svg 
                  key={`line-${calloutKey}-${lineIndex}`} 
                  className="callout-line-overlay"
                  style={{
                    left: `${minX}%`,
                    top: `${minY}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    zIndex: lineZIndex
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