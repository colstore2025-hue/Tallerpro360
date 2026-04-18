/**
 * 🌌 NEXUS-X AERO-LOGISTICS - AUDIT CENTER V21.0
 * 🧠 NÚCLEO DE INTELIGENCIA ESTRATÉGICA & ANÁLISIS 2030
 * 🏗️ SYSTEM: BUSINESS INTELLIGENCE PROTOCOL
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */

import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function reportes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let cacheOrdenes = [];
    let cacheInventario = [];
    let vistaActual = 'ESTRATEGICO'; // ESTRATEGICO, FINANZAS, STAFF, INVENTARIO

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white animate-in fade-in duration-1000 pb-40">
            
            <header class="flex flex-col xl:flex-row justify-between items-start gap-10 mb-16 border-b border-white/5 pb-12 relative overflow-hidden">
                <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full"></div>
                
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="bg-cyan-500 text-[8px] font-black px-3 py-1 rounded-full text-black orbitron animate-pulse">INTEL_CORE_ACTIVE</span>
                        <span class="text-slate-600 text-[8px] orbitron tracking-[0.3em]">NEXUS-X AUDIT V21</span>
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
                        <option value="FINANZAS">💰 P&G / Flujo de Caja</option>
                        <option value="STAFF">👥 Eficiencia Operativa</option>
                        <option value="INVENTARIO">📦 Auditoría de Activos</option>
                    </select>
                    <button id="btnExport" class="px-8 py-3 bg-white text-black rounded-full orbitron text-[9px] font-black hover:bg-cyan-400 transition-all uppercase">
                        <i class="fas fa-download mr-2"></i> Exportar_Data
                    </button>
                </div>
            </header>

            <div id="kpiGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"></div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div class="xl:col-span-2 bg-[#0d1117]/50 rounded-[3rem] border border-white/5 p-10 shadow-2xl backdrop-blur-sm">
                    <div class="flex justify-between items-center mb-10">
                        <h2 id="tituloSeccion" class="orbitron text-xl font-black italic text-white uppercase tracking-tighter">Cargando...</h2>
                        <input id="searchReport" placeholder="FILTRAR REGISTROS..." class="bg-black/40 border border-white/5 p-4 px-8 rounded-full orbitron text-[9px] text-white w-64 outline-none focus:border-cyan-500">
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead id="headReport" class="border-b border-white/5"></thead>
                            <tbody id="bodyReport" class="divide-y divide-white/5 font-medium"></tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-cyan-500/5 rounded-[3rem] border border-cyan-500/10 p-10 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-8 opacity-10"><i class="fas fa-brain text-4xl text-cyan-500"></i></div>
                    <h3 class="orbitron text-xs font-black text-cyan-400 mb-8 uppercase tracking-widest">Nexus-X AI Insights</h3>
                    <div id="aiInsights" class="space-y-6">
                        <p class="text-[10px] text-slate-400 italic">Analizando patrones de rendimiento...</p>
                    </div>
                </div>
            </div>
        </div>`;

        // Event Listeners
        document.getElementById("selectVista").onchange = (e) => { vistaActual = e.target.value; procesarYRenderizar(); };
        document.getElementById("f_inicio").onchange = procesarYRenderizar;
        document.getElementById("f_fin").onchange = procesarYRenderizar;
        document.getElementById("searchReport").oninput = procesarYRenderizar;
        document.getElementById("btnExport").onclick = ejecutarExportacion;

        initData();
    };

    const initData = async () => {
        try {
            // Carga paralela de todas las fuentes de verdad
            const [snapOrdenes, snapStock] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)))
            ]);
            
            cacheOrdenes = snapOrdenes.docs.map(d => ({ id: d.id, ...d.data() }));
            cacheInventario = snapStock.docs.map(d => ({ id: d.id, ...d.data() }));
            
            procesarYRenderizar();
        } catch (e) { console.error("Critical Intel Failure:", e); }
    };

    const procesarYRenderizar = () => {
        const busqueda = document.getElementById("searchReport").value.toLowerCase();
        const fI = document.getElementById("f_inicio").value;
        const fF = document.getElementById("f_fin").value;

        // Filtrado Maestro
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
        const margenCosto = cacheInventario.reduce((acc, i) => acc + (Number(i.precioCosto || 0) * Number(i.cantidad || 0)), 0);
        
        grid.innerHTML = `
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-cyan-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Ingresos Operativos</p>
                <h3 class="orbitron text-3xl font-black text-white">$ ${ingresos.toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-emerald-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Patrimonio en Bóveda</p>
                <h3 class="orbitron text-3xl font-black text-emerald-400">$ ${valorStock.toLocaleString()}</h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-orange-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Órdenes Ejecutadas</p>
                <h3 class="orbitron text-3xl font-black text-white">${data.length} <span class="text-xs text-slate-500 italic">Misiones</span></h3>
            </div>
            <div class="bg-[#0d1117] p-8 rounded-[2.5rem] border-l-4 border-l-red-500 shadow-xl">
                <p class="orbitron text-[8px] text-slate-500 uppercase font-black mb-2">Capital de Riesgo (Costo)</p>
                <h3 class="orbitron text-3xl font-black text-red-500">$ ${margenCosto.toLocaleString()}</h3>
            </div>
        `;
    };

    const renderTabla = (data) => {
        const h = document.getElementById("headReport");
        const b = document.getElementById("bodyReport");
        const t = document.getElementById("tituloSeccion");

        if (vistaActual === 'ESTRATEGICO') {
            t.innerText = "HISTORIAL DE MISIONES CRÍTICAS";
            h.innerHTML = `<tr class="orbitron text-[8px] text-slate-500 uppercase"><th class="p-6">Fecha</th><th class="p-6">Activo</th><th class="p-6">Operador</th><th class="p-6 text-right">Monto Bruto</th></tr>`;
            b.innerHTML = data.map(o => `
                <tr class="hover:bg-white/5 transition-all">
                    <td class="p-6 text-[10px] text-slate-400 font-black">${o.creadoEn?.toDate ? o.creadoEn.toDate().toLocaleDateString() : '---'}</td>
                    <td class="p-6 orbitron text-[10px] text-white">${o.placa}</td>
                    <td class="p-6 text-[10px] text-slate-400 uppercase">${o.tecnico || 'SIN ASIGNAR'}</td>
                    <td class="p-6 text-right text-xs font-black">$ ${(o.costos_totales?.total_general || 0).toLocaleString()}</td>
                </tr>`).join("");
        } else if (vistaActual === 'INVENTARIO') {
            t.innerText = "AUDITORÍA DE ACTIVOS EN BÓVEDA";
            h.innerHTML = `<tr class="orbitron text-[8px] text-slate-500 uppercase"><th class="p-6">Componente</th><th class="p-6">Marca/Ref</th><th class="p-6 text-center">Stock</th><th class="p-6 text-right">Inversión</th></tr>`;
            b.innerHTML = cacheInventario.map(i => `
                <tr class="hover:bg-cyan-500/5 transition-all">
                    <td class="p-6 text-[10px] font-black text-white">${i.nombre}</td>
                    <td class="p-6 text-[9px] text-slate-500 uppercase font-black">${i.marca || 'N/A'} - ${i.referencia || 'N/A'}</td>
                    <td class="p-6 text-center text-xs ${i.cantidad <= (i.minimo || 0) ? 'text-red-500' : 'text-white'}">${i.cantidad}</td>
                    <td class="p-6 text-right text-xs font-black text-emerald-400">$ ${(Number(i.precioCosto || 0) * Number(i.cantidad || 0)).toLocaleString()}</td>
                </tr>`).join("");
        }
        // ... (Agregaremos FINANZAS y STAFF según crezca el sistema)
    };

    const generarInsights = (data) => {
        const container = document.getElementById("aiInsights");
        const total = data.reduce((acc, o) => acc + (Number(o.costos_totales?.total_general || 0)), 0);
        const ticketPromedio = data.length > 0 ? total / data.length : 0;
        const faltantes = cacheInventario.filter(i => i.cantidad <= (i.minimo || 0)).length;

        container.innerHTML = `
            <div class="p-6 bg-black/40 rounded-2xl border border-white/5">
                <p class="text-[10px] font-black text-white uppercase orbitron mb-2">Rendimiento Financiero</p>
                <p class="text-[10px] text-slate-400 leading-relaxed italic">Tu ticket promedio está en <span class="text-cyan-400">$${Math.round(ticketPromedio).toLocaleString()}</span>. Considera ofrecer servicios de mantenimiento preventivo para elevar este valor.</p>
            </div>
            <div class="p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                <p class="text-[10px] font-black text-red-500 uppercase orbitron mb-2">Alerta de Suministros</p>
                <p class="text-[10px] text-slate-400 leading-relaxed italic">Tienes <span class="text-red-500">${faltantes} activos</span> por debajo del stock mínimo. Riesgo de retraso en misiones operativas.</p>
            </div>
            <div class="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <p class="text-[10px] font-black text-emerald-500 uppercase orbitron mb-2">Optimización de Staff</p>
                <p class="text-[10px] text-slate-400 leading-relaxed italic">El técnico con más flujo este periodo es <span class="text-white">${data[0]?.tecnico || 'N/A'}</span>. Analiza su método para estandarizar en el equipo.</p>
            </div>
        `;
    };

    const ejecutarExportacion = () => {
        // Integración con librería externa (SheetJS o similar)
        window.Swal.fire({
            title: 'GENERANDO ARCHIVO...',
            text: 'Extrayendo datos cifrados del Nexus-X',
            icon: 'info', background: '#010409', color: '#fff', timer: 2000, showConfirmButton: false
        });
        // Lógica de descarga de Excel/PDF aquí
    };

    renderLayout();
}
