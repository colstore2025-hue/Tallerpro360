/**
 * aiAutonomousFlow.js 🤖
 * MOTOR DE IA AUTÓNOMA: Autocuración + Generación de Órdenes
 */
import { store } from "../core/store.js";
import { saveLog, getRecentLogs, createDocument } from "../services/dataService.js";

export const AI_Engine = {

    // ==========================================
    // 1. MÓDULO DE AUTOCURACIÓN (Self-Healing)
    // ==========================================
    async checkSystemHealth(empresaId) {
        console.log("🧠 IA Guardián: Escaneando logs de error...");
        const logs = await getRecentLogs(empresaId, 10);
        
        for (const log of logs) {
            if (log.tipo === "error_sistema" && !log.reparado) {
                await this.applyAutoFix(log, empresaId);
            }
        }
    },

    async applyAutoFix(log, empresaId) {
        console.warn(`🛠️ Intentando reparación automática para: ${log.modulo}`);
        let fixed = false;

        // Diccionario de soluciones según el mensaje de error
        if (log.mensaje.includes("permission-denied") || log.mensaje.includes("quota")) {
            const { activarModoDiosGuardian } = await import("../system/firestoreGuardianGod.js");
            activarModoDiosGuardian(empresaId);
            fixed = true;
        }

        if (log.mensaje.includes("not found") || log.mensaje.includes("undefined")) {
            const { fixTotalInicial } = await import("../system/firestoreGuardianGod.js");
            await fixTotalInicial(empresaId);
            fixed = true;
        }

        if (fixed) {
            await saveLog("ia_fix_success", {
                modulo: log.modulo,
                detalle: "Estructura de DB o permisos refrescados",
                fecha: new Date().toISOString()
            });
        }
    },

    // ==========================================
    // 2. MÓDULO DE GENERACIÓN DE ÓRDENES
    // ==========================================
    async generarOrdenInteligente(input, empresaId) {
        try {
            console.log("🤖 IA Analizando entrada de voz/texto:", input);

            const ordenBorrador = {
                cliente: {
                    nombre: "Cliente por identificar",
                    clienteId: "pendiente"
                },
                vehiculo: {
                    marca: this.detectarMarca(input),
                    modelo: this.detectarModelo(input),
                    placa: this.detectarPlaca(input)
                },
                diagnostico: this.detectarDiagnostico(input),
                items: this.detectarRepuestos(input),
                valorTrabajo: 300000,
                estado: "borrador_ia",
                creadoEn: new Date(),
                fuente: "AI_Autonomous_Flow"
            };

            ordenBorrador.total = this.calcularTotal(ordenBorrador);

            // Guardar automáticamente en ia_logs para que el usuario la apruebe en el Dashboard
            await saveLog("ia_order_suggestion", {
                orden: ordenBorrador,
                input_original: input,
                empresaId: empresaId
            });

            return ordenBorrador;

        } catch (e) {
            console.error("Error en Generador IA:", e);
            return null;
        }
    },

    // HELPERS DE DETECCIÓN (Tu lógica mejorada)
    detectarMarca: (t) => t.toLowerCase().includes("toyota") ? "Toyota" : 
                         t.toLowerCase().includes("chevrolet") ? "Chevrolet" : 
                         t.toLowerCase().includes("nissan") ? "Nissan" : "Genérico",

    detectarModelo: (t) => t.toLowerCase().includes("corolla") ? "Corolla" : 
                          t.toLowerCase().includes("hilux") ? "Hilux" : "",

    detectarPlaca: (t) => {
        const match = t.match(/[A-Z]{3}[0-9]{3}/i);
        return match ? match[0].toUpperCase() : "POR ASIGNAR";
    },

    detectarDiagnostico: (t) => {
        if (t.includes("freno")) return "Revisión Sistema de Frenos";
        if (t.includes("aceite") || t.includes("mantenimiento")) return "Mantenimiento Preventivo";
        return "Diagnóstico General";
    },

    detectarRepuestos: (t) => {
        const piezas = [];
        if (t.includes("freno")) piezas.push({ pieza: "Pastillas de freno", cant: 1, precio: 120000 });
        if (t.includes("aceite")) piezas.push({ pieza: "Filtro de aceite", cant: 1, precio: 45000 });
        return piezas;
    },

    calcularTotal: (o) => {
        let total = o.items.reduce((sum, i) => sum + (i.cant * i.precio), 0);
        return total + Number(o.valorTrabajo || 0);
    }
};
