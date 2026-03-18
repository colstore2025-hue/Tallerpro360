/**
 * clientes.js
 * CRM Clientes + Vehículos + Órdenes + Feedback
 * TallerPRO360 ERP SaaS
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { hablar } from "../voice/voiceCore.js";

export default async function clientesModule(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 8px #0ff;">👥 Clientes PRO360</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
      <input id="nombre" placeholder="Nombre cliente" style="flex:2; padding:8px; border-radius:6px;"/>
      <input id="telefono" placeholder="Teléfono" style="flex:1; padding:8px; border-radius:6px;"/>
      <button id="crearCliente" style="flex:1; background:#16a34a; color:#000; border-radius:6px;">➕ Crear Cliente</button>
    </div>

    <input id="busqueda" placeholder="Buscar cliente..." style="width:100%; padding:10px; margin-bottom:15px; border-radius:6px;"/>

    <div id="listaClientes"></div>
    <div id="detalleCliente" style="margin-top:20px;"></div>
  `;

  const lista = document.getElementById("listaClientes");
  const detalle = document.getElementById("detalleCliente");

  let clientes = [];

  // 🔄 Cargar clientes
  async function cargarClientes() {
    try {
      const q = query(
        collection(window.db, "clientes"),
        where("empresaId", "==", state.empresaId),
        orderBy("creadoEn", "desc")
      );
      const snap = await getDocs(q);
      clientes = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      renderClientes(clientes);
    } catch(e) {
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

    document.querySelectorAll(".clienteItem").forEach(el => {
      el.onclick = () => verCliente(el.dataset.id);
    });
  }

  // 🔍 Buscar clientes
  document.getElementById("busqueda").oninput = e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = clientes.filter(c => (c.nombre||"").toLowerCase().includes(texto));
    renderClientes(filtrados);
  };

  // ➕ Crear cliente
  document.getElementById("crearCliente").onclick = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    if(!nombre){ alert("Nombre obligatorio"); return; }

    try {
      await addDoc(collection(window.db,"clientes"),{
        empresaId: state.empresaId,
        nombre,
        telefono,
        creadoEn: new Date(),
        estado:"activo"
      });

      ["nombre","telefono"].forEach(id=>document.getElementById(id).value="");
      hablar("✅ Cliente creado correctamente");
      cargarClientes();
    } catch(e){ console.error(e); alert("❌ Error creando cliente"); }
  };

  // 👁️ Ver detalle cliente + Vehículos + Órdenes + Feedback
  async function verCliente(clienteId){
    detalle.innerHTML = "Cargando...";

    try {
      // 🚗 Vehículos del cliente
      const vehiculosSnap = await getDocs(
        query(
          collection(window.db,"vehiculos"),
          where("clienteId","==",clienteId),
          where("empresaId","==",state.empresaId)
        )
      );

      let vehiculosHTML = "<h3>🚗 Vehículos</h3>";
      vehiculosSnap.forEach(doc => {
        const v = doc.data();
        vehiculosHTML += `
          <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>${v.marca||""} ${v.modelo||""} (${v.placa||""})</span>
            <button onclick="window.location='/app/ordenes.html?cliente=${clienteId}&vehiculo=${v.placa}'"
              style="background:#0ff;border:none;border-radius:6px;padding:3px 6px; cursor:pointer;">
              🧾 Nueva Orden
            </button>
          </div>
        `;
      });

      // 🧾 Órdenes del cliente
      const ordenesSnap = await getDocs(
        query(
          collection(window.db,"ordenes"),
          where("clienteId","==",clienteId),
          where("empresaId","==",state.empresaId),
          orderBy("creadoEn","desc")
        )
      );

      let ordenesHTML = "<h3>🧾 Órdenes</h3>";
      ordenesSnap.forEach(doc => {
        const o = doc.data();
        const estadoColor = o.estado==="abierta"?"#0ff":o.estado==="cerrada"?"#0f0":"#ff4444";
        ordenesHTML += `
          <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:${estadoColor}">
            <span>${o.numero||"ORD"} - $${formatear(o.total||0)}</span>
            <button onclick="window.location='/app/ordenes.html?cliente=${clienteId}&vehiculo=${o.vehiculoId}'"
              style="background:#16a34a;border:none;border-radius:6px;padding:3px 6px; cursor:pointer;">
              Ver Orden
            </button>
          </div>
        `;
      });

      // ⭐ Feedback de cliente
      const feedbackSnap = await getDocs(
        query(
          collection(window.db,"feedback"),
          where("clienteId","==",clienteId),
          where("empresaId","==",state.empresaId),
          orderBy("fecha","desc")
        )
      );

      let feedbackHTML = "<h3>💬 Feedback del Cliente</h3>";
      feedbackSnap.forEach(doc=>{
        const f = doc.data();
        feedbackHTML += `
          <div style="margin-bottom:6px; padding:5px; background:#111; border-radius:6px;">
            ${f.mensaje || ""} <br/>
            <small style="color:#888;">${new Date(f.fecha.seconds*1000).toLocaleString()}</small>
          </div>
        `;
      });

      detalle.innerHTML = `
        <div style="background:#0f172a; padding:20px; border-radius:12px;">
          ${vehiculosHTML}
          ${ordenesHTML}
          ${feedbackHTML}
        </div>
      `;

    } catch(e){ console.error(e); detalle.innerHTML="❌ Error cargando detalle"; }
  }

  // 💰 Formatear dinero
  function formatear(valor){
    return new Intl.NumberFormat("es-CO").format(valor||0);
  }

  // INIT
  cargarClientes();
}