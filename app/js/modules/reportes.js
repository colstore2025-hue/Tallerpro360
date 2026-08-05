/**
 * 🏛️ TALLERPRO360 - REPORTES & AUDITORÍA FORENSE v19.0.1
 * 📜 SCRIPT ID: #NEXUS-X-REPORTS-2026-V19-FIX
 * CORRECCIÓN: IMPORTACIÓN DE 'where' DE FIREBASE
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 */

import { collection, query, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Variable global para almacenar la data procesada en memoria y usarla en PDF/Excel
window.nexusMemoriaFlota = {};
window.nexusRangoReporte = { inicio: "", fin: "" };

export default async function reportes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500 font-black text-center">ERROR CRÍTICO: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    // Asegurar carga de SheetJS para exportación a Excel profesional
    if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        document.head.appendChild(script);
    }

    const renderBaseUI = () => {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-12 border-b-2 border-cyan-500 pb-8">
                <div class="space-y-1">
                    <h1 class="orbitron text-4xl lg:text-6xl font-black italic tracking-tighter text-white uppercase">AUDITORÍA_SAP<span class="text-cyan-500">_GERENCIAL</span></h1>
                    <p class="text-[10px] orbitron text-slate-400 font-bold tracking-[0.4em] uppercase italic">Sistema Logístico Nexus-X • Inteligencia de Negocios & Rentabilidad Real</p>
                </div>
                
                <!-- CONTROLES DE RANGO Y ACCIÓN -->
                <div class="flex flex-wrap items-center gap-4 bg-[#0d1117] p-4 rounded-2xl border border-cyan-500/20 shadow-xl">
                    <div class="flex flex-col">
                        <label class="text-[9px] orbitron text-cyan-400 font-bold mb-1">FECHA INICIO</label>
                        <input type="date" id="f-inicio" value="${primerDiaMes}" class="bg-black/50 border border-cyan-500/30 text-slate-200 p-2.5 rounded-xl orbitron text-xs font-bold outline-none focus:border-cyan-500">
                    </div>
                    <div class="flex flex-col">
                        <label class="text-[9px] orbitron text-cyan-400 font-bold mb-1">FECHA FIN</label>
                        <input type="date" id="f-fin" value="${ultimoDiaMes}" class="bg-black/50 border border-cyan-500/30 text-slate-200 p-2.5 rounded-xl orbitron text-xs font-bold outline-none focus:border-cyan-500">
                    </div>
                    <div class="flex items-end gap-2 mt-4 xl:mt-0">
                        <button id="btnGenerarData" class="px-6 py-3 bg-cyan-500 text-black rounded-xl orbitron text-[11px] font-black hover:bg-white transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)] flex items-center">
                            <i class="fas fa-satellite-dish mr-2"></i> ESCANEAR
                        </button>
                        <button id="btnExportarExcel" class="px-5 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl orbitron text-[11px] font-black hover:bg-emerald-500 hover:text-black transition-all flex items-center" title="Exportar Reporte Gerencial a Excel">
                            <i class="fas fa-file-excel mr-2"></i> EXCEL
                        </button>
                    </div>
                </div>
            </header>

            <!-- TABLERO DE RESUMEN GLOBAL / GERENCIAL -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12" id="kpi-globales">
                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-white/5 text-7xl font-black orbitron pointer-events-none">IN</div>
                    <h3 class="orbitron text-[10px] text-slate-500 uppercase font-black mb-2">Ingresos Consolidados</h3>
                    <p class="orbitron text-3xl text-green-400 font-black" id="kpi-ingresos">$0</p>
                </div>
                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-white/5 text-7xl font-black orbitron pointer-events-none">EX</div>
                    <h3 class="orbitron text-[10px] text-slate-500 uppercase font-black mb-2">Costos Operativos Directos</h3>
                    <p class="orbitron text-3xl text-red-400 font-black" id="kpi-costos">$0</p>
                </div>
                <div class="bg-cyan-950/20 p-6 rounded-3xl border border-cyan-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(0,242,255,0.05)]">
                    <div class="absolute -right-4 -bottom-4 text-cyan-500/5 text-7xl font-black orbitron pointer-events-none">EB</div>
                    <h3 class="orbitron text-[10px] text-cyan-400 uppercase font-black mb-2">EBITDA Global (Utilidad Real)</h3>
                    <p class="orbitron text-4xl text-cyan-400 font-black italic" id="kpi-ebitda">$0</p>
                </div>
                <div class="bg-[#0d1117] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div class="absolute -right-4 -bottom-4 text-white/5 text-7xl font-black orbitron pointer-events-none">MO</div>
                    <h3 class="orbitron text-[10px] text-slate-500 uppercase font-black mb-2">Margen Operativo Promedio</h3>
                    <p class="orbitron text-3xl text-amber-400 font-black" id="kpi-margen">0.0%</p>
                </div>
            </div>

            <!-- TABLA DE ESTRUCTURA OPERATIVA -->
            <div class="bg-[#0d1117] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                <div class="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center">
                    <h2 class="orbitron text-[11px] text-white uppercase font-black tracking-widest">Estructura Operativa y Rentabilidad por Vehículo (Flota)</h2>
                    <span class="text-[10px] orbitron text-slate-400" id="contador-placas">0 Unidades Analizadas</span>
                </div>
                <div class="p-0 overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-white/10 bg-black/60">
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black">Vehículo / Cliente</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-center">Órdenes / Misiones</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">Ingreso Recaudado</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">Egresos (Contables)</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">EBITDA Real</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">Margen (%)</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-center">Acción Forense</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-flota" class="text-sm font-mono text-slate-300">
                            <tr><td colspan="7" class="p-12 text-center text-slate-500 orbitron">Configure el rango de fechas y presione Escanear</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        document.getElementById("btnGenerarData").addEventListener("click", procesarAuditoria);
        document.getElementById("btnExportarExcel").addEventListener("click", exportarExcelGerencial);
    };

    // ==========================================
    // 🧠 MOTOR DE CÁLCULO Y FILTRADO POR RANGO
    // ==========================================
    const procesarAuditoria = async () => {
        const btn = document.getElementById("btnGenerarData");
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> ESCANEANDO...`;
        btn.disabled = true;

        const fInicio = document.getElementById("f-inicio").value;
        const fFin = document.getElementById("f-fin").value;

        if (!fInicio || !fFin) {
            btn.innerHTML = `<i class="fas fa-satellite-dish mr-2"></i> ESCANEAR`;
            btn.disabled = false;
            return Swal.fire("Error", "Debe seleccionar un rango de fechas válido", "error");
        }

        window.nexusRangoReporte = { inicio: fInicio, fin: fFin };

        try {
            const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const snapOrdenes = await getDocs(qOrdenes);
            
            const qConta = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
            const snapConta = await getDocs(qConta);

            let flota = {};
            let totalIngresosG = 0;
            let totalCostosG = 0;

            // --- FASE A: ÓRDENES E INGRESOS ---
            snapOrdenes.forEach(doc => {
                const data = doc.data();
                const fechaStr = (data.fecha_creacion_manual || data.createdAt || "").split('T')[0];
                if (!fechaStr) return;
                
                if (fechaStr < fInicio || fechaStr > fFin) return;

                const placa = (data.placa_limpia || data.placa || "DESCONOCIDO").toUpperCase().split('-')[0];
                
                if (!flota[placa]) {
                    flota[placa] = {
                        cliente: data.cliente || "SIN REGISTRO",
                        placa: placa,
                        placaDetalle: data.placa || placa,
                        ordenes: [],
                        ingresosTotales: 0,
                        costosContables: 0,
                        ebitda: 0,
                        margenPorcentaje: 0,
                        registrosPUC: []
                    };
                }

                const ingresoOrden = Number(data.total || data.costos_totales?.total || 0);
                flota[placa].ingresosTotales += ingresoOrden;
                totalIngresosG += ingresoOrden;
                
                flota[placa].ordenes.push({
                    id: data.id,
                    fecha: fechaStr,
                    ingreso: ingresoOrden,
                    items: data.items || [],
                    bitacora: data.bitacora_ia || "Sin registro"
                });
            });

            // --- FASE B: COSTOS Y CONTABILIDAD LIBRO DIARIO ---
            snapConta.forEach(doc => {
                const data = doc.data();
                const fechaStr = (data.fecha_registro || data.fecha || "").split('T')[0];
                if (!fechaStr) return;

                if (fechaStr < fInicio || fechaStr > fFin) return;

                if (data.tipo === "costo_directo_ot" || data.tipo === "gasto_insumo_ot") {
                    const placa = (data.placa || "DESCONOCIDO").toUpperCase();
                    
                    if (!flota[placa]) {
                        flota[placa] = { 
                            cliente: "AJUSTE CONTABLE", 
                            placa: placa, 
                            placaDetalle: placa, 
                            ordenes: [], 
                            ingresosTotales: 0, 
                            costosContables: 0, 
                            ebitda: 0, 
                            margenPorcentaje: 0,
                            registrosPUC: [] 
                        };
                    }

                    const montoCosto = Number(data.monto || data.debito || 0);
                    flota[placa].costosContables += montoCosto;
                    totalCostosG += montoCosto;

                    flota[placa].registrosPUC.push({
                        puc: data.puc || "N/A",
                        concepto: data.concepto || "Sin concepto",
                        monto: montoCosto,
                        fecha: fechaStr
                    });
                }
            });

            // --- FASE C: CÁLCULOS FINALES Y RENDERIZADO ---
            window.nexusMemoriaFlota = flota;
            const tbody = document.getElementById("tabla-flota");
            tbody.innerHTML = "";

            let cantidadPlacas = Object.keys(flota).length;

            Object.keys(flota).sort().forEach(placa => {
                const v = flota[placa];
                v.ebitda = v.ingresosTotales - v.costosContables;
                v.margenPorcentaje = v.ingresosTotales > 0 ? (v.ebitda / v.ingresosTotales) * 100 : 0;

                const colorEbitda = v.ebitda >= 0 ? 'text-cyan-400' : 'text-red-400';
                const colorMargen = v.margenPorcentaje >= 0 ? 'text-emerald-400' : 'text-red-400';

                tbody.innerHTML += `
                <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td class="p-6">
                        <div class="orbitron font-black text-white text-base group-hover:text-cyan-400 transition-colors">${v.placaDetalle}</div>
                        <div class="text-[9px] text-slate-500 uppercase tracking-widest">${v.cliente}</div>
                    </td>
                    <td class="p-6 text-center">
                        <span class="bg-white/10 px-3 py-1 rounded-full text-xs font-black text-slate-300">${v.ordenes.length}</span>
                    </td>
                    <td class="p-6 text-right text-green-400 font-black tracking-tight">
                        $${Math.round(v.ingresosTotales).toLocaleString('es-CO')}
                    </td>
                    <td class="p-6 text-right text-red-400 font-black tracking-tight">
                        -$${Math.round(v.costosContables).toLocaleString('es-CO')}
                    </td>
                    <td class="p-6 text-right ${colorEbitda} font-black text-base italic tracking-tight">
                        $${Math.round(v.ebitda).toLocaleString('es-CO')}
                    </td>
                    <td class="p-6 text-right ${colorMargen} font-black">
                        ${v.margenPorcentaje.toFixed(1)}%
                    </td>
                    <td class="p-6 text-center">
                        <button onclick="window.generarPDFActivo('${placa}')" class="bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500 hover:text-black transition-all orbitron text-[9px] font-black uppercase shadow-sm">
                            <i class="fas fa-file-pdf mr-1"></i> PDF
                        </button>
                    </td>
                </tr>`;
            });

            if(cantidadPlacas === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="p-12 text-center text-slate-500 orbitron">NO SE ENCONTRARON REGISTROS EN EL PERIODO INDICADO</td></tr>`;
            }

            document.getElementById("contador-placas").innerText = `${cantidadPlacas} Unidades Analizadas`;

            const ebitdaGlobal = totalIngresosG - totalCostosG;
            const margenGlobal = totalIngresosG > 0 ? (ebitdaGlobal / totalIngresosG) * 100 : 0;

            document.getElementById("kpi-ingresos").innerText = `$${Math.round(totalIngresosG).toLocaleString('es-CO')}`;
            document.getElementById("kpi-costos").innerText = `-$${Math.round(totalCostosG).toLocaleString('es-CO')}`;
            document.getElementById("kpi-ebitda").innerText = `$${Math.round(ebitdaGlobal).toLocaleString('es-CO')}`;
            document.getElementById("kpi-ebitda").className = `orbitron text-4xl font-black italic ${ebitdaGlobal >= 0 ? 'text-cyan-400' : 'text-red-500'}`;
            document.getElementById("kpi-margen").innerText = `${margenGlobal.toFixed(1)}%`;
            document.getElementById("kpi-margen").className = `orbitron text-3xl font-black ${margenGlobal >= 0 ? 'text-emerald-400' : 'text-red-500'}`;

        } catch (error) {
            console.error(error);
            Swal.fire("Error del Sistema", "Fallo al procesar auditoría gerencial: " + error.message, "error");
        } finally {
            btn.innerHTML = `<i class="fas fa-satellite-dish mr-2"></i> ESCANEAR`;
            btn.disabled = false;
        }
    };

    // ==========================================
    // 📊 EXPORTACIÓN PROFESIONAL A EXCEL (MULTI-HOJA)
    // ==========================================
    const exportarExcelGerencial = () => {
        if (!window.XLSX) {
            return Swal.fire("Aviso", "La librería de Excel se está cargando. Intente de nuevo en un segundo.", "warning");
        }

        const flota = window.nexusMemoriaFlota;
        if (!flota || Object.keys(flota).length === 0) {
            return Swal.fire("Sin Datos", "Debe ejecutar el escaneo de flota antes de exportar el reporte a Excel.", "info");
        }

        const { inicio, fin } = window.nexusRangoReporte;
        const wb = XLSX.utils.book_new();

        const dataResumenFlota = [];
        let totalIng = 0, totalCos = 0;

        Object.keys(flota).forEach(placa => {
            const v = flota[placa];
            totalIng += v.ingresosTotales;
            totalCos += v.costosContables;
            dataResumenFlota.push({
                "Placa / Unidad": v.placaDetalle,
                "Cliente / Flota": v.cliente,
                "Total Órdenes": v.ordenes.length,
                "Ingresos Totales ($)": Math.round(v.ingresosTotales),
                "Costos Directos ($)": Math.round(v.costosContables),
                "EBITDA Utilidad ($)": Math.round(v.ebitda),
                "Margen Operativo (%)": Number(v.margenPorcentaje.toFixed(2))
            });
        });

        const wsResumen = XLSX.utils.json_to_sheet(dataResumenFlota);
        XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Flota");

        const dataDetalleOrdenes = [];
        Object.keys(flota).forEach(placa => {
            const v = flota[placa];
            v.ordenes.forEach(o => {
                if (o.items && o.items.length > 0) {
                    o.items.forEach(item => {
                        dataDetalleOrdenes.push({
                            "Placa": v.placaDetalle,
                            "Fecha OT": o.fecha,
                            "Misión ID": o.id,
                            "Item / Repuesto": item.desc || "N/A",
                            "Tipo": item.tipo || "General",
                            "Cantidad": item.cantidad || 1,
                            "Valor Venta Total ($)": Math.round((item.venta || 0) * (item.cantidad || 1))
                        });
                    });
                } else {
                    dataDetalleOrdenes.push({
                        "Placa": v.placaDetalle,
                        "Fecha OT": o.fecha,
                        "Misión ID": o.id,
                        "Item / Repuesto": "Facturación Global de Orden",
                        "Tipo": "Orden Directa",
                        "Cantidad": 1,
                        "Valor Venta Total ($)": Math.round(o.ingreso)
                    });
                }
            });
        });

        if (dataDetalleOrdenes.length > 0) {
            const wsOrdenes = XLSX.utils.json_to_sheet(dataDetalleOrdenes);
            XLSX.utils.book_append_sheet(wb, wsOrdenes, "Detalle Órdenes");
        }

        const dataConta = [];
        Object.keys(flota).forEach(placa => {
            const v = flota[placa];
            v.registrosPUC.forEach(p => {
                dataConta.push({
                    "Placa": v.placaDetalle,
                    "Fecha Gasto": p.fecha || "N/A",
                    "Cuenta PUC": p.puc,
                    "Concepto de Gasto": p.concepto,
                    "Monto Costo ($)": Math.round(p.monto)
                });
            });
        });

        if (dataConta.length > 0) {
            const wsConta = XLSX.utils.json_to_sheet(dataConta);
            XLSX.utils.book_append_sheet(wb, wsConta, "Costos PUC");
        }

        XLSX.writeFile(wb, `Auditoria_Gerencial_Flota_${inicio}_al_${fin}.xlsx`);
        
        Swal.fire({
            title: 'Excel Exportado',
            text: `El reporte gerencial multi-hoja ha sido generado con éxito.`,
            icon: 'success',
            background: '#0d1117', color: '#06b6d4'
        });
    };

    // ==========================================
    // 🖨️ GENERADOR FORENSE PDF EXTENDIDO
    // ==========================================
    window.generarPDFActivo = (placa) => {
        const v = window.nexusMemoriaFlota[placa];
        if (!v) return Swal.fire("Error", "Datos no encontrados en memoria", "error");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'letter');
        
        const mLeft = 40;
        let yPos = 40;

        doc.setFillColor(5, 7, 10);
        doc.rect(0, 0, 612, 120, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(22);
        doc.text("TALLERPRO360", mLeft, 50);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("// REPORTE FORENSE GERENCIAL", 225, 50);

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        const { inicio, fin } = window.nexusRangoReporte;
        doc.text(`PERIODO: ${inicio} A ${fin} | EMISIÓN: ${new Date().toLocaleDateString()}`, mLeft, 70);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(`PLACA UNIDAD:    ${v.placaDetalle}`, mLeft, 95);
        doc.text(`CLIENTE / FLOTA: ${v.cliente}`, mLeft, 110);

        yPos = 150;

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("1. ESTRUCTURA FINANCIERA DEL ACTIVO", mLeft, yPos);
        yPos += 20;

        doc.setFillColor(240, 240, 240);
        doc.rect(mLeft, yPos, 532, 25, 'F');
        doc.setFontSize(10);
        doc.text("CONCEPTO", mLeft + 10, yPos + 16);
        doc.text("VALOR", 480, yPos + 16);
        yPos += 40;

        doc.setFont("helvetica", "normal");
        doc.text("Ingresos Totales Recaudados (Facturación):", mLeft + 10, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 150, 0);
        doc.text(`$ ${Math.round(v.ingresosTotales).toLocaleString('es-CO')}`, 480, yPos);
        yPos += 20;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("(-) Costos Directos e Insumos (Libro Diario PUC):", mLeft + 10, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 0, 0);
        doc.text(`-$ ${Math.round(v.costosContables).toLocaleString('es-CO')}`, 480, yPos);
        yPos += 25;

        doc.setDrawColor(200, 200, 200);
        doc.line(mLeft, yPos, 572, yPos);
        yPos += 20;

        doc.setFontSize(12);
        doc.text("EBITDA (UTILIDAD NETA) DEL PERIODO:", mLeft + 10, yPos);
        doc.setTextColor(v.ebitda >= 0 ? 0 : 200, v.ebitda >= 0 ? 150 : 0, 0);
        doc.text(`$ ${Math.round(v.ebitda).toLocaleString('es-CO')}`, 480, yPos);
        yPos += 20;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Margen Operativo Calculado: ${v.margenPorcentaje.toFixed(1)}%`, mLeft + 10, yPos);
        yPos += 40;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("2. DESGLOSE DE EGRESOS (LIBRO DIARIO)", mLeft, yPos);
        yPos += 20;

        if (v.registrosPUC.length === 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text("No se registraron egresos contables en este periodo.", mLeft + 10, yPos);
            yPos += 20;
        } else {
            doc.setFontSize(9);
            v.registrosPUC.forEach(puc => {
                if (yPos > 700) { doc.addPage(); yPos = 50; }
                doc.setFont("helvetica", "bold");
                doc.text(`• [PUC ${puc.puc}]`, mLeft + 5, yPos);
                doc.setFont("helvetica", "normal");
                let textoConcepto = puc.concepto.length > 70 ? puc.concepto.substring(0, 70) + "..." : puc.concepto;
                doc.text(textoConcepto, mLeft + 75, yPos);
                
                doc.setFont("helvetica", "bold");
                doc.setTextColor(200, 0, 0);
                doc.text(`-$ ${Math.round(puc.monto).toLocaleString('es-CO')}`, 490, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 15;
            });
            yPos += 15;
        }

        if (yPos > 600) { doc.addPage(); yPos = 50; }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("3. DETALLE TÉCNICO DE ÓRDENES (SERVICIOS PRESTADOS)", mLeft, yPos);
        yPos += 25;

        v.ordenes.forEach((orden, idx) => {
            if (yPos > 700) { doc.addPage(); yPos = 50; }

            doc.setFillColor(245, 248, 250);
            doc.rect(mLeft, yPos - 12, 532, 20, 'F');
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 100, 150);
            doc.text(`Misión OT #${idx + 1} | Fecha: ${orden.fecha} | Ingreso: $${Math.round(orden.ingreso).toLocaleString('es-CO')}`, mLeft + 5, yPos);
            yPos += 20;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Items y Labores Facturadas:", mLeft + 10, yPos);
            yPos += 15;
            
            doc.setFont("helvetica", "normal");
            if (orden.items && orden.items.length > 0) {
                orden.items.forEach(item => {
                    if (yPos > 730) { doc.addPage(); yPos = 50; }
                    let itemDesc = `• ${item.cantidad}x ${item.desc} (${item.tipo})`;
                    doc.text(itemDesc, mLeft + 15, yPos);
                    doc.text(`$${Math.round((item.venta || 0) * (item.cantidad || 1)).toLocaleString('es-CO')}`, 490, yPos);
                    yPos += 12;
                });
            } else {
                doc.text("• No hay items desglosados en la factura de esta orden.", mLeft + 15, yPos);
                yPos += 12;
            }
            yPos += 10;
        });

        doc.save(`FORENSE_${v.placaDetalle}_${inicio}_${fin}.pdf`);
        Swal.fire({
            title: 'PDF Generado',
            text: `Reporte extendido de ${v.placaDetalle} descargado con éxito.`,
            icon: 'success',
            background: '#0d1117', color: '#06b6d4'
        });
    };

    renderBaseUI();
}
