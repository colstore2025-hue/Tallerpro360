/**
 * ======================================================
 * ordenesAcciones.js
 * Gestión de acciones dentro de una orden
 * Proyecto: TallerPRO360
 * ======================================================
 */

import { db } from "../core/firebase-config.js";

import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ======================================================
   AGREGAR ACCIÓN A UNA ORDEN
====================================================== */

export async function agregarAccionOrden(
  empresaId,
  ordenId,
  accion,
  costo = 0,
  costoInterno = 0
) {

  try {

    if (!empresaId || !ordenId) {

      throw new Error("empresaId u ordenId no definidos");

    }

    const ref = doc(
      db,
      "empresas",
      empresaId,
      "ordenes",
      ordenId
    );


    await updateDoc(ref, {

      acciones: arrayUnion({

        descripcion: accion || "Acción no especificada",

        costo: Number(costo) || 0,

        costoInterno: Number(costoInterno) || 0,

        estado: "pendiente",

        fecha: serverTimestamp()

      })

    });


    await recalcularTotal(empresaId, ordenId);


  } catch (error) {

    console.error(
      "Error agregando acción a la orden:",
      error
    );

  }

}



/* ======================================================
   RECALCULAR TOTAL DE LA ORDEN
====================================================== */

export async function recalcularTotal(
  empresaId,
  ordenId
) {

  try {

    const ref = doc(
      db,
      "empresas",
      empresaId,
      "ordenes",
      ordenId
    );

    const snap = await getDoc(ref);


    if (!snap.exists()) {

      console.warn("Orden no encontrada");

      return;

    }


    const data = snap.data();

    let total = 0;


    if (Array.isArray(data.acciones)) {

      data.acciones.forEach(a => {

        const costo = Number(a.costo);

        if (!isNaN(costo)) {

          total += costo;

        }

      });

    }


    await updateDoc(ref, {

      total: total

    });


  } catch (error) {

    console.error(
      "Error recalculando total:",
      error
    );

  }

}