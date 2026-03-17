/*
=====================================
router.js
Router simple SPA TallerPRO360
=====================================
*/

const routes = {

  dashboard: () => import("/app/js/modules/dashboard.js"),
  ordenes: () => import("/app/js/modules/ordenes.js"),
  inventario: () => import("/app/js/modules/inventario.js"),
  clientes: () => import("/app/js/modules/clientes.js"),
  finanzas: () => import("/app/js/modules/finanzas.js"),

};


/* ===============================
NAVEGACIÓN PRINCIPAL
=============================== */

export async function navigate(moduleName){

  const container = document.getElementById("appContent");

  if(!container){
    console.error("❌ contenedor no encontrado");
    return;
  }

  if(!routes[moduleName]){
    console.warn("⚠️ módulo no existe:", moduleName);
    container.innerHTML = "<h2 style='padding:20px'>Módulo no encontrado</h2>";
    return;
  }

  try{

    console.log("📦 cargando módulo:", moduleName);

    const module = await routes[moduleName]();

    // limpiar vista
    container.innerHTML = "";

    // ejecutar módulo
    await module.default(container, window.appState);

    console.log("✅ módulo cargado:", moduleName);

  }
  catch(error){

    console.error("❌ error cargando módulo:", error);

    container.innerHTML = `
      <div style="padding:30px">
        <h2>Error cargando módulo</h2>
      </div>
    `;

  }

}


/* ===============================
GLOBAL (para botones UI)
=============================== */

if(typeof window !== "undefined"){
  window.navigate = navigate;
}