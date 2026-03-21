/**
 * superAI-orchestrator.js - V3 ULTRA SINCRO
 * Nexus-X Starlink SAS · Inteligencia Centralizada
 */

class SuperAIOrchestrator {
  constructor() {
    this.initialized = false;
    this.modules = {};
    console.log("🧠 Orquestador en Standby (Ahorro de energía activo)");
  }

  /* 🚀 CARGA BAJO DEMANDA: Solo carga lo que se usa */
  async bootstrap() {
    if (this.initialized) return;
    try {
      // Importaciones dinámicas para velocidad relámpago en móvil
      const [Brain, Inv, Scan, Cust] = await Promise.all([
        import("./workshopBrain.js"),
        import("./inventoryAI.js"),
        import("./vehicleScanner.js"),
        import("../services/customerManager.js")
      ]);

      this.modules.workshopBrain = new Brain.default();
      this.modules.inventoryAI = new Inv.default();
      this.modules.vehicleScanner = new Scan.default();
      this.modules.customerManager = new Cust.default();

      this.initialized = true;
      console.log("🚀 Motores IA Sincronizados");
    } catch (e) {
      console.error("❌ Falla en ignición IA:", e);
    }
  }

  async processVehicleService(vehicleData, customerData) {
    // Asegurar que los motores estén encendidos antes de procesar
    await this.bootstrap();

    try {
      console.log("🔍 Analizando secuencia de servicio...");

      // 1. GESTIÓN DE CLIENTE (Usando tu lógica original pero optimizada)
      let customer = await this.modules.customerManager.searchCustomer(customerData?.phone);
      if (!customer) {
        const id = await this.modules.customerManager.createCustomer(customerData);
        customer = { id, ...customerData };
      }

      // 2. ESCÁNER + DIAGNÓSTICO (Ejecución en paralelo para ganar milisegundos)
      const [scannerDiagnosis, diagnosis] = await Promise.all([
        this.modules.vehicleScanner.scanVehicle(vehicleData?.obd || {}, vehicleData?.symptoms || []),
        this.modules.workshopBrain.runDiagnosis(vehicleData)
      ]);

      // 3. OPTIMIZADOR DE PRECIOS (Importación al vuelo)
      const { calcularPrecioInteligente } = await import("./pricingOptimizerAI.js");
      
      // ... resto de tu lógica de inventario ...

      const workOrder = {
        empresaId: localStorage.getItem("empresaId"), // Inyectamos contexto
        customerId: customer?.id,
        diagnosis: { ...diagnosis, scannerInsights: scannerDiagnosis },
        timestamp: new Date()
      };

      // 4. REGISTRO EN EL MOTOR GLOBAL
      await this.logAI(workOrder);
      
      return workOrder;

    } catch (error) {
      console.error("❌ Colapso en proceso IA:", error);
      return null;
    }
  }

  async logAI(data) {
    try {
      const { guardarConsultaIA } = await import("./motorIAglobal.js");
      await guardarConsultaIA({ tipo: "auto_orden", data });
    } catch (e) { console.warn("⚠️ Log IA offline"); }
  }
}

// INSTANCIA ÚNICA (Singleton)
const superAI = new SuperAIOrchestrator();
export default superAI;
