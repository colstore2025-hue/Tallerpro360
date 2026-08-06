/**
 * 🏛️ TALLERPRO360 - REPORTES, FINANZAS & AUDITORÍA FORENSE V24.0 QUANTUM-SAP 🚀
 * PROTOCOLO: ESTABILIZACIÓN OPERATIVA INTERNA / VALIDACIÓN ESTRICTA DE PLACAS & INFORME GERENCIAL EJECUTIVO
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
        if (cleanStr.includes('.') && cleanStr.includes(',')) cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        else if (cleanStr.includes(',') && !cleanStr.includes('.')) cleanStr = cleanStr.replace(',', '.');
        const num = Number(cleanStr);
        return isNaN(num) ? 0 : num;
    };

    const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(safeNumber(v));
    const pct = (v) => `${safeNumber(v).toFixed(1)}%`;

    const extractDate = (obj) => {
        let dateStr = obj.fecha_creacion_manual || obj.fecha_apertura || obj.fecha_ingreso || obj.fecha_gasto || obj.fecha || "";
        let d = new Date();
        if (dateStr) {
            d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                const parts = String(dateStr).substring(0, 10).split('-');
                if (parts.length === 3) d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
        } else if (obj.createdAt) {
            d = obj.createdAt.toDate ? obj.createdAt.toDate() : new Date(obj.createdAt);
        }
        return isNaN(d.getTime()) ? new Date() : d;
    };

    // 🛡️ VALIDADOR ESTRICTO DE PLACAS (Evita que palabras como ADM, NOMINA, GASTO entren como vehículos)
    const esPlacaValida = (texto) => {
        if (!texto) return false;
        const limpio = String(texto).toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        const invalidos = ['ADMIN', 'ADM', 'NOMINA', 'PAGO', 'GASTO', 'SEDE', 'ARRIENDO', 'LUGAR', 'TALLER', 'GENERAL', 'VARIOS', 'CONTADO', 'CREDITO', 'COMISION', 'REPUESTO'];
        if (invalidos.includes(limpio) || limpio.length < 5 || limpio.length > 7) return false;
        
        // Patrón estándar de placas (Ej: ABC123 o ABC124 o similares latinoamericanas)
        const patronPlaca = /^[A-Z]{3}[0-9]{2}[0-9A-Z]$|^[A-Z]{3}[0-9]{3}$/;
        return patronPlaca.test(limpio);
    };

    const aislarPlacaPura = (texto) => {
        if (!texto) return '';
        const limpio = String(texto).toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
        if (esPlacaValida(limpio)) return limpio.substring(0, 6);
        return '';
    };

    let state = {
        rawOrdenes: [],
        rawContabilidad: [],
        centrosBeneficioActivos: [],
        gastosFijosGlobales: 0,
        nominasInformalesGlobales: 0,
        costosRepuestosGlobales: 0,
        comisionesGlobales: 0,
        pucsGlobalesDetectados: new Set(),
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
        await fetchRawData();
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
                        <p class="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase mt-2">MATRIZ DE REPORTES // CONFIABILIDAD CONTABLE POR CENTRO DE COSTOS (ACTIVO)</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button id="btnInformeGerencial" class="bg-purple-600 text-white px-5 py-3.5 rounded-xl text-[11px] font-black hover:bg-purple-500 transition-all flex items-center gap-2.5 shadow-lg">
                            <i class="fas fa-print text-base"></i> IMPRIMIR INFORME GERENCIAL
                        </button>
                        <button id="btnExportGlobal" class="bg-emerald-500 text-slate-950 px-5 py-3.5 rounded-xl text-[11px] font-black hover:bg-emerald-400 transition-all flex items-center gap-2.5 shadow-lg">
                            <i class="fas fa-file-excel text-base"></i> EXPORTAR MATRIZ SAP
                        </button>
                    </div>
                </div>

                <div class="w-full grid grid-cols-1 xl:grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 items-center justify-between mt-4">
                    <div class="flex flex-wrap gap-2 items-center justify-center xl:justify-start xl:col-span-2">
                        <button id="freq-total" class="filter-btn">Todo el Historial</button>
                        <button id="freq-mes" class="filter-btn active">Mes Seleccionado</button>
                        
                        <span class="text-[9px] text-amber-400 font-bold uppercase tracking-wider ml-4 mr-1">Periodo Fiscal:</span>
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
                    <h3 class="text-xs font-black text-amber-400 uppercase tracking-widest mb-4"><i class="fas fa-chart-pie mr-2"></i>Distribución de Costos Totales</h3>
                    <div class="h-56 w-full"><canvas id="pieChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <h3 class="text-xs font-black text-purple-400 uppercase tracking-widest mb-4"><i class="fas fa-industry mr-2"></i>Ingresos por Tipo Servicio</h3>
                    <div class="h-56 w-full"><canvas id="lineaChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0b0f17] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-12">
                <div class="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/20">
                    <div>
                        <h3 class="text-xs font-black text-white uppercase tracking-widest">Estructura Operativa Directa Consolidada por Flota</h3>
                        <p class="text-[9px] text-slate-500 mt-1">Clic en la placa para expandir matriz de órdenes y PUCs validados</p>
                    </div>
                    <span id="counterTag" class="text-[9px] bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-md font-black border border-cyan-500/20 uppercase tracking-wider">Procesando...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-950/60 text-slate-400 text-[9px] uppercase font-black tracking-wider border-b border-white/5">
                            <tr>
                                <th class="p-6">Centro de Costo (Vehículo)</th>
                                <th class="p-6">Volumen Ops.</th>
                                <th class="p-6">Ingreso Recaudado (Total)</th>
                                <th class="p-6">Egresos (Directo + PUCs)</th>
                                <th class="p-6 text-right">EBITDA Periodo</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-xs divide-y divide-white/[0.02]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
    };

    const fetchRawData = async () => {
        try {
            const snapOrders = await getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId)));
            const snapAcc = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));

            const periodosSet = new Set();

            state.rawOrdenes = snapOrders.docs.map(doc => {
                const d = doc.data();
                const fecha = extractDate(d);
                const p = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                periodosSet.add(p);
                return { id: doc.id, ...d, _fechaObj: fecha, _periodo: p };
            });

            state.rawContabilidad = snapAcc.docs.map(doc => {
                const d = doc.data();
                const fecha = extractDate(d);
                return { id: doc.id, ...d, _fechaObj: fecha };
            });

            state.periodosDisponibles = Array.from(periodosSet).sort().reverse();
            poblarSelectorPeriodos();
            procesarMotorAnalitico();

        } catch (e) { console.error("Error SAP Engine:", e); }
    };

    const poblarSelectorPeriodos = () => {
        const select = document.getElementById("selPeriodoFiscal");
        if (!select) return;
        let html = `<option value="TODOS">Todos los periodos</option>`;
        state.periodosDisponibles.forEach(p => html += `<option value="${p}">${p}</option>`);
        select.innerHTML = html;
        if (state.periodoSeleccionado === "TODOS" && state.periodosDisponibles.length > 0) state.periodoSeleccionado = state.periodosDisponibles[0];
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

    // 🧠 MOTOR CUÁNTICO REFORZADO: FILTRADO LIMPIO DE PLACAS Y CONTABILIDAD
    const procesarMotorAnalitico = () => {
        let tsInicio = state.filtroFrecuencia !== "total" && state.fechaInicioFiltro ? state.fechaInicioFiltro.getTime() : 0;
        let tsFin = state.filtroFrecuencia !== "total" && state.fechaFinFiltro ? state.fechaFinFiltro.getTime() : Infinity;

        const ordsFiltradas = state.rawOrdenes.filter(o => o._fechaObj.getTime() >= tsInicio && o._fechaObj.getTime() <= tsFin);
        const contFiltrada = state.rawContabilidad.filter(c => c._fechaObj.getTime() >= tsInicio && c._fechaObj.getTime() <= tsFin);

        const mapaVehiculos = {};
        state.gastosFijosGlobales = 0;
        state.nominasInformalesGlobales = 0;
        state.costosRepuestosGlobales = 0;
        state.comisionesGlobales = 0;
        state.pucsGlobalesDetectados.clear();

        // 1. Procesamiento Contable con Filtrado Estricto
        contFiltrada.forEach(data => {
            const monto = safeNumber(data.monto || data.total || data.valor || data.pago_mecanico || data.salario);
            const tipo = (data.tipo || "").toLowerCase();
            const detalle = (data.detalle || data.concepto || "").toUpperCase();
            const cuentaPUC = String(data.puc || data.codigo || data.cuenta || "5195");
            const esGasto = !(tipo.includes("ingreso") || cuentaPUC.startsWith("4") || tipo.includes("4135") || cuentaPUC.startsWith("11"));
            
            if (esGasto && monto > 0) {
                let placaRaw = (data.placa || "").toUpperCase().trim();
                let placaClave = aislarPlacaPura(placaRaw);

                // Si no hay placa válida en el registro contable, buscamos dentro del texto del detalle de manera estricta
                if (!placaClave) {
                    const palabras = detalle.replace(/[()]/g, ' ').split(/[\s-]+/);
                    for (const palabra of palabras) {
                        if (esPlacaValida(palabra)) { placaClave = aislarPlacaPura(palabra); placaRaw = palabra; break; }
                    }
                }

                if (cuentaPUC.startsWith("5105") || cuentaPUC.startsWith("7205") || detalle.includes("NOMINA") || detalle.includes("PAGO MECANICO")) {
                    state.nominasInformalesGlobales += monto;
                    state.comisionesGlobales += monto;
                } else if (cuentaPUC.startsWith("5135") || cuentaPUC.startsWith("5140") || detalle.includes("REPUESTO") || detalle.includes("INSUMO")) {
                    state.costosRepuestosGlobales += monto;
                } else if (placaClave) {
                    if (!mapaVehiculos[placaClave]) mapaVehiculos[placaClave] = iniciarCentroCosto(placaClave, placaRaw);
                    
                    if (!mapaVehiculos[placaClave].pucsAgrupados[cuentaPUC]) mapaVehiculos[placaClave].pucsAgrupados[cuentaPUC] = 0;
                    mapaVehiculos[placaClave].pucsAgrupados[cuentaPUC] += monto;
                    mapaVehiculos[placaClave].totalGastosPUC += monto;
                    
                    mapaVehiculos[placaClave].detallesContables.push({ puc: cuentaPUC, detalle, monto });
                    state.pucsGlobalesDetectados.add(cuentaPUC);
                } else {
                    // Si no pertenece a ningún vehículo válido, va a gastos generales de sede
                    state.gastosFijosGlobales += monto;
                }
            }
        });

        // 2. Procesamiento de Órdenes de Trabajo y Costos Directos
        ordsFiltradas.forEach(o => {
            let placaRaw = (o.placa || 'S/N').toUpperCase().trim();
            let placaClave = aislarPlacaPura(placaRaw);

            if (!placaClave) return; // Omitir órdenes sin placa vehicular válida
            
            if (!mapaVehiculos[placaClave]) mapaVehiculos[placaClave] = iniciarCentroCosto(placaClave, placaRaw);
            
            const facturacionTotal = safeNumber(o.total || o.costos_totales?.total || 0);
            const costoDirecto = safeNumber(o.costos_totales?.costo_directo || o.costo_directo || 0);

            mapaVehiculos[placaClave].cliente = o.cliente || mapaVehiculos[placaClave].cliente;
            mapaVehiculos[placaClave].vehiculoModelo = o.vehiculo || o.modelo || mapaVehiculos[placaClave].vehiculoModelo;
            mapaVehiculos[placaClave].totalIngresoBase += facturacionTotal;
            mapaVehiculos[placaClave].totalCostoDirecto += costoDirecto;
            state.costosRepuestosGlobales += costoDirecto;

            mapaVehiculos[placaClave].ordenesAsociadas.push({
                id: o.id, area: o.tipo_orden || 'MECÁNICA', total: facturacionTotal, costo: costoDirecto,
                bitacora: o.bitacora_ia || o.diagnostico || o.observaciones || "SIN BITÁCORA"
            });
        });

        // 3. Consolidación Final
        const listaFinal = Object.values(mapaVehiculos).map(v => {
            v.egresosConsolidados = v.totalCostoDirecto + v.totalGastosPUC;
            v.ebitdaFinal = v.totalIngresoBase - v.egresosConsolidados;
            v.margen = v.totalIngresoBase > 0 ? (v.ebitdaFinal / v.totalIngresoBase) * 100 : 0;
            return v;
        }).sort((a, b) => b.ebitdaFinal - a.ebitdaFinal);

        state.centrosBeneficioActivos = listaFinal;

        const totalIngresoCompania = listaFinal.reduce((a, b) => a + b.totalIngresoBase, 0);
        const ebitdaNetoCompania = listaFinal.reduce((a, b) => a + b.ebitdaFinal, 0) - state.gastosFijosGlobales - state.nominasInformalesGlobales;

        renderKPIs({
            ebitdaNeto: ebitdaNetoCompania,
            ticket: totalIngresoCompania / (ordsFiltradas.length || 1),
            margenGeneral: totalIngresoCompania > 0 ? (ebitdaNetoCompania / totalIngresoCompania) * 100 : 0,
            volumenOps: ordsFiltradas.length,
            volumenVehiculos: listaFinal.length
        });

        renderCharts(listaFinal);
        renderTable(listaFinal);
        document.getElementById("counterTag").innerText = `${listaFinal.length} VEHÍCULOS PROCESADOS EN ${state.periodoSeleccionado}`;
    };

    const iniciarCentroCosto = (placaPura, placaVisual) => ({
        placaPura, placaVisual, cliente: 'CLIENTE GENERAL', vehiculoModelo: 'VEHÍCULO TALLER',
        totalIngresoBase: 0, totalCostoDirecto: 0, totalGastosPUC: 0,
        pucsAgrupados: {}, detallesContables: [], ordenesAsociadas: [],
        egresosConsolidados: 0, ebitdaFinal: 0, margen: 0
    });

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA COMPAÑÍA", fmt(m.ebitdaNeto), "fa-wallet", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "UTILIDAD NETA PERIODO")}
            ${kpiCard("TICKET PROMEDIO", fmt(m.ticket), "fa-calculator", "text-cyan-400", "RECAUDO POR ORDEN")}
            ${kpiCard("MARGEN OPERATIVO", pct(m.margenGeneral), "fa-percent", "text-purple-400", "RENTABILIDAD REAL")}
            ${kpiCard("ACTIVOS ATENDIDOS", `${m.volumenVehiculos} UNIDADES`, "fa-car", "text-amber-400", `VÍA ${m.volumenOps} ÓRDENES`)}
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
            body.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-slate-500 text-[11px] uppercase tracking-widest">Sin movimientos contables u operativos detectados en este periodo.</td></tr>`; return;
        }

        body.innerHTML = data.map(v => `
            <tr class="hover:bg-cyan-500/[0.02] transition-colors cursor-pointer" onclick="window.toggleDrillDownPlaca('${v.placaPura}')">
                <td class="p-5">
                    <p class="font-black text-white text-sm tracking-tight"><i class="fas fa-chevron-right text-[10px] text-cyan-500 mr-2"></i>${v.placaVisual}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${v.cliente.substring(0, 30)}</p>
                </td>
                <td class="p-5">
                    <span class="px-3 py-1 rounded-md text-[9px] font-black bg-slate-900 border border-white/5 text-amber-400">${v.ordenesAsociadas.length} ORD(S)</span>
                </td>
                <td class="p-5">
                    <p class="text-emerald-400 font-bold text-xs">${fmt(v.totalIngresoBase)}</p>
                </td>
                <td class="p-5">
                    <p class="text-red-400 font-bold text-xs">${fmt(v.egresosConsolidados)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Dir: ${fmt(v.totalCostoDirecto)} | PUC: ${fmt(v.totalGastosPUC)}</p>
                </td>
                <td class="p-5 text-right">
                    <p class="font-black text-sm ${v.ebitdaFinal > 0 ? 'text-emerald-400' : 'text-red-500'}">${fmt(v.ebitdaFinal)}</p>
                    <p class="text-[8px] font-bold text-slate-500">${pct(v.margen)} MG</p>
                </td>
            </tr>
            <tr id="drilldown-${v.placaPura}" class="hidden bg-[#040712] drilldown-container">
                <td colspan="5" class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                        <div class="bg-black/30 p-5 rounded-xl border border-white/5">
                             <div class="flex justify-between items-center mb-4">
                                <h4 class="orbitron font-black text-cyan-400 text-[10px] uppercase tracking-wider">Historial Operativo (Periodo)</h4>
                                <button onclick="window.exportarPdfPlaca('${v.placaPura}', event)" class="bg-red-600 text-white font-black px-4 py-2 rounded-lg text-[9px] uppercase tracking-wider shadow-lg hover:bg-red-500 flex items-center gap-2">
                                    <i class="fas fa-file-pdf"></i> GENERAR PDF ACTIVO
                                </button>
                            </div>
                            ${v.ordenesAsociadas.map(o => `
                                <div class="mb-3 pb-3 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                                    <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span class="font-bold text-amber-400">ORDEN: ${o.id.substring(0,6).toUpperCase()} (${o.area})</span>
                                        <span>Ing: <span class="text-emerald-400">${fmt(o.total)}</span> | Costo: <span class="text-red-400">${fmt(o.costo)}</span></span>
                                    </div>
                                    <p class="text-[10px] font-mono text-slate-500 bg-black/40 p-2 rounded whitespace-pre-line">${o.bitacora}</p>
                                </div>
                            `).join("")}
                        </div>
                        <div class="bg-black/30 p-5 rounded-xl border border-white/5">
                            <h4 class="orbitron font-black text-amber-400 text-[10px] uppercase tracking-wider mb-4">Integración Contable PUC del Periodo</h4>
                            <div class="space-y-1 text-[11px] font-bold">
                                <div class="flex justify-between text-emerald-400 border-b border-white/5 pb-1.5 font-black"><span>4135 - TOTAL INGRESOS FACTURADOS</span><span>${fmt(v.totalIngresoBase)}</span></div>
                                <div class="flex justify-between text-amber-400 border-b border-white/5 py-1"><span>COSTOS_DIRECTOS - TALLER (SUMA)</span><span>-${fmt(v.totalCostoDirecto)}</span></div>
                                ${Object.entries(v.pucsAgrupados).map(([puc, val]) => `<div class="flex justify-between text-red-400 border-b border-white/5 py-1 font-mono"><span>PUC ${puc} - DIARIO CONSOLIDADO</span><span>-${fmt(val)}</span></div>`).join("")}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");
    };

    window.toggleDrillDownPlaca = (placaPura) => {
        const fila = document.getElementById(`drilldown-${placaPura}`);
        if (fila) fila.classList.toggle("hidden");
    };

    // 📄 GENERACIÓN DE INFORME GERENCIAL MENSUAL (PDF EJECUTIVO IDÉNTICO AL EJEMPLO)
    const exportarInformeGerencialPDF = () => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const totalIngresos = state.centrosBeneficioActivos.reduce((a,b) => a + b.totalIngresoBase, 0);
        const totalCostosRep = state.costosRepuestosGlobales;
        const totalComisiones = state.comisionesGlobales;
        const totalGastosSede = state.gastosFijosGlobales;
        const utilidadNeta = totalIngresos - totalCostosRep - totalComisiones - totalGastosSede;
        const margenOperativo = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

        // Encabezado Corporativo
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(14); pdf.setTextColor(15, 23, 42);
        pdf.text("TALLERPRO360 // INFORME GERENCIAL MENSUAL", 15, 18);
        
        pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
        pdf.text(`NIT: 901.882.391-4 | Tel: +57 310 764 5306 | Periodo Requerido: ${state.periodoSeleccionado}`, 15, 23);
        pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 15, 27);
        
        pdf.setDrawColor(203, 213, 225); pdf.line(15, 30, 195, 30);

        let y = 36;

        // 1. ESTADO DE RESULTADOS GERENCIAL
        pdf.setFillColor(241, 245, 249); pdf.rect(15, y, 180, 7, 'F');
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
        pdf.text("1. ESTADO DE RESULTADOS GERENCIAL - CONSOLIDADO DEL PERIODO", 18, y + 4.5);
        y += 11;

        const filasER = [
            ["(+) Ingresos Brutos Facturados a Clientes", fmt(totalIngresos)],
            ["(+) Ingreso Neto Taller (Antes de Impuestos)", fmt(totalIngresos)],
            ["(-) Costo Directo Repuestos e Insumos en Bodega", `-${fmt(totalCostosRep)}`],
            ["(-) Comisiones y Mano de Obra para Mecánicos", `-${fmt(totalComisiones)}`],
            ["(-) Gastos Operativos de la Sede (Arriendo, Servicios, Nómina Fija)", `-${fmt(totalGastosSede)}`],
            ["(=) UTILIDAD NETA REAL GANADA POR EL TALLER EN EL PERIODO", fmt(utilidadNeta)]
        ];

        filasER.forEach((fila, idx) => {
            if (idx === filasER.length - 1) {
                pdf.setFillColor(236, 253, 245); pdf.rect(15, y - 1, 180, 6, 'F');
                pdf.setFont("Helvetica", "bold"); pdf.setTextColor(16, 185, 129);
            } else {
                pdf.setFont("Helvetica", "normal"); pdf.setTextColor(51, 65, 85);
            }
            pdf.text(fila[0], 18, y + 3);
            pdf.text(fila[1], 150, y + 3);
            y += 6;
        });

        y += 4;
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
        pdf.text(`MARGEN OPERATIVO REAL DE RENTABILIDAD DEL PERIODO: ${margenOperativo.toFixed(1)}% Promedio Libre`, 18, y);
        y += 8;

        // 2. DETALLE DE RENTABILIDAD POR PLACA Y VEHÍCULO ATENDIDO
        pdf.setFillColor(241, 245, 249); pdf.rect(15, y, 180, 7, 'F');
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
        pdf.text(`2. DETALLE DE RENTABILIDAD POR PLACA Y VEHÍCULO ATENDIDO (${state.centrosBeneficioActivos.length} ÓRDENES)`, 18, y + 4.5);
        y += 11;

        // Cabecera Tabla Placas
        pdf.setFillColor(15, 23, 42); pdf.rect(15, y, 180, 6, 'F');
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(255, 255, 255);
        pdf.text("PLACA", 18, y + 4);
        pdf.text("VEHÍCULO / MODELO", 42, y + 4);
        pdf.text("PROPIETARIO", 90, y + 4);
        pdf.text("FACTURADO", 125, y + 4);
        pdf.text("COSTO", 150, y + 4);
        pdf.text("MARGEN", 175, y + 4);
        y += 6;

        pdf.setFont("Helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(51, 65, 85);
        state.centrosBeneficioActivos.forEach((v) => {
            if (y > 270) { pdf.addPage(); y = 20; }
            pdf.text(v.placaVisual, 18, y + 4);
            pdf.text(String(v.vehiculoModelo || 'GENERAL').substring(0, 22), 42, y + 4);
            pdf.text(String(v.cliente || 'CLIENTE').substring(0, 18), 90, y + 4);
            pdf.text(fmt(v.totalIngresoBase), 125, y + 4);
            pdf.text(fmt(v.egresosConsolidados), 150, y + 4);
            pdf.text(`${v.margen.toFixed(0)}%`, 175, y + 4);
            pdf.setDrawColor(241, 245, 249); pdf.line(15, y + 6, 195, y + 6);
            y += 7;
        });

        // 3. DESGLOSE DE GASTOS OPERATIVOS DE LA SEDE
        y += 4;
        if (y > 250) { pdf.addPage(); y = 20; }
        pdf.setFillColor(241, 245, 249); pdf.rect(15, y, 180, 7, 'F');
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
        pdf.text("3. DESGLOSE DE GASTOS OPERATIVOS DE LA SEDE", 18, y + 4.5);
        y += 11;

        pdf.setFillColor(15, 23, 42); pdf.rect(15, y, 180, 6, 'F');
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(255, 255, 255);
        pdf.text("FECHA", 18, y + 4);
        pdf.text("CATEGORÍA", 45, y + 4);
        pdf.text("CONCEPTO / DESCRIPCIÓN", 90, y + 4);
        pdf.text("MONTO COP", 160, y + 4);
        y += 6;

        pdf.setFont("Helvetica", "normal"); pdf.setFontSize(7); pdf.setTextColor(51, 65, 85);
        pdf.text(new Date().toISOString().split('T')[0], 18, y + 4);
        pdf.text("Gastos Generales / Sede", 45, y + 4);
        pdf.text("Consolidado Arriendo, Servicios y Operación", 90, y + 4);
        pdf.text(fmt(totalGastosSede), 160, y + 4);
        y += 12;

        // Firma Auditoría
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setDrawColor(203, 213, 225); pdf.line(15, y, 75, y);
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(15, 23, 42);
        pdf.text("FIRMA AUDITORÍA GERENCIAL", 15, y + 4);
        pdf.setFont("Helvetica", "normal"); pdf.setTextColor(100, 116, 139);
        pdf.text("Director Operativo - TallerPRO360 SAP Engine", 15, y + 8);

        pdf.save(`Informe_Gerencial_${state.periodoSeleccionado}.pdf`);
    };

    window.exportarPdfPlaca = (placaPura, event) => {
        event.stopPropagation();
        const v = state.centrosBeneficioActivos.find(c => c.placaPura === placaPura);
        if (!v) return;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFillColor(11, 15, 23); pdf.rect(0, 0, 210, 297, 'F');
        
        pdf.setFont("Helvetica", "bold"); pdf.setFontSize(16); pdf.setTextColor(6, 182, 212); 
        pdf.text("TALLERPRO360 // REPORTE FORENSE DE ACTIVO", 15, 25);
        
        pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
        pdf.text(`PERIODO EVALUADO: ${state.periodoSeleccionado}`, 15, 31);
        
        pdf.setDrawColor(30, 41, 59); pdf.line(15, 35, 195, 35);
        
        pdf.setFontSize(10); pdf.setTextColor(255, 255, 255);
        pdf.text(`PLACA UNIDAD:`, 15, 45); pdf.setFont("Helvetica", "normal"); pdf.text(`${v.placaVisual}`, 55, 45);
        pdf.setFont("Helvetica", "bold"); pdf.text(`CLIENTE ASOCIADO:`, 15, 51); pdf.setFont("Helvetica", "normal"); pdf.text(`${v.cliente}`, 55, 51);
        pdf.setFont("Helvetica", "bold"); pdf.text(`VOLUMEN ÓRDENES:`, 15, 57); pdf.setFont("Helvetica", "normal"); pdf.text(`${v.ordenesAsociadas.length}`, 55, 57);

        pdf.setFillColor(15, 23, 42); pdf.rect(15, 65, 180, 46, 'F');
        pdf.setFont("Helvetica", "bold"); pdf.setTextColor(148, 163, 184);
        pdf.text("ESTRUCTURA INTEGRAL CONSOLIDADA", 20, 73); pdf.text("VALOR TOTAL", 145, 73);
        pdf.line(15, 77, 195, 77);

        pdf.setFont("Helvetica", "normal"); pdf.setTextColor(255, 255, 255);
        pdf.text("Suma Ingresos Totales Recaudados:", 20, 83); pdf.text(`${fmt(v.totalIngresoBase)}`, 145, 83);
        pdf.setTextColor(244, 63, 94);
        pdf.text("(-) Suma Costos Directos Internos:", 20, 90); pdf.text(`-${fmt(v.totalCostoDirecto)}`, 145, 90);
        pdf.text("(-) Suma Gastos Conexos Contabilidad (PUC):", 20, 97); pdf.text(`-${fmt(v.totalGastosPUC)}`, 145, 97);

        pdf.line(15, 101, 195, 101);
        pdf.setFont("Helvetica", "bold"); pdf.setTextColor(52, 211, 153); 
        pdf.text("EBITDA PERIODO DEL ACTIVO:", 20, 107); pdf.text(`${fmt(v.ebitdaFinal)}`, 145, 107);

        let yPos = 125;
        pdf.setFontSize(10); pdf.setTextColor(251, 191, 36);
        pdf.text("DESGLOSE AUDITORÍA PUC:", 15, yPos); yPos += 8;
        
        pdf.setFontSize(9); pdf.setTextColor(226, 232, 240);
        if (v.detallesContables.length === 0) {
            pdf.setFont("Helvetica", "italic"); pdf.text("Sin registros contables externos en este periodo.", 20, yPos);
        } else {
            v.detallesContables.forEach(g => {
                if (yPos < 280) {
                    pdf.text(`• PUC ${g.puc} - ${g.detalle.substring(0, 45)}:`, 20, yPos); pdf.text(`-${fmt(g.monto)}`, 145, yPos); yPos += 6;
                }
            });
        }

        pdf.save(`Finanzas_Activo_${v.placaPura}_${state.periodoSeleccionado}.pdf`);
    };

    const exportarExcelGlobal = () => {
        if (typeof XLSX === 'undefined') { alert("Error: Librería Excel Engine no detectada."); return; }
        if (state.centrosBeneficioActivos.length === 0) { alert("No hay datos calculados en este rango."); return; }

        const arrPucsOrdenados = Array.from(state.pucsGlobalesDetectados).sort();

        const rowsExcel = state.centrosBeneficioActivos.map(v => {
            const fila = {
                "PERIODO_EVALUADO": state.periodoSeleccionado,
                "CENTRO_COSTO_PLACA": v.placaVisual,
                "CANT_ORDENES": v.ordenesAsociadas.length,
                "CLIENTE": v.cliente, 
                "INGRESO_TOTAL_RECAUDADO": v.totalIngresoBase,
                "SUMA_COSTOS_DIRECTOS": v.totalCostoDirecto,
                "TOTAL_GASTOS_PUC": v.totalGastosPUC,
                "EGRESOS_CONSOLIDADOS": v.egresosConsolidados,
                "EBITDA_REAL_NETO": v.ebitdaFinal,
                "MARGEN_OPERATIVO": v.margen / 100
            };
            arrPucsOrdenados.forEach(puc => { fila[`PUC_${puc}`] = v.pucsAgrupados[puc] || 0; });
            return fila;
        });

        const ws = XLSX.utils.json_to_sheet(rowsExcel);
        const rLen = rowsExcel.length;
        const totalIdx = rLen + 2; 

        ws[`D${totalIdx}`] = { v: "CONSOLIDADO GLOBAL:", t: 's' };
        ws[`E${totalIdx}`] = { f: `SUM(E2:E${rLen + 1})`, t: 'n' };
        ws[`F${totalIdx}`] = { f: `SUM(F2:F${rLen + 1})`, t: 'n' };
        ws[`G${totalIdx}`] = { f: `SUM(G2:G${rLen + 1})`, t: 'n' };
        ws[`H${totalIdx}`] = { f: `SUM(H2:H${rLen + 1})`, t: 'n' };
        ws[`I${totalIdx}`] = { f: `SUM(I2:I${rLen + 1}) - ${state.gastosFijosGlobales} - ${state.nominasInformalesGlobales}`, t: 'n' };
        ws[`J${totalIdx}`] = { f: `AVERAGE(J2:J${rLen + 1})`, t: 'n' };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "MATRIZ_SAP");
        XLSX.writeFile(wb, `TallerPRO360_MatrizSAP_${state.periodoSeleccionado}.xlsx`);
    };

    const renderCharts = (data) => {
        const topRentables = [...data].sort((a,b) => b.ebitdaFinal - a.ebitdaFinal).slice(0, 10);
        if (state.charts.main) state.charts.main.destroy();
        state.charts.main = new Chart(document.getElementById('mainChart'), {
            type: 'bar',
            data: {
                labels: topRentables.map(v => v.placaPura),
                datasets: [{ data: topRentables.map(v => v.ebitdaFinal), backgroundColor: topRentables.map(v => v.ebitdaFinal > 0 ? '#06b6d4' : '#f43f5e'), borderRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        if (state.charts.pie) state.charts.pie.destroy();
        state.charts.pie = new Chart(document.getElementById('pieChart'), {
            type: 'doughnut',
            data: {
                labels: ['Fijos Admón', 'Nóminas', 'Costo Directo Taller', 'Gastos PUC Vehículos'],
                datasets: [{ 
                    data: [state.gastosFijosGlobales, state.nominasInformalesGlobales, data.reduce((a,b)=>a+b.totalCostoDirecto,0), data.reduce((a,b)=>a+b.totalGastosPUC,0)], 
                    backgroundColor: ['#f43f5e', '#fbbf24', '#06b6d4', '#a855f7'], borderWidth: 0 
                }]
            },
            options: { cutout: '70%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        if (state.charts.linea) state.charts.linea.destroy();
        const ingresosPorArea = {};
        data.forEach(v => v.ordenesAsociadas.forEach(o => { ingresosPorArea[o.area] = (ingresosPorArea[o.area] || 0) + o.total; }));
        
        state.charts.linea = new Chart(document.getElementById('lineaChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(ingresosPorArea),
                datasets: [{ data: Object.values(ingresosPorArea), backgroundColor: ['#06b6d4', '#a855f7', '#fbbf24', '#ec4899'], borderWidth: 0 }]
            },
            options: { cutout: '70%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    };

    const setupEventListeners = () => {
        const attach = (id, event, handler) => { const el = document.getElementById(id); if (el) el.addEventListener(event, handler); };
        
        attach("freq-total", "click", (e) => {
            document.getElementById("freq-mes").classList.remove("active"); e.target.classList.add("active");
            state.filtroFrecuencia = "total"; procesarMotorAnalitico();
        });
        
        attach("freq-mes", "click", (e) => {
            document.getElementById("freq-total").classList.remove("active"); e.target.classList.add("active");
            state.filtroFrecuencia = "mes"; ajustarFechasPorPeriodoMes(); procesarMotorAnalitico();
        });

        attach("selPeriodoFiscal", "change", (e) => {
            state.periodoSeleccionado = e.target.value;
            if(state.periodoSeleccionado !== "TODOS") { state.filtroFrecuencia = "mes"; document.getElementById("freq-mes").classList.add("active"); document.getElementById("freq-total").classList.remove("active"); }
            ajustarFechasPorPeriodoMes(); procesarMotorAnalitico();
        });

        const updateDates = () => {
            const i = document.getElementById("datePickerInicio").value; const f = document.getElementById("datePickerFin").value;
            if(i && f) { state.fechaInicioFiltro = new Date(i + "T00:00:00"); state.fechaFinFiltro = new Date(f + "T23:59:59"); state.filtroFrecuencia = "rango"; document.getElementById("freq-total").classList.remove("active"); document.getElementById("freq-mes").classList.remove("active"); procesarMotorAnalitico(); }
        };

        attach("datePickerInicio", "change", updateDates);
        attach("datePickerFin", "change", updateDates);
        attach("btnExportGlobal", "click", exportarExcelGlobal);
        attach("btnInformeGerencial", "click", exportarInformeGerencialPDF);
    };

    const loadDependencies = async () => {
        const libs = ["https://cdn.jsdelivr.net/npm/chart.js", "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"];
        for (const lib of libs) {
            if (!document.querySelector(`script[src="${lib}"]`)) {
                await new Promise(r => { const s = document.createElement("script"); s.src = lib; s.onload = r; document.head.appendChild(s); });
            }
        }
    };

    await init();
}
