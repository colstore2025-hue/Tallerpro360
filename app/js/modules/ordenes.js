/**
 * ordenes.js - TallerPRO360 NEXUS-X V18.2 🛰️
 * PROTOCOLO DE PERSISTENCIA TOTAL & RECALCULO NEURONAL
 * @author William Jeffry Urquijo Cubillos 
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const uid = localStorage.getItem("nexus_uid");
    const mode = localStorage.getItem("nexus_mode");

    let itemsOrden = [];
    let ordenEdicionId = null;
    let unsubscribe = null;

    // --- BINDING GLOBAL REFORZADO ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
        hablar("Componente removido.");
    };

    window.ejecutarImpresion = (data) => generarPDFOrden(data);
    window.compartirWhatsApp = (data) => enviarWhatsAppOrden(data);

    // NUEVO: Motor de Persistencia (Carga datos para retomar misión)
    window.abrirEdicionMision = async (id) => {
        hablar("Retomando misión. Sincronizando datos.");
        const docSnap = await getDoc(doc(db, "ordenes", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            ordenEdicionId = id; // IMPORTANTE: Setea el ID para que updateDoc sepa qué grabar
            abrirFormularioOrden(data);
        }
    };

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-12 animate-in fade-in duration-700 pb-40 bg-[#020617]">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                <div>
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter">
                        MISSION <span class="text-cyan-400">OPS</span>
                    </h1>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black orbitron rounded-full uppercase tracking-widest">Protocolo Persistencia V18.2</span>
                    </div>
                </div>
                
                <button id="btnNuevaOrden" class="w-full lg:w-auto px-10 py-5 bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:bg-cyan-500 hover:text-black transition-all group">
                    <span class="orbitron text-xs font-black tracking-widest flex items-center justify-center gap-3">
                        <i class="fas fa-plus-circle text-lg group-hover:animate-spin"></i> NUEVA MISIÓN
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-3 mb-12">
                <button class="phase-nexus border-amber-500/30 text-amber-500 bg-amber-500/5" data-fase="COTIZACION">
                    <span class="orbitron text-[10px] font-black tracking-widest">COTIZACIONES</span>
                </button>
                ${['EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus border-cyan-500/20 text-slate-400" data-fase="${fase}">
                        <span class="orbitron text-[10px] font-black tracking-widest">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20"></div>
            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"></div>
        </div>
        `;
        
        document.getElementById("btnNuevaOrden").onclick = () => { 
            ordenEdicionId = null; 
            itemsOrden = [];
            abrirFormularioOrden(); 
        };
        
        document.querySelectorAll('.phase-nexus').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus').forEach(b => b.classList.remove('active-nexus', 'active-amber'));
                btn.classList.add(btn.dataset.fase === 'COTIZACION' ? 'active-amber' : 'active-nexus');
                escucharMisiones(btn.dataset.fase);
            };
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    };

    const abrirFormularioOrden = (dataPrev = null) => {
        const workspace = document.getElementById("workspace");
        workspace.classList.remove("hidden");
        workspace.scrollIntoView({ behavior: 'smooth' });
        itemsOrden = dataPrev ? dataPrev.items : [];

        workspace.innerHTML = `
        <div class="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 lg:p-12 rounded-[3rem] shadow-2xl animate-in zoom-in-95">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div class="lg:col-span-2 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="field-nexus-v2">
                            <label>PLACA</label>
                            <input id="newPlaca" value="${dataPrev?.placa || ''}" placeholder="ABC-123" ${ordenEdicionId ? 'readonly' : ''}>
                        </div>
                        <div class="field-nexus-v2">
                            <label>COMANDANTE</label>
                            <input id="newCliente" value="${dataPrev?.cliente || ''}" placeholder="NOMBRE CLIENTE">
                        </div>
                        <div class="field-nexus-v2">
                            <label>TELÉFONO</label>
                            <input id="newTel" type="number" value="${dataPrev?.telefono || ''}" placeholder="300...">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-black/40 p-6 rounded-3xl border border-cyan-500/10">
                            <div class="flex justify-between items-center mb-3">
                                <span class="orbitron text-[9px] text-cyan-400 font-black">REPORTE TÉCNICO (VOZ)</span>
                                <button onclick="window.nexusDictar('newDiagnostico')" class="text-cyan-500 animate-pulse"><i class="fas fa-microphone-alt"></i></button>
                            </div>
                            <textarea id="newDiagnostico" rows="4" class="w-full bg-transparent text-white font-medium outline-none resize-none">${dataPrev?.diagnostico || ''}</textarea>
                        </div>
                        <div class="bg-black/40 p-6 rounded-3xl border border-amber-500/20">
                            <div class="flex justify-between items-center mb-3">
                                <span class="orbitron text-[9px] text-amber-500 font-black">ARTÍCULOS RECIBIDOS / NOTAS</span>
                                <button onclick="window.nexusDictar('newInventario')" class="text-amber-500"><i class="fas fa-keyboard"></i></button>
                            </div>
                            <textarea id="newInventario" rows="4" class="w-full bg-transparent text-slate-400 text-xs italic outline-none resize-none" placeholder="Escribe o dicta lo que se deja en el vehículo...">${dataPrev?.inventario || ''}</textarea>
                        </div>
                    </div>
                </div>

                <div class="bg-black/60 p-6 rounded-[2.5rem] border border-white/5 flex flex-col">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="orbitron text-[10px] font-black text-white tracking-tighter">FINANZAS DE MISIÓN</h3>
                        <div class="text-right">
                            <p class="text-[8px] text-slate-500 orbitron">TOTAL ESTIMADO</p>
                            <p id="totalLive" class="text-2xl font-black text-cyan-400 orbitron">$0</p>
                        </div>
                    </div>

                    <div id="itemsLista" class="space-y-3 h-[280px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                        </div>

                    <div class="grid grid-cols-1 gap-2">
                        <button id="btnAddItem" class="w-full py-4 bg-cyan-600/10 border border-cyan-600/30 rounded-xl orbitron text-[9px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all">
                            + VINCULAR REPUESTO / CARGO
                        </button>
                        <button id="btnRecalcular" class="w-full py-4 bg-orange-600 text-white rounded-xl orbitron text-[9px] font-black shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:scale-105 transition-all">
                            RECALCULAR ÓRBITA <i class="fas fa-sync-alt ml-2"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4 mt-10 pt-8 border-t border-white/5">
                <button id="btnGuardarOrden" class="flex-[2] py-6 bg-cyan-500 text-black rounded-2xl orbitron font-black text-xs tracking-[0.3em] hover:brightness-125 shadow-xl">
                    <i class="fas fa-rocket mr-3"></i> ${ordenEdicionId ? 'ACTUALIZAR Y GUARDAR' : 'DESPLEGAR E INGRESAR'}
                </button>
                <button id="btnGuardarCotizacion" class="flex-1 py-6 bg-amber-600 text-white rounded-2xl orbitron font-black text-xs hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/20">
                    <i class="fas fa-file-invoice-dollar mr-3"></i> GRABAR COTIZACIÓN
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-8 py-6 bg-white/5 text-slate-500 rounded-2xl orbitron font-black text-[9px] hover:text-red-500">ABORTAR</button>
            </div>
        </div>
        `;

        actualizarTablaItems();
        document.getElementById("btnAddItem").onclick = modalAñadirItem;
        document.getElementById("btnRecalcular").onclick = () => { actualizarTablaItems(); hablar("Finanzas recalculadas."); };
        document.getElementById("btnGuardarOrden").onclick = () => guardarMision(dataPrev?.estado || 'EN_TALLER');
        document.getElementById("btnGuardarCotizacion").onclick = () => guardarMision('COTIZACION');
    };

    const actualizarTablaItems = () => {
        const area = document.getElementById("itemsLista");
        const total = itemsOrden.reduce((acc, i) => acc + i.total, 0);
        document.getElementById("totalLive").innerText = `$${total.toLocaleString()}`;
        
        area.innerHTML = itemsOrden.length === 0 ? 
            `<div class="h-full flex flex-col items-center justify-center opacity-20"><i class="fas fa-box-open text-2xl mb-2"></i><p class="orbitron text-[8px] font-black uppercase">Carga Vacía</p></div>` :
            itemsOrden.map((it, idx) => `
            <div class="bg-slate-800/80 p-4 rounded-2xl border border-white/10 flex justify-between items-center group animate-in slide-in-from-right-5">
                <div>
                    <p class="text-[11px] font-black text-white uppercase tracking-tight">${it.nombre}</p>
                    <p class="text-[9px] text-cyan-400 font-bold">$${it.precio.toLocaleString()} x ${it.cantidad}</p>
                </div>
                <div class="flex items-center gap-3">
                    <p class="text-[11px] font-black text-white orbitron">$${it.total.toLocaleString()}</p>
                    <button onclick="window.removeItem(${idx})" class="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                        <i class="fas fa-times text-[10px]"></i>
                    </button>
                </div>
            </div>`).join("");
    };

    const modalAñadirItem = async () => {
        const { value: v } = await Swal.fire({
            title: 'AGREGAR COMPONENTE', background: '#020617', color: '#fff',
            html: `
                <input id="sw-n" class="sw-input-nexus" placeholder="DESCRIPCIÓN (Ej: Aceite 10W40)">
                <div class="flex gap-2 mt-2">
                    <input id="sw-p" type="number" class="sw-input-nexus" placeholder="PRECIO UNITARIO $">
                    <input id="sw-c" type="number" value="1" class="sw-input-nexus w-24" placeholder="CANT.">
                </div>
            `,
            showCancelButton: true, confirmButtonText: 'VINCULAR',
            customClass: { confirmButton: 'bg-cyan-500 text-black orbitron px-8 py-3 rounded-xl' }
        });
        if (v) {
            const n = document.getElementById('sw-n').value.toUpperCase();
            const p = Number(document.getElementById('sw-p').value);
            const c = Number(document.getElementById('sw-c').value);
            if(n && p) { itemsOrden.push({ nombre: n, precio: p, cantidad: c, total: p * c }); actualizarTablaItems(); }
        }
    };

    const guardarMision = async (estadoDestino) => {
        const payload = {
            placa: document.getElementById("newPlaca").value.trim().toUpperCase(),
            cliente: document.getElementById("newCliente").value.trim().toUpperCase(),
            telefono: document.getElementById("newTel").value.trim(),
            diagnostico: document.getElementById("newDiagnostico").value.trim(),
            inventario: document.getElementById("newInventario").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: estadoDestino,
            empresaId,
            ultimaActualizacion: serverTimestamp()
        };

        if (!payload.placa || !payload.cliente) return Swal.fire('ERROR DE VUELO', 'Placa y Comandante son requeridos.', 'error');

        try {
            if (ordenEdicionId) {
                // SI EXISTE ID, SOBREESCRIBE (PERSISTENCIA TOTAL)
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
                saveLog("UPDATE_MISSION", { id: ordenEdicionId, fase: estadoDestino });
            } else {
                // SI NO EXISTE, CREA NUEVO
                payload.creadoPor = uid; payload.creadoEn = serverTimestamp();
                const newId = await createDocument("ordenes", payload);
                ordenEdicionId = newId;
            }
            
            hablar(estadoDestino === 'COTIZACION' ? "Cotización guardada en memoria." : "Misión actualizada con éxito.");
            document.getElementById("workspace").classList.add("hidden");
            Swal.fire({ title: 'LOGRADO', text: 'Datos grabados correctamente', icon: 'success', background: '#020617', color: '#fff' });
            
        } catch (e) { 
            console.error(e); 
            Swal.fire('FALLO CRÍTICO', 'Error al grabar en la nube Nexus.', 'error');
        }
    };

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-10"><i class="fas fa-satellite-dish text-6xl mb-6"></i><p class="orbitron text-[10px] tracking-[0.6em]">SECTOR DESPEJADO</p></div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const oJson = JSON.stringify({ ...o, id }).replace(/'/g, "&apos;");
                const esCot = o.estado === 'COTIZACION';
                
                return `
                <div class="bg-slate-900/60 p-6 rounded-[2.5rem] border ${esCot ? 'border-amber-500/40' : 'border-white/10'} hover:border-cyan-500 transition-all flex flex-col group h-full relative overflow-hidden shadow-2xl">
                    <div class="flex justify-between items-start mb-6 z-10">
                        <div class="bg-black/80 px-4 py-2 rounded-xl border border-cyan-500/30">
                            <p class="text-[12px] text-cyan-400 font-black orbitron">${o.placa}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.abrirEdicionMision('${id}')" class="w-10 h-10 rounded-full bg-cyan-500 text-black hover:scale-110 transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)]"><i class="fas fa-edit text-[12px]"></i></button>
                        </div>
                    </div>
                    
                    <h3 class="text-white text-[13px] font-black uppercase mb-1 truncate z-10">${o.cliente}</h3>
                    <p class="text-[10px] text-slate-400 mb-6 italic line-clamp-2 z-10">${o.diagnostico || 'Pendiente diagnóstico técnico...'}</p>
                    
                    <div class="mt-auto space-y-4 z-10">
                        <div class="bg-black/60 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                            <span class="text-[8px] text-slate-500 font-black orbitron">LIQUIDACIÓN</span>
                            <span class="text-lg font-black text-white orbitron">$${Number(o.total).toLocaleString()}</span>
                        </div>
                        <select onchange="window.cambiarFase('${id}', this.value)" class="w-full ${esCot ? 'bg-amber-600' : 'bg-slate-800 border border-white/10'} text-white p-4 rounded-xl orbitron text-[9px] font-black uppercase outline-none cursor-pointer">
                            <option value="" disabled selected>STATUS: ${o.estado}</option>
                            ${esCot ? '<option value="EN_TALLER">🚀 AUTORIZAR E INGRESAR</option>' : ''}
                            <option value="DIAGNOSTICO">🧠 Diagnóstico</option>
                            <option value="REPARACION">🔧 Reparación</option>
                            <option value="LISTO">✅ Finalizado</option>
                        </select>
                    </div>
                </div>`;
            }).join("");
        });
    }

    renderBase();
}

/** MOTOR DE VOZ **/
window.nexusDictar = (id) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onstart = () => hablar("Nexus escuchando.");
    recognition.onresult = (e) => { 
        const txt = e.results[0][0].transcript.toUpperCase();
        document.getElementById(id).value += " " + txt; 
    };
    recognition.start();
};
