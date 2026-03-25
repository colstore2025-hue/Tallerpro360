/**
 * config.js - TallerPRO360 V10.4.8 ⚡
 * Centro de Mando: Identidad, WhatsApp & Pasarela BOLD
 * Optimizado para Móvil - Protocolo Nexus-X Starlink
 */
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="max-w-2xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header class="mb-8">
        <h2 class="orbitron text-xl text-white font-black tracking-widest uppercase">
            SYSTEM <span class="text-cyan-400">CORE</span>
        </h2>
        <p class="text-[8px] text-red-500 font-bold uppercase tracking-[0.4em] mt-1 italic">Protocolo de Recaudo Bold Activo</p>
      </header>

      <div class="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
        <button id="tabGen" class="flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[9px] font-black uppercase transition-all">Empresa</button>
        <button id="tabWs" class="flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all">WhatsApp</button>
        <button id="tabPay" class="flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all italic text-red-400">Pasarela Bold</button>
      </div>

      <div id="secGen" class="space-y-6 animate-in zoom-in-95 duration-300">
        <div class="glass-card p-6 border border-white/5 bg-white/5 rounded-[2.5rem]">
            <div class="flex flex-col items-center mb-8">
                <div class="w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-900 rounded-[2rem] flex items-center justify-center text-3xl shadow-lg border border-white/10 mb-4">🏢</div>
                <input id="nombre" class="bg-transparent text-xl font-black text-center outline-none border-b border-white/5 focus:border-cyan-500 w-full text-white orbitron" placeholder="NOMBRE DEL TALLER">
            </div>
            <div class="space-y-3">
                <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label class="text-[7px] text-cyan-500 uppercase font-black block mb-1">NIT / ID FISCAL</label>
                    <input id="nit" class="w-full bg-transparent text-sm font-bold outline-none text-white">
                </div>
            </div>
        </div>
      </div>

      <div id="secWs" class="hidden space-y-6 animate-in zoom-in-95 duration-300">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-8 rounded-[2.5rem] border border-emerald-500/10">
            <h3 class="text-xs font-black uppercase text-emerald-400 mb-6 flex items-center gap-2">
                <i class="fab fa-whatsapp text-lg"></i> Notificaciones
            </h3>
            <div class="space-y-4">
                <input id="ws_id" placeholder="INSTANCE ID" class="w-full bg-black/40 p-5 rounded-2xl border border-white/5 text-xs font-mono text-white">
                <input id="ws_key" type="password" placeholder="API TOKEN" class="w-full bg-black/40 p-5 rounded-2xl border border-white/5 text-xs font-mono text-white">
            </div>
        </div>
      </div>

      <div id="secPay" class="hidden space-y-6 animate-in zoom-in-95 duration-300">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-8 rounded-[2.5rem] border border-red-500/20 shadow-2xl">
            <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xs">B</div>
                <h3 class="text-xs font-black uppercase text-red-500">Pasarela Bold</h3>
            </div>
            <p class="text-[9px] text-slate-400 mb-8 italic leading-tight">Configura tu <span class="text-white">API Key</span> de Bold para generar links de pago y recibir dinero directamente en tu cuenta Bold.</p>
            
            <div class="space-y-4">
                <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-red-500 font-black uppercase block mb-2">Bold API Key (Producción)</label>
                    <input id="bold_key" type="password" placeholder="pk_live_..." class="w-full bg-transparent text-[11px] font-mono outline-none text-white">
                </div>
                <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                    <label class="text-[8px] text-red-500 font-black uppercase block mb-2">Integrity Signature Key</label>
                    <input id="bold_secret" type="password" placeholder="Firma de seguridad..." class="w-full bg-transparent text-[11px] font-mono outline-none text-white">
                </div>
            </div>
        </div>
      </div>

      <button id="btnSave" class="fixed bottom-24 left-6 right-6 sm:relative sm:bottom-0 sm:left-0 sm:right-0 sm:mt-8 bg-cyan-500 text-black py-5 rounded-[2rem] font-black orbitron text-[10px] uppercase tracking-[3px] shadow-xl active:scale-95 transition-all z-40">
        Sincronizar Nexus-Bold
      </button>

    </div>
  `;

  // --- LÓGICA DE NAVEGACIÓN ---
  const sections = {
    gen: { btn: document.getElementById("tabGen"), div: document.getElementById("secGen") },
    ws: { btn: document.getElementById("tabWs"), div: document.getElementById("secWs") },
    pay: { btn: document.getElementById("tabPay"), div: document.getElementById("secPay") }
  };

  const showTab = (key) => {
    Object.keys(sections).forEach(k => {
        sections[k].btn.className = "flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all";
        sections[k].div.classList.add("hidden");
    });
    sections[key].btn.className = "flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[9px] font-black uppercase transition-all";
    sections[key].div.classList.remove("hidden");
  };

  sections.gen.btn.onclick = () => showTab('gen');
  sections.ws.btn.onclick = () => showTab('ws');
  sections.pay.btn.onclick = () => showTab('pay');

  // --- PERSISTENCIA ---
  async function loadData() {
    const snap = await getDoc(doc(db, "empresas", empresaId));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById("nombre").value = d.nombre || "";
      document.getElementById("nit").value = d.nit || "";
      document.getElementById("ws_id").value = d.ws_instance || "";
      document.getElementById("ws_key").value = d.ws_token || "";
      // Datos de Bold
      document.getElementById("bold_key").value = d.bold_api_key || "";
      document.getElementById("bold_secret").value = d.bold_integrity_key || "";
    }
  }

  document.getElementById("btnSave").onclick = async () => {
    const btn = document.getElementById("btnSave");
    btn.innerText = "ENVIANDO A SATÉLITE...";
    btn.disabled = true;

    try {
      const config = {
        nombre: document.getElementById("nombre").value,
        nit: document.getElementById("nit").value,
        ws_instance: document.getElementById("ws_id").value,
        ws_token: document.getElementById("ws_key").value,
        bold_api_key: document.getElementById("bold_key").value,
        bold_integrity_key: document.getElementById("bold_secret").value,
        lastUpdate: new Date()
      };

      await setDoc(doc(db, "empresas", empresaId), config, { merge: true });
      
      localStorage.setItem("bold_active", "true");
      
      btn.innerText = "SINCRO BOLD EXITOSA";
      btn.style.backgroundColor = "#ef4444"; // Rojo Bold
      btn.style.color = "white";

      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      alert("Error de enlace Nexus-Bold");
      btn.disabled = false;
      btn.innerText = "REINTENTAR ENLACE";
    }
  };

  loadData();
}
