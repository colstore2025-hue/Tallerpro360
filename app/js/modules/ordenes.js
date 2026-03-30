/**
 * ordenes.js - TallerPRO360 NEXUS-X V30.1 🛰️
 * REPARACIÓN DE PERMISOS Y MOTOR DE IMPRESIÓN EXTERNO
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- MOTORES DE INTELIGENCIA ---
import { VoiceMechanicAI } from "../ai/voiceMechanicAI.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let unsubscribe = null;
    let ordenActiva = null;

    // --- INTERFAZ BASE ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-slate-100 font-sans animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-6 mb-12 border-b border-white/5 pb-10">
                <div class="space-y-2">
                    <div class="flex items-center gap-4">
                        <div class="h-3 w-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_#f97316]"></div>
                        <h1 class="orbitron text-5xl font-black italic tracking-tighter text-white">NEXUS_<span class="text-orange-500">OT</span></h1>
                    </div>
                    <p class="text-[10px] orbitron text-slate-500 tracking-[0.4em]">SISTEMA DE FUERZA OPERACIONAL V30.1</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnNewMission" class="px-10 py-4 bg-orange-600 rounded-2xl orbitron text-[11px] font-black text-black hover:scale-105 transition-all shadow-2xl">INGRESAR VEHÍCULO</button>
                </div>
            </header>

            <nav id="pipeline-nav" class="flex gap-4 mb-12 overflow-x-auto no-scrollbar pb-4">
                ${['COTIZACION', 'INGRESO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab flex-1 min-w-[200px] p-8 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group" data-fase="${fase}">
                        <div class="flex justify-between items-start">
                            <span class="orbitron text-[9px] text-slate-500 group-hover:text-orange-500">${fase}</span>
                        </div>
                        <h3 id="count-${fase}" class="fase-count text-4xl font-black mt-4 text-white">0</h3>
                        <div class="h-1 w-0 bg-orange-500 mt-4 group-hover:w-full transition-all duration-500"></div>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409] p-4 lg:p-10 overflow-y-auto animate-in slide-in-from-bottom-10"></div>
        </div>`;

        vincularNavegacion();
        cargarGrid();
    };

    const abrirTerminal = async (id = null, faseDefault = 'INGRESO') => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: faseDefault,
                items: [], 
                costos_totales: { venta: 0, costo_taller: 0, comision_staff: 0, utilidad: 0 },
                evidencia: { audio_diagnostico: null }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto space-y-8 pb-20">
            <div class="flex justify-between items-center bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5">
                <div class="flex items-center gap-6">
                    <h2 class="orbitron text-3xl font-black text-orange-500 italic">${ordenActiva.placa || 'NUEVA_MISION'}</h2>
                    <select id="f-estado" class="bg-black text-slate-400 orbitron text-[10px] border border-white/10 p-2 rounded-lg">
                        ${['COTIZACION', 'INGRESO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-3">
                    <button id="btnImprimir" class="w-14 h-14 rounded-2xl bg-cyan-600/10 text-cyan-500 border border-cyan-500/20 hover:bg-cyan-600 transition-all"><i class="fas fa-print"></i></button>
                    <button id="btnWhatsApp" class="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 transition-all"><i class="fab fa-whatsapp"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-14 h-14 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 transition-all">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                        <p class="orbitron text-[9px] text-slate-500">IDENTIDAD VEHICULAR</p>
                        <input id="f-placa" value="${ordenActiva.placa}" class="w-full bg-transparent text-5xl font-black orbitron uppercase focus:text-orange-500 outline-none" placeholder="ABC123">
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-4 rounded-xl text-sm border border-white/5" placeholder="CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-4 rounded-xl text-sm border border-white/5" placeholder="CELULAR">
                    </div>
                    <div class="bg-orange-600/5 p-8 rounded-[2.5rem] border border-orange-500/20">
                        <p class="orbitron text-[9px] text-orange-500 font-bold mb-4 italic">NEXUS AI SCANNER</p>
                        <div id="preview-scanner" class="aspect-video bg-black/40 rounded-2xl mb-4 border border-dashed border-white/10 flex items-center justify-center overflow-hidden text-center p-4 text-[10px] text-slate-500">
                             SISTEMA LISTO
                        </div>
                        <button id="btnScanFoto" class="w-full p-4 bg-white/5 rounded-xl text-[9px] orbitron border border-white/10 hover:bg-white/10 transition-all">📸 CAPTURAR EVIDENCIA LOCAL</button>
                    </div>
                </div>

                <div class="lg:col-span-6 space-y-6">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-10">
                            <div>
                                <p class="orbitron text-[10px] text-emerald-500 mb-2">PRESUPUESTO TOTAL</p>
                                <h2 id="total-final" class="orbitron text-7xl font-black italic">$ 0</h2>
                            </div>
                        </div>
                        <div id="items-list" class="space-y-4 h-[450px] overflow-y-auto pr-4"></div>
                        <div class="mt-8 flex gap-4">
                            <button id="btnAddRepuesto" class="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl orbitron text-[9px] font-black">+ REPUESTO</button>
                            <button id="btnAddOro" class="flex-1 py-4 bg-amber-600/10 border border-amber-600/20 text-amber-500 rounded-2xl orbitron text-[9px] font-black">+ MANO OBRA</button>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <p class="orbitron text-[9px] text-slate-500 uppercase">Balance</p>
                        <div id="balance-results" class="space-y-4 text-sm">
                            </div>
                    </div>
                    <button id="btnSaveMission" class="w-full py-10 bg-orange-600 rounded-[2.5rem] text-black orbitron font-black text-sm hover:scale-[1.02] transition-all shadow-xl">
                        SINCRONIZAR MISION
                    </button>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularTotales();
    };

    const recalcularTotales = () => {
        let tVenta = 0, tCosto = 0, tStaff = 0;
        ordenActiva.items.forEach(item => {
            tVenta += Number(item.precio_venta || 0);
            tCosto += Number(item.costo_taller || 0);
            tStaff += Number(item.comision_staff || 0);
        });

        ordenActiva.costos_totales = {
            venta: tVenta,
            costo_taller: tCosto,
            comision_staff: tStaff,
            utilidad: tVenta - tCosto - tStaff
        };

        document.getElementById("total-final").innerText = `$ ${tVenta.toLocaleString()}`;
        document.getElementById("balance-results").innerHTML = `
            <div class="flex justify-between"><span>Costo:</span><span>$${tCosto.toLocaleString()}</span></div>
            <div class="flex justify-between"><span>Staff:</span><span>$${tStaff.toLocaleString()}</span></div>
            <div class="flex justify-between pt-4 border-t border-white/10 font-bold text-emerald-500">
                <span>UTILIDAD:</span><span>$${ordenActiva.costos_totales.utilidad.toLocaleString()}</span>
            </div>
        `;
        renderItems();
    };

    const renderItems = () => {
        const list = document.getElementById("items-list");
        list.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4 items-center">
                <input onchange="editItemNexus(${idx}, 'descripcion', this.value)" value="${item.descripcion}" class="flex-1 bg-transparent outline-none text-sm">
                <input type="number" onchange="editItemNexus(${idx}, 'precio_venta', this.value)" value="${item.precio_venta}" class="w-24 bg-black/40 p-2 rounded-lg text-emerald-500 text-right font-bold" placeholder="Venta">
                <button onclick="delItemNexus(${idx})" class="text-red-500 px-2">✕</button>
            </div>
        `).join('');
    };

    const vincularAccionesTerminal = () => {
        document.getElementById("btnScanFoto").onclick = () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
            input.onchange = (e) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    ordenActiva.temp_foto = ev.target.result;
                    document.getElementById("preview-scanner").innerHTML = `<img src="${ev.target.result}" class="h-full w-full object-cover">`;
                };
                reader.readAsDataURL(e.target.files[0]);
            };
            input.click();
        };

        document.getElementById("btnAddRepuesto").onclick = () => {
            ordenActiva.items.push({ tipo: 'REPUESTO', descripcion: 'NUEVO REPUESTO', costo_taller: 0, precio_venta: 0 });
            recalcularTotales();
        };

        document.getElementById("btnAddOro").onclick = () => {
            ordenActiva.items.push({ tipo: 'ORO', descripcion: 'MANO DE OBRA', comision_staff: 0, precio_venta: 0 });
            recalcularTotales();
        };

        document.getElementById("btnSaveMission").onclick = async () => {
            const btn = document.getElementById("btnSaveMission");
            btn.innerHTML = `<i class="fas fa-sync fa-spin"></i> PROCESANDO...`;
            
            const missionData = {
                placa: document.getElementById("f-placa").value.toUpperCase(),
                cliente: document.getElementById("f-cliente").value,
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                empresaId: empresaId,
                items: ordenActiva.items,
                costos_totales: ordenActiva.costos_totales,
                updatedAt: serverTimestamp(),
                evidencia: { audio_diagnostico: ordenActiva.evidencia.audio_diagnostico || "" }
            };

            try {
                const docRef = ordenActiva.id ? doc(db, "ordenes", ordenActiva.id) : doc(collection(db, "ordenes"));
                await setDoc(docRef, missionData); 
                hablar("Misión sincronizada en Nexus X.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) {
                btn.innerHTML = "ERROR PERMISOS";
                hablar("Error al guardar.");
            }
        };

        window.editItemNexus = (idx, campo, valor) => { ordenActiva.items[idx][campo] = valor; recalcularTotales(); };
        window.delItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularTotales(); };
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => {
            tab.onclick = () => cargarGrid(tab.dataset.fase);
        });
    };

    const cargarGrid = (fase = 'INGRESO') => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), where("estado", "==", fase));
        onSnapshot(q, (snap) => {
            const grid = document.getElementById("grid-ordenes");
            grid.innerHTML = snap.docs.map(d => {
                const data = d.data();
                return `
                <div onclick="abrirTerminalNexus('${d.id}')" class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 hover:border-orange-500/50 transition-all cursor-pointer group">
                    <div class="flex justify-between mb-4">
                        <span class="orbitron text-2xl font-black text-white group-hover:text-orange-500">${data.placa}</span>
                        <span class="text-[10px] text-slate-500 italic">${data.estado}</span>
                    </div>
                    <p class="text-xs text-slate-400 mb-4">${data.cliente}</p>
                    <div class="text-xl font-bold text-emerald-500">$ ${data.costos_totales?.venta.toLocaleString() || 0}</div>
                </div>`;
            }).join('');
            document.getElementById(`count-${fase}`).innerText = snap.size;
        });
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);

    renderBase();
}
