/**
 * config.js - TallerPRO360 V10.9.0 🛰️
 * NEXUS-X STARLINK PROTOCOL: Onboarding Automatizado (WhatsApp & Bold)
 */
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const docRef = doc(db, "empresas", empresaId);

  container.innerHTML = `
    <div class="max-w-2xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans px-4">
      
      <header class="mb-8 flex justify-between items-start pt-6">
        <div>
            <h2 class="text-2xl text-white font-black tracking-tighter uppercase italic">CORE <span class="text-cyan-400 text-shadow-glow">NEXUS</span></h2>
            <p class="text-[8px] text-cyan-500 font-bold uppercase tracking-[0.4em] mt-1 italic">Protocolo de Configuración Global v10.9</p>
        </div>
        <div class="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2 backdrop-blur-md">
            <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></span>
            <span class="text-[8px] text-cyan-400 font-black uppercase tracking-widest">Orbit Link Active</span>
        </div>
      </header>

      <div class="flex gap-2 mb-10 bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-2xl sticky top-6 z-30 shadow-2xl">
        <button id="tabGen" class="flex-1 bg-cyan-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg shadow-cyan-500/20 active:scale-95">Empresa</button>
        <button id="tabWs" class="flex-1 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase transition-all active:scale-95">WhatsApp</button>
        <button id="tabPay" class="flex-1 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase transition-all italic text-red-400 active:scale-95">Bold Pay</button>
      </div>

      <div id="secGen" class="space-y-6 animate-in zoom-in-95 duration-300">
        <div class="p-8 border border-white/5 bg-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div class="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <div class="flex flex-col items-center mb-10">
                <div class="w-24 h-24 bg-gradient-to-tr from-cyan-600 to-blue-900 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl border border-white/10 mb-6 shadow-cyan-500/20">🏢</div>
                <input id="nombre" class="bg-transparent text-2xl font-black text-center outline-none border-b-2 border-white/10 focus:border-cyan-500 w-full text-white uppercase italic tracking-tight" placeholder="NOMBRE DEL TALLER">
            </div>
            <div class="bg-black/60 p-6 rounded-[2rem] border border-white/5 focus-within:border-cyan-500/50 transition-all">
                <label class="text-[8px] text-cyan-500 uppercase font-black block mb-2 tracking-[0.2em]">NIT / Identificación Fiscal</label>
                <input id="nit" class="w-full bg-transparent text-base font-bold outline-none text-white font-mono" placeholder="900.XXX.XXX-X">
            </div>
        </div>
      </div>

      <div id="secWs" class="hidden space-y-6 animate-in zoom-in-95 duration-300">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-8 rounded-[3rem] border border-emerald-500/20 relative overflow-hidden shadow-2xl">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-3 italic">
                    <i class="fab fa-whatsapp text-xl"></i> Notificaciones
                </h3>
                <button id="helpWs" class="text-[8px] bg-emerald-500/10 text-emerald-400 px-5 py-2.5 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all">Tutorial 🎬</button>
            </div>
            <div class="bg-black/60 p-6 rounded-[2rem] border border-white/5 focus-within:border-emerald-500/50">
                <label class="text-[8px] text-emerald-500 uppercase font-black block mb-2 tracking-[0.2em]">Número Master WhatsApp</label>
                <input id="whatsapp" placeholder="Ej: 573001234567" class="w-full bg-transparent text-lg font-black text-white outline-none" type="number">
            </div>
            <p class="text-[9px] text-slate-500 font-bold uppercase italic mt-4 px-2 leading-relaxed tracking-tight">
                * Conecta tu número para que tus clientes reciban fotos y estados de su vehículo automáticamente.
            </p>
        </div>
      </div>

      <div id="secPay" class="hidden space-y-6 animate-in zoom-in-95 duration-300">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-8 rounded-[3rem] border border-red-500/20 shadow-2xl relative overflow-hidden">
            <div class="flex justify-between items-center mb-8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xs italic shadow-lg shadow-red-600/30">B</div>
                    <h3 class="text-[11px] font-black uppercase text-red-500 italic">Pasarela Bold</h3>
                </div>
                <button id="helpBold" class="text-[8px] bg-red-500/10 text-red-400 px-5 py-2.5 rounded-full border border-red-500/20 font-black uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all">Video Guía 🎬</button>
            </div>
            <div class="bg-black/60 p-6 rounded-[2rem] border border-white/5 focus-within:border-red-500/50">
                <label class="text-[8px] text-red-500 font-black uppercase block mb-2 tracking-[0.2em]">Bold API Key (Live)</label>
                <input id="bold_api_key" type="password" placeholder="pk_live_..." class="w-full bg-transparent text-sm font-mono outline-none text-emerald-400">
            </div>
            <p class="text-[9px] text-slate-500 font-bold uppercase italic mt-4 px-2 leading-relaxed">
                * Tu dinero cae directo a tu cuenta de Bold. Actívalo para cobrar con tarjetas, PSE y Nequi.
            </p>
        </div>
      </div>

      <div class="fixed bottom-10 left-0 right-0 px-6 z-50 sm:relative sm:bottom-0 sm:px-0 sm:mt-12">
          <button id="btnSave" class="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-7 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(34,211,238,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3">
            Sincronizar Nexus-X <i class="fas fa-chevron-right text-[10px]"></i>
          </button>
      </div>

      <div id="helpModal" class="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] hidden flex items-center justify-center p-4">
          <div class="max-w-md w-full bg-[#0a0f1d] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
              <div id="videoContainer" class="aspect-video bg-black w-full flex items-center justify-center border-b border-white/5"></div>
              <div class="p-10">
                  <h4 id="helpTitle" class="text-white text-base font-black mb-3 uppercase italic tracking-tighter">Ayuda Técnica</h4>
                  <p id="helpText" class="text-[11px] text-slate-400 leading-relaxed mb-8 italic font-medium"></p>
                  <button id="closeHelp" class="w-full py-5 bg-white/5 border border-white/10 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Entendido</button>
              </div>
          </div>
      </div>

    </div>
  `;

  // --- COMPONENTES ---
  const modal = document.getElementById("helpModal");
  const videoCont = document.getElementById("videoContainer");
  const helpTitle = document.getElementById("helpTitle");
  const helpText = document.getElementById("helpText");

  // --- LÓGICA DE AYUDA EDUCATIVA ---
  document.getElementById("helpBold").onclick = () => {
    helpTitle.innerText = "Configurar Bold Pay";
    helpText.innerText = "1. Abre tu cuenta Bold en un PC.\n2. Ve a 'Integraciones' -> 'API Keys'.\n3. Copia la llave de 'Producción' y pégala aquí.\n\nEsto permite que los pagos de tus clientes entren directo a tu cuenta bancaria vinculada a Bold.";
    videoCont.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/F56EI5NaDTk?autoplay=1&mute=1" frameborder="0" allowfullscreen></iframe>`;
    modal.classList.remove("hidden");
  };

  document.getElementById("helpWs").onclick = () => {
    helpTitle.innerText = "Protocolo WhatsApp";
    helpText.innerText = "1. Ingresa tu número celular con el prefijo 57.\n2. Asegúrate de tener activa la suscripción Nexus.\n3. El sistema enviará facturas, fotos y estados de orden a tus clientes automáticamente desde la nube.";
    videoCont.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1" frameborder="0" allowfullscreen></iframe>`;
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
        sections[key].btn.className = "flex-1 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase transition-all";
        sections[key].div.classList.add("hidden");
    });
    const activeClass = k === 'pay' ? 'bg-red-600 text-white' : 'bg-cyan-500 text-black';
    sections[k].btn.className = `flex-1 ${activeClass} py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl`;
    sections[k].div.classList.remove("hidden");
  };

  sections.gen.btn.onclick = () => showTab('gen');
  sections.ws.btn.onclick = () => showTab('ws');
  sections.pay.btn.onclick = () => showTab('pay');

  // --- PERSISTENCIA (SAVE & LOAD) ---
  async function load() {
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById("nombre").value = d.nombre || "";
            document.getElementById("nit").value = d.nit || "";
            document.getElementById("whatsapp").value = d.whatsapp || "";
            document.getElementById("bold_api_key").value = d.bold_api_key || "";
        }
    } catch (e) { console.error("Nexus Offline:", e); }
  }

  document.getElementById("btnSave").onclick = async () => {
    const btn = document.getElementById("btnSave");
    btn.innerHTML = `SINCRONIZANDO <i class="fas fa-satellite animate-bounce ml-2"></i>`;
    btn.disabled = true;

    try {
        await setDoc(docRef, {
            nombre: document.getElementById("nombre").value.trim(),
            nit: document.getElementById("nit").value.trim(),
            whatsapp: document.getElementById("whatsapp").value.trim(),
            bold_api_key: document.getElementById("bold_api_key").value.trim(),
            updatedAt: serverTimestamp(),
            empresaId: empresaId
        }, { merge: true });

        btn.innerText = "SISTEMA ACTUALIZADO";
        btn.classList.replace("bg-cyan-500", "bg-emerald-500");
        setTimeout(() => location.reload(), 1200);
    } catch (e) {
        alert("Falla de Conexión Nexus");
        btn.disabled = false;
        btn.innerText = "REINTENTAR SYNC";
    }
  };

  load();
}
