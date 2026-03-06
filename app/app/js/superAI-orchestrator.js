/**
 * SUPER AI ORCHESTRATOR
 * Cerebro central del sistema IA para talleres
 * Coordina diagnóstico, clientes, inventario y aprendizaje automático
 */

const WorkshopBrain = require('./workshopBrain');
const CustomerManager = require('./customerManager');
const InventoryAI = require('./inventoryAI');

class SuperAIOrchestrator {

    constructor() {
        this.workshopBrain = new WorkshopBrain();
        this.customerManager = new CustomerManager();
        this.inventoryAI = new InventoryAI();
    }

    /**
     * Proceso completo de atención de un vehículo
     */
    async processVehicleService(vehicleData, customerData) {

        console.log("🚗 Iniciando proceso inteligente de servicio...");

        // 1 Registrar o actualizar cliente
        const customer = await this.customerManager.registerOrUpdateCustomer(customerData);

        // 2 Diagnóstico IA
        const diagnosis = await this.workshopBrain.runDiagnosis(vehicleData);

        // 3 Revisar inventario para reparación
        const partsNeeded = diagnosis.partsNeeded;
        const inventoryStatus = await this.inventoryAI.checkParts(partsNeeded);

        // 4 Generar orden de trabajo inteligente
        const workOrder = {
            customerId: customer.id,
            vehicle: vehicleData,
            diagnosis: diagnosis,
            partsStatus: inventoryStatus,
            estimatedCost: this.calculateEstimate(diagnosis, inventoryStatus),
            timestamp: new Date()
        };

        console.log("🧠 Orden de trabajo generada con IA");

        return workOrder;
    }

    /**
     * Estimación automática de costos
     */
    calculateEstimate(diagnosis, inventoryStatus) {

        let laborCost = diagnosis.estimatedLaborHours * 40; // valor hora
        let partsCost = 0;

        inventoryStatus.forEach(part => {
            partsCost += part.price;
        });

        return {
            labor: laborCost,
            parts: partsCost,
            total: laborCost + partsCost
        };
    }

    /**
     * Aprendizaje automático basado en reparaciones
     */
    async learnFromRepair(repairData) {

        console.log("📚 IA aprendiendo de reparación completada");

        await this.workshopBrain.trainModel(repairData);
        await this.inventoryAI.updateDemandPrediction(repairData.partsUsed);
    }

}

module.exports = SuperAIOrchestrator;