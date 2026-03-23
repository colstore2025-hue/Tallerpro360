/**
 * config.js - TallerPRO360 V4.1 ⚙️
 * Centro de Mando: Identidad, WhatsApp & Pasarela Independiente
 */
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen text-white pb-44 animate-fade-in font-sans">
      
      <div class="mb-6">
        <h1 class="text-2xl font-black italic tracking-tighter text-white uppercase font-mono">
            SYSTEM <span class="text-cyan-400">CORE</span>
        </h1>
        <p class="text-[7px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">NEXUS-X STARLINK PROTOCOL</p>
      </div>

      <div class="flex gap-1 mb-8 bg-black/40 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
        <button id="tabGen" class="flex-1 bg-cyan-500 text-black py-3 rounded-xl text-[9px] font-black uppercase transition-all">Empresa</button>
        <button id="tabWs" class="flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all">WhatsApp</button>
        <button id="tabPay" class="flex-1 text-slate-400 py-3 rounded-xl text-[9px] font-black uppercase transition-all">Pasarela</button>
      </div>

      <div id="secGen" class="space-y-4 animate-fade-in">
        <div class="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 shadow-xl">
            <div class="flex flex-col items-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-900 rounded-[2rem] flex items-center justify-center text-3xl shadow-lg border border-white/10 mb-3">🏢</div>
                <input id="nombre" class="bg-transparent text-xl font-black text-center outline-none border-b border-white/5 focus:border-cyan-500 w-full" placeholder="Nombre Taller">
            </div>
            <div class="space-y-3">
                <div class="bg-black/20 p-3 rounded-xl border border-white/5">
                    <label class="text-[7px] text-slate-500 uppercase font-black block mb-1">NIT / ID FISCAL</label>
                    <input id="nit" class="w-full bg-transparent text-sm font-bold outline-none text-white">
                </div>
            </div>
        </div>
      </div>

      <div id="secWs" class="hidden space-y-4 animate-fade-in">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-6 rounded-[2rem] border border-emerald-500/10 shadow-xl">
            <h3 class="text-xs font-black uppercase mb-4 text-emerald-400 flex items-center gap-2">
                <i class="fab fa-whatsapp text-lg"></i> Motor de Notificaciones
            </h3>
            <div class="space-y-4">
                <input id="ws_id" placeholder="INSTANCE ID" class="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-mono">
                <input id="ws_key" type="password" placeholder="API TOKEN" class="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-xs font-mono">
            </div>
        </div>
      </div>

      <div id="secPay" class="hidden space-y-4 animate-fade-in">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-6 rounded-[2rem] border border-blue-500/20 shadow-xl">
            <h3 class="text-xs font-black uppercase mb-1 text-blue-400">Mercado Pago <span class="text-[8px] text-slate-500 ml-2 italic">Independiente</span></h3>
            <p class="text-[8px] text-slate-400 mb-6 italic leading-tight">Cada taller recibe el dinero en su propia cuenta. Obtén tus llaves en el panel de desarrolladores de Mercado Pago.</p>
            
            <div class="space-y-4">
                <div class="bg-black/40 p-4 rounded-xl border border-white/5">
                    <label class="text-[7px] text-blue-400 font-black uppercase block mb-1">Access Token (Producción)</label>
                    <input id="mp_token" type="password" placeholder="APP_USR-..." class="w-full bg-transparent text-[10px] font-mono outline-none text-white">
                </div>
                <div class="bg-black/40 p-4 rounded-xl border border-white/5">
                    <label class="text-[7px] text-blue-400 font-black uppercase block mb-1">Public Key</label>
                    <input id="mp_key" placeholder="APP_USR-..." class="w-full bg-transparent text-[10px] font-mono outline-none text-white">
                </div>
            </div>
        </div>
      </div>

      <button id="btnSave" class="fixed bottom-24 left-4 right-4 bg-cyan-500 text-black py-5 rounded-[1.8rem] font-black text-xs uppercase shadow-2xl active:scale-95 transition-all">
        Sincronizar Protocolos
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
  async function load() {
    const snap = await getDoc(doc(db, "empresas", empresaId));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById("nombre").value = d.nombre || "";
      document.getElementById("nit").value = d.nit || "";
      document.getElementById("ws_id").value = d.ws_instance || "";
      document.getElementById("ws_key").value = d.ws_token || "";
      document.getElementById("mp_token").value = d.mp_access_token || "";
      document.getElementById("mp_key").value = d.mp_public_key || "";
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
        mp_access_token: document.getElementById("mp_token").value,
        mp_public_key: document.getElementById("mp_key").value,
        lastUpdate: new Date()
      };

      await setDoc(doc(db, "empresas", empresaId), config, { merge: true });
      
      // Cache local para ejecución inmediata de pagos
      localStorage.setItem("mp_key", config.mp_public_key);
      
      btn.innerText = "SINCRO EXITOSA";
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      alert("Error de enlace Nexus-X");
      btn.disabled = false;
      btn.innerText = "REINTENTAR";
    }
  };

  load();
}
