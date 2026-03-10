/**
 * panelFinanciero.js
 * TallerPRO360 ERP
 * Panel financiero con gráfica de utilidades
 */

import { db } from "../core/firebase-config.js";

import {
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";


/* ===============================
PANEL FINANCIERO
=============================== */

export async function panelFinanciero(container){

  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-6">Panel Financiero</h1>
    <canvas id="graficaUtilidad"></canvas>
  `;

  const empresaId = localStorage.getItem("empresaId");

  if(!empresaId){
    container.innerHTML += "<p>Empresa no definida</p>";
    return;
  }

  const ordenesSnap = await getDocs(
    collection(db,"empresas",empresaId,"ordenes")
  );

  const utilidadMes = new Array(12).fill(0);

  ordenesSnap.forEach(docSnap=>{

    const data = docSnap.data();

    if(!data.fecha) return;

    let fecha;

    if(typeof data.fecha.toDate === "function"){
      fecha = data.fecha.toDate();
    }else{
      fecha = new Date(data.fecha);
    }

    const mes = fecha.getMonth();

    const utilidad = (data.acciones || []).reduce((sum,a)=>{

      const precio = Number(a.precio || a.costo || 0);
      const costo = Number(a.costoInterno || a.costo || 0);

      return sum + (precio - costo);

    },0);

    utilidadMes[mes] += utilidad;

  });


  /* ===============================
  GRÁFICA
  =============================== */

  new Chart(
    document.getElementById("graficaUtilidad"),
    {
      type:"line",

      data:{
        labels:[
          "Ene","Feb","Mar","Abr","May","Jun",
          "Jul","Ago","Sep","Oct","Nov","Dic"
        ],

        datasets:[
          {
            label:"Utilidad mensual",
            data:utilidadMes
          }
        ]
      },

      options:{
        responsive:true
      }

    }
  );

}