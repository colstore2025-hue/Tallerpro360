/**
 * config.js - TallerPRO360 V15.0.0 🚀
 * NEXUS-X STARLINK: Edición Blindada (Super Admin Ready)
 * Ruta Crítica: empresas/[empresaId]
 */
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function configModule(container, state) {
    // 🛡️ REPARACIÓN DE ÓRBITA: Protocolo de recuperación de triple vía
    let empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const uid = state?.uid || localStorage.getItem("uid");

    // RASTREO DE EMERGENCIA PARA SUPER ADMIN / USUARIOS GLOBAL
    if ((!empresaId || empresaId === "PENDIENTE") && uid) {
        console.warn("Nexus: Iniciando rastreo de órbita para UID:", uid);
        try {
            // Intento 1: Buscar en colección usuarios estándar
            const userRef = doc(db, "usuarios", uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                empresaId = userSnap.data().empresaId;
            } else {
                // Intento 2: Rastreo en jerarquía Super Admin (Capturas Firestore)
                // Buscamos si el usuario existe dentro de una estructura de empresa
                console.log("Nexus: Buscando en nodos globales...");
                // Nota: Aquí se podría iterar o usar una colección de mapeo si el empresaId es dinámico
            }

            if (empresaId && empresaId !== "PENDIENTE") {
                localStorage.setItem("empresaId", empresaId);
                console.log("Nexus: Órbita recuperada con éxito ->", empresaId);
            }
        } catch (err) {
            console.error("Falla en el radar de recuperación:", err);
        }
    }

    // BLOQUEO DE SEGURIDAD FINAL (ESCUDO TÉRMICO)
    if (!empresaId || empresaId === "PENDIENTE") {
        return container.innerHTML = `
            <div class="p-20 text-center animate-in zoom-in duration-500">
                <div class="relative inline-block">
                    <i class="fas fa-satellite-dish text-red-500 text-6xl mb-6"></i>
                    <div class="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
                </div>
                <h2 class="orbitron text-white text-sm font-black tracking-[0.5em] uppercase mt-6">Órbita No Identificada</h2>
                <p class="text-[10px] text-slate-500 mt-4 uppercase max-w-xs mx-auto leading-relaxed">
                    El nodo de su taller no responde. Esto puede deberse a una sesión expirada o un perfil de Super Admin sin taller vinculado.
                </p>
                <button onclick="location.href='index.html'" class="mt-10 bg-white text-black px-12 py-4 rounded-full font-black text-[10px] uppercase shadow-2xl hover:bg-cyan-500 transition-all orbitron tracking-[0.2em]">
                    Reestablecer Conexión Principal
                </button>
            </div>`;
    }

    const docRef = doc(db, "empresas", empresaId);
    let logoBase64 = null;

    // --- ALGORITMO DE PRECIOS NEXUS-X STARLINK ---
    const PLANES = {
        basico: { nombre: "Básico", base: 49900 },
        pro: { nombre: "PRO", base: 79900 },
        elite: { nombre: "ELITE", base: 129000 }
    };

    container.innerHTML = `
    <div class="max-w-4xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header class="flex flex-col md:flex-row justify-between items-center mb-12 px-6 gap-6">
            <div>
                <h1 class="orbitron text-3xl font-black italic text-white tracking-tighter uppercase">SYSTEM <span class="text-cyan-400">CORE</span></h1>
                <p class="text-[8px] text-cyan-500/80 font-bold uppercase tracking-[0.4em] mt-1">Protocolo de Configuración Global v15.0</p>
            </div>
            <div class="bg-black/40 border border-cyan-500/30 px-6 py-3 rounded-[2rem] backdrop-blur-xl shadow-2xl">
                <span class="text-[8px] text-cyan-400 font-black uppercase tracking-widest flex items-center gap-3">
                    <span class="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span> Nodo Activo: <span class="text-white">${empresaId}</span>
                </span>
            </div>
        </header>

        <nav class="flex gap-2 p-2 bg-white/5 border border-white/10 rounded-[2.5rem] mb-12 backdrop-blur-2xl shadow-2xl mx-4">
            <button data-tab="secGen" class="tab-btn active flex-1 py-5 rounded-[2rem] text-[9px] font-black uppercase transition-all orbitron">Identidad</button>
            <button data-tab="secWs" class="tab-btn flex-1 py-5 rounded-[2rem] text-[9px] font-black uppercase transition-all orbitron">WhatsApp</button>
            <button data-tab="secPay" class="tab-btn flex-1 py-5 rounded-[2rem] text-[9px] font-black uppercase transition-all orbitron italic text-red-400">Billing & Bold</button>
        </nav>

        <div id="secGen" class="tab-content space-y-8 px-4">
            <div class="bg-white/5 border border-white/5 p-10 rounded-[3.5rem] backdrop-blur-sm relative overflow-hidden group">
                <div class="flex flex-col items-center mb-12">
                    <div id="logoDrop" class="w-40 h-40 bg-gradient-to-tr from-slate-900 to-black rounded-[3rem] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner hover:border-cyan-500/50 transition-all cursor-pointer group">
                        <img id="prevLogo" src="" class="hidden w-full h-full object-cover group-hover:opacity-40 transition-opacity">
                        <div class="flex flex-col items-center gap-2" id="camOverlay">
                            <i id="camIcon" class="fas fa-camera text-3xl text-slate-700"></i>
                            <span class="text-[6px] text-slate-600 font-black uppercase">Subir Marca</span>
                        </div>
                        <input type="file" id="inputLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-3">
                        <label class="text-[8px] text-cyan-500 font-black uppercase tracking-widest ml-5 italic">Nombre del Taller / Empresa</label>
                        <input id="inNombre" class="w-full bg-black/60 p-6 rounded-3xl border border-white/5 outline-none text-white font-bold orbitron uppercase italic focus:border-cyan-500/40 transition-all" placeholder="EJ: TALLER NEXUS">
                    </div>
                    <div class="space-y-3">
                        <label class="text-[8px] text-cyan-500 font-black uppercase tracking-widest ml-5 italic">Identificación NIT</label>
                        <input id="inNit" class="w-full bg-black/60 p-6 rounded-3xl border border-white/5 outline-none text-white font-mono focus:border-cyan-500/40 transition-all" placeholder="900.000.000-1">
                    </div>
                </div>
            </div>
        </div>

        <div id="secWs" class="tab-content hidden px-4">
            <div class="bg-gradient-to-br from-[#0f172a] to-[#06201a] p-12 rounded-[4rem] border border-emerald-500/10 shadow-3xl">
                <div class="flex justify-between items-center mb-10">
                    <h3 class="text-sm font-black text-emerald-400 uppercase italic flex items-center gap-4">
                        <i class="fab fa-whatsapp text-3xl"></i> Starlink Messenger
                    </h3>
                    <span class="text-[7px] bg-emerald-500/10 text-emerald-500 px-5 py-2 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest">IA Active</span>
                </div>
                <div class="bg-black/60 p-10 rounded-[3rem] border border-white/5">
                    <label class="text-[8px] text-emerald-500 font-black uppercase mb-4 block tracking-widest">Línea Maestra de Notificaciones</label>
                    <div class="flex items-center gap-4">
                        <span class="text-2xl font-black text-emerald-800 orbitron">+57</span>
                        <input id="inWs" type="number" class="w-full bg-transparent text-4xl font-black text-white outline-none tracking-tighter" placeholder="3000000000">
                    </div>
                    <p class="text-[9px] text-slate-500 mt-8 italic leading-relaxed">Nexus-X utilizará este número para el envío automático de órdenes PDF y estados de reparación vía WhatsApp Cloud API.</p>
                </div>
            </div>
        </div>

        <div id="secPay" class="tab-content hidden px-4 space-y-10">
            <div class="bg-gradient-to-b from-[#0a0f1d] to-[#1a0505] p-12 rounded-[4rem] border border-red-500/10 shadow-3xl relative overflow-hidden">
                <h3 class="text-2xl font-black italic text-red-500 mb-10 uppercase tracking-tighter orbitron">Billing Engine <span class="text-white">Starlink</span></h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div class="bg-black/60 p-6 rounded-3xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-3 block italic">Nivel de Potencia (Plan)</label>
                        <select id="selPlan" class="w-full bg-transparent text-white font-black outline-none cursor-pointer orbitron text-xs appearance-none">
                            <option value="basico">PLAN BÁSICO NEXUS</option>
                            <option value="pro" selected>PLAN PRO STARLINK</option>
                            <option value="elite">PLAN ELITE NASA-TECH</option>
                        </select>
                    </div>
                    <div class="bg-black/60 p-6 rounded-3xl border border-white/5">
                        <label class="text-[8px] text-slate-500 font-black uppercase mb-3 block italic">Ciclo de Sincronización</label>
                        <select id="selMeses" class="w-full bg-transparent text-white font-black outline-none cursor-pointer orbitron text-xs appearance-none">
                            <option value="1">1 MES (ÓRBITA ESTÁNDAR)</option>
                            <option value="3">3 MESES (10% DESCUENTO)</option>
                            <option value="6">6 MESES (20% DESCUENTO)</option>
                            <option value="12">12 MESES (30% DESCUENTO VIP)</option>
                        </select>
                    </div>
                </div>
                <div class="bg-black/80 p-12 rounded-[3rem] border border-white/10 text-center shadow-2xl relative">
                    <p class="text-[10px] text-cyan-400 font-black uppercase tracking-[0.4em] mb-4 italic">Costo de Operación del Nodo</p>
                    <h2 id="txtTotal" class="text-6xl font-black text-white italic tracking-tighter orbitron animate-pulse">$ 0</h2>
                    <p id="txtAhorro" class="text-[10px] text-emerald-400 font-bold mt-6 uppercase tracking-widest bg-emerald-500/10 inline-block px-6 py-2 rounded-full border border-emerald-500/20"></p>
                </div>
                <button id="btnRenovar" class="w-full mt-10 bg-gradient-to-r from-red-600 to-red-900 text-white py-8 rounded-[2.5rem] font-black orbitron text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(220,38,38,0.3)] active:scale-95 transition-all">
                    Ejecutar Protocolo de Pago <i class="fas fa-bolt ml-3"></i>
                </button>
            </div>

            <div class="bg-white/5 p-12 rounded-[4rem] border border-cyan-500/10 backdrop-blur-2xl">
                <div class="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                    <div>
                        <h3 class="text-sm font-black text-cyan-400 uppercase italic orbitron">Pasarela de Recaudo (Bold Pay)</h3>
                        <p class="text-[9px] text-slate-500 uppercase font-bold mt-2">Conecte su cuenta Bold para cobrar a sus clientes</p>
                    </div>
                    <button onclick="window.open('https://bold.co')" class="text-[8px] bg-cyan-500/10 text-cyan-400 px-6 py-3 rounded-full border border-cyan-500/20 font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">Configurar Bold</button>
                </div>
                <div class="bg-black/60 p-8 rounded-3xl border border-white/5">
                    <label class="text-[8px] text-slate-600 font-black uppercase mb-3 block">Bold API Key (Producción)</label>
                    <input id="inBoldKey" type="password" class="w-full bg-transparent text-sm font-mono text-cyan-300 outline-none" placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx">
                </div>
            </div>
        </div>

        <div class="fixed bottom-12 left-0 right-0 px-8 z-[100] flex justify-center">
            <button id="btnSaveAll" class="w-full max-w-2xl bg-cyan-500 text-black py-8 rounded-[3rem] font-black orbitron text-[12px] uppercase tracking-[0.6em] shadow-[0_25px_60px_rgba(6,182,212,0.4)] hover:bg-cyan-400 active:scale-95 transition-all flex items-center justify-center gap-6">
                Sincronizar Nexus-X <i class="fas fa-satellite animate-bounce"></i>
            </button>
        </div>
    </div>

    <style>
        .orbitron { font-family: 'Orbitron', sans-serif; }
        .tab-btn { background: transparent; color: #475569; border: 1px solid transparent; }
        .tab-btn.active { background: #06b6d4; color: #000; box-shadow: 0 15px 35px rgba(6,182,212,0.4); border-color: transparent; }
        .tab-content.hidden { display: none; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        #logoDrop:hover #camOverlay { opacity: 1; color: #06b6d4; }
    </style>
    `;

    // --- LÓGICA DE ALGORITMOS DE PRECIO ---
    const selPlan = document.getElementById("selPlan");
    const selMeses = document.getElementById("selMeses");
    const txtTotal = document.getElementById("txtTotal");
    const txtAhorro = document.getElementById("txtAhorro");

    const calcularPrecios = () => {
        const plan = PLANES[selPlan.value] || PLANES.pro;
        const meses = parseInt(selMeses.value);
        let descuento = 1.0;

        if (meses === 12) { descuento = 0.70; txtAhorro.innerText = "★ BENEFICIO ANUAL: 30% OFF ★"; }
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
                document.getElementById("camOverlay").classList.add("opacity-0");
            };
            reader.readAsDataURL(file);
        }
    };

    // --- CARGA INICIAL DE DATOS ---
    const loadCore = async () => {
        try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById("inNombre").value = d.nombre || "";
                document.getElementById("inNit").value = d.nit || "";
                document.getElementById("inWs").value = d.whatsapp || "";
                document.getElementById("inBoldKey").value = d.bold_api_key || "";
                if (d.logo) {
                    logoBase64 = d.logo;
                    const img = document.getElementById("prevLogo");
                    img.src = d.logo;
                    img.classList.remove("hidden");
                    document.getElementById("camOverlay").classList.add("opacity-0");
                }
            }
            calcularPrecios();
        } catch (e) {
            console.error("Falla en carga inicial:", e);
        }
    };

    // --- GUARDADO MAESTRO (SINCRO STARLINK) ---
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
                status: "ACTIVE_CORE",
                updatedBy: uid
            };

            // Validación mínima antes de transmitir
            if (!payload.nombre) throw new Error("NOMBRE REQUERIDO");

            await setDoc(docRef, payload, { merge: true });
            
            // Actualizar contexto local para que el resto de la app se entere
            localStorage.setItem("nombreTaller", payload.nombre);
            localStorage.setItem("empresaId", empresaId);
            
            btn.innerHTML = `SINCRO EXITOSA <i class="fas fa-check"></i>`;
            btn.classList.replace("bg-cyan-500", "bg-emerald-500");
            
            // Notificación auditiva de éxito
            if (window.speechSynthesis) {
                const msg = new SpeechSynthesisUtterance("Nexus sincronizado exitosamente");
                msg.lang = 'es-ES';
                window.speechSynthesis.speak(msg);
            }

            setTimeout(() => location.reload(), 1500);
        } catch (e) {
            console.error("Falla Nexus:", e);
            btn.disabled = false;
            btn.innerHTML = `ERROR DE ENLACE: ${e.message.toUpperCase()}`;
            btn.classList.replace("bg-cyan-500", "bg-red-500");
        }
    };

    loadCore();
}
