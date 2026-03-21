/**
 * config.js - TallerPRO360 V3
 * Centro de Mando del Taller & API WhatsApp
 * Nexus-X Starlink SAS
 */
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen text-white pb-24">
      <div class="mb-6">
        <h1 class="text-2xl font-black">⚙️ Configuración</h1>
        <p class="text-[10px] text-cyan-400 tracking-widest uppercase">Gestión de Identidad y API</p>
      </div>

      <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button id="tabGeneral" class="bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">🏢 Empresa</button>
        <button id="tabWhatsApp" class="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap">💬 WhatsApp API</button>
      </div>

      <div id="sectionGeneral" class="space-y-4">
        <div id="perfilEmpresa" class="bg-[#0f172a] p-6 rounded-3xl border border-slate-800">
          <p class="animate-pulse text-center text-xs text-slate-500">Sincronizando con Nexus-X...</p>
        </div>
      </div>

      <div id="sectionWhatsApp" class="hidden space-y-4">
        <div class="bg-[#0f172a] p-6 rounded-3xl border border-emerald-500/20">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
              <i class="fab fa-whatsapp text-xl"></i>
            </div>
            <h3 class="font-bold text-sm">Motor de Notificaciones</h3>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="text-[10px] text-slate-500 uppercase font-bold ml-1">Instance ID</label>
              <input id="ws_instance" type="text" placeholder="ID de Instancia" 
                     class="w-full bg-[#050a14] border border-slate-800 p-3 rounded-xl text-sm focus:border-emerald-500 outline-none">
            </div>
            <div>
              <label class="text-[10px] text-slate-500 uppercase font-bold ml-1">API Token</label>
              <input id="ws_token" type="password" placeholder="Tu Token Secreto" 
                     class="w-full bg-[#050a14] border border-slate-800 p-3 rounded-xl text-sm focus:border-emerald-500 outline-none">
            </div>
            <p class="text-[9px] text-slate-500 italic">Este número se usará para enviar facturas y estados de órdenes automáticamente.</p>
          </div>
        </div>
      </div>

      <button id="btnGuardarConfig" class="fixed bottom-24 left-4 right-4 bg-cyan-500 text-black p-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition">
        GUARDAR CAMBIOS GLOBAL
      </button>

      <div class="mt-12 p-4 border border-red-500/20 rounded-2xl bg-red-500/5 text-center">
        <button onclick="localStorage.clear(); location.reload();" class="text-red-500 text-xs font-bold">
          Cerrar Sesión y Purgar Caché
        </button>
      </div>
    </div>
  `;

  // Lógica de Tabs
  const btnGen = document.getElementById("tabGeneral");
  const btnWS = document.getElementById("tabWhatsApp");
  const secGen = document.getElementById("sectionGeneral");
  const secWS = document.getElementById("sectionWhatsApp");

  btnWS.onclick = () => {
    btnWS.className = "bg-emerald-500 text-black px-4 py-2 rounded-xl text-xs font-bold";
    btnGen.className = "bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold";
    secGen.classList.add("hidden");
    secWS.classList.remove("hidden");
  };

  btnGen.onclick = () => {
    btnGen.className = "bg-cyan-500 text-black px-4 py-2 rounded-xl text-xs font-bold";
    btnWS.className = "bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold";
    secWS.classList.add("hidden");
    secGen.classList.remove("hidden");
  };

  async function cargarDatos() {
    try {
      const docSnap = await getDoc(doc(db, "empresas", empresaId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Render General
        document.getElementById("perfilEmpresa").innerHTML = `
          <div class="flex flex-col items-center mb-6">
            <div class="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg mb-4">🏢</div>
            <input id="emp_nombre" value="${data.nombre || ''}" class="bg-transparent text-xl font-black text-center outline-none border-b border-white/5 focus:border-cyan-500 w-full">
            <span class="text-[10px] text-slate-500 mt-2 tracking-widest">${empresaId}</span>
          </div>
          <div class="space-y-4">
             <div>
               <label class="text-[10px] text-slate-500 uppercase font-bold ml-1">NIT / ID Fiscal</label>
               <input id="emp_nit" value="${data.nit || ''}" class="w-full bg-[#050a14] border border-slate-800 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none">
             </div>
             <div>
               <label class="text-[10px] text-slate-500 uppercase font-bold ml-1">Plan Nexus-X</label>
               <div class="w-full bg-[#050a14] border border-yellow-500/20 p-3 rounded-xl text-sm text-yellow-500 font-bold uppercase">Enterprise Cloud</div>
             </div>
          </div>
        `;

        // Llenar WhatsApp
        document.getElementById("ws_instance").value = data.ws_instance || "";
        document.getElementById("ws_token").value = data.ws_token || "";
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById("btnGuardarConfig").onclick = async () => {
    const btn = document.getElementById("btnGuardarConfig");
    btn.innerText = "SINCRONIZANDO...";
    btn.disabled = true;

    try {
      const update = {
        nombre: document.getElementById("emp_nombre").value,
        nit: document.getElementById("emp_nit").value,
        ws_instance: document.getElementById("ws_instance").value,
        ws_token: document.getElementById("ws_token").value,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, "empresas", empresaId), update);
      
      // Actualizar localStorage para el Router y Services
      localStorage.setItem("ws_instance", update.ws_instance);
      localStorage.setItem("ws_token", update.ws_token);

      alert("✅ Sistema Sincronizado");
      location.reload();
    } catch (e) {
      alert("❌ Error al guardar");
    } finally {
      btn.innerText = "GUARDAR CAMBIOS GLOBAL";
      btn.disabled = false;
    }
  };

  cargarDatos();
}
