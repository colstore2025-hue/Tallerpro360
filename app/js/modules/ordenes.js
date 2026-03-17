import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { usarRepuesto } from "../services/inventarioService.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";

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

    <button id="crearOrden">🚀 Crear Orden</button>
  `;

  const itemsList = document.getElementById("itemsList");

  function renderItems() {
    itemsList.innerHTML = items.map(i => `
      <div style="background:#111;padding:10px;margin:5px;">
        ${i.nombre} (${i.tipo}) x${i.cantidad}
      </div>
    `).join("");
  }

  // ➕ Agregar item
  document.getElementById("addItem").onclick = () => {

    const tipo = document.getElementById("tipo").value;
    const nombre = document.getElementById("nombre").value;
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precio").value);
    const costo = Number(document.getElementById("costo").value);

    items.push({ tipo, nombre, cantidad, precio, costo });

    renderItems();
  };

  // 🚀 Crear orden
  document.getElementById("crearOrden").onclick = async () => {

    const clienteId = document.getElementById("cliente").value;
    const vehiculoId = document.getElementById("vehiculo").value;

    let total = 0;
    let costoTotal = 0;

    try {

      // 🔥 Procesar items
      for (let item of items) {

        // 🟢 INVENTARIO
        if (item.tipo === "inventario") {

          await usarRepuesto({
            repuestoId: item.repuestoId || "manual",
            cantidad: item.cantidad,
            ordenId: "temp"
          });

          costoTotal += item.costo * item.cantidad;
        }

        // 🟡 COMPRA DIRECTA
        if (item.tipo === "compra") {
          costoTotal += item.costo * item.cantidad;
        }

        // 🔵 CLIENTE TRAE
        if (item.tipo === "cliente") {
          // no afecta costo
        }

        total += item.precio * item.cantidad;
      }

      const utilidad = total - costoTotal;

      await addDoc(collection(window.db, "ordenes"), {
        clienteId,
        vehiculoId,
        items,
        total,
        costoTotal,
        utilidad,
        estado: "abierta",
        creadoEn: new Date()
      });

      alert("✅ Orden creada");

      items = [];
      renderItems();

    } catch (error) {
      alert("Error: " + error.message);
    }
  };
}