/* Shared small UI helpers used across pages */

function sqToast(message, type = "default") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const el = document.createElement("div");
  el.className = "toast" + (type === "error" ? " error" : type === "success" ? " success" : "");
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function sqInitials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function sqIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function sqEscape(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", sqIcons);
