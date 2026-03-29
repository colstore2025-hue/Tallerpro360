/**
 * ordenes.js - TallerPRO360 NEXUS-X V22.0 🛰️ 🚀
 * TORRE DE CONTROL LOGÍSTICA & ESTACIÓN DE COMANDO
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, addDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const uid = localStorage.getItem("nexus_uid");
    
    let itemsOrden = []; // Suministros y Mano de Obra
    let gastosAnexos = []; // Cafetería, insumos internos
    let ordenEdicionId = null;
    let unsubscribe = null;

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 animate-in fade-in duration-1000 pb-40 bg-[#010409] min-h-screen text-slate-100">
            
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/5 pb-10">
                <div class="relative">
                    <h1 class="orbitron text-6xl font-black text-white italic tracking-tighter">
                        TITAN<span class="text-orange-500">CONTROL</span>
                    </h1>
                    <p class="text-[9px] text-orange-500/70 orbitron tracking-[0.5em] mt-2">NEXUS LOGISTICS HUB V22.0</p>
                </div>
                
                <div class="flex gap-4">
                    <button id="btnNuevaCotizacion" class="px-8 py-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl orbitron text-[10px] font-black text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
                        <i class="fas fa-file-invoice-dollar mr-2"></i> PRE-VUELO (COTIZAR)
                    </button>
                    <button id="btnNuevaOrden" class="px-10 py-5 bg-cyan-600 rounded-2xl orbitron text-[10px] font-black text-black hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <i class="fas fa-rocket mr-2"></i> NUEVO DESPLIEGUE
                    </button>
                </div>
            </header>

            <div class="flex overflow-x-auto no-scrollbar gap-4 mb-12">
                ${['COTIZACION', 'EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="phase-nexus-v22 shrink-0 px-10 py-6 rounded-3xl border border-white/5 bg-[#0d1117] transition-all" data-fase="${fase}">
                        <span class="orbitron text-[11px] font-black tracking-widest text-slate-500">${fase.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </div>

            <div id="workspace" class="hidden mb-20"></div>
            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>
        `;

        document.getElementById("btnNuevaOrden").onclick = () => abrirConsola('EN_TALLER');
        document.getElementById("btnNuevaCotizacion").onclick = () => abrirConsola('COTIZACION');
        vincularFases();
    };

    const abrirConsola = (faseInicial, data = null) => {
        ordenEdicionId = data?.id || null;
        itemsOrden = data?.items || [];
        gastosAnexos = data?.gastosAnexos || [];
        
        const ws = document.getElementById("workspace");
        ws.classList.remove("hidden");
        ws.innerHTML = `
        <div class="bg-[#0d1117] border-2 border-white/5 rounded-[4rem] p-10 lg:p-16 shadow-[0_0_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div class="flex justify-between items-start mb-16">
                <div>
                    <h2 class="orbitron text-2xl font-black ${faseInicial === 'COTIZACION' ? 'text-amber-500' : 'text-cyan-400'} mb-2">
                        ${ordenEdicionId ? 'EDITANDO MISIÓN' : 'CONFIGURANDO DESPLIEGUE'}
                    </h2>
                    <p class="text-[10px] text-slate-500 orbitron tracking-[0.3em]">ID_SESSION: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <div class="text-right">
                    <p class="orbitron text-[9px] text-slate-500 mb-2">CARGA FINANCIERA TOTAL</p>
                    <h3 id="txtTotal" class="orbitron text-6xl font-black text-white tracking-tighter">$ 0</h3>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div class="lg:col-span-4 space-y-8 border-r border-white/5 pr-8">
                    <div class="group">
                        <label class="orbitron text-[10px] text-orange-500 font-black mb-4 block tracking-widest">PLACAS_IDENT</label>
                        <input id="f-placa" value="${data?.placa || ''}" class="w-full bg-black border-b-2 border-orange-500/30 p-4 text-4xl font-black text-white orbitron focus:border-orange-500 outline-none transition-all uppercase">
                    </div>
                    <div>
                        <label class="orbitron text-[10px] text-slate-500 font-black mb-4 block">COMANDANTE / CLIENTE</label>
                        <input id="f-cliente" value="${data?.cliente || ''}" class="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xl font-bold text-white outline-none focus:border-cyan-500">
                    </div>
                    <div>
                        <label class="orbitron text-[10px] text-slate-500 font-black mb-4 block">ENLACE WHATSAPP</label>
                        <input id="f-tel" type="number" value="${data?.telefono || ''}" class="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xl font-bold text-white outline-none focus:border-cyan-500">
                    </div>
                </div>

                <div class="lg:col-span-8">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="orbitron text-xs font-black text-white tracking-widest italic">VINCULACIÓN DE SUMINISTROS & MANO DE OBRA</h3>
                        <div class="flex gap-4">
                            <button id="btnVoiceItem" class="px-6 py-3 bg-red-500/10 text-red-500 rounded-full orbitron text-[9px] font-black border border-red-500/20"><i class="fas fa-microphone mr-2"></i> DICTAR CARGO</button>
                            <button id="btnAddItem" class="px-6 py-3 bg-cyan-500 text-black rounded-full orbitron text-[9px] font-black"> + AGREGAR MANUAL</button>
                        </div>
                    </div>
                    
                    <div id="listaItems" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar mb-10 p-2">
                        </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                        <div class="bg-black/40 p-6 rounded-3xl">
                            <p class="orbitron text-[9px] text-emerald-500 font-black mb-4">COMISIONES TÉCNICAS (ORO)</p>
                            <div id="listaComisiones" class="space-y-2"></div>
                        </div>
                        <div class="bg-black/40 p-6 rounded-3xl">
                            <p class="orbitron text-[9px] text-red-400 font-black mb-4">GASTOS ANEXOS (CAFETERÍA/INSUMOS)</p>
                            <button id="btnAddGasto" class="w-full py-3 border border-dashed border-red-500/30 text-red-500/60 rounded-xl text-[9px] orbitron">+ VINCULAR GASTO</button>
                            <div id="listaGastos" class="mt-4 space-y-2"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-6 mt-16 pt-10 border-t border-white/10">
                <button id="btnGuardar" class="flex-[3] py-8 rounded-[2rem] orbitron font-black text-sm tracking-[0.5em] transition-all shadow-2xl ${faseInicial === 'COTIZACION' ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'}">
                    CONFIRMAR Y SUBIR A LA NUBE <i class="fas fa-cloud-upload-alt ml-4"></i>
                </button>
                <button onclick="document.getElementById('workspace').classList.add('hidden')" class="flex-1 py-8 text-slate-600 orbitron text-[10px] font-black hover:text-red-500 transition-colors uppercase">
                    Abortar
                </button>
            </div>
        </div>
        `;

        ws.scrollIntoView({ behavior: 'smooth' });
        actualizarFinanzas();

        document.getElementById("btnGuardar").onclick = () => procesarMision(faseInicial);
        document.getElementById("btnAddItem").onclick = () => modalItem();
        document.getElementById("btnAddGasto").onclick = () => modalGasto();
        document.getElementById("btnVoiceItem").onclick = () => dictarCargo();
    };

    const modalItem = async () => {
        const { value: v } = await Swal.fire({
            title: 'AGREGAR CARGO',
            background: '#0d1117', color: '#fff',
            html: `
                <select id="sw-t" class="sw-input-nexus mb-4">
                    <option value="REPUESTO">🔧 REPUESTO (VERDE)</option>
                    <option value="MANO_OBRA">🏆 MANO DE OBRA (ORO)</option>
                </select>
                <input id="sw-n" class="sw-input-nexus mb-4" placeholder="DESCRIPCIÓN">
                <div class="flex gap-2">
                    <input id="sw-p" type="number" class="sw-input-nexus" placeholder="PRECIO $">
                    <input id="sw-c" type="number" value="1" class="sw-input-nexus w-24">
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'VINCULAR'
        });
        if (v) {
            const it = {
                tipo: document.getElementById('sw-t').value,
                nombre: document.getElementById('sw-n').value.toUpperCase(),
                precio: Number(document.getElementById('sw-p').value),
                cantidad: Number(document.getElementById('sw-c').value),
                total: Number(document.getElementById('sw-p').value) * Number(document.getElementById('sw-c').value)
            };
            itemsOrden.push(it);
            actualizarFinanzas();
        }
    };

    const actualizarFinanzas = () => {
        const listItems = document.getElementById("listaItems");
        const listGastos = document.getElementById("listaGastos");
        const totalTxt = document.getElementById("txtTotal");
        
        let subtotal = 0;

        listItems.innerHTML = itemsOrden.map((it, idx) => {
            subtotal += it.total;
            const color = it.tipo === 'REPUESTO' ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400' : 'border-amber-500/40 bg-amber-500/5 text-amber-500';
            return `
            <div class="p-4 border-2 ${color} rounded-2xl flex justify-between items-center animate-in zoom-in-95">
                <div>
                    <p class="text-[10px] font-black orbitron">${it.tipo}</p>
                    <p class="text-xs font-bold text-white">${it.nombre}</p>
                    <p class="text-[9px] opacity-70">${it.cantidad} x $${it.precio.toLocaleString()}</p>
                </div>
                <div class="text-right flex items-center gap-4">
                    <span class="orbitron font-black text-white">$${it.total.toLocaleString()}</span>
                    <button onclick="window.delItemNexusTitan(${idx}, 'item')" class="text-white/20 hover:text-red-500"><i class="fas fa-times-circle"></i></button>
                </div>
            </div>`;
        }).join("");

        listGastos.innerHTML = gastosAnexos.map((g, idx) => `
            <div class="flex justify-between text-[10px] text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/20">
                <span>${g.nombre}</span>
                <span>$${g.monto.toLocaleString()} <button onclick="window.delItemNexusTitan(${idx}, 'gasto')" class="ml-2">×</button></span>
            </div>
        `).join("");

        totalTxt.innerText = `$ ${subtotal.toLocaleString()}`;
        
        window.delItemNexusTitan = (i, type) => {
            if(type === 'item') itemsOrden.splice(i, 1);
            else gastosAnexos.splice(i, 1);
            actualizarFinanzas();
        };
    };

    const procesarMision = async (fase) => {
        const payload = {
            placa: document.getElementById("f-placa").value.trim().toUpperCase(),
            cliente: document.getElementById("f-cliente").value.trim().toUpperCase(),
            telefono: document.getElementById("f-tel").value.trim(),
            items: itemsOrden,
            gastosAnexos: gastosAnexos,
            total: itemsOrden.reduce((acc, i) => acc + i.total, 0),
            estado: fase,
            empresaId,
            ultimaActualizacion: serverTimestamp()
        };

        if (!payload.placa || !payload.cliente) return Swal.fire('Error', 'Placa y Cliente obligatorios', 'error');

        try {
            if (ordenEdicionId) {
                await updateDoc(doc(db, "ordenes", ordenEdicionId), payload);
            } else {
                payload.creadoEn = serverTimestamp();
                await addDoc(collection(db, "ordenes"), payload);
            }
            document.getElementById("workspace").classList.add("hidden");
            hablar("Misión sincronizada con éxito");
        } catch (e) { console.error(e); }
    };

    function vincularFases() {
        document.querySelectorAll('.phase-nexus-v22').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.phase-nexus-v22').forEach(b => b.classList.remove('border-orange-500', 'bg-orange-500/10', 'text-white'));
                btn.classList.add('border-orange-500', 'bg-orange-500/10', 'text-white');
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
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                const glow = o.estado === 'COTIZACION' ? 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'shadow-[0_0_20px_rgba(6,182,212,0.1)]';
                
                return `
                <div class="bg-[#0d1117] border-2 border-white/5 p-8 rounded-[3rem] ${glow} hover:border-orange-500/40 transition-all group relative">
                    <div class="flex justify-between items-start mb-6">
                        <div class="px-4 py-2 bg-black rounded-xl border border-orange-500/30">
                            <span class="orbitron text-lg font-black text-white">${o.placa}</span>
                        </div>
                        <div class="flex gap-2">
                             <button onclick="window.borrarMision('${id}')" class="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash-alt text-xs"></i></button>
                             <button onclick="window.abrirMisionTitan('${id}')" class="w-10 h-10 bg-cyan-500 text-black rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"><i class="fas fa-pen text-xs"></i></button>
                        </div>
                    </div>
                    
                    <h4 class="orbitron text-xs font-black text-white mb-2 uppercase">${o.cliente}</h4>
                    <div class="flex items-center gap-2 text-[10px] text-slate-500 mb-6">
                        <i class="fab fa-whatsapp text-emerald-500"></i> ${o.telefono || 'Sin Enlace'}
                    </div>

                    <div class="bg-black/40 p-5 rounded-2xl flex justify-between items-center mb-6">
                        <span class="orbitron text-[8px] text-slate-500 font-black">TOTAL</span>
                        <span class="orbitron text-xl font-black text-white">$${Number(o.total).toLocaleString()}</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <button onclick='window.waTitan("${id}")' class="py-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"><i class="fab fa-whatsapp"></i></button>
                        <button onclick='window.printTitan("${id}", "COT")' class="py-3 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-black transition-all text-[9px] orbitron font-black">COT</button>
                        <button onclick='window.printTitan("${id}", "FAC")' class="py-3 bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-black transition-all text-[9px] orbitron font-black">FAC</button>
                    </div>
                </div>`;
            }).join("");
        });
        
        // Handlers Pro
        window.abrirMisionTitan = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            if (snap.exists()) abrirConsola(snap.data().estado, { ...snap.data(), id });
        };
        
        window.borrarMision = async (id) => {
            const r = await Swal.fire({ title: '¿ELIMINAR MISIÓN?', text: "Esta acción es irreversible en el satélite.", icon: 'warning', showCancelButton: true, background: '#0d1117', color: '#fff', confirmButtonColor: '#ef4444' });
            if(r.isConfirmed) await deleteDoc(doc(db, "ordenes", id));
        };
    }

    renderBase();
}

/** 🎤 UTILS DE VOZ & GASTOS **/
async function modalGasto() {
    const { value: g } = await Swal.fire({
        title: 'GASTO ANEXO', background: '#0d1117', color: '#fff',
        html: `<input id="g-n" class="sw-input-nexus mb-2" placeholder="CONCEPTO (Ej: Cafetería)"><input id="g-m" type="number" class="sw-input-nexus" placeholder="MONTO $">`,
        showCancelButton: true
    });
    // Lógica para empujar a gastosAnexos y actualizarFinanzas()...
}

function dictarCargo() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'es-CO';
    rec.onstart = () => hablar("Dicta el repuesto y el precio");
    rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        // Aquí podrías usar una IA simple o Regex para separar "Filtro de aire 50 mil"
        console.log("Voz captada:", text);
    };
    rec.start();
}
