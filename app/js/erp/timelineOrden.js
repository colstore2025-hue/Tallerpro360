/**
 * timelineOrden.js
 * Timeline de acciones de una orden
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";
import { getTallerId } from "../core/tallerContext.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
CARGAR TIMELINE DE ORDEN
=============================== */

export async function cargarTimeline(ordenId, container){

  try{

    if(!container){
      console.warn("Container no definido");
      return;
    }

    const empresaId = getTallerId();

    if(!empresaId){
      container.innerHTML = "Empresa no identificada";
      return;
    }


    /* ===============================
       REFERENCIA FIRESTORE
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
      container.innerHTML = "Orden no encontrada";
      return;
    }

    const data = snap.data();

    const acciones = data?.acciones ?? [];

    if(acciones.length === 0){
      container.innerHTML = "Sin acciones registradas";
      return;
    }


    /* ===============================
       GENERAR HTML
    =============================== */

    let html = `<div class="timeline">`;

    acciones.forEach(a=>{

      let fecha = "";

      if(a?.fecha?.seconds){
        fecha = new Date(
          a.fecha.seconds * 1000
        ).toLocaleString();
      }

      html += `
<div class="border-l-4 border-blue-500 pl-4 mb-4">

  <div class="text-sm text-gray-500">
    ${fecha}
  </div>

  <div class="font-semibold">
    ${a?.descripcion ?? ""}
  </div>

  <div class="text-xs text-gray-400">
    Estado: ${a?.estado ?? ""}
  </div>

</div>
`;

    });

    html += `</div>`;

    container.innerHTML = html;

  }catch(error){

    console.error(
      "Error cargando timeline:",
      error
    );

    container.innerHTML =
      "Error cargando historial";

  }

}