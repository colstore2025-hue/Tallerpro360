/**
 * autoRegisterModules.js
 * Importa todos los módulos del sistema
 * para auto-registro en moduleLoader
 * TallerPRO360
 */

console.log("🚀 Auto registro de módulos iniciado");

/* módulos ERP */

import "../modules/dashboard.js";
import "../modules/clientes.js";
import "../modules/ordenes.js";
import "../modules/inventario.js";
import "../modules/finanzas.js";
import "../modules/contabilidad.js";
import "../modules/pagosTaller.js";
import "../modules/ceo.js";
import "../modules/aiAssistant.js";
import "../modules/aiAdvisor.js";
import "../modules/configuracion.js";
import "../modules/reportes.js";

console.log("✅ Módulos importados correctamente");