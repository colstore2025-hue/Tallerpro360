/**
 * config.js - TallerPRO360 V14.0.0 🚀
 * NEXUS-X STARLINK CORE: Reingeniería de Algoritmos y Pasarela Bold
 * Ruta Crítica: empresas/[empresaId]
 */
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const uid = state?.uid || localStorage.getItem("uid");

    // ESCUDO DE SEGURIDAD NEXUS
    if (!empresaId || empresaId === "PENDIENTE") {
        return container.innerHTML = `
            <div class="p-20 text-center animate-pulse">
                <i class="fas fa-satellite-dish text-cyan-500 text-5xl mb-6"></i>
                <h2 class="orbitron text-white text-xs font-black tracking-[0.5em] uppercase">Error: Órbita No Identificada</h2>
                <p class="text-[8px] text-slate-500 mt-4 uppercase">Sincronizando con el satélite... Por favor reingrese.</p>
                <button onclick="location.reload()" class="mt-8 bg-cyan-500 text-black px-8 py-3 rounded-full font-black text-[9px] uppercase">Reintentar Enlace</button>
            </div>`;
    }

    const docRef = doc(db, "empresas", empresaId);
    let logoBase64 = null;

    // --- ALGORITMO DE PRECIOS NEXUS-X ---
    const PLANES = {
        basico: { nombre: "Básico", base: 49900 },
        pro: { nombre: "PRO", base: 79900 },
        elite: { nombre: "ELITE", base: 129000 }
    };

    container.innerHTML = `
    <div class="max-w-4xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header class="flex justify-between items-center mb-10 px-4">
            <div>
                <h1 class="orbitron text-2xl font-black italic text-white tracking-tighter uppercase">SYSTEM <span class="text-cyan-400">CORE</span></h1>
                <p class="text-[8px] text-cyan-500/80 font-bold uppercase tracking-[0.4em] mt-1">Protocolo de Configuración Global v14.0</p>
            </div>
            <div class="bg-black/40 border border-cyan-500/30 px-4 py-2 rounded-2xl backdrop-blur-md">
                <span class="text-[7px] text-cyan-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> Nodo: ${empresaId}
                </span>
            </div>
        </header>

        <nav class="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-[2rem] mb-10 backdrop-blur-2xl shadow-2xl mx-4">
            <button data-tab="secGen" class="tab-btn active flex-1 py-4 rounded-2xl text-[9px] font-black uppercase transition-all">Empresa</button>
            <button data-tab="secWs" class="tab-btn flex-1 py-4 rounded-2xl text-[9px] font-black uppercase transition-all">WhatsApp</button>
            <button data-tab="secPay" class="tab-btn flex-1 py-4 rounded-2xl text-[9px] font-black uppercase transition-all italic text-red-400">Suscripción & Bold</button>
        </nav>

        <div id="secGen" class="tab-content space-y-6 px-4">
            <div class="bg-white/5 border border-white/5 p-8 rounded-[3rem] backdrop-blur-sm relative overflow-hidden group">
                <div class="flex flex-col items-center mb-10">
                    <div id="logoDrop" class="w-32 h-32 bg-gradient-to-tr from-slate-900 to-black rounded-[2.5rem] border-2 border-dashed border-white/20 flex items-center justify-center relative overflow-hidden shadow-2xl hover:border-cyan-500/50 transition-all cursor-pointer">
                        <img id="prevLogo" src="" class="hidden w-full h-full object-cover">
                        <i id="camIcon" class="fas fa-camera text-2xl text-slate-700"></i>
                        <input type="file" id="inputLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                    </div>
                    <p class="text-[8px] text-slate-500 font-black mt-4 uppercase tracking-[0.2em]">Cargar Identidad de Marca</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-[7px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Razón Social</label>
                        <input id="inNombre" class="w-full bg-black/40 p-5 rounded-2xl border border-white/5 outline-none text-white font-bold orbitron uppercase italic focus:border-cyan-500/40">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[7px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">NIT / ID Fiscal</label>
                        <input id="inNit" class="w-full bg-black/40 p-5 rounded-2xl border border-white/5 outline-none text-white font-mono focus:border-cyan-500/40">
                    </div>
                </div>
            </div>
        </div>

        <div id="secWs" class="tab-content hidden px-4">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-10 rounded-[3rem] border border-emerald-500/20 shadow-2xl">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-xs font-black text-emerald-400 uppercase italic flex items-center gap-3">
                        <i class="fab fa-whatsapp text-2xl"></i> Motor de Notificaciones
                    </h3>
                    <span class="text-[7px] bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full border border-emerald-500/20 font-black uppercase">Auto-Sincronización</span>
                </div>
                <div class="bg-black/60 p-8 rounded-3xl border border-white/5">
                    <label class="text-[8px] text-emerald-500 font-black uppercase mb-3 block">Número Maestro (Eje: 573001234567)</label>
                    <input id="inWs" type="number" class="w-full bg-transparent text-3xl font-black text-white outline-none tracking-tighter" placeholder="57...">
                    <p class="text-[9px] text-slate-500 mt-6 italic">Este número enviará automáticamente los estados de orden y links de pago a sus clientes.</p>
                </div>
            </div>
        </div>

        <div id="secPay" class="tab-content hidden px-4 space-y-8">
            <div class="bg-gradient-to-b from-[#0a0f1d] to-[#1a0505] p-10 rounded-[3.5rem] border border-red-500/20 shadow-2xl relative overflow-hidden">
                <h3 class="text-xl font-black italic text-red-500 mb-8 uppercase tracking-tighter">Billing Engine <span class="text-white">Starlink</span></h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-2 block">Seleccionar Plan</label>
                        <select id="selPlan" class="w-full bg-transparent text-white font-black outline-none cursor-pointer orbitron text-xs">
                            <option value="basico">PLAN BÁSICO</option>
                            <option value="pro">PLAN PRO</option>
                            <option value="elite">PLAN ELITE</option>
                        </select>
                    </div>
                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-2 block">Periodo de Uso</label>
                        <select id="selMeses" class="w-full bg-transparent text-white font-black outline-none cursor-pointer orbitron text-xs">
                            <option value="1">1 MES (Estándar)</option>
                            <option value="3">3 MESES (10% OFF)</option>
                            <option value="6">6 MESES (20% OFF)</option>
                            <option value="12">12 MESES (30% OFF - VIP)</option>
                        </select>
                    </div>
                </div>
                <div class="bg-black/60 p-10 rounded-[2.5rem] border border-white/5 text-center shadow-inner">
                    <p class="text-[9px] text-cyan-400 font-black uppercase tracking-[0.3em] mb-2 italic">Valor de Renovación Nexus-X</p>
                    <h2 id="txtTotal" class="text-5xl font-black text-white italic tracking-tighter">$ 0</h2>
                    <p id="txtAhorro" class="text-[10px] text-emerald-400 font-bold mt-4 uppercase animate-pulse"></p>
                </div>
                <button id="btnRenovar" class="w-full mt-8 bg-gradient-to-r from-red-600 to-red-900 text-white py-6 rounded-3xl font-black orbitron text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-500/20 active:scale-95 transition-all">
                    Ejecutar Protocolo de Pago <i class="fas fa-bolt ml-2"></i>
                </button>
            </div>

            <div class="bg-white/5 p-10 rounded-[3rem] border border-cyan-500/20 backdrop-blur-md">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h3 class="text-xs font-black text-cyan-400 uppercase italic">Pasarela de Cobro (Bold Pay)</h3>
                        <p class="text-[8px] text-slate-500 uppercase font-bold mt-1">Reciba pagos de sus clientes directamente</p>
                    </div>
                    <button onclick="window.open('https://bold.co')" class="text-[7px] bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full border border-cyan-500/30 font-black uppercase tracking-widest">Video Guía Bold</button>
                </div>
                <div class="space-y-4">
                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-1 block">API Key de Producción (pk_live_...)</label>
                        <input id="inBoldKey" type="password" class="w-full bg-transparent text-xs font-mono text-cyan-200 outline-none">
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-10 left-0 right-0 px-8 z-[100] flex justify-center">
            <button id="btnSaveAll" class="w-full max-w-lg bg-cyan-500 text-black py-7 rounded-full font-black orbitron text-[11px] uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:bg-cyan-400 active:scale-95 transition-all flex items-center justify-center gap-4">
                Sincronizar Nexus-X <i class="fas fa-satellite"></i>
            </button>
        </div>
    </div>

    <style>
        .orbitron { font-family: 'Orbitron', sans-serif; }
        .tab-btn { background: transparent; color: #64748b; border: 1px solid transparent; }
        .tab-btn.active { background: #06b6d4; color: #000; box-shadow: 0 10px 25px rgba(6,182,212,0.3); }
        .tab-content.hidden { display: none; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    </style>
    `;

    // --- LÓGICA DE ALGORITMOS DE PRECIO ---
    const selPlan = document.getElementById("selPlan");
    const selMeses = document.getElementById("selMeses");
    const txtTotal = document.getElementById("txtTotal");
    const txtAhorro = document.getElementById("txtAhorro");

    const calcularPrecios = () => {
        const plan = PLANES[selPlan.value];
        const meses = parseInt(selMeses.value);
        let descuento = 1.0;

        if (meses === 12) { descuento = 0.70; txtAhorro.innerText = "★ BENEFICIO ANUAL ACTIVADO: 30% OFF ★"; }
        else if (meses === 6) { descuento = 0.80; txtAhorro.innerText = "✔ BENEFICIO SEMESTRAL: 20% OFF"; }
        else if (meses === 3) { descuento = 0.90; txtAhorro.innerText = "✔ BENEFICIO TRIMESTRAL: 10% OFF"; }
        else { txtAhorro.innerText = "TARIFA ESTÁNDAR MENSUAL"; }

        const total = Math.round((plan.base * meses) * descuento);
        txtTotal.innerText = `$ ${total.toLocaleString()}`;
    };

    selPlan.onchange = calcularPrecios;
    selMeses.onchange = calcularPrecios;

    // --- MANEJO DE TABS ---
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.remove('hidden');
        };
    });

    // --- MANEJO DE LOGO (BASE64) ---
    document.getElementById("inputLogo").onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                logoBase64 = ev.target.result;
                document.getElementById("prevLogo").src = logoBase64;
                document.getElementById("prevLogo").classList.remove("hidden");
                document.getElementById("camIcon").classList.add("hidden");
            };
            reader.readAsDataURL(file);
        }
    };

    // --- CARGA INICIAL DE DATOS ---
    const loadCore = async () => {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById("inNombre").value = d.nombre || "";
            document.getElementById("inNit").value = d.nit || "";
            document.getElementById("inWs").value = d.whatsapp || "";
            document.getElementById("inBoldKey").value = d.bold_api_key || "";
            if (d.logo) {
                logoBase64 = d.logo;
                document.getElementById("prevLogo").src = d.logo;
                document.getElementById("prevLogo").classList.remove("hidden");
                document.getElementById("camIcon").classList.add("hidden");
            }
        }
        calcularPrecios();
    };

    // --- GUARDADO MAESTRO ---
    document.getElementById("btnSaveAll").onclick = async () => {
        const btn = document.getElementById("btnSaveAll");
        btn.disabled = true;
        btn.innerHTML = `TRANSMITIENDO A SATÉLITE... <i class="fas fa-sync fa-spin"></i>`;

        try {
            const payload = {
                nombre: document.getElementById("inNombre").value.trim().toUpperCase(),
                nit: document.getElementById("inNit").value.trim(),
                whatsapp: document.getElementById("inWs").value.trim(),
                bold_api_key: document.getElementById("inBoldKey").value.trim(),
                logo: logoBase64,
                lastUpdate: serverTimestamp(),
                empresaId: empresaId,
                status: "ACTIVE_CORE"
            };

            await setDoc(docRef, payload, { merge: true });
            
            // Actualizar contexto local
            localStorage.setItem("nombreTaller", payload.nombre);
            
            btn.innerHTML = `SINCRO EXITOSA <i class="fas fa-check"></i>`;
            btn.classList.replace("bg-cyan-500", "bg-emerald-500");
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            console.error("Falla Nexus:", e);
            btn.disabled = false;
            btn.innerHTML = `ERROR DE ENLACE`;
        }
    };

    loadCore();
}
