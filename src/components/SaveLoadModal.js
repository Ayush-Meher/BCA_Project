import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
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

const ModalContent = styled.div`
  background-color: #2A2A2A;
  padding: 24px;
  border-radius: 12px;
  min-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h2`
  color: white;
  margin: 0 0 20px 0;
  font-size: 24px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 8px 0 16px 0;
  background-color: #1E1E1E;
  border: 1px solid #3A3A3A;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const SavesList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin: 16px 0;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1E1E1E;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #3A3A3A;
    border-radius: 4px;
  }
`;

const SaveItem = styled.div`
  padding: 12px;
  margin: 8px 0;
  background-color: ${props => props.current ? '#2C3E50' : '#1E1E1E'};
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: ${props => props.current ? '#34495E' : '#3A3A3A'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #2ecc71;
  color: white;
  flex: 1;

  &:hover {
    background-color: #27ae60;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #34495e;
  color: white;
  flex: 1;

  &:hover {
    background-color: #2c3e50;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(231, 76, 60, 0.1);
  }
`;

const SaveLoadModal = ({ isOpen, mode, onClose, onSave, onLoad, onDelete, currentSaveName }) => {
  const [saveName, setSaveName] = useState('');
  const saves = JSON.parse(localStorage.getItem('farmGameSaves') || '{}');
  const savesList = Object.keys(saves);

  useEffect(() => {
    if (currentSaveName && mode === 'save') {
      setSaveName(currentSaveName);
    }
  }, [currentSaveName, mode]);

  const handleSave = () => {
    if (!saveName.trim()) return;
    
    if (saves[saveName] && saveName !== currentSaveName) {
      if (!window.confirm(`Save "${saveName}" already exists. Do you want to overwrite it?`)) {
        return;
      }
    }
    
    onSave(saveName);
    setSaveName('');
  };

  const handleLoad = (name) => {
    onLoad(name);
  };

  const handleDelete = (name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete save "${name}"?`)) {
      onDelete(name);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>{mode === 'save' ? 'Save Game' : 'Load Game'}</Title>
        
        {mode === 'save' && (
          <>
            <Input
              type="text"
              placeholder="Enter save name..."
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            {currentSaveName && (
              <div style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                Currently loaded save: {currentSaveName}
              </div>
            )}
          </>
        )}

        <SavesList>
          {savesList.map(name => (
            <SaveItem 
              key={name}
              onClick={() => mode === 'load' && handleLoad(name)}
              current={name === currentSaveName}
            >
              <span>{name}{name === currentSaveName ? ' (Current)' : ''}</span>
              <DeleteButton onClick={(e) => handleDelete(name, e)}>
                Delete
              </DeleteButton>
            </SaveItem>
          ))}
          {savesList.length === 0 && (
            <SaveItem style={{ cursor: 'default' }}>
              No saved games found
            </SaveItem>
          )}
        </SavesList>

        <ButtonGroup>
          {mode === 'save' && (
            <PrimaryButton onClick={handleSave}>
              {currentSaveName === saveName ? 'Update Save' : 'Save Game'}
            </PrimaryButton>
          )}
          <SecondaryButton onClick={onClose}>
            Cancel
          </SecondaryButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SaveLoadModal; 