/* ── Interaction: Raycasting, Click Handlers, Buttons ── */

const Interaction = (() => {
  let camera, renderer;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;

  function init(cam, rend) {
    camera = cam;
    renderer = rend;
    const canvas = renderer.domElement;

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMouseMove);

    // Move-to buttons
    document.querySelectorAll('.btn-move').forEach((btn) => {
      btn.addEventListener('click', () => {
        const trackId = btn.dataset.track;
        handleMove(trackId);
      });
    });
    updateMoveButtons();

    // Action buttons
    document.getElementById('btn-couple').addEventListener('click', handleCouple);
    document.getElementById('btn-decouple').addEventListener('click', handleDecouple);
    document.getElementById('btn-retry').addEventListener('click', () => HUD.retryGame());
    document.getElementById('btn-reset').addEventListener('click', () => HUD.resetGame());
  }

  // Disable buttons for invalid moves: current track + routing constraints
  function updateMoveButtons() {
    const current = GameState.state.locoTrack;
    document.querySelectorAll('.btn-move').forEach((btn) => {
      const dest = btn.dataset.track;
      // From B/C/D only A is valid; from A any other siding is valid
      btn.disabled = (dest === current) || (current !== 'A' && dest !== 'A');
    });
  }

  function onClick(event) {
    if (Animation.isLocked() || GameState.state.won) return;

    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);

    // Check click zones first
    const zoneHits = raycaster.intersectObjects(Entities.getClickZones());
    if (zoneHits.length > 0) {
      const trackId = zoneHits[0].object.userData.trackId;
      handleTrackClick(trackId);
      return;
    }

    // Check car/loco meshes
    const allMeshes = [Entities.getLocoMesh()];
    for (let i = 1; i <= CONFIG.totalCars; i++) {
      allMeshes.push(Entities.getCarMesh(i));
    }
    const meshHits = raycaster.intersectObjects(allMeshes, true);
    if (meshHits.length > 0) {
      let obj = meshHits[0].object;
      // Walk up to find the root mesh with userData
      while (obj.parent && !obj.userData.trackId && !obj.userData.isCar && !obj.userData.isLoco) {
        obj = obj.parent;
      }
      if (obj.userData.isCar || obj.userData.isLoco) {
        // Determine which track this entity is on and click that track
        const trackId = findTrackOfEntity(obj);
        if (trackId) handleTrackClick(trackId);
      }
    }
  }

  function findTrackOfEntity(mesh) {
    if (mesh.userData.isLoco) return GameState.state.locoTrack;
    const carId = mesh.userData.carId;
    if (!carId) return null;

    // Check if coupled
    if (GameState.state.coupled.includes(carId)) return GameState.state.locoTrack;

    // Check sidings
    for (const trackId of ['A', 'B', 'C', 'D']) {
      if (GameState.state.sidings[trackId].includes(carId)) return trackId;
    }
    return null;
  }

  function handleTrackClick(trackId) {
    if (trackId === GameState.state.locoTrack) {
      // Clicked own track: do nothing (use buttons to couple/decouple)
      return;
    }
    // Clicked a different track: move there
    handleMove(trackId);
  }

  function handleCouple() {
    if (Animation.isLocked() || GameState.state.won) return;
    const result = GameState.coupleOne();
    if (!result.ok) {
      HUD.showError(result.reason);
      return;
    }
    Entities.positionAllEntities();
    HUD.updateStatus();

    // Check win after coupling
    if (GameState.checkWin()) {
      HUD.showVictory();
      Animation.animateVictoryDriveOff();
    }
  }

  function handleDecouple() {
    if (Animation.isLocked() || GameState.state.won) return;
    const result = GameState.decoupleAll();
    if (!result.ok) {
      HUD.showError(result.reason);
      return;
    }
    Entities.positionAllEntities();
    HUD.updateStatus();
  }

  function handleMove(toTrack) {
    if (Animation.isLocked() || GameState.state.won) return;

    if (!GameState.canMove(toTrack)) {
      HUD.showError(LANG.noRoom);
      return;
    }

    const fromTrack = GameState.state.locoTrack;
    const moveResult = GameState.executeMove(toTrack);
    if (!moveResult.ok) {
      HUD.showError(moveResult.reason);
      return;
    }

    HUD.updateMoves();
    HUD.updateStatus();
    updateMoveButtons();

    // Animate the movement
    Animation.animateMove(fromTrack, toTrack, () => {
      HUD.updateStatus();
    });
  }

  function onMouseMove(event) {
    if (Animation.isLocked()) return;

    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);

    // Highlight hovered cars
    const allMeshes = [];
    for (let i = 1; i <= CONFIG.totalCars; i++) {
      allMeshes.push(Entities.getCarMesh(i));
    }
    allMeshes.push(Entities.getLocoMesh());

    const hits = raycaster.intersectObjects(allMeshes, true);

    // Clear previous highlight
    if (hoveredMesh) {
      clearHighlight(hoveredMesh);
      hoveredMesh = null;
    }

    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && !obj.userData.isCar && !obj.userData.isLoco) {
        obj = obj.parent;
      }
      if (obj.userData.isCar || obj.userData.isLoco) {
        setHighlight(obj);
        hoveredMesh = obj;
        renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }

    // Check click zones
    const zoneHits = raycaster.intersectObjects(Entities.getClickZones());
    if (zoneHits.length > 0) {
      renderer.domElement.style.cursor = 'pointer';
    } else {
      renderer.domElement.style.cursor = 'default';
    }
  }

  function setHighlight(mesh) {
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => { m.emissive && m.emissive.set(0x333333); });
      } else {
        mesh.material.emissive && mesh.material.emissive.set(0x333333);
      }
    }
  }

  function clearHighlight(mesh) {
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => { m.emissive && m.emissive.set(0x000000); });
      } else {
        mesh.material.emissive && mesh.material.emissive.set(0x000000);
      }
    }
  }

  function updateMouse(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  return { init, updateMoveButtons };
})();
