/*
========================================
LISTAR ORDENES
Archivo:
app/app/js/erp/ordenesLista.js
========================================
*/

import { db } from "../core/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function cargarOrdenes(contenedorId){

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

  contenedor.innerHTML = "Cargando órdenes...";

  try{

    const snapshot = await getDocs(

      collection(
        db,
        "empresas",
        empresaId,
        "ordenes"
      )

    );

    if(snapshot.empty){

      contenedor.innerHTML = "<p>No hay órdenes registradas</p>";
      return;

    }

    let html = "";

    snapshot.forEach(doc => {

      const o = doc.data();
      const ordenId = doc.id;

      html += `
      <div class="border p-3 rounded mb-3 bg-white shadow-sm">

        <strong>${o.cliente}</strong><br>

        Vehículo: ${o.vehiculo}<br>

        Placa: ${o.placa}<br>

        Técnico: ${o.tecnico}<br>

        Estado: ${o.estado}<br>

        <button 
          onclick="verOrden('${ordenId}')"
          class="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
        >
          Ver detalle
        </button>

      </div>
      `;

    });

    contenedor.innerHTML = html;

  }
  catch(error){

    console.error("Error cargando órdenes:", error);

    contenedor.innerHTML = "Error cargando órdenes";

  }

}