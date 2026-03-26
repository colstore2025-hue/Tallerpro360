/**
 * config.js - TallerPRO360 V12.0.0 🛰️
 * NEXUS-X STARLINK: Sistema de Onboarding Aeroespacial
 */
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const docRef = doc(db, "empresas", empresaId);

  // Renderizado de Interfaz Nexus-X
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

      <div id="secGen" class="space-y-6">
        <div class="p-8 border border-white/5 bg-white/5 rounded-[3.5rem] shadow-2xl backdrop-blur-xl text-center">
            <div id="logoPreview" class="w-32 h-32 bg-slate-900 rounded-[3rem] mx-auto flex items-center justify-center border border-cyan-500/30 mb-6 overflow-hidden relative group">
                <img id="imgLogo" src="" class="w-full h-full object-cover hidden">
                <i id="iconLogo" class="fas fa-camera text-slate-700"></i>
                <input type="file" id="fileLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
            </div>
            <input id="nombre" class="bg-transparent text-3xl font-black text-center outline-none border-b-2 border-white/5 focus:border-cyan-500 w-full text-white uppercase italic" placeholder="NOMBRE DEL TALLER">
            <div class="mt-6 space-y-4 text-left">
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-cyan-500 uppercase font-black block mb-2">NIT / Identificación</label>
                    <input id="nit" class="w-full bg-transparent text-lg font-bold outline-none text-white font-mono" placeholder="900.XXX.XXX-X">
                </div>
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-cyan-500 uppercase font-black block mb-2">Dirección</label>
                    <input id="direccion" class="w-full bg-transparent text-sm font-bold outline-none text-slate-300 uppercase" placeholder="AVENIDA PRINCIPAL">
                </div>
            </div>
        </div>
      </div>

      <div id="secWs" class="hidden space-y-6">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-10 rounded-[3.5rem] border border-emerald-500/20 shadow-2xl">
            <div class="flex items-center gap-4 mb-10">
                <i class="fab fa-whatsapp text-4xl text-emerald-400"></i>
                <h3 class="text-sm font-black uppercase text-emerald-400 italic">WhatsApp Sync</h3>
            </div>
            <div class="nexus-input p-8 rounded-[2.5rem]">
                <label class="text-[8px] text-emerald-500 uppercase font-black block mb-3">Número Master (Sin +)</label>
                <input id="whatsapp" placeholder="573001234567" class="w-full bg-transparent text-2xl font-black text-white outline-none tracking-widest" type="number">
            </div>
        </div>
      </div>

      <div id="secPay" class="hidden space-y-6">
        <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-10 rounded-[3.5rem] border border-red-500/20 shadow-2xl">
            <div class="flex items-center gap-4 mb-10">
                <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl italic">B</div>
                <h3 class="text-sm font-black uppercase text-red-500 italic">Bold Checkout</h3>
            </div>
            <div class="space-y-4">
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-red-500 font-black uppercase block mb-2">Bold Secret Key (pk_live)</label>
                    <input id="bold_api_key" type="password" placeholder="pk_live_..." class="w-full bg-transparent text-sm font-mono outline-none text-red-400">
                </div>
                <div class="nexus-input p-6 rounded-[2.2rem]">
                    <label class="text-[8px] text-red-500 font-black uppercase block mb-2">Bold Identity Key</label>
                    <input id="bold_identity" type="password" placeholder="id_live_..." class="w-full bg-transparent text-sm font-mono outline-none text-red-400">
                </div>
            </div>
        </div>
      </div>

      <div class="fixed bottom-8 left-0 right-0 px-6 z-50">
          <button id="btnSave" class="w-full max-w-2xl mx-auto bg-cyan-500 text-black py-7 rounded-[2.8rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-2xl active:scale-95 transition-all">
            SINCRONIZAR NEXUS-X <i class="fas fa-satellite ml-2"></i>
          </button>
      </div>
    </div>
  `;

  const imgLogo = document.getElementById("imgLogo");
  const iconLogo = document.getElementById("iconLogo");
  let logoBase64 = null;

  // Carga de Datos desde Firestore
  async function load() {
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById("nombre").value = d.nombre || "";
            document.getElementById("nit").value = d.nit || "";
            document.getElementById("direccion").value = d.direccion || "";
            document.getElementById("whatsapp").value = d.whatsapp || "";
            // Sincronización con los nuevos campos de Bold
            document.getElementById("bold_api_key").value = d.configuracion?.bold?.apiKey || "";
            document.getElementById("bold_identity").value = d.configuracion?.bold?.identity || "";
            
            if (d.logo) {
                imgLogo.src = d.logo;
                imgLogo.classList.remove("hidden");
                iconLogo.classList.add("hidden");
                logoBase64 = d.logo;
            }
        }
    } catch (e) { console.error("Error Sync Nexus:", e); }
  }

  // Guardado de Datos (Sincronización de Órbita)
  document.getElementById("btnSave").onclick = async () => {
    const btn = document.getElementById("btnSave");
    btn.disabled = true;
    btn.innerHTML = `SINCRONIZANDO... <i class="fas fa-sync fa-spin ml-2"></i>`;

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
        btn.style.background = "#10b981";
        setTimeout(() => location.reload(), 1500);
    } catch (e) {
        alert("Falla en Sincronización Nexus-X");
        btn.disabled = false;
        btn.innerText = "REINTENTAR";
    }
  };

  // Navegación de pestañas
  const tabs = {
    gen: { btn: document.getElementById("tabGen"), div: document.getElementById("secGen") },
    ws: { btn: document.getElementById("tabWs"), div: document.getElementById("secWs") },
    pay: { btn: document.getElementById("tabPay"), div: document.getElementById("secPay") }
  };

  const showTab = (k) => {
    Object.keys(tabs).forEach(key => {
        tabs[key].btn.className = "flex-1 text-slate-500 py-4 rounded-[1.8rem] text-[10px] font-black uppercase";
        tabs[key].div.classList.add("hidden");
    });
    const activeStyle = k === 'pay' ? 'tab-active-red' : 'tab-active-cyan';
    tabs[k].btn.className = `flex-1 ${activeStyle} py-4 rounded-[1.8rem] text-[10px] font-black uppercase shadow-2xl`;
    tabs[k].div.classList.remove("hidden");
  };

  tabs.gen.btn.onclick = () => showTab('gen');
  tabs.ws.btn.onclick = () => showTab('ws');
  tabs.pay.btn.onclick = () => showTab('pay');

  load();
}
