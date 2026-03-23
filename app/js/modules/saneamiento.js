/**
 * saneamiento.js - TallerPRO360 V6.0 🧪
 * 🛡️ Protocolo de Estabilización - Superadmin: William
 * NOTA: Nombre en minúsculas para compatibilidad total con Vercel.
 */
import { collection, getDocs, doc, updateDoc, Timestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function saneamiento(container) {
  const empresaId = localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-6 bg-[#050a14] min-h-screen text-white font-sans pb-32">
      <div class="flex items-center gap-4 mb-6 text-left">
        <div class="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <i class="fas fa-microchip text-cyan-400 text-xl"></i>
        </div>
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter uppercase leading-none">NEXUS <span class="text-cyan-400">SANEAMIENTO</span></h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">Estabilización de Datos V6.0</p>
        </div>
      </div>
      
      <div id="statusConsole" class="bg-black/90 p-5 rounded-[2rem] border border-white/5 h-80 overflow-y-auto text-[9px] font-mono mb-8 shadow-inner text-emerald-500 custom-scrollbar text-left">
        <span class="text-cyan-400">>> SISTEMA OPERATIVO NEXUS-X...</span><br>
        <span class="text-slate-600">>> Autenticado: Superadmin William</span><br>
        <span class="text-slate-600">>> Esperando ejecución de scripts de limpieza...</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button id="fixDates" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Normalizar Tiempos</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">String a Timestamp</p>
          </div>
          <i class="fas fa-calendar-check text-cyan-400"></i>
        </button>

        <button id="fixInventory" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Reparar Inventario</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Eliminar NaN/Undefined</p>
          </div>
          <i class="fas fa-box-open text-emerald-400"></i>
        </button>

        <button id="fixVehiculos" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Sync de Placas</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Vincular ID-Propiedad</p>
          </div>
          <i class="fas fa-car-crash text-purple-400"></i>
        </button>

        <button id="fixUsers" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Permisos Perfiles</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Vincular EmpresaId</p>
          </div>
          <i class="fas fa-user-shield text-yellow-500"></i>
        </button>
      </div>

      <div class="mt-10 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-center">
        <p class="text-[8px] text-red-500/60 font-black uppercase tracking-[0.2em] italic">William: Esta acción es irreversible sobre la DB</p>
      </div>
    </div>
  `;

  const log = (msg, type = "info") => {
    const consoleDiv = document.getElementById("statusConsole");
    const color = type === "error" ? "text-red-500" : type === "success" ? "text-emerald-400" : "text-cyan-400";
    consoleDiv.innerHTML += `<br><span class="${color}">[${new Date().toLocaleTimeString()}] > ${msg}</span>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  };

  // 1. FECHAS
  document.getElementById("fixDates").onclick = async () => {
    log("Iniciando escaneo de cronología...");
    try {
      const snap = await getDocs(collection(db, `empresas/${empresaId}/ordenes`));
      let count = 0;
      for (const d of snap.docs) {
        const data = d.data();
        if (typeof data.fechaIngreso === "string") {
          await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, d.id), {
            fechaIngreso: Timestamp.fromDate(new Date(data.fechaIngreso))
          });
          count++;
        }
      }
      log(`✅ ÉXITO: ${count} fechas normalizadas.`, "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };

  // 2. INVENTARIO (Anti-NaN)
  document.getElementById("fixInventory").onclick = async () => {
    log("Escaneando stock por valores corruptos (NaN)...");
    try {
      const snap = await getDocs(collection(db, `empresas/${empresaId}/inventario`));
      let count = 0;
      for (const d of snap.docs) {
        const item = d.data();
        const update = {};
        if (isNaN(item.cantidad) || item.cantidad === undefined) update.cantidad = 0;
        if (isNaN(item.costo) || item.costo === undefined) update.costo = 0;
        if (isNaN(item.precioVenta) || item.precioVenta === undefined) update.precioVenta = 0;
        if (Object.keys(update).length > 0) {
          await updateDoc(doc(db, `empresas/${empresaId}/inventario`, d.id), update);
          count++;
        }
      }
      log(`✅ INVENTARIO REPARADO: ${count} ítems estabilizados.`, "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };

  // 3. VEHÍCULOS
  document.getElementById("fixVehiculos").onclick = async () => {
    log("Validando flota vehicular...");
    try {
      const snap = await getDocs(collection(db, `empresas/${empresaId}/vehiculos`));
      let fix = 0;
      for (const d of snap.docs) {
        if (!d.data().placa || d.data().placa === "UNDEFINED") {
            await updateDoc(doc(db, `empresas/${empresaId}/vehiculos`, d.id), { placa: d.id.toUpperCase() });
            fix++;
        }
      }
      log(`✅ FLOTA: ${fix} registros vinculados por ID.`, "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };

  // 4. USUARIOS
  document.getElementById("fixUsers").onclick = async () => {
    log("Verificando jerarquía de usuarios...");
    try {
      const snap = await getDocs(collection(db, "usuariosGlobal"));
      for (const d of snap.docs) {
        if (!d.data().empresaId) {
          await updateDoc(doc(db, "usuariosGlobal", d.id), { empresaId: d.id });
          log(`🔗 Vinculado user ${d.id.substring(0,4)}...`);
        }
      }
      log("✅ Jerarquía de accesos validada.", "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };
}
