// /functions/modules/setupTaller.js

const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Crear documento taller si no existe
 */
async function asegurarTaller(uid) {

  const ref = db.collection("talleres").doc(uid);
  const snap = await ref.get();

  // Si ya existe no hace nada
  if (snap.exists) return;

  const ahora = admin.firestore.Timestamp.now();

  // Plan Freemium 7 días
  const vence = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 7 * 86400000)
  );

  await ref.set({
    planId: "freemium",
    planNombre: "Plan Freemium",
    estadoPlan: "ACTIVO",
    inicioPlan: ahora,
    venceEn: vence,
    metodoPago: "manual",

    alertas: {
      d7: false,
      d3: false,
      d1: false
    }

  });

  console.log("Taller creado para:", uid);
}

/**
 * Crear talleres para todos los usuarios existentes
 */
async function crearTalleresParaUsuarios() {

  const usuarios = await db.collection("usuariosGlobal").get();

  for (const doc of usuarios.docs) {

    const uid = doc.id;

    await asegurarTaller(uid);

  }

  console.log("Proceso terminado");
}

module.exports = {
  asegurarTaller,
  crearTalleresParaUsuarios
};