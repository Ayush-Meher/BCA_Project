import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const ConsoleContainer = styled.div`
  background-color: #1e1e1e;
  border-radius: 5px;
  padding: 10px;
  margin: 10px;
  height: 500px;
  display: flex;
  flex-direction: column;
`;

const ConsoleOutput = styled.div`
  color: #ffffff;
  font-family: monospace;
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  white-space: pre-wrap;
  background-color: #2d2d2d;
  margin-bottom: 10px;
  border-radius: 3px;
`;

const ConsoleInput = styled.textarea`
  background-color: #2d2d2d;
  color: #ffffff;
  font-family: monospace;
  border: 1px solid #3f3f3f;
  border-radius: 3px;
  padding: 5px;
  resize: none;
  height: 150px;
  margin-bottom: 5px;
`;

const ConsoleLine = styled.div`
  color: ${props => props.error ? '#ff6b6b' : '#ffffff'};
  margin: 2px 0;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ConsoleControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  gap: 8px;
`;

const PlayButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

// Store console states globally
const consoleStates = {};

const JavaScriptConsole = ({ 
  consoleId, 
  content, 
  onContentChange,
  farm,
  setPrintFunction
}) => {
  const [input, setInput] = useState(content || '');
  const [output, setOutput] = useState([
    { text: '🌟 Welcome to the JavaScript Console! 🌟\n', type: 'info' },
    { text: '📝 Basic Commands:\n', type: 'info' },
    { text: '  • move(x, y)         - Move to coordinates (x,y)\n', type: 'info' },
    { text: '  • scan()             - Get info about current tile\n', type: 'info' },
    { text: '  • position()         - Get current coordinates\n\n', type: 'info' },
    { text: '🚜 Farming Commands:\n', type: 'info' },
    { text: '  • plow()            - Plow the current tile\n', type: 'info' },
    { text: '  • plant("crop")     - Plant a crop (wheat unlocked, others in Tech Tree)\n', type: 'info' },
    { text: '  • harvest()         - Harvest ready crop at current tile\n\n', type: 'info' },
    { text: '🏗️ Farm Management:\n', type: 'info' },
    { text: '  • expand()          - Expand farm size (max 5x5)\n', type: 'info' },
    { text: '  • sell("type", amount) - Sell harvested crops\n', type: 'info' },
    { text: '  • buy("type", amount)  - Buy seeds for planting\n\n', type: 'info' },
    { text: '💡 Tips:\n', type: 'info' },
    { text: '  • Start with expand() to increase farm size\n', type: 'info' },
    { text: '  • Use scan() to check tile status\n', type: 'info' },
    { text: '  • Crops must be planted on plowed land\n', type: 'info' },
    { text: '  • Unlock more crops in the Tech Tree\n', type: 'info' },
    { text: '  • Buy seeds before planting\n\n', type: 'info' },
    { text: '⌨️ Usage:\n', type: 'info' },
    { text: '  • Type your code and press Play (▶) or Ctrl+Enter\n', type: 'info' },
    { text: '  • Each command runs once when executed\n', type: 'info' },
    { text: '  • Multiple commands can be entered on separate lines\n\n', type: 'info' }
  ]);
  const outputRef = useRef(output);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const executionInterval = useRef(null);

  // Keep outputRef in sync
  useEffect(() => {
    outputRef.current = output;
  }, [output]);

  // Set up print function for this console
  useEffect(() => {
    if (setPrintFunction) {
      setPrintFunction((text) => {
        setOutput(prev => [...prev, { text: text + '\n', type: 'normal' }]);
      });
    }
  }, [setPrintFunction]);

  // Initialize or restore console state
  useEffect(() => {
    if (!consoleStates[consoleId]) {
      consoleStates[consoleId] = {
        input: '',
        output: outputRef.current,
        isPlaying: false,
        currentLine: 0,
        initialized: false
      };
    } else {
      setInput(consoleStates[consoleId].input);
      setOutput(consoleStates[consoleId].output);
      setIsPlaying(consoleStates[consoleId].isPlaying);
      setCurrentLine(consoleStates[consoleId].currentLine);
    }

    // Show initialization message only once per console
    if (!consoleStates[consoleId].initialized && farm) {
      setOutput(prev => [...prev, { text: `Farm initialized: ${farm.toString()}\n`, type: 'info' }]);
      consoleStates[consoleId].initialized = true;
    }
  }, [consoleId, farm]);

  // Save console state when it changes
  useEffect(() => {
    if (consoleStates[consoleId]) {
      consoleStates[consoleId] = {
        input,
        output,
        isPlaying,
        currentLine,
        initialized: true
      };
    }
  }, [input, output, isPlaying, currentLine, consoleId]);

  // Update parent when input changes
  useEffect(() => {
    onContentChange?.(consoleId, input);
  }, [input, consoleId, onContentChange]);

  // Update local state when content prop changes
  useEffect(() => {
    if (content !== undefined && content !== input) {
      setInput(content);
    }
  }, [content]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      togglePlayPause();
    }
  };

  const executeLine = (line) => {
    if (!farm) return;

    try {
      setOutput(prev => [...prev, { text: '\n>>> ' + line + '\n', type: 'command' }]);

      // Create a function that returns a Promise to handle async operations
      const executeCode = new Function(
        'farm',
        `
        const move = farm.move.bind(farm);
        const plow = farm.plow.bind(farm);
        const plant = farm.plant.bind(farm);
        const harvest = farm.harvest.bind(farm);
        const scan = farm.scan.bind(farm);
        const position = farm.position.bind(farm);
        const expand = farm.expand.bind(farm);
        const sell = farm.sell.bind(farm);
        const buy = farm.buy.bind(farm);
        
        return new Promise((resolve, reject) => {
          try {
            const result = eval(${JSON.stringify(line)});
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            farm.print('Error: ' + error.message);
            reject(error);
          }
        });
      `);

      return executeCode(farm);
    } catch (error) {
      setOutput(prev => [...prev, { text: 'Error: ' + error.message + '\n', type: 'error' }]);
      return Promise.reject(error);
    }
  };

  const togglePlayPause = async () => {
    if (!input.trim() || !farm) return;

    if (!isPlaying) {
      // Start playing
      setIsPlaying(true);
      try {
        // Execute the entire code at once
        const result = await executeLine(input);
        if (result !== undefined) {
          setOutput(prev => [...prev, { text: result + '\n', type: 'normal' }]);
        }
      } catch (error) {
        console.error('Execution error:', error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (executionInterval.current) {
        clearInterval(executionInterval.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  return (
    <ConsoleContainer>
      <ConsoleOutput>
        {output.map((line, index) => (
          <ConsoleLine key={index} error={line.type === 'error'}>
            {line.text}
          </ConsoleLine>
        ))}
      </ConsoleOutput>
      <ConsoleInput
        id={`console-${consoleId}`}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter JavaScript code here..."
      />
      <ConsoleControls>
        <PlayButton onClick={togglePlayPause}>
          {isPlaying ? '⏸️' : '▶️'}
        </PlayButton>
      </ConsoleControls>
    </ConsoleContainer>
  );
}

export default JavaScriptConsole; 