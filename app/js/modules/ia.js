/*
================================================
IA.JS - Asistente Mecánico Avanzado con Voz
TallerPRO360 - Versión final avanzada
================================================
*/

import { diagnosticarProblema } from "../js/iaMecanica.js";

export function ia(container){

  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">🤖 IA Mecánica</h1>

    <input
      id="inputProblema"
      class="border p-2 w-full mb-4"
      placeholder="Ej: ruido en motor Toyota Hilux"
    />

    <div style="display:flex;gap:10px;margin-bottom:10px;">
      <button
        id="btnDictar"
        class="bg-purple-600 text-white px-4 py-2 rounded flex-1">
        🎙 Dictar Problema
      </button>
      <button
        id="btnDiagnosticar"
        class="bg-blue-600 text-white px-4 py-2 rounded flex-1">
        Diagnosticar
      </button>
    </div>

    <div
      id="resultadoIA"
      class="mt-6 bg-white p-4 rounded shadow">
      Esperando diagnóstico...
    </div>
  `;

  const inputProblema = document.getElementById("inputProblema");
  const resultadoIA = document.getElementById("resultadoIA");

  /* ===========================
  DIAGNOSTICAR PROBLEMA
  ============================ */
  document.getElementById("btnDiagnosticar").onclick = async ()=>{
    const texto = inputProblema.value.trim();
    if(!texto){
      hablar("Por favor ingresa el problema mecánico");
      return;
    }

    resultadoIA.innerText = "⏳ Analizando...";
    hablar("Analizando el problema, por favor espera");

    try{
      const respuesta = await diagnosticarProblema(texto);
      resultadoIA.innerText = respuesta;
      hablar("Diagnóstico completado. " + respuesta);
    } catch(e){
      console.error("Error IA:", e);
      resultadoIA.innerText = "❌ Error al diagnosticar";
      hablar("Ocurrió un error al diagnosticar");
    }
  };

  /* ===========================
  DICTADO POR VOZ
  ============================ */
  document.getElementById("btnDictar").onclick = ()=>{
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Recognition){
      hablar("Tu navegador no soporta dictado por voz");
      return;
    }

    const rec = new Recognition();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = ()=> hablar("Dictando problema, por favor hable ahora");
    rec.onresult = (e)=>{
      const texto = e.results[0][0].transcript.trim();
      inputProblema.value += texto + " ";
      hablar("Se ingresó el problema: " + texto);
    };
    rec.onerror = ()=> hablar("Ocurrió un error durante el dictado");
    rec.start();
  };

  /* ===========================
  SÍNTESIS DE VOZ
  ============================ */
  function hablar(texto){
    if(!texto) return;
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = "es-ES";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    window.speechSynthesis.speak(speech);
  }

}