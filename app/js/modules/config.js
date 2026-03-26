/**
 * config.js - TallerPRO360 V12.0.0 🛰️
 * NEXUS-X STARLINK: Sistema de Onboarding Aeroespacial
 */
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const docRef = doc(db, "empresas", empresaId);

  container.innerHTML = `
    <style>
      .nexus-input { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; }
      .nexus-input:focus { border-color: #22d3ee; box-shadow: 0 0 15px rgba(34,211,238,0.2); }
      .tab-active-cyan { background: #06b6d4; color: black; box-shadow: 0 0 20px rgba(6,182,212,0.4); }
      .tab-active-red { background: #ef4444; color: white; box-shadow: 0 0 20px rgba(239,68,68,0.4); }
      .glow-text { text-shadow: 0 0 10px rgba(34,211,238,0.5); }
    </style>

    <div class="max-w-2xl mx-auto pb-44 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans px-4">
      
      <header class="mb-8 flex justify-between items-center pt-8">
        <div>
            <h2 class="text-3xl text-white font-black tracking-tighter uppercase italic glow-text">CORE <span class="text-cyan-400">NEXUS-X</span></h2>
            <p class="text-[9px] text-cyan-500 font-black uppercase tracking-[0.5em] mt-1 italic">Protocolo Starlink v12.0 · Final Edition</p>
        </div>
        <div class="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-xl">
            <i class="fas fa-satellite text-cyan-400 animate-pulse"></i>
        </div>
      </header>

      <div class="flex gap-2 mb-10 bg-black/40 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl sticky top-6 z-40 shadow-2xl">
        <button id="tabGen" class="flex-1 py-4 rounded-[1.8rem] text-[10px] font-black uppercase transition-all tab-active-cyan">Empresa</button>
        <button id="tabWs" class="flex-1 text-slate-500 py-4 rounded-[1.8rem] text-[10px] font-black uppercase transition-all">WhatsApp</button>
        <button id="tabPay" class="flex-1 text-slate-500 py-4 rounded-[1.8rem] text-[10px] font-black uppercase transition-all italic">Bold Pay</button>
      </div>

      <div id="secGen" class="space-y-6 animate-in zoom-in-95 duration-500">
        <div class="p-8 border border-white/5 bg-white/5 rounded-[3.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div class="flex flex-col items-center mb-10">
                <div id="logoPreview" class="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center text-4xl shadow-2xl border border-cyan-500/30 mb-6 overflow-hidden relative group">
                    <img id="imgLogo" src="" class="w-full h-full object-cover hidden">
                    <i id="iconLogo" class="fas fa-camera text-slate-700"></i>
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span class="text-[8px] font-black text-white uppercase">Cambiar Logo</span>
                    </div>
                    <input type="file" id="fileLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                </div>
                <input id="nombre" class="bg-transparent text-3xl font-black text-center outline-none border-b-2 border-white/5 focus:border-cyan-500 w-full text-white uppercase italic tracking-tighter" placeholder="NOMBRE DEL TALLER">
            </div>
            <div class="space-y-4">
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-cyan-500 uppercase font-black block mb-2 tracking-[0.3em]">NIT / Identificación Oficial</label>
                    <input id="nit" class="w-full bg-transparent text-lg font-bold outline-none text-white font-mono" placeholder="900.XXX.XXX-X">
                </div>
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-cyan-500 uppercase font-black block mb-2 tracking-[0.3em]">Dirección de Operaciones</label>
                    <input id="direccion" class="w-full bg-transparent text-sm font-bold outline-none text-slate-300 uppercase" placeholder="AVENIDA PRINCIPAL #123">
                </div>
            </div>
        </div>
      </div>

      <div id="secWs" class="hidden space-y-6 animate-in zoom-in-95 duration-500">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-10 rounded-[3.5rem] border border-emerald-500/20 shadow-2xl">
            <div class="flex justify-between items-center mb-10">
                <div class="flex items-center gap-4">
                    <i class="fab fa-whatsapp text-4xl text-emerald-400"></i>
                    <h3 class="text-sm font-black uppercase text-emerald-400 italic leading-none">WhatsApp<br><span class="text-[9px] text-emerald-600">Sync Automatizado</span></h3>
                </div>
                <button id="helpWs" class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                    <i class="fas fa-play text-[10px]"></i>
                </button>
            </div>
            <div class="nexus-input p-8 rounded-[2.5rem]">
                <label class="text-[8px] text-emerald-500 uppercase font-black block mb-3 tracking-[0.3em]">Número Master (Sin el +)</label>
                <input id="whatsapp" placeholder="Ej: 573001234567" class="w-full bg-transparent text-2xl font-black text-white outline-none tracking-widest" type="number">
            </div>
            <div class="mt-8 flex gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <i class="fas fa-info-circle text-emerald-500 mt-1"></i>
                <p class="text-[10px] text-slate-400 font-bold uppercase italic leading-relaxed">
                    El sistema enviará estados, fotos y facturas automáticamente a tus clientes desde este canal.
                </p>
            </div>
        </div>
      </div>

      <div id="secPay" class="hidden space-y-6 animate-in zoom-in-95 duration-500">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-10 rounded-[3.5rem] border border-red-500/20 shadow-2xl">
            <div class="flex justify-between items-center mb-10">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-red-600/30">B</div>
                    <h3 class="text-sm font-black uppercase text-red-500 italic leading-none">Bold Checkout<br><span class="text-[9px] text-red-800">Directo a tu banco</span></h3>
                </div>
                <button id="helpBold" class="w-10 h-10 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-black transition-all">
                    <i class="fas fa-video text-[10px]"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-red-500 font-black uppercase block mb-2 tracking-[0.3em]">Bold API Key (Live)</label>
                    <input id="bold_api_key" type="password" placeholder="pk_live_..." class="w-full bg-transparent text-sm font-mono outline-none text-red-400">
                </div>
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-red-500 font-black uppercase block mb-2 tracking-[0.3em]">Bold Identity Key</label>
                    <input id="bold_identity" type="password" placeholder="id_live_..." class="w-full bg-transparent text-sm font-mono outline-none text-red-400">
                </div>
            </div>
        </div>
      </div>

      <div class="fixed bottom-8 left-0 right-0 px-6 z-50">
          <button id="btnSave" class="w-full max-w-2xl mx-auto bg-cyan-500 hover:bg-cyan-400 text-black py-7 rounded-[2.8rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-[0_20px_60px_rgba(34,211,238,0.4)] active:scale-95 transition-all flex items-center justify-center gap-4">
            SINCRONIZAR NEXUS-X <i class="fas fa-satellite animate-bounce"></i>
          </button>
      </div>

      <div id="helpModal" class="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] hidden flex items-center justify-center p-6">
          <div class="max-w-md w-full bg-[#0a0f1d] border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl">
              <div id="videoContainer" class="aspect-video bg-black w-full flex items-center justify-center border-b border-white/5"></div>
              <div class="p-12 text-center">
                  <h4 id="helpTitle" class="text-white text-xl font-black mb-4 uppercase italic tracking-tighter glow-text">Tutorial</h4>
                  <p id="helpText" class="text-[11px] text-slate-400 leading-relaxed mb-10 italic font-medium uppercase tracking-wider"></p>
                  <button id="closeHelp" class="w-full py-6 bg-cyan-500 text-black rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em]">Entendido Comandante</button>
              </div>
          </div>
      </div>

    </div>
  `;

  // --- COMPONENTES Y ESTADO ---
  const modal = document.getElementById("helpModal");
  const videoCont = document.getElementById("videoContainer");
  const helpTitle = document.getElementById("helpTitle");
  const helpText = document.getElementById("helpText");
  const imgLogo = document.getElementById("imgLogo");
  const iconLogo = document.getElementById("iconLogo");
  let logoBase64 = null;

  // --- MANEJO DE LOGO ---
  document.getElementById("fileLogo").onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            logoBase64 = event.target.result;
            imgLogo.src = logoBase64;
            imgLogo.classList.remove("hidden");
            iconLogo.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
  };

  // --- AYUDA EDUCATIVA (MERCADO & BOLD) ---
  document.getElementById("helpBold").onclick = () => {
    helpTitle.innerText = "Configurar Pasarela BOLD";
    helpText.innerText = "1. Ingresa a tu panel de Bold.co\n2. Ve a Integraciones -> API Keys\n3. Copia 'API Key' e 'Identity' y pégalos aquí.\n\nEsto permitirá que los pagos de tus clientes lleguen directamente a tu banco.";
    videoCont.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/F56EI5NaDTk?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.remove("hidden");
  };

  document.getElementById("helpWs").onclick = () => {
    helpTitle.innerText = "Canal de Notificaciones";
    helpText.innerText = "1. Registra el número oficial del taller.\n2. No incluyas el símbolo '+'.\n3. Nexus-X enviará fotos del proceso y avisos de entrega automáticamente.";
    videoCont.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.remove("hidden");
  };

  document.getElementById("closeHelp").onclick = () => {
    modal.classList.add("hidden");
    videoCont.innerHTML = "";
  };

  // --- NAVEGACIÓN ENTRE PROTOCOLOS ---
  const sections = {
    gen: { btn: document.getElementById("tabGen"), div: document.getElementById("secGen") },
    ws: { btn: document.getElementById("tabWs"), div: document.getElementById("secWs") },
    pay: { btn: document.getElementById("tabPay"), div: document.getElementById("secPay") }
  };

  const showTab = (k) => {
    Object.keys(sections).forEach(key => {
        sections[key].btn.className = "flex-1 text-slate-500 py-4 rounded-[1.8rem] text-[10px] font-black uppercase transition-all";
        sections[key].div.classList.add("hidden");
    });
    const activeClass = k === 'pay' ? 'tab-active-red' : 'tab-active-cyan';
    sections[k].btn.className = `flex-1 ${activeClass} py-4 rounded-[1.8rem] text-[10px] font-black uppercase transition-all shadow-2xl`;
    sections[k].div.classList.remove("hidden");
  };

  sections.gen.btn.onclick = () => showTab('gen');
  sections.ws.btn.onclick = () => showTab('ws');
  sections.pay.btn.onclick = () => showTab('pay');

  // --- CARGA DE DATOS (NEXUS SYNC) ---
  async function load() {
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById("nombre").value = d.nombre || "";
            document.getElementById("nit").value = d.nit || "";
            document.getElementById("direccion").value = d.direccion || "";
            document.getElementById("whatsapp").value = d.whatsapp || "";
            document.getElementById("bold_api_key").value = d.configuracion?.bold?.apiKey || d.bold_api_key || "";
            document.getElementById("bold_identity").value = d.configuracion?.bold?.identity || "";
            
            if (d.logo) {
                imgLogo.src = d.logo;
                imgLogo.classList.remove("hidden");
                iconLogo.classList.add("hidden");
                logoBase64 = d.logo;
            }
        }
    } catch (e) { console.error("Link de Órbita Perdido:", e); }
  }

  // --- SINCRONIZACIÓN FINAL ---
  document.getElementById("btnSave").onclick = async () => {
    const btn = document.getElementById("btnSave");
    const originalText = btn.innerHTML;
    btn.innerHTML = `SINCRONIZANDO ÓRBITA <i class="fas fa-sync fa-spin ml-3"></i>`;
    btn.disabled = true;

    try {
        await setDoc(docRef, {
            nombre: document.getElementById("nombre").value.trim(),
            nit: document.getElementById("nit").value.trim(),
            direccion: document.getElementById("direccion").value.trim(),
            whatsapp: document.getElementById("whatsapp").value.trim(),
            logo: logoBase64,
            configuracion: {
                bold: {
                    apiKey: document.getElementById("bold_api_key").value.trim(),
                    identity: document.getElementById("bold_identity").value.trim()
                }
            },
            updatedAt: serverTimestamp()
        }, { merge: true });

        btn.innerText = "PROTOCOLO COMPLETADO";
        btn.style.background = "#10b981"; // Emerald
        setTimeout(() => location.reload(), 1500);
    } catch (e) {
        console.error(e);
        alert("Falla en Sincronización Nexus-X");
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
  };

  load();
}
