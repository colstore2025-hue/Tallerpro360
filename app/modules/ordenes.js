import { crearOrden, obtenerOrdenes } from "../js/ordenesService.js";

export async function ordenes(container) {

  container.innerHTML = `
  
  <h1 class="text-2xl font-bold mb-6">Órdenes de Servicio</h1>

  <div class="bg-white p-4 rounded shadow mb-6">

      <div class="grid grid-cols-4 gap-3">

        <input id="cliente" class="border p-2 rounded" placeholder="Cliente"/>

        <input id="vehiculo" class="border p-2 rounded" placeholder="Vehículo"/>

        <input id="placa" class="border p-2 rounded" placeholder="Placa"/>

        <input id="tecnico" class="border p-2 rounded" placeholder="Técnico"/>

      </div>

      <button id="guardarOrden" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
        Crear Orden
      </button>

  </div>

  <div class="bg-white p-4 rounded shadow">

      <h2 class="font-semibold mb-4">Listado de Órdenes</h2>

      <div id="listaOrdenes"></div>

  </div>

  `;

  /* =========================
  CREAR ORDEN
  ========================= */

  document.getElementById("guardarOrden").onclick = async () => {

    const cliente = document.getElementById("cliente").value;
    const vehiculo = document.getElementById("vehiculo").value;
    const placa = document.getElementById("placa").value;
    const tecnico = document.getElementById("tecnico").value;

    await crearOrden({
      cliente,
      vehiculo,
      placa,
      tecnico
    });

    cargarOrdenes();

  };


  /* =========================
  CARGAR ORDENES
  ========================= */

  async function cargarOrdenes() {

    const ordenes = await obtenerOrdenes();

    const lista = document.getElementById("listaOrdenes");

    lista.innerHTML = "";

    if (ordenes.length === 0) {

      lista.innerHTML = `
      <p class="text-gray-500">No hay órdenes registradas.</p>
      `;
      return;

    }

    ordenes.forEach(o => {

      lista.innerHTML += `

      <div class="border p-3 rounded mb-2">

        <b>Cliente:</b> ${o.cliente}<br>
        <b>Vehículo:</b> ${o.vehiculo}<br>
        <b>Placa:</b> ${o.placa}<br>
        <b>Técnico:</b> ${o.tecnico}<br>
        <b>Estado:</b> ${o.estado}

      </div>

      `;

    });

  }

  cargarOrdenes();

}