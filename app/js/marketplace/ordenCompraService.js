/**
 * ordenCompraService.js
 * TallerPRO360
 * Gestión de órdenes de compra a proveedores
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
CREAR ORDEN DE COMPRA
=============================== */

export async function crearOrdenCompra(proveedor, items){

  if(!proveedor || !items || !items.length){
    throw new Error("Datos de orden de compra inválidos");
  }

  const empresaId = localStorage.getItem("empresaId");

  let total = 0;

  const repuestos = [];

  items.forEach(item => {

    total += (item.precioUnitario || 0) * (item.cantidad || 0);

    repuestos.push(item.repuesto);

  });

  const orden = {

    proveedorId: proveedor.id,
    proveedorNombre: proveedor.nombre,

    repuestos,
    items,

    total,

    estado: "pendiente",

    empresaId,

    fecha: serverTimestamp()

  };

  const ref = await addDoc(
    collection(db,"ordenesCompra"),
    orden
  );

  return ref.id;

}


/* ===============================
CAMBIAR ESTADO
=============================== */

export async function cambiarEstadoOrden(id, estado){

  const ref = doc(db,"ordenesCompra",id);

  await updateDoc(ref,{
    estado
  });

}


/* ===============================
MARCAR COMO ENTREGADO
ACTUALIZA INVENTARIO
=============================== */

export async function recibirOrdenCompra(id){

  const ref = doc(db,"ordenesCompra",id);

  const snap = await getDoc(ref);

  if(!snap.exists()){
    throw new Error("Orden de compra no encontrada");
  }

  const data = snap.data();

  const items = data.items || [];

  for(const item of items){

    await actualizarInventario(
      item.repuesto,
      item.cantidad
    );

  }

  await updateDoc(ref,{
    estado:"entregado"
  });

}


/* ===============================
ACTUALIZAR INVENTARIO
=============================== */

async function actualizarInventario(nombreRepuesto, cantidad){

  const empresaId = localStorage.getItem("empresaId");

  const ref = doc(db,"inventario",nombreRepuesto);

  const snap = await getDoc(ref);

  if(snap.exists()){

    const stockActual = snap.data().stock || 0;

    await updateDoc(ref,{
      stock: stockActual + cantidad
    });

  }
  else{

    await updateDoc(ref,{
      nombre: nombreRepuesto,
      stock: cantidad,
      empresaId
    });

  }

}