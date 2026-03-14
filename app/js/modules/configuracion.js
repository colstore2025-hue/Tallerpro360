/**
 * configuracion.js
 * Configuración del TallerPRO360: datos del taller, ayuda IA y manual
 */

import { db } from "../core/firebase-config.js";
import { generarManualPDF } from "../manual/manual.js"; // módulo de PDF
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CONFIG_DOC = "configuracion_taller"; // Documento único en Firestore

export async function configuracion(container) {

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">⚙ Configuración del Taller</h1>

<div class="card">
<h3>Datos del Taller</h3>
<input id="tallerNombre" placeholder="Nombre del Taller" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="tallerNit" placeholder="NIT / Identificación" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="tallerDireccion" placeholder="Dirección" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="tallerTelefono" placeholder="Teléfono" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="tallerLogo" placeholder="URL o base64 del logo" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<button id="guardarTaller" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Configuración</button>
</div>

<div class="card">
<h3>Manual de Usuario</h3>
<button id="btnManual" style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">📄 Descargar Manual</button>
</div>

<div class="card">
<h3>Ayuda Interactiva</h3>
<p>Escribe tu consulta y presiona Enter:</p>
<input id="inputPregunta" placeholder="Ej: Cómo agregar un cliente..." style="width:100%;padding:8px;margin-bottom:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<div id="respuestasAyuda" style="margin-top:10px;max-height:150px;overflow-y:auto;background:#111827;color:white;padding:10px;border-radius:6px;"></div>
</div>
`;

  // ===========================
  // Cargar configuración existente
  // ===========================
  await cargarConfiguracion();

  // ===========================
  // Eventos botones
  // ===========================
  document.getElementById("guardarTaller").onclick = guardarConfiguracion;
  document.getElementById("btnManual").onclick = () => generarManualPDF();

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
CARGAR CONFIGURACIÓN DESDE FIRESTORE
=========================== */
async function cargarConfiguracion() {
  const docRef = doc(db, "configuracion", CONFIG_DOC);
  try {
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("tallerNombre").value = data.nombre || "";
      document.getElementById("tallerNit").value = data.nit || "";
      document.getElementById("tallerDireccion").value = data.direccion || "";
      document.getElementById("tallerTelefono").value = data.telefono || "";
      document.getElementById("tallerLogo").value = data.logo || "";
    }
  } catch(e) {
    console.error("Error cargando configuración:", e);
  }
}


/* ===========================
GUARDAR CONFIGURACIÓN
=========================== */
async function guardarConfiguracion() {
  const nombre = document.getElementById("tallerNombre").value.trim();
  const nit = document.getElementById("tallerNit").value.trim();
  const direccion = document.getElementById("tallerDireccion").value.trim();
  const telefono = document.getElementById("tallerTelefono").value.trim();
  const logo = document.getElementById("tallerLogo").value.trim();

  if(!nombre) return alert("Nombre del taller requerido");

  try {
    await setDoc(doc(db,"configuracion", CONFIG_DOC), {
      nombre,
      nit,
      direccion,
      telefono,
      logo
    });
    alert("✅ Configuración guardada correctamente");
  } catch(e) {
    console.error("Error guardando configuración:", e);
    alert("❌ Error al guardar configuración");
  }
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
  return "Lo sentimos, aún no tenemos información para esa consulta. Intenta otra pregunta.";
}