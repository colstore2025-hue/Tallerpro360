/**
 * contabilidad.js
 * Contabilidad PRO360 · Producción estable (Modo SaaS limpio 🚀)
 */

import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* 🔥 DB GLOBAL */
const db = window.db;

export default async function contabilidadModule(container, state) {

  /* ===== VALIDACIÓN ===== */
  if (!state?.empresaId) {
    container.innerHTML = `
      <h2 style="color:red;text-align:center;">
        ❌ Empresa no definida
      </h2>
    `;
    return;
  }

  const base = `empresas/${state.empresaId}`;

  let movimientos = [];

  container.innerHTML = `
    <h1 style="color:#00ffff;font-size:34px;font-weight:900;">
      💼 Contabilidad PRO360
    </h1>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <input id="concepto" placeholder="Concepto"
        style="flex:2;padding:10px;border-radius:8px;"/>

      <input id="tipo" placeholder="Tipo (ingreso/gasto)"
        style="flex:1;padding:10px;border-radius:8px;"/>

      <input id="monto" type="number" placeholder="Monto"
        style="flex:1;padding:10px;border-radius:8px;"/>

      <button id="agregar"
        style="flex:1;background:#22c55e;color:#000;border-radius:8px;">
        ➕ Agregar
      </button>
    </div>

    <div id="alertas"></div>
    <div id="lista"></div>
  `;

  const lista = document.getElementById("lista");
  const alertasDiv = document.getElementById("alertas");

  /* ================= LOAD ================= */

  async function cargarMovimientos() {

    lista.innerHTML = "🔄 Cargando contabilidad...";

    try {

      const snap = await getDocs(
        query(
          collection(db, `${base}/finanzas`),
          orderBy("fecha", "desc")
        )
      );

      movimientos = [];

      let totalIngresos = 0;
      let totalGastos = 0;

      snap.forEach(docSnap => {

        const m = docSnap.data() || {};

        movimientos.push({
          id: docSnap.id,
          ...m
        });

        if (m.tipo === "ingreso") {
          totalIngresos += Number(m.monto || 0);
        }

        if (m.tipo === "gasto") {
          totalGastos += Number(m.monto || 0);
        }

      });

      const utilidad = totalIngresos - totalGastos;

      renderLista(movimientos);
      renderAlertas(utilidad);

    } catch (e) {

      console.error("🔥 ERROR CONTABILIDAD:", e);

      lista.innerHTML = `
        <p style="color:red;text-align:center;">
          ❌ Error cargando contabilidad
        </p>
      `;
    }
  }

  /* ================= RENDER ================= */

  function renderLista(data) {

    if (!data.length) {
      lista.innerHTML = `<p style="text-align:center;">📭 Sin movimientos</p>`;
      return;
    }

    lista.innerHTML = data.map(m => {

      let fecha = "";

      try {
        if (m.fecha?.toDate) {
          fecha = m.fecha.toDate().toLocaleString();
        } else if (m.fecha) {
          fecha = new Date(m.fecha).toLocaleString();
        }
      } catch {}

      return `
        <div style="
          background:#111827;
          padding:15px;
          margin:10px 0;
          border-radius:12px;
          border:1px solid #1f2937;
        ">
          📝 <strong>${m.concepto || "-"}</strong><br/>
          Tipo: ${m.tipo || "-"} | $${fmt(m.monto)}<br/>
          <span style="color:#94a3b8;">${fecha}</span>
        </div>
      `;
    }).join("");
  }

  /* ================= ALERTAS ================= */

  function renderAlertas(utilidad) {

    if (utilidad < 0) {

      alertasDiv.innerHTML = `
        <h3 style="color:#ef4444;">
          ❌ Pérdida: $${fmt(utilidad)}
        </h3>
      `;

    } else {

      alertasDiv.innerHTML = `
        <h3 style="color:#00ffff;">
          ✅ Utilidad: $${fmt(utilidad)}
        </h3>
      `;
    }
  }

  /* ================= CREAR ================= */

  document.getElementById("agregar").onclick = async () => {

    const concepto = document.getElementById("concepto").value.trim();
    const tipo = document.getElementById("tipo").value.trim().toLowerCase();
    const monto = Number(document.getElementById("monto").value) || 0;

    if (!concepto || !["ingreso","gasto"].includes(tipo) || monto <= 0) {
      alert("Datos inválidos");
      return;
    }

    try {

      await addDoc(
        collection(db, `${base}/finanzas`),
        {
          concepto,
          tipo,
          monto,
          fecha: new Date(),
          creadoEn: new Date()
        }
      );

      ["concepto","tipo","monto"].forEach(id => {
        document.getElementById(id).value = "";
      });

      cargarMovimientos();

    } catch (e) {

      console.error(e);
      alert("Error guardando movimiento");
    }
  };

  /* ================= UTILS ================= */

  function fmt(v) {
    return new Intl.NumberFormat("es-CO").format(v || 0);
  }

  /* INIT */
  cargarMovimientos();
}