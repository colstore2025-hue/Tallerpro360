/**
 * 🚀 NEXUS-X PRO360 - ORDENES (BLOQUE 1 CORE ESTABLE)
 * ✔ UI PRO
 * ✔ MODELO UNIFICADO
 * ✔ COTIZACIÓN AVANZADA
 * ✔ CHECKLIST INGRESO
 * ✔ PRICING ENGINE INTEGRADO
 */

import {
  collection, query, where, onSnapshot,
  doc, getDoc, getDocs,
  setDoc, updateDoc,
  serverTimestamp, writeBatch, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

export default async function ordenes(container){

const empresaId = localStorage.getItem("nexus_empresaId");
let ordenActiva = null;

/* =====================================================
🧱 MODELO UNIFICADO
===================================================== */
const crearOrdenBase = () => ({
  id: null,
  empresaId,

  placa: '',
  estado: 'COTIZACION',

  cliente: '',
  telefono: '',
  identificacion: '',

  vehiculo: {
    marca: '',
    linea: '',
    modelo: '',
    km: ''
  },

  cotizacion: {
    falla: '',
    prioridad: 'MEDIA',
    fechaPromesa: '',
    asesor: ''
  },

  checklist: {
    combustible: 'MEDIO',
    documentos: false,
    herramientas: false,
    rayones: false,
    luces: true,
    testigos: true,
    observaciones: ''
  },

  items: [],

  finanzas: {
    total: 0,
    base: 0,
    iva: 0,
    saldo: 0,
    ebitda: 0
  },

  bitacora: '',
  firma: null,

  createdAt: null,
  updatedAt: null
});

/* =====================================================
💰 MOTOR FINANCIERO PRO360
===================================================== */
const recalcularFinanzas = () => {
  if(!ordenActiva) return;

  let venta = 0;
  let costo = 0;

  ordenActiva.items.forEach(i=>{
    venta += Number(i.venta || 0);
    costo += Number(i.costo || 0);
  });

  const base = venta / 1.19;
  const iva = venta - base;
  const ebitda = base - costo;

  ordenActiva.finanzas = {
    total: venta,
    base,
    iva,
    saldo: venta,
    ebitda
  };

  pintarFinanzas();
  renderItems();
};

const pintarFinanzas = () => {
  const t = ordenActiva.finanzas;

  document.getElementById("total").innerText =
    `$ ${Math.round(t.total).toLocaleString()}`;

  document.getElementById("resumen").innerHTML = `
    <div class="text-green-400 font-bold">✔ EXCELENTE OPERACIÓN</div>
    <div>Base: $${Math.round(t.base).toLocaleString()}</div>
    <div>IVA: $${Math.round(t.iva).toLocaleString()}</div>
    <div class="text-green-400 font-bold">
      ✔ EBITDA: $${Math.round(t.ebitda).toLocaleString()}
    </div>
  `;
};

/* =====================================================
🧾 MODO COTIZACIÓN AVANZADA
===================================================== */
const renderCotizacion = () => `
<div class="bg-black/40 p-4 rounded-xl border border-green-500/20">
  <div class="text-green-400 font-bold mb-2">✔ DATOS COTIZACIÓN PRO</div>

  <textarea id="falla" placeholder="FALLA REPORTADA"
    class="w-full bg-black p-3 mb-3 rounded"></textarea>

  <select id="prioridad" class="w-full bg-black p-3 mb-3">
    <option>BAJA</option>
    <option selected>MEDIA</option>
    <option>ALTA</option>
  </select>

  <input id="fechaPromesa" type="date"
    class="w-full bg-black p-3 mb-3"/>

  <input id="asesor" placeholder="ASESOR"
    class="w-full bg-black p-3"/>
</div>
`;

/* =====================================================
🛡 CHECKLIST INGRESO (PROTECCIÓN LEGAL)
===================================================== */
const renderChecklist = () => `
<div class="bg-black/40 p-4 rounded-xl border border-green-500/20">
  <div class="text-green-400 font-bold mb-2">✔ CHECKLIST INGRESO</div>

  <label>Combustible</label>
  <select id="combustible" class="w-full bg-black p-2 mb-3">
    <option>VACIO</option>
    <option selected>MEDIO</option>
    <option>LLENO</option>
  </select>

  <label><input type="checkbox" id="doc"/> Documentos OK</label><br>
  <label><input type="checkbox" id="herr"/> Herramientas</label><br>
  <label><input type="checkbox" id="ray"/> Rayones visibles</label><br>

  <textarea id="obs" placeholder="OBSERVACIONES"
    class="w-full bg-black p-3 mt-3"></textarea>
</div>
`;

/* =====================================================
🎨 UI PRINCIPAL
===================================================== */
const renderUI = () => {
  container.innerHTML = `
  <div class="p-6 bg-[#05070a] min-h-screen text-white">

    <h1 class="text-4xl font-black mb-6 text-cyan-400">
      NEXUS-X PRO360
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- IZQUIERDA -->
      <div class="space-y-4">

        <input id="placa" placeholder="PLACA"
          class="w-full bg-black p-4 text-2xl uppercase rounded"/>

        <input id="cliente" placeholder="CLIENTE"
          class="w-full bg-black p-3 rounded"/>

        <input id="telefono" placeholder="WHATSAPP"
          class="w-full bg-black p-3 rounded"/>

        <select id="estado" class="w-full bg-black p-3 rounded">
          <option>COTIZACION</option>
          <option>INGRESO</option>
          <option>DIAGNOSTICO</option>
          <option>REPARACION</option>
          <option>LISTO</option>
          <option>ENTREGADO</option>
        </select>

        <div id="modoExtra"></div>

      </div>

      <!-- CENTRO -->
      <div>

        <div id="items" class="space-y-3"></div>

        <button onclick="addItem()"
          class="bg-cyan-500 text-black w-full p-3 mt-4 rounded font-bold">
          + MANO DE OBRA
        </button>

      </div>

      <!-- DERECHA -->
      <div>

        <div id="pricing-box"
          class="bg-black/40 p-4 rounded mb-4"></div>

        <div id="total" class="text-3xl font-black">$ 0</div>
        <div id="resumen" class="text-sm mt-2"></div>

        <button onclick="guardarOrden()"
          class="bg-green-500 text-black w-full p-4 mt-4 rounded font-bold">
          GUARDAR ORDEN
        </button>

      </div>

    </div>

  </div>
  `;

  renderModuloPricing(document.getElementById("pricing-box"));
  renderModo();
  recalcularFinanzas();
};

/* =====================================================
🔄 CAMBIO DE MODO (COTIZACION / INGRESO)
===================================================== */
const renderModo = () => {
  const cont = document.getElementById("modoExtra");

  const estado = document.getElementById("estado")?.value || ordenActiva.estado;

  if(estado === 'COTIZACION'){
    cont.innerHTML = renderCotizacion();
  } else if(estado === 'INGRESO'){
    cont.innerHTML = renderChecklist();
  } else {
    cont.innerHTML = '';
  }
};

/* =====================================================
➕ ITEMS + PRICING IA
===================================================== */
window.addItem = () => {

  const sugerido = analizarPrecioSugerido({
    tipo: "mano_obra",
    costo: 0
  });

  ordenActiva.items.push({
    tipo: 'MANO_OBRA',
    desc: 'SERVICIO',
    costo: 0,
    venta: sugerido || 0
  });

  renderItems();
  recalcularFinanzas();
};

window.renderItems = () => {
  const el = document.getElementById("items");

  el.innerHTML = ordenActiva.items.map((i,idx)=>`
    <div class="bg-black/40 p-3 rounded">

      <input value="${i.desc}"
        onchange="ordenActiva.items[${idx}].desc=this.value"
        class="w-full bg-black p-2 mb-2"/>

      <div class="flex gap-2">
        <input type="number" value="${i.costo}"
          onchange="ordenActiva.items[${idx}].costo=this.value; recalcularFinanzas()"
          class="w-1/2 bg-black p-2 text-red-400"/>

        <input type="number" value="${i.venta}"
          onchange="ordenActiva.items[${idx}].venta=this.value; recalcularFinanzas()"
          class="w-1/2 bg-black p-2 text-green-400"/>
      </div>

      <div class="text-green-400 text-xs mt-1">
        ✔ Margen: $${Math.round((i.venta||0)-(i.costo||0))}
      </div>

    </div>
  `).join('');
};

/* =====================================================
💾 GUARDAR BASE
===================================================== */
window.guardarOrden = async () => {

  const batch = writeBatch(db);

  const id = ordenActiva.id || `OT_${Date.now()}`;

  ordenActiva = {
    ...ordenActiva,
    id,
    empresaId,
    placa: document.getElementById("placa").value.toUpperCase(),
    cliente: document.getElementById("cliente").value,
    telefono: document.getElementById("telefono").value,
    estado: document.getElementById("estado").value,
    updatedAt: serverTimestamp()
  };

  batch.set(doc(db,"ordenes",id), ordenActiva);

  await batch.commit();

  hablar("Orden guardada correctamente");
};

/* =====================================================
🚀 INIT
===================================================== */
ordenActiva = crearOrdenBase();
renderUI();

}

/* =====================================================
🔎 BUSCADOR INVENTARIO REAL (LUPA PRO)
===================================================== */
window.buscarRepuesto = async () => {

  const termino = prompt("🔍 Buscar repuesto...");
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
    alert("❌ No encontrado en inventario");
    return;
  }

  // Selección simple (luego puedes mejorar a modal UI)
  const prod = resultados[0];

  if((prod.cantidad || 0) <= 0){
    alert("⚠️ SIN STOCK");
    return;
  }

  const sugerido = analizarPrecioSugerido({
    tipo: "repuesto",
    costo: prod.precioCosto || 0
  });

  ordenActiva.items.push({
    tipo: 'REPUESTO',
    desc: prod.nombre,
    costo: prod.precioCosto || 0,
    venta: sugerido || prod.precioVenta || 0,
    idRef: prod.id,
    cantidad: 1
  });

  agregarBitacora(`Repuesto agregado: ${prod.nombre}`);

  renderItems();
  recalcularFinanzas();
};

/* =====================================================
📦 DESCUENTO AUTOMÁTICO STOCK
===================================================== */
const descontarStock = (batch) => {

  ordenActiva.items.forEach(item => {

    if(item.tipo === 'REPUESTO' && item.idRef){

      const ref = doc(db, "inventario", item.idRef);

      batch.update(ref, {
        cantidad: increment(-(item.cantidad || 1))
      });

    }

  });
};

/* =====================================================
🧾 MEJORAR ITEMS (TIPOS + ELIMINAR)
===================================================== */
window.renderItems = () => {

  const el = document.getElementById("items");

  el.innerHTML = ordenActiva.items.map((i,idx)=>`

    <div class="bg-black/40 p-4 rounded-xl border border-white/10">

      <div class="flex justify-between items-center mb-2">
        <span class="text-xs text-cyan-400 font-bold">
          ${i.tipo || 'ITEM'}
        </span>

        <button onclick="removeItem(${idx})"
          class="text-red-500 text-xs">✕</button>
      </div>

      <input value="${i.desc}"
        onchange="ordenActiva.items[${idx}].desc=this.value"
        class="w-full bg-black p-2 mb-2"/>

      <div class="flex gap-2">
        <input type="number" value="${i.costo}"
          onchange="ordenActiva.items[${idx}].costo=this.value; recalcularFinanzas()"
          class="w-1/2 bg-black p-2 text-red-400"
          placeholder="Costo"/>

        <input type="number" value="${i.venta}"
          onchange="ordenActiva.items[${idx}].venta=this.value; recalcularFinanzas()"
          class="w-1/2 bg-black p-2 text-green-400"
          placeholder="Venta"/>
      </div>

      <div class="text-green-400 text-xs mt-2">
        ✔ Margen: $${Math.round((i.venta||0)-(i.costo||0))}
      </div>

    </div>

  `).join('');
};

window.removeItem = (idx) => {
  ordenActiva.items.splice(idx,1);
  recalcularFinanzas();
};

/* =====================================================
🧠 BITÁCORA INTELIGENTE (ESPONJA TOTAL)
===================================================== */
const agregarBitacora = (texto) => {

  const timestamp = new Date().toLocaleString();

  ordenActiva.bitacora += `\n[${timestamp}] ${texto}`;

};

/* =====================================================
🎤 VOZ BITÁCORA (MEJORADA)
===================================================== */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

window.dictarBitacora = () => {

  if(!recognition){
    alert("Voz no disponible");
    return;
  }

  hablar("Dicta el hallazgo técnico");

  recognition.start();

  recognition.onresult = (e) => {

    const txt = e.results[0][0].transcript.toUpperCase();

    agregarBitacora(txt);

    hablar("Bitácora actualizada");

  };
};

/* =====================================================
🔘 BOTONES NUEVOS EN UI
===================================================== */
setTimeout(()=>{

  const cont = document.getElementById("items");

  if(cont){
    cont.insertAdjacentHTML("beforebegin", `

      <div class="flex gap-2 mb-3">

        <button onclick="buscarRepuesto()"
          class="bg-yellow-500 text-black px-4 py-2 rounded font-bold">
          🔎 INVENTARIO
        </button>

        <button onclick="addItem()"
          class="bg-cyan-500 text-black px-4 py-2 rounded font-bold">
          ➕ MANO OBRA
        </button>

        <button onclick="dictarBitacora()"
          class="bg-white text-black px-4 py-2 rounded font-bold">
          🎤 BITÁCORA
        </button>

      </div>

    `);
  }

},500);

/* =====================================================
💾 GUARDAR (ACTUALIZADO CON STOCK)
===================================================== */
window.guardarOrden = async () => {

  const batch = writeBatch(db);

  const id = ordenActiva.id || `OT_${Date.now()}`;

  ordenActiva = {
    ...ordenActiva,
    id,
    empresaId,
    placa: document.getElementById("placa").value.toUpperCase(),
    cliente: document.getElementById("cliente").value,
    telefono: document.getElementById("telefono").value,
    estado: document.getElementById("estado").value,
    updatedAt: serverTimestamp()
  };

  batch.set(doc(db,"ordenes",id), ordenActiva);

  // 🔥 STOCK
  descontarStock(batch);

  await batch.commit();

  hablar("Orden guardada con inventario actualizado");

  alert("✔ ORDEN + STOCK OK");

};

/* =====================================================
💰 CONTABILIDAD AUTOMÁTICA
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
📄 DOCUMENTO HTML PRO
===================================================== */
window.generarDocumentoHTML = () => {

  const o = ordenActiva;
  if(!o) return;

  const itemsHTML = o.items.map(i=>`
    <tr>
      <td>${i.desc}</td>
      <td>${i.tipo}</td>
      <td>$${Number(i.costo).toLocaleString()}</td>
      <td>$${Number(i.venta).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
  <html>
  <head>
    <title>Orden ${o.placa}</title>
    <style>
      body{font-family:Arial;padding:40px;background:#f5f5f5;}
      .card{background:white;padding:30px;border-radius:20px;}
      table{width:100%;margin-top:20px;border-collapse:collapse;}
      td,th{padding:10px;border-bottom:1px solid #ddd;}
      .total{font-size:24px;font-weight:bold;text-align:right;}
      .ok{color:green;font-weight:bold;}
    </style>
  </head>

  <body>
    <div class="card">
      <h1>ORDEN DE TRABAJO</h1>

      <p><b>Cliente:</b> ${o.cliente}</p>
      <p><b>Placa:</b> ${o.placa}</p>
      <p><b>Estado:</b> ${o.estado}</p>

      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Tipo</th>
            <th>Costo</th>
            <th>Venta</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <div class="total">
        TOTAL: $${Math.round(o.finanzas.total).toLocaleString()}
      </div>

      <h3>Bitácora</h3>
      <pre>${o.bitacora || 'Sin registros'}</pre>

      <p class="ok">✔ Documento generado por PRO360</p>
    </div>
  </body>
  </html>
  `;

  const win = window.open();
  win.document.write(html);
  win.document.close();
};

/* =====================================================
📲 WHATSAPP CLIENTE
===================================================== */
window.enviarWhatsApp = () => {

  const o = ordenActiva;

  if(!o.telefono){
    alert("Falta teléfono");
    return;
  }

  const mensaje = `
Hola ${o.cliente},

Tu vehículo (${o.placa}) está en estado: ${o.estado}

💰 Total: $${Math.round(o.finanzas.total).toLocaleString()}

🔧 Detalle:
${o.items.map(i=>`- ${i.desc}: $${i.venta}`).join('\n')}

📝 Bitácora:
${o.bitacora || 'Sin novedades'}

Gracias por confiar en nosotros.
TallerPRO360 🚀
`;

  const url = `https://wa.me/57${o.telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
};

/* =====================================================
✍️ FIRMA DIGITAL
===================================================== */
window.guardarFirma = () => {

  const nombre = prompt("Nombre de quien recibe:");
  if(!nombre) return;

  ordenActiva.firma = {
    nombre: nombre.toUpperCase(),
    fecha: new Date().toISOString()
  };

  agregarBitacora(`Firma registrada: ${nombre}`);

  alert("✔ Firma guardada");
};

/* =====================================================
📊 RESUMEN GERENCIAL
===================================================== */
window.generarResumen = () => {

  const o = ordenActiva;

  const costoTotal = o.items.reduce((acc,i)=>acc + Number(i.costo||0),0);

  const utilidad = o.finanzas.total - costoTotal;

  alert(`
📊 RESUMEN PRO360

Cliente: ${o.cliente}
Vehículo: ${o.placa}

Total: $${Math.round(o.finanzas.total).toLocaleString()}
Utilidad: $${Math.round(utilidad).toLocaleString()}

Items: ${o.items.length}
Estado: ${o.estado}
  `);
};

/* =====================================================
🔘 BOTONES FINALES UI
===================================================== */
setTimeout(()=>{

  const panel = document.getElementById("resumen");

  if(panel){
    panel.insertAdjacentHTML("afterend", `

      <div class="grid grid-cols-2 gap-2 mt-6">

        <button onclick="generarDocumentoHTML()"
          class="bg-white text-black p-3 rounded font-bold">
          📄 DOC
        </button>

        <button onclick="enviarWhatsApp()"
          class="bg-green-500 text-white p-3 rounded font-bold">
          📲 WA
        </button>

        <button onclick="guardarFirma()"
          class="bg-yellow-500 text-black p-3 rounded font-bold">
          ✍️ FIRMA
        </button>

        <button onclick="generarResumen()"
          class="bg-cyan-500 text-black p-3 rounded font-bold">
          📊 RESUMEN
        </button>

      </div>

    `);
  }

},800);

/* =====================================================
💾 GUARDAR FINAL (CON CONTABILIDAD)
===================================================== */
window.guardarOrden = async () => {

  try {

    const batch = writeBatch(db);

    const id = ordenActiva.id || `OT_${Date.now()}`;

    // 🔥 NORMALIZAR BITÁCORA
    if(!ordenActiva.bitacora) ordenActiva.bitacora = "";

    // 🔔 BITÁCORA GLOBAL (ANTES DE GUARDAR)
    ordenActiva.bitacora += `\n[${new Date().toLocaleString()}] ✔ ORDEN SINCRONIZADA OK`;

    // 🔥 CAPTURA DE CAMPOS UI
    ordenActiva = {
      ...ordenActiva,
      id,
      empresaId,
      placa: document.getElementById("placa").value.toUpperCase(),
      cliente: document.getElementById("cliente").value,
      telefono: document.getElementById("telefono").value,
      estado: document.getElementById("estado").value,
      updatedAt: serverTimestamp()
    };

    // 🔹 GUARDAR ORDEN
    batch.set(doc(db,"ordenes",id), ordenActiva);

    // 🔹 INVENTARIO
    descontarStock(batch);

    // 🔹 CONTABILIDAD
    registrarContabilidad(batch, ordenActiva);

    // 🔥 COMMIT ATÓMICO
    await batch.commit();

    ordenActiva.id = id;

    hablar("Sistema completo sincronizado");

    alert("🚀 ORDEN + INVENTARIO + CONTABILIDAD OK");

    // 📲 ENVÍO AUTOMÁTICO OPCIONAL
    // enviarWhatsApp();

  } catch (error) {

    console.error("❌ ERROR CRÍTICO PRO360:", error);

    alert("⚠️ ERROR EN PROCESO - VALIDAR DATOS");

  }

};
