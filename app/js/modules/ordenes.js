/**
 * ordenes.js
 * Órdenes Inteligentes PRO360 · Producción estable (Modo NASA 🚀)
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

  /* ================= VALIDACIÓN ================= */
  if (!state?.empresaId) {
    container.innerHTML = `<h2 style="color:red;text-align:center;">❌ Empresa no definida</h2>`;
    return;
  }

  let items = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;">🧾 Órdenes PRO360</h1>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input id="cliente" placeholder="ID Cliente" style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="vehiculo" placeholder="Placa" style="flex:1;padding:10px;border-radius:8px;"/>
    </div>

    <h3>Agregar Item</h3>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
      <select id="tipo" style="flex:1;padding:8px;border-radius:6px;">
        <option value="inventario">Inventario</option>
        <option value="compra">Compra</option>
      </select>
      <input id="nombre" placeholder="Nombre" style="flex:2;padding:8px;border-radius:6px;"/>
      <input id="cantidad" type="number" placeholder="Cantidad" style="flex:1;padding:8px;border-radius:6px;"/>
      <input id="precio" type="number" placeholder="Precio" style="flex:1;padding:8px;border-radius:6px;"/>
      <input id="costo" type="number" placeholder="Costo" style="flex:1;padding:8px;border-radius:6px;"/>
      <button id="addItem" style="flex:1;background:#22c55e;color:#000;border-radius:6px;">➕</button>
    </div>

    <div id="itemsList" style="margin-bottom:20px;"></div>
    <div id="advisorOrdenes" style="margin-bottom:20px;"></div>

    <button id="crearOrden" style="padding:10px 20px;background:#00ffff;border:none;border-radius:8px;font-weight:bold;">
      🚀 Crear Orden
    </button>

    <hr/>
    <h2 style="margin-top:20px;">📋 Órdenes existentes</h2>
    <div id="listaOrdenes"></div>
  `;

  const itemsList = document.getElementById("itemsList");
  const listaOrdenes = document.getElementById("listaOrdenes");

  /* ================= ITEMS ================= */
  function renderItems() {
    itemsList.innerHTML = items.map((i, idx) => `
      <div style="display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #222;">
        <span>${i.nombre} x${i.cantidad} → $${fmt(i.precio)}</span>
        <button data-idx="${idx}" class="delItem" style="background:#ef4444;color:#fff;border:none;border-radius:6px;">❌</button>
      </div>
    `).join("");

    document.querySelectorAll(".delItem").forEach(btn=>{
      btn.onclick = ()=>{
        items.splice(btn.dataset.idx,1);
        renderItems();
      };
    });
  }

  document.getElementById("addItem").onclick = () => {
    const item = {
      tipo: document.getElementById("tipo").value,
      nombre: document.getElementById("nombre").value.trim(),
      cantidad: Number(document.getElementById("cantidad").value),
      precio: Number(document.getElementById("precio").value),
      costo: Number(document.getElementById("costo").value)
    };

    if (!item.nombre || item.cantidad <= 0) return alert("Datos inválidos");

    items.push(item);
    renderItems();
  };

  /* ================= CREAR ORDEN ================= */
  document.getElementById("crearOrden").onclick = async () => {
    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if (!clienteId || !vehiculoId || items.length === 0) {
      return alert("Completa todos los campos e items");
    }

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
      estado: "pendiente_aprobacion",
      editable: true,
      creadoEn: new Date()
    };

    await addDoc(collection(db, `empresas/${state.empresaId}/ordenes`), orden);

    hablar("Orden creada, pendiente de aprobación");

    items = [];
    renderItems();
    cargarOrdenes();
  };

  /* ================= LISTAR ORDENES ================= */
  async function cargarOrdenes() {
    const snap = await getDocs(
      query(collection(db, `empresas/${state.empresaId}/ordenes`), orderBy("creadoEn","desc"))
    );

    listaOrdenes.innerHTML = snap.docs.map(d => {
      const o = d.data();
      const id = d.id;

      return `
        <div style="border:1px solid #333;padding:10px;margin:10px;border-radius:12px;">
          <strong>${id}</strong><br/>
          Estado: ${o.estado} <br/>
          Total: $${fmt(o.total)}
          ${renderAprobacion(id, o)}
        </div>
      `;
    }).join("");
  }

  /* ================= APROBACIÓN ================= */
  function renderAprobacion(id, o) {
    if (o.estado !== "pendiente_aprobacion") return "";

    return `
      <button class="aprobarBtn" data-id="${id}" style="margin-right:6px;background:#22c55e;color:#fff;border:none;border-radius:6px;">✅ Aprobar</button>
      <button class="rechazarBtn" data-id="${id}" style="background:#ef4444;color:#fff;border:none;border-radius:6px;">❌ Rechazar</button>
    `;
  }

  /* ================= EVENTOS GLOBALES ================= */
  listaOrdenes.addEventListener("click", async (e)=>{
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("aprobarBtn")) {
      await updateDoc(doc(db, `empresas/${state.empresaId}/ordenes`, id), {
        estado: "aprobada",
        editable: false,
        aprobadaPor: state.uid
      });
      hablar("Orden aprobada");
      cargarOrdenes();
    }

    if (e.target.classList.contains("rechazarBtn")) {
      await updateDoc(doc(db, `empresas/${state.empresaId}/ordenes`, id), {
        estado: "rechazada",
        editable: true
      });
      hablar("Orden rechazada");
      cargarOrdenes();
    }
  });

  /* ================= UTILS ================= */
  function fmt(v) {
    return new Intl.NumberFormat("es-CO").format(v || 0);
  }

  /* ================= INIT ================= */
  renderItems();
  cargarOrdenes();
}