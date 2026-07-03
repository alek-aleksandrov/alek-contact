const TOAST_ICONS = {
  application: "📄",
  rejection: "📧",
  ghost: "👻",
  takehome: "📚",
  spam: "📨",
};

function showToast(kind, message) {
  const wrap = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast toast-" + kind;
  el.innerHTML =
    '<span class="toast-icon">' + (TOAST_ICONS[kind] || "🔔") + "</span>" +
    '<span class="toast-msg"></span>';
  el.querySelector(".toast-msg").textContent = message;
  wrap.appendChild(el);
  // Trigger enter animation, then auto-dismiss.
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

// Called from Go.
window.onGameEvent = (kind, message) => showToast(kind, message);
window.onScoreChange = (score) => {
  document.getElementById("score").textContent = score;
};
