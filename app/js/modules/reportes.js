/**
================================================
REPORTES.JS - Centro de Reportes Inteligentes
TallerPRO360 - Última generación
================================================
*/

import { moduleLoader } from "../system/moduleLoader.js";
import { db } from "../core/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
import XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

export async function reportes(container){

  container.innerHTML = `
    <h2>📊 Centro de Reportes Inteligentes</h2>

    <div style="margin-top:20px">
      <button id="repVentas" style="padding:10px;margin:5px">Ventas</button>
      <button id="repOrdenes" style="padding:10px;margin:5px">Órdenes</button>
      <button id="repRepuestos" style="padding:10px;margin:5px">Repuestos usados</button>
      <button id="repProveedores" style="padding:10px;margin:5px">Proveedores</button>
      <button id="exportPDF" style="padding:10px;margin:5px;background:#6366f1;color:white;border:none;border-radius:6px;">📄 Exportar PDF</button>
      <button id="exportExcel" style="padding:10px;margin:5px;background:#16a34a;color:white;border:none;border-radius:6px;">📊 Exportar Excel</button>
    </div>

    <div id="resultadoReporte" style="margin-top:30px"></div>
  `;

  const resultado = document.getElementById("resultadoReporte");
  let reporteActual = {titulo:"", datos:[]};

  /* =========================
  REPORTE VENTAS
  ========================= */
  document.getElementById("repVentas").onclick = async ()=>{
    resultado.innerHTML="Calculando ventas...";
    try{
      const snap = await getDocs(collection(db,"ordenes"));
      let total=0;
      const datos=[];
      snap.forEach(doc=>{
        const data=doc.data();
        total+=Number(data.total || 0);
        datos.push({fecha:data.creadoEn?.toDate?.().toLocaleDateString() || "", cliente:data.cliente || "-", total:data.total || 0});
      });
      resultado.innerHTML=`
        <h3>💰 Ventas Totales</h3>
        <p>Total ventas registradas:</p>
        <h2>$ ${total.toLocaleString()}</h2>
      `;
      reporteActual = {titulo:"Ventas Totales", datos};
    }catch(e){
      resultado.innerHTML="Error leyendo ventas";
      console.error(e);
    }
  };

  /* =========================
  REPORTE ÓRDENES
  ========================= */
  document.getElementById("repOrdenes").onclick = async ()=>{
    resultado.innerHTML="Analizando órdenes...";
    try{
      const snap = await getDocs(collection(db,"ordenes"));
      let abiertas=0, proceso=0, finalizadas=0;
      const datos=[];
      snap.forEach(doc=>{
        const data = doc.data();
        const estado=(data.estado || "").toLowerCase();
        if(estado==="abierta") abiertas++;
        else if(estado==="proceso") proceso++;
        else if(estado==="finalizada") finalizadas++;
        datos.push({numero:data.numero || "-", cliente:data.cliente || "-", estado:data.estado || "-", total:data.total || 0});
      });
      resultado.innerHTML=`
        <h3>📋 Estado de Órdenes</h3>
        <p>Abiertas: ${abiertas}</p>
        <p>En proceso: ${proceso}</p>
        <p>Finalizadas: ${finalizadas}</p>
      `;
      reporteActual = {titulo:"Estado de Órdenes", datos};
    }catch(e){
      resultado.innerHTML="Error leyendo órdenes";
      console.error(e);
    }
  };

  /* =========================
  REPORTE REPUESTOS
  ========================= */
  document.getElementById("repRepuestos").onclick = async ()=>{
    resultado.innerHTML="Analizando repuestos...";
    try{
      const snap = await getDocs(collection(db,"inventario"));
      let lista=[];
      snap.forEach(doc=>{
        const data=doc.data();
        lista.push({nombre:data.nombre || "-", stock:data.stock || 0});
      });
      lista.sort((a,b)=>a.stock-b.stock);
      let html="<h3>⚠ Repuestos con poco stock</h3>";
      lista.slice(0,5).forEach(r=>html+=`<p>${r.nombre} - stock: ${r.stock}</p>`);
      resultado.innerHTML=html;
      reporteActual = {titulo:"Repuestos con poco stock", datos:lista};
    }catch(e){
      resultado.innerHTML="Error leyendo inventario";
      console.error(e);
    }
  };

  /* =========================
  REPORTE PROVEEDORES
  ========================= */
  document.getElementById("repProveedores").onclick = async ()=>{
    resultado.innerHTML="Buscando proveedores...";
    try{
      const snap = await getDocs(collection(db,"proveedores"));
      let lista=[];
      snap.forEach(doc=>{
        const data=doc.data();
        lista.push({nombre:data.nombre || "Proveedor", ciudad:data.ciudad || ""});
      });
      let html="<h3>🏭 Proveedores registrados</h3>";
      lista.forEach(p=>html+=`<p>${p.nombre} - ${p.ciudad}</p>`);
      resultado.innerHTML=html;
      reporteActual = {titulo:"Proveedores registrados", datos:lista};
    }catch(e){
      resultado.innerHTML="Error leyendo proveedores";
      console.error(e);
    }
  };

  /* =========================
  EXPORTAR PDF
  ========================= */
  document.getElementById("exportPDF").onclick = ()=>{
    if(!reporteActual.datos.length) return alert("Seleccione un reporte primero");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(reporteActual.titulo, 10, 10);
    let y = 20;
    reporteActual.datos.forEach(r=>{
      doc.text(JSON.stringify(r), 10, y);
      y+=8;
    });
    doc.save(`${reporteActual.titulo}.pdf`);
  };

  /* =========================
  EXPORTAR EXCEL
  ========================= */
  document.getElementById("exportExcel").onclick = ()=>{
    if(!reporteActual.datos.length) return alert("Seleccione un reporte primero");
    const ws = XLSX.utils.json_to_sheet(reporteActual.datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `${reporteActual.titulo}.xlsx`);
  };

}

/* =========================
AUTO REGISTRO
=========================== */
moduleLoader.register("reportes",reportes);