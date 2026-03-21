/**
 * bootDiagnostic.js
 * Diagnóstico de arranque visual
 */

export function bootStatus(message) {
  let panel = document.getElementById("bootStatus");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "bootStatus";

    panel.style.position = "fixed";
    panel.style.bottom = "10px";
    panel.style.right = "10px";
    panel.style.background = "#020617";
    panel.style.padding = "10px 14px";
    panel.style.border = "1px solid #1e293b";
    panel.style.borderRadius = "8px";
    panel.style.fontSize = "12px";
    panel.style.color = "#00ffff";
    panel.style.fontFamily = "Segoe UI, sans-serif";
    panel.style.zIndex = "9999";
    panel.style.boxShadow = "0 0 10px #00ffff33";

    document.body.appendChild(panel);
  }

  const div = document.createElement("div");
  div.innerHTML = `✔ ${message}`;
  panel.appendChild(div);
}