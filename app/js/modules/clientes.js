import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function (container, state) {

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

  // 🔄 Cargar clientes
  async function cargarClientes() {
    const snap = await getDocs(collection(window.db, "clientes"));

    clientes = [];

    snap.forEach(doc => {
      clientes.push({ id: doc.id, ...doc.data() });
    });

    renderClientes(clientes);
  }

  // 🎨 Render lista
  function renderClientes(data) {
    let html = "";

    data.forEach(c => {
      html += `
        <div style="background:#111;padding:15px;margin:10px 0;border-radius:10px;cursor:pointer;"
          onclick="verCliente('${c.id}')">
          👤 ${c.nombre || "Sin nombre"} <br/>
          📞 ${c.telefono || "-"}
        </div>
      `;
    });

    lista.innerHTML = html;
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
    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;

    await addDoc(collection(window.db, "clientes"), {
      nombre,
      telefono,
      creadoEn: new Date(),
      estado: "activo"
    });

    cargarClientes();
  };

  // 👁️ Ver detalle cliente
  window.verCliente = async (clienteId) => {

    detalle.innerHTML = "Cargando...";

    // 🚗 Vehículos
    const vehiculosSnap = await getDocs(
      query(collection(window.db, "vehiculos"), where("clienteId", "==", clienteId))
    );

    let vehiculosHTML = "<h3>🚗 Vehículos</h3>";

    vehiculosSnap.forEach(doc => {
      const v = doc.data();

      vehiculosHTML += `
        <div style="margin-bottom:10px;">
          ${v.marca} ${v.modelo} (${v.placa})
        </div>
      `;
    });

    // 🧾 Órdenes
    const ordenesSnap = await getDocs(
      query(collection(window.db, "ordenes"), where("clienteId", "==", clienteId))
    );

    let ordenesHTML = "<h3>🧾 Órdenes</h3>";

    ordenesSnap.forEach(doc => {
      const o = doc.data();

      ordenesHTML += `
        <div style="margin-bottom:10px;">
          ${o.numero} - ${o.estado} - $${o.valorTrabajo || 0}
        </div>
      `;
    });

    detalle.innerHTML = `
      <div style="background:#0f172a;padding:20px;border-radius:12px;margin-top:20px;">
        ${vehiculosHTML}
        ${ordenesHTML}
      </div>
    `;
  };

  // INIT
  cargarClientes();
}