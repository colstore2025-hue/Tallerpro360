/**
 * configuracion.js
 * Módulo de Configuración de Taller y Ayuda - TallerPRO360
 * Ruta: app/js/modules/configuracion.js
 */

import { db } from "../core/firebase-config.js";
import { generarManualPDF } from "../manual/manual.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function configuracion(container) {
  container.innerHTML = `
    <h1 style="font-size:28px;margin-bottom:20px;">⚙ Configuración del Taller</h1>

    <div class="card">
      <h3>Datos de la Empresa/Taller</h3>
      <input id="tallerNombre" placeholder="Nombre del Taller" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <input id="tallerNIT" placeholder="NIT / ID Fiscal" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <input id="tallerDireccion" placeholder="Dirección" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <input id="tallerTelefono" placeholder="Teléfono" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <input id="tallerCorreo" placeholder="Correo Electrónico" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <button id="guardarTaller" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Configuración</button>
    </div>

    <div class="card">
      <h3>Manual de Usuario</h3>
      <button id="btnManual" style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">📄 Descargar Manual PDF</button>
    </div>

    <div class="card">
      <h3>Ayuda Rápida IA</h3>
      <input id="inputPregunta" placeholder="Escribe tu consulta..." style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
      <div id="respuestasAyuda" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;"></div>
    </div>
  `;

  // ===========================
  // Cargar datos guardados
  // ===========================
  await cargarDatosTaller();

  // ===========================
  // Botón guardar datos
  // ===========================
  document.getElementById("guardarTaller").onclick = guardarDatosTaller;

  // ===========================
  // Botón manual PDF
  // ===========================
  document.getElementById("btnManual").onclick = () => generarManualPDF();

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
GUARDAR DATOS DEL TALLER
=========================== */
async function guardarDatosTaller() {
  const data = {
    nombre: document.getElementById("tallerNombre").value.trim(),
    nit: document.getElementById("tallerNIT").value.trim(),
    direccion: document.getElementById("tallerDireccion").value.trim(),
    telefono: document.getElementById("tallerTelefono").value.trim(),
    correo: document.getElementById("tallerCorreo").value.trim(),
  };

  try {
    await setDoc(doc(db,"configuracion","empresa"), data);
    alert("✅ Configuración guardada correctamente");
  } catch(e) {
    console.error("Error guardando configuración:", e);
    alert("❌ Error al guardar la configuración");
  }
}

/* ===========================
CARGAR DATOS DEL TALLER
=========================== */
async function cargarDatosTaller() {
  try {
    const docSnap = await getDoc(doc(db,"configuracion","empresa"));
    if(docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("tallerNombre").value = data.nombre || "";
      document.getElementById("tallerNIT").value = data.nit || "";
      document.getElementById("tallerDireccion").value = data.direccion || "";
      document.getElementById("tallerTelefono").value = data.telefono || "";
      document.getElementById("tallerCorreo").value = data.correo || "";
    }
  } catch(e) {
    console.error("Error cargando configuración:", e);
  }
}

/* ===========================
RESPUESTAS FAQ SIMULADAS
=========================== */
function generarRespuestaFAQ(pregunta) {
  pregunta = pregunta.toLowerCase();
  if(pregunta.includes("cliente")) return "Para agregar un cliente, ve al módulo Clientes y presiona 'Guardar Cliente'.";
  if(pregunta.includes("orden")) return "Para crear una orden, completa los datos, agrega productos y presiona 'Guardar Orden'.";
  if(pregunta.includes("inventario")) return "Agrega nuevos productos en Inventario, definiendo costo, margen y stock inicial.";
  if(pregunta.includes("factura")) return "Cada orden genera automáticamente una factura PDF al guardarla.";
  return "Lo sentimos, aún no tenemos información para esa consulta. Intenta otra pregunta.";
}