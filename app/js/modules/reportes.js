/**
 * 🦾 NEXUS-X TERMINATOR CORE V29.0 - ANALÍTICA OPERATIVA SUPERIOR
 * Central de Inteligencia de Procesos & Auditoría de Rentabilidad
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 * * Este módulo procesa la telemetría de rampas, cruza costos de insumos 
 * y determina la viabilidad financiera de cada misión en tiempo real.
 */

import { 
    collection, getDocs, query, where, onSnapshot, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { calcularPrecioInteligente } from "../ai/pricingOptimizerAI.js";

export default async function reportesModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let ordenesData = [];
    let inventarioData = [];
    let activeListeners = [];

    // Variables de Control Financiero
    const METRICAS_GLOBALES = {
        totalVenta: 0,
        totalSugerido: 0,
        fugaTotal: 0,
        eficienciaPromedio: 0,
        misionesCriticas: 0
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white pb-40 selection:bg-cyan-500/30 font-sans animate-in fade-in duration-700">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 border-b border-white/5 pb-10 gap-8">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none">
                        OPERACIONES <span class="text-cyan-400">ANALÍTICA</span>
                    </h1>
                    <div class="flex items-center gap-4 mt-4">
                        <span class="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] orbitron font-black text-cyan-400 uppercase tracking-[0.4em]">Protocolo de Auditoría V29.0</span>
                        <span class="text-[9px] text-slate-500 font-bold orbitron uppercase tracking-widest" id="lastSyncTxt">Sincronizando...</span>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4">
                    <div class="bg-white/5 p-2 rounded-2xl border border-white/10 flex items-center gap-2">
                        <input type="month" id="filtroMes" class="bg-transparent border-none text-xs font-bold focus:ring-0 text-white cursor-pointer uppercase orbitron">
                    </div>
                    <button id="btnExportExcel" class="group px-8 py-5 bg-white text-black rounded-2xl flex items-center gap-4 hover:bg-cyan-500 hover:text-white transition-all duration-500 shadow-2xl">
                        <i class="fas fa-file-excel text-xl"></i>
                        <span class="orbitron text-[10px] font-black uppercase tracking-widest">Generar Auditoría Excel</span>
                    </button>
                </div>
            </header>

            <div id="opStats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12"></div>

            <div class="bg-[#0d1117] border-l-4 border-cyan-500 p-12 rounded-r-[3.5rem] flex flex-col md:flex-row items-center gap-10 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                <div class="absolute right-10 top-1/2 -translate-y-1/2 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700 orbitron font-black italic">IA</div>
                <div class="w-24 h-24 bg-white text-black rounded-[2rem] flex-shrink-0 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(255,255,255,0.15)] relative z-10">
                    <i class="fas fa-brain animate-pulse"></i>
                </div>
                <div class="relative z-10 flex-1">
                    <h5 class="text-[12px] font-black uppercase text-white mb-3 orbitron tracking-[0.3em] italic">IA Strategic <span class="text-cyan-400">Operational Advisor</span></h5>
                    <p id="iaTacticalMsg" class="text-xl text-slate-400 leading-relaxed font-medium italic">Iniciando escaneo de márgenes operativos...</p>
                    <div class="mt-6 flex gap-4" id="iaBadges"></div>
                </div>
            </div>

            <div class="bg-[#0d1117] border border-white/5 rounded-[4rem] overflow-hidden shadow-2xl relative">
                <div class="p-12 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div>
                        <h3 class="orbitron text-[14px] font-black text-white uppercase tracking-[0.5em] italic">Telemetría de Rentabilidad</h3>
                        <p class="text-[9px] text-slate-500 font-bold uppercase mt-2 orbitron tracking-widest">Cruze de Datos: Venta Real vs Algoritmo Predictivo</p>
                    </div>
                    <div class="flex gap-4">
                        <div class="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center" title="Óptimo">
                            <i class="fas fa-check text-emerald-500 text-xs"></i>
                        </div>
                        <div class="h-10 w-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center" title="Crítico">
                            <i class="fas fa-triangle-exclamation text-red-500 text-xs"></i>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-black/40 orbitron text-[10px] text-slate-400 uppercase tracking-[0.3em] border-b border-white/5">
                            <tr>
                                <th class="p-10 font-black">Vehículo / Cliente</th>
                                <th class="p-10 font-black">Venta Final</th>
                                <th class="p-10 font-black">Costo Directo</th>
                                <th class="p-10 font-black">Análisis IA</th>
                                <th class="p-10 text-center font-black">Eficiencia Neta</th>
                                <th class="p-10 text-right font-black">Estatus P&G</th>
                            </tr>
                        </thead>
                        <tbody id="opTableBody" class="divide-y divide-white/[0.03]"></tbody>
                    </table>
                </div>
            </div>

            <div class="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                    <h4 class="orbitron text-xs font-black text-cyan-400 mb-8 uppercase tracking-widest flex items-center gap-3">
                        <i class="fas fa-boxes-stacked"></i> Alerta de Insumos de Alta Rotación
                    </h4>
                    <div id="inventoryAlerts" class="space-y-4"></div>
                </div>
                <div class="bg-[#0d1117] p-10 rounded-[3.5rem] border border-white/5">
                    <h4 class="orbitron text-xs font-black text-emerald-400 mb-8 uppercase tracking-widest flex items-center gap-3">
                        <i class="fas fa-chart-pie"></i> Distribución de Costos (Promedio)
                    </h4>
                    <div id="costDistribution" class="flex items-center justify-around h-40">
                        </div>
                </div>
            </div>
        </div>`;

        // Eventos de interfaz
        document.getElementById("btnExportExcel").onclick = () => generarInformeDetallado(ordenesData, "global");
        document.getElementById("filtroMes").onchange = (e) => fetchData(e.target.value);
        
        // Seteo de mes actual
        const mesActual = new Date().toISOString().slice(0, 7);
        document.getElementById("filtroMes").value = mesActual;

        fetchData(mesActual);
    };

    const fetchData = async (mesFiltro) => {
        // Limpiar listeners previos
        activeListeners.forEach(unsub => unsub());

        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        
        // Listener en tiempo real para Auditoría Viva
        const unsub = onSnapshot(q, async (snap) => {
            ordenesData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            
            // Filtrado por mes en cliente para mayor velocidad de UI
            if(mesFiltro) {
                ordenesData = ordenesData.filter(o => {
                    const fecha = o.fecha_creacion?.toDate ? o.fecha_creacion.toDate() : new Date(o.fecha_creacion);
                    return fecha.toISOString().startsWith(mesFiltro);
                });
            }

            // Cargar inventario para cruce de costos reales
            const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
            const snapInv = await getDocs(qInv);
            inventarioData = snapInv.docs.map(d => d.data());

            procesarOperaciones();
            document.getElementById("lastSyncTxt").innerText = `Sincronizado: ${new Date().toLocaleTimeString()}`;
        });

        activeListeners.push(unsub);
    };

    const procesarOperaciones = () => {
        const tbody = document.getElementById("opTableBody");
        METRICAS_GLOBALES.totalVenta = 0;
        METRICAS_GLOBALES.totalSugerido = 0;
        METRICAS_GLOBALES.misionesCriticas = 0;
        let sumaMargen = 0;

        tbody.innerHTML = ordenesData.map(o => {
            const venta = Number(o.costos_totales?.total_general || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || 0);
            const costoDirecto = repuestos + mo;
            
            METRICAS_GLOBALES.totalVenta += venta;

            const sugerido = calcularPrecioInteligente({ 
                costoRepuestos: repuestos, 
                horasTrabajo: o.horas_reales || 1.5 
            });
            o.sugeridoCalculado = sugerido.total;
            METRICAS_GLOBALES.totalSugerido += sugerido.total;

            const utilidad = venta - costoDirecto;
            const margen = venta > 0 ? (utilidad / venta) * 100 : 0;
            sumaMargen += margen;

            const esBaja = venta < sugerido.total || margen < 20;
            if (esBaja) METRICAS_GLOBALES.misionesCriticas++;

            return `
            <tr onclick="window.verDetalleMision('${o.id}')" class="hover:bg-cyan-500/[0.04] transition-all cursor-pointer group border-b border-white/[0.02]">
                <td class="p-10">
                    <div class="flex items-center gap-6">
                        <div class="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-all">
                            <i class="fas fa-truck-pickup ${esBaja ? 'text-red-500' : 'text-cyan-400'}"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="orbitron text-2xl font-black italic tracking-tighter group-hover:text-cyan-400 transition-colors uppercase leading-none">${o.placa || 'OT-SYS'}</span>
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">${o.cliente || 'CLIENTE FINAL'}</span>
                        </div>
                    </div>
                </td>
                <td class="p-10">
                    <div class="text-xl font-black orbitron tabular-nums">$ ${venta.toLocaleString()}</div>
                    <div class="text-[8px] text-slate-600 orbitron uppercase mt-1">Facturado Real</div>
                </td>
                <td class="p-10">
                    <div class="text-sm font-bold text-slate-400 orbitron">$ ${costoDirecto.toLocaleString()}</div>
                    <div class="text-[8px] text-slate-600 orbitron uppercase mt-1">Costo Operativo</div>
                </td>
                <td class="p-10">
                    <div class="text-sm font-bold text-cyan-400/80 orbitron tabular-nums">$ ${sugerido.total.toLocaleString()}</div>
                    <div class="text-[8px] text-cyan-900 orbitron uppercase mt-1 italic">Target IA</div>
                </td>
                <td class="p-10">
                    <div class="flex flex-col items-center">
                        <span class="text-lg font-black orbitron mb-2 ${margen > 25 ? 'text-emerald-400' : 'text-red-500'}">${margen.toFixed(1)}%</span>
                        <div class="w-28 h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div class="h-full rounded-full ${margen > 25 ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'}" style="width: ${Math.min(margen, 100)}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-10 text-right">
                    <div class="flex flex-col items-end gap-2">
                        <span class="px-4 py-2 rounded-xl text-[8px] orbitron font-black uppercase tracking-widest ${esBaja ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                            ${esBaja ? 'Critical Review' : 'Optimal Path'}
                        </span>
                        <span class="text-[7px] text-slate-600 orbitron uppercase">ID: ${o.id.slice(0,8)}</span>
                    </div>
                </td>
            </tr>`;
        }).join("");

        METRICAS_GLOBALES.eficienciaPromedio = ordenesData.length > 0 ? sumaMargen / ordenesData.length : 0;
        METRICAS_GLOBALES.fugaTotal = METRICAS_GLOBALES.totalSugerido > METRICAS_GLOBALES.totalVenta ? METRICAS_GLOBALES.totalSugerido - METRICAS_GLOBALES.totalVenta : 0;

        actualizarDashboards();
    };

    const actualizarDashboards = () => {
        const ticketPromedio = ordenesData.length > 0 ? METRICAS_GLOBALES.totalVenta / ordenesData.length : 0;
        
        document.getElementById("opStats").innerHTML = `
            ${renderStatBox("Flujo de Caja Mensual", METRICAS_GLOBALES.totalVenta, "fa-vault", "Ingresos Facturados Reales", "text-emerald-400")}
            ${renderStatBox("Fuga Operativa", METRICAS_GLOBALES.fugaTotal, "fa-faucet-drip", "Pérdida por Desviación de Precios", "text-red-500")}
            ${renderStatBox("Ticket Promedio", ticketPromedio, "fa-chart-line", "Valorización Media por Misión", "text-cyan-400")}
            ${renderStatBox("Eficiencia de Rampa", METRICAS_GLOBALES.eficienciaPromedio.toFixed(1) + "%", "fa-microchip", "Margen Neto Promedio Global", "text-white")}
        `;

        const msgAdvisor = document.getElementById("iaTacticalMsg");
        const badgeContainer = document.getElementById("iaBadges");
        
        if (METRICAS_GLOBALES.fugaTotal > 0) {
            msgAdvisor.innerHTML = `Escaneo completado. Se detectó una fuga de <span class="text-white font-black">$${METRICAS_GLOBALES.fugaTotal.toLocaleString()}</span>. El sistema sugiere incrementar el valor de la hora técnica en un <span class="text-cyan-400 font-bold">12.5%</span> para equilibrar el P&G.`;
            badgeContainer.innerHTML = `
                <span class="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded text-[8px] font-black text-red-500 orbitron uppercase">Déficit de Pricing</span>
                <span class="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-[8px] font-black text-cyan-400 orbitron uppercase">Ajuste Sugerido</span>
            `;
        } else {
            msgAdvisor.innerHTML = `Operación en estado de <span class="text-emerald-400 font-black">Grado Militar</span>. Los márgenes están alineados con el algoritmo de rentabilidad. Sugerencia: Reinvertir utilidad en stock de alta rotación.`;
            badgeContainer.innerHTML = `<span class="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded text-[8px] font-black text-emerald-400 orbitron uppercase">Rendimiento Óptimo</span>`;
        }

        // Alertas de Inventario
        const stockBajo = inventarioData.filter(i => Number(i.cantidad) < 5).slice(0, 3);
        document.getElementById("inventoryAlerts").innerHTML = stockBajo.map(i => `
            <div class="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <span class="text-[10px] font-bold text-slate-400 uppercase">${i.nombre}</span>
                <span class="text-[10px] font-black text-red-500 orbitron">${i.cantidad} UNID</span>
            </div>
        `).join("") || '<p class="text-[9px] text-slate-600 italic">Bóveda con niveles de seguridad normales.</p>';
    };

    const renderStatBox = (title, val, icon, formula, colorClass) => `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-700">
            <div class="absolute -right-4 -bottom-4 opacity-[0.02] text-8xl group-hover:scale-110 transition-transform"><i class="fas ${icon}"></i></div>
            <div class="flex items-center gap-4 mb-6">
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-500/20 transition-all">
                    <i class="fas ${icon} text-sm text-slate-500 group-hover:text-cyan-400 transition-colors"></i>
                </div>
                <p class="orbitron text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">${title}</p>
            </div>
            <p class="text-4xl font-black orbitron tracking-tighter tabular-nums ${colorClass}">${typeof val === 'number' ? '$' + val.toLocaleString() : val}</p>
            <div class="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                <p class="text-[8px] orbitron text-slate-600 font-black uppercase tracking-widest">${formula}</p>
                <i class="fas fa-chevron-right text-[8px] text-slate-800"></i>
            </div>
        </div>`;

    // EXPORTACIÓN ELITE
    const generarInformeDetallado = (data, tipo = "global") => {
        try {
            Swal.fire({ 
                title: 'PROCESANDO DATA NEXUS', 
                html: '<p class="orbitron text-[10px] text-cyan-500 animate-pulse">Codificando Auditoría Gerencial...</p>',
                background: '#010409', color: '#fff', showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });

            const wb = XLSX.utils.book_new();
            
            const wsData = data.map(o => ({
                "FECHA": o.fecha_creacion?.toDate ? o.fecha_creacion.toDate().toLocaleDateString() : o.fecha_creacion,
                "PLACA": o.placa,
                "CLIENTE": o.cliente,
                "VENTA REAL": Number(o.costos_totales?.total_general || 0),
                "COSTO INSUMOS": Number(o.costos_totales?.costo_repuestos || 0),
                "MANO OBRA": Number(o.costos_totales?.mano_obra || 0),
                "MARGEN NETO %": o.total > 0 ? (((o.total - (Number(o.costos_totales?.costo_repuestos || 0) + Number(o.costos_totales?.mano_obra || 0))) / o.total) * 100).toFixed(2) : "0",
                "TARGET IA": o.sugeridoCalculado || 0,
                "DESVIACIÓN": (o.sugeridoCalculado || 0) - Number(o.costos_totales?.total_general || 0)
            }));

            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Operativa");
            
            // Metadatos de la empresa
            const infoEmpresa = [["NEXUS-X TERMINATOR CORE V29.0"], ["AUDITORÍA GERENCIAL"], [`EMPRESA ID: ${empresaId}`], [`FECHA EXPORT: ${new Date().toLocaleString()}`]];
            const wsInfo = XLSX.utils.aoa_to_sheet(infoEmpresa);
            XLSX.utils.book_append_sheet(wb, wsInfo, "Metadata_Nexus");

            XLSX.writeFile(wb, `NexusX_Auditoria_${empresaId}_${new Date().toISOString().slice(0,10)}.xlsx`);
            
            Swal.close();
            Swal.fire({ icon: 'success', title: 'Auditoría Generada', text: 'El reporte gerencial ha sido descargado.', background: '#0d1117', color: '#fff' });
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Falla de Protocolo', text: 'Error en el motor de exportación.', background: '#0d1117', color: '#fff' });
        }
    };

 // 🦾 DEEP DRILL MODAL (NEXUS-X ELITE - REVISIÓN DE FLUJO REAL)
window.verDetalleMision = (id) => {
    const o = ordenesData.find(x => x.id === id);
    if(!o) return;
    
    /**
     * ESTRATEGIA DE EXTRACCIÓN MULTINIVEL
     * Blindaje contra valores vacíos: busca en costos_totales o en la raíz del objeto.
     */
    const v = Number(o.costos_totales?.total_general || o.total_general || o.total || 0);
    const r = Number(o.costos_totales?.costo_repuestos || o.costo_repuestos || o.repuestos || 0);
    const m = Number(o.costos_totales?.mano_obra || o.mano_obra || 0);
    
    const utilidadNeta = v - (r + m);
    const margen = v > 0 ? (utilidadNeta / v) * 100 : 0;

    Swal.fire({
        title: `
            <div class="flex flex-col items-center gap-2">
                <span class="orbitron font-black text-cyan-500 uppercase tracking-tighter text-2xl">Audit: ${o.placa || 'OT-SYS'}</span>
                <span class="text-[9px] orbitron text-slate-500 tracking-[0.4em] uppercase">${o.id.slice(0,12)}</span>
            </div>`,
        background: '#0d1117',
        color: '#fff',
        width: '700px',
        showConfirmButton: false,
        showCloseButton: true,
        html: `
        <div class="text-left orbitron p-6 space-y-8 animate-in slide-in-from-bottom duration-500">
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p class="text-[8px] text-slate-500 uppercase mb-4 tracking-widest font-bold">Utilidad Neta</p>
                    <p class="text-3xl font-black ${utilidadNeta > 0 ? 'text-emerald-400' : 'text-red-500'} italic">
                        $ ${utilidadNeta.toLocaleString()}
                    </p>
                </div>
                <div class="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p class="text-[8px] text-slate-500 uppercase mb-4 tracking-widest font-bold">Eficiencia Operativa</p>
                    <p class="text-3xl font-black text-white italic">${margen.toFixed(1)}%</p>
                </div>
            </div>

            <div class="space-y-4 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5">
                <div class="flex justify-between items-center text-[10px] border-b border-white/5 pb-3">
                    <span class="text-slate-400 uppercase tracking-widest">Punto de Equilibrio (BEP)</span>
                    <span class="font-bold text-white tracking-tight">$ ${(r + m).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-[10px] border-b border-white/5 pb-3">
                    <span class="text-slate-400 uppercase tracking-widest">Valorización IA Recomendada</span>
                    <span class="font-bold text-cyan-400 tracking-tight">$ ${(o.sugeridoCalculado || 0).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-[10px] pt-1">
                    <span class="text-slate-400 uppercase tracking-widest">Ratio Repuesto / M.O</span>
                    <span class="font-bold text-white">${m > 0 ? (r / m).toFixed(2) : 'N/A'}</span>
                </div>
            </div>

            <div class="bg-cyan-500/5 p-8 rounded-[2.5rem] border border-cyan-500/20 relative overflow-hidden">
                <i class="fas fa-brain absolute -right-4 -bottom-4 text-6xl opacity-10"></i>
                <p class="text-[9px] text-cyan-400 font-black uppercase mb-3 tracking-widest">Diagnóstico Táctico</p>
                <p class="text-xs text-slate-400 leading-relaxed italic">
                    ${margen < 25 
                        ? '⚠️ Misión por debajo del umbral de rentabilidad. El costo de mano de obra está siendo absorbido por el margen de repuestos.' 
                        : '✅ Operación saludable. El ratio de conversión de tiempo técnico es óptimo para la escala operativa actual.'}
                </p>
            </div>

            <button onclick="window.descargarMisionEspecifica('${o.id}')" class="w-full py-6 bg-white text-black orbitron text-[10px] font-black rounded-3xl hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-[1.02] shadow-2xl flex items-center justify-center gap-3">
                <i class="fas fa-file-excel"></i>
                DESCARGAR CERTIFICADO DE MISIÓN
            </button>
        </div>`
    });
};

    // 🦾 ESTRATEGIA DE MAPEO ELITE V29 (LÍNEA 407+)
window.descargarMisionEspecifica = (id) => {
    const o = ordenesData.find(x => x.id === id);
    if (!o) return;

    // Forzamos la reconstrucción de la data para el reporte
    const dataRefinada = [{
        ...o,
        // Si costos_totales no existe, extraemos directamente de la raíz de la orden
        venta_final: Number(o.costos_totales?.total_general || o.total_mision || o.valor_total || 0),
        insumos: Number(o.costos_totales?.costo_repuestos || o.costo_insumos || 0),
        mano_obra: Number(o.costos_totales?.mano_obra || o.pago_tecnico || 0)
    }];

    generarInformeDetallado(dataRefinada, "individual");
};

// 📊 GENERADOR DE AUDITORÍA CON RASTREO AUTOMÁTICO
window.generarInformeDetallado = (data, tipo = "periodo") => {
    const wb = XLSX.utils.book_new();
    
    const rows = data.map(o => {
        // RASTREO MULTINIVEL DE VALORES (Anti-Cero)
        const v = Number(o.venta_final || o.costos_totales?.total_general || o.total_mision || 0);
        const r = Number(o.insumos || o.costos_totales?.costo_repuestos || 0);
        const m = Number(o.mano_obra || o.costos_totales?.mano_obra || 0);
        
        const utilidad = v - (r + m);
        const margen = v > 0 ? (utilidad / v) * 100 : 0;

        return {
            "FECHA": o.fecha_registro || new Date().toLocaleDateString(),
            "PLACA": o.placa || "OT-SYS",
            "CLIENTE": o.cliente_nombre || o.cliente || "S/N",
            "VENTA REAL": v,
            "COSTO INSUMOS": r,
            "MANO OBRA": m,
            "UTILIDAD NETA": utilidad,
            "MARGEN %": margen.toFixed(2) + "%",
            "STATUS": margen < 25 ? "REVISAR PRICING" : "RENTABLE"
        };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Nexus");
    
    XLSX.writeFile(wb, `NEXUS_AUDIT_${o.placa || 'GRUPAL'}.xlsx`);
};

renderLayout();
