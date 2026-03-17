/**
 * 🧾 ÓRDENES ERP PRO360
 * TallerPRO360 – ERP + IA + Voz
 */

import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { usarRepuesto } from "../services/inventarioService.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";
import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { aprenderDeOrden } from "../ai/aiLearningEngine.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";

export default async function ordenes(container, state) {

  let items = [];

  container.innerHTML = `
    <h1 style="color:#00ffcc; text-shadow:0 0 8px #00ffcc;">🧾 Órdenes PRO360</h1>

    <input id="cliente" placeholder="ID Cliente" style="width:100%;padding:8px;margin:5px 0;"/>
    <input id="vehiculo" placeholder="Placa" style="width:100%;padding:8px;margin:5px 0;"/>

    <h3 style="margin-top:10px;">Agregar repuesto</h3>
    <select id="tipo" style="width:100%;padding:8px;margin:5px 0;">
      <option value="inventario">Inventario</option>
      <option value="compra">Compra directa</option>
      <option value="cliente">Cliente trae</option>
    </select>

    <input id="nombre" placeholder="Nombre" style="width:100%;padding:8px;margin:5px 0;"/>
    <input id="cantidad" type="number" placeholder="Cantidad" style="width:100%;padding:8px;margin:5px 0;"/>
    <input id="precio" type="number" placeholder="Precio venta" style="width:100%;padding:8px;margin:5px 0;"/>
    <input id="costo" type="number" placeholder="Costo" style="width:100%;padding:8px;margin:5px 0;"/>

    <button id="addItem">➕ Agregar</button>

    <div id="itemsList" style="margin-top:10px;"></div>
    <div id="advisorOrdenes" style="margin-top:10px;"></div>

    <button id="crearOrden" style="margin-top:10px;">🚀 Crear Orden</button>
    <button id="crearConIA" style="margin-top:10px;">🤖 Crear con IA</button>
    <button id="vozBtn" style="margin-top:10px;">🎤 Voz</button>
  `;

  const itemsList = document.getElementById("itemsList");
  const advisorPanel = document.getElementById("advisorOrdenes");

  // 🔁 Render items y sugerencias IA
  async function renderItems() {
    itemsList.innerHTML = items.map((i,index) => `
      <div style="background:#111;padding:10px;margin:5px;border-radius:8px;color:#00ffcc;">
        ${i.nombre} (${i.tipo}) x${i.cantidad} - $${i.precio}
        <button data-index="${index}" class="deleteItem">❌</button>
      </div>
    `).join("");

    // borrar items
    document.querySelectorAll(".deleteItem").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.index);
        items.splice(idx,1);
        renderItems();
      };
    });

    // sugerencias IA
    const sugerencias = await generarSugerencias({ ordenes: items, empresaId: state.empresaId });
    renderSugerencias("advisorOrdenes", sugerencias);
  }

  // ➕ Agregar item
  document.getElementById("addItem").onclick = () => {
    const tipo = document.getElementById("tipo").value;
    const nombre = document.getElementById("nombre").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value) || 0;
    const precio = Number(document.getElementById("precio").value) || 0;
    const costo = Number(document.getElementById("costo").value) || 0;

    if(!nombre || cantidad <= 0) {
      alert("Datos incompletos");
      return;
    }

    items.push({ tipo,nombre,cantidad,precio,costo });
    renderItems();

    ["nombre","cantidad","precio","costo"].forEach(id => document.getElementById(id).value = "");
  };

  // 🚀 Crear orden manual
  document.getElementById("crearOrden").onclick = async () => {
    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();

    if(!clienteId || !vehiculoId) { alert("Cliente y vehículo son obligatorios"); return; }
    if(!items.length) { alert("Debes agregar al menos un item"); return; }

    let total = 0;
    let costoTotal = 0;

    try {
      for(let item of items) {
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precio);
        const costo = Number(item.costo);

        if(item.tipo === "inventario") await usarRepuesto({ repuestoId:item.nombre,cantidad,ordenId:"temp" });
        costoTotal += costo*cantidad;
        total += precio*cantidad;
      }

      const utilidad = total - costoTotal;

      const orden = { empresaId:state.empresaId, clienteId, vehiculoId, items, total, costoTotal, utilidad, estado:"abierta", creadoEn:new Date() };
      await addDoc(collection(window.db,"ordenes"),orden);

      await aprenderDeOrden(orden);

      hablar("Orden creada correctamente");
      alert("✅ Orden creada");

      items = [];
      renderItems();

    } catch(e) {
      console.error(e);
      hablar("Error creando la orden");
      alert("❌ Error: " + e.message);
    }
  };

  // 🤖 Crear orden con IA
  document.getElementById("crearConIA").onclick = async () => {
    const input = prompt("Describe la orden");
    if(!input) return;

    try {
      const ordenIA = await generarOrdenIA(input);
      if(!ordenIA) { alert("Error IA"); return; }

      document.getElementById("cliente").value = ordenIA.cliente?.clienteId || "";
      document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa || "";

      items = (ordenIA.cotizacion||[]).map(i => ({
        tipo:"compra",
        nombre:i.pieza,
        cantidad:Number(i.cantidad)||1,
        precio:Number(i.preciounitario)||0,
        costo:(Number(i.preciounitario)||0)*0.7
      }));

      renderItems();
      hablar("Orden generada por IA");

    } catch(e) {
      console.error(e);
      hablar("Error procesando IA");
    }
  };

  // 🎤 Voz
  document.getElementById("vozBtn").onclick = () => {
    iniciarVoz(async (texto) => {
      hablar("Procesando orden por voz");
      try {
        const ordenIA = await generarOrdenIA(texto);
        if(!ordenIA) { hablar("No entendí la orden"); return; }

        document.getElementById("cliente").value = ordenIA.cliente?.clienteId || "";
        document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa || "";

        items = (ordenIA.cotizacion||[]).map(i => ({
          tipo:"compra",
          nombre:i.pieza,
          cantidad:Number(i.cantidad)||1,
          precio:Number(i.preciounitario)||0,
          costo:(Number(i.preciounitario)||0)*0.7
        }));

        renderItems();
        hablar("Orden lista para revisión");

      } catch(e) {
        console.error(e);
        hablar("Error procesando voz");
      }
    });
  };

  // 🔁 Inicial
  renderItems();
}