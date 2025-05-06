import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import * as THREE from 'three';

const Game3D = ({ gameState, setGameState }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const droneRef = useRef(null);
  const modelsRef = useRef({});
  const animationFrameRef = useRef(null);

  // Convert game coordinates to 3D coordinates
  const gameToScene = useCallback((x, y) => {
    return {
      x: x - 2,
      z: y - 2
    };
  }, []);

  // Ensure component is mounted before initialization
  useLayoutEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    try {
      if (!canvasRef.current || !isMounted) {
        console.warn('Canvas element not found or component not mounted');
        return false;
      }

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);
      
      // Create camera with better angle
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(3, 4, 3);
      camera.lookAt(0, 0, 0);
      
      // Create renderer with proper size
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true,
        alpha: true
      });
      renderer.setSize(600, 600, false);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Create ground plane that matches current grid size
      const gridSize = Math.sqrt(gameState.land.length);
      const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set((gridSize/2)-2.5, 0, (gridSize/2)-2.5); // Center the ground based on grid size
      scene.add(ground);

      // Create grid helper that matches current size
      const gridHelper = new THREE.GridHelper(gridSize, gridSize);
      gridHelper.position.set((gridSize/2)-2.5, 0, (gridSize/2)-2.5); // Center the grid
      scene.add(gridHelper);

      // Create drone using basic geometry
      const droneGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
      const droneMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
      const drone = new THREE.Mesh(droneGeometry, droneMaterial);
      
      // Set initial drone position from game state
      const initialPos = gameToScene(gameState.dronePosition.x, gameState.dronePosition.y);
      drone.position.set(initialPos.x, 0.5, initialPos.z);
      scene.add(drone);
      droneRef.current = drone;

      // Create crop geometries
      const cropGeometries = {
        wheat: new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8),
        corn: new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8),
        potato: new THREE.SphereGeometry(0.2, 8, 8)
      };

      const cropMaterials = {
        wheat: new THREE.MeshStandardMaterial({ color: 0xF4D03F }),
        corn: new THREE.MeshStandardMaterial({ color: 0xF39C12 }),
        potato: new THREE.MeshStandardMaterial({ color: 0x935116 })
      };

      // Create crop instances for current grid size
      const crops = {};
      ['wheat', 'corn', 'potato'].forEach(cropType => {
        crops[cropType] = Array(gameState.land.length).fill().map(() => {
          const crop = new THREE.Mesh(cropGeometries[cropType], cropMaterials[cropType]);
          crop.visible = false;
          scene.add(crop);
          return crop;
        });
      });

      // Store references
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      modelsRef.current = crops;

      return true;
    } catch (error) {
      console.error('Error initializing scene:', error);
      return false;
    }
  }, [isMounted, gameState.dronePosition, gameState.land.length, gameToScene]);

  // Initialize and run animation
  useEffect(() => {
    if (!isMounted) return;

    console.log('Initializing Game3D');
    
    // Initialize scene if not already done
    if (!isInitialized) {
      const sceneInitialized = initializeScene();
      if (!sceneInitialized) {
        console.error('Failed to initialize scene');
        return;
      }
      setIsInitialized(true);
    }

    console.log('Starting animation loop');

    // Animation function
    function animate() {
      if (!droneRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) {
        console.warn('Required 3D objects not found');
        return;
      }

      // Update drone position
      const targetPos = gameToScene(gameState.dronePosition.x, gameState.dronePosition.y);
      droneRef.current.position.x = targetPos.x;
      droneRef.current.position.z = targetPos.z;
      
      // Hover animation
      droneRef.current.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
      // Rotation animation
      droneRef.current.rotation.y += 0.02;

      // Animate crops
      if (modelsRef.current) {
        Object.entries(modelsRef.current).forEach(([cropType, cropInstances]) => {
          cropInstances.forEach((crop, index) => {
            if (crop.visible) {
              const tile = gameState.land[index];
              if (tile.cropState === 'growing') {
                const scale = 0.3 + Math.sin(Date.now() * 0.001 + index) * 0.1;
                crop.scale.set(0.5, scale, 0.5);
              } else if (tile.cropState === 'ready') {
                crop.rotation.y += 0.01;
              }
            }
          });
        });
      }

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Start animation loop
    animate();

    // Cleanup function
    return () => {
      console.log('Cleaning up Game3D');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [isMounted, isInitialized, initializeScene, gameState, gameToScene]);

  // Update crop visibility and state
  useEffect(() => {
    if (!isInitialized || !isMounted || !modelsRef.current) return;

    Object.entries(modelsRef.current).forEach(([cropType, cropInstances]) => {
      cropInstances.forEach((crop, index) => {
        const tile = gameState.land[index];
        const x = Math.floor(index / 5);
        const y = index % 5;
        const pos = gameToScene(x, y);

        if (tile.hasCrop && tile.cropType === cropType) {
          crop.visible = true;
          crop.position.set(pos.x, 0.25, pos.z);
          
          if (tile.cropState === 'ready') {
            crop.scale.set(1, 1, 1);
          } else {
            crop.scale.set(0.5, 0.5, 0.5);
          }
        } else {
          crop.visible = false;
        }
      });
    });
  }, [gameState, isInitialized, isMounted, gameToScene]);

  // Update scene when grid size changes
  useEffect(() => {
    if (!isInitialized || !isMounted || !sceneRef.current) return;

    const gridSize = Math.sqrt(gameState.land.length);
    
    // Update ground plane
    const ground = sceneRef.current.children.find(child => child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry);
    if (ground) {
      ground.geometry.dispose();
      ground.geometry = new THREE.PlaneGeometry(gridSize, gridSize);
      ground.position.set((gridSize/2)-2.5, 0, (gridSize/2)-2.5);
    }

    // Update grid helper
    const oldGrid = sceneRef.current.children.find(child => child instanceof THREE.GridHelper);
    if (oldGrid) {
      sceneRef.current.remove(oldGrid);
    }
    const newGrid = new THREE.GridHelper(gridSize, gridSize);
    newGrid.position.set((gridSize/2)-2.5, 0, (gridSize/2)-2.5);
    sceneRef.current.add(newGrid);

    // Update crop instances if needed
    if (modelsRef.current) {
      Object.entries(modelsRef.current).forEach(([cropType, cropInstances]) => {
        // Add more instances if grid expanded
        while (cropInstances.length < gameState.land.length) {
          const geometry = cropInstances[0].geometry;
          const material = cropInstances[0].material;
          const newCrop = new THREE.Mesh(geometry, material);
          newCrop.visible = false;
          sceneRef.current.add(newCrop);
          cropInstances.push(newCrop);
        }
      });
    }
  }, [gameState.land.length, isInitialized, isMounted]);

  if (!isMounted) return null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }} 
      />
    </div>
  );
};

export default Game3D; 