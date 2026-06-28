/**
 * config.js - TallerPRO360 NEXUS-X V17.5 🚀
 * PROTOCOLO: QUANTUM-SAP / AUDITORÍA FORENSE Y CAPA CONTABLE SAP-FI
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    doc, getDoc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function configModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId") || "taller_003";
    let logoBase64 = null;

    const PLANES = {
        basico: { nombre: "PLAN BÁSICO NEXUS", base: 49900, color: "#94a3b8" },
        pro: { nombre: "PLAN PRO STARLINK", base: 79900, color: "#06b6d4" },
        elite: { nombre: "PLAN ELITE NASA-TECH", base: 129000, color: "#ef4444" }
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="max-w-6xl mx-auto pb-48 px-6 animate-in fade-in zoom-in duration-700 bg-[#010409] min-h-screen pt-10 text-white">
            
            <header class="flex flex-col xl:flex-row justify-between items-start gap-10 mb-16 border-l-4 border-cyan-500 pl-8">
                <div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase">
                        NXS_<span class="text-cyan-400">CONFIG</span><span class="text-slate-800 text-xl">.V17.5</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.6em] mt-3 italic">Protocolo de Identidad Estructurada SAP-FI y Despliegue Financiero</p>
                </div>
                <div class="bg-cyan-500/5 border border-cyan-500/20 px-8 py-4 rounded-2xl flex items-center gap-4">
                    <i class="fas fa-microchip text-cyan-500 animate-pulse"></i>
                    <span class="text-[10px] orbitron font-black text-cyan-400 uppercase tracking-widest italic">NODO TALLER: ${empresaId}</span>
                </div>
            </header>

            <nav class="flex gap-2 p-2 bg-[#0d1117] rounded-[2.5rem] border border-white/5 mb-16 shadow-2xl sticky top-4 z-50 backdrop-blur-xl">
                <button data-tab="secGen" class="tab-btn active flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron">Identidad SAP-FI</button>
                <button data-tab="secLegal" class="tab-btn flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase transition-all orbitron text-amber-400">Condiciones OTs</button>
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
                                <span class="text-[8px] font-black uppercase tracking-widest italic">Digital Brand Logo</span>
                            </div>
                            <input type="file" id="inputLogo" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Razón Social del Taller</label>
                            <input id="inNombre" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-black orbitron uppercase focus:border-cyan-500 transition-all shadow-inner" placeholder="EJ: COLOMBIAN TRUCKS LOGISTICS LLC">
                        </div>
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Identificador Tributario (NIT)</label>
                            <input id="inNit" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-mono focus:border-cyan-500 transition-all shadow-inner uppercase" placeholder="EJ: 901345678-1">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Régimen Contributivo (Capa Fiscal)</label>
                            <select id="selRegimen" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-bold uppercase focus:border-cyan-500 transition-all shadow-inner cursor-pointer">
                                <option value="RESPONSABLE_IVA">Responsable de IVA (Régimen Común)</option>
                                <option value="NO_RESPONSABLE_IVA">No Responsable de IVA (Régimen Simplificado)</option>
                                <option value="REGIMEN_SIMPLE">Régimen Simple de Tributación (RST)</option>
                            </select>
                        </div>
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Ciudad / Ubicación Geográfica</label>
                            <input id="inCiudad" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-bold uppercase focus:border-cyan-500 transition-all shadow-inner" placeholder="EJ: CHARLOTTE, NC / BOGOTÁ D.C.">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-10 mt-10">
                        <div class="space-y-4">
                            <label class="text-[9px] text-cyan-500 font-black uppercase tracking-widest ml-4 italic">Dirección / Centro Logístico de Operaciones Principal</label>
                            <input id="inDireccion" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-bold uppercase focus:border-cyan-500 transition-all shadow-inner" placeholder="EJ: CALLE 24 # 4-53 - INDUSTRIAL PARK">
                        </div>
                    </div>
                </div>
            </div>

            <div id="secLegal" class="tab-content hidden space-y-10">
                <div class="bg-[#0d1117] border border-white/5 p-12 rounded-[4rem] shadow-inner relative overflow-hidden group">
                    <h3 class="text-xl font-black text-amber-400 uppercase italic orbitron mb-6">Cláusulas Legales y Garantías de la Misión</h3>
                    <p class="text-xs text-slate-400 mb-8 italic">Este texto aparecerá de forma automatizada en el pie de página de sus cotizaciones y órdenes impresas.</p>
                    
                    <div class="space-y-4">
                        <label class="text-[9px] text-amber-500 font-black uppercase tracking-widest ml-4 italic">Texto de Exoneración y Garantía Comercial</label>
                        <textarea id="txLegal" rows="6" class="w-full bg-black/40 p-8 rounded-[2.5rem] border border-white/5 outline-none text-white font-medium text-xs focus:border-amber-500 transition-all shadow-inner uppercase" placeholder="EJ: TODO DIAGNÓSTICO TIENE VALIDEZ DE 30 DÍAS..."></textarea>
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

            <div id="secPay" class="tab-content hidden space-y-10">
                <div class="bg-gradient-to-br from-[#0d1117] to-[#0a0a0f] p-14 rounded-[4rem] border border-cyan-500/10 shadow-3xl">
                    <div class="flex flex-col xl:flex-row gap-16">
                        <div class="flex-1 space-y-8">
                            <div class="flex items-center gap-6 mb-4">
                                <div class="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg">
                                    <img src="https://bold.co/wp-content/uploads/2021/04/Logo-Bold-Principal-Color.png" class="w-10">
                                </div>
                                <h3 class="orbitron text-xl font-black italic text-white uppercase tracking-tighter">Neural <span class="text-cyan-400">Bold_Link</span></h3>
                            </div>
                            <div class="space-y-6 bg-cyan-500/5 p-8 rounded-[2.5rem] border border-cyan-500/10">
                                <p class="text-[10px] text-cyan-400 font-black uppercase tracking-widest italic">Manual de Activación Táctica:</p>
                                <ul class="space-y-3 text-[11px] text-slate-400 font-bold italic">
                                    <li>01. Inicie sesión en la plataforma bold.co</li>
                                    <li>02. Copie la API Key de Producción</li>
                                    <li>03. Péguela en el nodo derecho de control</li>
                                </ul>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="bg-black/60 p-12 rounded-[3.5rem] border border-white/5 h-full flex flex-col justify-center">
                                <label class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-8 block italic">Cerebro de Pago (API KEY)</label>
                                <div class="relative">
                                    <input id="inBoldKey" type="password" class="w-full bg-[#0d1117] p-8 rounded-[2rem] border border-white/10 text-cyan-400 font-mono text-xs outline-none focus:border-cyan-500 shadow-inner" placeholder="pk_live_xxxxxxxx">
                                    <button type="button" id="toggleBold" class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600"><i class="fas fa-eye"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="secBill" class="tab-content hidden space-y-12">
                <div class="bg-gradient-to-b from-[#0d1117] to-[#1a0505] p-16 rounded-[4.5rem] border border-red-500/10 shadow-3xl text-center">
                    <h3 class="orbitron text-2xl font-black italic text-red-500 mb-16 uppercase tracking-tighter">Billing <span class="text-white">Starlink</span></h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
                        <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5 shadow-inner">
                            <label class="text-[9px] text-slate-500 font-black uppercase mb-6 block tracking-widest">Nivel de Potencia</label>
                            <select id="selPlan" class="w-full bg-transparent text-white font-black outline-none orbitron text-xs uppercase cursor-pointer">
                                <option value="basico">PLAN BÁSICO NEXUS</option>
                                <option value="pro" selected>PLAN PRO STARLINK</option>
                                <option value="elite">PLAN ELITE NASA-TECH</option>
                            </select>
                        </div>
                        <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5 shadow-inner">
                            <label class="text-[9px] text-slate-500 font-black uppercase mb-6 block tracking-widest">Ciclo de Órbita</label>
                            <select id="selMeses" class="w-full bg-transparent text-white font-black outline-none orbitron text-xs uppercase cursor-pointer">
                                <option value="1">1 MES (ÓRBITA ESTÁNDAR)</option>
                                <option value="12">12 MESES (30% DESCUENTO VIP)</option>
                            </select>
                        </div>
                    </div>
                    <div class="relative py-12">
                        <h2 id="txtTotal" class="orbitron text-7xl font-black text-white italic tracking-tighter">$ 0</h2>
                        <div id="txtAhorro" class="mt-8 inline-block px-10 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 orbitron text-[10px] font-black rounded-full uppercase tracking-widest"></div>
                    </div>
                </div>
            </div>

            <div class="fixed bottom-12 left-0 right-0 px-8 z-[100] flex justify-center pointer-events-none">
                <button id="btnSaveAll" class="pointer-events-auto w-full max-w-2xl bg-cyan-500 text-black py-10 rounded-[4rem] font-black orbitron text-[14px] uppercase tracking-[0.8em] shadow-[0_0_60px_rgba(6,182,212,0.4)] hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-10">
                    SINCRONIZAR NODO NXS <i class="fas fa-satellite animate-bounce"></i>
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

        setupLogic();
    };

    const setupLogic = () => {
        const docRef = doc(db, "empresas", empresaId);

        // Lógica Reactiva de Pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.remove('hidden');
            };
        });

        // Visibilidad de Credenciales Bold_Link
        const toggleBtn = document.getElementById("toggleBold");
        if(toggleBtn) {
            toggleBtn.onclick = () => {
                const input = document.getElementById("inBoldKey");
                const icon = toggleBtn.querySelector("i");
                if(input.type === "password") {
                    input.type = "text";
                    icon.className = "fas fa-eye-slash";
                } else {
                    input.type = "password";
                    icon.className = "fas fa-eye";
                }
            };
        }

        // Motor Algorítmico de Tasación Starlink
        const calcular = () => {
            const plan = PLANES[document.getElementById("selPlan").value] || PLANES.pro;
            const meses = parseInt(document.getElementById("selMeses").value);
            const total = Math.round((plan.base * meses) * (meses === 12 ? 0.7 : 1));
            document.getElementById("txtTotal").innerText = `$ ${total.toLocaleString()}`;
            document.getElementById("txtAhorro").innerText = meses === 12 ? "★ BENEFICIO ANUAL ACTIVADO ★" : "TARIFA MENSUAL";
        };
        document.getElementById("selPlan").onchange = calcular;
        document.getElementById("selMeses").onchange = calcular;

        // Inyección de Logo en Formato Base64 Puro
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

        // Carga Inicial Estructurada NXS_CONFIG
        const loadCore = async () => {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById("inNombre").value = d.nombre || "";
                document.getElementById("inNit").value = d.nit || "";
                document.getElementById("selRegimen").value = d.regimen_fiscal || "RESPONSABLE_IVA";
                document.getElementById("inCiudad").value = d.ciudad || "";
                document.getElementById("inDireccion").value = d.direccion || d.ubicacion || "";
                document.getElementById("txLegal").value = d.condiciones_legales || "";
                document.getElementById("inWs").value = d.whatsapp || "";
                document.getElementById("inBoldKey").value = d.bold_api_key || "";
                if(d.planNexus) document.getElementById("selPlan").value = d.planNexus;
                
                if (d.logo) {
                    logoBase64 = d.logo;
                    document.getElementById("prevLogo").src = d.logo;
                    document.getElementById("prevLogo").classList.remove("hidden");
                    document.getElementById("camOverlay").classList.add("opacity-0");
                }
            }
            calcular();
        };

        // Persistencia y Sincronización Unificada MÁSTER
        document.getElementById("btnSaveAll").onclick = async () => {
            const btn = document.getElementById("btnSaveAll");
            btn.innerHTML = `SINCRONIZANDO NODO... <i class="fas fa-sync fa-spin"></i>`;
            
            const payload = {
                nombre: document.getElementById("inNombre").value.toUpperCase(),
                nit: document.getElementById("inNit").value,
                regimen_fiscal: document.getElementById("selRegimen").value,
                ciudad: document.getElementById("inCiudad").value.toUpperCase(),
                direccion: document.getElementById("inDireccion").value.toUpperCase(),
                condiciones_legales: document.getElementById("txLegal").value.toUpperCase(),
                whatsapp: document.getElementById("inWs").value,
                bold_api_key: document.getElementById("inBoldKey").value,
                planNexus: document.getElementById("selPlan").value,
                logo: logoBase64,
                lastUpdate: serverTimestamp()
            };

            // Escritura en Base de Datos de la Compañía
            await setDoc(docRef, payload, { merge: true });
            
            // 🔒 Almacenamiento Local para Alimentación Inmediata de sub-vistas (ej: documento.html)
            localStorage.setItem("nexus_empresaId", empresaId);
            localStorage.setItem("nexus_empresaNombre", payload.nombre);
            localStorage.setItem("nexus_empresaLogo", payload.logo || "");
            localStorage.setItem("nexus_empresaNit", payload.nit || "");
            localStorage.setItem("nexus_empresaDireccion", payload.direccion || "");
            localStorage.setItem("nexus_empresaCiudad", payload.ciudad || "");
            localStorage.setItem("nexus_empresaRegimen", payload.regimen_fiscal);
            localStorage.setItem("nexus_empresaLegal", payload.condiciones_legales);
            localStorage.setItem("nexus_empresaWs", payload.whatsapp || "");

            btn.innerHTML = `SINCRO EXITOSA <i class="fas fa-check"></i>`;
            hablar("Nivel de órbita y parámetros de identidad fiscal actualizados de forma exitosa.");
            setTimeout(() => location.reload(), 1200);
        };

        loadCore();
    };

    renderLayout();
}
