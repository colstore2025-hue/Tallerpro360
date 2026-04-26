/**
 * vehiculos.js - TallerPRO360 NEXUS-X V19.0 🏎️
 * NÚCLEO DE INTELIGENCIA DE ACTIVOS Y AUDITORÍA DE RECEPCIÓN
 * Protocolo: Fleet Sentinel & CRM Bridge
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function vehiculosModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let unsubscribe = null;
    let todosLosVehiculos = [];

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in slide-in-from-top-4 duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_25px_#6366f1]"></div>
                    <h1 class="orbitron text-7xl font-black italic tracking-tighter text-white leading-none uppercase">
                        FLEET <span class="text-indigo-500">SENTINEL</span><span class="text-slate-800 text-2xl">.X</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                        <p class="text-[10px] orbitron tracking-[0.6em] text-slate-400 uppercase italic font-black">Telemetría de Activos & Auditoría de Ingreso</p>
                    </div>
                </div>

                <div class="flex gap-4">
                    <button id="btnNuevoVehiculo" class="group relative px-12 py-6 bg-white text-black rounded-[2.5rem] overflow-hidden transition-all hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                            <i class="fas fa-microchip"></i> VINCULAR_NODO
                        </span>
                    </button>
                </div>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
                <div class="md:col-span-2 lg:col-span-3 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 flex items-center gap-8 focus-within:border-indigo-500/50 transition-all shadow-2xl">
                    <div class="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                        <i class="fas fa-search-location text-2xl"></i>
                    </div>
                    <input id="searchVehiculo" placeholder="ESCANEAR PLACA O IDENTIFICAR PROPIETARIO..." 
                           class="bg-transparent border-none outline-none text-md w-full text-white placeholder:text-slate-800 orbitron font-black tracking-[0.2em] uppercase">
                </div>
                <div class="bg-gradient-to-br from-indigo-900/20 to-transparent border border-indigo-500/20 p-8 rounded-[3rem] text-center">
                    <p class="text-[9px] text-indigo-400 font-black uppercase mb-1 orbitron">Activos en Radar</p>
                    <h4 id="countVehiculos" class="orbitron text-4xl font-black text-white italic leading-none">0</h4>
                </div>
            </div>

            <div id="gridVehiculos" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10"></div>

            <div id="vacio-vehiculos" class="hidden py-40 text-center">
                <div class="h-32 w-32 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                    <i class="fas fa-satellite text-4xl text-slate-700 animate-pulse"></i>
                </div>
                <p class="orbitron text-[12px] text-slate-600 uppercase tracking-[0.5em] font-black">Sin señales de activos detectadas</p>
            </div>
        </div>`;

        document.getElementById("btnNuevoVehiculo").onclick = abrirModalVehiculo;
        document.getElementById("searchVehiculo").oninput = filtrarVehiculos;
        escucharVehiculos();
    };

    function escucharVehiculos() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "vehiculos"), where("empresaId", "==", empresaId));
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
            const km = Number(v.kilometraje || 0);
            const colorKm = km > 80000 ? 'text-red-500' : 'text-emerald-400';
            const esGarantia = v.estado === "GARANTIA" || v.status === "RE-INGRESO";
            
            return `
            <div class="group bg-[#0d1117] p-10 rounded-[4rem] border ${esGarantia ? 'border-orange-500/40 bg-orange-500/[0.02]' : 'border-white/5'} hover:border-indigo-500/50 transition-all duration-700 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                
                <div class="flex justify-between items-start mb-10">
                    <div class="relative">
                        <div class="bg-black px-8 py-4 rounded-[1.5rem] border border-white/10 shadow-2xl group-hover:border-indigo-500/50 transition-colors">
                            <span class="text-3xl font-black text-white orbitron italic tracking-tighter leading-none">${v.placa}</span>
                        </div>
                        <div class="absolute -bottom-2 -right-2 h-6 w-6 bg-indigo-500 rounded-full border-4 border-[#0d1117] flex items-center justify-center">
                            <i class="fas fa-check text-[8px] text-black font-black"></i>
                        </div>
                    </div>
                    ${esGarantia ? '<span class="animate-pulse bg-orange-500 text-black px-4 py-1.5 rounded-xl text-[8px] font-black orbitron">GARANTÍA_ACTIVA</span>' : ''}
                </div>

                <div class="space-y-8 mb-10">
                    <div class="flex items-center gap-4">
                        <div class="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500">
                            <i class="fas fa-car-side text-xl"></i>
                        </div>
                        <div>
                            <p class="text-[9px] text-slate-600 font-black orbitron uppercase leading-none mb-1">Asset Line</p>
                            <p class="text-md font-black text-white uppercase italic tracking-tight">
                                ${v.marca || 'NEXUS'} <span class="text-indigo-400 font-medium">${v.linea || 'BASE'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-black/60 p-5 rounded-[2rem] border border-white/5">
                            <p class="text-[8px] text-slate-600 font-black orbitron uppercase mb-1">Odómetro</p>
                            <p class="text-sm font-black ${colorKm} orbitron">${km.toLocaleString()} <span class="text-[8px]">KM</span></p>
                        </div>
                        <div class="bg-black/60 p-5 rounded-[2rem] border border-white/5 text-right">
                            <p class="text-[8px] text-slate-600 font-black orbitron uppercase mb-1">Combustible</p>
                            <p class="text-sm font-black text-indigo-400 orbitron">${v.nivelCombustible || '---'}</p>
                        </div>
                    </div>

                    <div class="pt-6 border-t border-white/5">
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px]">
                                <i class="fas fa-user-shield"></i>
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-[8px] text-slate-600 font-black orbitron uppercase leading-none mb-1">Operator Bridge</p>
                                <p class="text-[11px] font-bold text-slate-300 uppercase truncate">${v.clienteNombre || 'CLIENTE_GENÉRICO'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <button onclick="window.nexus_ver_memoria('${v.placa}')" class="py-5 bg-indigo-500 text-black rounded-[2rem] text-[9px] font-black orbitron uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">
                        EXPEDIENTE_X
                    </button>
                    <button onclick="window.nexus_eliminar_vehiculo('${v.placa}')" class="py-5 bg-red-500/10 rounded-[2rem] border border-red-500/20 text-[9px] font-black text-red-500 orbitron hover:bg-red-600 hover:text-white transition-all">
                        DE-LINK
                    </button>
                </div>
            </div>`;
        }).join("");
    }

    // --- 🚀 NÚCLEO DE EXPEDIENTE & AUDITORÍA ---
    window.nexus_ver_memoria = async (placa) => {
        const v = todosLosVehiculos.find(x => x.placa === placa);
        if (!v) return;

        const { value: formValues } = await window.Swal.fire({
            title: `<span class="orbitron italic text-2xl font-black">TECH_FILE: ${placa}</span>`,
            width: '1000px',
            background: '#010409',
            color: '#fff',
            customClass: { popup: 'rounded-[4rem] border border-indigo-500/30 shadow-2xl' },
            html: `
                <div class="grid lg:grid-cols-2 gap-10 p-8 text-left">
                    <div class="space-y-8">
                        <section>
                            <h4 class="text-indigo-400 orbitron text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <span class="h-1 w-8 bg-indigo-500"></span> 01. Especificaciones
                            </h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                                    <label class="text-[8px] text-slate-500 uppercase font-black orbitron">Marca / Constructor</label>
                                    <input id="edit-mar" class="w-full bg-transparent text-white font-bold outline-none uppercase py-2" value="${v.marca || ''}">
                                </div>
                                <div class="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                                    <label class="text-[8px] text-slate-500 uppercase font-black orbitron">Línea / Modelo</label>
                                    <input id="edit-lin" class="w-full bg-transparent text-indigo-400 font-bold outline-none uppercase py-2" value="${v.linea || ''}">
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 class="text-emerald-400 orbitron text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <span class="h-1 w-8 bg-emerald-500"></span> 02. Auditoría de Ingreso
                            </h4>
                            <div class="bg-black/40 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
                                <div>
                                    <label class="text-[8px] text-slate-500 uppercase font-black orbitron">Telemetría (Km)</label>
                                    <input id="edit-km" type="number" class="w-full bg-transparent text-2xl text-emerald-400 font-black orbitron outline-none py-2" value="${v.kilometraje || 0}">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-[8px] text-slate-500 uppercase font-black orbitron">Combustible</label>
                                        <select id="edit-fuel" class="w-full bg-slate-900 text-white p-3 rounded-xl border-none outline-none orbitron text-[10px]">
                                            <option value="1/4" ${v.nivelCombustible==='1/4'?'selected':''}>1/4 (E)</option>
                                            <option value="1/2" ${v.nivelCombustible==='1/2'?'selected':''}>1/2 (MED)</option>
                                            <option value="3/4" ${v.nivelCombustible==='3/4'?'selected':''}>3/4 (HIGH)</option>
                                            <option value="FULL" ${v.nivelCombustible==='FULL'?'selected':''}>FULL (F)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-[8px] text-slate-500 uppercase font-black orbitron">Estado Físico</label>
                                        <select id="edit-status" class="w-full bg-slate-900 text-white p-3 rounded-xl border-none outline-none orbitron text-[10px]">
                                            <option value="OPTIMO" ${v.estado==='OPTIMO'?'selected':''}>OPTIMO</option>
                                            <option value="RE-INGRESO" ${v.estado==='RE-INGRESO'?'selected':''}>RE-INGRESO</option>
                                            <option value="GARANTIA" ${v.estado==='GARANTIA'?'selected':''}>GARANTÍA</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
                        <div class="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        
                        <h4 class="text-indigo-400 orbitron text-[10px] font-black uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4">Operator Data (CRM Sync)</h4>
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label class="text-[8px] text-slate-600 font-black orbitron uppercase">Nombre del Responsable</label>
                                <input id="edit-cli" class="w-full bg-black/60 p-5 rounded-2xl text-white font-bold border border-white/5 outline-none uppercase focus:border-indigo-500" value="${v.clienteNombre || ''}">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[8px] text-slate-600 font-black orbitron uppercase">WhatsApp de Contacto</label>
                                <input id="edit-tel" class="w-full bg-black/60 p-5 rounded-2xl text-emerald-400 font-black border border-white/5 outline-none focus:border-emerald-500" value="${v.clienteTelefono || ''}">
                            </div>
                            
                            <div class="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10 mt-10">
                                <p class="text-[8px] text-indigo-400 orbitron font-black mb-2 uppercase italic">Status del Servicio Anterior:</p>
                                <p class="text-xs text-slate-400 italic leading-relaxed">"${v.ultimoServicio?.descripcion || 'Sin registros en bitácora.'}"</p>
                                <div class="flex justify-between mt-4 border-t border-white/5 pt-4">
                                    <span class="text-[9px] orbitron text-slate-500 font-black uppercase">Técnico: ${v.ultimoServicio?.tecnico || 'N/A'}</span>
                                    <span class="text-[9px] orbitron text-indigo-400 font-black">${v.ultimoServicio?.fecha ? new Date(v.ultimoServicio.fecha).toLocaleDateString() : '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'SYNC_NEXUS_CLOUD',
            confirmButtonColor: '#6366f1',
            preConfirm: () => {
                return {
                    placa: placa.toUpperCase(),
                    marca: document.getElementById('edit-mar').value.toUpperCase(),
                    linea: document.getElementById('edit-lin').value.toUpperCase(),
                    kilometraje: Number(document.getElementById('edit-km').value),
                    nivelCombustible: document.getElementById('edit-fuel').value,
                    estado: document.getElementById('edit-status').value,
                    clienteNombre: document.getElementById('edit-cli').value.toUpperCase(),
                    clienteTelefono: document.getElementById('edit-tel').value.replace(/\s+/g, '')
                }
            }
        });

        if (formValues) {
            try {
                // 1. Actualización Atómica de Vehículo
                await updateDoc(doc(db, "vehiculos", placa), {
                    ...formValues,
                    ultimaSincronizacion: serverTimestamp()
                });

                // 2. Puente CRM (Actualización Automática de Cliente)
                if(formValues.clienteTelefono) {
                    const cliRef = doc(db, "clientes", formValues.clienteTelefono);
                    await setDoc(cliRef, {
                        nombre: formValues.clienteNombre,
                        telefono: formValues.clienteTelefono,
                        empresaId,
                        ultima_placa: formValues.placa,
                        last_update: serverTimestamp()
                    }, { merge: true });
                }

                hablar(`Sistema actualizado. Activo ${placa} sincronizado con la red.`);
                Swal.fire({ icon: 'success', title: 'SINCRO_EXITOSA', background: '#010409', color: '#fff', confirmButtonColor: '#6366f1' });
            } catch (e) {
                Swal.fire('CRITICAL_ERROR', 'Fallo en la escritura del núcleo.', 'error');
            }
        }
    };

    async function abrirModalVehiculo() {
        const { value: placa } = await Swal.fire({
            title: 'IDENTIFICAR NUEVA UNIDAD',
            input: 'text',
            inputPlaceholder: 'INGRESE PLACA (P-302, XYZ123...)',
            background: '#010409',
            color: '#fff',
            confirmButtonText: 'RASTREAR',
            confirmButtonColor: '#6366f1',
            inputAttributes: { autocapitalize: 'characters' }
        });

        if (placa) {
            const placaLimpia = placa.toUpperCase().trim();
            const snap = await getDoc(doc(db, "vehiculos", placaLimpia));

            if (snap.exists()) {
                hablar(`La unidad ${placaLimpia} ya reside en la memoria activa.`);
                window.nexus_ver_memoria(placaLimpia);
            } else {
                await setDoc(doc(db, "vehiculos", placaLimpia), {
                    placa: placaLimpia,
                    empresaId,
                    creadoEn: serverTimestamp(),
                    kilometraje: 0,
                    estado: 'OPTIMO'
                });
                window.nexus_ver_memoria(placaLimpia);
            }
        }
    }

    window.nexus_eliminar_vehiculo = async (placa) => {
        const confirm = await Swal.fire({
            title: '¿ELIMINAR ACTIVO?',
            text: `Se borrará el expediente técnico de ${placa}. Esta acción es irreversible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            background: '#010409',
            color: '#fff'
        });

        if (confirm.isConfirmed) {
            await deleteDoc(doc(db, "vehiculos", placa));
            hablar(`Unidad ${placa} dada de baja.`);
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
