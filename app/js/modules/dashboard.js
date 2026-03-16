/*
================================================
dashboard.js
Panel gerente TallerPRO360 ERP
Versión estable compatible con estructura actual
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
where,
orderBy,
limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let calcularPredicciones = async ()=>[];


export async function dashboard(container){

try{

const empresaId = obtenerEmpresaId();

if(!empresaId){

container.innerHTML="<h2>No hay empresa activa</h2>";
return;

}

/* UI */

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

<div class="card"><h3>Órdenes activas</h3><p id="ordenesActivas">0</p></div>
<div class="card"><h3>Órdenes completadas hoy</h3><p id="ordenesCompletadas">0</p></div>
<div class="card"><h3>Ingresos hoy</h3><p id="ingresosHoy">$0</p></div>
<div class="card"><h3>Margen promedio</h3><p id="margenUtilidad">0%</p></div>
<div class="card"><h3>Tiempo reparación</h3><p id="tiempoPromedio">0h</p></div>
<div class="card"><h3>Stock crítico</h3><p id="stockCritico">0</p></div>
<div class="card"><h3>Ingresos pagos hoy</h3><p id="resumenIngresosHoy">$0</p></div>

</div>

<div class="card">
<h2>📋 Órdenes recientes</h2>
<div id="ordenesRecientes">Cargando...</div>
</div>

<div class="card">
<h2>🤖 Recomendaciones IA</h2>
<div id="recomendacionesIA">Cargando...</div>
</div>
`;


/* navegación */

document.getElementById("btnClientes").onclick=()=>clientes(container);
document.getElementById("btnOrdenes").onclick=()=>ordenes(container);
document.getElementById("btnInventario").onclick=()=>inventario(container);
document.getElementById("btnPagos").onclick=()=>pagosTaller(container);
document.getElementById("btnConfiguracion").onclick=()=>configuracion(container);


/* cargar datos */

await cargarKPIs(empresaId);
await cargarOrdenes(empresaId);
await cargarIA();

}
catch(error){

console.error("Error dashboard:",error);

container.innerHTML=`
<h2>Error cargando dashboard</h2>
<p>${error.message}</p>
`;

}

}



/* KPIs */

async function cargarKPIs(empresaId){

try{

const clientesSnap=await getDocs(query(collection(db,"clientes"),where("empresaId","==",empresaId)));
const ordenesSnap=await getDocs(query(collection(db,"ordenes"),where("empresaId","==",empresaId)));
const inventarioSnap=await getDocs(query(collection(db,"inventario"),where("empresaId","==",empresaId)));
const pagosSnap=await getDocs(query(collection(db,"pagos"),where("empresaId","==",empresaId)));

const hoy=new Date().toDateString();

let ingresosHoy=0;
let completadasHoy=0;
let tiempoTotal=0;
let margenTotal=0;
let ingresosPagosHoy=0;
let ordenesCompletadasCount=0;


/* ORDENES */

ordenesSnap.forEach(doc=>{

const o=doc.data();

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

pagosSnap.forEach(doc=>{

const p=doc.data();

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

const stockCritico=inventarioSnap.docs.filter(p=>p.data().stock<=3).length;


/* UI */

document.getElementById("ordenesActivas").innerText=
ordenesSnap.docs.filter(o=>o.data().estado!=="completada").length;

document.getElementById("ordenesCompletadas").innerText=completadasHoy;
document.getElementById("ingresosHoy").innerText=`$${ingresosHoy}`;
document.getElementById("margenUtilidad").innerText=`${margenPromedio}%`;
document.getElementById("tiempoPromedio").innerText=`${tiempoPromedio}h`;
document.getElementById("stockCritico").innerText=stockCritico;
document.getElementById("resumenIngresosHoy").innerText=`$${ingresosPagosHoy}`;

}
catch(e){

console.error("Error KPIs:",e);

}

}



/* ORDENES RECIENTES */

async function cargarOrdenes(empresaId){

try{

const q=query(
collection(db,"ordenes"),
where("empresaId","==",empresaId),
orderBy("fecha","desc"),
limit(5)
);

const snapshot=await getDocs(q);

let html="<table style='width:100%'>";

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

document.getElementById("ordenesRecientes").innerHTML=html;

}
catch(e){

console.error("Error ordenes:",e);

}

}



/* IA */

async function cargarIA(){

try{

const recomendaciones=await calcularPredicciones();

const container=document.getElementById("recomendacionesIA");

container.innerHTML="";

recomendaciones.forEach(r=>{

const div=document.createElement("div");

div.innerHTML=`• ${r}`;

container.appendChild(div);

});

}
catch(e){

console.warn("IA no disponible");

}

}