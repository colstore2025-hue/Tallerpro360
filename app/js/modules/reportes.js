/**
 * 🦾 NEXUS-X TERMINATOR CORE V29.0 - ESTABILIZACIÓN FINAL
 * Módulo de Analítica Operativa & Auditoría P&G
 */

// ... (imports iniciales se mantienen iguales)

    const procesarOperaciones = () => {
        const tbody = document.getElementById("opTableBody");
        if (!tbody) return;

        // Reset de Métricas
        METRICAS_GLOBALES.totalVenta = 0;
        METRICAS_GLOBALES.totalSugerido = 0;
        METRICAS_GLOBALES.misionesCriticas = 0;
        let sumaMargen = 0;

        tbody.innerHTML = ordenesData.map(o => {
            /** * 🎯 UNIFICACIÓN DE DATOS (FIREBASE REALITY CHECK)
             * Buscamos en 'costos_totales' O en la raíz del documento si el esquema cambió.
             */
            const venta = Number(o.costos_totales?.total_general || o.total_general || o.total || o.valor_total || 0);
            const repuestos = Number(o.costos_totales?.costo_repuestos || o.costo_repuestos || o.repuestos || 0);
            const mo = Number(o.costos_totales?.mano_obra || o.mano_obra || o.labor || 0);
            const costoDirecto = repuestos + mo;
            
            METRICAS_GLOBALES.totalVenta += venta;

            // Integración con Pricing AI
            const sugerido = calcularPrecioInteligente({ 
                costoRepuestos: repuestos, 
                horasTrabajo: Number(o.horas_reales || 1.5)
            });
            o.sugeridoCalculado = sugerido.total;
            METRICAS_GLOBALES.totalSugerido += sugerido.total;

            const utilidad = venta - costoDirecto;
            const margen = venta > 0 ? (utilidad / venta) * 100 : 0;
            sumaMargen += margen;

            const esBaja = venta < (sugerido.total * 0.9) || margen < 20; // Margen crítico < 20%
            if (esBaja) METRICAS_GLOBALES.misionesCriticas++;

            return `
            <tr onclick="window.verDetalleMision('${o.id}')" class="hover:bg-cyan-500/[0.04] transition-all cursor-pointer group border-b border-white/[0.02]">
                <td class="p-10">
                    <div class="flex items-center gap-6">
                        <div class="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-all">
                            <i class="fas fa-truck-pickup ${esBaja ? 'text-red-500' : 'text-cyan-400'}"></i>
                        </div>
                        <div class="flex flex-col text-left">
                            <span class="orbitron text-2xl font-black italic tracking-tighter group-hover:text-cyan-400 transition-colors uppercase leading-none">${o.placa || 'OT-SYS'}</span>
                            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">${o.cliente || 'CLIENTE FINAL'}</span>
                        </div>
                    </div>
                </td>
                <td class="p-10">
                    <div class="text-xl font-black orbitron tabular-nums">$ ${venta.toLocaleString()}</div>
                    <div class="text-[8px] text-slate-600 orbitron uppercase mt-1 tracking-widest">Facturado Real</div>
                </td>
                <td class="p-10">
                    <div class="text-sm font-bold text-slate-400 orbitron">$ ${costoDirecto.toLocaleString()}</div>
                    <div class="text-[8px] text-slate-600 orbitron uppercase mt-1 tracking-widest">Costo Directo</div>
                </td>
                <td class="p-10">
                    <div class="text-sm font-bold text-cyan-400/80 orbitron tabular-nums">$ ${sugerido.total.toLocaleString()}</div>
                    <div class="text-[8px] text-cyan-900 orbitron uppercase mt-1 italic font-black">Target AI Nexus</div>
                </td>
                <td class="p-10">
                    <div class="flex flex-col items-center">
                        <span class="text-lg font-black orbitron mb-2 ${margen > 25 ? 'text-emerald-400' : 'text-red-500'}">${margen.toFixed(1)}%</span>
                        <div class="w-28 h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div class="h-full rounded-full ${margen > 25 ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'}" style="width: ${Math.min(margen, 100)}%"></div>
                        </div>
                    </div>
                </td>
                <td class="p-10 text-right">
                    <div class="flex flex-col items-end gap-2">
                        <span class="px-4 py-2 rounded-xl text-[8px] orbitron font-black uppercase tracking-widest ${esBaja ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                            ${esBaja ? 'Critical Audit' : 'Optimal Path'}
                        </span>
                    </div>
                </td>
            </tr>`;
        }).join("");

        METRICAS_GLOBALES.eficienciaPromedio = ordenesData.length > 0 ? sumaMargen / ordenesData.length : 0;
        METRICAS_GLOBALES.fugaTotal = Math.max(0, METRICAS_GLOBALES.totalSugerido - METRICAS_GLOBALES.totalVenta);

        actualizarDashboards();
    };

    // --- SISTEMA DE EXPORTACIÓN UNIFICADO ---
    window.generarInformeDetallado = (data, tipo = "global") => {
        try {
            const wb = XLSX.utils.book_new();
            const wsData = data.map(o => {
                const v = Number(o.costos_totales?.total_general || o.total_general || o.total || 0);
                const r = Number(o.costos_totales?.costo_repuestos || o.costo_repuestos || 0);
                const m = Number(o.costos_totales?.mano_obra || o.mano_obra || 0);
                return {
                    "FECHA": o.fecha_creacion?.toDate ? o.fecha_creacion.toDate().toLocaleDateString() : (o.fecha_registro || "S/D"),
                    "PLACA": o.placa || "N/A",
                    "CLIENTE": o.cliente || "S/N",
                    "VENTA REAL": v,
                    "COSTO DIRECTO": r + m,
                    "UTILIDAD NETA": v - (r + m),
                    "MARGEN %": v > 0 ? (((v - (r + m)) / v) * 100).toFixed(2) + "%" : "0%",
                    "TARGET IA": o.sugeridoCalculado || 0
                };
            });

            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Nexus_V29");
            XLSX.writeFile(wb, `Audit_Nexus_${new Date().toISOString().slice(0,10)}.xlsx`);
            
            Swal.fire({ icon: 'success', title: 'Auditoría Generada', background: '#0d1117', color: '#fff' });
        } catch (e) { console.error("Export Error:", e); }
    };

    window.descargarMisionEspecifica = (id) => {
        const o = ordenesData.find(x => x.id === id);
        if(o) generarInformeDetallado([o], "individual");
    };

    renderLayout();
}
