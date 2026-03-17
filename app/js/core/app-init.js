/*
=====================================
app-init.js
INICIALIZADOR PRO ERP
TallerPRO360 SaaS
=====================================
*/

import { panel } from "/app/js/modules/panel.js";
import { auth } from "/app/js/core/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


export async function iniciarApp(){

  console.log("🚀 Iniciando TallerPRO360...");

  const container = document.getElementById("appContent");

  if(!container){
    console.error("❌ No existe #appContent");
    return;
  }


  /* ===============================
  VALIDAR SESIÓN REAL FIREBASE
  =============================== */

  onAuthStateChanged(auth, async (user) => {

    if(!user){

      console.warn("⚠️ Sesión no válida");
      localStorage.clear();
      window.location.href = "/login.html";
      return;

    }

    console.log("✅ Usuario autenticado:", user.uid);


    /* ===============================
    ESTADO GLOBAL SaaS
    =============================== */

    const state = {

      uid: user.uid,
      empresaId: localStorage.getItem("empresaId"),
      rol: localStorage.getItem("rol"),
      planTipo: localStorage.getItem("planTipo") || "freemium"

    };


    if(!state.empresaId){

      console.error("❌ empresaId no definido");
      container.innerHTML = "<h2 style='padding:20px'>Error empresa no definida</h2>";
      return;

    }

    window.appState = state; // 🔥 GLOBAL (clave para IA y módulos)


    /* ===============================
    CARGAR PANEL
    =============================== */

    try{

      await panel(container, state);

      console.log("✅ Panel cargado correctamente");

    }
    catch(error){

      console.error("❌ Error cargando panel:", error);

      container.innerHTML = `
        <div style="padding:40px">
          <h1>❌ Error cargando el ERP</h1>
          <p>Revisa consola</p>
        </div>
      `;

    }

  });

}