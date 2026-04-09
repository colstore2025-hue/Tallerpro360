/**
 * reportes.js - TallerPRO360 NEXUS-X V18.0 📄
 * NÚCLEO DE INTELIGENCIA DE NEGOCIOS & AUDITORÍA CIRCULAR
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportesModule(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let datosCargados = [];
    let vistaActual = 'GENERAL'; // GENERAL, FINANZAS, STAFF, HISTORIAL

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in zoom-in duration-700 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-end gap-10 mb-16 border-b border-white/5 pb-12">
                <div class="relative">
                    <div class="absolute -left-6 top-0 h-full w-1 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                    <h1 class="orbitron text-5xl lg:text-6xl font-black italic tracking-tighter text-white leading-none uppercase">
                        AUDIT <span class="text-cyan-400">CENTER</span>
                    </h1>
                    <div class="flex gap-4 mt-4">
                        <select id="selectVista" class="bg-[#0d1117] border border-white/10 p-3 rounded-xl orbitron text-[10px] font-black uppercase text-cyan-400 focus:outline-none">
                            <option value="GENERAL">📊 Resumen General</option>
                            <option value="FINANZAS">💰 P&G / Balances</option>
                            <option value="STAFF">👥 Productividad Staff</option>
                            <option value="HISTORIAL">🚗 Historial de Activos</option>
                        </select>
                    </div>
                </div>

                <div class="flex flex-wrap gap-4 p-4 bg-[#0d1117] rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div class="flex items-center gap-3 px-6 border-r border-white/5">
                        <i class="fas fa-calendar-day text-cyan-500 text-xs"></i>
                        <input type="date" id="fechaInicio" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase">
                        <span class="text-slate-700 font-black">>></span>
                        <input type="date" id="fechaFin" class="bg-transparent border-none text-[11px] text-white focus:outline-none orbitron font-black uppercase">
                    </div>
                    <div class="flex gap-2">
                        <button id="btnExcel" class="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center group">
                            <i class="fas fa-file-excel text-lg group-hover:scale-110"></i>
                        </button>
                    </div>
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
                    <tbody id="bodyReportes" class="divide-y divide-white/5 font-bold"></tbody>
                </table>
                <div id="vacio-reportes" class="hidden py-40 text-center opacity-20">
                    <i class="fas fa-ghost text-6xl mb-4"></i>
                    <p class="orbitron text-[10px] uppercase tracking-[0.5em]">Frecuencia vacía en este sector</p>
                </div>
            </div>
        </div>`;

        // Event Listeners
        document.getElementById("selectVista").onchange = (e) => {
            vistaActual = e.target.value;
            procesarDatos();
        };
        document.getElementById("filtroTabla").oninput = procesarDatos;
        document.getElementById("fechaInicio").onchange = procesarDatos;
        document.getElementById("fechaFin").onchange = procesarDatos;
        document.getElementById("btnExcel").onclick = exportarExcel;

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
            const coincideTexto = (o.placa?.toLowerCase().includes(busqueda)) || (o.cliente?.toLowerCase().includes(busqueda));
            
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
        const totalRev = data.reduce((acc, o) => acc + (Number(o.costos_totales?.total_general || o.total || 0)), 0);
        const ticket = data.length > 0 ? totalRev / data.length : 0;
        const pendientes = data.filter(o => (o.costos_totales?.saldo_pendiente || 0) > 0).length;

        kpiGrid.innerHTML = `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-cyan-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Volumen Total</p>
                <h3 class="orbitron text-2xl font-black italic">$ ${totalRev.toLocaleString("es-CO")}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-emerald-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Ticket Promedio</p>
                <h3 class="orbitron text-2xl font-black italic">$ ${Math.round(ticket).toLocaleString("es-CO")}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-orange-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Misiones</p>
                <h3 class="orbitron text-2xl font-black italic">${data.length}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 border-l-4 border-l-red-500">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-1">Saldos CxC</p>
                <h3 class="orbitron text-2xl font-black italic">${pendientes} Pend.</h3>
            </div>
        `;
    };

    const renderTabla = (data) => {
        const header = document.getElementById("headReporte");
        const body = document.getElementById("bodyReportes");

        if (vistaActual === 'FINANZAS') {
            header.innerHTML = `
                <tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-widest">
                    <th class="p-8">Fecha</th><th class="p-8">Referencia</th>
                    <th class="p-8">Total</th><th class="p-8">Anticipos</th><th class="p-8 text-right">Saldo Pendiente</th>
                </tr>`;
            body.innerHTML = data.map(o => `
                <tr class="hover:bg-cyan-500/5 transition-all italic font-bold">
                    <td class="p-8 text-slate-400 text-xs">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td class="p-8 orbitron text-[10px]">${o.placa}</td>
                    <td class="p-8">$ ${(o.costos_totales?.total_general || 0).toLocaleString()}</td>
                    <td class="p-8 text-emerald-400">$ ${(o.finanzas?.anticipo_cliente || 0).toLocaleString()}</td>
                    <td class="p-8 text-right ${o.costos_totales?.saldo_pendiente > 0 ? 'text-red-500' : 'text-slate-500'}">$ ${(o.costos_totales?.saldo_pendiente || 0).toLocaleString()}</td>
                </tr>`).join("");
        } else if (vistaActual === 'STAFF') {
            // Lógica de agrupación por técnico
            const staff = {};
            data.forEach(o => {
                const tec = o.tecnico || "NO ASIGNADO";
                if(!staff[tec]) staff[tec] = { misiones: 0, total: 0 };
                staff[tec].misiones++;
                staff[tec].total += Number(o.total || o.costos_totales?.total_general || 0);
            });
            header.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-widest"><th class="p-8">Técnico / Operador</th><th class="p-8 text-center">Misiones</th><th class="p-8 text-right">Producción Bruta</th></tr>`;
            body.innerHTML = Object.keys(staff).map(s => `
                <tr class="hover:bg-orange-500/5 transition-all italic font-bold">
                    <td class="p-8 orbitron text-cyan-400 font-black">${s}</td>
                    <td class="p-8 text-center">${staff[s].misiones}</td>
                    <td class="p-8 text-right">$ ${staff[s].total.toLocaleString()}</td>
                </tr>`).join("");
        } else {
            // VISTA GENERAL (POR DEFECTO)
            header.innerHTML = `<tr class="bg-white/[0.02] orbitron text-[9px] text-slate-500 uppercase tracking-widest"><th class="p-8">Fecha</th><th class="p-8">Placa</th><th class="p-8">Cliente</th><th class="p-8 text-right">Total</th></tr>`;
            body.innerHTML = data.map(o => `
                <tr class="hover:bg-white/5 transition-all italic font-bold">
                    <td class="p-8 text-slate-400 text-xs">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : 'N/A'}</td>
                    <td class="p-8 orbitron text-white font-black">${o.placa}</td>
                    <td class="p-8 text-slate-400 uppercase text-xs">${o.cliente}</td>
                    <td class="p-8 text-right">$ ${(o.costos_totales?.total_general || o.total || 0).toLocaleString()}</td>
                </tr>`).join("");
        }
    };

    const exportarExcel = async () => { /* ... Lógica anterior de Excel ... */ };

    renderLayout();
}
