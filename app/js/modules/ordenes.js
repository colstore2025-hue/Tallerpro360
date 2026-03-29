/**
 * ordenes.js - TallerPRO360 NEXUS-X V19.0 🛰️
 * PROTOCOLO DE REINGENIERÍA: PERSISTENCIA TOTAL & UI ULTRA-CONTRASTE
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const uid = localStorage.getItem("nexus_uid");
    
    let itemsOrden = [];
    let ordenEdicionId = null;
    let unsubscribe = null;

    // --- MOTOR DE UI DINÁMICA ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 animate-in fade-in zoom-in duration-500 pb-40 bg-[#020617] min-h-screen text-slate-200">
            <header class="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div class="text-center md:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter">
                        NEXUS<span class="text-cyan-400">OPS</span> <span class="text-[10px] bg-cyan-500 text-black px-2 py-1 rounded ml-2">V19.0</span>
                    </h1>
                    <p class="text-[9px] text-cyan-400/50 orbitron tracking-[0.4em] mt-2">SISTEMA LOGÍSTICO STARLINK ACTIVE</p>
                </div>
                
                <button id="btnNuevaOrden" class="group relative px-8 py-4 bg-transparent border-2 border-cyan-500 rounded-2xl overflow-hidden transition-all hover:bg-cyan-500">
                    <span class="relative z-10 orbitron text-xs font-black text-cyan-500 group-hover:text-black tracking-widest flex items-center gap-3">
                        <i class="fas fa-plus-circle text-xl"></i> NUEVO DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-10 pb-2">
                <button class="phase-nexus border-amber-500/40 text-amber-500 bg-amber-500/5" data-fase="COTIZACION">
                    <span class="orbitron text-[10px] font-black">COTIZACIONES</span>
                </button>
                ${['EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus border-white/10 text-slate-500 bg-white/5" data-fase="${fase}">
                        <span class="orbitron text-[10px] font-black">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-16"></div>
            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"></div>
        </div>
        `;

        document.getElementById("btnNuevaOrden").onclick = () => iniciarMision();
        vincularEventosFases();
    };

    const iniciarMision = (data = null) => {
        ordenEdicionId = data?.id || null;
        itemsOrden = data?.items || [];
        const ws = document.getElementById("workspace");
        ws.classList.remove("hidden");
        ws.innerHTML = renderFormulario(data);
        ws.scrollIntoView({ behavior: 'smooth' });
        actualizarFinanzas();

        // Binding de acciones
        document.getElementById("btnGuardarCot").onclick = () => procesarMision('COTIZACION');
        document.getElementById("btnGuardarOrden").onclick = () => procesarMision('EN_TALLER');
        document.getElementById("btnAddConcepto").onclick = () => modalItems();
    };

    const renderFormulario = (d) => `
    <div class="bg-slate-900 border-2 border-cyan-500/30 rounded-[2.5rem] p-6 lg:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-8 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="input-nexus-v19">
                        <label>IDENTIFICACIÓN (PLACA)</label>
                        <input id="f-placa" value="${d?.placa || ''}" placeholder="P-000" class="uppercase">
                    </div>
                    <div class="input-nexus-v19">
                        <label>CLIENTE (COMANDANTE)</label>
                        <input id="f-cliente" value="${d?.cliente || ''}" placeholder="NOMBRE COMPLETO">
                    </div>
                    <div class="input-nexus-v19">
                        <label>WHATSAPP (ENLACE)</label>
                        <input id="f-tel" type="number" value="${d?.telefono || ''}" placeholder="57...">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-black/50 p-6 rounded-3xl border border-white/5">
                        <div class="flex justify-between items-center mb-4">
                            <span class="orbitron text-[10px] text-cyan-400 font-black">DIAGNÓSTICO INICIAL</span>
                            <button onclick="window.nexusDictar('f-diag')" class="text-cyan-500 animate-pulse"><i class="fas fa-microphone"></i></button>
                        </div>
                        <textarea id="f-diag" rows="4" class="w-full bg-transparent outline-none text-slate-300 resize-none font-medium">${d?.diagnostico || ''}</textarea>
                    </div>
                    <div class="bg-black/50 p-6 rounded-3xl border border-white/5">
                        <div class="flex justify-between items-center mb-4">
                            <span class="orbitron text-[10px] text-amber-500 font-black">INVENTARIO DE RECEPCIÓN</span>
                        </div>
                        <textarea id="f-inv" rows="4" class="w-full bg-transparent outline-none text-slate-400 italic resize-none text-sm" placeholder="Gato, Herramienta, Radio...">${d?.inventario || ''}</textarea>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-4 bg-white p-6 rounded-[2rem] shadow-inner flex flex-col">
                <h3 class="orbitron text-xs font-black text-black mb-6 border-b border-black/10 pb-2 text-center">LIQUIDACIÓN DE MISIÓN</h3>
                
                <div id="listaItems" class="flex-grow space-y-3 overflow-y-auto max-h-[300px] mb-6 pr-2"></div>

                <div class="mt-auto space-y-3">
                    <div class="flex justify-between items-center bg-slate-100 p-4 rounded-2xl">
                        <span class="orbitron text-[10px] font-black text-slate-500">TOTAL</span>
                        <span id="txtTotal" class="orbitron text-2xl font-black text-black tracking-tighter">$0</span>
                    </div>
                    <button id="btnAddConcepto" class="w-full py-4 bg-black text-white rounded-xl orbitron text-[10px] font-black hover:scale-105 transition-all">
                        + AGREGAR CARGO / REPUESTO
                    </button>
                </div>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 mt-10">
            <button id="btnGuardarOrden" class="flex-[2] py-6 bg-cyan-500 text-black rounded-2xl orbitron font-black text-sm tracking-widest hover:brightness-125 transition-all">
                CONFIRMAR Y DESPLEGAR ORDEN
            </button>
            <button id="btnGuardarCot" class="flex-1 py-6 bg-amber-500/20 text-amber-600 border-2 border-amber-600/50 rounded-2xl orbitron font-black text-sm hover:bg-amber-600 hover:text-white transition-all">
                SOLO COTIZACIÓN
            </button>
            <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-8 py-6 text-slate-500 orbitron text-[10px] font-black">ABORTAR</button>
        </div>
    </div>
    `;

    const modalItems = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'NUEVO CARGO',
            background: '#0f172a',
            color: '#fff',
            html: `
                <input id="swal-n" class="swal2-input !bg-slate-800 !text-white !border-cyan-500" placeholder="NOMBRE DEL REPUESTO">
                <div class="flex gap-2">
                    <input id="swal-p" type="number" class="swal2-input !bg-slate-800 !text-white !border-cyan-500" placeholder="PRECIO $">
                    <input id="swal-c" type="number" value="1" class="swal2-input !bg-slate-800 !text-white !border-cyan-500 w-24">
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => [
                document.getElementById('swal-n').value.toUpperCase(),
                document.getElementById('swal-p').value,
                document.getElementById('swal-c').value
            ]
        });

        if (formValues && formValues[0] && formValues[1]) {
            itemsOrden.push({
                nombre: formValues[0],
                precio: Number(formValues[1]),
                cantidad: Number(formValues[2]),
                total: Number(formValues[1]) * Number(formValues[2])
            });
            actualizarFinanzas();
        }
    };

    const actualizarFinanzas = () => {
        const contenedor = document.getElementById("listaItems");
        const totalTxt = document.getElementById("txtTotal");
        let totalAcumulado = 0;

        contenedor.innerHTML = itemsOrden.length === 0 ? 
            `<p class="text-[9px] text-slate-400 text-center py-10 orbitron">SIN CARGOS REGISTRADOS</p>` :
            itemsOrden.map((it, idx) => {
                totalAcumulado += it.total;
                return `
                <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div class="max-w-[150px]">
                        <p class="text-[10px] font-black text-black truncate">${it.nombre}</p>
                        <p class="text-[9px] text-slate-500">${it.cantidad} x $${it.precio.toLocaleString()}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-[11px] font-black text-black">$${it.total.toLocaleString()}</span>
                        <button onclick="window.delNexusItem(${idx})" class="text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }).join("");

        totalTxt.innerText = `$${totalAcumulado.toLocaleString()}`;
        window.delNexusItem = (i) => { itemsOrden.splice(i, 1); actualizarFinanzas(); };
    };

    const procesarMision = async (fase) => {
        const payload = {
            placa: document.getElementById("f-placa").value.trim().toUpperCase(),
            cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
            telefono: document.getElementById("f-tel").value.trim(),
            diagnostico: document.getElementById("f-diag").value.trim(),
            inventario: document.getElementById("f-inv").value.trim(),
            items: itemsOrden,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: fase,
            empresaId,
            ultimaActualizacion: serverTimestamp()
        };

        if (!payload.placa || !payload.cliente) return Swal.fire('DATO FALTANTE', 'La Placa y el Cliente son obligatorios.', 'warning');

        try {
            hablar("Sincronizando con la red Nexus.");
            if (ordenEdicionId) {
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
            } else {
                payload.creadoEn = serverTimestamp();
                payload.creadoPor = uid;
                await createDocument("ordenes", payload);
            }
            
            Swal.fire({ title: 'ÉXITO', text: 'Datos grabados en la nube', icon: 'success', background: '#020617', color: '#fff' });
            document.getElementById("workspace").classList.add("hidden");
            hablar("Misión guardada con éxito.");
        } catch (e) {
            console.error(e);
            Swal.fire('ERROR CRÍTICO', 'No se pudo conectar con Firebase.', 'error');
        }
    };

    function vincularEventosFases() {
        document.querySelectorAll('.phase-nexus').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus').forEach(b => b.classList.remove('active-nexus', 'active-amber', 'bg-cyan-500', 'text-black', 'bg-amber-500'));
                const f = btn.dataset.fase;
                btn.classList.add(f === 'COTIZACION' ? 'bg-amber-500' : 'bg-cyan-500');
                btn.classList.add('text-black');
                escucharFirebase(f);
            };
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    }

    function escucharFirebase(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-20 text-center opacity-20"><p class="orbitron text-xs">SIN REGISTROS EN ${fase}</p></div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                return `
                <div class="bg-slate-900 border border-white/10 p-6 rounded-[2rem] hover:border-cyan-500 transition-all group relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                        <button onclick="window.retomar('${id}')" class="text-cyan-400 text-xl"><i class="fas fa-external-link-alt"></i></button>
                    </div>
                    <div class="flex items-center gap-4 mb-4">
                        <div class="bg-black px-4 py-2 rounded-lg border border-cyan-500/50">
                            <span class="orbitron text-lg font-black text-white">${o.placa}</span>
                        </div>
                        <div>
                            <p class="text-[10px] text-slate-500 orbitron">COMANDANTE</p>
                            <p class="text-xs font-bold text-white uppercase">${o.cliente}</p>
                        </div>
                    </div>
                    <p class="text-[10px] text-slate-400 italic mb-6 line-clamp-2 h-8">${o.diagnostico || 'Sin diagnóstico registrado.'}</p>
                    <div class="flex justify-between items-center bg-black/40 p-4 rounded-xl">
                        <span class="orbitron text-[9px] text-cyan-400">TOTAL</span>
                        <span class="orbitron text-lg font-black text-white">$${o.total.toLocaleString()}</span>
                    </div>
                </div>`;
            }).join("");
        });
        
        window.retomar = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            if (snap.exists()) iniciarMision({ ...snap.data(), id });
        };
    }

    renderBase();
}

/** 🎤 COMANDO DE VOZ NEXUS **/
window.nexusDictar = (id) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onresult = (e) => { 
        document.getElementById(id).value += " " + e.results[0][0].transcript.toUpperCase(); 
    };
    recognition.start();
};
