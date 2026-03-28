/**
 * ordenes.js - TallerPRO360 NEXUS-X V17.0 🛰️
 * PROTOCOLO DE CONTROL DE MISIONES: Operaciones Raíz & Logística SaaS
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const uid = localStorage.getItem("nexus_uid");
    const plan = localStorage.getItem("nexus_plan");
    const mode = localStorage.getItem("nexus_mode"); // SIMULATOR o LIVE

    let itemsOrden = [];
    let unsubscribe = null;

    // --- BINDING GLOBAL PARA EL ENGINE ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    window.ejecutarImpresion = (data) => generarPDFOrden(data);
    window.compartirWhatsApp = (data) => enviarWhatsAppOrden(data);
    
    window.cambiarFase = async (ordenId, nuevaFase) => {
        if (mode === "SIMULATOR") {
            hablar("Acción restringida en modo simulador. Mejora tu plan.");
            return;
        }
        try {
            // Cambio a referencia de colección RAÍZ
            const docRef = doc(db, "ordenes", ordenId);
            await updateDoc(docRef, { 
                estado: nuevaFase, 
                ultimaActualizacion: serverTimestamp() 
            });
            hablar(`Fase ${nuevaFase.replace('_', ' ')} confirmada.`);
            saveLog("TRANSICION_FASE", { ordenId, nuevaFase });
        } catch (e) {
            console.error("Fallo en salto de fase:", e);
        }
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
                <div class="relative group">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        MISSION <span class="text-cyan-400 text-6xl">OPS</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black orbitron rounded-full">
                            ${mode === "SIMULATOR" ? 'MODO HOLOGRÁFICO' : 'SATÉLITE ACTIVO'}
                        </span>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron">LOGÍSTICA DE FLOTA V17.0</p>
                    </div>
                </div>
                
                <button id="btnNuevaOrden" class="group relative px-14 py-7 bg-slate-900 rounded-[2.5rem] border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-2xl overflow-hidden">
                    <div class="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[12px] font-black text-cyan-400 tracking-widest flex items-center gap-4">
                        <i class="fas fa-plus-circle text-xl"></i> INICIAR DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-16 pb-4">
                ${['EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus shrink-0" data-fase="${fase}">
                        <span class="text-[7px] block opacity-40 mb-1 font-black orbitron">${fase === 'LISTO' ? 'FINALIZADO' : 'SECTOR'}</span>
                        <span class="orbitron text-[11px] font-black tracking-[0.2em]">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20"></div>

            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                </div>
        </div>
        `;
        
        document.getElementById("btnNuevaOrden").onclick = abrirFormularioOrden;
        
        document.querySelectorAll('.phase-nexus').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus').forEach(b => b.classList.remove('active-nexus'));
                btn.classList.add('active-nexus');
                escucharMisiones(btn.dataset.fase);
            };
        });

        // Inicio en Fase de Recepción
        document.querySelector('[data-fase="EN_TALLER"]').click();
    };

    const abrirFormularioOrden = () => {
        const workspace = document.getElementById("workspace");
        workspace.classList.remove("hidden");
        workspace.scrollIntoView({ behavior: 'smooth' });
        itemsOrden = [];

        workspace.innerHTML = `
        <div class="bg-slate-950/90 backdrop-blur-3xl p-10 lg:p-16 rounded-[4rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
            <div class="flex flex-col lg:flex-row justify-between items-start mb-16 gap-8">
                <div>
                    <h2 class="orbitron text-sm font-black text-cyan-400 mb-3 tracking-[0.6em] uppercase italic">DATOS DE TELEMETRÍA</h2>
                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Apertura de Ticket de Servicio v17</p>
                </div>
                <div class="bg-cyan-500/5 px-10 py-6 rounded-[2rem] border border-cyan-500/20 text-right">
                    <p class="text-[8px] text-cyan-500/60 uppercase orbitron mb-2 font-black">Estimación de Carga</p>
                    <p id="totalLive" class="text-4xl font-black text-white orbitron tabular-nums">$0</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                <div class="field-nexus">
                    <label class="orbitron text-[9px] uppercase tracking-widest text-slate-500 mb-3 block">Identificador de Placa</label>
                    <input id="newPlaca" class="w-full bg-black/40 border border-white/5 p-6 rounded-2xl text-white orbitron font-black text-xl" placeholder="ABC-123" maxlength="7">
                </div>
                <div class="field-nexus">
                    <label class="orbitron text-[9px] uppercase tracking-widest text-slate-500 mb-3 block">Comandante de Misión</label>
                    <input id="newCliente" class="w-full bg-black/40 border border-white/5 p-6 rounded-2xl text-white font-bold" placeholder="NOMBRE COMPLETO">
                </div>
                <div class="field-nexus">
                    <label class="orbitron text-[9px] uppercase tracking-widest text-slate-500 mb-3 block">Enlace Satelital</label>
                    <div class="flex items-center gap-4 bg-black/40 border border-white/5 p-6 rounded-2xl">
                        <span class="text-slate-500 font-black">+57</span>
                        <input id="newTel" type="number" class="bg-transparent border-none outline-none text-white w-full" placeholder="3200000000">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div class="space-y-8">
                    <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5">
                        <div class="flex justify-between items-center mb-8">
                            <label class="text-[9px] text-cyan-400 font-black uppercase orbitron tracking-[0.3em]">Diagnóstico de Campo</label>
                            <button id="btnDictar" class="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black transition-all">
                                <i class="fas fa-microphone-alt"></i>
                            </button>
                        </div>
                        <textarea id="newDiagnostico" rows="5" class="bg-transparent border-none outline-none text-md font-medium text-slate-300 w-full resize-none placeholder:text-slate-800" placeholder="A la espera de reporte vocal..."></textarea>
                    </div>
                </div>

                <div class="space-y-8">
                    <div class="flex justify-between items-center px-4">
                        <h3 class="orbitron text-[10px] font-black text-slate-500 uppercase tracking-widest">Suministros & Repuestos</h3>
                        <button id="btnAddItem" class="bg-white/10 hover:bg-cyan-500 text-white hover:text-black px-8 py-3 rounded-full text-[10px] font-black uppercase orbitron transition-all border border-white/5">
                            + VINCULAR
                        </button>
                    </div>
                    <div id="itemsLista" class="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                        <p class="text-center py-24 text-[9px] text-slate-700 uppercase font-black tracking-[0.5em]">Escaneo de carga vacío</p>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-8 mt-20 pt-12 border-t border-white/10">
                <button id="btnGuardarOrden" class="flex-[2] bg-cyan-500 text-black py-9 rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.5em] shadow-2xl hover:bg-cyan-400 active:scale-95 transition-all orbitron">
                    DESPLEGAR MISIÓN <i class="fas fa-satellite-dish ml-4"></i>
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="flex-1 bg-white/5 text-slate-500 rounded-[2.5rem] font-black text-[11px] uppercase border border-white/5 orbitron hover:bg-red-900/20 hover:text-red-500 transition-all">
                    CANCELAR
                </button>
            </div>
        </div>
        `;

        // Engine de Voz
        const btnDictar = document.getElementById("btnDictar");
        btnDictar.onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return;
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            recognition.onstart = () => { hablar("Nexus escuchando."); btnDictar.classList.add('animate-pulse', 'bg-red-500/20', 'text-red-500'); };
            recognition.onresult = (e) => { document.getElementById("newDiagnostico").value += " " + e.results[0][0].transcript.toUpperCase(); };
            recognition.onend = () => { btnDictar.classList.remove('animate-pulse', 'bg-red-500/20', 'text-red-500'); };
            recognition.start();
        };

        // Modal de Items
        document.getElementById("btnAddItem").onclick = async () => {
            const { value: v } = await Swal.fire({
                title: 'VINCULAR COMPONENTE',
                background: '#020617',
                color: '#fff',
                html: `
                    <div class="space-y-4 p-4">
                        <input id="sw-n" class="sw-input" placeholder="DESCRIPCIÓN REPUUESTO">
                        <div class="flex gap-4">
                            <input id="sw-p" type="number" class="sw-input" placeholder="PRECIO $">
                            <input id="sw-c" type="number" value="1" class="sw-input w-24" placeholder="CANT">
                        </div>
                    </div>`,
                showCancelButton: true,
                confirmButtonText: 'AÑADIR',
                customClass: { confirmButton: 'btn-confirm-nexus' }
            });

            if (v) {
                const nombre = document.getElementById('sw-n').value.toUpperCase();
                const precio = Number(document.getElementById('sw-p').value);
                const cantidad = Number(document.getElementById('sw-c').value);
                if(nombre && precio) {
                    itemsOrden.push({ nombre, precio, cantidad, total: precio * cantidad });
                    actualizarTablaItems();
                }
            }
        };

        document.getElementById("btnGuardarOrden").onclick = guardarOrden;
    };

    const actualizarTablaItems = () => {
        const area = document.getElementById("itemsLista");
        const totalLive = document.getElementById("totalLive");
        
        if (itemsOrden.length === 0) {
            area.innerHTML = `<p class="text-center py-24 text-[9px] text-slate-700 uppercase font-black tracking-[0.5em]">Escaneo de carga vacío</p>`;
            totalLive.innerText = "$0";
            return;
        }

        const total = itemsOrden.reduce((acc, i) => acc + i.total, 0);
        totalLive.innerText = `$${total.toLocaleString()}`;

        area.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                <div>
                    <p class="text-[11px] font-black text-white uppercase tracking-wider">${it.nombre}</p>
                    <p class="text-[9px] text-slate-500 font-bold mt-1">${it.cantidad} UN x $${it.precio.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-6">
                    <p class="text-sm font-black text-cyan-400 orbitron">$${it.total.toLocaleString()}</p>
                    <button class="text-red-500/20 hover:text-red-500 transition-colors" onclick="window.removeItem(${idx})"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join("");
    };

    const guardarOrden = async () => {
        if (mode === "SIMULATOR") {
            Swal.fire('MODO DEMO', 'Debes activar tu plan PRO para guardar misiones reales.', 'info');
            return;
        }

        const btn = document.getElementById("btnGuardarOrden");
        const payload = {
            placa: document.getElementById("newPlaca").value.trim().toUpperCase(),
            cliente: document.getElementById("newCliente").value.trim().toUpperCase(),
            telefono: document.getElementById("newTel").value.trim(),
            diagnostico: document.getElementById("newDiagnostico").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: 'EN_TALLER',
            empresaId: empresaId, // Vínculo SaaS
            creadoPor: uid
        };

        if (!payload.placa || !payload.cliente) return Swal.fire('Error', 'Radar incompleto: Placa y Cliente obligatorios.', 'error');

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite fa-spin mr-3"></i> ENVIANDO TELEMETRÍA...`;

        try {
            // Usamos createDocument de dataService para normalizar la inyección en RAIZ
            const docId = await createDocument("ordenes", payload);
            
            if (payload.telefono) await enviarWhatsAppOrden({ ...payload, id: docId });
            
            hablar("Misión confirmada en órbita.");
            document.getElementById("workspace").classList.add("hidden");
            Swal.fire({ title: 'DESPLIEGUE EXITOSO', icon: 'success', background: '#020617', color: '#fff' });
        } catch (e) {
            btn.disabled = false;
            btn.innerText = "REINTENTAR DESPLIEGUE";
        }
    };

    /**
     * ESCUCHA EN TIEMPO REAL DESDE LA RAÍZ
     */
    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();

        const grid = document.getElementById("gridOrdenes");
        
        // Query adaptada a la nueva arquitectura plana de colecciones
        const q = query(
            collection(db, "ordenes"), 
            where("empresaId", "==", empresaId),
            where("estado", "==", fase)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `
                    <div class="col-span-full py-48 text-center opacity-10">
                        <i class="fas fa-satellite-dish text-6xl mb-8"></i>
                        <p class="orbitron text-[12px] tracking-[0.5em] uppercase italic">Sector Vacío: No se detectan misiones activas</p>
                    </div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const oJson = JSON.stringify({ ...o, id }).replace(/'/g, "&apos;");
                
                return `
                <div class="bg-slate-900/30 p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                    <div class="flex justify-between items-start mb-8">
                        <div class="bg-black px-5 py-3 rounded-2xl border border-white/10">
                            <p class="text-[7px] text-slate-500 orbitron uppercase mb-1">PLACA_REF</p>
                            <p class="text-sm text-cyan-400 font-black orbitron">${o.placa}</p>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <i class="fas fa-bolt text-[10px] text-cyan-500"></i>
                        </div>
                    </div>

                    <h3 class="text-white text-md font-black uppercase mb-3 truncate tracking-tight">${o.cliente}</h3>
                    <p class="text-[9px] text-slate-500 leading-relaxed h-12 overflow-hidden mb-8 uppercase italic">${o.diagnostico || 'Pendiente de reporte técnico'}</p>

                    <div class="bg-black/40 p-5 rounded-2xl border border-white/5 mb-8 flex justify-between items-center">
                        <span class="text-[8px] text-slate-500 font-black orbitron uppercase">Total Misión</span>
                        <span class="text-lg font-black text-white orbitron tabular-nums">$${Number(o.total).toLocaleString()}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <button onclick='window.ejecutarImpresion(${oJson})' class="py-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white"><i class="fas fa-print"></i></button>
                        <button onclick='window.compartirWhatsApp(${oJson})' class="py-4 bg-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 transition-all text-emerald-500"><i class="fab fa-whatsapp"></i></button>
                    </div>

                    <select onchange="window.cambiarFase('${id}', this.value)" class="w-full bg-cyan-500 text-black p-4 rounded-2xl orbitron text-[9px] font-black uppercase cursor-pointer hover:bg-cyan-400 transition-all">
                        <option value="" disabled selected>CAMBIAR STATUS</option>
                        <option value="EN_TALLER">📡 Recepción</option>
                        <option value="DIAGNOSTICO">🧠 Diagnóstico</option>
                        <option value="REPARACION">🔧 Reparación</option>
                        <option value="LISTO">✅ Finalizar</option>
                    </select>
                </div>`;
            }).join("");
        });
    }

    renderBase();
}
