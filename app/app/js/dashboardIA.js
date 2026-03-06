/**
 * dashboardIA.js
 * TallerPRO360 ERP
 * Analítica IA en tiempo real
 */

import { db } from "./firebase.js";

import {
collection,
query,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
CONFIGURACIÓN
=============================== */

const empresaId = localStorage.getItem("empresaId");

let ordenes = [];


/* ===============================
INICIAR DASHBOARD IA
=============================== */

export function iniciarDashboardIA(){

if(!empresaId){

console.warn("⚠️ Empresa no identificada en localStorage");
return;

}

try{

const q = query(
collection(db,"empresas",empresaId,"ordenes")
);

onSnapshot(q,(snapshot)=>{

ordenes = [];

snapshot.forEach(doc=>{

ordenes.push({
id:doc.id,
...doc.data()
});

});

analizarDatos();

},
(error)=>{
console.error("Error escuchando órdenes:",error);
});

}catch(e){

console.error("Error iniciando Dashboard IA:",e);

}

}


/* ===============================
ANALÍTICA GENERAL
=============================== */

function analizarDatos(){

let ingresoTotal = 0;
let costoTotal = 0;
let utilidadTotal = 0;

const repuestos = {};
const tecnicos = {};

ordenes.forEach(o=>{

const totalOrden = Number(o.total || 0);

ingresoTotal += totalOrden;

/* ===============================
ACCIONES
=============================== */

if(Array.isArray(o.acciones)){

o.acciones.forEach(a=>{

const venta = Number(a.costo || 0);
const costo = Number(a.costoInterno || 0);

costoTotal += costo;
utilidadTotal += (venta - costo);


/* ===============================
REPUESTOS
=============================== */

if(a.descripcion){

if(!repuestos[a.descripcion]){
repuestos[a.descripcion] = 0;
}

repuestos[a.descripcion]++;

}

});

}


/* ===============================
TÉCNICOS
=============================== */

const tecnico = o.tecnico || "Sin asignar";

if(!tecnicos[tecnico]){
tecnicos[tecnico] = 0;
}

tecnicos[tecnico] += totalOrden;

});


/* ===============================
MARGEN
=============================== */

const margen = ingresoTotal
? ((utilidadTotal / ingresoTotal) * 100).toFixed(2)
: 0;


/* ===============================
PREDICCIÓN IA SIMPLE
=============================== */

const prediccion = predecirIngresos();


/* ===============================
ACTUALIZAR DASHBOARD
=============================== */

setHTML("iaIngresos", formatoCOP(ingresoTotal));
setHTML("iaCostos", formatoCOP(costoTotal));
setHTML("iaUtilidad", formatoCOP(utilidadTotal));
setHTML("iaMargen", margen + "%");
setHTML("iaPrediccion", formatoCOP(prediccion));

mostrarTopRepuestos(repuestos);
mostrarTopTecnicos(tecnicos);

}


/* ===============================
TOP REPUESTOS
=============================== */

function mostrarTopRepuestos(repuestos){

const cont = document.getElementById("iaTopRepuestos");

if(!cont) return;

cont.innerHTML = "";

const lista = Object.entries(repuestos)
.sort((a,b)=>b[1]-a[1])
.slice(0,5);

lista.forEach(r=>{

const div = document.createElement("div");

div.className = "flex justify-between text-sm";

div.innerHTML = `
<span>${r[0]}</span>
<span class="text-emerald-400">${r[1]}</span>
`;

cont.appendChild(div);

});

}


/* ===============================
TOP TÉCNICOS
=============================== */

function mostrarTopTecnicos(tecnicos){

const cont = document.getElementById("iaTopTecnicos");

if(!cont) return;

cont.innerHTML = "";

const lista = Object.entries(tecnicos)
.sort((a,b)=>b[1]-a[1])
.slice(0,5);

lista.forEach(t=>{

const div = document.createElement("div");

div.className = "flex justify-between text-sm";

div.innerHTML = `
<span>${t[0]}</span>
<span class="text-blue-400">${formatoCOP(t[1])}</span>
`;

cont.appendChild(div);

});

}


/* ===============================
PREDICCIÓN SIMPLE
=============================== */

function predecirIngresos(){

if(ordenes.length === 0) return 0;

let suma = 0;

ordenes.forEach(o=>{
suma += Number(o.total || 0);
});

const promedio = suma / ordenes.length;

/* predicción mensual simple */

return promedio * 30;

}


/* ===============================
FORMATO COP
=============================== */

function formatoCOP(valor){

return new Intl.NumberFormat(
"es-CO",
{
style:"currency",
currency:"COP",
minimumFractionDigits:0
}
).format(valor);

}


/* ===============================
UTILIDAD DOM
=============================== */

function setHTML(id,value){

const el = document.getElementById(id);

if(el){

el.innerHTML = value;

}

}