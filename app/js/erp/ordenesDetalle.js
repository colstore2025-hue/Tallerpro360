/*
========================================
DETALLE DE ORDEN
Archivo:
app/js/erp/ordenesDetalle.js
========================================
*/

import { db } from "../core/firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function verDetalleOrden(ordenId, contenedorId){

  const contenedor = document.getElementById(contenedorId);

  if(!contenedor){
    console.error("Contenedor no encontrado:", contenedorId);
    return;
  }

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    contenedor.innerHTML = "Empresa no identificada";
    return;
  }

  if(!ordenId){
    contenedor.innerHTML = "Orden no especificada";
    return;
  }

  contenedor.innerHTML = "Cargando detalle...";

  try{

    const ref = doc(
      db,
      "empresas",
      empresaId,
      "ordenes",
      ordenId
    );

    const snap = await getDoc(ref);

    if(!snap.exists()){

      contenedor.innerHTML = "Orden no encontrada";
      return;

    }

    const o = snap.data();


    /* ===============================
       ACCIONES DEL MECÁNICO
    =============================== */

    let accionesHTML = "";

    if(Array.isArray(o.acciones) && o.acciones.length > 0){

      o.acciones.forEach(a => {

        accionesHTML += `
        <li class="mb-1">
          ${a.descripcion || "Acción"} 
          - $${a.costo || 0}
          (${a.estado || "pendiente"})
        </li>
        `;

      });

    }else{

      accionesHTML = "<li>No hay acciones registradas</li>";

    }


    /* ===============================
       REPUESTOS
    =============================== */

    let repuestosHTML = "";

    if(Array.isArray(o.repuestos) && o.repuestos.length > 0){

      o.repuestos.forEach(r => {

        repuestosHTML += `
        <li>
          ${r.nombre || "Repuesto"} 
          - Cantidad: ${r.cantidad || 1}
        </li>
        `;

      });

    }else{

      repuestosHTML = "<li>No se han usado repuestos</li>";

    }


    /* ===============================
       RENDER
    =============================== */

    contenedor.innerHTML = `

      <div class="bg-white p-4 rounded shadow">

        <h2 class="text-xl font-bold mb-4">
          Detalle de Orden
        </h2>

        <p><strong>Cliente:</strong> ${o.cliente || "-"}</p>

        <p><strong>Vehículo:</strong> ${o.vehiculo || "-"}</p>

        <p><strong>Placa:</strong> ${o.placa || "-"}</p>

        <p><strong>Técnico:</strong> ${o.tecnico || "-"}</p>

        <p><strong>Estado:</strong> ${o.estado || "-"}</p>

        <hr class="my-4">

        <h3 class="font-bold mb-2">Acciones del mecánico</h3>

        <ul>
          ${accionesHTML}
        </ul>

        <hr class="my-4">

        <h3 class="font-bold mb-2">Repuestos utilizados</h3>

        <ul>
          ${repuestosHTML}
        </ul>

        <hr class="my-4">

        <p class="text-lg">
          <strong>Total:</strong> $${o.total || 0}
        </p>

      </div>

    `;

  }

  catch(error){

    console.error("Error cargando detalle:", error);

    contenedor.innerHTML = "Error cargando detalle";

  }

}