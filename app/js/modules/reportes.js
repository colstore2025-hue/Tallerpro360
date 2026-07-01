/**
 * 🏛️ TALLERPRO360 - REPORTES, FINANZAS & AUDITORÍA FORENSE V20.0 🚀
 * PROTOCOLO: QUANTUM-SAP / SAP-HANA ENTERPRISE LAYER
 * Desarrollado por: William Jeffry Urquijo Cubillos & Gemini AI (2026)
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    const regimenTaller = (localStorage.getItem("nexus_empresaRegimen") || "RESPONSABLE_IVA").trim();
    
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron flex flex-col gap-4 justify-center items-center font-bold bg-[#020617] min-h-screen">
            <i class="fas fa-exclamation-triangle text-4xl animate-pulse"></i>
            <span>ERROR CRÍTICO: AUTENTICACIÓN SAP REQUERIDA PARA MATRIZ DE REPORTES</span>
        </div>`;
        return;
    }

    const APLICA_IVA = (regimenTaller === "RESPONSABLE_IVA");
    const IVA_FACTOR = 0.19;

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

    const fmt = (v) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(safeNumber(v));

    const pct = (v) => `${safeNumber(v).toFixed(1)}%`;

    let state = {
        ordenesMaster: [],
        gastosContablesBase: [],
        gastosFijosGlobales: 0, 
        nominasInformalesGlobales: 0,
        mapaGastosPorPlaca: {},
        dataActual: [],
        charts: {},
        filtroFrecuencia: "mes", 
        fechaInicioFiltro: null,
        fechaFinFiltro: null,
        periodoSeleccionado: "TODOS",
        periodosDisponibles: []
    };

    const init = async () => {
        injectEliteStyles();
        establecerFechasPorDefecto();
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
            .filter-btn { padding: 8px 16px; border-radius: 12px; font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; transition: all 0.3s ease; cursor: pointer; font-family: 'Orbitron'; text-transform: uppercase; }
            .filter-btn:hover { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
            .filter-btn.active { background: #06b6d4; color: #000; border-color: #06b6d4; box-shadow: 0 0 15px rgba(6, 182, 212, 0.35); }
            .sap-input { background: #090d16; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #06b6d4; padding: 10px 14px; font-size: 11px; outline: none; font-family: 'Orbitron'; }
            .sap-input:focus { border-color: #06b6d4; box-shadow: 0 0 12px rgba(6,182,212,0.25); }
            .kpi-card { position: relative; overflow: hidden; background: #0b0f17; padding: 1.8rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.03); transition: all 0.4s ease; }
            .chart-container { background: #0b0f17; padding: 1.5rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.03); display: flex; flex-col justify-between; min-height: 320px; }
            .drilldown-container { background: #05080f; border-left: 4px solid #06b6d4; animation: fadeIn 0.3s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    };

    const establecerFechasPorDefecto = () => {
        const ahora = new Date();
        state.fechaInicioFiltro = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        state.fechaFinFiltro = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="max-w-[1650px] mx-auto bg-[#020617] min-h-screen text-slate-200 p-4 lg:p-8 orbitron antialiased">
            <header class="flex flex-col gap-6 mb-8 border-b border-white/5 pb-8">
                <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div class="text-center lg:text-left">
                        <h1 class="text-4xl font-black tracking-tight text-white uppercase">TallerPRO360<span class="text-cyan-400">_HanaForense</span></h1>
                        <p class="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase mt-2">NEXUS-X QUANTUM ENGINE // CUENTAS CONTABLES DE CONTROL REAL</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-xl text-[11px] font-black hover:bg-emerald-400 transition-all flex items-center gap-2.5 shadow-lg">
                        <i class="fas fa-file-excel text-base"></i> EXPORTAR REPORTE SEGMENTADO (DESGLOSE PUC)
                    </button>
                </div>

                <div class="w-full grid grid-cols-1 xl:grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 items-center justify-between mt-4">
                    <div class="flex flex-wrap gap-2 items-center justify-center xl:justify-start xl:col-span-2">
                        <button id="freq-total" class="filter-btn">Todo el Historial</button>
                        <button id="freq-mes" class="filter-btn active">Mes Seleccionado</button>
                        
                        <span class="text-[9px] text-amber-400 font-bold uppercase tracking-wider ml-4 mr-1">Mes Contable:</span>
                        <select id="selPeriodoFiscal" class="sap-input font-bold py-1 px-3 mr-4"></select>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 justify-center xl:justify-end">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] text-slate-400 font-bold uppercase">Desde:</span>
                            <input type="date" id="datePickerInicio" class="sap-input py-1 px-2 text-[11px]">
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] text-slate-400 font-bold uppercase">Hasta:</span>
                            <input type="date" id="datePickerFin" class="sap-input py-1 px-2 text-[11px]">
                        </div>
                    </div>
                </div>
            </header>

            <div id="kpi-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"></div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div class="chart-container flex flex-col justify-between">
                    <h3 class="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4"><i class="fas fa-chart-bar mr-2"></i>EBITDA por Vehículo Real</h3>
                    <div class="h-56 w-full"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="chart-container flex flex-col justify-between">
                    <h3 class="text-xs font-black text-amber-400 uppercase tracking-widest mb-4"><i class="fas fa-chart-pie mr-2"></i>Estructura Costos Operativos</h3>
                    <div class="h-56 w-full"><canvas id="pieChart"></canvas></div>
                </div>
                <div class="chart-container flex flex-col justify-between">
                    <h3 class="text-xs font-black text-purple-400 uppercase tracking-widest mb-4"><i class="fas fa-industry mr-2"></i>Participación por Tipo de Orden</h3>
                    <div class="h-56 w-full"><canvas id="lineaChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0b0f17] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-12">
                <div class="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
                    <div>
                        <h3 class="text-xs font-black text-white uppercase tracking-widest">Estructura Operativa Directa por Flota</h3>
                        <p class="text-[9px] text-slate-500 mt-1">Haga clic en la placa para desplegar la bitácora forense de auditoría y generar el informe PDF de Socios</p>
                    </div>
                    <span id="counterTag" class="text-[9px] bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-md font-black border border-cyan-500/20 uppercase tracking-wider">Procesando...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-950/60 text-slate-400 text-[9px] uppercase font-black tracking-wider border-b border-white/5">
                            <tr>
                                <th class="p-6">Vehículo Placa</th>
                                <th class="p-6">Tipo Servicio</th>
                                <th class="p-6">Ingreso Bruto</th>
                                <th class="p-6">Costos Totales Asignados</th>
                                <th class="p-6 text-right">EBITDA Neto Placa</th>
                                <th class="p-6 text-center">Permanencia</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-xs divide-y divide-white/[0.02]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
        
        document.getElementById("datePickerInicio").value = state.fechaInicioFiltro.toISOString().split('T')[0];
        document.getElementById("datePickerFin").value = state.fechaFinFiltro.toISOString().split('T')[0];
    };

    const fetchData = async () => {
        try {
            const snapOrders = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
            const snapAcc = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));

            const aislarPlacaPura = (texto) => {
                if (!texto) return 'ADMIN';
                const base = texto.split('-')[0];
                return base.toUpperCase().replace(/[^A-Z0-9]/g, '').trim().substring(0, 6);
            };

            const mapaGastosPorPlaca = {};
            const listaGastosBase = [];
            let gastosFijosGlobales = 0;
            let nominasInformalesGlobales = 0;

            snapAcc.docs.forEach(doc => {
                const data = doc.data();
                const monto = safeNumber(data.monto || data.total || data.valor || data.pago_mecanico || data.salario);
                const tipo = (data.tipo || "").toLowerCase();
                const detalle = (data.detalle || data.concepto || "").toUpperCase();
                const cuentaPUC = String(data.puc || data.codigo || data.cuenta || "5195");

                const esGasto = !(tipo.includes("ingreso") || cuentaPUC.startsWith("4") || tipo.includes("4135") || cuentaPUC.startsWith("11") || tipo.includes("2805"));
                
                if (esGasto && monto > 0) {
                    const placaRaw = (data.placa || "ADMIN").toUpperCase().trim();
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

                    const registroGastoObj = {
                        puc: cuentaPUC,
                        concepto: detalle,
                        monto: monto,
                        placa: placaClaveGasto
                    };
                    listaGastosBase.push(registroGastoObj);

                    const esNominaInformal = cuentaPUC.startsWith("5105") || cuentaPUC.startsWith("7205") || detalle.includes("NOMINA") || detalle.includes("PAGO MECANICO");

                    if (esNominaInformal) {
                        nominasInformalesGlobales += monto;
                    } else if (placaClaveGasto !== 'ADMIN' && placaClaveGasto.length >= 3) {
                        if (!mapaGastosPorPlaca[placaClaveGasto]) mapaGastosPorPlaca[placaClaveGasto] = 0;
                        mapaGastosPorPlaca[placaClaveGasto] += monto;
                    } else {
                        gastosFijosGlobales += monto;
                    }
                }
            });

            state.gastosContablesBase = listaGastosBase;
            state.gastosFijosGlobales = gastosFijosGlobales;
            state.nominasInformalesGlobales = nominasInformalesGlobales;
            state.mapaGastosPorPlaca = mapaGastosPorPlaca;

            const periodosSet = new Set();

            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                const identificadorVisual = (o.placa || 'S/N').toUpperCase().trim();
                const placaFinancieraClave = aislarPlacaPura(identificadorVisual);
                
                const facturacionBruta = safeNumber(o.total || o.costos_totales?.total || 0);
                
                let ingresosNetos = facturacionBruta;
                let ivaRetenido = 0;
                if (APLICA_IVA) {
                    ingresosNetos = facturacionBruta / (1 + IVA_FACTOR);
                    ivaRetenido = facturacionBruta - ingresosNetos;
                }
                
                const costosInternosOrden = safeNumber(o.costos_totales?.costo_directo || o.costo_directo || 0);
                const gastosContablesAsignados = (mapaGastosPorPlaca[placaFinancieraClave] || 0) + costosInternosOrden;
                
                // 🛠️ REMEDIO AL CORAZÓN FINANCIERO: El EBITDA Real resta los gastos asignados al INGRESO NETO REAL
                const ebitdaRealPlaca = ingresosNetos - gastosContablesAsignados;
                const margenEbitdaPrc = ingresosNetos > 0 ? (ebitdaRealPlaca / ingresosNetos) * 100 : 0;
                
                // 📅 REGENERACIÓN EXTRACTORA DE FECHAS AL ESTILO CONTABILIDAD.JS
                let fechaInicio = new Date();
                if (o.fecha_apertura) {
                    fechaInicio = new Date(o.fecha_apertura);
                } else if (o.fecha_ingreso) {
                    fechaInicio = new Date(o.fecha_ingreso);
                } else if (o.createdAt) {
                    fechaInicio = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                }
                
                if (isNaN(fechaInicio.getTime())) {
                    fechaInicio = new Date(); 
                }

                let fechaFin = o.fecha_entrega || o.fechas?.entrega || o.closedAt || null;
                if (!fechaFin && o.updatedAt && (o.estado === 'LISTO' || o.estado === 'ENTREGADO')) {
                    fechaFin = o.updatedAt;
                }
                
                let diasTaller = 1;
                if (fechaFin) {
                    const fechaCierre = fechaFin.toDate ? fechaFin.toDate() : new Date(fechaFin);
                    diasTaller = Math.ceil((fechaCierre - fechaInicio) / (1000 * 60 * 60 * 24));
                } else {
                    diasTaller = Math.ceil((new Date() - fechaInicio) / (1000 * 60 * 60 * 24));
                }
                if (diasTaller <= 0) diasTaller = 1;

                const mes = String(fechaInicio.getMonth() + 1).padStart(2, '0');
                const periodoClave = `${fechaInicio.getFullYear()}-${mes}`;
                periodosSet.add(periodoClave);
                
                return {
                    id: doc.id,
                    placa: identificadorVisual,
                    placa_pura: placaFinancieraClave,
                    area: o.tipo_orden || 'MECANICA',
                    total: facturacionBruta,
                    ingresosNetos: ingresosNetos,
                    iva: ivaRetenido,
                    gastosContabilidad: gastosContablesAsignados,
                    ebitda: ebitdaRealPlaca,
                    margenPorcentaje: margenEbitdaPrc,
                    dias: diasTaller,
                    cliente: o.cliente || 'CLIENTE GENERAL',
                    fecha: fechaInicio,
                    periodo: periodoClave,
                    bitacora_ia: o.diagnostico || o.bitacora_ia || o.observaciones || "SIN MOVIMIENTOS REGISTRADOS EN BITÁCORA"
                };
            });

            // Forzar la existencia de la línea de tiempo histórica contable solicitada
            const mesesPredeterminados = ["2026-04", "2026-05", "2026-06", "2026-07"];
            mesesPredeterminados.forEach(m => periodosSet.add(m));

            state.periodosDisponibles = Array.from(periodosSet).sort().reverse();
            poblarSelectorPeriodos();
            filtrarYProcesarDatos();

        } catch (e) {
            console.error("Error crítico en motor analítico SAP:", e);
        }
    };

    const poblarSelectorPeriodos = () => {
        const select = document.getElementById("selPeriodoFiscal");
        if (!select) return;
        let html = `<option value="TODOS">Todos los meses</option>`;
        state.periodosDisponibles.forEach(p => {
            html += `<option value="${p}">${p}</option>`;
        });
        select.innerHTML = html;
        if (state.periodosDisponibles.length > 0 && state.periodoSeleccionado === "TODOS" && state.filtroFrecuencia === "mes") {
            state.periodoSeleccionado = "2026-06"; 
        }
        select.value = state.periodoSeleccionado;
        ajustarFechasPorPeriodoMes();
    };

    const ajustarFechasPorPeriodoMes = () => {
        if (state.filtroFrecuencia === "mes" && state.periodoSeleccionado !== "TODOS") {
            const parts = state.periodoSeleccionado.split("-");
            const anio = parseInt(parts[0]);
            const mes = parseInt(parts[1]) - 1;
            state.fechaInicioFiltro = new Date(anio, mes, 1, 0, 0, 0, 0);
            state.fechaFinFiltro = new Date(anio, mes + 1, 0, 23, 59, 59, 999);
            
            document.getElementById("datePickerInicio").value = state.fechaInicioFiltro.toISOString().split('T')[0];
            document.getElementById("datePickerFin").value = state.fechaFinFiltro.toISOString().split('T')[0];
        }
    };

    const filtrarYProcesarDatos = () => {
        let filtradas = [...state.ordenesMaster];

        if (state.filtroFrecuencia !== "total") {
            if (state.fechaInicioFiltro && state.fechaFinFiltro) {
                const inicioMs = state.fechaInicioFiltro.getTime();
                const finMs = state.fechaFinFiltro.getTime();
                filtradas = filtradas.filter(o => {
                    const t = o.fecha.getTime();
                    return t >= inicioMs && t <= finMs;
                });
            }
        }

        state.dataActual = filtradas;
        const totalFacturadoBruto = filtradas.reduce((a, b) => a + b.total, 0);
        const totalEbitdaConsolidado = filtradas.reduce((a, b) => a + b.ebitda, 0) - state.gastosFijosGlobales - state.nominasInformalesGlobales;
        
        const metrics = {
            ebitdaNeto: totalEbitdaConsolidado,
            mttr: filtradas.reduce((a, b) => a + b.dias, 0) / (filtradas.length || 1),
            margenGeneral: totalFacturadoBruto > 0 ? (totalEbitdaConsolidado / totalFacturadoBruto) * 100 : 0,
            ticket: totalFacturadoBruto / (filtradas.length || 1)
        };

        renderKPIs(metrics);
        renderCharts(filtradas);
        renderTable(filtradas);
        document.getElementById("counterTag").innerText = `${filtradas.length} VEHÍCULOS EN RANGO`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA PERÍODO", fmt(m.ebitdaNeto), "fa-chart-line", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "NETO GENERAL COMPAÑÍA")}
            ${kpiCard("DURACIÓN EN TALLER", `${m.mttr.toFixed(1)} DÍAS`, "fa-hourglass-half", "text-cyan-400", "LEAD TIME GENERAL")}
            ${kpiCard("TICKET PROMEDIO", fmt(m.ticket), "fa-cash-register", "text-slate-200", "PROMEDIO POR VEHÍCULO")}
            ${kpiCard("MARGEN OPERATIVO", pct(m.margenGeneral), "fa-percent", "text-cyan-400", "RENTABILIDAD REAL")}
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
            body.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-500 text-[11px] uppercase tracking-widest">Sin datos analíticos en las fechas seleccionadas.</td></tr>`;
            return;
        }

        body.innerHTML = data.map(o => `
            <tr class="hover:bg-cyan-500/[0.02] transition-colors cursor-pointer" onclick="window.toggleDrillDownPlaca('${o.id}', '${o.placa_pura}')">
                <td class="p-5">
                    <p class="font-black text-white text-sm tracking-tight"><i class="fas fa-chevron-right text-[10px] text-cyan-500 mr-2"></i>${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${String(o.cliente).substring(0, 24)}</p>
                </td>
                <td class="p-5">
                    <span class="px-2.5 py-1 rounded-md text-[8px] font-black bg-slate-950 border border-white/5 text-cyan-400 uppercase">${o.area}</span>
                </td>
                <td class="p-5">
                    <p class="text-white font-bold text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Facturado</p>
                </td>
                <td class="p-5">
                    <p class="text-red-400 font-bold text-xs">${fmt(o.gastosContabilidad)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Costos Directos</p>
                </td>
                <td class="p-5 text-right">
                    <p class="font-black text-sm ${o.ebitda > 0 ? 'text-emerald-400' : 'text-red-500'}">${fmt(o.ebitda)}</p>
                    <p class="text-[8px] font-bold text-slate-500">${pct(o.margenPorcentaje)} MG</p>
                </td>
                <td class="p-5 text-center">
                    <span class="font-bold text-xs text-emerald-400">${o.dias} DÍAS</span>
                </td>
            </tr>
            <tr id="drilldown-${o.id}" class="hidden bg-[#040712] drilldown-container">
                <td colspan="6" class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                        <div class="bg-black/30 p-5 rounded-xl border border-white/5 relative flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="orbitron font-black text-cyan-400 text-[10px] uppercase tracking-wider">Bitácora Técnica Forense</h4>
                                    <button onclick="window.exportarPdfPlaca('${o.id}', event)" class="bg-red-600/90 text-white font-bold px-4 py-2 rounded-lg text-[9px] uppercase tracking-wider shadow-lg hover:bg-red-500 transition-all flex items-center gap-2">
                                        <i class="fas fa-file-pdf"></i> Exportar Informe de Socios
                                    </button>
                                </div>
                                <p class="text-slate-300 font-mono text-[11px] uppercase bg-black/40 p-4 rounded-lg border border-white/5 leading-relaxed">${o.bitacora_ia}</p>
                            </div>
                        </div>
                        <div class="bg-black/30 p-5 rounded-xl border border-white/5">
                            <h4 class="orbitron font-black text-amber-400 text-[10px] uppercase tracking-wider mb-4">Estructura Auxiliar PUC Imputada</h4>
                            <div id="puc-list-${o.id}" class="space-y-1 text-[11px] font-bold max-h-48 overflow-y-auto pr-2"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");
    };

    window.toggleDrillDownPlaca = (id, placaPura) => {
        const fila = document.getElementById(`drilldown-${id}`);
        if (!fila) return;
        if (!fila.classList.contains("hidden")) { fila.classList.add("hidden"); return; }
        fila.classList.remove("hidden");

        const contenedorPuc = document.getElementById(`puc-list-${id}`);
        if (!contenedorPuc) return;

        const gastosAsignados = state.gastosContablesBase.filter(g => g.placa === placaPura);
        let htmlPuc = "";
        const orden = state.ordenesMaster.find(o => o.id === id);

        if (orden) {
            htmlPuc += `<div class="flex justify-between text-emerald-400 border-b border-white/5 pb-1"><span>413505 - INGRESO COMPAÑÍA</span><span>${fmt(orden.total)}</span></div>`;
            if (APLICA_IVA) {
                htmlPuc += `<div class="flex justify-between text-slate-400 border-b border-white/5 py-1"><span>240805 - IVA DÉBITO RETENIDO</span><span>-${fmt(orden.iva)}</span></div>`;
            }
        }

        gastosAsignados.forEach(g => {
            htmlPuc += `<div class="flex justify-between text-red-400 border-b border-white/5 py-1"><span>${g.puc} - ${g.concepto}</span><span>-${fmt(g.monto)}</span></div>`;
        });
        contenedorPuc.innerHTML = htmlPuc || `<p class="text-slate-500 italic">Sin movimientos PUC adicionales</p>`;
    };

    // 📥 DOCUMENT ENGINE GENERATOR PARA JUNTA DE SOCIOS CON RENDERING DE MÓDULO VECTORIAL
    window.exportarPdfPlaca = (id, event) => {
        event.stopPropagation();
        const orden = state.ordenesMaster.find(o => o.id === id);
        if (!orden) return;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Fondo Canvas Dark Mode Premium
        pdf.setFillColor(11, 15, 23);
        pdf.rect(0, 0, 210, 297, 'F');

        // Encabezado
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(22);
        pdf.setTextColor(6, 182, 212); // Cyan
        pdf.text("TALLERPRO360 // EXECUTIVE REPORT", 15, 25);

        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`SISTEMA DE AUDITORÍA FORENSE DE FLOTA - PROTOCOLO QUANTUM-SAP`, 15, 32);

        pdf.setDrawColor(30, 41, 59);
        pdf.line(15, 36, 195, 36);

        // Bloque Informativo Principal
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`PLACA DEL VEHÍCULO:`, 15, 48);
        pdf.setFont("Helvetica", "normal");
        pdf.text(`${orden.placa}`, 65, 48);

        pdf.setFont("Helvetica", "bold");
        pdf.text(`PROPIETARIO / CLIENTE:`, 15, 55);
        pdf.setFont("Helvetica", "normal");
        pdf.text(`${orden.cliente}`, 65, 55);

        pdf.setFont("Helvetica", "bold");
        pdf.text(`UNIDAD OPERATIVA:`, 15, 62);
        pdf.setFont("Helvetica", "normal");
        pdf.text(`${orden.area}`, 65, 62);

        pdf.setFont("Helvetica", "bold");
        pdf.text(`PERIODO DE CIERRE:`, 15, 69);
        pdf.setFont("Helvetica", "normal");
        pdf.text(`${orden.periodo}`, 65, 69);

        // Tabla de Liquidación de Utilidades
        pdf.setFillColor(15, 23, 42);
        pdf.rect(15, 78, 180, 40, 'F');

        pdf.setFont("Helvetica", "bold");
        pdf.setTextColor(148, 163, 184);
        pdf.text("CONCEPTO", 20, 86);
        pdf.text("VALOR LIQUIDADO", 140, 86);
        pdf.line(15, 90, 195, 90);

        pdf.setFont("Helvetica", "normal");
        pdf.setTextColor(255, 255, 255);
        pdf.text("Ingresos Netos (Sin Impuestos):", 20, 96);
        pdf.text(`${fmt(orden.ingresosNetos)}`, 140, 96);

        pdf.text("Egresos Directos Asignados (PUC):", 20, 104);
        pdf.setTextColor(244, 63, 94);
        pdf.text(`-${fmt(orden.gastosContabilidad)}`, 140, 104);

        pdf.line(15, 108, 195, 108);
        pdf.setFont("Helvetica", "bold");
        pdf.setTextColor(52, 211, 153);
        pdf.text("EBITDA NETO REAL EXTRAÍDO:", 20, 114);
        pdf.text(`${fmt(orden.ebitda)}`, 140, 114);

        // 📊 INYECCIÓN DE GRÁFICO VECTORIAL INTEGRADO AL PDF (Estructura de Absorción)
        const totalDinero = orden.ingresosNetos + orden.gastosContabilidad;
        const porcGasto = totalDinero > 0 ? (orden.gastosContabilidad / totalDinero) : 0.5;
        
        // Coordenadas del gráfico
        const cx = 155, cy = 150, r = 20;
        
        pdf.setLineWidth(4);
        // Base Cyan (Utilidad)
        pdf.setDrawColor(6, 182, 212);
        pdf.arc(cx, cy, r, 0, 2 * Math.PI, 'FD');
        
        // Arco Rojo (Gasto)
        pdf.setDrawColor(244, 63, 94);
        pdf.arc(cx, cy, r, 0, (2 * Math.PI) * porcGasto, 'FD');

        // Leyenda Gráfico
        pdf.setFontSize(8);
        pdf.setFillColor(6, 182, 212); pdf.rect(120, 178, 3, 3, 'F');
        pdf.setTextColor(148, 163, 184); pdf.text("Margen Utilidad", 125, 181);
        
        pdf.setFillColor(244, 63, 94); pdf.rect(155, 178, 3, 3, 'F');
        pdf.text("Costo Directo", 160, 181);

        // Desglose de Cuentas PUC Auxiliares
        pdf.setFontSize(11);
        pdf.setTextColor(251, 191, 36);
        pdf.text("DESGLOSE DE SUB-CUENTAS AUXILIARES AFECTADAS:", 15, 134);
        
        pdf.setFontSize(9);
        pdf.setTextColor(226, 232, 240);
        let yShift = 144;
        
        const subcuentas = state.gastosContablesBase.filter(g => g.placa === orden.placa_pura);
        if (subcuentas.length === 0) {
            pdf.setFont("Helvetica", "italic");
            pdf.text("No se registran egresos contables externos imputados a esta placa en el periodo.", 20, yShift);
            yShift += 8;
        } else {
            subcuentas.forEach(g => {
                if (yShift < 185) {
                    pdf.text(`• PUC ${g.puc} - ${g.concepto.substring(0, 45)}:`, 20, yShift);
                    pdf.text(`-${fmt(g.monto)}`, 100, yShift);
                    yShift += 6;
                }
            });
        }

        // Historial Técnico de Bitácora
        pdf.setFontSize(11);
        pdf.setTextColor(6, 182, 212);
        pdf.text("OBSERVACIONES Y DIAGNÓSTICO EN BITÁCORA:", 15, 202);

        pdf.setFillColor(15, 23, 42);
        pdf.rect(15, 208, 180, 45, 'F');

        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        
        // Split text para evitar desbordamientos de página en bloques largos de bitácora
        const lines = pdf.splitTextToSize(orden.bitacora_ia.toUpperCase(), 170);
        pdf.text(lines, 20, 216);

        // Pie de Página Institucional
        pdf.setDrawColor(30, 41, 59);
        pdf.line(15, 270, 195, 270);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text("DOCUMENTO DE CARÁCTER RESERVADO - AUDITORÍA INTERNA EXCLUSIVA PARA CONSEJO DE SOCIOS", 15, 278);

        pdf.save(`INFORME_JUNTA_${orden.placa}.pdf`);
    };

    const renderCharts = (data) => {
        const ultimas = data.slice(-8);
        const ctxMain = document.getElementById('mainChart');
        if (ctxMain) {
            if (state.charts.main) state.charts.main.destroy();
            state.charts.main = new Chart(ctxMain, {
                type: 'bar',
                data: {
                    labels: ultimas.map(o => o.placa),
                    datasets: [{ data: ultimas.map(o => o.ebitda), backgroundColor: ultimas.map(o => o.ebitda > 0 ? '#06b6d4' : '#ef4444'), borderRadius: 6 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        const ctxPie = document.getElementById('pieChart');
        if (ctxPie) {
            if (state.charts.pie) state.charts.pie.destroy();
            state.charts.pie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Admin', 'Nóminas', 'Flota'],
                    datasets: [{ data: [state.gastosFijosGlobales, state.nominasInformalesGlobales, data.reduce((a, b) => a + b.gastosContabilidad, 0)], backgroundColor: ['#f43f5e', '#f59e0b', '#06b6d4'], borderWidth: 0 }]
                },
                options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        const ctxLinea = document.getElementById('lineaChart');
        if (ctxLinea) {
            if (state.charts.linea) state.charts.linea.destroy();
            
            const conteoAreas = {};
            data.forEach(o => { conteoAreas[o.area] = (conteoAreas[o.area] || 0) + 1; });
            
            state.charts.linea = new Chart(ctxLinea, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(conteoAreas),
                    datasets: [{ data: Object.values(conteoAreas), backgroundColor: ['#06b6d4', '#a855f7', '#fbbf24', '#f43f5e'], borderWidth: 0 }]
                },
                options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    };

    const setupEventListeners = () => {
        const btnTotal = document.getElementById("freq-total");
        const btnMes = document.getElementById("freq-mes");

        if(btnTotal && btnMes) {
            btnTotal.onclick = () => {
                btnTotal.classList.add("active"); btnMes.classList.remove("active");
                state.filtroFrecuencia = "total";
                filtrarYProcesarDatos();
            };
            btnMes.onclick = () => {
                btnMes.classList.add("active"); btnTotal.classList.remove("active");
                state.filtroFrecuencia = "mes";
                ajustarFechasPorPeriodoMes();
                filtrarYProcesarDatos();
            };
        }

        const selectPeriodo = document.getElementById("selPeriodoFiscal");
        if (selectPeriodo) {
            selectPeriodo.onchange = (e) => {
                state.periodoSeleccionado = e.target.value;
                if(state.periodoSeleccionado !== "TODOS") {
                    state.filtroFrecuencia = "mes";
                    if(btnMes) btnMes.classList.add("active");
                    if(btnTotal) btnTotal.classList.remove("active");
                }
                ajustarFechasPorPeriodoMes();
                filtrarYProcesarDatos();
            };
        }

        const dpInicio = document.getElementById("datePickerInicio");
        const dpFin = document.getElementById("datePickerFin");

        const alCambiarFechasManual = () => {
            if(dpInicio.value && dpFin.value) {
                state.fechaInicioFiltro = new Date(dpInicio.value + "T00:00:00");
                state.fechaFinFiltro = new Date(dpFin.value + "T23:59:59");
                state.filtroFrecuencia = "rango";
                if(btnTotal) btnTotal.classList.remove("active");
                if(btnMes) btnMes.classList.remove("active");
                filtrarYProcesarDatos();
            }
        };

        if(dpInicio && dpFin) {
            dpInicio.onchange = alCambiarFechasManual;
            dpFin.onchange = alCambiarFechasManual;
        }

        const btnExport = document.getElementById("btnExportGlobal");
        if (btnExport) {
            btnExport.onclick = () => {
                if (typeof XLSX === 'undefined') {
                    alert("Error: Librería XLSX Engine no detectada.");
                    return;
                }

                if (state.dataActual.length === 0) {
                    alert("No hay registros financieros en el rango de fechas programado para exportar.");
                    return;
                }

                const listaPucsDeCostos = new Set();
                state.dataActual.forEach(o => {
                    const gastosDeEstaPlaca = state.gastosContablesBase.filter(g => g.placa === o.placa_pura);
                    gastosDeEstaPlaca.forEach(g => {
                        if (g.puc) listaPucsDeCostos.add(String(g.puc));
                    });
                });

                const arrayPucsOrdenados = Array.from(listaPucsDeCostos).sort();

                const rowsExcel = state.dataActual.map(o => {
                    const filaBase = {
                        "PERIODO_FISCAL": o.periodo,
                        "VEHICULO_PLACA": o.placa, 
                        "CLIENTE_EMPRESA": o.cliente, 
                        "INGRESOS_BRUTOS_4135": o.total,
                        "IVA_DEBITO_2408": o.iva,
                        "INGRESOS_NETOS": o.ingresosNetos,
                        "TOTAL_COSTOS_DIRECTOS": o.gastosContabilidad,
                        "EBITDA_NETO_PLACA": o.ebitda, 
                        "MARGEN_RENTABILIDAD": o.margenPorcentaje / 100, 
                        "DIAS_PERMANENCIA": o.dias
                    };

                    arrayPucsOrdenados.forEach(pucCodigo => {
                        filaBase[`PUC_${pucCodigo}`] = 0;
                    });

                    const gastosDeEstaPlaca = state.gastosContablesBase.filter(g => g.placa === o.placa_pura);
                    gastosDeEstaPlaca.forEach(g => {
                        filaBase[`PUC_${g.puc}`] += safeNumber(g.monto);
                    });

                    return filaBase;
                });

                const ws = XLSX.utils.json_to_sheet(rowsExcel);
                const totalRows = rowsExcel.length;
                const idxTotal = totalRows + 2; 

                ws[`B${idxTotal}`] = { v: "TOTAL PERÍODO AUDITADO", t: 's' };
                ws[`D${idxTotal}`] = { f: `SUM(D2:D${totalRows + 1})`, t: 'n' };
                ws[`E${idxTotal}`] = { f: `SUM(E2:E${totalRows + 1})`, t: 'n' };
                ws[`F${idxTotal}`] = { f: `SUM(F2:F${totalRows + 1})`, t: 'n' };
                ws[`G${idxTotal}`] = { f: `SUM(G2:G${totalRows + 1})`, t: 'n' };
                
                const formulaEbitdaForense = `SUM(H2:H${totalRows + 1}) - ${state.gastosFijosGlobales} - ${state.nominasInformalesGlobales}`;
                ws[`H${idxTotal}`] = { f: formulaEbitdaForense, t: 'n' };
                
                ws[`I${idxTotal}`] = { f: `AVERAGE(I2:I${totalRows + 1})`, t: 'n' };
                ws[`J${idxTotal}`] = { f: `AVERAGE(J2:J${totalRows + 1})`, t: 'n' };

                let letraColumnaAscii = 75; 
                arrayPucsOrdenados.forEach((puc, index) => {
                    const colLetter = getExcelColumnName(letraColumnaAscii + index);
                    ws[`${colLetter}${idxTotal}`] = { f: `SUM(${colLetter}2:${colLetter}${totalRows + 1})`, t: 'n' };
                });

                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    ['D', 'E', 'F', 'G', 'H'].forEach(col => {
                        const cell = ws[col + (R + 1)]; if (cell) cell.z = '$#,##0';
                    });
                    arrayPucsOrdenados.forEach((p, idx) => {
                        const colLetter = getExcelColumnName(letraColumnaAscii + idx);
                        const cellPuc = ws[colLetter + (R + 1)]; if (cellPuc) cellPuc.z = '$#,##0';
                    });
                    const cellPct = ws['I' + (R + 1)]; if (cellPct) cellPct.z = '0.0%';
                }

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "AUDITORIA_PUC");
                
                const fechaString = new Date().toISOString().split('T')[0];
                XLSX.writeFile(wb, `TallerPRO360_AuditoriaPUC_${fechaString}.xlsx`);
            };
        }
    };

    const getExcelColumnName = (colNum) => {
        let columnName = "";
        while (colNum > 0) {
            let rem = (colNum - 1) % 26;
            columnName = String.fromCharCode(65 + rem) + columnName;
            colNum = Math.floor((colNum - rem) / 26);
        }
        return columnName;
    };

    const loadDependencies = async () => {
        const libs = [
            "https://cdn.jsdelivr.net/npm/chart.js", 
            "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        ];
        for (const lib of libs) {
            if (!document.querySelector(`script[src="${lib}"]`)) {
                await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
            }
        }
    };

    await init();
}
