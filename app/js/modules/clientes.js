/*
================================================
CLIENTES.JS - Versión Avanzada
Gestión de clientes con dictado y voz de IA
Ubicación: /app/js/modules/clientes.js
================================================
*/

import CustomerManager from "./customerManager.js";
import { iniciarAsistenteWorkshop } from "../voice/voiceAssistantWorkshop.js";

const customerManager = new CustomerManager();

/**
 * Función principal de UI clientes
 */
export async function clientes(container) {
  container.innerHTML = `
<h1 style="font-size:26px;margin-bottom:20px;">👥 Clientes</h1>

<div class="card">
  <h3>Nuevo Cliente</h3>
  <input id="nombreCliente" placeholder="Nombre" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="telefonoCliente" placeholder="Teléfono" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <input id="emailCliente" placeholder="Email" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
  <button id="vozCliente" style="margin-top:5px;padding:8px 15px;background:#6366f1;border:none;border-radius:6px;color:white;cursor:pointer;">🎤 Dictar Nombre</button>
  <button id="guardarCliente" style="margin-top:10px;padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;">Guardar Cliente</button>
</div>

<div class="card">
  <h3>Buscar</h3>
  <input id="buscarCliente" placeholder="Buscar cliente..." style="width:100%;padding:10px;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
</div>

<div class="card">
  <h3>Lista de Clientes</h3>
  <div id="listaClientes">Cargando clientes...</div>
</div>
`;

  // ===========================
  // Eventos
  // ===========================
  document.getElementById("guardarCliente").onclick = guardarCliente;
  document.getElementById("buscarCliente").oninput = filtrarClientes;
  document.getElementById("vozCliente").onclick = () => dictarInput("nombreCliente");

  // Cargar clientes inicial
  await cargarClientes();
}

/* ===========================
FUNCIONES
=========================== */

async function guardarCliente() {
  const nombre = document.getElementById("nombreCliente").value.trim();
  const telefono = document.getElementById("telefonoCliente").value.trim();
  const email = document.getElementById("emailCliente").value.trim();

  if (!nombre || !telefono) {
    hablar("Nombre y teléfono son requeridos");
    return alert("Nombre y teléfono requeridos");
  }

  const id = await customerManager.createCustomer({ name: nombre, phone: telefono, email });
  if (id) {
    hablar("Cliente guardado correctamente");
    alert("✅ Cliente guardado");
    limpiarFormulario();
    await cargarClientes();
  } else {
    hablar("Error guardando cliente");
    alert("❌ Error guardando cliente");
  }
}

async function cargarClientes() {
  const lista = document.getElementById("listaClientes");

  try {
    const customers = await customerManager.loadCustomers();

    if (!customers.length) {
      lista.innerHTML = "No hay clientes registrados";
      return;
    }

    let html = `<table style="width:100%;border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1e293b;"><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Estado</th></tr>`;

    customers.forEach(c => {
      html += `<tr>
        <td>${c.name || ""}</td>
        <td>${c.phone || ""}</td>
        <td>${c.email || ""}</td>
        <td>${customerManager.predictReturn(c)}</td>
      </tr>`;
    });

    html += "</table>";
    lista.innerHTML = html;
  } catch (error) {
    console.error("Error cargando clientes:", error);
    lista.innerHTML = "❌ Error cargando clientes";
    hablar("Ocurrió un error cargando los clientes");
  }
}

function filtrarClientes() {
  const input = document.getElementById("buscarCliente").value.toLowerCase();
  const rows = document.querySelectorAll("#listaClientes table tr");
  rows.forEach((row, index) => {
    if (index === 0) return;
    row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

function limpiarFormulario() {
  document.getElementById("nombreCliente").value = "";
  document.getElementById("telefonoCliente").value = "";
  document.getElementById("emailCliente").value = "";
}

/* ===========================
FUNCIONES DE VOZ
=========================== */

/**
 * Dictado de texto en input o textarea
 * @param {string} inputId 
 */
function dictarInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    hablar("Tu navegador no soporta dictado por voz");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => hablar("Comienza a dictar");
  recognition.onerror = (e) => {
    console.error("Error dictado:", e);
    hablar("Error en dictado de voz");
  };
  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    input.value += texto + " ";
    hablar("Texto agregado");
  };
  recognition.start();
}

/**
 * Función de voz de IA
 * @param {string} texto
 */
function hablar(texto) {
  if (!texto) return;
  const speech = new SpeechSynthesisUtterance(texto);
  speech.lang = "es-ES";
  speech.rate = 1;
  speech.pitch = 1;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
}