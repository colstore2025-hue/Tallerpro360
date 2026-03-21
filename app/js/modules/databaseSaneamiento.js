/**
 * databaseSaneamiento.js
 * 🧪 Panel de Control de Datos - Solo para William (Superadmin)
 * Nexus-X Starlink SAS
 */
import { collection, getDocs, doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function databaseSaneamiento(container) {
  container.innerHTML = `
    <div class="p-6 bg-[#050a14] min-h-screen text-white">
      <h1 class="text-2xl font-black text-cyan-400 mb-2">Saneamiento Nexus-X</h1>
      <p class="text-xs text-slate-500 mb-6 uppercase tracking-widest">Control Global de Estructura</p>
      
      <div id="statusConsole" class="bg-black/50 p-4 rounded-2xl border border-white/10 h-64 overflow-y-auto text-[10px] font-mono mb-6">
        > Esperando comando de William...
      </div>

      <div class="grid grid-cols-1 gap-4">
        <button id="fixDates" class="bg-slate-800 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between">
          <span>📅 Normalizar Fechas</span>
          <i class="fas fa-magic text-cyan-400"></i>
        </button>

        <button id="fixUsers" class="bg-slate-800 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <span>👤 Vincular Usuarios/Empresas</span>
          <i class="fas fa-link text-emerald-400"></i>
        </button>

        <button id="fixVehiculos" class="bg-slate-800 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
          <span>🚗 Corregir IDs de Vehículos</span>
          <i class="fas fa-car text-purple-400"></i>
        </button>
      </div>

      <p class="mt-8 text-center text-[10px] text-red-500 font-bold">⚠️ PRECAUCIÓN: Estas acciones modifican la base de datos en tiempo real.</p>
    </div>
  `;

  const log = (msg) => {
    const consoleDiv = document.getElementById("statusConsole");
    consoleDiv.innerHTML += `<br>> ${msg}`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  };

  // --- 1. NORMALIZAR FECHAS ---
  document.getElementById("fixDates").onclick = async () => {
    log("Iniciando escaneo de órdenes...");
    // Nota: Para mobile, lo hacemos por empresa para no saturar
    const empresaId = localStorage.getItem("empresaId");
    try {
      const snap = await getDocs(collection(db, `empresas/${empresaId}/ordenes`));
      let corregidos = 0;

      for (const d of snap.docs) {
        const data = d.data();
        // Si la fecha es String, la convertimos a Timestamp
        if (typeof data.fecha === "string") {
          await updateDoc(doc(db, `empresas/${empresaId}/ordenes`, d.id), {
            fecha: Timestamp.fromDate(new Date(data.fecha))
          });
          corregidos++;
        }
      }
      log(`✅ Saneamiento de fechas: ${corregidos} órdenes corregidas.`);
    } catch (e) { log(`❌ Error: ${e.message}`); }
  };

  // --- 2. VINCULAR USUARIOS ---
  document.getElementById("fixUsers").onclick = async () => {
    log("Verificando consistencia de perfiles...");
    try {
      const snap = await getDocs(collection(db, "usuariosGlobal"));
      for (const d of snap.docs) {
        const data = d.data();
        if (!data.empresaId) {
          await updateDoc(doc(db, "usuariosGlobal", d.id), { empresaId: d.id });
          log(`🔗 Usuario ${d.id} vinculado a su propia empresa.`);
        }
      }
      log("✅ Proceso de vinculación terminado.");
    } catch (e) { log(`❌ Error: ${e.message}`); }
  };

  // --- 3. CORREGIR VEHÍCULOS ---
  document.getElementById("fixVehiculos").onclick = async () => {
    log("Limpiando base de datos de vehículos...");
    const empresaId = localStorage.getItem("empresaId");
    try {
      const snap = await getDocs(collection(db, `empresas/${empresaId}/vehiculos`));
      for (const d of snap.docs) {
        const data = d.data();
        if (!data.placa) {
          log(`⚠️ Vehículo ${d.id} sin placa. Revisar.`);
        }
      }
      log("✅ Escaneo de vehículos finalizado.");
    } catch (e) { log(`❌ Error: ${e.message}`); }
  };
}
