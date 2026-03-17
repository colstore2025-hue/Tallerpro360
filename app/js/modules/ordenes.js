import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { usarRepuesto } from "../services/inventarioService.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";
import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { aprenderDeOrden } from "../ai/aiLearningEngine.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

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

<div id="advisorOrdenes"></div>

  const itemsList = document.getElementById("itemsList");

  // 🔁 Render items
  function renderItems() {
    itemsList.innerHTML = items.map((i, index) => `
      <div style="background:#111;padding:10px;margin:5px;border-radius:8px;">
        ${i.nombre} (${i.tipo}) x${i.cantidad} - $${i.precio}
        <button data-index="${index}" class="deleteItem">❌</button>
      </div>
    `).join("");

const sugerencias = await generarSugerencias({
  ordenes: items
});

renderSugerencias("advisorOrdenes", sugerencias);

    // eliminar eventos globales (mejor práctica)
    document.querySelectorAll(".deleteItem").forEach(btn => {
      btn.onclick = () => {
        const index = Number(btn.dataset.index);
        items.splice(index, 1);
        renderItems();
      };
    });
  }

  // ➕ Agregar item
  document.getElementById("addItem").onclick = () => {

    const tipo = document.getElementById("tipo").value;
    const nombre = document.getElementById("nombre").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value) || 0;
    const precio = Number(document.getElementById("precio").value) || 0;
    const costo = Number(document.getElementById("costo").value) || 0;

    if (!nombre || cantidad <= 0) {
      alert("Datos incompletos");
      return;
    }

    items.push({ tipo, nombre, cantidad, precio, costo });

    renderItems();

    // limpiar inputs
    ["nombre", "cantidad", "precio", "costo"].forEach(id => {
      document.getElementById(id).value = "";
    });
  };

  // 🚀 Crear orden manual
  document.getElementById("crearOrden").onclick = async () => {

    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if (!clienteId || !vehiculoId) {
      alert("Cliente y vehículo son obligatorios");
      return;
    }

    if (items.length === 0) {
      alert("Debes agregar al menos un item");
      return;
    }

    let total = 0;
    let costoTotal = 0;

    try {

      for (let item of items) {

        const cantidad = Number(item.cantidad) || 0;
        const precio = Number(item.precio) || 0;
        const costo = Number(item.costo) || 0;

        if (item.tipo === "inventario") {
          await usarRepuesto({
            repuestoId: item.nombre,
            cantidad,
            ordenId: "temp"
          });

          costoTotal += costo * cantidad;
        }

        if (item.tipo === "compra") {
          costoTotal += costo * cantidad;
        }

        // cliente trae → no suma costo

        total += precio * cantidad;
      }

      const utilidad = total - costoTotal;

      const orden = {
        empresaId: state.empresaId,
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

    try {
      const ordenIA = await generarOrdenIA(input);

      if (!ordenIA) {
        alert("Error IA");
        return;
      }

      document.getElementById("cliente").value = ordenIA.cliente?.clienteId || "";
      document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa || "";

      items = (ordenIA.cotizacion || []).map(i => ({
        tipo: "compra",
        nombre: i.pieza,
        cantidad: Number(i.cantidad) || 1,
        precio: Number(i.preciounitario) || 0,
        costo: (Number(i.preciounitario) || 0) * 0.7
      }));

      renderItems();

      hablar("Orden generada por inteligencia artificial");

    } catch (e) {
      console.error(e);
      hablar("Error en IA");
    }
  };

  // 🎤 VOZ
  document.getElementById("vozBtn").onclick = () => {

    iniciarVoz(async (texto) => {

      hablar("Procesando orden");

      try {
        const ordenIA = await generarOrdenIA(texto);

        if (!ordenIA) {
          hablar("No entendí la orden");
          return;
        }

        document.getElementById("cliente").value = ordenIA.cliente?.clienteId || "";
        document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa || "";

        items = (ordenIA.cotizacion || []).map(i => ({
          tipo: "compra",
          nombre: i.pieza,
          cantidad: Number(i.cantidad) || 1,
          precio: Number(i.preciounitario) || 0,
          costo: (Number(i.preciounitario) || 0) * 0.7
        }));

        renderItems();

        hablar("Orden lista para revisión");

      } catch (e) {
        console.error(e);
        hablar("Error procesando voz");
      }
    });
  };
}