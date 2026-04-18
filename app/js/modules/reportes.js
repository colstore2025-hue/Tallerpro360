/**
 * 🌌 NEXUS-X AERO-LOGISTICS - AUDIT CENTER V21.5
 * 🧠 NÚCLEO DE INTELIGENCIA ESTRATÉGICA & EXPORTACIÓN DINÁMICA
 * 🏗️ SYSTEM: BUSINESS INTELLIGENCE PROTOCOL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

// --- 🚀 CARGA INTELIGENTE DE MOTORES DE EXPORTACIÓN (CDN) ---
if (!window.XLSX) {
    const s1 = document.createElement('script');
    s1.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
    document.head.appendChild(s1);
}
if (!window.jspdf) {
    const s2 = document.createElement('script');
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(s2);
    const s3 = document.createElement('script');
    s3.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js";
    document.head.appendChild(s3);
}

import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nombreEmpresa = localStorage.getItem("nexus_nombreEmpresa") || "MI TALLER";
    
    let cacheOrdenes = [];
    let cacheInventario = [];
    let vistaActual = 'ESTRATEGICO';

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-1000 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-start gap-10 mb-16 border-b border-white/5 pb-12 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="bg-cyan-500 text-[8px] font-black px-3 py-1 rounded-full text-black orbitron animate-pulse">INTEL_CORE_ACTIVE</span>
                        <span class="text-slate-600 text-[8px] orbitron tracking-[0.3em]">NEXUS-X AUDIT V21.5</span>
                    </div>
                    <h1 class="orbitron text-6xl font-black italic tracking-tighter uppercase leading-none">
                        AUDIT <span class="text-cyan-400">CENTER</span>
                    </h1>
                </div>

                <div class="flex flex-wrap gap-4 p-3 bg-[#0d1117]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl z-10">
                    <div class="flex items-center gap-4 px-6 border-r border-white/5">
                        <input type="date" id="f_inicio" class="bg-transparent border-none text-[10px] text-white orbitron font-black uppercase outline-none">
                        <span class="text-slate-700 text-[8px] orbitron">>></span>
                        <input type="date" id="f_fin" class="bg-transparent border-none text-[10px] text-white orbitron font-black uppercase outline-none">
                    </div>
                    <select id="selectVista" class="bg-transparent text-cyan-400 orbitron text-[10px] font-black uppercase px-4 outline-none cursor-pointer">
                        <option value="ESTRATEGICO">📊 Dashboard Estratégico</option>
                        <option value="INVENTARIO">📦 Auditoría de Activos</option>
                    </select>
                    <button id="btnExport" class="px-8 py-3 bg-white text-black rounded-full orbitron text-[9px] font-black hover:bg-cyan-400 transition-all uppercase shadow-lg shadow-white/5">
                        <i class="fas fa-file-export mr-2"></i> Exportar_Misión
                    </button>
                </div>
            </header>

            <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"></div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div class="xl:col-span-2 bg-[#0d1117]/50 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-sm relative">
                    <div class="flex justify-between items-center mb-10">
                        <h2 id="tituloSeccion" class="orbitron text-xl font-black italic text-white uppercase tracking-tighter">Cargando...</h2>
                        <input id="searchReport" placeholder="FILTRAR REGISTROS..." class="bg-black/40 border border-white/5 p-4 px-8 rounded-full orbitron text-[9px] text-white w-64 outline-none focus:border-cyan-500">
                    </div>
                    <div class="overflow-x-auto">
                        <table id="tableReport" class="w-full text-left">
                            <thead id="headReport" class="border-b border-white/5"></thead>
                            <tbody id="bodyReport" class="divide-y divide-white/5 font-medium"></tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-cyan-500/5 rounded-[3rem] border border-cyan-500/10 p-10 relative overflow-hidden h-fit">
                    <div class="absolute top-0 right-0 p-8 opacity-10"><i class="fas fa-brain text-4xl text-cyan-500"></i></div>
                    <h3 class="orbitron text-xs font-black text-cyan-400 mb-8 uppercase tracking-widest">Nexus-X AI Insights</h3>
                    <div id="aiInsights" class="space-y-6"></div>
                </div>
            </div>
        </div>`;

        // Listeners
        document.getElementById("selectVista").onchange = (e) => { vistaActual = e.target.value; procesarYRenderizar(); };
        document.getElementById("f_inicio").onchange = procesarYRenderizar;
        document.getElementById("f_fin").onchange = procesarYRenderizar;
        document.getElementById("searchReport").oninput = procesarYRenderizar;
        document.getElementById("btnExport").onclick = ejecutarExportacion;

        initData();
    };

    const initData = async () => {
        try {
            const [snapOrdenes, snapStock] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)))
            ]);
            cacheOrdenes = snapOrdenes.docs.map(d => ({ id: d.id, ...d.data() }));
            cacheInventario = snapStock.docs.map(d => ({ id: d.id, ...d.data() }));
            procesarYRenderizar();
        } catch (e) { console.error("Critical Failure:", e); }
    };

    const procesarYRenderizar = () => {
        const busqueda = document.getElementById("searchReport").value.toLowerCase();
        const fI = document.getElementById("f_inicio").value;
        const fF = document.getElementById("f_fin").value;

        let dataFiltrada = cacheOrdenes.filter(o => {
            const fecha = o.creadoEn?.toDate ? o.creadoEn.toDate() : null;
            let match = (o.placa?.toLowerCase().includes(busqueda) || o.cliente?.toLowerCase().includes(busqueda));
            if (fI && fecha) match = match && fecha >= new Date(fI + "T00:00:00");
            if (fF && fecha) match = match && fecha <= new Date(fF + "T23:59:59");
            return match;
        });

        renderKPIs(dataFiltrada);
        renderTabla(dataFiltrada);
        generarInsights(dataFiltrada);
    };

    const renderKPIs = (data) => {
        const grid = document.getElementById("kpiGrid");
        const ingresos = data.reduce((acc, o) => acc + (Number(o.costos_totales?.total_general || 0)), 0);
        const valorStock = cacheInventario.reduce((acc, i) => acc + (Number(i.precioVenta || 0) * Number(i.cantidad || 0)), 0);
        
        grid.innerHTML = `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-cyan-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Ingresos Operativos</p>
                <h3 class="orbitron text-2xl font-black text-white">$ ${ingresos.toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-emerald-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Valor en Bóveda</p>
                <h3 class="orbitron text-2xl font-black text-emerald-400">$ ${valorStock.toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-orange-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Misiones Totales</p>
                <h3 class="orbitron text-2xl font-black text-white">${data.length}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-red-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Alertas Stock</p>
                <h3 class="orbitron text-2xl font-black text-red-500">${cacheInventario.filter(i => i.cantidad <= (i.minimo || 0)).length}</h3>
            </div>
        `;
    };

    const renderTabla = (data) => {
        const h = document.getElementById("headReport");
        const b = document.getElementById("bodyReport");
        const t = document.getElementById("tituloSeccion");

        if (vistaActual === 'ESTRATEGICO') {
            t.innerText = "HISTORIAL DE MISIONES";
            h.innerHTML = `<tr class="orbitron text-[8px] text-slate-500 uppercase"><th class="p-6">Fecha</th><th class="p-6">Placa</th><th class="p-6">Cliente</th><th class="p-6 text-right">Total</th></tr>`;
            b.innerHTML = data.map(o => `
                <tr class="hover:bg-white/5 transition-all text-[10px]">
                    <td class="p-6 text-slate-400">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '---'}</td>
                    <td class="p-6 orbitron font-black uppercase text-cyan-400">${o.placa}</td>
                    <td class="p-6 uppercase">${o.cliente}</td>
                    <td class="p-6 text-right font-black">$ ${(o.costos_totales?.total_general || 0).toLocaleString()}</td>
                </tr>`).join("");
        } else {
            t.innerText = "INVENTARIO DE ACTIVOS";
            h.innerHTML = `<tr class="orbitron text-[8px] text-slate-500 uppercase"><th class="p-6">Nombre</th><th class="p-6">Marca</th><th class="p-6 text-center">Stock</th><th class="p-6 text-right">Precio Venta</th></tr>`;
            b.innerHTML = cacheInventario.map(i => `
                <tr class="hover:bg-white/5 transition-all text-[10px]">
                    <td class="p-6 font-black uppercase">${i.nombre}</td>
                    <td class="p-6 text-slate-400 uppercase">${i.marca || 'N/A'}</td>
                    <td class="p-6 text-center">${i.cantidad}</td>
                    <td class="p-6 text-right font-black text-emerald-400">$ ${Number(i.precioVenta || 0).toLocaleString()}</td>
                </tr>`).join("");
        }
    };

    const generarInsights = (data) => {
        const container = document.getElementById("aiInsights");
        const faltantes = cacheInventario.filter(i => i.cantidad <= (i.minimo || 0)).length;

        container.innerHTML = `
            <div class="p-6 bg-black/40 rounded-2xl border border-white/5 mb-4">
                <p class="text-[10px] font-black text-cyan-400 uppercase orbitron mb-2">Resumen Operativo</p>
                <p class="text-[10px] text-slate-400 italic leading-relaxed">Se han procesado ${data.length} misiones. Mantén un flujo constante para optimizar la rentabilidad.</p>
            </div>
            ${faltantes > 0 ? `
            <div class="p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                <p class="text-[10px] font-black text-red-500 uppercase orbitron mb-2">Alerta de Suministros</p>
                <p class="text-[10px] text-slate-400 italic leading-relaxed">Hay ${faltantes} artículos con stock crítico. Reponer antes de la próxima misión.</p>
            </div>` : ''}
        `;
    };

    // --- 🛠️ MANIOBRA QUIRÚRGICA: MOTOR DE EXPORTACIÓN ---
    const ejecutarExportacion = async () => {
        const { value: formato } = await window.Swal.fire({
            title: 'GENERAR REPORTE',
            html: `<div class="p-4 bg-black/20 rounded-2xl border border-white/5 text-left">
                     <p class="text-[10px] orbitron text-slate-400 uppercase">Propietario:</p>
                     <p class="text-xs font-black text-white uppercase">${nombreEmpresa}</p>
                     <p class="text-[8px] orbitron text-cyan-400 mt-2">by Nexus-X Starlink SaaS</p>
                   </div>`,
            background: '#010409', color: '#fff',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-file-excel mr-2"></i> EXCEL (XLSX)',
            cancelButtonText: '<i class="fas fa-file-pdf mr-2"></i> PDF ÉLITE',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#06b6d4',
            customClass: { popup: 'rounded-[2rem] border border-white/10' }
        });

        if (formato === true) {
            exportarExcel();
        } else if (window.Swal.getIcon() && !formato) { 
            exportarPDF();
        }
    };

    const exportarExcel = () => {
        const table = document.getElementById("tableReport");
        const wb = XLSX.utils.table_to_book(table, { sheet: "NEXUS_DATA" });
        XLSX.writeFile(wb, `Reporte_${nombreEmpresa}_${vistaActual}.xlsx`);
        window.Swal.fire({ title: 'DESCARGADO', icon: 'success', timer: 1000, showConfirmButton: false, background: '#010409', color: '#fff' });
    };

    const exportarPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const fecha = new Date().toLocaleString();

        // Estética "Audit Center" en PDF
        doc.setFillColor(1, 4, 9);
        doc.rect(0, 0, 600, 80, 'F');
        
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(18);
        doc.text(nombreEmpresa.toUpperCase(), 40, 45);
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`AUDIT REPORT: ${vistaActual} | EMISIÓN: ${fecha}`, 40, 65);
        
        doc.setTextColor(80);
        doc.text("BY NEXUS-X STARLINK SAAS | TALLERPRO360", 400, 25);

        doc.autoTable({
            html: '#tableReport',
            startY: 100,
            theme: 'grid',
            headStyles: { fillColor: [6, 182, 212], textColor: 255, fontSize: 8, font: 'helvetica' },
            styles: { fontSize: 7, cellPadding: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`Reporte_NexusX_${nombreEmpresa}.pdf`);
    };

    renderLayout();
}
