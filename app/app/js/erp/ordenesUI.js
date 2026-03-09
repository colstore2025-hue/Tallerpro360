/**
 * ordenesUI.js
 * Interfaz del módulo de órdenes
 * TallerPRO360 ERP
 */

import { crearOrden } from "../services/ordenesService.js";
import { agregarAccionOrden } from "./ordenesAcciones.js";
import { getTallerId } from "../core/tallerContext.js";


/* =========================
CREAR ORDEN DESDE FORMULARIO
========================= */

export async function crearOrdenUI(){

  try{

    const cliente =
      document.getElementById("cliente").value.trim();

    const telefono =
      document.getElementById("telefono").value.trim();

    const vehiculo =
      document.getElementById("vehiculo").value.trim();

    const placa =
      document.getElementById("placa").value.trim();

    const tecnico =
      document.getElementById("tecnico").value;

    const descripcion =
      document.getElementById("descripcion").value.trim();


    if(!cliente || !vehiculo || !placa){

      alert("Complete los campos obligatorios");

      return;

    }


    const ordenId = await crearOrden({

      cliente,
      telefono,
      vehiculo,
      placa,
      tecnico,
      descripcionProblema: descripcion

    });


    if(ordenId){

      alert("Orden creada correctamente");

      limpiarFormulario();

    }

  }catch(error){

    console.error("Error creando orden:",error);

    alert("No fue posible crear la orden");

  }

}



/* =========================
AGREGAR ACCIÓN A ORDEN
========================= */

export async function agregarAccionUI(ordenId){

  try{

    const empresaId = getTallerId();

    const accion = prompt("Descripción de la acción");

    if(!accion) return;

    const costo =
      Number(prompt("Costo para cliente") || 0);

    const costoInterno =
      Number(prompt("Costo interno") || 0);


    await agregarAccionOrden(

      empresaId,
      ordenId,
      accion,
      costo,
      costoInterno

    );

    alert("Acción agregada correctamente");

  }catch(error){

    console.error("Error agregando acción:",error);

    alert("No fue posible agregar la acción");

  }

}



/* =========================
LIMPIAR FORMULARIO
========================= */

function limpiarFormulario(){

  document.getElementById("cliente").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("vehiculo").value = "";
  document.getElementById("placa").value = "";
  document.getElementById("descripcion").value = "";

}