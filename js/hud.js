/* ── HUD: Target Consist, Move Counter, Status, Victory ── */

const HUD = (() => {
  let targetCarsEl, moveCounterEl, statusLineEl, victoryEl, victoryMovesEl, errorToastEl;
  let settingsMenuEl, checkSignsEl;
  let errorTimeout = null;

  function init() {
    targetCarsEl = document.getElementById('target-cars');
    moveCounterEl = document.getElementById('move-counter');
    statusLineEl = document.getElementById('status-line');
    victoryEl = document.getElementById('victory');
    victoryMovesEl = document.getElementById('victory-moves');
    errorToastEl = document.getElementById('error-toast');
    settingsMenuEl = document.getElementById('settings-menu');
    checkSignsEl = document.getElementById('check-signs');

    document.getElementById('btn-play-again').addEventListener('click', () => {
      resetGame();
    });

    // Settings logic
    document.getElementById('btn-settings').addEventListener('click', () => {
      settingsMenuEl.classList.toggle('hidden');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      settingsMenuEl.classList.add('hidden');
    });

    checkSignsEl.addEventListener('change', (e) => {
      Entities.setSignsVisible(e.target.checked);
    });

    renderTarget();
    updateMoves();
    updateStatus();
  }

  function renderTarget() {
    targetCarsEl.innerHTML = '';
    GameState.state.target.forEach((carId) => {
      const el = document.createElement('div');
      el.className = 'target-car';
      const color = new THREE.Color(CONFIG.carColors[carId - 1]);
      el.style.backgroundColor = `#${color.getHexString()}`;
      el.textContent = carId;
      targetCarsEl.appendChild(el);
    });
  }

  function updateMoves() {
    moveCounterEl.textContent = `${LANG.moves}: ${GameState.state.moves}`;
  }

  function makeChip(carId) {
    const chip = document.createElement('div');
    chip.className = 'status-chip';
    const color = new THREE.Color(CONFIG.carColors[carId - 1]);
    chip.style.backgroundColor = `#${color.getHexString()}`;
    chip.textContent = carId;
    return chip;
  }

  function makeStatusRow(label, carIds) {
    const row = document.createElement('div');
    row.className = 'status-row';

    const lbl = document.createElement('span');
    lbl.className = 'status-label';
    lbl.textContent = label;
    row.appendChild(lbl);

    if (carIds.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'status-empty';
      empty.textContent = '—';
      row.appendChild(empty);
    } else {
      const chips = document.createElement('div');
      chips.className = 'status-chips';
      carIds.forEach(id => chips.appendChild(makeChip(id)));
      row.appendChild(chips);
    }
    return row;
  }

  function updateStatus() {
    const st = GameState.state;
    statusLineEl.innerHTML = '';

    // Loco track header
    const header = document.createElement('div');
    header.className = 'status-row';
    const hlbl = document.createElement('span');
    hlbl.className = 'status-label';
    hlbl.textContent = `Loco on ${st.locoTrack}`;
    header.appendChild(hlbl);
    statusLineEl.appendChild(header);

    statusLineEl.appendChild(makeStatusRow('Coupled:', st.coupled));
    statusLineEl.appendChild(makeStatusRow('On siding:', st.sidings[st.locoTrack]));
  }

  function showVictory() {
    victoryMovesEl.textContent = LANG.completedIn.replace('{n}', GameState.state.moves);
    victoryEl.classList.remove('hidden');
  }

  function hideVictory() {
    victoryEl.classList.add('hidden');
  }

  function showError(message) {
    errorToastEl.textContent = message;
    errorToastEl.classList.remove('hidden');
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorToastEl.classList.add('hidden');
    }, 1500);
  }

  function retryGame() {
    hideVictory();
    GameState.retry();
    Entities.positionAllEntities();
    updateMoves();
    updateStatus();
    if (Interaction.updateMoveButtons) Interaction.updateMoveButtons();
  }

  function resetGame() {
    hideVictory();
    GameState.init();
    Entities.positionAllEntities();
    renderTarget();
    updateMoves();
    updateStatus();
    if (Interaction.updateMoveButtons) Interaction.updateMoveButtons();
  }

  return { init, renderTarget, updateMoves, updateStatus, showVictory, hideVictory, showError, retryGame, resetGame };
})();
