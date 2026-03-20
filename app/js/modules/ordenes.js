/**
 * ordenes.js
 * Órdenes PRO360 · Producción estable (Modo NASA 🚀)
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

/* 🔥 DB GLOBAL */
const db = window.db;

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
      <option value="manual">Manual</option>
    </select>

    <input id="nombre" placeholder="Nombre"/>
    <input id="cantidad" type="number" placeholder="Cantidad"/>
    <input id="precio" type="number" placeholder="Precio"/>
    <input id="costo" type="number" placeholder="Costo"/>

    <button id="addItem">➕ Agregar</button>

    <div id="itemsList"></div>

    <button id="crearOrden"
      style="margin-top:20px;background:#22c55e;padding:10px;border:none;border-radius:8px;">
      🚀 Crear Orden
    </button>

    <hr/>
    <h2>📋 Órdenes existentes</h2>
    <div id="listaOrdenes"></div>
  `;

  const itemsList = document.getElementById("itemsList");
  const listaOrdenes = document.getElementById("listaOrdenes");

  /* ================= ITEMS ================= */

  function renderItems() {

    if (!items.length) {
      itemsList.innerHTML = `<p>Sin items</p>`;
      return;
    }

    itemsList.innerHTML = items.map((i, index) => `
      <div style="margin-bottom:5px;">
        ${i.nombre} x${i.cantidad} → $${fmt(i.precio)}
        <button data-index="${index}" class="del">❌</button>
      </div>
    `).join("");

    document.querySelectorAll(".del").forEach(btn => {
      btn.onclick = () => {
        items.splice(btn.dataset.index, 1);
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

    if (!item.nombre || item.cantidad <= 0) {
      alert("Datos inválidos");
      return;
    }

    items.push(item);
    renderItems();

    ["nombre","cantidad","precio","costo"].forEach(id=>{
      document.getElementById(id).value = "";
    });
  };

  /* ================= CREAR ORDEN ================= */

  document.getElementById("crearOrden").onclick = async () => {

    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if (!clienteId) {
      alert("Cliente requerido");
      return;
    }

    let total = 0;
    let costoTotal = 0;

    items.forEach(item => {
      total += item.precio * item.cantidad;
      costoTotal += item.costo * item.cantidad;
    });

    try {

      await addDoc(
        collection(db, `empresas/${state.empresaId}/ordenes`),
        {
          clienteId,
          vehiculoId,
          items,
          total,
          costoTotal,
          utilidad: total - costoTotal,
          estado: "pendiente",
          creadoEn: new Date()
        }
      );

      alert("✅ Orden creada");

      items = [];
      renderItems();
      cargarOrdenes();

    } catch (e) {

      console.error(e);
      alert("❌ Error creando orden");
    }
  };

  /* ================= LISTAR ================= */

  async function cargarOrdenes() {

    listaOrdenes.innerHTML = "🔄 Cargando...";

    try {

      const snap = await getDocs(
        query(
          collection(db, `empresas/${state.empresaId}/ordenes`),
          orderBy("creadoEn", "desc")
        )
      );

      if (snap.empty) {
        listaOrdenes.innerHTML = `<p>📭 Sin órdenes</p>`;
        return;
      }

      listaOrdenes.innerHTML = snap.docs.map(d => {

        const o = d.data();
        const id = d.id;

        return `
          <div style="border:1px solid #333;padding:10px;margin:10px;">
            <strong>${id}</strong><br/>
            Estado: ${o.estado}<br/>
            Total: $${fmt(o.total)}

            ${renderAcciones(id, o)}
          </div>
        `;
      }).join("");

    } catch (e) {

      console.error(e);

      listaOrdenes.innerHTML = `
        <p style="color:red;">❌ Error cargando órdenes</p>
      `;
    }
  }

  /* ================= ACCIONES ================= */

  function renderAcciones(id, o) {

    if (o.estado !== "pendiente") return "";

    return `
      <button onclick="aprobarOrden('${id}')">✅</button>
      <button onclick="cancelarOrden('${id}')">❌</button>
    `;
  }

  window.aprobarOrden = async function(id) {

    await updateDoc(
      doc(db, `empresas/${state.empresaId}/ordenes`, id),
      { estado: "aprobada" }
    );

    cargarOrdenes();
  };

  window.cancelarOrden = async function(id) {

    await updateDoc(
      doc(db, `empresas/${state.empresaId}/ordenes`, id),
      { estado: "cancelada" }
    );

    cargarOrdenes();
  };

  /* ================= UTILS ================= */

  function fmt(v) {
    return new Intl.NumberFormat("es-CO").format(v || 0);
  }

  /* INIT */
  renderItems();
  cargarOrdenes();
}