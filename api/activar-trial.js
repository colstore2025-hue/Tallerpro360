// /api/activar-trial.js

import admin from "firebase-admin";

/*
====================================================
INICIALIZAR FIREBASE ADMIN
====================================================
*/

if (!admin.apps.length) {

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });

}

const db = admin.firestore();


/*
====================================================
ACTIVAR TRIAL
====================================================
*/

export default async function handler(req, res) {

  try {

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Método no permitido"
      });
    }

    const {
      empresaId,
      nombreEmpresa,
      usuarioId,
      email
    } = req.body;

    if (!empresaId || !usuarioId) {
      return res.status(400).json({
        error: "Datos incompletos"
      });
    }


    /*
    ================================================
    VALIDAR SI EMPRESA YA EXISTE
    ================================================
    */

    const empresaRef = db.collection("empresas").doc(empresaId);
    const empresaDoc = await empresaRef.get();

    if (empresaDoc.exists) {

      return res.status(200).json({
        status: "empresa ya existe",
        empresaId
      });

    }


    /*
    ================================================
    FECHAS TRIAL
    ================================================
    */

    const ahora = admin.firestore.Timestamp.now();

    const fechaFin = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );


    /*
    ================================================
    CREAR EMPRESA
    ================================================
    */

    await empresaRef.set({

      nombre: nombreEmpresa || "Nuevo Taller",

      estado: "activa",

      creadoEn: ahora,

      plan: {
        tipo: "freemium",
        estado: "trial",
        ciclo: "7dias",
        fechaInicio: ahora,
        fechaFin: fechaFin
      },

      limites: {
        ordenesMes: 30,
        usuarios: 1,
        sucursales: 1
      },

      metricas: {
        ordenesMes: 0,
        ventasMes: 0,
        clientes: 0
      }

    });


    /*
    ================================================
    CREAR USUARIO SAAS
    ================================================
    */

    const usuarioRef = db.collection("usuarios").doc(usuarioId);

    const usuarioDoc = await usuarioRef.get();

    if (!usuarioDoc.exists) {

      await usuarioRef.set({

        email: email || "",
        empresaId: empresaId,
        rol: "dueno",
        estado: "activo",
        creadoEn: ahora

      });

    }


    /*
    ================================================
    CREAR SUCURSAL PRINCIPAL
    ================================================
    */

    const sucursalRef = empresaRef
      .collection("sucursales")
      .doc("principal");

    await sucursalRef.set({

      nombre: "Sucursal Principal",
      direccion: "",
      ciudad: "",
      telefono: "",
      estado: "activa",
      creadoEn: ahora

    });


    /*
    ================================================
    CREAR EMPLEADO DUEÑO
    ================================================
    */

    const empleadoRef = empresaRef
      .collection("empleados")
      .doc(usuarioId);

    await empleadoRef.set({

      nombre: "Administrador",
      rol: "dueno",
      email: email || "",
      sucursalId: "principal",
      estado: "activo",
      creadoEn: ahora

    });


    /*
    ================================================
    CREAR SUBCOLECCIONES INICIALES
    ================================================
    */

    await empresaRef.collection("ordenes").doc("init").set({ demo: true });

    await empresaRef.collection("clientes").doc("init").set({ demo: true });

    await empresaRef.collection("inventario").doc("init").set({ demo: true });

    await empresaRef.collection("finanzas").doc("init").set({ demo: true });

    await empresaRef.collection("nomina").doc("init").set({ demo: true });

    await empresaRef.collection("ia_logs").doc("init").set({ demo: true });


    /*
    ================================================
    RESPUESTA
    ================================================
    */

    return res.status(200).json({

      status: "trial activado",
      empresaId,
      plan: "freemium",
      trialDias: 7

    });

  } catch (error) {

    console.error("Error activar trial:", error);

    return res.status(500).json({
      error: "Error activando trial"
    });

  }

}