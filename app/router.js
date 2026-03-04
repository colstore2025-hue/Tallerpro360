import { dashboard } from "./modules/dashboard.js";
import { clientes } from "./modules/clientes.js";
import { ordenes } from "./modules/ordenes.js";
import { inventario } from "./modules/inventario.js";
import { finanzas } from "./modules/finanzas.js";
import { ceo } from "./modules/ceo.js";
import { pagos } from "./modules/pagos.js";

export function buildMenu() {
  const menu = document.getElementById("menu");

  const sections = [
    { name: "Dashboard", id: "dashboard" },
    { name: "Clientes", id: "clientes" },
    { name: "Órdenes", id: "ordenes" },
    { name: "Inventario", id: "inventario" },
    { name: "Finanzas", id: "finanzas" },
    { name: "CEO", id: "ceo" },
    { name: "Pagos", id: "pagos" }
  ];

  sections.forEach(sec => {
    const btn = document.createElement("button");
    btn.innerText = sec.name;
    btn.className = "text-left p-2 rounded hover:bg-gray-700";
    btn.onclick = () => loadSection(sec.id);
    menu.appendChild(btn);
  });
}

export function initRouter() {
  loadSection("dashboard");
}

function loadSection(section) {
  const container = document.getElementById("appContent");

  switch(section) {
    case "dashboard": dashboard(container); break;
    case "clientes": clientes(container); break;
    case "ordenes": ordenes(container); break;
    case "inventario": inventario(container); break;
    case "finanzas": finanzas(container); break;
    case "ceo": ceo(container); break;
    case "pagos": pagos(container); break;
  }
}