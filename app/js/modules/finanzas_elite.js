/**
 * 🦾 NEXUS-X TERMINATOR CORE V20.0 - FINANZAS ELITE
 * Central de Inteligencia Financiera & Auditoría PUC
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, getDocs, onSnapshot, orderBy, startAt, endAt 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzasElite(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let activeListeners = [];
    
    // Estado Global del Módulo
    let estadoFinanciero = { 
        ingresos: 0, gastos: 0, utilidad: 0,
        enRampa: 0, fuga: 0, stock: 0,
        periodoActual: "Mes en curso",
        ordenes: [], transacciones: []
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in zoom-in duration-500 pb-40 bg-[#010409] min-h-screen text-white font-sans">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 border-b border-white/5 pb-10 gap-8">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1.5 bg-cyan-500 shadow-[0_0_20px_#06b6d4]"></div>
                    <h1 class="orbitron text-5xl font-black italic tracking-tighter uppercase leading-none">
                        FINANZAS <span class="text-cyan-400">ELITE</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Auditoría PUC // Protocolo de Liquidez Nexus-X</p>
                </div>
                
                <div class="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div class="flex flex-col px-4">
                        <label class="text-[8px] orbitron text-cyan-500 font-black uppercase mb-1">Periodo de Auditoría</label>
                        <div class="flex gap-2">
                            <input type="date" id="fechaInicio" class="bg-transparent border-none text-xs font-bold focus:ring-0 text-white cursor-pointer">
                            <span class="text-slate-600">-</span>
                            <input type="date" id="fechaFin" class="bg-transparent border-none text-xs font-bold focus:ring-0 text-white cursor-pointer">
                        </div>
                    </div>
                    <button id="btnFiltrar" class="p-4 bg-cyan-500 text-black rounded-2xl hover:bg-white transition-all transform active:scale-90">
                        <i class="fas fa-filter"></i>
                    </button>
                    <button id="btnExportarAuditoria" class="group px-8 py-4 bg-white text-black rounded-2xl flex items-center gap-4 hover:bg-emerald-500 hover:text-white transition-all duration-500">
                        <i class="fas fa-file-invoice-dollar text-xl"></i>
                        <span class="orbitron text-[10px] font-black uppercase tracking-widest">Descargar Balance P&G</span>
                    </button>
                </div>
            </header>

            <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"></div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                <div class="lg:col-span-2 bg-[#0d1117] border border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden group">
                     <div class="absolute -right-10 -bottom-10 opacity-5 text-9xl italic font-black orbitron">PUC</div>
                     <div class="flex items-start gap-8 relative z-10">
                        <div class="w-24 h-24 bg-cyan-500 text-black rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="flex-1">
                            <h5 class="text-[12px] font-black uppercase text-cyan-400 mb-4 orbitron tracking-[0.3em]">Análisis de Liquidez Predictiva</h5>
                            <p id="txtConsejo" class="text-xl text-slate-300 leading-relaxed font-medium italic mb-6">Analizando flujos de caja y pasivos circulantes...</p>
                            <div class="flex gap-6">
                                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 flex-1 text-center">
                                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Utilidad Neta</p>
                                    <p id="txtUtilidad" class="text-2xl font-black text-emerald-400 orbitron">$ 0</p>
                                </div>
                                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 flex-1 text-center">
                                    <p class="text-[8px] text-slate-500 orbitron uppercase mb-1">Punto de Equilibrio</p>
                                    <p id="txtEquilibrio" class="text-2xl font-black text-white orbitron">Calculando...</p>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>

                <div class="bg-[#0d1117] border border-red-500/20 rounded-[3.5rem] p-10">
                    <h3 class="orbitron text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <i class="fas fa-radiation"></i> Fuga de Capital (Alertas)
                    </h3>
                    <div id="listFuga" class="space-y-4 max-h-[250px] overflow-y-auto pr-4"></div>
                </div>
            </div>

            <div class="mb-10 flex items-center justify-between">
                <h3 class="text-[12px] font-black text-white uppercase tracking-[0.5em] orbitron italic">Unidades en Proceso <span class="text-cyan-500">[Cuentas por Cobrar Proyectadas]</span></h3>
                <div id="rampaCount" class="px-6 py-2 bg-white/5 border border-white/10 rounded-full orbitron text-[10px] font-black text-cyan-400">0 Misiones</div>
            </div>
            <div id="gridRampa" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
        </div>`;

        // Asignar Eventos
        document.getElementById("btnFiltrar").onclick = () => sincronizarNucleo(true);
        document.getElementById("btnExportarAuditoria").onclick = exportarBalanceDetallado;
        
        // Establecer fechas por defecto (Mes actual)
        const hoy = new Date();
        document.getElementById("fechaInicio").value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById("fechaFin").value = hoy.toISOString().split('T')[0];

        sincronizarNucleo();
    };

    const sincronizarNucleo = async (esFiltro = false) => {
        activeListeners.forEach(unsub => unsub());
        
        const fInicio = document.getElementById("fechaInicio").value;
        const fFin = document.getElementById("fechaFin").value;

        // Reset data local
        estadoFinanciero.ingresos = 0;
        estadoFinanciero.gastos = 0;
        estadoFinanciero.enRampa = 0;
        estadoFinanciero.fuga = 0;

        // 🟢 1. CONTABILIDAD (PUC: Ingresos/Gastos)
        const qCont = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
        const snapCont = await getDocs(qCont);
        estadoFinanciero.transacciones = snapCont.docs.map(d => d.data());
        
        estadoFinanciero.transacciones.forEach(t => {
            const fecha = t.fecha?.toDate ? t.fecha.toDate().toISOString().split('T')[0] : t.fecha;
            if (fecha >= fInicio && fecha <= fFin) {
                if (t.tipo?.toLowerCase() === 'ingreso') estadoFinanciero.ingresos += Number(t.monto || 0);
                else estadoFinanciero.gastos += Number(t.monto || 0);
            }
        });

        // 🔧 2. ORDENES (Cuentas por Cobrar & Fuga)
        const qOrd = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        activeListeners.push(onSnapshot(qOrd, (snap) => {
            estadoFinanciero.ordenes = snap.docs.map(d => ({id: d.id, ...d.data()}));
            procesarUI();
        }));

        // 📦 3. INVENTARIO (Activos)
        const qInv = query(collection(db, "inventario"), where("empresaId", "==", empresaId));
        const snapInv = await getDocs(qInv);
        let stockValor = 0;
        snapInv.docs.forEach(d => {
            const i = d.data();
            if(i.origen === "PROPIO") stockValor += (Number(i.precioVenta || 0) * Number(i.cantidad || 0));
        });
        estadoFinanciero.stock = stockValor;
        
        if(!esFiltro) procesarUI();
    };

    const procesarUI = () => {
        const d = estadoFinanciero;
        let rampaHTML = ""; let fugaHTML = "";
        d.enRampa = 0; d.fuga = 0;
        
        // Filtrado de misiones activas
        const activas = d.ordenes.filter(o => ['EN_TALLER', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado));
        activas.forEach(o => {
            const subtotal = Number(o.costos_totales?.total_general || o.total || 0);
            d.enRampa += subtotal;
            rampaHTML += `
            <div class="bg-[#0d1117] p-8 rounded-[2rem] border border-white/5 hover:border-cyan-500/30 transition-all group">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full orbitron font-black uppercase">${o.estado}</span>
                </div>
                <h4 class="text-white font-black text-sm uppercase truncate mb-1">${o.cliente}</h4>
                <p class="text-[10px] text-slate-500 font-bold mb-4 orbitron tracking-widest">${o.placa || 'PLACA N/A'}</p>
                <div class="flex justify-between items-end border-t border-white/5 pt-4">
                    <div class="text-xl font-black text-white orbitron tabular-nums">$${subtotal.toLocaleString()}</div>
                </div>
            </div>`;
        });

        // Procesar fugas
        d.ordenes.filter(o => o.estado === 'CANCELADO').forEach(o => {
            const valor = Number(o.costos_totales?.total_general || o.total || 0);
            d.fuga += valor;
            fugaHTML += `
            <div class="flex justify-between items-center p-4 bg-red-500/5 border-b border-red-500/10 rounded-xl">
                <div>
                    <p class="text-[9px] font-black text-white orbitron">${o.placa}</p>
                    <p class="text-[8px] text-slate-500 uppercase">${o.cliente}</p>
                </div>
                <span class="text-red-500 font-black orbitron text-xs">-$${valor.toLocaleString()}</span>
            </div>`;
        });

        document.getElementById("gridRampa").innerHTML = rampaHTML || `<div class="col-span-full py-20 opacity-20 text-center orbitron text-[10px] uppercase tracking-[1em]">Zona Despejada</div>`;
        document.getElementById("listFuga").innerHTML = fugaHTML || `<p class="text-[8px] text-slate-600 uppercase text-center py-10">No se detectan fugas críticas</p>`;
        document.getElementById("rampaCount").innerText = `${activas.length} Misiones en Rampa`;

        actualizarKPIs();
    };

    const actualizarKPIs = () => {
        const d = estadoFinanciero;
        const utilidad = d.ingresos - d.gastos;
        const roiStock = d.stock > 0 ? (utilidad / d.stock) * 100 : 0;

        document.getElementById("kpiGrid").innerHTML = `
            ${renderStatBox("Flujo de Caja (Ingresos)", d.ingresos, "fa-vault", "text-emerald-400")}
            ${renderStatBox("Cuentas x Cobrar (Rampa)", d.enRampa, "fa-screwdriver-wrench", "text-cyan-400")}
            ${renderStatBox("Gasto Operativo", d.gastos, "fa-money-bill-trend-up", "text-red-400")}
            ${renderStatBox("Activos de Bóveda", d.stock, "fa-box-open", "text-blue-400")}
        `;

        document.getElementById("txtUtilidad").innerText = `$ ${utilidad.toLocaleString()}`;
        document.getElementById("txtEquilibrio").innerText = `$ ${(d.gastos * 1.25).toLocaleString()}`; // Meta del 25% de utilidad

        const consejo = document.getElementById("txtConsejo");
        if (utilidad < 0) {
            consejo.innerHTML = `<span class="text-red-500 font-black uppercase">Déficit Detectado:</span> Los gastos superan los ingresos reales. <span class="text-white">Acción:</span> Ejecuta cobro inmediato de misiones en rampa para equilibrar la balanza.`;
        } else if (d.enRampa > d.ingresos) {
            consejo.innerHTML = `<span class="text-cyan-400 font-black uppercase">Alerta de Facturación:</span> El capital atrapado en taller supera tu liquidez. <span class="text-white">Estrategia:</span> Prioriza entregas de alto ticket para inyectar flujo.`;
        } else {
            consejo.innerHTML = `<span class="text-emerald-400 font-black uppercase">Optimización Lograda:</span> Tienes una salud financiera estable. <span class="text-white">Recomendación:</span> Invierte en <span class="text-cyan-400">Repuestos de Alta Rotación</span> para mover el ROI del stock.`;
        }
    };

    const renderStatBox = (title, val, icon, colorClass) => `
        <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <i class="fas ${icon} text-slate-500 group-hover:${colorClass} transition-colors"></i>
                </div>
                <h6 class="text-[9px] orbitron font-black text-slate-500 uppercase tracking-widest">${title}</h6>
            </div>
            <p class="text-3xl font-black orbitron tracking-tighter ${colorClass}">$ ${val.toLocaleString()}</p>
        </div>`;

    async function exportarBalanceDetallado() {
        Swal.fire({
            title: 'GENERANDO BALANCE ELITE',
            html: '<p class="orbitron text-[10px] text-cyan-500">Compilando PUC y Auditoría de Activos...</p>',
            background: '#010409',
            color: '#fff',
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
                const { doc } = window.jspdf;
                const pdf = new jspdf.jsPDF();
                const d = estadoFinanciero;

                // Diseño Estilo Nexus-X
                pdf.setFillColor(1, 4, 9);
                pdf.rect(0, 0, 210, 297, 'F');
                
                pdf.setTextColor(6, 182, 212);
                pdf.setFontSize(22);
                pdf.text("ESTADO DE RESULTADOS - NEXUS-X ELITE", 15, 25);
                
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.text(`PERIODO: ${document.getElementById("fechaInicio").value} AL ${document.getElementById("fechaFin").value}`, 15, 35);
                pdf.text(`EMPRESA ID: ${empresaId}`, 15, 40);

                // Tabla de KPIs
                const resumen = [
                    ["CUENTA PUC", "DETALLE", "VALOR"],
                    ["4135", "INGRESOS OPERACIONALES (CAJA)", `$ ${d.ingresos.toLocaleString()}`],
                    ["1305", "CLIENTES (EN RAMPA)", `$ ${d.enRampa.toLocaleString()}`],
                    ["5105", "GASTOS OPERATIVOS", `$ ${d.gastos.toLocaleString()}`],
                    ["1435", "INVENTARIO (STOCK)", `$ ${d.stock.toLocaleString()}`],
                    ["----", "UTILIDAD NETA PROYECTADA", `$ ${(d.ingresos + d.enRampa - d.gastos).toLocaleString()}`]
                ];

                pdf.autoTable({
                    startY: 50,
                    head: [resumen[0]],
                    body: resumen.slice(1),
                    theme: 'grid',
                    headStyles: { fillColor: [6, 182, 212], textColor: [0, 0, 0], fontStyle: 'bold' },
                    bodyStyles: { fillColor: [13, 17, 23], textColor: [255, 255, 255] },
                    alternateRowStyles: { fillColor: [20, 25, 35] }
                });

                // Auditoría de Fugas
                const fugas = d.ordenes.filter(o => o.estado === 'CANCELADO').map(o => [o.placa, o.cliente, `$ ${(o.costos_totales?.total_general || 0).toLocaleString()}`]);
                if(fugas.length > 0) {
                    pdf.setTextColor(239, 68, 68);
                    pdf.text("ALERTA: FUGAS DE CAPITAL DETECTADAS", 15, pdf.lastAutoTable.finalY + 15);
                    pdf.autoTable({
                        startY: pdf.lastAutoTable.finalY + 20,
                        head: [["PLACA", "CLIENTE", "VALOR PERDIDO"]],
                        body: fugas,
                        theme: 'striped',
                        headStyles: { fillColor: [239, 68, 68] }
                    });
                }

                setTimeout(() => {
                    pdf.save(`Balance_Elite_NexusX_${empresaId}.pdf`);
                    Swal.close();
                    Swal.fire({ icon: 'success', title: 'INFORME GENERADO', background: '#0d1117', color: '#fff' });
                }, 1000);
            }
        });
    }

    renderLayout();
}
