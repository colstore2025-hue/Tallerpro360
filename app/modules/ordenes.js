import { db } from "../js/firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { agregarAccionOrden } from "../js/ordenesAcciones.js";


export async function ordenes(container) {

  container.innerHTML = `
  <div class="p-6">

    <h1 class="text-2xl font-bold mb-6">
      Gestión de Órdenes
    </h1>

    <div class="bg-white p-4 rounded shadow mb-6">

      <h2 class="font-semibold mb-3">Nueva Orden</h2>

      <input id="cliente"
        class="border p-2 rounded w-full mb-2"
        placeholder="Nombre del cliente">

      <input id="vehiculo"
        class="border p-2 rounded w-full mb-2"
        placeholder="Vehículo">

      <input id="placa"
        class="border p-2 rounded w-full mb-2"
        placeholder="Placa">

      <input id="tecnico"
        class="border p-2 rounded w-full mb-4"
        placeholder="Técnico">

      <button id="crearOrden"
        class="bg-blue-600 text-white px-4 py-2 rounded">
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


async function crearOrden() {

  const cliente = document.getElementById("cliente").value;
  const vehiculo = document.getElementById("vehiculo").value;
  const placa = document.getElementById("placa").value;
  const tecnico = document.getElementById("tecnico").value;

  if (!cliente || !vehiculo || !placa) {
    alert("Complete los campos obligatorios");
    return;
  }

  try {

    await addDoc(collection(db, "ordenes"), {

      cliente: cliente,
      vehiculo: vehiculo,
      placa: placa,
      tecnico: tecnico || "Sin asignar",

      estado: "activa",
      total: 0,

      acciones: [],

      fecha: serverTimestamp()

    });

    alert("Orden creada correctamente");

    limpiarFormulario();

    cargarOrdenes();

  } catch (error) {

    console.error("Error creando orden:", error);

    alert("Error creando orden");

  }

}


function limpiarFormulario() {

  document.getElementById("cliente").value = "";
  document.getElementById("vehiculo").value = "";
  document.getElementById("placa").value = "";
  document.getElementById("tecnico").value = "";

}


async function cargarOrdenes() {

  const lista = document.getElementById("listaOrdenes");

  try {

    const querySnapshot = await getDocs(
      collection(db, "ordenes")
    );

    if (querySnapshot.empty) {

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
      const id = docSnap.id;

      html += `
      <div class="border p-4 rounded mb-3">

        <div class="flex justify-between mb-2">

          <div>

            <strong>${data.cliente}</strong><br>

            ${data.vehiculo} - ${data.placa}<br>

            Técnico: ${data.tecnico}

          </div>

          <div class="text-sm text-gray-500">

            Estado: ${data.estado}

          </div>

        </div>

        <div class="mt-3">

          <input
          id="accion-${id}"
          placeholder="Nueva acción"
          class="border p-2 rounded w-full mb-2"
          >

          <button
          onclick="window.agregarAccion('${id}')"
          class="bg-blue-600 text-white px-3 py-1 rounded"
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
      const accion = input.value;

      if(!accion){
        alert("Escriba una acción");
        return;
      }

      await agregarAccionOrden(ordenId, accion);

      input.value = "";

      alert("Acción agregada correctamente");

    };

  } catch (error) {

    console.error("Error cargando órdenes:", error);

    lista.innerHTML = "Error cargando órdenes";

  }

}