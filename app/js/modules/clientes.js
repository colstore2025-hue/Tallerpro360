/**
 * clientes.js
 * CRM PRO360 · Producción NASA 🔥
 * Integración Modo Dios + Guardian IA
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { hablar } from "../voice/voiceCore.js";
import { activarModoDiosGuardian } from "../ai/firestoreGuardianGod.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

/* 🔥 DB GLOBAL */
const db = window.db;

export default async function clientesModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">❌ empresaId no definido</h2>
    `;
    return;
  }

  const base = `empresas/${state.empresaId}`;
  let clientes = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">👥 Clientes PRO360</h1>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre cliente" style="flex:2;padding:10px;border-radius:8px;"/>
      <input id="telefono" placeholder="Teléfono" style="flex:1;padding:10px;border-radius:8px;"/>
      <button id="crearCliente" style="flex:1;background:#22c55e;color:#000;border-radius:8px;">➕ Crear</button>
    </div>

    <input id="busqueda" placeholder="Buscar cliente..." style="width:100%;padding:12px;margin-bottom:15px;border-radius:8px;"/>
    <div id="listaClientes"></div>
    <div id="detalleCliente" style="margin-top:25px;"></div>
    <div id="advisorClientes" style="margin-top:20px;"></div>
  `;

  const lista = document.getElementById("listaClientes");
  const detalle = document.getElementById("detalleCliente");

  // 🔥 Activar Guardian IA para clientes
  activarModoDiosGuardian(state.empresaId);

  // Watcher Firestore para cambios en tiempo real
  onSnapshot(collection(db, `${base}/clientes`), () => cargarClientes());

  /* ================= LOAD ================= */
  async function cargarClientes() {

    lista.innerHTML = "🔄 Cargando clientes...";

    try {

      const snap = await getDocs(collection(db, `${base}/clientes`));

      clientes = snap.docs.map(d => {
        const data = d.data();

        // 🔥 Correcciones automáticas Guardian IA
        const update = {};
        if (!data.estado) update.estado = "activo";

        if (Object.keys(update).length) {
          updateDoc(doc(db, `${base}/clientes`, d.id), update);
        }

        return { id: d.id, ...data, ...update };
      });

      // Ordenar en frontend
      clientes.sort((a, b) => new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0));

      renderClientes(clientes);

      // 🤖 IA Advisor
      try {
        const sugerencias = await generarSugerencias({ clientes, empresaId: state.empresaId });
        renderSugerencias("advisorClientes", sugerencias);
      } catch (e) {
        console.warn("IA Advisor clientes error:", e);
      }

    } catch (e) {
      console.error("🔥 ERROR CLIENTES:", e);
      lista.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando clientes</p>`;
    }
  }

  /* ================= RENDER ================= */
  function renderClientes(data) {
    if (!data.length) {
      lista.innerHTML = `<p style="text-align:center;">📭 Sin clientes</p>`;
      return;
    }

    lista.innerHTML = data.map(c => `
      <div class="clienteItem" data-id="${c.id}" style="
        background:#111827;padding:15px;margin:10px 0;border-radius:12px;
        cursor:pointer;border:1px solid #1f2937;">
        <strong>👤 ${c.nombre || "Sin nombre"}</strong><br/>
        <span style="color:#94a3b8;">📞 ${c.telefono || "-"}</span>
      </div>
    `).join("");

    document.querySelectorAll(".clienteItem").forEach(el => {
      el.onclick = () => verCliente(el.dataset.id);
    });
  }

  /* ================= BUSCAR ================= */
  document.getElementById("busqueda").oninput = e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = clientes.filter(c => (c.nombre || "").toLowerCase().includes(texto));
    renderClientes(filtrados);
  };

  /* ================= CREAR ================= */
  document.getElementById("crearCliente").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre) { alert("Nombre obligatorio"); return; }

    try {
      await addDoc(collection(db, `${base}/clientes`), {
        nombre, telefono, estado: "activo", creadoEn: new Date()
      });

      hablar("Cliente creado");
      ["nombre","telefono"].forEach(id => document.getElementById(id).value = "");
      cargarClientes();

    } catch (e) { console.error(e); alert("Error creando cliente"); }
  };

  /* ================= DETALLE ================= */
  async function verCliente(clienteId) {

    detalle.innerHTML = "🔄 Cargando cliente...";

    try {

      // 🚗 Vehículos
      const vehiculosSnap = await getDocs(
        query(collection(db, `${base}/vehiculos`), where("clienteId", "==", clienteId))
      );

      let vehiculosHTML = "<h3>🚗 Vehículos</h3>";
      vehiculosSnap.forEach(doc => {
        const v = doc.data();
        vehiculosHTML += `
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span>${v.marca || ""} ${v.modelo || ""} (${v.placa || ""})</span>
            <button class="crearOrdenBtn" style="background:#00ffff;border:none;border-radius:6px;padding:5px 10px;">🧾 Orden</button>
          </div>
        `;
      });

      // 🧾 Órdenes
      const ordenesSnap = await getDocs(
        query(collection(db, `${base}/ordenes`), where("clienteId", "==", clienteId))
      );

      let ordenes = ordenesSnap.docs.map(d => d.data());
      ordenes.sort((a,b)=>new Date(b.creadoEn||0)-new Date(a.creadoEn||0));

      let ordenesHTML = "<h3>🧾 Órdenes</h3>";
      ordenes.forEach(o=>{
        const color = o.estado==="abierta"?"#00ffff":o.estado==="cerrada"?"#22c55e":"#ef4444";
        ordenesHTML += `<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${color}">${o.numero||"ORD"} - $${fmt(o.total)}</div>`;
      });

      // 💬 Feedback
      const feedbackSnap = await getDocs(
        query(collection(db, `${base}/feedback`), where("clienteId", "==", clienteId))
      );

      let feedbackHTML = "<h3>💬 Feedback</h3>";
      feedbackSnap.forEach(doc=>{
        const f = doc.data();
        let fecha = "";
        try { fecha = f.fecha?.toDate ? f.fecha.toDate().toLocaleString() : ""; } catch {}
        feedbackHTML += `<div style="margin-bottom:6px;padding:8px;background:#111827;border-radius:8px;">${f.mensaje||""}<br/><small style="color:#94a3b8;">${fecha}</small></div>`;
      });

      detalle.innerHTML = `<div style="background:#0f172a;padding:20px;border-radius:16px;">${vehiculosHTML}${ordenesHTML}${feedbackHTML}</div>`;

      // 🔥 Botón crear orden
      document.querySelectorAll(".crearOrdenBtn").forEach(btn=>{
        btn.onclick = ()=>window.loadModule ? window.loadModule("ordenes") : console.error("loadModule no está en window");
      });

    } catch(e) { console.error("🔥 ERROR DETALLE:", e); detalle.innerHTML = `<p style="color:red;text-align:center;">❌ Error cargando cliente</p>`; }
  }

  /* ================= UTILS ================= */
  function fmt(v){ return new Intl.NumberFormat("es-CO").format(v||0); }

  /* INIT */
  cargarClientes();
}