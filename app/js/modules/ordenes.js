/**
 * ordenes.js - NEXUS-X "TITAN ELITE" V15.0 🛰️
 * CONSOLIDACIÓN: MULTIMEDIA + INVENTARIO + WHATSAPP HARLEY-STYLE
 * @author: William Jeffry Urquijo Cubillos
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, writeBatch, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    // --- 1. MOTOR DE ENVÍO "HARLEY-STYLE" ---
    const enviarReporteNexus = async (tipo) => {
        const linkServidor = `https://tallerpro360.web.app/view/${ordenActiva.id}`;
        let mensaje = "";
        
        if(tipo === 'INGRESO') {
            mensaje = `*NEXUS_X LOGISTICS* 🛰️%0AHola *${ordenActiva.cliente}*, su vehículo *${ordenActiva.placa}* ha ingresado a nuestra estación. %0A%0ASiga la trazabilidad en vivo aquí:%0A${linkServidor}`;
        } else if(tipo === 'LISTO') {
            mensaje = `*NEXUS_X FINAL REPORT* ✅%0ASeñor(a) *${ordenActiva.cliente}*, su vehículo *${ordenActiva.placa}* está listo para entrega. %0A%0AFACTURA Y DETALLES:%0A${linkServidor}`;
        }
        
        window.open(`https://wa.me/57${ordenActiva.telefono}?text=${mensaje}`, '_blank');
    };

    // --- 2. MOTOR FINANCIERO & INVENTARIO ---
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let m = { v_rep: 0, c_rep: 0, v_mo: 0, c_mo: 0 };

        ordenActiva.items.forEach(i => {
            const v = Number(i.venta || 0);
            const c = Number(i.costo || 0);
            if (i.tipo === 'REPUESTO') {
                // Solo suma costo si el repuesto lo pone el TALLER
                if(i.origen === 'TALLER') {
                    m.v_rep += v;
                    m.c_rep += c;
                } else {
                    // Si lo trae el cliente, la venta y costo son 0 para el EBITDA
                    m.v_rep += 0; 
                }
            } else {
                m.v_mo += v;
                m.c_mo += c;
            }
        });

        const total = m.v_rep + m.v_mo;
        const ebitda = (total / 1.19) - (m.c_rep + m.c_mo + Number(ordenActiva.insumos || 0));

        ordenActiva.costos_totales = { total, ebitda, saldo: total - Number(ordenActiva.anticipo || 0) };
        renderItems();
        actualizarUIFinanciera();
    };

    // --- 3. TERMINAL TÁCTICA (UI REDISEÑADA) ---
    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1600px] mx-auto pb-40 animate-in zoom-in duration-300">
            <div class="flex flex-col lg:flex-row justify-between items-center mb-8 bg-[#0d1117] p-8 border-b-4 border-red-600 rounded-t-[3rem] gap-6">
                <div class="flex items-center gap-6">
                    <input id="f-placa" value="${ordenActiva.placa}" class="bg-black text-6xl font-black orbitron text-white w-72 uppercase border-2 border-cyan-500 rounded-2xl text-center shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                    
                    <div class="flex gap-2">
                        <button onclick="window.nexusCamara()" class="w-16 h-16 bg-white text-black rounded-xl hover:bg-cyan-500 transition-all flex items-center justify-center shadow-lg"><i class="fas fa-camera text-2xl"></i></button>
                        <button onclick="window.nexusGaleria()" class="w-16 h-16 bg-slate-800 text-white rounded-xl hover:bg-cyan-500 transition-all flex items-center justify-center border border-white/10"><i class="fas fa-images text-2xl"></i></button>
                    </div>
                </div>

                <div class="flex items-center gap-4 bg-black/50 p-3 rounded-2xl border border-white/5">
                    <span class="orbitron text-[9px] text-slate-500 px-4">ESTADO_ACTUAL:</span>
                    <select id="f-estado" onchange="window.cambiarEstado(this.value)" class="bg-transparent text-cyan-400 orbitron font-black text-xl outline-none cursor-pointer">
                        ${['COTIZACION', 'INGRESO', 'DIAGNOSTICO', 'REPARACION', 'LISTO', 'ENTREGADO'].map(e => 
                            `<option value="${e}" ${ordenActiva.estado === e ? 'selected' : ''} class="bg-black">${e}</option>`).join('')}
                    </select>
                </div>

                <button id="btnCloseTerminal" class="w-16 h-16 bg-red-600/20 text-red-500 text-2xl font-black rounded-full border border-red-600/50 hover:bg-red-600 hover:text-white transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-4 space-y-6">
                    <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                        <h4 class="orbitron font-black text-cyan-500 text-[10px] mb-6 tracking-[0.3em]">CLIENT_LINK_SYSTEM</h4>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="NOMBRE CLIENTE" class="w-full bg-black p-5 mb-4 text-white font-black uppercase text-xs border border-white/5 rounded-2xl focus:border-cyan-500">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP (+57)" class="w-full bg-black p-5 mb-6 text-green-400 font-bold border border-white/5 rounded-2xl focus:border-green-500">
                        
                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="enviarReporteNexus('INGRESO')" class="py-4 bg-green-600/10 border border-green-600/30 text-green-500 orbitron text-[10px] font-black rounded-xl hover:bg-green-600 hover:text-white">SEND_ENTRY_WA</button>
                            <button onclick="enviarReporteNexus('LISTO')" class="py-4 bg-cyan-600/10 border border-cyan-600/30 text-cyan-500 orbitron text-[10px] font-black rounded-xl hover:bg-cyan-600 hover:text-white">SEND_READY_WA</button>
                        </div>
                    </div>

                    <div class="bg-black/40 p-8 rounded-[2rem] border border-white/5">
                        <h4 class="orbitron font-black text-red-500 text-[9px] mb-4">INVENTORY_CHECK</h4>
                        <div class="grid grid-cols-2 gap-2">
                             ${['Documentos', 'Llanta Rep.', 'Herramienta', 'Radio', 'Manuales', 'Limpieza'].map(check => `
                                <div class="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                    <input type="checkbox" class="w-4 h-4 accent-red-600">
                                    <span class="text-[10px] text-slate-300 orbitron">${check}</span>
                                </div>
                             `).join('')}
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-8 space-y-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-cyan-500/10 relative shadow-2xl">
                        <div id="items-container" class="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll mb-10">
                            </div>

                        <div class="grid grid-cols-2 gap-6">
                            <button onclick="window.addItemNexus('REPUESTO')" class="py-8 bg-white/5 border border-white/10 orbitron text-xs font-black text-white hover:bg-white hover:text-black transition-all rounded-3xl">+ ADD_PART</button>
                            <button onclick="window.addItemNexus('MANO_OBRA')" class="py-8 bg-red-600/10 border border-red-600/20 orbitron text-xs font-black text-red-500 hover:bg-red-600 hover:text-white transition-all rounded-3xl">+ ADD_LABOR</button>
                        </div>
                    </div>

                    <div id="terminal-finanzas" class="grid grid-cols-3 gap-6">
                        </div>

                    <button id="btnSincronizar" class="w-full bg-cyan-500 text-black py-10 orbitron font-black text-4xl rounded-[2.5rem] hover:bg-white hover:shadow-[0_0_50px_rgba(0,242,255,0.4)] transition-all">
                        🛰️ PUSH_TO_NEXUS_CLOUD
                    </button>
                </div>
            </div>
        </div>`;
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    // --- 4. ACCIONES DE CONTROL ---
    window.addItemNexus = async (tipo) => {
        let origen = 'TALLER';
        if(tipo === 'REPUESTO') {
            const { value: res } = await Swal.fire({
                title: 'ORIGEN DEL REPUESTO',
                input: 'select',
                inputOptions: { 'TALLER': 'Stock Taller', 'CLIENTE': 'Traído por Cliente' },
                background: '#0d1117', color: '#fff'
            });
            origen = res || 'TALLER';
        }
        
        ordenActiva.items.push({ 
            tipo, 
            desc: `NUEVO ${tipo}`, 
            costo: 0, 
            venta: 0, 
            origen: origen,
            tecnico: 'POR ASIGNAR'
        });
        recalcularFinanzas();
    };

    window.removeItemNexus = (idx) => {
        Swal.fire({
            title: '¿ELIMINAR ÍTEM?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff003c',
            background: '#0d1117', color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                ordenActiva.items.splice(idx, 1);
                recalcularFinanzas();
            }
        });
    };

    window.renderItems = () => {
        const container = document.getElementById("items-container");
        if(!container) return;
        container.innerHTML = ordenActiva.items.map((item, idx) => `
            <div class="flex items-center gap-6 bg-black p-6 rounded-2xl border ${item.origen === 'CLIENTE' ? 'border-yellow-500/30' : 'border-white/5'} group">
                <div class="flex-1 grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <input onchange="window.updateItem(${idx}, 'desc', this.value)" value="${item.desc}" class="bg-transparent text-white font-black orbitron text-sm w-full outline-none uppercase">
                        <span class="text-[8px] orbitron ${item.origen === 'CLIENTE' ? 'text-yellow-500' : 'text-cyan-500'} font-bold tracking-widest">${item.tipo} | ORIGEN: ${item.origen}</span>
                    </div>
                    <div class="col-span-3">
                        <label class="text-[8px] orbitron text-slate-600 block">COSTO</label>
                        <input type="number" onchange="window.updateItem(${idx}, 'costo', this.value)" value="${item.costo}" class="bg-white/5 w-full p-2 text-red-500 font-bold rounded">
                    </div>
                    <div class="col-span-3">
                        <label class="text-[8px] orbitron text-slate-600 block">VENTA</label>
                        <input type="number" onchange="window.updateItem(${idx}, 'venta', this.value)" value="${item.venta}" class="bg-white/5 w-full p-2 text-green-400 font-bold rounded">
                    </div>
                </div>
                <button onclick="window.removeItemNexus(${idx})" class="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-red-500 transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>`).join('');
    };

    const actualizarUIFinanciera = () => {
        const div = document.getElementById("terminal-finanzas");
        if(!div) return;
        const c = ordenActiva.costos_totales;
        div.innerHTML = `
            <div class="bg-black p-6 rounded-3xl border border-white/5">
                <p class="orbitron text-[8px] text-slate-500 mb-2 uppercase">TOTAL_INVOICE</p>
                <h3 class="orbitron text-4xl font-black text-white">$${Math.round(c.total).toLocaleString()}</h3>
            </div>
            <div class="bg-black p-6 rounded-3xl border border-white/5">
                <p class="orbitron text-[8px] text-green-500 mb-2 uppercase">NET_EBITDA</p>
                <h3 class="orbitron text-4xl font-black text-green-400">$${Math.round(c.ebitda).toLocaleString()}</h3>
            </div>
            <div class="bg-black p-6 rounded-3xl border border-red-600/20">
                <p class="orbitron text-[8px] text-red-500 mb-2 uppercase">PENDING_BALANCE</p>
                <h3 class="orbitron text-4xl font-black text-red-600">$${Math.round(c.saldo).toLocaleString()}</h3>
            </div>`;
    };

    // --- 5. LOGICA DE SINCRONIZACIÓN ATÓMICA ---
    const ejecutarSincronizacion = async () => {
        const btn = document.getElementById("btnSincronizar");
        btn.disabled = true;
        
        try {
            const batch = writeBatch(db);
            const id = ordenActiva.id || `OT_${ordenActiva.placa}_${Date.now()}`;
            
            // Recoger datos de UI
            ordenActiva.cliente = document.getElementById("f-cliente").value;
            ordenActiva.telefono = document.getElementById("f-telefono").value;
            ordenActiva.placa = document.getElementById("f-placa").value.toUpperCase();
            ordenActiva.estado = document.getElementById("f-estado").value;

            // Enlace con otros módulos (CONTABILIDAD / INVENTARIO)
            batch.set(doc(db, "ordenes", id), { ...ordenActiva, updatedAt: serverTimestamp() });
            
            // Si hay EBITDA positivo, registrar ingreso contable
            if(ordenActiva.costos_totales.total > 0) {
                batch.set(doc(db, "contabilidad", `FIN_${id}`), {
                    monto: ordenActiva.costos_totales.total,
                    ebitda: ordenActiva.costos_totales.ebitda,
                    placa: ordenActiva.placa,
                    fecha: serverTimestamp()
                });
            }

            await batch.commit();
            Swal.fire({ title: 'NEXUS_SYNC_COMPLETED', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.disabled = false;
        }
    };

    // Iniciar Módulo
    renderBase();
}
