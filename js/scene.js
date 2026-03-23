/* ── Three.js Scene Setup ── */

const SceneManager = (() => {
  let scene, camera, renderer, controls;

  function init() {
    const canvas = document.getElementById('gameCanvas');

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1a1a2e);

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(
      CONFIG.cameraPosition.x,
      CONFIG.cameraPosition.y,
      CONFIG.cameraPosition.z
    );
    camera.lookAt(
      CONFIG.cameraLookAt.x,
      CONFIG.cameraLookAt.y,
      CONFIG.cameraLookAt.z
    );

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.target.set(
      CONFIG.cameraLookAt.x,
      CONFIG.cameraLookAt.y,
      CONFIG.cameraLookAt.z
    );

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 10);
    directional.castShadow = true;
    directional.shadow.mapSize.set(2048, 2048);
    directional.shadow.camera.left = -30;
    directional.shadow.camera.right = 30;
    directional.shadow.camera.top = 30;
    directional.shadow.camera.bottom = -30;
    scene.add(directional);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(CONFIG.groundSize, CONFIG.groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: CONFIG.groundColor,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Handle resize
    window.addEventListener('resize', onResize);

    return { scene, camera, renderer, controls };
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }

  return { init, render, getScene: () => scene, getCamera: () => camera, getRenderer: () => renderer };
})();
