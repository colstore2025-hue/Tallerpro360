/*

DASHBOARD.JS - Versión Final Integrada de Última Generación Dashboard Gerencial ERP - TallerPRO360

*/

import { db } from "../core/firebase-config.js"; import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; import CustomerManager from "./customerManager.js"; import { actualizarStock } from "./inventario.js";

export async function dashboard(container, userId) { container.innerHTML = `

<h1 style="font-size:28px;margin-bottom:20px">📊 Dashboard Gerencial - TallerPRO360</h1><div style="display:flex;flex-wrap:wrap;gap:15px;margin-bottom:20px">
  <div class="card" style="flex:1 1 200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Órdenes del día: <span id="ordenesDia">0</span>
  </div>
  <div class="card" style="flex:1 1 200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Ingresos del día: $<span id="ingresosDia">0</span>
  </div>
  <div class="card" style="flex:1 1 200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Clientes activos: <span id="clientesActivos">0</span>
  </div>
  <div class="card" style="flex:1 1 200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Técnicos disponibles: <span id="tecnicosActivos">0</span>
  </div>
  <div class="card" style="flex:1 1 200px;background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Stock bajo: <span id="stockBajo">0</span>
  </div>
</div><div style="display:flex;flex-wrap:wrap;gap:20px">
  <canvas id="graficoOrdenes" style="flex:1 1 500px;background:#020617;border-radius:10px;padding:20px;"></canvas>
  <canvas id="graficoIngresos" style="flex:1 1 500px;background:#020617;border-radius:10px;padding:20px;"></canvas>
</div><div class="card" style="margin-top:20px;">
  <h3>Alertas y Recomendaciones IA</h3>
  <div id="alertasIA" style="background:#111827;color:white;padding:10px;border-radius:6px;max-height:150px;overflow-y:auto">Cargando alertas...</div>
  <button id="vozAlertas" style="margin-top:10px;padding:8px 15px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🔊 Leer alertas</button>
</div>
`;document.getElementById("vozAlertas").onclick = leerAlertasVoz;

// Cargar datos iniciales await actualizarDashboard(); }

let alertasCache = "";

async function actualizarDashboard() { const ordenesSnap = await getDocs(collection(db, "ordenes")); const clientesSnap = await getDocs(collection(db, "clientes")); const inventarioSnap = await getDocs(collection(db, "inventario"));

const hoy = new Date().toDateString(); let ordenesDia = 0; let ingresosDia = 0; let clientesActivos = clientesSnap.size; let stockBajo = 0;

const tecnicoContador = {};

ordenesSnap.forEach(doc => { const o = doc.data(); const fechaOrden = o.fecha.toDate().toDateString(); if (fechaOrden === hoy) { ordenesDia++; ingresosDia += Number(o.total) || 0; const tecnico = o.tecnico || "Sin asignar"; tecnicoContador[tecnico] = (tecnicoContador[tecnico] || 0) + 1; } });

inventarioSnap.forEach(doc => { const item = doc.data(); if (Number(item.stock) <= 5) stockBajo++; });

document.getElementById("ordenesDia").innerText = ordenesDia; document.getElementById("ingresosDia").innerText = ingresosDia.toLocaleString(); document.getElementById("clientesActivos").innerText = clientesActivos; document.getElementById("tecnicosActivos").innerText = Object.keys(tecnicoContador).length; document.getElementById("stockBajo").innerText = stockBajo;

generarGraficos(ordenesSnap, ingresosDia); generarAlertasIA({ordenesDia, ingresosDia, stockBajo, tecnicoContador}); }

function generarGraficos(ordenesSnap, ingresosDia) { if (!window.Chart) return;

const ordenesPorTecnico = {}; ordenesSnap.forEach(doc => { const o = doc.data(); const tecnico = o.tecnico || "Sin asignar"; ordenesPorTecnico[tecnico] = (ordenesPorTecnico[tecnico] || 0) + 1; });

const ctxOrdenes = document.getElementById('graficoOrdenes').getContext('2d'); new Chart(ctxOrdenes, { type: 'bar', data: { labels: Object.keys(ordenesPorTecnico), datasets: [{ label: 'Órdenes por Técnico', data: Object.values(ordenesPorTecnico), backgroundColor: '#6366f1' }] }, options: { responsive:true, plugins:{ legend:{ display:false } } } });

const ctxIngresos = document.getElementById('graficoIngresos').getContext('2d'); new Chart(ctxIngresos, { type: 'line', data: { labels: ['Hoy'], datasets: [{ label: 'Ingresos del Día', data: [ingresosDia], backgroundColor: '#16a34a', borderColor:'#16a34a', fill:false }] }, options: { responsive:true, plugins:{ legend:{ display:true } } } }); }

async function generarAlertasIA(datos) { if(!window.SuperAI){ alertasCache = "SuperAI no disponible"; document.getElementById('alertasIA').innerHTML = alertasCache; return; } try { const alertas = await window.SuperAI.analyzeDashboard(datos); alertasCache = alertas.join('. '); document.getElementById('alertasIA').innerHTML = alertas.map(a=><p>⚠️ ${a}</p>).join(''); }catch(e){ console.error('Error alertas IA:',e); alertasCache = 'Error generando alertas'; document.getElementById('alertasIA').innerHTML = '❌ Error generando alertas'; } }

function leerAlertasVoz(){ if(!alertasCache){ hablar('No hay alertas generadas aún'); }else{ hablar(alertasCache); } }

function hablar(texto){ if(!texto) return; const speech = new SpeechSynthesisUtterance(texto); speech.lang = 'es-ES'; speech.rate = 1; speech.pitch = 1; speech.volume = 1; window.speechSynthesis.speak(speech); }