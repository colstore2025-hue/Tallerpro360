/**
 * configuracion.js
 * Módulo de configuración y ayuda del TallerPRO360 ERP
 */

import { generarManualPDF } from "../manual/manual.js"; // módulo de PDF

export async function configuracion(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">⚙ Configuración del Taller</h1>

<!-- Datos del Taller -->
<div class="card">
<h3>Datos de la Empresa/Taller</h3>
<input id="empresaNombre" placeholder="Nombre del taller" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaDireccion" placeholder="Dirección" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaTelefono" placeholder="Teléfono" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaNIT" placeholder="NIT / Documento fiscal" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<button id="guardarEmpresa" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Datos</button>
</div>

<!-- Ayuda interactiva -->
<div class="card">
<h3>Ayuda IA</h3>
<p>Escribe tu consulta y presiona Enter:</p>
<input id="inputPregunta" placeholder="Ej: Cómo agregar un cliente..." style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<div id="respuestasAyuda" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;"></div>
</div>

<!-- Manual PDF -->
<div class="card">
<h3>Manual de Usuario</h3>
<button id="btnManual" style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">📄 Descargar Manual PDF</button>
</div>
`;

  // ===========================
  // Guardar datos de la empresa
  // ===========================
  document.getElementById("guardarEmpresa").onclick = () => {
    const nombre = document.getElementById("empresaNombre").value.trim();
    const direccion = document.getElementById("empresaDireccion").value.trim();
    const telefono = document.getElementById("empresaTelefono").value.trim();
    const nit = document.getElementById("empresaNIT").value.trim();

    if(!nombre){
      alert("El nombre del taller es obligatorio");
      return;
    }

    // Aquí se puede guardar en Firebase o LocalStorage
    const empresa = { nombre, direccion, telefono, nit };
    localStorage.setItem("tallerConfig", JSON.stringify(empresa));
    alert("✅ Datos de la empresa guardados correctamente");
  };

  // ===========================
  // Cargar configuración previa
  // ===========================
  const configPrev = localStorage.getItem("tallerConfig");
  if(configPrev){
    const c = JSON.parse(configPrev);
    document.getElementById("empresaNombre").value = c.nombre || "";
    document.getElementById("empresaDireccion").value = c.direccion || "";
    document.getElementById("empresaTelefono").value = c.telefono || "";
    document.getElementById("empresaNIT").value = c.nit || "";
  }

  // ===========================
  // Botón manual
  // ===========================
  document.getElementById("btnManual").onclick = () => {
    generarManualPDF();
  };

  // ===========================
  // Módulo de ayuda interactivo
  // ===========================
  const inputPregunta = document.getElementById("inputPregunta");
  const respuestasContainer = document.getElementById("respuestasAyuda");

  inputPregunta.addEventListener("keypress", function(e) {
    if(e.key === "Enter") {
      const pregunta = inputPregunta.value.trim();
      if(!pregunta) return;
      const respuesta = generarRespuestaFAQ(pregunta);
      const div = document.createElement("div");
      div.style.marginBottom = "8px";
      div.innerHTML = `<b>Pregunta:</b> ${pregunta}<br><b>Respuesta:</b> ${respuesta}`;
      respuestasContainer.prepend(div);
      inputPregunta.value = "";
    }
  });

}


/* ===========================
RESPUESTAS FAQ SIMULADAS
=========================== */
function generarRespuestaFAQ(pregunta){
  pregunta = pregunta.toLowerCase();
  if(pregunta.includes("cliente")) return "Para agregar un cliente, ve al módulo Clientes y presiona 'Guardar Cliente'.";
  if(pregunta.includes("orden")) return "Para crear una orden, completa los datos y agrega productos, luego presiona 'Guardar Orden'.";
  if(pregunta.includes("inventario")) return "Puedes agregar nuevos productos en Inventario, definiendo costo, margen y stock inicial.";
  if(pregunta.includes("factura")) return "Cada orden permite generar una factura PDF automáticamente al guardarla.";
  if(pregunta.includes("manual")) return "Haz clic en 'Descargar Manual PDF' para obtener el manual completo de usuario.";
  return "Lo sentimos, aún no tenemos información para esa consulta. Intenta otra pregunta.";
}