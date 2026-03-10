/**
 * fleetPredictorAI.js
 * TallerPRO360
 * Predicción de mantenimiento para flotas
 */

import { db } from "../core/firebase-config.js";

import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
   ANALIZAR FLOTA
=============================== */

export async function analizarFlota(empresaId){

  if(!empresaId){
    console.warn("Empresa no definida");
    return [];
  }

  try{

    const vehiculosRef = collection(db,"empresas",empresaId,"vehiculos");

    const snapshot = await getDocs(vehiculosRef);

    let reporte = [];

    snapshot.forEach(docSnap=>{

      const v = docSnap.data();

      const analisis = analizarVehiculo(v);

      reporte.push({

        vehiculoId: docSnap.id,
        placa: v.placa || "N/A",
        modelo: v.modelo || "",
        marca: v.marca || "",

        riesgo: analisis.riesgo,
        alertas: analisis.alertas,
        proximoServicio: analisis.proximoServicio,
        costoEstimado: analisis.costoEstimado

      });

    });

    return reporte;

  }
  catch(e){

    console.error("Error analizando flota:",e);

    return [];

  }

}


/* ===============================
   ANÁLISIS DE VEHÍCULO
=============================== */

function analizarVehiculo(v){

  let alertas = [];
  let riesgo = "bajo";
  let costoEstimado = 0;
  let proximoServicio = "OK";


  /* ===============================
     ACEITE
  =============================== */

  if(v.kmUltimoAceite && v.kmActual){

    const diff = v.kmActual - v.kmUltimoAceite;

    if(diff > 8000){

      alertas.push("Cambio de aceite urgente");
      riesgo = "alto";
      costoEstimado += 180000;

    }
    else if(diff > 6000){

      alertas.push("Aceite próximo a cambio");
      riesgo = "medio";
      costoEstimado += 150000;

    }

    proximoServicio = 8000 - diff + " km";

  }


  /* ===============================
     FRENOS
  =============================== */

  if(v.kmUltimosFrenos && v.kmActual){

    const diff = v.kmActual - v.kmUltimosFrenos;

    if(diff > 30000){

      alertas.push("Revisión de frenos recomendada");
      riesgo = riesgo === "alto" ? "alto" : "medio";
      costoEstimado += 350000;

    }

  }


  /* ===============================
     LLANTAS
  =============================== */

  if(v.kmUltimasLlantas && v.kmActual){

    const diff = v.kmActual - v.kmUltimasLlantas;

    if(diff > 45000){

      alertas.push("Cambio de llantas sugerido");
      riesgo = riesgo === "alto" ? "alto" : "medio";
      costoEstimado += 900000;

    }

  }


  /* ===============================
     BATERÍA
  =============================== */

  if(v.anioBateria){

    const anioActual = new Date().getFullYear();

    const edad = anioActual - v.anioBateria;

    if(edad >= 3){

      alertas.push("Batería puede fallar pronto");
      riesgo = riesgo === "alto" ? "alto" : "medio";
      costoEstimado += 250000;

    }

  }


  return {

    riesgo,
    alertas,
    proximoServicio,
    costoEstimado

  };

}