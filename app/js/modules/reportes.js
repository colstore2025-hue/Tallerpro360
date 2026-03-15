/**
 * reportes.js
 * Centro de Reportes Inteligentes
 * TallerPRO360
 */

import { moduleLoader } from "../system/moduleLoader.js";
import { db } from "../core/firebase-config.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function reportes(container){

container.innerHTML = `

<h2>📊 Centro de Reportes Inteligentes</h2>

<div style="margin-top:20px">

<button id="repVentas" style="padding:10px;margin:5px">Ventas</button>

<button id="repOrdenes" style="padding:10px;margin:5px">Órdenes</button>

<button id="repRepuestos" style="padding:10px;margin:5px">Repuestos usados</button>

<button id="repProveedores" style="padding:10px;margin:5px">Proveedores recomendados</button>

</div>

<div id="resultadoReporte" style="margin-top:30px"></div>

`;

const resultado = document.getElementById("resultadoReporte");

/* =========================
REPORTE VENTAS
========================= */

document.getElementById("repVentas").onclick = async ()=>{

resultado.innerHTML="Calculando ventas...";

try{

const snap = await getDocs(collection(db,"ordenes"));

let total=0;

snap.forEach(doc=>{

const data=doc.data();

total+=Number(data.total || 0);

});

resultado.innerHTML=`

<h3>💰 Ventas Totales</h3>

<p>Total ventas registradas:</p>

<h2>$ ${total.toLocaleString()}</h2>

`;

}catch(e){

resultado.innerHTML="Error leyendo ventas";

console.error(e);

}

};

/* =========================
REPORTE ÓRDENES
========================= */

document.getElementById("repOrdenes").onclick = async ()=>{

resultado.innerHTML="Analizando órdenes...";

try{

const snap = await getDocs(collection(db,"ordenes"));

let abiertas=0;
let proceso=0;
let finalizadas=0;

snap.forEach(doc=>{

const estado=(doc.data().estado || "").toLowerCase();

if(estado==="abierta") abiertas++;
else if(estado==="proceso") proceso++;
else if(estado==="finalizada") finalizadas++;

});

resultado.innerHTML=`

<h3>📋 Estado de Órdenes</h3>

<p>Abiertas: ${abiertas}</p>

<p>En proceso: ${proceso}</p>

<p>Finalizadas: ${finalizadas}</p>

`;

}catch(e){

resultado.innerHTML="Error leyendo órdenes";

console.error(e);

}

};

/* =========================
REPORTE REPUESTOS
========================= */

document.getElementById("repRepuestos").onclick = async ()=>{

resultado.innerHTML="Analizando repuestos...";

try{

const snap = await getDocs(collection(db,"inventario"));

let lista=[];

snap.forEach(doc=>{

const data=doc.data();

lista.push({
nombre:data.nombre,
stock:data.stock || 0
});

});

lista.sort((a,b)=>a.stock-b.stock);

let html="<h3>⚠ Repuestos con poco stock</h3>";

lista.slice(0,5).forEach(r=>{

html+=`<p>${r.nombre} - stock: ${r.stock}</p>`;

});

resultado.innerHTML=html;

}catch(e){

resultado.innerHTML="Error leyendo inventario";

console.error(e);

}

};

/* =========================
PROVEEDORES
========================= */

document.getElementById("repProveedores").onclick = async ()=>{

resultado.innerHTML="Buscando proveedores...";

try{

const snap = await getDocs(collection(db,"proveedores"));

let html="<h3>🏭 Proveedores registrados</h3>";

snap.forEach(doc=>{

const data=doc.data();

html+=`<p>${data.nombre || "Proveedor"} - ${data.ciudad || ""}</p>`;

});

resultado.innerHTML=html;

}catch(e){

resultado.innerHTML="Error leyendo proveedores";

console.error(e);

}

};

}

/* =========================
AUTO REGISTRO
========================= */

moduleLoader.register("reportes",reportes);