/**
 * SCS Platform - Three.js Particle Field - CLEAN VERSION
 * Creates a subtle, premium particle background with smooth floating movement
 */

(function() {
  'use strict';

  // Check if THREE is available
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded. Particles will not be displayed.');
    return;
  }

  var canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Scene setup
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true 
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Camera position
  camera.position.z = 5;

  // Create particles - REDUCED for cleaner look
  var particleCount = 800;
  var positions = new Float32Array(particleCount * 3);
  var colors = new Float32Array(particleCount * 3);

  var acidColor = new THREE.Color(0xc8ff00);

  for (var i = 0; i < particleCount; i++) {
    // Random positions in a sphere
    var radius = 8 + Math.random() * 12;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Acid color with slight variation
    colors[i * 3] = acidColor.r;
    colors[i * 3 + 1] = acidColor.g;
    colors[i * 3 + 2] = acidColor.b;
  }

  var particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Particles - More visible
  var particleMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });

  var particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Create subtle cyber grid
  function createGrid() {
    var gridGroup = new THREE.Group();
    var gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0xc8ff00, 
      transparent: true, 
      opacity: 0.08 
    });

    var gridSize = 11;
    var spacing = 1;

    for (var i = -gridSize / 2; i <= gridSize / 2; i++) {
      // Horizontal lines
      var hGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridSize / 2 * spacing, i * spacing, -3),
        new THREE.Vector3(gridSize / 2 * spacing, i * spacing, -3)
      ]);
      var hLine = new THREE.Line(hGeom, gridMaterial);
      gridGroup.add(hLine);

      // Vertical lines
      var vGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * spacing, -gridSize / 2 * spacing, -3),
        new THREE.Vector3(i * spacing, gridSize / 2 * spacing, -3)
      ]);
      var vLine = new THREE.Line(vGeom, gridMaterial);
      gridGroup.add(vLine);
    }

    return gridGroup;
  }

  var grid = createGrid();
  scene.add(grid);

  // Mouse position for subtle parallax
  var mouseX = 0;
  var mouseY = 0;
  var targetX = 0;
  var targetY = 0;

  document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // Animation loop - Very slow and subtle
  function animate() {
    requestAnimationFrame(animate);

    // Extremely slow particle rotation
    particles.rotation.y += 0.0001;
    particles.rotation.x += 0.00005;

    // Subtle mouse parallax
    targetX += (mouseX * 0.2 - targetX) * 0.02;
    targetY += (mouseY * 0.2 - targetY) * 0.02;

    camera.position.x = targetX;
    camera.position.y = targetY;
    camera.lookAt(scene.position);

    // Very slow grid rotation
    grid.rotation.y += 0.00005;

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
