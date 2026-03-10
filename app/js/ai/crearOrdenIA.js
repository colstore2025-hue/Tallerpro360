/**
 * ======================================================
 * crearOrdenIA.js
 * Crear orden automáticamente usando diagnóstico IA
 * Proyecto: TallerPRO360
 * ======================================================
 */

import { db } from "../core/firebase-config.js";
import { getTallerId } from "../core/tallerContext.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { detectarRepuestos } from "./detectarRepuestos.js";


/* ======================================================
   CREAR ORDEN CON IA
====================================================== */

export async function crearOrdenIA(descripcion) {

  try {

    const empresaId = getTallerId();

    if (!empresaId) {

      alert("Empresa no identificada");

      return;

    }

    if (!descripcion || descripcion.trim() === "") {

      alert("Debe ingresar una descripción del problema");

      return;

    }


    /* ======================================================
       ANALIZAR PROBLEMA CON IA
    ====================================================== */

    const resultadoIA = await detectarRepuestos(descripcion);

    const diagnostico =
      resultadoIA?.diagnostico || "";

    const repuestos =
      resultadoIA?.repuestos || [];

    const accionesIA =
      resultadoIA?.acciones || [];


    /* ======================================================
       NORMALIZAR ACCIONES
    ====================================================== */

    const acciones = accionesIA.map(a => {

      if (typeof a === "string") {

        return {

          descripcion: a,
          costo: 0,
          costoInterno: 0,
          estado: "pendiente"

        };

      }

      return {

        descripcion: a?.nombre || "",
        costo: 0,
        costoInterno: 0,
        estado: "pendiente"

      };

    });


    /* ======================================================
       CREAR ORDEN EN FIRESTORE
    ====================================================== */

    await addDoc(

      collection(
        db,
        "empresas",
        empresaId,
        "ordenes"
      ),

      {

        cliente: "Pendiente",
        vehiculo: "Por definir",
        placa: "Sin placa",
        tecnico: "Sin asignar",

        estado: "activa",

        descripcionProblema: descripcion,

        diagnosticoIA: diagnostico,

        repuestosIA: repuestos,

        acciones: acciones,

        total: 0,

        origen: "IA",

        fecha: serverTimestamp()

      }

    );


    alert("Orden creada con diagnóstico IA");

  } catch (error) {

    console.error(
      "Error generando orden con IA:",
      error
    );

    alert("Error generando orden IA");

  }

}