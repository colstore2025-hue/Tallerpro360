/**
 * customerRetentionAI.js
 * TallerPRO360 ERP
 * Analítica de retención de clientes
 */

import { db } from "../core/firebase-config.js";

import {
collection,
query,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
ANALIZAR CLIENTES
=============================== */

export async function analizarRetencionClientes(){

const empresaId = localStorage.getItem("empresaId");

if(!empresaId){

console.warn("Empresa no definida");
return [];

}

try{

const q = query(
collection(db,"empresas",empresaId,"ordenes")
);

const snap = await getDocs(q);

const clientes = {};

snap.forEach(doc=>{

const data = doc.data();

const cliente = data.cliente || "Sin nombre";

const fecha = data.fecha
? data.fecha.toDate()
: new Date();

if(!clientes[cliente]){

clientes[cliente] = {
ordenes:0,
total:0,
ultimaVisita:fecha
};

}

clientes[cliente].ordenes++;

clientes[cliente].total += Number(data.total || 0);

if(fecha > clientes[cliente].ultimaVisita){

clientes[cliente].ultimaVisita = fecha;

}

});


/* ===============================
DETECTAR CLIENTES EN RIESGO
=============================== */

const hoy = new Date();

const resultado = Object.entries(clientes).map(c=>{

const nombre = c[0];
const data = c[1];

const diasSinVisita =
Math.floor(
(hoy - data.ultimaVisita) / (1000*60*60*24)
);

let riesgo = "bajo";

if(diasSinVisita > 180) riesgo = "alto";
else if(diasSinVisita > 90) riesgo = "medio";

return {

cliente:nombre,
ordenes:data.ordenes,
total:data.total,
diasSinVisita,
riesgo

};

});


/* ordenar por clientes con más días sin visita */

resultado.sort((a,b)=>b.diasSinVisita-a.diasSinVisita);


/* guardar cache local */

localStorage.setItem(
"clientesRetencion",
JSON.stringify(resultado)
);

return resultado;

}
catch(e){

console.error("Error analizando clientes:",e);

return [];

}

}


/* ===============================
CLIENTES EN RIESGO
=============================== */

export function clientesEnRiesgo(){

const data = JSON.parse(
localStorage.getItem("clientesRetencion") || "[]"
);

return data.filter(c=>c.riesgo === "alto");

}


/* ===============================
TOP CLIENTES
=============================== */

export function topClientes(){

const data = JSON.parse(
localStorage.getItem("clientesRetencion") || "[]"
);

return data
.sort((a,b)=>b.total-a.total)
.slice(0,10);

}