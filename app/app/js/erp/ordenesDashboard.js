/**
 * ordenesDashboard.js
 * Dashboard en tiempo real del ERP
 * TallerPRO360
 */

import { db } from "../core/firebase-config.js";
import { getTallerId } from "../core/tallerContext.js";

import {
  collection,
  query,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* ==============================
ESTADO GLOBAL DEL DASHBOARD
============================== */

let ordenes = [];


/* ==============================
INICIAR DASHBOARD
============================== */

export function iniciarDashboard(){

  const empresaId = getTallerId();

  if(!empresaId){
    console.warn("Empresa no identificada");
    return;
  }

  const q = query(
    collection(db,"empresas",empresaId,"ordenes"),
    orderBy("fechaCreacion","desc")
  );

  onSnapshot(q,(snapshot)=>{

    ordenes = [];

    snapshot.forEach(doc=>{

      ordenes.push({
        id:doc.id,
        ...doc.data()
      });

    });

    actualizarMetricas();
    renderizarOrdenes();

  });

}


/* ==============================
CALCULAR MÉTRICAS
============================== */

function actualizarMetricas(){

  let totalHoy = 0;
  let totalOrdenes = ordenes.length;

  let activas = 0;
  let proceso = 0;
  let terminadas = 0;
  let entregadas = 0;


  ordenes.forEach(o=>{

    /* total facturado */

    totalHoy += Number(o.total ?? 0);


    /* estados */

    switch(o.estado){

      case "activa":
        activas++;
      break;

      case "proceso":
        proceso++;
      break;

      case "terminada":
        terminadas++;
      break;

      case "entregada":
        entregadas++;
      break;

    }

  });


  /* actualizar UI */

  setHTML("totalOrdenes", totalOrdenes);
  setHTML("totalFacturado", formatoCOP(totalHoy));

  setHTML("ordenesActivas", activas);
  setHTML("ordenesProceso", proceso);
  setHTML("ordenesTerminadas", terminadas);
  setHTML("ordenesEntregadas", entregadas);

}


/* ==============================
RENDERIZAR LISTA DE ÓRDENES
============================== */

function renderizarOrdenes(){

  const container =
    document.getElementById("listaOrdenes");

  if(!container) return;

  container.innerHTML = "";


  ordenes.forEach(o=>{

    const card = document.createElement("div");

    card.className =
      "bg-slate-800 p-4 rounded-xl shadow mb-3";


    card.innerHTML = `

<div class="flex justify-between">

  <div>

    <div class="font-bold text-emerald-400">
      ${o.placa ?? ""}
    </div>

    <div class="text-sm text-slate-300">
      ${o.cliente ?? ""}
    </div>

    <div class="text-xs text-slate-500">
      ${o.vehiculo ?? ""}
    </div>

  </div>

  <div class="text-right">

    <div class="text-sm">
      ${formatoCOP(o.total ?? 0)}
    </div>

    <div class="text-xs mt-1 ${colorEstado(o.estado)}">
      ${o.estado ?? ""}
    </div>

  </div>

</div>

`;

    container.appendChild(card);

  });

}


/* ==============================
COLOR SEGÚN ESTADO
============================== */

function colorEstado(estado){

  switch(estado){

    case "activa":
      return "text-yellow-400";

    case "proceso":
      return "text-blue-400";

    case "terminada":
      return "text-green-400";

    case "entregada":
      return "text-emerald-500";

    default:
      return "text-slate-400";

  }

}


/* ==============================
FORMATO PESOS
============================== */

function formatoCOP(valor){

  return new Intl.NumberFormat(
    "es-CO",
    {
      style:"currency",
      currency:"COP"
    }
  ).format(valor);

}


/* ==============================
UTILIDAD HTML
============================== */

function setHTML(id,value){

  const el = document.getElementById(id);

  if(el) el.innerHTML = value;

}