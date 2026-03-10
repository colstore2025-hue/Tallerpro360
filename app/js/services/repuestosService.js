/**
 * repuestosService.js
 * Servicio de repuestos
 * TallerPRO360 ERP
 */

import {
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { coleccionTaller } from "../core/dbTaller.js";


/* ========================================
CREAR REPUESTO
======================================== */

export async function crearRepuesto(data){

  try{

    /* =========================
       VALIDACIÓN
    ========================= */

    if(!data?.nombre){
      throw new Error("El nombre del repuesto es obligatorio");
    }

    if(data.costoCompra === undefined){
      throw new Error("El costo de compra es obligatorio");
    }


    /* =========================
       NORMALIZAR DATOS
    ========================= */

    const costoCompra = Number(data.costoCompra);
    const margen = Number(data.margen ?? 30);

    if(isNaN(costoCompra)){
      throw new Error("Costo de compra inválido");
    }


    /* =========================
       CÁLCULO DE PRECIO
    ========================= */

    const precioVenta =
      costoCompra * (1 + margen / 100);


    /* =========================
       CREAR DOCUMENTO
    ========================= */

    const docRef = await addDoc(
      coleccionTaller("repuestos"),
      {

        nombre: data.nombre.trim(),
        marca: data.marca ?? "",
        categoria: data.categoria ?? "",

        costoCompra: costoCompra,
        margen: margen,

        precioVenta: Math.round(precioVenta),

        stock: Number(data.stock ?? 0),
        stockMinimo: Number(data.stockMinimo ?? 1),

        proveedor: data.proveedor ?? "N/A",

        estado: "activo",

        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()

      }
    );

    console.log("Repuesto creado:", docRef.id);

    return docRef.id;

  }catch(error){

    console.error("Error creando repuesto:",error);

    throw error;

  }

}