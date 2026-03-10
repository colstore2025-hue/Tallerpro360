/*
========================================
FORMULARIO CREAR ORDEN
Ubicación:
app/js/erp/ordenFormulario.js
========================================
*/

import { crearOrden } from "../services/ordenService.js";

const form = document.getElementById("formOrden");

if (form) {

  form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const data = {

      cliente: document.getElementById("cliente").value,
      vehiculo: document.getElementById("vehiculo").value,
      placa: document.getElementById("placa").value,
      tecnico: document.getElementById("tecnico").value

    };

    try {

      await crearOrden(data);

      alert("Orden creada correctamente");

      form.reset();

    } catch (error) {

      console.error("Error creando orden:", error);

      alert("Error al crear la orden");

    }

  });

}