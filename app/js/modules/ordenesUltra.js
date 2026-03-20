/**
 * ordenesUltra.js
 * Órdenes PRO360 · ULTRA PRO 🚀
 * Compatible con moduleLoader.js, voz y planes
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

export default async function ordenesModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `<p style="color:red;">❌ Empresa no definida</p>`;
    hablar("Error: empresa no definida");
    return;
  }

  let items = [];

  /* ================= HTML BASE ================= */
  container.innerHTML = `
    <h1 style="color:#00ffff;text-shadow:0 0 6px #fff;">🧾 Órdenes PRO360</h1>

    <div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;">
      <input id="cliente" placeholder="ID Cliente" style="flex:1;padding:8px;border-radius:6px;"/>
      <input id="vehiculo" placeholder="Placa" style="flex:1;padding:8px;border-radius:6px;"/>
    </div>

    <h3>Agregar Item</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
      <select id="tipo" style="padding:8px;border-radius:6px;">
        <option value="inventario">Inventario</option>
        <option value="manual">Manual</option>
      </select>
      <input id="nombre" placeholder="Nombre" style="flex:2;padding:8px;border-radius:6px;"/>
      <input id="cantidad" type="number" placeholder="Cantidad" style="width:80px;padding:8px;border-radius:6px;"/>
      <input id="precio" type="number" placeholder="Precio" style="width:100px;padding:8px;border-radius:6px;"/>
      <input id="costo" type="number" placeholder="Costo" style="width:100px;padding:8px;border-radius:6px;"/>
      <button id="addItem" style="background:#22c55e;color:#000;padding:8px;border-radius:6px;">➕ Agregar</button>
    </div>

    <div id="itemsList" style="margin-bottom:20px;"></div>

    <button id="crearOrden" style="margin-bottom:20px;background:#22c55e;padding:10px;border:none;border-radius:8px;">
      🚀 Crear Orden
    </button>

    <hr/>
    <h2>📋 Órdenes existentes</h2>
    <div id="listaOrdenes"></div>
  `;

  const itemsList = container.querySelector("#itemsList");
  const listaOrdenes = container.querySelector("#listaOrdenes");

  /* ================= ITEMS ================= */
  function renderItems() {
    itemsList.innerHTML = items.length
      ? items.map((i, idx) => `
        <div style="margin-bottom:5px;background:#111;padding:6px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#00ffff;text-shadow:0 0 4px #fff;">${i.nombre} x${i.cantidad} → $${fmt(i.precio)}</span>
          <button data-index="${idx}" class="del" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:4px 6px;">❌</button>
        </div>
      `).join("")
      : `<p style="color:#aaa;">Sin items</p>`;

    itemsList.querySelectorAll(".del").forEach(btn => {
      btn.onclick = () => {
        items.splice(btn.dataset.index, 1);
        renderItems();
        hablar("Item eliminado");
      };
    });
  }

  container.querySelector("#addItem").onclick = () => {
    const item = {
      tipo: container.querySelector("#tipo").value,
      nombre: container.querySelector("#nombre").value.trim(),
      cantidad: Number(container.querySelector("#cantidad").value),
      precio: Number(container.querySelector("#precio").value),
      costo: Number(container.querySelector("#costo").value)
    };

    if (!item.nombre || item.cantidad <= 0) {
      alert("Datos inválidos");
      hablar("Error: datos inválidos");
      return;
    }

    items.push(item);
    renderItems();
    ["nombre","cantidad","precio","costo"].forEach(id => container.querySelector("#"+id).value = "");
    hablar("Item agregado");
  };

  /* ================= CREAR ORDEN ================= */
  container.querySelector("#crearOrden").onclick = async () => {
    const clienteId = container.querySelector("#cliente").value.trim();
    const vehiculoId = container.querySelector("#vehiculo").value.trim();

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
      alert("✅ Orden creada");
      items = [];
      renderItems();
      cargarOrdenes();

    } catch(e) {
      console.error(e);
      alert("❌ Error creando orden");
      hablar("Error creando orden");
    }
  };

  /* ================= LISTAR ÓRDENES ================= */
  async function cargarOrdenes() {
    listaOrdenes.innerHTML = `<p style="color:#00ffff;">🔄 Cargando...</p>`;

    try {
      const snap = await getDocs(query(collection(db, `empresas/${state.empresaId}/ordenes`), orderBy("creadoEn","desc")));
      if (snap.empty) { listaOrdenes.innerHTML = `<p style="color:#aaa;">📭 Sin órdenes</p>`; return; }

      listaOrdenes.innerHTML = snap.docs.map(d => {
        const o = d.data(); const id = d.id;
        return `
          <div style="border:1px solid #333;padding:10px;margin:10px;border-radius:8px;background:#111;">
            <strong style="color:#00ffff;text-shadow:0 0 4px #fff;">${id}</strong><br/>
            Estado: <span style="color:#facc15;">${o.estado}</span><br/>
            Total: <span style="color:#00ff99;">$${fmt(o.total)}</span>
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

  /* ================= ACCIONES ================= */
  function renderAcciones(id,o) {
    if (o.estado !== "pendiente") return "";
    return `
      <button onclick="aprobarOrden('${id}')" style="margin-right:5px;background:#22c55e;color:#000;padding:4px 6px;border-radius:6px;">✅ Aprobar</button>
      <button onclick="cancelarOrden('${id}')" style="background:#ef4444;color:#fff;padding:4px 6px;border-radius:6px;">❌ Cancelar</button>
    `;
  }

  window.aprobarOrden = async id => {
    await updateDoc(doc(db, `empresas/${state.empresaId}/ordenes`, id), { estado: "aprobada" });
    hablar("Orden aprobada");
    cargarOrdenes();
  };

  window.cancelarOrden = async id => {
    await updateDoc(doc(db, `empresas/${state.empresaId}/ordenes`, id), { estado: "cancelada" });
    hablar("Orden cancelada");
    cargarOrdenes();
  };

  /* ================= UTILS ================= */
  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v||0); }

  /* ================= INIT ================= */
  renderItems();
  cargarOrdenes();
}