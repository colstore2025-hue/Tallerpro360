/**
 * config.js - TallerPRO360 V12.5.0 🛰️
 * NEXUS-X STARLINK CORE: Sistema de Onboarding Aeroespacial
 * Consolidación Final: 12 Planes, Multi-Entorno y Blindaje de Sincronización
 */

import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    if (!empresaId) return container.innerHTML = `<div class="p-10 text-white font-black italic">ERROR: ÓRBITA NO IDENTIFICADA</div>`;

    const docRef = doc(db, "empresas", empresaId);

    // --- MATRIZ DE PODER: 12 PLANES NEXUS-X (INTOCABLE) ---
    const MATRIZ_PLANES = {
        basico: {
            mensual:   { id: "B1", valor: 49900,  label: "[MENSUAL] Plan Básico" },
            trimestral: { id: "B3", valor: 134700, label: "[TRIMESTRAL] Plan Básico" },
            semestral:  { id: "B6", valor: 239500, label: "[SEMESTRAL] Plan Básico" },
            anual:      { id: "B12", valor: 419200, label: "[ANUAL] Plan Básico" }
        },
        pro: {
            mensual:   { id: "P1", valor: 79900,  label: "[MENSUAL] Plan PRO" },
            trimestral: { id: "P3", valor: 215700, label: "[TRIMESTRAL] Plan PRO" },
            semestral:  { id: "P6", valor: 383500, label: "[SEMESTRAL] Plan PRO" },
            anual:      { id: "P12", valor: 671200, label: "[ANUAL] Plan PRO" }
        },
        elite: {
            mensual:   { id: "E1", valor: 129000,  label: "[MENSUAL] Plan ELITE" },
            trimestral: { id: "E3", valor: 348300, label: "[TRIMESTRAL] Plan ELITE" },
            semestral:  { id: "E6", valor: 619200, label: "[SEMESTRAL] Plan ELITE" },
            anual:      { id: "E12", valor: 1083600, label: "[ANUAL] Plan ELITE" }
        }
    };

    // --- RENDERIZADO DE INTERFAZ NEXUS-X STARLINK ---
    container.innerHTML = `
    <style>
        .nexus-ui { font-family: 'Inter', sans-serif; color: white; }
        .nexus-card { background: rgba(10, 15, 29, 0.7); border: 1px solid rgba(255,255,255,0.08); backdrop-blur: 40px; }
        .nexus-input-box { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .nexus-input-box:focus-within { border-color: #22d3ee; box-shadow: 0 0 25px rgba(34,211,238,0.15); }
        .tab-btn { padding: 1rem; border-radius: 1.2rem; font-size: 10px; font-weight: 900; text-transform: uppercase; transition: 0.3s; color: #64748b; }
        .tab-btn.active-cyan { background: #06b6d4; color: black; box-shadow: 0 10px 30px rgba(6,182,212,0.3); }
        .tab-btn.active-red { background: #ef4444; color: white; box-shadow: 0 10px 30px rgba(239,68,68,0.3); }
        .glow-cyan { text-shadow: 0 0 15px rgba(34,211,238,0.6); }
        /* Responsive Desktop Fix */
        @media (min-width: 1024px) { .nexus-container { margin-left: 260px; padding: 4rem; } }
    </style>

    <div class="nexus-container pb-40 animate-in fade-in duration-700 px-6">
        <header class="flex justify-between items-center mb-12 pt-6">
            <div>
                <h1 class="text-4xl font-black tracking-tighter italic glow-cyan uppercase">CORE <span class="text-cyan-400">NEXUS-X</span></h1>
                <p class="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.4em] mt-2">Protocolo Starlink v12.5 • Final Edition</p>
            </div>
            <div class="flex flex-col items-end">
                <div class="w-14 h-14 nexus-card rounded-2xl flex items-center justify-center border-cyan-500/20 shadow-lg">
                    <i class="fas fa-satellite text-cyan-400 text-xl animate-pulse"></i>
                </div>
                <span id="syncStatus" class="text-[8px] font-black text-emerald-500 mt-2 uppercase tracking-widest">Sincronizado</span>
            </div>
        </header>

        <nav class="flex gap-3 mb-10 p-2 nexus-card rounded-[2.2rem] sticky top-6 z-50">
            <button id="navGen" class="tab-btn flex-1 active-cyan">Empresa</button>
            <button id="navWs" class="tab-btn flex-1">WhatsApp</button>
            <button id="navPay" class="tab-btn flex-1 italic">Bold Pay</button>
        </nav>

        <div id="secGen" class="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div class="nexus-card p-10 rounded-[3rem] relative overflow-hidden">
                <div class="flex flex-col items-center mb-8">
                    <div id="logoArea" class="w-40 h-40 bg-black rounded-[3.5rem] border-2 border-dashed border-white/10 flex items-center justify-center relative cursor-pointer group overflow-hidden">
                        <img id="imgLogo" src="" class="hidden w-full h-full object-cover">
                        <div class="text-center group-hover:scale-110 transition-transform">
                            <i id="iconCam" class="fas fa-camera text-2xl text-slate-700"></i>
                            <p class="text-[8px] font-black text-slate-500 mt-2 uppercase">Subir Logo</p>
                        </div>
                        <input type="file" id="fileLogo" class="absolute inset-0 opacity-0 cursor-pointer">
                    </div>
                </div>
                <div class="grid grid-cols-1 gap-6">
                    <div class="nexus-input-box p-6">
                        <label class="text-[9px] text-cyan-500 font-black uppercase mb-1 block">Razón Social</label>
                        <input id="nombre" class="w-full bg-transparent text-2xl font-black outline-none text-white italic uppercase" placeholder="NOMBRE DEL TALLER">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="nexus-input-box p-6">
                            <label class="text-[9px] text-cyan-500 font-black uppercase mb-1 block">NIT / ID Oficial</label>
                            <input id="nit" class="w-full bg-transparent text-lg font-bold outline-none text-white font-mono" placeholder="900.000.000-0">
                        </div>
                        <div class="nexus-input-box p-6">
                            <label class="text-[9px] text-cyan-500 font-black uppercase mb-1 block">Sede Principal</label>
                            <input id="direccion" class="w-full bg-transparent text-sm font-bold outline-none text-slate-300" placeholder="DIRECCIÓN DE OPERACIONES">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="secWs" class="hidden space-y-8 animate-in slide-in-from-bottom-4">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-10 rounded-[3rem] border border-emerald-500/20">
                <div class="flex items-center gap-4 mb-8">
                    <i class="fab fa-whatsapp text-4xl text-emerald-400"></i>
                    <h3 class="text-xl font-black italic uppercase text-emerald-400 leading-none">WhatsApp Engine</h3>
                </div>
                <div class="nexus-input-box p-8">
                    <label class="text-[9px] text-emerald-500 font-black uppercase mb-2 block">Número Master (Formato Internacional)</label>
                    <div class="flex items-center">
                        <span class="text-xl font-black text-emerald-600 mr-2">+</span>
                        <input id="whatsapp" type="number" placeholder="573001234567" class="w-full bg-transparent text-3xl font-black text-white outline-none">
                    </div>
                </div>
            </div>
        </div>

        <div id="secPay" class="hidden space-y-8 animate-in slide-in-from-bottom-4">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-10 rounded-[3rem] border border-red-500/20 shadow-2xl">
                <div class="flex justify-between items-center mb-10">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg">B</div>
                        <h3 class="text-xl font-black uppercase text-red-500 italic">Bold Gateway</h3>
                    </div>
                </div>
                <div class="space-y-6">
                    <div class="nexus-input-box p-6">
                        <label class="text-[9px] text-red-500 font-black uppercase mb-1 block">API Key (pk_live_...)</label>
                        <input id="bold_api_key" type="password" class="w-full bg-transparent text-sm font-mono text-red-400 outline-none" placeholder="pk_live_xxxxxxxxxxxxxxxx">
                    </div>
                    <div class="nexus-input-box p-6">
                        <label class="text-[9px] text-red-500 font-black uppercase mb-1 block">Identity Key (id_live_...)</label>
                        <input id="bold_identity" type="password" class="w-full bg-transparent text-sm font-mono text-red-400 outline-none" placeholder="id_live_xxxxxxxxxxxxxxxx">
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-10 left-0 right-0 px-6 z-50">
            <button id="btnSave" class="w-full max-w-2xl mx-auto bg-cyan-500 hover:bg-cyan-400 text-black py-8 rounded-[3rem] font-black text-[14px] uppercase tracking-[0.6em] shadow-[0_20px_60px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-4">
                SINCRONIZAR NEXUS-X <i class="fas fa-satellite animate-bounce"></i>
            </button>
        </div>
    </div>
    `;

    // --- LÓGICA DE CONTROLADORES ---
    const navs = {
        gen: { btn: document.getElementById("navGen"), sec: document.getElementById("secGen") },
        ws: { btn: document.getElementById("navWs"), sec: document.getElementById("secWs") },
        pay: { btn: document.getElementById("navPay"), sec: document.getElementById("secPay") }
    };

    const showTab = (key) => {
        Object.keys(navs).forEach(k => {
            navs[k].btn.className = "tab-btn flex-1";
            navs[k].sec.classList.add("hidden");
        });
        const activeClass = key === 'pay' ? 'active-red' : 'active-cyan';
        navs[key].btn.className = `tab-btn flex-1 ${activeClass} shadow-2xl`;
        navs[key].sec.classList.remove("hidden");
    };

    navs.gen.btn.onclick = () => showTab('gen');
    navs.ws.btn.onclick = () => showTab('ws');
    navs.pay.btn.onclick = () => showTab('pay');

    // --- MANEJO DE IMAGENES ---
    let logoBase64 = null;
    const imgLogo = document.getElementById("imgLogo");
    const iconCam = document.getElementById("iconCam");

    document.getElementById("fileLogo").onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                logoBase64 = ev.target.result;
                imgLogo.src = logoBase64;
                imgLogo.classList.remove("hidden");
                iconCam.classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
    };

    // --- CARGA DE DATOS (PROTOCOLO NASA/TESLA) ---
    async function loadCore() {
        try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById("nombre").value = d.nombre || "";
                document.getElementById("nit").value = d.nit || "";
                document.getElementById("direccion").value = d.direccion || "";
                document.getElementById("whatsapp").value = d.whatsapp || "";
                
                // Carga Blindada de Bold (Soporte Multi-Versión)
                const boldConfig = d.configuracion?.bold || d.bold || {};
                document.getElementById("bold_api_key").value = boldConfig.apiKey || d.bold_api_key || "";
                document.getElementById("bold_identity").value = boldConfig.identity || d.bold_identity || "";

                if (d.logo) {
                    imgLogo.src = d.logo;
                    imgLogo.classList.remove("hidden");
                    iconCam.classList.add("hidden");
                    logoBase64 = d.logo;
                }
            }
        } catch (e) {
            console.error("Critical Failure in Nexus Sync:", e);
            document.getElementById("syncStatus").innerText = "FAILURE";
            document.getElementById("syncStatus").className = "text-red-500";
        }
    }

    // --- PERSISTENCIA ATÓMICA ---
    document.getElementById("btnSave").onclick = async () => {
        const btn = document.getElementById("btnSave");
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `SINCRONIZANDO ÓRBITA... <i class="fas fa-sync fa-spin"></i>`;

        try {
            const payload = {
                nombre: document.getElementById("nombre").value.trim(),
                nit: document.getElementById("nit").value.trim(),
                direccion: document.getElementById("direccion").value.trim(),
                whatsapp: document.getElementById("whatsapp").value.trim(),
                logo: logoBase64,
                configuracion: {
                    bold: {
                        apiKey: document.getElementById("bold_api_key").value.trim(),
                        identity: document.getElementById("bold_identity").value.trim()
                    },
                    planes_nexus: MATRIZ_PLANES // Grabamos la matriz de 12 planes para que el sistema no la olvide
                },
                lastUpdate: serverTimestamp(),
                versionCore: "12.5.0-STARLINK"
            };

            await setDoc(docRef, payload, { merge: true });
            
            btn.innerHTML = `SISTEMA ESTABILIZADO <i class="fas fa-check"></i>`;
            btn.className = btn.className.replace("bg-cyan-500", "bg-emerald-500");
            
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            console.error(e);
            btn.disabled = false;
            btn.innerHTML = `ERROR EN TRANSMISIÓN`;
            btn.className = btn.className.replace("bg-cyan-500", "bg-red-600");
        }
    };

    loadCore();
}
