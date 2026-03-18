export async function ejecutarGrowthEngine(db) {

  const snapshot = await db.collection("leads").get();

  const acciones = [];

  for (const doc of snapshot.docs) {

    const lead = { id: doc.id, ...doc.data() };

    // 🔥 SOLO leads nuevos o sin contacto
    if (!lead.ultimoContacto) {

      const mensaje = generarMensaje(lead);

      await db.collection("cola_whatsapp").add({
        telefono: lead.telefono,
        mensaje,
        estado: "pendiente",
        creado: new Date()
      });

      await db.collection("leads").doc(lead.id).update({
        estado: "contactado",
        ultimoContacto: new Date()
      });

      acciones.push(`Lead contactado: ${lead.nombre}`);
    }
  }

  // Guardar log
  await db.collection("ia_logs").add({
    tipo: "growth_engine",
    acciones,
    fecha: new Date()
  });

  return acciones;
}

/* ================= MENSAJE IA ================= */

function generarMensaje(lead) {
  return `Hola ${lead.nombre} 👋

Soy el asistente de TallerPRO360 🚀

Detectamos que tu taller en ${lead.ciudad} puede aumentar ingresos hasta un 40%.

Te damos acceso GRATIS:

👉 https://tallerpro360.com

¿Quieres activarlo ahora?`;
}