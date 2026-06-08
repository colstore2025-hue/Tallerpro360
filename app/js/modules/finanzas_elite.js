/**
 * 🦾 NEXUS-X TERMINATOR CORE V23.0 - FINANZAS ELITE
 * ESTRATEGIA: QUANTUM-SAP 2030 VISUAL AUDIT + AUDITORÍA INTEGRAL DE LIBRERÍAS
 * UNIFICACIÓN: SINCRO EN ESPEJO CON CONTABILIDAD, ÓRDENES Y MOTOR DE INVENTARIOS PRO360
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
    const empresaId = localStorage.getItem("nexus_empresaId") || "";
    let chartTermometro = null;
    
    // Matriz de Estructura de Cuentas PUC Nivel SAP-Standard
    let balancePUC = { 
        ingresos_mo: 0,     // 413505 - Mano de Obra
        ingresos_rep: 0,    // 413510 - Venta Repuestos
        ingresos_ant: 0,    // 2805 - Anticipos Clientes
        costos_rep: 0,      // 6135 - Costo Venta Repuestos (Compras Insumos)
        costos_nomina: 0,   // 5105 - Nómina Pasiva / Comisiones Técnicos
        gastos_fijos: 0,    // 5120 / 5135 - Arriendos y Servicios Públicos
        gastos_diver: 0,    // 5195 - Gastos Diversos / Operativos
        cartera_rampa: 0,   // 1305 - Cartera Activa en Patio
        stock_bodega: 0     // 1435 - Inventario de Repuestos Activos
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
                        ${renderKPI("Disponible / Recaudo Bruto (4135)", "kpi-ingreso", "text-emerald-400", "fa-wallet")}
                        ${renderKPI("Operación en Rampa (1305)", "kpi-rampa", "text-cyan-400", "fa-car-crash")}
                        ${renderKPI("Costos & Gastos Totales (5)", "kpi-gasto", "text-red-400", "fa-file-invoice-dollar")}
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
        
        // Carga de la ventana temporal elástica (Mes actual por defecto para unificar cierres)
        const date = new Date();
        const fInicio = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const fFin = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        
        document.getElementById("fInicio").value = fInicio;
        document.getElementById("fFin").value = fFin;

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

    const initTermometro = () => {
        const ctx = document.getElementById('chartTermometro').getContext('2d');
        chartTermometro = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Costos Fijos', 'Costo Operacional/Nómina', 'Utilidad Operativa'],
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

        // Limpieza de balances para evitar acumulaciones duplicadas en re-sincronizaciones
        Object.keys(balancePUC).forEach(key => balancePUC[key] = 0);

        const coleccionContable = NEXUS_CONFIG?.COLLECTIONS?.ACCOUNTING || "accounting";
        
        try {
            // Consulta plana indexada por empresaId para anular caídas por falta de índices compuestos
            const qCont = query(collection(db, coleccionContable), where("empresaId", "==", empresaId));
            const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));

            const [snapCont, snapOrd, snapInv] = await Promise.all([
                getDocs(qCont), getDocs(qOrd), getDocs(qInv)
            ]);

            // 1. PROCESAMIENTO DEL LIBRO DE CONTABILIDAD
            snapCont.docs.forEach(d => {
                const item = d.data();
                const monto = Number(item.monto || item.valor || item.total || 0);
                const tipo = String(item.tipo || "").toLowerCase();

                const fechaRealDoc = normalizarObjetoFecha(item.creadoEn || item.fecha || item.fecha_registro);
                if (fechaRealDoc) {
                    if (fechaRealDoc < dateLimiteInicio || fechaRealDoc > dateLimiteFin) return;
                }

                // Clasificación unificada de subcuentas PUC
                if (tipo === "ingreso_ot" || tipo.includes("4135")) {
                    balancePUC.ingresos_mo += monto;
                } else if (tipo === "venta_repuestos") {
                    balancePUC.ingresos_rep += monto;
                } else if (tipo === "anticipo_cliente" || tipo.includes("2805")) {
                    balancePUC.ingresos_ant += monto;
                } else if (tipo === "compra_repuestos" || tipo.includes("5195_compra")) {
                    balancePUC.costos_rep += monto;
                } else if (tipo === "pago_nomina" || tipo.includes("5105")) {
                    balancePUC.costos_nomina += monto;
                } else if (["arrendamientos", "pago_servicios", "5120", "5135"].includes(tipo)) {
                    balancePUC.gastos_fijos += monto;
                } else if (["gasto_operativo", "gastos_diversos"].includes(tipo)) {
                    balancePUC.gastos_diver += monto;
                }
            });

            // 2. ESCANEO DE BAHÍAS DE TRABAJO (Colección Órdenes)
            const nominaMap = {};
            snapOrd.docs.forEach(d => {
                const o = d.data();
                const totalOrden = Number(o.total || o.costos_totales?.total || 0);
                const estado = String(o.estado || "").toUpperCase();
                
                // Mapeo de Capital Activo Retenido en Rampa
                if (['INGRESO', 'DIAGNOSTICO', 'REPARACION', 'PROCESO'].includes(estado)) {
                    balancePUC.cartera_rampa += totalOrden;
                }
                
                // Conciliación con el módulo de comisiones de órdenes.js V17
                if (['LISTO', 'ENTREGADO', 'FINALIZADO'].includes(estado)) {
                    const fechaCierre = normalizarObjetoFecha(o.updatedAt || o.fecha_creacion_manual);
                    if (fechaCierre && (fechaCierre < dateLimiteInicio || fechaCierre > dateLimiteFin)) return;

                    const tecnico = o.tecnico_asignado || o.tecnico || "MECÁNICO_PLANTEADO";
                    const pctComision = Number(o.porcentaje_tecnico || 30) / 100;
                    
                    const items = o.items || [];
                    // Filtrado estricto por tipo MANO_OBRA establecido en órdenes.js
                    const baseLabor = items
                        .filter(i => i.tipo === 'MANO_OBRA' || i.tipo === 'SERVICIO')
                        .reduce((acc, i) => acc + (Number(i.venta || 0) * Number(i.cantidad || 1)), 0);
                    
                    const comision = baseLabor * pctComision;
                    balancePUC.costos_nomina += comision; // Acumulación directa al costo operacional

                    if (!nominaMap[tecnico]) nominaMap[tecnico] = { total: 0, count: 0 };
                    nominaMap[tecnico].total += comision;
                    nominaMap[tecnico].count += 1;
                }
            });

            // 3. VALORACIÓN DE ACTIVOS EN BODEGA
            snapInv.forEach(doc => {
                const it = doc.data();
                balancePUC.stock_bodega += (Number(it.cantidad || 0) * Number(it.precioCosto || 0));
            });

            renderNomina(nominaMap);
            updateUI();

        } catch (error) {
            console.error("Fallo general en la sincronización del núcleo financiero:", error);
        }
    };

    const updateUI = () => {
        const ingresosTotales = balancePUC.ingresos_mo + balancePUC.ingresos_rep + balancePUC.ingresos_ant;
        const egresosTotales = balancePUC.costos_rep + balancePUC.costos_nomina + balancePUC.gastos_fijos + balancePUC.gastos_diver;
        const ebitda = ingresosTotales - egresosTotales;
        
        const fInicio = new Date(document.getElementById("fInicio").value);
        const fFin = new Date(document.getElementById("fFin").value);
        const diasPeriodo = Math.ceil(Math.abs(fFin - fInicio) / (1000 * 60 * 60 * 24)) || 30;

        const burnRateDiario = egresosTotales / diasPeriodo;
        const runway = burnRateDiario > 0 && ebitda > 0 ? Math.floor(ebitda / burnRateDiario) : 0;

        const runwayDom = document.getElementById("runway-days");
        if(runwayDom) {
            runwayDom.innerText = burnRateDiario === 0 && ebitda > 0 ? "∞" : runway;
            runwayDom.className = "text-6xl font-black orbitron " + (runway < 10 ? "text-red-500" : (runway < 20 ? "text-amber-500" : "text-emerald-400"));
        }
        
        if(document.getElementById("burn-rate-val")) {
            document.getElementById("burn-rate-val").innerText = `$${Math.round(burnRateDiario).toLocaleString()}`;
        }

        document.getElementById("kpi-ingreso").innerText = `$${ingresosTotales.toLocaleString()}`;
        document.getElementById("kpi-rampa").innerText = `$${balancePUC.cartera_rampa.toLocaleString()}`;
        document.getElementById("kpi-gasto").innerText = `$${egresosTotales.toLocaleString()}`;
        document.getElementById("kpi-stock").innerText = `$${balancePUC.stock_bodega.toLocaleString()}`;
        document.getElementById("txtUtilidad").innerText = `$${ebitda.toLocaleString()}`;
        
        const diagnosticDom = document.getElementById("ai-diagnostico");
        if (diagnosticDom) {
            diagnosticDom.innerText = ebitda > 0 ? 
                `ESTADO NOMINAL: Estructura de resultados saludable. Cuentas con ${runway} días de autonomía de caja. Se aconseja agilizar la liquidación de órdenes listas en patio para transformar la rampa ($${balancePUC.cartera_rampa.toLocaleString()}) en efectivo disponible.` :
                `ALERTA FORENSE: Déficit operacional en el rango seleccionado. Tu costo fijo y operacional diario es de $${Math.round(burnRateDiario).toLocaleString()}. Es imperativo frenar la compra de stock y saneamiento de cartera inmediata.`;
        }

        if (chartTermometro) {
            chartTermometro.data.datasets[0].data = [balancePUC.gastos_fijos + balancePUC.gastos_diver, balancePUC.costos_nomina + balancePUC.costos_rep, Math.max(0, ebitda)];
            chartTermometro.update();
        }
    };

    const renderNomina = (data) => {
        const containerNomina = document.getElementById("gridNomina");
        if(!containerNomina) return;
        
        if (Object.keys(data).length === 0) {
            containerNomina.innerHTML = `
                <div class="col-span-full text-center py-6 text-xs text-slate-500 font-bold uppercase tracking-wider italic bg-[#0d1117] rounded-xl border border-dashed border-white/10">
                    Sin comisiones registradas en el rango de fechas actual.
                </div>`;
            return;
        }

        containerNomina.innerHTML = Object.entries(data).map(([tecnico, s]) => `
            <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-emerald-500/10 flex justify-between items-center">
                <div>
                    <h4 class="text-xs font-black uppercase text-white truncate max-w-[130px]">${tecnico}</h4>
                    <p class="text-[8px] orbitron text-slate-500 uppercase font-bold mt-0.5">${s.count} OT Liquidadas</p>
                </div>
                <div class="text-right">
                    <p class="text-base font-black orbitron text-emerald-400">$${Math.round(s.total).toLocaleString()}</p>
                </div>
            </div>`).join('');
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

        // Banner Estilo Nexus Gerencial
        doc.setFillColor(1, 4, 9); doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(6, 182, 212); doc.setFont("Helvetica", "Bold"); doc.setFontSize(14);
        doc.text("NEXUS-X FINANCIAL INTELLIGENCE COMMAND", 15, 16);

        doc.setTextColor(15, 23, 42); doc.setFontSize(16); doc.text("ESTADO DE RESULTADOS INTEGRAL (PUC)", 15, 40);
        
        doc.setFontSize(9); doc.setTextColor(100, 116, 139);
        doc.text(`ID Taller: ${empresaId}`, 15, 48);
        doc.text(`Rango de Auditoría: ${document.getElementById("fInicio").value} / ${document.getElementById("fFin").value}`, 15, 53);

        doc.setDrawColor(226, 232, 240); doc.line(15, 58, 195, 58);

        // Estructuración Detallada de Cuentas PUC Reales
        const lineasReporte = [
            ["CÓDIGO PUC", "ESTRUCTURA DE CUENTA", "VALOR BALANCE"],
            ["413505", "Ingresos por Mano de Obra (Servicios)", `$ ${balancePUC.ingresos_mo.toLocaleString()}`],
            ["413510", "Ingresos por Venta de Repuestos", `$ ${balancePUC.ingresos_rep.toLocaleString()}`],
            ["2805", "Anticipos y Saneamientos Recibidos", `$ ${balancePUC.ingresos_ant.toLocaleString()}`],
            ["", "TOTAL INGRESO BRUTO OPERACIONAL", `$ ${ingresosTotales.toLocaleString()}`],
            ["6135", "Costo de Venta (Adquisición de Repuestos/Insumos)", `$ ${balancePUC.costos_rep.toLocaleString()}`],
            ["5105", "Gastos de Personal (Nómina Pasiva Técnicos)", `$ ${balancePUC.costos_nomina.toLocaleString()}`],
            ["5120/5135", "Gastos Fijos Operacionales (Arriendos/Servicios)", `$ ${balancePUC.gastos_fijos.toLocaleString()}`],
            ["5195", "Gastos Diversos y Ajustes", `$ ${balancePUC.gastos_diver.toLocaleString()}`],
            ["", "TOTAL COSTOS Y GASTOS OPERATIVOS", `$ ${egresosTotales.toLocaleString()}`],
            ["UTILIDAD", "EBITDA REAL DEL PERIODO", `$ ${ebitda.toLocaleString()}`],
            ["1305", "Cuentas por Cobrar (Activos en Rampa)", `$ ${balancePUC.cartera_rampa.toLocaleString()}`],
            ["1435", "Inventario Físico Real de Repuestos", `$ ${balancePUC.stock_bodega.toLocaleString()}`]
        ];

        let y = 70;
        lineasReporte.forEach((fila, idx) => {
            if (idx === 0) {
                doc.setFont("Helvetica", "Bold"); doc.setTextColor(15, 23, 42); doc.setFontSize(10);
            } else if ([4, 9, 10].includes(idx)) {
                doc.setFont("Helvetica", "Bold"); doc.setTextColor(6, 182, 212); doc.setFontSize(10);
            } else {
                doc.setFont("Helvetica", "Normal"); doc.setTextColor(51, 65, 85); doc.setFontSize(9);
            }
            doc.text(fila[0], 16, y); doc.text(fila[1], 45, y); doc.text(fila[2], 160, y);
            doc.line(15, y + 3, 195, y + 3);
            y += 10;
        });

        // Bloque de Autenticación Gerencial
        y += 15;
        doc.setFont("Helvetica", "Bold"); doc.setTextColor(15, 23, 42); doc.setFontSize(11);
        doc.text("CERTIFICACIÓN DE FIRMA CORPORATIVA", 15, y);
        doc.line(15, y + 15, 85, y + 15);
        doc.setFont("Helvetica", "Normal"); doc.setFontSize(8); doc.text("William Jeffry Urquijo Cubillos // Director de Operaciones", 15, y + 20);

        doc.save(`Estado_Resultados_PRO360_${empresaId}.pdf`);
    }

    async function exportarExcelForense() {
        const datos = [
            { Cuenta: "413505", Descripcion: "Mano de Obra", Balance: balancePUC.ingresos_mo },
            { Cuenta: "413510", Descripcion: "Venta Repuestos", Balance: balancePUC.ingresos_rep },
            { Cuenta: "2805", Descripcion: "Anticipos Clientes", Balance: balancePUC.ingresos_ant },
            { Cuenta: "6135", Descripcion: "Costo de Adquisición de Repuestos", Balance: balancePUC.costos_rep },
            { Cuenta: "5105", Descripcion: "Nómina de Técnicos (Comisiones)", Balance: balancePUC.costos_nomina },
            { Cuenta: "5120/35", Descripcion: "Gastos Fijos", Balance: balancePUC.gastos_fijos },
            { Cuenta: "5195", Descripcion: "Gastos Diversos", Balance: balancePUC.gastos_diver },
            { Cuenta: "1305", Descripcion: "Cartera en Rampa", Balance: balancePUC.cartera_rampa },
            { Cuenta: "1435", Descripcion: "Inventario Bodega", Balance: balancePUC.stock_bodega }
        ];
        const ws = window.XLSX.utils.json_to_sheet(datos);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "PUC Real");
        window.XLSX.writeFile(wb, `Reporte_Forense_${empresaId}.xlsx`);
    }

    await renderLayout();
}
