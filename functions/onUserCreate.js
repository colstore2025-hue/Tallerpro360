const admin = require("firebase-admin");
const functions = require("firebase-functions");

const db = admin.firestore();

exports.trialOnCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const ahora = admin.firestore.Timestamp.now();

  try {
    // Crear empresa
    const empresaRef = db.collection("empresas").doc();
    const empresaId = empresaRef.id;

    const venceTrial = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 86400000) // 7 días
    );

    await empresaRef.set({
      nombre: "Mi Taller",
      creadoEn: ahora,
      plan: {
        tipo: "trial",
        estado: "activo",
        fechaInicio: ahora,
        fechaVencimiento: venceTrial
      },
      limites: {
        sucursales: 1,
        ordenesMes: 50
      },
      configuracion: {
        facturacionElectronica: false,
        contabilidadAvanzada: false
      }
    });

    // Crear usuario dueño
    await empresaRef.collection("usuarios").doc(uid).set({
      rol: "dueno",
      activo: true,
      sucursalesAsignadas: ["principal"],
      creadoEn: ahora
    });

    // Crear sucursal principal
    await empresaRef.collection("sucursales").doc("principal").set({
      nombre: "Sucursal Principal",
      creadoEn: ahora,
      activa: true
    });

    // Configuración CRM
    const stages = [
      { nombre: "Ingreso", orden: 1, color: "#3b82f6" },
      { nombre: "Diagnóstico", orden: 2, color: "#f59e0b" },
      { nombre: "Reparación", orden: 3, color: "#06b6d4" },
      { nombre: "Listo", orden: 4, color: "#22c55e" },
      { nombre: "Entregado", orden: 5, color: "#16a34a" }
    ];
    const batch = db.batch();
    stages.forEach(stage => {
      const stageRef = empresaRef.collection("sucursales").doc("principal")
        .collection("stagesConfig").doc();
      batch.set(stageRef, { ...stage, creadoEn: ahora });
    });
    await batch.commit();

    // Claims personalizados
    await admin.auth().setCustomUserClaims(uid, {
      empresaId,
      rol: "dueno",
      activo: true,
      planActivo: true
    });

    console.log(`✅ Empresa ${empresaId} creada para usuario ${uid}`);

  } catch (error) {
    console.error("❌ Error creando empresa/trial:", error);
  }
});