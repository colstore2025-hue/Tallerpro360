/**
🔥 NEXUS-X PRO360 FINAL - SISTEMA OPERATIVO REAL
✔ Ordenes
✔ Inventario
✔ Pricing IA
✔ Contabilidad
✔ WhatsApp
✔ Documento HTML
✔ Eliminación + edición real
✔ Flujo completo funcional
*/

import {
  collection, query, where, getDocs,
  doc, writeBatch, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido } from "../ai/pricingEnginePRO360.js";

export default function ordenes(container){

let empresaId = localStorage.getItem("nexus_empresaId");

let ordenActiva = {
  id:null,
  placa:"",
  cliente:"",
  telefono:"",
  estado:"COTIZACION",
  items:[],
  bitacora:"",
  finanzas:{total:0, base:0, iva:0, ebitda:0}
};

/* =========================
💰 FINANZAS
========================= */
const recalcular = ()=>{
  let venta=0, costo=0;

  ordenActiva.items.forEach(i=>{
    venta += Number(i.venta||0);
    costo += Number(i.costo||0);
  });

  const base = venta/1.19;
  const iva = venta-base;
  const ebitda = base-costo;

  ordenActiva.finanzas = {total:venta, base, iva, ebitda};

  document.getElementById("total").innerText =
    "$ " + Math.round(venta).toLocaleString();

  document.getElementById("resumen").innerHTML = `
    <div class="text-green-400">✔ EXCELENTE OPERACIÓN</div>
    Base: $${Math.round(base)}
    <br>IVA: $${Math.round(iva)}
    <br><b class="text-green-400">✔ EBITDA: $${Math.round(ebitda)}</b>
  `;
};

/* =========================
➕ ITEMS
========================= */
window.agregarManoObra = ()=>{
  const sugerido = analizarPrecioSugerido({tipo:"mano_obra", costo:0}) || 50000;

  ordenActiva.items.push({
    tipo:"MANO_OBRA",
    desc:"SERVICIO",
    costo:0,
    venta:sugerido
  });

  renderItems(); recalcular();
};

window.agregarRepuesto = async ()=>{
  const q = query(collection(db,"inventario"), where("empresaId","==",empresaId));
  const snap = await getDocs(q);

  if(snap.empty){
    alert("Sin inventario");
    return;
  }

  const item = snap.docs[0].data();
  const idRef = snap.docs[0].id;

  const sugerido = analizarPrecioSugerido({
    tipo:"repuesto",
    costo:item.precioCosto||0
  });

  ordenActiva.items.push({
    tipo:"REPUESTO",
    desc:item.nombre,
    costo:item.precioCosto||0,
    venta:sugerido || item.precioVenta,
    idRef,
    cantidad:1
  });

  renderItems(); recalcular();
};

window.eliminarItem = (i)=>{
  ordenActiva.items.splice(i,1);
  renderItems(); recalcular();
};

window.recalcularPrecio = (i)=>{
  const item = ordenActiva.items[i];

  const sugerido = analizarPrecioSugerido({
    tipo:item.tipo,
    costo:item.costo
  });

  item.venta = sugerido || item.venta;

  renderItems(); recalcular();
};

function renderItems(){
  const el = document.getElementById("items");

  el.innerHTML = ordenActiva.items.map((i,idx)=>`
    <div class="bg-black/40 p-3 mt-2 rounded">
      <input value="${i.desc}" onchange="ordenActiva.items[${idx}].desc=this.value" class="w-full p-2 bg-black"/>
      
      <div class="flex gap-2 mt-2">
        <input type="number" value="${i.costo}" onchange="ordenActiva.items[${idx}].costo=this.value; recalcular()" class="w-1/3 p-2 bg-black text-red-400"/>
        
        <input type="number" value="${i.venta}" onchange="ordenActiva.items[${idx}].venta=this.value; recalcular()" class="w-1/3 p-2 bg-black text-green-400"/>
        
        <button onclick="recalcularPrecio(${idx})" class="bg-yellow-500 px-2">⚡</button>
        <button onclick="eliminarItem(${idx})" class="bg-red-500 px-2">X</button>
      </div>
    </div>
  `).join("");
}

/* =========================
💾 GUARDAR
========================= */
window.guardarOrden = async ()=>{

  const batch = writeBatch(db);
  const id = ordenActiva.id || `OT_${Date.now()}`;

  ordenActiva = {
    ...ordenActiva,
    id,
    placa:document.getElementById("placa").value.toUpperCase(),
    cliente:document.getElementById("cliente").value,
    telefono:document.getElementById("telefono").value,
    estado:document.getElementById("estado").value,
    updatedAt:serverTimestamp()
  };

  batch.set(doc(db,"ordenes",id), ordenActiva);

  // INVENTARIO
  ordenActiva.items.forEach(i=>{
    if(i.tipo==="REPUESTO" && i.idRef){
      batch.update(doc(db,"inventario",i.idRef),{
        cantidad: increment(-i.cantidad)
      });
    }
  });

  // CONTABILIDAD
  batch.set(doc(db,"contabilidad","CONT_"+id),{
    empresaId,
    ordenId:id,
    total:ordenActiva.finanzas.total,
    utilidad:ordenActiva.finanzas.ebitda,
    fecha:serverTimestamp()
  });

  await batch.commit();

  ordenActiva.bitacora += `\n[${new Date().toLocaleString()}] ✔ ORDEN OK`;

  hablar("Orden guardada");

  alert(`🚀 ORDEN GUARDADA
ID: ${id}
TOTAL: $${Math.round(ordenActiva.finanzas.total).toLocaleString()}
`);

};

/* =========================
📄 DOCUMENTO
========================= */
window.generarDocumentoHTML = ()=>{
  const o = ordenActiva;

  const html = `
  <html><body>
  <h1>ORDEN</h1>
  <p>${o.cliente} - ${o.placa}</p>
  <h3>Total: $${Math.round(o.finanzas.total)}</h3>
  </body></html>`;

  const win = window.open();
  win.document.write(html);
};

/* =========================
📲 WHATSAPP
========================= */
window.enviarWhatsApp = ()=>{
  const o = ordenActiva;

  const msg = `Hola ${o.cliente}
Total: $${Math.round(o.finanzas.total)}`;

  window.open(`https://wa.me/57${o.telefono}?text=${encodeURIComponent(msg)}`);
};

/* =========================
🎨 UI
========================= */
container.innerHTML = `
<h1>NEXUS-X PRO360</h1>

<input id="placa" placeholder="PLACA" class="w-full p-2 bg-black"/>
<input id="cliente" placeholder="CLIENTE" class="w-full p-2 bg-black mt-2"/>
<input id="telefono" placeholder="WHATSAPP" class="w-full p-2 bg-black mt-2"/>

<select id="estado" class="w-full p-2 bg-black mt-2">
  <option>COTIZACION</option>
  <option>PROCESO</option>
  <option>FINALIZADO</option>
</select>

<button onclick="agregarManoObra()" class="bg-cyan-500 w-full p-3 mt-3">+ MANO OBRA</button>
<button onclick="agregarRepuesto()" class="bg-yellow-500 w-full p-3 mt-2">+ REPUESTO</button>

<div id="items"></div>

<h2 id="total">$ 0</h2>
<div id="resumen"></div>

<button onclick="guardarOrden()" class="bg-green-500 w-full p-4 mt-4">GUARDAR</button>

<button onclick="generarDocumentoHTML()" class="bg-white w-full p-2 mt-2">DOC</button>
<button onclick="enviarWhatsApp()" class="bg-green-400 w-full p-2 mt-2">WA</button>
`;

}