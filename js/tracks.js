/* ── Track Definitions & Geometry ── */

const Tracks = (() => {
  // Switch geometry: all switches have the same frog angle.
  // One leg continues straight; the other diverges at SWITCH_ANGLE.
  const SWITCH_ANGLE = Math.PI / 12; // 15 degrees
  const cosA = Math.cos(SWITCH_ANGLE);
  const sinA = Math.sin(SWITCH_ANGLE);

  // SP1: on the A/B line, where the branch to C/D diverges
  const SP1 = new THREE.Vector3(1, 0, 0);

  // SP2: where C and D split.
  // Located along the 15° diagonal from SP1.
  // The z-separation between the A/B line and siding C determines the diagonal length.
  const zSep = 2;
  const diagLen = zSep / sinA;
  const SP2 = new THREE.Vector3(
    SP1.x + diagLen * cosA,
    0,
    SP1.z + diagLen * sinA
  );

  // Switch lead: short segment between a switch point and a siding throat
  const lead = 1;

  // ── Track definitions ──
  // Each track has a throat (near the switches) and extends in a direction.
  //   throatX/throatZ : throat position (connection to switch lead)
  //   dirX/dirZ       : unit direction the siding extends from the throat
  //   length          : rail length from throat to buffer stop
  //
  // A and B are colinear (both at z=0).
  // B and C are parallel (both horizontal).
  // D continues the SP1→SP2 diagonal at 15° from horizontal.
  //
  // At SP1: straight leg = A/B (horizontal), diverging leg = 15° toward SP2.
  // At SP2: straight leg = continues at 15° toward D,
  //         diverging leg = bends 15° back to horizontal toward C.

  const definitions = {
    A: {
      throatX: SP1.x - lead,
      throatZ: 0,
      dirX: -1,       // extends leftward from throat
      dirZ: 0,
      length: 14,
      capacity: CONFIG.trackCapacity.A,
    },
    B: {
      throatX: SP1.x + lead,
      throatZ: 0,
      dirX: 1,        // extends rightward from throat (colinear with A)
      dirZ: 0,
      length: 14,
      capacity: CONFIG.trackCapacity.B,
    },
    C: {
      throatX: SP2.x + lead,
      throatZ: SP2.z,
      dirX: 1,        // horizontal, parallel to B
      dirZ: 0,
      length: 10,
      capacity: CONFIG.trackCapacity.C,
    },
    D: {
      throatX: SP2.x + lead * cosA,
      throatZ: SP2.z + lead * sinA,
      dirX: cosA,     // continues at 15° from horizontal
      dirZ: sinA,
      length: 10,
      capacity: CONFIG.trackCapacity.D,
    },
  };

  // ── Connecting rail segments (switch leads & diagonal) ──
  const connectors = [
    // SP1 switch leads
    { from: new THREE.Vector3(definitions.A.throatX, 0, 0), to: SP1 },
    { from: SP1, to: new THREE.Vector3(definitions.B.throatX, 0, 0) },
    // SP1 → SP2 diagonal
    { from: SP1, to: SP2 },
    // SP2 switch leads
    { from: SP2, to: new THREE.Vector3(definitions.C.throatX, 0, definitions.C.throatZ) },
    { from: SP2, to: new THREE.Vector3(definitions.D.throatX, 0, definitions.D.throatZ) },
  ];

  // ── Throat (connection point nearest to switches) ──
  function getTrackThroat(trackId) {
    const t = definitions[trackId];
    return new THREE.Vector3(t.throatX, 0, t.throatZ);
  }

  function getTrackStart(trackId) {
    return getTrackThroat(trackId);
  }

  // ── Far end of the siding (buffer-stop end) ──
  function getTrackEnd(trackId) {
    const t = definitions[trackId];
    return new THREE.Vector3(
      t.throatX + t.dirX * t.length,
      0,
      t.throatZ + t.dirZ * t.length
    );
  }

  // ── Entity placement ──
  // "Base" is where slot 0 lives (the loco position).
  // "Fill direction" is the unit vector along which successive cars are placed.
  //
  // Track A (headshunt): loco sits at the far end (away from switches),
  //   cars fill back toward the throat.
  // Tracks B/C/D: loco sits at the throat, cars fill away from switches.

  function getBasePosition(trackId) {
    if (trackId === 'A') {
      // Far end of A (away from switch)
      return getTrackEnd('A');
    }
    return getTrackThroat(trackId);
  }

  function getFillDir(trackId) {
    const t = definitions[trackId];
    if (trackId === 'A') {
      // Fill from far end back toward throat (reverse of track direction)
      return new THREE.Vector3(-t.dirX, 0, -t.dirZ);
    }
    return new THREE.Vector3(t.dirX, 0, t.dirZ);
  }

  function getLocoPosition(trackId) {
    const base = getBasePosition(trackId);
    const dir = getFillDir(trackId);
    return new THREE.Vector3(
      base.x + dir.x * 1.2,
      0,
      base.z + dir.z * 1.2
    );
  }

  function getCarPosition(trackId, slotIndex) {
    const base = getBasePosition(trackId);
    const dir = getFillDir(trackId);
    const offset = 1.2 + slotIndex * CONFIG.slotSpacing;
    return new THREE.Vector3(
      base.x + dir.x * offset,
      0,
      base.z + dir.z * offset
    );
  }

  function getCoupledCarPosition(trackId, coupledIndex) {
    const base = getBasePosition(trackId);
    const dir = getFillDir(trackId);
    const offset = 1.2 + (coupledIndex + 1) * CONFIG.slotSpacing;
    return new THREE.Vector3(
      base.x + dir.x * offset,
      0,
      base.z + dir.z * offset
    );
  }

  // Y-rotation so cars/loco face along the fill direction
  function getTrackRotation(trackId) {
    const dir = getFillDir(trackId);
    return Math.atan2(-dir.z, dir.x);
  }

  // ── Routing between tracks ──
  function getRouteWaypoints(fromTrack, toTrack) {
    const fromStart = getTrackStart(fromTrack);
    const toStart = getTrackStart(toTrack);

    const topTracks = ['A', 'B'];
    const bottomTracks = ['C', 'D'];

    const fromIsTop = topTracks.includes(fromTrack);
    const toIsTop = topTracks.includes(toTrack);
    const fromIsBottom = bottomTracks.includes(fromTrack);
    const toIsBottom = bottomTracks.includes(toTrack);

    if (fromIsTop && toIsTop) {
      return [fromStart, SP1.clone(), toStart];
    } else if (fromIsBottom && toIsBottom) {
      return [fromStart, SP2.clone(), toStart];
    } else if (fromIsTop) {
      return [fromStart, SP1.clone(), SP2.clone(), toStart];
    } else {
      return [fromStart, SP2.clone(), SP1.clone(), toStart];
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
