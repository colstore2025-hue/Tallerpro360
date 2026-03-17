/**
 * CRM CLIENTES - TALLERPRO360
 * ERP + CRM + IA SaaS
 */

import { collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function clientesModulo(container, state) {

  container.innerHTML = `
    <h1>👥 Clientes (CRM)</h1>

    <div style="margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre cliente"/>
      <input id="telefono" placeholder="Teléfono"/>
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
        collection(db, "clientes"),
        where("empresaId", "==", state.empresaId)
      );

      const snap = await getDocs(q);

      clientes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        style="background:#111;padding:15px;margin:10px 0;border-radius:10px;cursor:pointer;"
      >
        👤 ${c.nombre || "Sin nombre"} <br/>
        📞 ${c.telefono || "-"}
      </div>
    `).join("");

    document.querySelectorAll(".clienteItem").forEach(el => {
      el.onclick = () => verCliente(el.dataset.id);
    });
  }

  // 🔍 Buscar
  document.getElementById("busqueda").oninput = (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = clientes.filter(c =>
      (c.nombre || "").toLowerCase().includes(texto)
    );
    renderClientes(filtrados);
  };

  // ➕ Crear cliente
  document.getElementById("crearCliente").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    if (!nombre) {
      alert("Nombre obligatorio");
      return;
    }

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
      alert("✅ Cliente creado correctamente");

    } catch (e) {
      console.error(e);
      alert("❌ Error creando cliente");
    }
  };

  // 👁️ Ver detalle cliente
  async function verCliente(clienteId) {
    detalle.innerHTML = "Cargando...";

    try {
      // Vehículos
      const vehiculosSnap = await getDocs(
        query(
          collection(db, "vehiculos"),
          where("clienteId", "==", clienteId),
          where("empresaId", "==", state.empresaId)
        )
      );

      let vehiculosHTML = "<h3>🚗 Vehículos</h3>";
      vehiculosSnap.forEach(doc => {
        const v = doc.data();
        vehiculosHTML += `
          <div style="margin-bottom:10px;">
            ${v.marca || ""} ${v.modelo || ""} (${v.placa || ""})
          </div>
        `;
      });

      // Órdenes
      const ordenesSnap = await getDocs(
        query(
          collection(db, "ordenes"),
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

  // 💰 Formatear dinero
  function formatear(valor) {
    return new Intl.NumberFormat("es-CO").format(valor || 0);
  }

  // INIT
  cargarClientes();
}