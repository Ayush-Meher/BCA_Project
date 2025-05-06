import React from 'react';
import styled from 'styled-components';

const InventoryContainer = styled.div`
  background-color: #34495e;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
`;

const InventoryHeader = styled.h3`
  color: #fff;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const ItemCard = styled.div`
  background-color: #2c3e50;
  padding: 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    transform: scale(1.02);
    background-color: #3d566e;
  }
`;

const ItemIcon = styled.div`
  width: 24px;
  height: 24px;
  background-color: ${props => props.color || '#3498db'};
  border-radius: 4px;
  margin-right: 10px;
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const ItemName = styled.div`
  font-weight: bold;
  margin-bottom: 2px;
`;

const ItemCount = styled.div`
  font-size: 0.8em;
  color: #95a5a6;
`;

const EmptyInventory = styled.div`
  text-align: center;
  padding: 15px;
  color: #95a5a6;
  font-style: italic;
`;

function Inventory({ playerInventory }) {
  const inventory = [
    { id: 'wheat', name: 'Wheat', count: playerInventory?.wheat || 0, color: '#f1c40f' },
    { id: 'corn', name: 'Corn', count: playerInventory?.corn || 0, color: '#f39c12' },
    { id: 'potato', name: 'Potato', count: playerInventory?.potato || 0, color: '#d35400' },
    { id: 'wheat_seeds', name: 'Wheat Seeds', count: playerInventory?.wheat_seeds || 0, color: '#2ecc71' },
    { id: 'corn_seeds', name: 'Corn Seeds', count: playerInventory?.corn_seeds || 0, color: '#27ae60' },
    { id: 'potato_seeds', name: 'Potato Seeds', count: playerInventory?.potato_seeds || 0, color: '#16a085' }
  ];

  const hasItems = inventory.some(item => item.count > 0);

  return (
    <InventoryContainer>
      <InventoryHeader>
        Inventory
      </InventoryHeader>
      
      {hasItems ? (
        <InventoryGrid>
          {inventory.map(item => 
            item.count > 0 && (
              <ItemCard key={item.id}>
                <ItemIcon color={item.color} />
                <ItemDetails>
                  <ItemName>{item.name}</ItemName>
                  <ItemCount>x{item.count}</ItemCount>
                </ItemDetails>
              </ItemCard>
            )
          )}
        </InventoryGrid>
      ) : (
        <EmptyInventory>Your inventory is empty</EmptyInventory>
      )}
    </InventoryContainer>
  );
}

export default Inventory; 