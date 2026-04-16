/**
 * 🧠 FINANCIAL PREDICTOR AI - NEXUS-X CORE V2.0
 * Motor financiero autónomo y robusto
 */

// ======================================================
// 🔒 NORMALIZACIÓN SEGURA
// ======================================================

function toNumber(val) {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

// ======================================================
// 📊 UTILIDADES
// ======================================================

function sum(arr, key) {
  return arr.reduce((acc, item) => acc + toNumber(item[key]), 0);
}

function avg(arr, key) {
  return arr.length ? sum(arr, key) / arr.length : 0;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// ======================================================
// 📈 1. PREDICCIÓN DE INGRESOS (MEJORADA)
// ======================================================

export function predictRevenueNextMonth(ordenes = []) {
  if (!ordenes.length) return 0;

  const data = ordenes.slice(-30);

  const total = sum(data, "total");
  const promedio = total / data.length;

  const tendencia = calcularTendencia(data);

  const proyeccion = promedio * 30 * (1 + tendencia);

  return Math.round(proyeccion);
}

function calcularTendencia(data) {
  if (data.length < 10) return 0;

  const mitad = Math.floor(data.length / 2);

  const primera = sum(data.slice(0, mitad), "total");
  const segunda = sum(data.slice(mitad), "total");

  if (primera === 0) return 0;

  let crecimiento = (segunda - primera) / primera;

  // 🔒 limitar crecimiento para evitar locuras
  return Math.max(-0.5, Math.min(0.5, crecimiento));
}

// ======================================================
// 💰 2. RIESGO DE CAJA
// ======================================================

export function predictCashFlowRisk({ ingresos = 0, egresos = 0, caja = 0 }) {
  ingresos = toNumber(ingresos);
  egresos = toNumber(egresos);
  caja = toNumber(caja);

  const flujo = ingresos - egresos;

  if (caja + flujo < 0) {
    return { nivel: "ALTO", score: 90, mensaje: "Déficit proyectado" };
  }

  if (flujo < 0) {
    return { nivel: "MEDIO", score: 60, mensaje: "Flujo negativo" };
  }

  return { nivel: "BAJO", score: 20, mensaje: "Flujo saludable" };
}

// ======================================================
// 📦 3. CAPITAL ATRAPADO
// ======================================================

export function calculateTrappedCapital(inventario = [], ordenesProceso = []) {
  return {
    inventario: sum(inventario, "valor"),
    enProceso: sum(ordenesProceso, "total"),
    total: sum(inventario, "valor") + sum(ordenesProceso, "total")
  };
}

// ======================================================
// ⚠️ 4. CUELLOS DE BOTELLA
// ======================================================

export function detectBottleneck({ inventario = 0, caja = 0 }) {
  inventario = toNumber(inventario);
  caja = toNumber(caja);

  if (caja <= 0 && inventario > 0) {
    return {
      tipo: "CRITICO",
      mensaje: "Sin liquidez con capital inmovilizado"
    };
  }

  if (inventario > caja * 2) {
    return {
      tipo: "CUELLO_BOTELLA",
      mensaje: "Capital atrapado en inventario"
    };
  }

  return null;
}

// ======================================================
// 🧮 5. SCORE FINANCIERO
// ======================================================

export function financialHealthScore({ caja = 0, ingresos = 0, egresos = 0, inventario = 0 }) {
  caja = toNumber(caja);
  ingresos = toNumber(ingresos);
  egresos = toNumber(egresos);
  inventario = toNumber(inventario);

  let score = 100;

  const flujo = ingresos - egresos;
  const margen = ingresos ? flujo / ingresos : 0;

  if (caja < 0) score -= 40;
  if (flujo < 0) score -= 25;
  if (inventario > ingresos * 1.5) score -= 20;
  if (margen < 0.2) score -= 15;

  return clamp(score);
}

// ======================================================
// 🎯 6. ESTADO
// ======================================================

export function classifyFinancialStatus(score) {
  if (score <= 40) return "CRITICO";
  if (score <= 70) return "INESTABLE";
  return "SALUDABLE";
}

// ======================================================
// 🤖 7. CEO AI (MEJORADO)
// ======================================================

export function generateCEODecisions(data) {
  const decisiones = [];

  if (data.caja < 0) {
    decisiones.push({ prioridad: "ALTA", accion: "Cobrar cartera urgente" });
  }

  if (data.inventario > data.ingresos * 1.5) {
    decisiones.push({ prioridad: "ALTA", accion: "Rotar inventario con descuentos" });
  }

  if (data.ingresos - data.egresos < 0) {
    decisiones.push({ prioridad: "MEDIA", accion: "Reducir costos operativos" });
  }

  if (data.score < 40) {
    decisiones.push({ prioridad: "CRITICA", accion: "Reestructurar operación" });
  }

  if (data.score > 70) {
    decisiones.push({ prioridad: "OPORTUNIDAD", accion: "Invertir en crecimiento" });
  }

  return decisiones;
}

// ======================================================
// 🔮 8. SIMULADOR
// ======================================================

export function simulateScenario(baseData, cambios = {}) {
  const simulated = { ...baseData };

  if (cambios.reducirInventario) {
    simulated.inventario *= (1 - cambios.reducirInventario);
  }

  if (cambios.incrementarIngresos) {
    simulated.ingresos *= (1 + cambios.incrementarIngresos);
  }

  if (cambios.reducirGastos) {
    simulated.egresos *= (1 - cambios.reducirGastos);
  }

  const score = financialHealthScore(simulated);

  return {
    escenario: simulated,
    score,
    estado: classifyFinancialStatus(score)
  };
}

// ======================================================
// 🚀 9. MASTER ENGINE
// ======================================================

export function runFinancialAnalysis(input) {

  try {

    const {
      ordenes = [],
      inventario = [],
      ordenesProceso = [],
      ingresos = 0,
      egresos = 0,
      caja = 0
    } = input || {};

    const revenuePrediction = predictRevenueNextMonth(ordenes);

    const riesgo = predictCashFlowRisk({ ingresos, egresos, caja });

    const capital = calculateTrappedCapital(inventario, ordenesProceso);

    const bottleneck = detectBottleneck({
      inventario: capital.total,
      caja
    });

    const score = financialHealthScore({
      caja,
      ingresos,
      egresos,
      inventario: capital.total
    });

    const estado = classifyFinancialStatus(score);

    const decisiones = generateCEODecisions({
      caja,
      ingresos,
      egresos,
      inventario: capital.total,
      score
    });

    return {
      ok: true,
      revenuePrediction,
      riesgo,
      capital,
      bottleneck,
      score,
      estado,
      decisiones
    };

  } catch (err) {

    console.error("🔥 Financial AI Error:", err);

    return {
      ok: false,
      error: "Fallo en análisis financiero",
      score: 0,
      estado: "CRITICO",
      decisiones: []
    };
  }
}