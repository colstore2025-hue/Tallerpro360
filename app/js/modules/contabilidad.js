/**
 * contabilidad.js - TallerPRO360 ULTRA V3 💼
 * Sincronizado con el Núcleo Soberano y Reglas Tipo A
 */
import { db } from "../core/firebase-config.js"; // 👈 IMPORTACIÓN DIRECTA (Clave del éxito)
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function contabilidadModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId") || "taller_001";
  const base = `empresas/${empresaId}/finanzas`;

  // 1. RENDER ESTRUCTURA (Diseño UX Pro)
  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen text-white font-sans">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-black italic tracking-tighter text-cyan-400 uppercase">
                💼 Finanzas <span class="text-white font-light underline decoration-yellow-500">PRO360</span>
            </h1>
            <div id="statusBadge" class="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-widest">
                Sincronizado
            </div>
        </div>

        <div class="bg-[#0f172a] p-5 rounded-[30px] border border-slate-800 shadow-2xl mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input id="concepto" type="text" placeholder="Concepto (ej. Repuestos)" 
                       class="bg-[#1e293b] border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                
                <select id="tipo" class="bg-[#1e293b] border-none rounded-2xl p-3 text-sm text-slate-300 outline-none">
                    <option value="ingreso">🟢 Ingreso</option>
                    <option value="gasto">🔴 Gasto</option>
                </select>

                <input id="monto" type="number" placeholder="Monto $" 
                       class="bg-[#1e293b] border-none rounded-2xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none">

                <button id="btnAgregar" class="bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-black rounded-2xl p-3 hover:scale-95 transition-all">
                    ➕ REGISTRAR
                </button>
            </div>
        </div>

        <div id="resumenFinanzas" class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-[#0f172a] p-4 rounded-3xl border border-slate-800 text-center">
                <p class="text-[10px] text-slate-500 font-black uppercase mb-1">Balance Total</p>
                <h2 id="balanceTxt" class="text-xl font-black text-white">$ 0</h2>
            </div>
            <div class="bg-[#0f172a] p-4 rounded-3xl border border-slate-800 text-center">
                <p class="text-[10px] text-slate-500 font-black uppercase mb-1">Estado</p>
                <div id="estadoIcon" class="text-xs font-bold py-1 px-2 rounded-full inline-block mt-1">Cargando...</div>
            </div>
        </div>

        <div id="listaMovimientos" class="space-y-3 pb-24">
            <div class="animate-pulse text-center p-10 text-slate-600 italic">Consultando libros contables...</div>
        </div>
    </div>
  `;

  const listaDiv = document.getElementById("listaMovimientos");
  const balanceTxt = document.getElementById("balanceTxt");
  const estadoIcon = document.getElementById("estadoIcon");

  // 2. LÓGICA DE CARGA (Resiliente)
  async function cargarDatos() {
    try {
      console.log("📊 Consultando contabilidad para:", empresaId);
      const q = query(collection(db, base), orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      
      let movimientos = [];
      let totalIngresos = 0;
      let totalGastos = 0;

      snap.forEach(doc => {
        const data = doc.data();
        movimientos.push({ id: doc.id, ...data });
        if (data.tipo === "ingreso") totalIngresos += Number(data.monto || 0);
        else totalGastos += Number(data.monto || 0);
      });

      renderLista(movimientos);
      updateResumen(totalIngresos - totalGastos);

    } catch (error) {
      console.error("🔥 Error Contabilidad:", error);
      listaDiv.innerHTML = `<div class="p-10 text-center text-red-500 font-bold uppercase">Error de Acceso (Firestore Reglas A)</div>`;
    }
  }

  // 3. RENDERIZADO DE LISTA
  function renderLista(data) {
    if (data.length === 0) {
      listaDiv.innerHTML = `<div class="text-center p-10 text-slate-500">Sin movimientos registrados este mes.</div>`;
      return;
    }

    listaDiv.innerHTML = data.map(m => `
      <div class="bg-[#0f172a] p-4 rounded-3xl border border-slate-800 flex justify-between items-center transition hover:border-slate-600">
          <div>
              <p class="text-[11px] font-black text-white uppercase mb-1">${m.concepto}</p>
              <p class="text-[9px] text-slate-500 italic">${m.fecha?.toDate ? m.fecha.toDate().toLocaleString() : 'Fecha pendiente'}</p>
          </div>
          <div class="text-right">
              <p class="text-sm font-black ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}">
                ${m.tipo === 'ingreso' ? '+' : '-'} $${fmt(m.monto)}
              </p>
              <p class="text-[8px] text-slate-600 font-bold uppercase tracking-widest">${m.tipo}</p>
          </div>
      </div>
    `).join("");
  }

  function updateResumen(utilidad) {
    balanceTxt.innerText = `$ ${fmt(utilidad)}`;
    if (utilidad >= 0) {
        balanceTxt.className = "text-xl font-black text-cyan-400";
        estadoIcon.innerText = "RENTABLE";
        estadoIcon.className = "text-[9px] font-bold py-1 px-3 rounded-full inline-block bg-emerald-500/20 text-emerald-400";
    } else {
        balanceTxt.className = "text-xl font-black text-red-400";
        estadoIcon.innerText = "DÉFICIT";
        estadoIcon.className = "text-[9px] font-bold py-1 px-3 rounded-full inline-block bg-red-500/20 text-red-400";
    }
  }

  // 4. ACCIÓN DE AGREGAR (Con Timestamp de Servidor)
  document.getElementById("btnAgregar").onclick = async () => {
    const concepto = document.getElementById("concepto").value.trim();
    const tipo = document.getElementById("tipo").value;
    const monto = Number(document.getElementById("monto").value);

    if (!concepto || monto <= 0) return alert("Por favor completa los datos correctamente.");

    try {
      const btn = document.getElementById("btnAgregar");
      btn.innerText = "⌛...";
      btn.disabled = true;

      await addDoc(collection(db, base), {
        concepto,
        tipo,
        monto,
        fecha: new Date(), // Usamos Date local para visualización inmediata
        creadoEn: serverTimestamp() // Importante para orden real en DB
      });

      // Reset y Recarga
      document.getElementById("concepto").value = "";
      document.getElementById("monto").value = "";
      btn.innerText = "➕ REGISTRAR";
      btn.disabled = false;
      
      cargarDatos();

    } catch (error) {
      console.error("Error al guardar:", error);
      alert("No tienes permiso para registrar. Revisa tu sesión.");
    }
  };

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  // 🚀 ARRANQUE
  cargarDatos();
}
