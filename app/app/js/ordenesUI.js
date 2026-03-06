import { crearOrden } from "./ordenService.js";
import { agregarAccionOrden } from "./ordenesAcciones.js";

const empresaId = localStorage.getItem("empresaId");


/* =========================
CREAR ORDEN DESDE FORMULARIO
========================= */

export async function crearOrdenUI(){

const cliente = document.getElementById("cliente").value;
const telefono = document.getElementById("telefono").value;

const vehiculo = document.getElementById("vehiculo").value;
const placa = document.getElementById("placa").value;

const tecnico = document.getElementById("tecnico").value;

const descripcion = document.getElementById("descripcion").value;


const ordenId = await crearOrden({

cliente,
telefono,
vehiculo,
placa,
tecnico,
descripcionProblema:descripcion

});


if(ordenId){

alert("Orden creada correctamente");

limpiarFormulario();

}

}


/* =========================
AGREGAR ACCIÓN A ORDEN
========================= */

export async function agregarAccionUI(ordenId){

const accion = prompt("Descripción de la acción");

if(!accion) return;

const costo = Number(prompt("Costo para cliente") || 0);

const costoInterno = Number(prompt("Costo interno") || 0);

await agregarAccionOrden(
empresaId,
ordenId,
accion,
costo,
costoInterno
);

alert("Acción agregada");

}


/* =========================
LIMPIAR FORMULARIO
========================= */

function limpiarFormulario(){

document.getElementById("cliente").value="";
document.getElementById("telefono").value="";
document.getElementById("vehiculo").value="";
document.getElementById("placa").value="";
document.getElementById("descripcion").value="";

}