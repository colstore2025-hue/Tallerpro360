/**
 * ordenes.js - TallerPRO360 NEXUS-X V20.0 🚀
 * ESTILO: DASHBOARD DE OPERACIONES OSCURO (DEEP BLUE & NEON)
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument } from "../services/dataService.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const uid = localStorage.getItem("nexus_uid");
    
    let itemsOrden = [];
    let ordenEdicionId = null;
    let unsubscribe = null;

    // --- RENDERIZADO DEL ESPACIO DE TRABAJO ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 animate-in fade-in duration-700 pb-40 bg-[#020617] min-h-screen text-slate-100">
            
            <header class="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-cyan-500/20 pb-8">
                <div>
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter">
                        NEXUS<span class="text-cyan-400">OPS</span> <span class="text-[10px] border border-cyan-400 text-cyan-400 px-2 py-1 rounded ml-2">V20.0</span>
                    </h1>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p class="text-[9px] text-cyan-400/70 orbitron tracking-[0.3em]">SISTEMA DE CONTROL LOGÍSTICO ACTIVO</p>
                    </div>
                </div>
                
                <button id="btnNuevaOrden" class="group bg-cyan-600 hover:bg-cyan-400 text-black px-10 py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <span class="orbitron text-xs font-black tracking-widest flex items-center gap-3">
                        <i class="fas fa-plus-circle text-xl"></i> NUEVO DESPLIEGUE
                    </span>
                </button>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-3 mb-12">
                <button class="phase-nexus active-nexus border-2 border-cyan-500/30 bg-cyan-500/5 px-6 py-4 rounded-xl" data-fase="EN_TALLER">
                    <span class="orbitron text-[10px] font-black">RECEPCIÓN</span>
                </button>
                ${['COTIZACION', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus border-2 border-white/5 bg-white/5 px-6 py-4 rounded-xl text-slate-500 hover:border-cyan-500/50 transition-all" data-fase="${fase}">
                        <span class="orbitron text-[10px] font-black">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-16 animate-in slide-in-from-top-10 duration-500"></div>

            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"></div>
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

        // Bindings
        document.getElementById("btnGuardarMision").onclick = () => procesarMision(data?.estado || 'EN_TALLER');
        if(!data) document.getElementById("btnGuardarCot").onclick = () => procesarMision('COTIZACION');
        document.getElementById("btnAddConcepto").onclick = () => modalItems();
    };

    const renderFormulario = (d) => `
    <div class="bg-[#0a192f] border-2 border-cyan-500/40 rounded-[2.5rem] p-8 lg:p-12 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-7 space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-2">
                        <label class="orbitron text-[9px] text-cyan-400 font-bold ml-2">PLACA / IDENTIFICADOR</label>
                        <input id="f-placa" value="${d?.placa || ''}" class="bg-black/60 border-2 border-white/10 p-5 rounded-2xl text-xl font-black text-white orbitron uppercase focus:border-cyan-500 outline-none transition-all">
                    </div>
                    <div class="flex flex-col gap-2">
                        <label class="orbitron text-[9px] text-cyan-400 font-bold ml-2">WHATSAPP</label>
                        <input id="f-tel" type="number" value="${d?.telefono || ''}" class="bg-black/60 border-2 border-white/10 p-5 rounded-2xl text-xl font-black text-white outline-none focus:border-cyan-500 transition-all">
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="orbitron text-[9px] text-cyan-400 font-bold ml-2">COMANDANTE (CLIENTE)</label>
                    <input id="f-cliente" value="${d?.cliente || ''}" class="bg-black/60 border-2 border-white/10 p-5 rounded-2xl text-lg font-bold text-white uppercase outline-none focus:border-cyan-500 transition-all">
                </div>

                <div class="bg-black/40 p-6 rounded-3xl border-2 border-white/5">
                    <div class="flex justify-between items-center mb-4">
                        <span class="orbitron text-[10px] text-cyan-400 font-black tracking-widest">REPORTE TÉCNICO DE CAMPO</span>
                        <button onclick="window.nexusDictar('f-diag')" class="w-10 h-10 bg-cyan-500 rounded-full text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]"><i class="fas fa-microphone"></i></button>
                    </div>
                    <textarea id="f-diag" rows="5" class="w-full bg-transparent outline-none text-slate-300 font-medium text-lg resize-none" placeholder="Escribe o dicta el problema...">${d?.diagnostico || ''}</textarea>
                </div>
            </div>

            <div class="lg:col-span-5 bg-black/60 border-2 border-cyan-500/20 p-8 rounded-[3rem] flex flex-col min-h-[400px]">
                <h3 class="orbitron text-xs font-black text-white mb-6 text-center tracking-[0.3em]">DESGLOSE DE CARGOS</h3>
                
                <div id="listaItems" class="flex-grow space-y-4 overflow-y-auto max-h-[350px] mb-6 custom-scrollbar pr-2"></div>

                <div class="pt-6 border-t border-white/10 space-y-4">
                    <div class="flex justify-between items-center px-4">
                        <span class="orbitron text-[10px] text-slate-500 font-bold">VALOR TOTAL</span>
                        <span id="txtTotal" class="orbitron text-3xl font-black text-white">$ 0</span>
                    </div>
                    <button id="btnAddConcepto" class="w-full py-5 bg-white/5 border border-white/10 hover:border-cyan-500 text-white rounded-2xl orbitron text-[10px] font-black transition-all">
                        + VINCULAR REPUESTO O SERVICIO
                    </button>
                </div>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-6 mt-12 pt-8 border-t border-white/5">
            <button id="btnGuardarMision" class="flex-[2] py-6 bg-cyan-500 hover:bg-cyan-400 text-black rounded-3xl orbitron font-black text-sm tracking-[0.4em] transition-all shadow-xl">
                ${ordenEdicionId ? 'ACTUALIZAR MISIÓN' : 'CONFIRMAR DESPLIEGUE'}
            </button>
            ${!ordenEdicionId ? `
            <button id="btnGuardarCot" class="flex-1 py-6 bg-amber-500/20 text-amber-500 border-2 border-amber-500/50 rounded-3xl orbitron font-black text-sm hover:bg-amber-500 hover:text-white transition-all">
                SOLO COTIZACIÓN
            </button>` : ''}
            <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-8 py-6 text-slate-500 orbitron text-[10px] font-black hover:text-red-500 transition-colors">ABORTAR</button>
        </div>
    </div>
    `;

    const modalItems = async () => {
        const { value: fV } = await Swal.fire({
            title: 'AGREGAR CARGO',
            background: '#0a192f',
            color: '#fff',
            html: `
                <div class="p-2 space-y-4">
                    <input id="swal-n" class="swal2-input !bg-black !border-cyan-500 !text-white" placeholder="DESCRIPCIÓN">
                    <div class="flex gap-2">
                        <input id="swal-p" type="number" class="swal2-input !bg-black !border-cyan-500 !text-white" placeholder="PRECIO $">
                        <input id="swal-c" type="number" value="1" class="swal2-input !bg-black !border-cyan-500 !text-white w-24">
                    </div>
                </div>`,
            preConfirm: () => [document.getElementById('swal-n').value.toUpperCase(), document.getElementById('swal-p').value, document.getElementById('swal-c').value]
        });
        if (fV && fV[0] && fV[1]) {
            itemsOrden.push({ nombre: fV[0], precio: Number(fV[1]), cantidad: Number(fV[2]), total: Number(fV[1]) * Number(fV[2]) });
            actualizarFinanzas();
        }
    };

    const actualizarFinanzas = () => {
        const cont = document.getElementById("listaItems");
        const totalTxt = document.getElementById("txtTotal");
        let totalAcumulado = 0;

        cont.innerHTML = itemsOrden.length === 0 ? 
            `<p class="text-[9px] text-slate-600 text-center py-16 orbitron tracking-widest">SISTEMA A LA ESPERA DE DATOS</p>` :
            itemsOrden.map((it, idx) => {
                totalAcumulado += it.total;
                return `
                <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all">
                    <div>
                        <p class="text-[11px] font-bold text-white">${it.nombre}</p>
                        <p class="text-[9px] text-cyan-400/60 font-black uppercase">${it.cantidad} UN x $${it.precio.toLocaleString()}</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-xs font-black text-white orbitron">$${it.total.toLocaleString()}</span>
                        <button onclick="window.delNexusItem(${idx})" class="text-red-500/30 hover:text-red-500 transition-all"><i class="fas fa-times-circle"></i></button>
                    </div>
                </div>`;
            }).join("");

        totalTxt.innerText = `$ ${totalAcumulado.toLocaleString()}`;
        window.delNexusItem = (i) => { itemsOrden.splice(i, 1); actualizarFinanzas(); };
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

        if (!payload.placa || !payload.cliente) return Swal.fire('RADAR INCOMPLETO', 'Placa y Cliente obligatorios.', 'warning');

        try {
            hablar("Sincronizando telemetría.");
            if (ordenEdicionId) {
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
            } else {
                payload.creadoEn = serverTimestamp();
                payload.creadoPor = uid;
                const newDoc = await createDocument("ordenes", payload);
                if(payload.telefono) enviarWhatsAppOrden({...payload, id: newDoc});
            }
            
            Swal.fire({ title: 'MISIÓN GRABADA', icon: 'success', background: '#020617', color: '#fff' });
            document.getElementById("workspace").classList.add("hidden");
        } catch (e) {
            Swal.fire('ERROR DE ENLACE', 'No se pudo conectar con el satélite Firebase.', 'error');
        }
    };

    function vincularEventosFases() {
        document.querySelectorAll('.phase-nexus').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus').forEach(b => {
                    b.classList.remove('active-nexus', 'border-cyan-500/30', 'bg-cyan-500/5', 'text-white');
                    b.classList.add('border-white/5', 'bg-white/5', 'text-slate-500');
                });
                btn.classList.add('active-nexus', 'border-cyan-500/30', 'bg-cyan-500/5', 'text-white');
                escucharFirebase(btn.dataset.fase);
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
                grid.innerHTML = `<div class="col-span-full py-32 text-center opacity-10"><i class="fas fa-satellite-dish text-6xl mb-4"></i><p class="orbitron text-xs tracking-[0.5em]">SECTOR VACÍO</p></div>`;
                return;
            }
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                return `
                <div class="bg-[#0a192f] border-2 border-white/5 p-6 rounded-[2.5rem] hover:border-cyan-500/50 transition-all group relative">
                    <div class="flex justify-between items-start mb-6">
                        <div class="bg-black px-4 py-2 rounded-xl border border-cyan-500/30">
                            <span class="orbitron text-sm font-black text-white">${o.placa}</span>
                        </div>
                        <button onclick="window.retomarMision('${id}')" class="w-10 h-10 bg-white/5 rounded-full text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center shadow-lg">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                    <h4 class="text-white font-black uppercase text-sm mb-2 truncate">${o.cliente}</h4>
                    <p class="text-[10px] text-slate-500 italic mb-6 line-clamp-2 h-8 uppercase">${o.diagnostico || 'SIN REPORTE'}</p>
                    
                    <div class="bg-black/60 p-4 rounded-2xl flex justify-between items-center mb-6 border border-white/5">
                        <span class="orbitron text-[8px] text-cyan-400/60 font-bold">TOTAL MISIÓN</span>
                        <span class="orbitron text-lg font-black text-white">$${o.total.toLocaleString()}</span>
                    </div>

                    <div class="flex gap-2">
                        <button onclick='window.printNexus("${id}")' class="flex-1 py-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-all text-[10px] orbitron font-black">PDF</button>
                        <button onclick='window.waNexus("${id}")' class="flex-1 py-3 bg-green-500/10 rounded-xl text-green-500 hover:bg-green-500/20 transition-all text-[10px] orbitron font-black">WHA</button>
                    </div>
                </div>`;
            }).join("");
        });
        
        window.retomarMision = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            if (snap.exists()) iniciarMision({ ...snap.data(), id });
        };
    }

    renderBase();
}

/** 🎤 UTILS GLOBALES **/
window.nexusDictar = (id) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CO';
    recognition.onresult = (e) => { document.getElementById(id).value += " " + e.results[0][0].transcript.toUpperCase(); };
    recognition.start();
};
