/**
 * clientes.js
 * CRM Clientes + Vehículos + Órdenes
 * TallerPRO360 ERP SaaS
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function clientesModule(container, state) {

  container.innerHTML = `
    <h1>👥 Clientes (CRM)</h1>

    <div style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;">
      <input id="nombre" placeholder="Nombre cliente" style="flex:1;"/>
      <input id="telefono" placeholder="Teléfono" style="flex:1;"/>
      <button id="crearCliente">Crear Cliente</button>
    </div>

    <input id="busqueda" placeholder="Buscar cliente..." style="margin-bottom:15px;width:100%;padding:10px;"/>

    <div id="listaClientes"></div>
    <div id="detalleCliente"></div>
  `;

  const lista = document.getElementById("listaClientes");
  const detalle = document.getElementById("detalleCliente");

  let clientes = [];

  // 🔄 Cargar clientes (FILTRADO SaaS)
  async function cargarClientes() {
    try {
      const q = query(
        collection(window.db, "clientes"),
        where("empresaId", "==", state.empresaId)
      );

      const snap = await getDocs(q);

      clientes = [];

      snap.forEach(doc => {
        clientes.push({ id: doc.id, ...doc.data() });
      });

      renderClientes(clientes);

    } catch (e) {
      console.error(e);
      lista.innerHTML = "❌ Error cargando clientes";
    }
  }

  // 🎨 Render lista
  function renderClientes(data) {
    lista.innerHTML = data.map(c => `
      <div 
        data-id="${c.id}"
        class="clienteItem"
        style="
          background:#111;padding:15px;margin:10px 0;
          border-radius:10px;cursor:pointer;
          transition:0.2s;border:1px solid #0f172a;
        "
      >
        👤 ${c.nombre || "Sin nombre"} <br/>
        📞 ${c.telefono || "-"}
      </div>
    `).join("");

    // eventos seguros
    document.querySelectorAll(".clienteItem").forEach(el => {
      el.onclick = () => verCliente(el.dataset.id);
    });
  }

  // 🔍 Buscar clientes
  document.getElementById("busqueda").oninput = (e) => {
    const texto = e.target.value.toLowerCase();

    const filtrados = clientes.filter(c =>
      (c.nombre || "").toLowerCase().includes(texto)
    );

    renderClientes(filtrados);
  };

  // ➕ Crear cliente (SaaS)
  document.getElementById("crearCliente").onclick = async () => {

    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre) {
      alert("Nombre obligatorio");
      return;
    }

    try {
      await addDoc(collection(window.db, "clientes"), {
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
      alert("Error creando cliente");
    }
  };

  // 👁️ Ver detalle cliente
  async function verCliente(clienteId) {

    detalle.innerHTML = "Cargando...";

    try {

      // 🚗 Vehículos del cliente (filtrado SaaS)
      const vehiculosSnap = await getDocs(
        query(
          collection(window.db, "vehiculos"),
          where("clienteId", "==", clienteId),
          where("empresaId", "==", state.empresaId)
        )
      );

      let vehiculosHTML = "<h3>🚗 Vehículos</h3>";

      vehiculosSnap.forEach(doc => {
        const v = doc.data();
        vehiculosHTML += `
          <div style="margin-bottom:10px;display:flex;justify-content:space-between;">
            <span>${v.marca || ""} ${v.modelo || ""} (${v.placa || ""})</span>
            <button onclick="window.location='/app/ordenes.html?cliente=${clienteId}&vehiculo=${v.placa}'" style="background:#00ff99;border:none;border-radius:6px;padding:3px 6px;cursor:pointer;">
              🧾 Nueva Orden
            </button>
          </div>
        `;
      });

      // 🧾 Órdenes del cliente
      const ordenesSnap = await getDocs(
        query(
          collection(window.db, "ordenes"),
          where("clienteId", "==", clienteId),
          where("empresaId", "==", state.empresaId)
        )
      );

      let ordenesHTML = "<h3>🧾 Órdenes</h3>";

      ordenesSnap.forEach(doc => {
        const o = doc.data();
        ordenesHTML += `
          <div style="margin-bottom:10px;">
            ${o.numero || "ORD"} - ${o.estado || "-"} - $${formatear(o.total || o.valorTrabajo || 0)}
          </div>
        `;
      });

      detalle.innerHTML = `
        <div style="
          background:#0f172a;
          padding:20px;
          border-radius:12px;
          margin-top:20px;
        ">
          ${vehiculosHTML}
          ${ordenesHTML}
        </div>
      `;

    } catch (e) {
      console.error(e);
      detalle.innerHTML = "❌ Error cargando detalle";
    }
  }

  // 💰 Formatear dinero
  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarClientes();
}