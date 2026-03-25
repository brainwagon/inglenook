/* ── Main Entry Point ── */

(function () {
  const { scene, camera, renderer } = SceneManager.init();

  // Initialize game state
  GameState.init();

  // Create track visuals and entities
  Entities.init(scene);

  // Set up HUD
  HUD.init();

  // Set up interaction
  Interaction.init(camera, renderer);

  // Render loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);
    Animation.update(delta);
    SceneManager.render(delta);
  }
  animate();
})();
