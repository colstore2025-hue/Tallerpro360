/**
 * revenueForecastAI.js - V3.1 PRO (Refined Logic)
 * Motor de Predicción Financiera Nexus-X
 */
export class RevenueForecastAI {
  constructor() {
    this.historial = [];
    this.ordenesAbiertas = [];
  }

  setData(ordenes) {
    // Filtramos solo lo perteneciente al mes actual para no contaminar la tendencia
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const ordenesMes = ordenes.filter(o => {
      const fecha = o.creadoEn?.toDate ? o.creadoEn.toDate() : new Date();
      return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    });

    this.historial = ordenesMes.filter(o => o.estado === 'entregado' || o.estado === 'listo');
    this.ordenesAbiertas = ordenesMes.filter(o => o.estado !== 'entregado' && o.estado !== 'listo');
  }

  calcularProyeccionFinDeMes() {
    const hoy = new Date();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diaActual = hoy.getDate();
    const diasRestantes = ultimoDia - diaActual;

    // 💰 1. Realidad de Caja (Lo ya cobrado/por cobrar de órdenes listas)
    const ingresosMes = this.historial.reduce((sum, o) => sum + Number(o.total || 0), 0);
    
    // 📈 2. Velocidad de Venta (Promedio Diario Real)
    // Usamos Math.max(1, diaActual) para evitar división por cero
    const promedioDiario = ingresosMes / Math.max(1, diaActual);

    // 🚗 3. Trabajo en Proceso (WIP - Work In Progress)
    const potencialAbierto = this.ordenesAbiertas.reduce((sum, o) => sum + Number(o.total || 0), 0);

    /**
     * 🔮 FORMULA NEXUS-X V3.1:
     * Proyección = Ingresos Actuales + Max(Trabajo en Proceso, Promedio Esperado)
     * Esto evita duplicar ingresos si el taller ya está lleno de trabajo.
     */
    const ingresosEsperadosPorInercia = promedioDiario * diasRestantes;
    const proyeccionExtra = Math.max(potencialAbierto, ingresosEsperadosPorInercia);
    
    const proyeccionFinal = ingresosMes + proyeccionExtra;

    // 🎯 4. Cálculo de Confianza (Basado en volumen de datos y día del mes)
    let nivelConfianza = "Baja";
    if (diaActual > 10 && this.historial.length > 5) nivelConfianza = "Media";
    if (diaActual > 20 && this.historial.length > 15) nivelConfianza = "Alta";

    return {
      ingresosActuales: ingresosMes,
      potencialEnTaller: potencialAbierto,
      proyeccionFinalMes: Math.round(proyeccionFinal),
      confianza: nivelConfianza,
      diasRestantes: diasRestantes
    };
  }

  analizarSalud() {
    const { proyeccionFinalMes, ingresosActuales, diasRestantes } = this.calcularProyeccionFinDeMes();
    
    if (diasRestantes > 25) return "⏳ Iniciando mes: recolectando datos de tendencia.";
    
    const ratio = proyeccionFinalMes / (ingresosActuales || 1);
    
    if (ratio > 1.4) return "🔥 Crecimiento: el taller está operando por encima del promedio.";
    if (ratio < 0.8) return "⚠️ Flujo lento: se recomienda revisar la entrada de vehículos.";
    return "✅ Estabilidad: el flujo de caja es constante.";
  }
}
