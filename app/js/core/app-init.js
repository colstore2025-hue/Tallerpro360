/**
 * app-init.js
 * TallerPRO360 ERP SaaS
 * Inicialización global de la aplicación
 */

import { auth } from "./firebase-config.js";
import { obtenerEmpresaId } from "./empresa-context.js";

import { protegerApp } from "../auth/authGuard.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* ===============================
   INICIAR APLICACIÓN
=============================== */

export function iniciarApp(){

  console.log("🚀 Iniciando TallerPRO360...");

  protegerApp();

  onAuthStateChanged(auth,(user)=>{

    if(!user){

      console.warn("Usuario no autenticado");

      window.location.href = "/login.html";

      return;

    }

    const empresaId = obtenerEmpresaId();

    if(!empresaId){

      console.warn("Empresa no encontrada");

      window.location.href = "/login.html";

      return;

    }

    console.log("✅ Usuario activo:", user.uid);
    console.log("🏢 Empresa activa:", empresaId);

    iniciarERP();

  });

}


/* ===============================
   INICIAR ERP
=============================== */

function iniciarERP(){

  console.log("📊 ERP listo");

  const loader = document.getElementById("appLoader");

  if(loader){
    loader.style.display = "none";
  }

}