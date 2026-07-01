/**
 * 🏛️ TALLERPRO360 - REPORTES, FINANZAS & AUDITORÍA FORENSE V22.0 🚀
 * PROTOCOLO: ESTABILIZACIÓN OPERATIVA INTERNA / RÉGIMEN NO RESPONSABLE DE IVA
 * Desarrollado por: William Jeffry Urquijo Cubillos & Gemini AI (2026)
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron flex flex-col gap-4 justify-center items-center font-bold bg-[#020617] min-h-screen">
            <i class="fas fa-exclamation-triangle text-4xl animate-pulse"></i>
            <span>ERROR CRÍTICO: AUTENTICACIÓN SAP REQUERIDA PARA MATRIZ DE REPORTES</span>
        </div>`;
        return;
    }

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
        mapaDetalleGastosPUC: {}, 
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
            .chart-container { background: #0b0f17; padding: 1.5rem; border-radius: 2rem; border: 1px solid rgba(255,255,255,0.03); display: flex; flex-direction: column; justify-content: space-between; min-height: 320px; }
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
                        <p class="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase mt-2">MATRIZ DE REPORTES // CONFIABILIDAD CONTABLE DE SUB-CUENTAS REALES</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-xl text-[11px] font-black hover:bg-emerald-400 transition-all flex items-center gap-2.5 shadow-lg">
                        <i class="fas fa-file-excel text-base"></i> EXPORTAR MATRIZ CONSOLIDADA DE COSTOS Y PUC
                    </button>
                </div>

                <div class="w-full grid grid-cols-1 xl:grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 items-center justify-between mt-4">
                    <div class="flex flex-wrap gap-2 items-center justify-center xl:justify-start xl:col-span-2">
                        <button id="freq-total" class="filter-btn">Todo el Historial</button>
                        <button id="freq-mes" class="filter-btn active">Mes Seleccionado</button>
                        
                        <span class="text-[9px] text-amber-400 font-bold uppercase tracking-wider ml-4 mr-1">Periodo Contable:</span>
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
                <div class="chart-container">
                    <h3 class="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4"><i class="fas fa-chart-bar mr-2"></i>EBITDA Real por Vehículo</h3>
                    <div class="h-56 w-full"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <h3 class="text-xs font-black text-amber-400 uppercase tracking-widest mb-4"><i class="fas fa-chart-pie mr-2"></i>Estructura de Gastos Generales</h3>
                    <div class="h-56 w-full"><canvas id="pieChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <h3 class="text-xs font-black text-purple-400 uppercase tracking-widest mb-4"><i class="fas fa-industry mr-2"></i>Distribución de Órdenes</h3>
                    <div class="h-56 w-full"><canvas id="lineaChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0b0f17] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-12">
                <div class="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
                    <div>
                        <h3 class="text-xs font-black text-white uppercase tracking-widest">Estructura Operativa Directa por Flota</h3>
                        <p class="text-[9px] text-slate-500 mt-1">Haga clic en la fila de la placa para ver las subcuentas asignadas y exportar el PDF Corporativo</p>
                    </div>
                    <span id="counterTag" class="text-[9px] bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-md font-black border border-cyan-500/20 uppercase tracking-wider">Procesando...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-950/60 text-slate-400 text-[9px] uppercase font-black tracking-wider border-b border-white/5">
                            <tr>
                                <th class="p-6">Vehículo Placa</th>
                                <th class="p-6">Tipo Servicio</th>
                                <th class="p-6">Ingreso Integral (Base + IVA)</th>
                                <th class="p-6">Costos + Gastos Conexos</th>
                                <th class="p-6 text-right">EBITDA Real Neto</th>
                                <th class="p-6 text-center">Periodo</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-xs divide-y divide-white/[0.02]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
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
            const mapaDetalleGastosPUC = {};
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

                    listaGastosBase.push({ puc: cuentaPUC, concepto: detalle, monto: monto, placa: placaClaveGasto });

                    if (cuentaPUC.startsWith("5105") || cuentaPUC.startsWith("7205") || detalle.includes("NOMINA") || detalle.includes("PAGO MECANICO")) {
                        nominasInformalesGlobales += monto;
                    } else if (placaClaveGasto !== 'ADMIN' && placaClaveGasto.length >= 3) {
                        if (!mapaGastosPorPlaca[placaClaveGasto]) mapaGastosPorPlaca[placaClaveGasto] = 0;
                        mapaGastosPorPlaca[placaClaveGasto] += monto;

                        if (!mapaDetalleGastosPUC[placaClaveGasto]) mapaDetalleGastosPUC[placaClaveGasto] = {};
                        if (!mapaDetalleGastosPUC[placaClaveGasto][cuentaPUC]) mapaDetalleGastosPUC[placaClaveGasto][cuentaPUC] = 0;
                        mapaDetalleGastosPUC[placaClaveGasto][cuentaPUC] += monto;
                    } else {
                        gastosFijosGlobales += monto;
                    }
                }
            });

            state.gastosContablesBase = listaGastosBase;
            state.gastosFijosGlobales = gastosFijosGlobales;
            state.nominasInformalesGlobales = nominasInformalesGlobales;
            state.mapaGastosPorPlaca = mapaGastosPorPlaca;
            state.mapaDetalleGastosPUC = mapaDetalleGastosPUC;

            const periodosSet = new Set();

            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                const identificadorVisual = (o.placa || 'S/N').toUpperCase().trim();
                const placaFinancieraClave = aislarPlacaPura(identificadorVisual);
                
                // 💎 REGLA DE ORO DEL TALLER: No se divide por 1.19. El total recaudado es 100% ingreso.
                const facturacionIntegralTotal = safeNumber(o.total || o.costos_totales?.total || 0);
                const valorIvaSimulado = facturacionIntegralTotal - (facturacionIntegralTotal / 1.19);
                
                const costoDirectoOrden = safeNumber(o.costos_totales?.costo_directo || o.costo_directo || 0);
                const gastosConexosPUC = mapaGastosPorPlaca[placaFinancieraClave] || 0;
                const egresosTotalesConsolidados = costoDirectoOrden + gastosConexosPUC;
                
                // EBITDA Real Matemático Sincronizado
                const ebitdaRealPlaca = facturacionIntegralTotal - egresosTotalesConsolidados;
                const margenEbitdaPrc = facturacionIntegralTotal > 0 ? (ebitdaRealPlaca / facturacionIntegralTotal) * 100 : 0;
                
                let fechaFinalObj = new Date();
                let stringFechaBase = o.fecha_creacion_manual || o.fecha_apertura || o.fecha_ingreso || "";

                if (stringFechaBase) {
                    fechaFinalObj = new Date(stringFechaBase);
                    if (isNaN(fechaFinalObj.getTime())) {
                        const partes = String(stringFechaBase).substring(0, 10).split('-');
                        if (partes.length === 3) {
                            fechaFinalObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
                        }
                    }
                } else if (o.createdAt) {
                    fechaFinalObj = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                }

                if (isNaN(fechaFinalObj.getTime())) {
                    fechaFinalObj = new Date(); 
                }

                const mesFormateado = String(fechaFinalObj.getMonth() + 1).padStart(2, '0');
                const periodoClave = `${fechaFinalObj.getFullYear()}-${mesFormateado}`;
                periodosSet.add(periodoClave);
                
                return {
                    id: doc.id,
                    placa: identificadorVisual,
                    placa_pura: placaFinancieraClave,
                    area: o.tipo_orden || 'MECANICA',
                    total: facturacionIntegralTotal,
                    ivaCalculado: valorIvaSimulado,
                    costoDirectoOrden: costoDirectoOrden,
                    gastosConexosPUC: gastosConexosPUC,
                    egresosConsolidados: egresosTotalesConsolidados,
                    ebitda: ebitdaRealPlaca, 
                    margenPorcentaje: margenEbitdaPrc,
                    cliente: o.cliente || 'CLIENTE GENERAL',
                    fecha: fechaFinalObj,
                    periodo: periodoClave,
                    bitacora_ia: o.bitacora_ia || o.diagnostico || o.observaciones || "SIN MOVIMIENTOS REGISTRADOS EN BITÁCORA"
                };
            });

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
        let html = `<option value="TODOS">Todos los periodos</option>`;
        state.periodosDisponibles.forEach(p => {
            html += `<option value="${p}">${p}</option>`;
        });
        select.innerHTML = html;
        
        if (state.periodoSeleccionado === "TODOS" && state.periodosDisponibles.length > 0) {
            state.periodoSeleccionado = state.periodosDisponibles[0]; 
        }
        select.value = state.periodoSeleccionado;
        ajustarFechasPorPeriodoMes();
    };

    const ajustarFechasPorPeriodoMes = () => {
        if (state.filtroFrecuencia === "mes" && state.periodoSeleccionado !== "TODOS") {
            const parts = state.periodoSeleccionado.split("-");
            state.fechaInicioFiltro = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1, 0, 0, 0, 0);
            state.fechaFinFiltro = new Date(parseInt(parts[0]), parseInt(parts[1]), 0, 23, 59, 59, 999);
            
            document.getElementById("datePickerInicio").value = state.fechaInicioFiltro.toISOString().split('T')[0];
            document.getElementById("datePickerFin").value = state.fechaFinFiltro.toISOString().split('T')[0];
        }
    };

    const filtrarYProcesarDatos = () => {
        let filtradas = [...state.ordenesMaster];

        if (state.filtroFrecuencia !== "total" && state.fechaInicioFiltro && state.fechaFinFiltro) {
            const inicioMs = state.fechaInicioFiltro.getTime();
            const finMs = state.fechaFinFiltro.getTime();
            filtradas = filtradas.filter(o => {
                const t = o.fecha.getTime();
                return t >= inicioMs && t <= finMs;
            });
        }

        state.dataActual = filtradas;
        const totalFacturadoBruto = filtradas.reduce((a, b) => a + b.total, 0);
        const totalEbitdaConsolidado = filtradas.reduce((a, b) => a + b.ebitda, 0) - state.gastosFijosGlobales - state.nominasInformalesGlobales;
        
        const metrics = {
            ebitdaNeto: totalEbitdaConsolidado,
            ticket: totalFacturadoBruto / (filtradas.length || 1),
            margenGeneral: totalFacturadoBruto > 0 ? (totalEbitdaConsolidado / totalFacturadoBruto) * 100 : 0,
            volumen: filtradas.length
        };

        renderKPIs(metrics);
        renderCharts(filtradas);
        renderTable(filtradas);
        document.getElementById("counterTag").innerText = `${filtradas.length} ORDENES EN PERIODO ${state.periodoSeleccionado}`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA COMPAÑÍA", fmt(m.ebitdaNeto), "fa-wallet", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "UTILIDAD NETA INTEGRAL")}
            ${kpiCard("TICKET PROMEDIO", fmt(m.ticket), "fa-calculator", "text-cyan-400", "RECAUDO POR ORDEN")}
            ${kpiCard("MARGEN OPERATIVO", pct(m.margenGeneral), "fa-percent", "text-purple-400", "RENTABILIDAD SOBRE VENTAS")}
            ${kpiCard("ÓRDENES PROCESADAS", `${m.volumen} UNIDADES`, "fa-car", "text-amber-400", "VOLUMEN DE PRODUCCIÓN")}
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
            body.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-500 text-[11px] uppercase tracking-widest">Sin registros contables mapeados en este periodo.</td></tr>`;
            return;
        }

        body.innerHTML = data.map(o => `
            <tr class="hover:bg-cyan-500/[0.02] transition-colors cursor-pointer" onclick="window.toggleDrillDownPlaca('${o.id}', '${o.placa_pura}')">
                <td class="p-5">
                    <p class="font-black text-white text-sm tracking-tight"><i class="fas fa-chevron-right text-[10px] text-cyan-500 mr-2"></i>${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${String(o.cliente).substring(0, 26)}</p>
                </td>
                <td class="p-5">
                    <span class="px-2.5 py-1 rounded-md text-[8px] font-black bg-slate-950 border border-white/5 text-cyan-400 uppercase">${o.area}</span>
                </td>
                <td class="p-5">
                    <p class="text-white font-bold text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Ingreso Real (Con IVA)</p>
                </td>
                <td class="p-5">
                    <p class="text-red-400 font-bold text-xs">${fmt(o.egresosConsolidados)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Orden + Conexos PUC</p>
                </td>
                <td class="p-5 text-right">
                    <p class="font-black text-sm ${o.ebitda > 0 ? 'text-emerald-400' : 'text-red-500'}">${fmt(o.ebitda)}</p>
                    <p class="text-[8px] font-bold text-slate-500">${pct(o.margenPorcentaje)} MG</p>
                </td>
                <td class="p-5 text-center">
                    <span class="font-bold text-xs text-amber-400 uppercase bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">${o.periodo}</span>
                </td>
            </tr>
            <tr id="drilldown-${o.id}" class="hidden bg-[#040712] drilldown-container">
                <td colspan="6" class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                        <div class="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="orbitron font-black text-cyan-400 text-[10px] uppercase tracking-wider">Bitácora Técnica Operativa</h4>
                                    <button onclick="window.exportarPdfPlaca('${o.id}', event)" class="bg-red-600 text-white font-black px-4 py-2 rounded-lg text-[9px] uppercase tracking-wider shadow-lg hover:bg-red-500 transition-all flex items-center gap-2">
                                        <i class="fas fa-file-pdf"></i> GENERAR INFORME DE SOCIOS PDF
                                    </button>
                                </div>
                                <p class="text-slate-300 font-mono text-[11px] uppercase bg-black/40 p-4 rounded-lg border border-white/5 leading-relaxed whitespace-pre-line">${o.bitacora_ia}</p>
                            </div>
                        </div>
                        <div class="bg-black/30 p-5 rounded-xl border border-white/5">
                            <h4 class="orbitron font-black text-amber-400 text-[10px] uppercase tracking-wider mb-4">Estructura Detallada Subcuentas PUC (Gastos Conexos)</h4>
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

        const orden = state.ordenesMaster.find(o => o.id === id);
        let htmlPuc = "";

        if (orden) {
            htmlPuc += `<div class="flex justify-between text-emerald-400 border-b border-white/5 pb-1.5 font-black"><span>4135 - INGRESO RECIBIDO (CON IVA INCLUIDO)</span><span>${fmt(orden.total)}</span></div>`;
            htmlPuc += `<div class="flex justify-between text-amber-400 border-b border-white/5 py-1"><span>COSTO_DIRECTO - REGISTRO INTERNO ORDEN</span><span>-${fmt(orden.costoDirectoOrden)}</span></div>`;
        }

        const pucsDeEstaPlaca = state.mapaDetalleGastosPUC[placaPura] || {};
        Object.keys(pucsDeEstaPlaca).forEach(puc => {
            htmlPuc += `<div class="flex justify-between text-red-400 border-b border-white/5 py-1 font-mono"><span>PUC ${puc} - ASIGNACIÓN CONTABLE DIARIO</span><span>-${fmt(pucsDeEstaPlaca[puc])}</span></div>`;
        });

        if (Object.keys(pucsDeEstaPlaca).length === 0 && orden?.costoDirectoOrden === 0) {
            htmlPuc += `<p class="text-slate-500 italic py-2">Sin subcuentas o gastos conexos asociados en contabilidad.</p>`;
        }
        
        contenedorPuc.innerHTML = htmlPuc;
    };

    window.exportarPdfPlaca = (id, event) => {
        event.stopPropagation();
        const orden = state.ordenesMaster.find(o => o.id === id);
        if (!orden) return;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        pdf.setFillColor(11, 15, 23);
        pdf.rect(0, 0, 210, 297, 'F');

        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(20);
        pdf.setTextColor(6, 182, 212); 
        pdf.text("TALLERPRO360 // AUDIT REPORT", 15, 25);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`ESTADO FINANCIERO INTEGRAL DE VEHÍCULO - JUNTA DE SOCIOS`, 15, 31);

        pdf.setDrawColor(30, 41, 59);
        pdf.line(15, 35, 195, 35);

        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`PLACA UNIDAD:`, 15, 45);
        pdf.setFont("Helvetica", "normal"); pdf.text(`${orden.placa}`, 60, 45);

        pdf.setFont("Helvetica", "bold"); pdf.text(`CLIENTE ASOCIADO:`, 15, 51);
        pdf.setFont("Helvetica", "normal"); pdf.text(`${orden.cliente}`, 60, 51);

        pdf.setFont("Helvetica", "bold"); pdf.text(`TIPO DE SERVICIO:`, 15, 57);
        pdf.setFont("Helvetica", "normal"); pdf.text(`${orden.area}`, 60, 57);

        pdf.setFont("Helvetica", "bold"); pdf.text(`PERIODO DE CIERRE:`, 15, 63);
        pdf.setFont("Helvetica", "normal"); pdf.text(`${orden.periodo}`, 60, 63);

        pdf.setFillColor(15, 23, 42);
        pdf.rect(15, 72, 180, 46, 'F');

        pdf.setFont("Helvetica", "bold");
        pdf.setTextColor(148, 163, 184);
        pdf.text("CONCEPTO FISCAL", 20, 80);
        pdf.text("VALOR INTEGRAL", 145, 80);
        pdf.line(15, 84, 195, 84);

        pdf.setFont("Helvetica", "normal");
        pdf.setTextColor(255, 255, 255);
        pdf.text("Ingresos Totales (Base + IVA incluido):", 20, 90);
        pdf.text(`${fmt(orden.total)}`, 145, 90);

        pdf.setTextColor(244, 63, 94);
        pdf.text("(-) Costo Directo Interno Orden:", 20, 97);
        pdf.text(`-${fmt(orden.costoDirectoOrden)}`, 145, 97);

        pdf.text("(-) Gastos Conexos Contabilidad (PUC):", 20, 104);
        pdf.text(`-${fmt(orden.gastosConexosPUC)}`, 145, 104);

        pdf.line(15, 108, 195, 108);
        pdf.setFont("Helvetica", "bold");
        pdf.setTextColor(52, 211, 153); 
        pdf.text("EBITDA COMPAÑÍA EXTRAÍDO:", 20, 114);
        pdf.text(`${fmt(orden.ebitda)}`, 145, 114);

        pdf.setFontSize(10);
        pdf.setTextColor(6, 182, 212);
        pdf.text("MÉTRICA DE DISTRIBUCIÓN Y ABSORCIÓN DE COSTOS", 15, 130);

        const totalFlujo = orden.total || 1;
        const porcCostos = Math.min((orden.egresosConsolidados / totalFlujo), 1);
        const porcEbitda = Math.max(1 - porcCostos, 0);

        pdf.setFillColor(30, 41, 59);
        pdf.rect(15, 136, 180, 10, 'F');

        if (porcCostos > 0) {
            pdf.setFillColor(244, 63, 94);
            pdf.rect(15, 136, 180 * porcCostos, 10, 'F');
        }
        if (porcEbitda > 0) {
            pdf.setFillColor(52, 211, 153);
            pdf.rect(15 + (180 * porcCostos), 136, 180 * porcEbitda, 10, 'F');
        }

        pdf.setFontSize(8);
        pdf.setTextColor(244, 63, 94); pdf.text(`Egresos: ${pct(porcCostos * 100)}`, 15, 150);
        pdf.setTextColor(52, 211, 153); pdf.text(`Margen EBITDA: ${pct(porcEbitda * 100)}`, 145, 150);

        pdf.setFontSize(10);
        pdf.setTextColor(251, 191, 36);
        pdf.text("DESGLOSE DE EGRESOS DE CONTABILIDAD ASOCIADOS (TODAS LAS CUENTAS):", 15, 162);
        
        pdf.setFontSize(9);
        pdf.setTextColor(226, 232, 240);
        let yPos = 170;

        const pucsAsignados = state.gastosContablesBase.filter(g => g.placa === orden.placa_pura);
        if (pucsAsignados.length === 0) {
            pdf.setFont("Helvetica", "italic");
            pdf.text("No se registran gastos externos en el libro diario para esta unidad.", 20, yPos);
            yPos += 8;
        } else {
            pucsAsignados.forEach(g => {
                if (yPos < 200) {
                    pdf.text(`• Subcuenta PUC ${g.puc} - ${g.concepto.substring(0, 40)}:`, 20, yPos);
                    pdf.text(`-${fmt(g.monto)}`, 145, yPos);
                    yPos += 6;
                }
            });
        }

        pdf.setFontSize(10);
        pdf.setTextColor(6, 182, 212);
        pdf.text("REGISTROS DE TRABAJO EN BITÁCORA TÉCNICA COMPLETOS:", 15, 206);

        pdf.setFillColor(15, 23, 42);
        pdf.rect(15, 212, 180, 42, 'F');

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        const lineasTexto = pdf.splitTextToSize(orden.bitacora_ia.toUpperCase(), 170);
        pdf.text(lineasTexto, 20, 220);

        pdf.setDrawColor(30, 41, 59);
        pdf.line(15, 268, 195, 268);
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text("DOCUMENTO DE AUDITORÍA INTERNA EMITIDO BAJO REGISTROS CRYPTO-VAULT TALLERPRO360", 15, 275);

        pdf.save(`FINANZAS_SOCIO_${orden.placa}.pdf`);
    };

    const exportarExcelGlobal = () => {
        if (typeof XLSX === 'undefined') {
            alert("Error: Librería Excel Engine no detectada.");
            return;
        }

        if (state.dataActual.length === 0) {
            alert("No hay registros en el rango seleccionado.");
            return;
        }

        const setPucsUnicos = new Set();
        state.dataActual.forEach(o => {
            const dePlaca = state.mapaDetalleGastosPUC[o.placa_pura] || {};
            Object.keys(dePlaca).forEach(puc => setPucsUnicos.add(puc));
        });
        const arrPucsOrdenados = Array.from(setPucsUnicos).sort();

        const rowsExcel = state.dataActual.map(o => {
            const fila = {
                "PERIODO": o.periodo,
                "PLACA_VEHICULO": o.placa, 
                "CLIENTE": o.cliente, 
                "VENTA_BASE_SIMULADA": o.total / 1.19,
                "IVA_19_SIMULADO": o.ivaCalculado,
                "INGRESO_TOTAL_RECAUDADO": o.total, // Base + IVA completo como ingreso real taller
                "COSTO_DIRECTO_ORDEN": o.costoDirectoOrden,
                "TOTAL_GASTOS_CONEXOS_PUC": o.gastosConexosPUC,
                "TOTAL_EGRESOS_CONSOLIDADO": o.egresosConsolidados,
                "EBITDA_REAL_NETO": o.ebitda, 
                "MARGEN_OPERATIVO": o.margenPorcentaje / 100
            };

            arrPucsOrdenados.forEach(puc => {
                const mapPlaca = state.mapaDetalleGastosPUC[o.placa_pura] || {};
                fila[`PUC_${puc}`] = mapPlaca[puc] || 0;
            });

            return fila;
        });

        const ws = XLSX.utils.json_to_sheet(rowsExcel);
        const rLen = rowsExcel.length;
        const totalIdx = rLen + 2; 

        ws[`C${totalIdx}`] = { v: "CONSOLIDADO OPERACIÓN:", t: 's' };
        ws[`D${totalIdx}`] = { f: `SUM(D2:D${rLen + 1})`, t: 'n' };
        ws[`E${totalIdx}`] = { f: `SUM(E2:E${rLen + 1})`, t: 'n' };
        ws[`F${totalIdx}`] = { f: `SUM(F2:F${rLen + 1})`, t: 'n' };
        ws[`G${totalIdx}`] = { f: `SUM(G2:G${rLen + 1})`, t: 'n' };
        ws[`H${totalIdx}`] = { f: `SUM(H2:H${rLen + 1})`, t: 'n' };
        ws[`I${totalIdx}`] = { f: `SUM(I2:I${rLen + 1})`, t: 'n' };
        
        const formulaEbitdaFinal = `SUM(J2:J${rLen + 1}) - ${state.gastosFijosGlobales} - ${state.nominasInformalesGlobales}`;
        ws[`J${totalIdx}`] = { f: formulaEbitdaFinal, t: 'n' };
        ws[`K${totalIdx}`] = { f: `AVERAGE(K2:K${rLen + 1})`, t: 'n' };

        let startAsciiCode = 12; // Columna L en adelante dinámico
        arrPucsOrdenados.forEach((p, idx) => {
            const letter = getExcelColumnName(startAsciiCode + idx + 1);
            ws[`${letter}${totalIdx}`] = { f: `SUM(${letter}2:${letter}${rLen + 1})`, t: 'n' };
        });

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            ['D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
                const c = ws[col + (R + 1)]; if (c) c.z = '$#,##0';
            });
            arrPucsOrdenados.forEach((p, idx) => {
                const letter = getExcelColumnName(startAsciiCode + idx + 1);
                const cPuc = ws[letter + (R + 1)]; if (cPuc) cPuc.z = '$#,##0';
            });
            const cPct = ws['K' + (R + 1)]; if (cPct) cPct.z = '0.0%';
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MATRIZ_EBITDA");
        XLSX.writeFile(wb, `TallerPRO360_MatrizPUC_${state.periodoSeleccionado}.xlsx`);
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

    const renderCharts = (data) => {
        const ultimas = data.slice(-8);
        const ctxMain = document.getElementById('mainChart');
        if (ctxMain) {
            if (state.charts.main) state.charts.main.destroy();
            state.charts.main = new Chart(ctxMain, {
                type: 'bar',
                data: {
                    labels: ultimas.map(o => o.placa),
                    datasets: [{ data: ultimas.map(o => o.ebitda), backgroundColor: ultimas.map(o => o.ebitda > 0 ? '#06b6d4' : '#f43f5e'), borderRadius: 6 }]
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
                    labels: ['Fijos Admón', 'Nóminas', 'Egresos Flota'],
                    datasets: [{ data: [state.gastosFijosGlobales, state.nominasInformalesGlobales, data.reduce((a, b) => a + b.egresosConsolidados, 0)], backgroundColor: ['#f43f5e', '#fbbf24', '#06b6d4'], borderWidth: 0 }]
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
                    datasets: [{ data: Object.values(conteoAreas), backgroundColor: ['#06b6d4', '#a855f7', '#fbbf24', '#ec4899'], borderWidth: 0 }]
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
        if (btnExport) btnExport.onclick = () => exportarExcelGlobal();
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
