/**
 * superAI-orchestrator.js - V3.5 ULTRA SINCRO 🛰️
 * NEXUS-X STARLINK SAS · INTELIGENCIA CENTRALIZADA (EDICIÓN RESILIENTE)
 * Optimizado para TallerPRO360 & Dashboard Aegis
 */

class SuperAIOrchestrator {
  constructor() {
    this.initialized = false;
    this.modules = {};
    // El contexto se recupera de múltiples fuentes para evitar el "Link Protocol Broken"
    this.empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    console.log("🧠 Nexus-X Brain: Orquestador en Standby (Escudo Térmico Activo)");
  }

  /**
   * 🛡️ BOOTSTRAP DE ALTA DISPONIBILIDAD
   * Carga módulos solo si el ID de empresa está validado.
   */
  async bootstrap() {
    if (this.initialized) return true;

    // Validación de seguridad para evitar colapsos en el Dashboard
    if (!this.empresaId || this.empresaId === "PENDIENTE") {
      this.empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
      if (!this.empresaId) {
        console.warn("⚠️ SuperAI: Sin ID de Empresa. Motores en modo limitado.");
        return false;
      }
    }

    try {
      console.log("🚀 Iniciando ignición de módulos IA...");
      
      // Importaciones dinámicas optimizadas para la infraestructura de TallerPRO360
      const [Brain, Inv, Scan, Cust, Rev] = await Promise.all([
        import("./workshopBrain.js"),
        import("./inventoryAI.js"),
        import("./vehicleScanner.js"),
        import("../services/customerManager.js"),
        import("./workshopRevenueOptimizer.js") // Módulo clave para el Dashboard
      ]);

      this.modules.workshopBrain = new Brain.default();
      this.modules.inventoryAI = new Inv.default();
      this.modules.vehicleScanner = new Scan.default();
      this.modules.customerManager = new Cust.default();
      this.modules.revenueAI = new Rev.default();

      this.initialized = true;
      console.log("✅ Motores IA Sincronizados con Éxito");
      return true;
    } catch (e) {
      console.error("🚨 Falla Crítica en Ignición IA:", e);
      return false;
    }
  }

  /**
   * 📊 FEEDBACK PARA DASHBOARD (Sincronización Aeroespacial)
   * Este método provee los "Insights" que el dashboard.js necesita mostrar.
   */
  async getDashboardInsights() {
    const ready = await this.bootstrap();
    if (!ready) return { status: "OFFLINE", msg: "Enlace de datos no detectado." };

    try {
      // Análisis heurístico del estado actual del taller
      const performance = await this.modules.revenueAI.analyzeCurrentROI(this.empresaId);
      const inventoryStatus = await this.modules.inventoryAI.checkCriticalStock(this.empresaId);

      return {
        status: "ACTIVE",
        optimizationRate: performance.efficiencyScore || 0,
        recommendation: performance.topAction || "Mantener monitoreo orbital.",
        criticalItems: inventoryStatus.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return { status: "ERROR", msg: "Error en telemetría IA." };
    }
  }

  /**
   * 🚗 PROCESO DE SERVICIO VEHICULAR (NÚCLEO OPERATIVO)
   */
  async processVehicleService(vehicleData, customerData) {
    const isReady = await this.bootstrap();
    if (!isReady) throw new Error("MOTORES_IA_OFFLINE");

    try {
      console.log("🔍 Analizando secuencia de servicio en Nexus-X...");

      // 1. GESTIÓN DE CLIENTE (Seguridad Triple-Check)
      let customer = await this.modules.customerManager.searchCustomer(customerData?.phone);
      if (!customer) {
        const newId = await this.modules.customerManager.createCustomer(customerData);
        customer = { id: newId, ...customerData };
      }

      // 2. ESCÁNER + DIAGNÓSTICO (Ejecución en paralelo / Baja latencia)
      const [scannerDiagnosis, diagnosis] = await Promise.all([
        this.modules.vehicleScanner.scanVehicle(vehicleData?.obd || {}, vehicleData?.symptoms || []),
        this.modules.workshopBrain.runDiagnosis(vehicleData)
      ]);

      // 3. OPTIMIZADOR DE PRECIOS (Importación 'On-the-Fly')
      const { pricingOptimizerAI } = await import("./pricingOptimizerAI.js");
      const smartPrice = await pricingOptimizerAI.calculate(diagnosis, this.empresaId);

      const workOrder = {
        empresaId: this.empresaId, // Inyección de contexto global segura
        customerId: customer?.id,
        diagnosis: { 
            ...diagnosis, 
            scannerInsights: scannerDiagnosis,
            suggestedPrice: smartPrice 
        },
        metadata: {
            origin: "NEXUS-X_MOBILE",
            version: "V3.5_ULTRA"
        },
        timestamp: new Date()
      };

      // 4. REGISTRO EN EL MOTOR GLOBAL PARA BI (Dashboard)
      await this.logAI(workOrder);
      
      return workOrder;

    } catch (error) {
      console.error("❌ Colapso en Proceso IA:", error);
      return null;
    }
  }

  /**
   * 📝 LOG DE INTELIGENCIA
   */
  async logAI(data) {
    try {
      const { guardarConsultaIA } = await import("./motorIAglobal.js");
      await guardarConsultaIA({ 
        tipo: "auto_orden_pentagono", 
        data,
        empresaId: this.empresaId 
      });
    } catch (e) { 
      console.warn("⚠️ Telemetría de Log IA desconectada."); 
    }
  }
}

// INSTANCIA ÚNICA (Singleton) - Exportación blindada
const superAI = new SuperAIOrchestrator();
export default superAI;
