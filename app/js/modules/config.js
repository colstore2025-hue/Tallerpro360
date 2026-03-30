/**
 * config.js - TallerPRO360 NEXUS-X V17.5 🚀
 * Estándar: Enterprise / Blindado
 * Sincronización Maestra: Identidad, Billing & Bold Pay
 */
import { 
    doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function configModule(container, state) {
    // 🛡️ PROTOCOLO DE RECUPERACIÓN DE ÓRBITA (Priority Zero)
    let empresaId = state?.empresaId || localStorage.getItem("nexus_empresaId");
    const uid = state?.uid || localStorage.getItem("nexus_uid");

    // RASTREO DINÁMICO DE NODO (Evita el "Protocol Broken")
    if ((!empresaId || empresaId === "PENDIENTE") && uid) {
        try {
            const userRef = doc(db, "usuarios", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                empresaId = userSnap.data().empresaId;
                if(empresaId) localStorage.setItem("nexus_empresaId", empresaId);
            }
        } catch (err) { console.error("Nexus-X Radar Error:", err); }
    }

    // PANTALLA DE ERROR SANEADA
    if (!empresaId || empresaId === "PENDIENTE") {
        return container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[70vh] p-10 animate-pulse">
                <i class="fas fa-satellite-dish text-red-500 text-7xl mb-8 shadow-glow-red"></i>
                <h2 class="orbitron text-white text-xl font-black tracking-widest uppercase">Nodo no Identificado</h2>
                <p class="text-[10px] text-slate-500 mt-4 uppercase text-center max-w-xs leading-relaxed">
                    La firma digital de su taller no ha sido detectada. Re-establezca la conexión principal.
                </p>
                <button onclick="location.reload()" class="mt-12 bg-white text-black px-10 py-5 rounded-full font-black text-[10px] uppercase orbitron hover:bg-cyan-500 transition-all">RE-ESTABLECER ÓRBITA</button>
            </div>`;
    }

    const docRef = doc(db, "empresas", empresaId);
    let logoBase64 = null;

    const PLANES = {
        basico: { nombre: "Básico", base: 49900 },
        pro: { nombre: "PRO", base: 79900 },
        elite: { nombre: "ELITE", base: 129000 }
    };

    // --- RENDERIZADO DE INTERFAZ EMPRESARIAL ---
    container.innerHTML = `
    <div class="max-w-5xl mx-auto pb-40 px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <header class="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <div class="h-10 w-2 bg-cyan-500 rounded-full"></div>
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase">Nexus_<span class="text-cyan-400">Core</span></h1>
                </div>
                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-[0.5em] italic">Global Fleet Configuration & Billing</p>
            </div>
            <div class="bg-[#0d1117] border border-white/5 px-8 py-5 rounded-[2.5rem] shadow-2xl">
                <span class="text-[8px] text-cyan-400 font-black uppercase tracking-widest flex items-center gap-3">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> ID_NODO: <span class="text-white font-mono">${empresaId}</span>
                </span>
            </div>
        </header>

        <nav class="grid grid-cols-3 gap-3 p-2 bg-[#0d1117] border border-white/5 rounded-[3rem] mb-16 shadow-inner">
            <button data-tab="secGen" class="tab-btn active py-5 rounded-[2.5rem] text-[10px] font-black uppercase transition-all orbitron">Identidad</button>
            <button data-tab="secWs" class="tab-btn py-5 rounded-[2.5rem] text-[10px] font-black uppercase transition-all orbitron">Canales</button>
            <button data-tab="secPay" class="tab-btn py-5 rounded-[2.5rem] text-[10px] font-black uppercase transition-all orbitron italic text-red-500">Facturación</button>
        </nav>

        <div id="secGen" class="tab-content space-y-10">
            <div class="bg-[#0d1117] border border-white/5 p-12 rounded-[4rem] relative overflow-hidden group shadow-2xl">
                <div class="flex flex-col items-center mb-16">
                    <div id="logoDrop" class="w-48 h-48 bg-black rounded-[3.5rem] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-cyan-500/50 transition-all cursor-pointer">
                        <img id="prevLogo" src="" class="hidden w-full h-full object-cover group-hover:opacity-30 transition-opacity">
                        <div class="flex flex-col items-center gap-3" id="camOverlay">
                            <i class="fas fa-upload text-3xl text-slate-700 group-hover:text-cyan-500 transition-colors"></i>
                            <span class="text-[7px] text-slate-600 font-black uppercase tracking-widest">Cargar Marca</span>
                        </div>
                        <input type="file" id="inputLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div class="space-y-4">
                        <label class="text-[9px] text-cyan-400 font-black uppercase tracking-widest ml-2">Nombre Legal / Comercial</label>
                        <input id="inNombre" class="w-full bg-black/40 p-7 rounded-3xl border border-white/5 outline-none text-white font-bold orbitron uppercase italic focus:border-cyan-400 transition-all" placeholder="EJ: TALLER NEXUS-X">
                    </div>
                    <div class="space-y-4">
                        <label class="text-[9px] text-cyan-400 font-black uppercase tracking-widest ml-2">Identificación Tributaria (NIT)</label>
                        <input id="inNit" class="w-full bg-black/40 p-7 rounded-3xl border border-white/5 outline-none text-white font-mono focus:border-cyan-400 transition-all" placeholder="900.000.000-1">
                    </div>
                </div>
            </div>
        </div>

        <div id="secWs" class="tab-content hidden">
            <div class="bg-gradient-to-br from-[#0d1117] to-[#06201a] p-12 rounded-[4rem] border border-emerald-500/10 shadow-3xl">
                <div class="flex justify-between items-center mb-12">
                    <h3 class="text-sm font-black text-emerald-400 uppercase italic flex items-center gap-5 orbitron">
                        <i class="fab fa-whatsapp text-4xl"></i> WhatsApp Cloud Engine
                    </h3>
                </div>
                <div class="bg-black/40 p-12 rounded-[3.5rem] border border-white/5">
                    <label class="text-[9px] text-emerald-500 font-black uppercase mb-6 block tracking-[0.3em]">Línea Maestra de Despacho</label>
                    <div class="flex items-center gap-6">
                        <span class="text-3xl font-black text-emerald-900 orbitron">+57</span>
                        <input id="inWs" type="number" class="w-full bg-transparent text-5xl font-black text-white outline-none tracking-tighter" placeholder="3000000000">
                    </div>
                    <p class="text-[9px] text-slate-500 mt-10 italic leading-relaxed uppercase font-black opacity-40">Protocolo Nexus-X enviará órdenes y reportes PDF vía API.</p>
                </div>
            </div>
        </div>

        <div id="secPay" class="tab-content hidden space-y-12">
            <div class="bg-gradient-to-b from-[#0d1117] to-[#1a0505] p-14 rounded-[4rem] border border-red-500/10 shadow-3xl">
                <h3 class="text-2xl font-black italic text-red-500 mb-12 uppercase tracking-tighter orbitron">Billing <span class="text-white">Starlink</span></h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                    <div class="bg-black/40 p-8 rounded-3xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-4 block italic">Nivel de Potencia</label>
                        <select id="selPlan" class="w-full bg-transparent text-white font-black outline-none orbitron text-[11px] uppercase">
                            <option value="basico">PLAN BÁSICO NEXUS</option>
                            <option value="pro" selected>PLAN PRO STARLINK</option>
                            <option value="elite">PLAN ELITE NASA-TECH</option>
                        </select>
                    </div>
                    <div class="bg-black/40 p-8 rounded-3xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-4 block italic">Ciclo Sincronizado</label>
                        <select id="selMeses" class="w-full bg-transparent text-white font-black outline-none orbitron text-[11px] uppercase">
                            <option value="1">1 MES (ÓRBITA ESTÁNDAR)</option>
                            <option value="12">12 MESES (30% DESCUENTO VIP)</option>
                        </select>
                    </div>
                </div>
                <div class="bg-black/60 p-14 rounded-[3.5rem] border border-white/10 text-center relative">
                    <p class="text-[10px] text-cyan-400 font-black uppercase tracking-[0.5em] mb-5 italic">Fee de Operación</p>
                    <h2 id="txtTotal" class="text-7xl font-black text-white italic tracking-tighter orbitron">$ 0</h2>
                    <p id="txtAhorro" class="text-[9px] text-emerald-400 font-bold mt-8 uppercase tracking-widest bg-emerald-500/10 inline-block px-8 py-3 rounded-full border border-emerald-500/20"></p>
                </div>
            </div>

            <div class="bg-[#0d1117] p-14 rounded-[4rem] border border-cyan-500/10 shadow-2xl">
                <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div>
                        <h3 class="text-sm font-black text-cyan-400 uppercase italic orbitron">Pasarela Bold Pay</h3>
                        <p class="text-[10px] text-slate-500 uppercase font-bold mt-2 tracking-widest">Habilita cobros con tarjeta y link de pago</p>
                    </div>
                    <button onclick="window.open('https://bold.co')" class="text-[9px] bg-cyan-500/10 text-cyan-400 px-8 py-4 rounded-full border border-cyan-500/20 font-black uppercase orbitron hover:bg-cyan-500 hover:text-black transition-all">Obtener Llaves</button>
                </div>
                <div class="bg-black/40 p-10 rounded-[2.5rem] border border-white/5">
                    <label class="text-[9px] text-slate-600 font-black uppercase mb-4 block tracking-widest">Bold API Key (Producción)</label>
                    <input id="inBoldKey" type="password" class="w-full bg-transparent text-lg font-mono text-cyan-300 outline-none" placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx">
                </div>
            </div>
        </div>

        <div class="fixed bottom-12 left-0 right-0 px-8 z-[100] flex justify-center pointer-events-none">
            <button id="btnSaveAll" class="pointer-events-auto w-full max-w-2xl bg-cyan-500 text-black py-8 rounded-[3.5rem] font-black orbitron text-[13px] uppercase tracking-[0.7em] shadow-glow-cyan hover:bg-cyan-400 active:scale-95 transition-all flex items-center justify-center gap-8">
                SINCRONIZAR NODO <i class="fas fa-satellite animate-bounce"></i>
            </button>
        </div>
    </div>

    <style>
        .orbitron { font-family: 'Orbitron', sans-serif; }
        .tab-btn { background: transparent; color: #475569; border: none; cursor: pointer; }
        .tab-btn.active { background: #06b6d4; color: #000; box-shadow: 0 15px 40px rgba(6,182,212,0.3); }
        .tab-content.hidden { display: none; }
        .shadow-glow-cyan { box-shadow: 0 0 50px rgba(6,182,212,0.2); }
        .shadow-glow-red { filter: drop-shadow(0 0 20px rgba(220,38,38,0.5)); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
    </style>
    `;

    // --- ALGORITMO FINANCIERO NEXUS ---
    const selPlan = document.getElementById("selPlan");
    const selMeses = document.getElementById("selMeses");
    const txtTotal = document.getElementById("txtTotal");
    const txtAhorro = document.getElementById("txtAhorro");

    const calcularPrecios = () => {
        const plan = PLANES[selPlan.value] || PLANES.pro;
        const meses = parseInt(selMeses.value);
        let descuento = (meses === 12) ? 0.70 : 1.0;
        
        txtAhorro.innerText = (meses === 12) ? "★ BENEFICIO ANUAL: 30% OFF APLICADO ★" : "TARIFA MENSUAL ESTÁNDAR";
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

    // --- LÓGICA DE MARCA (LOGO) ---
    document.getElementById("inputLogo").onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                logoBase64 = ev.target.result;
                const prev = document.getElementById("prevLogo");
                prev.src = logoBase64;
                prev.classList.remove("hidden");
                document.getElementById("camOverlay").classList.add("opacity-0");
            };
            reader.readAsDataURL(file);
        }
    };

    // --- CARGA DE DATOS MAESTRA ---
    const loadCore = async () => {
        try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById("inNombre").value = d.nombre || "";
                document.getElementById("inNit").value = d.nit || "";
                document.getElementById("inWs").value = d.whatsapp || "";
                document.getElementById("inBoldKey").value = d.bold_api_key || "";
                
                // Persistencia de seguridad para otros módulos
                if(d.nombre) localStorage.setItem("nexus_empresaNombre", d.nombre);
                if(d.nit) localStorage.setItem("nexus_empresaNit", d.nit);
                if(d.bold_api_key) localStorage.setItem("nexus_bold_api_key", d.bold_api_key);

                if (d.logo) {
                    logoBase64 = d.logo;
                    const img = document.getElementById("prevLogo");
                    img.src = d.logo;
                    img.classList.remove("hidden");
                    document.getElementById("camOverlay").classList.add("opacity-0");
                }
            }
            calcularPrecios();
        } catch (e) { console.error("Nexus Core Error:", e); }
    };

    // --- GUARDADO ENTERPRISE (SINCRO STARLINK) ---
    document.getElementById("btnSaveAll").onclick = async () => {
        const btn = document.getElementById("btnSaveAll");
        const boldKeyVal = document.getElementById("inBoldKey").value.trim();
        const nombreVal = document.getElementById("inNombre").value.trim().toUpperCase();
        
        btn.disabled = true;
        btn.innerHTML = `TRANSMITIENDO... <i class="fas fa-sync fa-spin"></i>`;

        try {
            if (!nombreVal) throw new Error("IDENTIDAD REQUERIDA");

            const payload = {
                nombre: nombreVal,
                nit: document.getElementById("inNit").value.trim(),
                whatsapp: document.getElementById("inWs").value.trim(),
                bold_api_key: boldKeyVal,
                logo: logoBase64,
                lastUpdate: serverTimestamp(),
                empresaId: empresaId,
                updatedBy: uid
            };

            await setDoc(docRef, payload, { merge: true });
            
            // ACTUALIZACIÓN CRÍTICA DE CACHÉ (PARA ORDENES.JS)
            localStorage.setItem("nexus_empresaNombre", payload.nombre);
            localStorage.setItem("nexus_empresaNit", payload.nit);
            localStorage.setItem("nexus_bold_api_key", boldKeyVal);
            
            btn.innerHTML = `SINCRO EXITOSA <i class="fas fa-check"></i>`;
            btn.classList.replace("bg-cyan-500", "bg-emerald-500");
            
            hablar("Configuración de órbita actualizada con éxito. El sistema Nexus está listo.");
            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = `FALLO: ${e.message.toUpperCase()}`;
            btn.classList.replace("bg-cyan-500", "bg-red-500");
        }
    };

    loadCore();
}
