import { crearOrden } from "./ordenes.js";

document.getElementById("formOrden")
.addEventListener("submit", function(e){
  e.preventDefault();

  const data = {
    cliente: document.getElementById("cliente").value,
    vehiculo: document.getElementById("vehiculo").value,
    placa: document.getElementById("placa").value,
    tecnico: document.getElementById("tecnico").value
  };

  crearOrden(data);
});