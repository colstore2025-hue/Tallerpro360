/**
 * 🌌 NEXUS-X PRICING OPTIMIZER V26.0
 * Fusión: Lógica de Cliente (Antigua) + Inteligencia de Mercado 2026 (Nueva)
 */

export function calcularPrecioInteligente({
    costoRepuestos = 0,
    horasTrabajo = 1,
    tipoCliente = "normal", // vip, empresa, flota
    tipoTrabajo = "general", // especializado, diagnostico, preventivo
    urgencia = "normal"
}) {
    // 🇨🇴 TARIFAS BASE COLOMBIA 2026 (Actualizado Infobae/Mercado)
    let valorHora = 105000; // Tarifa estándar 2026
    if (tipoTrabajo === "especializado") valorHora = 150000;
    if (tipoTrabajo === "diagnostico") valorHora = 85000;

    // 📈 MARGENES DIFERENCIADOS (Para no inflar repuestos caros)
    let margenManoObra = 0.50; // El taller gana más en su conocimiento
    let margenRepuestos = 0.25; // Margen justo para ser competitivo

    // AJUSTE POR TIPO DE CLIENTE (Tu lógica original mejorada)
    const descuentos = { "vip": 0.05, "empresa": 0.10, "flota": 0.15 };
    const descuentoAplicado = descuentos[tipoCliente] || 0;

    // AJUSTE POR URGENCIA
    const plusUrgencia = urgencia === "alta" ? 0.15 : (urgencia === "media" ? 0.07 : 0);

    // CÁLCULOS TÉCNICOS
    const netoManoObra = (horasTrabajo * valorHora) * (1 + (margenManoObra + plusUrgencia - descuentoAplicado));
    const netoRepuestos = costoRepuestos * (1 + (margenRepuestos - (descuentoAplicado / 2)));

    let total = netoManoObra + netoRepuestos;

    // REDONDEO COMERCIAL NEXUS-X
    total = Math.round(total / 1000) * 1000;

    return {
        total: total < 45000 ? 45000 : total, // Mínimo operativo 2026
        analisis: {
            utilidadEstimada: total - (costoRepuestos + (horasTrabajo * 45000)), // 45k es el costo operativo base
            markup: ((total / (costoRepuestos + (horasTrabajo * valorHora))) - 1) * 100,
            alertaMercado: valorHora < 100000 ? "BAJO" : "COMPETITIVO"
        },
        detalle: { costoRepuestos, manoObra: netoManoObra, valorHora, horasTrabajo }
    };
}
