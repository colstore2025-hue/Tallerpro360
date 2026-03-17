/**
 * Module Loader - TallerPRO360
 * Ruta: /app/js/system/moduleLoader.js
 */
import dashboard from "/app/js/modules/dashboard.js";

const modules = {
  ordenes: () => import("/app/js/modules/ordenes.js"),
  clientes: () => import("/app/js/modules/clientes.js"),
  inventario: () => import("/app/js/modules/inventario.js"),
  finanzas: () => import("/app/js/modules/finanzas.js"),
  configuracion: () => import("/app/js/modules/configuracion.js"),
  reportes: () => import("/app/js/modules/reportes.js"),
  aiAssistant: () => import("/app/js/ai/aiAssistant.js"),
  aiAdvisor: () => import("/app/js/ai/aiAdvisor.js")
};

const state = {
  currentModule: null,
  empresaId: "taller_001",
  cargando: false
};

function showLoader(container){
  container.innerHTML = `<div style="color:#00ffcc; font-size:18px; text-align:center; padding:40px;">⚡ Cargando módulo...</div>`;
}

function showError(container,error){
  container.innerHTML = `<div style="color:red; padding:20px;">❌ Error cargando módulo <br/> ${error.message}</div>`;
}

export async function loadModule(moduleName, container){
  if(state.cargando) return;
  try{
    state.cargando=true;
    showLoader(container);
    if(!modules[moduleName]) throw new Error(`Módulo no existe: ${moduleName}`);
    const module = await modules[moduleName]();
    if(!module || !module.default) throw new Error(`Módulo inválido: ${moduleName}`);
    container.innerHTML="";
    await module.default(container,state);
    state.currentModule=moduleName;
  }catch(error){
    console.error("Error cargando módulo:",error);
    showError(container,error);
  }finally{
    state.cargando=false;
  }
}

export function initApp(){
  const root = document.getElementById("app");
  root.innerHTML=`
    <div style="display:flex; height:100vh; background:#0a0a0a; color:white;">
      <div style="width:240px; background:#111; padding:10px;">
        <h2 style="color:#00ffcc;">TallerPRO360</h2>
        <button onclick="window.navigate('dashboard')">📊 Dashboard</button>
        <button onclick="window.navigate('ordenes')">🧾 Órdenes</button>
        <button onclick="window.navigate('clientes')">👥 Clientes</button>
        <button onclick="window.navigate('inventario')">📦 Inventario</button>
        <button onclick="window.navigate('finanzas')">💰 Finanzas</button>
        <button onclick="window.navigate('reportes')">📈 Reportes</button>
        <button onclick="window.navigate('configuracion')">⚙️ Configuración</button>
      </div>
      <div id="view" style="flex:1; padding:20px; overflow:auto;"></div>
    </div>
  `;

  const view = document.getElementById("view");
  window.navigate = async (moduleName)=>{
    if(state.cargando) return;
    if(moduleName==="dashboard"){
      showLoader(view);
      await dashboard(view,state);
      state.currentModule="dashboard";
    }else{
      await loadModule(moduleName,view);
    }
  };

  window.navigate("dashboard");
  initAI();
  initVoice();
}

async function initAI(){
  try{
    const ai = await modules.aiAssistant();
    if(ai?.init) ai.init();
    const advisor = await modules.aiAdvisor();
    if(advisor?.init) advisor.init();
    console.log("🤖 IA inicializada");
  }catch(e){
    console.warn("⚠️ IA no disponible:", e.message);
  }
}

let voiceInitialized=false;
async function initVoice(){
  if(voiceInitialized) return;
  try{
    const voice = await import("/app/js/voice/voiceAssistantWorkshop.js");
    if(voice?.init){voice.init(); voiceInitialized=true; console.log("🎤 Voz activada");}
  }catch(e){
    console.warn("⚠️ Voz no disponible:", e.message);
  }
}