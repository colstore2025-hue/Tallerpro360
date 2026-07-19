/**
 * 🏛️ TALLERPRO360 - REPORTES & AUDITORÍA FORENSE v18.0.0
 * 📜 SCRIPT ID: #NEXUS-X-REPORTS-2026-V18
 * CONSOLIDACIÓN: CORRECCIÓN DE DOBLE TRIBUTACIÓN Y PDF EXTENDIDO
 * DESARROLLADOR: WILLIAM JEFFRY URQUIJO CUBILLOS & GEMINI AI PRO
 */

import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

// Variable global para almacenar la data procesada en memoria y usarla en el PDF
window.nexusMemoriaFlota = {};

export default async function reportes(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    if (!empresaId) {
        container.innerHTML = `<div class="p-10 orbitron text-red-500 font-black text-center">ERROR CRÍTICO: NO_EMPRESA_ID_DETECTED</div>`;
        return;
    }

    const renderBaseUI = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 bg-[#05070a] min-h-screen text-slate-100 font-sans pb-40">
            <header class="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12 border-b-2 border-cyan-500 pb-8">
                <div class="space-y-1">
                    <h1 class="orbitron text-5xl lg:text-7xl font-black italic tracking-tighter text-white uppercase">AUDITORÍA<span class="text-cyan-500">_SAP</span></h1>
                    <p class="text-[10px] orbitron text-slate-400 font-bold tracking-[0.5em] uppercase italic">Inteligencia de Negocios & Rentabilidad Real</p>
                </div>
                <div class="flex gap-4">
                    <input type="month" id="f-mes-reporte" class="bg-[#0d1117] border border-cyan-500/30 text-cyan-400 p-3 rounded-xl orbitron font-black outline-none focus:border-cyan-500">
                    <button id="btnGenerarData" class="px-8 py-3 bg-cyan-500 text-black rounded-xl orbitron text-[12px] font-black hover:bg-white transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                        <i class="fas fa-satellite-dish mr-2"></i> ESCANEAR FLOTA
                    </button>
                </div>
            </header>

            <!-- TABLERO DE RESUMEN GLOBAL -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" id="kpi-globales">
                <div class="bg-[#0d1117] p-8 rounded-3xl border border-white/5">
                    <h3 class="orbitron text-[10px] text-slate-500 uppercase font-black mb-2">Ingresos Consolidados</h3>
                    <p class="orbitron text-4xl text-green-400 font-black" id="kpi-ingresos">$0</p>
                </div>
                <div class="bg-[#0d1117] p-8 rounded-3xl border border-white/5">
                    <h3 class="orbitron text-[10px] text-slate-500 uppercase font-black mb-2">Costos Operativos Directos</h3>
                    <p class="orbitron text-4xl text-red-400 font-black" id="kpi-costos">$0</p>
                </div>
                <div class="bg-cyan-950/20 p-8 rounded-3xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,242,255,0.05)]">
                    <h3 class="orbitron text-[10px] text-cyan-500 uppercase font-black mb-2">EBITDA Global (Utilidad Real)</h3>
                    <p class="orbitron text-5xl text-cyan-400 font-black italic" id="kpi-ebitda">$0</p>
                </div>
            </div>

            <div class="bg-[#0d1117] rounded-[2rem] border border-white/5 overflow-hidden">
                <div class="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center">
                    <h2 class="orbitron text-[11px] text-white uppercase font-black tracking-widest">Estructura Operativa por Vehículo</h2>
                </div>
                <div class="p-0 overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-white/10 bg-black/60">
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black">Vehículo / Cliente</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-center">Órdenes</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">Ingreso Recaudado</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">Egresos (Contables)</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-right">EBITDA Real</th>
                                <th class="p-6 text-[10px] orbitron text-slate-500 uppercase font-black text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-flota" class="text-sm font-mono text-slate-300">
                            <tr><td colspan="6" class="p-10 text-center text-slate-600 orbitron">Seleccione un mes y presione Escanear Flota</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        // Preseleccionar mes actual
        const hoy = new Date();
        document.getElementById("f-mes-reporte").value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        
        document.getElementById("btnGenerarData").addEventListener("click", procesarAuditoria);
    };

    // ==========================================
    // 🧠 MOTOR DE CÁLCULO ESTRICTO (LA SOLUCIÓN AL FANTASMA)
    // ==========================================
    const procesarAuditoria = async () => {
        const btn = document.getElementById("btnGenerarData");
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> CALCULANDO...`;
        btn.disabled = true;

        const mesSeleccionado = document.getElementById("f-mes-reporte").value; // Formato YYYY-MM
        if (!mesSeleccionado) return Swal.fire("Error", "Seleccione un mes válido", "error");

        try {
            // 1. Traer Órdenes del mes (Para obtener Ingresos e Items facturados)
            const qOrdenes = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
            const snapOrdenes = await getDocs(qOrdenes);
            
            // 2. Traer Contabilidad del mes (Para obtener Costos Estrictos)
            const qConta = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId));
            const snapConta = await getDocs(qConta);

            let flota = {};
            let totalIngresosG = 0;
            let totalCostosG = 0;

            // --- FASE A: PROCESAR INGRESOS Y OPERATIVA (Órdenes) ---
            snapOrdenes.forEach(doc => {
                const data = doc.data();
                // Filtro temporal básico por mes (asumiendo formato ISO en fecha_creacion_manual o createdAt)
                const fecha = data.fecha_creacion_manual || data.createdAt || "";
                if (!fecha.includes(mesSeleccionado)) return;

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
                        registrosPUC: []
                    };
                }

                // El ingreso real es el Total de la factura
                const ingresoOrden = Number(data.total || data.costos_totales?.total || 0);
                flota[placa].ingresosTotales += ingresoOrden;
                totalIngresosG += ingresoOrden;
                
                flota[placa].ordenes.push({
                    id: data.id,
                    fecha: fecha.split('T')[0],
                    ingreso: ingresoOrden,
                    items: data.items || [],
                    bitacora: data.bitacora_ia || "Sin registro"
                });
            });

            // --- FASE B: PROCESAR COSTOS ESTRICTOS (Libro Diario Contabilidad) ---
            snapConta.forEach(doc => {
                const data = doc.data();
                const fecha = data.fecha_registro || data.fecha || "";
                if (!fecha.includes(mesSeleccionado)) return;

                // Solo tomamos cuentas de egreso/costo (Evitamos doble conteo)
                if (data.tipo === "costo_directo_ot" || data.tipo === "gasto_insumo_ot") {
                    const placa = (data.placa || "DESCONOCIDO").toUpperCase();
                    
                    // Si el costo existe pero la orden fue de otro mes, lo agregamos a la flota para que cuadre la caja
                    if (!flota[placa]) {
                        flota[placa] = { cliente: "AJUSTE CONTABLE", placa: placa, placaDetalle: placa, ordenes: [], ingresosTotales: 0, costosContables: 0, ebitda: 0, registrosPUC: [] };
                    }

                    const montoCosto = Number(data.monto || data.debito || 0);
                    flota[placa].costosContables += montoCosto;
                    totalCostosG += montoCosto;

                    flota[placa].registrosPUC.push({
                        puc: data.puc,
                        concepto: data.concepto,
                        monto: montoCosto
                    });
                }
            });

            // --- FASE C: CÁLCULO DE EBITDA Y RENDERIZADO ---
            window.nexusMemoriaFlota = flota; // Guardar para el PDF

            const tbody = document.getElementById("tabla-flota");
            tbody.innerHTML = "";

            Object.keys(flota).sort().forEach(placa => {
                const v = flota[placa];
                v.ebitda = v.ingresosTotales - v.costosContables;

                const colorEbitda = v.ebitda >= 0 ? 'text-cyan-400' : 'text-red-400';

                tbody.innerHTML += `
                <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td class="p-6">
                        <div class="orbitron font-black text-white text-lg group-hover:text-cyan-400 transition-colors">${v.placaDetalle}</div>
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
                    <td class="p-6 text-right ${colorEbitda} font-black text-lg italic tracking-tight">
                        $${Math.round(v.ebitda).toLocaleString('es-CO')}
                    </td>
                    <td class="p-6 text-center">
                        <button onclick="window.generarPDFActivo('${placa}')" class="bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-4 py-2 rounded-lg hover:bg-cyan-500 hover:text-black transition-all orbitron text-[10px] font-black uppercase">
                            <i class="fas fa-file-pdf mr-1"></i> PDF
                        </button>
                    </td>
                </tr>`;
            });

            if(Object.keys(flota).length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-center text-slate-500 orbitron">NO HAY DATOS EN EL PERIODO SELECCIONADO</td></tr>`;
            }

            // Actualizar KPIs Globales
            document.getElementById("kpi-ingresos").innerText = `$${Math.round(totalIngresosG).toLocaleString('es-CO')}`;
            document.getElementById("kpi-costos").innerText = `-$${Math.round(totalCostosG).toLocaleString('es-CO')}`;
            document.getElementById("kpi-ebitda").innerText = `$${Math.round(totalIngresosG - totalCostosG).toLocaleString('es-CO')}`;
            document.getElementById("kpi-ebitda").className = `orbitron text-5xl font-black italic ${totalIngresosG - totalCostosG >= 0 ? 'text-cyan-400' : 'text-red-500'}`;

        } catch (error) {
            console.error(error);
            Swal.fire("Error del Sistema", "Fallo al cruzar las bases de datos: " + error.message, "error");
        } finally {
            btn.innerHTML = `<i class="fas fa-satellite-dish mr-2"></i> ESCANEAR FLOTA`;
            btn.disabled = false;
        }
    };

    // ==========================================
    // 🖨️ GENERADOR FORENSE PDF EXTENDIDO
    // ==========================================
    window.generarPDFActivo = (placa) => {
        const v = window.nexusMemoriaFlota[placa];
        if (!v) return Swal.fire("Error", "Datos no encontrados en memoria", "error");

        // Verificación de jsPDF (Soporta carga por CDN)
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'letter');
        
        const mLeft = 40;
        let yPos = 40;

        // Estilos Base
        doc.setFillColor(5, 7, 10); // Fondo oscuro cabecera
        doc.rect(0, 0, 612, 120, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(6, 182, 212); // Cyan
        doc.setFontSize(22);
        doc.text("TALLERPRO360", mLeft, 50);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("// REPORTE FORENSE EXTENDIDO", 225, 50);

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        const mesTxt = document.getElementById("f-mes-reporte").value;
        doc.text(`PERIODO EVALUADO: ${mesTxt} | EMISIÓN: ${new Date().toLocaleDateString()}`, mLeft, 70);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(`PLACA UNIDAD:    ${v.placaDetalle}`, mLeft, 95);
        doc.text(`CLIENTE / FLOTA: ${v.cliente}`, mLeft, 110);

        yPos = 150;

        // --- SECCIÓN 1: ESTRUCTURA INTEGRAL CONSOLIDADA ---
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
        doc.text("Suma Ingresos Totales Recaudados (Facturación):", mLeft + 10, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 150, 0);
        doc.text(`$ ${Math.round(v.ingresosTotales).toLocaleString('es-CO')}`, 480, yPos);
        yPos += 20;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("(-) Suma Costos Directos e Insumos (Libro Diario PUC):", mLeft + 10, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 0, 0);
        doc.text(`-$ ${Math.round(v.costosContables).toLocaleString('es-CO')}`, 480, yPos);
        yPos += 25;

        // Linea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(mLeft, yPos, 572, yPos);
        yPos += 20;

        doc.setFontSize(12);
        doc.text("EBITDA (UTILIDAD NETA) DEL PERIODO:", mLeft + 10, yPos);
        doc.setTextColor(v.ebitda >= 0 ? 0 : 200, v.ebitda >= 0 ? 150 : 0, 0);
        doc.text(`$ ${Math.round(v.ebitda).toLocaleString('es-CO')}`, 480, yPos);
        yPos += 40;

        // --- SECCIÓN 2: AUDITORÍA DE COSTOS PUC ---
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
                if (yPos > 700) { doc.addPage(); yPos = 50; } // Salto de página
                doc.setFont("helvetica", "bold");
                doc.text(`• [PUC ${puc.puc}]`, mLeft + 5, yPos);
                doc.setFont("helvetica", "normal");
                // Recortar texto largo
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

        // --- SECCIÓN 3: HISTORIAL DE LABORES (QUÉ SE LE HIZO AL VEHÍCULO) ---
        if (yPos > 600) { doc.addPage(); yPos = 50; } // Asegurar espacio para sección 3

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
            doc.text(`Misión OT #${idx + 1} | Fecha Ingreso: ${orden.fecha} | Ingreso Facturado: $${Math.round(orden.ingreso).toLocaleString('es-CO')}`, mLeft + 5, yPos);
            yPos += 20;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("Repuestos y Labores Facturadas a Cliente:", mLeft + 10, yPos);
            yPos += 15;
            
            doc.setFont("helvetica", "normal");
            if (orden.items && orden.items.length > 0) {
                orden.items.forEach(item => {
                    if (yPos > 730) { doc.addPage(); yPos = 50; }
                    let itemDesc = `• ${item.cantidad}x ${item.desc} (${item.tipo})`;
                    doc.text(itemDesc, mLeft + 15, yPos);
                    doc.text(`$${Math.round(item.venta * item.cantidad).toLocaleString('es-CO')}`, 490, yPos);
                    yPos += 12;
                });
            } else {
                doc.text("• No hay items desglosados en la factura de esta orden.", mLeft + 15, yPos);
                yPos += 12;
            }
            yPos += 10;
        });

        // Generar y abrir PDF
        doc.save(`FORENSE_${v.placaDetalle}_${mesTxt}.pdf`);
        Swal.fire({
            title: 'PDF Generado',
            text: `Reporte extendido de ${v.placaDetalle} descargado con éxito.`,
            icon: 'success',
            background: '#0d1117', color: '#06b6d4'
        });
    };

    // Render Inicial
    renderBaseUI();
}
