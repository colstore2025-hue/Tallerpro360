/**
 * saneamiento.js - TallerPRO360 NEXUS-X V6.0 🧪
 * 🛡️ PANEL DE INTEGRIDAD ESTRUCTURAL - PRIVILEGIOS DE SUPERADMIN
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, getDocs, doc, updateDoc, Timestamp, query, where, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function databaseSaneamiento(container) {
    const empresaId = localStorage.getItem("nexus_empresaId");

    container.innerHTML = `
    <div class="p-6 lg:p-12 bg-[#010409] min-h-screen text-white font-sans pb-40 animate-in fade-in duration-1000">
        
        <header class="flex items-center gap-6 mb-12 border-b border-red-500/20 pb-8">
            <div class="w-20 h-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <i class="fas fa-biohazard text-red-500 text-3xl animate-pulse"></i>
            </div>
            <div>
                <h1 class="orbitron text-4xl font-black italic tracking-tighter uppercase leading-none text-white">
                    NEXUS <span class="text-red-500">SANITIZER</span>
                </h1>
                <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 orbitron italic">
                    Nivel de Acceso: <span class="text-red-500">Superadmin William</span>
                </p>
            </div>
        </header>

        <div class="relative mb-12">
            <div id="statusConsole" class="bg-black/90 p-8 rounded-[3rem] border border-white/5 h-96 overflow-y-auto text-[10px] font-mono shadow-2xl text-emerald-500 custom-scrollbar relative z-10">
                <span class="text-red-500 font-bold">>> [SISTEMA] ADVERTENCIA: ACCESO A BASE DE DATOS EN CALIENTE</span><br>
                <span class="text-cyan-400">>> NEXUS-X OS V6.0 INICIALIZADO...</span><br>
                <span class="text-slate-600">>> Identidad confirmada: William Jeffry Urquijo.</span><br>
                <span class="text-slate-600">>> Esperando parámetros de estabilización...</span>
            </div>
            <div class="absolute inset-0 pointer-events-none bg-scanline opacity-10 rounded-[3rem] z-20"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <button id="fixDates" class="group bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-cyan-500/50 transition-all flex flex-col gap-4 text-left active:scale-95 shadow-xl">
                <div class="flex justify-between items-start w-full">
                    <i class="fas fa-history text-cyan-400 text-xl"></i>
                    <span class="text-[7px] orbitron text-slate-600 uppercase font-black tracking-widest">P-01</span>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase text-white orbitron">Normalizar Tiempos</p>
                    <p class="text-[8px] text-slate-500 uppercase mt-1 leading-relaxed">Convierte registros de String a Timestamp Nativo.</p>
                </div>
            </button>

            <button id="fixInventory" class="group bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/50 transition-all flex flex-col gap-4 text-left active:scale-95 shadow-xl">
                <div class="flex justify-between items-start w-full">
                    <i class="fas fa-microchip text-emerald-400 text-xl"></i>
                    <span class="text-[7px] orbitron text-slate-600 uppercase font-black tracking-widest">P-02</span>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase text-white orbitron">Depuración de Stock</p>
                    <p class="text-[8px] text-slate-500 uppercase mt-1 leading-relaxed">Elimina valores NaN y restaura integridad numérica.</p>
                </div>
            </button>

            <button id="fixVehiculos" class="group bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-purple-500/50 transition-all flex flex-col gap-4 text-left active:scale-95 shadow-xl">
                <div class="flex justify-between items-start w-full">
                    <i class="fas fa-shield-virus text-purple-400 text-xl"></i>
                    <span class="text-[7px] orbitron text-slate-600 uppercase font-black tracking-widest">P-03</span>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase text-white orbitron">Saneamiento de Flota</p>
                    <p class="text-[8px] text-slate-500 uppercase mt-1 leading-relaxed">Revincula IDs huérfanos con registros de placa.</p>
                </div>
            </button>

            <button id="fixUsers" class="group bg-[#0d1117] p-8 rounded-[2.5rem] border border-white/5 hover:border-yellow-500/50 transition-all flex flex-col gap-4 text-left active:scale-95 shadow-xl">
                <div class="flex justify-between items-start w-full">
                    <i class="fas fa-users-cog text-yellow-500 text-xl"></i>
                    <span class="text-[7px] orbitron text-slate-600 uppercase font-black tracking-widest">P-04</span>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase text-white orbitron">Jerarquía de Usuarios</p>
                    <p class="text-[8px] text-slate-500 uppercase mt-1 leading-relaxed">Audita y vincula perfiles a empresas raíz.</p>
                </div>
            </button>
        </div>

        <div class="mt-12 p-8 bg-red-950/20 rounded-[2.5rem] border border-red-500/20 text-center flex items-center justify-center gap-4">
            <i class="fas fa-exclamation-triangle text-red-500 animate-pulse"></i>
            <p class="text-[9px] text-red-500 font-black uppercase tracking-[0.3em] orbitron italic">
                Operando en Capa de Abstracción de Datos - Los cambios son irreversibles
            </p>
        </div>
    </div>
    `;

    const log = (msg, type = "info") => {
        const consoleDiv = document.getElementById("statusConsole");
        const colors = {
            error: "text-red-500",
            success: "text-emerald-400",
            warning: "text-yellow-400",
            info: "text-cyan-400"
        };
        const color = colors[type] || colors.info;
        consoleDiv.innerHTML += `<br><span class="${color}">[${new Date().toLocaleTimeString()}] > ${msg}</span>`;
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };

    // --- ACCIÓN 01: NORMALIZAR CRONOLOGÍA ---
    document.getElementById("fixDates").onclick = async () => {
        log("INICIANDO ESCANEO DE CRONOLOGÍA TÁCTICA...", "info");
        try {
            const snap = await getDocs(collection(db, "empresas", empresaId, "ordenes"));
            const batch = writeBatch(db); // Mejor rendimiento con Batch
            let count = 0;

            snap.forEach(d => {
                const data = d.data();
                if (typeof data.fechaIngreso === "string") {
                    const docRef = doc(db, "empresas", empresaId, "ordenes", d.id);
                    batch.update(docRef, { fechaIngreso: Timestamp.fromDate(new Date(data.fechaIngreso)) });
                    count++;
                }
            });

            if (count > 0) await batch.commit();
            log(`REPARACIÓN FINALIZADA. ${count} registros cronológicos estabilizados.`, "success");
            hablar(`Protocolo uno completado. ${count} órdenes estabilizadas.`);
        } catch (e) { log(`FALLO DE NÚCLEO: ${e.message}`, "error"); }
    };

    // --- ACCIÓN 02: DEPURACIÓN DE INVENTARIO ---
    document.getElementById("fixInventory").onclick = async () => {
        log("ESCANEANDO NÚCLEOS DE INVENTARIO (ANTI-CORRUPCIÓN)...", "info");
        try {
            const snap = await getDocs(collection(db, "empresas", empresaId, "inventario"));
            const batch = writeBatch(db);
            let count = 0;

            snap.forEach(d => {
                const item = d.data();
                const update = {};
                if (isNaN(item.cantidad) || item.cantidad === undefined) update.cantidad = 0;
                if (isNaN(item.costo) || item.costo === undefined) update.costo = 0;
                if (Object.keys(update).length > 0) {
                    batch.update(doc(db, "empresas", empresaId, "inventario", d.id), update);
                    count++;
                }
            });

            if (count > 0) await batch.commit();
            log(`INVENTARIO SANEADO. ${count} unidades de stock reparadas.`, "success");
            hablar("Protocolo dos finalizado. Valores de inventario corregidos.");
        } catch (e) { log(`FALLO EN SECTOR INVENTARIO: ${e.message}`, "error"); }
    };

    // --- ACCIÓN 03: SANEAMIENTO DE FLOTA ---
    document.getElementById("fixVehiculos").onclick = async () => {
        log("VALIDANDO INTEGRIDAD DE ACTIVOS MÓVILES...", "info");
        try {
            const snap = await getDocs(collection(db, "empresas", empresaId, "vehiculos"));
            let fix = 0;
            for (const d of snap.docs) {
                const data = d.data();
                if (!data.placa || data.placa === "UNDEFINED") {
                    await updateDoc(doc(db, "empresas", empresaId, "vehiculos", d.id), { 
                        placa: d.id.toUpperCase(),
                        status: "NORMALIZADO"
                    });
                    fix++;
                }
            }
            log(`SANEAMIENTO DE FLOTA COMPLETO. ${fix} unidades recuperadas.`, "success");
            hablar(`Protocolo tres exitoso. ${fix} vehículos vinculados.`);
        } catch (e) { log(`ERROR EN RADAR DE FLOTA: ${e.message}`, "error"); }
    };

    // --- ACCIÓN 04: AUDITORÍA DE USUARIOS ---
    document.getElementById("fixUsers").onclick = async () => {
        log("AUDITANDO JERARQUÍAS DE ACCESO GLOBAL...", "warning");
        try {
            const snap = await getDocs(collection(db, "usuarios"));
            for (const d of snap.docs) {
                const data = d.data();
                if (!data.empresaId) {
                    await updateDoc(doc(db, "usuarios", d.id), { empresaId: "NEXUS_DEFAULT" });
                    log(`LINKING: Usuario ${d.id.substring(0,6)} -> Default...`);
                }
            }
            log("PROTOCOLO DE USUARIOS FINALIZADO.", "success");
            hablar("Auditoría de personal terminada.");
        } catch (e) { log(`FALLO EN NODO USUARIOS: ${e.message}`, "error"); }
    };
}
