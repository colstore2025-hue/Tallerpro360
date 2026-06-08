/**
 * 🏛️ TALLERPRO360 - FINANZAS ELITE V1.0 (QUANTUM-SAP ENGINE)
 * Desarrollado por: William Jeffry Urquijo Cubillos // Nexus AI 2026
 * Maniobra: Control de Frecuencias Informales de Nómina, Desinfección Cuántica Anti-NaN,
 * Cierre de Ejercicio Flexible Multitarea y Automatización de Autosumas XLSX.
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function nexusFinanzasElite(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR CRÍTICO: AUTENTICACIÓN SAP REQUERIDA PARA FINANZAS ELITE</div>`;
        return;
    }

    const IVA_FACTOR = 0.19;

    // --- MOTOR DE DESINFECCIÓN CUÁNTICA ANTI-NaN (PROGRAMACIÓN DEFENSIVA SANITIZATION) ---
    const safeNumber = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        
        let cleanStr = String(val).replace(/[\$\s]/g, '');
        
        if (cleanStr.includes('.') && cleanStr.includes(',')) {
            cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        } else if (cleanStr.includes(',') && !cleanStr.includes('.')) {
            cleanStr = cleanStr.replace(',', '.');
        }
        
        const num = Number(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    // --- FORMATEADORES PROFESIONALES ---
    const fmt = (v) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(safeNumber(v));
    };

    const pct = (v) => `${safeNumber(v).toFixed(1)}%`;

    let state = {
        ordenesMaster: [],
        gastosFijosGlobales: 0, 
        nominasInformalesGlobales: 0,
        dataActual: [],
        charts: {},
        rangoCierre: { inicio: null, fin: null }
    };

    const init = async () => {
        injectEliteStyles();
        calcularFechasCierreDinamico();
        renderLayout();
        await loadDependencies();
        await fetchData();
        setupEventListeners();
    };

    const injectEliteStyles = () => {
        if (document.getElementById("nexus-elite-styles")) return;
        const style = document.createElement('style');
        style.id = "nexus-elite-styles";
        style.innerHTML = `
            .filter-btn { padding: 10px 20px; border-radius: 15px; font-size: 10px; font-weight: 900; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #64748b; transition: 0.4s; cursor: pointer; font-family: 'Orbitron'; text-transform: uppercase; }
            .filter-btn.active { background: #06b6d4; color: #000; border-color: #06b6d4; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
            .sap-input { background: #000; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: #06b6d4; padding: 8px 12px; font-size: 11px; outline: none; transition: 0.3s; }
            .sap-input:focus { border-color: #06b6d4; box-shadow: 0 0 10px rgba(6,182,212,0.2); }
            .kpi-card { position: relative; overflow: hidden; background: #0d1117; padding: 2rem; border-radius: 2.5rem; border: 1px solid rgba(255,255,255,0.05); transition: 0.5s; }
            .kpi-card:hover { border-color: rgba(6, 182, 212, 0.3); transform: translateY(-5px); }
            .chart-container { background: #0d1117; padding: 2rem; border-radius: 3rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .alert-pill { background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 4px 12px; border-radius: 20px; font-size: 9px; font-weight: bold; }
        `;
        document.head.appendChild(style);
    };

    // --- SISTEMA DE CORTE Y FLEXIBILIDAD TEMPORAL (CIERRES EXTEMPORÁNEOS) ---
    const calcularFechasCierreDinamico = () => {
        const hoy = new Date();
        if (hoy.getDate() <= 10) {
            state.rangoCierre.inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            state.rangoCierre.fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
        } else {
            state.rangoCierre.inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            state.rangoCierre.fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
        }
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-slate-100 p-4 lg:p-10 orbitron animate-in fade-in duration-1000">
            <header class="flex flex-col gap-8 mb-12 border-b border-white/5 pb-10 text-center md:text-left">
                <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h1 class="text-5xl font-black italic tracking-tighter text-white uppercase">TallerPRO360<span class="text-cyan-400">_FinanzasElite</span></h1>
                        <p class="text-[10px] text-slate-500 tracking-[0.5em] font-bold uppercase mt-3 italic">QUANTUM-SAP INTELLIGENCE ENGINE // Auditoría Forense y Flexibilidad Contable</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-black px-8 py-4 rounded-2xl text-[11px] font-black hover:scale-105 transition-all flex items-center gap-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)]">
                        <i class="fas fa-file-excel text-lg"></i> EXPORTAR MATRIZ CONTABLE SAP
                    </button>
                </div>

                <div class="w-full flex flex-wrap gap-4 mt-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 items-center justify-between">
                    <div class="flex flex-wrap gap-4 items-center">
                        <span class="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Rango de Cierre Automático:</span>
                        <button id="flt-hist" class="filter-btn">Histórico</button>
                        <button id="flt-mes" class="filter-btn active">Mes Sugerido</button>
                        <div class="alert-pill"><i class="fas fa-info-circle"></i> Tolerancia Activa a Registros Extemporáneos / Cierre Flex</div>
                    </div>
                    <div class="flex items-center gap-4">
                        <i class="fas fa-calendar-alt text-slate-600"></i>
                        <input type="date" id="datePicker" class="sap-input orbitron">
                    </div>
                </div>
            </header>

            <div id="kpi-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                <div class="lg:col-span-2 chart-container">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-xs font-black text-cyan-500 uppercase tracking-widest italic">Rentabilidad Líquida Real y EBITDA por Unidad</h3>
                        <span class="text-[9px] text-slate-500 orbitron uppercase">Desinfección Cuántica Activa</span>
                    </div>
                    <div class="h-80"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <h3 class="text-xs font-black text-amber-500 uppercase tracking-widest italic mb-8">Estructura de Gastos e Insumos</h3>
                    <div class="h-64"><canvas id="pieChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0d1117] rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden mb-20">
                <div class="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <div>
                        <h3 class="text-xs font-black text-white uppercase italic tracking-widest">Estado de Resultados Consolidado por Misiones de Flota</h3>
                        <p class="text-[9px] text-slate-500 mt-1">Cruce Maestro del Libro Diario (Gastos Directos + Nóminas Semanales/Quincenales)</p>
                    </div>
                    <span id="counterTag" class="text-[10px] bg-cyan-500/10 text-cyan-400 px-6 py-2 rounded-full font-black border border-cyan-500/20 uppercase">Procesando Módulos...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-black/40 text-slate-500 text-[10px] uppercase font-black">
                            <tr>
                                <th class="p-8">Identificación e Historial</th>
                                <th class="p-8">Misión / Tipo</th>
                                <th class="p-8">Facturación (Ingreso Bruto)</th>
                                <th class="p-8">Desglose (IVA 19% / Libro)</th>
                                <th class="p-8 text-right">EBITDA Real Operativo</th>
                                <th class="p-8 text-center">Lead Time (Ciclo)</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-sm"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
    };

    const fetchData = async () => {
        try {
            const coleccionContabilidad = NEXUS_CONFIG?.COLLECTIONS?.ACCOUNTING || "contabilidad";
            
            const [snapOrders, snapAcc] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, coleccionContabilidad), where("empresaId", "==", empresaId)))
            ]);

            const aislarPlacaPura = (texto) => {
                if (!texto) return 'ADMIN';
                const base = texto.split('-')[0];
                return base.toUpperCase().replace(/[^A-Z0-9]/g, '').trim().substring(0, 6);
            };

            const mapaGastosPorPlaca = {};
            let gastosFijosGlobales = 0;
            let nominasInformalesGlobales = 0;

            snapAcc.docs.forEach(doc => {
                const data = doc.data();
                const monto = safeNumber(data.monto || data.total || data.valor || data.pago_mecanico || data.salario);
                const tipo = (data.tipo || "").toLowerCase();
                const detalle = (data.detalle || data.concepto || "").toLowerCase();
                const cuentaPUC = String(data.puc || data.codigo || "");

                const esGasto = !(tipo.includes("ingreso") || cuentaPUC.startsWith("4") || tipo.includes("4135") || tipo.includes("saneamiento") || tipo.includes("1105") || tipo.includes("capital") || tipo.includes("2805"));
                
                if (esGasto && monto > 0) {
                    const placaRaw = (data.placa || "ADMIN").toUpperCase().trim();
                    const esNominaInformal = cuentaPUC.startsWith("5105") || cuentaPUC.startsWith("7205") || detalle.includes("nomina") || detalle.includes("quincena") || detalle.includes("semana") || detalle.includes("pago mecanico") || detalle.includes("ayudante");

                    if (esNominaInformal) {
                        nominasInformalesGlobales += monto;
                    } else if (placaRaw === "ADMIN" || !placaRaw || placaRaw.includes("ADMIN")) {
                        gastosFijosGlobales += monto;
                    } else {
                        const placaClave = aislarPlacaPura(placaRaw);
                        if (!mapaGastosPorPlaca[placaClave]) mapaGastosPorPlaca[placaClave] = 0;
                        mapaGastosPorPlaca[placaClave] += monto;
                    }
                }
            });

            state.gastosFijosGlobales = gastosFijosGlobales;
            state.nominasInformalesGlobales = nominasInformalesGlobales;

            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                const identificadorVisual = (o.placa || 'S/N').toUpperCase().trim();
                const placaFinancieraClave = aislarPlacaPura(identificadorVisual);
                
                const facturacionBruta = safeNumber(o.costos_totales?.total || o.total || 0);
                const ingresosNetos = facturacionBruta / (1 + IVA_FACTOR);
                const ivaRetenido = facturacionBruta - ingresosNetos;
                const gastosContablesAsignados = mapaGastosPorPlaca[placaFinancieraClave] || 0;
                
                const ebitdaRealPlaca = facturacionBruta - ivaRetenido - gastosContablesAsignados;
                const margenEbitdaPrc = ingresosNetos > 0 ? (ebitdaRealPlaca / ingresosNetos) * 100 : 0;
                
                const fechaInicio = o.createdAt?.toDate ? o.createdAt.toDate() : (o.fecha_ingreso ? new Date(o.fecha_ingreso) : new Date());
                const fechaFin = o.fecha_entrega || o.fechas?.entrega || o.closedAt || o.fecha_cierre;
                
                let diasTaller = 1;
                if (fechaFin) {
                    const fechaCierre = fechaFin.toDate ? fechaFin.toDate() : new Date(fechaFin);
                    diasTaller = Math.ceil((fechaCierre - fechaInicio) / (1000 * 60 * 60 * 24));
                } else {
                    diasTaller = Math.ceil((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
                }
                if (diasTaller <= 0) diasTaller = 1;
                
                return {
                    id: doc.id,
                    placa: identificadorVisual,
                    area: o.tipo_orden || 'MECANICA',
                    total: facturacionBruta,
                    ingresosNetos: ingresosNetos,
                    iva: ivaRetenido,
                    gastosContabilidad: gastosContablesAsignados,
                    ebitda: ebitdaRealPlaca,
                    margenPorcentaje: margenEbitdaPrc,
                    dias: diasTaller,
                    cliente: o.cliente || 'CLIENTE TALLERPRO360',
                    fecha: fechaInicio
                };
            });

            filtrarPorRangoCierreActual();

        } catch (e) {
            console.error("🚀 QUANTUM_FAULT -> Colapso en el motor analítico:", e);
        }
    };

    const filtrarPorRangoCierreActual = () => {
        if (!state.rangoCierre.inicio || !state.rangoCierre.fin) {
            processAndRender(state.ordenesMaster);
            return;
        }
        const filtradas = state.ordenesMaster.filter(o => o.fecha >= state.rangoCierre.inicio && o.fecha <= state.rangoCierre.fin);
        processAndRender(filtradas);
    };

    const processAndRender = (data) => {
        state.dataActual = data;
        const totalFacturadoBruto = data.reduce((a, b) => a + b.total, 0);
        const totalEbitdaConsolidado = data.reduce((a, b) => a + b.ebitda, 0) - state.gastosFijosGlobales - state.nominasInformalesGlobales;
        const totalMTTR = data.reduce((a, b) => a + b.dias, 0);

        const metrics = {
            ebitdaNeto: totalEbitdaConsolidado,
            mttr: totalMTTR / (data.length || 1),
            margenGeneral: totalFacturadoBruto > 0 ? (totalEbitdaConsolidado / totalFacturadoBruto) * 100 : 0,
            ticket: totalFacturadoBruto / (data.length || 1)
        };

        renderKPIs(metrics);
        renderCharts(data);
        renderTable(data);
        document.getElementById("counterTag").innerText = `${data.length} UNIDADES LIQUIDADAS`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA INDUSTRIAL SAP", fmt(m.ebitdaNeto), "fa-chart-line", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "NETO DE COSTOS Y NÓMINAS")}
            ${kpiCard("CICLO PROMEDIO TALLER", `${m.mttr.toFixed(1)} DÍAS`, "fa-hourglass-half", m.mttr > 6 ? "text-amber-500" : "text-cyan-400", "LEAD TIME OPERATIVO")}
            ${kpiCard("FLUJO PROMEDIO ORDEN", fmt(m.ticket), "fa-cash-register", "text-slate-100", "TICKET MEDIO DE INGRESO")}
            ${kpiCard("MARGEN OPERATIVO TOTAL", pct(m.margenGeneral), "fa-percent", m.margenGeneral > 0 ? "text-cyan-400" : "text-red-400", "RENTABILIDAD BRUTA GLOBAL")}
        `;
    };

    const kpiCard = (t, v, i, c, sub) => `
        <div class="kpi-card group">
            <i class="fas ${i} absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:scale-110 transition-transform duration-700"></i>
            <p class="text-[9px] font-black text-slate-500 mb-2 tracking-[0.2em] uppercase">${t}</p>
            <h2 class="text-2xl font-black orbitron ${c} mb-1">${v}</h2>
            <p class="text-[8px] text-slate-600 font-bold orbitron uppercase">${sub}</p>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("report-table-body");
        if (!body) return;
        
        if (data.length === 0) {
            body.innerHTML = `<tr><td colspan="6" class="p-12 text-center text-slate-500 text-xs uppercase italic">Ninguna orden registrada en este periodo.</td></tr>`;
            return;
        }

        body.innerHTML = data.map(o => `
            <tr class="border-b border-white/[0.02] hover:bg-cyan-500/5 transition-all">
                <td class="p-8">
                    <p class="font-black text-white orbitron text-base">${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase tracking-widest">${String(o.cliente).substring(0, 22)}</p>
                </td>
                <td class="p-8">
                    <span class="px-4 py-2 rounded-xl text-[9px] font-black bg-black border border-white/10 ${o.area.includes('MEC') ? 'text-cyan-400' : 'text-amber-400'} uppercase">
                        ${o.area}
                    </span>
                </td>
                <td class="p-8">
                    <p class="text-white font-black orbitron text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-600">BRUTO TOTAL</p>
                </td>
                <td class="p-8">
                    <p class="text-slate-300 font-bold orbitron text-xs">IVA (19%): ${fmt(o.iva)}</p>
                    <p class="text-[10px] text-red-400 font-bold">COSTO DIRECTO: ${fmt(o.gastosContabilidad)}</p>
                </td>
                <td class="p-8 text-right">
                    <p class="font-black orbitron text-base ${o.ebitda > 0 ? 'text-emerald-400' : 'text-red-500'}">${fmt(o.ebitda)}</p>
                    <p class="text-[9px] font-black orbitron ${o.ebitda > 0 ? 'text-emerald-500/50' : 'text-red-500/50'}">${pct(o.margenPorcentaje)} MARGEN</p>
                </td>
                <td class="p-8 text-center">
                    <span class="orbitron font-black text-xs ${o.dias > 5 ? 'text-amber-400' : 'text-emerald-400'}">${o.dias} DÍAS</span>
                </td>
            </tr>
        `).join("");
    };

    const renderCharts = (data) => {
        const ultimasUnidades = data.slice(-10);
        const labels = ultimasUnidades.map(o => o.placa);
        const vals = ultimasUnidades.map(o => o.ebitda);
        const colors = ultimasUnidades.map(o => o.ebitda > 0 ? '#06b6d4' : '#ef4444');

        const ctxMain = document.getElementById('mainChart');
        if (ctxMain) {
            if (state.charts.main) state.charts.main.destroy();
            state.charts.main = new Chart(ctxMain, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'EBITDA por Placa',
                        data: vals,
                        backgroundColor: colors,
                        borderRadius: 8
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } },
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } }
                    }
                }
            });
        }

        const ctxPie = document.getElementById('pieChart');
        if (ctxPie) {
            if (state.charts.pie) state.charts.pie.destroy();
            state.charts.pie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Fijos Admin', 'Nóminas Informales', 'Costos de Órdenes'],
                    datasets: [{
                        data: [
                            state.gastosFijosGlobales,
                            state.nominasInformalesGlobales,
                            data.reduce((acc, current) => acc + current.gastosContabilidad, 0)
                        ],
                        backgroundColor: ['#ef4444', '#fbbf24', '#06b6d4'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '75%', plugins: { legend: { display: false } } }
            });
        }
    };

    const setupEventListeners = () => {
        const btnExport = document.getElementById("btnExportGlobal");
        if (btnExport) {
            btnExport.onclick = () => {
                if (typeof XLSX === 'undefined') {
                    alert("Error SAP: Componente XLSX no inicializado.");
                    return;
                }
                
                const baseRows = state.dataActual.map(o => ({
                    "PLACA_UNIDAD": o.placa, 
                    "CLIENTE_NEXUS": o.cliente, 
                    "FACTURACION_BRUTA": o.total,
                    "IVA_19_RETENIDO": o.iva,
                    "INGRESOS_NETOS_REALES": o.ingresosNetos,
                    "COSTOS_DIRECTOS_LIBRO": o.gastosContabilidad,
                    "EBITDA_OPERATIVO_PLACA": o.ebitda, 
                    "MARGEN_EBITDA": o.margenPorcentaje / 100, 
                    "LEAD_TIME_CICLO_DIAS": o.dias
                }));

                const ws = XLSX.utils.json_to_sheet(baseRows);
                const totalRows = baseRows.length;
                const totalRowIndex = totalRows + 2; 

                ws[`A${totalRowIndex}`] = { v: "TOTAL EXPORTACIÓN SAP", t: 's' };
                ws[`C${totalRowIndex}`] = { f: `SUM(C2:C${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`D${totalRowIndex}`] = { f: `SUM(D2:D${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`E${totalRowIndex}`] = { f: `SUM(E2:E${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`F${totalRowIndex}`] = { f: `SUM(F2:F${totalRows + 1})`, t: 'n', z: '$#,##0' };
                
                const formulaEbitdaReal = `SUM(G2:G${totalRows + 1}) - ${state.gastosFijosGlobales} - ${state.nominasInformalesGlobales}`;
                ws[`G${totalRowIndex}`] = { f: formulaEbitdaReal, t: 'n', z: '$#,##0' };
                ws[`H${totalRowIndex}`] = { f: `AVERAGE(H2:H${totalRows + 1})`, t: 'n', z: '0.0%' };
                ws[`I${totalRowIndex}`] = { f: `AVERAGE(I2:I${totalRows + 1})`, t: 'n', z: '0.0' };

                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    ['C', 'D', 'E', 'F', 'G'].forEach(col => {
                        const cell = ws[col + (R + 1)];
                        if (cell && cell.t === 'n') cell.z = '$#,##0';
                    });
                    const pctCell = ws['H' + (R + 1)];
                    if (pctCell && pctCell.t === 'n') pctCell.z = '0.0%';
                }

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "SAP_ELITE_EBITDA");
                XLSX.writeFile(wb, `TallerPRO360_Sap_Elite_${empresaId}_${Date.now()}.xlsx`);
            };
        }

        document.getElementById("flt-hist").onclick = (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.rangoCierre = { inicio: null, fin: null };
            processAndRender(state.ordenesMaster);
        };

        document.getElementById("flt-mes").onclick = (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            calcularFechasCierreDinamico();
            filtrarPorRangoCierreActual();
        };

        const datePicker = document.getElementById("datePicker");
        if (datePicker) {
            datePicker.onchange = (e) => {
                const fechaSel = new Date(e.target.value + "T00:00:00");
                const filtrados = state.ordenesMaster.filter(o => o.fecha.toDateString() === fechaSel.toDateString());
                processAndRender(filtrados);
            };
        }
    };

    const loadDependencies = async () => {
        const libs = ["https://cdn.jsdelivr.net/npm/chart.js", "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"];
        for (const lib of libs) {
            if (!document.querySelector(`script[src="${lib}"]`)) {
                await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
            }
        }
    };

    await init();
}
