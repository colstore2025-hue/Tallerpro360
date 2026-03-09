import { db } from "./firebase.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";

export async function panelFinanciero(container){
  container.innerHTML = `<h1 class="text-2xl font-bold mb-6">Panel Financiero</h1><canvas id="graficaUtilidad"></canvas>`;
  const ordenesSnap = await getDocs(collection(db,"ordenes"));

  const utilidadMes = new Array(12).fill(0);
  ordenesSnap.forEach(doc=>{
    const data = doc.data();
    if(!data.fecha) return;
    const mes = data.fecha.toDate().getMonth();
    let utilidad = (data.acciones||[]).reduce((sum,a)=>sum+(a.precio||0)-(a.costo||0),0);
    utilidadMes[mes]+=utilidad;
  });

  new Chart(document.getElementById("graficaUtilidad"),{
    type:"line", data:{ labels:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"], datasets:[{label:"Utilidad", data:utilidadMes}] }
  });
}