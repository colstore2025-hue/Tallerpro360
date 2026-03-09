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
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function cargarOrdenes(contenedorId){

  const contenedor = document.getElementById(contenedorId);

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    contenedor.innerHTML = "Empresa no identificada";
    return;
  }

  contenedor.innerHTML = "Cargando órdenes...";

  try{

    const q = query(
      collection(db,"ordenes"),
      where("empresaId","==",empresaId)
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

      contenedor.innerHTML = "<p>No hay órdenes registradas</p>";

      return;

    }

    let html = "";

    snapshot.forEach(doc => {

      const o = doc.data();

      html += `
      <div class="border p-3 rounded mb-2">

        <strong>${o.cliente}</strong><br>

        Vehículo: ${o.vehiculo}<br>

        Placa: ${o.placa}<br>

        Técnico: ${o.tecnico}<br>

        Estado: ${o.estado}

      </div>
      `;

    });

    contenedor.innerHTML = html;

  }catch(error){

    console.error("Error cargando órdenes:", error);

    contenedor.innerHTML = "Error cargando órdenes";

  }

}