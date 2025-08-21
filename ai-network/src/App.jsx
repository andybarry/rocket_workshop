import { useState } from 'react'
import './App.css'
import { useEffect } from 'react'

function App() {
  // Helper function to create complete round data
  const createRoundData = (roundNumber) => ({
    lightStates: [false, false, false], // [top, middle, bottom]
    selectedButton: null, // 'red' or 'green' or null
    isHidden: false, // to track if traffic light section is hidden
    circleColors: Array(12).fill('gray'), // track circle colors
    showCode: false, // to track if code/probabilities are shown
    hasRun: false, // to track if current round has been executed
    inputSelections: Array(9).fill(''), // track dropdown selections for C1-C9
    numericValues: Array(9).fill(''), // track numeric input values for C1-C9
    weightValues: Array(9).fill(roundNumber === 1 ? '' : '20'), // track weight input values for C1-C9
    valueResults: Array(9).fill(''), // track value results for C1-C9
    previousNumericValues: Array(9).fill(''), // track previous numeric values
    isAutoNumericActive: false, // track if auto numeric is active
    previousWeightValues: Array(9).fill(''), // track previous weight values
    isAutoWeightActive: false, // track if auto weight is active
    isUpdateWeightsAutoActive: false, // track if update weights auto is active
    updateWeightsValues: Array(9).fill(''), // track independent weight values for update weights table, start with blank
    previousUpdateWeightsValues: Array(9).fill(''), // track previous update weights values
    previousValueResults: Array(9).fill(''), // track previous value results
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
    1: createRoundData(1),
    2: createRoundData(2),
    3: createRoundData(3),
    4: createRoundData(4),
    5: createRoundData(5),
    6: createRoundData(6),
    7: createRoundData(7),
    8: createRoundData(8),
    9: createRoundData(9),
    10: createRoundData(10)
  });
  const [colorScheme, setColorScheme] = useState('orange') // track color scheme: 'orange' or 'gray'
  // Round selection removed - only Round 1 is displayed





  // Helper functions to get and set current round data
  const getCurrentRoundData = () => roundsData[currentRound];
  const setCurrentRoundData = (updates) => {
    setRoundsData(prev => ({
      ...prev,
      [currentRound]: { ...prev[currentRound], ...updates }
    }));
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
  };

  const toggleOutputNode = () => {
    setCurrentRoundData({ isOutputNodeExpanded: !getCurrentRoundData().isOutputNodeExpanded });
  };

  const toggleSummary = () => {
    setCurrentRoundData({ isSummaryExpanded: !getCurrentRoundData().isSummaryExpanded });
  };

  // Round selection removed - only Round 1 is displayed

  // Round offset calculation removed - no longer needed

  // Round selection removed - only Round 1 is displayed

  // Round offset calculation removed - only centering Round 1

  const handleLeftArrowClick = () => {
    if (currentRound > 1) {
      // Carry over weights from current round to previous round if needed
      const currentData = getCurrentRoundData();
      const previousRound = currentRound - 1;
      
      // Determine which weights to carry over
      let weightsToCarry = Array(9).fill('20'); // Default weights
      
      // Priority: 1) Auto-calculated weights, 2) Manually entered weights, 3) Default weights
      if (currentData.showUpdateWeightsTable) {
        if (currentData.isUpdateWeightsAutoActive && currentData.updateWeightsValues.some(w => w !== '')) {
          // Use the auto-calculated weights (any calculated values)
          weightsToCarry = [...currentData.updateWeightsValues];
        } else if (currentData.updateWeightsValues.some(w => w !== '')) {
          // Use manually entered weights
          weightsToCarry = [...currentData.updateWeightsValues];
        }
      }
      
      // Update the previous round's weight values
      setRoundsData(prev => ({
        ...prev,
        [previousRound]: {
          ...prev[previousRound],
          weightValues: weightsToCarry
        }
      }));
      
      console.log(`Carrying over weights to Round ${previousRound}:`, weightsToCarry);
      setCurrentRound(previousRound);
    }
  };

  const handleRightArrowClick = () => {
    if (currentRound < 10) {
      // Carry over the updated weights from the current round to the next round
      const currentData = getCurrentRoundData();
      const nextRound = currentRound + 1;
      
      // Determine which weights to carry over
      let weightsToCarry = Array(9).fill('20'); // Default weights
      
      // Priority: 1) Auto-calculated weights, 2) Manually entered weights, 3) Default weights
      if (currentData.showUpdateWeightsTable) {
        if (currentData.isUpdateWeightsAutoActive && currentData.updateWeightsValues.some(w => w !== '')) {
          // Use the auto-calculated weights (any calculated values)
          weightsToCarry = [...currentData.updateWeightsValues];
        } else if (currentData.updateWeightsValues.some(w => w !== '')) {
          // Use manually entered weights
          weightsToCarry = [...currentData.updateWeightsValues];
        }
      }
      
      // Update the next round's weight values
      setRoundsData(prev => ({
        ...prev,
        [nextRound]: {
          ...prev[nextRound],
          weightValues: weightsToCarry
        }
      }));
      
      console.log(`Carrying over weights to Round ${nextRound}:`, weightsToCarry);
      setCurrentRound(nextRound);
    }
  };

  const handleColorSchemeChange = (scheme) => {
    console.log('Color scheme changing to:', scheme)
    setColorScheme(scheme)
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
  }

  const handleButtonClick = (buttonType) => {
    setCurrentRoundData({ selectedButton: buttonType });
  };

  const toggleHide = () => {
    setCurrentRoundData({ isHidden: !getCurrentRoundData().isHidden });
  };

  const toggleShowCode = () => {
    setCurrentRoundData({ showCode: !getCurrentRoundData().showCode });
  };

  const startGPUAnimation = () => {
    // GPU is hidden - do not show
    setCurrentRoundData({ gpuAnimationState: 'hidden' });
  };

  const calculateProgressiveValues = () => {
    const currentData = getCurrentRoundData();
    const totalNodes = 9;
    const delayPerNode = 500; // 0.5 seconds per node
    
    console.log('Starting progressive value calculation...');
    
    // Start with empty values and reset sum
    const emptyValues = Array(9).fill('');
    setCurrentRoundData({ 
      valueResults: emptyValues,
      sumOfValues: '0',
      networkDecision: 'Undecided'
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
          
          // Calculate current sum based on visible values
          const visibleValues = newValueResults.slice(0, i + 1);
          const currentSum = visibleValues.reduce((sum, val) => sum + (parseInt(val) || 0), 0);
          
          // Create progressive sum display showing each addition step
          let progressiveSumDisplay = '';
          if (i === 0) {
            progressiveSumDisplay = `C1 (${calculatedValue})`;
          } else {
            const steps = [];
            for (let j = 0; j <= i; j++) {
              if (newValueResults[j] !== '') {
                steps.push(`C${j + 1} (${newValueResults[j]})`);
              }
            }
            progressiveSumDisplay = steps.join(' + ');
          }
          
          // Update network decision based on current sum
          let currentDecision = 'Undecided';
          if (currentSum > 0) {
            currentDecision = 'Red';
          } else if (currentSum < 0) {
            currentDecision = 'Green';
          }
          
          console.log(`Node ${i + 1}: Value = ${calculatedValue}, Progressive Sum = ${progressiveSumDisplay}, Current Sum = ${currentSum}, Decision = ${currentDecision}`);
          
          return {
            valueResults: newValueResults,
            sumOfValues: progressiveSumDisplay,
            networkDecision: currentDecision
          };
        });
        
        // No animations or effects - just update the values
        console.log(`Updated value cell ${i} with calculated value: ${calculatedValue}`);
        
      }, i * delayPerNode);
    }
  };

  // Add GPU state to all rounds that don't have it (run first)
  useEffect(() => {
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
      setRoundsData(updatedRoundsData);
    }
  }, []);

  // Load saved data from localStorage on component mount (run after GPU state is added)
  useEffect(() => {
    // Wait a bit to ensure initial state is set up
    const timer = setTimeout(() => {
      const savedData = localStorage.getItem('aiNetworkData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          console.log('Found saved data:', parsedData);
          
          if (parsedData.roundsData) {
            console.log('Loading roundsData:', parsedData.roundsData);
            // Ensure all rounds have the complete structure by merging with createRoundData
            const completeRoundsData = {};
            for (let round = 1; round <= 10; round++) {
              if (parsedData.roundsData[round]) {
                completeRoundsData[round] = {
                  ...createRoundData(round),
                  ...parsedData.roundsData[round]
                };
              } else {
                completeRoundsData[round] = createRoundData(round);
              }
            }
            setRoundsData(completeRoundsData);
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
        }
      } else {
        console.log('No saved data found in localStorage');
      }
    }, 200); // Increased delay to ensure initial state is ready

    return () => clearTimeout(timer);
  }, []);

  // Save data to localStorage whenever any important state changes (run last)
  useEffect(() => {
    // Only save if we have actual data (not just initial state)
    if (Object.keys(roundsData).length > 0) {
      const dataToSave = {
        roundsData,
        currentRound,
        colorScheme,
        timestamp: Date.now()
      };
      localStorage.setItem('aiNetworkData', JSON.stringify(dataToSave));
      console.log('Data saved to localStorage:', dataToSave);
    }
  }, [roundsData, currentRound, colorScheme]);

  const toggleNetworkDecision = () => {
    const newShowState = !getCurrentRoundData().showNetworkDecision;
    setCurrentRoundData({ showNetworkDecision: newShowState });
    
    // Calculate summary when showing the network decision
    if (newShowState) {
      // Start GPU animation sequence
      startGPUAnimation();
      
      // Start progressive value calculation
      calculateProgressiveValues();
    }
  };

  const toggleTrafficLight = () => {
    setCurrentRoundData({ showTrafficLight: !getCurrentRoundData().showTrafficLight });
  };

  const resetAllData = () => {
    // Clear localStorage
    localStorage.removeItem('aiNetworkData');
    
    // Reset to initial state
    setCurrentRound(1);
    setColorScheme('orange');
    
    // Reset all rounds data to initial state using the helper function
    const initialRoundsData = {
      1: createRoundData(1),
      2: createRoundData(2),
      3: createRoundData(3),
      4: createRoundData(4),
      5: createRoundData(5),
      6: createRoundData(6),
      7: {
        inputSelections: Array(9).fill(''),
        numericValues: Array(9).fill(''),
        weightValues: Array(9).fill('20'),
        valueResults: Array(9).fill(''),
        isAutoNumericActive: false,
        isAutoWeightActive: false,
        isAutoValueActive: false,
        showNetworkDecision: false,
        sumOfValues: '0',
        networkDecision: 'Undecided',
        networkStatus: '',
        isOutputNodeExpanded: false,
        showUpdateWeightsTable: false,
        isUpdateWeightsAutoActive: false,
        updateWeightsValues: Array(9).fill(''),
        isSummaryExpanded: false,
        showTrafficLight: false,
        selectedButton: '',
        gpuAnimationState: 'idle',
        gpuFanSpeed: 0
      },
      8: createRoundData(8),
      9: createRoundData(9),
      10: createRoundData(10)
    };
    
    setRoundsData(initialRoundsData);
    
    console.log('All data has been reset to initial state');
  };

  const handleInputChange = (index, value) => {
    const currentData = getCurrentRoundData();
    const newSelections = [...currentData.inputSelections]
    newSelections[index] = value
    setCurrentRoundData({ inputSelections: newSelections })
    // Numeric values will NOT be automatically updated - user must select manually or use auto button
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
  }

  const handleAutoWeight = () => {
    const currentData = getCurrentRoundData();
    if (!currentData.isAutoWeightActive) {
      // Save current values and apply auto-fill
      setCurrentRoundData({ 
        previousWeightValues: [...currentData.weightValues],
        weightValues: Array(9).fill('20'),
        isAutoWeightActive: true
      })
    } else {
      // Restore previous values and deactivate auto
      setCurrentRoundData({ 
        weightValues: [...currentData.previousWeightValues],
        isAutoWeightActive: false
      })
    }
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
  }

  const handleAutoValue = () => {
    const currentData = getCurrentRoundData();
    if (!currentData.isAutoValueActive) {
      // Save current values and apply auto-fill
      setCurrentRoundData({ 
        previousValueResults: [...currentData.valueResults],
        valueResults: Array(9).fill('').map((_, i) => {
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
    const newWeightValues = Array(9).fill('20')
    
    // Calculate value results based on current numeric and weight values (only if auto value is active)
    const newValueResults = Array(9).fill('')
    for (let i = 0; i < 9; i++) {
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
        return;
      }
      
      // Add current node value
      const value = valueResults[index] === '' ? 0 : parseFloat(valueResults[index]);
      const newSum = currentSum + value;
      
      // Update the sum display
      setCurrentRoundData({ sumOfValues: newSum.toString() });
      
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
      } else if (columnIndex === 6) { // Value column
        nextRow = rowIndex + 1
        nextColumn = 6
      }
      
      // If we're at the last row, wrap to the first row
      if (nextRow >= 9) {
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
  const circleWeights = [
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
    if (!currentData.selectedButton) {
      alert('Please select a traffic light color first!')
      return
    }

    const newCircleColors = circleWeights.map((circle, index) => {
      const weight = circle.weight
      const randomValue = Math.random() * 6 // Random value between 0 and 6
      
      // If random value is less than weight, circle matches selected color
      // Otherwise, it's the opposite color
      if (randomValue < weight) {
        return currentData.selectedButton // red or green
      } else {
        return currentData.selectedButton === 'red' ? 'green' : 'red'
      }
    })

    setCurrentRoundData({ 
      circleColors: newCircleColors,
      hasRun: true 
    });
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
              <span className="image-title-text">27 participant Human Neural Network</span>
            </div>
            <div className="image-container">
              <img src="/27-nn.png" alt="27 participant human neural network" className="content-image" />
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
                <div className="hide-button-container">
                  <button 
                    className={`hide-button ${getCurrentRoundData().isHidden ? 'selected' : ''}`}
                    onClick={toggleHide}
                  >
                    {getCurrentRoundData().isHidden ? 'Show Traffic Light' : 'Hide Traffic Light'}
                  </button>
                </div>
                <div className="traffic-light-display">
                  <div className="traffic-light-housing">
                    <div 
                      className={`traffic-light-red ${getCurrentRoundData().selectedButton === 'red' ? 'active' : 'inactive'}`}
                    ></div>
                    <div 
                      className={`traffic-light-green ${getCurrentRoundData().selectedButton === 'green' ? 'active' : 'inactive'}`}
                    ></div>
                  </div>
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
              <div className="circles-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <div key={num} className="circle-item">
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
                <div className="tables-wrapper">
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
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
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
                                // Round 1: Allow editing with auto button functionality
                                getCurrentRoundData().isAutoWeightActive ? (
                                  <span>{getCurrentRoundData().weightValues[index-1]}</span>
                                ) : (
                                  <input 
                                    type="text" 
                                    value={getCurrentRoundData().weightValues[index-1]} 
                                    onChange={(e) => handleWeightChange(index-1, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index-1, 4)}
                                    data-row={index-1} 
                                    data-column="4"
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
                                                        <td data-row={index-1} data-column="6">
                              {getCurrentRoundData().showNetworkDecision && getCurrentRoundData().valueResults[index-1] !== '' ? (
                                <span className="calculated-value">{getCurrentRoundData().valueResults[index-1]}</span>
                              ) : (
                                <input 
                                  type="text" 
                                  value={getCurrentRoundData().valueResults[index-1]} 
                                  onChange={(e) => handleValueChange(index-1, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, index-1, 6)}
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
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
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
            
                <div className="compute-decision-button-container">
                  <button 
                    className={`compute-decision-button ${getCurrentRoundData().showNetworkDecision ? 'selected' : ''} ${colorScheme}`}
                    onClick={toggleNetworkDecision}
                  >
                    Compute the Network Decision
                  </button>
                </div>

                {/* Fan Blade Rectangle */}
                <div className={`fan-blade-rectangle ${
                  getCurrentRoundData().gpuAnimationState === 'visible' ? 'visible' : 'hidden'
                }`}>
                  <div className="fan-circle">
                    <div className="new-fan-blades">
                      <div className="new-blade new-blade-1"></div>
                      <div className="new-blade new-blade-2"></div>
                      <div className="new-blade new-blade-3"></div>
                      <div className="new-blade new-blade-4"></div>
                      <div className="new-blade new-blade-5"></div>
                      <div className="new-blade new-blade-6"></div>
                      <div className="new-blade new-blade-7"></div>
                      <div className="new-blade new-blade-8"></div>
                      <div className="new-blade new-blade-9"></div>
                      <div className="new-blade new-blade-10"></div>
                    </div>
                  </div>
                  <div className="fan-circle">
                    <div className="new-fan-blades">
                      <div className="new-blade new-blade-1"></div>
                      <div className="new-blade new-blade-2"></div>
                      <div className="new-blade new-blade-3"></div>
                      <div className="new-blade new-blade-4"></div>
                      <div className="new-blade new-blade-5"></div>
                      <div className="new-blade new-blade-6"></div>
                      <div className="new-blade new-blade-7"></div>
                      <div className="new-blade new-blade-8"></div>
                      <div className="new-blade new-blade-9"></div>
                      <div className="new-blade new-blade-10"></div>
                    </div>
                  </div>
                  <div className="fan-circle">
                    <div className="new-fan-blades">
                      <div className="new-blade new-blade-1"></div>
                      <div className="new-blade new-blade-2"></div>
                      <div className="new-blade new-blade-3"></div>
                      <div className="new-blade new-blade-4"></div>
                      <div className="new-blade new-blade-5"></div>
                      <div className="new-blade new-blade-6"></div>
                      <div className="new-blade new-blade-7"></div>
                      <div className="new-blade new-blade-8"></div>
                      <div className="new-blade new-blade-9"></div>
                      <div className="new-blade new-blade-10"></div>
                    </div>
                  </div>
                </div>

                {/* Network Decision table - Always visible */}
                <div className="summary-table-container">
                  <table className={`summary-table ${colorScheme}`}>
                    <tbody>
                      <tr>
                        <td>Sum of (C) Node Values</td>
                        <td>Network Decision</td>
                      </tr>
                      <tr className={
                        getCurrentRoundData().showNetworkDecision && getCurrentRoundData().networkDecision === 'Red' ? 'summary-row-red' :
                        getCurrentRoundData().showNetworkDecision && getCurrentRoundData().networkDecision === 'Green' ? 'summary-row-green' : ''
                      }>
                        <td>
                          {getCurrentRoundData().showNetworkDecision ? getCurrentRoundData().sumOfValues : '0'}
                        </td>
                        <td>
                          {getCurrentRoundData().showNetworkDecision ? getCurrentRoundData().networkDecision : 'Undecided'}
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
                )}
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
          <div className="version-number">V25.8</div>
          <button className="reset-button" onClick={resetAllData}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
