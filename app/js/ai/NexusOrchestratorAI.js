/**
 * NexusOrchestratorAI.js
 * EL CEREBRO UNIFICADO DE TALLERPRO360
 */
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export const NexusAI = {
  async analizarTodo(empresaId) {
    if (!empresaId) return null;

    // 1. Captura de datos (Single Batch para ahorrar cuota)
    const ordenesSnap = await getDocs(query(collection(db, `empresas/${empresaId}/ordenes`)));
    const inventarioSnap = await getDocs(collection(db, `empresas/${empresaId}/inventario`));
    
    let kpis = {
      ingresos: 0, costos: 0, utilidad: 0,
      totalOrdenes: ordenesSnap.size,
      stockCritico: 0,
      ordenesAbiertas: 0,
      eficiencia: 0
    };

    const ordenes = ordenesSnap.docs.map(d => {
      const o = d.data();
      kpis.ingresos += (o.total || 0);
      kpis.costos += (o.costoTotal || 0);
      if (o.estado !== 'entregado') kpis.ordenesAbiertas++;
      return o;
    });

    kpis.utilidad = kpis.ingresos - kpis.costos;
    kpis.margen = kpis.ingresos ? Math.round((kpis.utilidad / kpis.ingresos) * 100) : 0;
    kpis.stockCritico = inventarioSnap.docs.filter(d => d.data().cantidad <= 3).length;

    // 2. Generación de Decisiones Estratégicas
    const sugerencias = [];
    if (kpis.margen < 25) sugerencias.push({ msg: "Margen crítico. Revisa precios de mano de obra.", impact: "ALTO" });
    if (kpis.stockCritico > 0) sugerencias.push({ msg: `Reponer ${kpis.stockCritico} productos de baja rotación.`, impact: "MEDIO" });
    if (kpis.ordenesAbiertas > 10) sugerencias.push({ msg: "Cuello de botella detectado en taller.", impact: "ALTO" });

    return { kpis, sugerencias };
  },

  // Fusión del Growth Engine (Brazo Ejecutor)
  async ejecutarGrowth(empresaId) {
    const leadsSnap = await getDocs(query(collection(db, "leads"), where("empresaId", "==", empresaId), where("estado", "==", "nuevo")));
    
    for (const doc of leadsSnap.docs) {
      const lead = doc.data();
      await addDoc(collection(db, `empresas/${empresaId}/ia_logs`), {
        tipo: "growth_contact",
        detalle: `Contacto automático a ${lead.nombre}`,
        fecha: serverTimestamp()
      });
      // Aquí se dispararía la cola de WhatsApp que ya programamos
    }
    return leadsSnap.size;
  }
};
