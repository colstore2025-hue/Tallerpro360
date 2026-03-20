/**
 * moduleLoader.js
 * Cargador central del ERP TallerPRO360
 * Versión ULTRA PRO 🔥 · Soporte planes Freemium → Enterprise
 */

let voiceInitialized = false;
const state = {
  currentModule: null,
  empresaId: null,
  uid: null,
  rolGlobal: null,
  plan: null,
  cargando: false,
};

/* ================= MAPA DE MÓDULOS ================= */
const modules = {
  dashboard: () => import("../modules/dashboard.js"),
  ordenes: () => import("../modules/ordenes.js"),
  clientes: () => import("../modules/clientes.js"),
  inventario: () => import("../modules/inventario.js"),
  finanzas: () => import("../modules/finanzas.js"),
  contabilidad: () => import("../modules/contabilidad.js"),
  reportes: () => import("../modules/reportes.js"),
  configuracion: () => import("../modules/configuracion.js"),
  aiasistant: () => import("../modules/aiAssistant.js"),
  aiadvisor: () => import("../modules/aiAdvisor.js"),
  gerenteai: () => import("../modules/gerenteAI.js"),
};

/* ================= CEO AUTÓNOMO ================= */
async function initCEO(){
  try {
    const ceo = await import("../ai/ceoAutonomo.js");
    if(ceo.default?.iniciar) ceo.default.iniciar(state);
    console.log("👑 CEO Autónomo ACTIVADO");
  } catch(e){
    console.warn("⚠️ CEO no disponible", e.message);
  }
}

/* ================= UI HELPERS ================= */
function showLoader(container, text="⚡ Cargando módulo..."){
  container.innerHTML = `<div style="color:#00ffcc;font-size:18px;text-align:center;padding:40px;">${text}</div>`;
}
function showError(container,error){
  container.innerHTML = `<div style="color:red;padding:20px;">❌ Error cargando módulo<br/>${error.message}</div>`;
}

/* ================= LOAD MODULE ================= */
export async function loadModule(moduleName){
  const container = document.getElementById("appContainer");
  if(state.cargando) return;

  try{
    state.cargando = true;
    showLoader(container);

    const key = moduleName.toLowerCase().trim();
    if(!modules[key]) throw new Error(`Módulo no existe: ${moduleName}`);

    const module = await modules[key]();
    if(!module?.default) throw new Error(`Módulo inválido: ${moduleName}`);

    container.innerHTML = "";
    await module.default(container,state);
    state.currentModule = key;

  }catch(e){
    console.error("❌ Error cargando módulo:", moduleName,e);
    showError(container,e);
  }finally{ state.cargando = false; }
}

/* ================= INIT APP ================= */
export async function initApp(){
  const container = document.getElementById("appContainer");
  const sidebar = document.getElementById("sidebar");

  try{
    const { auth, db } = await import("../core/firebase-config.js");
    const { onAuthStateChanged, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    onAuthStateChanged(auth, async(user)=>{
      if(!user) return window.location.href="/login.html";

      const snap = await getDoc(doc(db,"usuariosGlobal",user.uid));
      if(!snap.exists()) return window.location.href="/login.html";

      const u = snap.data();
      state.uid = user.uid;
      state.empresaId = u.empresaId;
      state.rolGlobal = u.rolGlobal || "user";
      state.plan = u.plan || "Freemium";

      renderSidebar(sidebar,state.rolGlobal,state.plan);
      await loadModule("dashboard");

      initCEO();
      initAI();
      initVoice();
    });

    document.getElementById("logoutBtn").onclick = async ()=>{
      await signOut(auth);
      localStorage.clear();
      window.location.href="/login.html";
    };

  }catch(e){
    container.innerHTML=`<div style="color:red;">❌ Error inicializando APP<br>${e.message}</div>`;
    console.error(e);
  }
}

/* ================= SIDEBAR ================= */
function renderSidebar(sidebar,rol,plan){
  // Módulos básicos por plan
  const baseModules = [
    { id:"dashboard", label:"📊 Dashboard" },
    { id:"ordenes", label:"🧾 Órdenes" },
    { id:"clientes", label:"👥 Clientes" }
  ];

  if(["Pro","Elite","Enterprise"].includes(plan)){
    baseModules.push({ id:"inventario", label:"📦 Inventario" });
    baseModules.push({ id:"finanzas", label:"💰 Finanzas" });
  }

  if(rol==="superadmin" || plan==="Enterprise"){
    baseModules.push(
      { id:"contabilidad", label:"📊 Contabilidad" },
      { id:"gerenteai", label:"🧠 Gerente AI" },
      { id:"reportes", label:"📈 Reportes" },
      { id:"configuracion", label:"⚙️ Configuración" }
    );
  }

  sidebar.innerHTML = baseModules.map(m=>`<button onclick="window.loadModule('${m.id}')">${m.label}</button>`).join("");
}

/* ================= IA ================= */
async function initAI(){
  try{
    const ai = await modules.aiasistant();
    if(ai?.init) ai.init();
    const advisor = await modules.aiadvisor();
    if(advisor?.init) advisor.init();
    console.log("🤖 IA inicializada");
  }catch(e){ console.warn("⚠️ IA no disponible:", e.message); }
}

/* ================= VOZ ================= */
async function initVoice(){
  if(voiceInitialized) return;
  try{
    const voice = await import("../voice/voiceAssistantWorkshop.js");
    if(voice?.init){ voice.init(); voiceInitialized=true; console.log("🎤 Voz activada"); }
  }catch(e){ console.warn("⚠️ Voz no disponible:", e.message); }
}