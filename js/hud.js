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

  function updateStatus() {
    const st = GameState.state;
    const locoInfo = `Loco on ${st.locoTrack}`;
    const coupledInfo = st.coupled.length > 0
      ? ` | Coupled: ${st.coupled.join(', ')}`
      : '';
    const sidingInfo = st.sidings[st.locoTrack].length > 0
      ? ` | Cars here: ${st.sidings[st.locoTrack].join(', ')}`
      : '';
    statusLineEl.textContent = locoInfo + coupledInfo + sidingInfo;
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

  function resetGame() {
    hideVictory();
    GameState.init();
    Entities.positionAllEntities();
    renderTarget();
    updateMoves();
    updateStatus();
    if (Interaction.updateMoveButtons) Interaction.updateMoveButtons();
  }

  return { init, renderTarget, updateMoves, updateStatus, showVictory, hideVictory, showError, resetGame };
})();
