/**
 * authGuard.js
 * TallerPRO360 ERP SaaS
 * Protección de rutas autenticadas
 */

import { auth } from "./firebase-config.js";
import { obtenerEmpresaId } from "./empresa-context.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* ===============================
   PROTEGER APLICACIÓN
=============================== */

export function protegerApp(){

  onAuthStateChanged(auth,(user)=>{

    if(!user){

      console.warn("Usuario no autenticado");

      window.location.href="/login.html";

      return;

    }

    const empresaId = obtenerEmpresaId();

    if(!empresaId){

      console.warn("Empresa no definida");

      window.location.href="/login.html";

      return;

    }

    console.log("Usuario autenticado:",user.uid);
    console.log("Empresa activa:",empresaId);

  });

}


/* ===============================
   PROTEGER SOLO ADMIN
=============================== */

export function protegerAdmin(){

  onAuthStateChanged(auth,(user)=>{

    if(!user){

      window.location.href="/login.html";
      return;

    }

    const rol=localStorage.getItem("rol");

    if(rol!=="admin" && rol!=="dueno"){

      alert("No tienes permisos para acceder");

      window.location.href="/app/index.html";

    }

  });

}


/* ===============================
   CERRAR SESIÓN
=============================== */

export async function cerrarSesion(){

  try{

    await signOut(auth);

    localStorage.clear();

    window.location.href="/login.html";

  }
  catch(error){

    console.error("Error cerrando sesión:",error);

  }

}