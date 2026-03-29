/**
 * ordenes.js - TallerPRO360 NEXUS-X V21.0 🛰️ 🚀
 * EL ESTÁNDAR DE ORO: Fusión de Control de Misiones & Edición Total
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const uid = localStorage.getItem("nexus_uid");
    const mode = localStorage.getItem("nexus_mode") || "LIVE";

    let itemsOrden = [];
    let ordenEdicionId = null;
    let unsubscribe = null;

    // --- MOTOR DE INTERFAZ ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 animate-in fade-in duration-1000 pb-40 bg-[#020617] min-h-screen text-slate-100">
            
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 border-b border-cyan-500/10 pb-10">
                <div class="relative group">
                    <h1 class="orbitron text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
                        NEXUS<span class="text-cyan-400">OPS</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-black orbitron rounded-full animate-pulse">
                            ${mode === "SIMULATOR" ? 'HOLOGRAPHIC MODE' : 'SAT-LINK ACTIVE'}
                        </span>
                        <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron">Control de Flota v21.0</p>
                    </div>
                </div>
                
                <button id="btnNuevaOrden" class="relative group overflow-hidden px-12 py-6 bg-cyan-600 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-xs font-black text-black tracking-widest flex items-center gap-3 italic">
                        <i class="fas fa-plus-circle text-xl"></i> INICIAR DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-12 pb-2">
                ${['EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus-v21 shrink-0 px-8 py-5 rounded-2xl border-2 border-white/5 bg-white/5 transition-all" data-fase="${fase}">
                        <span class="block text-[7px] text-cyan-500/50 font-black orbitron mb-1 tracking-widest">SECTOR</span>
                        <span class="orbitron text-[11px] font-black tracking-widest text-slate-400">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20 animate-in slide-in-from-top-5 duration-700"></div>

            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>
        `;

        document.getElementById("btnNuevaOrden").onclick = () => lanzarConsolaMision();
        vincularFases();
    };

    const lanzarConsolaMision = (data = null) => {
        ordenEdicionId = data?.id || null;
        itemsOrden = data?.items || [];
        const ws = document.getElementById("workspace");
        ws.classList.remove("hidden");
        ws.innerHTML = `
        <div class="bg-slate-900/80 backdrop-blur-3xl border-2 border-cyan-500/30 rounded-[3rem] p-8 lg:p-14 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8">
                <i class="fas fa-satellite text-cyan-500/20 text-8xl rotate-12"></i>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                <div class="lg:col-span-7 space-y-10">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="h-1 w-20 bg-cyan-500"></div>
                        <h2 class="orbitron text-sm font-black text-cyan-400 tracking-[0.4em]">DATOS DE MISIÓN</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="field-nexus-v21">
                            <label class="orbitron text-[10px] text-slate-500 font-bold mb-3 block">IDENTIFICADOR (PLACA)</label>
                            <input id="f-placa" value="${data?.placa || ''}" class="w-full bg-black/60 border border-white/10 p-6 rounded-2xl text-2xl font-black text-white orbitron uppercase focus:border-cyan-500 outline-none transition-all" placeholder="X-000">
                        </div>
                        <div class="field-nexus-v21">
                            <label class="orbitron text-[10px] text-slate-500 font-bold mb-3 block">WHATSAPP LINK</label>
                            <input id="f-tel" type="number" value="${data?.telefono || ''}" class="w-full bg-black/60 border border-white/10 p-6 rounded-2xl text-2xl font-black text-white outline-none focus:border-cyan-500 transition-all" placeholder="320...">
                        </div>
                    </div>

                    <div class="field-nexus-v21">
                        <label class="orbitron text-[10px] text-slate-500 font-bold mb-3 block">COMANDANTE (CLIENTE)</label>
                        <input id="f-cliente" value="${data?.cliente || ''}" class="w-full bg-black/60 border border-white/10 p-6 rounded-2xl text-xl font-bold text-white uppercase outline-none focus:border-cyan-500 transition-all" placeholder="NOMBRE COMPLETO">
                    </div>

                    <div class="bg-black/40 p-8 rounded-[2rem] border border-white/5 relative">
                        <div class="flex justify-between items-center mb-6">
                            <span class="orbitron text-[10px] text-cyan-500 font-black tracking-widest italic">DIAGNÓSTICO SENSORIAL</span>
                            <button id="btnVoice" class="w-14 h-14 bg-cyan-500/10 border border-cyan-500/40 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-lg shadow-cyan-500/10">
                                <i class="fas fa-microphone-alt"></i>
                            </button>
                        </div>
                        <textarea id="f-diag" rows="4" class="w-full bg-transparent outline-none text-slate-300 font-medium text-lg resize-none placeholder:text-slate-800" placeholder="A la espera de reporte de campo...">${data?.diagnostico || ''}</textarea>
                    </div>
                </div>

                <div class="lg:col-span-5 bg-black/60 border-2 border-white/5 p-10 rounded-[3rem] flex flex-col shadow-inner">
                    <div class="text-center mb-10">
                        <p class="orbitron text-[9px] text-slate-500 font-black mb-2 tracking-widest">CARGA FINANCIERA</p>
                        <h3 id="txtTotal" class="orbitron text-5xl font-black text-white tracking-tighter">$ 0</h3>
                    </div>
                    
                    <div id="listaItems" class="flex-grow space-y-4 overflow-y-auto max-h-[380px] mb-8 custom-scrollbar pr-2">
                        </div>

                    <button id="btnAddItem" class="w-full py-6 bg-white/5 border border-dashed border-white/20 hover:border-cyan-500 hover:bg-cyan-500/5 text-white rounded-2xl orbitron text-[10px] font-black transition-all group">
                        <i class="fas fa-plus-circle mr-2 group-hover:rotate-90 transition-transform"></i> VINCULAR SUMINISTRO
                    </button>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6 mt-16 pt-10 border-t border-white/10">
                <button id="btnGuardarMision" class="flex-[2] py-8 bg-cyan-500 hover:bg-cyan-400 text-black rounded-3xl orbitron font-black text-sm tracking-[0.5em] transition-all shadow-2xl hover:shadow-cyan-500/20 active:scale-95 uppercase">
                    ${ordenEdicionId ? 'Sincronizar Cambios' : 'Desplegar Misión'} <i class="fas fa-satellite-dish ml-4"></i>
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="flex-1 py-8 text-slate-500 orbitron text-[10px] font-black hover:text-red-500 transition-colors uppercase tracking-widest">
                    Abortar Operación
                </button>
            </div>
        </div>
        `;

        ws.scrollIntoView({ behavior: 'smooth' });
        actualizarCargaItems();

        // Bindings de Acción
        document.getElementById("btnGuardarMision").onclick = () => procesarMision(data?.estado || 'EN_TALLER');
        document.getElementById("btnAddItem").onclick = () => modalAgregarItem();
        
        // Voz Inteligente
        document.getElementById("btnVoice").onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return;
            const rec = new SpeechRecognition();
            rec.lang = 'es-CO';
            rec.onstart = () => { hablar("Nexus escuchando diagnóstico"); document.getElementById("btnVoice").classList.add("animate-ping"); };
            rec.onresult = (e) => { document.getElementById("f-diag").value += " " + e.results[0][0].transcript.toUpperCase(); };
            rec.onend = () => { document.getElementById("btnVoice").classList.remove("animate-ping"); };
            rec.start();
        };
    };

    const modalAgregarItem = async () => {
        const { value: v } = await Swal.fire({
            title: 'NUEVO SUMINISTRO',
            background: '#020617',
            color: '#fff',
            html: `
                <div class="p-4 space-y-4">
                    <input id="sw-n" class="sw-input-nexus" placeholder="DESCRIPCIÓN DEL REPUESTO">
                    <div class="grid grid-cols-2 gap-4">
                        <input id="sw-p" type="number" class="sw-input-nexus" placeholder="PRECIO $">
                        <input id="sw-c" type="number" value="1" class="sw-input-nexus" placeholder="CANT">
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'AÑADIR A CARGA',
            customClass: { confirmButton: 'btn-confirm-nexus', cancelButton: 'btn-cancel-nexus' }
        });
        if (v) {
            const n = document.getElementById('sw-n').value.toUpperCase();
            const p = Number(document.getElementById('sw-p').value);
            const c = Number(document.getElementById('sw-c').value);
            if(n && p) {
                itemsOrden.push({ nombre: n, precio: p, cantidad: c, total: p * c });
                actualizarCargaItems();
            }
        }
    };

    const actualizarCargaItems = () => {
        const cont = document.getElementById("listaItems");
        const totalTxt = document.getElementById("txtTotal");
        let subtotal = 0;

        cont.innerHTML = itemsOrden.length === 0 ? 
            `<div class="py-20 text-center opacity-20"><i class="fas fa-box-open text-4xl mb-4"></i><p class="orbitron text-[8px] tracking-[0.5em]">CARGA VACÍA</p></div>` :
            itemsOrden.map((it, idx) => {
                subtotal += it.total;
                return `
                <div class="flex justify-between items-center bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all group">
                    <div>
                        <p class="text-[11px] font-black text-white mb-1 uppercase">${it.nombre}</p>
                        <p class="text-[9px] text-cyan-400 font-bold tracking-widest">${it.cantidad} UN x $${it.precio.toLocaleString()}</p>
                    </div>
                    <div class="flex items-center gap-5">
                        <span class="text-sm font-black text-white orbitron">$${it.total.toLocaleString()}</span>
                        <button onclick="window.delItemNexus(${idx})" class="text-red-500/20 group-hover:text-red-500 transition-all"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>`;
            }).join("");

        totalTxt.innerText = `$ ${subtotal.toLocaleString()}`;
        window.delItemNexus = (i) => { itemsOrden.splice(i, 1); actualizarCargaItems(); };
    };

    const procesarMision = async (fase) => {
        const payload = {
            placa: document.getElementById("f-placa").value.trim().toUpperCase(),
            cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
            telefono: document.getElementById("f-tel").value.trim(),
            diagnostico: document.getElementById("f-diag").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: fase,
            empresaId,
            ultimaActualizacion: serverTimestamp()
        };

        if (!payload.placa || !payload.cliente) return Swal.fire('RADAR INCOMPLETO', 'Placa y Cliente requeridos.', 'warning');

        try {
            if (ordenEdicionId) {
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
                hablar("Telemetría actualizada.");
            } else {
                payload.creadoEn = serverTimestamp();
                payload.creadoPor = uid;
                const docRef = await addDoc(collection(db, "ordenes"), payload);
                if(payload.telefono) enviarWhatsAppOrden({...payload, id: docRef.id});
                hablar("Nueva misión en órbita.");
            }
            document.getElementById("workspace").classList.add("hidden");
            Swal.fire({ title: 'DESPLIEGUE EXITOSO', icon: 'success', background: '#020617', color: '#fff' });
        } catch (e) {
            Swal.fire('ERROR CRÍTICO', 'Fallo en el enlace con la base de datos.', 'error');
        }
    };

    function vincularFases() {
        document.querySelectorAll('.phase-nexus-v21').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus-v21').forEach(b => {
                    b.classList.remove('active-nexus', 'border-cyan-500/50', 'bg-cyan-500/5', 'text-white');
                    b.classList.add('border-white/5', 'bg-white/5', 'text-slate-400');
                });
                btn.classList.add('active-nexus', 'border-cyan-500/50', 'bg-cyan-500/5', 'text-white');
                escucharMisiones(btn.dataset.fase);
            };
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    }

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-10"><i class="fas fa-satellite-dish text-7xl mb-6"></i><p class="orbitron text-xs tracking-[0.8em]">SECTOR VACÍO</p></div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                return `
                <div class="bg-slate-900/40 border-2 border-white/5 p-8 rounded-[2.5rem] hover:border-cyan-500/40 transition-all group relative overflow-hidden backdrop-blur-sm">
                    <div class="flex justify-between items-start mb-8">
                        <div class="bg-black px-5 py-3 rounded-2xl border border-cyan-500/20">
                            <span class="orbitron text-[8px] text-slate-500 block mb-1">PLACA_REF</span>
                            <span class="orbitron text-lg font-black text-cyan-400">${o.placa}</span>
                        </div>
                        <button onclick="window.editarNexusMision('${id}')" class="w-12 h-12 bg-white/5 rounded-2xl text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>

                    <h4 class="text-white font-black uppercase text-md mb-3 truncate tracking-tight">${o.cliente}</h4>
                    <p class="text-[10px] text-slate-500 italic mb-8 line-clamp-2 h-10 uppercase tracking-wider">${o.diagnostico || 'SIN REPORTE TÉCNICO'}</p>
                    
                    <div class="bg-black/40 p-5 rounded-2xl flex justify-between items-center mb-8 border border-white/5 shadow-inner">
                        <span class="orbitron text-[8px] text-cyan-400/60 font-black">CARGA TOTAL</span>
                        <span class="orbitron text-xl font-black text-white">$${Number(o.total).toLocaleString()}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-6">
                        <button onclick='window.printNexus("${id}")' class="py-4 bg-white/5 rounded-2xl hover:bg-white/10 text-white orbitron text-[9px] font-black uppercase transition-all">Reporte PDF</button>
                        <button onclick='window.waNexus("${id}")' class="py-4 bg-emerald-500/10 rounded-2xl text-emerald-500 hover:bg-emerald-500/20 orbitron text-[9px] font-black uppercase transition-all">WhatsApp</button>
                    </div>

                    <select onchange="window.saltarFaseNexus('${id}', this.value)" class="w-full bg-cyan-600 text-black p-4 rounded-xl orbitron text-[10px] font-black uppercase cursor-pointer hover:bg-cyan-400 transition-all border-none outline-none">
                        <option value="" disabled selected>TRANSPORTE A FASE...</option>
                        <option value="EN_TALLER">📡 RECEPCIÓN</option>
                        <option value="DIAGNOSTICO">🧠 DIAGNÓSTICO</option>
                        <option value="REPARACION">🔧 REPARACIÓN</option>
                        <option value="LISTO">✅ FINALIZADO</option>
                    </select>
                </div>`;
            }).join("");
        });

        // HANDLERS GLOBALES DE TARJETAS
        window.editarNexusMision = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            if (snap.exists()) lanzarConsolaMision({ ...snap.data(), id });
        };

        window.saltarFaseNexus = async (id, nuevaFase) => {
            try {
                await updateDoc(doc(db, "ordenes", id), { estado: nuevaFase, ultimaActualizacion: serverTimestamp() });
                hablar(`Iniciando fase de ${nuevaFase.replace('_', ' ')}`);
            } catch (e) { console.error(e); }
        };
    }

    renderBase();
}
