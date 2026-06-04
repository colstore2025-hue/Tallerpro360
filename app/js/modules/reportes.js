/**
 * 🏛️ NEXUS-X COMMANDER BI V50.2 - SAP INDUSTRIAL HYPER-DRIVE
 * William Jeffry Urquijo Cubillos // Nexus AI 2026
 * Maniobra: Auditoría Forense Avanzada, Desglose de IVA, Lead Time Real y Autosumas XLSX.
 */

import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

export default async function nexusReportes(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR: SESIÓN DE TALLER NO IDENTIFICADA PARA INTELIGENCIA BI</div>`;
        return;
    }

    const IVA_FACTOR = 0.19;

    // --- MOTOR DE FORMATEO PROFESIONAL ---
    const fmt = (v) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(v);
    };

    const pct = (v) => `${v.toFixed(1)}%`;

    let state = {
        ordenesMaster: [],
        gastosFijosGlobales: 0, 
        dataActual: [],
        charts: {}
    };

    const init = async () => {
        injectNexusStyles();
        renderLayout();
        await loadDependencies();
        await fetchData();
        setupEventListeners();
    };

    const injectNexusStyles = () => {
        if (document.getElementById("nexus-bi-styles")) return;
        const style = document.createElement('style');
        style.id = "nexus-bi-styles";
        style.innerHTML = `
            .filter-btn { padding: 10px 20px; border-radius: 15px; font-size: 10px; font-weight: 900; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #64748b; transition: 0.4s; cursor: pointer; font-family: 'Orbitron'; text-transform: uppercase; }
            .filter-btn.active { background: #06b6d4; color: #000; border-color: #06b6d4; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
            .sap-input { background: #000; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: #06b6d4; padding: 8px 12px; font-size: 11px; outline: none; transition: 0.3s; }
            .sap-input:focus { border-color: #06b6d4; box-shadow: 0 0 10px rgba(6,182,212,0.2); }
            .kpi-card { position: relative; overflow: hidden; background: #0d1117; padding: 2rem; border-radius: 2.5rem; border: 1px solid rgba(255,255,255,0.05); transition: 0.5s; }
            .kpi-card:hover { border-color: rgba(6, 182, 212, 0.3); transform: translateY(-5px); }
            .chart-container { background: #0d1117; padding: 2rem; border-radius: 3rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .custom-scroll::-webkit-scrollbar { width: 4px; }
            .custom-scroll::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 10px; }
        `;
        document.head.appendChild(style);
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="bg-[#010409] min-h-screen text-slate-100 p-4 lg:p-10 orbitron animate-in fade-in duration-1000">
            <header class="flex flex-col gap-8 mb-12 border-b border-white/5 pb-10 text-center md:text-left">
                <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h1 class="text-5xl font-black italic tracking-tighter text-white uppercase">Nexus<span class="text-cyan-400">_Intelligence</span></h1>
                        <p class="text-[10px] text-slate-500 tracking-[0.5em] font-bold uppercase mt-3 italic">Industrial Audit System // Edición Looker-X EBITDA por Placa</p>
                    </div>
                    <button id="btnExportGlobal" class="bg-emerald-500 text-black px-8 py-4 rounded-2xl text-[11px] font-black hover:scale-105 transition-all flex items-center gap-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)]">
                        <i class="fas fa-file-csv text-lg"></i> EXPORTAR DATA BI
                    </button>
                </div>

                <div class="w-full flex flex-wrap gap-4 mt-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/5 items-center justify-center md:justify-start">
                    <span class="text-[9px] text-cyan-500 font-black uppercase tracking-widest mr-4">Rango de Auditoría:</span>
                    <button id="flt-hist" class="filter-btn active">Histórico</button>
                    <button id="flt-mes" class="filter-btn">Mensual</button>
                    <button id="flt-sem" class="filter-btn">Semanal</button>
                    <div class="flex items-center gap-4 ml-auto">
                        <i class="fas fa-calendar-alt text-slate-600"></i>
                        <input type="date" id="datePicker" class="sap-input orbitron">
                    </div>
                </div>
            </header>

            <div id="kpi-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                <div class="lg:col-span-2 chart-container">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-xs font-black text-cyan-500 uppercase tracking-widest italic">EBITDA Neto Operativo por Unidad ($)</h3>
                        <span class="text-[9px] text-slate-500 orbitron uppercase">Tiempo Real</span>
                    </div>
                    <div class="h-80"><canvas id="mainChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <h3 class="text-xs font-black text-amber-500 uppercase tracking-widest italic mb-8">Mix Operativo de Flota</h3>
                    <div class="h-64"><canvas id="pieChart"></canvas></div>
                </div>
            </div>

            <div class="bg-[#0d1117] rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden mb-20">
                <div class="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h3 class="text-xs font-black text-white uppercase italic tracking-widest">Análisis Forense de Misiones (Facturación vs Costos Contables y EBITDA)</h3>
                    <span id="counterTag" class="text-[10px] bg-cyan-500/10 text-cyan-400 px-6 py-2 rounded-full font-black border border-cyan-500/20 uppercase">Calculando...</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-black/40 text-slate-500 text-[10px] uppercase font-black">
                            <tr>
                                <th class="p-8">Identificación</th>
                                <th class="p-8">Misión / Área</th>
                                <th class="p-8">Facturación Bruta (Ingresos)</th>
                                <th class="p-8">Desglose Impositivo / Costos</th>
                                <th class="p-8 text-right">EBITDA Real por Placa</th>
                                <th class="p-8 text-center">Lead Time</th>
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

            // --- HELPER QUIRÚRGICO DE NORMALIZACIÓN (AISLAMIENTO DE PLACA PURA) ---
            const aislarPlacaPura = (texto) => {
                if (!texto) return 'S/N';
                // Si viene "BDB461-TOYOTA BURBUJA", divide por el guion y toma "BDB461"
                const base = texto.split('-')[0];
                // Sanitiza eliminando espacios, caracteres especiales y fuerza mayúsculas
                return base.toUpperCase().replace(/[^A-Z0-9]/g, '').trim().substring(0, 6);
            };

            const mapaGastosPorPlaca = {};
            let gastosFijosGlobales = 0;

            // ==========================================================================
            // 1. PROCESAMIENTO DEL LIBRO DE CONTABILIDAD
            // ==========================================================================
            snapAcc.docs.forEach(doc => {
                const data = doc.data();
                const monto = Number(data.monto || data.total || data.valor || 0);
                const tipo = (data.tipo || "").toLowerCase();
                
                const esGasto = !(tipo.includes("ingreso") || tipo.includes("4135") || tipo.includes("saneamiento") || tipo.includes("1105") || tipo.includes("capital") || tipo.includes("2805"));
                
                if (esGasto) {
                    const placaRaw = (data.placa || "ADMIN").toUpperCase().trim();
                    if (placaRaw === "ADMIN" || !placaRaw) {
                        gastosFijosGlobales += monto;
                    } else {
                        // Extraemos la clave de 6 dígitos para asegurar compatibilidad total
                        const placaClave = aislarPlacaPura(placaRaw);
                        if (!mapaGastosPorPlaca[placaClave]) mapaGastosPorPlaca[placaClave] = 0;
                        mapaGastosPorPlaca[placaClave] += monto;
                    }
                }
            });

            state.gastosFijosGlobales = gastosFijosGlobales;

            // ==========================================================================
            // 2. CONSOLIDACIÓN DE ÓRDENES Y ENCAJE OPERATIVO EBITDA
            // ==========================================================================
            state.ordenesMaster = snapOrders.docs.map(doc => {
                const o = doc.data();
                
                // Mantenemos la estructura visual intacta para la UI ("BDB461-TOYOTA BURBUJA")
                const identificadorVisual = (o.placa || 'S/N').toUpperCase().trim();
                
                // AISLAMIENTO FINANCIERO: Extraemos los 6 caracteres limpios para buscar en el mapa contable
                const placaFinancieraClave = aislarPlacaPura(identificadorVisual);
                
                // 1. Captura del Ingreso Bruto
                const facturacionBruta = Number(o.costos_totales?.total || o.total || 0);
                
                // 2. Desglose Impositivo Exacto (Remoción matemática del 19%)
                const ingresosNetos = facturacionBruta / (1 + IVA_FACTOR);
                const ivaRetenido = facturacionBruta - ingresosNetos;
                
                // 3. EL CRUCE MAESTRO: Mapeo exacto contra la clave limpia de contabilidad
                const gastosContablesAsignados = mapaGastosPorPlaca[placaFinancieraClave] || 0;
                
                // 4. REGLA DE NEGOCIO ESTRICTA: Facturación Bruta - IVA - Libro = EBITDA
                const ebitdaRealPlaca = facturacionBruta - ivaRetenido - gastosContablesAsignados;
                
                // 5. El Margen Operativo se calcula sobre el Ingreso Neto Real (sin impuestos)
                const margenEbitdaPrc = ingresosNetos > 0 ? (ebitdaRealPlaca / ingresosNetos) * 100 : 0;
                
                // --- CONECTOR DINÁMICO DE LEAD TIME DESDE ORDENES.JS ---
                const fechaInicio = o.createdAt?.toDate ? o.createdAt.toDate() : (o.fecha_ingreso ? new Date(o.fecha_ingreso) : new Date());
                const fechaFin = o.fecha_entrega || o.fechas?.entrega || o.closedAt || o.fecha_cierre;
                
                let diasTaller = 1;
                if (fechaFin) {
                    const fechaCierre = fechaFin.toDate ? fechaFin.toDate() : new Date(fechaFin);
                    const diferenciaMilisegundos = fechaCierre - fechaInicio;
                    diasTaller = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
                } else {
                    const hoy = new Date();
                    const diferenciaMilisegundos = hoy - fechaInicio;
                    diasTaller = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
                }
                
                if (diasTaller <= 0) diasTaller = 1;
                
                return {
                    id: doc.id,
                    placa: identificadorVisual, // Se renderiza estético en la tabla del panel
                    area: o.tipo_orden || 'MECANICA',
                    total: facturacionBruta,
                    ingresosNetos: ingresosNetos,
                    iva: ivaRetenido,
                    gastosContabilidad: gastosContablesAsignados, // <--- Cargará los $777.000 exactos cruzando por ID limpio
                    ebitda: ebitdaRealPlaca,
                    margenPorcentaje: margenEbitdaPrc,
                    dias: diasTaller,
                    cliente: o.cliente || 'OPERACIÓN_NEXUS',
                    fecha: fechaInicio
                };
            });

            processAndRender(state.ordenesMaster);

        } catch (e) {
            console.error("🚀 CORE_BI_FAULT -> Error crítico en recopilación analítica:", e);
        }
    };

    const processAndRender = (data) => {
        state.dataActual = data;
        
        const totalFacturadoBruto = data.reduce((a, b) => a + b.total, 0);
        const totalEbitdaConsolidado = data.reduce((a, b) => a + b.ebitda, 0) - state.gastosFijosGlobales;
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
        document.getElementById("counterTag").innerText = `${data.length} UNIDADES PROCESADAS`;
    };

    const renderKPIs = (m) => {
        const grid = document.getElementById("kpi-grid");
        if (!grid) return;
        grid.innerHTML = `
            ${kpiCard("EBITDA CONTABLE REAL", fmt(m.ebitdaNeto), "fa-wallet", m.ebitdaNeto > 0 ? "text-emerald-400" : "text-red-500", "UTILIDAD OPERATIVA NETADA")}
            ${kpiCard("TIEMPO EN TALLER (MTTR)", `${m.mttr.toFixed(1)} DÍAS`, "fa-clock", m.mttr > 5 ? "text-amber-500" : "text-cyan-400", "VELOCIDAD DE CICLO")}
            ${kpiCard("TICKET PROMEDIO", fmt(m.ticket), "fa-tag", "text-white", "VALOR MEDIO / ORDEN")}
            ${kpiCard("MARGEN OPERATIVO EBITDA", pct(m.margenGeneral), "fa-chart-pie", m.margenGeneral > 0 ? "text-cyan-400" : "text-red-400", "RENTABILIDAD DEL TALLER")}
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
        
        body.innerHTML = data.map(o => `
            <tr class="border-b border-white/[0.02] hover:bg-cyan-500/5 transition-all group">
                <td class="p-8">
                    <p class="font-black text-white orbitron text-base">${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase tracking-widest">${typeof o.cliente === 'string' ? o.cliente.substring(0, 20) : 'CLIENTE NEXUS'}</p>
                </td>
                <td class="p-8">
                    <span class="px-4 py-2 rounded-xl text-[9px] font-black bg-black border border-white/10 ${o.area === 'MECANICA' ? 'text-cyan-400' : 'text-amber-400'} uppercase">
                        ${o.area}
                    </span>
                </td>
                <td class="p-8">
                    <p class="text-white font-black orbitron text-xs">${fmt(o.total)}</p>
                    <p class="text-[8px] text-slate-600">BRUTO CON IVA</p>
                </td>
                <td class="p-8">
                    <p class="text-slate-300 font-bold orbitron text-xs">IVA: ${fmt(o.iva)}</p>
                    <p class="text-[10px] text-red-400 font-bold">LIBRO: ${fmt(o.gastosContabilidad)}</p>
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
                        label: 'EBITDA por Unidad',
                        data: vals,
                        backgroundColor: colors,
                        borderRadius: 8,
                        borderWidth: 0
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) { return fmt(context.raw); }
                            }
                        }
                    },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { family: 'Orbitron', size: 8 } } },
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
                    labels: ['MEC', 'LAT', 'ELE'],
                    datasets: [{
                        data: [
                            data.filter(o => o.area.includes('MEC')).length,
                            data.filter(o => o.area.includes('LAT') || o.area.includes('PINT')).length,
                            data.filter(o => o.area.includes('ELEC')).length
                        ],
                        backgroundColor: ['#06b6d4', '#fbbf24', '#a855f7'],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: { cutout: '80%', plugins: { legend: { display: false } } }
            });
        }
    };

    const filtrarPorDias = (dias) => {
        const filtrados = dias === 0 
            ? state.ordenesMaster 
            : state.ordenesMaster.filter(o => o.fecha >= new Date(Date.now() - dias * 24 * 60 * 60 * 1000));
        processAndRender(filtrados);
    };

    const setupEventListeners = () => {
        const btnExport = document.getElementById("btnExportGlobal");
        if (btnExport) {
            btnExport.onclick = () => {
                if (typeof XLSX === 'undefined') {
                    Swal.fire("Error BI", "Librería de exportación no cargada completamente.", "error");
                    return;
                }
                
                // Mapeo estructurado inyectando la nueva columna de IVA
                const baseRows = state.dataActual.map(o => ({
                    "PLACA_UNIDAD": o.placa, 
                    "CLIENTE": o.cliente, 
                    "INGRESOS_BRUTOS": o.total,
                    "IVA_19": o.iva,
                    "INGRESOS_NETOS": o.ingresosNetos,
                    "GASTOS_LIBRO_DIARIO": o.gastosContabilidad,
                    "EBITDA_NETO": o.ebitda, 
                    "MARGEN_EBITDA": o.margenPorcentaje / 100, // Formato nativo para Excel
                    "LEAD_TIME_DIAS": o.dias
                }));

                const ws = XLSX.utils.json_to_sheet(baseRows);
                const totalRows = baseRows.length;
                const totalRowIndex = totalRows + 2; // Fila de autosumas (indexación 1-based + header)

                // --- INYECCIÓN DE FORMULAS NATIVAS DE AUTOSUMA (QUANTUM-SAP LEVEL) ---
                ws[`A${totalRowIndex}`] = { v: "TOTAL CONSOLIDADO", t: 's' };
                ws[`C${totalRowIndex}`] = { f: `SUM(C2:C${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`D${totalRowIndex}`] = { f: `SUM(D2:D${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`E${totalRowIndex}`] = { f: `SUM(E2:E${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`F${totalRowIndex}`] = { f: `SUM(F2:F${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`G${totalRowIndex}`] = { f: `SUM(G2:G${totalRows + 1})`, t: 'n', z: '$#,##0' };
                ws[`H${totalRowIndex}`] = { f: `AVERAGE(H2:H${totalRows + 1})`, t: 'n', z: '0.0%' };
                ws[`I${totalRowIndex}`] = { f: `AVERAGE(I2:I${totalRows + 1})`, t: 'n', z: '0.0' };

                // Formatear las columnas numéricas para que Excel las reconozca nativamente
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
                XLSX.utils.book_append_sheet(wb, ws, "NEXUS_EBITDA_BI");
                XLSX.writeFile(wb, `Nexus_Ebitda_Audit_${empresaId}_${Date.now()}.xlsx`);
            };
        }

        const configurarFiltro = (id, dias) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = () => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filtrarPorDias(dias);
                };
            }
        };

        configurarFiltro("flt-hist", 0);
        configurarFiltro("flt-mes", 30);
        configurarFiltro("flt-sem", 7);

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
