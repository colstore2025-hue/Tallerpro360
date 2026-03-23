/**
 * databaseSaneamiento.js - TallerPRO360 V6.0 🧪
 * 🛡️ Panel de Integridad Estructural - Superadmin: William
 */
import { collection, getDocs, doc, updateDoc, Timestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function databaseSaneamiento(container) {
  const empresaId = localStorage.getItem("empresaId");

  container.innerHTML = `
    <div class="p-6 bg-[#050a14] min-h-screen text-white font-sans pb-32">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <i class="fas fa-microchip text-cyan-400 text-xl"></i>
        </div>
        <div>
            <h1 class="text-2xl font-black italic tracking-tighter uppercase">NEXUS <span class="text-cyan-400">SANEAMIENTO</span></h1>
            <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 italic">Protocolo de Estabilización V6.0</p>
        </div>
      </div>
      
      <div id="statusConsole" class="bg-black/80 p-5 rounded-[2rem] border border-white/5 h-80 overflow-y-auto text-[9px] font-mono mb-8 shadow-inner text-emerald-500 custom-scrollbar">
        <span class="text-cyan-400">>> NEXUS-X OS INICIALIZADO...</span><br>
        <span class="text-slate-600">>> Esperando instrucciones de Superadmin William...</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button id="fixDates" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Normalizar Tiempos</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Convierte Strings a Timestamps</p>
          </div>
          <i class="fas fa-calendar-check text-cyan-400 group-hover:animate-bounce"></i>
        </button>

        <button id="fixInventory" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Reparar Inventario</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Elimina NaN y Valores corruptos</p>
          </div>
          <i class="fas fa-box-open text-emerald-400 group-hover:animate-pulse"></i>
        </button>

        <button id="fixVehiculos" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Saneamiento de Placas</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Vincular ID con Propiedad Placa</p>
          </div>
          <i class="fas fa-car-crash text-purple-400"></i>
        </button>

        <button id="fixUsers" class="group bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all flex items-center justify-between active:scale-95">
          <div class="text-left">
            <p class="text-[10px] font-black uppercase text-white">Integridad de Perfiles</p>
            <p class="text-[7px] text-slate-500 uppercase mt-1">Vincular EmpresaId a Usuarios</p>
          </div>
          <i class="fas fa-user-shield text-yellow-500"></i>
        </button>
      </div>

      <div class="mt-10 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-center">
        <p class="text-[9px] text-red-500 font-black uppercase tracking-widest italic">⚠️ Acceso Restringido - Modificación en caliente de producción</p>
      </div>
    </div>
  `;

  const log = (msg, type = "info") => {
    const consoleDiv = document.getElementById("statusConsole");
    const color = type === "error" ? "text-red-500" : type === "success" ? "text-emerald-400" : "text-cyan-400";
    consoleDiv.innerHTML += `<br><span class="${color}">[${new Date().toLocaleTimeString()}] > ${msg}</span>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  };

  // --- 1. NORMALIZAR FECHAS (Reparación de Histórico) ---
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
      log(`✅ ÉXITO: ${count} órdenes actualizadas a Timestamps nativos.`, "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };

  // --- 2. REPARAR INVENTARIO (Anti-NaN) ---
  document.getElementById("fixInventory").onclick = async () => {
    log("Escaneando stock en busca de valores corruptos (NaN)...");
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
      log(`✅ INVENTARIO SANEADO: ${count} repuestos reparados.`, "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };

  // --- 3. CORREGIR VEHÍCULOS (Integridad Placa-ID) ---
  document.getElementById("fixVehiculos").onclick = async () => {
    log("Verificando consistencia de flota vehicular...");
    try {
      const snap = await getDocs(collection(db, `empresas/${empresaId}/vehiculos`));
      let fix = 0;
      for (const d of snap.docs) {
        const data = d.data();
        if (!data.placa || data.placa === "UNDEFINED") {
            // Intentar recuperar placa del ID del documento si es que se guardó así
            await updateDoc(doc(db, `empresas/${empresaId}/vehiculos`, d.id), { placa: d.id.toUpperCase() });
            fix++;
        }
      }
      log(`✅ FLOTA ESTABILIZADA: ${fix} registros actualizados.`, "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };

  // --- 4. VINCULAR USUARIOS ---
  document.getElementById("fixUsers").onclick = async () => {
    log("Validando permisos jerárquicos de usuarios...");
    try {
      const snap = await getDocs(collection(db, "usuariosGlobal"));
      for (const d of snap.docs) {
        const data = d.data();
        if (!data.empresaId) {
          await updateDoc(doc(db, "usuariosGlobal", d.id), { empresaId: "NEXUS_DEFAULT_ID" });
          log(`🔗 Vinculando user ${d.id.substring(0,5)}...`);
        }
      }
      log("✅ Jerarquía de usuarios validada.", "success");
    } catch (e) { log(`❌ ERROR: ${e.message}`, "error"); }
  };
}