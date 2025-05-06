import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';

const ThreeDContainer = styled.div`
  width: 500px;
  height: 500px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
`;

const Farm3D = ({ farmState }) => {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const droneRef = useRef();

  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    sceneRef.current = scene;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      500 / 500,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(500, 500);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x7CFC00,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create grid
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Create drone
    const droneGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const droneMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const drone = new THREE.Mesh(droneGeometry, droneMaterial);
    drone.position.y = 0.5;
    scene.add(drone);
    droneRef.current = drone;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      // Cleanup
      containerRef.current.removeChild(renderer.domElement);
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

  // Update drone position when farmState changes
  useEffect(() => {
    if (droneRef.current) {
      const { x, y } = farmState.dronePosition;
      droneRef.current.position.x = x - 4.5;
      droneRef.current.position.z = y - 4.5;
    }
  }, [farmState.dronePosition]);

  return <ThreeDContainer ref={containerRef} />;
};

export default Farm3D; 