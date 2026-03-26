/**
 * config.js - TallerPRO360 V13.5.0 🚀
 * NEXUS-X STARLINK CORE: Sistema de Onboarding Dinámico & Algoritmo de Tiempo
 */
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    if (!empresaId) return container.innerHTML = `<div class="p-10 text-white font-black italic animate-pulse">ERROR: ÓRBITA NO IDENTIFICADA - REINICIE SESIÓN</div>`;

    const docRef = doc(db, "empresas", empresaId);

    // --- ALGORITMO DE PRECIOS BASE NEXUS-X ---
    const PRECIOS_BASE = {
        basico: 49900,
        pro: 79900,
        elite: 129000,
        enterprise: 0 // Acuerdo directo
    };

    container.innerHTML = `
    <style>
        .nexus-ui { font-family: 'Inter', sans-serif; color: white; }
        .nexus-card { background: rgba(10, 15, 29, 0.7); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(40px); border-radius: 2rem; }
        .nexus-input-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 1.2rem; transition: 0.3s; padding: 1rem; }
        .nexus-input-box:focus-within { border-color: #06b6d4; box-shadow: 0 0 20px rgba(6,182,212,0.1); }
        .tab-btn { padding: 0.8rem; border-radius: 1rem; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; transition: 0.3s; flex: 1; }
        .tab-btn.active { background: #06b6d4; color: black; box-shadow: 0 8px 20px rgba(6,182,212,0.2); }
        .btn-pay { background: linear-gradient(90deg, #ef4444, #b91c1c); color: white; font-weight: 900; letter-spacing: 2px; }
        @media (min-width: 1024px) { .nexus-content { margin-left: 260px; padding: 3rem; } }
    </style>

    <div class="nexus-content pb-32 animate-in fade-in duration-500">
        <header class="flex justify-between items-end mb-10">
            <div>
                <h1 class="text-3xl font-black italic text-white uppercase tracking-tighter">CONFIGURACIÓN <span class="text-cyan-400">CORE</span></h1>
                <p class="text-[9px] text-cyan-500/60 font-bold uppercase tracking-[0.3em]">Protocolo Nexus-X Starlink • v13.5</p>
            </div>
            <div class="text-right hidden md:block">
                <span id="syncStatus" class="text-[8px] font-black text-emerald-500 uppercase border border-emerald-500/30 px-3 py-1 rounded-full">Sistema Estable</span>
            </div>
        </header>

        <nav class="flex gap-2 p-1.5 nexus-card mb-8">
            <button data-tab="secGen" class="tab-btn active">Empresa</button>
            <button data-tab="secWs" class="tab-btn">WhatsApp</button>
            <button data-tab="secPay" class="tab-btn italic">Suscripción</button>
        </nav>

        <div id="secGen" class="tab-content space-y-6">
            <div class="nexus-card p-8">
                <div class="flex flex-col items-center mb-8">
                    <div id="logoWrapper" class="w-32 h-32 bg-black rounded-[2.5rem] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
                        <img id="imgLogo" src="" class="hidden w-full h-full object-cover">
                        <i id="iconCam" class="fas fa-camera text-xl text-slate-700 group-hover:text-cyan-500 transition-colors"></i>
                        <input type="file" id="fileLogo" class="absolute inset-0 opacity-0 cursor-pointer">
                    </div>
                    <p class="text-[8px] font-black text-slate-500 mt-3 uppercase">Identidad de Marca</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="nexus-input-box">
                        <label class="text-[8px] text-cyan-500 font-black uppercase mb-1 block">Razón Social</label>
                        <input id="nombre" type="text" class="w-full bg-transparent text-lg font-bold outline-none text-white uppercase">
                    </div>
                    <div class="nexus-input-box">
                        <label class="text-[8px] text-cyan-500 font-black uppercase mb-1 block">NIT / Identificación</label>
                        <input id="nit" type="text" class="w-full bg-transparent text-lg font-bold outline-none text-white">
                    </div>
                </div>
            </div>
        </div>

        <div id="secPay" class="tab-content hidden space-y-6">
            <div class="nexus-card p-8 border-red-500/20 bg-gradient-to-b from-[#0a0f1d] to-[#1a0505]">
                <h3 class="text-xl font-black italic text-red-500 mb-6 uppercase">Nexus-X Billing Engine</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="nexus-input-box">
                        <label class="text-[8px] text-slate-400 font-black uppercase mb-2 block">Seleccionar Plan</label>
                        <select id="selectPlan" class="w-full bg-transparent text-white font-bold outline-none cursor-pointer">
                            <option value="basico">PLAN BÁSICO</option>
                            <option value="pro">PLAN PRO</option>
                            <option value="elite">PLAN ELITE</option>
                        </select>
                    </div>
                    <div class="nexus-input-box">
                        <label class="text-[8px] text-slate-400 font-black uppercase mb-2 block">Tiempo de Uso</label>
                        <select id="selectMeses" class="w-full bg-transparent text-white font-bold outline-none cursor-pointer">
                            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}">${m} Mes${m>1?'es':''}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="bg-black/40 p-6 rounded-2xl border border-white/5 text-center mb-8">
                    <p class="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-1">Total Suscripción Nexus-X</p>
                    <h2 id="montoPreview" class="text-4xl font-black text-white italic tracking-tighter">$ 0</h2>
                    <p id="ahorroText" class="text-[10px] text-emerald-400 font-bold mt-2 uppercase"></p>
                </div>

                <button id="btnPaySusc" class="w-full btn-pay p-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-3">
                    RENOVAR AHORA <i class="fas fa-rocket"></i>
                </button>
            </div>

            <div class="nexus-card p-8 border-cyan-500/20">
                <h3 class="text-sm font-black text-cyan-400 mb-4 uppercase">Configuración de Cobro (Taller)</h3>
                <p class="text-[10px] text-slate-400 mb-6">Ingresa tus llaves de Bold para recibir pagos directos de tus clientes por reparaciones.</p>
                <div class="space-y-4">
                    <div class="nexus-input-box">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">API Key (Producción)</label>
                        <input id="bold_api_key" type="password" class="w-full bg-transparent text-xs font-mono text-cyan-200 outline-none">
                    </div>
                    <div class="nexus-input-box">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">Identity (Producción)</label>
                        <input id="bold_identity" type="password" class="w-full bg-transparent text-xs font-mono text-cyan-200 outline-none">
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-8 left-0 right-0 px-6 z-[100] flex justify-center">
            <button id="btnSave" class="w-full max-w-lg bg-cyan-500 text-black py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-cyan-400 transition-all">
                Sincronizar Cambios
            </button>
        </div>
    </div>
    `;

    // --- LÓGICA DE ALGORITMO Y NAVEGACIÓN ---
    const selectPlan = document.getElementById("selectPlan");
    const selectMeses = document.getElementById("selectMeses");
    const montoPreview = document.getElementById("montoPreview");
    const ahorroText = document.getElementById("ahorroText");

    const actualizarAlgoritmo = () => {
        const plan = selectPlan.value;
        const meses = parseInt(selectMeses.value);
        let factor = 1.0;
        
        if (meses >= 12) { factor = 0.70; ahorroText.innerText = "¡Beneficio Anual: 30% OFF!"; }
        else if (meses >= 6) { factor = 0.80; ahorroText.innerText = "¡Beneficio Semestral: 20% OFF!"; }
        else if (meses >= 3) { factor = 0.90; ahorroText.innerText = "¡Beneficio Trimestral: 10% OFF!"; }
        else { ahorroText.innerText = "Tarifa Estándar"; }

        const total = Math.round((PRECIOS_BASE[plan] * meses) * factor);
        montoPreview.innerText = `$ ${total.toLocaleString()}`;
    };

    selectPlan.onchange = actualizarAlgoritmo;
    selectMeses.onchange = actualizarAlgoritmo;

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.remove('hidden');
        };
    });

    // Carga inicial de datos
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const d = snap.data();
        document.getElementById("nombre").value = d.nombre || "";
        document.getElementById("nit").value = d.nit || "";
        document.getElementById("bold_api_key").value = d.configuracion?.bold?.apiKey || "";
        document.getElementById("bold_identity").value = d.configuracion?.bold?.identity || "";
        if (d.logo) {
            document.getElementById("imgLogo").src = d.logo;
            document.getElementById("imgLogo").classList.remove("hidden");
            document.getElementById("iconCam").classList.add("hidden");
        }
    }
    actualizarAlgoritmo();

    // Guardado
    document.getElementById("btnSave").onclick = async () => {
        const btn = document.getElementById("btnSave");
        btn.disabled = true;
        btn.innerText = "SINCRONIZANDO...";
        
        try {
            await setDoc(docRef, {
                nombre: document.getElementById("nombre").value,
                nit: document.getElementById("nit").value,
                configuracion: {
                    bold: {
                        apiKey: document.getElementById("bold_api_key").value,
                        identity: document.getElementById("bold_identity").value
                    }
                },
                lastUpdate: serverTimestamp()
            }, { merge: true });
            btn.innerText = "SISTEMA ACTUALIZADO";
            setTimeout(() => location.reload(), 1000);
        } catch (e) {
            alert("Error al sincronizar");
            btn.disabled = false;
        }
    };

    // Botón de Pago Suscripción (Llama a tu API de Vercel)
    document.getElementById("btnPaySusc").onclick = async () => {
        const res = await fetch("/api/create-bold-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                planId: selectPlan.value,
                meses: selectMeses.value,
                uid: uid,
                empresaId: empresaId
            })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
    };
}
