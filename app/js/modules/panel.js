/*
=====================================
panel.js
CONTROL CENTRAL DE SESIÓN + ESTADO
TallerPRO360 SaaS PRO
=====================================
*/

import dashboard from "./dashboard.js";

/* ===============================
PANEL PRINCIPAL
=============================== */

export async function panel(container, uid){

  console.log("🧠 iniciando panel...", uid);

  if(!uid){
    container.innerHTML = "<h2>❌ Usuario no autenticado</h2>";
    return;
  }

  /* ===============================
  🔥 CREAR STATE GLOBAL SaaS
  =============================== */

  const state = await construirState(uid);

  if(!state){
    container.innerHTML = "<h2>❌ Error cargando empresa</h2>";
    return;
  }

  console.log("🏢 empresa cargada:", state.empresaId);

  /* ===============================
  UI BASE (LAYOUT APP)
  =============================== */

  container.innerHTML = `
    <div style="display:flex;min-height:100vh;background:#0f172a;color:white;">

      <!-- SIDEBAR -->
      <div style="
        width:240px;
        background:#020617;
        padding:20px;
        border-right:1px solid #111;
      ">
        <h2>🚀 TallerPRO360</h2>

        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">
          <button onclick="window.irModulo('dashboard')">📊 Dashboard</button>
          <button onclick="window.irModulo('ordenes')">🧾 Órdenes</button>
          <button onclick="window.irModulo('inventario')">📦 Inventario</button>
          <button onclick="window.irModulo('clientes')">👥 Clientes</button>
        </div>

        <hr style="margin:20px 0;border-color:#111;">

        <button onclick="window.logout()">🚪 Cerrar sesión</button>

      </div>

      <!-- CONTENIDO -->
      <div style="flex:1;padding:20px;">
        <div id="moduloContainer"></div>
      </div>

    </div>
  `;

  const moduloContainer = document.getElementById("moduloContainer");

  /* ===============================
  🔁 NAVEGACIÓN DINÁMICA
  =============================== */

  window.irModulo = async function(nombre){

    console.log("📦 cargando módulo:", nombre);

    moduloContainer.innerHTML = "Cargando...";

    try{

      if(nombre === "dashboard"){
        await dashboard(moduloContainer, state);
        return;
      }

      const module = await import(`/app/js/modules/${nombre}.js`);

      if(!module.default){
        throw new Error("El módulo no exporta default");
      }

      moduloContainer.innerHTML = "";

      await module.default(moduloContainer, state);

      console.log("✅ módulo cargado:", nombre);

    }catch(error){

      console.error("❌ error módulo:", nombre, error);

      moduloContainer.innerHTML = `
        <h3 style="color:red">Error cargando módulo</h3>
        <p>${error.message}</p>
      `;

    }

  };

  /* ===============================
  🚪 LOGOUT
  =============================== */

  window.logout = function(){

    localStorage.removeItem("uid");

    window.location = "/login.html";

  };

  /* ===============================
  🚀 CARGA INICIAL
  =============================== */

  await window.irModulo("dashboard");

}


/* ===============================
🏢 CONSTRUIR STATE SaaS
=============================== */

async function construirState(uid){

  try{

    // 🔥 IMPORT DINÁMICO para evitar errores de carga
    const {
      doc,
      getDoc
    } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const { db } = await import("../core/firebase-config.js");

    // 👉 buscar usuario
    const ref = doc(db, "usuarios", uid);

    const snap = await getDoc(ref);

    if(!snap.exists()){
      console.warn("⚠️ usuario no existe");
      return null;
    }

    const userData = snap.data();

    /* ===============================
    🔥 STATE GLOBAL
    =============================== */

    const state = {

      uid: uid,

      empresaId: userData.empresaId || null,

      rol: userData.rol || "admin",

      nombre: userData.nombre || "",

    };

    if(!state.empresaId){
      console.warn("⚠️ usuario sin empresaId");
      return null;
    }

    return state;

  }catch(error){

    console.error("❌ error construyendo state", error);

    return null;

  }

}