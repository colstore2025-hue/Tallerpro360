/**
 * ordenEstadoService.js
 * Servicio ERP para cambiar estado de órdenes
 * TallerPRO360
 */

import { db } from "../core/firebase-config.js";
import { getTallerId } from "../core/tallerContext.js";

import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { notificarCliente } from "../services/whatsappService.js";


/* ===============================
CAMBIAR ESTADO DE ORDEN
=============================== */

export async function cambiarEstadoOrden(
  ordenId,
  nuevoEstado
){

  try{

    const empresaId = getTallerId();

    if(!empresaId || !ordenId){
      throw new Error("empresaId u ordenId inválidos");
    }


    /* ===============================
       REFERENCIA A ORDEN
    =============================== */

    const ref = doc(
      db,
      "empresas",
      empresaId,
      "ordenes",
      ordenId
    );

    const snap = await getDoc(ref);

    if(!snap.exists()){
      throw new Error("La orden no existe");
    }

    const data = snap.data();

    const telefonoCliente = data.telefono ?? null;
    const cliente = data.cliente ?? "Cliente";
    const vehiculo = data.vehiculo ?? "Vehículo";


    /* ===============================
       ACTUALIZAR ESTADO
    =============================== */

    await updateDoc(ref,{
      estado: nuevoEstado,
      fechaActualizacion: serverTimestamp()
    });

    console.log("Estado actualizado:",nuevoEstado);


    /* ===============================
       NOTIFICACIÓN WHATSAPP
    =============================== */

    if(telefonoCliente){

      notificarCliente(
        telefonoCliente,
        cliente,
        nuevoEstado,
        vehiculo
      );

    }

  }catch(error){

    console.error(
      "Error cambiando estado de orden:",
      error
    );

    throw error;

  }

}