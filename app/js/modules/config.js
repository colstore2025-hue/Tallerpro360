/**
 * config.js - TallerPRO360 V13.0.0 🚀
 * NEXUS-X STARLINK CORE: Sistema de Onboarding Dinámico
 * REINGENIERÍA FINAL: Cálculo 1-12 meses, Bold Gateway y Academia.
 */

import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const uid = state?.uid || localStorage.getItem("uid"); // Necesario para el cobro

    if (!empresaId) return container.innerHTML = `<div class="p-10 text-white font-black italic">ERROR: ÓRBITA NO IDENTIFICADA</div>`;

    const docRef = doc(db, "empresas", empresaId);

    // --- CONFIGURACIÓN MAESTRA DE PRECIOS (Cambia aquí y se refleja en todo) ---
    const PRECIO_MES_BASE = {
        basico: 49900,
        pro: 79900,
        elite: 129000
    };

    // --- RENDERIZADO DE INTERFAZ NEXUS-X ---
    container.innerHTML = `
    <style>
        .nexus-ui { font-family: 'Inter', sans-serif; color: white; }
        .nexus-card { background: rgba(10, 15, 29, 0.7); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(40px); }
        .nexus-input-box { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; transition: 0.4s; }
        .nexus-input-box:focus-within { border-color: #22d3ee; box-shadow: 0 0 25px rgba(34,211,238,0.15); }
        .tab-btn { padding: 1rem; border-radius: 1.2rem; font-size: 10px; font-weight: 900; text-transform: uppercase; transition: 0.3s; color: #64748b; }
        .tab-btn.active-cyan { background: #06b6d4; color: black; box-shadow: 0 10px 30px rgba(6,182,212,0.3); }
        .tab-btn.active-red { background: #ef4444; color: white; box-shadow: 0 10px 30px rgba(239,68,68,0.3); }
        .glow-cyan { text-shadow: 0 0 15px rgba(34,211,238,0.6); }
        @media (min-width: 1024px) { .nexus-container { margin-left: 260px; padding: 4rem; } }
    </style>

    <div class="nexus-container pb-40 animate-in fade-in duration-700 px-6">
        <header class="flex justify-between items-center mb-12 pt-6">
            <div>
                <h1 class="text-4xl font-black tracking-tighter italic glow-cyan uppercase">CORE <span class="text-cyan-400">NEXUS-X</span></h1>
                <p class="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.4em] mt-2">Protocolo Starlink v13.0 • Dynamic Edition</p>
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
            <button id="navPay" class="tab-btn flex-1 italic">Suscripción</button>
        </nav>

        <div id="secGen" class="space-y-8 animate-in slide-in-from-bottom-4">
            <div class="nexus-card p-10 rounded-[3rem]">
                <div class="flex flex-col items-center mb-8">
                    <div id="logoArea" class="w-40 h-40 bg-black rounded-[3.5rem] border-2 border-dashed border-white/10 flex items-center justify-center relative cursor-pointer overflow-hidden">
                        <img id="imgLogo" src="" class="hidden w-full h-full object-cover">
                        <div class="text-center italic">
                            <i id="iconCam" class="fas fa-camera text-2xl text-slate-700"></i>
                            <p class="text-[8px] font-black text-slate-500 mt-2 uppercase">Logo</p>
                        </div>
                        <input type="file" id="fileLogo" class="absolute inset-0 opacity-0 cursor-pointer">
                    </div>
                </div>
                <div class="space-y-6">
                    <div class="nexus-input-box p-6">
                        <label class="text-[9px] text-cyan-500 font-black uppercase block mb-1 italic">Razón Social</label>
                        <input id="nombre" class="w-full bg-transparent text-2xl font-black outline-none text-white uppercase italic">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="nexus-input-box p-6">
                            <label class="text-[9px] text-cyan-500 font-black uppercase block mb-1 italic">NIT</label>
                            <input id="nit" class="w-full bg-transparent text-lg font-bold outline-none text-white">
                        </div>
                        <div class="nexus-input-box p-6">
                            <label class="text-[9px] text-cyan-500 font-black uppercase block mb-1 italic">Sede Principal</label>
                            <input id="direccion" class="w-full bg-transparent text-sm font-bold outline-none text-slate-300">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="secWs" class="hidden space-y-8 animate-in slide-in-from-bottom-4">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-10 rounded-[3rem] border border-emerald-500/20">
                <div class="flex items-center gap-4 mb-8">
                    <i class="fab fa-whatsapp text-4xl text-emerald-400"></i>
                    <h3 class="text-xl font-black italic uppercase text-emerald-400">WhatsApp Engine</h3>
                </div>
                <div class="nexus-input-box p-8">
                    <label class="text-[9px] text-emerald-500 font-black uppercase block mb-2">Número Maestro</label>
                    <div class="flex items-center">
                        <span class="text-xl font-black text-emerald-600 mr-2">+</span>
                        <input id="whatsapp" type="number" placeholder="57300..." class="w-full bg-transparent text-3xl font-black text-white outline-none">
                    </div>
                </div>
            </div>
        </div>

        <div id="secPay" class="hidden space-y-8 animate-in slide-in-from-bottom-4">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#2b0a0a] p-10 rounded-[3rem] border border-red-500/20 shadow-2xl">
                <div class="flex items-center gap-4 mb-10">
                    <div class="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg">B</div>
                    <h3 class="text-xl font-black uppercase text-red-500 italic">Bold Gateway Dinámico</h3>
                </div>

                <div class="nexus-card p-8 rounded-[2.5rem] border-cyan-500/20 mb-6">
                    <p class="text-[10px] text-cyan-400 font-black uppercase mb-4">Configurar Suscripción</p>
                    <div class="flex flex-col md:flex-row gap-4 mb-6">
                        <select id="selectPlan" class="flex-1 bg-black/50 p-4 rounded-2xl border border-white/10 text-white font-bold outline-none cursor-pointer">
                            <option value="basico">PLAN BÁSICO</option>
                            <option value="pro">PLAN PRO</option>
                            <option value="elite">PLAN ELITE</option>
                        </select>
                        <select id="selectMeses" class="w-full md:w-32 bg-black/50 p-4 rounded-2xl border border-white/10 text-white font-bold outline-none cursor-pointer">
                            ${[...Array(12).keys()].map(i => `<option value="${i+1}">${i+1} Mes${i>0?'es':''}</option>`).join('')}
                        </select>
                    </div>
                    <div id="displayPrecio" class="text-center py-4 bg-white/5 rounded-2xl">
                        <p class="text-[9px] text-slate-500 font-bold uppercase">Total a Pagar (COP)</p>
                        <h2 id="montoPreview" class="text-4xl font-black text-white italic">$ 49.900</h2>
                        <p id="ahorroText" class="text-[10px] text-emerald-400 font-bold mt-2 uppercase"></p>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="nexus-input-box p-4">
                        <label class="text-[8px] text-red-500 font-black uppercase block mb-1 italic">Bold API Key</label>
                        <input id="bold_api_key" type="password" class="w-full bg-transparent text-xs font-mono text-red-400 outline-none" placeholder="pk_live_...">
                    </div>
                    <div class="nexus-input-box p-4">
                        <label class="text-[8px] text-red-500 font-black uppercase block mb-1 italic">Bold Identity</label>
                        <input id="bold_identity" type="password" class="w-full bg-transparent text-xs font-mono text-red-400 outline-none" placeholder="id_live_...">
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-12 mb-20">
            <h3 class="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4 ml-2 italic">Soporte y Academia</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://youtube.com/tu-link-tutorial-bold" target="_blank" class="nexus-card p-6 rounded-3xl flex items-center gap-4 hover:border-red-500/40 transition-all group">
                    <div class="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                        <i class="fab fa-youtube text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black uppercase italic">Configurar Bold</p>
                        <p class="text-[9px] text-slate-400">Video-guía paso a paso</p>
                    </div>
                </a>
                <a href="https://youtube.com/tu-link-tutorial-ws" target="_blank" class="nexus-card p-6 rounded-3xl flex items-center gap-4 hover:border-emerald-500/40 transition-all group">
                    <div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <i class="fab fa-whatsapp text-xl"></i>
                    </div>
                    <div>
                        <p class="text-xs font-black uppercase italic">WhatsApp Engine</p>
                        <p class="text-[9px] text-slate-400">Domina las notificaciones</p>
                    </div>
                </a>
            </div>
        </div>

        <div class="fixed bottom-10 left-0 right-0 px-6 z-50">
            <button id="btnSave" class="w-full max-w-2xl mx-auto bg-cyan-500 hover:bg-cyan-400 text-black py-8 rounded-[3rem] font-black text-[14px] uppercase tracking-[0.6em] shadow-[0_20px_60px_rgba(34,211,238,0.3)] transition-all flex items-center justify-center gap-4">
                SINCRONIZAR NEXUS-X <i class="fas fa-satellite animate-bounce"></i>
            </button>
        </div>
    </div>
    `;

    // --- LÓGICA DINÁMICA DE PRECIOS ---
    const selectPlan = document.getElementById("selectPlan");
    const selectMeses = document.getElementById("selectMeses");
    const montoPreview = document.getElementById("montoPreview");
    const ahorroText = document.getElementById("ahorroText");

    const calcularMonto = () => {
        const plan = selectPlan.value;
        const meses = parseInt(selectMeses.value);
        let factor = 1.0;
        
        if (meses >= 12) { factor = 0.70; ahorroText.innerText = "¡Ahorras 30%!"; }
        else if (meses >= 6) { factor = 0.80; ahorroText.innerText = "¡Ahorras 20%!"; }
        else if (meses >= 3) { factor = 0.90; ahorroText.innerText = "¡Ahorras 10%!"; }
        else { ahorroText.innerText = ""; }

        const total = Math.round((PRECIO_MES_BASE[plan] * meses) * factor);
        montoPreview.innerText = `$ ${total.toLocaleString()}`;
        return total;
    };

    selectPlan.onchange = calcularMonto;
    selectMeses.onchange = calcularMonto;

    // --- NAVEGACIÓN ---
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

    // --- LOGO ENGINE ---
    let logoBase64 = null;
    document.getElementById("fileLogo").onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                logoBase64 = ev.target.result;
                document.getElementById("imgLogo").src = logoBase64;
                document.getElementById("imgLogo").classList.remove("hidden");
                document.getElementById("iconCam").classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
    };

    // --- PERSISTENCIA Y CARGA ---
    async function loadCore() {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById("nombre").value = d.nombre || "";
            document.getElementById("nit").value = d.nit || "";
            document.getElementById("direccion").value = d.direccion || "";
            document.getElementById("whatsapp").value = d.whatsapp || "";
            
            const bold = d.configuracion?.bold || {};
            document.getElementById("bold_api_key").value = bold.apiKey || "";
            document.getElementById("bold_identity").value = bold.identity || "";

            if (d.logo) {
                document.getElementById("imgLogo").src = d.logo;
                document.getElementById("imgLogo").classList.remove("hidden");
                document.getElementById("iconCam").classList.add("hidden");
                logoBase64 = d.logo;
            }
        }
        calcularMonto();
    }

    document.getElementById("btnSave").onclick = async () => {
        const btn = document.getElementById("btnSave");
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
                    }
                },
                lastUpdate: serverTimestamp(),
                versionCore: "13.0.0-STARLINK"
            };

            await setDoc(docRef, payload, { merge: true });
            btn.innerHTML = `SISTEMA ESTABILIZADO <i class="fas fa-check"></i>`;
            btn.className = "w-full max-w-2xl mx-auto bg-emerald-500 text-black py-8 rounded-[3rem] font-black uppercase";
            
            setTimeout(() => location.reload(), 1200);
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = `ERROR DE TRANSMISIÓN`;
        }
    };

    loadCore();
}
