/**
 * contabilidad.js
 * Contabilidad Inteligente + IA + Reportes Dinámicos
 * TallerPRO360 ERP SaaS
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { generarSugerencias, renderSugerencias } from "../ai/aiAdvisor.js";
import { hablar } from "../voice/voiceCore.js";

export default async function contabilidadModule(container, state) {

  container.innerHTML = `
    <h1 style="color:#0ff; text-shadow:0 0 10px #0ff;">💼 Contabilidad Inteligente PRO360</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
      <input id="concepto" placeholder="Concepto" style="flex:2; padding:8px; border-radius:6px;"/>
      <input id="tipo" placeholder="Tipo (ingreso/gasto)" style="flex:1; padding:8px; border-radius:6px;"/>
      <input id="monto" placeholder="Monto" type="number" style="flex:1; padding:8px; border-radius:6px;"/>
      <button id="agregar" style="flex:1; background:#16a34a; border-radius:6px; font-weight:bold;">➕ Agregar</button>
    </div>

    <div id="alertas"></div>
    <div id="lista"></div>
    <div id="advisorContabilidad" style="margin-top:20px;"></div>
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");

  let movimientos = [];

  // 🔄 Cargar movimientos contables
  async function cargarMovimientos() {
    try {
      const q = query(
        collection(window.db, "contabilidad"),
        where("empresaId", "==", state.empresaId),
        orderBy("fecha", "desc")
      );
      const snap = await getDocs(q);
      movimientos = [];
      let alertas = [];

      let totalIngresos = 0;
      let totalGastos = 0;

      snap.forEach(docSnap => {
        const m = docSnap.data();
        movimientos.push({ id: docSnap.id, ...m });

        if(m.tipo === "ingreso") totalIngresos += Number(m.monto || 0);
        if(m.tipo === "gasto") totalGastos += Number(m.monto || 0);
      });

      const utilidad = totalIngresos - totalGastos;

      renderLista(movimientos);
      renderAlertas(utilidad);

      // 🔮 IA: recomendaciones
      const sugerencias = await generarSugerencias({ contabilidad: movimientos, empresaId: state.empresaId });
      renderSugerencias("advisorContabilidad", sugerencias);

    } catch(e){
      console.error(e);
      lista.innerHTML = "❌ Error cargando contabilidad";
    }
  }

  // 🎨 Render lista de movimientos
  function renderLista(data){
    lista.innerHTML = data.map(m => `
      <div style="background:#111;padding:12px;margin:8px 0;border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          📝 <strong>${m.concepto}</strong> <br/>
          Tipo: ${m.tipo} | $${formatear(m.monto)} <br/>
          Fecha: ${m.fecha?.toDate ? m.fecha.toDate().toLocaleString() : new Date(m.fecha).toLocaleString()}
        </div>
      </div>
    `).join("");
  }

  // 🚨 Alertas y resumen
  function renderAlertas(utilidad){
    if(utilidad < 0){
      alertasDiv.innerHTML = `<h3 style="color:#ff4d4d;">❌ Pérdida actual: $${formatear(utilidad)}</h3>`;
      hablar("⚠️ Atención, el balance contable está en pérdida");
    } else {
      alertasDiv.innerHTML = `<h3 style="color:#0ff;">✅ Utilidad actual: $${formatear(utilidad)}</h3>`;
      hablar("✅ Balance contable positivo");
    }
  }

  // ➕ Agregar movimiento contable
  document.getElementById("agregar").onclick = async ()=>{
    const concepto = document.getElementById("concepto").value.trim();
    const tipo = document.getElementById("tipo").value.trim().toLowerCase();
    const monto = Number(document.getElementById("monto").value) || 0;

    if(!concepto || !tipo || !["ingreso","gasto"].includes(tipo) || monto<=0){
      alert("Datos incompletos o incorrectos");
      return;
    }

    try {
      await addDoc(collection(window.db,"contabilidad"),{
        empresaId: state.empresaId,
        concepto,
        tipo,
        monto,
        fecha: new Date()
      });

      ["concepto","tipo","monto"].forEach(id=>document.getElementById(id).value="");
      hablar(`✅ Movimiento contable ${tipo} agregado`);
      cargarMovimientos();
    } catch(e){ console.error(e); alert("❌ Error agregando movimiento"); }
  };

  // 💰 Formatear dinero
  function formatear(valor){
    return new Intl.NumberFormat("es-CO").format(valor||0);
  }

  // INIT
  cargarMovimientos();
}