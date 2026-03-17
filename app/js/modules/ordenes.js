/**
 * órdenes.js
 * Órdenes Inteligentes PRO360 Última Generación
 * TallerPRO360 ERP SaaS
 */

import { collection, addDoc, getDocs, query, where, updateDoc, doc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

import { generarOrdenIA } from "../ai/aiAutonomousFlow.js";
import { aprenderDeOrden } from "../ai/aiLearningEngine.js";
import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { iniciarVoz, hablar } from "../voice/voiceCore.js";
import { usarRepuesto } from "../services/inventarioService.js";

export default async function ordenesModule(container, state) {
  let items = [];

  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 8px #0ff;">🧾 Órdenes PRO360</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
      <input id="cliente" placeholder="ID Cliente" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="vehiculo" placeholder="Placa" style="flex:1; padding:8px; border-radius:6px;"/>
    </div>

    <h3 style="color:#0ff; text-shadow:0 0 5px #0ff;">Agregar Repuesto</h3>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
      <select id="tipo" style="flex:1; padding:8px; border-radius:6px;">
        <option value="inventario">Inventario</option>
        <option value="compra">Compra directa</option>
        <option value="cliente">Cliente trae</option>
      </select>
      <input id="nombre" placeholder="Nombre" style="flex:2; padding:8px; border-radius:6px;"/>
      <input id="cantidad" type="number" placeholder="Cantidad" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="precio" type="number" placeholder="Precio venta" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="costo" type="number" placeholder="Costo" style="flex:1; padding:8px; border-radius:6px;"/>
      <button id="addItem" style="flex:1; background:#0ff; color:#000; font-weight:bold; border-radius:6px;">➕ Agregar</button>
    </div>

    <div id="itemsList" style="margin-top:10px;"></div>
    <div id="advisorOrdenes" style="margin-top:20px;"></div>

    <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
      <button id="crearOrden" style="flex:1; background:#16a34a; color:#000;">🚀 Crear Orden</button>
      <button id="crearConIA" style="flex:1; background:#0ff; color:#000;">🤖 Crear con IA</button>
      <button id="vozBtn" style="flex:1; background:#f0f; color:#000;">🎤 Voz</button>
    </div>
  `;

  const itemsList = document.getElementById("itemsList");
  const advisorPanel = document.getElementById("advisorOrdenes");

  // 🔁 Render items y sugerencias IA
  async function renderItems() {
    itemsList.innerHTML = items.map((i,index) => `
      <div style="background:#111; padding:8px; margin:5px; border-radius:6px; display:flex; justify-content:space-between; color:#0ff;">
        <span>${i.nombre} (${i.tipo}) x${i.cantidad} - $${i.precio}</span>
        <button data-index="${index}" class="deleteItem" style="background:red; border:none; border-radius:4px; color:#fff;">❌</button>
      </div>
    `).join("");

    document.querySelectorAll(".deleteItem").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.index);
        items.splice(idx,1);
        renderItems();
      };
    });

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

    if(!nombre || cantidad<=0){ alert("Datos incompletos"); return; }
    items.push({ tipo,nombre,cantidad,precio,costo });
    renderItems();
    ["nombre","cantidad","precio","costo"].forEach(id=>document.getElementById(id).value="");
  };

  // 🚀 Crear orden manual
  document.getElementById("crearOrden").onclick = async () => {
    const clienteId = document.getElementById("cliente").value.trim();
    const vehiculoId = document.getElementById("vehiculo").value.trim();
    if(!clienteId || !vehiculoId){ alert("Cliente y vehículo obligatorios"); return; }
    if(!items.length){ alert("Debes agregar al menos un item"); return; }

    let total=0, costoTotal=0;

    try {
      for(let item of items){
        if(item.tipo==="inventario") await usarRepuesto({ repuestoId:item.nombre, cantidad:item.cantidad, ordenId:"temp" });
        costoTotal += item.costo*item.cantidad;
        total += item.precio*item.cantidad;
      }

      const orden = {
        empresaId: state.empresaId,
        clienteId,
        vehiculoId,
        items,
        total,
        costoTotal,
        utilidad: total-costoTotal,
        estado:"abierta",
        creadoEn: new Date()
      };

      await addDoc(collection(db,"ordenes"),orden);
      await aprenderDeOrden(orden);

      hablar("✅ Orden creada correctamente");
      alert("Orden creada con éxito");
      items=[];
      renderItems();

    } catch(e){ console.error(e); hablar("❌ Error creando orden"); alert("Error: "+e.message); }
  };

  // 🤖 Crear orden con IA
  document.getElementById("crearConIA").onclick = async () => {
    const input = prompt("Describe la orden");
    if(!input) return;

    try {
      const ordenIA = await generarOrdenIA(input);
      if(!ordenIA){ alert("Error IA"); return; }

      document.getElementById("cliente").value = ordenIA.cliente?.clienteId||"";
      document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa||"";

      items = (ordenIA.cotizacion||[]).map(i=>({
        tipo:"compra",
        nombre:i.pieza,
        cantidad:Number(i.cantidad)||1,
        precio:Number(i.preciounitario)||0,
        costo:(Number(i.preciounitario)||0)*0.7
      }));

      renderItems();
      hablar("✅ Orden generada por IA");

    } catch(e){ console.error(e); hablar("❌ Error IA"); }
  };

  // 🎤 VOZ
  document.getElementById("vozBtn").onclick = () => {
    iniciarVoz(async texto => {
      hablar("Procesando orden por voz");
      try{
        const ordenIA = await generarOrdenIA(texto);
        if(!ordenIA){ hablar("No entendí la orden"); return; }

        document.getElementById("cliente").value = ordenIA.cliente?.clienteId||"";
        document.getElementById("vehiculo").value = ordenIA.vehiculo?.placa||"";

        items = (ordenIA.cotizacion||[]).map(i=>({
          tipo:"compra",
          nombre:i.pieza,
          cantidad:Number(i.cantidad)||1,
          precio:Number(i.preciounitario)||0,
          costo:(Number(i.preciounitario)||0)*0.7
        }));

        renderItems();
        hablar("✅ Orden lista para revisión");

      } catch(e){ console.error(e); hablar("❌ Error procesando voz"); }
    });
  };

  renderItems();
}