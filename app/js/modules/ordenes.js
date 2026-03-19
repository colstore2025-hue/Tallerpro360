/**
 * ordenes.js
 * Órdenes Inteligentes PRO360 · Producción
 */

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 🔥 IMPORTANTE: UNIFICAMOS DB GLOBAL */
const db = window.db;

/* IA + VOZ + SERVICES */
import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { aprenderDeOrden } from "../ai/aiLearningEngine.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";
import { usarRepuesto } from "../services/inventarioService.js";

/* ================= MODULE ================= */

export default async function ordenesModule(container, state) {

  let items = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">
      🧾 Órdenes PRO360
    </h1>

    <!-- CLIENTE -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
      <input id="cliente" placeholder="ID Cliente"
        style="flex:1;padding:10px;border-radius:8px;"/>
      <input id="vehiculo" placeholder="Placa"
        style="flex:1;padding:10px;border-radius:8px;"/>
    </div>

    <!-- ITEMS -->
    <h3 style="color:#00ffff;">Agregar Repuesto</h3>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
      <select id="tipo" style="flex:1;padding:10px;border-radius:8px;">
        <option value="inventario">Inventario</option>
        <option value="compra">Compra directa</option>
        <option value="cliente">Cliente trae</option>
      </select>

      <input id="nombre" placeholder="Nombre"
        style="flex:2;padding:10px;border-radius:8px;"/>

      <input id="cantidad" type="number" placeholder="Cantidad"
        style="flex:1;padding:10px;border-radius:8px;"/>

      <input id="precio" type="number" placeholder="Precio"
        style="flex:1;padding:10px;border-radius:8px;"/>

      <input id="costo" type="number" placeholder="Costo"
        style="flex:1;padding:10px;border-radius:8px;"/>

      <button id="addItem"
        style="flex:1;background:#00ffff;color:#000;font-weight:bold;border-radius:8px;">
        ➕
      </button>
    </div>

    <div id="itemsList"></div>
    <div id="advisorOrdenes" style="margin-top:20px;"></div>

    <!-- ACTIONS -->
    <div style="display:flex;gap:10px;margin-top:25px;flex-wrap:wrap;">
      <button id="crearOrden"
        style="flex:1;background:#22c55e;color:#000;">
        🚀 Crear Orden
      </button>

      <button id="crearConIA"
        style="flex:1;background:#00ffff;color:#000;">
        🤖 IA
      </button>

      <button id="vozBtn"
        style="flex:1;background:#f0f;color:#000;">
        🎤 Voz
      </button>
    </div>
  `;

  const itemsList = document.getElementById("itemsList");

  /* ================= RENDER ================= */

  async function renderItems() {

    itemsList.innerHTML = items.map((i, index) => `
      <div style="
        background:#111827;
        padding:10px;
        margin:6px 0;
        border-radius:8px;
        display:flex;
        justify-content:space-between;
        color:#00ffff;
      ">
        <span>
          ${i.nombre} (${i.tipo}) x${i.cantidad}
          → $${i.precio}
        </span>

        <button data-index="${index}" class="deleteItem"
          style="background:#ef4444;border:none;border-radius:6px;color:#fff;">
          ❌
        </button>
      </div>
    `).join("");

    document.querySelectorAll(".deleteItem").forEach(btn => {
      btn.onclick = () => {
        items.splice(Number(btn.dataset.index), 1);
        renderItems();
      };
    });

    /* IA SUGERENCIAS SEGURAS */
    try {
      const sugerencias = await generarSugerencias({
        ordenes: items,
        empresaId: state.empresaId
      });

      renderSugerencias("advisorOrdenes", sugerencias);
    } catch(e) {
      console.warn("IA sugerencias error:", e);
    }
  }

  /* ================= ADD ITEM ================= */

  document.getElementById("addItem").onclick = () => {

    const tipo = document.getElementById("tipo").value;
    const nombre = document.getElementById("nombre").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precio").value);
    const costo = Number(document.getElementById("costo").value);

    if (!nombre || cantidad <= 0) {
      alert("Datos incompletos");
      return;
    }

    items.push({ tipo, nombre, cantidad, precio, costo });

    ["nombre","cantidad","precio","costo"].forEach(id => {
      document.getElementById(id).value = "";
    });

    renderItems();
  };

  /* ================= CREAR ORDEN ================= */

  document.getElementById("crearOrden").onclick = async () => {

    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if (!clienteId || !vehiculoId) {
      alert("Cliente y vehículo obligatorios");
      return;
    }

    if (!items.length) {
      alert("Agrega items");
      return;
    }

    let total = 0;
    let costoTotal = 0;

    try {

      for (let item of items) {

        if (item.tipo === "inventario") {
          await usarRepuesto({
            repuestoId: item.nombre,
            cantidad: item.cantidad
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
        estado: "abierta",
        creadoEn: new Date()
      };

      /* 🔥 CORREGIDO: estructura por empresa */
      await addDoc(
        collection(db, `empresas/${state.empresaId}/ordenes`),
        orden
      );

      /* IA APRENDIZAJE */
      try { await aprenderDeOrden(orden); } catch {}

      hablar("Orden creada");
      alert("✅ Orden creada");

      items = [];
      renderItems();

    } catch (e) {
      console.error(e);
      hablar("Error creando orden");
      alert(e.message);
    }
  };

  /* ================= IA ================= */

  document.getElementById("crearConIA").onclick = async () => {

    const input = prompt("Describe la orden");

    if (!input) return;

    try {

      const ordenIA = await generarOrdenIA(input);

      if (!ordenIA) {
        alert("IA no generó orden");
        return;
      }

      document.getElementById("cliente").value =
        ordenIA.cliente?.clienteId || "";

      document.getElementById("vehiculo").value =
        ordenIA.vehiculo?.placa || "";

      items = (ordenIA.cotizacion || []).map(i => ({
        tipo: "compra",
        nombre: i.pieza,
        cantidad: Number(i.cantidad) || 1,
        precio: Number(i.preciounitario) || 0,
        costo: Number(i.preciounitario) * 0.7
      }));

      renderItems();
      hablar("Orden generada");

    } catch (e) {
      console.error(e);
      hablar("Error IA");
    }
  };

  /* ================= VOZ ================= */

  document.getElementById("vozBtn").onclick = () => {

    iniciarVoz(async texto => {

      try {

        const ordenIA = await generarOrdenIA(texto);

        if (!ordenIA) {
          hablar("No entendí");
          return;
        }

        document.getElementById("cliente").value =
          ordenIA.cliente?.clienteId || "";

        document.getElementById("vehiculo").value =
          ordenIA.vehiculo?.placa || "";

        items = (ordenIA.cotizacion || []).map(i => ({
          tipo: "compra",
          nombre: i.pieza,
          cantidad: Number(i.cantidad) || 1,
          precio: Number(i.preciounitario) || 0,
          costo: Number(i.preciounitario) * 0.7
        }));

        renderItems();
        hablar("Orden lista");

      } catch (e) {
        console.error(e);
        hablar("Error voz");
      }

    });
  };

  /* INIT */
  renderItems();
}