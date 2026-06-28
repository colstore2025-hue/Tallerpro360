/**
 * 🏛️ TALLERPRO360 - REPORTES & FINANZAS ELITE V17.5 🚀
 * PROTOCOLO: QUANTUM-SAP / MATRIZ FORENSE DE CONTROL COMPAÑÍA
 * Desarrollado por: William Jeffry Urquijo Cubillos & Gemini AI (2026)
 * CONFIGURACIÓN: Absorción total de egresos por Placa a Costo Directo con Drill-Down PUC.
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

    // El factor IVA cambia elásticamente según la configuración del nodo en config.js
    const APLICA_IVA = (regimenTaller === "RESPONSABLE_IVA");
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
        gastosContablesBase: [],
        gastosFijosGlobales: 0, 
        nominasInformalesGlobales: 0,
        mapaGastosPorPlaca: {},
        dataActual: [],
        charts: {},
        filtroFrecuencia: "mes", 
        fechaReferencia: new Date(),
        rangoCierre: { inicio: null, fin: null },
        periodoSeleccionado: "TODOS",
        periodosDisponibles: []
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
            .drilldown-container { background: #05080f; border-left: 4px solid #06b6d4; animation: fadeIn 0.4s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    };

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
                const diferencia = ref.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
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
                        <h1 class="text-4xl font-black tracking-tight text-white uppercase">TallerPRO360<span class="text-cyan-400">_ReportesMatriz</span></h1>
                        <p class="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase mt-2">QUANTUM-SAP CONTROL CENTER // RÉGIMEN CONFIGURADO: ${regimenTaller.replace(/_/g, ' ')}</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-xl text-[11px] font-black hover:bg-emerald-400 transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-500/10">
                        <i class="fas fa-file-excel text-base"></i> EXPORTAR CONTROL FINANCIERO INTEGRAL
                    </button>
                </div>

                <div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 items-center justify-between mt-4">
                    <div class="flex flex-wrap gap-2 items-center justify-center lg:justify-start lg:col-span-2">
                        <span class="text-[9px] text-cyan-400 font-bold uppercase tracking-wider mr-2">Frecuencia:</span>
                        <button id="freq-total" class="filter-btn">Histórico</button>
                        <button id="freq-semana" class="filter-btn">Semanal</button>
                        <button id="freq-mes" class="filter-btn active">Mensual</button>
                        <button id="freq-trimestre" class="filter-btn">Trimestral</button>
                        <button id="freq-anio" class="filter-btn">Anual</button>
                        
                        <span class="text-[9px] text-amber-400 font-bold uppercase tracking-wider ml-4 mr-2">Mes Fiscal:</span>
                        <select id="selPeriodoFiscal" class="sap-input font-bold py-1 px-3"></select>
                    </div>
                    <div class="flex items-center gap-3 justify-end">
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
                        <p class="text-[9px] text-slate-500 mt-1">Cruce Maestro del Costo Directo de Contabilidad asignado a la Placa (Presiona sobre una fila para auditar cuentas)</p>
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
                                <th class="p-6 text-center">Lead Time (Duración)</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body" class="text-xs divide-y divide-white/[0.02]"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
        
        document.getElementById("datePicker").value = state.fechaReferencia.toISOString().split('T')[0];
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
                const cuentaPUC = String(data.puc || data.codigo || data.cuenta || "");

                const esGasto = !(tipo.includes("ingreso") || cuentaPUC.startsWith("4") || tipo.includes("4135") || tipo.includes("saneamiento") || cuentaPUC.startsWith("11") || tipo.includes("capital") || tipo.includes("2805"));
                
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

                    const registroGastoObj = {
                        puc: cuentaPUC,
                        concepto: detalle,
                        monto: monto,
                        placa: placaClaveGasto
                    };
                    listaGastosBase.push(registroGastoObj);

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
                
                // 📊 CONDICIÓN TRIBUTARIA ELÁSTICA: Absorción o discriminación de IVA
                let ingresosNetos = facturacionBruta;
                let ivaRetenido = 0;

                if (APLICA_IVA) {
                    ingresosNetos = facturacionBruta / (1 + IVA_FACTOR);
                    ivaRetenido = facturacionBruta - ingresosNetos;
                }
                
                const costosInternosOrden = safeNumber(o.costos_totales?.costo_directo || o.costo_directo || o.costoDirecto || 0);
                const gastosContablesAsignados = (mapaGastosPorPlaca[placaFinancieraClave] || 0) + costosInternosOrden;
                
                // Si no aplica IVA, la ganancia incluye el valor completo bruto facturado
                const ebitdaRealPlaca = facturacionBruta - ivaRetenido - gastosContablesAsignados;
                const margenEbitdaPrc = ingresosNetos > 0 ? (ebitdaRealPlaca / ingresosNetos) * 100 : 0;
                
                // ⏳ REFORMA COMPLETA DEL LEAD TIME (DURACIÓN DESDE INGRESO HASTA LISTO / ENTREGADO)
                const fechaInicio = o.createdAt?.toDate ? o.createdAt.toDate() : (o.fecha_ingreso ? new Date(o.fecha_ingreso) : new Date());
                
                // Identificar el cierre real buscando prioridad en hitos de estados
                let fechaFin = o.fecha_entrega || o.fechas?.entrega || o.closedAt || o.fecha_cierre || null;
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

                // Captura del periodo de creación (AAAA-MM)
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
                    cliente: o.cliente || 'CLIENTE TALLERPRO360',
                    fecha: fechaInicio,
                    periodo: periodoClave,
                    bitacora_ia: o.bitacora_ia || "INGRESO REGISTRADO SIN HISTORIAL TÉCNICO"
                };
            });

            state.periodosDisponibles = Array.from(periodosSet).sort().reverse();
            poblarSelectorPeriodos();
            filtrarYProcesarDatos();

        } catch (e) {
            console.error("🚀 QUANTUM_FAULT -> Colapso contable mapeado:", e);
        }
    };

    const poblarSelectorPeriodos = () => {
        const select = document.getElementById("selPeriodoFiscal");
        if (!select) return;
        
        let html = `<option value="TODOS">Ver Todos los Periodos</option>`;
        state.periodosDisponibles.forEach(p => {
            html += `<option value="${p}">${p}</option>`;
        });
        select.innerHTML = html;
        select.value = state.periodoSeleccionado;
    };

    const filtrarYProcesarDatos = () => {
        let filtradas = [...state.ordenesMaster];

        // Filtro por selector de Periodos Mensuales
        if (state.periodoSeleccionado !== "TODOS") {
            filtradas = filtradas.filter(o => o.period === state.periodoSeleccionado || o.periodo === state.periodoSeleccionado);
        }

        // Filtro por Frecuencia de Botonera Temporal
        if (state.filtroFrecuencia !== "total" && state.rangoCierre.inicio && state.rangoCierre.fin) {
            filtradas = filtradas.filter(o => {
                const tiempoOrden = o.fecha.getTime();
                return tiempoOrden >= state.rangoCierre.inicio.getTime() && tiempoOrden <= state.rangoCierre.fin.getTime();
            });
        }

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
        document.getElementById("counterTag").innerText = `${data.length} VEHÍCULOS EN MATRIZ`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA PERÍODO SAP", fmt(m.ebitdaNeto), "fa-chart-line", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "NETO CONTABLE DIRECTO")}
            ${kpiCard("DURACIÓN PROMEDIO TALLER", `${m.mttr.toFixed(1)} DÍAS`, "fa-hourglass-half", m.mttr > 6 ? "text-amber-400" : "text-cyan-400", "LEAD TIME FIJO")}
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
            <tr class="hover:bg-cyan-500/[0.02] transition-colors cursor-pointer" onclick="window.toggleDrillDownPlaca('${o.id}', '${o.placa_pura}')">
                <td class="p-5">
                    <p class="font-black text-white text-sm tracking-tight"><i class="fas fa-chevron-right text-[10px] text-cyan-500 mr-2"></i>${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${String(o.cliente).substring(0, 24)}</p>
                </td>
                <td class="p-5">
                    <span class="px-2.5 py-1 rounded-md text-[8px] font-black bg-slate-950 border border-white/5 ${o.area.includes('MEC') ? 'text-cyan-400' : 'text-amber-400'} uppercase">
                        ${o.area}
                    </span>
                </td>
                <td class="p-5">
                    <p class="text-white font-bold text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Bruto Facturado</p>
                </td>
                <td class="p-5">
                    <p class="text-red-400 font-bold text-xs">${fmt(o.gastosContabilidad)}</p>
                    <p class="text-[8px] text-slate-500 uppercase">Costo Directo Absorción</p>
                </td>
                <td class="p-5 text-right">
                    <p class="font-black text-sm ${o.ebitda > 0 ? 'text-emerald-400' : 'text-red-500'}">${fmt(o.ebitda)}</p>
                    <p class="text-[8px] font-bold ${o.ebitda > 0 ? 'text-emerald-500/60' : 'text-red-500/60'}">${pct(o.margenPorcentaje)} MG</p>
                </td>
                <td class="p-5 text-center">
                    <span class="font-bold text-xs ${o.dias > 5 ? 'text-amber-400' : 'text-emerald-400'}">${o.dias} DÍAS TALLER</span>
                </td>
            </tr>
            <tr id="drilldown-${o.id}" class="hidden bg-[#040712] drilldown-container">
                <td colspan="6" class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div class="bg-black/30 p-4 rounded-xl border border-white/5">
                            <h4 class="orbitron font-black text-cyan-400 text-[10px] uppercase tracking-wider mb-2"><i class="fas fa-stethoscope mr-1"></i> Bitácora Técnica de Diagnóstico</h4>
                            <p class="text-slate-300 font-mono text-[11px] leading-relaxed italic uppercase">${o.bitacora_ia}</p>
                        </div>
                        <div class="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                            <div>
                                <h4 class="orbitron font-black text-amber-400 text-[10px] uppercase tracking-wider mb-2"><i class="fas fa-calculator mr-1"></i> Auditoría de Cuentas Directas (PUC)</h4>
                                <div id="puc-list-${o.id}" class="space-y-1 text-[11px] font-bold max-h-36 overflow-y-auto pr-2"></div>
                            </div>
                            <div class="text-[9px] text-slate-600 font-mono mt-4 text-right">ORDEN_UID: ${o.id}</div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");
    };

    // --- 🔍 SUB-CAPA DRILL-DOWN: RENDERIZACIÓN DE CUENTAS PUC POR PLACA ---
    window.toggleDrillDownPlaca = (id, placaPura) => {
        const fila = document.getElementById(`drilldown-${id}`);
        if (!fila) return;

        if (!fila.classList.contains("hidden")) {
            fila.classList.add("hidden");
            return;
        }

        fila.classList.remove("hidden");
        const contenedorPuc = document.getElementById(`puc-list-${id}`);
        if (!contenedorPuc) return;

        // Filtrar del universo de contabilidad los gastos imputados a esta placa
        const gastosAsignados = state.gastosContablesBase.filter(g => g.placa === placaPura);
        
        let htmlPuc = "";
        
        // Agregar cuenta de ingreso base
        const orden = state.ordenesMaster.find(o => o.id === id);
        if (orden) {
            htmlPuc += `<div class="flex justify-between p-1 bg-emerald-500/5 rounded text-emerald-400">
                <span>PUC 413505 - RECONOCIMIENTO INGRESO BRUTO</span>
                <span>${fmt(orden.total)}</span>
            </div>`;
            if (APLICA_IVA) {
                htmlPuc += `<div class="flex justify-between p-1 bg-slate-500/10 rounded text-slate-400">
                    <span>PUC 2408 - PASIVO IVA DEBITO FISCAL (19%)</span>
                    <span>-${fmt(orden.iva)}</span>
                </div>`;
            }
        }

        if (gastosAsignados.length === 0) {
            htmlPuc += `<p class="text-slate-500 italic p-2">Sin gastos directos imputados desde Libro Diario.</p>`;
        } else {
            gastosAsignados.forEach(g => {
                htmlPuc += `<div class="flex justify-between p-1 bg-red-500/5 rounded text-red-400 border-b border-white/[0.02]">
                    <span class="truncate max-w-xs">PUC ${g.puc} - ${g.concepto}</span>
                    <span>-${fmt(g.monto)}</span>
                </div>`;
            });
        }

        contenedorPuc.innerHTML = htmlPuc;
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
                    labels: ['Costos Fijos Administrativos', 'Nóminas y Operarios', 'Costo Directo de Flota'],
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

        const selectPeriodo = document.getElementById("selPeriodoFiscal");
        if (selectPeriodo) {
            selectPeriodo.onchange = (e) => {
                state.periodoSeleccionado = e.target.value;
                filtrarYProcesarDatos();
            };
        }

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
                    "PERIODO_FISCAL": o.periodo,
                    "VEHICULO_PLACA": o.placa, 
                    "CLIENTE_SOCIETARIO": o.cliente, 
                    "INGRESOS_BRUTOS_REC": o.total,
                    "IVA_DEBITO_PASIVO": o.iva,
                    "INGRESOS_NETOS_CAJA": o.ingresosNetos,
                    "COSTO_DIRECTO_ABSORCION": o.gastosContabilidad,
                    "EBITDA_NETO_UNIDAD": o.ebitda, 
                    "MARGEN_RENTABILIDAD": o.margenPorcentaje / 100, 
                    "CICLO_DURACION_DIAS": o.dias,
                    "DIAGNOSTICO_BITACORA": o.bitacora_ia
                }));

                const ws = XLSX.utils.json_to_sheet(rowsExcel);
                const totalRows = rowsExcel.length;
                const idxTotal = totalRows + 2; 

                ws[`B${idxTotal}`] = { v: "TOTAL EXPORTACIÓN CONTABLE SAP", t: 's' };
                ws[`D${idxTotal}`] = { f: `SUM(D2:D${totalRows + 1})`, t: 'n' };
                ws[`E${idxTotal}`] = { f: `SUM(E2:E${totalRows + 1})`, t: 'n' };
                ws[`F${idxTotal}`] = { f: `SUM(F2:F${totalRows + 1})`, t: 'n' };
                ws[`G${idxTotal}`] = { f: `SUM(G2:G${totalRows + 1})`, t: 'n' };
                
                const formulaEbitda = `SUM(H2:H${totalRows + 1}) - ${state.gastosFijosGlobales} - ${state.nominasInformalesGlobales}`;
                ws[`H${idxTotal}`] = { f: formulaEbitda, t: 'n' };
                ws[`I${idxTotal}`] = { f: `AVERAGE(I2:I${totalRows + 1})`, t: 'n' };
                ws[`J${idxTotal}`] = { f: `AVERAGE(J2:J${totalRows + 1})`, t: 'n' };

                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    ['D', 'E', 'F', 'G', 'H'].forEach(col => {
                        const cell = ws[col + (R + 1)];
                        if (cell) cell.z = '$#,##0';
                    });
                    const cellPct = ws['I' + (R + 1)];
                    if (cellPct) cellPct.z = '0.0%';
                }

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "MATRIZ_SAP_AUDITORIA");
                XLSX.writeFile(wb, `TallerPRO360_MatrizAuditoria_${state.periodoSeleccionado}_${Date.now()}.xlsx`);
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
