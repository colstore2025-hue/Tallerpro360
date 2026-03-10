/**
 * ordenService.js
 * TallerPRO360 ERP SaaS
 * Escucha órdenes en tiempo real
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/**
 * Obtener empresa actual
 */

function obtenerEmpresaId(){

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    throw new Error("empresaId no encontrado en localStorage");
  }

  return empresaId;

}


/* =========================
ESCUCHAR ÓRDENES EN TIEMPO REAL
========================= */

export function escucharOrdenes(callback){

  const empresaId = obtenerEmpresaId();

  const q = query(
    collection(db,"empresas",empresaId,"ordenes"),
    orderBy("fecha","desc")
  );

  return onSnapshot(q,(snapshot)=>{

    const ordenes = [];

    snapshot.forEach((doc)=>{

      ordenes.push({
        id: doc.id,
        ...doc.data()
      });

    });

    callback(ordenes);

  });

}