/**
========================================
CEO GLOBAL AI - NEXUS-X STARLINK
Analiza TODO el SaaS
========================================
*/

export async function analizarSaaS({ pagos, talleres }) {

  let ingresos = 0;
  let activos = 0;
  let freemium = 0;

  pagos.forEach(p => {
    if (p.estado === "aprobado") {
      ingresos += Number(p.monto || 0);
    }
  });

  talleres.forEach(t => {
    if (t.estadoPlan === "ACTIVO") {
      activos++;

      if (t.plan === "freemium") {
        freemium++;
      }
    }
  });

  const conversion = activos
    ? ((activos - freemium) / activos) * 100
    : 0;

  /* =========================
  ALERTAS INTELIGENTES
  ========================= */

  const alertas = [];

  if (conversion < 15) {
    alertas.push("Conversión muy baja: estás regalando demasiado valor.");
  }

  if (freemium > activos * 0.7) {
    alertas.push("Demasiados usuarios en freemium.");
  }

  if (ingresos < 500000) {
    alertas.push("Ingresos bajos para escalar SaaS.");
  }

  /* =========================
  RECOMENDACIONES
  ========================= */

  const recomendaciones = [];

  if (conversion < 20) {
    recomendaciones.push("Implementar límite fuerte en plan freemium.");
    recomendaciones.push("Agregar paywall en funciones clave.");
  }

  if (ingresos < 1000000) {
    recomendaciones.push("Subir precios o crear plan PRO intermedio.");
  }

  if (freemium > activos * 0.6) {
    recomendaciones.push("Activar campañas de conversión (WhatsApp o email).");
  }

  /* =========================
  RESUMEN EJECUTIVO
  ========================= */

  const resumen = `
Tienes ${activos} talleres activos.
El ${conversion.toFixed(1)}% son clientes pagos.
Ingresos actuales: ${ingresos.toLocaleString("es-CO")} COP.
`;

  return {
    resumen,
    ingresos,
    activos,
    freemium,
    conversion,
    alertas,
    recomendaciones
  };
}