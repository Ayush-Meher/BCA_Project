import React from 'react';
import styled from 'styled-components';

const MarketContainer = styled.div`
  background-color: #34495e;
  padding: 15px;
  border-radius: 5px;
`;

const MarketHeader = styled.h3`
  color: #fff;
  margin-bottom: 15px;
`;

const MarketSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h4`
  color: #fff;
  margin-bottom: 10px;
`;

const ItemList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
`;

const ItemCard = styled.div`
  background-color: ${props => props.canAfford ? '#2ecc71' : '#95a5a6'};
  color: white;
  padding: 10px;
  border-radius: 4px;
  cursor: ${props => props.canAfford ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.canAfford ? 1 : 0.7};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.canAfford ? 'scale(1.02)' : 'none'};
  }
`;

const ItemName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
`;

const ItemPrice = styled.div`
  font-size: 0.8em;
  color: ${props => props.canAfford ? '#fff' : '#e74c3c'};
`;

function Market({ inventory, setInventory, money, setMoney }) {
  const itemsForSale = [
    { id: 'wheat_seeds', name: 'Wheat Seeds', price: 10, type: 'seeds' },
    { id: 'corn_seeds', name: 'Corn Seeds', price: 20, type: 'seeds' },
    { id: 'potato_seeds', name: 'Potato Seeds', price: 15, type: 'seeds' },
    { id: 'fertilizer', name: 'Fertilizer', price: 30, type: 'tools' },
    { id: 'watering_can', name: 'Watering Can', price: 50, type: 'tools' }
  ];

  const cropsForSale = [
    { id: 'wheat', name: 'Wheat', price: 20 },
    { id: 'corn', name: 'Corn', price: 40 },
    { id: 'potato', name: 'Potato', price: 30 }
  ];

  const buyItem = (item) => {
    if (money >= item.price) {
      setMoney(prev => prev - item.price);
      if (item.type === 'seeds') {
        setInventory(prev => ({
          ...prev,
          [item.id]: (prev[item.id] || 0) + 1
        }));
      }
    }
  };

  const sellCrop = (crop) => {
    if (inventory[crop.id] > 0) {
      setMoney(prev => prev + crop.price);
      setInventory(prev => ({
        ...prev,
        [crop.id]: prev[crop.id] - 1
      }));
    }
  };

  return (
    <MarketContainer>
      <MarketHeader>Market</MarketHeader>
      
      <MarketSection>
        <SectionTitle>Buy Items</SectionTitle>
        <ItemList>
          {itemsForSale.map(item => (
            <ItemCard
              key={item.id}
              canAfford={money >= item.price}
              onClick={() => buyItem(item)}
            >
              <ItemName>{item.name}</ItemName>
              <ItemPrice canAfford={money >= item.price}>
                ${item.price}
              </ItemPrice>
            </ItemCard>
          ))}
        </ItemList>
      </MarketSection>

      <MarketSection>
        <SectionTitle>Sell Crops</SectionTitle>
        <ItemList>
          {cropsForSale.map(crop => (
            <ItemCard
              key={crop.id}
              canAfford={inventory[crop.id] > 0}
              onClick={() => sellCrop(crop)}
            >
              <ItemName>{crop.name}</ItemName>
              <ItemPrice canAfford={inventory[crop.id] > 0}>
                ${crop.price} (x{inventory[crop.id] || 0})
              </ItemPrice>
            </ItemCard>
          ))}
        </ItemList>
      </MarketSection>
    </MarketContainer>
  );
}

export default Market; 