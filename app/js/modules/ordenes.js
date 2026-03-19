/**
 * ordenes.js
 * Órdenes Inteligentes PRO360 · MODO DIOS GUARDIAN
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.db;

import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { aprenderDeOrden } from "../ai/aiLearningEngine.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";
import { usarRepuesto } from "../services/inventarioService.js";

export default async function ordenesModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `❌ Empresa no definida`;
    return;
  }

  let items = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;">🧾 Órdenes PRO360</h1>

    <input id="cliente" placeholder="ID Cliente"/>
    <input id="vehiculo" placeholder="Placa"/>

    <h3>Agregar Item</h3>

    <select id="tipo">
      <option value="inventario">Inventario</option>
      <option value="compra">Compra</option>
    </select>

    <input id="nombre" placeholder="Nombre"/>
    <input id="cantidad" type="number" placeholder="Cantidad"/>
    <input id="precio" type="number" placeholder="Precio"/>
    <input id="costo" type="number" placeholder="Costo"/>

    <button id="addItem">➕</button>

    <div id="itemsList"></div>
    <div id="advisorOrdenes"></div>

    <button id="crearOrden">🚀 Crear Orden</button>

    <hr/>
    <h2>📋 Órdenes existentes</h2>
    <div id="listaOrdenes"></div>
  `;

  const itemsList = document.getElementById("itemsList");
  const listaOrdenes = document.getElementById("listaOrdenes");

  /* ================= ITEMS ================= */

  function renderItems() {
    itemsList.innerHTML = items.map((i, index) => `
      <div>
        ${i.nombre} x${i.cantidad} → $${fmt(i.precio)}
        <button data-index="${index}" class="del">❌</button>
      </div>
    `).join("");

    document.querySelectorAll(".del").forEach(btn=>{
      btn.onclick = ()=>{
        items.splice(btn.dataset.index,1);
        renderItems();
      }
    });
  }

  document.getElementById("addItem").onclick = () => {

    const item = {
      tipo: document.getElementById("tipo").value,
      nombre: document.getElementById("nombre").value,
      cantidad: Number(document.getElementById("cantidad").value),
      precio: Number(document.getElementById("precio").value),
      costo: Number(document.getElementById("costo").value)
    };

    if (!item.nombre || item.cantidad <= 0) return alert("Datos inválidos");

    items.push(item);
    renderItems();
  };

  /* ================= CREAR ================= */

  document.getElementById("crearOrden").onclick = async () => {

    const clienteId = document.getElementById("cliente").value;
    const vehiculoId = document.getElementById("vehiculo").value;

    let total = 0;
    let costoTotal = 0;

    for (let item of items) {

      if (item.tipo === "inventario") {
        await usarRepuesto({
          repuestoId: item.nombre,
          cantidad: item.cantidad,
          empresaId: state.empresaId
        });
      }

      total += item.precio * item.cantidad;
      costoTotal += item.costo * item.cantidad;
    }

    const orden = {
      empresaId: state.empresaId,
      clienteId,
      vehiculoId,
      items,
      total,
      costoTotal,
      utilidad: total - costoTotal,

      estado: "pendiente_aprobacion", // 🔥 CLAVE
      editable: true,

      creadoEn: new Date()
    };

    const ref = await addDoc(
      collection(db, `empresas/${state.empresaId}/ordenes`),
      orden
    );

    hablar("Orden creada, pendiente de aprobación");

    items = [];
    renderItems();

    cargarOrdenes();
  };

  /* ================= LISTAR ORDENES ================= */

  async function cargarOrdenes() {

    const snap = await getDocs(
      query(
        collection(db, `empresas/${state.empresaId}/ordenes`),
        orderBy("creadoEn", "desc")
      )
    );

    listaOrdenes.innerHTML = snap.docs.map(d => {

      const o = d.data();
      const id = d.id;

      return `
        <div style="border:1px solid #333;padding:10px;margin:10px;">
          <strong>${id}</strong><br/>
          Estado: ${o.estado} <br/>
          Total: $${fmt(o.total)}

          ${renderAprobacion(id, o)}
        </div>
      `;
    }).join("");
  }

  /* ================= APROBACION ================= */

  function renderAprobacion(id, o) {

    if (o.estado !== "pendiente_aprobacion") return "";

    return `
      <button onclick="aprobarOrden('${id}')">✅ Aprobar</button>
      <button onclick="rechazarOrden('${id}')">❌ Rechazar</button>
    `;
  }

  /* ================= GLOBAL ACTIONS ================= */

  window.aprobarOrden = async function(id) {

    await updateDoc(
      doc(db, `empresas/${state.empresaId}/ordenes`, id),
      {
        estado: "aprobada",
        editable: false,
        aprobadaPor: state.uid
      }
    );

    hablar("Orden aprobada");
    cargarOrdenes();
  };

  window.rechazarOrden = async function(id) {

    await updateDoc(
      doc(db, `empresas/${state.empresaId}/ordenes`, id),
      {
        estado: "rechazada",
        editable: true
      }
    );

    hablar("Orden rechazada");
    cargarOrdenes();
  };

  /* ================= UTILS ================= */

  function fmt(v){
    return new Intl.NumberFormat("es-CO").format(v || 0);
  }

  /* INIT */
  renderItems();
  cargarOrdenes();
}