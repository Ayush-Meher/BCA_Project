import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { DataTexture } from 'three';
import TutorialGuide from './TutorialGuide';

const Game3D = ({ 
  gameState, 
  onActionComplete,
  lastAction = null  // { type: 'PLOW'|'PLANT'|'GROW'|'HARVEST', tileIndex: number }
}) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const droneRef = useRef(null);
  const composerRef = useRef(null);
  const modelsRef = useRef({});
  const texturesRef = useRef({});
  const actionQueueRef = useRef([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialProgress, setTutorialProgress] = useState({
    completedSteps: new Set(),
    currentStep: 0,
    lastAction: null
  });

  // Convert game coordinates to scene coordinates
  const gameToScene = React.useCallback((x, y) => {
    const size = Math.sqrt(gameState.land.length);
    const offset = (size - 1) / 2;
    return {
      x: x - offset,
      z: y - offset
    };
  }, [gameState.land.length]);

  // Calculate camera position based on grid size
  const calculateCameraPosition = () => {
    const size = Math.sqrt(gameState.land.length);
    const distance = 2 + size * 1.5; // Base distance that scales with grid size
    const height = 3 + size * 1.2;   // Base height that scales with grid size
    return {
      position: new THREE.Vector3(distance, height, distance),
      target: new THREE.Vector3(0, 0, 0)
    };
  };

  // Update the ANIMATIONS constant
  const ANIMATIONS = {
    PLOW: {
      duration: 1500,
      heightOffset: 0.2,
      rotationOffset: Math.PI / 4,
      droneAnimation: {
        startHeight: 2.0,  // Start from hover height
        diveHeight: 0.5,   // Dive down to this height
        diveRotation: -Math.PI / 8  // Tilt forward while diving
      }
    },
    PLANT: {
      duration: 2000,
      heightOffset: 0.3,
      scaleStart: 0.01,
      droneAnimation: {
        startHeight: 2.0,
        diveHeight: 0.6,
        diveRotation: -Math.PI / 10
      }
    },
    GROW: {
      duration: 3000,
      stages: 4,
      heightMultiplier: 0.4
    },
    HARVEST: {
      duration: 1500,
      heightOffset: 0.5,
      rotationOffset: Math.PI * 2,
      droneAnimation: {
        startHeight: 2.0,
        diveHeight: 0.7,
        diveRotation: -Math.PI / 12
      }
    }
  };

  // Enhance the procedural texture generation
  const generateProceduralTexture = (type, size = 512) => {
    const data = new Uint8Array(size * size * 4);
    const noiseData = new Uint8Array(size * size * 4);
    
    // Generate Perlin-like noise
    const generateNoise = () => {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const value = Math.floor(
            (Math.sin(x * 0.1) + Math.sin(y * 0.1) +
             Math.sin((x + y) * 0.05) + Math.sin(Math.sqrt(x * x + y * y) * 0.07)) * 32 + 128
          );
          noiseData[i] = noiseData[i + 1] = noiseData[i + 2] = value;
          noiseData[i + 3] = 255;
        }
      }
    };

    generateNoise();

    // Create patterns
    const createPattern = (baseColor, noiseIntensity = 0.3, pattern = null) => {
      for (let i = 0; i < size * size; i++) {
        const stride = i * 4;
        const noise = (noiseData[stride] / 255 - 0.5) * noiseIntensity;

        let r = baseColor.r + noise * 255;
        let g = baseColor.g + noise * 255;
        let b = baseColor.b + noise * 255;

        if (pattern) {
          const x = i % size;
          const y = Math.floor(i / size);
          const patternValue = pattern(x, y, size);
          r = r * (1 - patternValue) + patternValue * baseColor.r;
          g = g * (1 - patternValue) + patternValue * baseColor.g;
          b = b * (1 - patternValue) + patternValue * baseColor.b;
        }

        data[stride] = Math.max(0, Math.min(255, r));
        data[stride + 1] = Math.max(0, Math.min(255, g));
        data[stride + 2] = Math.max(0, Math.min(255, b));
        data[stride + 3] = 255;
      }
    };

    const colors = {
      grass: { r: 124, g: 179, b: 66 },
      soil: { r: 121, g: 85, b: 61 },
      farmland: { r: 131, g: 91, b: 59 },
      wheat: { r: 243, g: 218, b: 109 },
      corn: { r: 251, g: 192, b: 45 },
      potato: { r: 141, g: 110, b: 99 }
    };

    const patterns = {
      grass: (x, y) => {
        const blade = Math.sin(x * 0.2) * Math.cos(y * 0.2) > 0.7;
        return blade ? 0.2 : 0;
      },
      farmland: (x, y) => {
        const row = Math.floor(y / (size / 16)) % 2;
        const furrow = Math.sin(x * Math.PI * 8 / size) * 0.1;
        return row ? 0.2 + furrow : 0;
      },
      soil: (x, y) => {
        // Enhanced soil pattern with more visible plow lines
        const gridSize = size / 8;
        const localX = (x % gridSize) / gridSize;
        const localY = (y % gridSize) / gridSize;
        
        // Create plow lines
        const plowLineX = Math.abs(Math.sin(localX * Math.PI)) * 0.3;
        const plowLineY = Math.abs(Math.sin(localY * Math.PI)) * 0.3;
        const plowPattern = Math.min(plowLineX, plowLineY);
        
        // Add some randomness for soil texture
        const noise = (Math.sin(x * 0.3) * Math.cos(y * 0.3)) * 0.1;
        
        return plowPattern + noise;
      }
    };

    switch (type) {
      case 'grass': {
        createPattern(colors.grass, 0.3, patterns.grass);
        break;
      }
      case 'soil': {
        createPattern(colors.soil, 0.4, patterns.soil);
        break;
      }
      case 'farmland': {
        createPattern(colors.farmland, 0.3, patterns.farmland);
        break;
      }
      case 'wheat': {
        createPattern(colors.wheat, 0.2);
        break;
      }
      case 'corn': {
        createPattern(colors.corn, 0.25);
        break;
      }
      case 'potato': {
        createPattern(colors.potato, 0.35);
        break;
      }
      default: {
        createPattern(colors.grass, 0.3);
        break;
      }
    }

    const texture = new DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  };

  // Load textures
  const loadTextures = async () => {
    try {
      texturesRef.current = {
        grass: {
          diffuse: generateProceduralTexture('grass'),
          normal: generateProceduralTexture('grass')
        },
        soil: {
          diffuse: generateProceduralTexture('soil'),
          normal: generateProceduralTexture('soil')
        },
        farmland: {
          diffuse: generateProceduralTexture('farmland'),
          normal: generateProceduralTexture('farmland')
        },
        wheat: {
          diffuse: generateProceduralTexture('wheat'),
          normal: generateProceduralTexture('wheat')
        },
        corn: {
          diffuse: generateProceduralTexture('corn'),
          normal: generateProceduralTexture('corn')
        },
        potato: {
          diffuse: generateProceduralTexture('potato'),
          normal: generateProceduralTexture('potato')
        }
      };

      // Configure texture properties
      Object.values(texturesRef.current).forEach(textures => {
        Object.values(textures).forEach(texture => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(4, 4); // Increase repetition for more detail
        });
      });
    } catch (error) {
      console.error('Error generating textures:', error);
    }
  };

  // Load models
  const loadModels = async () => {
    const gltfLoader = new GLTFLoader();
    const objLoader = new OBJLoader();

    const loadGLTF = (url) => new Promise((resolve, reject) => {
      gltfLoader.load(url, resolve, undefined, reject);
    });

    const loadOBJ = (url) => new Promise((resolve, reject) => {
      objLoader.load(url, resolve, undefined, reject);
    });

    try {
      // Load drone model
      const droneModel = await loadGLTF('/models/drone.glb');
      modelsRef.current.drone = droneModel.scene;

      // Load crop models
      modelsRef.current.wheat = await loadOBJ('/models/wheat.obj');
      modelsRef.current.corn = await loadOBJ('/models/corn.obj');
      modelsRef.current.potato = await loadOBJ('/models/potato.obj');

      // Configure models
      Object.values(modelsRef.current).forEach(model => {
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      });
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  // Create environment map
  const createEnvironmentMap = (renderer) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const sky = new Sky();
    sky.scale.setScalar(450000);
    
    const sun = new THREE.Vector3();
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 10;
    uniforms['rayleigh'].value = 3;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.7;

    const phi = THREE.MathUtils.degToRad(90 - 2);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);

    const renderTarget = pmremGenerator.fromScene(sky);
    pmremGenerator.dispose();

    return renderTarget.texture;
  };

  // Create fallback drone model
  const createFallbackDrone = () => {
    const droneGroup = new THREE.Group();

    // Drone body - simpler, more stylized design
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    const bodyMaterial = new THREE.MeshToonMaterial({
      color: 0x4CAF50,  // Green color to match game theme
      transparent: true,
      opacity: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    droneGroup.add(body);

    // Drone arms - thinner and more stylized
    const armGeometry = new THREE.BoxGeometry(0.25, 0.02, 0.02);
    const armMaterial = new THREE.MeshToonMaterial({
      color: 0x81C784  // Lighter green
    });

    // Create four arms in a cross pattern
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.y = 0;
      arm.rotation.y = (i * Math.PI) / 2;
      arm.castShadow = true;
      droneGroup.add(arm);
    }

    // Propellers - simpler design
    const propGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.08);
    const propMaterial = new THREE.MeshToonMaterial({
      color: 0xA5D6A7  // Even lighter green
    });

    // Create four propellers
    for (let i = 0; i < 4; i++) {
      const propeller = new THREE.Group();
      const blade1 = new THREE.Mesh(propGeometry, propMaterial);
      const blade2 = new THREE.Mesh(propGeometry, propMaterial);
      blade2.rotation.y = Math.PI / 2;
      
      propeller.add(blade1, blade2);
      propeller.position.y = 0.05;
      propeller.position.x = Math.cos(i * Math.PI / 2) * 0.15;
      propeller.position.z = Math.sin(i * Math.PI / 2) * 0.15;
      propeller.castShadow = true;
      
      droneGroup.add(propeller);
    }

    return droneGroup;
  };

  // Create stylized crop models
  const createStylizedCropModel = (type) => {
    const group = new THREE.Group();
    
    switch(type) {
      case 'wheat': {
        // Create a stylized wheat stalk
        const stalkGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4);
        const stalkMaterial = new THREE.MeshToonMaterial({ color: 0x9CCC65 });
        const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
        stalk.position.y = 0.15;
        
        // Create wheat head
        const headGeometry = new THREE.ConeGeometry(0.04, 0.15, 4);
        const headMaterial = new THREE.MeshToonMaterial({ color: 0xFDD835 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.35;
        
        group.add(stalk, head);
        break;
      }
      case 'corn': {
        // Create corn stalk
        const stalkGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4);
        const stalkMaterial = new THREE.MeshToonMaterial({ color: 0x7CB342 });
        const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
        stalk.position.y = 0.2;
        
        // Create corn cob
        const cobGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6);
        const cobMaterial = new THREE.MeshToonMaterial({ color: 0xFFEB3B });
        const cob = new THREE.Mesh(cobGeometry, cobMaterial);
        cob.rotation.x = Math.PI / 2;
        cob.position.y = 0.25;
        cob.position.x = 0.06;
        
        group.add(stalk, cob);
        break;
      }
      case 'potato': {
        // Create potato plant
        const leafGeometry = new THREE.BoxGeometry(0.15, 0.01, 0.15);
        const leafMaterial = new THREE.MeshToonMaterial({ color: 0x558B2F });
        
        // Create multiple leaves
        for (let i = 0; i < 3; i++) {
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          leaf.position.y = 0.05 + i * 0.05;
          leaf.rotation.x = Math.random() * Math.PI / 4;
          leaf.rotation.z = (i * Math.PI * 2) / 3;
          group.add(leaf);
        }
        
        // Create potato tuber
        const tuberGeometry = new THREE.SphereGeometry(0.06, 6, 4);
        const tuberMaterial = new THREE.MeshToonMaterial({ color: 0x8D6E63 });
        const tuber = new THREE.Mesh(tuberGeometry, tuberMaterial);
        tuber.position.y = 0.02;
        tuber.scale.y = 0.7;
        
        group.add(tuber);
        break;
      }
      default:
        break;
    }
    
    return group;
  };

  // Create and update ground plane
  const updateGround = () => {
    if (!sceneRef.current) return;

    // Remove old ground
    const oldGround = sceneRef.current.children.find(child => child.userData.isGround);
    if (oldGround) {
      sceneRef.current.remove(oldGround);
      if (oldGround.geometry) oldGround.geometry.dispose();
      if (oldGround.material) oldGround.material.dispose();
    }

    // Create new ground with dynamic size
    const size = Math.sqrt(gameState.land.length);
    const groundSize = Math.max(size * 1.5, 2); // At least 2 units, scales with grid
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x90EE90, // Default grass color
      roughness: 0.8,
      metalness: 0.2
    });

    // Apply texture if available
    if (texturesRef.current?.grass?.diffuse) {
      groundMaterial.map = texturesRef.current.grass.diffuse.clone(); // Clone texture to avoid sharing
      groundMaterial.map.repeat.set(size, size);
      groundMaterial.map.wrapS = groundMaterial.map.wrapT = THREE.RepeatWrapping;
      groundMaterial.needsUpdate = true;
    }

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    sceneRef.current.add(ground);
  };

  // Create and update tiles
  const updateTiles = () => {
    if (!sceneRef.current) return;

    // Remove old tiles
    const oldTiles = sceneRef.current.children.filter(child => child.userData.isTile || child.userData.isCrop);
    oldTiles.forEach(tile => {
      sceneRef.current.remove(tile);
      if (tile.geometry) tile.geometry.dispose();
      if (tile.material) {
        if (Array.isArray(tile.material)) {
          tile.material.forEach(m => m.dispose());
        } else {
          tile.material.dispose();
        }
      }
    });

    // Create reusable textures
    const plowedTexture = new THREE.TextureLoader().load(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    );
    plowedTexture.wrapS = plowedTexture.wrapT = THREE.RepeatWrapping;
    plowedTexture.repeat.set(2, 2);

    // Create new tiles based on gameState
    const size = Math.sqrt(gameState.land.length);
    const tileSize = 0.95;
    const offset = (size - 1) / 2;

    gameState.land.forEach((tile, index) => {
      const x = Math.floor(index / size);
      const z = index % size;
      const position = new THREE.Vector3(x - offset, 0.01, z - offset);

      // Create base tile
      const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
      let material;

      if (tile.isPlowed) {
        material = new THREE.MeshStandardMaterial({
          color: 0x795548,  // Brown color for plowed soil
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide,
          map: plowedTexture
        });
      } else if (tile.hasCrop) {
        material = new THREE.MeshStandardMaterial({
          color: 0x8D6E63,  // Darker brown for farmland
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: 0x81C784,  // Light green for grass
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(position);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      mesh.userData.isTile = true;
      mesh.userData.tileIndex = index;
      
      sceneRef.current.add(mesh);

      // Add crop if exists
      if (tile.hasCrop && tile.cropType) {
        const cropModel = createStylizedCropModel(tile.cropType);
        const growthProgress = tile.cropState === 'ready' ? 1 : 
                             tile.cropState === 'growing' ? 0.5 : 0.2;
        
        cropModel.scale.setScalar(growthProgress);
        cropModel.position.set(position.x, position.y, position.z);
        cropModel.userData.isCrop = true;
        cropModel.userData.tileIndex = index;
        cropModel.userData.cropType = tile.cropType;
        cropModel.userData.growthState = tile.cropState;
        
        sceneRef.current.add(cropModel);
      }
    });

    // Update grid helper
    const oldGrid = sceneRef.current.children.find(child => child instanceof THREE.GridHelper);
    if (oldGrid) {
      sceneRef.current.remove(oldGrid);
      oldGrid.material.dispose();
      oldGrid.geometry.dispose();
    }

    const gridHelper = new THREE.GridHelper(size, size, 0x000000, 0x000000);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    sceneRef.current.add(gridHelper);

    // Update ground plane
    updateGround();
  };

  // Update the animateTileAction function
  const animateTileAction = (tileIndex, actionType) => {
    if (!sceneRef.current || !droneRef.current) return;

    const tile = sceneRef.current.children.find(
      child => (child.userData.isTile || child.userData.isCrop) && 
      child.userData.tileIndex === tileIndex
    );

    if (!tile) return;

    const animation = ANIMATIONS[actionType];
    const startTime = Date.now();
    const startPosition = tile.position.clone();
    const startRotation = tile.rotation.clone();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      
      // Smooth easing functions
      const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const easeOutBack = t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      
      const t = easeInOutCubic(progress);

      // Animate tile based on action type
      switch (actionType) {
        case 'PLOW':
        case 'PLANT':
        case 'HARVEST': {
          if (animation.droneAnimation) {
            // Calculate drone dive animation
            const diveProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
            const hoverHeight = animation.droneAnimation.startHeight;
            const diveHeight = animation.droneAnimation.diveHeight;
            
            // Update drone position and rotation
            droneRef.current.position.y = hoverHeight + (diveHeight - hoverHeight) * diveProgress;
            droneRef.current.rotation.x = animation.droneAnimation.diveRotation * diveProgress;
            
            // Add slight tilt based on movement
            if (progress < 0.5) {
              droneRef.current.rotation.z = -0.1 * diveProgress;
            } else {
              droneRef.current.rotation.z = 0.1 * diveProgress;
            }
          }
          break;
        }
      }

      // Continue existing tile animations
      switch (actionType) {
        case 'PLOW': {
          const verticalProgress = Math.sin(progress * Math.PI);
          tile.position.y = startPosition.y + verticalProgress * animation.heightOffset;
          tile.rotation.z = startRotation.z + progress * animation.rotationOffset;
          break;
        }
        case 'PLANT': {
          if (tile.userData.isCrop) {
            const scale = animation.scaleStart + (1 - animation.scaleStart) * t;
            const wobble = Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.1;
            tile.scale.set(scale, scale, scale);
            tile.position.y = startPosition.y + animation.heightOffset * t;
            tile.rotation.z = wobble;
          }
          break;
        }
        case 'HARVEST': {
          if (tile.userData.isCrop) {
            const verticalProgress = easeOutBack(progress);
            tile.position.y = startPosition.y + animation.heightOffset * verticalProgress;
            tile.rotation.y = startRotation.y + animation.rotationOffset * progress;
            tile.rotation.z = startRotation.z + Math.sin(progress * Math.PI * 4) * 0.2;
            
            if (tile.material) {
              tile.material.opacity = 1 - easeInOutCubic(progress);
              tile.material.transparent = true;
            }
          }
          break;
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Reset drone rotation when animation completes
        droneRef.current.rotation.set(0, 0, 0);
        
        if (actionType === 'HARVEST') {
          // Cleanup after harvest animation
          sceneRef.current.remove(tile);
          if (tile.geometry) tile.geometry.dispose();
          if (tile.material) {
            if (Array.isArray(tile.material)) {
              tile.material.forEach(m => m.dispose());
            } else {
              tile.material.dispose();
            }
          }
        }
      }
    };

    animate();
  };

  // Handle incoming actions
  useEffect(() => {
    if (lastAction && lastAction.type && lastAction.tileIndex !== undefined) {
      actionQueueRef.current.push(lastAction);
      
      // Process the action
      const processAction = async () => {
        const action = actionQueueRef.current[0];
        await new Promise(resolve => {
          animateTileAction(action.tileIndex, action.type);
          
          // Wait for animation to complete
          const duration = ANIMATIONS[action.type].duration;
          setTimeout(() => {
            actionQueueRef.current.shift();
            if (onActionComplete) {
              onActionComplete(action);
            }
            resolve();
          }, duration);
        });

        // Process next action if any
        if (actionQueueRef.current.length > 0) {
          processAction();
        }
      };

      if (actionQueueRef.current.length === 1) {
        processAction();
      }
    }
  }, [lastAction]);

  // Initialize tutorial
  useEffect(() => {
    // Check if tutorial was previously completed
    const tutorialComplete = localStorage.getItem('farmingTutorialComplete');
    if (tutorialComplete === 'true') {
      setShowTutorial(false);
    } else {
      // Show tutorial after a short delay
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update tutorial progress based on actions
  useEffect(() => {
    if (lastAction && showTutorial) {
      const { completedSteps } = tutorialProgress;
      
      // Update progress based on action type
      switch (lastAction.type) {
        case 'PLOW':
          if (!completedSteps.has('first_plow')) {
            completedSteps.add('first_plow');
          }
          break;
        case 'PLANT':
          if (!completedSteps.has('first_plant')) {
            completedSteps.add('first_plant');
          }
          break;
      }

      // Save progress
      setTutorialProgress(prev => ({
        ...prev,
        completedSteps,
        lastAction
      }));
    }
  }, [lastAction, showTutorial]);

  // Reset tutorial when game state changes
  useEffect(() => {
    if (gameState.land.length > 0) {
      // Reset tutorial progress when starting a new game
      setTutorialProgress({
        completedSteps: new Set(),
        lastAction: null
      });
      
      // Show tutorial unless previously completed
      const tutorialComplete = localStorage.getItem('farmingTutorialComplete');
      if (tutorialComplete !== 'true') {
        setShowTutorial(true);
      }
    }
  }, [gameState.land.length]);

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('farmingTutorialComplete', 'true');
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
    sceneRef.current = scene;

    // Create camera with initial position
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const initialCamera = calculateCameraPosition();
    camera.position.copy(initialCamera.position);
    camera.lookAt(initialCamera.target);

    // Create renderer with improved settings
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: "high-performance",
      stencil: false
    });
    renderer.setSize(600, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create environment map
    const envMap = createEnvironmentMap(renderer);
    scene.environment = envMap;

    // Add lights with improved settings
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(10, 10, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -10;
    sunLight.shadow.camera.right = 10;
    sunLight.shadow.camera.top = 10;
    sunLight.shadow.camera.bottom = -10;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // Add subtle point lights for better ambiance
    const pointLight1 = new THREE.PointLight(0xffd700, 0.5, 10);
    pointLight1.position.set(2, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ffff, 0.3, 10);
    pointLight2.position.set(-2, 3, -2);
    scene.add(pointLight2);

    // Initial ground setup will be handled by updateTiles
    updateTiles();

    // Setup post-processing with improved settings
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(600, 600),
      0.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    composer.addPass(bloomPass);

    const smaaPass = new SMAAPass(600, 600);
    composer.addPass(smaaPass);

    // Add OrbitControls with dynamic limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minPolarAngle = Math.PI / 6;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.5;
    controls.rotateSpeed = 0.5;

    // Set initial camera position
    camera.position.copy(initialCamera.position);
    controls.target.copy(initialCamera.target);
    controls.update();

    // Load assets with improved error handling
    Promise.all([loadTextures(), loadModels()]).then(() => {
      // Add drone to scene with improved fallback handling
      if (modelsRef.current.drone) {
        const drone = modelsRef.current.drone.clone();
        drone.scale.set(0.5, 0.5, 0.5);
        drone.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.material.envMapIntensity = 1;
          }
        });
        scene.add(drone);
        droneRef.current = drone;
      } else {
        console.log('Using fallback drone model');
        const fallbackDrone = createFallbackDrone();
        scene.add(fallbackDrone);
        droneRef.current = fallbackDrone;
      }
    }).catch(error => {
      console.error('Error loading assets:', error);
      const fallbackDrone = createFallbackDrone();
      scene.add(fallbackDrone);
      droneRef.current = fallbackDrone;
    });

    // Animation loop with improved timing
    let lastTime = 0;
    const animate = (time) => {
      requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Update drone hover animation with higher base height
      if (droneRef.current) {
        const baseHeight = 2.0;  // Increased hover height
        droneRef.current.position.y = baseHeight + Math.sin(time * 0.002) * 0.1;
        
        // Rotate propellers if using fallback model
        if (!modelsRef.current.drone) {
          droneRef.current.children.forEach((child, index) => {
            if (index > 4) { // Skip body and arms
              child.rotation.y += 15 * delta;
            }
          });
        }
      }

      // Update controls and render
      controls.update();
      composer.render();
    };
    animate(0);

    // Cleanup with improved resource disposal
    return () => {
      renderer.dispose();
      composer.dispose();
      controls.dispose();
      envMap.dispose();
      
      Object.values(texturesRef.current).forEach(textures => {
        Object.values(textures).forEach(texture => texture.dispose());
      });
      
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  // Update drone position when gameState changes
  useEffect(() => {
    if (!droneRef.current || !gameState.dronePosition) return;
    
    const targetPos = gameToScene(gameState.dronePosition.x, gameState.dronePosition.y);
    
    // Smoothly animate to new position
    const duration = 500; // 0.5 seconds
    const startPosition = {
      x: droneRef.current.position.x,
      y: droneRef.current.position.y,
      z: droneRef.current.position.z
    };
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const t = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Update drone position
      droneRef.current.position.x = startPosition.x + (targetPos.x - startPosition.x) * t;
      droneRef.current.position.z = startPosition.z + (targetPos.z - startPosition.z) * t;
      droneRef.current.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1; // Keep hover animation

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [gameState.dronePosition, gameState.land.length, gameToScene]);

  // Update tiles when gameState changes
  useEffect(() => {
    updateTiles();
  }, [gameState.land]);

  // Add new effect to handle camera position updates when grid size changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const newCamera = calculateCameraPosition();
    
    // Get the orbit controls instance
    const canvas = canvasRef.current;
    const controls = canvas.__controls;
    
    if (controls) {
      // Smoothly animate to new position
      const duration = 1000; // 1 second
      const startPosition = controls.object.position.clone();
      const startTarget = controls.target.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const t = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Update camera position
        controls.object.position.lerpVectors(startPosition, newCamera.position, t);
        controls.target.lerpVectors(startTarget, newCamera.target, t);
        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }, [gameState.land.length]);

  return (
    <div style={{ 
      width: '600px', 
      height: '600px', 
      backgroundColor: '#000000',
      margin: '0 auto',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      <canvas 
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      {showTutorial && (
        <TutorialGuide
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
};

export default Game3D; 