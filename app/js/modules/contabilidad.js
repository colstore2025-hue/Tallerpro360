/**
 * contabilidad.js - TallerPRO360 ULTRA V4 💼
 * Enfoque: Control de Gastos Operativos y Caja Menor
 */
import { db } from "../core/firebase-config.js";
import { 
  collection, getDocs, addDoc, query, orderBy, serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default async function contabilidadModule(container, state) {
  const empresaId = state?.empresaId || localStorage.getItem("empresaId");
  const base = `empresas/${empresaId}/contabilidad`; // Cambiamos a subcolección dedicada

  // 1. UI DE ALTO IMPACTO (Mobile First)
  container.innerHTML = `
    <div class="p-4 bg-[#050a14] min-h-screen pb-32 text-white font-sans animate-fade-in">
        
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                    LIBRO <span class="text-cyan-400">MAYOR</span>
                </h1>
                <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Control de Egresos e Ingresos</p>
            </div>
            <div class="bg-slate-900 border border-white/5 p-2 rounded-2xl">
                <i class="fas fa-vault text-amber-500 text-lg"></i>
            </div>
        </div>

        <div class="bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl mb-8">
            <h3 class="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-4 px-2">Registrar Movimiento</h3>
            <div class="space-y-3">
                <input id="concepto" type="text" placeholder="Concepto (ej. Pago Arriendo)" 
                       class="w-full bg-black/30 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500 transition-all">
                
                <div class="grid grid-cols-2 gap-3">
                    <select id="tipo" class="bg-black/30 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 outline-none">
                        <option value="ingreso">🟢 Ingreso</option>
                        <option value="gasto" selected>🔴 Egreso / Gasto</option>
                    </select>
                    <input id="monto" type="number" placeholder="Valor $" 
                           class="bg-black/30 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500 transition-all font-black text-cyan-400">
                </div>

                <button id="btnAgregar" class="w-full bg-cyan-500 text-black font-black rounded-2xl p-4 shadow-[0_5px_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all uppercase text-xs tracking-widest">
                    Guardar en Libro
                </button>
            </div>
        </div>

        <div id="resumenFinanzas" class="grid grid-cols-2 gap-4 mb-8">
            <div class="bg-slate-900/50 p-5 rounded-3xl border border-white/5 text-center">
                <p class="text-[8px] text-slate-500 font-black uppercase mb-1 tracking-widest">Saldo en Caja</p>
                <h2 id="balanceTxt" class="text-xl font-black text-white tracking-tighter">$ 0</h2>
            </div>
            <div class="bg-slate-900/50 p-5 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
                <p class="text-[8px] text-slate-500 font-black uppercase mb-1 tracking-widest">Estado</p>
                <div id="estadoIcon" class="text-[9px] font-black py-1 px-3 rounded-full uppercase">Calculando...</div>
            </div>
        </div>

        <h3 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Movimientos Recientes</h3>
        <div id="listaMovimientos" class="space-y-3 pb-24">
            <div class="animate-pulse text-center p-10 text-slate-600 text-[10px] font-black uppercase">Sincronizando Libros...</div>
        </div>
    </div>
  `;

  const listaDiv = document.getElementById("listaMovimientos");
  const balanceTxt = document.getElementById("balanceTxt");
  const estadoIcon = document.getElementById("estadoIcon");

  // 2. CARGA DE DATOS (Limitado a 50 para velocidad)
  async function cargarDatos() {
    try {
      const q = query(collection(db, base), orderBy("creadoEn", "desc"), limit(50));
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
      console.error("Error Contabilidad:", error);
      listaDiv.innerHTML = `<div class="p-10 text-center text-red-500 text-[10px] font-black uppercase tracking-widest italic">Error de Enlace Nexus-X</div>`;
    }
  }

  // 3. RENDERIZADO ESTILO "NEUMORPHIC-DARK"
  function renderLista(data) {
    if (data.length === 0) {
      listaDiv.innerHTML = `<div class="text-center p-10 text-slate-500 text-[10px] font-black uppercase tracking-widest">Sin movimientos este periodo</div>`;
      return;
    }

    listaDiv.innerHTML = data.map(m => `
      <div class="bg-[#0f172a] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center transition-all hover:bg-[#1e293b]">
          <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 border border-white/5">
                <i class="fas ${m.tipo === 'ingreso' ? 'fa-arrow-up text-emerald-500' : 'fa-arrow-down text-red-500'} text-xs"></i>
              </div>
              <div>
                  <p class="text-xs font-black text-white uppercase tracking-tighter">${m.concepto}</p>
                  <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest">${m.fecha?.toDate ? m.fecha.toDate().toLocaleDateString() : 'Pendiente'}</p>
              </div>
          </div>
          <div class="text-right">
              <p class="text-sm font-black ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'} tracking-tighter">
                ${m.tipo === 'ingreso' ? '+' : '-'} $${fmt(m.monto)}
              </p>
          </div>
      </div>
    `).join("");
  }

  function updateResumen(utilidad) {
    balanceTxt.innerText = `$ ${fmt(utilidad)}`;
    if (utilidad >= 0) {
        balanceTxt.className = "text-2xl font-black text-cyan-400 tracking-tighter";
        estadoIcon.innerText = "Operación Saludable";
        estadoIcon.className = "text-[8px] font-black py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase";
    } else {
        balanceTxt.className = "text-2xl font-black text-red-400 tracking-tighter";
        estadoIcon.innerText = "Déficit en Caja";
        estadoIcon.className = "text-[8px] font-black py-1 px-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 uppercase";
    }
  }

  // 4. ACCIÓN DE REGISTRO
  document.getElementById("btnAgregar").onclick = async () => {
    const concepto = document.getElementById("concepto").value.trim();
    const tipo = document.getElementById("tipo").value;
    const monto = Number(document.getElementById("monto").value);

    if (!concepto || monto <= 0) return; // Validación silenciosa o alert

    try {
      const btn = document.getElementById("btnAgregar");
      btn.innerText = "PROCESANDO...";
      btn.disabled = true;

      await addDoc(collection(db, base), {
        concepto,
        tipo,
        monto,
        fecha: new Date(),
        creadoEn: serverTimestamp()
      });

      document.getElementById("concepto").value = "";
      document.getElementById("monto").value = "";
      btn.innerText = "Guardar en Libro";
      btn.disabled = false;
      
      cargarDatos();

    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  function fmt(v) { return new Intl.NumberFormat("es-CO").format(v || 0); }

  cargarDatos();
}
