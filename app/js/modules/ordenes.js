/**
 * ordenes.js - TallerPRO360 NEXUS-CORE V16.7 🛰️
 * PROTOCOLO DE CONTROL AEROESPACIAL: Operaciones & Logística
 */
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const uid = state?.uid || localStorage.getItem("uid");
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
        try {
            const docRef = doc(db, "empresas", empresaId, "ordenes", ordenId);
            await updateDoc(docRef, { estado: nuevaFase, ultimaActualizacion: serverTimestamp() });
            hablar(`Transición a fase ${nuevaFase.replace('_', ' ')} confirmada.`);
            // El listener onSnapshot se encarga de actualizar la UI automáticamente
        } catch (e) {
            console.error("Fallo en salto de fase:", e);
        }
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 px-4">
                <div class="relative group">
                    <div class="absolute -inset-2 bg-cyan-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        NEXUS <span class="text-cyan-400">MISSION</span><span class="text-slate-700">.OPS</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-3">
                        <span class="flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        <p class="text-[7px] text-cyan-500/70 font-black uppercase tracking-[0.5em] orbitron">Control de Flotas V16.7 · En Línea</p>
                    </div>
                </div>
                
                <button id="btnNuevaOrden" class="group relative px-12 py-6 bg-slate-900 rounded-[2rem] overflow-hidden border border-cyan-500/30 transition-all hover:border-cyan-400 shadow-2xl">
                    <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[11px] font-black text-cyan-400 tracking-widest flex items-center gap-3">
                        <i class="fas fa-plus-circle text-lg"></i> NUEVO DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-16 px-4 pb-4">
                ${['EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus shrink-0" data-fase="${fase}">
                        <span class="text-[7px] block opacity-50 mb-1">${fase === 'LISTO' ? 'FINALIZADO' : 'FASE'}</span>
                        <span class="orbitron text-[10px] font-black tracking-widest">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20"></div>

            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 px-4">
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

        // Fase inicial por defecto
        document.querySelector('[data-fase="EN_TALLER"]').click();
    };

    const abrirFormularioOrden = () => {
        const workspace = document.getElementById("workspace");
        workspace.classList.remove("hidden");
        workspace.scrollIntoView({ behavior: 'smooth' });
        itemsOrden = [];

        workspace.innerHTML = `
        <div class="bg-slate-950/80 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"></div>
            
            <div class="flex flex-col lg:flex-row justify-between items-start mb-12 gap-6">
                <div>
                    <h2 class="orbitron text-xs font-black text-cyan-400 mb-2 tracking-[0.5em] uppercase italic">MANIFIESTO DE INGRESO</h2>
                    <p class="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Protocolo de Registro Automatizado</p>
                </div>
                <div class="bg-black/40 px-8 py-4 rounded-3xl border border-white/5">
                    <p class="text-[7px] text-slate-500 uppercase orbitron mb-1">Presupuesto Estimado</p>
                    <p id="totalLive" class="text-2xl font-black text-emerald-400 orbitron">$0</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div class="field-nexus">
                    <label>Identificación de Placa</label>
                    <input id="newPlaca" placeholder="KLO-890" maxlength="7">
                </div>
                <div class="field-nexus">
                    <label>Comandante / Cliente</label>
                    <input id="newCliente" placeholder="NOMBRE DEL OPERADOR">
                </div>
                <div class="field-nexus">
                    <label>Enlace Satelital (WhatsApp)</label>
                    <div class="flex items-center gap-3">
                        <span class="text-slate-600 font-black">+57</span>
                        <input id="newTel" type="number" placeholder="3200000000">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div class="space-y-6">
                    <div class="bg-black/30 p-8 rounded-[3rem] border border-white/5 group">
                        <div class="flex justify-between items-center mb-6">
                            <label class="text-[8px] text-purple-400 font-black uppercase orbitron italic tracking-widest">Diagnóstico por Sensores (Voz)</label>
                            <button id="btnDictar" class="w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                <i class="fas fa-microphone"></i>
                            </button>
                        </div>
                        <textarea id="newDiagnostico" rows="4" class="bg-transparent border-none outline-none text-sm font-medium text-slate-300 w-full resize-none placeholder:text-slate-800" placeholder="A la espera de telemetría vocal..."></textarea>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="flex justify-between items-center px-4">
                        <h3 class="orbitron text-[9px] font-black text-slate-600 uppercase tracking-widest">Logística de Suministros</h3>
                        <button id="btnAddItem" class="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-full text-[9px] font-black uppercase orbitron transition-all">
                            + VINCULAR
                        </button>
                    </div>
                    <div id="itemsLista" class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <p class="text-center py-20 text-[8px] text-slate-700 uppercase font-black tracking-widest">Vacío: Inicie Vinculación de Repuestos</p>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6 mt-16 pt-10 border-t border-white/5">
                <button id="btnGuardarOrden" class="flex-[2] bg-gradient-to-r from-cyan-600 to-blue-700 text-white py-8 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-lg active:scale-95 transition-all orbitron">
                    DESPLEGAR MISIÓN <i class="fas fa-satellite-dish ml-3 animate-pulse"></i>
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="flex-1 bg-white/5 text-slate-500 rounded-[2.5rem] font-black text-[10px] uppercase border border-white/5 orbitron hover:bg-red-600/20 hover:text-red-400 transition-all">
                    CANCELAR
                </button>
            </div>
        </div>
        `;

        // Engine de Voz Mejorado
        const btnDictar = document.getElementById("btnDictar");
        btnDictar.onclick = () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) return;
            
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            recognition.onstart = () => {
                hablar("Nexus escuchando.");
                btnDictar.classList.add('animate-ping', 'bg-red-600');
            };
            recognition.onresult = (e) => {
                document.getElementById("newDiagnostico").value += " " + e.results[0][0].transcript.toUpperCase();
            };
            recognition.onend = () => {
                btnDictar.classList.remove('animate-ping', 'bg-red-600');
            };
            recognition.start();
        };

        // Agregar Items
        document.getElementById("btnAddItem").onclick = async () => {
            const { value: v } = await Swal.fire({
                title: 'NUEVA CARGA',
                background: '#020617',
                color: '#fff',
                html: `
                    <div class="space-y-4 p-4">
                        <input id="sw-n" class="sw-input" placeholder="DESCRIPCIÓN">
                        <div class="flex gap-4">
                            <input id="sw-p" type="number" class="sw-input" placeholder="PRECIO $">
                            <input id="sw-c" type="number" value="1" class="sw-input w-24" placeholder="CANT">
                        </div>
                    </div>`,
                showCancelButton: true,
                confirmButtonText: 'VINCULAR',
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
            area.innerHTML = `<p class="text-center py-20 text-[8px] text-slate-700 uppercase font-black tracking-widest">Vacío: Inicie Vinculación de Repuestos</p>`;
            totalLive.innerText = "$0";
            return;
        }

        const total = itemsOrden.reduce((acc, i) => acc + i.total, 0);
        totalLive.innerText = `$${total.toLocaleString()}`;

        area.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/[0.03] p-5 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all">
                <div>
                    <p class="text-[10px] font-black text-white uppercase tracking-tight">${it.nombre}</p>
                    <p class="text-[8px] text-slate-500 font-bold uppercase mt-1">${it.cantidad} UN x $${it.precio.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-6">
                    <p class="text-xs font-black text-cyan-400 orbitron">$${it.total.toLocaleString()}</p>
                    <button class="text-red-500/30 hover:text-red-500" onclick="window.removeItem(${idx})"><i class="fas fa-times-circle"></i></button>
                </div>
            </div>
        `).join("");
    };

    const guardarOrden = async () => {
        const btn = document.getElementById("btnGuardarOrden");
        const payload = {
            placa: document.getElementById("newPlaca").value.trim().toUpperCase(),
            cliente: document.getElementById("newCliente").value.trim().toUpperCase(),
            telefono: document.getElementById("newTel").value.trim(),
            diagnostico: document.getElementById("newDiagnostico").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: 'EN_TALLER',
            fechaIngreso: serverTimestamp(),
            empresaId: empresaId,
            creadoPor: uid
        };

        if (!payload.placa || !payload.cliente) return Swal.fire('Error', 'Placa y Cliente requeridos para el radar', 'error');

        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite fa-spin mr-3"></i> ENVIANDO DATOS A ÓRBITA...`;

        try {
            const docRef = await addDoc(collection(db, "empresas", empresaId, "ordenes"), payload);
            if (payload.telefono) await enviarWhatsAppOrden({ ...payload, id: docRef.id });
            
            hablar("Misión inicializada con éxito.");
            document.getElementById("workspace").classList.add("hidden");
            Swal.fire({ title: 'DESPLIEGUE EXITOSO', icon: 'success', background: '#020617', color: '#fff' });
        } catch (e) {
            btn.disabled = false;
            btn.innerText = "REINTENTAR DESPLIEGUE";
        }
    };

    /**
     * ENGINE DE ESCUCHA EN TIEMPO REAL (onSnapshot)
     */
    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe(); // Limpiar listener previo

        const grid = document.getElementById("gridOrdenes");
        const q = query(
            collection(db, "empresas", empresaId, "ordenes"), 
            where("estado", "==", fase), 
            orderBy("fechaIngreso", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-20"><i class="fas fa-radar text-4xl mb-6"></i><p class="orbitron text-[10px] tracking-widest uppercase italic">Sector Vacío en Fase ${fase}</p></div>`;
                return;
            }

            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const oJson = JSON.stringify({ ...o, id }).replace(/'/g, "&apos;");
                
                return `
                <div class="card-mission group">
                    <div class="flex justify-between items-start mb-6">
                        <div class="px-4 py-2 bg-black rounded-xl border border-white/10">
                            <p class="text-[6px] text-slate-500 orbitron">ID_TRACKING</p>
                            <p class="text-xs text-cyan-400 font-black orbitron">${o.placa}</p>
                        </div>
                        <div class="h-8 w-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <i class="fas fa-user-astronaut text-[10px] text-cyan-500"></i>
                        </div>
                    </div>

                    <h3 class="text-white text-[11px] font-black uppercase mb-2 line-clamp-1">${o.cliente}</h3>
                    <p class="text-[8px] text-slate-500 leading-relaxed h-10 overflow-hidden mb-6 uppercase italic">${o.diagnostico || 'Sin diagnóstico registrado'}</p>

                    <div class="bg-black/50 p-4 rounded-2xl border border-white/5 mb-6 flex justify-between items-center">
                        <span class="text-[7px] text-slate-500 font-black orbitron">CARGA TOTAL</span>
                        <span class="text-sm font-black text-white orbitron">$${o.total.toLocaleString()}</span>
                    </div>

                    <div class="flex gap-2 mb-4">
                        <button onclick='window.ejecutarImpresion(${oJson})' class="btn-action-nexus flex-1"><i class="fas fa-print"></i></button>
                        <button onclick='window.compartirWhatsApp(${oJson})' class="btn-action-nexus flex-1 text-emerald-500"><i class="fab fa-whatsapp"></i></button>
                    </div>

                    <select onchange="window.cambiarFase('${id}', this.value)" class="nexus-select">
                        <option value="" disabled selected>SALTO DE FASE</option>
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
