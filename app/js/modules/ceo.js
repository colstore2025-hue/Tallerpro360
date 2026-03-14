/*
================================================
CEO.JS - Panel Ejecutivo Avanzado
TallerPRO360 - Versión final avanzada
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function ceo(container) {

  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">👔 Panel CEO</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Empresas Activas</h2>
        <p id="ceoEmpresas" class="text-3xl font-bold">0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Suscripciones Activas</h2>
        <p id="ceoSuscripciones" class="text-3xl font-bold">0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Ingresos MRR</h2>
        <p id="ceoIngresos" class="text-3xl font-bold">$0</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-3">Planes Activos</h2>
        <p id="ceoPlanes" class="text-3xl font-bold">0</p>
      </div>

    </div>

    <div class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-3">Alertas del CEO (IA)</h2>
      <div id="ceoAlertas">Cargando alertas...</div>
    </div>
  `;

  // ===========================
  // Cargar datos del panel
  // ===========================
  await cargarDatosCEO();
}

// ===========================
// FUNCIONES AUXILIARES
// ===========================
async function cargarDatosCEO(){
  try{
    const empresasSnap = await getDocs(collection(db,"empresas"));
    const suscripcionesSnap = await getDocs(collection(db,"suscripciones"));
    const planesSnap = await getDocs(collection(db,"planes"));

    const empresas = empresasSnap.size || 0;
    const suscripciones = suscripcionesSnap.size || 0;
    const planes = planesSnap.size || 0;

    // Calcular ingresos MRR (sumatoria de planes activos)
    let ingresos = 0;
    suscripcionesSnap.forEach(doc=>{
      const data = doc.data();
      if(data.activa && data.precio) ingresos += data.precio;
    });

    // Actualizar UI
    document.getElementById("ceoEmpresas").innerText = empresas;
    document.getElementById("ceoSuscripciones").innerText = suscripciones;
    document.getElementById("ceoPlanes").innerText = planes;
    document.getElementById("ceoIngresos").innerText = `$${ingresos.toLocaleString()}`;

    // Alertas IA
    const alertasDiv = document.getElementById("ceoAlertas");
    if(window.SuperAI){
      const alertas = await window.SuperAI.analyzeCEO({empresas,suscripciones,planes,ingresos});
      alertasDiv.innerHTML = alertas.map(a=>`<p>⚠️ ${a}</p>`).join("");
    } else {
      alertasDiv.innerHTML = "<p>IA de alertas no disponible</p>";
    }

    // Anunciar cifras por voz
    hablar(`Panel CEO cargado. Empresas activas: ${empresas}, Suscripciones activas: ${suscripciones}, Ingresos M R R: ${ingresos} dólares, Planes activos: ${planes}`);
    
  } catch(e){
    console.error("Error cargando datos CEO:", e);
    document.getElementById("ceoAlertas").innerText = "❌ Error cargando datos";
    hablar("Error cargando datos del panel CEO");
  }
}

// ===========================
// Función de síntesis de voz
// ===========================
function hablar(texto){
  if(!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}