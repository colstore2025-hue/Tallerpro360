export async function enviarWhatsApp(db) {

  const snapshot = await db.collection("cola_whatsapp")
    .where("estado", "==", "pendiente")
    .limit(10)
    .get();

  for (const doc of snapshot.docs) {

    const data = doc.data();

    try {

      console.log("📲 Enviando a:", data.telefono);

      // ⚠️ AQUÍ VA TU API REAL DESPUÉS
      await fakeSend(data.telefono, data.mensaje);

      await doc.ref.update({
        estado: "enviado",
        enviadoEn: new Date()
      });

    } catch (error) {

      console.error("Error envío:", error);

      await doc.ref.update({
        estado: "error"
      });
    }
  }
}

/* SIMULACIÓN */
async function fakeSend() {
  return new Promise(res => setTimeout(res, 800));
}