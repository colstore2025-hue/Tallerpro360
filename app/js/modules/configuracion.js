/**
 * configuracion.js
 * Configuración de la empresa y módulo de ayuda
 * TallerPRO360 ERP
 */

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { generarManualPDF } from "../system/manual.js";

export async function configuracion(container){

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px;">⚙ Configuración del Taller</h1>

<div class="card">
<h3>Datos de la Empresa/Taller</h3>

<input id="empresaNombre" placeholder="Nombre del taller" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaRUC" placeholder="NIT/RUC" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaDireccion" placeholder="Dirección" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaTelefono" placeholder="Teléfono" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">
<input id="empresaEmail" placeholder="Email" style="width:100%;padding:10px;margin:6px 0;border-radius:6px;border:1px solid #333;background:#020617;color:white;">

<button id="guardarEmpresa" style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;margin-top:10px;">Guardar Configuración</button>
</div>

<div class="card">
<h3>Manual y Ayuda</h3>
<button id="btnManual" style="padding:10px 20px;background:#16a34a;border:none;border-radius:6px;color:white;cursor:pointer;margin-bottom:10px;">📄 Descargar Manual de Usuario</button>
<p>También puedes escribir tus consultas en el módulo de ayuda del Dashboard.</p>
</div>
`;

  // ===========================
  // Cargar datos guardados
  // ===========================
  await cargarDatosEmpresa();

  // ===========================
  // Guardar datos
  // ===========================
  document.getElementById("guardarEmpresa").onclick = guardarDatosEmpresa;

  // ===========================
  // Descargar manual
  // ===========================
  document.getElementById("btnManual").onclick = () => {
    generarManualPDF();
  };

}


/* ===========================
CARGAR DATOS DE LA EMPRESA
=========================== */
async function cargarDatosEmpresa(){
  try{
    const querySnapshot = await getDocs(collection(db,"configuracion"));
    if(!querySnapshot.empty){
      const docData = querySnapshot.docs[0].data();
      document.getElementById("empresaNombre").value = docData.nombre || "";
      document.getElementById("empresaRUC").value = docData.ruc || "";
      document.getElementById("empresaDireccion").value = docData.direccion || "";
      document.getElementById("empresaTelefono").value = docData.telefono || "";
      document.getElementById("empresaEmail").value = docData.email || "";
    }
  }catch(e){
    console.error("Error cargando configuración:", e);
  }
}


/* ===========================
GUARDAR DATOS DE LA EMPRESA
=========================== */
async function guardarDatosEmpresa(){
  const nombre = document.getElementById("empresaNombre").value.trim();
  const ruc = document.getElementById("empresaRUC").value.trim();
  const direccion = document.getElementById("empresaDireccion").value.trim();
  const telefono = document.getElementById("empresaTelefono").value.trim();
  const email = document.getElementById("empresaEmail").value.trim();

  if(!nombre){
    alert("El nombre del taller es obligatorio");
    return;
  }

  try{
    // Guardar en Firestore (documento único)
    const docRef = doc(db,"configuracion","empresa");
    await setDoc(docRef,{
      nombre,
      ruc,
      direccion,
      telefono,
      email,
      fecha: new Date()
    });

    alert("✅ Configuración guardada correctamente");

  }catch(e){
    console.error("Error guardando configuración:", e);
    alert("❌ Error al guardar configuración");
  }
}