/**
 * vehiculos.js - TallerPRO360 V17.0 🏎️
 * Nódulo de Inteligencia de Activos: Hoja de Vida & CRM Post-Venta
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { createDocument, saveLog } from "../services/dataService.js";

export default async function vehiculos(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let unsubscribe = null;

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-left-10 duration-1000 pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 px-4">
                <div class="relative group">
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        FLEET <span class="text-indigo-400">RADAR</span><span class="text-slate-700 text-xl">.V17</span>
                    </h1>
                    <div class="flex items-center gap-3 mt-4">
                        <span class="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.6em] orbitron">Historial Clínico de Unidades</p>
                    </div>
                </div>

                <button id="btnNuevoVehiculo" class="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase orbitron tracking-widest hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
                    + Vincular Vehículo
                </button>
            </header>

            <div class="px-4 mb-12">
                <div class="bg-slate-900/60 p-2 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl flex items-center px-8">
                    <i class="fas fa-search text-indigo-400 mr-4 text-xs"></i>
                    <input id="searchVehiculo" placeholder="RASTREAR POR PLACA O PROPIETARIO..." 
                           class="bg-transparent border-none outline-none text-[10px] w-full text-slate-300 orbitron tracking-widest uppercase py-4">
                </div>
            </div>

            <div id="gridVehiculos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
                </div>
        </div>
        `;

        document.getElementById("btnNuevoVehiculo").onclick = abrirModalVehiculo;
        document.getElementById("searchVehiculo").oninput = filtrarVehiculos;
        escucharVehiculos();
    };

    function escucharVehiculos() {
        if (unsubscribe) unsubscribe();
        
        const grid = document.getElementById("gridVehiculos");
        
        // CONSULTA A COLECCIÓN RAÍZ 'vehiculos'
        const q = query(
            collection(db, "vehiculos"),
            where("empresaId", "==", empresaId),
            orderBy("creadoEn", "desc")
        );

        unsubscribe = onSnapshot(q, (snap) => {
            if (snap.empty) {
                grid.innerHTML = `<div class="col-span-full py-40 text-center opacity-10"><i class="fas fa-car-side text-6xl mb-6"></i><p class="orbitron text-[10px] tracking-[0.5em] uppercase italic">Sin unidades registradas</p></div>`;
                return;
            }

            renderCards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }

    function renderCards(data) {
        const grid = document.getElementById("gridVehiculos");
        grid.innerHTML = data.map(v => `
            <div class="group relative bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/5 hover:border-indigo-500/40 transition-all duration-700">
                <div class="flex justify-between items-start mb-8">
                    <div class="bg-black px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                        <span class="text-xl font-black text-white orbitron italic tracking-tighter">${v.placa}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="verHojaVida('${v.id}')" class="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all">
                            <i class="fas fa-file-medical"></i>
                        </button>
                    </div>
                </div>

                <div class="space-y-4 mb-8">
                    <div>
                        <p class="text-[7px] text-slate-600 font-black orbitron uppercase tracking-widest">Marca / Modelo</p>
                        <p class="text-xs font-bold text-white uppercase">${v.marca} ${v.linea} <span class="text-indigo-400 ml-2">/ ${v.modelo}</span></p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex-1">
                            <p class="text-[7px] text-slate-600 font-black orbitron uppercase tracking-widest">Propietario</p>
                            <p class="text-[10px] font-medium text-slate-300 uppercase truncate">${v.clienteNombre || 'N/A'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[7px] text-slate-600 font-black orbitron uppercase tracking-widest">KM Actual</p>
                            <p class="text-[10px] font-black text-emerald-400 orbitron">${Number(v.kilometraje).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div class="pt-6 border-t border-white/5">
                    <button class="w-full py-3 bg-white/5 rounded-xl text-[8px] font-black text-slate-500 orbitron uppercase tracking-[0.2em] hover:text-indigo-400 hover:bg-indigo-500/5 transition-all">
                        Consultar Último Servicio
                    </button>
                </div>
            </div>
        `).join("");
    }

    async function abrirModalVehiculo() {
        const { value: f } = await window.Swal.fire({
            title: 'ALTA DE UNIDAD NEXUS',
            background: '#020617', 
            color: '#fff',
            customClass: { popup: 'rounded-[4rem] border border-white/10' },
            html: `
                <div class="space-y-4 p-4 mt-4 text-left">
                    <div class="grid grid-cols-2 gap-4">
                        <input id="v-pla" class="w-full bg-black/40 p-6 rounded-[2rem] text-indigo-400 font-black orbitron text-xl border border-white/5" placeholder="PLACA">
                        <input id="v-mod" type="number" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5" placeholder="AÑO/MODELO">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <input id="v-mar" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5" placeholder="MARCA">
                        <input id="v-lin" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5" placeholder="LÍNEA">
                    </div>
                    <input id="v-km" type="number" class="w-full bg-black/40 p-6 rounded-[2rem] text-emerald-400 font-black orbitron border border-white/5" placeholder="KILOMETRAJE ACTUAL">
                    <input id="v-cli" class="w-full bg-black/40 p-6 rounded-[2rem] text-white border border-white/5" placeholder="DNI/NOMBRE PROPIETARIO">
                </div>`,
            showCancelButton: true,
            confirmButtonText: 'DESPLEGAR FICHA',
            preConfirm: () => {
                const p = document.getElementById('v-pla').value;
                if(!p) return window.Swal.showValidationMessage("La placa es obligatoria");
                return {
                    empresaId: empresaId,
                    placa: p.toUpperCase(),
                    modelo: document.getElementById('v-mod').value,
                    marca: document.getElementById('v-mar').value.toUpperCase(),
                    linea: document.getElementById('v-lin').value.toUpperCase(),
                    kilometraje: Number(document.getElementById('v-km').value),
                    clienteNombre: document.getElementById('v-cli').value.toUpperCase(),
                    creadoEn: serverTimestamp()
                }
            }
        });

        if(f) { 
            await createDocument("vehiculos", f); 
            saveLog("REGISTRO_VEHICULO", { placa: f.placa });
            window.Swal.fire({ icon: 'success', title: 'UNIDAD VINCULADA', background: '#020617', color: '#fff' });
        }
    }

    renderLayout();
}
