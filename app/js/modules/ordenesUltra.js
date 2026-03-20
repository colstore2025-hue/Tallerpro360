/**
 * ordenesUltra.js
 * Órdenes PRO360 · ULTRA V2 🚀👑
 * Integración total con Dashboard, Reportes y AI
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
import { hablar } from "../voice/voiceCore.js";

export default async function ordenesUltra(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `<p style="color:red;">❌ Empresa no definida</p>`;
    hablar("Error: empresa no definida");
    return;
  }

  let items = [];

  /* ================== HTML BASE ================== */
  container.innerHTML = `
    <h1 style="color:#00ffff;font-weight:900;text-shadow:0 0 15px #00ffff;">🧾 Órdenes PRO360</h1>

    <div style="display:flex;gap:10px;margin-bottom:15px;">
      <input id="cliente" placeholder="ID Cliente" style="flex:1;padding:10px;border-radius:8px;border:2px solid #00ffff;background:#0b1220;color:#fff;"/>
      <input id="vehiculo" placeholder="Placa" style="flex:1;padding:10px;border-radius:8px;border:2px solid #00ffff;background:#0b1220;color:#fff;"/>
    </div>

    <h3 style="color:#00ffcc;">Agregar Item</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
      <select id="tipo" style="padding:10px;border-radius:8px;border:2px solid #00ffcc;background:#0b1220;color:#fff;">
        <option value="inventario">Inventario</option>
        <option value="manual">Manual</option>
      </select>
      <input id="nombre" placeholder="Nombre" style="flex:2;padding:10px;border-radius:8px;border:2px solid #00ffcc;background:#0b1220;color:#fff;"/>
      <input id="cantidad" type="number" placeholder="Cantidad" style="width:90px;padding:10px;border-radius:8px;border:2px solid #00ffcc;background:#0b1220;color:#fff;"/>
      <input id="precio" type="number" placeholder="Precio" style="width:120px;padding:10px;border-radius:8px;border:2px solid #00ffcc;background:#0b1220;color:#fff;"/>
      <input id="costo" type="number" placeholder="Costo" style="width:120px;padding:10px;border-radius:8px;border:2px solid #00ffcc;background:#0b1220;color:#fff;"/>
      <button id="addItem" style="background:#22c55e;color:#000;padding:10px;border-radius:8px;transition:0.3s;cursor:pointer;">➕ Agregar</button>
    </div>

    <div id="itemsList" style="margin-bottom:20px;"></div>

    <button id="crearOrden" style="margin-bottom:20px;background:#22c55e;padding:12px 20px;border:none;border-radius:10px;font-weight:700;cursor:pointer;transition:0.3s;">🚀 Crear Orden</button>

    <hr style="border-color:#00ffff22;"/>

    <h2 style="color:#00ffff;">📋 Órdenes existentes</h2>
    <div id="listaOrdenes"></div>
  `;

  const itemsList = document.getElementById("itemsList");
  const listaOrdenes = document.getElementById("listaOrdenes");

  /* ================== FUNCIONES ITEMS ================== */
  function renderItems() {
    if (!items.length) {
      itemsList.innerHTML = `<p style="color:#ccc;">Sin items</p>`;
      return;
    }

    itemsList.innerHTML = items.map((i, idx) => `
      <div style="margin-bottom:5px;background:#0f172a;padding:8px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 0 10px #00ffff33;transition:0.3s;">
        <span>${i.nombre} x${i.cantidad} → $${fmt(i.precio)}</span>
        <button data-index="${idx}" class="del" style="background:#ef4444;color:#fff;padding:4px 8px;border-radius:6px;cursor:pointer;">❌</button>
      </div>
    `).join("");

    document.querySelectorAll(".del").forEach(btn => {
      btn.onclick = () => {
        items.splice(btn.dataset.index, 1);
        renderItems();
        hablar("Item eliminado");
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

    if (!item.nombre || item.cantidad <= 0) {
      alert("Datos inválidos");
      hablar("Error: datos inválidos");
      return;
    }

    items.push(item);
    renderItems();

    ["nombre","cantidad","precio","costo"].forEach(id => document.getElementById(id).value = "");

    hablar("Item agregado");
  };

  /* ================== CREAR ORDEN ================== */
  document.getElementById("crearOrden").onclick = async () => {
    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if (!clienteId) { alert("Cliente requerido"); hablar("Cliente requerido"); return; }
    if (!items.length) { alert("No hay items en la orden"); hablar("No hay items en la orden"); return; }

    let total = 0, costoTotal = 0;
    items.forEach(i => { total += i.precio*i.cantidad; costoTotal += i.costo*i.cantidad; });

    try {
      await addDoc(collection(db, `empresas/${state.empresaId}/ordenes`), {
        clienteId,
        vehiculoId,
        items,
        total,
        costoTotal,
        utilidad: total-costoTotal,
        estado: "pendiente",
        creadoEn: new Date()
      });

      hablar("Orden creada exitosamente");
      items = [];
      renderItems();
      cargarOrdenes();

      // 🎯 Actualizar dashboard y reportes en tiempo real
      if(window.updateDashboard) window.updateDashboard();
      if(window.updateReportes) window.updateReportes();

    } catch(e) {
      console.error(e);
      alert("❌ Error creando orden");
      hablar("Error creando orden");
    }
  };

  /* ================== LISTAR ÓRDENES ================== */
  async function cargarOrdenes() {
    listaOrdenes.innerHTML = "🔄 Cargando...";

    try {
      const snap = await getDocs(query(
        collection(db, `empresas/${state.empresaId}/ordenes`),
        orderBy("creadoEn","desc")
      ));

      if (snap.empty) {
        listaOrdenes.innerHTML = `<p style="color:#ccc;">📭 Sin órdenes</p>`;
        return;
      }

      listaOrdenes.innerHTML = snap.docs.map(d => {
        const o = d.data();
        const id = d.id;
        return `
          <div style="border:1px solid #00ffff55;padding:12px;margin:10px;border-radius:10px;background:#0b1220;box-shadow:0 0 15px #00ffff22;transition:0.3s;">
            <strong style="color:#00ffcc;">${id}</strong><br/>
            Estado: <span style="color:${estadoColor(o.estado)}">${o.estado}</span><br/>
            Total: <strong style="color:#00ffcc;">$${fmt(o.total)}</strong>
            ${renderAcciones(id,o)}
          </div>
        `;
      }).join("");

    } catch(e) {
      console.error(e);
      listaOrdenes.innerHTML = `<p style="color:red;">❌ Error cargando órdenes</p>`;
      hablar("Error cargando órdenes");
    }
  }

  /* ================== ACCIONES ================== */
  function renderAcciones(id,o) {
    if (o.estado !== "pendiente") return "";
    return `
      <button onclick="aprobarOrden('${id}')" style="margin-right:5px;background:#22c55e;color:#000;padding:6px;border-radius:6px;cursor:pointer;">✅ Aprobar</button>
      <button onclick="cancelarOrden('${id}')" style="background:#ef4444;color:#fff;padding:6px;border-radius:6px;cursor:pointer;">❌ Cancelar</button>
    `;
  }

  window.aprobarOrden = async id => {
    await updateDoc(doc(db, `empresas/${state.empresaId}/ordenes`, id), { estado: "aprobada" });
    hablar("Orden aprobada");
    cargarOrdenes();
    if(window.updateDashboard) window.updateDashboard();
  };

  window.cancelarOrden = async id => {
    await updateDoc(doc(db, `empresas/${state.empresaId}/ordenes`, id), { estado: "cancelada" });
    hablar("Orden cancelada");
    cargarOrdenes();
    if(window.updateDashboard) window.updateDashboard();
  };

  /* ================== UTIL ================== */
  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v||0); }
  function estadoColor(e) {
    if(e==="pendiente") return "#facc15";
    if(e==="aprobada") return "#22c55e";
    if(e==="cancelada") return "#ef4444";
    return "#fff";
  }

  /* ================== INIT ================== */
  renderItems();
  cargarOrdenes();
}