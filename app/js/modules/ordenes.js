/**
 * ordenes.js - TallerPRO360 NEXUS-X V17.2 🛰️
 * PROTOCOLO DE CONTROL DE MISIONES: Órdenes Evolutivas & Telemetría Fotográfica
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
    let ordenEdicionId = null; // Track de si estamos editando o creando
    let unsubscribe = null;

    // --- BINDING GLOBAL REFORZADO ---
    window.removeItem = (idx) => {
        itemsOrden.splice(idx, 1);
        actualizarTablaItems();
    };

    window.ejecutarImpresion = (data) => generarPDFOrden(data);
    window.compartirWhatsApp = (data) => enviarWhatsAppOrden(data);

    // NUEVO: Telemetría Fotográfica Directa (No guarda en Storage, abre cámara para enviar)
    window.capturarYEnviar = (data, tipo) => {
        const msg = tipo === 'INICIO' ? `📸 Telemetría de INGRESO - Placa: ${data.placa}` : `📸 Evidencia de FINALIZACIÓN - Placa: ${data.placa}`;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                hablar("Preparando envío de evidencia satelital.");
                // Simulación de envío de archivo vía WhatsApp (abre chat con texto y recordatorio de adjuntar)
                const url = `https://wa.me/57${data.telefono}?text=${encodeURIComponent(msg + ". Por favor adjunte la foto capturada.")}`;
                window.open(url, '_blank');
            }
        };
        input.click();
    };
    
    window.cambiarFase = async (ordenId, nuevaFase) => {
        if (mode === "SIMULATOR") return hablar("Acción restringida.");
        try {
            const docRef = doc(db, "ordenes", ordenId);
            await updateDoc(docRef, { estado: nuevaFase, ultimaActualizacion: serverTimestamp() });
            hablar(`Misión actualizada a fase ${nuevaFase.replace('_', ' ')}`);
        } catch (e) { console.error(e); }
    };

    // NUEVO: Motor de Edición Evolutiva
    window.abrirEdicionMision = async (id) => {
        hablar("Recuperando datos de misión para actualización.");
        const docSnap = await getDoc(doc(db, "ordenes", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
            ordenEdicionId = id;
            abrirFormularioOrden(data);
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
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-black orbitron rounded-full">SISTEMA EVOLUTIVO V17.2</span>
                    </div>
                </div>
                <button id="btnNuevaOrden" class="group relative px-14 py-7 bg-slate-900 rounded-[2.5rem] border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-2xl overflow-hidden">
                    <span class="relative orbitron text-[12px] font-black text-cyan-400 tracking-widest flex items-center gap-4">
                        <i class="fas fa-plus-circle text-xl"></i> NUEVO DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-16 pb-4">
                <button class="phase-nexus shrink-0 border-amber-500/20" data-fase="COTIZACION">
                    <span class="orbitron text-[11px] font-black">COTIZACIONES</span>
                </button>
                ${['EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus shrink-0" data-fase="${fase}">
                        <span class="orbitron text-[11px] font-black">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20"></div>
            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>
        `;
        document.getElementById("btnNuevaOrden").onclick = () => { ordenEdicionId = null; abrirFormularioOrden(); };
        document.querySelectorAll('.phase-nexus').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus').forEach(b => b.classList.remove('active-nexus'));
                btn.classList.add('active-nexus');
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
        <div class="bg-slate-950/90 backdrop-blur-3xl p-10 lg:p-16 rounded-[4rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
            <div class="flex flex-col lg:flex-row justify-between items-start mb-16 gap-8">
                <div>
                    <h2 class="orbitron text-sm font-black text-cyan-400 mb-3 tracking-[0.6em] uppercase italic">
                        ${ordenEdicionId ? 'ACTUALIZACIÓN DE MISIÓN' : 'TELEMETRÍA DE INGRESO'}
                    </h2>
                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Protocolo Nexus-X Evolution</p>
                </div>
                <div class="bg-cyan-500/5 px-10 py-6 rounded-[2rem] border border-cyan-500/20 text-right">
                    <p class="text-[8px] text-cyan-500/60 uppercase orbitron mb-2 font-black">Carga Financiera Actual</p>
                    <p id="totalLive" class="text-4xl font-black text-white orbitron">$0</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                <input id="newPlaca" class="input-nexus-field" placeholder="PLACA" value="${dataPrev?.placa || ''}" ${ordenEdicionId ? 'readonly' : ''}>
                <input id="newCliente" class="input-nexus-field" placeholder="COMANDANTE" value="${dataPrev?.cliente || ''}">
                <input id="newTel" type="number" class="input-nexus-field" placeholder="TELÉFONO" value="${dataPrev?.telefono || ''}">
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div class="bg-black/40 p-10 rounded-[3rem] border border-white/5">
                    <div class="flex justify-between items-center mb-6">
                        <label class="orbitron text-[9px] text-cyan-400 font-black uppercase">REPORTE TÉCNICO</label>
                        <button id="btnDictar" class="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"><i class="fas fa-microphone"></i></button>
                    </div>
                    <textarea id="newDiagnostico" rows="6" class="bg-transparent border-none outline-none text-slate-300 w-full resize-none font-medium">${dataPrev?.diagnostico || ''}</textarea>
                </div>

                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <h3 class="orbitron text-[10px] font-black text-slate-500 uppercase">SUMINISTROS & CARGOS</h3>
                        <button id="btnAddItem" class="bg-cyan-500 text-black px-6 py-2 rounded-full text-[9px] font-black orbitron">+ AÑADIR</button>
                    </div>
                    <div id="itemsLista" class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"></div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6 mt-16 pt-10 border-t border-white/10">
                <button id="btnGuardarOrden" class="btn-nexus-main bg-cyan-500 text-black flex-[2]">
                    ${ordenEdicionId ? 'ACTUALIZAR MISIÓN' : 'DESPLEGAR MISIÓN'} <i class="fas fa-sync ml-3"></i>
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="btn-nexus-main bg-white/5 text-slate-500 flex-1">CANCELAR</button>
            </div>
        </div>
        `;

        actualizarTablaItems();
        
        // Voz y Eventos
        document.getElementById("btnDictar").onclick = () => iniciarReconocimientoVoz("newDiagnostico");
        document.getElementById("btnAddItem").onclick = () => modalAñadirItem();
        document.getElementById("btnGuardarOrden").onclick = () => guardarMision(dataPrev?.estado || 'EN_TALLER');
    };

    const modalAñadirItem = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'NUEVO CARGO / REPUESTO',
            background: '#020617', color: '#fff',
            html: `
                <input id="sw-n" class="swal2-input !bg-black/50 !border-white/10 !text-white" placeholder="Descripción">
                <input id="sw-p" type="number" class="swal2-input !bg-black/50 !border-white/10 !text-white" placeholder="Precio $">
                <input id="sw-c" type="number" value="1" class="swal2-input !bg-black/50 !border-white/10 !text-white" placeholder="Cant.">
            `,
            focusConfirm: false,
            preConfirm: () => {
                return {
                    nombre: document.getElementById('sw-n').value.toUpperCase(),
                    precio: Number(document.getElementById('sw-p').value),
                    cantidad: Number(document.getElementById('sw-c').value)
                }
            }
        });
        if (formValues && formValues.nombre && formValues.precio) {
            itemsOrden.push({ ...formValues, total: formValues.precio * formValues.cantidad });
            actualizarTablaItems();
        }
    };

    const actualizarTablaItems = () => {
        const area = document.getElementById("itemsLista");
        const totalLive = document.getElementById("totalLive");
        const total = itemsOrden.reduce((acc, i) => acc + i.total, 0);
        totalLive.innerText = `$${total.toLocaleString()}`;
        
        if (itemsOrden.length === 0) {
            area.innerHTML = `<p class="text-center py-10 text-[9px] text-slate-700 font-black orbitron">CARGA VACÍA</p>`;
            return;
        }

        area.innerHTML = itemsOrden.map((it, idx) => `
            <div class="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl border border-white/5 group">
                <div>
                    <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                    <p class="text-[8px] text-slate-500">${it.cantidad} x $${it.precio.toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-4">
                    <p class="text-xs font-black text-cyan-400 orbitron">$${it.total.toLocaleString()}</p>
                    <button onclick="window.removeItem(${idx})" class="text-red-500 opacity-20 group-hover:opacity-100 transition-opacity"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `).join("");
    };

    const guardarMision = async (estadoDestino) => {
        if (mode === "SIMULATOR") return;
        const payload = {
            placa: document.getElementById("newPlaca").value.trim().toUpperCase(),
            cliente: document.getElementById("newCliente").value.trim().toUpperCase(),
            telefono: document.getElementById("newTel").value.trim(),
            diagnostico: document.getElementById("newDiagnostico").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: estadoDestino,
            empresaId: empresaId,
            ultimaActualizacion: serverTimestamp()
        };

        try {
            if (ordenEdicionId) {
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
                saveLog("ACTUALIZACION_ORDEN", { id: ordenEdicionId });
            } else {
                payload.creadoPor = uid;
                payload.creadoEn = serverTimestamp();
                await createDocument("ordenes", payload);
            }
            hablar("Protocolo actualizado con éxito.");
            document.getElementById("workspace").classList.add("hidden");
        } catch (e) { console.error(e); }
    };

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-32 text-center opacity-10"><p class="orbitron text-[10px] tracking-widest">SECTOR VACÍO</p></div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const oJson = JSON.stringify({ ...o, id }).replace(/'/g, "&apos;");
                
                return `
                <div class="bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/50 transition-all flex flex-col h-full">
                    <div class="flex justify-between items-start mb-6">
                        <div class="bg-black px-4 py-2 rounded-xl border border-white/10">
                            <p class="text-[12px] text-cyan-400 font-black orbitron">${o.placa}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick='window.capturarYEnviar(${oJson}, "INICIO")' class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px]"><i class="fas fa-camera"></i></button>
                            <button onclick="window.abrirEdicionMision('${id}')" class="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-[10px]"><i class="fas fa-edit"></i></button>
                        </div>
                    </div>
                    <h3 class="text-white text-[12px] font-black uppercase mb-2">${o.cliente}</h3>
                    <p class="text-[9px] text-slate-500 mb-6 italic line-clamp-2">${o.diagnostico || 'SIN DIAGNÓSTICO'}</p>
                    
                    <div class="mt-auto">
                        <div class="bg-black/30 p-4 rounded-xl mb-4 flex justify-between items-center">
                            <span class="text-[8px] text-slate-600 font-black orbitron uppercase">Total</span>
                            <span class="text-md font-black text-white orbitron">$${Number(o.total).toLocaleString()}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mb-4">
                            <button onclick='window.ejecutarImpresion(${oJson})' class="btn-card-nexus"><i class="fas fa-file-pdf"></i></button>
                            <button onclick='window.compartirWhatsApp(${oJson})' class="btn-card-nexus text-emerald-500"><i class="fab fa-whatsapp"></i></button>
                        </div>
                        <select onchange="window.cambiarFase('${id}', this.value)" class="w-full bg-cyan-500 text-black p-3 rounded-xl orbitron text-[9px] font-black uppercase">
                            <option value="" disabled selected>ESTADO: ${o.estado}</option>
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

/** HELPERS ESTÉTICOS **/
function iniciarReconocimientoVoz(id) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onresult = (e) => { document.getElementById(id).value += " " + e.results[0][0].transcript.toUpperCase(); };
    recognition.start();
}
