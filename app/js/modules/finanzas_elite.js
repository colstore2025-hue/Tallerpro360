/**
 * 🏛️ TALLERPRO360 - NEXUS-X TERMINATOR CORE V23.5 - FINANZAS ELITE
 * ESTRATEGIA: QUANTUM-SAP VISUAL AUDIT & FORENSIC ENGINE
 * UNIFICACIÓN: SINCRO EN ESPEJO CON CONTABILIDAD (PUC), ÓRDENES Y MOTOR DE INVENTARIOS PRO360
 * Director: William Jeffry Urquijo Cubillos // Nexus AI 2026
 */
import {
    collection, query, where, getDocs, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

const loadNexusDep = (id, src) => new Promise(res => {
    if (window[id]) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; document.head.appendChild(s);
});

export default async function finanzasElite(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    let chartTermometro = null;

    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR CRÍTICO: AUTENTICACIÓN SAP REQUERIDA PARA FINANZAS ELITE</div>`;
        return;
    }

    // Matriz de Estructura de Cuentas PUC Nivel SAP-Standard
    let balancePUC = {
        ingresos_mo: 0,       // 413505 - Mano de Obra
        ingresos_rep: 0,      // 413510 - Venta Repuestos
        ingresos_ant: 0,      // 2805 - Anticipos Clientes
        costos_rep: 0,        // 6135 - Costo Venta Repuestos (Compras Insumos)
        costos_nomina: 0,     // 5105 / 7205 - Nómina Pasiva / Comisiones Técnicos / Informales
        gastos_fijos: 0,      // 5120 / 5135 - Arriendos y Servicios Públicos
        gastos_diver: 0,      // 5195 - Gastos Diversos / Operativos / Descuadres
        cartera_rampa: 0,     // 1305 - Cartera Activa en Patio
        stock_bodega: 0       // 1435 - Inventario de Repuestos Activos
    };

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

    const renderLayout = async () => {
        await Promise.all([
            loadNexusDep('Chart', "https://cdn.jsdelivr.net/npm/chart.js"),
            loadNexusDep('jspdf', "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
            loadNexusDep('XLSX', "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js")
        ]);

        container.innerHTML = `
        <div class="p-4 lg:p-12 animate-in fade-in duration-1000 pb-40 bg-[#010409] min-h-screen text-white font-sans selection:bg-cyan-500">
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 border-b-2 border-cyan-500/20 pb-10 gap-8 relative">
                <div class="absolute -top-10 left-0 text-[120px] font-black opacity-5 italic select-none orbitron uppercase">Elite</div>
                <div class="relative z-10">
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] orbitron mt-4 flex items-center gap-2">
                        <span class="w-2 h-2 bg-cyan-500 animate-pulse rounded-full"></span>
                        Quantum-SAP Auditor // Authorized by W.J. Urquijo
                    </p>
                </div>

                <div class="flex flex-wrap gap-3 items-center bg-[#0d1117] p-4 rounded-[2.5rem] border border-white/5 shadow-2xl w-full xl:w-auto justify-between">
                    <div class="flex gap-4 p-2">
                        <div class="flex flex-col">
                            <label class="text-[7px] orbitron text-cyan-500 font-black mb-1 italic">SINCRO_INICIO</label>
                            <input type="date" id="fInicio" class="bg-black text-white text-xs font-bold outline-none border border-white/10 p-2 rounded-xl [color-scheme:dark]">
                        </div>
                        <div class="flex flex-col">
                            <label class="text-[7px] orbitron text-cyan-500 font-black mb-1 italic">SINCRO_FINAL</label>
                            <input type="date" id="fFin" class="bg-black text-white text-xs font-bold outline-none border border-white/10 p-2 rounded-xl [color-scheme:dark]">
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button id="btnPDF" class="px-5 py-3 bg-white text-black rounded-xl flex items-center gap-2 hover:bg-cyan-400 transition-all font-black group">
                            <i class="fas fa-file-pdf text-red-600 text-xs"></i>
                            <span class="orbitron text-[9px] uppercase tracking-wider">Brief Ejecutivo</span>
                        </button>
                        <button id="btnXLS" class="w-12 h-12 bg-[#010409] border border-emerald-500/30 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                            <i class="fas fa-file-excel"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                <div class="lg:col-span-5 flex flex-col gap-8">
                    <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center h-fit">
                        <h3 class="orbitron text-[10px] font-black text-cyan-400 uppercase mb-6 tracking-widest italic w-full text-left">Combustible Operativo</h3>
                        <div class="relative w-full h-[260px]">
                            <canvas id="chartTermometro"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-8">
                                <span id="txtUtilidad" class="text-3xl font-black orbitron text-white">$0</span>
                                <span class="text-[8px] orbitron text-slate-500 uppercase tracking-widest mt-1">EBITDA Real</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#0d1117] border-t-4 border-red-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div class="flex justify-between items-start mb-4">
                            <h4 class="orbitron text-[9px] font-black text-red-500 uppercase tracking-widest italic">Autonomía de Caja (Runway)</h4>
                            <i class="fas fa-hourglass-half text-red-500/20 text-sm"></i>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span id="runway-days" class="text-6xl font-black orbitron text-white">0</span>
                            <span class="text-xs font-bold text-slate-500 uppercase italic">Días de Vida</span>
                        </div>
                        <p class="text-[8px] text-slate-600 uppercase mt-4 font-black tracking-tighter">
                            Basado en un Burn Rate de <span id="burn-rate-val" class="text-red-400">$0</span> / día
                        </p>
                    </div>
                </div>

                <div class="lg:col-span-7 space-y-6">
                    <div class="bg-gradient-to-br from-slate-900 to-cyan-950 p-8 rounded-[2.5rem] text-white border border-cyan-500/20 shadow-2xl relative group">
                        <div class="absolute top-4 right-8 text-2xl opacity-20 text-cyan-400"><i class="fas fa-brain"></i></div>
                        <h4 class="orbitron font-black text-[9px] uppercase mb-3 italic tracking-widest text-cyan-400">Nexus-AI Strategic Insight</h4>
                        <p id="ai-diagnostico" class="text-sm font-medium leading-relaxed italic border-l-2 border-cyan-500/40 pl-4 text-slate-200">Sincronizando balances cruzados de rampa...</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderKPI("Ingresos Operativos Totales", "kpi-ingreso", "text-emerald-400", "fa-cash-register")}
                        ${renderKPI("Egresos Concluidos Consolidados", "kpi-gasto", "text-red-400", "fa-wallet")}
                        ${renderKPI("Operación en Rampa (1305)", "kpi-rampa", "text-cyan-400", "fa-truck-loading")}
                        ${renderKPI("Valor de Stock Activo (1435)", "kpi-stock", "text-amber-400", "fa-box-open")}
                    </div>
                </div>
            </div>

            <div class="mb-12 border-l-4 border-emerald-500 pl-8">
                <h3 class="text-[14px] font-black text-white uppercase tracking-[0.5em] orbitron italic">Performance <span class="text-emerald-500">& Nómina Pasiva</span></h3>
                <div id="gridNomina" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"></div>
            </div>
        </div>`;

        setupEvents();
        initTermometro();
        configurarVentanaTemporalFLEX();
        await sincronizarNucleo();
    };

    const renderKPI = (label, id, color, icon) => `
        <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all">
            <div>
                <p class="text-[8px] orbitron text-slate-500 uppercase font-black mb-1">${label}</p>
                <h2 id="${id}" class="text-xl font-black orbitron ${color}">$0</h2>
            </div>
            <i class="fas ${icon} text-slate-800 group-hover:${color} text-lg transition-all"></i>
        </div>`;

    // --- MANIOBRA DE CORTE EXTEMPORÁNEO FLEXIBLE ---
    const configurarVentanaTemporalFLEX = () => {
        const hoy = new Date();
        let fInicio, fFin;
        
        // Tolerancia Radical: Si estamos entre el día 1 y 10 del mes, mantenemos abierto por defecto el balance del mes anterior
        if (hoy.getDate() <= 10) {
            fInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            fFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        } else {
            fInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        }
        
        document.getElementById("fInicio").value = fInicio.toISOString().split('T')[0];
        document.getElementById("fFin").value = fFin.toISOString().split('T')[0];
    };

    const initTermometro = () => {
        const ctx = document.getElementById('chartTermometro').getContext('2d');
        chartTermometro = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Gastos Fijos/Diversos', 'Costos Operativos/Nóminas', 'EBITDA Neto Real'],
                datasets: [{
                    data: [1, 1, 1],
                    backgroundColor: ['#ef4444', '#f59e0b', '#06b6d4'],
                    borderWidth: 0,
                    cutout: '85%'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                animation: { animateScale: true }
            }
        });
    };

    const normalizarObjetoFecha = (campoFecha) => {
        if (!campoFecha) return null;
        if (typeof campoFecha.toDate === 'function') return campoFecha.toDate();
        if (campoFecha instanceof Date) return campoFecha;
        if (campoFecha.seconds) return new Timestamp(campoFecha.seconds, campoFecha.nanoseconds || 0).toDate();
        if (typeof campoFecha === 'string') {
            const parsed = new Date(campoFecha.includes("T") ? campoFecha : campoFecha + "T12:00:00");
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
    };

    const sincronizarNucleo = async () => {
        const strInicio = document.getElementById("fInicio").value;
        const strFin = document.getElementById("fFin").value;

        const dateLimiteInicio = new Date(strInicio + "T00:00:00");
        const dateLimiteFin = new Date(strFin + "T23:59:59");

        Object.keys(balancePUC).forEach(key => balancePUC[key] = 0);
        const coleccionContable = NEXUS_CONFIG?.COLLECTIONS?.ACCOUNTING || "contabilidad";

        try {
            const qCont = query(collection(db, coleccionContable), where("empresaId", "==", empresaId));
            const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));

            const [snapCont, snapOrd, snapInv] = await Promise.all([
                getDocs(qCont), getDocs(qOrd), getDocs(qInv)
            ]);

            // 1. ESCANEO FORENSE DEL LIBRO DE CONTABILIDAD
            snapCont.docs.forEach(d => {
                const item = d.data();
                const monto = safeNumber(item.monto || item.valor || item.total || item.pago_mecanico || item.salario);
                const tipo = String(item.tipo || "").toLowerCase();
                const detalle = String(item.detalle || item.concepto || "").toLowerCase();
                const cuentaPUC = String(item.puc || item.codigo || "");

                const fechaRealDoc = normalizarObjetoFecha(item.creadoEn || item.fecha || item.fecha_registro || item.createdAt);
                if (fechaRealDoc) {
                    if (fechaRealDoc < dateLimiteInicio || fechaRealDoc > dateLimiteFin) return;
                }

                // Detector PUC de Ingreso (Evitar falsos positivos en la bolsa de egresos)
                const esIngresoExplicito = tipo.includes("ingreso") || cuentaPUC.startsWith("4") || tipo.includes("4135") || tipo.includes("1105") || tipo.includes("2805");

                if (esIngresoExplicito) {
                    if (tipo.includes("mano_obra") || tipo.includes("mo") || detalle.includes("mano de obra") || cuentaPUC.startsWith("413505")) {
                        balancePUC.ingresos_mo += monto;
                    } else if (tipo.includes("repuesto") || detalle.includes("repuesto") || cuentaPUC.startsWith("413510")) {
                        balancePUC.ingresos_rep += monto;
                    } else {
                        balancePUC.ingresos_ant += monto; // Cuenta 2805 u otros ingresos de caja diaria
                    }
                } else {
                    // Mapeo Inteligente de Egresos para absorber los ~39 millones totales asentados libremente
                    const esNominaUComision = cuentaPUC.startsWith("5105") || cuentaPUC.startsWith("7205") || tipo.includes("nomina") || tipo.includes("pago_nomina") || detalle.includes("nomina") || detalle.includes("quincena") || detalle.includes("semana") || detalle.includes("pago mecanico");
                    const esCostoRepuesto = cuentaPUC.startsWith("6135") || tipo.includes("compra_repuestos") || tipo.includes("5195_compra") || detalle.includes("compra repuesto") || detalle.includes("insumos");
                    const esGastoFijo = ["arrendamientos", "pago_servicios", "5120", "5135"].includes(tipo) || cuentaPUC.startsWith("5120") || cuentaPUC.startsWith("5135") || detalle.includes("arriendo") || detalle.includes("servicios publicos");

                    if (esNominaUComision) {
                        balancePUC.costos_nomina += monto;
                    } else if (esCostoRepuesto) {
                        balancePUC.costos_rep += monto;
                    } else if (esGastoFijo) {
                        balancePUC.gastos_fijos += monto;
                    } else {
                        balancePUC.gastos_diver += monto; // Todo lo que el taller registre como egreso/gasto diario entra acá
                    }
                }
            });

            // 2. ESCANEO DE BAHÍAS DE TRABAJO (Órdenes de Servicio)
            const nominaMap = {};
            snapOrd.docs.forEach(d => {
                const o = d.data();
                const totalOrden = safeNumber(o.total || o.costos_totales?.total || 0);
                const estado = String(o.estado || "").toUpperCase();

                if (['INGRESO', 'DIAGNOSTICO', 'REPARACION', 'PROCESO'].includes(estado)) {
                    balancePUC.cartera_rampa += totalOrden;
                }

                if (['LISTO', 'ENTREGADO', 'FINALIZADO'].includes(estado)) {
                    const fechaCierre = normalizarObjetoFecha(o.updatedAt || o.fecha_cierre || o.closedAt);
                    if (fechaCierre && (fechaCierre < dateLimiteInicio || fechaCierre > dateLimiteFin)) return;

                    const tecnico = o.tecnico_asignado || o.tecnico || "MECÁNICO_PLANTA";
                    const pctComision = safeNumber(o.porcentaje_tecnico || 30) / 100;
                    const items = o.items || [];

                    const baseLabor = items
                        .filter(i => i.tipo === 'MANO_OBRA' || i.tipo === 'SERVICIO')
                        .reduce((acc, i) => acc + (safeNumber(i.venta || i.precio) * safeNumber(i.cantidad || 1)), 0);

                    const comision = baseLabor * pctComision;
                    
                    // Si el pago no está duplicado explícitamente en el libro diario, se concilia en espejo
                    if (comision > 0) {
                        if (!nominaMap[tecnico]) nominaMap[tecnico] = { total: 0, count: 0 };
                        nominaMap[tecnico].total += comision;
                        nominaMap[tecnico].count += 1;
                    }
                }
            });

            // 3. VALORACIÓN DE ACTIVOS EN BODEGA (Módulo Inventarios)
            snapInv.docs.forEach(doc => {
                const it = doc.data();
                balancePUC.stock_bodega += (safeNumber(it.cantidad || it.stock) * safeNumber(it.precioCosto || it.costo || 0));
            });

            renderNomina(nominaMap);
            updateUI();

        } catch (error) {
            console.error("🚀 QUANTUM_FAULT -> Colapso en sincronización del núcleo financiero:", error);
        }
    };

    const updateUI = () => {
        const ingresosTotales = balancePUC.ingresos_mo + balancePUC.ingresos_rep + balancePUC.ingresos_ant;
        const egresosTotales = balancePUC.costos_rep + balancePUC.costos_nomina + balancePUC.gastos_fijos + balancePUC.gastos_diver;
        
        // El EBITDA Real descuenta rigurosamente la bolsa global de gastos consolidados
        const ebitda = ingresosTotales - egresosTotales;

        const fInicio = new Date(document.getElementById("fInicio").value);
        const fFin = new Date(document.getElementById("fFin").value);
        const diasPeriodo = Math.ceil(Math.abs(fFin - fInicio) / (1000 * 60 * 60 * 24)) || 30;

        const burnRateDiario = egresosTotales / diasPeriodo;
        const runway = burnRateDiario > 0 && ebitda > 0 ? Math.floor(ebitda / burnRateDiario) : 0;

        const runwayDom = document.getElementById("runway-days");
        if (runwayDom) {
            runwayDom.innerText = burnRateDiario === 0 && ebitda > 0 ? "∞" : runway;
            runwayDom.className = "text-6xl font-black orbitron " + (runway < 10 ? "text-red-500" : (runway < 20 ? "text-amber-500" : "text-emerald-400"));
        }

        if (document.getElementById("burn-rate-val")) {
            document.getElementById("burn-rate-val").innerText = `$${Math.round(burnRateDiario).toLocaleString('es-CO')}`;
        }

        // Actualización de KPIs con homologación limpia en formato colombiano
        document.getElementById("kpi-ingreso").innerText = `$${Math.round(ingresosTotales).toLocaleString('es-CO')}`;
        document.getElementById("kpi-gasto").innerText = `$${Math.round(egresosTotales).toLocaleString('es-CO')}`;
        document.getElementById("kpi-rampa").innerText = `$${Math.round(balancePUC.cartera_rampa).toLocaleString('es-CO')}`;
        document.getElementById("kpi-stock").innerText = `$${Math.round(balancePUC.stock_bodega).toLocaleString('es-CO')}`;

        const txtUtilidad = document.getElementById("txtUtilidad");
        if (txtUtilidad) {
            txtUtilidad.innerText = `$${Math.round(ebitda).toLocaleString('es-CO')}`;
            txtUtilidad.className = "text-2xl font-black orbitron " + (ebitda > 0 ? "text-emerald-400" : "text-red-500");
        }

        const diagnosticDom = document.getElementById("ai-diagnostico");
        if (diagnosticDom) {
            diagnosticDom.innerText = ebitda > 0 ?
                `ESTADO NOMINAL: Estructura de resultados saludable. Cuentas con ${runway} días de autonomía de caja. Se aconseja agilizar la liquidación de órdenes en patio para transformar la rampa ($${Math.round(balancePUC.cartera_rampa).toLocaleString('es-CO')}) en efectivo disponible.` :
                `ALERTA FORENSE: Déficit operacional en el rango seleccionado. Tu costo fijo y operacional diario consolidado es de $${Math.round(burnRateDiario).toLocaleString('es-CO')}. Es imperativo revisar el diario de contabilidad.js y acelerar el recaudo de cartera en patio.`;
        }

        if (chartTermometro) {
            chartTermometro.data.datasets[0].data = [
                balancePUC.gastos_fijos + balancePUC.gastos_diver, 
                balancePUC.costos_nomina + balancePUC.costos_rep, 
                Math.max(0, ebitda)
            ];
            chartTermometro.update();
        }
    };

    const renderNomina = (data) => {
        const containerNomina = document.getElementById("gridNomina");
        if (!containerNomina) return;

        if (Object.keys(data).length === 0) {
            containerNomina.innerHTML = `<div class="col-span-full text-center py-6 text-xs text-slate-500 font-bold uppercase tracking-wider italic bg-[#0d1117] rounded-xl border border-dashed border-white/10">Sin comisiones liquidadas desde rampa en este rango.</div>`;
            return;
        }

        containerNomina.innerHTML = Object.entries(data).map(([tecnico, s]) => `
            <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-emerald-500/10 flex justify-between items-center hover:border-cyan-500/30 transition-all">
                <div>
                    <h4 class="text-xs font-black uppercase text-white truncate max-w-[150px]">${tecnico}</h4>
                    <p class="text-[10px] orbitron text-emerald-400 font-bold mt-1">$${Math.round(s.total).toLocaleString('es-CO')}</p>
                </div>
                <span class="text-[8px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-400 font-black">${s.count} OS</span>
            </div>
        `).join('');
    };

    const setupEvents = () => {
        document.getElementById("fInicio").onchange = sincronizarNucleo;
        document.getElementById("fFin").onchange = sincronizarNucleo;
        document.getElementById("btnPDF").onclick = generarReportePDF;
        document.getElementById("btnXLS").onclick = exportarExcelForense;
    };

    async function generarReportePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const ingresosTotales = balancePUC.ingresos_mo + balancePUC.ingresos_rep + balancePUC.ingresos_ant;
        const egresosTotales = balancePUC.costos_rep + balancePUC.costos_nomina + balancePUC.gastos_fijos + balancePUC.gastos_diver;
        const ebitda = ingresosTotales - egresosTotales;

        // Banner Superior Estilo Dark SAP
        doc.setFillColor(1, 4, 9);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(6, 182, 212);
        doc.setFont("Helvetica", "Bold");
        doc.setFontSize(14);
        doc.text("TALLERPRO360 - NEXUS-X COMMAND INTERFACE", 15, 18);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(15);
        doc.text("ESTADO DE RESULTADOS INTEGRAL FORENSE (PUC)", 15, 45);

        doc.setFontSize(9); doc.setTextColor(100, 116, 139);
        doc.text(`Identificación del Taller: ${empresaId}`, 15, 53);
        doc.text(`Rango de Sincronización: ${document.getElementById("fInicio").value} / ${document.getElementById("fFin").value}`, 15, 58);

        doc.setDrawColor(226, 232, 240);
        doc.line(15, 63, 195, 63);

        const lineasReporte = [
            ["CÓDIGO PUC", "ESTRUCTURA DE CUENTA (CONSOLIDADO)", "VALOR BALANCE"],
            ["413505", "Ingresos por Mano de Obra (Servicios)", `$ ${Math.round(balancePUC.ingresos_mo).toLocaleString('es-CO')}`],
            ["413510", "Ingresos por Venta de Repuestos", `$ ${Math.round(balancePUC.ingresos_rep).toLocaleString('es-CO')}`],
            ["2805", "Anticipos e Ingresos Diversos de Caja", `$ ${Math.round(balancePUC.ingresos_ant).toLocaleString('es-CO')}`],
            ["TOTAL 4", "INGRESOS OPERATIVOS BRUTOS", `$ ${Math.round(ingresosTotales).toLocaleString('es-CO')}`],
            ["6135", "Costos de Adquisición / Compras Repuestos", `$ ${Math.round(balancePUC.costos_rep).toLocaleString('es-CO')}`],
            ["5105/7205", "Gastos de Personal (Nóminas y Comisiones)", `$ ${Math.round(balancePUC.costos_nomina).toLocaleString('es-CO')}`],
            ["5120/5135", "Arrendamientos y Servicios Públicos", `$ ${Math.round(balancePUC.gastos_fijos).toLocaleString('es-CO')}`],
            ["5195", "Gastos Diversos / Caja Menor Especial", `$ ${Math.round(balancePUC.gastos_diver).toLocaleString('es-CO')}`],
            ["TOTAL 5-6", "EGRESOS Y COSTOS DE OPERACIÓN", `$ ${Math.round(egresosTotales).toLocaleString('es-CO')}`],
            ["EBITDA", "UTILIDAD NETA OPERATIVA REAL", `$ ${Math.round(ebitda).toLocaleString('es-CO')}`],
            ["1305", "Cartera Activa Retenida en Patio (Rampa)", `$ ${Math.round(balancePUC.cartera_rampa).toLocaleString('es-CO')}`],
            ["1435", "Inventario Valorizado de Bodega (Stock)", `$ ${Math.round(balancePUC.stock_bodega).toLocaleString('es-CO')}`]
        ];

        let y = 75;
        lineasReporte.forEach((fila, idx) => {
            if (idx === 0) {
                doc.setFont("Helvetica", "Bold"); doc.setTextColor(15, 23, 42); doc.setFontSize(10);
            } else if ([4, 9, 10].includes(idx)) {
                doc.setFont("Helvetica", "Bold"); doc.setTextColor(6, 182, 212); doc.setFontSize(10);
            } else {
                doc.setFont("Helvetica", "Normal"); doc.setTextColor(51, 65, 85); doc.setFontSize(9);
            }
            doc.text(fila[0], 16, y);
            doc.text(fila[1], 45, y);
            doc.text(fila[2], 155, y);
            doc.line(15, y + 3, 195, y + 3);
            y += 9;
        });

        // Bloque de Firma y Autenticación Corporativa
        y += 12;
        doc.setFont("Helvetica", "Bold"); doc.setTextColor(15, 23, 42); doc.setFontSize(10);
        doc.text("CERTIFICACIÓN DE FIRMA CORPORATIVA", 15, y);
        doc.line(15, y + 15, 85, y + 15);
        doc.setFont("Helvetica", "Normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text("William Jeffry Urquijo Cubillos // Director de Inteligencia Nexus AI", 15, y + 19);

        doc.save(`Estado_Resultados_PRO360_${empresaId}.pdf`);
    }

    async function exportarExcelForense() {
        const datos = [
            { Cuenta: "413505", Descripcion: "Mano de Obra", Balance: balancePUC.ingresos_mo },
            { Cuenta: "413510", Descripcion: "Venta Repuestos", Balance: balancePUC.ingresos_rep },
            { Cuenta: "2805", Descripcion: "Anticipos e Ingresos de Caja", Balance: balancePUC.ingresos_ant },
            { Cuenta: "6135", Descripcion: "Costo de Adquisición de Repuestos", Balance: balancePUC.costos_rep },
            { Cuenta: "5105/7205", Descripcion: "Gastos de Personal (Nóminas e Informales)", Balance: balancePUC.costos_nomina },
            { Cuenta: "5120/35", Descripcion: "Gastos Fijos", Balance: balancePUC.gastos_fijos },
            { Cuenta: "5195", Descripcion: "Gastos Diversos Consolidado", Balance: balancePUC.gastos_diver },
            { Cuenta: "1305", Descripcion: "Cartera en Rampa", Balance: balancePUC.cartera_rampa },
            { Cuenta: "1435", Descripcion: "Inventario Bodega", Balance: balancePUC.stock_bodega }
        ];

        const ws = window.XLSX.utils.json_to_sheet(datos);
        const wb = window.XLSX.utils.book_new();
        
        // Inyección de sumatorias dinámicas nativas para Auditoría Corporativa SAP
        const totalRows = datos.length;
        const targetIndex = totalRows + 2;
        
        ws[`A${targetIndex}`] = { v: "EBITDA REAL CONSOLIDADO", t: 's' };
        ws[`C${targetIndex}`] = { f: `SUM(C2:C4) - SUM(C5:C8)`, t: 'n', z: '$#,##0' };

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r + 1; ++R) {
            const cell = ws['C' + (R + 1)];
            if (cell) cell.z = '$#,##0';
        }

        window.XLSX.utils.book_append_sheet(wb, ws, "Balance PUC Consolidado");
        window.XLSX.writeFile(wb, `Reporte_Forense_PRO360_${empresaId}.xlsx`);
    }

    await renderLayout();
}
