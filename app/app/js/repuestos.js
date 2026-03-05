// ======================================
// REPUESTOS - CREAR NUEVO REPUESTO
// ======================================

import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function crearRepuesto(data) {

  try {

    // ==========================
    // VALIDACIONES OBLIGATORIAS
    // ==========================
    if (!data.nombre || !data.costoCompra) {
      throw new Error("Nombre y costo de compra son obligatorios");
    }

    // ==========================
    // NORMALIZAR DATOS NUMÉRICOS
    // ==========================
    const costoCompra = Number(data.costoCompra);
    const margen = Number(data.margen) || 30;
    const stock = Number(data.stock) || 0;
    const stockMinimo = Number(data.stockMinimo) || 1;

    // ==========================
    // CALCULAR PRECIO DE VENTA
    // ==========================
    let precioVenta = costoCompra * (1 + margen / 100);
    precioVenta = Math.round(precioVenta); // redondeo comercial COP

    // ==========================
    // CREAR DOCUMENTO FIRESTORE
    // ==========================
    const docRef = await addDoc(collection(db, "repuestos"), {

      // info básica
      nombre: data.nombre.trim(),
      codigo: data.codigo || "",
      marca: data.marca || "",
      categoria: data.categoria || "",

      // precios en COP
      costoCompra: costoCompra,
      margen: margen,
      precioVenta: precioVenta,

      // inventario
      stock: stock,
      stockMinimo: stockMinimo,

      // proveedor
      proveedor: data.proveedor || "No definido",

      // métricas comerciales (para dashboard financiero)
      vecesVendido: 0,
      ingresosGenerados: 0,
      utilidadGenerada: 0,

      // estado
      activo: true,

      // timestamps
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    });

    return docRef.id;

  } catch (error) {
    console.error("Error creando repuesto:", error);
    throw error;
  }
}