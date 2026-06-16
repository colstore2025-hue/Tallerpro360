/**
 * 🏛️ TALLERPRO360 - FINANZAS ELITE V1.1 (QUANTUM-SAP ENGINE)
 * Desarrollado por: William Jeffry Urquijo Cubillos // Nexus AI 2026
 * Maniobra: Control de Frecuencias Temporales Gerenciales, Sincronización Contable Maestra,
 * Auditoría de Costo Directo por Placa y Cierre de Ejercicio Flexible.
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function nexusFinanzasElite(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron flex flex-col gap-4 justify-center items-center font-bold">
            <i class="fas fa-exclamation-triangle text-4xl animate-pulse"></i>
            <span>ERROR CRÍTICO: AUTENTICACIÓN SAP REQUERIDA PARA FINANZAS ELITE</span>
        </div>`;
        return;
    }

    const IVA_FACTOR = 0.19;

    // --- MOTOR DE DESINFECCIÓN CUÁNTICA ANTI-NaN ---
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

    // --- FORMATEADORES ---
    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(safeNumber(v));

    const pct = (v) => `${safeNumber(v).toFixed(1)}%`;

    let state = {
        ordenesMaster: [],
        gastosFijosGlobales: 0, 
        nominasInformalesGlobales: 0,
        mapaGastosPorPlaca: {}, // Enlace vivo con contabilidad.js
        dataActual: [],
        charts: {},
        filtroFrecuencia: "mes", // Valores: total, semana, mes, trimestre, anio
        fechaReferencia: new Date(),
        rangoCierre: { inicio: null, fin: null }
    };

    const init = async () => {
        injectEliteStyles();
        calcularRangoPorFrecuencia();
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
            .filter-btn { padding: 8px 16px; border-radius: 12px; font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; font-family: 'Orbitron'; text-transform: uppercase; }
            .filter-btn:hover { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
            .filter-btn.active { background: #06b6d4; color: #000; border-color: #06b6d4; box-shadow: 0 0 15px rgba(6, 182, 212, 0.35); }
            .sap-input { background: #090d16; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #06b6d4; padding: 10px 14px; font-size: 11px; outline: none; transition: 0.3s; }
            .sap-input:focus { border-color: #06b6d4; box-shadow: 0 0 12px rgba(6,182,212,0.25); }
            .kpi-card { position: relative; overflow: hidden; background: #0b0f17; padding: 1.8rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.03); transition: all 0.4s ease; }
            .kpi-card:hover { border-color: rgba(6, 182, 212, 0.25); transform: translateY(-3px); background: #0f1622; }
            .chart-container { background: #0b0f17; padding: 2rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.03); }
            .alert-pill { background: rgba(6, 182, 212, 0.06); border: 1px solid rgba(6, 182, 212, 0.15); color: #22d3ee; padding: 6px 14px; border-radius: 14px; font-size: 9px; font-weight: bold; flex-shrink: 0; }
        `;
        document.head.appendChild(style);
    };

    // --- MOTOR DE FRECUENCIAS GERENCIALES REQUERIDO POR GERENCIA ---
    const calcularRangoPorFrecuencia = () => {
        const ref = new Date(state.fechaReferencia);
        
        if (state.filtroFrecuencia === "total") {
            state.rangoCierre = { inicio: null, fin: null };
            return;
        }

        let inicio, fin;

        switch (state.filtroFrecuencia) {
            case "semana":
                const diaSemana = ref.getDay();
                const diferencia = ref.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Lunes
                inicio = new Date(ref.setDate(diferencia));
                inicio.setHours(0,0,0,0);
                fin = new Date(inicio);
                fin.setDate(inicio.getDate() + 6);
                fin.setHours(23,59,59,999);
                break;
                
            case "mes":
                inicio = new Date(ref.getFullYear(), ref.getMonth(), 1);
                fin = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
                
            case "trimestre":
                const trimestreActual = Math.floor(ref.getMonth() / 3);
                inicio = new Date(ref.getFullYear(), trimestreActual * 3, 1);
                fin = new Date(ref.getFullYear(), (trimestreActual + 1) * 3, 0, 23, 59, 59, 999);
                break;
                
            case "anio":
                inicio = new Date(ref.getFullYear(), 0, 1);
                fin = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
        }

        state.rangoCierre = { inicio, fin };
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="bg-[#020617] min-h-screen text-slate-200 p-4 lg:p-8 orbitron antialiased">
            <header class="flex flex-col gap-6 mb-8 border-b border-white/5 pb-8">
                <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div class="text-center lg:text-left">
                        <h1 class="text-4xl font-black tracking-tight text-white uppercase">TallerPRO360<span class="text-cyan-400">_FinanzasElite</span></h1>
                        <p class="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase mt-2">QUANTUM-SAP ENGINE V1.1 // Matriz Temporal Contable de Precisión</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-xl text-[11px] font-black hover:bg-emerald-400 transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-500/10">
                        <i class="fas fa-file-excel text-base"></i> EXPORTAR CONTROL FINANCIERO SAP
                    </button>
                </div>

                <div class="w-full flex flex-col md:flex-row gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 items-center justify-between mt-4">
                    <div class="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                        <span class="text-[9px] text-cyan-400 font-bold uppercase tracking-wider mr-2">Frecuencia Gerencial:</span>
                        <button id="freq-total" class="filter-btn">Histórico</button>
                        <button id="freq-semana" class="filter-btn">Semanal</button>
                        <button id="freq-mes" class="filter-btn active">Mensual</button>
                        <button id="freq-trimestre" class="filter-btn">Trimestral</button>
                        <button id="freq-anio" class="filter-btn">Anual</button>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="alert-pill text-center"><i class="fas fa-filter text-xs mr-1"></i> Filtro Activo Período Segregado</div>
                        <input type="date" id="datePicker" class="sap-input orbitron">
                    </div>
                </div>
            </header>

            <div id="kpi-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="lg:col-span-2 chart-container flex flex-col justify-between">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xs font-black text-cyan-400 uppercase tracking-widest">Rentabilidad EBITDA Consolidada por Placa</h3>
                        <span class="text-[8px] text-slate-500 uppercase tracking-widest">Mapeo de Libro Diario</span>
                    </div>
                    <div class="h-72"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="chart-container flex flex-col justify-between">
                    <h3 class="text-xs font-black text-amber-400 uppercase tracking-widest mb-6">Estructura Global de Egresos</h3>
                    <div class="h-64"><canvas id="pieChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0b0f17] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-12">
                <div class="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
                    <div>
                        <h3 class="text-xs font-black text-white uppercase tracking-widest">Estado de Pérdidas y Ganancias por Unidades de Flota</h3>
                        <p class="text-[9px] text-slate-500 mt-1">Cruce Maestro del Costo Directo de Contabilidad asignado a la Placa</p>
                    </div>
                    <span id="counterTag" class="text-[9px] bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-md font-black border border-cyan-500/20 uppercase tracking-wider">Procesando Matriz...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-950/60 text-slate-400 text-[9px] uppercase font-black tracking-wider border-b border-white/5">
                            <tr>
                                <th class="p-6">Unidad Vehículo / Cliente</th>
                                <th class="p-6">Línea Operativa</th>
                                <th class="p-6">Facturación Bruta</th>
                                <th class="p-6">Costo Directo (Contabilidad Libro)</th>
                                <th class="p-6 text-right">EBITDA Real Placa</th>
                                <th class="p-6 text-center">Lead Time</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-xs divide-y divide-white/[0.02]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
        
        // Sincronizar visualmente el input date con el estado actual
        document.getElementById("datePicker").value = state.fechaReferencia.toISOString().split('T')[0];
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
                const detalle = (data.detalle || data.concepto || "").toUpperCase();
                const cuentaPUC = String(data.puc || data.codigo || "");

                // Excluir ingresos contables nativos
                const esGasto = !(tipo.includes("ingreso") || cuentaPUC.startsWith("4") || tipo.includes("4135") || tipo.includes("saneamiento") || tipo.includes("1105") || tipo.includes("capital") || tipo.includes("2805"));
                
                if (esGasto && monto > 0) {
                    const placaRaw = (data.placa || "ADMIN").toUpperCase().trim();
                    const esNominaInformal = cuentaPUC.startsWith("5105") || cuentaPUC.startsWith("7205") || detalle.includes("NOMINA") || detalle.includes("QUINCENA") || detalle.includes("SEMANA") || detalle.includes("PAGO MECANICO") || detalle.includes("AYUDANTE");

                    let placaClaveGasto = aislarPlacaPura(placaRaw);

                    if (placaClaveGasto === 'ADMIN' || placaClaveGasto === '') {
                        const bloquesTexto = detalle.replace(/[()]/g, ' ').split(/[\s-]+/);
                        for (const bloque of bloquesTexto) {
                            const limpio = bloque.replace(/[^A-Z0-9]/g, '').trim();
                            if (limpio.length === 6 && /^[A-Z]{3}[0-9]{3}$/.test(limpio)) {
                                placaClaveGasto = limpio;
                                break;
                            }
                        }
                    }

                    if (esNominaInformal) {
                        nominasInformalesGlobales += monto;
                    } else if (cuentaPUC.startsWith("613505") || placaClaveGasto !== 'ADMIN') {
                        if (placaClaveGasto !== 'ADMIN' && placaClaveGasto.length >= 3) {
                            if (!mapaGastosPorPlaca[placaClaveGasto]) mapaGastosPorPlaca[placaClaveGasto] = 0;
                            mapaGastosPorPlaca[placaClaveGasto] += monto;
                        } else {
                            gastosFijosGlobales += monto;
                        }
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
            state.mapaGastosPorPlaca = mapaGastosPorPlaca; // Guardado en el estado para auditorías en tiempo de render

            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                const identificadorVisual = (o.placa || 'S/N').toUpperCase().trim();
                const placaFinancieraClave = aislarPlacaPura(identificadorVisual);
                
                const facturacionBruta = safeNumber(o.costos_totales?.total || o.total || 0);
                const ingresosNetos = facturacionBruta / (1 + IVA_FACTOR);
                const ivaRetenido = facturacionBruta - ingresosNetos;
                
                // Enlace perfecto con contabilidad: Si hay gasto directo en el mapa de contabilidad se asume ese, de lo contrario cae al costo directo interno.
                const costosInternosOrden = safeNumber(o.costos_totales?.costo_directo || o.costo_directo || o.costoDirecto || 0);
                const gastosContablesAsignados = mapaGastosPorPlaca[placaFinancieraClave] !== undefined ? mapaGastosPorPlaca[placaFinancieraClave] : costosInternosOrden;
                
                const ebitdaRealPlaca = facturacionBruta - ivaRetenido - gastosContablesAsignados;
                const margenEbitdaPrc = ingresosNetos > 0 ? (ebitdaRealPlaca / ingresosNetos) * 100 : 0;
                
                // Sanitización de marcas de tiempo nativas
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

            filtrarYProcesarDatos();

        } catch (e) {
            console.error("🚀 QUANTUM_FAULT -> Colapso contable mapeado:", e);
        }
    };

    const filtrarYProcesarDatos = () => {
        if (!state.rangoCierre.inicio || !state.rangoCierre.fin) {
            processAndRender(state.ordenesMaster);
            return;
        }
        
        // Filtro estricto del periodo seleccionado (Evita cruces accidentales de mayo o históricos)
        const filtradas = state.ordenesMaster.filter(o => {
            const tiempoOrden = o.fecha.getTime();
            return tiempoOrden >= state.rangoCierre.inicio.getTime() && tiempoOrden <= state.rangoCierre.fin.getTime();
        });
        
        processAndRender(filtradas);
    };

    const processAndRender = (data) => {
        state.dataActual = data;
        const totalFacturadoBruto = data.reduce((a, b) => a + b.total, 0);
        
        // El EBITDA neto del taller sustrae los costos prorrateados globales del segmento evaluado
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
        document.getElementById("counterTag").innerText = `${data.length} VEHÍCULOS EN PERÍODO`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA PERÍODO SAP", fmt(m.ebitdaNeto), "fa-chart-line", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "NETO CONTABLE DIRECTO")}
            ${kpiCard("CICLO PROMEDIO GENERAL", `${m.mttr.toFixed(1)} DÍAS`, "fa-hourglass-half", m.mttr > 6 ? "text-amber-400" : "text-cyan-400", "LEAD TIME")}
            ${kpiCard("TICKET PROMEDIO FLOTA", fmt(m.ticket), "fa-cash-register", "text-slate-200", "FLUJO POR VEHÍCULO")}
            ${kpiCard("MARGEN OPERATIVO REAL", pct(m.margenGeneral), "fa-percent", m.margenGeneral > 0 ? "text-cyan-400" : "text-red-400", "EFICIENCIA EN SEGMENTO")}
        `;
    };

    const kpiCard = (t, v, i, c, sub) => `
        <div class="kpi-card group">
            <i class="fas ${i} absolute -right-3 -bottom-3 text-6xl opacity-[0.02] group-hover:scale-110 transition-transform duration-500"></i>
            <p class="text-[9px] font-bold text-slate-500 mb-1.5 tracking-wider uppercase">${t}</p>
            <h2 class="text-xl font-black orbitron ${c} mb-0.5">${v}</h2>
            <p class="text-[8px] text-slate-600 font-bold uppercase tracking-tight">${sub}</p>
        </div>`;

    const renderTable = (data) => {
        const body = document.getElementById("report-table-body");
        if (!body) return;
        
        if (data.length === 0) {
            body.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-500 text-[11px] uppercase italic tracking-widest">Ningún vehículo registrado en este período analítico.</td></tr>`;
            return;
        }

        body.innerHTML = data.map(o => `
            <tr class="hover:bg-cyan-500/[0.02] transition-colors">
                <td class="p-5">
                    <p class="font-black text-white text-sm tracking-tight">${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${String(o.cliente).substring(0, 24)}</p>
                </td>
                <td class="p-5">
                    <span class="px-2.5 py-1 rounded-md text-[8px] font-black bg-slate-950 border border-white/5 ${o.area.includes('MEC') ? 'text-cyan-400' : 'text-amber-400'} uppercase">
                        ${o.area}
                    </span>
                </td>
                <td class="p-5">
                    <p class="text-white font-bold text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Bruto</p>
                </td>
                <td class="p-5">
                    <p class="text-red-400 font-bold text-xs">${fmt(o.gastosContabilidad)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Costo Directo Libro</p>
                </td>
                <td class="p-5 text-right">
                    <p class="font-black text-sm ${o.ebitda > 0 ? 'text-emerald-400' : 'text-red-500'}">${fmt(o.ebitda)}</p>
                    <p class="text-[8px] font-bold ${o.ebitda > 0 ? 'text-emerald-500/60' : 'text-red-500/60'}">${pct(o.margenPorcentaje)} MG</p>
                </td>
                <td class="p-5 text-center">
                    <span class="font-bold text-xs ${o.dias > 5 ? 'text-amber-400' : 'text-emerald-400'}">${o.dias} DÍAS</span>
                </td>
            </tr>
        `).join("");
    };

    const renderCharts = (data) => {
        const ultimasUnidades = data.slice(-8);
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
                    datasets: [{ data: vals, backgroundColor: colors, borderRadius: 6 }]
                },
                options: { 
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.01)' }, ticks: { color: '#475569', font: { family: 'Orbitron', size: 8 } } },
                        x: { grid: { display: false }, ticks: { color: '#475569', font: { family: 'Orbitron', size: 8 } } }
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
                    labels: ['Costos Fijos', 'Nóminas Extra', 'Costo Operativo Directo'],
                    datasets: [{
                        data: [
                            state.gastosFijosGlobales,
                            state.nominasInformalesGlobales,
                            data.reduce((acc, curr) => acc + curr.gastosContabilidad, 0)
                        ],
                        backgroundColor: ['#f43f5e', '#f59e0b', '#06b6d4'],
                        borderWidth: 0
                    }]
                },
                options: { cutout: '80%', plugins: { legend: { display: false } } }
            });
        }
    };

    const setupEventListeners = () => {
        // Manejador del cambio de frecuencia requerido por Gerencia
        const frecuencias = ["total", "semana", "mes", "trimestre", "anio"];
        frecuencias.forEach(freq => {
            const btn = document.getElementById(`freq-${freq}`);
            if (btn) {
                btn.onclick = (e) => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    state.filtroFrecuencia = freq;
                    calcularRangoPorFrecuencia();
                    filtrarYProcesarDatos();
                };
            }
        });

        const datePicker = document.getElementById("datePicker");
        if (datePicker) {
            datePicker.onchange = (e) => {
                if(!e.target.value) return;
                state.fechaReferencia = new Date(e.target.value + "T00:00:00");
                calcularRangoPorFrecuencia();
                filtrarYProcesarDatos();
            };
        }

        const btnExport = document.getElementById("btnExportGlobal");
        if (btnExport) {
            btnExport.onclick = () => {
                if (typeof XLSX === 'undefined') {
                    alert("Error Módulo: XLSX Engine no inicializado en cliente.");
                    return;
                }
                
                const rowsExcel = state.dataActual.map(o => ({
                    "VEHICULO_PLACA": o.placa, 
                    "CLIENTE_SOCIETARIO": o.cliente, 
                    "INGRESOS_BRUTOS": o.total,
                    "IVA_CREDITO": o.iva,
                    "INGRESOS_NETOS": o.ingresosNetos,
                    "COSTO_DIRECTO_CONTABLE": o.gastosContabilidad,
                    "EBITDA_NETO_UNIDAD": o.ebitda, 
                    "MARGEN_EBITDA_REAL": o.margenPorcentaje / 100, 
                    "CICLO_DIAS": o.dias
                }));

                const ws = XLSX.utils.json_to_sheet(rowsExcel);
                const totalRows = rowsExcel.length;
                const idxTotal = totalRows + 2; 

                ws[`A${idxTotal}`] = { v: "TOTAL EXPORTACIÓN CONTABLE SAP", t: 's' };
                ws[`C${idxTotal}`] = { f: `SUM(C2:C${totalRows + 1})`, t: 'n' };
                ws[`D${idxTotal}`] = { f: `SUM(D2:D${totalRows + 1})`, t: 'n' };
                ws[`E${idxTotal}`] = { f: `SUM(E2:E${totalRows + 1})`, t: 'n' };
                ws[`F${idxTotal}`] = { f: `SUM(F2:F${totalRows + 1})`, t: 'n' };
                
                const formulaEbitda = `SUM(G2:G${totalRows + 1}) - ${state.gastosFijosGlobales} - ${state.nominasInformalesGlobales}`;
                ws[`G${idxTotal}`] = { f: formulaEbitda, t: 'n' };
                ws[`H${idxTotal}`] = { f: `AVERAGE(H2:H${totalRows + 1})`, t: 'n' };
                ws[`I${idxTotal}`] = { f: `AVERAGE(I2:I${totalRows + 1})`, t: 'n' };

                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    ['C', 'D', 'E', 'F', 'G'].forEach(col => {
                        const cell = ws[col + (R + 1)];
                        if (cell) cell.z = '$#,##0';
                    });
                    const cellPct = ws['H' + (R + 1)];
                    if (cellPct) cellPct.z = '0.0%';
                }

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "SAP_METRICS");
                XLSX.writeFile(wb, `TallerPRO360_FinanzasElite_${state.filtroFrecuencia.toUpperCase()}_${Date.now()}.xlsx`);
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
