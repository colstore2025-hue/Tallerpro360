/**
 * 👥 CLIENTES + VEHÍCULOS + ÓRDENES ERP PRO360
 * Última Generación
 * Autor: PRO360 / Nexus-Starlink SAS
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generarSugerenciasClientes, renderSugerencias } from "../ai/aiAdvisor.js";

export default async function clientesModule(container, state) {

  container.innerHTML = `
    <h1 style="color:#0ff;text-shadow:0 0 8px #0ff;">👥 Clientes PRO360</h1>

    <div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
      <input id="nombre" placeholder="Nombre cliente" style="flex:1;padding:8px;border-radius:6px;border:none;"/>
      <input id="telefono" placeholder="Teléfono" style="flex:1;padding:8px;border-radius:6px;border:none;"/>
      <button id="crearCliente" style="flex:1; background:#16a34a;color:#000;font-weight:bold;border-radius:6px;">➕ Crear Cliente</button>
    </div>

    <input id="busqueda" placeholder="Buscar cliente..." style="margin-bottom:15px;width:100%;padding:10px;border-radius:6px;"/>

    <div id="listaClientes"></div>
    <div id="detalleCliente" style="margin-top:20px;"></div>
    <div id="advisorClientes" style="margin-top:20px;"></div>
  `;

  const lista = document.getElementById("listaClientes");
  const detalle = document.getElementById("detalleCliente");
  const advisorPanel = document.getElementById("advisorClientes");

  let clientes = [];

  // 🔄 Cargar clientes multi-empresa
  async function cargarClientes() {
    try {
      const q = query(
        collection(db, "clientes"),
        where("empresaId", "==", state.empresaId)
      );

      const snap = await getDocs(q);
      clientes = [];
      snap.forEach(doc => clientes.push({ id: doc.id, ...doc.data() }));

      renderClientes(clientes);
      renderSugerenciasClientesPanel();
    } catch (e) {
      console.error(e);
      lista.innerHTML = "❌ Error cargando clientes";
    }
  }

  // 🎨 Render lista clientes
  function renderClientes(data) {
    lista.innerHTML = data.map(c => `
      <div 
        data-id="${c.id}"
        class="clienteItem"
        style="
          background:#111;padding:15px;margin:10px 0;
          border-radius:10px;cursor:pointer;
          transition:0.2s;border:1px solid #0f172a;
          box-shadow: 0 0 10px #0ff33c40;
        "
      >
        👤 ${c.nombre || "Sin nombre"} <br/>
        📞 ${c.telefono || "-"}
      </div>
    `).join("");

    document.querySelectorAll(".clienteItem").forEach(el => {
      el.onclick = () => verCliente(el.dataset.id);
    });
  }

  // 🔍 Buscar clientes
  document.getElementById("busqueda").oninput = (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = clientes.filter(c => (c.nombre || "").toLowerCase().includes(texto));
    renderClientes(filtrados);
  };

  // ➕ Crear cliente
  document.getElementById("crearCliente").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre) { alert("Nombre obligatorio"); return; }

    try {
      await addDoc(collection(db, "clientes"), {
        empresaId: state.empresaId,
        nombre,
        telefono,
        creadoEn: new Date(),
        estado: "activo"
      });

      document.getElementById("nombre").value = "";
      document.getElementById("telefono").value = "";

      await cargarClientes();
    } catch (e) {
      console.error(e);
      alert("❌ Error creando cliente");
    }
  };

  // 👁️ Ver detalle cliente + vehículos + órdenes
  async function verCliente(clienteId) {
    detalle.innerHTML = "Cargando...";
    try {
      // 🚗 Vehículos
      const vehiculosSnap = await getDocs(
        query(collection(db, "vehiculos"),
              where("clienteId", "==", clienteId),
              where("empresaId", "==", state.empresaId))
      );

      let vehiculosHTML = "<h3 style='color:#00ffcc'>🚗 Vehículos</h3>";
      vehiculosSnap.forEach(doc => {
        const v = doc.data();
        vehiculosHTML += `
          <div style="margin-bottom:10px;display:flex;justify-content:space-between;">
            <span>${v.marca || ""} ${v.modelo || ""} (${v.placa || ""})</span>
            <button onclick="window.location='/app/ordenes.html?cliente=${clienteId}&vehiculo=${v.placa}'"
              style="background:#0ff;border:none;border-radius:6px;padding:3px 6px;cursor:pointer;">
              🧾 Nueva Orden
            </button>
          </div>
        `;
      });

      // 🧾 Órdenes
      const ordenesSnap = await getDocs(
        query(collection(db, "ordenes"),
              where("clienteId", "==", clienteId),
              where("empresaId", "==", state.empresaId))
      );

      let ordenesHTML = "<h3 style='color:#ffcc00'>🧾 Órdenes</h3>";
      ordenesSnap.forEach(doc => {
        const o = doc.data();
        ordenesHTML += `
          <div style="margin-bottom:10px; padding:5px; background:#111; border-radius:6px;">
            ${o.numero || "ORD"} - ${o.estado || "-"} - $${formatear(o.total || o.valorTrabajo || 0)}
          </div>
        `;
      });

      detalle.innerHTML = `
        <div style="background:#0f172a;padding:20px;border-radius:12px;margin-top:20px;">
          ${vehiculosHTML}
          ${ordenesHTML}
        </div>
      `;
    } catch (e) {
      console.error(e);
      detalle.innerHTML = "❌ Error cargando detalle";
    }
  }

  // 🧠 Sugerencias inteligentes IA
  async function renderSugerenciasClientesPanel() {
    try {
      const sugerencias = await generarSugerenciasClientes({ clientes, empresaId: state.empresaId });
      renderSugerencias("advisorClientes", sugerencias);
    } catch(e) {
      console.error("Error generando sugerencias IA", e);
    }
  }

  // 💰 Formatear dinero
  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarClientes();
}