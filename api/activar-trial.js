/**
 * activar-trial.js - TallerPRO360 V11.5.0 🛰️
 * NEXUS-X STARLINK: Protocolo de Provisión de Nueva Empresa (Trial 7 Días)
 */

import admin from "firebase-admin";

// 1. Inicialización Blindada de Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Reemplazo robusto de saltos de línea para la Private Key de Vercel
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log("✅ Nexus-X: Firebase Admin Conectado");
  } catch (error) {
    console.error("❌ Fallo en inicialización de Firebase Admin:", error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { empresaId, nombreEmpresa, usuarioId, email } = req.body;

  // Validación de seguridad Nexus-X
  if (!empresaId || !usuarioId) {
    return res.status(400).json({ error: "Parámetros insuficientes para la provisión" });
  }

  try {
    const ahora = admin.firestore.Timestamp.now();
    const fechaFinTrial = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días exactos
    );

    const empresaRef = db.collection("empresas").doc(empresaId);
    const empresaDoc = await empresaRef.get();

    // 2. Lógica de Existencia (Evita sobreescribir empresas activas)
    if (empresaDoc.exists) {
      return res.status(200).json({
        status: "empresa_activa",
        empresaId,
        message: "La empresa ya se encuentra en el ecosistema Nexus."
      });
    }

    // 3. Creación Atómica de la Estructura de Empresa
    const batch = db.batch();

    // -- Documento de Empresa --
    batch.set(empresaRef, {
      nombre: nombreEmpresa || "Nuevo Taller Nexus",
      identificador: empresaId,
      estado: "activa",
      creadoEn: ahora,
      config: {
        moneda: "COP",
        timezone: "America/Bogota"
      },
      plan: {
        tipo: "freemium",
        estado: "trial",
        ciclo: "7dias",
        fechaInicio: ahora,
        fechaFin: fechaFinTrial,
        checkoutBold: "N/A"
      },
      limites: {
        ordenesMes: 30,
        usuarios: 1,
        sucursales: 1,
        ia_consultas: 10
      },
      metricas: {
        ordenesTotales: 0,
        clientesTotales: 0,
        ingresosTotales: 0
      }
    });

    // -- Registro de Usuario en SaaS --
    const usuarioRef = db.collection("usuarios").doc(usuarioId);
    batch.set(usuarioRef, {
      email: email || "",
      empresaId: empresaId,
      rol: "dueno",
      estado: "activo",
      creadoEn: ahora,
      vistoUltimaVez: ahora
    }, { merge: true });

    // -- Sucursal de Operación Principal --
    const sucursalRef = empresaRef.collection("sucursales").doc("principal");
    batch.set(sucursalRef, {
      nombre: "Sede Principal Nexus",
      direccion: "Pendiente",
      ciudad: "Por definir",
      telefono: "0000000",
      estado: "activa",
      creadoEn: ahora
    });

    // -- Perfil de Empleado (Dueño) --
    const empleadoRef = empresaRef.collection("empleados").doc(usuarioId);
    batch.set(empleadoRef, {
      nombre: "Administrador General",
      rol: "dueno",
      email: email || "",
      sucursalId: "principal",
      estado: "activo",
      creadoEn: ahora
    });

    // 4. Inicialización de Subcolecciones (Evita errores de lectura en el Dashboard)
    // Usamos documentos 'metadata' para inicializar las colecciones
    const subcolecciones = ["ordenes", "clientes", "inventario", "finanzas", "ia_logs"];
    subcolecciones.forEach(sub => {
      const subRef = empresaRef.collection(sub).doc("__init__");
      batch.set(subRef, { activo: true, fecha: ahora });
    });

    // 5. Ejecución del Batch (Todo o nada)
    await batch.commit();

    console.log(`🚀 Nexus-X: Trial activado para la empresa ${empresaId}`);

    return res.status(200).json({
      status: "success",
      empresaId,
      plan: "freemium",
      dias: 7,
      expira: fechaFinTrial.toDate()
    });

  } catch (error) {
    console.error("❌ Fallo crítico en activar-trial:", error);
    return res.status(500).json({
      error: "Error interno en la provisión del servicio",
      code: "NEXUS_PROVISION_FAIL"
    });
  }
}
