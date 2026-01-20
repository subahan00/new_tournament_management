import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeNebula = () => {
  const mountRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);
    camera.position.z = isMobile ? 8 : 6;

    const layers = [];
    const layerConfigs = [
      { count: isMobile ? 800 : 3000, size: 0.02, speed: 0.5, distance: 15 },
      { count: isMobile ? 600 : 2000, size: 0.015, speed: 0.8, distance: 10 },
      { count: isMobile ? 400 : 1500, size: 0.01, speed: 1.2, distance: 5 }
    ];

    layerConfigs.forEach((config, layerIndex) => {
      const positions = new Float32Array(config.count * 3);
      const colors = new Float32Array(config.count * 3);
      const colorPurple = new THREE.Color('#2c1b4b');
      const colorGold = new THREE.Color('#ffdf80');
      const colorDeepPurple = new THREE.Color('#1a0f2e');

      for (let i = 0; i < config.count * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * config.distance;

        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);

        let mixedColor;
        const rand = Math.random();
        if (layerIndex === 0) mixedColor = rand > 0.85 ? colorGold.clone() : colorDeepPurple.clone();
        else if (layerIndex === 1) mixedColor = rand > 0.9 ? colorGold.clone() : colorPurple.clone();
        else mixedColor = rand > 0.95 ? colorGold.clone() : colorPurple.clone();

        colors[i] = mixedColor.r;
        colors[i + 1] = mixedColor.g;
        colors[i + 2] = mixedColor.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: config.size, vertexColors: true, blending: THREE.AdditiveBlending,
        transparent: true, opacity: 0.8 - layerIndex * 0.2,
      });

      const starField = new THREE.Points(geometry, material);
      layers.push({ mesh: starField, speed: config.speed });
      scene.add(starField);
    });

    const handleMouseMove = (event) => { 
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1; 
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1; 
    };
    
    const handleDeviceOrientation = (event) => {
      const { gamma, beta } = event;
      if (gamma !== null && beta !== null) { 
        mouse.current.x = (gamma / 45); 
        mouse.current.y = (beta / 90); 
      }
    };

    if (isMobile && window.DeviceOrientationEvent) { 
      window.addEventListener('deviceorientation', handleDeviceOrientation); 
    } else { 
      window.addEventListener('mousemove', handleMouseMove); 
    }

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      layers.forEach((layer) => {
        layer.mesh.rotation.y = elapsedTime * 0.02 * layer.speed;
        layer.mesh.rotation.x = elapsedTime * 0.01 * layer.speed;
      });
      camera.position.x += (mouse.current.x * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.02;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('resize', handleResize);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isMobile]);

  return <div ref={mountRef} className="fixed inset-0 -z-20" />;
};

export default ThreeNebula;