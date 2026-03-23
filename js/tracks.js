/* ── Track Definitions & Geometry ── */

const Tracks = (() => {
  // Two switch points connect the four parallel sidings
  // SP1: where A meets B and the branch to C/D
  // SP2: where C and D split
  const SP1 = new THREE.Vector3(1, 0, 1.5);
  const SP2 = new THREE.Vector3(3, 0, 4.5);

  // All four sidings run horizontally (along X axis), at different Z positions
  // Each track has a throatX (where the loco enters, near switches) and fills
  // inward (away from throat). For display, cars are placed so that reading
  // left-to-right matches the array order on every track.
  //
  // A: throat on RIGHT (x=0), fills leftward. Loco at right, cars to left.
  // B/C/D: throat on LEFT, fills rightward. Loco at left, cars to right.
  const definitions = {
    A: {
      throatX: 0,         // right end, near switches
      fillDir: -1,        // cars fill leftward from throat

      z: 0,
      length: 14,
      capacity: CONFIG.trackCapacity.A,
    },
    B: {
      throatX: 3,         // left end, near switches
      fillDir: 1,         // cars fill rightward from throat

      z: 3,
      length: 14,
      capacity: CONFIG.trackCapacity.B,
    },
    C: {
      throatX: 5,
      fillDir: 1,
      displayDir: 1,
      z: 6,
      length: 10,
      capacity: CONFIG.trackCapacity.C,
    },
    D: {
      throatX: 5,
      fillDir: 1,
      displayDir: 1,
      z: 8,
      length: 10,
      capacity: CONFIG.trackCapacity.D,
    },
  };

  // Diagonal connecting rail segments (for visual rendering)
  const connectors = [
    { from: new THREE.Vector3(0, 0, 0), to: SP1 },       // A throat → SP1
    { from: SP1, to: new THREE.Vector3(3, 0, 3) },       // SP1 → B entrance
    { from: SP1, to: SP2 },                                // SP1 → SP2 (branch)
    { from: SP2, to: new THREE.Vector3(5, 0, 6) },       // SP2 → C entrance
    { from: SP2, to: new THREE.Vector3(5, 0, 8) },       // SP2 → D entrance
  ];

  // The throat point of each siding (where the loco enters, near switches)
  function getTrackThroat(trackId) {
    const t = definitions[trackId];
    return new THREE.Vector3(t.throatX, 0, t.z);
  }

  // For routing and connectors, "start" = throat
  function getTrackStart(trackId) {
    return getTrackThroat(trackId);
  }

  // The far end of each siding (opposite end from throat)
  function getTrackEnd(trackId) {
    const t = definitions[trackId];
    const endX = t.throatX + t.fillDir * t.length;
    return new THREE.Vector3(endX, 0, t.z);
  }

  // Left edge X of each track (for uniform left-to-right positioning)
  function getLeftX(trackId) {
    const t = definitions[trackId];
    if (t.fillDir < 0) {
      // A: throat on right, far end on left
      return t.throatX + t.fillDir * t.length;
    }
    // B/C/D: throat is already the left end
    return t.throatX;
  }

  // Loco position: always leftmost on every track
  function getLocoPosition(trackId) {
    const t = definitions[trackId];
    return new THREE.Vector3(getLeftX(trackId) + 1.2, 0, t.z);
  }

  // Car position: slot 0 = leftmost, filling rightward
  function getCarPosition(trackId, slotIndex) {
    const t = definitions[trackId];
    const x = getLeftX(trackId) + 1.2 + slotIndex * CONFIG.slotSpacing;
    return new THREE.Vector3(x, 0, t.z);
  }

  // Coupled car position: coupled[0] just right of loco, filling rightward
  function getCoupledCarPosition(trackId, coupledIndex) {
    const t = definitions[trackId];
    const x = getLeftX(trackId) + 1.2 + (coupledIndex + 1) * CONFIG.slotSpacing;
    return new THREE.Vector3(x, 0, t.z);
  }

  // Y rotation: all tracks run horizontally, cars face right
  function getTrackRotation(trackId) {
    return 0; // all cars face along +X
  }

  // Compute waypoints for moving from one track to another
  // All moves route through the relevant switch points
  function getRouteWaypoints(fromTrack, toTrack) {
    const fromStart = getTrackStart(fromTrack);
    const toStart = getTrackStart(toTrack);

    // Determine which switch points to traverse
    const topTracks = ['A', 'B'];    // connected via SP1
    const bottomTracks = ['C', 'D']; // connected via SP2

    const fromIsTop = topTracks.includes(fromTrack);
    const toIsTop = topTracks.includes(toTrack);
    const fromIsBottom = bottomTracks.includes(fromTrack);
    const toIsBottom = bottomTracks.includes(toTrack);

    if (fromIsTop && toIsTop) {
      // A ↔ B: route through SP1
      return [fromStart, SP1.clone(), toStart];
    } else if (fromIsBottom && toIsBottom) {
      // C ↔ D: route through SP2
      return [fromStart, SP2.clone(), toStart];
    } else {
      // Cross between top and bottom: route through SP1 and SP2
      if (fromIsTop) {
        return [fromStart, SP1.clone(), SP2.clone(), toStart];
      } else {
        return [fromStart, SP2.clone(), SP1.clone(), toStart];
      }
    }
  }

  return {
    SP1,
    SP2,
    definitions,
    connectors,
    getTrackStart,
    getTrackEnd,
    getLocoPosition,
    getCarPosition,
    getCoupledCarPosition,
    getTrackRotation,
    getRouteWaypoints,
  };
})();
