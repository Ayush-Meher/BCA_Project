import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import JavaScriptConsole from './JavaScriptConsole';
import TechTree from './TechTree';
import Game3D from './Game3D';
import SaveLoadModal from './SaveLoadModal';

const GameContainer = styled.div`
  display: grid;
  grid-template-areas:
    "header header header"
    "grid view console";
  grid-template-columns: minmax(300px, 25%) minmax(400px, 45%) minmax(300px, 30%);
  grid-template-rows: 60px 1fr;
  gap: 16px;
  padding: 16px;
  height: 100vh;
  background-color: #1E1E1E;
  box-sizing: border-box;
`;

const Header = styled.div`
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2A2A2A;
  padding: 0 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: white;
  margin: 0;
  font-size: 24px;
`;

const GameControls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const SaveLoadButton = styled.button`
  background-color: #2ecc71;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #27ae60;
  }
`;

const MoneyDisplay = styled.div`
  background-color: #27ae60;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
`;

const TechTreeButton = styled.button`
  background-color: #8e44ad;
  &:hover {
    background-color: #9b59b6;
  }
`;

const GameGridContainer = styled.div`
  grid-area: grid;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #2A2A2A;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.size}, 1fr);
  grid-template-rows: repeat(${props => props.size}, 1fr);
  gap: 5px;
  width: 300px;
  height: 300px;
  background-color: #8B4513;
  padding: 10px;
  border-radius: 5px;
`;

const LandTile = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background-color: ${props => {
    if (props.isPlowed) return '#8B4513';
    if (props.hasCrop && props.cropState === 'growing') return '#90EE90';
    if (props.hasCrop && props.cropState === 'ready') return '#228B22';
    return '#90EE90';
  }};
  border: 1px solid #2c3e50;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const CropIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background-color: ${props => props.color};
  border-radius: 50%;
`;

const StyledDroneSprite = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 60%;
  transform: translate(-50%, -50%);
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  
  &::before {
    content: '🛸';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
  }
`;

const StyledGameStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #232323;
  border-radius: 8px;
  font-size: 14px;
  color: #E0E0E0;

  div {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
`;

const ThreeDViewContainer = styled.div`
  grid-area: view;
  background: #2A2A2A;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledConsoleContainer = styled.div`
  grid-area: console;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #2A2A2A;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ConsoleTabs = styled.div`
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
`;

const ConsoleTab = styled.button`
  background-color: ${props => props.active ? '#3498db' : '#2c3e50'};
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? '#2980b9' : '#34495e'};
  }
`;

const AddConsoleButton = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  
  &:hover {
    background-color: #219653;
  }
`;

const ConsoleWrapper = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  height: calc(100% - 40px);
  background: #2A2A2A;
  border-radius: 8px;
  overflow: hidden;
`;

const CloseButton = styled.span`
  margin-left: 8px;
  padding: 0 4px;
  color: #fff;
  opacity: 0.7;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
`;

export const Game = ({ inventory, setInventory, money, setMoney, onOpenTechTree, unlockedCrops }) => {
  const navigate = useNavigate();
  const [activeConsole, setActiveConsole] = useState(0);
  const [consoles, setConsoles] = useState([{ id: 0, name: 'Console 1' }]);
  const [consoleContents, setConsoleContents] = useState({});
  const [modalState, setModalState] = useState({ isOpen: false, mode: null });

  const [gameState, setGameState] = useState({
    grid: Array(1).fill().map(() => Array(1).fill(null)),
    money: money,
    inventory: {
      wheat_seeds: 0,
      corn_seeds: 0,
      potato_seeds: 0,
      wheat: 0,
      corn: 0,
      potato: 0,
      ...inventory
    },
    dronePosition: { x: 0, y: 0 },
    droneInventory: [],
    land: Array(1).fill().map(() => ({
      isPlowed: false,
      hasCrop: false,
      cropType: null,
      cropState: null
    })),
    drone: {
      x: 0,
      y: 0
    },
    unlockedCrops: unlockedCrops
  });

  const farmRef = useRef(null);

  // Initialize shared farm instance
  useEffect(() => {
    if (!farmRef.current) {
      farmRef.current = createFarmInstance(gameState, setGameState, handleBuyItem, handleSellItem);
    }

    // Update farm properties without recreating the object
    if (farmRef.current) {
      // Only update the properties that can change
      farmRef.current.money = gameState.money;
      farmRef.current.land = gameState.land;
      farmRef.current.size = Math.sqrt(gameState.land.length);
      farmRef.current.drone = gameState.drone;
      farmRef.current.inventory = gameState.inventory;
      farmRef.current.unlockedCrops = gameState.unlockedCrops;
    }
  }, [gameState]);

  // Function to create farm instance
  const createFarmInstance = (gameState, setGameState, onBuyItem, onSellItem) => {
    const farm = {
      money: gameState.money,
      land: gameState.land,
      size: Math.sqrt(gameState.land.length),
      maxSize: 5,
      drone: gameState.drone,
      inventory: gameState.inventory,
      unlockedCrops: gameState.unlockedCrops,
      
      print: function(text) {
        // Print function will be set by each console
      },

      expand: function() {
        if (this.size >= this.maxSize) {
          this.print(`Farm is already at maximum size (${this.maxSize}x${this.maxSize})`);
          return false;
        }

        const newSize = this.size + 1;
        const newLand = Array(newSize * newSize).fill().map((_, index) => {
          if (index < this.land.length) {
            return this.land[index];
          }
          return {
            isPlowed: false,
            hasCrop: false,
            cropType: null,
            cropState: null,
            plantedTime: null
          };
        });

        setGameState(prev => ({ ...prev, land: newLand }));
        this.land = newLand;
        this.size = newSize;
        this.print(`Farm expanded to ${newSize}x${newSize}`);
        return true;
      },
      
      move: function(x, y) {
        if (0 <= x && x < this.size && 0 <= y && y < this.size) {
          setGameState(prev => ({
            ...prev,
            dronePosition: { x, y },
            drone: { x, y }
          }));
          this.drone = { x, y };
          this.print(`Moved to (${x}, ${y})`);
          return true;
        }
        this.print("Invalid coordinates");
        return false;
      },

      plow: function() {
        const x = this.drone.x;
        const y = this.drone.y;
        const index = y * this.size + x;
        if (this.land[index].isPlowed) {
          this.print("This tile is already plowed");
          return false;
        }
        const newLand = [...this.land];
        newLand[index] = { ...newLand[index], isPlowed: true };
        setGameState(prev => ({ ...prev, land: newLand }));
        this.land = newLand;
        this.print(`Successfully plowed tile at (${x}, ${y})`);
        return true;
      },

      plant: function(cropType) {
        const x = this.drone.x;
        const y = this.drone.y;
        const index = y * this.size + x;
        
        // Check if crop is unlocked
        if (!this.unlockedCrops.includes(cropType)) {
          this.print(`Cannot plant ${cropType} - You need to unlock it first in the Tech Tree!`);
          return false;
        }
        
        // Check if we have seeds
        if (!this.inventory[`${cropType}_seeds`] || this.inventory[`${cropType}_seeds`] <= 0) {
          this.print(`Cannot plant ${cropType} - No seeds available!`);
          return false;
        }

        if (this.land[index].isPlowed && !this.land[index].hasCrop) {
          const newLand = [...this.land];
          newLand[index] = {
            ...newLand[index],
            hasCrop: true,
            cropType: cropType,
            cropState: 'growing',
            plantedTime: Date.now()
          };
          
          // Update inventory
          const newInventory = {
            ...this.inventory,
            [`${cropType}_seeds`]: this.inventory[`${cropType}_seeds`] - 1
          };
          
          setGameState(prev => ({
            ...prev,
            land: newLand,
            inventory: newInventory
          }));
          
          this.land = newLand;
          this.inventory = newInventory;
          this.print(`Successfully planted ${cropType} at (${x}, ${y})`);
          return true;
        }
        
        this.print(`Failed to plant ${cropType} - Make sure the tile is plowed and empty`);
        return false;
      },

      harvest: function() {
        const x = this.drone.x;
        const y = this.drone.y;
        const index = y * this.size + x;
        
        if (this.land[index].hasCrop && this.land[index].cropState === 'ready') {
          const cropType = this.land[index].cropType;
          const newLand = [...this.land];
          newLand[index] = {
            ...newLand[index],
            hasCrop: false,
            cropType: null,
            cropState: null,
            plantedTime: null
          };

          // Update inventory
          const newInventory = {
            ...this.inventory,
            [cropType]: (this.inventory[cropType] || 0) + 1
          };
          
          setGameState(prev => ({
            ...prev,
            land: newLand,
            inventory: newInventory
          }));
          
          this.land = newLand;
          this.inventory = newInventory;
          this.print(`Successfully harvested ${cropType} at (${x}, ${y})`);
          return true;
        }
        this.print(`Failed to harvest - No ready crop at (${x}, ${y})`);
        return false;
      },

      scan: function() {
        const x = this.drone.x;
        const y = this.drone.y;
        const index = y * this.size + x;
        const tile = this.land[index];
        
        let status = "empty";
        if (tile.isPlowed) {
          status = "plowed";
        }
        if (tile.hasCrop) {
          status = `${tile.cropState} ${tile.cropType}`;
        }
        
        this.print(`Scan results at (${x}, ${y}): ${status}`);
        return status;
      },

      position: function() {
        return { x: this.drone.x, y: this.drone.y };
      },
      
      buy: function(itemType, amount = 1) {
        const prices = {
          wheat_seeds: 10,
          corn_seeds: 20,
          potato_seeds: 15
        };

        const cost = prices[itemType];
        if (!cost) {
          this.print(`Cannot buy ${itemType} - Item not available in shop!`);
          return false;
        }

        if (onBuyItem(itemType, amount, cost)) {
          this.print(`Bought ${amount} ${itemType} for $${cost * amount}`);
          return true;
        } else {
          this.print(`Cannot buy ${itemType} - Not enough money!`);
          return false;
        }
      },
      
      sell: function(itemType, amount = 1) {
        const prices = {
          wheat: 25,
          corn: 40,
          potato: 30
        };

        const price = prices[itemType];
        if (!price) {
          this.print(`Cannot sell ${itemType} - Item not recognized!`);
          return false;
        }

        if (onSellItem(itemType, amount, price)) {
          this.print(`Sold ${amount} ${itemType} for $${price * amount}`);
          return true;
        } else {
          this.print(`Cannot sell ${itemType} - Not enough in inventory!`);
          return false;
        }
      },
      
      toString: function() {
        return `Farm(money=$${this.money}, size=${this.size}x${this.size}, inventory=${JSON.stringify(this.inventory)})`;
      }
    };

    return farm;
  };

  // Update parent state when gameState changes
  useEffect(() => {
    setInventory(gameState.inventory);
    setMoney(gameState.money);
  }, [gameState.inventory, gameState.money, setInventory, setMoney]);

  // Function to update inventory
  const updateInventory = (items) => {
    setGameState(prevState => ({
      ...prevState,
      inventory: {
        ...prevState.inventory,
        ...items
      }
    }));
  };

  // Function to update money
  const updateMoney = (amount) => {
    setGameState(prevState => ({
      ...prevState,
      money: prevState.money + amount
    }));
  };

  // Add this function to handle buying items
  const handleBuyItem = (itemType, amount, cost) => {
    const totalCost = amount * cost;
    if (gameState.money >= totalCost) {
      updateMoney(-totalCost);
      updateInventory({
        [itemType]: (gameState.inventory[itemType] || 0) + amount
      });
      return true;
    }
    return false;
  };

  // Add this function to handle selling items
  const handleSellItem = (itemType, amount, price) => {
    if (gameState.inventory[itemType] >= amount) {
      const totalPrice = amount * price;
      updateMoney(totalPrice);
      updateInventory({
        [itemType]: gameState.inventory[itemType] - amount
      });
      return true;
    }
    return false;
  };

  // Add crop growth system
  useEffect(() => {
    const growthInterval = setInterval(() => {
      setGameState(prevState => {
        const newLand = [...prevState.land];
        let hasChanges = false;

        newLand.forEach((tile, index) => {
          if (tile.hasCrop && tile.cropState === 'growing') {
            const growthTime = {
              wheat: 1000,   // 1 second for wheat
              corn: 2000,    // 2 seconds for corn
              potato: 3000   // 3 seconds for potato
            };

            const currentTime = Date.now();
            const elapsedTime = currentTime - tile.plantedTime;

            if (elapsedTime >= growthTime[tile.cropType]) {
              newLand[index] = {
                ...tile,
                cropState: 'ready'
              };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? { ...prevState, land: newLand } : prevState;
      });
    }, 1000); // Check every second

    return () => clearInterval(growthInterval);
  }, []);

  // Add visual feedback for crop state
  const getCropColor = (cropType, cropState) => {
    if (cropState === 'growing') {
      return {
        wheat: '#F4D03F80',  // Semi-transparent yellow
        corn: '#F39C1280',   // Semi-transparent orange
        potato: '#93511680'  // Semi-transparent brown
      }[cropType] || '#90EE90';
    } else if (cropState === 'ready') {
      return {
        wheat: '#F4D03F',  // Bright yellow
        corn: '#F39C12',   // Bright orange
        potato: '#935116'  // Rich brown
      }[cropType] || '#228B22';
    }
    return '#90EE90';
  };

  const handleConsoleContentChange = (consoleId, content) => {
    setConsoleContents(prev => ({
      ...prev,
      [consoleId]: content
    }));
  };

  const handleSave = (saveName) => {
    const gameData = {
      gameState: {
        grid: gameState.grid,
        money: gameState.money,
        inventory: gameState.inventory,
        dronePosition: gameState.dronePosition,
        droneInventory: gameState.droneInventory,
        land: gameState.land,
        drone: gameState.drone,
        unlockedCrops: gameState.unlockedCrops
      },
      consoles: {
        states: consoleContents,
        active: activeConsole,
        list: consoles
      },
      currentSaveName: saveName  // Store the current save name
    };

    const existingSaves = JSON.parse(localStorage.getItem('farmGameSaves') || '{}');
    existingSaves[saveName] = gameData;
    
    localStorage.setItem('farmGameSaves', JSON.stringify(existingSaves));
    setModalState({ isOpen: false, mode: null });
  };

  const handleLoad = (saveName) => {
    const saves = JSON.parse(localStorage.getItem('farmGameSaves') || '{}');
    
    try {
      const gameData = saves[saveName];
      
      // Restore game state
      setGameState(gameData.gameState);
      setMoney(gameData.gameState.money);
      
      // Properly update inventory in parent state
      if (gameData.gameState.inventory) {
        setInventory(gameData.gameState.inventory);
      }
      
      // Restore console states
      if (gameData.consoles) {
        setConsoles(gameData.consoles.list || [{ id: 0, name: 'Console 1' }]);
        setActiveConsole(gameData.consoles.active || 0);
        setConsoleContents(gameData.consoles.states || {});
      }

      // When loading a save, automatically set up to save back to the same file
      setModalState({ 
        isOpen: false, 
        mode: null, 
        lastSaveName: saveName  // Store the last used save name
      });
    } catch (error) {
      console.error('Error loading game:', error);
      alert('Error loading game save');
    }
  };

  // Modified save button click handler
  const handleSaveClick = () => {
    if (modalState.lastSaveName) {
      // If we have a last save name, use it directly
      handleSave(modalState.lastSaveName);
    } else {
      // Otherwise open the modal for a new save
      setModalState({ isOpen: true, mode: 'save' });
    }
  };

  const handleDelete = (saveName) => {
    const saves = JSON.parse(localStorage.getItem('farmGameSaves') || '{}');
    delete saves[saveName];
    localStorage.setItem('farmGameSaves', JSON.stringify(saves));
    // Force a re-render of the modal
    setModalState({ ...modalState });
  };

  const addNewConsole = () => {
    const newConsole = {
      id: consoles.length,
      name: `Console ${consoles.length + 1}`
    };
    setConsoles([...consoles, newConsole]);
  };

  const removeConsole = (id) => {
    if (consoles.length > 1) {
      const newConsoles = consoles.filter(console => console.id !== id);
      setConsoles(newConsoles);
      if (activeConsole === id) {
        setActiveConsole(newConsoles[0].id);
      }
    }
  };

  return (
    <GameContainer>
      <Header>
        <Title>Farming Game</Title>
        <GameControls>
          <SaveLoadButton onClick={handleSaveClick}>
            Save Game
          </SaveLoadButton>
          <SaveLoadButton onClick={() => setModalState({ isOpen: true, mode: 'load' })}>
            Load Game
          </SaveLoadButton>
          <MoneyDisplay>${money}</MoneyDisplay>
          <TechTreeButton onClick={onOpenTechTree}>Tech Tree</TechTreeButton>
        </GameControls>
      </Header>
      
      <GameGridContainer>
        <GameGrid size={Math.sqrt(gameState.land.length)}>
          {gameState.land.map((tile, index) => {
            const x = Math.floor(index / Math.sqrt(gameState.land.length));
            const y = index % Math.sqrt(gameState.land.length);
            const isDroneHere = gameState.dronePosition.x === x && gameState.dronePosition.y === y;
            
            return (
              <LandTile 
                key={index}
                isPlowed={tile.isPlowed}
                hasCrop={tile.hasCrop}
                cropState={tile.cropState}
              >
                {tile.hasCrop && (
                  <CropIndicator 
                    color={getCropColor(tile.cropType, tile.cropState)}
                  />
                )}
                {isDroneHere && <StyledDroneSprite />}
              </LandTile>
            );
          })}
        </GameGrid>
        <StyledGameStats>
          <div>
            <span>Drone Position:</span>
            <span>({gameState.dronePosition.x}, {gameState.dronePosition.y})</span>
          </div>
          <div>
            <span>Status:</span>
            <span>{gameState.land[gameState.dronePosition.y * Math.sqrt(gameState.land.length) + gameState.dronePosition.x].isPlowed ? 'Plowed' : 'Unplowed'}</span>
          </div>
        </StyledGameStats>
      </GameGridContainer>
      
      <ThreeDViewContainer>
        <Game3D gameState={gameState} setGameState={setGameState} />
      </ThreeDViewContainer>
      
      <StyledConsoleContainer>
        <ConsoleTabs>
          {consoles.map(console => (
            <ConsoleTab
              key={console.id}
              active={activeConsole === console.id}
              onClick={() => setActiveConsole(console.id)}
            >
              {console.name}
              {consoles.length > 1 && (
                <CloseButton onClick={(e) => {
                  e.stopPropagation();
                  removeConsole(console.id);
                }}>×</CloseButton>
              )}
            </ConsoleTab>
          ))}
          <AddConsoleButton onClick={addNewConsole}>+</AddConsoleButton>
        </ConsoleTabs>
        
        {consoles.map(console => (
          <ConsoleWrapper key={console.id} active={activeConsole === console.id}>
            <JavaScriptConsole 
              gameState={gameState}
              setGameState={setGameState}
              consoleId={console.id}
              content={consoleContents[console.id] || ''}
              onContentChange={handleConsoleContentChange}
              onBuyItem={handleBuyItem}
              onSellItem={handleSellItem}
              farm={farmRef.current}
              setPrintFunction={(printFn) => {
                if (farmRef.current) {
                  farmRef.current.print = printFn;
                }
              }}
            />
          </ConsoleWrapper>
        ))}
      </StyledConsoleContainer>
      
      <SaveLoadModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={() => setModalState({ isOpen: false, mode: null })}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDelete}
        currentSaveName={modalState.lastSaveName}
      />
    </GameContainer>
  );
};

export default Game; 