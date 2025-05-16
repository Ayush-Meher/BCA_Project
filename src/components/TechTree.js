import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: #34495e;
  padding: 20px;
  border-radius: 10px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  z-index: 1;
  
  &:hover {
    color: #e74c3c;
  }
`;

const TechTreeHeader = styled.h3`
  color: #fff;
  margin-bottom: 15px;
  text-align: center;
`;

const TechTreeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
`;

const TechRow = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #7f8c8d;
    z-index: 0;
  }
`;

const TechNode = styled.div`
  background-color: ${props => {
    if (props.locked) return '#95a5a6';
    if (props.unlocked) return '#2c3e50';
    return props.type === 'upgrade' ? '#cd853f' : '#2ecc71';
  }};
  padding: 10px;
  border-radius: 5px;
  cursor: ${props => (props.canUnlock && !props.unlocked) ? 'pointer' : 'default'};
  opacity: ${props => (props.canUnlock || props.unlocked) ? 1 : 0.7};
  min-width: 120px;
  text-align: center;
  position: relative;
  z-index: 1;
  
  &:hover {
    transform: ${props => (props.canUnlock && !props.unlocked) ? 'scale(1.05)' : 'none'};
  }
`;

const TechName = styled.div`
  color: #fff;
  font-weight: bold;
  margin-bottom: 5px;
`;

const TechCost = styled.div`
  color: ${props => props.canAfford ? '#2ecc71' : '#e74c3c'};
  font-size: 0.8em;
`;

const ResourceDisplay = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 15px;
  background-color: #2c3e50;
  padding: 10px;
  border-radius: 5px;
`;

const Resource = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #fff;
`;

const ResourceIcon = styled.div`
  width: 20px;
  height: 20px;
  background-color: ${props => props.color};
  border-radius: 50%;
`;

function TechTree({ money, setMoney, onUnlock, onClose, unlockedCrops }) {
  const [techs, setTechs] = useState({
    // Basic mechanics
    loops: { id: 'loops', name: 'Loops', unlocked: true, cost: 0, type: 'unlock' },
    speed: { id: 'speed', name: 'Speed', unlocked: false, cost: 100, type: 'upgrade', requires: ['loops'] },
    grass: { id: 'grass', name: 'Grass', unlocked: false, cost: 100, type: 'upgrade', requires: ['loops'] },
    expand: { id: 'expand', name: 'Expand', unlocked: false, cost: 200, type: 'upgrade', requires: ['speed'] },
    
    // Crops - wheat is not in tech tree since it's unlocked by default
    corn: { 
      id: 'corn', 
      name: 'Corn', 
      unlocked: false, 
      cost: 150, 
      type: 'crop', 
      description: 'Unlock corn farming - Sells for more than wheat',
      requires: [] 
    },
    potato: { 
      id: 'potato', 
      name: 'Potato', 
      unlocked: false, 
      cost: 200, 
      type: 'crop', 
      description: 'Unlock potato farming - The most valuable basic crop',
      requires: ['corn'] 
    },
    
    // Advanced mechanics
    irrigation: { 
      id: 'irrigation', 
      name: 'Irrigation', 
      unlocked: false, 
      cost: 300, 
      type: 'upgrade',
      description: 'Faster crop growth',
      requires: ['corn'] 
    },
    fertilizer: { 
      id: 'fertilizer', 
      name: 'Fertilizer', 
      unlocked: false, 
      cost: 400, 
      type: 'upgrade',
      description: 'Better crop yields',
      requires: ['irrigation'] 
    }
  });

  // Update tech unlocked status based on unlockedCrops
  useEffect(() => {
    setTechs(prev => {
      const newTechs = { ...prev };
      Object.keys(newTechs).forEach(techId => {
        if (newTechs[techId].type === 'crop') {
          newTechs[techId].unlocked = unlockedCrops.includes(techId);
        }
      });
      return newTechs;
    });
  }, [unlockedCrops]);

  const canUnlockTech = (techId) => {
    const tech = techs[techId];
    if (!tech || tech.unlocked) return false;
    if (money < tech.cost) return false;
    
    // Check if all required techs are unlocked
    if (tech.requires) {
      return tech.requires.every(reqId => techs[reqId]?.unlocked);
    }
    return true;
  };

  const handleUnlock = (techId) => {
    const tech = techs[techId];
    if (tech && !tech.unlocked && money >= tech.cost) {
      // Update money
      setMoney(prev => prev - tech.cost);
      
      // Update tech tree
      setTechs(prev => ({
        ...prev,
        [techId]: { ...prev[techId], unlocked: true }
      }));

      // If it's a crop type, add it to unlocked crops
      if (tech.type === 'crop') {
        onUnlock(techId);
      }
    }
  };

  const renderTechNode = (techId) => {
    const tech = techs[techId];
    if (!tech) return null;

    return (
      <TechNode
        key={techId}
        unlocked={tech.unlocked}
        locked={!tech.unlocked && !canUnlockTech(techId)}
        canUnlock={canUnlockTech(techId)}
        onClick={() => canUnlockTech(techId) && handleUnlock(techId)}
        type={tech.type}
      >
        <TechName>{tech.name}</TechName>
        {!tech.unlocked && (
          <TechCost canAfford={money >= tech.cost}>
            Cost: ${tech.cost}
          </TechCost>
        )}
      </TechNode>
    );
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        
        <TechTreeHeader>Technology Tree</TechTreeHeader>
        
        <ResourceDisplay>
          <Resource>
            <ResourceIcon color="#f1c40f" />
            <span>${money}</span>
          </Resource>
        </ResourceDisplay>

        <TechTreeGrid>
          <TechRow>
            {renderTechNode('loops')}
          </TechRow>
          
          <TechRow>
            {renderTechNode('speed')}
            {renderTechNode('grass')}
          </TechRow>
          
          <TechRow>
            {renderTechNode('expand')}
          </TechRow>
          
          <TechRow>
            {renderTechNode('corn')}
            {renderTechNode('potato')}
          </TechRow>
          
          <TechRow>
            {renderTechNode('irrigation')}
            {renderTechNode('fertilizer')}
          </TechRow>
        </TechTreeGrid>
      </Modal>
    </Overlay>
  );
}

export default TechTree; 