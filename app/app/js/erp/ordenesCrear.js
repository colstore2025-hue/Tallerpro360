/*
========================================
CREAR ORDEN DE TRABAJO
Archivo:
app/app/js/erp/ordenesCrear.js
========================================
*/

import { db } from "../core/firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function crearOrden(data){

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    alert("Empresa no identificada");
    return;
  }

  const orden = {

    cliente: data.cliente,
    vehiculo: data.vehiculo,
    placa: data.placa,
    tecnico: data.tecnico || "Sin asignar",

    estado: "abierta",

    acciones: [],
    repuestos: [],

    total: 0,

    empresaId: empresaId,

    creadoEn: serverTimestamp()

  };

  try{

    await addDoc(collection(db,"ordenes"), orden);

    console.log("Orden creada");

  }catch(error){

    console.error("Error creando orden:", error);

  }

}