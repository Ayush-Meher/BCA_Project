import React from 'react';
import styled from 'styled-components';

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #2c3e50;
  padding: 20px;
  border-radius: 10px;
  color: white;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 999;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #3498db;
  margin-bottom: 10px;
`;

const CodeExample = styled.pre`
  background-color: #34495e;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
`;

function Instructions({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>Game Instructions</h2>

        <Section>
          <SectionTitle>Basic Controls</SectionTitle>
          <ul>
            <li>Use the tool buttons (Plow, Plant, Harvest) to manage your farm</li>
            <li>Click on land tiles to perform the selected action</li>
            <li>Sell your crops to earn money</li>
            <li>Buy seeds from the market to plant more crops</li>
          </ul>
        </Section>

        <Section>
          <SectionTitle>JavaScript Console Guide</SectionTitle>
          <p>The JavaScript console allows you to interact with your farm using JavaScript code! Here are some examples:</p>
          
          <CodeExample>
{`// Get information about your farm
console.log(farm.money);  // Display current money
console.log(farm.inventory);  // Show inventory contents
console.log(farm.size);  // Show farm size

// Perform farming actions
farm.plow(x, y);  // Plow tile at coordinates (x,y)
farm.plant(x, y, "wheat");  // Plant wheat at (x,y)
farm.harvest(x, y);  // Harvest crop at (x,y)

// Market operations
farm.sellCrop("wheat", 5);  // Sell 5 wheat
farm.buySeeds("corn", 3);  // Buy 3 corn seeds`}
          </CodeExample>
        </Section>

        <Section>
          <SectionTitle>JavaScript Learning Tips</SectionTitle>
          <ul>
            <li>Try using loops to automate farming:</li>
            <CodeExample>
{`// Plow all tiles in the first row
for (let x = 0; x < 5; x++) {
    farm.plow(x, 0);
}`}
            </CodeExample>
            
            <li>Use conditions to make smart decisions:</li>
            <CodeExample>
{`// Harvest only ready crops
for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
        if (farm.isCropReady(x, y)) {
            farm.harvest(x, y);
        }
    }
}`}
            </CodeExample>
            
            <li>Create helper functions:</li>
            <CodeExample>
{`function plantRow(cropType, row) {
    for (let x = 0; x < 5; x++) {
        farm.plow(x, row);
        farm.plant(x, row, cropType);
    }
}`}
            </CodeExample>
          </ul>
        </Section>

        <Section>
          <SectionTitle>Drone Controls</SectionTitle>
          <p>You can control your drone using these commands:</p>
          <CodeExample>
{`// Move drone to specific coordinates
farm.move_drone(x, y);

// Perform actions at drone's current position
farm.drone_plow();
farm.drone_plant("wheat");
farm.drone_harvest();
farm.drone_scan();

// Get drone's current position
const position = farm.get_drone_position();`}
          </CodeExample>
        </Section>

        <Section>
          <SectionTitle>Challenge Ideas</SectionTitle>
          <ul>
            <li>Write a function to calculate total farm value</li>
            <li>Create an automated farming system</li>
            <li>Implement a crop rotation strategy</li>
            <li>Build a profit optimization algorithm</li>
            <li>Program the drone to automate farming tasks</li>
          </ul>
        </Section>
      </Modal>
    </>
  );
}

export default Instructions; 