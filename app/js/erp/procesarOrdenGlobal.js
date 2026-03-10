// procesarOrdenGlobal.js
import { actualizarRankingGlobal } from "./workshopRankingAI.js";
import { detectarRepuestos } from "./autoPartsAI.js";
import { crearPedido } from "./autoPartsMarketplace.js";
import { optimizarIngresos } from "./workshopRevenueOptimizer.js";

/**
 * Integración global de TallerPRO360
 * Cada vez que llega una nueva orden
 */
export async function procesarOrdenGlobal(orden) {
  try {
    // 1️⃣ Analizar repuestos y acciones
    const resultadoIA = await detectarRepuestos(orden.descripcion);
    console.log("✅ Repuestos detectados:", resultadoIA.repuestos);

    // 2️⃣ Generar pedidos automáticos
    if (resultadoIA.repuestos.length) {
      await crearPedido({
        empresaId: orden.empresaId,
        proveedorId: "auto-suggest",
        items: resultadoIA.repuestos.map(r => ({
          nombre: r.nombre,
          cantidad: 1,
          precio: r.precio || 0
        })),
        precioTotal: resultadoIA.repuestos.reduce((sum, r) => sum + (r.precio || 0), 0)
      });
      console.log("🛒 Pedido de repuestos generado automáticamente");
    }

    // 3️⃣ Optimizar ingresos del taller
    await optimizarIngresos(orden.empresaId);
    console.log("💰 Ingresos optimizados para la empresa:", orden.empresaId);

    // 4️⃣ Actualizar ranking global
    await actualizarRankingGlobal();
    console.log("🌎 Ranking global actualizado en tiempo real");

  } catch (err) {
    console.error("❌ Error en procesamiento global de orden:", err);
  }
}