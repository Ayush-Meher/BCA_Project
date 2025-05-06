const fs = require('fs');
const https = require('https');
const path = require('path');

const assets = {
  models: {
    'drone.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.glb',
    'wheat.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.glb',
    'corn.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.glb',
    'potato.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.glb'
  },
  textures: {
    'grass.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg',
    'plowed_soil.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg',
    'soil_normal.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big-nm.jpg'
  }
};

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
}

async function downloadAssets() {
  // Create directories if they don't exist
  fs.mkdirSync('public/models', { recursive: true });
  fs.mkdirSync('public/textures', { recursive: true });

  // Download models
  for (const [filename, url] of Object.entries(assets.models)) {
    const filePath = path.join('public/models', filename);
    console.log(`Downloading ${filename}...`);
    await downloadFile(url, filePath);
  }

  // Download textures
  for (const [filename, url] of Object.entries(assets.textures)) {
    const filePath = path.join('public/textures', filename);
    console.log(`Downloading ${filename}...`);
    await downloadFile(url, filePath);
  }

  console.log('All assets downloaded successfully!');
}

downloadAssets().catch(console.error); 