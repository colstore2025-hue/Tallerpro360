/**
 * clientes.js
 * 👥 CRM PRO360 · Edición Estabilizada V3
 */

import { 
  collection, getDocs, addDoc, query, where, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ IMPORTACIÓN MODULAR (Adiós window.db)
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  let clientes = [];

  if (!empresaId) {
    container.innerHTML = `<div style="padding:20px;color:red;">❌ Error: ID de empresa no detectado.</div>`;
    return;
  }

  /* ================= RENDER ESTRUCTURA ================= */
  container.innerHTML = `
    <div style="padding:20px; background:#0a0f1a; color:white; min-height:100vh; font-family:sans-serif;">
      <h1 style="color:#00ffff; font-size:28px; font-weight:900; margin-bottom:20px;">👥 Clientes</h1>

      <div style="background:#0f172a; padding:15px; border-radius:12px; border:1px solid #1e293b; margin-bottom:20px;">
        <input id="nombreCli" placeholder="Nombre completo" style="width:100%; padding:12px; margin-bottom:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:8px;"/>
        <input id="telCli" type="tel" placeholder="Teléfono" style="width:100%; padding:12px; margin-bottom:10px; background:#050a14; border:1px solid #1e293b; color:white; border-radius:8px;"/>
        <button id="btnCrear" style="width:100%; background:#22c55e; color:#000; font-weight:bold; padding:12px; border:none; border-radius:8px;">➕ REGISTRAR CLIENTE</button>
      </div>

      <input id="busqueda" placeholder="🔍 Buscar cliente..." 
        style="width:100%; padding:12px; margin-bottom:15px; background:#0f172a; border:1px solid #00ffff44; color:white; border-radius:8px;"/>
      
      <div id="listaClientes"></div>
      <div id="detalleCliente" style="margin-top:25px;"></div>
    </div>
  `;

  const listaContainer = document.getElementById("listaClientes");
  const detalleContainer = document.getElementById("detalleCliente");

  /* ================= LÓGICA DE DATOS ================= */

  async function cargarClientes() {
    listaContainer.innerHTML = "<p style='color:#64748b;'>Cargando base de datos...</p>";
    try {
      // Nota: Si esto falla, recuerda crear el índice en Firestore
      const q = query(collection(db, `empresas/${empresaId}/clientes`), orderBy("creadoEn", "desc"));
      const snap = await getDocs(q);
      clientes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderLista(clientes);
    } catch(e) {
      console.error(e);
      listaContainer.innerHTML = "❌ Error al conectar con Firestore.";
    }
  }

  function renderLista(data) {
    if (!data.length) {
      listaContainer.innerHTML = "<p style='text-align:center; color:#64748b;'>No hay clientes registrados.</p>";
      return;
    }

    listaContainer.innerHTML = data.map(c => `
      <div class="cli-card" data-id="${c.id}" style="background:#111827; padding:15px; margin-bottom:10px; border-radius:10px; border-left:4px solid #00ffff; cursor:pointer;">
        <div style="font-weight:bold; color:#fff;">${c.nombre || "Sin Nombre"}</div>
        <div style="font-size:13px; color:#94a3b8;">📞 ${c.telefono || "Sin teléfono"}</div>
      </div>
    `).join("");

    document.querySelectorAll(".cli-card").forEach(card => {
      card.onclick = () => verDetalle(card.dataset.id);
    });
  }

  /* ================= ACCIONES ================= */

  document.getElementById("busqueda").oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = clientes.filter(c => c.nombre?.toLowerCase().includes(term));
    renderLista(filtrados);
  };

  document.getElementById("btnCrear").onclick = async () => {
    const nombre = document.getElementById("nombreCli").value.trim();
    const telefono = document.getElementById("telCli").value.trim();

    if (!nombre) return alert("El nombre es obligatorio");

    try {
      await addDoc(collection(db, `empresas/${empresaId}/clientes`), {
        nombre,
        telefono,
        creadoEn: serverTimestamp()
      });
      hablar("Cliente guardado");
      document.getElementById("nombreCli").value = "";
      document.getElementById("telCli").value = "";
      cargarClientes();
    } catch(e) {
      alert("Error al guardar");
    }
  };

  async function verDetalle(id) {
    detalleContainer.innerHTML = "<div style='padding:20px; background:#0f172a; border-radius:12px;'>⌛ Cargando historial...</div>";
    
    try {
      // Buscamos vehículos asociados
      const vSnap = await getDocs(query(collection(db, `empresas/${empresaId}/vehiculos`), where("clienteId", "==", id)));
      
      let htmlVeh = "<h3 style='color:#facc15; font-size:16px;'>🚗 Vehículos</h3>";
      if (vSnap.empty) htmlVeh += "<p style='font-size:12px; color:#64748b;'>No tiene vehículos registrados.</p>";
      
      vSnap.forEach(doc => {
        const v = doc.data();
        htmlVeh += `<div style="background:#050a14; padding:8px; margin-bottom:5px; border-radius:5px; font-size:13px;">
          ${v.placa} - ${v.marca} ${v.modelo}
        </div>`;
      });

      detalleContainer.innerHTML = `
        <div style="background:#0f172a; padding:20px; border-radius:12px; border:1px solid #00ffff44;">
          ${htmlVeh}
          <button onclick="location.reload()" style="margin-top:15px; width:100%; background:none; border:1px solid #94a3b8; color:#94a3b8; padding:8px; border-radius:6px; font-size:12px;">CERRAR DETALLE</button>
        </div>
      `;
      hablar("Mostrando perfil del cliente");
    } catch(e) {
      detalleContainer.innerHTML = "❌ Error al cargar detalle.";
    }
  }

  // Inicialización
  cargarClientes();
}
