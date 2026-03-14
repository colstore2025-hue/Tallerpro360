/**
 * panel-financiero.js
 * Panel financiero del taller
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js"
import { calcularUtilidadOrden } from "./calcularUtilidadOrden.js"

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"



export async function panelFinanciero(container){

container.innerHTML = `
<h1 style="font-size:26px;margin-bottom:20px;">
📊 Panel Financiero
</h1>

<div class="card">
<h3>Resumen del Taller</h3>

<div id="finanzasResumen">
Cargando datos financieros...
</div>

</div>
`

cargarFinanzas()

}



/* ===============================
CARGAR DATOS
=============================== */

async function cargarFinanzas(){

const contenedor = document.getElementById("finanzasResumen")

try{

const snapshot = await getDocs(collection(db,"ordenes"))

let ingresos = 0
let costos = 0
let utilidad = 0
let ordenes = 0

snapshot.forEach(doc=>{

const orden = doc.data()

const util = calcularUtilidadOrden(orden)

ingresos += util.venta
costos += util.costo
utilidad += util.utilidad

ordenes++

})

const margen = ingresos
? ((utilidad / ingresos) * 100).toFixed(2)
: 0


renderResumen({
ingresos,
costos,
utilidad,
margen,
ordenes
})

}
catch(error){

console.error("Error cargando finanzas",error)

contenedor.innerHTML = "Error cargando datos financieros"

}

}



/* ===============================
RENDER
=============================== */

function renderResumen(data){

const contenedor = document.getElementById("finanzasResumen")

contenedor.innerHTML = `

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px">

<div class="card">
<h3>💰 Ingresos</h3>
<p>$${data.ingresos}</p>
</div>

<div class="card">
<h3>💸 Costos</h3>
<p>$${data.costos}</p>
</div>

<div class="card">
<h3>📈 Utilidad</h3>
<p>$${data.utilidad}</p>
</div>

<div class="card">
<h3>📊 Margen</h3>
<p>${data.margen}%</p>
</div>

<div class="card">
<h3>🧾 Órdenes</h3>
<p>${data.ordenes}</p>
</div>

</div>

`

}