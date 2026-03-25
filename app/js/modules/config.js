/**
 * config.js - TallerPRO360 V10.8.5 🛰️
 * NEXUS-X STARLINK PROTOCOL: Identidad, WhatsApp & Bold API Core + Onboarding
 */
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const docRef = doc(db, "empresas", empresaId);

  container.innerHTML = `
    <div class="max-w-2xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      
      <header class="mb-8 flex justify-between items-start px-2">
        <div>
            <h2 class="text-xl text-white font-black tracking-widest uppercase italic">SYSTEM <span class="text-cyan-400">CORE</span></h2>
            <p class="text-[7px] text-cyan-500 font-bold uppercase tracking-[0.4em] mt-1 italic">Protocolo de Configuración Global</p>
        </div>
        <div class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
            <span class="text-[7px] text-cyan-400 font-black uppercase tracking-widest">🛰️ LINK ACTIVO</span>
        </div>
      </header>

      <div class="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl sticky top-4 z-30 shadow-2xl">
        <button id="tabGen" class="flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg shadow-cyan-500/20">Empresa</button>
        <button id="tabWs" class="flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all">WhatsApp</button>
        <button id="tabPay" class="flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all italic text-red-400">Bold Pay</button>
      </div>

      <div id="secGen" class="space-y-6 animate-in zoom-in-95 duration-300">
        <div class="p-8 border border-white/5 bg-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <div class="flex flex-col items-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-900 rounded-[2rem] flex items-center justify-center text-3xl shadow-lg border border-white/10 mb-4 shadow-cyan-500/10">🏢</div>
                <input id="nombre" class="bg-transparent text-xl font-black text-center outline-none border-b border-white/10 focus:border-cyan-500 w-full text-white uppercase italic" placeholder="NOMBRE DEL TALLER">
            </div>
            <div class="bg-black/40 p-5 rounded-3xl border border-white/5 focus-within:border-cyan-500/50 transition-all">
                <label class="text-[7px] text-cyan-500 uppercase font-black block mb-2 tracking-widest">NIT / Identificación Fiscal</label>
                <input id="nit" class="w-full bg-transparent text-sm font-bold outline-none text-white font-mono" placeholder="900.XXX.XXX-X">
            </div>
        </div>
      </div>

      <div id="secWs" class="hidden space-y-6 animate-in zoom-in-95 duration-300">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-8 rounded-[2.5rem] border border-emerald-500/10 relative">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-2 italic"><i class="fab fa-whatsapp text-lg"></i> Notificaciones</h3>
                <button id="helpWs" class="text-[7px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-black uppercase">¿Cómo conectar?</button>
            </div>
            <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                <label class="text-[7px] text-emerald-500 uppercase font-black block mb-1">WhatsApp Business Number</label>
                <input id="whatsapp" placeholder="573001234567" class="w-full bg-transparent text-xs font-black text-white outline-none" type="number">
            </div>
        </div>
      </div>

      <div id="secPay" class="hidden space-y-6 animate-in zoom-in-95 duration-300">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-8 rounded-[2.5rem] border border-red-500/20 shadow-2xl relative">
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] italic shadow-lg shadow-red-500/20">B</div>
                    <h3 class="text-[10px] font-black uppercase text-red-500 italic">Bold Gateway</h3>
                </div>
                <button id="helpBold" class="text-[7px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 font-black uppercase">Video Guía</button>
            </div>
            <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                <label class="text-[7px] text-red-500 font-black uppercase block mb-1">Bold API Key (Producción)</label>
                <input id="bold_api_key" type="password" placeholder="pk_live_..." class="w-full bg-transparent text-[11px] font-mono outline-none text-emerald-400">
            </div>
        </div>
      </div>

      <button id="btnSave" class="fixed bottom-24 left-6 right-6 sm:relative sm:bottom-0 sm:left-0 sm:right-0 sm:mt-10 bg-cyan-500 text-black py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-cyan-500/10 active:scale-95 transition-all z-40">
        Sincronizar Nexus-X
      </button>

      <div id="helpModal" class="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] hidden flex items-center justify-center p-6">
          <div class="max-w-md w-full bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div id="videoContainer" class="aspect-video bg-black w-full flex items-center justify-center"></div>
              <div class="p-8">
                  <h4 id="helpTitle" class="text-white text-sm font-black mb-2 uppercase italic">Ayuda Técnica</h4>
                  <p id="helpText" class="text-[10px] text-slate-400 leading-relaxed mb-6 italic"></p>
                  <button id="closeHelp" class="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest">Entendido</button>
              </div>
          </div>
      </div>

    </div>
  `;

  // --- LÓGICA DE INTERFAZ (TABS & MODAL) ---
  const modal = document.getElementById("helpModal");
  const videoCont = document.getElementById("videoContainer");
  const helpTitle = document.getElementById("helpTitle");
  const helpText = document.getElementById("helpText");

  document.getElementById("helpBold").onclick = () => {
    helpTitle.innerText = "Configurar Bold Pay";
    helpText.innerText = "Accede a tu panel de Bold, busca 'Integraciones' y copia tu API Key de Producción. Esto habilitará los pagos reales en tu taller.";
    videoCont.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/F56EI5NaDTk?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.remove("hidden");
  };

  document.getElementById("helpWs").onclick = () => {
    helpTitle.innerText = "Sincronizar WhatsApp";
    helpText.innerText = "Ingresa el número de WhatsApp de tu taller (incluyendo el 57). Este número se usará para enviar estados de órdenes y notificaciones automáticas.";
    videoCont.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-emerald-900/20"><i class="fab fa-whatsapp text-6xl text-emerald-500 animate-bounce"></i></div>`;
    modal.classList.remove("hidden");
  };

  document.getElementById("closeHelp").onclick = () => {
    modal.classList.add("hidden");
    videoCont.innerHTML = "";
  };

  // --- LÓGICA DE TABS ---
  const sections = {
    gen: { btn: document.getElementById("tabGen"), div: document.getElementById("secGen") },
    ws: { btn: document.getElementById("tabWs"), div: document.getElementById("secWs") },
    pay: { btn: document.getElementById("tabPay"), div: document.getElementById("secPay") }
  };

  const showTab = (k) => {
    Object.keys(sections).forEach(key => {
        sections[key].btn.className = "flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all";
        sections[key].div.classList.add("hidden");
    });
    sections[k].btn.className = `flex-1 ${k === 'pay' ? 'bg-red-600 text-white' : 'bg-cyan-500 text-black'} py-3 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg`;
    sections[k].div.classList.remove("hidden");
  };

  sections.gen.btn.onclick = () => showTab('gen');
  sections.ws.btn.onclick = () => showTab('ws');
  sections.pay.btn.onclick = () => showTab('pay');

  // --- PERSISTENCIA ---
  async function loadData() {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById("nombre").value = d.nombre || "";
        document.getElementById("nit").value = d.nit || "";
        document.getElementById("whatsapp").value = d.whatsapp || "";
        document.getElementById("bold_api_key").value = d.bold_api_key || "";
    }
  }

  document.getElementById("btnSave").onclick = async () => {
    const btn = document.getElementById("btnSave");
    btn.innerText = "SINCRONIZANDO PROTOCOLO...";
    btn.disabled = true;
    try {
        await setDoc(docRef, {
            nombre: document.getElementById("nombre").value.trim(),
            nit: document.getElementById("nit").value.trim(),
            whatsapp: document.getElementById("whatsapp").value.trim(),
            bold_api_key: document.getElementById("bold_api_key").value.trim(),
            updatedAt: new Date(),
            empresaId: empresaId
        }, { merge: true });
        btn.innerText = "SISTEMA ONLINE";
        btn.classList.replace("bg-cyan-500", "bg-emerald-500");
        setTimeout(() => location.reload(), 1200);
    } catch (e) {
        alert("Falla Nexus-Sync");
        btn.disabled = false;
        btn.innerText = "REINTENTAR";
    }
  };

  loadData();
}
