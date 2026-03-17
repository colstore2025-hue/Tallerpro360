 /**
 * Módulo Órdenes
 */
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "/js/core/firebase-config.js";
import { usarRepuesto } from "/js/services/inventarioService.js";
import { generarOrdenIA } from "/js/ai/aiAssistant.js";

export default async function ordenes(container, state){
  let items=[];
  container.innerHTML = `
    <h1>🧾 Órdenes PRO</h1>
    <input id="cliente" placeholder="ID Cliente"/>
    <input id="vehiculo" placeholder="Placa"/>
    <select id="tipo"><option value="inventario">Inventario</option><option value="compra">Compra directa</option><option value="cliente">Cliente trae</option></select>
    <input id="nombre" placeholder="Nombre"/>
    <input id="cantidad" type="number" placeholder="Cantidad"/>
    <input id="precio" type="number" placeholder="Precio venta"/>
    <input id="costo" type="number" placeholder="Costo"/>
    <button id="addItem">➕ Agregar</button>
    <div id="itemsList"></div>
    <button id="crearOrden">🚀 Crear Orden</button>
    <button id="crearConIA">🤖 Crear con IA</button>
  `;
  const itemsList=document.getElementById("itemsList");

  async function renderItems(){
    itemsList.innerHTML=items.map((i,index)=>`<div style="background:#111;padding:10px;margin:5px;border-radius:8px;">${i.nombre} (${i.tipo}) x${i.cantidad} - $${i.precio} <button data-index="${index}" class="deleteItem">❌</button></div>`).join("");
    document.querySelectorAll(".deleteItem").forEach(btn=>{btn.onclick=()=>{items.splice(Number(btn.dataset.index),1); renderItems(); };});
  }

  document.getElementById("addItem").onclick=()=>{
    const tipo=document.getElementById("tipo").value;
    const nombre=document.getElementById("nombre").value.trim();
    const cantidad=Number(document.getElementById("cantidad").value)||0;
    const precio=Number(document.getElementById("precio").value)||0;
    const costo=Number(document.getElementById("costo").value)||0;
    if(!nombre || cantidad<=0) return alert("Datos incompletos");
    items.push({tipo,nombre,cantidad,precio,costo});
    renderItems();
    ["nombre","cantidad","precio","costo"].forEach(id=>document.getElementById(id).value="");
  };

  document.getElementById("crearOrden").onclick=async()=>{
    const cliente=document.getElementById("cliente").value.trim();
    const vehiculo=document.getElementById("vehiculo").value.trim();
    if(!cliente || !vehiculo || !items.length) return alert("Faltan datos");
    let total=0,costoTotal=0;
    for(let i of items){
      if(i.tipo==="inventario") await usarRepuesto({repuestoId:i.nombre,cantidad:i.cantidad,ordenId:"temp"});
      total+=i.precio*i.cantidad;
      costoTotal+=i.costo*i.cantidad;
    }
    const orden={empresaId:state.empresaId,clienteId:cliente,vehiculoId:vehiculo,items,total,costoTotal,utilidad:total-costoTotal,estado:"abierta",creadoEn:new Date()};
    await addDoc(collection(db,"ordenes"),orden);
    alert("✅ Orden creada");
    items=[];
    renderItems();
  };

  document.getElementById("crearConIA").onclick=async()=>{
    const input=prompt("Describe la orden"); if(!input) return;
    const ordenIA=await generarOrdenIA(input);
    document.getElementById("cliente").value=ordenIA.cliente?.clienteId||"";
    document.getElementById("vehiculo").value=ordenIA.vehiculo?.placa||"";
    items=(ordenIA.cotizacion||[]).map(i=>({tipo:"compra",nombre:i.pieza,cantidad:Number(i.cantidad)||1,precio:Number(i.preciounitario)||0,costo:(Number(i.preciounitario)||0)*0.7}));
    renderItems();
  };

  renderItems();
}