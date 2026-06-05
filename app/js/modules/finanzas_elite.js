/**
 * 🦾 NEXUS-X TERMINATOR CORE V22.6 - FINANZAS ELITE
 * ESTRATEGIA: QUANTUM-SAP 2030 VISUAL AUDIT + PREDICTIVE BURN-RATE + ENLACE CONTABLE PERFECTO
 * OBJETIVO: Dashboards de Combustible Financiero + Autonomía de Caja + Reporte PDF Corporativo
 * Director: William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, getDocs, onSnapshot, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

const loadNexusDep = (id, src) => new Promise(res => {
    if (window[id]) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; document.head.appendChild(s);
});

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let chartTermometro = null;
    let activeListeners = [];
    
    // Dataset unificado con el Plan Único de Cuentas (PUC)
    let dbData = { 
        ingresos: 0,  // Cuenta 1105 / 1110
        gastos: 0,    // Cuenta 51 / 52
        comisiones: 0,// Cuenta 5105 (Pasivo Laboral / Costo Operacional)
        rampa: 0,     // Cuenta 1305 (Cuentas por Cobrar Órdenes Activas)
        stock: 0,     // Cuenta 1435 (Inventario Repuestos)
        burnRate: 0,
        runway: 0
    };

    const renderLayout = async () => {
        await Promise.all([
            loadNexusDep('Chart', "https://cdn.jsdelivr.net/npm/chart.js"),
            loadNexusDep('jspdf', "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
            loadNexusDep('XLSX', "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js")
        ]);

        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in duration-1000 pb-40 bg-[#010409] min-h-screen text-white font-sans selection:bg-cyan-500">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 border-b-2 border-cyan-500/20 pb-10 gap-8 relative">
                <div class="absolute -top-10 left-0 text-[120px] font-black opacity-5 italic select-none orbitron uppercase">Elite</div>
                <div class="relative z-10">
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] orbitron mt-4 flex items-center gap-2">
                        <span class="w-2 h-2 bg-cyan-500 animate-pulse rounded-full"></span> 
                        Quantum-SAP Auditor // Authorized by W.J. Urquijo
                    </p>
                </div>
                
                <div class="flex flex-wrap gap-3 items-center bg-[#0d1117] p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div class="flex gap-4 px-4 border-r border-white/10">
                        <div class="flex flex-col">
                            <label class="text-[8px] orbitron text-cyan-500 font-black mb-1 italic">SINCRO_INICIO</label>
                            <input type="date" id="fInicio" class="bg-transparent text-xs font-bold text-white outline-none border border-white/10 p-1.5 rounded-lg">
                        </div>
                        <div class="flex flex-col">
                            <label class="text-[8px] orbitron text-cyan-500 font-black mb-1 italic">SINCRO_FINAL</label>
                            <input type="date" id="fFin" class="bg-transparent text-xs font-bold text-white outline-none border border-white/10 p-1.5 rounded-lg">
                        </div>
                    </div>
                    <button id="btnPDF" class="px-6 py-4 bg-white text-black rounded-2xl flex items-center gap-3 hover:bg-cyan-400 transition-all font-black group">
                        <i class="fas fa-file-pdf group-hover:scale-125 transition-transform text-red-600"></i>
                        <span class="orbitron text-[9px] uppercase tracking-wider">Brief Ejecutivo</span>
                    </button>
                    <button id="btnXLS" class="w-14 h-14 bg-[#0d1117] border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all shadow-lg">
                        <i class="fas fa-file-excel"></i>
                    </button>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                <div class="lg:col-span-5 flex flex-col gap-8">
                    <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
                        <h3 class="orbitron text-[11px] font-black text-cyan-400 uppercase mb-8 tracking-widest italic w-full text-left">Combustible Operativo</h3>
                        <div class="relative w-full h-[280px]">
                            <canvas id="chartTermometro"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
                                <span id="txtUtilidad" class="text-3xl font-black orbitron text-white">$0</span>
                                <span class="text-[8px] orbitron text-slate-500 uppercase tracking-widest mt-1">Utilidad Neta Periodo</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#0d1117] border-t-4 border-red-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div class="flex justify-between items-start mb-4">
                            <h4 class="orbitron text-[10px] font-black text-red-500 uppercase tracking-widest italic">Autonomía Operativa (Runway)</h4>
                            <i class="fas fa-hourglass-half text-red-500/20 group-hover:animate-spin"></i>
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
                        <div class="absolute top-4 right-8 text-3xl opacity-20 group-hover:rotate-12 transition-transform text-cyan-400"><i class="fas fa-brain"></i></div>
                        <h4 class="orbitron font-black text-[10px] uppercase mb-3 italic tracking-widest text-cyan-400">Nexus-AI Strategic Insight</h4>
                        <p id="ai-diagnostico" class="text-base font-medium leading-relaxed italic border-l-2 border-cyan-500/40 pl-4 text-slate-200">Iniciando escaneo de rampa y flujos contables cruzados...</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderKPI("Disponible / Recaudo (1105-1110)", "kpi-ingreso", "text-emerald-400", "fa-wallet")}
                        ${renderKPI("Operación en Rampa (1305)", "kpi-rampa", "text-cyan-400", "fa-car-crash")}
                        ${renderKPI("Gastos & Costos Realizados (5)", "kpi-gasto", "text-red-400", "fa-file-invoice-dollar")}
                        ${renderKPI("Valor de Stock Activo (1435)", "kpi-stock", "text-amber-400", "fa-box-open")}
                    </div>
                </div>
            </div>

            <div class="mb-12 border-l-4 border-emerald-500 pl-8">
                <h3 class="text-[16px] font-black text-white uppercase tracking-[0.6em] orbitron italic">Performance <span class="text-emerald-500">& Nómina Pasiva</span></h3>
                <div id="gridNomina" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"></div>
            </div>

        </div>`;
        
        setupEvents();
        initTermometro();
        
        // En lugar de limitar al mes actual al cargar por primera vez...
// Le damos al administrador una vista inicial de los últimos 120 días por defecto
const date = new Date();
const fInicio = new Date(date.getTime() - (120 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]; // 120 días atrás
const fFin = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

document.getElementById("fInicio").value = fInicio;
document.getElementById("fFin").value = fFin;

        sincronizarNucleo();
    };

    const renderKPI = (label, id, color, icon) => `
        <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-cyan-500/20 transition-all">
            <div>
                <p class="text-[8px] orbitron text-slate-500 uppercase font-black mb-1">${label}</p>
                <h2 id="${id}" class="text-xl font-black orbitron ${color}">$0</h2>
            </div>
            <i class="fas ${icon} text-slate-800 group-hover:${color} text-xl transition-all"></i>
        </div>`;

    const initTermometro = () => {
        const ctx = document.getElementById('chartTermometro').getContext('2d');
        chartTermometro = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Gastos Fijos', 'Costo Operacional/Nómina', 'Utilidad Operativa'],
                datasets: [{
                    data: [1, 1, 1],
                    backgroundColor: ['#ef4444', '#f59e0b', '#06b6d4'],
                    borderWidth: 0,
                    cutout: '83%'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                animation: { animateScale: true }
            }
        });
    };

    const sincronizarNucleo = async () => {
        // Remover listeners anteriores para evitar fugas de memoria por re-suscripción
        activeListeners.forEach(unsub => unsub());
        activeListeners = [];

        const strInicio = document.getElementById("fInicio").value;
        const strFin = document.getElementById("fFin").value;
        
        const timestampInicio = Timestamp.fromDate(new Date(strInicio + "T00:00:00"));
        const timestampFin = Timestamp.fromDate(new Date(strFin + "T23:59:59"));

        // 1. ESCANEO QUIRÚRGICO DE CONTABILIDAD (PUC cruzado por fechas)
        const coleccionContable = NEXUS_CONFIG?.COLLECTIONS?.ACCOUNTING || "accounting";
        const qCont = query(
            collection(db, coleccionContable), 
            where("empresaId", "==", empresaId),
            where("fecha", ">=", timestampInicio),
            where("fecha", "<=", timestampFin)
        );

        try {
            const snapCont = await getDocs(qCont);
            dbData.ingresos = 0; dbData.gastos = 0; dbData.stock = 0;

            snapCont.docs.forEach(d => {
                const item = d.data();
                const monto = Number(item.monto || item.valor || 0);
                const cuenta = item.cuenta || item.puc || "";

                // Clasificación estricta por estructura del Plan Único de Cuentas (PUC)
                if (cuenta.startsWith("11") || ["ingreso_ot", "venta_repuestos"].includes(item.tipo)) {
                    dbData.ingresos += monto;
                } else if (cuenta.startsWith("5") || ["gasto_operativo", "pago_nomina"].includes(item.tipo)) {
                    dbData.gastos += monto;
                } else if (cuenta.startsWith("14") || ["compra_repuestos", "inventario"].includes(item.tipo)) {
                    dbData.stock += monto;
                }
            });
        } catch (err) {
            console.error("Error cargando auditoría contable cruzada:", err);
        }

        // 2. ESCANEO EN TIEMPO REAL DE LA TRÁNSITO/RAMPA MECÁNICA (Órdenes)
        const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const unsubOrd = onSnapshot(qOrd, (snap) => {
            dbData.rampa = 0; 
            dbData.comisiones = 0;
            const nominaMap = {};
            
            snap.docs.forEach(d => {
                const o = d.data();
                const totalOrden = Number(o.costos_totales?.total || o.total || 0);
                
                // Cuentas por cobrar en proceso de rampa
                if (['INGRESO', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado)) {
                    dbData.rampa += totalOrden;
                }
                
                // Consolidación de liquidaciones de nómina de órdenes cerradas o listas en el rango
                if (['LISTO', 'ENTREGADO'].includes(o.estado)) {
                    let cumpleFecha = true;
                    if (o.fecha_cierre || o.fecha) {
                        const fOrd = o.fecha_cierre ? new Date(o.fecha_cierre) : o.fecha.toDate();
                        cumpleFecha = fOrd >= timestampInicio.toDate() && fOrd <= timestampFin.toDate();
                    }

                    if (cumpleFecha) {
                        const tecnico = o.tecnico_asignado || o.tecnico || "TÉCNICO_NO_ASIGNADO";
                        // Extraer porcentaje dinámico del taller o aplicar factor estándar del 30%
                        const pctComision = Number(o.porcentaje_tecnico || 30) / 100;
                        
                        const itemsServicio = o.items || o.servicios || [];
                        const baseManoObra = itemsServicio
                            .filter(i => i.tipo === 'SERVICIO' || i.categoria === 'mano_obra')
                            .reduce((acc, i) => acc + (Number(i.venta || i.precio || 0) * Number(i.cantidad || 1)), 0);
                        
                        const comisionCalculada = baseManoObra * pctComision;
                        dbData.comisiones += comisionCalculada;

                        if (!nominaMap[tecnico]) nominaMap[tecnico] = { total: 0, q: 0 };
                        nominaMap[tecnico].total += comisionCalculada; 
                        nominaMap[tecnico].q += 1;
                    }
                }
            });
            renderNomina(nominaMap);
            updateUI();
        });
        activeListeners.push(unsubOrd);
    };

    const updateUI = () => {
        const utilidadNeta = dbData.ingresos - dbData.gastos - dbData.comisiones;
        
        // --- MÉTRICA PREDICTIVA DE BURN-RATE ---
        const fInicio = new Date(document.getElementById("fInicio").value);
        const fFin = new Date(document.getElementById("fFin").value);
        const diffTime = Math.abs(fFin - fInicio);
        const diasPeriodo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;

        const burnRateDiario = dbData.gastos / diasPeriodo;
        const diasSupervivencia = burnRateDiario > 0 && utilidadNeta > 0 ? Math.floor(utilidadNeta / burnRateDiario) : 0;

        // Renderizado del Componente de Supervivencia de Caja
        const runwayDom = document.getElementById("runway-days");
        if(runwayDom) {
            runwayDom.innerText = burnRateDiario === 0 && utilidadNeta > 0 ? "∞" : diasSupervivencia;
            runwayDom.className = "text-6xl font-black orbitron transition-colors " + 
                (diasSupervivencia < 10 ? "text-red-500" : (diasSupervivencia < 20 ? "text-amber-500" : "text-emerald-400"));
        }
        
        const burnRateDom = document.getElementById("burn-rate-val");
        if(burnRateDom) burnRateDom.innerText = `$${Math.round(burnRateDiario).toLocaleString()}`;

        // Inyección de Valores en Tarjetas KPI
        document.getElementById("kpi-ingreso").innerText = `$${dbData.ingresos.toLocaleString()}`;
        document.getElementById("kpi-rampa").innerText = `$${dbData.rampa.toLocaleString()}`;
        document.getElementById("kpi-gasto").innerText = `$${dbData.gastos.toLocaleString()}`;
        document.getElementById("kpi-stock").innerText = `$${dbData.stock.toLocaleString()}`;
        document.getElementById("txtUtilidad").innerText = `$${utilidadNeta.toLocaleString()}`;
        
        // Motor de Diagnóstico Financiero Proactivo AI
        const aiMsg = utilidadNeta > 0 ? 
            `ESTADO NOMINAL: Margen operacional del periodo saludable. Cuentas con ${diasSupervivencia} días de autonomía de caja. Estrategia sugerida: Ejecutar cobro sobre el 30% de la rampa vehicular activa ($${Math.round(dbData.rampa * 0.3).toLocaleString()}) para aumentar liquidez en el Disponible.` :
            `ALERTA CRÍTICA: Déficit de flujo detectado. El Burn Rate diario de $${Math.round(burnRateDiario).toLocaleString()} está erosionando el balance. Detener compras no esenciales de stock e iniciar saneamiento inmediato de cartera en rampa.`;
        document.getElementById("ai-diagnostico").innerText = aiMsg;

        if (chartTermometro) {
            chartTermometro.data.datasets[0].data = [dbData.gastos, dbData.comisiones, Math.max(0, utilidadNeta)];
            chartTermometro.update();
        }
    };

    const renderNomina = (data) => {
        const containerNomina = document.getElementById("gridNomina");
        if(!containerNomina) return;
        
        if (Object.keys(data).length === 0) {
            containerNomina.innerHTML = `
                <div class="col-span-3 text-center py-6 text-xs text-slate-500 font-bold uppercase tracking-wider italic bg-[#0d1117] rounded-xl border border-dashed border-white/10">
                    Sin comisiones causadas ni órdenes liquidadas en este rango.
                </div>`;
            return;
        }

        containerNomina.innerHTML = Object.entries(data).map(([tecnico, s]) => `
            <div class="bg-[#0d1117] p-6 rounded-[2rem] border border-emerald-500/10 flex justify-between items-center group hover:bg-emerald-500/5 transition-all">
                <div>
                    <h4 class="text-xs font-black uppercase text-white truncate max-w-[140px]">${tecnico}</h4>
                    <p class="text-[8px] orbitron text-slate-500 uppercase font-bold mt-0.5">${s.q} Misiones Listas</p>
                </div>
                <div class="text-right">
                    <p class="text-base font-black orbitron text-emerald-400">$${Math.round(s.total).toLocaleString()}</p>
                    <p class="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Costo Causal Relacionado</p>
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
        const utilidadNeta = dbData.ingresos - dbData.gastos - dbData.comisiones;

        // Estructura Ejecutiva Limpia (Layout corporativo de Alta Gama)
        doc.setFillColor(17, 24, 39); doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont("Helvetica", "Bold"); doc.setFontSize(11);
        doc.text("TallerPRO360 - CONFIGURACIÓN DE INTELIGENCIA FINANCIERA", 15, 13);

        doc.setTextColor(17, 24, 39); doc.setFontSize(20);
        doc.text("ESTADO DE RESULTADOS & TELEMETRÍA DE CAJA", 15, 38);
        
        doc.setFontSize(9); doc.setTextColor(100, 116, 139);
        doc.text(`Identificador de Operación: ${empresaId}`, 15, 46);
        doc.text(`Rango de Auditoría: ${document.getElementById("fInicio").value} hasta ${document.getElementById("fFin").value}`, 15, 51);
        doc.text(`Fecha Impresión: ${new Date().toLocaleString()}`, 15, 56);

        // Tabla Financiera Estructurada
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.5);
        doc.line(15, 62, 195, 62);

        const matrizValores = [
            ["CUENTA PUC", "CONCEPTO DEL EXPEDIENTE", "SALDO BALANCEADO"],
            ["1105 / 1110", "Disponible / Recaudo Efectivo", `$ ${dbData.ingresos.toLocaleString()}`],
            ["51 / 52", "Gastos de Operación Directos", `$ ${dbData.gastos.toLocaleString()}`],
            ["5105", "Pasivo de Nómina / Comisiones Causadas", `$ ${dbData.comisiones.toLocaleString()}`],
            ["--", "UTILIDAD NETA OPERACIONAL", `$ ${utilidadNeta.toLocaleString()}`],
            ["1305", "Capital de Carteras Activas (En Rampa)", `$ ${dbData.rampa.toLocaleString()}`],
            ["1435", "Activos en Repuestos & Insumos (Stock)", `$ ${dbData.stock.toLocaleString()}`]
        ];

        let ejeY = 74;
        matrizValores.forEach((fila, idx) => {
            if(idx === 0) {
                doc.setFont("Helvetica", "Bold"); doc.setTextColor(15, 23, 42);
            } else if(idx === 4) {
                doc.setFont("Helvetica", "Bold"); doc.setTextColor(6, 182, 212); // Destacar utilidad
            } else {
                doc.setFont("Helvetica", "Normal"); doc.setTextColor(51, 65, 85);
            }
            doc.text(fila[0], 18, ejeY);
            doc.text(fila[1], 55, ejeY);
            doc.text(fila[2], 155, ejeY);
            doc.line(15, ejeY + 4, 195, ejeY + 4);
            ejeY += 11;
        });

        // Bloque de Autenticación de Auditoría
        ejeY += 15;
        doc.setFont("Helvetica", "Bold"); doc.setTextColor(15, 23, 42); doc.setFontSize(10);
        doc.text("FIRMA DE AUDITORÍA Y CERTIFICACIÓN DE OPERACIÓN", 15, ejeY);
        doc.setDrawColor(148, 163, 184); doc.line(15, ejeY + 20, 95, ejeY + 20);
        doc.setFont("Helvetica", "Normal"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        doc.text("W.J. Urquijo Cubillos // Systems Architect Director", 15, ejeY + 25);

        doc.save(`Brief_Financiero_Elite_${empresaId}.pdf`);
    }

    async function exportarExcelForense() {
        const dataMatriz = [
            { Cuenta_PUC: "1105/1110", Concepto: "Recaudo Disponible", Balance: dbData.ingresos },
            { Cuenta_PUC: "51/52", Concepto: "Gastos Operativos", Balance: dbData.gastos },
            { Cuenta_PUC: "5105", Concepto: "Costo Nómina (Comisiones)", Balance: dbData.comisiones },
            { Cuenta_PUC: "Efecto P&G", Concepto: "Utilidad Neta del Periodo", Balance: dbData.ingresos - dbData.gastos - dbData.comisiones },
            { Cuenta_PUC: "1305", Concepto: "Operación Activa en Rampa", Balance: dbData.rampa },
            { Cuenta_PUC: "1435", Concepto: "Valor de Inventarios (Stock)", Balance: dbData.stock }
        ];

        const ws = window.XLSX.utils.json_to_sheet(dataMatriz);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Módulo Financiero PUC");
        window.XLSX.writeFile(wb, `Auditoria_Forense_Nexus_${empresaId}.xlsx`);
    }

    renderLayout();
}
