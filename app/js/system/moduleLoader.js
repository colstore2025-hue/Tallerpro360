import dashboard from "/js/modules/dashboard.js";

const modules = {
  ordenes: () => import("/js/modules/ordenes.js"),
  clientes: () => import("/js/modules/clientes.js"),
  inventario: () => import("/js/modules/inventario.js"),
  finanzas: () => import("/js/modules/finanzas.js"),
  configuracion: () => import("/js/modules/configuracion.js"),
  reportes: () => import("/js/modules/reportes.js"),
  aiAssistant: () => import("/js/ai/aiAssistant.js"),
  aiAdvisor: () => import("/js/ai/aiAdvisor.js")
};

const state = { currentModule:null, empresaId:"taller_001", cargando:false };

function showLoader(container){ container.innerHTML='<div style="padding:40px;text-align:center;color:#00ffcc;">⚡ Cargando módulo...</div>'; }
function showError(container,error){ container.innerHTML=`<div style="color:red;padding:20px;">❌ Error: ${error.message}</div>`; }

export async function loadModule(name, container){
  if(state.cargando) return;
  try{
    state.cargando=true;
    showLoader(container);
    if(!modules[name]) throw new Error(`Módulo no existe: ${name}`);
    const module = await modules[name]();
    if(!module?.default) throw new Error(`Módulo inválido: ${name}`);
    container.innerHTML='';
    await module.default(container, state);
    state.currentModule=name;
  }catch(e){ console.error(e); showError(container,e); }
  finally{ state.cargando=false; }
}

export function initApp(){
  const root=document.getElementById("app");
  root.innerHTML=`
    <div style="display:flex; height:100vh; background:#0a0a0a;">
      <div style="width:240px;background:#111;padding:10px;">
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
  const view=document.getElementById("view");
  window.navigate=async (name)=>{ name==='dashboard'? await dashboard(view,state) : await loadModule(name,view); state.currentModule=name; };
  window.navigate("dashboard");
}