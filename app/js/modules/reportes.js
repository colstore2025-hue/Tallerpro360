/**
 * 🌌 NEXUS-X AERO-LOGISTICS - AUDIT CENTER V22.0
 * 🧠 NÚCLEO DE INTELIGENCIA ESTRATÉGICA & AUDITORÍA CIRCULAR
 * 🏗️ SYSTEM: BUSINESS INTELLIGENCE PROTOCOL (BSC & P&G)
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

// --- 🚀 MOTORES DE EXPORTACIÓN ÉLITE ---
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

export default async function reportesModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    const nombreEmpresa = localStorage.getItem("nexus_nombreEmpresa") || "LOGÍSTICA NEXUS-X";
    let datosCargados = [];
    let vistaActual = 'GENERAL'; 

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        AUDIT <span class="text-cyan-400">CENTER</span>
                    </h1>
                    <div class="flex gap-4 mt-6">
                        <select id="selectVista" class="bg-[#0d1117] border border-white/10 p-4 rounded-2xl orbitron text-[10px] font-black uppercase text-cyan-400 focus:outline-none hover:border-cyan-500 transition-all cursor-pointer">
                            <option value="GENERAL">📊 Inteligencia de Negocios (General)</option>
                            <option value="FINANZAS">💰 P&G / Balance General</option>
                            <option value="STAFF">👥 Productividad & BSC Staff</option>
                            <option value="HISTORIAL">🚗 Auditoría de Activos (Historial)</option>
                        </select>
                    </div>
                </div>

                <div class="flex flex-wrap gap-4 p-4 bg-[#0d1117]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div class="flex items-center gap-3 px-6 border-r border-white/5">
                        <i class="fas fa-calendar-day text-cyan-500 text-xs"></i>
                        <input type="date" id="fechaInicio" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase">
                        <span class="text-slate-700 font-black">>></span>
                        <input type="date" id="fechaFin" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase">
                    </div>
                    <button id="btnExportar" class="px-8 h-14 bg-white text-black rounded-2xl orbitron text-[10px] font-black hover:bg-cyan-400 transition-all flex items-center gap-3 group">
                        <i class="fas fa-download group-hover:bounce"></i> EXPORTAR INFORME
                    </button>
                </div>
            </header>

            <div id="kpiContainer" class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12"></div>

            <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 mb-10 flex items-center gap-6 shadow-inner">
                <i class="fas fa-satellite-dish text-cyan-500 text-xl animate-pulse"></i>
                <input id="filtroTabla" placeholder="ESCANEAR PLACA, CLIENTE O TÉCNICO..." 
                       class="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-slate-800 orbitron font-black tracking-[0.2em] uppercase">
            </div>

            <div id="reportContent" class="bg-[#0d1117]/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-x-auto shadow-2xl">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead id="headReporte"></thead>
                    <tbody id="bodyReportes" class="divide-y divide-white/5 font-bold text-xs"></tbody>
                </table>
            </div>
        </div>`;

        // Event Listeners
        document.getElementById("selectVista").onchange = (e) => { vistaActual = e.target.value; procesarDatos(); };
        document.getElementById("filtroTabla").oninput = procesarDatos;
        document.getElementById("fechaInicio").onchange = procesarDatos;
        document.getElementById("fechaFin").onchange = procesarDatos;
        document.getElementById("btnExportar").onclick = ejecutarExportacion;

        cargarHistorial();
    };

    const cargarHistorial = async () => {
        try {
            const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));
            const snap = await getDocs(q);
            datosCargados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            procesarDatos();
        } catch (e) { console.error("🚨 Error Audit Center:", e); }
    };

    const procesarDatos = () => {
        const busqueda = document.getElementById("filtroTabla").value.toLowerCase();
        const fInicio = document.getElementById("fechaInicio").value;
        const fFin = document.getElementById("fechaFin").value;

        let filtrados = datosCargados.filter(o => {
            const fechaO = o.creadoEn?.toDate ? o.creadoEn.toDate() : null;
            const coincideTexto = (o.placa?.toLowerCase().includes(busqueda)) || (o.cliente?.toLowerCase().includes(busqueda)) || (o.tecnico?.toLowerCase().includes(busqueda));
            
            let coincideFecha = true;
            if (fInicio && fechaO) coincideFecha = fechaO >= new Date(fInicio + "T00:00:00");
            if (fFin && fechaO && coincideFecha) coincideFecha = fechaO <= new Date(fFin + "T23:59:59");
            
            return coincideTexto && coincideFecha;
        });

        actualizarUI(filtrados);
    };

    const actualizarUI = (data) => {
        renderKPIs(data);
        renderTabla(data);
    };

    const renderKPIs = (data) => {
        const kpiGrid = document.getElementById("kpiContainer");
        const ingresosTotales = data.reduce((acc, o) => acc + (Number(o.costos_totales?.total_general || o.total || 0)), 0);
        const recaudado = data.reduce((acc, o) => acc + (Number(o.finanzas?.anticipo_cliente || 0)), 0);
        const ticketPromedio = data.length > 0 ? ingresosTotales / data.length : 0;
        const deudaCxC = data.reduce((acc, o) => acc + (Number(o.costos_totales?.saldo_pendiente || 0)), 0);

        kpiGrid.innerHTML = `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-cyan-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Volumen de Negocio (Ingresos)</p>
                <h3 class="orbitron text-2xl font-black italic text-white">$ ${ingresosTotales.toLocaleString("es-CO")}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-emerald-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Ticket Promedio (BSC)</p>
                <h3 class="orbitron text-2xl font-black italic text-emerald-400">$ ${Math.round(ticketPromedio).toLocaleString("es-CO")}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-orange-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Efectivo Recaudado</p>
                <h3 class="orbitron text-2xl font-black italic text-white">$ ${recaudado.toLocaleString("es-CO")}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-red-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Saldos CxC (Riesgo)</p>
                <h3 class="orbitron text-2xl font-black italic text-red-500">$ ${deudaCxC.toLocaleString("es-CO")}</h3>
            </div>
        `;
    };

    const renderTabla = (data) => {
        const header = document.getElementById("headReporte");
        const body = document.getElementById("bodyReportes");

        if (vistaActual === 'FINANZAS') {
            header.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-widest"><th class="p-8">Fecha</th><th class="p-8">Referencia</th><th class="p-8">Total Bruto</th><th class="p-8">Recaudo</th><th class="p-8 text-right">Estado P&G</th></tr>`;
            body.innerHTML = data.map(o => `
                <tr class="hover:bg-cyan-500/5 transition-all italic">
                    <td class="p-8 text-slate-400 font-black">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '---'}</td>
                    <td class="p-8 orbitron text-white text-[10px]">${o.placa}</td>
                    <td class="p-8">$ ${(o.costos_totales?.total_general || 0).toLocaleString()}</td>
                    <td class="p-8 text-emerald-400 font-black">$ ${(o.finanzas?.anticipo_cliente || 0).toLocaleString()}</td>
                    <td class="p-8 text-right font-black ${o.costos_totales?.saldo_pendiente > 0 ? 'text-red-500' : 'text-cyan-400'}">
                        ${o.costos_totales?.saldo_pendiente > 0 ? 'PENDIENTE: $' + o.costos_totales.saldo_pendiente.toLocaleString() : 'SALDADO'}
                    </td>
                </tr>`).join("");
        } else if (vistaActual === 'STAFF') {
            const staff = {};
            data.forEach(o => {
                const tec = o.tecnico || "NO ASIGNADO";
                if(!staff[tec]) staff[tec] = { misiones: 0, total: 0, promedio: 0 };
                staff[tec].misiones++;
                staff[tec].total += Number(o.total || o.costos_totales?.total_general || 0);
            });
            header.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-widest"><th class="p-8">Técnico Operador</th><th class="p-8 text-center">Misiones Cumplidas</th><th class="p-8 text-right">Productividad Total</th></tr>`;
            body.innerHTML = Object.keys(staff).map(s => `
                <tr class="hover:bg-orange-500/5 transition-all italic font-bold">
                    <td class="p-8 orbitron text-cyan-400 font-black">${s}</td>
                    <td class="p-8 text-center">${staff[s].misiones}</td>
                    <td class="p-8 text-right text-white font-black">$ ${staff[s].total.toLocaleString()}</td>
                </tr>`).join("");
        } else {
            header.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-widest"><th class="p-8">Fecha</th><th class="p-8">Activo (Placa)</th><th class="p-8">Cliente</th><th class="p-8 text-right">Monto Total</th></tr>`;
            body.innerHTML = data.map(o => `
                <tr class="hover:bg-white/5 transition-all italic font-bold">
                    <td class="p-8 text-slate-400 font-black">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td class="p-8 orbitron text-white font-black">${o.placa}</td>
                    <td class="p-8 text-slate-400 uppercase">${o.cliente}</td>
                    <td class="p-8 text-right text-cyan-400 font-black">$ ${(o.costos_totales?.total_general || o.total || 0).toLocaleString()}</td>
                </tr>`).join("");
        }
    };

    const ejecutarExportacion = async () => {
        const { value: formato } = await window.Swal.fire({
            title: 'SISTEMA DE EXPORTACIÓN',
            html: `<p class="orbitron text-[10px] text-slate-400">AUDIT CENTER - ${nombreEmpresa}</p>`,
            icon: 'info', background: '#010409', color: '#fff',
            showCancelButton: true,
            confirmButtonText: 'EXCEL (XLSX)',
            cancelButtonText: 'PDF (EJECUTIVO)',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#06b6d4'
        });

        if (formato) { exportarExcel(); } 
        else if (window.Swal.getIcon() && !formato) { exportarPDF(); }
    };

    const exportarExcel = () => {
        const table = document.querySelector("table");
        const wb = XLSX.utils.table_to_book(table, { sheet: "AUDIT_DATA" });
        XLSX.writeFile(wb, `NexusX_${nombreEmpresa}_${vistaActual}.xlsx`);
    };

    const exportarPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const fecha = new Date().toLocaleString();

        doc.setFillColor(1, 4, 9);
        doc.rect(0, 0, 600, 100, 'F');
        
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(22);
        doc.text(nombreEmpresa.toUpperCase(), 40, 50);
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`BY NEXUS-X STARLINK SAAS | TALLERPRO360`, 40, 75);
        doc.text(`REPORTE: ${vistaActual} | FECHA: ${fecha}`, 40, 85);

        doc.autoTable({
            html: 'table',
            startY: 120,
            theme: 'striped',
            headStyles: { fillColor: [6, 182, 212], textColor: 255, fontSize: 8 },
            styles: { fontSize: 7 }
        });

        doc.save(`NexusX_${nombreEmpresa}_Report.pdf`);
    };

    renderLayout();
}
