 import { db } from "../js/firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { agregarAccionOrden } from "../js/ordenesAcciones.js";


export async function ordenes(container){

  container.innerHTML = `

  <div class="p-6">

    <h1 class="text-2xl font-bold mb-6">
      Gestión de Órdenes
    </h1>

    <div class="bg-white p-4 rounded shadow mb-6">

      <h2 class="font-semibold mb-3">
        Nueva Orden
      </h2>

      <input
        id="cliente"
        class="border p-2 rounded w-full mb-2"
        placeholder="Nombre del cliente"
      >

      <input
        id="vehiculo"
        class="border p-2 rounded w-full mb-2"
        placeholder="Vehículo"
      >

      <input
        id="placa"
        class="border p-2 rounded w-full mb-2"
        placeholder="Placa"
      >

      <input
        id="tecnico"
        class="border p-2 rounded w-full mb-4"
        placeholder="Técnico"
      >

      <button
        id="crearOrden"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Crear Orden
      </button>

    </div>

    <div class="bg-white p-4 rounded shadow">

      <h2 class="font-semibold mb-3">
        Órdenes registradas
      </h2>

      <div id="listaOrdenes">
        Cargando órdenes...
      </div>

    </div>

  </div>
  `;

  document
    .getElementById("crearOrden")
    .addEventListener("click", crearOrden);

  cargarOrdenes();
}



async function crearOrden(){

  const empresaId = localStorage.getItem("empresaId");

  const cliente  = document.getElementById("cliente").value.trim();
  const vehiculo = document.getElementById("vehiculo").value.trim();
  const placa    = document.getElementById("placa").value.trim();
  const tecnico  = document.getElementById("tecnico").value.trim();

  if(!cliente || !vehiculo || !placa){
    alert("Complete los campos obligatorios");
    return;
  }

  try{

    await addDoc(

      collection(db,"empresas",empresaId,"ordenes"),

      {
        cliente,
        vehiculo,
        placa,
        tecnico: tecnico || "Sin asignar",

        estado: "activa",
        total: 0,

        acciones: [],

        fecha: serverTimestamp()
      }

    );

    alert("Orden creada correctamente");

    limpiarFormulario();

    cargarOrdenes();

  }catch(error){

    console.error("Error creando orden:",error);

    alert("Error creando orden");

  }

}



function limpiarFormulario(){

  document.getElementById("cliente").value  = "";
  document.getElementById("vehiculo").value = "";
  document.getElementById("placa").value    = "";
  document.getElementById("tecnico").value  = "";

}



async function cargarOrdenes(){

  const empresaId = localStorage.getItem("empresaId");

  const lista = document.getElementById("listaOrdenes");

  try{

    const q = query(
      collection(db,"empresas",empresaId,"ordenes"),
      orderBy("fecha","desc")
    );

    const querySnapshot = await getDocs(q);

    if(querySnapshot.empty){

      lista.innerHTML = `
      <p class="text-gray-500">
        No hay órdenes registradas
      </p>
      `;

      return;
    }

    let html = "";

    querySnapshot.forEach(docSnap => {

      const data = docSnap.data();
      const id   = docSnap.id;

      const acciones = data.acciones || [];

      let accionesHTML = "";

      acciones.forEach(a => {
        accionesHTML += `
        <li class="text-sm text-gray-700">
          • ${a}
        </li>
        `;
      });

      html += `

      <div class="border p-4 rounded mb-4">

        <div class="flex justify-between mb-2">

          <div>

            <strong>${data.cliente}</strong><br>

            ${data.vehiculo} - ${data.placa}<br>

            Técnico: ${data.tecnico || "Sin asignar"}

          </div>

          <div class="text-sm text-gray-500">

            Estado: ${data.estado}

          </div>

        </div>

        <div class="mb-3">

          <ul>
            ${accionesHTML}
          </ul>

        </div>

        <div class="mt-2">

          <input
            id="accion-${id}"
            placeholder="Nueva acción"
            class="border p-2 rounded w-full mb-2"
          >

          <button
            onclick="window.agregarAccion('${id}')"
            class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Agregar acción
          </button>

        </div>

      </div>

      `;

    });

    lista.innerHTML = html;



    window.agregarAccion = async function(ordenId){

      const input = document.getElementById(`accion-${ordenId}`);
      const accion = input.value.trim();

      if(!accion){
        alert("Escriba una acción");
        return;
      }

      try{

        await agregarAccionOrden(ordenId,accion);

        input.value = "";

        cargarOrdenes();

      }catch(error){

        console.error("Error agregando acción:",error);

        alert("Error agregando acción");

      }

    };

  }catch(error){

    console.error("Error cargando órdenes:",error);

    lista.innerHTML = "Error cargando órdenes";

  }

}