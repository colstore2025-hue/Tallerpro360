/**
 * aiAutonomousFlow.js 🤖
 * ULTRA CORE IA: Autocuración + Generación + Gerencia Estratégica
 */
import { store } from "../core/store.js";
import { saveLog, getRecentLogs, getOrdenes } from "../services/dataService.js";
import { hablar } from "../voice/voiceCore.js";

export const AI_Engine = {

    // ==========================================
    // 1. GERENCIA ESTRATÉGICA (Análisis de Negocio)
    // ==========================================
    async analizarNegocio(empresaId) {
        try {
            const ordenes = await getOrdenes(empresaId);
            if (!ordenes || ordenes.length === 0) return this.construirRespuestaVacia();

            let totalIngresos = 0, totalCostos = 0, dataProcesada = [];

            ordenes.forEach(o => {
                const total = Number(o.total || o.valorTrabajo || 0);
                const costo = Number(o.costoTotal || 0);
                totalIngresos += total;
                totalCostos += costo;
                dataProcesada.push({ ...o, utilidad: total - costo });
            });

            const resumen = {
                ingresos: Math.round(totalIngresos),
                costos: Math.round(totalCostos),
                utilidad: Math.round(totalIngresos - totalCostos),
                ordenes: ordenes.length,
                ticketPromedio: Math.round(totalIngresos / ordenes.length),
                margen: Math.round(( (totalIngresos - totalCostos) / totalIngresos) * 100) || 0
            };

            return {
                resumen,
                alertas: this.generarAlertas(resumen, dataProcesada),
                sugerencias: this.generarSugerenciasAccionables(resumen)
            };
        } catch (e) {
            console.error("❌ Error en IA Gerente:", e);
            return null;
        }
    },

    generarAlertas(res, ordenes) {
        const a = [];
        if (res.utilidad < 0) a.push("❌ Pérdida financiera detectada");
        if (res.margen < 20) a.push("⚠️ Margen de ganancia crítico");
        if (res.costos > res.ingresos * 0.8) a.push("💸 Fuga de capital en costos");
        return a;
    },

    generarSugerenciasAccionables(res) {
        const s = [];
        if (res.ticketPromedio < 100000) s.push({ tipo: "PRECIO", msg: "Ajustar tarifas servicios base", impact: "ALTO" });
        if (res.ordenes < 10) s.push({ tipo: "MARKETING", msg: "Lanzar campaña recordatorio preventivo", impact: "MEDIO" });
        return s;
    },

    // ==========================================
    // 2. GENERACIÓN DE ÓRDENES (Voz/Texto a Data)
    // ==========================================
    async procesarEntradaIA(input, empresaId) {
        const ordenIA = {
            vehiculo: {
                marca: input.toLowerCase().includes("toyota") ? "Toyota" : "Genérico",
                placa: (input.match(/[A-Z]{3}[0-9]{3}/i) || ["POR ASIGNAR"])[0].toUpperCase(),
            },
            diagnostico: input.includes("freno") ? "Revisión Sistema Frenos" : "Diagnóstico General",
            valorTrabajo: 300000,
            estado: "borrador_ia"
        };

        // Guardar como sugerencia para el Dashboard
        await saveLog("ia_order_suggestion", { ordenIA, input, empresaId });
        return ordenIA;
    },

    // ==========================================
    // 3. AUTOCURACIÓN (Health Check)
    // ==========================================
    async systemSelfHealing(empresaId) {
        const logs = await getRecentLogs(empresaId, 5);
        for (const log of logs) {
            if (log.tipo === "error_sistema" && !log.reparado) {
                // Lógica de reparación (permisos/estructuras)
                const { fixTotalInicial } = await import("../system/firestoreGuardianGod.js");
                await fixTotalInicial(empresaId);
                await saveLog("ia_fix_success", { modulo: log.modulo, fecha: new Date() });
            }
        }
    },

    // ==========================================
    // 4. VOZ & MONITOREO
    // ==========================================
    notificarEstado(data) {
        if (!data) return;
        hablar(`Reporte: Ingresos ${data.resumen.ingresos}. Utilidad ${data.resumen.utilidad}.`);
    },

    construirRespuestaVacia: () => ({
        resumen: { ingresos: 0, costos: 0, utilidad: 0, ordenes: 0, ticketPromedio: 0, margen: 0 },
        alertas: ["📌 Sin datos operativos suficientes"],
        sugerencias: []
    })
};
