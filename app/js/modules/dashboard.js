/*
================================================
dashboard.js
Panel Gerente TallerPRO360 ERP SaaS
Versión Profesional Estable
================================================
*/

import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { configuracion } from "./configuracion.js";
import { pagosTaller } from "./pagosTaller.js";

import { db } from "../core/firebase-config.js";
import { obtenerEmpresaId } from "../core/empresa-context.js";

import {
collection,
getDocs,
query,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { calcularPredicciones } from "../ai/aiMetrics.js";


export async function dashboard(container){

try{

const empresaId = obtenerEmpresaId();

if(!empresaId){

container.innerHTML=`<h2>No hay empresa activa</h2>`;
return;

}

/* ===============================
UI
=============================== */

container.innerHTML=`
<h1 style="font-size:28px;margin-bottom:20px;">
🚀 Dashboard Gerente - TallerPRO360
</h1>

<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">

<button id="btnClientes" class="btn-primary">👥 Clientes</button>
<button id="btnOrdenes" class="btn-primary">🛠 Órdenes</button>
<button id="btnInventario" class="btn-primary">📦 Inventario</button>
<button id="btnPagos" class="btn-primary">💳 Pagos / Caja</button>
<button id="btnConfiguracion" class="btn-primary">⚙ Configuración</button>

</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:25px;">

<div class="card"><h3>Órdenes activas</h3><p id="ordenesActivas" style="font-size:28px;">0</p></div>
<div class="card"><h3>Órdenes completadas hoy</h3><p id="ordenesCompletadas" style="font-size:28px;">0</p></div>
<div class="card"><h3>Ingresos hoy</h3><p id="ingresosHoy" style="font-size:28px;">$0</p></div>
<div class="card"><h3>Margen promedio</h3><p id="margenUtilidad" style="font-size:28px;">0%</p></div>
<div class="card"><h3>Tiempo reparación</h3><p id="tiempoPromedio" style="font-size:28px;">0h</p></div>
<div class="card"><h3>Stock crítico</h3><p id="stockCritico" style="font-size:28px;">0</p></div>
<div class="card"><h3>Ingresos pagos hoy</h3><p id="resumenIngresosHoy" style="font-size:28px;">$0</p></div>

</div>

<div class="card">
<h2>📋 Órdenes recientes</h2>
<div id="ordenesRecientes">Cargando...</div>
</div>

<div class="card">
<h2>🤖 Recomendaciones IA</h2>
<div id="recomendacionesIA"
style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;">
Cargando sugerencias...
</div>
</div>
`;


/* ===============================
NAVEGACIÓN
=============================== */

const btnClientes=document.getElementById("btnClientes");
const btnOrdenes=document.getElementById("btnOrdenes");
const btnInventario=document.getElementById("btnInventario");
const btnPagos=document.getElementById("btnPagos");
const btnConfig=document.getElementById("btnConfiguracion");

if(btnClientes) btnClientes.onclick=()=>clientes(container);
if(btnOrdenes) btnOrdenes.onclick=()=>ordenes(container);
if(btnInventario) btnInventario.onclick=()=>inventario(container);
if(btnPagos) btnPagos.onclick=()=>pagosTaller(container);
if(btnConfig) btnConfig.onclick=()=>configuracion(container);


/* ===============================
CARGAR DATOS
=============================== */

await cargarKPIs(empresaId);
await cargarOrdenes(empresaId);
await cargarRecomendacionesIA();

}
catch(error){

console.error("Error cargando dashboard:",error);

container.innerHTML=`
<h2>Error cargando Dashboard</h2>
<p>${error.message}</p>
`;

}

}



/* =====================================
KPIs
===================================== */

async function cargarKPIs(empresaId){

try{

const clientesSnap=await getDocs(collection(db,"talleres",empresaId,"clientes"));
const ordenesSnap=await getDocs(collection(db,"talleres",empresaId,"ordenes"));
const inventarioSnap=await getDocs(collection(db,"talleres",empresaId,"inventario"));
const pagosSnap=await getDocs(collection(db,"talleres",empresaId,"pagos"));

const hoy=new Date().toDateString();

let ingresosHoy=0;
let completadasHoy=0;
let tiempoTotal=0;
let margenTotal=0;
let ingresosPagosHoy=0;
let ordenesCompletadasCount=0;


/* ORDENES */

ordenesSnap.docs.forEach(doc=>{

const o=doc.data();

if(!o.fecha) return;

const fechaOrden=o.fecha?.toDate?.()?.toDateString?.();

if(fechaOrden===hoy){
ingresosHoy+=o.total || 0;
}

if(o.estado==="completada"){

completadasHoy++;
ordenesCompletadasCount++;

tiempoTotal+=o.tiempoReparacion || 0;
margenTotal+=o.margen || 0;

}

});


/* PAGOS */

pagosSnap.docs.forEach(doc=>{

const p=doc.data();

if(!p.fecha) return;

const fecha=p.fecha?.toDate?.()?.toDateString?.();

if(fecha===hoy){
ingresosPagosHoy+=p.monto || 0;
}

});


const tiempoPromedio=ordenesCompletadasCount
? (tiempoTotal/ordenesCompletadasCount).toFixed(1)
: 0;

const margenPromedio=ordenesCompletadasCount
? (margenTotal/ordenesCompletadasCount).toFixed(1)
: 0;

const stockCritico=inventarioSnap.docs.filter(
p=>p.data().stock<=3
).length;


/* UI SEGURA */

const set=(id,val)=>{

const el=document.getElementById(id);

if(el) el.innerText=val;

};

set("ordenesActivas",
ordenesSnap.docs.filter(o=>o.data().estado!=="completada").length
);

set("ordenesCompletadas",completadasHoy);
set("ingresosHoy",`$${ingresosHoy}`);
set("margenUtilidad",`${margenPromedio}%`);
set("tiempoPromedio",`${tiempoPromedio}h`);
set("stockCritico",stockCritico);
set("resumenIngresosHoy",`$${ingresosPagosHoy}`);

}
catch(e){

console.error("Error KPIs:",e);

}

}



/* =====================================
ORDENES RECIENTES
===================================== */

async function cargarOrdenes(empresaId){

try{

const q=query(
collection(db,"talleres",empresaId,"ordenes"),
orderBy("fecha","desc"),
limit(5)
);

const snapshot=await getDocs(q);

let html=`
<table style="width:100%;border-collapse:collapse;">
<tr style="border-bottom:1px solid #1e293b;">
<th>Cliente</th>
<th>Vehículo</th>
<th>Estado</th>
<th>Total</th>
</tr>
`;

snapshot.forEach(doc=>{

const o=doc.data();

html+=`
<tr>
<td>${o.cliente || "-"}</td>
<td>${o.vehiculo || "-"}</td>
<td>${o.estado || "En proceso"}</td>
<td>$${o.total || 0}</td>
</tr>
`;

});

html+="</table>";

const div=document.getElementById("ordenesRecientes");

if(div) div.innerHTML=html;

}
catch(e){

console.error("Error órdenes recientes:",e);

}

}



/* =====================================
RECOMENDACIONES IA
===================================== */

async function cargarRecomendacionesIA(){

try{

const container=document.getElementById("recomendacionesIA");

if(!container) return;

const recomendaciones=await calcularPredicciones();

container.innerHTML="";

recomendaciones.forEach(r=>{

const div=document.createElement("div");

div.style.marginBottom="6px";

div.innerHTML=`• ${r}`;

container.appendChild(div);

});

}
catch(e){

console.warn("IA no disponible:",e);

}

}