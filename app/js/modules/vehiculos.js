/**
 * vehiculos.js - TallerPRO360 NEXUS-X V17.3 🏎️
 * NÚCLEO DE INTELIGENCIA DE ACTIVOS Y RADAR DE FLOTA
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function vehiculosModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let unsubscribe = null;
    let todosLosVehiculos = []; // CORRECCIÓN: Variable normalizada

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        FLEET <span class="text-indigo-400">RADAR</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.6em] text-slate-500 uppercase mt-4 italic font-bold">Infantería de Activos Móviles</p>
                </div>

                <button id="btnNuevoVehiculo" class="group relative px-10 py-5 bg-indigo-600 rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="relative orbitron text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                        <i class="fas fa-plus-circle"></i> Vincular Unidad
                    </span>
                </button>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                <div class="lg:col-span-3 bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 focus-within:border-indigo-500/50 transition-all shadow-2xl">
                    <i class="fas fa-satellite-dish text-indigo-500 animate-pulse"></i>
                    <input id="searchVehiculo" placeholder="RASTREAR POR PLACA, MARCA O PROPIETARIO..." 
                           class="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-800 orbitron font-black tracking-widest uppercase">
                </div>
                <div class="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-[2.5rem] text-center flex flex-col justify-center">
                    <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Unidades en Red</p>
                    <h4 id="countVehiculos" class="orbitron text-2xl font-black text-white italic">0</h4>
                </div>
            </div>

            <div id="gridVehiculos" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>

            <div id="vacio-vehiculos" class="hidden py-40 text-center opacity-20">
                <i class="fas fa-car-crash text-7xl mb-6"></i>
                <p class="orbitron text-[10px] uppercase tracking-[0.5em]">Sin rastro de activos en el sector</p>
            </div>
        </div>
        `;

        document.getElementById("btnNuevoVehiculo").onclick = abrirModalVehiculo;
        document.getElementById("searchVehiculo").oninput = filtrarVehiculos;
        escucharVehiculos();
    };

    function escucharVehiculos() {
        if (unsubscribe) unsubscribe();
        
        // APUNTANDO A LA RAÍZ: Sincronía con Ordenes y Pagos
        const q = query(
            collection(db, "vehiculos"),
            where("empresaId", "==", empresaId),
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            todosLosVehiculos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderCards(todosLosVehiculos);
            document.getElementById("countVehiculos").innerText = todosLosVehiculos.length;
        }, (error) => console.error("RADAR_JAMMED:", error));
    }

    function renderCards(data) {
        const grid = document.getElementById("gridVehiculos");
        const empty = document.getElementById("vacio-vehiculos");

        if (data.length === 0) {
            grid.innerHTML = "";
            empty.classList.remove("hidden");
            return;
        }

        empty.classList.add("hidden");
        grid.innerHTML = data.map(v => {
            const salud = v.kilometraje > 150000 ? 'text-red-500' : v.kilometraje > 80000 ? 'text-orange-500' : 'text-emerald-500';
            
            return `
            <div class="group bg-[#0d1117] p-8 rounded-[3.5rem] border border-white/5 hover:border-indigo-500/50 transition-all duration-500 relative overflow-hidden shadow-2xl">
                <div class="flex justify-between items-start mb-10 relative">
                    <div class="bg-black px-6 py-3 rounded-2xl border border-white/10 shadow-inner group-hover:border-indigo-500/30 transition-all">
                        <span class="text-2xl font-black text-white orbitron italic tracking-tighter">${v.placa}</span>
                    </div>
                </div>

                <div class="space-y-6 mb-10 relative">
                    <div>
                        <p class="text-[8px] text-slate-600 font-black orbitron uppercase mb-2 italic">Data Base</p>
                        <p class="text-sm font-black text-white uppercase italic tracking-tight">
                            ${v.marca || 'UNIDAD'} <span class="text-indigo-400">${v.linea || 'STARK'}</span>
                        </p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Model ${v.modelo || '---'}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p class="text-[7px] text-slate-600 font-black orbitron uppercase">Recorrido</p>
                            <p class="text-xs font-black ${salud} orbitron mt-1">${Number(v.kilometraje || 0).toLocaleString()} KM</p>
                        </div>
                        <div class="bg-black/40 p-4 rounded-2xl border border-white/5 text-right">
                            <p class="text-[7px] text-slate-600 font-black orbitron uppercase">Status</p>
                            <p class="text-[8px] font-black text-emerald-400 orbitron mt-1 uppercase italic">Operativo</p>
                        </div>
                    </div>

                    <div>
                        <p class="text-[7px] text-slate-600 font-black orbitron uppercase mb-1 italic">Vínculo:</p>
                        <p class="text-[10px] font-bold text-slate-300 uppercase truncate">${v.clienteNombre || 'Sujeto Desconocido'}</p>
                    </div>
                </div>

                <button class="w-full py-4 bg-white/[0.03] rounded-[1.5rem] border border-white/5 text-[9px] font-black text-slate-500 orbitron uppercase tracking-[0.3em] hover:bg-indigo-500 hover:text-white transition-all">
                    Acceder a Memoria Central
                </button>
            </div>
        `}).join("");
    }

    function filtrarVehiculos() {
        const queryStr = document.getElementById("searchVehiculo").value.toLowerCase();
        const filtrados = todosLosVehiculos.filter(v => 
            v.placa.toLowerCase().includes(queryStr) || 
            (v.marca && v.marca.toLowerCase().includes(queryStr)) ||
            (v.clienteNombre && v.clienteNombre.toLowerCase().includes(queryStr))
        );
        renderCards(filtrados);
    }

    async function abrirModalVehiculo() {
        const { value: form } = await window.Swal.fire({
            title: 'SINCRO DE ACTIVO',
            background: '#010409',
            color: '#fff',
            customClass: { 
                popup: 'rounded-[3rem] border border-indigo-500/20 shadow-2xl',
                confirmButton: 'bg-indigo-600 rounded-full orbitron font-black text-[10px] px-10 py-4',
                cancelButton: 'bg-transparent text-slate-500 orbitron font-black text-[10px]'
            },
            html: `
                <div class="space-y-6 p-6 text-left">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-[8px] text-indigo-400 font-black orbitron uppercase ml-4 italic">Tag Placa</label>
                            <input id="v-pla" class="w-full bg-black/60 p-6 rounded-3xl text-indigo-400 font-black orbitron text-2xl border border-white/5 outline-none focus:border-indigo-500" placeholder="BCE670">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[8px] text-slate-500 font-black orbitron uppercase ml-4 italic">Ciclo Año</label>
                            <input id="v-mod" type="number" class="w-full bg-black/60 p-6 rounded-3xl text-white font-black orbitron text-xl border border-white/5 outline-none focus:border-indigo-500" placeholder="2026">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <input id="v-mar" class="w-full bg-black/60 p-6 rounded-3xl text-white border border-white/5 outline-none font-bold uppercase" placeholder="MARCA">
                        <input id="v-lin" class="w-full bg-black/60 p-6 rounded-3xl text-white border border-white/5 outline-none font-bold uppercase" placeholder="LÍNEA">
                    </div>
                    <div class="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10">
                        <label class="text-[8px] text-indigo-400 font-black orbitron uppercase ml-2 italic">Odómetro (KM)</label>
                        <input id="v-km" type="number" class="w-full bg-transparent text-4xl font-black text-white orbitron outline-none mt-2" placeholder="0">
                    </div>
                    <input id="v-cli" class="w-full bg-black/60 p-6 rounded-3xl text-white border border-white/5 outline-none font-bold uppercase" placeholder="IDENTIDAD DEL CLIENTE">
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'INCORPORAR A FLOTA',
            preConfirm: () => {
                const placa = document.getElementById('v-pla').value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                if(!placa) return window.Swal.showValidationMessage("Placa requerida para rastreo");
                return {
                    placa: placa,
                    modelo: document.getElementById('v-mod').value,
                    marca: document.getElementById('v-mar').value.toUpperCase(),
                    linea: document.getElementById('v-lin').value.toUpperCase(),
                    kilometraje: Number(document.getElementById('v-km').value),
                    clienteNombre: document.getElementById('v-cli').value.toUpperCase(),
                    empresaId: empresaId,
                    creadoEn: serverTimestamp(),
                    status: "OPERATIVO"
                }
            }
        });

        if(form) { 
            try {
                await setDoc(doc(db, "vehiculos", form.placa), form);
                hablar(`Unidad ${form.placa} asimilada por Nexus X.`);
                window.Swal.fire({ icon: 'success', title: 'SINCRO COMPLETADA', background: '#010409', color: '#fff' });
            } catch (e) {
                console.error("SYS_ERR:", e);
                window.Swal.fire({ title: 'ERROR DE ENLACE', icon: 'error' });
            }
        }
    }

    renderLayout();
}
