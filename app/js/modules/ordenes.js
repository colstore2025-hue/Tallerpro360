import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { usarRepuesto } from "../services/inventarioService.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";
import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { aprenderDeOrden } from "../ai/aiLearningEngine.js";

export default async function (container, state) {

  let items = [];

  container.innerHTML = `
    <h1>🧾 Órdenes PRO</h1>

    <input id="cliente" placeholder="ID Cliente"/>
    <input id="vehiculo" placeholder="Placa"/>

    <h3>Agregar repuesto</h3>

    <select id="tipo">
      <option value="inventario">Inventario</option>
      <option value="compra">Compra directa</option>
      <option value="cliente">Cliente trae</option>
    </select>

    <input id="nombre" placeholder="Nombre"/>
    <input id="cantidad" type="number" placeholder="Cantidad"/>
    <input id="precio" type="number" placeholder="Precio venta"/>
    <input id="costo" type="number" placeholder="Costo"/>

    <button id="addItem">➕ Agregar</button>

    <div id="itemsList"></div>

    <br/>
    <button id="crearOrden">🚀 Crear Orden</button>
    <button id="crearConIA">🤖 Crear con IA</button>
    <button id="vozBtn">🎤 Voz</button>
  `;

  const itemsList = document.getElementById("itemsList");

  // 🔁 Render items
  function renderItems() {
    itemsList.innerHTML = items.map((i, index) => `
      <div style="background:#111;padding:10px;margin:5px;border-radius:8px;">
        ${i.nombre} (${i.tipo}) x${i.cantidad} - $${i.precio}
        <button onclick="window.eliminarItem(${index})">❌</button>
      </div>
    `).join("");
  }

  // 🗑️ eliminar item
  window.eliminarItem = (index) => {
    items.splice(index, 1);
    renderItems();
  };

  // ➕ Agregar item
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

    renderItems();

    // limpiar inputs
    document.getElementById("nombre").value = "";
    document.getElementById("cantidad").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("costo").value = "";
  };

  // 🚀 Crear orden manual
  document.getElementById("crearOrden").onclick = async () => {

    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if (!clienteId || !vehiculoId) {
      alert("Cliente y vehículo son obligatorios");
      return;
    }

    let total = 0;
    let costoTotal = 0;

    try {

      for (let item of items) {

        if (item.tipo === "inventario") {
          await usarRepuesto({
            repuestoId: item.nombre,
            cantidad: item.cantidad,
            ordenId: "temp"
          });

          costoTotal += item.costo * item.cantidad;
        }

        if (item.tipo === "compra") {
          costoTotal += item.costo * item.cantidad;
        }

        // cliente trae → no suma costo

        total += item.precio * item.cantidad;
      }

      const utilidad = total - costoTotal;

      const orden = {
        clienteId,
        vehiculoId,
        items,
        total,
        costoTotal,
        utilidad,
        estado: "abierta",
        creadoEn: new Date()
      };

      await addDoc(collection(window.db, "ordenes"), orden);

      // 🧠 IA aprende
      await aprenderDeOrden(orden);

      hablar("Orden creada correctamente");

      alert("✅ Orden creada");

      items = [];
      renderItems();

    } catch (error) {
      console.error(error);
      hablar("Error creando la orden");
      alert("Error: " + error.message);
    }
  };

  // 🤖 Crear orden con IA
  document.getElementById("crearConIA").onclick = async () => {

    const input = prompt("Describe la orden");

    if (!input) return;

    const ordenIA = await generarOrdenIA(input);

    if (!ordenIA) {
      alert("Error IA");
      return;
    }

    // precargar datos
    document.getElementById("cliente").value = ordenIA.cliente?.clienteId || "";
    document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa || "";

    items = ordenIA.cotizacion?.map(i => ({
      tipo: "compra",
      nombre: i.pieza,
      cantidad: i.cantidad,
      precio: i.preciounitario,
      costo: i.preciounitario * 0.7 // estimado
    })) || [];

    renderItems();

    hablar("Orden generada por inteligencia artificial. Puedes revisarla");
  };

  // 🎤 VOZ
  document.getElementById("vozBtn").onclick = () => {

    iniciarVoz(async (texto) => {
      hablar("Procesando orden");

      const ordenIA = await generarOrdenIA(texto);

      if (!ordenIA) {
        hablar("No entendí la orden");
        return;
      }

      document.getElementById("cliente").value = ordenIA.cliente?.clienteId || "";
      document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa || "";

      items = ordenIA.cotizacion?.map(i => ({
        tipo: "compra",
        nombre: i.pieza,
        cantidad: i.cantidad,
        precio: i.preciounitario,
        costo: i.preciounitario * 0.7
      })) || [];

      renderItems();

      hablar("Orden lista para revisión");
    });

  };

}