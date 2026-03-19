/**
 * clientes.js
 * CRM PRO360 · Producción SaaS (VERSIÓN NASA 🔥)
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 🔥 DB GLOBAL */
const db = window.db;

import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container, state) {

  if (!state?.empresaId) {
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        ❌ empresaId no definido
      </h2>
    `;
    return;
  }

  let clientes = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">
      👥 Clientes PRO360
    </h1>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre cliente"
        style="flex:2;padding:10px;border-radius:8px;"/>

      <input id="telefono" placeholder="Teléfono"
        style="flex:1;padding:10px;border-radius:8px;"/>

      <button id="crearCliente"
        style="flex:1;background:#22c55e;color:#000;border-radius:8px;">
        ➕ Crear
      </button>
    </div>

    <input id="busqueda"
      placeholder="Buscar cliente..."
      style="width:100%;padding:12px;margin-bottom:15px;border-radius:8px;"/>

    <div id="listaClientes"></div>
    <div id="detalleCliente" style="margin-top:25px;"></div>
  `;

  const lista = document.getElementById("listaClientes");
  const detalle = document.getElementById("detalleCliente");

  /* ================= LOAD ================= */

  async function cargarClientes() {

    lista.innerHTML = "🔄 Cargando clientes...";

    try {

      // ⚠️ SIN orderBy para evitar errores de índice
      const snap = await getDocs(
        collection(db, `empresas/${state.empresaId}/clientes`)
      );

      clientes = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // Ordenar en frontend (NUNCA falla)
      clientes.sort((a, b) =>
        new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0)
      );

      renderClientes(clientes);

    } catch (e) {

      console.error("🔥 ERROR CLIENTES:", e);

      lista.innerHTML = `
        <p style="color:red;text-align:center;">
          ❌ Error cargando clientes
        </p>
      `;
    }
  }

  /* ================= RENDER ================= */

  function renderClientes(data) {

    if (!data.length) {
      lista.innerHTML = `<p style="text-align:center;">📭 Sin clientes</p>`;
      return;
    }

    lista.innerHTML = data.map(c => `
      <div class="clienteItem"
        data-id="${c.id}"
        style="
          background:#111827;
          padding:15px;
          margin:10px 0;
          border-radius:12px;
          cursor:pointer;
          border:1px solid #1f2937;
        "
      >
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

    const filtrados = clientes.filter(c =>
      (c.nombre || "").toLowerCase().includes(texto)
    );

    renderClientes(filtrados);
  };

  /* ================= CREAR ================= */

  document.getElementById("crearCliente").onclick = async () => {

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre) {
      alert("Nombre obligatorio");
      return;
    }

    try {

      await addDoc(
        collection(db, `empresas/${state.empresaId}/clientes`),
        {
          nombre,
          telefono,
          estado: "activo",
          creadoEn: new Date()
        }
      );

      hablar("Cliente creado");

      ["nombre","telefono"].forEach(id => {
        document.getElementById(id).value = "";
      });

      cargarClientes();

    } catch (e) {

      console.error(e);
      alert("Error creando cliente");
    }
  };

  /* ================= DETALLE ================= */

  async function verCliente(clienteId) {

    detalle.innerHTML = "🔄 Cargando cliente...";

    try {

      /* 🚗 VEHÍCULOS */
      const vehiculosSnap = await getDocs(
        query(
          collection(db, `empresas/${state.empresaId}/vehiculos`),
          where("clienteId", "==", clienteId)
        )
      );

      let vehiculosHTML = "<h3>🚗 Vehículos</h3>";

      vehiculosSnap.forEach(doc => {
        const v = doc.data();

        vehiculosHTML += `
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
            <span>
              ${v.marca || ""} ${v.modelo || ""}
              (${v.placa || ""})
            </span>

            <button class="crearOrdenBtn"
              style="background:#00ffff;border:none;border-radius:6px;padding:5px 10px;">
              🧾 Orden
            </button>
          </div>
        `;
      });

      /* 🧾 ÓRDENES */
      const ordenesSnap = await getDocs(
        query(
          collection(db, `empresas/${state.empresaId}/ordenes`),
          where("clienteId", "==", clienteId)
        )
      );

      let ordenes = ordenesSnap.docs.map(d => d.data());

      ordenes.sort((a, b) =>
        new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0)
      );

      let ordenesHTML = "<h3>🧾 Órdenes</h3>";

      ordenes.forEach(o => {

        const color =
          o.estado === "abierta" ? "#00ffff" :
          o.estado === "cerrada" ? "#22c55e" :
          "#ef4444";

        ordenesHTML += `
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:${color}">
            <span>
              ${o.numero || "ORD"} - $${fmt(o.total)}
            </span>
          </div>
        `;
      });

      /* 💬 FEEDBACK */
      const feedbackSnap = await getDocs(
        query(
          collection(db, `empresas/${state.empresaId}/feedback`),
          where("clienteId", "==", clienteId)
        )
      );

      let feedbackHTML = "<h3>💬 Feedback</h3>";

      feedbackSnap.forEach(doc => {
        const f = doc.data();

        let fecha = "";
        try {
          fecha = f.fecha?.toDate
            ? f.fecha.toDate().toLocaleString()
            : "";
        } catch {}

        feedbackHTML += `
          <div style="margin-bottom:6px;padding:8px;background:#111827;border-radius:8px;">
            ${f.mensaje || ""}
            <br/>
            <small style="color:#94a3b8;">${fecha}</small>
          </div>
        `;
      });

      detalle.innerHTML = `
        <div style="background:#0f172a;padding:20px;border-radius:16px;">
          ${vehiculosHTML}
          ${ordenesHTML}
          ${feedbackHTML}
        </div>
      `;

      // 🔥 FIX GLOBAL NAV
      document.querySelectorAll(".crearOrdenBtn").forEach(btn => {
        btn.onclick = () => {
          if (window.loadModule) {
            window.loadModule("ordenes");
          } else {
            console.error("loadModule no está en window");
          }
        };
      });

    } catch (e) {

      console.error("🔥 ERROR DETALLE:", e);

      detalle.innerHTML = `
        <p style="color:red;text-align:center;">
          ❌ Error cargando cliente
        </p>
      `;
    }
  }

  /* ================= UTILS ================= */

  function fmt(v) {
    return new Intl.NumberFormat("es-CO").format(v || 0);
  }

  /* INIT */
  cargarClientes();
}