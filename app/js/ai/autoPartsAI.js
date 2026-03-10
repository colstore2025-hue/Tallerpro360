/**
 * autoPartsAI.js
 * TallerPRO360 ERP
 * IA de detección automática de repuestos
 */

import { db } from "../core/firebase-config.js";
import { obtenerEmpresaId } from "../core/empresa-context.js";

import {
  collection,
  query,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ==============================
   Detectar repuestos frecuentes
============================== */

export async function detectarRepuestosFrecuentes(){

  const empresaId = obtenerEmpresaId();

  if(!empresaId){

    console.warn("Empresa no definida");
    return [];

  }

  try{

    const q = query(
      collection(db,"empresas",empresaId,"ordenes")
    );

    const snap = await getDocs(q);

    const repuestos = {};

    snap.forEach(docSnap=>{

      const data = docSnap.data();

      if(!Array.isArray(data.acciones)) return;

      data.acciones.forEach(a=>{

        const nombre = a.descripcion?.toLowerCase();

        if(!nombre) return;

        if(!repuestos[nombre]){
          repuestos[nombre] = 0;
        }

        repuestos[nombre]++;

      });

    });


    /* ordenar repuestos */

    const ranking = Object.entries(repuestos)
      .sort((a,b)=>b[1]-a[1])
      .map(r=>({
        repuesto: r[0],
        uso: r[1]
      }));


    /* guardar cache local */

    localStorage.setItem(
      "rankingRepuestos",
      JSON.stringify(ranking)
    );

    return ranking;

  }
  catch(e){

    console.error("Error analizando repuestos:",e);

    return [];

  }

}


/* ==============================
   Sugerir repuestos por texto
============================== */

export function sugerirRepuestos(texto){

  if(!texto) return [];

  const ranking = JSON.parse(
    localStorage.getItem("rankingRepuestos") || "[]"
  );

  const resultado = ranking.filter(r =>
    texto.toLowerCase().includes(r.repuesto)
  );

  return resultado.slice(0,5);

}