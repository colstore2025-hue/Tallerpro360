const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const db = getFirestore();

exports.trialOnCreate = onDocumentCreated(
  "talleres/{tallerId}",
  async (event) => {
    const taller = event.data.data();
    if (!taller) return;

    // Si ya tiene plan, no tocar
    if (taller.plan) return;

    const ahora = new Date();
    const vence = new Date();
    vence.setDate(ahora.getDate() + 7);

    await event.data.ref.update({
      plan: "trial",
      estadoPlan: "activo",
      creadoEn: Timestamp.fromDate(ahora),
      venceEn: Timestamp.fromDate(vence),
    });

    console.log("🆓 Trial de 7 días activado");
  }
);