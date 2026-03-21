/**
 * NexusBusinessCoach.js
 * IA de Asesoría Estratégica y Voz
 */
import { hablar } from "../voice/voiceCore.js";

export const BusinessCoach = {
    // 🧠 El "Coach" analiza y prepara el discurso
    prepararAsesoria(metrics, aiAnalysis) {
        const nombre = localStorage.getItem("userName") || "Gerente";
        const utilidad = new Intl.NumberFormat('es-CO').format(metrics.utilidad);
        
        let discurso = `Hola ${nombre}. He analizado el taller. `;
        
        // Diagnóstico de Salud
        if (metrics.margen < 20) {
            discurso += `Nuestra rentabilidad está baja, apenas un ${metrics.margen.toFixed(1)}%. Tenemos que revisar los costos de repuestos urgente. `;
        } else if (metrics.margen > 35) {
            discurso += `Excelente gestión, el margen del ${metrics.margen.toFixed(1)}% nos permite pensar en escalar. `;
        }

        // Diagnóstico de Operación
        if (metrics.alertas.length > 3) {
            discurso += `Atención: detecto ${metrics.alertas.length} cuellos de botella. Hay órdenes con pérdida y stock crítico. `;
        }

        // Consejo de Coach
        const sugerencia = aiAnalysis?.sugerencias[0]?.msg || "Mantengamos el ritmo de facturación.";
        discurso += `Mi consejo de hoy: ${sugerencia}. ¿Quieres que profundicemos en algún área?`;

        return discurso;
    },

    // 🎙️ Activa la locución
    escucharResumen(metrics, aiAnalysis) {
        const mensaje = this.prepararAsesoria(metrics, aiAnalysis);
        hablar(mensaje);
    }
};
