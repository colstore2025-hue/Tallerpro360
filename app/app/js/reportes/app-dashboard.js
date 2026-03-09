// app-dashboard.js
// Dashboard global de TallerPRO360 PWA
// Superadmin / CEO view

import { db, auth } from "./firebase-config.js";
import { collection, doc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let empresas = [];
let ordenes = [];
let empleados = [];
let inventario = [];

// ================= AUTH =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = "login.html";
    return;
  }

  const docSnap = await getDocs(collection(db, "usuariosGlobal"));
  const superadmin = docSnap.docs.find(d => d.id === user.uid && d.data().rolGlobal === "superadmin");

  if (!superadmin) {
    alert("No tienes acceso superadmin");
    window.location = "login.html";
    return;
  }

  initDashboard();
});

// ================= INIT DASHBOARD =================
async function initDashboard() {
  await cargarDatos();
  renderKPIs();
  renderCharts();
  renderTalleresTabla();
  renderMapa();
}

// ================= CARGAR DATOS =================
async function cargarDatos() {
  // Cargar todas las empresas
  const empresasSnap = await getDocs(collection(db, "empresas"));
  empresas = empresasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Cargar todas las ordenes
  const ordenesSnap = await getDocs(collection(db, "ordenes"));
  ordenes = ordenesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Cargar todos los empleados
  const empleadosSnap = await getDocs(collection(db, "empleados"));
  empleados = empleadosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Cargar inventario
  const inventarioSnap = await getDocs(collection(db, "inventario"));
  inventario = inventarioSnap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ================= KPIs =================
function renderKPIs() {
  const totalTalleres = empresas.length;
  const totalUsuarios = empleados.length;
  const totalOrdenes = ordenes.length;
  const totalRepuestos = inventario.length;

  document.getElementById("kpiTalleres").innerText = totalTalleres;
  document.getElementById("kpiUsuarios").innerText = totalUsuarios;
  document.getElementById("kpiOrdenes").innerText = totalOrdenes;
  document.getElementById("kpiRepuestos").innerText = totalRepuestos;
}

// ================= CHARTS =================
function renderCharts() {
  // Talleres por ciudad
  const ciudades = {};
  empresas.forEach(e => {
    ciudades[e.ciudad] = (ciudades[e.ciudad] || 0) + 1;
  });

  const ctx = document.getElementById("chartCiudades").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(ciudades),
      datasets: [{
        data: Object.values(ciudades),
        backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"]
      }]
    },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  // Predicción ingresos por taller
  const ingresos = empresas.map(e => e.metricas?.ordenesMes || 0);
  const ctx2 = document.getElementById("chartIngresos").getContext("2d");
  new Chart(ctx2, {
    type: "bar",
    data: {
      labels: empresas.map(e => e.nombre),
      datasets: [{
        label: "Ingresos mes",
        data: ingresos,
        backgroundColor: "#10b981"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ================= TABLA DE TALLERES =================
function renderTalleresTabla() {
  const tbody = document.getElementById("tablaTalleres");
  tbody.innerHTML = "";

  empresas.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.nombre}</td>
      <td>${e.ciudad || "-"}</td>
      <td>${e.plan?.tipo || "-"}</td>
      <td>${e.estado}</td>
      <td>${e.fechaFin?.toDate ? e.fechaFin.toDate().toLocaleDateString() : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ================= MAPA =================
function renderMapa() {
  const map = L.map("mapa").setView([4.57, -74.29], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

  empresas.forEach(e => {
    if (e.lat && e.lng) {
      L.marker([e.lat, e.lng]).addTo(map)
        .bindPopup(`<b>${e.nombre}</b><br>Plan: ${e.plan?.tipo || "-"}`);
    }
  });
}

// ================= LOGOUT =================
window.logout = () => {
  signOut(auth).then(() => window.location = "login.html");
};