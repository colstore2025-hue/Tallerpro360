/**
🔥 NEXUS-X v18 - CORE OPERATIVO (MODO ERP)
✔ Flujo obligatorio
✔ IA base
✔ Control total del proceso
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

let orden = {
  id:null,
  estado:"INGRESO",
  placa:"",
  cliente:"",
  telefono:"",
  checklist:{},
  diagnostico:"",
  items:[],
  finanzas:{total:0, base:0, iva:0, ebitda:0},
  bitacora:""
};

/* =========================
🧠 MOTOR DE ESTADOS
========================= */
const estados = [
  "INGRESO",
  "DIAGNOSTICO",
  "COTIZACION",
  "APROBADO",
  "PROCESO",
  "FINALIZADO"
];

const avanzarEstado = ()=>{
  const idx = estados.indexOf(orden.estado);
  if(idx < estados.length-1){
    orden.estado = estados[idx+1];
    hablar("Estado actualizado a " + orden.estado);
    render();
  }
};

/* =========================
🛡 CHECKLIST OBLIGATORIO
========================= */
const guardarChecklist = ()=>{
  orden.checklist = {
    combustible: document.getElementById("combustible").value,
    fotos: true,
    observaciones: document.getElementById("obs").value
  };

  orden.bitacora += `\n✔ Checklist completado`;
  avanzarEstado();
};

/* =========================
🧠 IA DIAGNOSTICO
========================= */
const analizarDiagnostico = ()=>{

  const texto = orden.diagnostico.toUpperCase();

  // 🔥 Inteligencia básica (expandible)
  if(texto.includes("FRENO")){
    insertarItemIA("REVISION FRENOS", 20000);
  }

  if(texto.includes("ACEITE")){
    insertarItemIA("CAMBIO DE ACEITE", 30000);
  }

  if(texto.includes("BATERIA")){
    insertarItemIA("REVISION BATERIA", 15000);
  }

  hablar("Diagnóstico analizado");
};

const insertarItemIA = (desc, costo)=>{

  const precio = analizarPrecioSugerido({
    tipo:"servicio",
    costo
  }) || costo*2;

  orden.items.push({
    tipo:"IA",
    desc,
    costo,
    venta:precio
  });
};

/* =========================
💰 FINANZAS AUTOMÁTICAS
========================= */
const recalcular = ()=>{

  let venta=0, costo=0;

  orden.items.forEach(i=>{
    venta += Number(i.venta||0);
    costo += Number(i.costo||0);
  });

  const base = venta/1.19;
  const iva = venta-base;
  const ebitda = base-costo;

  orden.finanzas = {total:venta, base, iva, ebitda};

  document.getElementById("total").innerText =
    "$ " + Math.round(venta).toLocaleString();
};

/* =========================
🎯 UI POR ESTADO
========================= */
const render = ()=>{

  let html = `<h1>NEXUS-X v18</h1>
  <h3>Estado: ${orden.estado}</h3>`;

  /* ===== INGRESO ===== */
  if(orden.estado==="INGRESO"){
    html += `
      <input id="placa" placeholder="PLACA"/>
      <input id="cliente" placeholder="CLIENTE"/>

      <select id="combustible">
        <option>VACIO</option>
        <option>MEDIO</option>
        <option>LLENO</option>
      </select>

      <textarea id="obs" placeholder="OBS"></textarea>

      <button onclick="guardarChecklist()">CONTINUAR</button>
    `;
  }

  /* ===== DIAGNOSTICO ===== */
  if(orden.estado==="DIAGNOSTICO"){
    html += `
      <textarea id="diag" placeholder="ESCRIBE DIAGNOSTICO"></textarea>

      <button onclick="
        orden.diagnostico=document.getElementById('diag').value;
        analizarDiagnostico();
        avanzarEstado();
      ">ANALIZAR</button>
    `;
  }

  /* ===== COTIZACION ===== */
  if(orden.estado==="COTIZACION"){
    html += `
      <button onclick="agregarManual()">+ ITEM MANUAL</button>
      <div id="items"></div>

      <button onclick="aprobar()">APROBAR</button>
    `;
  }

  /* ===== PROCESO ===== */
  if(orden.estado==="PROCESO"){
    html += `<h2>Trabajando...</h2>
    <button onclick="avanzarEstado()">FINALIZAR</button>`;
  }

  /* ===== FINAL ===== */
  if(orden.estado==="FINALIZADO"){
    html += `
      <h2>Total: $${Math.round(orden.finanzas.total)}</h2>
      <button onclick="guardarTodo()">CERRAR ORDEN</button>
    `;
  }

  html += `<h2 id="total">$0</h2>`;

  container.innerHTML = html;

  renderItems();
  recalcular();
};

/* =========================
➕ ITEMS MANUALES
========================= */
window.agregarManual = ()=>{
  orden.items.push({
    tipo:"MANUAL",
    desc:"SERVICIO",
    costo:0,
    venta:0
  });
  renderItems();
};

window.eliminarItem = (i)=>{
  orden.items.splice(i,1);
  renderItems();
};

function renderItems(){
  const el = document.getElementById("items");
  if(!el) return;

  el.innerHTML = orden.items.map((i,idx)=>`
    <div>
      ${i.desc} - $${i.venta}
      <button onclick="eliminarItem(${idx})">X</button>
    </div>
  `).join("");
}

/* =========================
💾 CIERRE TOTAL AUTOMÁTICO
========================= */
window.guardarTodo = async ()=>{

  const batch = writeBatch(db);
  const id = `OT_${Date.now()}`;

  orden.id = id;

  batch.set(doc(db,"ordenes",id),{
    ...orden,
    empresaId,
    fecha:serverTimestamp()
  });

  // INVENTARIO
  orden.items.forEach(i=>{
    if(i.idRef){
      batch.update(doc(db,"inventario",i.idRef),{
        cantidad: increment(-1)
      });
    }
  });

  // CONTABILIDAD
  batch.set(doc(db,"contabilidad","CONT_"+id),{
    total:orden.finanzas.total,
    utilidad:orden.finanzas.ebitda,
    fecha:serverTimestamp()
  });

  await batch.commit();

  hablar("Orden finalizada");

  alert("🚀 SISTEMA COMPLETO OK");
};

/* =========================
🔥 INIT
========================= */
render();

}

/* =====================================================
🧩 GESTIÓN DE ITEMS (REAL)
===================================================== */

// ➕ AGREGAR MANO DE OBRA
window.agregarManoObra = () => {

  const sugerido = analizarPrecioSugerido({
    tipo: "mano_obra",
    costo: 0,
    categoria: "general"
  }) || 50000;

  ordenActiva.items.push({
    tipo: "MANO_OBRA",
    desc: "Servicio técnico",
    costo: 0,
    venta: sugerido,
    cantidad: 1
  });

  renderItems();
  recalcular();
};


// 🔎 BUSCAR REPUESTO REAL EN FIRESTORE
window.buscarRepuesto = async () => {

  const termino = prompt("Buscar repuesto...");
  if(!termino) return;

  const q = query(
    collection(db, "inventario"),
    where("empresaId", "==", empresaId)
  );

  const snap = await getDocs(q);

  const resultados = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p =>
      (p.nombre || "").toUpperCase().includes(termino.toUpperCase())
    );

  if(resultados.length === 0){
    alert("❌ No encontrado");
    return;
  }

  const p = resultados[0];

  if((p.cantidad || 0) <= 0){
    alert("⚠️ Sin stock");
    return;
  }

  const sugerido = analizarPrecioSugerido({
    tipo: "repuesto",
    costo: p.precioCosto || 0
  }) || p.precioVenta;

  ordenActiva.items.push({
    tipo: "REPUESTO",
    desc: p.nombre,
    costo: p.precioCosto || 0,
    venta: sugerido,
    cantidad: 1,
    idRef: p.id
  });

  renderItems();
  recalcular();
};


/* =====================================================
🧠 PRICING EN TIEMPO REAL
===================================================== */

const recalcularItem = (idx) => {

  const item = ordenActiva.items[idx];

  const sugerido = analizarPrecioSugerido({
    tipo: item.tipo === "REPUESTO" ? "repuesto" : "mano_obra",
    costo: Number(item.costo || 0)
  });

  if(sugerido){
    item.venta = sugerido;
  }

  recalcular();
};


/* =====================================================
🧾 RENDER REAL DE ITEMS (EDITABLE + ELIMINAR)
===================================================== */

window.renderItems = () => {

  const cont = document.getElementById("items");

  if(!cont) return;

  cont.innerHTML = ordenActiva.items.map((i, idx) => `

    <div class="bg-black/40 p-4 mt-3 rounded-xl border border-white/10">

      <div class="flex gap-2 mb-2">

        <input 
          value="${i.desc}" 
          onchange="ordenActiva.items[${idx}].desc=this.value"
          class="flex-1 bg-black p-2"
        />

        <input 
          type="number"
          value="${i.costo}"
          placeholder="Costo"
          class="w-24 bg-black p-2 text-red-400"
          onchange="ordenActiva.items[${idx}].costo=this.value; recalcularItem(${idx})"
        />

        <input 
          type="number"
          value="${i.venta}"
          placeholder="Venta"
          class="w-24 bg-black p-2 text-green-400"
          onchange="ordenActiva.items[${idx}].venta=this.value; recalcular()"
        />

      </div>

      <div class="flex justify-between text-xs">

        <div class="text-green-400">
          ✔ Margen: $${Math.round((i.venta||0)-(i.costo||0))}
        </div>

        <div class="flex gap-2">

          <button onclick="recalcularItem(${idx})"
            class="bg-cyan-500 px-2 rounded text-black">
            ⚡ IA
          </button>

          <button onclick="eliminarItem(${idx})"
            class="bg-red-500 px-2 rounded text-white">
            🗑
          </button>

        </div>

      </div>

    </div>

  `).join('');
};


/* =====================================================
❌ ELIMINAR ITEM
===================================================== */

window.eliminarItem = (idx) => {

  ordenActiva.items.splice(idx, 1);

  renderItems();
  recalcular();
};


/* =====================================================
📦 DESCONTAR STOCK REAL
===================================================== */

const descontarStock = (batch) => {

  ordenActiva.items.forEach(item => {

    if(item.tipo === "REPUESTO" && item.idRef){

      const ref = doc(db, "inventario", item.idRef);

      batch.update(ref, {
        cantidad: increment(-item.cantidad)
      });

    }

  });
};


/* =====================================================
🎛 BOTONES REALES EN UI
===================================================== */

setTimeout(() => {

  const cont = document.getElementById("items");

  if(cont){

    cont.insertAdjacentHTML("beforebegin", `

      <div class="flex gap-2 mt-4">

        <button onclick="agregarManoObra()"
          class="bg-blue-500 text-white p-3 rounded w-full font-bold">
          + MANO DE OBRA
        </button>

        <button onclick="buscarRepuesto()"
          class="bg-yellow-500 text-black p-3 rounded w-full font-bold">
          + REPUESTO
        </button>

      </div>

    `);
  }

}, 500);

/* =====================================================
🧠 BITÁCORA AUTOMÁTICA PRO360
===================================================== */

const agregarBitacora = (msg) => {

  const fecha = new Date().toLocaleString();

  ordenActiva.bitacora = (ordenActiva.bitacora || "") +
    `\n[${fecha}] ${msg}`;

};


/* =====================================================
📊 CONTABILIDAD AUTOMÁTICA
===================================================== */

const registrarContabilidad = (batch, orden) => {

  const ref = doc(db, "contabilidad", `CONT_${orden.id}`);

  batch.set(ref, {
    empresaId,
    ordenId: orden.id,
    placa: orden.placa,
    cliente: orden.cliente,

    total: orden.finanzas.total,
    base: orden.finanzas.base,
    iva: orden.finanzas.iva,
    utilidad: orden.finanzas.ebitda,

    fecha: serverTimestamp()
  });
};


/* =====================================================
💾 GUARDADO TOTAL (EL BUENO)
===================================================== */

window.guardarOrden = async () => {

  try {

    if(!ordenActiva){
      alert("❌ No hay orden activa");
      return;
    }

    const placa = document.getElementById("placa")?.value || "";
    const cliente = document.getElementById("cliente")?.value || "";

    if(!placa){
      alert("⚠️ Falta placa");
      return;
    }

    const btn = document.getElementById("btnGuardar");

    if(btn){
      btn.disabled = true;
      btn.innerText = "GUARDANDO...";
    }

    const batch = writeBatch(db);

    const id = ordenActiva.id || `OT_${placa}_${Date.now()}`;

    // 🔥 actualizar objeto completo
    ordenActiva = {
      ...ordenActiva,
      id,
      empresaId,
      placa: placa.toUpperCase(),
      cliente,
      telefono: document.getElementById("telefono")?.value || "",
      estado: document.getElementById("estado")?.value || "INGRESO",
      updatedAt: serverTimestamp()
    };

    // 🧠 BITÁCORA
    agregarBitacora("Orden guardada en sistema");
    agregarBitacora(`Estado actual: ${ordenActiva.estado}`);
    agregarBitacora(`Items: ${ordenActiva.items.length}`);

    // 💾 GUARDAR ORDEN
    batch.set(doc(db, "ordenes", id), ordenActiva);

    // 📦 INVENTARIO
    descontarStock(batch);

    // 💰 CONTABILIDAD
    registrarContabilidad(batch, ordenActiva);

    await batch.commit();

    // 🎯 FEEDBACK REAL
    hablar("Orden guardada correctamente");

    alert(`
🚀 ORDEN GUARDADA OK

ID: ${id}
Cliente: ${ordenActiva.cliente}
Total: $${Math.round(ordenActiva.finanzas.total).toLocaleString()}
Items: ${ordenActiva.items.length}
    `);

    console.log("ORDEN COMPLETA:", ordenActiva);

    // 🔄 refrescar UI
    if(typeof cargarParrilla === "function"){
      cargarParrilla();
    }

    if(btn){
      btn.disabled = false;
      btn.innerText = "GUARDAR";
    }

  } catch(e){

    console.error(e);

    alert("❌ ERROR guardando orden");

    const btn = document.getElementById("btnGuardar");
    if(btn){
      btn.disabled = false;
      btn.innerText = "GUARDAR";
    }
  }
};


/* =====================================================
📡 TRACKING VISUAL (ESTADOS)
===================================================== */

window.cambiarEstado = (nuevoEstado) => {

  if(!ordenActiva) return;

  ordenActiva.estado = nuevoEstado;

  agregarBitacora(`Cambio de estado → ${nuevoEstado}`);

  const el = document.getElementById("estado");
  if(el) el.value = nuevoEstado;

};


/* =====================================================
📊 PANEL RÁPIDO DE ESTADO
===================================================== */

setTimeout(() => {

  const cont = document.getElementById("resumen");

  if(cont){

    cont.insertAdjacentHTML("beforebegin", `

      <div class="grid grid-cols-4 gap-2 mt-4">

        <button onclick="cambiarEstado('COTIZACION')"
          class="bg-gray-500 text-white p-2 rounded text-xs">
          COTIZACIÓN
        </button>

        <button onclick="cambiarEstado('INGRESO')"
          class="bg-blue-500 text-white p-2 rounded text-xs">
          INGRESO
        </button>

        <button onclick="cambiarEstado('PROCESO')"
          class="bg-yellow-500 text-black p-2 rounded text-xs">
          PROCESO
        </button>

        <button onclick="cambiarEstado('FINALIZADO')"
          class="bg-green-500 text-white p-2 rounded text-xs">
          FINALIZADO
        </button>

      </div>

    `);
  }

}, 500);


/* =====================================================
🔔 LOG FINAL AUTOMÁTICO
===================================================== */

const cerrarOperacion = () => {

  agregarBitacora("✔ ORDEN SINCRONIZADA OK");

  console.log("🚀 SISTEMA COMPLETO OK");

};
