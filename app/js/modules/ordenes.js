/**
 * ordenes.js - TallerPRO360 NEXUS-X V18.0 🛰️
 * PROTOCOLO DE CONTROL DE MISIONES: Evolución Total & Recepción Inteligente
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

    // --- BINDING GLOBAL STARLINK ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    window.ejecutarImpresion = (data) => generarPDFOrden(data);
    window.compartirWhatsApp = (data) => enviarWhatsAppOrden(data);

    window.capturarYEnviar = (data, tipo) => {
        const msg = tipo === 'INICIO' ? `📸 INGRESO NEXUS-X - Placa: ${data.placa}` : `📸 FINALIZACIÓN - Placa: ${data.placa}`;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
            if (e.target.files[0]) {
                hablar("Evidencia lista. Abriendo enlace satelital.");
                window.open(`https://wa.me/57${data.telefono}?text=${encodeURIComponent(msg + ". Adjunto evidencia visual.")}`, '_blank');
            }
        };
        input.click();
    };

    window.abrirEdicionMision = async (id) => {
        hablar("Accediendo a núcleo de misión.");
        const docSnap = await getDoc(doc(db, "ordenes", id));
        if (docSnap.exists()) {
            ordenEdicionId = id;
            abrirFormularioOrden(docSnap.data());
        }
    };

    window.cambiarFase = async (ordenId, nuevaFase) => {
        try {
            const docRef = doc(db, "ordenes", ordenId);
            await updateDoc(docRef, { estado: nuevaFase, ultimaActualizacion: serverTimestamp() });
            hablar(`Fase ${nuevaFase.replace('_', ' ')} activa.`);
        } catch (e) { console.error(e); }
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
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p class="text-[10px] text-cyan-400/60 font-black orbitron tracking-[0.3em]">STARLINK V18.0 ACTIVE</p>
                    </div>
                </div>
                
                <button id="btnNuevaOrden" class="w-full lg:w-auto px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl shadow-[0_0_30px_rgba(8,145,178,0.3)] hover:scale-105 transition-all">
                    <span class="orbitron text-xs font-black text-white tracking-widest flex items-center justify-center gap-3">
                        <i class="fas fa-plus-circle text-lg"></i> NUEVO DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-3 mb-12">
                <button class="phase-nexus border-amber-500/30 text-amber-500 bg-amber-500/5 active-amber" data-fase="COTIZACION">
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
        
        document.getElementById("btnNuevaOrden").onclick = () => { ordenEdicionId = null; abrirFormularioOrden(); };
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
        <div class="bg-slate-900 border border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div class="lg:col-span-2 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-black/50 p-6 rounded-3xl border border-cyan-500/20">
                            <label class="orbitron text-[9px] text-cyan-400 font-black mb-2 block uppercase tracking-widest">Placa Ref.</label>
                            <input id="newPlaca" class="w-full bg-transparent text-2xl font-black text-white orbitron uppercase outline-none" placeholder="ABC-123" value="${dataPrev?.placa || ''}" ${ordenEdicionId ? 'readonly' : ''}>
                        </div>
                        <div class="bg-black/50 p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 font-black mb-2 block uppercase">Comandante</label>
                            <input id="newCliente" class="w-full bg-transparent text-lg font-bold text-white outline-none" placeholder="Nombre" value="${dataPrev?.cliente || ''}">
                        </div>
                        <div class="bg-black/50 p-6 rounded-3xl border border-white/5">
                            <label class="orbitron text-[9px] text-slate-500 font-black mb-2 block uppercase tracking-widest">Enlace Móvil</label>
                            <input id="newTel" type="number" class="w-full bg-transparent text-lg font-bold text-white outline-none" placeholder="3000..." value="${dataPrev?.telefono || ''}">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-black/30 p-8 rounded-[2.5rem] border border-white/5">
                            <div class="flex justify-between items-center mb-4">
                                <span class="orbitron text-[10px] text-cyan-400 font-black uppercase">Diagnóstico Técnico</span>
                                <button onclick="window.nexusDictar('newDiagnostico')" class="text-cyan-500 hover:scale-110 transition-transform"><i class="fas fa-microphone-alt"></i></button>
                            </div>
                            <textarea id="newDiagnostico" rows="4" class="w-full bg-transparent text-slate-300 font-medium outline-none resize-none">${dataPrev?.diagnostico || ''}</textarea>
                        </div>
                        <div class="bg-black/30 p-8 rounded-[2.5rem] border border-orange-500/20">
                            <div class="flex justify-between items-center mb-4">
                                <span class="orbitron text-[10px] text-orange-400 font-black uppercase tracking-tighter">Inventario de Recepción</span>
                                <button onclick="window.nexusDictar('newInventario')" class="text-orange-500"><i class="fas fa-list-ul"></i></button>
                            </div>
                            <textarea id="newInventario" rows="4" class="w-full bg-transparent text-slate-400 text-sm italic outline-none resize-none" placeholder="Ej: Gato hidráulico, Radio, Herramientas...">${dataPrev?.inventario || ''}</textarea>
                        </div>
                    </div>
                </div>

                <div class="bg-black/40 p-8 rounded-[3rem] border border-cyan-500/10">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="orbitron text-[10px] font-black text-white">CARGA FINANCIERA</h3>
                        <p id="totalLive" class="text-2xl font-black text-cyan-400 orbitron">$0</p>
                    </div>
                    <div id="itemsLista" class="space-y-3 h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6"></div>
                    <button id="btnAddItem" class="w-full py-4 bg-white/5 border border-white/10 rounded-2xl orbitron text-[10px] font-black text-white hover:bg-white/10 transition-all">+ AGREGAR CONCEPTO</button>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-4">
                <button id="btnGuardarOrden" class="flex-[2] py-6 bg-cyan-500 text-black rounded-2xl orbitron font-black text-xs tracking-[0.3em] hover:bg-cyan-400 shadow-lg">
                    ${ordenEdicionId ? 'ACTUALIZAR MISIÓN' : 'CONFIRMAR INGRESO'}
                </button>
                <button id="btnGuardarCotizacion" class="flex-1 py-6 bg-amber-600/20 text-amber-500 border border-amber-600/30 rounded-2xl orbitron font-black text-xs hover:bg-amber-600 hover:text-white transition-all">
                    SÓLO COTIZACIÓN
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-8 py-6 bg-red-500/10 text-red-500 rounded-2xl orbitron font-black text-[10px]">CANCELAR</button>
            </div>
        </div>
        `;

        actualizarTablaItems();
        document.getElementById("btnAddItem").onclick = modalAñadirItem;
        document.getElementById("btnGuardarOrden").onclick = () => guardarMision('EN_TALLER');
        document.getElementById("btnGuardarCotizacion").onclick = () => guardarMision('COTIZACION');
    };

    const actualizarTablaItems = () => {
        const area = document.getElementById("itemsLista");
        const total = itemsOrden.reduce((acc, i) => acc + i.total, 0);
        document.getElementById("totalLive").innerText = `$${total.toLocaleString()}`;
        
        area.innerHTML = itemsOrden.length === 0 ? 
            `<div class="h-full flex items-center justify-center opacity-20"><p class="orbitron text-[8px] font-black">SIN ITEMS</p></div>` :
            itemsOrden.map((it, idx) => `
            <div class="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div>
                    <p class="text-[10px] font-bold text-white uppercase">${it.nombre}</p>
                    <p class="text-[8px] text-slate-500">${it.cantidad} x $${it.precio.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-3">
                    <p class="text-[11px] font-black text-cyan-400 orbitron">$${it.total.toLocaleString()}</p>
                    <button onclick="window.removeItem(${idx})" class="text-red-500/30 hover:text-red-500"><i class="fas fa-times"></i></button>
                </div>
            </div>`).join("");
    };

    const modalAñadirItem = async () => {
        const { value: v } = await Swal.fire({
            title: 'AÑADIR CARGO', background: '#0f172a', color: '#fff',
            html: `<input id="sw-n" class="sw-input-nexus" placeholder="DESCRIPCIÓN"><div class="flex gap-2 mt-2"><input id="sw-p" type="number" class="sw-input-nexus" placeholder="PRECIO $"><input id="sw-c" type="number" value="1" class="sw-input-nexus w-20"></div>`,
            showCancelButton: true, confirmButtonText: 'AÑADIR'
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

        if (!payload.placa || !payload.cliente) return Swal.fire('Error', 'Placa y Cliente obligatorios.', 'error');

        try {
            if (ordenEdicionId) {
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
            } else {
                payload.creadoPor = uid; payload.creadoEn = serverTimestamp();
                await createDocument("ordenes", payload);
            }
            hablar(estadoDestino === 'COTIZACION' ? "Cotización enviada." : "Misión desplegada.");
            document.getElementById("workspace").classList.add("hidden");
        } catch (e) { console.error(e); }
    };

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-32 text-center opacity-10"><i class="fas fa-satellite text-4xl mb-4"></i><p class="orbitron text-[9px] tracking-[0.5em]">ESPACIO VACÍO</p></div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const oJson = JSON.stringify({ ...o, id }).replace(/'/g, "&apos;");
                const esCot = o.estado === 'COTIZACION';
                
                return `
                <div class="bg-slate-900/60 p-6 rounded-[2.5rem] border ${esCot ? 'border-amber-500/20' : 'border-white/5'} hover:border-cyan-500/50 transition-all flex flex-col group h-full">
                    <div class="flex justify-between items-start mb-6">
                        <div class="bg-black px-4 py-2 rounded-xl border border-cyan-400/30">
                            <p class="text-[12px] text-white font-black orbitron">${o.placa}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick='window.capturarYEnviar(${oJson}, "INICIO")' class="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 transition-all hover:bg-emerald-500 hover:text-black"><i class="fas fa-camera text-[12px]"></i></button>
                            <button onclick="window.abrirEdicionMision('${id}')" class="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black transition-all"><i class="fas fa-pencil-alt text-[12px]"></i></button>
                        </div>
                    </div>
                    
                    <h3 class="text-white text-[13px] font-black uppercase mb-1 truncate">${o.cliente}</h3>
                    <p class="text-[9px] text-slate-500 mb-6 italic line-clamp-2">${o.diagnostico || 'Sin diagnóstico'}</p>
                    
                    <div class="mt-auto space-y-4">
                        <div class="bg-black/50 p-4 rounded-2xl flex justify-between items-center border border-white/[0.02]">
                            <span class="text-[8px] text-slate-500 font-black orbitron">LIQUIDACIÓN</span>
                            <span class="text-lg font-black text-white orbitron tracking-tighter">$${Number(o.total).toLocaleString()}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick='window.ejecutarImpresion(${oJson})' class="py-4 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-all"><i class="fas fa-file-pdf"></i></button>
                            <button onclick='window.compartirWhatsApp(${oJson})' class="py-4 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 text-emerald-500 transition-all"><i class="fab fa-whatsapp"></i></button>
                        </div>
                        <select onchange="window.cambiarFase('${id}', this.value)" class="w-full ${esCot ? 'bg-amber-500' : 'bg-cyan-500'} text-black p-4 rounded-xl orbitron text-[9px] font-black uppercase outline-none shadow-lg">
                            <option value="" disabled selected>Fase: ${o.estado}</option>
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

/** 🧠 MOTOR DE VOZ NEXUS **/
window.nexusDictar = (id) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onstart = () => hablar("Nexus escuchando.");
    recognition.onresult = (e) => { document.getElementById(id).value += " " + e.results[0][0].transcript.toUpperCase(); };
    recognition.start();
};
