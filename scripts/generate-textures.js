const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure textures directory exists
const texturesDir = path.join(__dirname, '..', 'public', 'textures');
if (!fs.existsSync(texturesDir)) {
  fs.mkdirSync(texturesDir, { recursive: true });
}

// Function to create a texture
const createTexture = (name, color, pattern = 'solid') => {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 512);

  // Add pattern
  switch (pattern) {
    case 'grass':
      // Add grass-like strokes
      ctx.strokeStyle = '#006400';
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 10 - 5, y - 10 - Math.random() * 10);
        ctx.stroke();
      }
      break;
    
    case 'soil':
      // Add soil texture
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 50 + 100}, ${Math.random() * 30 + 50}, 0, 0.1)`;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    
    case 'farmland':
      // Add farmland rows
      ctx.strokeStyle = '#3d2b1f';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 32);
        ctx.lineTo(512, i * 32);
        ctx.stroke();
      }
      break;
    
    case 'crop':
      // Add crop pattern
      ctx.fillStyle = '#355e3b';
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          ctx.beginPath();
          ctx.arc(32 + i * 64, 32 + j * 64, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
  }

  // Save both diffuse and normal map
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(texturesDir, `${name}.jpg`), buffer);
  
  // Create simple normal map
  const normalCanvas = createCanvas(512, 512);
  const normalCtx = normalCanvas.getContext('2d');
  normalCtx.fillStyle = '#8080ff'; // Default normal color (facing up)
  normalCtx.fillRect(0, 0, 512, 512);
  
  // Add some normal variation
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 127 + 128;
    const g = Math.random() * 127 + 128;
    normalCtx.fillStyle = `rgb(${r},${g},255)`;
    normalCtx.beginPath();
    normalCtx.arc(x, y, Math.random() * 8, 0, Math.PI * 2);
    normalCtx.fill();
  }
  
  const normalBuffer = normalCanvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(texturesDir, `${name}_normal.jpg`), normalBuffer);
};

// Generate textures
createTexture('grass', '#90EE90', 'grass');
createTexture('plowed_soil', '#8B4513', 'soil');
createTexture('farmland', '#6B4423', 'farmland');
createTexture('wheat', '#F0E68C', 'crop');
createTexture('corn', '#FFD700', 'crop');
createTexture('potato', '#8B4513', 'crop'); 