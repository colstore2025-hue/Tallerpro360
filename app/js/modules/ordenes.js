/**
 * ordenes.js - TallerPRO360 NEXUS-X V25.0 🛰️
 * TERMINAL DE OPERACIÓN CUÁNTICA: VOZ, DATOS & ERP INTEGRADO
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, addDoc, deleteDoc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { generarPDFOrden, enviarWhatsAppOrden } from "../services/printService.js";

export default async function ordenes(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActiva = 'EN_TALLER';
    let unsubscribe = null;

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans selection:bg-orange-500/30">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <div class="flex items-center gap-3">
                        <div class="h-4 w-4 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                        <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white">NEXUS<span class="text-orange-500">X</span></h1>
                    </div>
                    <p class="text-[10px] orbitron tracking-[0.6em] text-slate-500 uppercase">Universal Operation Terminal • Starlink Logistics</p>
                </div>
                
                <div class="flex flex-wrap gap-4">
                    <button id="btnQuickRepair" class="group px-8 py-5 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600 transition-all">
                        <span class="orbitron text-[10px] font-black text-blue-400 group-hover:text-white">REPARACIÓN RÁPIDA</span>
                    </button>
                    <button id="btnFullMission" class="px-10 py-5 bg-orange-600 rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.2)] hover:scale-105 transition-all">
                        <span class="orbitron text-[11px] font-black text-black">DESPLEGAR MISIÓN 2030</span>
                    </button>
                </div>
            </header>

            <nav class="flex gap-3 mb-12 overflow-x-auto no-scrollbar pb-4">
                ${['COTIZACION', 'EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `
                    <button class="nav-fase-btn shrink-0 px-10 py-6 rounded-2xl border border-white/5 bg-[#0d1117] transition-all relative group" data-fase="${f}">
                        <div class="absolute inset-0 bg-orange-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-all"></div>
                        <span class="orbitron text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest">${f.replace('_', ' ')}</span>
                    </button>
                `).join('')}
            </nav>

            <div id="nexus-console" class="hidden mb-16 animate-in slide-in-from-bottom-10 duration-500"></div>
            <div id="grid-misiones" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
        </div>`;

        document.getElementById("btnFullMission").onclick = () => abrirConsola('EN_TALLER');
        document.getElementById("btnQuickRepair").onclick = () => abrirConsola('COTIZACION');
        vincularFases();
    };

    const abrirConsola = (fase, data = null) => {
        ordenActiva = data || { 
            placa: '', cliente: '', telefono: '', items: [], gastos: [], fotos: [], 
            historial: [], estado: fase, logs: [] 
        };
        
        const console = document.getElementById("nexus-console");
        console.classList.remove("hidden");
        console.innerHTML = `
        <div class="bg-[#0d1117] border border-white/10 rounded-[3.5rem] p-10 lg:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div class="absolute top-0 right-0 p-10 opacity-10 orbitron text-8xl font-black text-white pointer-events-none">${fase}</div>
            
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
                <div class="lg:col-span-5 space-y-10">
                    <div class="flex items-center justify-between">
                        <h3 class="orbitron text-xs font-black text-orange-500 tracking-widest italic">DIAGNÓSTICO DE ENTRADA</h3>
                        <button id="btnVoiceMaster" class="w-16 h-16 bg-orange-600 text-black rounded-full shadow-2xl hover:scale-110 transition-all"><i class="fas fa-microphone"></i></button>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="orbitron text-[8px] text-slate-500 ml-4">PLATE_ID</label>
                            <input id="f-placa" value="${ordenActiva.placa}" class="w-full bg-black/50 border border-white/10 p-6 rounded-[1.5rem] text-3xl font-black text-white orbitron uppercase focus:border-orange-500 outline-none transition-all">
                        </div>
                        <div class="space-y-2">
                            <label class="orbitron text-[8px] text-slate-500 ml-4">COM_LINK (WA)</label>
                            <input id="f-tel" value="${ordenActiva.telefono}" class="w-full bg-black/50 border border-white/10 p-6 rounded-[1.5rem] text-xl font-bold text-white focus:border-orange-500 outline-none transition-all">
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="orbitron text-[8px] text-slate-500 ml-4">COMMANDER_NAME</label>
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black/50 border border-white/10 p-6 rounded-[1.5rem] text-xl font-bold text-white uppercase focus:border-orange-500 outline-none transition-all">
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="orbitron text-[9px] text-slate-500 uppercase italic">Evidencia Visual de Misión</span>
                            <span class="text-[9px] text-orange-500 font-bold">ALTA RESOLUCIÓN</span>
                        </div>
                        <div class="grid grid-cols-4 gap-3">
                            ${[0,1,2,3].map(i => `
                                <div class="aspect-square bg-black border border-white/5 rounded-2xl flex items-center justify-center relative group cursor-pointer overflow-hidden shadow-inner" onclick="document.getElementById('upl-${i}').click()">
                                    <input type="file" id="upl-${i}" hidden onchange="window.nexusUpl(${i}, this)">
                                    <img src="${ordenActiva.fotos[i] || ''}" id="view-${i}" class="w-full h-full object-cover ${ordenActiva.fotos[i] ? '' : 'hidden'}">
                                    <i id="ico-${i}" class="fas fa-camera text-slate-800 text-xl group-hover:text-orange-500 transition-colors ${ordenActiva.fotos[i] ? 'hidden' : ''}"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-7 flex flex-col">
                    <div class="bg-black/30 rounded-[3rem] p-10 border border-white/5 flex-grow flex flex-col">
                        <div class="flex justify-between items-start mb-12">
                            <div>
                                <p class="orbitron text-[9px] text-emerald-500 mb-2 tracking-widest">ESTADO FINANCIERO DE ORDEN</p>
                                <h2 id="total-val" class="orbitron text-7xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div class="text-right">
                                <p class="orbitron text-[9px] text-red-500 mb-2">OPERATIVOS / GASTOS</p>
                                <h4 id="gastos-val" class="orbitron text-2xl font-black text-red-500">$ 0</h4>
                            </div>
                        </div>

                        <div id="lista-orden" class="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar flex-grow">
                            </div>

                        <div class="grid grid-cols-3 gap-4 mt-10">
                            <button id="btnSaveNexus" class="col-span-2 py-8 bg-white text-black rounded-[2rem] orbitron font-black text-xs hover:bg-orange-600 hover:text-white transition-all shadow-2xl">
                                SINCRONIZAR CON TALLERPRO ERP
                            </button>
                            <button onclick="document.getElementById('nexus-console').classList.add('hidden')" class="py-8 bg-white/5 text-slate-500 rounded-[2rem] orbitron font-black text-[9px] hover:bg-red-500/10 transition-all">
                                CERRAR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        vincularEventosConsola(fase);
        renderizarItems();
    };

    const vincularEventosConsola = (fase) => {
        document.getElementById("btnVoiceMaster").onclick = () => hablarItemsPorVoz();
        document.getElementById("btnSaveNexus").onclick = () => guardarMisionERP(fase);
        
        window.nexusUpl = (idx, input) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                ordenActiva.fotos[idx] = e.target.result;
                document.getElementById(`view-${idx}`).src = e.target.result;
                document.getElementById(`view-${idx}`).classList.remove('hidden');
                document.getElementById(`ico-${idx}`).classList.add('hidden');
            };
            reader.readAsDataURL(input.files[0]);
        };
    };

    const hablarItemsPorVoz = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.lang = 'es-CO';
        rec.onstart = () => { hablar("Nexus escuchando requerimiento"); };
        rec.onresult = (e) => {
            const frase = e.results[0][0].transcript.toLowerCase();
            procesarComandoUniversal(frase);
        };
        rec.start();
    };

    const procesarComandoUniversal = (frase) => {
        const num = frase.match(/\d+/g);
        if(!num) return hablar("Valor no detectado");
        const valor = parseInt(num[0]) * (frase.includes("mil") ? 1000 : 1);
        const desc = frase.replace(num[0], "").replace("mil", "").replace("pesos", "").trim().toUpperCase();

        if(frase.includes("gasto") || frase.includes("café")) {
            ordenActiva.gastos.push({ desc, valor, timestamp: new Date() });
            hablar("Gasto registrado en ERP");
        } else if(frase.includes("oro") || frase.includes("mano de obra")) {
            const tec = prompt("Nombre del Técnico Responsable:");
            ordenActiva.items.push({ tipo: 'ORO', desc, valor, tecnico: tec, comision: valor * 0.40 }); // Ejemplo de comisión 40%
            hablar(`Mano de obra asignada a ${tec}`);
        } else {
            // ENLACE A INVENTARIO.JS (SIMULADO)
            ordenActiva.items.push({ tipo: 'REPUESTO', desc, valor, stock_sync: true });
            hablar("Repuesto cargado al inventario");
        }
        renderizarItems();
    };

    const renderizarItems = () => {
        const list = document.getElementById("lista-orden");
        const tVal = document.getElementById("total-val");
        const gVal = document.getElementById("gastos-val");

        list.innerHTML = (ordenActiva.items || []).map((it, idx) => `
            <div class="flex justify-between items-center p-6 bg-black/40 border-l-8 ${it.tipo === 'ORO' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-emerald-500'} rounded-r-3xl animate-in fade-in slide-in-from-left-4">
                <div>
                    <div class="flex items-center gap-3">
                        <p class="text-[11px] font-black text-white uppercase tracking-tighter">${it.desc}</p>
                        <span class="text-[7px] orbitron px-2 py-0.5 rounded bg-white/5 text-slate-500">${it.tipo}</span>
                    </div>
                    ${it.tecnico ? `<p class="text-[8px] orbitron text-amber-500 mt-1 uppercase">ASIGNADO: ${it.tecnico}</p>` : ''}
                </div>
                <div class="flex items-center gap-6">
                    <span class="orbitron text-lg font-black text-white italic">$${it.valor.toLocaleString()}</span>
                    <button onclick="window.delNexusItem(${idx})" class="text-red-500/20 hover:text-red-500 transition-all"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join("");

        const total = ordenActiva.items.reduce((a, b) => a + b.valor, 0);
        const gastos = (ordenActiva.gastos || []).reduce((a, b) => a + b.valor, 0);
        
        tVal.innerText = `$ ${total.toLocaleString()}`;
        gVal.innerText = `$ ${gastos.toLocaleString()}`;

        window.delNexusItem = (i) => { ordenActiva.items.splice(i, 1); renderizarItems(); };
    };

    const guardarMisionERP = async (fase) => {
        const payload = {
            ...ordenActiva,
            placa: document.getElementById("f-placa").value.toUpperCase(),
            cliente: document.getElementById("f-cliente").value.toUpperCase(),
            telefono: document.getElementById("f-tel").value,
            estado: fase,
            total: ordenActiva.items.reduce((a, b) => a + b.valor, 0),
            empresaId,
            ultimaSincronizacion: serverTimestamp()
        };

        try {
            if (ordenActiva.id) {
                await updateDoc(doc(db, "ordenes", ordenActiva.id), payload);
            } else {
                payload.creadoEn = serverTimestamp();
                await addDoc(collection(db, "ordenes"), payload);
            }
            document.getElementById("nexus-console").classList.add("hidden");
            Swal.fire({ 
                title: 'SYNC COMPLETA', 
                text: 'Los datos han sido inyectados al ERP Nexus-X',
                icon: 'success', background: '#0d1117', color: '#fff', 
                confirmButtonColor: '#ea580c' 
            });
        } catch (e) { console.error("Error ERP Sync:", e); }
    };

    function vincularFases() {
        document.querySelectorAll('.nav-fase-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.nav-fase-btn').forEach(b => {
                    b.classList.remove('border-orange-500', 'bg-orange-500/10');
                    b.querySelector('span').classList.replace('text-white', 'text-slate-500');
                });
                btn.classList.add('border-orange-500', 'bg-orange-500/10');
                btn.querySelector('span').classList.replace('text-slate-500', 'text-white');
                faseActiva = btn.dataset.fase;
                escucharMisionesReales(faseActiva);
            };
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    }

    function escucharMisionesReales(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("grid-misiones");
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase), orderBy("ultimaSincronizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                return `
                <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] hover:border-orange-500/50 transition-all group relative">
                    <div class="flex justify-between items-start mb-6">
                        <h4 class="orbitron text-3xl font-black text-white italic tracking-tighter">${o.placa}</h4>
                        <div class="flex gap-2">
                             <button onclick="window.nexusEdit('${id}')" class="w-10 h-10 bg-white/5 rounded-full text-white hover:bg-orange-600 transition-all flex items-center justify-center"><i class="fas fa-pen-nib text-xs"></i></button>
                             <button onclick="window.nexusDel('${id}')" class="w-10 h-10 bg-white/5 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                        </div>
                    </div>
                    <p class="text-[11px] font-bold text-slate-500 uppercase mb-6 tracking-widest">${o.cliente}</p>
                    
                    <div class="bg-black/40 p-5 rounded-2xl flex justify-between items-center mb-8">
                        <span class="orbitron text-[8px] text-orange-500 uppercase font-black">Monto Misión</span>
                        <span class="orbitron text-xl font-black text-white">$${o.total.toLocaleString()}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button onclick='window.nexusWA("${id}")' class="py-4 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[9px] orbitron font-black hover:bg-emerald-500 hover:text-white transition-all uppercase">WhatsApp</button>
                        <button onclick='window.nexusPDF("${id}")' class="py-4 bg-white/5 text-white rounded-2xl text-[9px] orbitron font-black hover:bg-white hover:text-black transition-all uppercase">Reporte PDF</button>
                    </div>

                    <select onchange="window.nexusMover('${id}', this.value)" class="w-full mt-4 bg-black/50 border border-white/5 text-slate-500 p-3 rounded-xl text-[9px] orbitron outline-none">
                        <option value="" disabled selected>CAMBIAR FASE LOGÍSTICA</option>
                        <option value="COTIZACION">COTIZACIÓN</option>
                        <option value="EN_TALLER">EN TALLER</option>
                        <option value="DIAGNOSTICO">DIAGNÓSTICO</option>
                        <option value="REPARACION">REPARACIÓN</option>
                        <option value="LISTO">LISTO / ENTREGAR</option>
                    </select>
                </div>`;
            }).join("");
        });

        // FUNCIONES DE ACCIÓN GLOBAL
        window.nexusEdit = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            abrirConsola(snap.data().estado, { ...snap.data(), id });
        };
        window.nexusMover = async (id, nf) => {
            await updateDoc(doc(db, "ordenes", id), { estado: nf, ultimaSincronizacion: serverTimestamp() });
            hablar(`Vehículo transferido a ${nf}`);
        };
        window.nexusWA = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            enviarWhatsAppOrden(snap.data()); // Conecta con tu service de WhatsApp
        };
        window.nexusPDF = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            generarPDFOrden(snap.data()); // Conecta con tu service de PDF
        };
        window.nexusDel = async (id) => {
            const r = await Swal.fire({ title: '¿ELIMINAR MISIÓN?', text: "Se borrará del ERP", icon: 'warning', showCancelButton: true, background: '#0d1117', color: '#fff' });
            if(r.isConfirmed) await deleteDoc(doc(db, "ordenes", id));
        };
    }

    renderBase();
}
