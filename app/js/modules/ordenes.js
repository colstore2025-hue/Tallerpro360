/**
 * ordenes.js
 * 🧾 Gestión de Órdenes TallerPRO360
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// IMPORTACIÓN CORRECTA: Ya no usamos window.db
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function ordenesModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  if (!empresaId) {
    container.innerHTML = `<div style="padding:20px;color:red;">❌ Error: Identificador de empresa no encontrado.</div>`;
    return;
  }

  let items = [];

  // 1. Renderizado Estructural Inmediato
  renderLayout(container);

  // 2. Referencias a elementos del DOM
  const itemsList = document.getElementById("itemsList");
  const listaOrdenes = document.getElementById("listaOrdenes");
  const btnCrear = document.getElementById("crearOrden");
  const btnAdd = document.getElementById("addItem");

  /* ================= FUNCIONES DE RENDER ================= */
  
  function renderLayout(cont) {
    cont.innerHTML = `
      <div style="padding:20px; background:#0a0f1a; color:white; min-height:100vh;">
        <h1 style="color:#00ffff; font-size:24px; margin-bottom:20px;">🧾 Gestión de Órdenes</h1>

        <div style="background:#0f172a; padding:20px; border-radius:12px; border:1px solid #1e293b; margin-bottom:20px;">
          <div style="display:flex; gap:10px; margin-bottom:15px;">
            <input id="cliente" placeholder="Nombre o ID Cliente" style="flex:1; padding:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:6px;"/>
            <input id="vehiculo" placeholder="Placa Vehículo" style="flex:1; padding:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:6px;"/>
          </div>

          <p style="color:#00ffff; font-size:12px; font-weight:bold;">AÑADIR SERVICIO / REPUESTO</p>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
            <input id="nombre" placeholder="Descripción" style="grid-column: span 2; padding:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:6px;"/>
            <input id="cantidad" type="number" placeholder="Cant" style="padding:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:6px;"/>
            <input id="precio" type="number" placeholder="Precio Venta" style="padding:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:6px;"/>
          </div>
          <button id="addItem" style="width:100%; background:#00ffff; color:#000; font-weight:bold; padding:12px; border:none; border-radius:8px; cursor:pointer;">
            ➕ AÑADIR A LA LISTA
          </button>
        </div>

        <div id="itemsList" style="margin-bottom:20px; background:rgba(0,255,255,0.05); border-radius:8px;"></div>

        <button id="crearOrden" style="width:100%; background:#22c55e; color:#000; font-weight:bold; padding:15px; border:none; border-radius:8px; display:none; margin-bottom:30px;">
          🚀 GUARDAR ORDEN DE TRABAJO
        </button>

        <h2 style="color:#facc15; font-size:18px;">📋 Historial Reciente</h2>
        <div id="listaOrdenes"></div>
      </div>
    `;
  }

  function renderItems() {
    if (items.length === 0) {
      itemsList.innerHTML = "";
      btnCrear.style.display = "none";
      return;
    }
    
    btnCrear.style.display = "block";
    itemsList.innerHTML = items.map((i, idx) => `
      <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #1e293b;">
        <span>${i.nombre} (x${i.cantidad})</span>
        <span style="color:#00ffff;">$${(i.precio * i.cantidad).toLocaleString()} 
          <button class="del-btn" data-idx="${idx}" style="background:none; border:none; color:#ff4d4d; margin-left:10px;">✕</button>
        </span>
      </div>
    `).join("");

    // Eventos para borrar
    document.querySelectorAll(".del-btn").forEach(b => {
      b.onclick = () => {
        items.splice(b.dataset.idx, 1);
        renderItems();
      };
    });
  }

  /* ================= LÓGICA DE NEGOCIO ================= */

  btnAdd.onclick = () => {
    const nombre = document.getElementById("nombre").value;
    const cant = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precio").value);

    if (!nombre || cant <= 0) return alert("Completa los datos del item");

    items.push({ nombre, cantidad: cant, precio });
    renderItems();
    
    // Limpiar campos
    document.getElementById("nombre").value = "";
    document.getElementById("cantidad").value = "";
    document.getElementById("precio").value = "";
    hablar("Agregado");
  };

  btnCrear.onclick = async () => {
    const cli = document.getElementById("cliente").value;
    const veh = document.getElementById("vehiculo").value;

    if (!cli || !veh) return alert("Cliente y Vehículo son obligatorios");

    try {
      btnCrear.disabled = true;
      btnCrear.innerText = "⏳ GUARDANDO...";
      
      let total = items.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);

      await addDoc(collection(db, `empresas/${empresaId}/ordenes`), {
        clienteId: cli,
        vehiculoId: veh,
        items,
        total,
        estado: "pendiente",
        creadoEn: serverTimestamp()
      });

      hablar("Orden guardada exitosamente");
      items = [];
      renderItems();
      document.getElementById("cliente").value = "";
      document.getElementById("vehiculo").value = "";
      cargarOrdenes();
      
      btnCrear.disabled = false;
      btnCrear.innerText = "🚀 GUARDAR ORDEN DE TRABAJO";
    } catch (e) {
      console.error(e);
      alert("Error al guardar");
    }
  };

  async function cargarOrdenes() {
    listaOrdenes.innerHTML = `<p style="color:#64748b;">Cargando historial...</p>`;
    try {
      const q = query(collection(db, `empresas/${empresaId}/ordenes`), orderBy("creadoEn", "desc"));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        listaOrdenes.innerHTML = "<p>No hay órdenes registradas.</p>";
        return;
      }

      listaOrdenes.innerHTML = snap.docs.map(d => {
        const o = d.data();
        return `
          <div style="background:#0f172a; padding:15px; border-radius:10px; border-left:4px solid #facc15; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between;">
              <span style="font-weight:bold;">${o.vehiculoId}</span>
              <span style="color:#22c55e;">$${(o.total || 0).toLocaleString()}</span>
            </div>
            <div style="font-size:12px; color:#94a3b8;">Cliente: ${o.clienteId}</div>
          </div>
        `;
      }).join("");
    } catch (e) {
      listaOrdenes.innerHTML = "<p>Error al cargar historial.</p>";
    }
  }

  // Inicializar
  cargarOrdenes();
}
