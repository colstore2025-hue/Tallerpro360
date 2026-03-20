/**
 * CEO INTELLIGENCE ENGINE
 * Nivel DIOS - PRO360
 */

export function analizarEmpresaAvanzado({ ordenes = [], inventario = [] }) {

  let ingresos = 0;
  let costos = 0;

  ordenes.forEach(o => {
    ingresos += Number(o.total || 0);
    costos += Number(o.costoTotal || 0);
  });

  const utilidad = ingresos - costos;
  const margen = ingresos ? (utilidad / ingresos) * 100 : 0;

  /* =========================
  RIESGO DEL NEGOCIO
  ========================= */

  let riesgo = "bajo";

  if (margen < 10) riesgo = "alto";
  else if (margen < 25) riesgo = "medio";

  /* =========================
  PREDICCIÓN SIMPLE
  ========================= */

  const crecimiento = 1.08; // +8%
  const proyeccion7dias = ingresos * crecimiento;
  const proyeccion30dias = ingresos * crecimiento * 4;

  /* =========================
  ALERTAS INTELIGENTES
  ========================= */

  const alertas = [];

  if (utilidad < 0) {
    alertas.push("🔥 Estás perdiendo dinero");
  }

  if (margen < 15) {
    alertas.push("⚠️ Margen muy bajo");
  }

  if (inventario.some(i => (i.stock || 0) <= (i.stockMinimo || 0))) {
    alertas.push("📦 Problemas de inventario crítico");
  }

  /* =========================
  DECISIONES AUTOMÁTICAS
  ========================= */

  const decisiones = [];

  if (margen < 20) {
    decisiones.push("💰 Aumentar precios en servicios clave");
  }

  if (utilidad < 0) {
    decisiones.push("🛑 Reducir costos inmediatamente");
  }

  decisiones.push("📢 Lanzar campaña de clientes recurrentes");
  decisiones.push("⚙️ Optimizar tiempos de reparación");

  return {
    kpis: {
      ingresos,
      costos,
      utilidad,
      margen
    },
    riesgo,
    proyecciones: {
      proyeccion7dias,
      proyeccion30dias
    },
    alertas,
    decisiones
  };
}