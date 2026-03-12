import admin from "firebase-admin";

if(!admin.apps.length){

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  });

}

const db=admin.firestore();


export default async function handler(req,res){

  if(req.method!=="POST"){
    return res.status(405).json({error:"Metodo no permitido"});
  }

  try{

    const { uid }=req.body;

    if(!uid){
      return res.status(400).json({error:"Falta uid"});
    }

    const tallerDoc=await db.collection("talleres").doc(uid).get();

    if(!tallerDoc.exists){
      return res.status(404).json({error:"Taller no existe"});
    }

    const data=tallerDoc.data();

    /* ===============================
       VALIDAR ESTADO
    =============================== */

    if(data.estadoPlan!=="ACTIVO"){

      return res.status(403).json({
        error:"Plan inactivo"
      });

    }

    /* ===============================
       VALIDAR VENCIMIENTO
    =============================== */

    if(data.venceEn){

      const hoy=new Date();
      const vence=data.venceEn.toDate();

      if(vence<hoy){

        return res.status(403).json({
          error:"Plan vencido"
        });

      }

    }

    /* ===============================
       RESPUESTA
    =============================== */

    return res.status(200).json({

      planId:data.planId,
      estado:data.estadoPlan,
      venceEn:data.venceEn

    });

  }
  catch(error){

    console.error("Error verificar-plan:",error);

    res.status(500).json({
      error:"Error verificando plan"
    });

  }

}