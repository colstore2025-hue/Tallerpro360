/**
 * bootDiagnostic.js
 * Diagnóstico de arranque
 */

export function bootStatus(message){

let panel = document.getElementById("bootStatus");

if(!panel){

panel=document.createElement("div");

panel.id="bootStatus";

panel.style.position="fixed";
panel.style.bottom="10px";
panel.style.right="10px";
panel.style.background="#020617";
panel.style.padding="10px";
panel.style.border="1px solid #1e293b";
panel.style.borderRadius="8px";
panel.style.fontSize="12px";
panel.style.zIndex="9999";

document.body.appendChild(panel);

}

panel.innerHTML += `<div>✔ ${message}</div>`;

}