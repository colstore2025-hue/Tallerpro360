/**
 * ordenes.js - NEXUS-X COMMAND CENTER V8.0 "PRO-EVO" 🛰️
 * MISIÓN: AUTOMATIZACIÓN TOTAL TALLERPRO360 + ESTRUCTURA SAP BI MULTI-TALLER
 * INTEGRACIÓN: PRICING ENGINE PRO360 (TERMINATOR 2030)
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, getDocs,
    setDoc, updateDoc, serverTimestamp, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido } from "./pricingEnginePRO360.js";

const SpeechRecognition = window.Recognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';
    let isRecording = false;
    let datosTaller = { nombre: "NEXUS LOGISTICS", nit: "S/N" };

    // --- 🏢 CARGA DE PERFIL DE TALLER ---
    const cargarPerfilTaller = async () => {
        const docRef = doc(db, "empresas", empresaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            datosTaller = {
                nombre: docSnap.data().nombre || "TALLER PRO 360",
                nit: docSnap.data().nit || "900.000.000-1"
            };
        }
    };
    await cargarPerfilTaller();

    // --- 🖥️ RENDER CORE UI ---
    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 selection:bg-cyan-500 selection:text-black">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/10 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-5 w-5 bg-red-600 rounded-full animate-pulse shadow-[0_0_25px_#ff0000]"></div>
                        <h1 class="orbitron text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">NEXUS_<span class="text-cyan-400">V8</span></h1>
                    </div>
                    <p class="text-[12px] orbitron text-cyan-500/70 tracking-[0.6em] uppercase italic font-bold">${datosTaller.nombre} // NEURAL INTERFACE</p>
                </div>
                <button id="btnNewMission" class="group relative px-12 py-7 bg-cyan-500 text-black rounded-full orbitron text-sm font-black hover:bg-white hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                    <span class="relative z-10">INICIAR MISIÓN +</span>
                </button>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-5 mb-16">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(fase => `
                    <button class="fase-tab relative overflow-hidden p-8 rounded-[2.5rem] bg-[#0d1117] border-2 ${faseActual === fase ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'border-white/5'} transition-all group" data-fase="${fase}">
                        <span class="orbitron text-[10px] ${faseActual === fase ? 'text-cyan-400' : 'text-slate-500'} group-hover:text-cyan-400 mb-3 block font-black tracking-widest">${fase}</span>
                        <h3 id="count-${fase}" class="text-5xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto border-4 border-cyan-500/20 m-2 rounded-[3rem]"></div>
        </div>`;
        
        vincularNavegacion();
        cargarEscuchaGlobal();
    };

    // --- 📡 REAL-TIME ENGINE (KPI BI) ---
    const cargarEscuchaGlobal = () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0, ENTREGADO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === faseActual) grilla.push({ id: d.id, ...dt });
            });
            
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });

            const gridContainer = document.getElementById("grid-ordenes");
            if(gridContainer) {
                gridContainer.innerHTML = grilla.map(o => `
                <div onclick="window.abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-10 rounded-[3.5rem] border-2 border-white/5 hover:border-cyan-400 transition-all cursor-pointer group animate-in zoom-in relative overflow-hidden">
                    <div class="flex justify-between items-center mb-6">
                         <span class="orbitron text-4xl font-black text-white group-hover:text-cyan-400 tracking-tighter">${o.placa}</span>
                         <div class="h-3 w-3 rounded-full ${o.estado === 'LISTO' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]'}"></div>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-[11px] text-cyan-500/50 orbitron font-black uppercase">${o.cliente || 'NO_NAME'}</p>
                        <span class="text-[8px] orbitron border border-white/10 px-2 py-1 rounded text-slate-500 font-bold">${o.clase_vehiculo || 'LIVIANO'}</span>
                    </div>
                    <div class="flex justify-between items-end border-t border-white/10 pt-6">
                        <div>
                            <span class="text-[10px] text-slate-500 block uppercase mb-1 font-bold">Utilidad Neta</span>
                            <span class="text-xl font-black ${Number(o.costos_totales?.utilidad || 0) > 0 ? 'text-emerald-400' : 'text-white'} orbitron">$ ${Math.round(o.costos_totales?.utilidad || 0).toLocaleString()}</span>
                        </div>
                        <div class="text-right">
                             <span class="text-[8px] text-slate-600 block orbitron uppercase font-black">${o.tipo_orden || 'MECANICA'}</span>
                        </div>
                    </div>
                </div>`).join('');
            }
        });
    };

    // --- 🧮 AUDITORÍA FINANCIERA FORENSE (AJUSTADA A MISIÓN) ---
    const recalcularFinanzas = () => {
        let subtotalVenta = 0;
        let costoRepuestosTaller = 0;

        ordenActiva.items.forEach(i => {
            subtotalVenta += Number(i.venta || 0);
            if (i.origen === "TALLER") costoRepuestosTaller += Number(i.costo || 0);
        });

        // Gastos de Insumos (Estopa, siliconas, etc.) se cargan al costo de la orden
        const g_insumos = Number(document.getElementById("f-gastos-varios")?.value || 0); 
        // Nómina (Adelanto técnico) - Es un egreso pero no reduce la utilidad bruta del servicio, sino la neta de caja
        const pago_tecnico = Number(document.getElementById("f-adelanto-tecnico")?.value || 0); 
        const anticipo = Number(document.getElementById("f-anticipo-cliente")?.value || 0); 
        
        const granTotal = subtotalVenta; 
        const baseGravable = granTotal / 1.19;
        const totalIVA = granTotal - baseGravable;

        // Utilidad Neta = Lo que vendí - (Lo que me costó el repuesto + Insumos operativos de la orden + Mano de obra pagada)
        const utilidadNeta = baseGravable - (costoRepuestosTaller + pago_tecnico + g_insumos);
        const saldoPendiente = granTotal - anticipo;

        ordenActiva.costos_totales = {
            base_gravable: baseGravable,
            iva_19: totalIVA,
            gran_total: granTotal,
            utilidad: utilidadNeta,
            saldo_pendiente: saldoPendiente,
            adelanto_tecnico: pago_tecnico,
            gastos_operativos: g_insumos,
            costo_repuestos: costoRepuestosTaller
        };

        const totalEl = document.getElementById("total-factura");
        if(totalEl) {
            totalEl.innerText = `$ ${Math.round(granTotal).toLocaleString()}`;
            document.getElementById("saldo-display").innerHTML = `
                <span class="text-cyan-500/50 text-[10px] uppercase block tracking-widest font-black mb-1">Saldo a Pagar</span>
                <span class="${saldoPendiente > 0 ? 'text-red-500' : 'text-emerald-400'} animate-pulse font-black text-2xl">$ ${Math.round(saldoPendiente).toLocaleString()}</span>
            `;
        }
        renderItems();
    };

    // --- 📄 DOCUMENT ENGINE ---
    window.generarDocumentoNexus = (tipo) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const colorNexus = [6, 182, 212];
        const colorDark = [13, 17, 23];

        doc.setFillColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(tipo === 'MANIFIESTO' ? "ORDEN DE TRABAJO" : "REPORTE DE FACTURACIÓN", 15, 25);
        
        doc.setFontSize(10);
        doc.text(`${datosTaller.nombre.toUpperCase()} | NIT: ${datosTaller.nit}`, 15, 35);

        doc.setTextColor(40);
        doc.setFontSize(9);
        doc.text(`CLIENTE: ${ordenActiva.cliente.toUpperCase()}`, 15, 55);
        doc.text(`PLACA: ${ordenActiva.placa}`, 15, 62);
        doc.text(`TIPO: ${ordenActiva.tipo_orden}`, 110, 55);
        doc.text(`FECHA: ${new Date().toLocaleString()}`, 110, 62);

        const tableRows = ordenActiva.items.map(i => [
            i.desc.toUpperCase(),
            i.tipo,
            `$ ${Number(i.venta).toLocaleString()}`
        ]);

        doc.autoTable({
            startY: 70,
            head: [['DESCRIPCIÓN', 'CATEGORÍA', 'VALOR FINAL']],
            body: tableRows,
            headStyles: { fillColor: colorNexus, textColor: 0 },
            styles: { fontSize: 8 },
            theme: 'striped'
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`SUBTOTAL: $ ${Math.round(ordenActiva.costos_totales.base_gravable).toLocaleString()}`, 140, finalY);
        doc.text(`IVA (19%): $ ${Math.round(ordenActiva.costos_totales.iva_19).toLocaleString()}`, 140, finalY + 7);
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL: $ ${Math.round(ordenActiva.costos_totales.gran_total).toLocaleString()}`, 140, finalY + 15);
        
        doc.save(`${tipo}_${ordenActiva.placa}.pdf`);
        hablar(`Soporte ${tipo} listo`);
    };

    // --- 🎮 TERMINAL PENTAGON PRO ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1500px] mx-auto pb-20 animate-in slide-in-from-bottom-10">
            <div id="camera-viewport" class="hidden fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center">
                <video id="video-feed" autoplay playsinline class="w-full max-w-2xl rounded-[3rem] border-4 border-cyan-500"></video>
                <div class="flex gap-10 mt-10">
                    <button id="btnShutter" class="w-24 h-24 bg-white rounded-full border-8 border-slate-700 shadow-2xl"></button>
                    <button id="btnCancelCam" class="w-24 h-24 bg-red-600 text-white rounded-full text-4xl">✕</button>
                </div>
            </div>

            <div class="flex flex-wrap justify-between items-center gap-6 mb-12 bg-[#0d1117] p-10 rounded-[4rem] border-2 border-cyan-500/20 sticky top-0 z-50">
                <div class="flex items-center gap-8">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-64 uppercase text-center rounded-3xl border border-white/10 focus:border-cyan-500 outline-none" placeholder="PLACA">
                    <select id="f-estado" class="bg-cyan-500 text-black orbitron text-xs font-black p-6 rounded-2xl outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button onclick="window.generarDocumentoNexus('MANIFIESTO')" class="w-20 h-20 rounded-3xl bg-white/5 text-cyan-400 border border-cyan-500/30 flex flex-col items-center justify-center">
                        <i class="fas fa-file-invoice text-2xl"></i>
                        <span class="text-[7px] orbitron font-black uppercase mt-1">OT</span>
                    </button>
                    <button id="btnCaptureVisual" class="w-20 h-20 rounded-3xl bg-white/5 text-white border border-white/10 flex flex-col items-center justify-center">
                        <i class="fas fa-camera text-2xl"></i>
                        <span class="text-[7px] orbitron font-black uppercase mt-1">MULTIMEDIA</span>
                    </button>
                    <button id="btnWppDirect" class="w-20 h-20 rounded-3xl bg-emerald-500 text-black flex flex-col items-center justify-center">
                        <i class="fab fa-whatsapp text-2xl"></i>
                        <span class="text-[7px] orbitron font-black uppercase mt-1">CLIENTE</span>
                    </button>
                    <button id="btnCloseTerminal" class="w-20 h-20 rounded-3xl bg-red-600 text-white font-black text-3xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                        <label class="text-[10px] text-cyan-400 font-black uppercase block mb-4">Master Data</label>
                        <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-black p-6 rounded-3xl border border-white/5 mb-4 text-white uppercase font-bold" placeholder="CLIENTE">
                        <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-black p-6 rounded-3xl border border-white/5 text-white font-bold mb-4" placeholder="TELÉFONO">
                        <div class="grid grid-cols-2 gap-4">
                             <select id="f-tipo-orden" class="bg-black p-4 rounded-2xl border border-white/5 text-xs text-slate-400">
                                <option value="MECANICA" ${ordenActiva.tipo_orden === 'MECANICA' ? 'selected' : ''}>MECÁNICA</option>
                                <option value="ELECTRICO" ${ordenActiva.tipo_orden === 'ELECTRICO' ? 'selected' : ''}>ELÉCTRICO</option>
                                <option value="PINTURA" ${ordenActiva.tipo_orden === 'PINTURA' ? 'selected' : ''}>PINTURA</option>
                             </select>
                             <select id="f-clase-vehiculo" class="bg-black p-4 rounded-2xl border border-white/5 text-xs text-slate-400">
                                <option value="LIVIANO" ${ordenActiva.clase_vehiculo === 'LIVIANO' ? 'selected' : ''}>LIVIANO</option>
                                <option value="PESADO" ${ordenActiva.clase_vehiculo === 'PESADO' ? 'selected' : ''}>PESADO</option>
                                <option value="MOTO" ${ordenActiva.clase_vehiculo === 'MOTO' ? 'selected' : ''}>MOTOCICLETA</option>
                             </select>
                        </div>
                    </div>

                    <div id="radar-container"></div>

                    <div class="bg-black p-10 rounded-[3.5rem] border border-red-500/30 relative">
                        <div id="rec-indicator" class="hidden absolute top-6 right-10 flex items-center gap-2">
                            <div class="h-2 w-2 bg-red-600 rounded-full animate-ping"></div>
                            <span class="text-[8px] orbitron text-red-500 font-black">REC</span>
                        </div>
                        <span class="orbitron text-[11px] text-red-500 font-black uppercase mb-6 block italic">Neural Work Log</span>
                        <textarea id="ai-log-display" class="w-full bg-[#0d1117] p-6 rounded-3xl text-sm h-64 outline-none border border-white/5 text-slate-300 font-mono italic">${ordenActiva.bitacora_ia || ''}</textarea>
                        <button id="btnDictar" class="w-full mt-6 py-6 bg-red-600 text-white rounded-2xl orbitron text-xs font-black">🎤 CAPTURAR VOZ</button>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4.5rem] border border-white/10 shadow-2xl">
                        <div class="flex justify-between items-end mb-12">
                            <div>
                                <p class="orbitron text-[14px] text-cyan-400 uppercase font-black mb-2">Total Operación</p>
                                <h2 id="total-factura" class="orbitron text-7xl md:text-8xl font-black text-white italic tracking-tighter">$ 0</h2>
                            </div>
                            <div id="saldo-display" class="bg-white/5 p-8 rounded-[3rem] border border-white/10 text-right min-w-[250px]"></div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll"></div>
                        
                        <div class="grid grid-cols-2 gap-6 mt-8">
                            <button id="btnAddRepuesto" class="py-6 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 font-black text-[10px] hover:bg-white/10 transition-all uppercase tracking-widest">+ Repuesto</button>
                            <button id="btnAddMano" class="py-6 bg-cyan-500/5 rounded-3xl border-2 border-dashed border-cyan-500/30 text-cyan-400 font-black text-[10px] hover:bg-cyan-500/10 transition-all uppercase tracking-widest">+ Labor</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-black p-8 rounded-[3rem] border border-white/5 grid grid-cols-3 gap-4">
                            <div>
                                <label class="text-[8px] orbitron text-slate-500 block mb-2">ANTICIPO</label>
                                <input type="number" id="f-anticipo-cliente" value="${ordenActiva.finanzas?.anticipo_cliente || ''}" class="w-full bg-emerald-500/10 p-4 rounded-xl text-emerald-400 font-bold border border-emerald-500/20" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                            <div>
                                <label class="text-[8px] orbitron text-cyan-500 block mb-2">INSUMOS</label>
                                <input type="number" id="f-gastos-varios" value="${ordenActiva.finanzas?.gastos_varios || ''}" class="w-full bg-white/5 p-4 rounded-xl text-white font-bold border border-white/10" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                            <div>
                                <label class="text-[8px] orbitron text-red-500 block mb-2">NÓMINA</label>
                                <input type="number" id="f-adelanto-tecnico" value="${ordenActiva.finanzas?.adelanto_tecnico || ''}" class="w-full bg-red-500/10 p-4 rounded-xl text-red-500 font-bold border border-red-500/20" onchange="window.actualizarFinanzasDirecto()">
                            </div>
                        </div>
                        <button id="btnSincronizar" class="py-10 bg-white text-black rounded-[3rem] orbitron font-black text-xl hover:bg-cyan-400 transition-all shadow-2xl">🛰️ SYNC NEXUS-X</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        renderRadarPrecios(document.getElementById('radar-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 🛠️ ITEM MANAGEMENT ---
    const renderItems = () => {
        const containerItems = document.getElementById("items-container");
        if(!containerItems) return;
        containerItems.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-white/[0.02] p-5 rounded-[2rem] border border-white/5 group hover:border-cyan-500/20 transition-all">
                <div class="md:col-span-1 text-center">
                    <button onclick="window.toggleOrigenItem(${idx})" class="w-12 h-12 rounded-xl border ${item.origen === 'TALLER' ? 'border-cyan-500/30 text-cyan-400' : 'border-amber-500/30 text-amber-400'}">
                        <i class="fas ${item.origen === 'TALLER' ? 'fa-warehouse' : 'fa-user-tag'}"></i>
                    </button>
                </div>
                <div class="md:col-span-5">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[8px] orbitron font-black ${item.tipo === 'REPUESTO' ? 'text-orange-500' : 'text-cyan-400'}">${item.tipo}</span>
                        <button onclick="window.buscarEnInventario(${idx})" class="text-white/20 hover:text-cyan-400"><i class="fas fa-search-plus"></i></button>
                    </div>
                    <input onchange="window.editItemNexus(${idx}, 'desc', this.value)" value="${item.desc}" id="item_desc_${idx}" class="w-full bg-transparent border-b border-white/5 outline-none text-white font-bold uppercase text-sm" placeholder="DESCRIPCIÓN">
                </div>
                <div class="md:col-span-3">
                    <label class="text-[8px] text-slate-500 block uppercase font-black">Costo Taller</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'costo', this.value)" value="${item.costo || ''}" class="w-full bg-black/50 p-3 rounded-xl text-red-400 font-bold border border-white/5">
                </div>
                <div class="md:col-span-2">
                    <label class="text-[8px] text-slate-500 block uppercase font-black">Venta Público</label>
                    <input type="number" onchange="window.editItemNexus(${idx}, 'venta', this.value)" id="item_venta_${idx}" value="${item.venta || ''}" class="w-full bg-black/50 p-3 rounded-xl text-emerald-400 font-bold border border-white/5">
                </div>
                <div class="md:col-span-1 text-right">
                    <button onclick="window.removeItemNexus(${idx})" class="text-white/10 hover:text-red-500 transition-all text-xl">✕</button>
                </div>
            </div>`).join('');
    };

    // --- 📡 RADAR UI RENDERER ---
    const renderRadarPrecios = (container) => {
        container.innerHTML = `
        <div class="bg-[#0d1117] border border-white/5 p-8 rounded-[3rem] mt-6 space-y-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="orbitron text-[10px] text-cyan-400 font-black uppercase italic tracking-widest">Radar de Mercado Nexus-X</h3>
                <div class="flex gap-2">
                    <button type="button" onclick="window.consultarMercado('autolab')" class="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] orbitron text-slate-400 hover:text-white transition-all">
                        <i class="fas fa-search-dollar mr-1"></i> AUTOLAB
                    </button>
                    <button type="button" onclick="window.consultarMercado('c3')" class="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] orbitron text-slate-400 hover:text-white transition-all">
                        <i class="fas fa-balance-scale mr-1"></i> C3 CARE
                    </button>
                </div>
            </div>
            <div class="space-y-4">
                <input type="text" id="diag_procedimiento" placeholder="PROCEDIMIENTO A EVALUAR" 
                       class="w-full bg-black p-5 rounded-2xl border border-white/10 text-xs text-white orbitron outline-none focus:border-cyan-500 uppercase">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[7px] orbitron text-slate-500 uppercase ml-2 mb-1 block">Horas Estimadas</label>
                        <input type="number" id="diag_horas" value="1" class="w-full bg-black p-4 rounded-xl border border-white/10 text-xs text-emerald-400 orbitron">
                    </div>
                    <div>
                        <label class="text-[7px] orbitron text-slate-500 uppercase ml-2 mb-1 block">Gama Vehículo</label>
                        <select id="diag_gama" class="w-full bg-black p-4 rounded-xl border border-white/10 text-[9px] text-white orbitron uppercase">
                            <option value="ECONOMICO">ECONÓMICO</option>
                            <option value="MEDIO" selected>GAMA MEDIA</option>
                            <option value="PREMIUM">PREMIUM / LUX</option>
                        </select>
                    </div>
                </div>
            </div>
            <div id="ai_pricing_feedback" class="hidden bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-2xl">
                <p id="ai_explicacion" class="text-[9px] text-slate-300 italic mb-2"></p>
                <div class="flex justify-between items-center">
                    <span class="text-[8px] orbitron text-cyan-500 font-black">SUGERENCIA IA:</span>
                    <span id="ai_precio_val" class="text-xl font-black text-white orbitron"></span>
                </div>
            </div>
            <button type="button" onclick="window.ejecutarAnalisisNexus()" class="w-full py-5 bg-cyan-500 text-black orbitron font-black text-[10px] rounded-2xl hover:bg-white transition-all shadow-xl">
                CALCULAR PRECIO INTELIGENTE
            </button>
        </div>`;
    };

    // --- 💾 DATABASE SYNC (CONEXIÓN CONTABLE INTEGRADA) ---
    const ejecutarSincronizacionNexus = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-satellite animate-pulse"></i> SYNCING...`;
        
        try {
            const placa = document.getElementById("f-placa").value.trim().toUpperCase();
            if(!placa) throw new Error("PLACA REQUERIDA");

            const docId = ordenActiva.id || `OT_${placa}_${Date.now()}`;
            
            // Actualizar objeto ordenActiva antes de guardar
            ordenActiva.finanzas = {
                anticipo_cliente: Number(document.getElementById("f-anticipo-cliente").value),
                gastos_varios: Number(document.getElementById("f-gastos-varios").value),
                adelanto_tecnico: Number(document.getElementById("f-adelanto-tecnico").value)
            };

            const finalData = {
                ...ordenActiva,
                id: docId, empresaId,
                placa,
                cliente: document.getElementById("f-cliente").value.toUpperCase(),
                telefono: document.getElementById("f-telefono").value,
                estado: document.getElementById("f-estado").value,
                tipo_orden: document.getElementById("f-tipo-orden").value,
                clase_vehiculo: document.getElementById("f-clase-vehiculo").value,
                bitacora_ia: document.getElementById("ai-log-display").value,
                updatedAt: serverTimestamp()
            };

            // Guardar en Firestore Ordenes
            await setDoc(doc(db, "ordenes", docId), finalData);

            // ⚡ INTEGRACIÓN CONTABLE: Si hay gastos o nómina, registrar egreso automático
            const totalEgresos = finalData.finanzas.gastos_varios + finalData.finanzas.adelanto_tecnico;
            if(totalEgresos > 0) {
                const egresoId = `EGR_${docId}_${Date.now()}`;
                await setDoc(doc(db, "contabilidad", egresoId), {
                    tipo: 'EGRESO_OPERATIVO_OT',
                    categoria: finalData.finanzas.adelanto_tecnico > 0 ? 'NOMINA' : 'INSUMOS',
                    monto: totalEgresos,
                    detalle: `GASTOS OT ${placa}: Insumos($${finalData.finanzas.gastos_varios}) + Nómina($${finalData.finanzas.adelanto_tecnico})`,
                    ordenId: docId,
                    empresaId,
                    fecha: serverTimestamp()
                });
            }

            Swal.fire({ icon: 'success', title: 'MISSION SYNCED', background: '#010409', color: '#06b6d4', timer: 1500 });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'FAILURE', text: err.message });
        } finally { 
            btn.disabled = false; 
            btn.innerHTML = `🛰️ SYNC NEXUS-X`;
        }
    };

    // --- 🧩 GLOBALS & ACTIONS ---
    const vincularAccionesTerminal = () => {
        const safeClick = (id, fn) => { const el = document.getElementById(id); if(el) el.onclick = fn; };
        safeClick("btnSincronizar", ejecutarSincronizacionNexus);
        safeClick("btnCloseTerminal", () => document.getElementById("nexus-terminal").classList.add("hidden"));
        safeClick("btnAddRepuesto", () => { ordenActiva.items.push({ tipo: 'REPUESTO', desc: 'NUEVO REPUESTO', costo: 0, venta: 0, origen: 'TALLER' }); recalcularFinanzas(); });
        safeClick("btnAddMano", async () => {
            const { value: tecnico } = await Swal.fire({ title: 'TÉCNICO ASIGNADO', input: 'text', background: '#0d1117', color: '#fff', inputPlaceholder: 'Nombre del mecánico' });
            ordenActiva.items.push({ tipo: 'MANO_OBRA', desc: `LABOR: ${tecnico || 'GENERAL'}`, costo: 0, venta: 0, origen: 'TALLER', tecnico: tecnico || 'GENERAL' });
            recalcularFinanzas();
        });
        safeClick("btnWppDirect", () => {
            const tel = document.getElementById("f-telefono").value.replace(/\D/g, '');
            const msg = `*REPORT NEXUS-X: ${ordenActiva.placa}*\nEstimado cliente, su vehículo se encuentra en fase: ${ordenActiva.estado}.\nSaldo pendiente: $${Math.round(ordenActiva.costos_totales.saldo_pendiente).toLocaleString()}`;
            if(tel) window.open(`https://wa.me/57${tel}?text=${encodeURIComponent(msg)}`, '_blank');
        });
        safeClick("btnDictar", () => {
            if(!isRecording) { recognition?.start(); isRecording = true; document.getElementById("rec-indicator").classList.remove("hidden"); hablar("Nexus escuchando"); }
            else { recognition?.stop(); isRecording = false; document.getElementById("rec-indicator").classList.add("hidden"); }
        });
        if(recognition) { recognition.onresult = (e) => { document.getElementById("ai-log-display").value += " " + e.results[0][0].transcript; }; }
    };

    // --- ⚙️ WINDOW FUNCTIONS (SCOPED FOR UI) ---
    window.abrirTerminalNexus = (id) => {
        document.getElementById("nexus-terminal").classList.remove("hidden");
        if(id) { 
            getDoc(doc(db, "ordenes", id)).then(s => { 
                ordenActiva = { id, ...s.data() }; 
                if(!ordenActiva.finanzas) ordenActiva.finanzas = { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0 };
                renderTerminal(); 
            }); 
        } else {
            ordenActiva = { 
                placa: '', cliente: '', telefono: '', estado: 'INGRESO', 
                tipo_orden: 'MECANICA', clase_vehiculo: 'LIVIANO', 
                items: [], bitacora_ia: '', finanzas: { gastos_varios: 0, adelanto_tecnico: 0, anticipo_cliente: 0 }
            };
            renderTerminal();
        }
    };

    window.consultarMercado = (target) => {
        const queryVal = document.getElementById('diag_procedimiento').value;
        if(!queryVal) return Swal.fire("Atención", "Ingresa un procedimiento para investigar", "info");
        const urls = {
            autolab: `https://autolab.com.co/cotizar?s=${queryVal}`,
            c3: `https://c3carecenter.com/?s=${queryVal}`
        };
        window.open(urls[target], '_blank');
    };

    window.ejecutarAnalisisNexus = () => {
        const params = {
            horasTrabajo: Number(document.getElementById('diag_horas').value),
            tipoVehiculo: document.getElementById('diag_gama').value,
            urgencia: document.getElementById('f-estado').value === 'REPARACION' ? 'urgente' : 'normal',
            tipoTrabajo: document.getElementById('diag_procedimiento').value.includes("DIAG") ? "diagnostico" : "general"
        };

        const res = analizarPrecioSugerido(params); // Basado en PricingEnginePRO360
        
        const feedback = document.getElementById('ai_pricing_feedback');
        feedback.classList.remove('hidden');
        document.getElementById('ai_explicacion').innerText = res.explicacion || "Análisis de mercado completado.";
        document.getElementById('ai_precio_val').innerText = `$${res.precioSugerido.toLocaleString()}`;
        
        // Sincronizar con el último item de mano de obra si existe
        const lastIndex = ordenActiva.items.map(i => i.tipo).lastIndexOf('MANO_OBRA');
        if(lastIndex !== -1) {
            ordenActiva.items[lastIndex].venta = res.precioSugerido;
            ordenActiva.items[lastIndex].desc = `LABOR: ${document.getElementById('diag_procedimiento').value.toUpperCase()} (${params.horasTrabajo}H)`;
            recalcularFinanzas();
        } else {
            // Si no hay item de mano de obra, lo crea
            ordenActiva.items.push({ 
                tipo: 'MANO_OBRA', 
                desc: `LABOR: ${document.getElementById('diag_procedimiento').value.toUpperCase()} (${params.horasTrabajo}H)`, 
                costo: 0, 
                venta: res.precioSugerido, 
                origen: 'TALLER' 
            });
            recalcularFinanzas();
        }
        hablar("Precio inteligente calculado y aplicado");
    };

    window.toggleOrigenItem = (idx) => { 
        ordenActiva.items[idx].origen = ordenActiva.items[idx].origen === 'TALLER' ? 'CLIENTE' : 'TALLER'; 
        if(ordenActiva.items[idx].origen === 'CLIENTE') ordenActiva.items[idx].costo = 0;
        recalcularFinanzas(); 
    };
    window.editItemNexus = (idx, campo, val) => { ordenActiva.items[idx][campo] = (campo === 'costo' || campo === 'venta') ? Number(val) : val; recalcularFinanzas(); };
    window.removeItemNexus = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    window.actualizarFinanzasDirecto = () => recalcularFinanzas();

    window.buscarEnInventario = async (idx) => {
        const snap = await getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)));
        const { value: res } = await Swal.fire({
            title: 'INVENTARIO NEXUS-X', background: '#0d1117', color: '#fff', input: 'select',
            inputOptions: Object.fromEntries(snap.docs.map(d => [JSON.stringify({id: d.id, n: d.data().nombre, c: d.data().costo, v: d.data().precioVenta}), `${d.data().nombre} ($${d.data().precioVenta})`])),
            showCancelButton: true,
            confirmButtonColor: '#06b6d4'
        });
        if (res) {
            const data = JSON.parse(res);
            ordenActiva.items[idx] = { ...ordenActiva.items[idx], desc: data.n, costo: data.c, venta: data.v, sku: data.id };
            recalcularFinanzas();
        }
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => window.abrirTerminalNexus();
        document.querySelectorAll(".fase-tab").forEach(tab => { tab.onclick = () => { faseActual = tab.dataset.fase; renderBase(); }; });
    };

    renderBase();
}
