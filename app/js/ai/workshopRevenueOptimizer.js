/**
 * workshopRevenueOptimizer.js
 * TallerPRO360 ERP
 * IA que optimiza ingresos del taller
 */

import { db } from "../core/firebase-config.js";

import {
  collection,
  query,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ===============================
ANALIZAR INGRESOS
=============================== */

export async function optimizarIngresos(){

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    console.warn("Empresa no definida");
    return null;
  }

  try{

    const q = query(
      collection(db,"empresas",empresaId,"ordenes")
    );

    const snap = await getDocs(q);

    let totalIngresos = 0;
    let totalCostos = 0;

    const servicios = {};
    const tecnicos = {};


    snap.forEach(docSnap=>{

      const o = docSnap.data();

      const total = Number(o.total || 0);

      totalIngresos += total;

      const tecnico = o.tecnico || "Sin asignar";

      if(!tecnicos[tecnico]){
        tecnicos[tecnico] = 0;
      }

      tecnicos[tecnico] += total;


      /* ===============================
      ACCIONES / SERVICIOS
      =============================== */

      if(Array.isArray(o.acciones)){

        o.acciones.forEach(a=>{

          const nombre = a.descripcion || "Servicio";

          const venta = Number(a.costo || 0);
          const costo = Number(a.costoInterno || 0);

          totalCostos += costo;

          if(!servicios[nombre]){

            servicios[nombre] = {
              veces:0,
              ventas:0,
              costos:0
            };

          }

          servicios[nombre].veces++;
          servicios[nombre].ventas += venta;
          servicios[nombre].costos += costo;

        });

      }

    });


    /* ===============================
    ANALIZAR RENTABILIDAD
    =============================== */

    const analisisServicios = Object.entries(servicios).map(s=>{

      const nombre = s[0];
      const data = s[1];

      const margen =
      data.ventas > 0
      ? ((data.ventas - data.costos) / data.ventas) * 100
      : 0;

      let recomendacion = "OK";

      if(margen < 20){
        recomendacion = "Subir precio";
      }

      if(margen > 60){
        recomendacion = "Promocionar servicio";
      }

      return {

        servicio:nombre,
        veces:data.veces,
        ventas:data.ventas,
        costos:data.costos,
        margen:margen.toFixed(2),
        recomendacion

      };

    });


    /* ===============================
    TOP SERVICIOS
    =============================== */

    analisisServicios.sort((a,b)=>b.ventas-a.ventas);


    /* ===============================
    TOP TÉCNICOS
    =============================== */

    const rankingTecnicos = Object.entries(tecnicos)
    .map(t=>({

      tecnico:t[0],
      ventas:t[1]

    }))
    .sort((a,b)=>b.ventas-a.ventas);


    /* ===============================
    MÉTRICAS
    =============================== */

    const utilidad = totalIngresos - totalCostos;

    const margenGlobal = totalIngresos
    ? ((utilidad / totalIngresos) * 100).toFixed(2)
    : 0;


    /* ===============================
    SUGERENCIAS IA
    =============================== */

    const sugerencias = [];

    analisisServicios.forEach(s=>{

      if(s.recomendacion === "Subir precio"){

        sugerencias.push(
        `Aumentar precio del servicio ${s.servicio}`
        );

      }

      if(s.recomendacion === "Promocionar servicio"){

        sugerencias.push(
        `Promocionar ${s.servicio} para aumentar ventas`
        );

      }

    });


    /* ===============================
    RESULTADO
    =============================== */

    const resultado = {

      ingresos:totalIngresos,
      costos:totalCostos,
      utilidad,
      margenGlobal,
      servicios:analisisServicios.slice(0,10),
      tecnicos:rankingTecnicos.slice(0,5),
      sugerencias

    };


    localStorage.setItem(
      "revenueOptimizer",
      JSON.stringify(resultado)
    );

    return resultado;

  }
  catch(e){

    console.error("Error optimizando ingresos:",e);

    return null;

  }

}


/* ===============================
OBTENER RESULTADO
=============================== */

export function obtenerOptimizacion(){

  return JSON.parse(
    localStorage.getItem("revenueOptimizer") || "{}"
  );

}