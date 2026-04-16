// ======================================================
// 🧠 FINANCIAL PREDICTOR AI - TallerPRO360
// Motor financiero inteligente (versión 1.0)
// ======================================================

// ------------------------------------------------------
// 📊 UTILIDADES INTERNAS
// ------------------------------------------------------

function sum(arr, key) {
  return arr.reduce((acc, item) => acc + (item[key] || 0), 0);
}

function avg(arr, key) {
  if (!arr.length) return 0;
  return sum(arr, key) / arr.length;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

// ------------------------------------------------------
// 📈 1. PREDICCIÓN DE INGRESOS
// ------------------------------------------------------

export function predictRevenueNextMonth(ordenes = []) {
  if (!ordenes.length) return 0;

  const ultimos30 = ordenes.slice(-30);

  const total = sum(ultimos30, "total");
  const promedioDiario = total / (ultimos30.length || 1);

  const crecimiento = calcularTendencia(ultimos30);

  const proyeccion = promedioDiario * 30 * (1 + crecimiento);

  return Math.round(proyeccion);
}

function calcularTendencia(data) {
  if (data.length < 10) return 0;

  const mitad = Math.floor(data.length / 2);

  const primera = sum(data.slice(0, mitad), "total");
  const segunda = sum(data.slice(mitad), "total");

  if (primera === 0) return 0;

  return (segunda - primera) / primera;
}

// ------------------------------------------------------
// 💰 2. RIESGO DE FLUJO DE CAJA
// ------------------------------------------------------

export function predictCashFlowRisk({
  ingresos = 0,
  egresos = 0,
  caja = 0
}) {
  const flujo = ingresos - egresos;

  if (caja + flujo < 0) {
    return {
      nivel: "ALTO",
      score: 90,
      mensaje: "Entrarás en déficit en menos de 30 días"
    };
  }

  if (flujo < 0) {
    return {
      nivel: "MEDIO",
      score: 60,
      mensaje: "Flujo negativo, reduce gastos o aumenta ingresos"
    };
  }

  return {
    nivel: "BAJO",
    score: 20,
    mensaje: "Flujo saludable"
  };
}

// ------------------------------------------------------
// 📦 3. CAPITAL ATRAPADO
// ------------------------------------------------------

export function calculateTrappedCapital(
  inventario = [],
  ordenesProceso = []
) {
  const inventarioTotal = sum(inventario, "valor");
  const enProceso = sum(ordenesProceso, "total");

  return {
    inventario: inventarioTotal,
    enProceso: enProceso,
    total: inventarioTotal + enProceso
  };
}

// ------------------------------------------------------
// ⚠️ 4. DETECCIÓN DE CUELLOS DE BOTELLA
// ------------------------------------------------------

export function detectBottleneck({ inventario = 0, caja = 0 }) {
  if (caja === 0 && inventario > 0) {
    return {
      tipo: "CRITICO",
      mensaje: "Sin liquidez y con capital detenido en inventario"
    };
  }

  if (inventario > caja * 2) {
    return {
      tipo: "CUELLO_BOTELLA",
      mensaje: "Demasiado capital detenido en inventario"
    };
  }

  return null;
}

// ------------------------------------------------------
// 🧮 5. SCORE DE SALUD FINANCIERA
// ------------------------------------------------------

export function financialHealthScore({
  caja = 0,
  ingresos = 0,
  egresos = 0,
  inventario = 0
}) {
  let score = 100;

  const flujo = ingresos - egresos;
  const margen = ingresos ? flujo / ingresos : 0;

  if (caja < 0) score -= 40;
  if (flujo < 0) score -= 25;
  if (inventario > ingresos * 1.5) score -= 20;
  if (margen < 0.2) score -= 15;

  return clamp(score);
}

// ------------------------------------------------------
// 🎯 6. CLASIFICACIÓN DEL ESTADO
// ------------------------------------------------------

export function classifyFinancialStatus(score) {
  if (score <= 40) return "CRITICO";
  if (score <= 70) return "INESTABLE";
  return "SALUDABLE";
}

// ------------------------------------------------------
// 🤖 7. CEO AI - DECISIONES AUTOMÁTICAS
// ------------------------------------------------------

export function generateCEODecisions(data) {
  const decisiones = [];

  if (data.caja < 0) {
    decisiones.push({
      prioridad: "ALTA",
      accion: "Acelerar cobros pendientes inmediatamente"
    });
  }

  if (data.inventario > data.ingresos * 1.5) {
    decisiones.push({
      prioridad: "ALTA",
      accion: "Liquidar inventario lento con descuentos del 10%-20%"
    });
  }

  if (data.ingresos - data.egresos < 0) {
    decisiones.push({
      prioridad: "MEDIA",
      accion: "Reducir gastos operativos en mínimo 15%"
    });
  }

  if (data.score < 40) {
    decisiones.push({
      prioridad: "CRITICA",
      accion: "Reestructurar operación en menos de 7 días"
    });
  }

  if (data.score > 70) {
    decisiones.push({
      prioridad: "OPORTUNIDAD",
      accion: "Invertir en crecimiento o expansión del taller"
    });
  }

  return decisiones;
}

// ------------------------------------------------------
// 🔮 8. SIMULADOR DE ESCENARIOS (WHAT IF)
// ------------------------------------------------------

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

  const nuevoScore = financialHealthScore(simulated);

  return {
    escenario: simulated,
    score: nuevoScore,
    estado: classifyFinancialStatus(nuevoScore)
  };
}

// ------------------------------------------------------
// 🚀 9. FUNCIÓN MAESTRA (TODO EN UNO)
// ------------------------------------------------------

export function runFinancialAnalysis({
  ordenes = [],
  inventario = [],
  ordenesProceso = [],
  ingresos = 0,
  egresos = 0,
  caja = 0
}) {
  const revenuePrediction = predictRevenueNextMonth(ordenes);

  const riesgo = predictCashFlowRisk({
    ingresos,
    egresos,
    caja
  });

  const capital = calculateTrappedCapital(
    inventario,
    ordenesProceso
  );

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
    revenuePrediction,
    riesgo,
    capital,
    bottleneck,
    score,
    estado,
    decisiones
  };
}