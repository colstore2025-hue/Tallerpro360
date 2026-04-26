/**
 * ordenes.js - NEXUS-X "THE TITAN" V18.0 QUANTUM-SAP 🛰️
 * SISTEMA INTEGRADO DE LOGÍSTICA AUTOMOTRIZ DE ALTA GAMA
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 */

import { 
    collection, query, where, onSnapshot, doc, getDoc, 
    setDoc, serverTimestamp, writeBatch, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";
import { analizarPrecioSugerido, renderModuloPricing } from "../ai/pricingEnginePRO360.js";

// Inyección de Estilos Futuristas "Cyber-Luxury"
const injectStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .quantum-card {
            background: rgba(13, 17, 23, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 242, 255, 0.1);
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .quantum-card:hover {
            border-color: #00f2ff;
            transform: translateY(-5px);
            box-shadow: 0 0 30px rgba(0, 242, 255, 0.2);
        }
        .neon-text-gradient {
            background: linear-gradient(90deg, #fff, #00f2ff, #7000ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .btn-nexus {
            background: linear-gradient(135deg, #00f2ff 0%, #7000ff 100%);
            border: none;
            clip-path: polygon(10% 0, 100% 0, 90% 100%, 0% 100%);
            transition: all 0.3s;
        }
        .btn-nexus:hover {
            filter: brightness(1.2);
            padding-left: 30px;
            padding-right: 30px;
        }
    `;
    document.head.appendChild(style);
};

injectStyles();

// --- LÓGICA DE INTEGRACIÓN DE MÓDULOS ---

export default async function ordenes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenActiva = null;

    // Conexión con Clientes: Valida si el cliente es VIP o tiene crédito
    const validarClienteQuantum = async (telefono) => {
        const q = query(collection(db, "clientes"), where("telefono", "==", telefono), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        return snap.empty ? null : snap.docs[0].data();
    };

    // Conexión con Inventario: Descontar stock al cerrar orden
    const afectarInventario = async (batch, items) => {
        items.forEach(item => {
            if(item.tipo === 'REPUESTO' && item.sku) {
                const invRef = doc(db, "inventario", item.sku);
                batch.update(invRef, { stock: increment(-1) });
            }
        });
    };

    // Motor de Cálculo SAP-BI V18
    const recalcularFinanzas = () => {
        if (!ordenActiva) return;
        let c = { mo_costo: 0, mo_venta: 0, rep_costo: 0, rep_venta: 0 };

        ordenActiva.items.forEach(i => {
            if(i.tipo === 'REPUESTO' && i.origen === 'TALLER') {
                c.rep_costo += Number(i.costo || 0);
                c.rep_venta += Number(i.venta || 0);
            } else if(i.tipo === 'MANO_OBRA') {
                c.mo_costo += Number(i.costo || 0);
                c.mo_venta += Number(i.venta || 0);
            }
        });

        const insumosGravados = Number(document.getElementById("f-insumos-iva")?.value || 0);
        const subtotal = c.rep_venta + c.mo_venta + insumosGravados;
        const iva = subtotal * 0.19;
        const total = subtotal + iva + Number(document.getElementById("f-otros")?.value || 0);
        
        // Margen Bruto Real
        const utilidad = (subtotal) - (c.rep_costo + c.mo_costo);

        ordenActiva.finanzas = { total, iva, subtotal, utilidad, saldo: total - Number(document.getElementById("f-anticipo")?.value || 0) };
        
        renderPanelFinanciero();
    };

    const renderTerminal = () => {
        const modal = document.getElementById("nexus-terminal");
        modal.innerHTML = `
        <div class="max-w-[1700px] mx-auto animate-in slide-in-from-bottom-10 duration-500">
            <div class="flex justify-between items-center p-10 bg-black/40 border-b border-cyan-500/20 mb-10 rounded-t-[3rem]">
                <div>
                    <h2 class="orbitron text-5xl font-black neon-text-gradient italic">${ordenActiva.placa || 'NEW_MISSION'}</h2>
                    <p class="text-[9px] orbitron text-cyan-400 tracking-[0.5em]">OPERATIONAL TERMINAL / SECURE_LINK</p>
                </div>
                <div class="flex gap-4">
                    <button id="btnVoice" class="w-14 h-14 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"><i class="fas fa-microphone"></i></button>
                    <button id="btnCloseTerminal" class="w-14 h-14 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all text-xl">✕</button>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-8 px-10">
                <div class="col-span-12 lg:col-span-3 space-y-6">
                    <div class="quantum-card p-8 rounded-[2rem]">
                        <h3 class="orbitron text-xs font-black text-cyan-500 mb-6 flex justify-between">CLIENT_DATA <i class="fas fa-user-shield"></i></h3>
                        <input id="f-cliente" value="${ordenActiva.cliente || ''}" placeholder="OWNER_NAME" class="w-full bg-white/5 border-none p-4 rounded-xl text-white orbitron text-[11px] mb-4">
                        <input id="f-telefono" value="${ordenActiva.telefono || ''}" placeholder="WHATSAPP_LINK" class="w-full bg-white/5 border-none p-4 rounded-xl text-green-400 orbitron text-[11px]">
                        
                        <div class="mt-8 flex flex-col gap-2">
                            <button onclick="window.sendWA('ENTRY')" class="btn-nexus py-3 text-[9px] orbitron font-black text-black">DISPATCH ENTRY NOTIFICATION</button>
                            <button onclick="window.sendWA('READY')" class="btn-nexus py-3 text-[9px] orbitron font-black text-black" style="filter: hue-rotate(140deg)">DISPATCH READY NOTIFICATION</button>
                        </div>
                    </div>

                    <div class="quantum-card p-8 rounded-[2rem] border-l-4 border-purple-600">
                        <h3 class="orbitron text-xs font-black text-purple-500 mb-6">AI_DIAGNOSTIC_HUB</h3>
                        <div id="pricing-engine-container"></div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-6 space-y-6">
                    <div class="quantum-card p-10 rounded-[3rem] min-h-[500px] flex flex-col">
                        <div class="flex justify-between items-center mb-10">
                             <h4 class="orbitron font-black text-white text-xl italic">SERVICE_ITEMS</h4>
                             <div class="flex gap-2">
                                <button onclick="window.addItem('REPUESTO')" class="px-4 py-2 bg-white/5 text-[9px] orbitron rounded-lg border border-white/10 hover:bg-white hover:text-black transition-all">+ PART</button>
                                <button onclick="window.addItem('MANO_OBRA')" class="px-4 py-2 bg-white/5 text-[9px] orbitron rounded-lg border border-white/10 hover:bg-white hover:text-black transition-all">+ LABOR</button>
                             </div>
                        </div>
                        <div id="items-container" class="space-y-4 flex-1"></div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-3 space-y-6">
                    <div class="quantum-card p-8 rounded-[2.5rem] bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
                        <p class="orbitron text-[10px] text-cyan-400 mb-2">GROSS_TOTAL_REVENUE</p>
                        <h2 id="total-factura" class="orbitron text-6xl font-black text-white italic tracking-tighter mb-10">$ 0</h2>
                        
                        <div id="finance-summary" class="space-y-4">
                            </div>
                    </div>

                    <div class="quantum-card p-8 rounded-[2.5rem]">
                        <label class="orbitron text-[9px] text-slate-500 mb-4 block">ADJUSTMENTS</label>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] orbitron text-slate-300">INSUMOS (+)</span>
                                <input id="f-insumos-iva" type="number" onchange="window.nexusRecalcular()" class="w-24 bg-black/40 border-none p-2 rounded text-right text-white">
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] orbitron text-green-500">ANTICIPO (-)</span>
                                <input id="f-anticipo" type="number" onchange="window.nexusRecalcular()" class="w-24 bg-black/40 border-none p-2 rounded text-right text-green-500">
                            </div>
                        </div>
                    </div>

                    <button id="btnSync" class="w-full py-8 bg-white text-black orbitron font-black text-xl rounded-3xl hover:bg-cyan-500 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">🛰️ SYNC_TO_CLOUD</button>
                </div>
            </div>
        </div>`;
        
        renderModuloPricing(document.getElementById('pricing-engine-container'));
        vincularAccionesTerminal();
        recalcularFinanzas();
    };

    const ejecutarSincronizacionTotal = async () => {
        const btn = document.getElementById("btnSync");
        btn.innerHTML = `<i class="fas fa-satellite-dish animate-spin"></i> UPLOADING...`;
        
        try {
            const batch = writeBatch(db);
            const id = ordenActiva.id || `OT_${document.getElementById('f-placa').value}_${Date.now()}`;
            
            const dataFinal = {
                ...ordenActiva,
                id,
                empresaId,
                placa: document.getElementById('f-placa').value.toUpperCase(),
                cliente: document.getElementById('f-cliente').value,
                telefono: document.getElementById('f-telefono').value,
                updatedAt: serverTimestamp(),
                finanzas: ordenActiva.finanzas
            };

            // 1. Persistencia en Órdenes
            batch.set(doc(db, "ordenes", id), dataFinal);

            // 2. Enlace con Contabilidad Core
            batch.set(doc(db, "contabilidad", `ACC_${id}`), {
                empresaId,
                total: dataFinal.finanzas.total,
                utilidad: dataFinal.finanzas.utilidad,
                tipo: 'SERVICIO_TALLER',
                referencia: dataFinal.placa,
                fecha: serverTimestamp()
            });

            // 3. Afectar Inventario (Si aplica)
            await afectarInventario(batch, dataFinal.items);

            await batch.commit();
            hablar("Misión cumplida, datos encriptados en la nube");
            Swal.fire({ title: 'NEXUS SYNC OK', icon: 'success', background: '#0d1117', color: '#fff' });
            document.getElementById("nexus-terminal").classList.add("hidden");
        } catch (e) {
            console.error(e);
            btn.innerHTML = `🛰️ RETRY_SYNC`;
        }
    };
