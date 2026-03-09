/**
 * ======================================================
 * ordenesUI.js
 * Interfaz del módulo de órdenes
 * Proyecto: TallerPRO360 ERP
 * ======================================================
 */

import { crearOrden } from "../services/ordenesService.js";
import { agregarAccionOrden } from "./ordenesAcciones.js";
import { getTallerId } from "../core/tallerContext.js";


/* ======================================================
   CREAR ORDEN DESDE FORMULARIO
====================================================== */

export async function crearOrdenUI() {

  try {

    const empresaId = getTallerId();

    if (!empresaId) {
      throw new Error("Empresa no identificada");
    }

    const cliente =
      document.getElementById("cliente")?.value.trim();

    const telefono =
      document.getElementById("telefono")?.value.trim();

    const vehiculo =
      document.getElementById("vehiculo")?.value.trim();

    const placa =
      document.getElementById("placa")?.value.trim();

    const tecnico =
      document.getElementById("tecnico")?.value || null;

    const descripcion =
      document.getElementById("descripcion")?.value.trim();


    /* ===============================
       VALIDACIÓN
    =============================== */

    if (!cliente || !vehiculo || !placa) {

      alert("Complete los campos obligatorios");

      return;

    }


    /* ===============================
       CREAR ORDEN
    =============================== */

    const ordenId = await crearOrden({

      cliente,
      telefono,
      vehiculo,
      placa,
      tecnico,
      descripcionProblema: descripcion

    });


    if (ordenId) {

      alert("Orden creada correctamente");

      limpiarFormulario();

    }

  } catch (error) {

    console.error("Error creando orden:", error);

    alert("No fue posible crear la orden");

  }

}



/* ======================================================
   AGREGAR ACCIÓN A ORDEN
====================================================== */

export async function agregarAccionUI(ordenId) {

  try {

    const empresaId = getTallerId();

    if (!empresaId) {
      throw new Error("Empresa no identificada");
    }

    if (!ordenId) {
      throw new Error("ordenId inválido");
    }


    /* ===============================
       SOLICITAR DATOS
    =============================== */

    const accion = prompt("Descripción de la acción");

    if (!accion || accion.trim() === "") return;


    const costo =
      Number(prompt("Costo para cliente") || 0);

    const costoInterno =
      Number(prompt("Costo interno") || 0);


    /* ===============================
       GUARDAR ACCIÓN
    =============================== */

    await agregarAccionOrden(

      empresaId,
      ordenId,
      accion.trim(),
      isNaN(costo) ? 0 : costo,
      isNaN(costoInterno) ? 0 : costoInterno

    );


    alert("Acción agregada correctamente");


  } catch (error) {

    console.error("Error agregando acción:", error);

    alert("No fue posible agregar la acción");

  }

}



/* ======================================================
   LIMPIAR FORMULARIO
====================================================== */

function limpiarFormulario() {

  const campos = [

    "cliente",
    "telefono",
    "vehiculo",
    "placa",
    "descripcion"

  ];

  campos.forEach(id => {

    const input = document.getElementById(id);

    if (input) input.value = "";

  });

}