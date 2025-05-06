import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Game from './components/Game';
import TechTree from './components/TechTree';
import Market from './components/Market';
import Inventory from './components/Inventory';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #2c3e50;
  color: #ecf0f1;
  font-family: 'Arial', sans-serif;
  overflow-x: hidden;
`;

const GameContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  min-height: 100vh;
`;

const MainContent = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

const Sidebar = styled.div`
  background-color: #34495e;
  padding: 20px;
  border-left: 2px solid #7f8c8d;
  overflow-y: auto;
`;

const SaveLoadContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  background-color: #2c3e50;
  padding: 10px;
  border-radius: 5px;
`;

const SaveLoadButton = styled.button`
  background-color: ${props => props.color || '#3498db'};
  &:hover {
    background-color: ${props => props.hoverColor || '#2980b9'};
  }
`;

function App() {
  const [money, setMoney] = useState(100);
  const [inventory, setInventory] = useState({
    wheat_seeds: 5,
    corn_seeds: 3,
    potato_seeds: 2,
    wheat: 0,
    corn: 0,
    potato: 0
  });
  const [showTechTree, setShowTechTree] = useState(false);
  const [unlockedCrops, setUnlockedCrops] = useState(['wheat']); // Start with only wheat unlocked

  // Load saved game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const { 
        money: savedMoney, 
        inventory: savedInventory,
        unlockedCrops: savedUnlockedCrops 
      } = JSON.parse(savedState);
      setMoney(savedMoney);
      setInventory(savedInventory);
      if (savedUnlockedCrops) {
        setUnlockedCrops(savedUnlockedCrops);
      }
    }
  }, []);

  // Save game state to localStorage
  const saveGame = () => {
    const gameState = {
      money,
      inventory,
      unlockedCrops
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
  };

  const handleTechUnlock = (techId) => {
    // Handle tech unlocks here
    switch(techId) {
      case 'wheat':
        if (!unlockedCrops.includes('wheat')) {
          setUnlockedCrops(prev => [...prev, 'wheat']);
        }
        break;
      case 'corn':
        if (!unlockedCrops.includes('corn')) {
          setUnlockedCrops(prev => [...prev, 'corn']);
        }
        break;
      case 'potato':
        if (!unlockedCrops.includes('potato')) {
          setUnlockedCrops(prev => [...prev, 'potato']);
        }
        break;
      case 'carrots':
        if (!unlockedCrops.includes('carrots')) {
          setUnlockedCrops(prev => [...prev, 'carrots']);
        }
        break;
      case 'sunflowers':
        if (!unlockedCrops.includes('sunflowers')) {
          setUnlockedCrops(prev => [...prev, 'sunflowers']);
        }
        break;
      case 'pumpkins':
        if (!unlockedCrops.includes('pumpkins')) {
          setUnlockedCrops(prev => [...prev, 'pumpkins']);
        }
        break;
      default:
        console.log('Tech unlocked:', techId);
    }
  };

  return (
    <Router>
      <AppContainer>
        <GameContainer>
          <MainContent>
            <SaveLoadContainer>
              <SaveLoadButton onClick={saveGame}>
                Save Game
              </SaveLoadButton>
            </SaveLoadContainer>
            <Routes>
              <Route path="/" element={
                <Game 
                  inventory={inventory} 
                  setInventory={setInventory}
                  money={money}
                  setMoney={setMoney}
                  onOpenTechTree={() => setShowTechTree(true)}
                  unlockedCrops={unlockedCrops}
                />
              } />
            </Routes>
          </MainContent>
          <Sidebar>
            <Inventory playerInventory={inventory} />
            <Market 
              inventory={inventory} 
              setInventory={setInventory}
              money={money}
              setMoney={setMoney}
              unlockedCrops={unlockedCrops}
            />
          </Sidebar>
        </GameContainer>

        {showTechTree && (
          <TechTree 
            money={money} 
            setMoney={setMoney} 
            onUnlock={handleTechUnlock}
            onClose={() => setShowTechTree(false)}
            unlockedCrops={unlockedCrops}
          />
        )}
      </AppContainer>
    </Router>
  );
}

export default App; 