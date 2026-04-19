/**
 * 🦾 NEXUS-X STRATEGIC COMMANDER V35.5 - ULTRA-STABLE BI EDITION
 * William Jeffry Urquijo Cubillos // Nexus AI
 * Enfoque: Dashboard BI Inmerso, KPIs BESA Lab & VPC EAFIT
 */

// ... (imports de Firebase)

export default async function ultraReportModule(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let rawData = [];

    const runIntelligenceEngine = async () => {
        const q = query(collection(db, "ordenes"), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        rawData = snap.docs.map(doc => {
            const d = doc.data();
            
            // --- CÁLCULOS KPI BESA LAB (Chapa y Pintura) ---
            const hDisponibles = Number(d.horas_disponibles || 8); // Base jornada
            const hTrabajadas = Number(d.horas_reales || 0);
            const hFacturadas = Number(d.horas_peritadas || 0);

            const productividad = (hTrabajadas / hDisponibles) * 100;
            const eficiencia = hTrabajadas > 0 ? (hFacturadas / hTrabajadas) * 100 : 0;
            
            // --- CÁLCULOS FINANCIEROS ---
            const ventaRecambios = Number(d.venta_recambios || 0);
            const costoRecambios = Number(d.costo_recambios || 0);
            const margenRecambios = ventaRecambios > 0 ? ((ventaRecambios - costoRecambios) / ventaRecambios) * 100 : 0;

            // --- CÁLCULO VPC (Valor Percibido) ---
            const fEntrada = d.fecha_entrada?.toDate() || new Date();
            const fEntrega = d.fecha_entrega?.toDate() || new Date();
            const tiempoCiclo = Math.ceil((fEntrega - fEntrada) / (1000 * 60 * 60 * 24));

            return { 
                id: doc.id, ...d, 
                productividad, eficiencia, margenRecambios, tiempoCiclo,
                ventaTotal: ventaRecambios + (hFacturadas * Number(d.valor_hora || 0))
            };
        });

        renderUltraDashboard();
    };

    const exportToUltraExcel = () => {
        const wb = XLSX.utils.book_new();

        // 1. HOJA DE MANDO (RESUMEN EJECUTIVO)
        const summaryData = [
            ["NEXUS-X STRATEGIC DASHBOARD", "", "FECHA:", new Date().toLocaleDateString()],
            [],
            ["INDICADOR", "VALOR", "STATUS", "META"],
            ["Productividad Global", `${calculateAvg('productividad')}%`, calculateAvg('productividad') > 85 ? "ÓPTIMO" : "REVISAR", "85%"],
            ["Eficiencia Operativa", `${calculateAvg('eficiencia')}%`, calculateAvg('eficiencia') > 100 ? "EXCELENTE" : "PÉRDIDA", "100%"],
            ["Margen Recambios", `${calculateAvg('margenRecambios')}%`, "ESTABLE", "30%"],
            ["Tiempo Ciclo (Días)", calculateAvg('tiempoCiclo'), "COMPETITIVO", "4 Días"]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Dashboard_BI");

        // 2. HOJA DE OPERACIONES (EL CORAZÓN)
        // Transformamos los datos para que Excel los entienda como base de datos profesional
        const opsData = rawData.map(o => ({
            Placa: o.placa,
            Cliente: o.cliente,
            "H. Facturadas": o.horas_peritadas,
            "H. Reales": o.horas_reales,
            "Eficiencia %": o.eficiencia.toFixed(2),
            "Venta Total": o.ventaTotal,
            "Días en Taller": o.tiempoCiclo,
            "Estado VPC": o.tiempoCiclo <= 4 ? "Fidelizado" : "En Riesgo"
        }));
        const wsOps = XLSX.utils.json_to_sheet(opsData);
        XLSX.utils.book_append_sheet(wb, wsOps, "Data_Operativa");

        XLSX.writeFile(wb, `NexusX_Ultra_BI_${empresaId}.xlsx`);
    };

    // ... (UI Rendering)
}
