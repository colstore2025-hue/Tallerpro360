/**
 * ==============================================
 * ordenEstadoService.js
 * Servicio ERP para cambiar estado de órdenes
 * Proyecto: TallerPRO360
 * ==============================================
 */

import { db } from "../core/firebase-config.js";
import { getTallerId } from "../core/tallerContext.js";

import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { notificarCliente } from "./whatsappService.js";


/* =========================================================
   CAMBIAR ESTADO DE ORDEN
========================================================= */

export async function cambiarEstadoOrden(ordenId, nuevoEstado) {

  try {

    const empresaId = getTallerId();

    if (!empresaId) {
      throw new Error("empresaId no disponible");
    }

    if (!ordenId) {
      throw new Error("ordenId inválido");
    }

    if (!nuevoEstado) {
      throw new Error("nuevoEstado inválido");
    }

    /* =========================================================
       REFERENCIA A LA ORDEN
    ========================================================= */

    const ordenRef = doc(
      db,
      "empresas",
      empresaId,
      "ordenes",
      ordenId
    );

    const snap = await getDoc(ordenRef);

    if (!snap.exists()) {
      throw new Error("La orden no existe");
    }

    const data = snap.data();

    const telefonoCliente = data.telefono ?? null;
    const cliente = data.cliente ?? "Cliente";
    const vehiculo = data.vehiculo ?? "Vehículo";

    /* =========================================================
       ACTUALIZAR ESTADO
    ========================================================= */

    await updateDoc(ordenRef, {
      estado: nuevoEstado,
      fechaActualizacion: serverTimestamp()
    });

    console.log("Estado de orden actualizado:", nuevoEstado);

    /* =========================================================
       NOTIFICACIÓN AL CLIENTE (WHATSAPP)
    ========================================================= */

    if (telefonoCliente) {

      await notificarCliente(
        telefonoCliente,
        cliente,
        nuevoEstado,
        vehiculo
      );

      console.log("Cliente notificado por WhatsApp");

    }

    return true;

  } catch (error) {

    console.error(
      "Error cambiando estado de la orden:",
      error
    );

    throw error;

  }

}