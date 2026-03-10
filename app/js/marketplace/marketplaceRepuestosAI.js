/**
 * marketplaceRepuestosAI.js
 * TallerPRO360
 * Marketplace inteligente de repuestos
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
BUSCAR PROVEEDORES
=============================== */

export async function buscarProveedores(repuesto){

  if(!repuesto) return [];

  try{

    const proveedoresRef = collection(db,"proveedores");

    const snapshot = await getDocs(proveedoresRef);

    const repuestoNormalizado = repuesto
      .toLowerCase()
      .trim();

    let resultados = [];

    snapshot.forEach(docSnap => {

      const data = docSnap.data();

      if(!data.repuestos) return;

      const repuestosProveedor = data.repuestos
        .map(r => r.toLowerCase());

      if(repuestosProveedor.includes(repuestoNormalizado)){

        resultados.push({

          id: docSnap.id,

          nombre: data.nombre || "Proveedor",

          precio: data.precios?.[repuestoNormalizado] || null,

          tiempoEntrega: data.tiempoEntrega || 24,

          ciudad: data.ciudad || "N/A"

        });

      }

    });

    return resultados;

  }
  catch(e){

    console.error("Error buscando proveedores:",e);

    return [];

  }

}


/* ===============================
MEJOR PROVEEDOR
=============================== */

export function mejorProveedor(lista){

  if(!lista.length) return null;

  return lista.sort((a,b)=>{

    const precioA = a.precio ?? 999999;
    const precioB = b.precio ?? 999999;

    const entregaA = a.tiempoEntrega ?? 48;
    const entregaB = b.tiempoEntrega ?? 48;

    const scoreA = precioA + entregaA * 100;
    const scoreB = precioB + entregaB * 100;

    return scoreA - scoreB;

  })[0];

}


/* ===============================
RECOMENDAR COMPRA
=============================== */

export async function recomendarCompra(repuestos){

  if(!repuestos || !repuestos.length) return [];

  let recomendaciones = [];

  for(const repuesto of repuestos){

    const proveedores = await buscarProveedores(repuesto);

    const mejor = mejorProveedor(proveedores);

    if(mejor){

      recomendaciones.push({

        repuesto,

        proveedor: mejor.nombre,

        precio: mejor.precio,

        entrega: mejor.tiempoEntrega,

        ciudad: mejor.ciudad

      });

    }

  }

  return recomendaciones;

}