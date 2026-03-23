/* ── Entity Creation: Locomotive, Cars, Rails ── */

const Entities = (() => {
  let locoMesh = null;
  const carMeshes = {}; // keyed by car ID (1-8)
  const clickZones = []; // invisible planes for raycasting
  let scene = null;

  function init(sceneRef) {
    scene = sceneRef;
    createRails();
    createClickZones();
    createLocomotive();
    createAllCars();
    positionAllEntities();
  }

  // ── Rails ──
  function createRails() {
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.6,
      roughness: 0.4,
    });
    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.9,
    });

    // Draw the four parallel sidings
    ['A', 'B', 'C', 'D'].forEach((trackId) => {
      const start = Tracks.getTrackStart(trackId);
      const end = Tracks.getTrackEnd(trackId);
      drawRailSegment(start, end, railMaterial, sleeperMat);
      createTrackLabel(trackId, end);
    });

    // Draw the diagonal connector segments (switch throat)
    Tracks.connectors.forEach((seg) => {
      drawRailSegment(seg.from, seg.to, railMaterial, sleeperMat);
    });
  }

  function drawRailSegment(start, end, railMaterial, sleeperMat) {
    const dir = end.clone().sub(start);
    const length = dir.length();
    if (length < 0.1) return;
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const angle = Math.atan2(dir.x, dir.z);

    // Perpendicular offset for two rails
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(0.3);

    for (let side = -1; side <= 1; side += 2) {
      const railGeo = new THREE.BoxGeometry(0.08, 0.08, length);
      const rail = new THREE.Mesh(railGeo, railMaterial);
      rail.position.copy(mid).add(perp.clone().multiplyScalar(side));
      rail.position.y = 0.04;
      rail.rotation.y = angle;
      rail.receiveShadow = true;
      scene.add(rail);
    }

    // Sleepers (cross-ties)
    const sleeperCount = Math.max(1, Math.floor(length / 1.2));
    for (let i = 0; i < sleeperCount; i++) {
      const t = (i + 0.5) / sleeperCount;
      const pos = start.clone().lerp(end, t);
      const sleeperGeo = new THREE.BoxGeometry(0.12, 0.04, 0.9);
      const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.copy(pos);
      sleeper.position.y = 0.02;
      sleeper.rotation.y = angle;
      sleeper.receiveShadow = true;
      scene.add(sleeper);
    }
  }

  function createTrackLabel(trackId, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(trackId, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(position);
    sprite.position.y = 1.5;
    sprite.scale.set(1.5, 1.5, 1);
    scene.add(sprite);
  }

  // ── Click Zones (invisible planes over each track for raycasting) ──
  function createClickZones() {
    ['A', 'B', 'C', 'D'].forEach((trackId) => {
      const start = Tracks.getTrackStart(trackId);
      const end = Tracks.getTrackEnd(trackId);
      const dir = end.clone().sub(start);
      const length = dir.length();
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const angle = Math.atan2(dir.x, dir.z);

      const zoneGeo = new THREE.PlaneGeometry(2.0, length);
      const zoneMat = new THREE.MeshBasicMaterial({
        visible: false,
        side: THREE.DoubleSide,
      });
      const zone = new THREE.Mesh(zoneGeo, zoneMat);
      zone.position.copy(mid);
      zone.position.y = 0.5;
      zone.rotation.y = angle;
      zone.rotation.x = -Math.PI / 2;
      zone.userData.trackId = trackId;
      zone.userData.isClickZone = true;
      scene.add(zone);
      clickZones.push(zone);
    });
  }

  // ── Locomotive ──
  function createLocomotive() {
    const geo = new THREE.BoxGeometry(
      CONFIG.locoSize.x,
      CONFIG.locoSize.y,
      CONFIG.locoSize.z
    );
    const mat = new THREE.MeshStandardMaterial({
      color: CONFIG.locoColor,
      roughness: 0.4,
      metalness: 0.2,
    });
    locoMesh = new THREE.Mesh(geo, mat);
    locoMesh.castShadow = true;
    locoMesh.receiveShadow = true;
    locoMesh.position.y = CONFIG.locoSize.y / 2 + 0.08;
    locoMesh.userData.isLoco = true;
    scene.add(locoMesh);

    // Cab bump on top
    const cabGeo = new THREE.BoxGeometry(0.6, 0.4, CONFIG.locoSize.z * 0.8);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0xdd9900,
      roughness: 0.5,
    });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = CONFIG.locoSize.y / 2 + 0.2;
    cab.position.x = -0.4;
    cab.castShadow = true;
    locoMesh.add(cab);
  }

  // ── Cars ──
  function createAllCars() {
    for (let id = 1; id <= CONFIG.totalCars; id++) {
      const color = CONFIG.carColors[id - 1];
      const mesh = createCar(id, color);
      carMeshes[id] = mesh;
      scene.add(mesh);
    }
  }

  function createCar(id, color) {
    // Create materials array: colored sides + numbered ends
    const sideMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.1,
    });

    const labelTexture = createNumberTexture(id, color);
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.5,
    });

    const topTexture = createNumberTexture(id, color);
    const topMat = new THREE.MeshStandardMaterial({
      map: topTexture,
      roughness: 0.5,
    });

    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const materials = [
      labelMat,  // +x (right end)
      labelMat,  // -x (left end)
      topMat,    // +y (top) -- numbered for god-view visibility
      sideMat,   // -y (bottom)
      sideMat,   // +z (front side)
      sideMat,   // -z (back side)
    ];

    const geo = new THREE.BoxGeometry(
      CONFIG.carSize.x,
      CONFIG.carSize.y,
      CONFIG.carSize.z
    );
    const mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = CONFIG.carSize.y / 2 + 0.08;
    mesh.userData.carId = id;
    mesh.userData.isCar = true;
    return mesh;
  }

  function createNumberTexture(id, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background
    const c = new THREE.Color(bgColor);
    ctx.fillStyle = `rgb(${Math.floor(c.r * 255)},${Math.floor(c.g * 255)},${Math.floor(c.b * 255)})`;
    ctx.fillRect(0, 0, 128, 128);

    // White circle
    ctx.beginPath();
    ctx.arc(64, 64, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Number
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(id), 64, 66);

    return new THREE.CanvasTexture(canvas);
  }

  // ── Positioning ──
  function positionAllEntities() {
    const locoTrack = GameState.state.locoTrack;
    const coupled = GameState.state.coupled;

    // Position locomotive
    const locoPos = Tracks.getLocoPosition(locoTrack);
    locoMesh.position.x = locoPos.x;
    locoMesh.position.z = locoPos.z;
    locoMesh.rotation.y = Tracks.getTrackRotation(locoTrack);

    // Position coupled cars (right of loco)
    coupled.forEach((carId, idx) => {
      const pos = Tracks.getCoupledCarPosition(locoTrack, idx);
      const mesh = carMeshes[carId];
      mesh.position.x = pos.x;
      mesh.position.z = pos.z;
      mesh.rotation.y = Tracks.getTrackRotation(locoTrack);
    });

    // Position siding cars
    // On the loco's track, siding cars start after loco + coupled cars
    ['A', 'B', 'C', 'D'].forEach((trackId) => {
      const cars = GameState.state.sidings[trackId];
      const extraOffset = (trackId === locoTrack) ? coupled.length + 1 : 0;
      cars.forEach((carId, slotIndex) => {
        const pos = Tracks.getCarPosition(trackId, slotIndex + extraOffset);
        const mesh = carMeshes[carId];
        mesh.position.x = pos.x;
        mesh.position.z = pos.z;
        mesh.rotation.y = Tracks.getTrackRotation(trackId);
      });
    });
  }

  function getLocoMesh() { return locoMesh; }
  function getCarMesh(id) { return carMeshes[id]; }
  function getAllCarMeshes() { return carMeshes; }
  function getClickZones() { return clickZones; }

  return {
    init,
    positionAllEntities,
    getLocoMesh,
    getCarMesh,
    getAllCarMeshes,
    getClickZones,
  };
})();
