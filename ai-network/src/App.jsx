import { useState } from 'react'
import './App.css'
import { useEffect } from 'react'

function App() {
  // Helper function to create complete round data
  const createRoundData = (roundNumber, is45NetworkPage = false) => ({
    lightStates: [false, false, false], // [top, middle, bottom]
    selectedButton: roundNumber === 1 ? 'green' : null, // Round 1 always green, others null initially
    isHidden: roundNumber === 1 ? true : false, // Round 1 starts hidden, others visible initially
    circleColors: Array(is45NetworkPage ? 20 : 12).fill(''), // track circle colors - start empty
    showCode: false, // to track if code/probabilities is shown
    hasRun: false, // to track if current round has been executed
    inputSelections: Array(is45NetworkPage ? 15 : 9).fill(''), // track dropdown selections for C1-C15 or C1-C9
    numericValues: Array(is45NetworkPage ? 15 : 9).fill(''), // track numeric input values for C1-C15 or C1-C9
    weightValues: Array(is45NetworkPage ? 15 : 9).fill(''), // track weight input values for C1-C15 or C1-C9 - start empty
    valueResults: Array(is45NetworkPage ? 15 : 9).fill(''), // track value results for C1-C15 or C1-C9
    previousNumericValues: Array(is45NetworkPage ? 15 : 9).fill(''), // track previous numeric values
    isAutoNumericActive: false, // track if auto numeric is active
    previousWeightValues: Array(is45NetworkPage ? 15 : 9).fill(''), // track previous weight values
    isAutoWeightActive: false, // track if auto weight is active
    isUpdateWeightsAutoActive: false, // track if update weights auto is active
    updateWeightsValues: Array(is45NetworkPage ? 15 : 9).fill(''), // track independent weight values for update weights table, start with blank
    previousUpdateWeightsValues: Array(is45NetworkPage ? 15 : 9).fill(''), // track previous update weights values
    previousValueResults: Array(is45NetworkPage ? 15 : 9).fill(''), // track previous value results
    isAutoValueActive: false, // track if auto value is active
    sumOfValues: '', // track sum of C node values
    networkDecision: '', // track network decision
    networkStatus: '', // track if network decision is correct
    showNetworkDecision: false,
    showTrafficLight: false, // track if network decision table is shown
    showUpdateWeightsTable: false, // track if update weights table is shown
    isHiddenLayerExpanded: false, // track if hidden layer content is expanded
    isOutputNodeExpanded: false, // track if output node content is expanded
    isSummaryExpanded: false, // track if summary content is expanded
    sensorBoxClicked: false,
    gpuAnimationState: 'idle', // 'idle', 'sliding-down', 'spinning', 'sliding-up'
    gpuFanSpeed: 0 // 0-4 for fan speed levels
  });

  const [currentRound, setCurrentRound] = useState(1) // track current round for navigation
  const [roundsData, setRoundsData] = useState({
    1: createRoundData(1, false),
    2: createRoundData(2, false),
    3: createRoundData(3, false),
    4: createRoundData(4, false),
    5: createRoundData(5, false),
    6: createRoundData(6, false),
    7: createRoundData(7, false),
    8: createRoundData(8, false),
    9: createRoundData(9, false),
    10: createRoundData(10, false)
  });
  const [colorScheme, setColorScheme] = useState('orange') // track color scheme: 'orange' or 'gray'
  const [isInitialized, setIsInitialized] = useState(false) // track if component is fully initialized
  const [resetCounter, setResetCounter] = useState(0) // track reset count to force re-renders
  const [is45Network, setIs45Network] = useState(false) // track if we're on the 45-network page
  // Round selection removed - only Round 1 is displayed





  // Helper functions to get and set current round data
  const getCurrentRoundData = () => roundsData[currentRound];


  const setCurrentRoundData = (updates) => {
    console.log(`setCurrentRoundData called for round ${currentRound}:`, updates);
    console.log(`Previous state for round ${currentRound}:`, roundsData[currentRound]);
    
    setRoundsData(prev => {
      const newState = {
        ...prev,
        [currentRound]: { ...prev[currentRound], ...updates }
      };
      
      console.log(`New state for round ${currentRound}:`, newState[currentRound]);
      return newState;
    });
  };

  const handleSensorBoxClick = () => {
    // Scroll to position where Sensor Nodes A appears right below the horizontal line
    const sensorBox = document.querySelector('.text-box')
    if (sensorBox) {
      const rect = sensorBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const handleHiddenLayerBoxClick = () => {
    // Scroll to position where Hidden Layer Nodes appears right below the horizontal line
    const hiddenLayerBox = document.querySelector('.hidden-layer-text-box')
    if (hiddenLayerBox) {
      const rect = hiddenLayerBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const handleOutputBoxClick = () => {
    // Scroll to position where Output Node appears right below the horizontal line
    const outputBox = document.querySelector('.output-text-box')
    if (outputBox) {
      const rect = outputBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const handleSummaryBoxClick = () => {
    // Scroll to position where Summary appears right below the horizontal line
    const summaryBox = document.querySelector('.summary-text-box')
    if (summaryBox) {
      const rect = summaryBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
  }

  const toggleHiddenLayer = () => {
    setCurrentRoundData({ isHiddenLayerExpanded: !getCurrentRoundData().isHiddenLayerExpanded });
    
    // Save data immediately after toggling hidden layer state
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  const toggleOutputNode = () => {
    setCurrentRoundData({ isOutputNodeExpanded: !getCurrentRoundData().isOutputNodeExpanded });
    
    // Save data immediately after toggling output node state
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  const toggleSummary = () => {
    setCurrentRoundData({ isSummaryExpanded: !getCurrentRoundData().isSummaryExpanded });
    
    // Save data immediately after toggling summary state
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  // Round selection removed - only Round 1 is displayed

  // Round offset calculation removed - no longer needed

  // Round selection removed - only Round 1 is displayed

  // Round offset calculation removed - only centering Round 1

  const handleLeftArrowClick = () => {
    if (currentRound > 1) {
      const targetRound = currentRound - 1;
      
      // Find the last round with updated weights (starting from the target round and going backwards)
      let sourceRound = null;
      let sourceWeights = Array(is45Network ? 15 : 9).fill(''); // Default weights
      
      // Look for the most recent round with updated weights
      for (let round = targetRound - 1; round >= 1; round--) {
        const roundData = roundsData[round];
        if (roundData && roundData.showUpdateWeightsTable) {
          // Check if this round has updated weights
          if (roundData.isUpdateWeightsAutoActive && roundData.updateWeightsValues.some(w => w !== '')) {
            sourceWeights = [...roundData.updateWeightsValues];
            sourceRound = round;
            break;
          } else if (roundData.updateWeightsValues.some(w => w !== '')) {
            sourceWeights = [...roundData.updateWeightsValues];
            sourceRound = round;
            break;
          }
        }
      }
      
      // If no previous round has updated weights, use Round 1 weights (which start at 20)
      if (sourceRound === null) {
        sourceWeights = Array(is45Network ? 15 : 9).fill('');
      }
      
      // Update the target round's weight values
      setRoundsData(prev => ({
        ...prev,
        [targetRound]: {
          ...prev[targetRound],
          weightValues: sourceWeights
        }
      }));
      
      console.log(`Carrying weights from Round ${sourceRound || 1} to Round ${targetRound}:`, sourceWeights);
      setCurrentRound(targetRound);
      
      // Save data immediately after round navigation
      setTimeout(() => saveDataToLocalStorage(), 100);
    }
  };

  const handleRightArrowClick = () => {
    if (currentRound < 10) {
      const targetRound = currentRound + 1;
      const currentData = getCurrentRoundData();
      
      // Determine which weights to carry over from the current round
      let weightsToCarry = Array(is45Network ? 15 : 9).fill(''); // Default weights
      
      // Priority: 1) Auto-calculated weights, 2) Manually entered weights, 3) Default weights
      if (currentData.showUpdateWeightsTable) {
        if (currentData.isUpdateWeightsAutoActive && currentData.updateWeightsValues.some(w => w !== '')) {
          // Use the auto-calculated weights (any calculated values)
          weightsToCarry = [...currentData.updateWeightsValues];
        } else if (currentData.updateWeightsValues.some(w => w !== '')) {
          // Use manually entered weights
          weightsToCarry = [...currentData.updateWeightsValues];
        }
      } else {
        // If no update weights table is shown, carry over the current weight values
        if (currentData.weightValues.some(w => w !== '')) {
          weightsToCarry = [...currentData.weightValues];
        }
      }
      
      // Update the next round's weight values
      setRoundsData(prev => ({
        ...prev,
        [targetRound]: {
          ...prev[targetRound],
          weightValues: weightsToCarry
        }
      }));
      
      console.log(`Carrying over weights to Round ${targetRound}:`, weightsToCarry);
      setCurrentRound(targetRound);
      
      // Save data immediately after round navigation
      setTimeout(() => saveDataToLocalStorage(), 100);
    }
  };

  const handleColorSchemeChange = (scheme) => {
    console.log('Color scheme changing to:', scheme)
    setColorScheme(scheme)
    
    // Save data immediately after color scheme change
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleUpdateWeights = () => {
    const currentData = getCurrentRoundData();
    
    // Initialize updateWeightsValues with empty strings to show blank input boxes
    const newUpdateWeightsValues = Array(9).fill('')
    
    // Show the update weights table and initialize weights as blank
    setCurrentRoundData({ 
      showUpdateWeightsTable: true,
      updateWeightsValues: newUpdateWeightsValues,
      isUpdateWeightsAutoActive: false // Reset auto state when showing table
    })
    
    // Scroll to position where Output Node table appears right below the horizontal line
    const outputBox = document.querySelector('.output-text-box')
    if (outputBox) {
      const rect = outputBox.getBoundingClientRect()
      const absoluteTop = window.pageYOffset + rect.top
      const horizontalLinePosition = 95 // Position right below the horizontal line
      
      window.scrollTo({
        top: Math.max(0, absoluteTop - horizontalLinePosition),
        behavior: 'smooth'
      })
    }
    
    // Save data immediately after showing update weights table
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const cycleLights = () => {
    const currentData = getCurrentRoundData();
    const newStates = [...currentData.lightStates]
    
    // Find the first false (off) light and turn it on
    const firstOffIndex = newStates.findIndex(state => !state)
    
    if (firstOffIndex !== -1) {
      // Turn on the first off light
      newStates[firstOffIndex] = true
    } else {
      // All lights are on, turn them all off
      newStates.fill(false)
    }
    
    setCurrentRoundData({ lightStates: newStates })
    
    // Save data immediately after cycling lights
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleButtonClick = (buttonType) => {
    setCurrentRoundData({ selectedButton: buttonType });
    
    // Save data immediately after traffic light selection
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  const toggleHide = () => {
    setCurrentRoundData({ isHidden: !getCurrentRoundData().isHidden });
    
    // Save data immediately after toggling hide state
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  const toggleShowCode = () => {
    setCurrentRoundData({ showCode: !getCurrentRoundData().showCode });
    
    // Save data immediately after toggling show code state
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  const startGPUAnimation = () => {
    // GPU is hidden - do not show
    setCurrentRoundData({ gpuAnimationState: 'hidden' });
    
    // Save data after GPU animation state change
    setTimeout(() => saveDataToLocalStorage(), 100);
  };

  const calculateProgressiveValues = () => {
    const currentData = getCurrentRoundData();
    const totalNodes = is45Network ? 15 : 9;
    const delayPerNode = 500; // 0.5 seconds per node
    
    console.log('Starting progressive value calculation...');
    
    // Start with empty values - sum will be handled by animation function
    const emptyValues = Array(9).fill('');
    setCurrentRoundData({ 
      valueResults: emptyValues
    });
    
    // Progressively reveal values one by one
    for (let i = 0; i < totalNodes; i++) {
      setTimeout(() => {
        console.log(`Processing node ${i + 1} at ${i * delayPerNode}ms`);
        
        // Calculate the value for this node
        const numericValue = currentData.numericValues[i] === '' ? 0 : parseFloat(currentData.numericValues[i]);
        const weightValue = currentData.weightValues[i] === '' ? 0 : parseFloat(currentData.weightValues[i]);
        const calculatedValue = Math.round(numericValue * weightValue).toString();
        
        // Update the state with the new value
        setCurrentRoundData(prevData => {
          const newValueResults = [...prevData.valueResults];
          newValueResults[i] = calculatedValue;
          
          console.log(`Updated value cell ${i} with calculated value: ${calculatedValue}`);
          
          return {
            valueResults: newValueResults
          };
        });
        
        // Save data after each progressive value update
        setTimeout(() => saveDataToLocalStorage(), 100);
        
      }, i * delayPerNode);
    }
  };

  // Detect if we're on the 45-network page
  useEffect(() => {
    const currentPath = window.location.pathname;
    const is45NetworkPage = currentPath.includes('45-network');
    setIs45Network(is45NetworkPage);
    console.log('Current path:', currentPath, 'Is 45-network:', is45NetworkPage);
    
    // Update rounds data with correct sensor node count
    if (is45NetworkPage) {
      const updatedRoundsData = {};
      for (let i = 1; i <= 10; i++) {
        updatedRoundsData[i] = createRoundData(i, true);
      }
      setRoundsData(updatedRoundsData);
    }
    
    // Clear any existing weight data to ensure weights start empty
    if (is45NetworkPage) {
      setTimeout(() => {
        const currentData = getCurrentRoundData();
        if (currentData.weightValues.some(w => w === '20')) {
          console.log('Clearing existing weight data to start fresh');
          setCurrentRoundData({
            weightValues: Array(15).fill(''),
            isAutoWeightActive: false
          });
        }
      }, 100);
    }
  }, []);

  // Add GPU state to all rounds that don't have it (run first)
  useEffect(() => {
    console.log('GPU state useEffect running...');
    const updatedRoundsData = { ...roundsData };
    let hasChanges = false;
    
    for (let round = 1; round <= 10; round++) {
      if (!updatedRoundsData[round].hasOwnProperty('gpuAnimationState')) {
        updatedRoundsData[round] = {
          ...updatedRoundsData[round],
          gpuAnimationState: 'idle',
          gpuFanSpeed: 0
        };
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      console.log('Adding GPU state to rounds...');
      setRoundsData(updatedRoundsData);
      
      // Save data after adding GPU state to rounds
      setTimeout(() => saveDataToLocalStorage(), 100);
    } else {
      console.log('No GPU state changes needed');
    }
  }, []);

  // Load saved data from localStorage on component mount (run after GPU state is added)
  useEffect(() => {
    console.log('Data loading useEffect running...');
    // Wait for the component to be fully mounted and initial state set
    const timer = setTimeout(() => {
      console.log('Loading data from localStorage...');
      const savedData = localStorage.getItem('aiNetworkData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log('Found saved data:', parsedData);
          
          // Debug: Check what's in the current round's circleColors
          if (parsedData.roundsData && parsedData.roundsData[1]) {
            console.log('Current round 1 circleColors from localStorage:', parsedData.roundsData[1].circleColors);
          }
          
          if (parsedData.roundsData) {
            console.log('Loading roundsData:', parsedData.roundsData);
            // Ensure all rounds have the complete structure by merging with createRoundData
            const completeRoundsData = {};
            for (let round = 1; round <= 10; round++) {
              if (parsedData.roundsData[round]) {
                // Deep merge to ensure all user inputs are preserved
                const savedRound = parsedData.roundsData[round];
                const defaultRound = createRoundData(round);
                
                // Debug: Log what we're about to merge
                console.log(`Round ${round} - Before merge:`, {
                  savedCircleColors: savedRound.circleColors,
                  defaultCircleColors: defaultRound.circleColors
                });
                
                // Bypass merge logic and use saved data directly for critical properties
                completeRoundsData[round] = {
                  ...defaultRound,
                  ...savedRound
                };
                
                // Explicitly handle circleColors to ensure they're preserved
                if (savedRound.circleColors && Array.isArray(savedRound.circleColors) && savedRound.circleColors.length === 12) {
                  // Check if the saved colors actually contain red/ggreen values
                  const hasValidColors = savedRound.circleColors.some(color => color === 'red' || color === 'green');
                  if (hasValidColors) {
                    completeRoundsData[round].circleColors = savedRound.circleColors;
                    console.log(`Round ${round} - Using saved circleColors with valid colors:`, savedRound.circleColors);
                  } else {
                    console.log(`Round ${round} - Saved circleColors exist but are empty strings, using defaults`);
                    completeRoundsData[round].circleColors = defaultRound.circleColors;
                  }
                } else {
                  console.log(`Round ${round} - No valid saved circleColors, using defaults`);
                  completeRoundsData[round].circleColors = defaultRound.circleColors;
                }
                
                // Debug: Log what we got after merge
                console.log(`Round ${round} - After merge:`, {
                  finalCircleColors: completeRoundsData[round].circleColors,
                  savedCircleColors: savedRound.circleColors
                });
                
                console.log(`Round ${round} loaded:`, {
                  inputSelections: completeRoundsData[round].inputSelections,
                  selectedButton: completeRoundsData[round].selectedButton,
                  hasRun: completeRoundsData[round].hasRun,
                  circleColors: completeRoundsData[round].circleColors,
                  savedCircleColors: savedRound.circleColors,
                  defaultCircleColors: defaultRound.circleColors,
                  circleColorsLength: savedRound.circleColors ? savedRound.circleColors.length : 'undefined',
                  isCircleColorsArray: Array.isArray(savedRound.circleColors)
                });
              } else {
                completeRoundsData[round] = createRoundData(round);
              }
            }
            setRoundsData(completeRoundsData);
            
            // Debug: Log the final loaded data for round 1
            console.log('Final loaded data for round 1:', completeRoundsData[1]);
            console.log('Final circleColors for round 1:', completeRoundsData[1]?.circleColors);
          }
          if (parsedData.currentRound) {
            console.log('Loading currentRound:', parsedData.currentRound);
            setCurrentRound(parsedData.currentRound);
          }
          if (parsedData.colorScheme) {
            console.log('Loading colorScheme:', parsedData.colorScheme);
            setColorScheme(parsedData.colorScheme);
          }
          console.log('Successfully loaded saved data from localStorage');
        } catch (error) {
          console.error('Error loading saved data:', error);
          // If there's an error, clear corrupted data and start fresh
          localStorage.removeItem('aiNetworkData');
          console.log('Cleared corrupted localStorage data');
        }
      } else {
        console.log('No saved data found in localStorage');
      }
      
      // Mark component as initialized after loading attempt
      console.log('Marking component as initialized...');
      setIsInitialized(true);
      
      // Save initial state if no saved data was found
      if (!savedData) {
        setTimeout(() => {
          const initialData = {
            roundsData,
            currentRound: 1,
            colorScheme: 'orange',
            timestamp: Date.now()
          };
          localStorage.setItem('aiNetworkData', JSON.stringify(initialData));
          console.log('Initial state saved to localStorage');
        }, 100);
      }
    }, 500); // Increased delay to ensure component is fully mounted

    return () => clearTimeout(timer);
  }, []);

  // Save data to localStorage whenever any important state changes (run last)
  useEffect(() => {
    // Only save if component is initialized and we have actual data
    if (isInitialized && Object.keys(roundsData).length > 0) {
      console.log('State changed, automatic save to localStorage...');
      console.log('Current round circleColors being automatically saved:', roundsData[currentRound]?.circleColors);
      
      const dataToSave = {
        roundsData,
        currentRound,
        colorScheme,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem('aiNetworkData', JSON.stringify(dataToSave));
        console.log('Data automatically saved to localStorage:', dataToSave);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        // If localStorage is full, try to clear old data and save again
        try {
          localStorage.clear();
          localStorage.setItem('aiNetworkData', JSON.stringify(dataToSave));
          console.log('Data saved to localStorage after clearing:', dataToSave);
        } catch (clearError) {
          console.error('Failed to save data even after clearing localStorage:', clearError);
        }
      }
    } else if (!isInitialized) {
      console.log('Component not yet initialized, skipping save');
    } else {
      console.log('No rounds data available, skipping save');
    }
  }, [roundsData, currentRound, colorScheme, isInitialized]);

  const toggleNetworkDecision = () => {
    const newShowState = !getCurrentRoundData().showNetworkDecision;
    setCurrentRoundData({ showNetworkDecision: newShowState });
    
    // Calculate summary when showing the network decision
    if (newShowState) {
      // Start GPU animation sequence
      startGPUAnimation();
      
      // Start value column animation sequence (this will handle both highlighting and sum updates)
      animateValueColumn();
    }
    
    // Data will be automatically saved by the useEffect when roundsData changes
  };

  // Function to animate the value column cells one by one
  const animateValueColumn = () => {
    const totalNodes = is45Network ? 15 : 9;
    const animationDuration = 500; // 0.5 seconds per cell
    const currentData = getCurrentRoundData();
    
    console.log('Starting value column animation sequence...');
    
    // Start with empty sum and show that we're starting
    setCurrentRoundData({ 
      sumOfValues: 'Starting calculation...',
      networkDecision: 'Undecided'
    });
    
    // Also update the display immediately
    const summaryCell = document.querySelector('.summary-table tr:nth-child(2) td:first-child');
    if (summaryCell) {
      summaryCell.innerHTML = 'Starting calculation...';
    }
    
    // Set initial row background color to white (undecided)
    const tableRow = summaryCell?.closest('tr');
    if (tableRow) {
      tableRow.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
      tableRow.classList.add('summary-row-undecided');
    }
    
    // Wait a moment before starting the animation sequence
    setTimeout(() => {
      setCurrentRoundData({ 
        sumOfValues: '0',
        networkDecision: 'Undecided'
      });
      
      // Also update the display
      if (summaryCell) {
        summaryCell.innerHTML = '0';
      }
      
      // Ensure row background color is still white for undecided state
      if (tableRow) {
        tableRow.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
        tableRow.classList.add('summary-row-undecided');
      }
    }, 500);
    
    // Animate each cell from C1 to C9
    for (let i = 0; i < totalNodes; i++) {
      setTimeout(() => {
        // Get the value cell element for the current node
        const valueCell = document.querySelector(`[data-row="${i}"][data-column="7"]`);
        console.log(`Animating cell ${i + 1} (C${i + 1}):`, valueCell);
        
        if (valueCell) {
          // Add animation class to make text bold and larger
          valueCell.classList.add('value-animation');
          console.log(`Added animation class to C${i + 1}`);
          
          // Calculate the cumulative sum up to this point
          let cumulativeSum = 0;
          let cumulativeDisplay = '';
          let hasValidValues = false;
          
          // Process all cells from C1 up to the current cell (i)
          for (let j = 0; j <= i; j++) {
            const numericValue = currentData.numericValues[j] === '' ? 0 : parseFloat(currentData.numericValues[j]);
            const weightValue = currentData.weightValues[j] === '' ? 0 : parseFloat(currentData.weightValues[j]);
            const calculatedValue = Math.round(numericValue * weightValue);
            
            console.log(`Processing cell ${j + 1}: numeric=${numericValue}, weight=${weightValue}, calculated=${calculatedValue}`);
            
            // Only include cells that have actual calculated values (not 0 from empty inputs)
            if (numericValue !== 0 && weightValue !== 0) {
              if (!hasValidValues) {
                cumulativeDisplay = `C${j + 1} (${calculatedValue})`;
                hasValidValues = true;
              } else {
                cumulativeDisplay += ` + C${j + 1} (${calculatedValue})`;
              }
              cumulativeSum += calculatedValue;
              console.log(`Added C${j + 1} to cumulative sum: ${cumulativeDisplay} = ${cumulativeSum}`);
            } else {
              console.log(`Skipping C${j + 1} - no valid values`);
            }
            
            // Add visual indicator for the currently active cell
            if (j === i) {
              cumulativeDisplay += ` ← [Processing]`;
            }
          }
          
          // If no valid values found, show 0
          if (!hasValidValues) {
            cumulativeDisplay = '0';
            cumulativeSum = 0;
          } else {
            // Remove the processing indicator for the final display
            cumulativeDisplay = cumulativeDisplay.replace(' ← [Processing]', '');
            // Add the final total to the display
            cumulativeDisplay += ` = ${cumulativeSum}`;
          }
          
          console.log(`Final cumulative display: "${cumulativeDisplay}"`);
          console.log(`Final cumulative sum: ${cumulativeSum}`);
          
          // Update the sum display to show cumulative addition as each cell is highlighted
          console.log(`About to update state with cumulative sum: ${cumulativeDisplay} and decision: ${cumulativeSum > 0 ? 'Green' : cumulativeSum < 0 ? 'Red' : 'Undecided'}`);
          
          // Add visual feedback to the summary table (bottom left cell)
          const summaryCell = document.querySelector('.summary-table tr:nth-child(2) td:first-child');
          if (summaryCell) {
            summaryCell.classList.add('updating');
            // Directly update the cell content to show only the cumulative sum value
            summaryCell.innerHTML = cumulativeSum.toString();
            // Remove the updating class after a short delay
            setTimeout(() => {
              summaryCell.classList.remove('updating');
            }, 300);
          }
          
          // Determine the current decision based on cumulative sum
          let currentDecision = 'Undecided';
          
          if (cumulativeSum > 0) {
            currentDecision = 'Green';
          } else if (cumulativeSum < 0) {
            currentDecision = 'Red';
          } else {
            currentDecision = 'Undecided';
          }
          
          setCurrentRoundData(prevData => {
            console.log(`Previous state: sumOfValues=${prevData.sumOfValues}, networkDecision=${prevData.networkDecision}`);
            return {
              ...prevData,
              sumOfValues: cumulativeDisplay,
              networkDecision: currentDecision
            };
          });
          
          // Update the network decision display (bottom right cell) to show just the decision
          const networkDecisionCell = document.querySelector('.summary-table tr:nth-child(2) td:nth-child(2)');
          if (networkDecisionCell) {
            // Add a brief highlight effect to the network decision cell
            networkDecisionCell.classList.add('updating');
            // Show just the decision text without explanation
            networkDecisionCell.innerHTML = `<span class="summary-row-${currentDecision.toLowerCase()}">${currentDecision}</span>`;
            setTimeout(() => {
              networkDecisionCell.classList.remove('updating');
            }, 300);
          }
          
          // Update background colors for both cells based on the decision
          if (summaryCell) {
            // Remove any existing color classes
            summaryCell.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
            // Add the appropriate color class
            summaryCell.classList.add(`summary-row-${currentDecision.toLowerCase()}`);
          }
          
          if (networkDecisionCell) {
            // Remove any existing color classes
            networkDecisionCell.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
            // Add the appropriate color class
            networkDecisionCell.classList.add(`summary-row-${currentDecision.toLowerCase()}`);
          }
          
          // Update the table row background color in real-time
          const tableRow = summaryCell?.closest('tr');
          if (tableRow) {
            // Remove any existing row color classes
            tableRow.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
            // Add the appropriate row color class
            tableRow.classList.add(`summary-row-${currentDecision.toLowerCase()}`);
          }
          
          console.log(`Updated cumulative sum to: ${cumulativeDisplay} = ${cumulativeSum}`);
          
          // Remove animation class after 0.5 seconds
          setTimeout(() => {
            valueCell.classList.remove('value-animation');
            console.log(`Removed animation class from C${i + 1}`);
          }, animationDuration);
        } else {
          console.warn(`Could not find value cell for C${i + 1}`);
        }
      }, i * animationDuration);
    }
    
    // Add completion message after all cells are processed
    setTimeout(() => {
      const summaryCell = document.querySelector('.summary-table tr:nth-child(2) td:first-child');
      if (summaryCell) {
        // Ensure the final cumulative sum value is displayed (not the formula)
        const finalData = getCurrentRoundData();
        // Extract just the numeric value from the sumOfValues string
        const finalSumMatch = finalData.sumOfValues.match(/= (-?\d+)$/);
        const finalSumValue = finalSumMatch ? finalSumMatch[1] : finalData.sumOfValues;
        summaryCell.innerHTML = finalSumValue;
      }
      
      // Also finalize the network decision display (bottom right cell)
      const networkDecisionCell = document.querySelector('.summary-table tr:nth-child(2) td:nth-child(2)');
      if (networkDecisionCell) {
        const finalDecision = getCurrentRoundData().networkDecision;
        networkDecisionCell.innerHTML = `<span class="summary-row-${finalDecision.toLowerCase()}">${finalDecision}</span>`;
      }
      
      // Ensure final background colors are set for both cells
      if (summaryCell) {
        const finalDecision = getCurrentRoundData().networkDecision;
        summaryCell.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
        summaryCell.classList.add(`summary-row-${finalDecision.toLowerCase()}`);
      }
      
      if (networkDecisionCell) {
        const finalDecision = getCurrentRoundData().networkDecision;
        networkDecisionCell.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
        networkDecisionCell.classList.add(`summary-row-${finalDecision.toLowerCase()}`);
      }
      
      // Ensure final row background color is set correctly
      const tableRow = summaryCell?.closest('tr');
      if (tableRow) {
        const finalDecision = getCurrentRoundData().networkDecision;
        tableRow.classList.remove('summary-row-red', 'summary-row-green', 'summary-row-undecided');
        tableRow.classList.add(`summary-row-${finalDecision.toLowerCase()}`);
      }
    }, (totalNodes * animationDuration) + 500);
  };

  const toggleTrafficLight = () => {
    setCurrentRoundData({ showTrafficLight: !getCurrentRoundData().showTrafficLight });
    
    // Data will be automatically saved by the useEffect when roundsData changes
  };

  // Function to manually save data to localStorage
  const saveDataToLocalStorage = () => {
    // Only save if component is initialized
    if (!isInitialized) {
      console.log('Component not yet initialized, skipping save');
      return;
    }
    
    try {
      const dataToSave = {
        roundsData,
        currentRound,
        colorScheme,
        timestamp: Date.now()
      };
      
      // Debug: Log what's being saved for the current round
      console.log('Saving data for current round:', currentRound);
      console.log('Current round circleColors being saved:', roundsData[currentRound]?.circleColors);
      
      localStorage.setItem('aiNetworkData', JSON.stringify(dataToSave));
      console.log('Data manually saved to localStorage:', dataToSave);
      
      // Verify the save was successful
      const savedData = localStorage.getItem('aiNetworkData');
      if (savedData) {
        console.log('Data successfully verified in localStorage');
      } else {
        console.error('Data was not saved to localStorage');
      }
    } catch (error) {
      console.error('Error manually saving to localStorage:', error);
    }
  };

  // Function to check current localStorage content for debugging
  const checkLocalStorage = () => {
    const savedData = localStorage.getItem('aiNetworkData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Current localStorage content:', parsedData);
        return parsedData;
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
        return null;
      }
    } else {
      console.log('No data in localStorage');
      return null;
    }
  };

  // Function to test localStorage by saving some test data
  const testLocalStorage = () => {
    console.log('Testing localStorage...');
    const testData = {
      test: 'data',
      timestamp: Date.now()
    };
    localStorage.setItem('testData', JSON.stringify(testData));
    
    const retrieved = localStorage.getItem('testData');
    if (retrieved) {
      console.log('localStorage test successful:', JSON.parse(retrieved));
    } else {
      console.error('localStorage test failed');
    }
  };

  // Function to force save current state for testing
  const forceSave = () => {
    console.log('Force saving current state...');
    console.log('Current state:', {
      roundsData,
      currentRound,
      colorScheme,
      isInitialized
    });
    saveDataToLocalStorage();
  };

  const resetAllData = () => {
    // Clear localStorage
    localStorage.removeItem('aiNetworkData');
    
    // Reset to initial state
    setCurrentRound(1);
    setColorScheme('orange');
    
    // Create completely fresh round data
    const freshRoundsData = {};
    for (let i = 1; i <= 10; i++) {
      freshRoundsData[i] = {
        lightStates: [false, false, false],
        selectedButton: i === 1 ? 'green' : null, // Round 1 always green, others null initially
        isHidden: i === 1 ? true : false, // Round 1 starts hidden, others visible initially
        circleColors: Array(is45Network ? 20 : 12).fill(''),
        showCode: false,
        hasRun: false,
        inputSelections: Array(is45Network ? 15 : 9).fill(''),
        numericValues: Array(is45Network ? 15 : 9).fill(''),
        weightValues: Array(is45Network ? 15 : 9).fill(''), // All rounds start empty
        valueResults: Array(is45Network ? 15 : 9).fill(''),
        previousNumericValues: Array(is45Network ? 15 : 9).fill(''),
        isAutoNumericActive: false,
        previousWeightValues: Array(is45Network ? 15 : 9).fill(''),
        isAutoWeightActive: false,
        isUpdateWeightsAutoActive: false,
        updateWeightsValues: Array(is45Network ? 15 : 9).fill(''),
        previousUpdateWeightsValues: Array(is45Network ? 15 : 9).fill(''),
        previousValueResults: Array(is45Network ? 15 : 9).fill(''),
        isAutoValueActive: false,
        sumOfValues: '',
        networkDecision: '',
        networkStatus: '',
        showNetworkDecision: false,
        showTrafficLight: false,
        showUpdateWeightsTable: false,
        isHiddenLayerExpanded: false,
        isOutputNodeExpanded: false,
        isSummaryExpanded: false,
        sensorBoxClicked: false,
        gpuAnimationState: 'idle',
        gpuFanSpeed: 0
      };
    }
    
    // Force immediate state update with fresh data
    setRoundsData(freshRoundsData);
    
    // Increment reset counter to force complete re-renders
    setResetCounter(prev => prev + 1);
    
    // Force a complete re-render and prevent useEffect interference
    setIsInitialized(false);
    
    // Use a longer timeout to ensure all effects have run and then force a clean state
    setTimeout(() => {
      setIsInitialized(true);
      // Force another clean state update to override any useEffect interference
      setRoundsData(prev => {
        const overrideData = {};
        for (let i = 1; i <= 10; i++) {
          overrideData[i] = {
            lightStates: [false, false, false],
            selectedButton: i === 1 ? 'green' : null, // Round 1 always green, others null initially
            isHidden: i === 1 ? true : false, // Round 1 starts hidden, others visible initially
            circleColors: Array(is45Network ? 20 : 12).fill(''),
            showCode: false,
            hasRun: false,
            inputSelections: Array(is45Network ? 15 : 9).fill(''),
            numericValues: Array(is45Network ? 15 : 9).fill(''),
            weightValues: Array(is45Network ? 15 : 9).fill(''), // All rounds start empty
            valueResults: Array(is45Network ? 15 : 9).fill(''),
            previousNumericValues: Array(is45Network ? 15 : 9).fill(''),
            isAutoNumericActive: false,
            previousWeightValues: Array(is45Network ? 15 : 9).fill(''),
            isAutoWeightActive: false,
            isUpdateWeightsAutoActive: false,
            updateWeightsValues: Array(is45Network ? 15 : 9).fill(''),
            previousUpdateWeightsValues: Array(is45Network ? 15 : 9).fill(''),
            previousValueResults: Array(is45Network ? 15 : 9).fill(''),
            isAutoValueActive: false,
            sumOfValues: '',
            networkDecision: '',
            networkStatus: '',
            showNetworkDecision: false,
            showTrafficLight: false,
            showUpdateWeightsTable: false,
            isHiddenLayerExpanded: false,
            isOutputNodeExpanded: false,
            isSummaryExpanded: false,
            sensorBoxClicked: false,
            gpuAnimationState: 'idle',
            gpuFanSpeed: 0
          };
        }
        return overrideData;
      });
    }, 200);
    
    console.log('All data has been reset to initial state');
  };

  const handleInputChange = (index, value) => {
    const currentData = getCurrentRoundData();
    const newSelections = [...currentData.inputSelections]
    newSelections[index] = value
    setCurrentRoundData({ inputSelections: newSelections })
    // Numeric values will NOT be automatically updated - user must select manually or use auto button
    
    // Save data immediately after user input change
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleNumericChange = (index, value) => {
    const currentData = getCurrentRoundData();
    const newNumericValues = [...currentData.numericValues]
    newNumericValues[index] = value
    setCurrentRoundData({ numericValues: newNumericValues })
    // Also deactivate auto numeric mode when user manually changes a value
    if (currentData.isAutoNumericActive) {
      setCurrentRoundData({ isAutoNumericActive: false })
    }
    // Value results will be automatically updated via useEffect
    
    // Save data immediately after user input change
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleWeightChange = (index, value) => {
    const currentData = getCurrentRoundData();
    const newWeightValues = [...currentData.weightValues]
    newWeightValues[index] = value
    setCurrentRoundData({ weightValues: newWeightValues })
    // Value results will be automatically updated via useEffect
    // Also deactivate auto weight mode when user manually changes a weight
    if (currentData.isAutoWeightActive) {
      setCurrentRoundData({ isAutoWeightActive: false })
    }
    
    // Save data immediately after user input change
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleUpdateWeightChange = (index, value) => {
    const currentData = getCurrentRoundData();
    const newUpdateWeightsValues = [...currentData.updateWeightsValues]
    newUpdateWeightsValues[index] = value
    setCurrentRoundData({ updateWeightsValues: newUpdateWeightsValues })
    
    // Deactivate auto mode when user manually changes a weight
    if (currentData.isUpdateWeightsAutoActive) {
      setCurrentRoundData({ isUpdateWeightsAutoActive: false })
    }
    
    // Save data immediately after user input change
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleValueChange = (index, value) => {
    const currentData = getCurrentRoundData();
    const newValueResults = [...currentData.valueResults]
    newValueResults[index] = value
    setCurrentRoundData({ valueResults: newValueResults })
    // Also deactivate auto value mode when user manually changes a value
    if (currentData.isAutoValueActive) {
      setCurrentRoundData({ isAutoValueActive: false })
    }
    // Summary will be automatically updated via useEffect
    
    // Save data immediately after user input change
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleAutoNumeric = () => {
    const currentData = getCurrentRoundData();
    if (!currentData.isAutoNumericActive) {
      // Save current values and apply auto-fill
      setCurrentRoundData({ 
        previousNumericValues: [...currentData.numericValues],
        numericValues: currentData.inputSelections.map(input => {
          if (input === 'red') {
            return '-1'
          } else if (input === 'green') {
            return '1'
          } else {
            return '' // Keep empty if no input selection
          }
        }),
        isAutoNumericActive: true
      })
    } else {
      // Restore previous values
      setCurrentRoundData({ 
        numericValues: [...currentData.previousNumericValues],
        isAutoNumericActive: false
      })
    }
    
    // Save data immediately after auto button activation/deactivation
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleAutoWeight = () => {
    const currentData = getCurrentRoundData();
    if (!currentData.isAutoWeightActive) {
      // Save current values and apply auto-fill
      setCurrentRoundData({ 
        previousWeightValues: [...currentData.weightValues],
        weightValues: Array(is45Network ? 15 : 9).fill('20'),
        isAutoWeightActive: true
      })
    } else {
      // Restore previous values and deactivate auto
      setCurrentRoundData({ 
        weightValues: [...currentData.previousWeightValues],
        isAutoWeightActive: false
      })
    }
    
    // Save data immediately after auto button activation/deactivation
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleUpdateWeightsAuto = () => {
    const currentData = getCurrentRoundData();
    if (!currentData.isUpdateWeightsAutoActive) {
      // Check if traffic light state is selected
      if (!currentData.selectedButton) {
        alert('Please select a traffic light color first!')
        return
      }
      
      // Check if C node inputs are selected
      const hasInputs = currentData.inputSelections.some(input => input === 'red' || input === 'green')
      if (!hasInputs) {
        alert('Please select inputs for C nodes first!')
        return
      }
      
      // Save current values before applying auto
      setCurrentRoundData({ 
        previousUpdateWeightsValues: [...currentData.updateWeightsValues],
        isUpdateWeightsAutoActive: true
      })
      
      // LEARNING ALGORITHM: Calculate updated C node weights
      // Step 1: Get the traffic light state the user selected (red or green)
      const trafficLightState = currentData.selectedButton
      
      // Step 2: Get the C node inputs from the main table
      const cNodeInputs = currentData.inputSelections
      
      // Step 3: Calculate updated weights for each C node
      const newUpdateWeightsValues = []
      
      // UNIFIED LOGIC FOR ALL ROUNDS: Add/subtract 10 from current weight
      const totalNodes = is45Network ? 15 : 9;
      for (let i = 0; i < totalNodes; i++) {
        const cNodeInput = cNodeInputs[i]
        const currentWeight = parseInt(currentData.weightValues[i]) || 0 // Get current weight from main table, default to 0 if empty
        
        if (cNodeInput === trafficLightState) {
          // MATCH: Add 10 to current weight
          newUpdateWeightsValues[i] = (currentWeight + 10).toString()
        } else if (cNodeInput === 'red' || cNodeInput === 'green') {
          // MISMATCH: Subtract 10 from current weight (allow negative values)
          newUpdateWeightsValues[i] = (currentWeight - 10).toString()
        } else {
          // NO INPUT: Keep current weight
          newUpdateWeightsValues[i] = currentWeight.toString()
        }
      }
      
      // Step 4: Update the Node Weight table with calculated weights
      setCurrentRoundData({ 
        updateWeightsValues: newUpdateWeightsValues,
        isUpdateWeightsAutoActive: true  // Ensure this stays true after updating weights
      })
      
      console.log(`Round ${currentRound} unified weight calculation:`, {
        round: currentRound,
        trafficLightState,
        cNodeInputs,
        currentWeights: currentData.weightValues,
        newWeights: newUpdateWeightsValues
      })
      
      // Detailed debugging for each node
      for (let i = 0; i < 9; i++) {
        const cNodeInput = cNodeInputs[i]
        const currentWeight = parseInt(currentData.weightValues[i]) || 0
        const newWeight = newUpdateWeightsValues[i]
        
        console.log(`Node C${i+1}:`, {
          input: cNodeInput,
          currentWeight: currentWeight,
          trafficLightState: trafficLightState,
          isMatch: cNodeInput === trafficLightState,
          calculation: cNodeInput === trafficLightState ? `${currentWeight} + 10 = ${currentWeight + 10}` : `${currentWeight} - 10 = ${currentWeight - 10}`,
          newWeight: newWeight
        })
      }
      
    } else {
      // When deactivating auto, show blank input boxes for user editing
      // Clear the calculated weights and show empty input boxes
      setCurrentRoundData({ 
        updateWeightsValues: Array(9).fill(''),
        isUpdateWeightsAutoActive: false
      })
    }
    
    // Save data immediately after auto button activation/deactivation
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const handleAutoValue = () => {
    const currentData = getCurrentRoundData();
    if (!currentData.isAutoValueActive) {
      // Save current values and apply auto-fill
      const totalNodes = is45Network ? 15 : 9;
      setCurrentRoundData({ 
        previousValueResults: [...currentData.valueResults],
        valueResults: Array(totalNodes).fill('').map((_, i) => {
          const numericValue = currentData.numericValues[i] === '' ? 0 : parseFloat(currentData.numericValues[i])
          const weightValue = currentData.weightValues[i] === '' ? 0 : parseFloat(currentData.weightValues[i])
          return Math.round(numericValue * weightValue).toString()
        }),
        isAutoValueActive: true
      })
    } else {
      // Restore previous values and deactivate auto
      setCurrentRoundData({ 
        valueResults: [...currentData.previousValueResults],
        isAutoValueActive: false
      })
    }
    
    // Save data immediately after auto button activation/deactivation
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  // Function to calculate values automatically when inputs change
  const calculateValues = () => {
    const currentData = getCurrentRoundData();
    
    // Calculate numeric values based on input selections (only if auto numeric is active)
    const newNumericValues = currentData.inputSelections.map(input => {
      if (input === 'red') {
        return '-1'
      } else if (input === 'green') {
        return '1'
      } else {
        return ''
      }
    })
    
    // Calculate weight values (only if auto weight is active)
    const newWeightValues = Array(is45Network ? 15 : 9).fill('')
    
    // Calculate value results based on current numeric and weight values (only if auto value is active)
    const totalNodes = is45Network ? 15 : 9;
    const newValueResults = Array(totalNodes).fill('')
    for (let i = 0; i < totalNodes; i++) {
      const numericValue = currentData.numericValues[i] === '' ? 0 : parseFloat(currentData.numericValues[i])
      const weightValue = currentData.weightValues[i] === '' ? 0 : parseFloat(currentData.weightValues[i])
      newValueResults[i] = Math.round(numericValue * weightValue).toString()
    }
    
    // Update values based on auto button states
    const updates = {}
    
    // Update numeric values if auto numeric is active (real-time updates when input changes)
    if (currentData.isAutoNumericActive) {
      updates.numericValues = newNumericValues
    }
    
    // Update weight values if auto weight is active (real-time updates when input changes)
    if (currentData.isAutoWeightActive) {
      updates.weightValues = newWeightValues
    }
    
    // Update value results if auto value is active (real-time updates when any values change)
    if (currentData.isAutoValueActive) {
      updates.valueResults = newValueResults
    }
    
    // Only update update weights values if auto mode is active
    if (currentData.isUpdateWeightsAutoActive) {
      updates.updateWeightsValues = currentData.updateWeightsValues
    }
    
    // Update values in one call for efficiency
    setCurrentRoundData(updates)
    
    // Save data after auto-calculating values
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const calculateSummary = () => {
    // Calculate sum of all values
    const sum = getCurrentRoundData().valueResults.reduce((total, value) => {
      return total + (value === '' ? 0 : parseFloat(value))
    }, 0)
    
    setCurrentRoundData({ sumOfValues: sum.toString() });
    
    // Determine network decision locally first
    let decision
    if (sum > 0) {
      decision = 'Green'
    } else if (sum < 0) {
      decision = 'Red'
    } else {
      decision = 'Undecided'
    }
    
    setCurrentRoundData({ networkDecision: decision });

    // Determine network status using the local decision
    if (!getCurrentRoundData().selectedButton) {
      setCurrentRoundData({ networkStatus: '' }); // No traffic light selected
    } else if (sum === 0) {
      setCurrentRoundData({ networkStatus: 'Undecided' });
    } else if (getCurrentRoundData().selectedButton === 'red' && decision === 'Red') {
      setCurrentRoundData({ networkStatus: 'Correct' });
    } else if (getCurrentRoundData().selectedButton === 'green' && decision === 'Green') {
      setCurrentRoundData({ networkStatus: 'Correct' });
    } else if (getCurrentRoundData().selectedButton === 'red' && decision === 'Green') {
      setCurrentRoundData({ networkStatus: 'Incorrect' });
    } else if (getCurrentRoundData().selectedButton === 'green' && decision === 'Red') {
      setCurrentRoundData({ networkStatus: 'Incorrect' });
    } else {
      setCurrentRoundData({ networkStatus: '' });
    }
    
    // Save data after calculating summary
    setTimeout(() => saveDataToLocalStorage(), 100);
  }

  const calculateSummaryWithProgressiveDisplay = () => {
    // First, clear the sum to show it's calculating
    setCurrentRoundData({ sumOfValues: 'Calculating...' });
    
    // Get the current value results
    const valueResults = getCurrentRoundData().valueResults;
    
    // Progressive sum calculation with 0.5 second delays
    // Use a recursive approach to avoid closure issues
    const addNodeProgressively = (index, currentSum) => {
      if (index >= 9) {
        // All nodes processed, calculate final decision
        let decision;
        if (currentSum > 0) {
          decision = 'Green';
        } else if (currentSum < 0) {
          decision = 'Red';
        } else {
          decision = 'Undecided';
        }
        
        // Update network decision and status
        setCurrentRoundData({ 
          networkDecision: decision,
          networkStatus: calculateNetworkStatus(decision, currentSum)
        });
        
        // Save data after progressive summary calculation
        setTimeout(() => saveDataToLocalStorage(), 100);
        return;
      }
      
      // Add current node value
      const value = valueResults[index] === '' ? 0 : parseFloat(valueResults[index]);
      const newSum = currentSum + value;
      
      // Update the sum display
      setCurrentRoundData({ sumOfValues: newSum.toString() });
      
      // Save data after each progressive sum update
      setTimeout(() => saveDataToLocalStorage(), 100);
      
      // Schedule next node
      setTimeout(() => {
        addNodeProgressively(index + 1, newSum);
      }, 500); // 0.5 second delay
    };
    
    // Start the progressive calculation
    addNodeProgressively(0, 0);
  }

  const calculateNetworkStatus = (decision, sum) => {
    const currentData = getCurrentRoundData();
    
    if (!currentData.selectedButton) {
      return ''; // No traffic light selected
    } else if (sum === 0) {
      return 'Undecided';
    } else if (currentData.selectedButton === 'red' && decision === 'Red') {
      return 'Correct';
    } else if (currentData.selectedButton === 'green' && decision === 'Green') {
      return 'Correct';
    } else if (currentData.selectedButton === 'red' && decision === 'Green') {
      return 'Incorrect';
    } else if (currentData.selectedButton === 'green' && decision === 'Red') {
      return 'Incorrect';
    } else {
      return '';
    }
  }

  useEffect(() => {
    // Only calculate values if we have some data to work with (not on initial empty load)
    const currentData = getCurrentRoundData();
    if (currentData.inputSelections.some(val => val !== '') || 
        currentData.numericValues.some(val => val !== '') || 
        currentData.weightValues.some(val => val !== '') ||
        currentData.valueResults.some(val => val !== '')) {
      calculateValues()
    }
    calculateSummary()
    
    // Auto-update weights if update weights table is shown and we have the necessary data
    // Only run this if the user has explicitly activated auto mode
    if (currentData.showUpdateWeightsTable && 
        currentData.selectedButton && 
        currentData.inputSelections.some(input => input === 'red' || input === 'green') &&
        currentData.isUpdateWeightsAutoActive) {
      
      const trafficLightState = currentData.selectedButton
      const cNodeInputs = currentData.inputSelections
      const newUpdateWeightsValues = []
      
      // UNIFIED LOGIC FOR ALL ROUNDS: Add/subtract 10 from current weights
      for (let i = 0; i < 9; i++) {
        const cNodeInput = cNodeInputs[i]
        const currentWeight = parseInt(currentData.weightValues[i]) || 0 // Get current weight from main table, default to 0 if empty
        
        if (cNodeInput === trafficLightState) {
          // MATCH: Add 10 to current weight
          newUpdateWeightsValues[i] = (currentWeight + 10).toString()
        } else if (cNodeInput === 'red' || cNodeInput === 'green') {
          // MISMATCH: Subtract 10 from current weight (allow negative values)
          newUpdateWeightsValues[i] = (currentWeight - 10).toString()
        } else {
          // NO INPUT: Keep current weight
          newUpdateWeightsValues[i] = currentWeight.toString()
        }
      }
      
      // Update the weights (but don't change auto mode - let user control it)
      setCurrentRoundData({ 
        updateWeightsValues: newUpdateWeightsValues
      })
      
      // Save data after auto-updating weights
      setTimeout(() => saveDataToLocalStorage(), 100);
      
      console.log(`useEffect Round ${currentRound} unified weight calculation:`, {
        round: currentRound,
        trafficLightState,
        cNodeInputs,
        currentWeights: currentData.weightValues,
        newWeights: newUpdateWeightsValues
      })
      
      // Detailed debugging for each node in useEffect
      for (let i = 0; i < 9; i++) {
        const cNodeInput = cNodeInputs[i]
        const currentWeight = parseInt(currentData.weightValues[i]) || 0
        const newWeight = newUpdateWeightsValues[i]
        
        console.log(`useEffect Node C${i+1}:`, {
          input: cNodeInput,
          currentWeight: currentWeight,
          trafficLightState: trafficLightState,
          isMatch: cNodeInput === trafficLightState,
          calculation: cNodeInput === trafficLightState ? `${currentWeight} + 10 = ${currentWeight + 10}` : `${currentWeight} - 10 = ${currentWeight - 10}`,
          newWeight: newWeight
        })
      }
    }
    
    // Save data after any value calculations
    setTimeout(() => saveDataToLocalStorage(), 100);
  }, [
    currentRound,
    getCurrentRoundData().inputSelections,
    getCurrentRoundData().numericValues,
    getCurrentRoundData().weightValues,
    getCurrentRoundData().valueResults,
    getCurrentRoundData().updateWeightsValues,
    getCurrentRoundData().selectedButton,
    getCurrentRoundData().isAutoValueActive,
    getCurrentRoundData().isAutoNumericActive,
    getCurrentRoundData().isAutoWeightActive,
    getCurrentRoundData().showUpdateWeightsTable
  ])











  const handleKeyDown = (e, rowIndex, columnIndex) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      
      // Calculate next row and column
      let nextRow = rowIndex
      let nextColumn = columnIndex
      
      if (columnIndex === 1) { // Input column
        nextRow = rowIndex + 1
        nextColumn = 1
      } else if (columnIndex === 2) { // Numeric column
        nextRow = rowIndex + 1
        nextColumn = 2
      } else if (columnIndex === 4) { // Weight column
        nextRow = rowIndex + 1
        nextColumn = 4
      } else if (columnIndex === 7) { // Value column
        nextRow = rowIndex + 1
        nextColumn = 7
      }
      
      // If we're at the last row, wrap to the first row
      const maxRows = is45Network ? 15 : 9;
      if (nextRow >= maxRows) {
        nextRow = 0
      }
      
      // Focus the next element
      const nextElement = document.querySelector(`[data-row="${nextRow}"][data-column="${nextColumn}"]`)
      if (nextElement) {
        nextElement.focus()
      }
    }
  }

  // Weighted probability system for circles
  const circleWeights = is45Network ? [
    { weight: 5 }, // A1
    { weight: 2 }, // A2
    { weight: 1 }, // A3
    { weight: 4 }, // A4
    { weight: 1 }, // A5
    { weight: 5 }, // A6
    { weight: 2 }, // A7
    { weight: 1 }, // A8
    { weight: 4 }, // A9
    { weight: 1 }, // A10
    { weight: 5 }, // A11
    { weight: 2 }, // A12
    { weight: 1 }, // A13
    { weight: 4 }, // A14
    { weight: 1 }, // A15
    { weight: 5 }, // A16
    { weight: 2 }, // A17
    { weight: 1 }, // A18
    { weight: 4 }, // A19
    { weight: 1 }  // A20
  ] : [
    { weight: 5 }, // A1
    { weight: 2 }, // A2
    { weight: 1 }, // A3
    { weight: 4 }, // A4
    { weight: 1 }, // A5
    { weight: 5 }, // A6
    { weight: 2 }, // A7
    { weight: 1 }, // A8
    { weight: 4 }, // A9
    { weight: 1 }, // A10
    { weight: 5 }, // A11
    { weight: 2 }  // A12
  ]

  const handleRunCurrentRound = () => {
    const currentData = getCurrentRoundData();
    
    // For Round 1, no traffic light selection is needed
    if (currentRound !== 1 && !currentData.selectedButton) {
      alert('Please select a traffic light color first!')
      return
    }

    let newCircleColors;
    
    if (currentRound === 1) {
      // Round 1: A1 always Green, A2 always Red, others use weighted random
      newCircleColors = circleWeights.map((circle, index) => {
        if (index === 0) { // A1
          return 'green';
        } else if (index === 1) { // A2
          return 'red';
        } else {
          // For A3-A12, use weighted random with green traffic light
          const weight = circle.weight;
          const randomValue = Math.random() * 6; // Random value between 0 and 6
          
          // If random value is less than weight, circle matches green
          // Otherwise, it's red
          if (randomValue < weight) {
            return 'green';
          } else {
            return 'red';
          }
        }
      });
      
      // Set selectedButton to 'green' for Round 1 to maintain consistency
      setCurrentRoundData({ 
        selectedButton: 'green',
        circleColors: newCircleColors,
        hasRun: true 
      });
    } else {
      // Other rounds: Use normal weighted random logic
      newCircleColors = circleWeights.map((circle, index) => {
        const weight = circle.weight;
        const randomValue = Math.random() * 6; // Random value between 0 and 6
        
        // If random value is less than weight, circle matches selected color
        // Otherwise, it's the opposite color
        if (randomValue < weight) {
          return currentData.selectedButton; // red or green
        } else {
          return currentData.selectedButton === 'red' ? 'green' : 'red';
        }
      });
      
      setCurrentRoundData({ 
        circleColors: newCircleColors,
        hasRun: true 
      });
    }

    console.log(`Round ${currentRound} - About to update state with new circle colors:`, newCircleColors);
    console.log(`Round ${currentRound} - New circle colors generated:`, newCircleColors);
    
    // Data will be automatically saved by the useEffect when roundsData changes
    console.log(`Round ${currentRound} - State updated, automatic save will occur`);
  }

  // Debug: Log current state
  console.log('Component rendering with state:', {
    isInitialized,
    currentRound,
    roundsDataKeys: Object.keys(roundsData),
    round1Data: roundsData[1] ? {
      inputSelections: roundsData[1].inputSelections,
      selectedButton: roundsData[1].selectedButton,
      hasRun: roundsData[1].hasRun,
      circleColors: roundsData[1].circleColors
    } : 'No round 1 data',
    is45Network
  });

  // Ensure we have valid data before rendering
  if (!roundsData || Object.keys(roundsData).length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      {/* Fixed Header Section */}
      <div className="fixed-header">
        {/* Header Bar */}
        <header className={`header-bar ${colorScheme}`}>
          <div className="header-content">
            <a 
              href="https://stageoneeducation.com/ai-workshop.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="header-left"
            >
              Artificial Intelligence Workshop
            </a>
            <div className="header-divider"></div>
            <a 
              href="https://stageoneeducation.com/human-neural-network.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="header-center"
            >
              Human Neural Network
            </a>
            <div className="header-spacer"></div>
            <a 
              href="https://stageoneeducation.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="header-right"
            >
              STAGE ONE EDUCATION
            </a>
          </div>
        </header>

                {/* Fixed Title Section */}
        <div className="fixed-title-section">
          <div className="round-titles-container">
                         <div className="round-titles-wrapper">
               <div className="left-container">
                 {/* Left container content can go here */}
               </div>
               <div className="centered-round-container">
                 <div 
                   className={`triangle-left ${currentRound > 1 ? 'clickable' : ''}`}
                   onClick={currentRound > 1 ? handleLeftArrowClick : undefined}
                 ></div>
                 <span className="round-title-main">
                   <h2>Round {currentRound}</h2>
                 </span>
                 <div 
                   className={`triangle-right ${currentRound < 10 ? 'clickable' : ''}`}
                   onClick={currentRound < 10 ? handleRightArrowClick : undefined}
                 ></div>
               </div>
               <div className="round-header-line"></div>
             </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="scrollable-content">
        <div className="main-content">
          <div className="title-section">
            <div className="image-title-box">
              <span className="image-title-text">
                {is45Network ? '45 participant Human Neural Network' : '27 participant Human Neural Network'}
              </span>
            </div>
            <div className="image-container">
              <img 
                src={is45Network ? "/45-nn.png" : "/27-nn.png"} 
                alt={is45Network ? "45 participant human neural network" : "27 participant human neural network"} 
                className="content-image" 
                style={is45Network ? { width: '70%', maxWidth: '70%' } : {}}
              />
            </div>
            <div 
              className="text-box"
              onClick={handleSensorBoxClick}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-box-content">Sensor Nodes</span>
            </div>

            
            {!getCurrentRoundData().isHidden && (
              <div className="traffic-light-section">
                {currentRound === 1 ? (
                  // Round 1: Show traffic light as green when visible
                  <>
                    <div className="traffic-light-display">
                      <div className="traffic-light-housing">
                        <div className="traffic-light-red inactive"></div>
                        <div className="traffic-light-green active">
                          <span className="traffic-light-letter">G</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Other rounds: Normal selection functionality
                  <>
                    <p className="instruction-text">Select state of the traffic light</p>
                    <div className="button-container">
                      <button 
                        className={`red-button ${getCurrentRoundData().selectedButton === 'red' ? 'selected' : ''}`}
                        onClick={() => handleButtonClick('red')}
                      >
                        Red
                      </button>
                      <button 
                        className={`green-button ${getCurrentRoundData().selectedButton === 'green' ? 'selected' : ''}`}
                        onClick={() => handleButtonClick('green')}
                      >
                        Green
                      </button>
                    </div>
                    <div className="traffic-light-display">
                      <div className="traffic-light-housing">
                        <div 
                          className={`traffic-light-red ${getCurrentRoundData().selectedButton === 'red' ? 'active' : 'inactive'}`}
                        >
                          {getCurrentRoundData().selectedButton === 'red' && <span className="traffic-light-letter">R</span>}
                        </div>
                        <div 
                          className={`traffic-light-green ${getCurrentRoundData().selectedButton === 'green' ? 'active' : 'inactive'}`}
                        >
                          {getCurrentRoundData().selectedButton === 'green' && <span className="traffic-light-letter">G</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="hide-button-container">
                  <button 
                    className={`hide-button ${getCurrentRoundData().isHidden ? 'selected' : ''}`}
                    onClick={toggleHide}
                  >
                    {getCurrentRoundData().isHidden ? 'Show Traffic Light' : 'Hide Traffic Light'}
                  </button>
                </div>
              </div>
            )}
            
            {getCurrentRoundData().isHidden && (
              <div className="hide-button-container">
                <button 
                  className={`hide-button ${getCurrentRoundData().isHidden ? 'selected' : ''}`}
                  onClick={toggleHide}
                >
                  {getCurrentRoundData().isHidden ? 'Show Traffic Light' : 'Hide Traffic Light'}
                </button>
              </div>
            )}
            
            <div className="run-button-container">
              <button 
                className={`run-button ${getCurrentRoundData().hasRun ? 'selected' : ''} ${colorScheme}`}
                onClick={handleRunCurrentRound}
              >
                Run Round {currentRound}
              </button>
            </div>
            
            <div className="circles-section">
              <div 
                className="circles-grid"
                style={is45Network ? { 
                  justifyContent: 'center',
                  display: 'flex !important',
                  flexWrap: 'wrap',
                  maxWidth: '70%',
                  margin: '0 auto',
                  gap: '10px',
                  width: '100%',
                  gridTemplateColumns: 'none !important',
                  grid: 'none !important',
                  gridTemplateRows: 'none !important',
                  gridAutoColumns: 'none !important',
                  gridAutoRows: 'none !important'
                } : {}}
              >
                {Array.from({ length: is45Network ? 20 : 12 }, (_, i) => i + 1).map((num) => (
                  <div 
                    key={num} 
                    className="circle-item"
                    style={is45Network ? {
                      flex: '0 0 calc(14.285% - 1px) !important',
                      minWidth: 'calc(14.285% - 1px) !important',
                      maxWidth: 'calc(14.285% - 1px) !important',
                      width: 'calc(14.285% - 1px) !important'
                    } : {}}
                  >
                    <span className="circle-label">A{num}</span>
                    {getCurrentRoundData().showCode && (
                      <span className="probability-text">
                        {((circleWeights[num-1].weight / 6) * 100).toFixed(1)}%
                      </span>
                    )}
                    <div className={`circle ${getCurrentRoundData().circleColors[num-1]}`}>
                      {getCurrentRoundData().circleColors[num-1] === 'red' && <span className="circle-text">R</span>}
                      {getCurrentRoundData().circleColors[num-1] === 'green' && <span className="circle-text">G</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="show-code-button-container">
              <button 
                className={`show-code-button ${getCurrentRoundData().showCode ? 'selected' : ''}`}
                onClick={toggleShowCode}
                style={is45Network ? { width: '120px' } : {}}
              >
                                  {getCurrentRoundData().showCode ? 'Hide Code' : 'Show Code'}
              </button>
            </div>
            
            <div 
              className="hidden-layer-text-box"
              onClick={toggleHiddenLayer}
              style={{ cursor: 'pointer' }}
            >
              <span className="hidden-layer-text-content">Hidden Layer Nodes</span>
                                <span className="expand-text">{getCurrentRoundData().isHiddenLayerExpanded ? '(Collapse)' : '(Expand)'}</span>
            </div>
            
            {getCurrentRoundData().isHiddenLayerExpanded && (
              <div className="node-instructions">
                <div className="b-node-section">
                  <h3 className="b-node-title">B Nodes</h3>
                  <p className="b-node-instruction"><span className="step-number">1.</span> Bubble in your <span className="sensor-node-text">Sensor Node</span> inputs</p>
                  <p className="b-node-instruction"><span className="step-number">2.</span> Roll the <img src="/die.png" alt="die" className="die-image" /></p>
                  <p className="b-node-instruction"><span className="step-number">3.</span> Bubble in your output</p>
                </div>
                
                <div className="center-section">
                  <h3 className="everyone-text">Everyone get up!</h3>
                  <p className="connections-text">Find your connections</p>
                </div>
                
                <div className="c-node-section">
                  <h3 className="c-node-title">C Nodes</h3>
                  <p className="c-node-instruction"><span className="step-number">1.</span> Bubble in your <span className="b-node-text">B Node</span> inputs</p>
                  <p className="c-node-instruction"><span className="step-number">2.</span> Roll the <img src="/die.png" alt="die" className="die-image" /></p>
                  <p className="c-node-instruction"><span className="step-number">3.</span> Bubble in your output</p>
                </div>
              </div>
            )}
            
            <div 
              className="output-text-box"
              onClick={toggleOutputNode}
              style={{ cursor: 'pointer' }}
            >
              <span className="output-text-box-content">Output Node</span>
                                <span className="expand-text">{getCurrentRoundData().isOutputNodeExpanded ? '(Collapse)' : '(Expand)'}</span>
            </div>
            
            {getCurrentRoundData().isOutputNodeExpanded && (
              <>
                <div className="tables-wrapper" key={`tables-${resetCounter}`}>
                  <div className="table-container">
                    <table className={`output-table ${colorScheme}`}>
                      <thead>
                        <tr>
                          <th>Node</th>
                          <th>Input</th>
                          <th>Numeric</th>
                          <th>×</th>
                          <th>Weight</th>
                          <th>=</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: is45Network ? 15 : 9 }, (_, i) => i + 1).map((index) => (
                          <tr key={index}>
                            <td>C{index}</td>
                            <td className={getCurrentRoundData().inputSelections[index-1] === 'red' ? 'input-cell-red' : getCurrentRoundData().inputSelections[index-1] === 'green' ? 'input-cell-green' : ''}>
                              <select 
                                value={getCurrentRoundData().inputSelections[index-1]} 
                                onChange={(e) => handleInputChange(index-1, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index-1, 1)}
                                data-row={index-1} 
                                data-column="1"
                              >
                                <option value=""></option>
                                <option value="red">Red</option>
                                <option value="green">Green</option>
                              </select>
                            </td>
                            <td>
                                                              {getCurrentRoundData().isAutoNumericActive ? (
                                <span>{getCurrentRoundData().numericValues[index-1]}</span>
                              ) : (
                                <select 
                                  value={getCurrentRoundData().numericValues[index-1]} 
                                  onChange={(e) => handleNumericChange(index-1, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, index-1, 2)}
                                  data-row={index-1} 
                                  data-column="2"
                                >
                                  <option value=""></option>
                                  <option value="1">1</option>
                                  <option value="-1">-1</option>
                                </select>
                              )}
                            </td>
                            <td>×</td>
                            <td>
                              {currentRound === 1 ? (
                                // Round 1: Show input box by default, only show "20" when auto is active
                                getCurrentRoundData().isAutoWeightActive ? (
                                  <span>{getCurrentRoundData().weightValues[index-1]}</span>
                                ) : (
                                  <input 
                                    type="text" 
                                    value={getCurrentRoundData().weightValues[index-1] || ''} 
                                    onChange={(e) => handleWeightChange(index-1, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index-1, 4)}
                                    data-row={index-1} 
                                    data-column="4"
                                    placeholder=""
                                  />
                                )
                              ) : (
                                // Round 2+: Show weights as read-only (carried over from previous round)
                                <span style={{fontWeight: 'bold', color: '#333'}}>
                                  {getCurrentRoundData().weightValues[index-1]}
                                </span>
                              )}
                            </td>
                            <td>=</td>
                                                        <td data-row={index-1} data-column="7">
                              {getCurrentRoundData().showNetworkDecision && getCurrentRoundData().valueResults[index-1] !== '' ? (
                                <span className="calculated-value">{getCurrentRoundData().valueResults[index-1]}</span>
                              ) : (
                                <input 
                                  type="text" 
                                  value={getCurrentRoundData().valueResults[index-1]} 
                                  onChange={(e) => handleValueChange(index-1, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, index-1, 7)}
                                  placeholder=""
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Auto buttons row */}
                        <tr className="auto-buttons-row">
                          <td></td> {/* Node column - empty */}
                          <td></td> {/* Input column - empty */}
                          <td>
                            <button className={`auto-button ${getCurrentRoundData().isAutoNumericActive ? 'active' : ''} ${colorScheme}`} onClick={handleAutoNumeric}>
                              Auto
                            </button>
                          </td>
                          <td></td> {/* × column - empty */}
                          <td>
                            {currentRound === 1 ? (
                              <button className={`auto-button ${getCurrentRoundData().isAutoWeightActive ? 'active' : ''} ${colorScheme}`} onClick={handleAutoWeight}>
                                Auto
                              </button>
                            ) : (
                              // Round 2+: No auto button for weights (weights are read-only)
                              <span></span>
                            )}
                          </td>
                          <td></td> {/* = column - empty */}
                          <td>
                            <button className={`auto-button ${getCurrentRoundData().isAutoValueActive ? 'active' : ''} ${colorScheme}`} onClick={handleAutoValue}>
                              Auto
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {getCurrentRoundData().showUpdateWeightsTable && (
                    <div className="update-weights-table-container">
                      <table className={`update-weights-table ${colorScheme}`}>
                        <thead>
                          <tr>
                            <th>Node</th>
                            <th>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: is45Network ? 15 : 9 }, (_, i) => i + 1).map((index) => (
                            <tr key={index}>
                              <td>C{index}</td>
                              <td>
                                {getCurrentRoundData().isUpdateWeightsAutoActive ? (
                                  <span style={{fontWeight: 'bold', color: '#333'}}>
                                    {getCurrentRoundData().updateWeightsValues[index-1]}
                                  </span>
                                ) : (
                                  <input 
                                    type="text" 
                                    value={getCurrentRoundData().updateWeightsValues[index-1]}
                                    data-index={index-1}
                                    onChange={(e) => {
                                      handleUpdateWeightChange(index-1, e.target.value)
                                    }}
                                    className="update-weight-input"
                                    placeholder=""
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                          {/* Auto button row for update weights table */}
                          <tr className="update-weights-auto-row">
                            <td></td> {/* Node column - empty */}
                            <td>
                              <button className={`auto-button ${getCurrentRoundData().isUpdateWeightsAutoActive ? 'active' : ''} ${colorScheme}`} onClick={handleUpdateWeightsAuto}>
                                Auto
                              </button>
                            </td>
                          </tr>
                          

                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {getCurrentRoundData().isOutputNodeExpanded && (
              <>
                <div className="orange-horizontal-line"></div>

                {/* Network Decision section - Button, table, and traffic light button grouped together */}
                <div className="network-decision-section">
                  <div className="compute-decision-button-container">
                    <button 
                      className={`compute-decision-button ${getCurrentRoundData().showNetworkDecision ? 'selected' : ''} ${colorScheme}`}
                      onClick={toggleNetworkDecision}
                    >
                      Compute the Network Decision
                    </button>
                  </div>

                  {/* Network Decision table and Traffic Light State button - Only visible after Compute button is pressed */}
                  {getCurrentRoundData().showNetworkDecision && (
                    <>
                      <div className="summary-table-container">
                        <table className={`summary-table ${colorScheme}`}>
                          <tbody>
                            <tr>
                              <td>Sum of (C) Node Values</td>
                              <td>Network Decision</td>
                            </tr>
                            <tr className={
                              getCurrentRoundData().networkDecision === 'Red' ? 'summary-row-red' :
                              getCurrentRoundData().networkDecision === 'Green' ? 'summary-row-green' : 
                              getCurrentRoundData().networkDecision === 'Undecided' ? 'summary-row-undecided' : ''
                            }>
                              <td>
                                {getCurrentRoundData().sumOfValues}
                              </td>
                              <td>
                                {getCurrentRoundData().networkDecision}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="traffic-light-state-button-container">
                        <button 
                          className={`traffic-light-state-button ${getCurrentRoundData().showTrafficLight ? 'selected' : ''} ${colorScheme}`}
                          onClick={toggleTrafficLight}
                        >
                          Traffic Light State
                        </button>
                      </div>

                      {getCurrentRoundData().showTrafficLight && (
                        <div className="traffic-light-display">
                          <div className="traffic-light-housing">
                            <div
                              className={`traffic-light-red ${currentRound === 1 ? 'inactive' : getCurrentRoundData().selectedButton === 'red' ? 'active' : 'inactive'}`}
                            >
                              {currentRound === 1 ? '' : getCurrentRoundData().selectedButton === 'red' && <span className="traffic-light-letter">R</span>}
                            </div>
                            <div
                              className={`traffic-light-green ${currentRound === 1 ? 'active' : getCurrentRoundData().selectedButton === 'green' ? 'active' : 'inactive'}`}
                            >
                              {currentRound === 1 ? <span className="traffic-light-letter">G</span> : getCurrentRoundData().selectedButton === 'green' && <span className="traffic-light-letter">G</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
            
            <div 
              className="summary-text-box"
              onClick={toggleSummary}
              style={{ cursor: 'pointer' }}
            >
              <span className="summary-text-box-content">Summary</span>
                                <span className="expand-text">{getCurrentRoundData().isSummaryExpanded ? '(Collapse)' : '(Expand)'}</span>
            </div>
            
            {getCurrentRoundData().isSummaryExpanded && (
              <>
                <div className="summary-details-container">
                  <table className={`summary-details-table ${colorScheme}`}>
                    <tbody>
                      <tr>
                        <td>Round</td>
                        <td>Network Status</td>
                        <td>Sum</td>
                      </tr>
                      {currentRound === 1 ? (
                        // Round 1: Show only current round data
                        <tr>
                          <td>1</td>
                          <td>{getCurrentRoundData().networkStatus}</td>
                          <td>{getCurrentRoundData().sumOfValues}</td>
                        </tr>
                      ) : (
                        // Round 2+: Show all previous rounds and current round data
                        <>
                          {/* Show all previous rounds */}
                          {Array.from({ length: currentRound - 1 }, (_, index) => {
                            const roundNumber = index + 1;
                            return (
                              <tr key={`round-${roundNumber}`}>
                                <td>{roundNumber}</td>
                                <td>{roundsData[roundNumber]?.networkStatus || ''}</td>
                                <td>{roundsData[roundNumber]?.sumOfValues || ''}</td>
                              </tr>
                            );
                          })}
                          {/* Show current round */}
                          <tr>
                            <td>{currentRound}</td>
                            <td>{getCurrentRoundData().networkStatus}</td>
                            <td>{getCurrentRoundData().sumOfValues}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="bar-graph-container">
                  <h3 className="bar-graph-title">C Node Weights</h3>
                  <div className="bar-graph-wrapper">
                    <div className="bar-graph">
                      <div className="bar-graph-chart">
                        <div className="bar-graph-axes">
                          <div className="bar-graph-y-axis"></div>
                          <div className="bar-graph-zero-line"></div>
                          <div className="bars-container">
                            {getCurrentRoundData().weightValues.map((weight, index) => {
                              const weightNum = parseFloat(weight) || 0;
                              // Domain: [-120, 120], so 20 is a very small bar
                              const maxHeight = 100; // 100px for full scale (-120 to 120 range)
                              const barHeight = Math.max(1, Math.abs(weightNum / 120) * maxHeight); // Scale to -120 to 120 range
                              const isNegative = weightNum < 0;
                              
                              return (
                                <div key={index} className="bar-column">
                                  <div className="bar-wrapper">
                                    <div 
                                      className={`bar ${isNegative ? 'negative' : ''}`}
                                      style={{
                                        height: `${barHeight}px`,
                                        marginTop: isNegative ? `${100 + barHeight}px` : `${100 - barHeight}px`
                                      }}
                                    >
                                      <div className={`bar-value ${isNegative ? 'bar-value-negative' : ''}`}>
                                        {weightNum}
                                      </div>
                                      <div className={`bar-label ${isNegative ? 'bar-label-negative' : ''}`}>C{index + 1}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="update-weights-button-container">
                  <button className={`update-weights-button ${colorScheme}`} onClick={handleUpdateWeights}>
                    Update Weights
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      

      
      <div className="horizontal-line"></div>
      <div className="copyright-footer">
        <div className="footer-bottom-row">
          <div className="color-scheme-footer">
            <select
              id="color-scheme-select"
              value={colorScheme}
              onChange={(e) => handleColorSchemeChange(e.target.value)}
              className="color-scheme-dropdown"
            >
              <option value="orange">Heading Color</option>
              <option value="orange">Orange</option>
              <option value="gray">Gray</option>
            </select>
          </div>
          <div className="copyright-text">© 2025 Stage One Education, LLC</div>
          <div className="right-side-container">
            <button className="reset-button" onClick={resetAllData}>
              Reset
            </button>
            <div className="version-number">V25.8</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
