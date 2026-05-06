/**
 * config.js - TallerPRO360 NEXUS-X V17.5 🚀
 * SOLUCIÓN AUDITADA: FIX DE PERSISTENCIA Y CARGA
 */
import { 
    doc, getDoc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function configModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let logoBase64 = null;

    const PLANES = {
        basico: { nombre: "Básico", base: 49900 },
        pro: { nombre: "PRO", base: 79900 },
        elite: { nombre: "ELITE", base: 129000 }
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="max-w-6xl mx-auto pb-48 px-6 animate-in fade-in zoom-in duration-700 bg-[#010409] min-h-screen pt-10 text-white">
            <header class="flex flex-col xl:flex-row justify-between items-start gap-10 mb-16 border-l-4 border-cyan-500 pl-8">
                <div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase">
                        NXS_<span class="text-cyan-400">CONFIG</span><span class="text-slate-800 text-xl">.V17</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.6em] mt-3 italic">Protocolo de Identidad y Despliegue Financiero</p>
                </div>
                <div class="bg-cyan-500/5 border border-cyan-500/20 px-8 py-4 rounded-2xl flex items-center gap-4">
                    <i class="fas fa-microchip text-cyan-500 animate-pulse"></i>
                    <span class="text-[10px] orbitron font-black text-cyan-400 uppercase tracking-widest italic">NODO: ${empresaId}</span>
                </div>
            </header>

            <nav class="flex gap-2 p-2 bg-[#0d1117] rounded-[2.5rem] border border-white/5 mb-16 shadow-2xl sticky top-4 z-50 backdrop-blur-xl">
                <button data-tab="secGen" class="tab-btn active flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron">Identidad</button>
                <button data-tab="secWs" class="tab-btn flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron">Canales</button>
                <button data-tab="secPay" class="tab-btn flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron text-cyan-400 italic">Bold_Link</button>
                <button data-tab="secBill" class="tab-btn flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron text-red-500">Suscripción</button>
            </nav>

            <div id="secGen" class="tab-content space-y-10">
                <div class="bg-[#0d1117] border border-white/5 p-12 rounded-[4rem] shadow-inner relative overflow-hidden group">
                    <div class="flex flex-col items-center mb-16">
                        <div id="logoDrop" class="w-56 h-56 bg-black rounded-[4rem] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-cyan-500 transition-all cursor-pointer shadow-2xl">
                            <img id="prevLogo" src="" class="hidden w-full h-full object-cover">
                            <div class="flex flex-col items-center gap-3 text-slate-700 group-hover:text-cyan-500" id="camOverlay">
                                <i class="fas fa-camera-retro text-4xl"></i>
                                <span class="text-[8px] font-black uppercase tracking-widest italic">Digital Brand</span>
                            </div>
                            <input type="file" id="inputLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Razón Social del Taller</label>
                            <input id="inNombre" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-black orbitron uppercase focus:border-cyan-500 transition-all shadow-inner" placeholder="EJ: COLOMBIAN TRUCKS LOGISTICS">
                        </div>
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Identificador Tributario (NIT/ID)</label>
                            <input id="inNit" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-mono focus:border-cyan-500 transition-all shadow-inner uppercase" placeholder="900000000-1">
                        </div>
                    </div>
                </div>
            </div>

            <div id="secWs" class="tab-content hidden">
                 <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-emerald-500/10 relative overflow-hidden shadow-3xl">
                    <div class="absolute right-10 top-10 text-emerald-500/10 text-9xl"><i class="fab fa-whatsapp"></i></div>
                    <h3 class="text-xl font-black text-emerald-400 uppercase italic orbitron mb-12 flex items-center gap-4">
                        <span class="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span> Cloud Master Line
                    </h3>
                    <div class="bg-black/60 p-14 rounded-[3.5rem] border border-white/5 shadow-2xl">
                        <div class="flex items-center gap-8">
                            <span class="text-4xl font-black text-emerald-900 orbitron">+57</span>
                            <input id="inWs" type="number" class="w-full bg-transparent text-6xl font-black text-white outline-none tracking-tighter" placeholder="3200000000">
                        </div>
                    </div>
                </div>
            </div>

            <div id="secPay" class="tab-content hidden"> </div>
            <div id="secBill" class="tab-content hidden"> </div>

            <div class="fixed bottom-12 left-0 right-0 px-8 z-[100] flex justify-center pointer-events-none">
                <button id="btnSaveAll" class="pointer-events-auto w-full max-w-2xl bg-cyan-500 text-black py-10 rounded-[4rem] font-black orbitron text-[14px] uppercase tracking-[0.8em] shadow-[0_0_60px_rgba(6,182,212,0.4)] hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-10">
                    SINCRONIZAR NODO <i class="fas fa-satellite animate-bounce"></i>
                </button>
            </div>
        </div>

        <style>
            .orbitron { font-family: 'Orbitron', sans-serif; }
            .tab-btn { background: transparent; color: #475569; border: none; cursor: pointer; }
            .tab-btn.active { background: #06b6d4 !important; color: #000 !important; box-shadow: 0 10px 30px rgba(6,182,212,0.3); }
            .tab-content.hidden { display: none; }
        </style>
        `;
    };

    const setupLogic = () => {
        const docRef = doc(db, "empresas", empresaId);

        // 1. Manejo de Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.remove('hidden');
            };
        });

        // 2. Carga de Datos (FIREBASE + LOCAL FALLBACK)
        const loadCore = async () => {
            try {
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const d = snap.data();
                    document.getElementById("inNombre").value = d.nombre || "";
                    document.getElementById("inNit").value = d.nit || "";
                    document.getElementById("inWs").value = d.whatsapp || "";
                    
                    if (d.logo) {
                        logoBase64 = d.logo;
                        const prev = document.getElementById("prevLogo");
                        prev.src = d.logo;
                        prev.classList.remove("hidden");
                        document.getElementById("camOverlay").classList.add("opacity-0");
                    }
                }
            } catch (e) { console.error("Error cargando configuración:", e); }
        };

        // 3. Subida de Logo
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

        // 4. Guardado Maestro (CORREGIDO PARA DOCUMENTO.HTML)
        document.getElementById("btnSaveAll").onclick = async () => {
            const btn = document.getElementById("btnSaveAll");
            const nombreVal = document.getElementById("inNombre").value.trim().toUpperCase();
            const nitVal = document.getElementById("inNit").value.trim();

            btn.disabled = true;
            btn.innerHTML = `TRANSMITIENDO... <i class="fas fa-sync fa-spin"></i>`;

            try {
                if (!nombreVal) throw new Error("IDENTIDAD REQUERIDA");

                const payload = {
                    nombre: nombreVal,
                    nit: nitVal,
                    whatsapp: document.getElementById("inWs").value.trim(),
                    logo: logoBase64,
                    lastUpdate: serverTimestamp(),
                    empresaId: empresaId
                };

                await setDoc(docRef, payload, { merge: true });
                
                // --- PERSISTENCIA CRÍTICA PARA DOCUMENTO.HTML ---
                localStorage.setItem("nexus_empresaNombre", payload.nombre);
                localStorage.setItem("nexus_empresaNit", payload.nit);
                localStorage.setItem("nexus_empresaWs", payload.whatsapp);
                if(logoBase64) localStorage.setItem("nexus_empresaLogo", logoBase64);

                btn.innerHTML = `SINCRO EXITOSA <i class="fas fa-check-circle"></i>`;
                btn.style.background = "#10b981";
                
                hablar("Configuración de identidad actualizada. El sistema ya reconoce su marca.");
                setTimeout(() => location.reload(), 1500);
            } catch (e) {
                btn.disabled = false;
                btn.innerHTML = `FALLO: ${e.message.toUpperCase()}`;
                btn.style.background = "#ef4444";
            }
        };

        loadCore();
    };

    renderLayout();
    setupLogic();
}
