export async function ejecutarAutopilot({ db, pagos, talleres }) {

  const acciones = [];

  let ingresos = 0;

  pagos.forEach(p => {
    if (p.estado === "aprobado") {
      ingresos += Number(p.monto || 0);
    }
  });

  const activos = talleres.filter(t => t.estadoPlan === "ACTIVO").length;
  const freemium = talleres.filter(t => t.plan === "freemium").length;

  const conversion = activos
    ? ((activos - freemium) / activos) * 100
    : 0;

  /* ================= DECISIONES ================= */

  // 🔻 Baja conversión → atacar freemium
  if (conversion < 20) {

    acciones.push("Reducir abuso de plan freemium");

    talleres.forEach(async t => {
      if (t.plan === "freemium") {
        await db.collection("talleres").doc(t.id).update({
          limiteFreemium: true
        });
      }
    });
  }

  // 💸 Bajos ingresos → subir precios IA
  if (ingresos < 1000000) {

    acciones.push("Activar aumento inteligente de precios");

    const planes = await db.collection("planes").get();

    planes.forEach(async doc => {
      const plan = doc.data();

      await doc.ref.update({
        precio: Math.round(plan.precio * 1.10)
      });
    });
  }

  // 🚀 Pocos clientes → activar marketing
  if (activos < 10) {

    acciones.push("Activar campaña automática de marketing");

    await db.collection("marketing").add({
      tipo: "whatsapp",
      mensaje: "Prueba TallerPRO360 GRATIS 🚀",
      estado: "pendiente",
      creado: new Date()
    });
  }

  return acciones;
}