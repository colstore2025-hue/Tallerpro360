import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });
}

const db = admin.firestore();

export default async function handler(req, res) {

  try {

    const planes = {

      freemium: {
        nombre: "Freemium",
        precio: 0,
        duracion_dias: 3650,
        limites: {
          ordenesMes: 30,
          usuarios: 1
        }
      },

      basico: {
        nombre: "Básico",
        precio: 42000,
        duracion_dias: 30,
        limites: {
          ordenesMes: 200,
          usuarios: 2
        }
      },

      pro: {
        nombre: "Pro",
        precio: 79000,
        duracion_dias: 30,
        limites: {
          ordenesMes: 600,
          usuarios: 5
        }
      },

      elite: {
        nombre: "Elite",
        precio: 149000,
        duracion_dias: 30,
        limites: {
          ordenesMes: 2000,
          usuarios: 15
        }
      }

    };

    for (const id in planes) {

      await db.collection("planes")
        .doc(id)
        .set(planes[id], { merge: true });

    }

    res.status(200).json({
      ok: true,
      message: "Planes creados correctamente"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: true
    });

  }

}