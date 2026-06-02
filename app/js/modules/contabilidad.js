/**
 * 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V22.1.0 [QUANTUM-SAP FORENSIC]
 * Auditoría: Nivel Software Contable Real (SAP-Standard) - Cierre Mensual Avanzado
 * UNIFICACIÓN: CRUD Operativo + Telemetría de Libros Manuales (Partida Doble)
 * Director: William Jeffry Urquijo Cubillos // Nexus AI 2026
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// --- MOTOR DE CARGA DE LIBRERÍAS EXTERNES (EXCEL) ---
function cargarMotorExcel() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const script = document.createElement('script');
        script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error("Falla en el servidor de librerías"));
        document.head.appendChild(script);
    });
}

export default async function contabilidad(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
    if (!empresaId) {
        container.innerHTML = `<div class="p-20 text-center text-red-500 orbitron">ERROR: SESIÓN DE TALLER NO IDENTIFICADA</div>`;
        return;
    }

    const userRole = localStorage.getItem("nexus_userRole") || "mecanico"; 
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // --- CONFIGURACIÓN DE CATEGORÍAS NIVEL SAP (PUC VIRTUAL COLOMBIA/USA) ---
    const CATEGORIAS_CONTABLES = [
        { id: "ingreso_ot", label: "4135 - VENTA SERVICIO / MANO DE OBRA", requierePlaca: true, tipo: 'INGRESO' },
        { id: "venta_repuestos", label: "4135 - VENTA DE REPUESTOS", requierePlaca: true, tipo: 'INGRESO' },
        { id: "cta_cobrar_repuesto", label: "1305 - CARTERA (POR COBRAR)", requierePlaca: true, tipo: 'ACTIVO' },
        { id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO)", requierePlaca: true, tipo: 'INGRESO' },
        { id: "anticipo_cliente", label: "2805 - ANTICIPOS RECIBIDOS", requierePlaca: true, tipo: 'INGRESO' },
        { id: "gasto_operativo", label: "5195 - GASTOS DIVERSOS (OPERATIVOS)", requierePlaca: false, tipo: 'GASTO' },
        { id: "compra_repuestos", label: "5195 - COMPRA INSUMOS / REPUESTOS", requierePlaca: false, tipo: 'GASTO' },
        { id: "pago_nomina", label: "5105 - GASTOS DE PERSONAL (NÓMINA)", requierePlaca: false, tipo: 'GASTO' },
        { id: "pago_servicios", label: "5135 - SERVICIOS PÚBLICOS", requierePlaca: false, tipo: 'GASTO' },
        { id: "arrendamientos", label: "5120 - ARRENDAMIENTOS", requierePlaca: false, tipo: 'GASTO' },
        { id: "inyeccion_capital", label: "3115 - APORTES DE CAPITAL", requierePlaca: false, tipo: 'INGRESO' },
        { id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA", requierePlaca: false, tipo: 'AJUSTE' }
    ];

    const clasificarMovimiento = (m) => {
        const t = (m.tipo || "").toLowerCase();
        if (t.includes("ingreso") || t.includes("4135") || t.includes("saneamiento") || t.includes("1105") || t.includes("capital") || t.includes("2805")) return "INGRESO";
        if (t.includes("gasto") || t.includes("51") || t.includes("nomina") || t.includes("arriendo") || t.includes("servicio") || t.includes("compra")) return "GASTO";
        return "OTRO";
    };

    const extraerMonto = (data) => {
        const raw = data.monto ?? data.total ?? data.valor ?? 0;
        return typeof raw === 'number' ? raw : parseFloat(raw) || 0;
    };

    // --- MOTOR DE EXPORTACIÓN (ESTABLE) ---
    const exportarExcelSAP = async () => {
        try {
            Swal.fire({ title: 'Sincronizando Excel Forense...', didOpen: () => Swal.showLoading() });
            const LibXLSX = await cargarMotorExcel();
            const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
            const snap = await getDocs(q);
            
            if (snap.empty) return Swal.fire("Aviso", "Sin datos para exportar", "info");

            const dataAudit = snap.docs.map(doc => {
                const m = doc.data();
                const monto = extraerMonto(m);
                const nat = clasificarMovimiento(m);
                const codPUC = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo)?.label.split(' - ')[0] || "9999";
                return {
                    "FECHA": m.creadoEn?.toDate ? m.creadoEn.toDate().toLocaleDateString() : 'N/A',
                    "COD PUC": codPUC,
                    "CONCEPTO": (m.concepto || "").toUpperCase(),
                    "PLACA": (m.placa || "ADMIN").toUpperCase().trim(),
                    "DEBITO (+)": nat === "INGRESO" ? monto : 0,
                    "CREDITO (-)": nat === "GASTO" ? monto : 0,
                    "AUDITOR": m.creadoPor || "SISTEMA"
                };
            });

            const ws = LibXLSX.utils.json_to_sheet(dataAudit);
            const wb = LibXLSX.utils.book_new();
            LibXLSX.utils.book_append_sheet(wb, ws, "LibroAuxiliar");
            LibXLSX.writeFile(wb, `NEXUS_REPORTE_FORENSE_${empresaId}.xlsx`);
            Swal.close();
        } catch (e) { Swal.fire("Error SAP", "Falla en motor Excel", "error"); }
    };

    // --- INTERFAZ UI ---
    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter leading-none">FINANCE <span class="text-cyan-400">NEXUS</span></h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4">Taller: ${empresaId} // Cierre Operativo Mayo</p>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    ${renderDashCard("Ingresos", "dash-ingresos", "text-emerald-400")}
                    ${renderDashCard("Gastos", "dash-gastos", "text-red-500")}
                    ${renderDashCard("Utilidad", "dash-utilidad", "text-amber-500")}
                    ${renderDashCard("Cartera", "dash-pendiente", "text-cyan-400")}
                </div>
            </header>
            <div class="flex flex-wrap justify-center gap-4 mb-12 bg-[#0d1117]/50 p-2 rounded-full border border-white/5 w-fit mx-auto shadow-2xl">
                <button id="btn-vista-diario" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
                <button id="btn-vista-puc" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
                <button id="btn-exportar" class="px-6 py-2 rounded-full orbitron text-[9px] font-black transition-all bg-emerald-600 text-black hover:bg-emerald-400">EXPORTAR XLSX</button>
            </div>
            <div id="cont-dynamic-content"></div>
        </div>`;
        setupNavigation();
        vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
    };

    function renderDashCard(label, id, color) {
        return `<div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl">
            <span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black tracking-widest">${label}</span>
            <h2 id="${id}" class="text-xl font-black orbitron ${color}">$ 0</h2>
        </div>`;
    }

    const setupNavigation = () => {
        const btnD = document.getElementById("btn-vista-diario");
        const btnP = document.getElementById("btn-vista-puc");
        const btnE = document.getElementById("btn-exportar");
        const active = "bg-cyan-500 text-black shadow-lg";

        btnD.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'DIARIO' ? active : 'text-slate-500'}`;
        btnP.className = `px-6 py-2 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : 'text-slate-500'}`;
        
        btnD.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnP.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
        btnE.onclick = exportarExcelSAP;
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 sticky top-10 shadow-2xl">
                    <div class="space-y-4">
                        <input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
                            ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                        </select>
                        <input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg" placeholder="PLACA">
                        
                        <div class="relative w-full">
                            <input type="file" id="quantum-camera-input" accept="image/*" capture="camera" class="hidden">
                            <button id="btn-activar-vision" type="button" class="w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl hover:from-cyan-900 hover:to-blue-900 transition-all uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                <span class="animate-pulse text-cyan-400">●</span> ESCANEAR LIBRO / RECIBO (AI)
                            </button>
                        </div>

                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm" placeholder="DESCRIPCIÓN">
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl" placeholder="VALOR $">
                        <button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-emerald-400 transition-all uppercase">Sincronizar Nexus-SAP</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-3 max-h-[75vh] overflow-y-auto pr-2 custom-scroll"></div>
            </div>
        </div>`;
        document.getElementById("btnGuardar").onclick = registrarMovimiento;
        conectarCapturaCamara();
        escucharDatos();
    };

    async function registrarMovimiento() {
        const f = document.getElementById("acc-fecha").value;
        const payload = {
            empresaId,
            tipo: document.getElementById("acc-tipo").value,
            placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
            concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
            monto: parseFloat(document.getElementById("acc-monto").value),
            creadoPor: userRole,
            creadoEn: f ? Timestamp.fromDate(new Date(f + "T12:00:00")) : serverTimestamp()
        };
        if (!payload.concepto || isNaN(payload.monto)) return;
        await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
    }

    function conectarCapturaCamara() {
        const btnVision = document.getElementById("btn-activar-vision");
        const cameraInput = document.getElementById("quantum-camera-input");
        if (!btnVision || !cameraInput) return;

        btnVision.onclick = () => cameraInput.click();

        cameraInput.onchange = async (event) => {
            const archivo = event.target.files[0];
            if (!archivo) return;

            btnVision.innerHTML = `<span class="animate-spin text-amber-400">⚡</span> DETECTANDO ASIENTOS...`;
            btnVision.className = "w-full bg-slate-900 text-amber-400 font-black orbitron py-4 rounded-2xl border border-amber-500/40 text-[10px] tracking-widest text-center animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.1)]";

            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Image = reader.result;
                    // Se despacha la señal al bus con flag de auditoría de cierre de libro manual
                    const eventoVision = new CustomEvent("SOLICITUD_ANALISIS_VISION", {
                        detail: { 
                            imagen: base64Image, 
                            modulo: "CONTABILIDAD",
                            modo: "CIERRE_MAYO_LIBRO"
                        }
                    });
                    window.dispatchEvent(eventoVision);
                };
                reader.readAsDataURL(archivo);
            } catch (error) {
                Swal.fire({ title: "ERROR OPTICAL_BUS", text: "Falla al procesar matriz en RAM.", icon: "error", background: "#05070a", color: "#fff" });
                btnVision.innerHTML = `<span class="animate-pulse text-cyan-300">●</span> ESCANEAR LIBRO / RECIBO (AI)`;
                btnVision.className = "w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl";
            }
        };
    }

    // --- PASARELA CRUD INTERACTIVA EN TIEMPO REAL ---
    window.nexusEditarRegistro = async (id, conceptoAct, montoAct, placaAct, tipoAct) => {
        const { value: formValues } = await Swal.fire({
            title: '🏛️ CORRECCIÓN DE ASIENTO CONTABLE',
            background: '#0d1117',
            color: '#fff',
            confirmButtonColor: '#06b6d4',
            cancelButtonColor: '#ef4444',
            showCancelButton: true,
            html: `
                <div class="space-y-3 font-sans text-left text-xs p-2">
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">PLACA O ÁREA:</label>
                    <input id="swal-placa" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase orbitron" value="${placaAct}">
                    
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">DESCRIPCIÓN DEL CONCEPTO:</label>
                    <input id="swal-concepto" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase" value="${conceptoAct}">
                    
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">VALOR ($):</label>
                    <input id="swal-monto" type="number" class="w-full bg-black p-3 rounded-xl border border-white/10 text-cyan-400 orbitron" value="${montoAct}">
                    
                    <label class="block text-slate-400 orbitron font-black text-[9px] mb-1">CUENTA PUC (NEXUS-SAP):</label>
                    <select id="swal-tipo" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white text-xs">
                        ${CATEGORIAS_CONTABLES.map(c => `<option value="${c.id}" ${c.id === tipoAct ? 'selected' : ''}>${c.label}</option>`).join('')}
                    </select>
                </div>
            `,
            focusConfirm: false,
            preConfirm: () => {
                return {
                    placa: document.getElementById('swal-placa').value.trim().toUpperCase(),
                    concepto: document.getElementById('swal-concepto').value.trim().toUpperCase(),
                    monto: parseFloat(document.getElementById('swal-monto').value),
                    tipo: document.getElementById('swal-tipo').value
                }
            }
        });

        if (formValues) {
            if (!formValues.concepto || isNaN(formValues.monto)) return;
            try {
                const docRef = doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id);
                await updateDoc(docRef, formValues);
                Swal.fire({ title: 'Éxito', text: 'Asiento contable auditado y corregido.', icon: 'success', background: '#0d1117', color: '#fff' });
            } catch (err) {
                Swal.fire('Error', 'No se pudo actualizar el documento.', 'error');
            }
        }
    };

    window.nexusEliminarRegistro = async (id, concepto) => {
        const result = await Swal.fire({
            title: '¿ELIMINAR ASIENTO CONTABLE?',
            text: `Esta acción alterará el EBITDA de la placa y los balances de cierre de mes. Registro: ${concepto}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'SÍ, BORRAR DE FIRESTORE',
            background: '#0d1117',
            color: '#fff'
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
                Swal.fire({ title: 'Eliminado', text: 'El registro fue removido del libro auxiliar.', icon: 'success', background: '#0d1117', color: '#fff' });
            } catch (err) {
                Swal.fire('Error', 'Falla al remover el documento.', 'error');
            }
        }
    };

    function escucharDatos() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0));
            let tI = 0, tG = 0, tC = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            if (docs.length === 0) {
                list.innerHTML = `<div class="p-10 text-center text-slate-500 orbitron text-xs">LIBRO DIARIO VACÍO - ESPERANDO TELEMETRÍA ÓPTICA</div>`;
                actualizarDashboards(0, 0, 0);
                return;
            }

            list.innerHTML = docs.map(m => {
                const val = extraerMonto(m);
                const n = clasificarMovimiento(m);
                if (n === "INGRESO") tI += val;
                if (n === "GASTO") tG += val;
                if (m.tipo?.includes("1305")) tC += val;
                if (m.tipo?.includes("1105")) tC -= val;

                const placaLimpia = (m.placa || "ADMIN").toUpperCase().trim();

                return `
                <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all shadow-xl">
                    <div class="flex gap-4 items-center">
                        <div class="w-1 h-10 rounded-full ${n === "INGRESO" ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}"></div>
                        <div>
                            <p class="text-[11px] font-black text-white leading-tight uppercase tracking-tight">${m.concepto}</p>
                            <p class="text-[8px] text-slate-400 orbitron uppercase mt-1">
                                <span class="text-cyan-400 font-black">${placaLimpia}</span> | ${CATEGORIAS_CONTABLES.find(c => c.id === m.tipo)?.label || m.tipo}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-right">
                            <p class="text-sm font-black orbitron ${n === "INGRESO" ? 'text-emerald-400' : 'text-red-500'}">$ ${val.toLocaleString('es-CO')}</p>
                            <p class="text-[7px] text-slate-600 font-bold orbitron mt-0.5">${m.creadoEn?.toDate ? m.creadoEn.toDate().toLocaleDateString() : '...'}</p>
                        </div>
                        
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onclick="window.nexusEditarRegistro('${m.id}', '${m.concepto}', ${val}, '${placaLimpia}', '${m.tipo}')" class="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center text-xs">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="window.nexusEliminarRegistro('${m.id}', '${m.concepto}')" class="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center text-xs">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join("");
            actualizarDashboards(tI, tG, tC);
        });
    }

    function actualizarDashboards(i, g, c) {
        const ids = { "dash-ingresos": i, "dash-gastos": g, "dash-utilidad": i - g, "dash-pendiente": c };
        Object.entries(ids).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = `$ ${val.toLocaleString('es-CO')}`;
        });
    }

    async function cargarVistaCuentas() {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `<div class="p-20 text-center orbitron text-cyan-500 animate-pulse italic">GENERANDO BALANCE ANALÍTICO NEXUS-SAP...</div>`;
        
        const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));
        const snap = await getDocs(q);
        
        let stats = { ing: 0, gas: 0, cart: 0, sane: 0 };
        snap.forEach(d => {
            const m = d.data();
            const v = extraerMonto(m);
            const n = clasificarMovimiento(m);
            const t = (m.tipo || "").toLowerCase();
            if (n === "INGRESO") stats.ing += v;
            if (n === "GASTO") stats.gas += v;
            if (t.includes("cta_cobrar") || t.includes("1305")) stats.cart += v;
            if (t.includes("saneamiento") || t.includes("1105")) stats.sane += v;
        });

        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in zoom-in duration-500 text-center">
            <h2 class="orbitron text-2xl text-amber-500 mb-10 font-black uppercase tracking-[0.3em]">Auditoría General Nexus-SAP</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                ${renderStatCard("Flujo Real de Ingresos (4135)", stats.ing, "text-emerald-400", "Ventas, Saneamientos y Aportes")}
                ${renderStatCard("Costo de Operación (5195)", stats.gas, "text-red-400", "Gastos, Nómina y Arriendos")}
                ${renderStatCard("Cuentas por Cobrar (1305)", stats.cart - stats.sane, "text-cyan-400", "Cartera Activa Pendiente")}
                ${renderStatCard("Utilidad del Ejercicio", stats.ing - stats.gas, "text-amber-400", "Balance de Caja Real")}
            </div>
        </div>`;
    }

    function renderStatCard(title, val, color, sub) {
        return `<div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner group hover:border-cyan-500/20 transition-all">
            <p class="text-[9px] orbitron ${color} mb-2 uppercase font-black tracking-widest">${title}</p>
            <span class="text-3xl font-black orbitron ${color}">$ ${val.toLocaleString()}</span>
            <p class="text-[7px] text-slate-600 mt-2 uppercase italic">${sub}</p>
        </div>`;
    }

    // =========================================================================
    // 🛰️ RECEPTOR DE TELEMETRÍA ÓPTICA AVANZADO (PROCESADOR MULTI-ASIENTO)
    // =========================================================================
    window.addEventListener("NEXUS_QUANTUM_VISION_BURST", async (e) => {
        const datosVision = e.detail;
        if (!datosVision) return;

        // CANAL 1: Recepción de Libro Contable de Antiguos (Mayo)
        if (datosVision.tipoDocumento === "LIBRO_MANUAL_CONTABLE" && Array.isArray(datosVision.asientos)) {
            Swal.fire({
                title: '🛰️ DETECTADO LIBRO MANUAL',
                text: `Se identificaron ${datosVision.asientos.length} asientos contables. ¿Proceder con la inyección masiva en lote a Firestore?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'INYECTAR LOTE',
                background: '#05070a',
                color: '#fff'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({ title: 'Procesando bloque contable...', didOpen: () => Swal.showLoading(), background: '#05070a', color: '#fff' });
                    
                    for (const asiento of datosVision.asientos) {
                        const esCredito = asiento.naturaleza === "CREDITO" || asiento.credito > 0;
                        const montoFinal = asiento.monto || (esCredito ? asiento.credito : asiento.debito) || 0;
                        
                        // Mapeo predictivo del PUC
                        let tipoSugerido = esCredito ? "compra_repuestos" : "ingreso_ot";
                        if (asiento.codigoPUC) {
                            if (asiento.codigoPUC.startsWith("51")) tipoSugerido = "gasto_operativo";
                            if (asiento.codigoPUC.startsWith("11") || asiento.codigoPUC.startsWith("41")) tipoSugerido = "ingreso_ot";
                        }

                        await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), {
                            empresaId,
                            tipo: tipoSugerido,
                            placa: (asiento.placa || "ADMIN").toUpperCase().trim(),
                            concepto: `CIERRE_MAYO_MANUAL: ${(asiento.concepto || "ASIENTO_OCR").toUpperCase()}`,
                            monto: Number(montoFinal),
                            creadoPor: "QUANTUM_VISION_AI",
                            creadoEn: serverTimestamp()
                        });
                    }
                    Swal.fire({ title: 'Lote Sincronizado', icon: 'success', background: '#05070a', color: '#fff' });
                    
                    // Restauración estética del hardware visual
                    const btnV = document.getElementById("btn-activar-vision");
                    if (btnV) {
                        btnV.innerHTML = `<span class="animate-pulse text-cyan-400">●</span> ESCANEAR LIBRO / RECIBO (AI)`;
                        btnV.className = "w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl";
                    }
                }
            });
            return;
        }

        // CANAL 2: Recepción de Facturas Estándar (Fallback)
        if (datosVision.tipoDocumento === "FACTURA_PROVEEDOR") {
            const selectTipo = document.getElementById("acc-tipo");
            if (selectTipo) selectTipo.value = "compra_repuestos";

            const inputMonto = document.getElementById("acc-monto");
            if (inputMonto && datosVision.monto > 0) inputMonto.value = datosVision.monto;

            const inputConcepto = document.getElementById("acc-concepto");
            if (inputConcepto) {
                const nitInfo = datosVision.nit ? ` | NIT: ${datosVision.nit}` : "";
                const refInfo = datosVision.referencia ? ` | REF: ${datosVision.referencia}` : "";
                inputConcepto.value = `COMPRA_INSUMOS_OCR${nitInfo}${refInfo}`;
            }

            const inputPlaca = document.getElementById("acc-placa");
            if (inputPlaca) inputPlaca.value = (datosVision.placa || "ADMIN").toUpperCase().trim();

            if (typeof hablar === 'function') hablar("Factura detectada de forma óptica. Datos cargados.");

            Swal.fire({
                title: '🛰️ CONT_NEXUS_LINK',
                text: `GASTO DETECTADO: $${datosVision.monto.toLocaleString()} | LISTO PARA SINCRONIZAR`,
                icon: 'success',
                background: '#05070a',
                color: '#fff',
                confirmButtonColor: '#06b6d4'
            });
            
            const btnV = document.getElementById("btn-activar-vision");
            if (btnV) {
                btnV.innerHTML = `<span class="animate-pulse text-cyan-400">●</span> ESCANEAR LIBRO / RECIBO (AI)`;
                btnV.className = "w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl";
            }
        }
    });

    renderLayout();
}
