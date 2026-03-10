/**
 * partsDemandPredictor.js
 * TallerPRO360 ERP
 * IA predictiva de demanda de repuestos
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  query,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
PREDICCIÓN DE DEMANDA
=============================== */

export async function predecirDemandaRepuestos(){

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){

    console.warn("Empresa no definida");

    return null;

  }

  try{

    const q = query(
      collection(db,"empresas",empresaId,"ordenes")
    );

    const snapshot = await getDocs(q);

    const consumo = {};
    const frecuencia = {};

    snapshot.forEach(docSnap => {

      const orden = docSnap.data() || {};

      if(!Array.isArray(orden.acciones)) return;

      orden.acciones.forEach(a => {

        const repuesto = (a.descripcion || "")
        .toLowerCase()
        .trim();

        if(!repuesto) return;


        /* consumo total */

        if(!consumo[repuesto]){
          consumo[repuesto] = 0;
        }

        consumo[repuesto]++;


        /* frecuencia */

        if(!frecuencia[repuesto]){
          frecuencia[repuesto] = 0;
        }

        frecuencia[repuesto]++;

      });

    });


    /* ===============================
    CÁLCULO DE DEMANDA
    =============================== */

    const predicciones = [];

    Object.keys(consumo).forEach(rep => {

      const uso = consumo[rep];

      const demandaMensual = Math.round(uso / 3); 
      // asume 3 meses promedio

      let nivel = "bajo";

      if(demandaMensual > 20){
        nivel = "alto";
      }
      else if(demandaMensual > 10){
        nivel = "medio";
      }

      predicciones.push({

        repuesto: rep,

        consumoHistorico: uso,

        demandaMensual,

        nivel

      });

    });


    /* ===============================
    ORDENAR POR DEMANDA
    =============================== */

    predicciones.sort(
      (a,b)=>b.demandaMensual-a.demandaMensual
    );


    /* ===============================
    GUARDAR RESULTADO
    =============================== */

    localStorage.setItem(
      "prediccionRepuestos",
      JSON.stringify(predicciones)
    );

    return predicciones;

  }
  catch(e){

    console.error("Error predicción repuestos:",e);

    return null;

  }

}


/* ===============================
SUGERIR COMPRA
=============================== */

export function sugerirCompraInventario(stockActual){

  const predicciones = JSON.parse(
    localStorage.getItem("prediccionRepuestos") || "[]"
  );

  const sugerencias = [];

  predicciones.forEach(p => {

    const stock = stockActual?.[p.repuesto] || 0;

    if(stock < p.demandaMensual){

      sugerencias.push({

        repuesto: p.repuesto,

        stockActual: stock,

        compraSugerida: p.demandaMensual - stock,

        nivel: p.nivel

      });

    }

  });

  return sugerencias;

}