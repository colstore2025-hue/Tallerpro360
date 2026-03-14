/**
 * panel.js
 * Panel principal dinámico ERP TallerPRO360
 * Carga módulos en contenedor central sin recargar la página
 */

import { dashboard } from "./dashboard.js";
import { clientes } from "./clientes.js";
import { ordenes } from "./ordenes.js";
import { inventario } from "./inventario.js";
import { configuracion } from "./configuracion.js"; // módulo de empresa, ayuda, manual

export async function panel(container) {

  container.innerHTML = `
  <div style="display:flex;height:100vh;font-family:sans-serif;">
    <!-- Menú lateral -->
    <nav id="menuLateral" style="width:220px;background:#111827;color:white;padding:15px;display:flex;flex-direction:column;gap:10px;">
      <h2 style="margin-bottom:20px;text-align:center;">TallerPRO360</h2>
      <button class="btnModulo" data-modulo="dashboard" style="padding:10px;border:none;border-radius:6px;background:#1f2937;color:white;cursor:pointer;">Dashboard</button>
      <button class="btnModulo" data-modulo="clientes" style="padding:10px;border:none;border-radius:6px;background:#1f2937;color:white;cursor:pointer;">Clientes</button>
      <button class="btnModulo" data-modulo="ordenes" style="padding:10px;border:none;border-radius:6px;background:#1f2937;color:white;cursor:pointer;">Órdenes</button>
      <button class="btnModulo" data-modulo="inventario" style="padding:10px;border:none;border-radius:6px;background:#1f2937;color:white;cursor:pointer;">Inventario</button>
      <button class="btnModulo" data-modulo="configuracion" style="padding:10px;border:none;border-radius:6px;background:#1f2937;color:white;cursor:pointer;">Configuración</button>
    </nav>

    <!-- Contenedor principal -->
    <main id="contenedorPrincipal" style="flex:1;padding:20px;overflow-y:auto;background:#1e293b;color:white;">
      Cargando módulo...
    </main>
  </div>
  `;

  const contenedor = document.getElementById("contenedorPrincipal");

  // Función para cargar módulo dinámicamente
  const modulos = {
    dashboard,
    clientes,
    ordenes,
    inventario,
    configuracion
  };

  function cargarModulo(nombre) {
    contenedor.innerHTML = "Cargando módulo...";
    const fnModulo = modulos[nombre];
    if(fnModulo) {
      fnModulo(contenedor);
    } else {
      contenedor.innerHTML = `<p style="color:red;">Módulo no encontrado: ${nombre}</p>`;
    }
  }

  // Inicializar módulo dashboard por defecto
  cargarModulo("dashboard");

  // Agregar eventos a botones
  const botones = document.querySelectorAll(".btnModulo");
  botones.forEach(btn => {
    btn.onclick = () => {
      cargarModulo(btn.dataset.modulo);
    };
  });

}