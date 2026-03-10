/**
 * crearRepuesto.js
 * TallerPRO360 ERP
 * Crear repuestos en inventario
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function crearRepuesto(data){

  try{

    const empresaId = localStorage.getItem("empresaId");

    if(!empresaId){
      throw new Error("Empresa no definida");
    }

    if(!data.nombre || !data.costoCompra){
      throw new Error("Nombre y costo de compra son obligatorios");
    }

    const costoCompra = Number(data.costoCompra);

    const margen = Number(data.margen) || 30;

    const precioVenta = Math.round(
      costoCompra * (1 + margen/100)
    );


    const docRef = await addDoc(

      collection(
        db,
        "empresas",
        empresaId,
        "repuestos"
      ),

      {
        nombre: data.nombre.trim(),
        codigo: data.codigo || "",
        marca: data.marca || "",
        categoria: data.categoria || "",

        costoCompra,
        margen,
        precioVenta,

        stock: Number(data.stock) || 0,
        stockMinimo: Number(data.stockMinimo) || 1,

        proveedor: data.proveedor || "No definido",

        vecesVendido: 0,
        ingresosGenerados: 0,
        utilidadGenerada: 0,

        activo: true,

        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()

      }

    );

    return docRef.id;

  }
  catch(error){

    console.error("Error creando repuesto:", error);
    throw error;

  }

}