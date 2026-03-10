/**
 * multiWorkshopAI.js
 * TallerPRO360 ERP
 * IA comparativa entre talleres
 * Inteligencia colectiva SaaS
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
ANALIZAR ECOSISTEMA DE TALLERES
=============================== */

export async function analizarEcosistemaTalleres(){

  try{

    const snap = await getDocs(collection(db,"empresas"));

    let talleres = 0;
    let ingresosTotales = 0;

    const serviciosGlobal = {};
    const tecnicosGlobal = {};

    snap.forEach(docSnap => {

      const empresa = docSnap.data() || {};

      talleres++;

      const ingresos = Number(empresa.ingresosMensuales || 0);

      ingresosTotales += ingresos;


      /* ===============================
      SERVICIOS
      =============================== */

      if(Array.isArray(empresa.servicios)){

        empresa.servicios.forEach(servicio => {

          const s = servicio.toLowerCase().trim();

          if(!serviciosGlobal[s]){
            serviciosGlobal[s] = 0;
          }

          serviciosGlobal[s]++;

        });

      }


      /* ===============================
      TECNICOS
      =============================== */

      if(Array.isArray(empresa.tecnicos)){

        empresa.tecnicos.forEach(tecnico => {

          const t = tecnico.toLowerCase().trim();

          if(!tecnicosGlobal[t]){
            tecnicosGlobal[t] = 0;
          }

          tecnicosGlobal[t]++;

        });

      }

    });


    /* ===============================
    TOP SERVICIOS
    =============================== */

    const topServicios = Object.entries(serviciosGlobal)
    .map(s => ({
      servicio: s[0],
      talleres: s[1]
    }))
    .sort((a,b) => b.talleres - a.talleres)
    .slice(0,10);


    /* ===============================
    TOP TÉCNICOS
    =============================== */

    const topTecnicos = Object.entries(tecnicosGlobal)
    .map(t => ({
      tecnico: t[0],
      talleres: t[1]
    }))
    .sort((a,b) => b.talleres - a.talleres)
    .slice(0,10);


    /* ===============================
    PROMEDIOS DEL MERCADO
    =============================== */

    const promedioIngresos = talleres
      ? Math.round(ingresosTotales / talleres)
      : 0;


    /* ===============================
    RECOMENDACIONES IA
    =============================== */

    const recomendaciones = [];

    topServicios.forEach(s => {

      if(s.talleres > talleres * 0.5){

        recomendaciones.push(
          `Muchos talleres ofrecen "${s.servicio}". Considera agregar este servicio para ser competitivo.`
        );

      }

    });


    /* ===============================
    RESULTADO
    =============================== */

    const resultado = {

      talleresAnalizados: talleres,

      ingresosPromedio: promedioIngresos,

      topServicios,

      topTecnicos,

      recomendaciones

    };


    localStorage.setItem(
      "ecosistemaTalleres",
      JSON.stringify(resultado)
    );

    return resultado;

  }
  catch(e){

    console.error("Error analizando ecosistema:",e);

    return null;

  }

}


/* ===============================
OBTENER RESULTADO
=============================== */

export function obtenerAnalisisEcosistema(){

  try{

    return JSON.parse(
      localStorage.getItem("ecosistemaTalleres") || "{}"
    );

  }
  catch{

    return {};

  }

}