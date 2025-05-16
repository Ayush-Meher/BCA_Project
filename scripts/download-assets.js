const fs = require('fs');
const https = require('https');
const path = require('path');

// Define asset URLs - using free assets from reliable sources
const assets = {
  models: {
    // Using free models from Sketchfab
    'drone.glb': 'https://dl.dropboxusercontent.com/s/xyz123/drone.glb', // Placeholder - need to upload actual model
    'wheat.glb': 'https://dl.dropboxusercontent.com/s/xyz456/wheat.glb',  // Placeholder - need to upload actual model
    'corn.glb': 'https://dl.dropboxusercontent.com/s/xyz789/corn.glb',    // Placeholder - need to upload actual model
    'potato.glb': 'https://dl.dropboxusercontent.com/s/xyz012/potato.glb'  // Placeholder - need to upload actual model
  },
  textures: {
    // Using CC0 textures from ambientCG.com (direct JPG downloads)
    'grass_diffuse.jpg': 'https://dl.dropboxusercontent.com/s/abc123/grass_diffuse.jpg',  // Placeholder
    'grass_normal.jpg': 'https://dl.dropboxusercontent.com/s/abc456/grass_normal.jpg',    // Placeholder
    'grass_roughness.jpg': 'https://dl.dropboxusercontent.com/s/abc789/grass_roughness.jpg',  // Placeholder
    'soil_diffuse.jpg': 'https://dl.dropboxusercontent.com/s/def123/soil_diffuse.jpg',    // Placeholder
    'soil_normal.jpg': 'https://dl.dropboxusercontent.com/s/def456/soil_normal.jpg',      // Placeholder
    'soil_roughness.jpg': 'https://dl.dropboxusercontent.com/s/def789/soil_roughness.jpg' // Placeholder
  }
};

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    // For development, create empty placeholder files instead of downloading
    fs.writeFile(filePath, '', (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Created placeholder file: ${filePath}`);
        resolve();
      }
    });
    
    // TODO: Uncomment this section when real asset URLs are available
    /*
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        https.get(response.headers.location, (redirectedResponse) => {
          if (redirectedResponse.statusCode === 200) {
            redirectedResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`Successfully downloaded: ${filePath}`);
              resolve();
            });
          } else {
            fs.unlink(filePath, () => {});
            reject(new Error(`Failed to download ${url}: ${redirectedResponse.statusCode}`));
          }
        });
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Successfully downloaded: ${filePath}`);
          resolve();
        });
      } else {
        fs.unlink(filePath, () => {});
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
    */
  });
}

async function downloadAssets() {
  // Create directories if they don't exist
  const dirs = ['public/models', 'public/textures'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Download models
  console.log('Creating placeholder 3D models...');
  for (const [filename, url] of Object.entries(assets.models)) {
    try {
      await downloadFile(url, path.join('public/models', filename));
    } catch (error) {
      console.error(`Failed to create ${filename}:`, error);
    }
  }

  // Download textures
  console.log('Creating placeholder textures...');
  for (const [filename, url] of Object.entries(assets.textures)) {
    try {
      await downloadFile(url, path.join('public/textures', filename));
    } catch (error) {
      console.error(`Failed to create ${filename}:`, error);
    }
  }

  console.log('Asset placeholders created!');
  console.log('Note: Replace placeholder files with actual assets before deploying.');
}

downloadAssets().catch(console.error); 

downloadAssets().catch(console.error); 