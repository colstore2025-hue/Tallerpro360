/**
 * revenueForecastAI.js - V3 PRO
 * Nexus-X Starlink SAS
 */
export class RevenueForecastAI {
  constructor() {
    this.historial = [];
    this.ordenesAbiertas = [];
  }

  setData(ordenes) {
    // Separamos la realidad del potencial
    this.historial = ordenes.filter(o => o.estado === 'entregado' || o.estado === 'listo');
    this.ordenesAbiertas = ordenes.filter(o => o.estado !== 'entregado' && o.estado !== 'listo');
  }

  calcularProyeccionFinDeMes() {
    const hoy = new Date();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diaActual = hoy.getDate();
    const diasRestantes = ultimoDia - diaActual;

    // 1. Calcular promedio diario real (basado en lo ya cobrado este mes)
    const ingresosMes = this.historial.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const promedioDiario = ingresosMes / (diaActual || 1);

    // 2. Dinero "En el Aire" (Lo que está en el taller ahora mismo)
    const potencialAbierto = this.ordenesAbiertas.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // 3. Predicción Final: Real + (Promedio * Días Restantes) + Potencial Abierto
    const proyeccion = ingresosMes + (promedioDiario * diasRestantes) + potencialAbierto;

    return {
      ingresosActuales: ingresosMes,
      potencialEnTaller: potencialAbierto,
      proyeccionFinalMes: Math.round(proyeccion),
      confianza: this.historial.length > 10 ? "Alta" : "Baja"
    };
  }

  analizarSalud() {
    const { proyeccionFinalMes, ingresosActuales } = this.calcularProyeccionFinDeMes();
    if (proyeccionFinalMes > ingresosActuales * 1.5) return "🔥 Crecimiento acelerado detectado.";
    if (proyeccionFinalMes < ingresosActuales) return "⚠️ Alerta de liquidez: flujo lento.";
    return "✅ Estabilidad operativa.";
  }
}
