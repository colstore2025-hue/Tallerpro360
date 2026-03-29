/**
 * ordenes.js - TallerPRO360 NEXUS-X V24.0 🛰️
 * SISTEMA UNIVERSAL: PERSISTENCIA TOTAL, COMISIONES Y LOGÍSTICA
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
    let ordenActiva = null; // Objeto persistente de la orden en edición
    let faseActual = 'EN_TALLER';
    let unsubscribe = null;

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 animate-in fade-in duration-1000 bg-[#010409] min-h-screen text-slate-100">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 border-b border-white/5 pb-8">
                <div>
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter">NEXUS<span class="text-orange-500">-X</span></h1>
                    <p class="text-[9px] text-slate-500 orbitron tracking-[0.4em]">SISTEMA DE DESPLIEGUE LOGÍSTICO SAS</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnPreVuelo" class="px-8 py-4 bg-blue-500/10 border border-blue-500/30 rounded-xl orbitron text-[10px] text-blue-400 font-black hover:bg-blue-500 hover:text-white transition-all">REPARACIÓN EXPRESS</button>
                    <button id="btnNuevaOrden" class="px-8 py-4 bg-orange-600 rounded-xl orbitron text-[10px] text-black font-black hover:bg-orange-400 transition-all shadow-lg shadow-orange-600/20">NUEVA MISIÓN (RECEPCIÓN)</button>
                </div>
            </header>

            <nav class="flex gap-2 overflow-x-auto no-scrollbar mb-8">
                ${['COTIZACION', 'EN_TALLER', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `
                    <button class="nav-fase shrink-0 px-6 py-4 rounded-xl border border-white/5 bg-[#0d1117] orbitron text-[9px] font-black text-slate-500 uppercase transition-all" data-fase="${f}">
                        ${f.replace('_', ' ')}
                    </button>
                `).join('')}
            </nav>

            <div id="workspace" class="hidden mb-12"></div>
            <div id="gridOrdenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"></div>
        </div>`;

        document.getElementById("btnNuevaOrden").onclick = () => abrirConsola('EN_TALLER');
        document.getElementById("btnPreVuelo").onclick = () => abrirConsola('COTIZACION');
        vincularNavegacion();
    };

    const abrirConsola = (fase, data = null) => {
        ordenActiva = data || { placa: '', cliente: '', telefono: '', items: [], gastos: [], fotos: [], estado: fase };
        const ws = document.getElementById("workspace");
        ws.classList.remove("hidden");
        
        ws.innerHTML = `
        <div class="bg-[#0d1117] border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div class="lg:col-span-4 space-y-6 border-r border-white/5 pr-8">
                    <div class="flex justify-between items-center">
                        <span class="orbitron text-orange-500 text-[10px] font-black">DATOS DE INGRESO</span>
                        <button id="btnDictarID" class="text-orange-500 hover:scale-110"><i class="fas fa-microphone"></i></button>
                    </div>
                    <input id="f-placa" value="${ordenActiva.placa}" class="w-full bg-black border border-white/10 p-4 rounded-xl text-2xl font-black text-white orbitron uppercase" placeholder="PLACA">
                    <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black border border-white/10 p-4 rounded-xl text-sm font-bold text-white uppercase" placeholder="NOMBRE CLIENTE">
                    <input id="f-tel" value="${ordenActiva.telefono}" class="w-full bg-black border border-white/10 p-4 rounded-xl text-sm font-bold text-white" placeholder="WHATSAPP">
                    
                    <div class="pt-4">
                        <span class="orbitron text-slate-500 text-[8px] block mb-2">EVIDENCIA FOTOGRÁFICA</span>
                        <div class="grid grid-cols-3 gap-2" id="galeriaRecepcion">
                            ${[0,1,2].map(i => `
                                <div class="aspect-square bg-black border border-white/5 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                    <input type="file" id="file-${i}" hidden onchange="window.handleFoto(${i}, this)">
                                    <img src="${ordenActiva.fotos[i] || ''}" id="img-${i}" class="w-full h-full object-cover ${ordenActiva.fotos[i] ? '' : 'hidden'}">
                                    <button onclick="document.getElementById('file-${i}').click()" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-camera"></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-6">
                    <div class="flex justify-between items-center">
                        <h3 class="orbitron text-white text-xs font-black italic">ESTACIÓN DE CARGOS</h3>
                        <div class="flex gap-2">
                            <button id="btnVoiceItems" class="px-4 py-2 bg-orange-600 rounded-lg text-black text-[10px] orbitron font-black"><i class="fas fa-microphone mr-2"></i>DICTAR CARGO</button>
                        </div>
                    </div>

                    <div id="listaItems" class="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"></div>

                    <div class="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                        <div class="flex justify-between items-center mb-4">
                            <span class="orbitron text-red-500 text-[9px] font-black italic">GASTOS ANEXOS (OPERATIVOS)</span>
                            <button id="btnAddGasto" class="text-red-500 text-xs"><i class="fas fa-plus-circle"></i></button>
                        </div>
                        <div id="listaGastos" class="space-y-2"></div>
                    </div>

                    <div class="flex justify-between items-end pt-4 border-t border-white/10">
                        <div>
                            <span class="orbitron text-[9px] text-slate-500 block mb-1">TOTAL FACTURACIÓN</span>
                            <h2 id="totalFinal" class="orbitron text-5xl font-black text-white">$ 0</h2>
                        </div>
                        <div class="flex gap-3">
                            <button id="btnSaveAll" class="px-10 py-5 bg-white text-black rounded-xl orbitron font-black text-[11px] hover:bg-orange-500 transition-all uppercase tracking-widest">Sincronizar Misión</button>
                            <button onclick="document.getElementById('workspace').classList.add('hidden')" class="px-6 py-5 text-slate-500 orbitron text-[9px] font-black">CANCELAR</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        setupEventsConsola(fase);
        actualizarTablas();
    };

    const setupEventsConsola = (fase) => {
        document.getElementById("btnVoiceItems").onclick = () => iniciarDictadoItems();
        document.getElementById("btnSaveAll").onclick = () => guardarMisionCompleta(fase);
        document.getElementById("btnAddGasto").onclick = () => {
            const n = prompt("Concepto de gasto:");
            const v = prompt("Valor:");
            if(n && v) { ordenActiva.gastos.push({ nombre: n, valor: parseInt(v) }); actualizarTablas(); }
        };
        window.handleFoto = (idx, input) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                ordenActiva.fotos[idx] = e.target.result;
                document.getElementById(`img-${idx}`).src = e.target.result;
                document.getElementById(`img-${idx}`).classList.remove('hidden');
            };
            reader.readAsDataURL(input.files[0]);
        };
    };

    const actualizarTablas = () => {
        const listItems = document.getElementById("listaItems");
        const listGastos = document.getElementById("listaGastos");
        const totalTxt = document.getElementById("totalFinal");

        listItems.innerHTML = (ordenActiva.items || []).map((it, idx) => `
            <div class="flex justify-between items-center p-4 bg-black border-l-4 ${it.tipo === 'ORO' ? 'border-amber-500' : 'border-emerald-500'} rounded-r-xl">
                <div>
                    <p class="text-[10px] font-black text-white uppercase">${it.nombre}</p>
                    <div class="flex gap-4 mt-1">
                        <span class="text-[8px] orbitron ${it.tipo === 'ORO' ? 'text-amber-500' : 'text-emerald-500'}">${it.tipo}</span>
                        ${it.tipo === 'ORO' ? `<span class="text-[8px] text-slate-500">TÉCNICO: ${it.tecnico || 'NO ASIGNADO'}</span>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <span class="orbitron font-black text-white text-sm">$${it.valor.toLocaleString()}</span>
                    <button onclick="window.delItemNexus(${idx})" class="text-red-500/30 hover:text-red-500"><i class="fas fa-trash"></i></button>
                </div>
            </div>`).join("");

        listGastos.innerHTML = (ordenActiva.gastos || []).map((g, idx) => `
            <div class="flex justify-between text-[10px] bg-red-500/5 p-2 rounded-lg">
                <span class="text-red-200 uppercase">${g.nombre}</span>
                <span class="font-black text-red-500">$${g.valor.toLocaleString()}</span>
            </div>`).join("");

        const total = ordenActiva.items.reduce((a, b) => a + b.valor, 0);
        totalTxt.innerText = `$ ${total.toLocaleString()}`;

        window.delItemNexus = (i) => { ordenActiva.items.splice(i, 1); actualizarTablas(); };
    };

    const iniciarDictadoItems = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.lang = 'es-CO';
        rec.onstart = () => hablar("Nexus escuchando cargo");
        rec.onresult = (e) => {
            const frase = e.results[0][0].transcript.toLowerCase();
            const valorMatch = frase.match(/\d+/g);
            if (!valorMatch) return;
            const valor = parseInt(valorMatch[0]) * (frase.includes("mil") ? 1000 : 1);
            const nombre = frase.replace(valorMatch[0], "").replace("mil", "").replace("pesos", "").trim().toUpperCase();
            
            if (frase.includes("oro") || frase.includes("mano de obra")) {
                const tec = prompt("¿Qué técnico realizó este trabajo?");
                ordenActiva.items.push({ tipo: 'ORO', nombre, valor, tecnico: tec });
            } else {
                ordenActiva.items.push({ tipo: 'REPUESTO', nombre, valor });
            }
            actualizarTablas();
            hablar("Cargado");
        };
        rec.start();
    };

    const guardarMisionCompleta = async (fase) => {
        ordenActiva.placa = document.getElementById("f-placa").value.toUpperCase();
        ordenActiva.cliente = document.getElementById("f-cliente").value.toUpperCase();
        ordenActiva.telefono = document.getElementById("f-tel").value;
        ordenActiva.estado = fase;
        ordenActiva.empresaId = empresaId;
        ordenActiva.ultimaActualizacion = serverTimestamp();

        if (ordenActiva.id) {
            await updateDoc(doc(db, "ordenes", ordenActiva.id), ordenActiva);
        } else {
            ordenActiva.creadoEn = serverTimestamp();
            await addDoc(collection(db, "ordenes"), ordenActiva);
        }
        document.getElementById("workspace").classList.add("hidden");
        Swal.fire({ title: 'DESPLIEGUE EXITOSO', icon: 'success', background: '#0d1117', color: '#fff' });
    };

    function vincularNavegacion() {
        document.querySelectorAll('.nav-fase').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.nav-fase').forEach(b => b.classList.remove('bg-orange-600', 'text-black', 'border-orange-600'));
                btn.classList.add('bg-orange-600', 'text-black', 'border-orange-600');
                faseActual = btn.dataset.fase;
                escucharMisiones(faseActual);
            };
        });
        document.querySelector('[data-fase="EN_TALLER"]').click();
    }

    function escucharMisiones(fase) {
        if (unsubscribe) unsubscribe();
        const grid = document.getElementById("gridOrdenes");
        const q = query(collection(db, "ordenes"), 
            where("empresaId", "==", empresaId), 
            where("estado", "==", fase), 
            orderBy("ultimaActualizacion", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            grid.innerHTML = snap.docs.map(docSnap => {
                const o = docSnap.data();
                const id = docSnap.id;
                return `
                <div class="bg-[#0d1117] border border-white/5 p-6 rounded-[2rem] hover:border-orange-500/40 transition-all group relative overflow-hidden">
                    <div class="flex justify-between items-start mb-4">
                        <span class="orbitron text-2xl font-black text-white italic">${o.placa}</span>
                        <div class="flex gap-2">
                             <button onclick="window.editarNexus('${id}')" class="w-8 h-8 bg-white/5 rounded-full text-white hover:bg-orange-600 transition-all"><i class="fas fa-pen text-[10px]"></i></button>
                             <button onclick="window.borrarNexus('${id}')" class="w-8 h-8 bg-white/5 rounded-full text-red-500"><i class="fas fa-trash text-[10px]"></i></button>
                        </div>
                    </div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase mb-4">${o.cliente}</p>
                    <div class="bg-black p-4 rounded-xl flex justify-between mb-6">
                        <span class="orbitron text-[8px] text-orange-500 uppercase">Total</span>
                        <span class="orbitron text-lg font-black text-white">$${o.items.reduce((a,b)=>a+b.valor, 0).toLocaleString()}</span>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick='window.printNexus("${id}")' class="w-full py-3 bg-white/5 text-[9px] orbitron font-black rounded-lg hover:bg-white hover:text-black">IMPRIMIR / PDF</button>
                        <button onclick='window.waNexus("${id}")' class="w-full py-3 bg-emerald-600/10 text-emerald-500 text-[9px] orbitron font-black rounded-lg hover:bg-emerald-600 hover:text-white">ENVIAR WHATSAPP</button>
                    </div>
                    
                    <select onchange="window.moverNexus('${id}', this.value)" class="w-full mt-4 bg-black border border-white/5 text-[9px] orbitron p-2 rounded-lg text-slate-500">
                        <option value="" disabled selected>TRANSFERIR A...</option>
                        <option value="COTIZACION">COTIZACIÓN</option>
                        <option value="EN_TALLER">EN TALLER</option>
                        <option value="DIAGNOSTICO">DIAGNÓSTICO</option>
                        <option value="REPARACION">REPARACIÓN</option>
                        <option value="LISTO">LISTO / ENTREGAR</option>
                    </select>
                </div>`;
            }).join("");
        });

        window.editarNexus = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            abrirConsola(snap.data().estado, { ...snap.data(), id });
        };
        window.moverNexus = async (id, nf) => {
            await updateDoc(doc(db, "ordenes", id), { estado: nf, ultimaActualizacion: serverTimestamp() });
            hablar(`Misión transferida a ${nf}`);
        };
        window.borrarNexus = async (id) => {
            if(confirm("¿Eliminar registro?")) await deleteDoc(doc(db, "ordenes", id));
        };
        window.printNexus = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            generarPDFOrden(snap.data());
        };
        window.waNexus = async (id) => {
            const snap = await getDoc(doc(db, "ordenes", id));
            enviarWhatsAppOrden(snap.data());
        };
    }

    renderBase();
}
