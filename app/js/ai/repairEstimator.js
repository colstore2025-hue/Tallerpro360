/**
 * 🛠️ NEXUS-X REPAIR ESTIMATOR V26.0
 * Fusión: Diagnóstico (Antiguo) + Tiempos Estándar Colombia (Nuevo)
 */

class RepairEstimator {
    constructor() {
        this.database = {
            "Sobrecalentamiento": { parts: ["Termostato", "Refrigerante"], hours: 3, baseCost: 185000 },
            "Frenos": { parts: ["Pastillas", "Líquido"], hours: 2.5, baseCost: 150000 },
            "Distribución": { parts: ["Correa", "Tensores"], hours: 6, baseCost: 350000 },
            "Suspensión": { parts: ["Amortiguadores", "Bujes"], hours: 4, baseCost: 220000 }
        };
    }

    estimate(diagnosis, kilometraje = 0) {
        let response = {
            items: [],
            totalHours: 0,
            preventiveAlerts: [],
            totalEstimated: 0
        };

        diagnosis.forEach(issue => {
            const data = this.database[issue] || { parts: ["Genérico"], hours: 2, baseCost: 85000 };
            response.items.push(data);
            response.totalHours += data.hours;
            response.totalEstimated += data.baseCost;
        });

        // IA PREDICTIVA: Si el carro tiene más de 50k km, sugerir distribución
        if (kilometraje >= 50000) {
            response.preventiveAlerts.push("ALERTA: Requiere inspección de Correa de Distribución por Kilometraje.");
        }

        return response;
    }
}

export default new RepairEstimator();
