/**
 * ordenes.js - NEXUS-X COMMAND CENTER V5.1 "HYPER-DRIVE" 🛰️
 * Integración Total: ERP, CRM, AI, VOZ, BOLD & DASHBOARD.
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, runTransaction 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

// --- MOTORES DE INTELIGENCIA Y VOZ ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if(recognition) { recognition.lang = 'es-CO'; recognition.continuous = false; }

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;
    let faseActual = 'INGRESO';

    const renderBase = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans animate-in fade-in duration-1000 pb-32">
            <header class="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-white/5 pb-12">
                <div class="space-y-3">
                    <div class="flex items-center gap-5">
                        <div class="h-4 w-4 bg-cyan-500 rounded-full animate-ping shadow-[0_0_20px_#00f2ff]"></div>
                        <h1 class="orbitron text-6xl font-black italic tracking-tighter text-white uppercase">Nexus_<span class="text-cyan-400">OT</span></h1>
                    </div>
                    <p class="text-[11px] orbitron text-slate-500 tracking-[0.5em] uppercase">Logística Aeroespacial de Vehículos · V5.1</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnNewMission" class="px-10 py-5 bg-white text-black rounded-3xl orbitron text-[12px] font-black hover:bg-cyan-400 hover:scale-105 transition-all shadow-2xl">NUEVA MISIÓN +</button>
                </div>
            </header>

            <nav class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16 overflow-x-auto no-scrollbar">
                ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(fase => `
                    <button class="fase-tab p-8 rounded-[2.5rem] bg-[#0d1117] border border-white/5 transition-all group relative overflow-hidden" data-fase="${fase}">
                        <span class="orbitron text-[9px] text-slate-500 group-hover:text-cyan-400 mb-4 block">${fase}</span>
                        <h3 id="count-${fase}" class="text-4xl font-black text-white group-hover:scale-110 transition-all">0</h3>
                        <div class="h-1 w-0 bg-cyan-500 mt-4 group-hover:w-full transition-all duration-500"></div>
                    </button>
                `).join('')}
            </nav>

            <div id="grid-ordenes" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"></div>
            <div id="nexus-terminal" class="hidden fixed inset-0 z-[100] bg-[#010409]/98 backdrop-blur-3xl p-4 lg:p-12 overflow-y-auto animate-in zoom-in duration-300"></div>
        </div>`;

        vincularNavegacion();
        cargarGrid(faseActual);
    };

    const abrirTerminal = async (id = null) => {
        const modal = document.getElementById("nexus-terminal");
        modal.classList.remove("hidden");
        
        if (id) {
            const snap = await getDoc(doc(db, "ordenes", id));
            ordenActiva = { id, ...snap.data() };
        } else {
            ordenActiva = {
                placa: '', cliente: '', telefono: '', estado: 'INGRESO',
                items: [], bitacora_ia: 'Esperando dictado...',
                gastos_varios: { cafeteria: 0, adelanto_tecnico: 0 },
                abonos: 0,
                costos_totales: { total: 0, costo: 0, utilidad: 0, saldo_pendiente: 0 }
            };
        }
        renderTerminal();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto">
            <div class="flex justify-between items-center mb-10 bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                <div class="flex items-center gap-10">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-transparent text-6xl font-black orbitron text-cyan-400 outline-none w-64 uppercase" placeholder="PLACA">
                    <select id="f-estado" class="bg-black/50 text-white orbitron text-xs p-4 rounded-2xl border border-white/10 outline-none">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO'].map(f => `<option value="${f}" ${ordenActiva.estado === f ? 'selected' : ''}>${f}</option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-4">
                    <button id="btnScannerEvidencia" class="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-400 hover:text-black transition-all"><i class="fas fa-camera"></i></button>
                    <button id="btnWppCRM" class="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all"><i class="fab fa-whatsapp"></i></button>
                    <button id="btnImprimirFicha" class="w-16 h-16 rounded-3xl bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black transition-all"><i class="fas fa-file-invoice"></i></button>
                    <button onclick="document.getElementById('nexus-terminal').classList.add('hidden')" class="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-black">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl">
                        <p class="orbitron text-[10px] text-slate-500 mb-8 uppercase tracking-widest italic">Identidad Cliente</p>
                        <div class="space-y-6">
                            <input id="f-cliente" value="${ordenActiva.cliente}" class="w-full bg-white/5 p-6 rounded-3xl text-sm border border-white/5 outline-none focus:border-cyan-500/50 transition-all uppercase font-bold" placeholder="NOMBRE COMPLETO">
                            <input id="f-telefono" value="${ordenActiva.telefono}" class="w-full bg-white/5 p-6 rounded-3xl text-sm border border-white/5 outline-none focus:border-cyan-500/50 transition-all" placeholder="WHATSAPP">
                        </div>
                    </div>

                    <div class="bg-gradient-to-br from-[#0d1117] to-black p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden group">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20"><i class="fas fa-brain text-cyan-400 animate-pulse"></i></div>
                            <span class="orbitron text-[11px] text-white font-black uppercase tracking-widest">Diagnóstico por Voz</span>
                        </div>
                        <div id="ai-log-display" class="bg-black/40 p-6 rounded-3xl text-xs text-slate-300 italic leading-relaxed border border-white/5 h-40 overflow-y-auto mb-6">
                            ${ordenActiva.bitacora_ia}
                        </div>
                        <button id="btnDictar" class="w-full py-5 bg-cyan-500 text-black rounded-2xl orbitron text-[10px] font-black hover:scale-[1.02] transition-all">🎤 INICIAR DICTADO NEXUS</button>
                    </div>

                    <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-red-500/10 space-y-6 shadow-2xl">
                        <p class="orbitron text-[9px] text-red-500 font-black uppercase italic">Gastos de Misión (Cafetería / Adelantos)</p>
                        <div class="grid grid-cols-2 gap-4">
                            <input type="number" id="f-cafeteria" value="${ordenActiva.gastos_varios?.cafeteria || 0}" onchange="updateFinanza('cafeteria', this.value)" class="bg-black/40 p-4 rounded-2xl text-xs text-white border border-white/5 outline-none" placeholder="Tinto/Agua">
                            <input type="number" id="f-adelanto" value="${ordenActiva.gastos_varios?.adelanto_tecnico || 0}" onchange="updateFinanza('adelanto', this.value)" class="bg-black/40 p-4 rounded-2xl text-xs text-white border border-white/5 outline-none" placeholder="Abono Técnico">
                        </div>
                        <div class="pt-4">
                            <label class="text-[9px] text-emerald-500 orbitron mb-2 block font-black uppercase">Abono Cliente ($)</label>
                            <input type="number" id="f-abono" value="${ordenActiva.abonos || 0}" onchange="updateFinanza('abono', this.value)" class="w-full bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl text-2xl font-black text-emerald-400 orbitron outline-none">
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
                        <div class="flex justify-between items-end mb-12">
                            <div>
                                <p class="orbitron text-[11px] text-cyan-400 mb-4 font-black tracking-widest italic uppercase">Presupuesto de Misión</p>
                                <h2 id="total-factura" class="orbitron text-8xl font-black italic text-white tracking-tighter drop-shadow-2xl">$ 0</h2>
                            </div>
                            <div class="text-right">
                                <p id="label-saldo" class="text-[10px] text-orange-500 orbitron mb-2 uppercase font-black">Saldo Pendiente</p>
                                <p id="saldo-display" class="text-4xl font-black text-white orbitron italic tracking-tighter">$ 0</p>
                            </div>
                        </div>

                        <div id="items-container" class="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar"></div>

                        <div class="mt-10 flex gap-4">
                            <button id="btnAddRepuesto" class="flex-1 py-6 bg-white/5 rounded-3xl orbitron text-[10px] font-black border border-white/10 hover:bg-cyan-500/10 transition-all">+ REPUESTO</button>
                            <button id="btnAddMano" class="flex-1 py-6 bg-cyan-500/5 rounded-3xl orbitron text-[10px] font-black border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 transition-all">+ MANO DE OBRA</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button id="btnPagarBold" class="py-8 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-[2.5rem] orbitron font-black text-[11px] hover:scale-[1.02] transition-all shadow-xl uppercase">
                            <i class="fas fa-credit-card mr-3"></i> Link de Pago BOLD
                        </button>
                        <button id="btnSincronizar" class="py-8 bg-white text-black rounded-[2.5rem] orbitron font-black text-[11px] hover:scale-[1.02] transition-all shadow-xl uppercase">
                            Sincronizar Misión Nexus-X
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const recalcularFinanzas = () => {
        let total = 0, costo = 0;
        ordenActiva.items.forEach(i => {
            total += Number(i.venta || 0);
            costo += Number(i.costo || 0);
        });

        const gastosExt = Number(ordenActiva.gastos_varios?.cafeteria || 0) + Number(ordenActiva.gastos_varios?.adelanto_tecnico || 0);
        const abonos = Number(ordenActiva.abonos || 0);
        
        ordenActiva.costos_totales = { 
            total, 
            costo: costo + gastosExt, 
            utilidad: total - (costo + gastosExt),
            saldo_pendiente: total - abonos
        };

        document.getElementById("total-factura").innerText = `$ ${total.toLocaleString()}`;
        document.getElementById("saldo-display").innerText = `$ ${ordenActiva.costos_totales.saldo_pendiente.toLocaleString()}`;
        renderItems();
    };

    const renderItems = () => {
        const container = document.getElementById("items-container");
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 group hover:bg-white/[0.08] transition-all">
                <div class="flex-1 min-w-[250px]">
                    <span class="text-[8px] orbitron text-cyan-500 font-black mb-2 block tracking-widest italic uppercase">${item.tipo}</span>
                    <input onchange="editItem(${idx}, 'desc', this.value)" value="${item.desc}" class="w-full bg-transparent border-none outline-none text-white font-bold text-sm uppercase">
                </div>
                <div class="flex gap-4">
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 orbitron block mb-1 uppercase">Costo</span>
                        <input type="number" onchange="editItem(${idx}, 'costo', this.value)" value="${item.costo}" class="w-24 bg-black/40 p-3 rounded-2xl text-[11px] text-red-400 text-center border border-white/5 outline-none font-black">
                    </div>
                    <div class="text-center">
                        <span class="text-[8px] text-slate-500 orbitron block mb-1 uppercase">Venta</span>
                        <input type="number" onchange="editItem(${idx}, 'venta', this.value)" value="${item.venta}" class="w-32 bg-black/40 p-3 rounded-2xl text-sm text-emerald-400 text-center border border-emerald-500/20 outline-none font-black">
                    </div>
                </div>
                <button onclick="removeItem(${idx})" class="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 transition-all font-black">✕</button>
            </div>
        `).join('');
    };

    const vincularAccionesTerminal = () => {
        // --- ESCÁNER DE EVIDENCIA (FOTO/AUDIO POR WA) ---
        document.getElementById("btnScannerEvidencia").onclick = () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
            input.onchange = () => {
                hablar("Evidencia capturada. Enviando al nodo del cliente por WhatsApp.");
                document.getElementById("btnWppCRM").click();
            };
            input.click();
        };

        // --- DICTADO POR VOZ ---
        document.getElementById("btnDictar").onclick = () => {
            if(!recognition) return hablar("Error de Hardware de Voz.");
            hablar("William, describe la misión.");
            recognition.start();
            recognition.onresult = (e) => {
                const text = e.results[0][0].transcript;
                ordenActiva.bitacora_ia = text;
                document.getElementById("ai-log-display").innerText = text;
                if(text.toLowerCase().includes("aceite")) ordenActiva.items.push({ tipo:'REPUESTO', desc:'CAMBIO ACEITE', costo:80000, venta:145000 });
                recalcularFinanzas();
            };
        };

        // --- CRM WHATSAPP ---
        document.getElementById("btnWppCRM").onclick = () => {
            const { placa, cliente, telefono, items, costos_totales } = ordenActiva;
            let msg = `*🛰️ TallerPRO360 NEXUS-X: REPORTE*\nVehículo: *${placa.toUpperCase()}*\n`;
            items.forEach(i => msg += `• ${i.desc.toUpperCase()} ($${Number(i.venta).toLocaleString()})\n`);
            msg += `\n*TOTAL: $${costos_totales.total.toLocaleString()}*\n*SALDO: $${costos_totales.saldo_pendiente.toLocaleString()}*`;
            const phone = telefono.replace(/\D/g, '').startsWith('57') ? telefono.replace(/\D/g, '') : `57${telefono.replace(/\D/g, '')}`;
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
        };

        // --- PAGOS BOLD (PULL DE CONFIG) ---
        document.getElementById("btnPagarBold").onclick = async () => {
            const configSnap = await getDoc(doc(db, "configuracion", empresaId));
            const boldKey = configSnap.data()?.bold_api_key;
            if(!boldKey) return hablar("Configura tu cuenta Bold en el Dashboard.");
            
            hablar("Generando enlace de pago por el saldo pendiente.");
            const link = `https://bold.co/pay/tallerpro360-${ordenActiva.placa}`;
            window.open(`https://api.whatsapp.com/send?phone=${ordenActiva.telefono}&text=${encodeURIComponent('Pague aquí su saldo: ' + link)}`, '_blank');
        };

        // --- FICHA TÉCNICA (ESTILO CDA COLOMBIA) ---
        document.getElementById("btnImprimirFicha").onclick = () => {
            const win = window.open('', '_blank');
            win.document.write(`<html><body style="font-family:sans-serif; width:300px; padding:20px; border:1px solid #000; font-size:11px">
                <center><b>TallerPRO360 - FICHA TÉCNICA</b><br>PLACA: ${ordenActiva.placa}</center><hr>
                <b>CLIENTE:</b> ${ordenActiva.cliente}<br><b>FECHA:</b> ${new Date().toLocaleDateString()}<hr>
                <b>DIAGNÓSTICO:</b> ${ordenActiva.bitacora_ia}<br><hr>
                <b>GARANTÍA:</b> Según Ley 1480 de 2011 (Colombia), 30 días en mano de obra.
            </body></html>`);
            win.print();
        };

        // --- SINCRONIZACIÓN TOTAL (ERP/CRM/PAGOS) ---
        document.getElementById("btnSincronizar").onclick = async () => {
            const btn = document.getElementById("btnSincronizar");
            btn.innerText = "🛰️ SINCRONIZANDO...";
            try {
                const idOT = ordenActiva.id || `OT_${Date.now()}`;
                const dataFinal = {
                    ...ordenActiva, empresaId,
                    placa: document.getElementById("f-placa").value.toUpperCase(),
                    cliente: document.getElementById("f-cliente").value,
                    telefono: document.getElementById("f-telefono").value,
                    estado: document.getElementById("f-estado").value,
                    updatedAt: serverTimestamp()
                };
                await setDoc(doc(db, "ordenes", idOT), dataFinal);
                
                // DISPARADOR CONTABILIDAD (ERP)
                if(dataFinal.estado === 'LISTO') {
                    await setDoc(doc(db, "contabilidad", `MOV_${idOT}`), {
                        tipo: 'INGRESO', monto: dataFinal.costos_totales.total,
                        referencia: dataFinal.placa, empresaId, fecha: serverTimestamp(),
                        utilidad_real: dataFinal.costos_totales.utilidad
                    });
                }
                hablar("Misión sincronizada exitosamente.");
                document.getElementById("nexus-terminal").classList.add("hidden");
            } catch (e) { btn.innerText = "FALLO DE SISTEMA"; }
        };

        window.updateFinanza = (tipo, val) => {
            if(tipo === 'cafeteria') ordenActiva.gastos_varios.cafeteria = Number(val);
            if(tipo === 'adelanto') ordenActiva.gastos_varios.adelanto_tecnico = Number(val);
            if(tipo === 'abono') ordenActiva.abonos = Number(val);
            recalcularFinanzas();
        };
        window.editItem = (idx, c, v) => { ordenActiva.items[idx][c] = v; recalcularFinanzas(); };
        window.removeItem = (idx) => { ordenActiva.items.splice(idx, 1); recalcularFinanzas(); };
    };

    const vincularNavegacion = () => {
        document.getElementById("btnNewMission").onclick = () => abrirTerminal();
        document.querySelectorAll(".fase-tab").forEach(tab => tab.onclick = () => { faseActual = tab.dataset.fase; cargarGrid(faseActual); });
    };

    const cargarGrid = (fase) => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        onSnapshot(q, (snap) => {
            const counts = { COTIZACION: 0, INGRESO: 0, DIAGNOSTICO: 0, REPARACION: 0, LISTO: 0 };
            const grilla = [];
            snap.docs.forEach(d => {
                const dt = d.data();
                if(counts.hasOwnProperty(dt.estado)) counts[dt.estado]++;
                if(dt.estado === fase) grilla.push({ id: d.id, ...dt });
            });
            Object.keys(counts).forEach(f => { if(document.getElementById(`count-${f}`)) document.getElementById(`count-${f}`).innerText = counts[f]; });
            document.getElementById("grid-ordenes").innerHTML = grilla.map(o => `
                <div onclick="abrirTerminalNexus('${o.id}')" class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer group">
                    <div class="flex justify-between mb-4">
                        <span class="orbitron text-3xl font-black text-white group-hover:text-cyan-400 transition-all">${o.placa}</span>
                    </div>
                    <p class="text-[10px] text-slate-500 orbitron uppercase italic">${o.cliente || 'ANÓNIMO'}</p>
                    <div class="mt-8 flex justify-between items-end">
                        <span class="text-2xl font-black text-white orbitron">$ ${Number(o.costos_totales?.total || 0).toLocaleString()}</span>
                        <i class="fas fa-chevron-right text-slate-800 group-hover:text-cyan-400 transition-all"></i>
                    </div>
                </div>`).join('');
        });
    };

    window.abrirTerminalNexus = (id) => abrirTerminal(id);
    renderBase();
}
