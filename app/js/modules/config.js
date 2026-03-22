/**
 * config.js - TallerPRO360 V4 ⚙️
 * Centro de Mando: Identidad Corporativa & Nexus-X Starlink API
 */
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen text-white pb-40 animate-fade-in font-sans">
      
      <div class="mb-8">
        <h1 class="text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
            SYSTEM <span class="text-cyan-400">CONFIG</span>
        </h1>
        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Arquitectura Soberana Nexus-X</p>
      </div>

      <div class="flex gap-2 mb-8 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
        <button id="tabGeneral" class="flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">🏢 Empresa</button>
        <button id="tabWhatsApp" class="flex-1 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">💬 WhatsApp</button>
      </div>

      <div id="sectionGeneral" class="space-y-6 animate-fade-in">
        <div id="perfilEmpresa" class="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div class="absolute -right-4 -top-4 opacity-5 text-6xl text-cyan-500"><i class="fas fa-building"></i></div>
            <p class="animate-pulse text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando con Satélite...</p>
        </div>
      </div>

      <div id="sectionWhatsApp" class="hidden space-y-4 animate-fade-in">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#061e1a] p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <i class="fab fa-whatsapp text-2xl"></i>
            </div>
            <div>
                <h3 class="font-black text-sm uppercase tracking-tighter">Motor de Notificaciones</h3>
                <p class="text-[8px] text-emerald-500/60 font-black uppercase">Estatus: Conectado a Gateway</p>
            </div>
          </div>
          
          <div class="space-y-5">
            <div class="bg-black/20 p-4 rounded-2xl border border-white/5">
              <label class="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2 block">Instance ID (Nexus-X)</label>
              <input id="ws_instance" type="text" placeholder="ID de Instancia" 
                     class="w-full bg-transparent border-none text-emerald-400 text-sm font-black outline-none placeholder:text-slate-700">
            </div>
            <div class="bg-black/20 p-4 rounded-2xl border border-white/5">
              <label class="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-2 block">API Secure Token</label>
              <input id="ws_token" type="password" placeholder="••••••••••••" 
                     class="w-full bg-transparent border-none text-emerald-400 text-sm font-black outline-none placeholder:text-slate-700">
            </div>
            <div class="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <p class="text-[9px] text-slate-400 leading-relaxed italic">Este motor automatiza el envío de órdenes de servicio, recordatorios de mantenimiento y facturación PDF vía WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="fixed bottom-24 left-4 right-4 z-50">
          <button id="btnGuardarConfig" class="w-full bg-cyan-500 text-black py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(6,182,212,0.4)] active:scale-95 transition-all">
            Actualizar Sistema Global
          </button>
      </div>

      <div class="mt-12 mb-10 text-center">
        <button id="btnLogout" class="text-[9px] font-black text-red-500/50 uppercase tracking-[0.3em] hover:text-red-500 transition-colors">
          <i class="fas fa-power-off mr-2"></i> Cerrar Sesión y Purgar Caché
        </button>
      </div>
    </div>
  `;

  // --- LÓGICA DE INTERACCIÓN ---
  const tabs = {
    gen: { btn: document.getElementById("tabGeneral"), sec: document.getElementById("sectionGeneral") },
    ws: { btn: document.getElementById("tabWhatsApp"), sec: document.getElementById("sectionWhatsApp") }
  };

  const switchTab = (active) => {
    Object.values(tabs).forEach(t => {
      t.btn.className = "flex-1 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all";
      t.sec.classList.add("hidden");
    });
    tabs[active].btn.className = "flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all";
    tabs[active].sec.classList.remove("hidden");
  };

  tabs.gen.btn.onclick = () => switchTab('gen');
  tabs.ws.btn.onclick = () => switchTab('ws');

  async function cargarDatos() {
    try {
      const docSnap = await getDoc(doc(db, "empresas", empresaId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Render Identidad Empresa
        document.getElementById("perfilEmpresa").innerHTML = `
          <div class="flex flex-col items-center mb-8">
            <div class="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl mb-4 border-4 border-white/10">🏢</div>
            <input id="emp_nombre" value="${data.nombre || ''}" class="bg-transparent text-2xl font-black text-center outline-none border-b border-white/5 focus:border-cyan-500 w-full tracking-tighter" placeholder="Nombre del Taller">
            <span class="text-[8px] text-slate-600 mt-2 font-black uppercase tracking-[0.4em]">${empresaId}</span>
          </div>
          <div class="space-y-5">
             <div class="bg-black/20 p-4 rounded-2xl border border-white/5">
               <label class="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1 block">NIT / Registro Fiscal</label>
               <input id="emp_nit" value="${data.nit || ''}" class="w-full bg-transparent border-none text-white text-sm font-black outline-none" placeholder="000-000-000">
             </div>
             <div class="bg-black/20 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
               <div>
                   <label class="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1 block">Nivel de Suscripción</label>
                   <div class="text-xs text-yellow-500 font-black uppercase tracking-tighter">Enterprise Cloud Nexus-X</div>
               </div>
               <i class="fas fa-crown text-yellow-600 opacity-40"></i>
             </div>
          </div>
        `;

        document.getElementById("ws_instance").value = data.ws_instance || "";
        document.getElementById("ws_token").value = data.ws_token || "";
      }
    } catch (e) {
      console.error("Config Load Error:", e);
    }
  }

  document.getElementById("btnGuardarConfig").onclick = async () => {
    const btn = document.getElementById("btnGuardarConfig");
    btn.innerText = "SINCRO EN CURSO...";
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
      
      // Guardar local para uso inmediato en servicios de mensajería
      localStorage.setItem("ws_instance", update.ws_instance);
      localStorage.setItem("ws_token", update.ws_token);

      btn.innerText = "CONFIGURACIÓN EXITOSA";
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      alert("Falla de Conexión Nexus-X");
      btn.innerText = "REINTENTAR ACTUALIZACIÓN";
      btn.disabled = false;
    }
  };

  document.getElementById("btnLogout").onclick = () => {
    if(confirm("¿Purgar caché del sistema y cerrar sesión?")) {
        localStorage.clear();
        location.reload();
    }
  };

  cargarDatos();
}
