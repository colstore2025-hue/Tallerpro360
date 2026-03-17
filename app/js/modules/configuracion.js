/**
 * configuracion.js
 * Configuración avanzada de Taller (Datos fiscales, contacto, branding)
 * Nivel Tesla · Última generación
 * TallerPRO360 ERP SaaS
 */

import { collection, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configuracionModule(container, state) {
  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 8px #0ff;">⚙️ Configuración del Taller</h1>
    <div id="mensaje" style="margin-bottom:15px;"></div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
      <input id="nombreTaller" placeholder="Nombre del taller" />
      <input id="nit" placeholder="NIT / Documento fiscal" />
      <input id="direccion" placeholder="Dirección" />
      <input id="telefono" placeholder="Teléfono de contacto" />
      <input id="email" placeholder="Correo oficial" type="email" />
      <input id="website" placeholder="Sitio web" />
      <input id="logoURL" placeholder="URL Logo" />
      <textarea id="mensajePie" placeholder="Mensaje de pie de página (facturas/reporte)" style="grid-column:1 / span 2; height:60px;"></textarea>
    </div>

    <div style="margin-top:15px;">
      <button id="guardar" style="background:#0ff; color:#000; font-weight:bold; padding:10px 15px; border:none; border-radius:6px;">💾 Guardar Configuración</button>
    </div>
  `;

  const mensajeDiv = document.getElementById("mensaje");

  // 🔄 Cargar configuración
  async function cargarConfiguracion() {
    try {
      const tallerRef = doc(db, "talleres", state.empresaId);
      const snap = await getDoc(tallerRef);
      if (snap.exists()) {
        const data = snap.data();
        ["nombreTaller","nit","direccion","telefono","email","website","logoURL","mensajePie"].forEach(key => {
          document.getElementById(key).value = data[key] || "";
        });
      }
    } catch (e) {
      console.error(e);
      mensajeDiv.innerHTML = `<p style="color:red;">❌ Error cargando configuración</p>`;
    }
  }

  // 💾 Guardar configuración
  document.getElementById("guardar").onclick = async () => {
    try {
      const tallerRef = doc(db, "talleres", state.empresaId);
      const payload = {
        nombreTaller: document.getElementById("nombreTaller").value.trim(),
        nit: document.getElementById("nit").value.trim(),
        direccion: document.getElementById("direccion").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        email: document.getElementById("email").value.trim(),
        website: document.getElementById("website").value.trim(),
        logoURL: document.getElementById("logoURL").value.trim(),
        mensajePie: document.getElementById("mensajePie").value.trim(),
        actualizadoEn: new Date()
      };

      // Crear documento si no existe
      const snap = await getDoc(tallerRef);
      if (snap.exists()) {
        await updateDoc(tallerRef, payload);
      } else {
        await setDoc(tallerRef, payload);
      }

      mensajeDiv.innerHTML = `<p style="color:#0f0;">✅ Configuración guardada correctamente</p>`;
    } catch (e) {
      console.error(e);
      mensajeDiv.innerHTML = `<p style="color:red;">❌ Error guardando configuración</p>`;
    }
  };

  // INIT
  cargarConfiguracion();
}