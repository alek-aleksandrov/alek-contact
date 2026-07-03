(function () {
  const keyMap = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      if (window.goStart) { window.goStart(); hideOverlays(); }
      return;
    }
    const dir = keyMap[e.code];
    if (dir && window.goInput) {
      e.preventDefault();
      window.goInput(dir);
    }
  });

  // Touch swipe on the canvas.
  const canvas = document.getElementById("game");
  let sx = 0, sy = 0;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    sx = t.clientX; sy = t.clientY;
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return; // tap, not swipe
    let dir;
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
    else dir = dy > 0 ? "down" : "up";
    if (window.goInput) window.goInput(dir);
  }, { passive: true });

  function hideOverlays() {
    document.getElementById("overlay").classList.add("hidden");
    const go = document.getElementById("gameover");
    if (go) go.classList.add("hidden");
  }
  window.hideOverlays = hideOverlays;

  document.getElementById("startBtn").addEventListener("click", () => {
    if (window.goStart) { window.goStart(); hideOverlays(); }
  });
})();
