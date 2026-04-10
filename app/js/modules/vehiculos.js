/**
 * vehiculos.js - TallerPRO360 NEXUS-X V18.5 🏎️
 * NÚCLEO DE INTELIGENCIA DE ACTIVOS Y RADAR DE FLOTA (EXPEDIENTE TÉCNICO & CRM)
 * Diseñado por: William Jeffry Urquijo & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function vehiculosModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let unsubscribe = null;
    let todosLosVehiculos = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_#6366f1]"></div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        FLEET <span class="text-indigo-400">RADAR</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Expediente Técnico & Post-Servicio</p>
                </div>

                <div class="flex gap-4">
                    <button id="btnNuevoVehiculo" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                        <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <i class="fas fa-plus-circle"></i> VINCULAR UNIDAD
                        </span>
                    </button>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                <div class="lg:col-span-3 bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 focus-within:border-indigo-500/50 transition-all shadow-xl">
                    <i class="fas fa-satellite-dish text-indigo-500 animate-pulse"></i>
                    <input id="searchVehiculo" placeholder="RASTREAR POR PLACA, MARCA O PROPIETARIO..." 
                           class="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-800 orbitron font-black tracking-widest uppercase">
                </div>
                <div class="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-[2.5rem] text-center shadow-lg">
                    <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Unidades en Red</p>
                    <h4 id="countVehiculos" class="orbitron text-2xl font-black text-white italic">0</h4>
                </div>
            </div>

            <div id="gridVehiculos" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>

            <div id="vacio-vehiculos" class="hidden py-40 text-center opacity-20">
                <i class="fas fa-car-crash text-7xl mb-6"></i>
                <p class="orbitron text-[10px] uppercase tracking-[0.5em]">Sin rastro de activos en el sector</p>
            </div>
        </div>`;

        document.getElementById("btnNuevoVehiculo").onclick = abrirModalVehiculo;
        document.getElementById("searchVehiculo").oninput = filtrarVehiculos;
        escucharVehiculos();
    };

    function escucharVehiculos() {
        if (unsubscribe) unsubscribe();
        if (!empresaId) return;

        const q = query(
            collection(db, "vehiculos"),
            where("empresaId", "==", empresaId)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            todosLosVehiculos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderCards(todosLosVehiculos);
            document.getElementById("countVehiculos").innerText = todosLosVehiculos.length;
        });
    }

    function renderCards(data) {
        const grid = document.getElementById("gridVehiculos");
        const vacio = document.getElementById("vacio-vehiculos");
        if (!grid) return;

        if (data.length === 0) {
            grid.innerHTML = "";
            vacio.classList.remove("hidden");
            return;
        }
        
        vacio.classList.add("hidden");
        grid.innerHTML = data.map(v => {
            const salud = v.kilometraje > 100000 ? 'text-red-500' : 'text-emerald-500';
            const esGarantia = v.status?.includes("GARANTIA") || v.estado === "GARANTIA";
            
            return `
            <div class="group bg-[#0d1117] p-8 rounded-[3.5rem] border ${esGarantia ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-white/5'} hover:border-indigo-500 transition-all duration-500 relative overflow-hidden shadow-2xl">
                <div class="flex justify-between items-start mb-10">
                    <div class="bg-black px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
                        <span class="text-2xl font-black text-white orbitron italic tracking-tighter">${v.placa}</span>
                    </div>
                    ${esGarantia ? '<span class="animate-pulse text-[7px] bg-orange-500 text-black px-3 py-1 rounded-full font-black orbitron">RE-INGRESO</span>' : ''}
                </div>

                <div class="space-y-6 mb-10">
                    <div>
                        <p class="text-[8px] text-slate-600 font-black orbitron uppercase mb-1 italic">Asset Tag / Línea</p>
                        <p class="text-sm font-black text-white uppercase italic">
                            ${v.marca || 'GENERIC'} <span class="text-indigo-400">${v.linea || ''}</span>
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p class="text-[7px] text-slate-600 font-black orbitron uppercase">Recorrido</p>
                            <p class="text-xs font-black ${salud} orbitron mt-1">${Number(v.kilometraje || 0).toLocaleString()} KM</p>
                        </div>
                        <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p class="text-[7px] text-slate-600 font-black orbitron uppercase italic">Último Técnico:</p>
                            <p class="text-[9px] font-black text-white truncate">${v.ultimoServicio?.tecnico || 'N/A'}</p>
                        </div>
                    </div>

                    <div class="border-t border-white/5 pt-4">
                        <p class="text-[8px] text-slate-600 font-black orbitron uppercase mb-1 italic">Propietario / CRM:</p>
                        <p class="text-[10px] font-bold text-slate-300 uppercase truncate">${v.clienteNombre || 'DESCONOCIDO'}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <button onclick="window.nexus_ver_memoria('${v.placa}')" class="py-4 bg-white/[0.03] rounded-[1.5rem] border border-white/5 text-[8px] font-black text-slate-500 orbitron uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                        EXPEDIENTE
                    </button>
                    <button onclick="window.nexus_eliminar_vehiculo('${v.placa}')" class="py-4 bg-red-500/5 rounded-[1.5rem] border border-red-500/10 text-[8px] font-black text-red-900 orbitron hover:bg-red-600 hover:text-white transition-all">
                        BAJA
                    </button>
                </div>
            </div>`;
        }).join("");
    }

    // --- 🚀 NÚCLEO DE MEMORIA (EDICIÓN & CRM SYNC) ---
    window.nexus_ver_memoria = async (placa) => {
        const v = todosLosVehiculos.find(x => x.placa === placa);
        if (!v) return;

        const { value: formValues } = await window.Swal.fire({
            title: `<span class="orbitron italic">EXPEDIENTE ${placa}</span>`,
            width: '850px',
            background: '#010409',
            color: '#fff',
            customClass: { popup: 'rounded-[3rem] border border-indigo-500/30 shadow-2xl' },
            html: `
                <div class="grid lg:grid-cols-2 gap-8 p-6 text-left">
                    <div class="space-y-6">
                        <h4 class="text-indigo-400 orbitron text-[10px] font-black uppercase tracking-widest border-b border-indigo-500/20 pb-2">Información Técnica</h4>
                        <div class="space-y-4">
                            <div class="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label class="text-[8px] text-slate-500 uppercase font-black">Marca</label>
                                <input id="edit-mar" class="w-full bg-transparent text-white font-bold outline-none uppercase border-b border-white/10" value="${v.marca || ''}">
                                <label class="text-[8px] text-slate-500 uppercase font-black mt-4 block">Línea / Modelo</label>
                                <input id="edit-lin" class="w-full bg-transparent text-indigo-400 font-bold outline-none uppercase" value="${v.linea || ''}">
                            </div>
                            <div class="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label class="text-[8px] text-slate-500 uppercase font-black">Kilometraje Actual</label>
                                <input id="edit-km" type="number" class="w-full bg-transparent text-xl text-emerald-400 font-black orbitron outline-none" value="${v.kilometraje || 0}">
                            </div>
                        </div>
                        
                        <h4 class="text-emerald-400 orbitron text-[10px] font-black uppercase tracking-widest border-b border-emerald-500/20 pb-2 mt-8">Vínculo Propietario (CRM)</h4>
                        <div class="space-y-4">
                            <input id="edit-cli" class="w-full bg-black/40 p-4 rounded-2xl text-white font-bold border border-white/5 outline-none uppercase" placeholder="Nombre Completo" value="${v.clienteNombre || ''}">
                            <input id="edit-tel" class="w-full bg-black/40 p-4 rounded-2xl text-emerald-400 font-bold border border-white/5 outline-none" placeholder="WhatsApp (57300...)" value="${v.clienteTelefono || ''}">
                        </div>
                    </div>

                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <h4 class="text-purple-400 orbitron text-[10px] font-black uppercase tracking-widest border-b border-purple-500/20 pb-2">Bitácora de Misiones</h4>
                        <div class="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            <div class="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <p class="text-[8px] text-slate-600 uppercase font-black italic">Último Servicio:</p>
                                <p class="text-xs text-slate-300 italic mt-1">"${v.ultimoServicio?.descripcion || 'No hay misiones registradas.'}"</p>
                                <div class="grid grid-cols-2 gap-4 mt-4 border-t border-white/5 pt-3">
                                    <div>
                                        <p class="text-[7px] text-slate-600 uppercase font-black">Operador:</p>
                                        <p class="text-[10px] text-white font-black orbitron">${v.ultimoServicio?.tecnico || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="text-[7px] text-slate-600 uppercase font-black">Fecha:</p>
                                        <p class="text-[10px] text-white font-bold">${v.ultimoServicio?.fecha ? new Date(v.ultimoServicio.fecha).toLocaleDateString() : '---'}</p>
                                    </div>
                                </div>
                            </div>
                            <button onclick="location.hash='#ordenes'" class="w-full py-4 bg-indigo-500 text-black orbitron text-[9px] font-black rounded-2xl hover:bg-white transition-all">INICIAR NUEVA MISIÓN</button>
                        </div>
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'ACTUALIZAR NODO',
            confirmButtonColor: '#6366f1',
            preConfirm: () => {
                const placaLimpia = placa.toUpperCase().trim();
                return {
                    placa: placaLimpia,
                    marca: document.getElementById('edit-mar').value.toUpperCase(),
                    linea: document.getElementById('edit-lin').value.toUpperCase(),
                    kilometraje: Number(document.getElementById('edit-km').value),
                    clienteNombre: document.getElementById('edit-cli').value.toUpperCase(),
                    clienteTelefono: document.getElementById('edit-tel').value.replace(/\s+/g, '')
                }
            }
        });

        if (formValues) {
            try {
                // 1. Actualizar Activo
                await updateDoc(doc(db, "vehiculos", placa), {
                    ...formValues,
                    ultimaActualizacion: serverTimestamp()
                });

                // 2. Sincronizar CRM (Directorio de Clientes)
                const clienteId = formValues.clienteTelefono || `CLI_${Date.now()}`;
                await setDoc(doc(db, "clientes", clienteId), {
                    nombre: formValues.clienteNombre,
                    telefono: formValues.clienteTelefono,
                    ultima_placa: formValues.placa,
                    empresaId,
                    ultimaActualizacion: serverTimestamp()
                }, { merge: true });

                hablar(`Expediente de ${placa} actualizado.`);
                Swal.fire({ icon: 'success', title: 'SINCRO OK', background: '#010409', color: '#fff' });
            } catch (e) {
                Swal.fire('ERROR', 'Fallo en la sincronía del núcleo.', 'error');
            }
        }
    };

    // --- 🛠️ MODAL DE CREACIÓN RÁPIDA ---
    async function abrirModalVehiculo() {
        const { value: placa } = await Swal.fire({
            title: 'IDENTIFICAR NUEVO ACTIVO',
            input: 'text',
            inputPlaceholder: 'PLACA (SIN ESPACIOS)',
            background: '#010409',
            color: '#fff',
            confirmButtonText: 'INICIAR RASTREO',
            confirmButtonColor: '#6366f1',
            inputAttributes: { autocapitalize: 'characters' }
        });

        if (placa) {
            const placaLimpia = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const docRef = doc(db, "vehiculos", placaLimpia);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                hablar(`El activo ${placaLimpia} ya existe en el radar.`);
                window.nexus_ver_memoria(placaLimpia);
            } else {
                await setDoc(docRef, {
                    placa: placaLimpia,
                    empresaId,
                    creadoEn: serverTimestamp(),
                    kilometraje: 0,
                    status: 'NUEVO_INGRESO'
                });
                window.nexus_ver_memoria(placaLimpia);
            }
        }
    }

    window.nexus_eliminar_vehiculo = async (placa) => {
        const confirm = await Swal.fire({
            title: '¿DAR DE BAJA ACTIVO?',
            text: `Se eliminará el expediente de ${placa} del radar activo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            background: '#010409',
            color: '#fff'
        });

        if (confirm.isConfirmed) {
            await deleteDoc(doc(db, "vehiculos", placa));
            hablar(`Activo ${placa} fuera del radar.`);
        }
    };

    function filtrarVehiculos() {
        const queryStr = document.getElementById("searchVehiculo").value.toLowerCase();
        const filtrados = todosLosVehiculos.filter(v => 
            v.placa.toLowerCase().includes(queryStr) || 
            (v.marca && v.marca.toLowerCase().includes(queryStr)) ||
            (v.clienteNombre && v.clienteNombre.toLowerCase().includes(queryStr))
        );
        renderCards(filtrados);
    }

    state.cleanup = () => { 
        if (unsubscribe) unsubscribe(); 
        delete window.nexus_ver_memoria; 
        delete window.nexus_eliminar_vehiculo;
    };
    renderLayout();
}
