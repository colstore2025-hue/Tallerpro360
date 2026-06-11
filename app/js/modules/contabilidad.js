/**
• 🏛️ contabilidad.js - NEXUS-X MASTER-CORE V23.5.0 [QUANTUM-SAP FORENSIC]
• Auditoría: Nivel Software Contable Real (SAP-Standard) - Cierre Mensual Avanzado
• UNIFICACIÓN: CRUD Operativo + Telemetría de Libros Manuales + Cierres Blindados
• Director de Proyecto: William Jeffry Urquijo Cubillos // Nexus AI 2026
• INTEGRACIÓN TOTAL: Sincronización en espejo con ordenes.js, finanzas_elite.js y dashboards.
*/
import {
collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { NEXUS_CONFIG } from "./nexus_constants.js";

// Cargador asíncrono seguro para el motor de reportes Excel
function cargarMotorExcel() {
return new Promise((resolve, reject) => {
if (window.XLSX) return resolve(window.XLSX);
const script = document.createElement('script');
script.src = "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.full.min.js";
script.onload = () => resolve(window.XLSX);
script.onerror = () => reject(new Error("Falla en el servidor de librerías XLSX"));
document.head.appendChild(script);
});
}

export default async function contabilidad(container) {
const empresaId = (localStorage.getItem("nexus_empresaId") || "").trim();
if (!empresaId) {
container.innerHTML = <div class="p-20 text-center text-red-500 orbitron"&gt;ERROR: SESIÓN DE TALLER NO IDENTIFICADA&lt;/div>;
return;
}

const userRole = localStorage.getItem("nexus_userRole") || "mecanico";
let vistaActual = "DIARIO";
let unsubscribe = null;
let registrosGlobales = [];
let estadosCierreMes = {};

// Matriz de Cuentas PUC Homologadas SAP
const CATEGORIAS_CONTABLES = [
{ id: "ingreso_ot", label: "4135 - VENTA SERVICIO / MANO DE OBRA", requierePlaca: true, tipo: 'INGRESO', puc: "4135", cuenta: "413505", naturaleza: "DEBITO" },
{ id: "venta_repuestos", label: "4135 - VENTA DE REPUESTOS", requierePlaca: true, tipo: 'INGRESO', puc: "4135", cuenta: "413510", naturaleza: "DEBITO" },
{ id: "cta_cobrar_repuesto", label: "1305 - CARTERA (POR COBRAR)", requierePlaca: true, tipo: 'ACTIVO', puc: "1305", cuenta: "130505", naturaleza: "DEBITO" },
{ id: "saneamiento_deuda", label: "1105 - PAGO RECIBIDO (SANEAMIENTO)", requierePlaca: true, tipo: 'INGRESO', puc: "1105", cuenta: "110505", naturaleza: "DEBITO" },
{ id: "anticipo_cliente", label: "2805 - ANTICIPOS RECIBIDOS", requierePlaca: true, tipo: 'INGRESO', puc: "2805", cuenta: "280505", naturaleza: "DEBITO" },
{ id: "gasto_operativo", label: "5195 - GASTOS DIVERSOS (OPERATIVOS)", requierePlaca: false, tipo: 'GASTO', puc: "5195", cuenta: "519595", naturaleza: "CREDITO" },
{ id: "compra_repuestos", label: "5195 - COMPRA INSUMOS / REPUESTOS", requierePlaca: false, tipo: 'GASTO', puc: "5195", cuenta: "519505", naturaleza: "CREDITO" },
{ id: "pago_nomina", label: "5105 - GASTOS DE PERSONAL (NÓMINA)", requierePlaca: false, tipo: 'GASTO', puc: "5105", cuenta: "510506", naturaleza: "CREDITO" },
{ id: "pago_servicios", label: "5135 - SERVICIOS PÚBLICOS", requierePlaca: false, tipo: 'GASTO', puc: "5135", cuenta: "513505", naturaleza: "CREDITO" },
{ id: "arrendamientos", label: "5120 - ARRENDAMIENTOS", requierePlaca: false, tipo: 'GASTO', puc: "5120", cuenta: "512005", naturaleza: "CREDITO" },
{ id: "inyeccion_capital", label: "3115 - APORTES DE CAPITAL", requierePlaca: false, tipo: 'INGRESO', puc: "3115", cuenta: "311505", naturaleza: "DEBITO" },
{ id: "ajuste_auditoria", label: "9999 - AJUSTE DE AUDITORÍA", requierePlaca: false, tipo: 'AJUSTE', puc: "9999", cuenta: "999999", naturaleza: "AJUSTE" }
];

// Clasificadores estrictos por código numérico PUC
const clasificarMovimiento = (m) => {
const pucStr = String(m.puc || "").trim();
if (pucStr.startsWith("41") || pucStr.startsWith("11") || pucStr.startsWith("28") || pucStr.startsWith("31")) return "INGRESO";
if (pucStr.startsWith("51") || pucStr.startsWith("52")) return "GASTO";
return "OTRO";
};

const extraerMonto = (data) => {
const raw = data.monto ?? data.total ?? data.valor ?? 0;
return typeof raw === 'number' ? raw : parseFloat(raw) || 0;
};

const esPeriodoBloqueado = (fechaString) => {
if (!fechaString) return false;
const periodo = fechaString.substring(0, 7);
return !!estadosCierreMes[periodo];
};

const cargarEstadosCierre = async () => {
try {
const q = query(collection(db, "cierres_mensuales"), where("empresaId", "==", empresaId));
const snap = await getDocs(q);
estadosCierreMes = {};
snap.forEach(doc => {
const data = doc.data();
if (data.estado === "CERRADO") {
estadosCierreMes[data.periodo] = doc.id;
}
});
} catch (e) {
console.error("❌ CRITICAL SAP ERROR [CIERRE_MAP]:", e);
}
};

// Helper centralizado para normalizar y filtrar por el rango del UI
const obtenerRegistrosFiltrados = () => {
const rInicio = document.getElementById("filtro-fecha-inicio")?.value || "2026-05-01";
const rFin = document.getElementById("filtro-fecha-fin")?.value || "2026-06-10";

const registrosNormalizados = registrosGlobales.map(m => {
let fechaAsignada = m.fecha_registro;
if (!fechaAsignada && m.creadoEn?.toDate) {
fechaAsignada = m.creadoEn.toDate().toISOString().split('T')[0];
} else if (!fechaAsignada) {
fechaAsignada = new Date().toISOString().split('T')[0];
}
return { ...m, fecha_registro: fechaAsignada };
});

return registrosNormalizados.filter(m => m.fecha_registro >= rInicio && m.fecha_registro <= rFin);
};

const exportarExcelSAP = async () => {
try {
Swal.fire({ title: 'Generando Reporte Estilo QUANTUM-SAP...', text: 'Estructurando balances y sumatorias...', didOpen: () => Swal.showLoading() });
const LibXLSX = await cargarMotorExcel();

const docsFiltrados = obtenerRegistrosFiltrados();

if (docsFiltrados.length === 0) {
Swal.close();
return Swal.fire("Aviso", "No se encontraron registros contables en el rango seleccionado.", "info");
}

docsFiltrados.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

let totalDebitosGbl = 0;
let totalCreditosGbl = 0;

const filasReporte = docsFiltrados.map(m => {
const monto = extraerMonto(m);
const nat = clasificarMovimiento(m);
const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
const codPUC = m.puc || catObj?.puc || "9999";

const debs = (nat === "INGRESO" || m.naturaleza === "DEBITO") ? monto : 0;
const creds = (nat === "GASTO" || m.naturaleza === "CREDITO") ? monto : 0;

totalDebitosGbl += debs;
totalCreditosGbl += creds;

return {
"FECHA REGISTRO": m.fecha_registro,
"PERÍODO": m.fecha_registro.substring(0, 7),
"CÓDIGO PUC": codPUC,
"CUENTA CONTABLE": m.cuenta || catObj?.cuenta || codPUC + "05",
"CONCEPTO / DETALLE": (m.concepto || "").toUpperCase(),
"PLACA ASOCIADA": (m.placa || "ADMIN").toUpperCase(),
"DÉBITO (+)": debs,
"CRÉDITO (-)": creds,
"ORIGEN / AUDITOR": m.creadoPor || "SISTEMA"
};
});

filasReporte.push({});
filasReporte.push({
"FECHA REGISTRO": "TOTALES CONTROL",
"CONCEPTO / DETALLE": "SUMATORIA ACUMULADA DEL PERIODO EXPORTADO",
"DÉBITO (+)": totalDebitosGbl,
"CRÉDITO (-)": totalCreditosGbl
});

const balanceNeto = totalDebitosGbl - totalCreditosGbl;
filasReporte.push({
"FECHA REGISTRO": "BALANCE NETO",
"CONCEPTO / DETALLE": "EJERCICIO DE UTILIDAD OPERACIONAL NETO",
"DÉBITO (+)": balanceNeto >= 0 ? balanceNeto : 0,
"CRÉDITO (-)": balanceNeto < 0 ? Math.abs(balanceNeto) : 0
});

const ws = LibXLSX.utils.json_to_sheet(filasReporte);
const wb = LibXLSX.utils.book_new();
LibXLSX.utils.book_append_sheet(wb, ws, "Libro_Auxiliar_Sincronizado");

ws['!cols'] = [{wch:16}, {wch:10}, {wch:12}, {wch:18}, {wch:40}, {wch:18}, {wch:15}, {wch:15}, {wch:16}];

LibXLSX.writeFile(wb, NEXUS_QUANTUM_SAP_REPORT_${empresaId}.xlsx`);
Swal.close();
} catch (e) {
console.error("🚀 QUANTUM_EXCEL_ENGINE_FAULT ->", e);
Swal.fire("Error SAP", "Falla de compilación en las matrices de Excel.", "error");
}
};

const renderLayout = async () => {
await cargarEstadosCierre();

const fInicioDefecto = "2026-04-01";
const fFinDefecto = "2026-06-10";

container.innerHTML = &lt;div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-700"&gt; &lt;header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-6 border-b border-white/10 pb-6"&gt; &lt;div class="text-center lg:text-left"&gt; &lt;h1 class="orbitron text-5xl font-black text-white italic tracking-tighter leading-none"&gt;FINANCE &lt;span class="text-cyan-400"&gt;NEXUS&lt;/span&gt;&lt;/h1&gt; &lt;p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-4"&gt;Taller Contable:${empresaId} // Consolidado de Cuentas PUC</p>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
 {renderDashCard("Gastos Operativos", "dash-gastos", "text-red-500")}
 {renderDashCard("Cartera Activa", "dash-pendiente", "text-cyan-400")}
</div>
</header>

<div id="puc-summary-bar" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-w-7xl mx-auto mb-8 bg-[#090d13] p-3 rounded-2xl border border-white/5 text-center">
<div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 4135 (Ventas)</span><p id="puc-4135" class="text-xs font-bold text-emerald-400">  0</p></div>
<div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 5105 (Nómina)</span><p id="puc-5105" class="text-xs font-bold text-orange-400">  0</p></div>
<div class="p-2"><span class="text-[8px] font-mono text-slate-400 block">PUC 1305 (Cartera)</span><p id="puc-1305" class="text-xs font-bold text-cyan-400">  0</p></div>
</div>

<div class="bg-[#0d1117] p-4 rounded-3xl border border-white/5 mb-8 flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto shadow-2xl">
<div class="flex items-center gap-3">
<div class="flex flex-col">
<label class="text-[7px] orbitron text-cyan-400 font-black mb-1">RANGO_INICIO</label>
<input type="date" id="filtro-fecha-inicio" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 outline-none focus:border-cyan-500 transition-all" value=" {fFinDefecto}">
</div>
<button id="btn-ejecutar-filtro" class="h-9 mt-4 px-4 bg-cyan-600 hover:bg-cyan-400 text-black text-[9px] orbitron font-black rounded-xl transition-all shadow-lg shadow-cyan-500/10">AUDITAR PERÍODO</button>
</div>

<div class="flex gap-2">
<button id="btn-vista-diario" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">LIBRO DIARIO</button>
<button id="btn-vista-puc" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all">ESTADOS Y AUDITORÍA</button>
<button id="btn-exportar" class="px-5 py-2.5 rounded-full orbitron text-[9px] font-black transition-all bg-gradient-to-r from-emerald-600 to-teal-500 text-black hover:scale-105 shadow-xl font-bold">EXPORTAR XLSX</button>
</div>
</div>

<div id="cont-dynamic-content"></div>
</div>`;

setupNavigation();
document.getElementById("btn-ejecutar-filtro").onclick = () => recalcularMecanicaContable();
escucharDatos();
};

function renderDashCard(label, id, color) {
return <div class="bg-[#0d1117] p-5 rounded-3xl border border-white/5 text-center shadow-2xl relative overflow-hidden group"&gt; &lt;div class="absolute inset-0 bg-gradient-to-br from-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-all"&gt;&lt;/div&gt; &lt;span class="text-[8px] orbitron ${color} block mb-1 uppercase font-black tracking-widest">${label}&lt;/span&gt; &lt;h2 id="${id}" class="text-xl font-black orbitron ${color}"&gt;$ 0</h2>
</div>`;
}

const setupNavigation = () => {
const btnD = document.getElementById("btn-vista-diario");
const btnP = document.getElementById("btn-vista-puc");
const btnE = document.getElementById("btn-exportar");
const active = "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20";

btnD.className = px-5 py-2.5 rounded-full orbitron text-[9px] font-black${vistaActual === 'DIARIO' ? active : 'text-slate-500 bg-white/5'}; btnP.className =px-5 py-2.5 rounded-full orbitron text-[9px] font-black ${vistaActual === 'CUENTAS' ? active : 'text-slate-500 bg-white/5'};

btnD.onclick = () => { vistaActual = "DIARIO"; moficarEstructuraVista(); };
btnP.onclick = () => { vistaActual = "CUENTAS"; moficarEstructuraVista(); };
btnE.onclick = exportarExcelSAP;
};

const moficarEstructuraVista = () => {
setupNavigation();
recalcularMecanicaContable();
};

const recalcularMecanicaContable = () => {
const filtrados = obtenerRegistrosFiltrados();

let tI = 0, tG = 0, tC = 0;
let p4135 = 0, p5195 = 0, p5105 = 0, p5120 = 0, p1305 = 0, p1105 = 0;

filtrados.forEach(m => {
const val = extraerMonto(m);
const nat = clasificarMovimiento(m);
const puc = String(m.puc || "").trim();

if (nat === "INGRESO") tI += val;
if (nat === "GASTO") tG += val;
if (puc.startsWith("1305")) tC += val;
if (puc.startsWith("1105") && m.tipo?.includes("saneamiento")) tC -= val;

if (puc.startsWith("4135")) p4135 += val;
if (puc.startsWith("5195")) p5195 += val;
if (puc.startsWith("5105")) p5105 += val;
if (puc.startsWith("5120")) p5120 += val;
if (puc.startsWith("1305")) p1305 += val;
if (puc.startsWith("1105")) p1105 += val;
});

actualizarDashboards(tI, tG, tC);

document.getElementById("puc-4135").innerText = $ $`{Math.round(p4135).toLocaleString('es-CO')}`; document.getElementById("puc-5195").innerText =$      ${Math.round(p1105).toLocaleString('es-CO')};

vistaActual === "DIARIO" ? cargarVistaDiaria() : cargarVistaCuentas();
};

const cargarVistaDiaria = () => {
const content = document.getElementById("cont-dynamic-content");
content.innerHTML = &lt;div class="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto"&gt; &lt;div class="lg:col-span-4"&gt; &lt;div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 sticky top-10 shadow-2xl space-y-4"&gt; &lt;h3 class="orbitron text-[10px] text-cyan-400 font-black tracking-widest uppercase border-b border-white/10 pb-2"&gt;Asiento Manual Real-Time&lt;/h3&gt; &lt;div class="space-y-4"&gt; &lt;input id="acc-fecha" type="date" class="w-full bg-black p-4 rounded-2xl border border-white/10 text-cyan-400 orbitron text-[10px]" value="${new Date().toISOString().split('T')[0]}">
<select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white orbitron text-[10px] uppercase">
latex
{CATEGORIAS_CONTABLES.map(c =&gt; `<option value="

{c.id}">${c.label}&lt;/option>).join('')}
</select>
<input id="acc-placa" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-center font-black orbitron text-lg focus:border-cyan-500 outline-none" placeholder="PLACA">

<div class="relative w-full">
<input type="file" id="quantum-camera-input" accept="image/*" capture="camera" class="hidden">
<button id="btn-activar-vision" type="button" class="w-full bg-gradient-to-r from-cyan-950 via-cyan-800 to-blue-950 text-cyan-400 font-black orbitron py-4 rounded-2xl hover:from-cyan-900 hover:to-blue-900 transition-all uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 border border-cyan-500/30">
<span class="animate-pulse text-cyan-400">●</span> ESCANEAR COMPROBANTE CON AI
</button>
</div>

<input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white uppercase text-sm focus:border-cyan-500 outline-none" placeholder="DESCRIPCIÓN / CONCEPTO">
<input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl focus:border-cyan-500 outline-none" placeholder="VALOR EN PESOS `$">
<button id="btnGuardar" class="w-full bg-emerald-500 text-black font-black orbitron py-5 rounded-2xl hover:bg-emerald-400 transition-all uppercase tracking-wider text-xs shadow-xl shadow-emerald-500/10">Inyectar Asiento SAP</button>
</div>
</div>
</div>
<div class="lg:col-span-8 space-y-8">
<div class="bg-[#0d1117] p-6 rounded-[2rem] border border-white/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
<div>
<h4 class="orbitron font-black text-xs text-amber-400 uppercase tracking-wider">Cierre Mensual & Control Blindado</h4>
<p class="text-[9px] text-slate-400 mt-1">Sella períodos fiscales para evitar alteraciones contables extemporáneas de usuarios.</p>
</div>
<button id="btn-ejecutar-cierre-ui" class="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-red-900 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-black orbitron text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-md">
Gestionar Cierres / Reversiones
</button>
</div>

<div id="listaFinanzasAgrupada" class="space-y-6 max-h-[85vh] overflow-y-auto pr-2 custom-scroll"></div>
</div>
</div>`;

document.getElementById("btnGuardar").onclick = registrarMovimiento;
document.getElementById("btn-ejecutar-cierre-ui").onclick = gestionarCierreMesModal;
conectarCapturaCamara();
renderizarListaAgrupada();
};

async function registrarMovimiento() {
const f = document.getElementById("acc-fecha").value;
if (!f) return Swal.fire("Error SAP", "Estipule una fecha contable válida.", "error");

if (esPeriodoBloqueado(f)) {
return Swal.fire({
title: "PERÍODO SELLADO",
text: El mes ${f.substring(0, 7)} ya cuenta con Cierre Contable definitivo.`,
icon: "error",
background: "#0d1117",
color: "#fff"
});
}

const selectedId = document.getElementById("acc-tipo").value;
const catObj = CATEGORIAS_CONTABLES.find(c => c.id === selectedId);

const payload = {
empresaId,
tipo: selectedId,
puc: catObj ? catObj.puc : "9999",
cuenta: catObj ? catObj.cuenta : "999999",
categoria: catObj ? catObj.tipo : "OTRO",
naturaleza: catObj ? catObj.naturaleza : "DEBITO",
placa: document.getElementById("acc-placa").value.trim().toUpperCase() || "ADMIN",
concepto: document.getElementById("acc-concepto").value.trim().toUpperCase(),
monto: parseFloat(document.getElementById("acc-monto").value),
creadoPor: userRole,
fecha_registro: f,
creadoEn: Timestamp.fromDate(new Date(f + "T12:00:00"))
};

if (!payload.concepto || isNaN(payload.monto)) return;
await addDoc(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), payload);
document.getElementById("acc-concepto").value = "";
document.getElementById("acc-monto").value = "";
Swal.fire({ title: "Asiento Sincronizado", icon: "success", toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
}

const renderizarListaAgrupada = () => {
const listContainer = document.getElementById("listaFinanzasAgrupada");
if (!listContainer) return;

const docsFiltrados = obtenerRegistrosFiltrados();

if (docsFiltrados.length === 0) {
listContainer.innerHTML = <div class="p-16 text-center text-slate-500 orbitron text-xs border border-dashed border-white/10 rounded-[2rem]"&gt;LIBRO AUXILIAR SIN REGISTROS EN ESTE RANGO TEMPORAL&lt;/div>;
return;
}

const mapaPeriodos = {};
docsFiltrados.forEach(m => {
const periodo = m.fecha_registro.substring(0, 7);
if (!mapaPeriodos[periodo]) mapaPeriodos[periodo] = [];
mapaPeriodos[periodo].push(m);
});

const periodosOrdenados = Object.keys(mapaPeriodos).sort((a, b) => a.localeCompare(b));
let htmlFinal = "";

periodosOrdenados.forEach(per => {
const transaccionesDelMes = mapaPeriodos[per];
transaccionesDelMes.sort((a, b) => a.fecha_registro.localeCompare(b.fecha_registro));

let totalDebitoMes = 0;
let totalCreditoMes = 0;

transaccionesDelMes.forEach(m => {
const val = extraerMonto(m);
const nat = clasificarMovimiento(m);
if (nat === "INGRESO" || m.naturaleza === "DEBITO") totalDebitoMes += val;
if (nat === "GASTO" || m.naturaleza === "CREDITO") totalCreditoMes += val;
});

const esMesCerrado = !!estadosCierreMes[per];

htmlFinal += &lt;div class="bg-[#0d1117] rounded-[2.5rem] border${esMesCerrado ? 'border-red-500/20 bg-gradient-to-b from-[#0d1117] to-red-950/10' : 'border-white/5'} p-6 shadow-xl space-y-4">
<div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
<div>
<span class="text-[7px] orbitron bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">PERÍODO FISCAL</span>
<h3 class="orbitron text-lg font-black text-white tracking-widest mt-1 uppercase flex items-center gap-2">
 {esMesCerrado ? '<span class="text-[8px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">🔒 CERRADO</span>' : '<span class="text-[8px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">🔓 ABIERTO</span>'}
</h3>
</div>
<div class="flex gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
<div class="text-right">
<span class="text-[7px] orbitron text-emerald-400 font-bold block uppercase">Débitos Período</span>
<span class="text-xs font-black orbitron text-emerald-400">latex
 

{totalDebitoMes.toLocaleString('es-CO')}</span>
</div>
<div class="w-[1px] bg-white/10"></div>
<div class="text-right">
<span class="text-[7px] orbitron text-red-400 font-bold block uppercase">Créditos Período</span>
<span class="text-xs font-black orbitron text-red-400">latex
 

{totalCreditoMes.toLocaleString('es-CO')}</span>
</div>
</div>
</div>

<div class="space-y-2">
$`{transaccionesDelMes.map(m => {
const val = extraerMonto(m);
const nat = clasificarMovimiento(m);
const catObj = CATEGORIAS_CONTABLES.find(c => c.id === m.tipo);
const esDeb = (nat === "INGRESO" || m.naturaleza === "DEBITO");

return &lt;div class="bg-black/30 p-4 rounded-xl flex justify-between items-center group hover:bg-black/60 border border-white/0 hover:border-white/5 transition-all"&gt; &lt;div class="flex items-center gap-3"&gt; &lt;div class="text-[9px] font-mono text-slate-500 bg-white/5 p-1.5 rounded text-center min-w-[45px]"&gt;${m.fecha_registro.substring(8, 10)}/ {m.concepto}</h5>
<p class="text-[8px] text-slate-500 uppercase orbitron mt-0.5">
PLACA: <span class="text-cyan-400 font-black"> {m.cuenta || catObj?.cuenta || '9999'}
</p>
</div>
</div>
<div class="flex items-center gap-4">
<div class="text-right">
<p class="text-xs font-black orbitron  {esDeb ? '+' : '-'} latex
 

{val.toLocaleString('es-CO')}
</p>
</div>
<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
<button onclick="window.nexusEditarRegistro(' {m.concepto}',  {m.placa}', ' {m.fecha_registro}')" class="h-6 w-6 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center text-[10px]">
<i class="fas fa-edit"></i>
</button>
<button onclick="window.nexusEliminarRegistro(' {m.concepto}', '${m.fecha_registro}')" class="h-6 w-6 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black transition-all flex items-center justify-center text-[10px]"&gt; &lt;i class="fas fa-trash-alt"&gt;&lt;/i&gt; &lt;/button&gt; &lt;/div&gt; &lt;/div&gt; &lt;/div>;
}).join("")}
</div>
</div>`;
});

listContainer.innerHTML = htmlFinal;
};

// --- INTEGRACIÓN FULL DE VENTANAS MODALES CRUD ---
window.nexusEditarRegistro = async (id, conceptoAct, montoAct, placaAct, tipoAct, fechaAct) => {
if (esPeriodoBloqueado(fechaAct)) {
return Swal.fire("Bloqueo SAP", "Este asiento pertenece a un período sellado y no puede alterarse.", "error");
}

const { value: formValues } = await Swal.fire({
title: '🏛️ REFORMA DE ASIENTO CONTABLE',
background: '#0d1117',
color: '#fff',
confirmButtonColor: '#06b6d4',
cancelButtonColor: '#64748b',
showCancelButton: true,
html: &lt;div class="space-y-3 font-sans text-left text-xs p-2"&gt; &lt;label class="block text-slate-400 orbitron font-black text-[9px] mb-1"&gt;FECHA CONTABLE:&lt;/label&gt; &lt;input id="swal-fecha" type="date" class="w-full bg-black p-3 rounded-xl border border-white/10 text-cyan-400 orbitron" value="${fechaAct}">
<label class="block text-slate-400 orbitron font-black text-[9px] mb-1">PLACA / REFERENCIA:</label>
<input id="swal-placa" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white uppercase orbitron" value=" {conceptoAct}">
<label class="block text-slate-400 orbitron font-black text-[9px] mb-1">VALOR EN PESOS ( {montoAct}">
<label class="block text-slate-400 orbitron font-black text-[9px] mb-1">CUENTA PUC ASOCIADA:</label>
<select id="swal-tipo" class="w-full bg-black p-3 rounded-xl border border-white/10 text-white text-xs">
latex
{CATEGORIAS_CONTABLES.map(c =&gt; `<option value="

{c.id}"  {c.label}</option>).join('')} &lt;/select&gt; &lt;/div&gt;,
focusConfirm: false,
preConfirm: () => {
const nuevaFecha = document.getElementById('swal-fecha').value;
if (!nuevaFecha) {
Swal.showValidationMessage('La fecha es un campo mandatorio');
return false;
}
const selId = document.getElementById('swal-tipo').value;
const cObj = CATEGORIAS_CONTABLES.find(c => c.id === selId);
return {
fecha_registro: nuevaFecha,
creadoEn: Timestamp.fromDate(new Date(nuevaFecha + "T12:00:00")),
placa: document.getElementById('swal-placa').value.trim().toUpperCase(),
concepto: document.getElementById('swal-concepto').value.trim().toUpperCase(),
monto: parseFloat(document.getElementById('swal-monto').value),
tipo: selId,
puc: cObj ? cObj.puc : "9999",
cuenta: cObj ? cObj.cuenta : "999999",
categoria: cObj ? cObj.tipo : "OTRO",
naturaleza: cObj ? cObj.naturaleza : "DEBITO"
}
}
});

if (formValues) {
if (!formValues.concepto || isNaN(formValues.monto)) return;
if (esPeriodoBloqueado(formValues.fecha_registro)) {
return Swal.fire("Operación Denegada", "La fecha de destino está bloqueada por cierre fiscal.", "error");
}

try {
await updateDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id), formValues);
Swal.fire({ title: 'Actualizado', text: 'Asiento modificado con éxito.', icon: 'success', background: '#0d1117', color: '#fff' });
} catch (err) {
Swal.fire('Error', 'Falla de transmisión asíncrona.', 'error');
}
}
};

window.nexusEliminarRegistro = async (id, concepto, fechaAct) => {
if (esPeriodoBloqueado(fechaAct)) {
return Swal.fire("Acción Denegada", "No se permite alterar periodos bloqueados.", "error");
}

const result = await Swal.fire({
title: '¿ELIMINAR REGISTRO CONTABLE?',
text: Asiento: ${concepto}`,
icon: 'warning',
showCancelButton: true,
confirmButtonColor: '#ef4444',
cancelButtonColor: '#64748b',
background: '#0d1117',
color: '#fff'
});

if (result.isConfirmed) {
try {
await deleteDoc(doc(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING, id));
Swal.fire({ title: 'Eliminado', icon: 'success', background: '#0d1117', color: '#fff' });
} catch (err) {
Swal.fire('Error', 'Falla operativa en la purga del documento.', 'error');
}
}
};

async function gestionarCierreMesModal() {
const hoy = new Date();
const periodoSugerido = ``${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')};

let htmlPeriodos = &lt;div class="p-2 font-sans text-xs text-left space-y-4"&gt; &lt;div class="bg-black/30 p-3 rounded-xl border border-white/5"&gt; &lt;label class="block text-slate-400 orbitron text-[8px] font-black uppercase mb-1"&gt;Período Fiscal a gestionar (YYYY-MM):&lt;/label&gt; &lt;input id="cierre-periodo-input" class="w-full bg-black p-3 rounded-lg border border-white/10 text-white font-bold orbitron text-center uppercase tracking-widest" value="${periodoSugerido}">
</div>
<div class="border-t border-white/10 pt-3">
<h5 class="orbitron font-black text-[9px] text-amber-400 uppercase mb-2">Estatus de Períodos en Memoria:</h5>
<div class="max-h-[150px] overflow-y-auto space-y-1 pr-1">
latex
{Object.keys(estadosCierreMes).length === 0 ? '&lt;p class="text-slate-500 italic"&gt;No hay cierres definitivos registrados.&lt;/p&gt;' : Object.keys(estadosCierreMes).sort().map(p =&gt; ` &lt;div class="flex justify-between items-center bg-red-950/20 border border-red-500/10 p-2 rounded-lg"&gt; &lt;span class="font-bold text-slate-200 orbitron tracking-wider"&gt;

{p}</span>
<span class="text-[7px] text-red-400 font-mono font-bold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">🔒 BLOQUEADO</span>
</div>
).join('')} &lt;/div&gt; &lt;/div&gt; &lt;/div&gt;;

Swal.fire({
title: '🛰️ CONTROLES FISCALES NEXUS-SAP',
background: '#0d1117',
color: '#fff',
html: htmlPeriodos,
showCancelButton: true,
showDenyButton: true,
confirmButtonColor: '#ef4444',
denyButtonColor: '#06b6d4',
cancelButtonColor: '#64748b',
confirmButtonText: '🔒 SELLAR MES',
denyButtonText: '🔓 REVERTIR CIERRE',
preConfirm: () => {
const per = document.getElementById("cierre-periodo-input").value.trim();
if (!/^\d{4}-\d{2}$`/.test(per)) {
Swal.showValidationMessage('Formato requerido: YYYY-MM');
return false;
}
return per;
}
}).then(async (result) => {
const per = result.value;
if (!per) return;

if (result.isConfirmed) {
if (estadosCierreMes[per]) return Swal.fire("Aviso SAP", "El período seleccionado ya se encuentra bloqueado.", "info");

await addDoc(collection(db, "cierres_mensuales"), {
empresaId,
periodo: per,
estado: "CERRADO",
fechaCierreSystem: new Date().toISOString(),
ejecutadoPor: userRole
});
Swal.fire("Cierre Aplicado", El período${per} ha sido bloqueado exitosamente.`, "success");
renderLayout();
} else if (result.isDenied) {
const docId = estadosCierreMes[per];
if (!docId) return Swal.fire("Error Operativo", "El período no registra bloqueos activos.", "error");

await deleteDoc(doc(db, "cierres_mensuales", docId));
Swal.fire("Libro Liberado", Se removió el candado de ${per}.`, "success");
renderLayout();
}
});
}

function conectarCapturaCamara() {
const btnVision = document.getElementById("btn-activar-vision");
const cameraInput = document.getElementById("quantum-camera-input");
if (!btnVision || !cameraInput) return;
btnVision.onclick = () => cameraInput.click();
cameraInput.onchange = async (e) => {
const archivo = e.target.files[0];
if (!archivo) return;
const reader = new FileReader();
reader.onloadend = () => {
window.dispatchEvent(new CustomEvent("SOLICITUD_ANALISIS_VISION", {
detail: { imagen: reader.result, modulo: "CONTABILIDAD", modo: "PROCESAMIENTO_COMPROBANTE" }
}));
};
reader.readAsDataURL(archivo);
};
}

// --- ESCUCHA REAL-TIME DE ALTA PRECISIÓN ---
function escucharDatos() {
if (unsubscribe) unsubscribe();
const q = query(collection(db, NEXUS_CONFIG.COLLECTIONS.ACCOUNTING), where("empresaId", "==", empresaId));

unsubscribe = onSnapshot(q, (snap) => {
registrosGlobales = snap.docs.map(d => ({ id: d.id, ...d.data() }));

// 🚀 DATA BRIDGE COMPLETO PARA finanzas_elite.js Y gerenteAI.js
const consolidadoMensualIE = {};
registrosGlobales.forEach(m => {
let f = m.fecha_registro || (m.creadoEn?.toDate ? m.creadoEn.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
const per = f.substring(0, 7);
const val = extraerMonto(m);
const nat = clasificarMovimiento(m);

if (!consolidadoMensualIE[per]) {
consolidadoMensualIE[per] = { ingresos: 0, gastos: 0, cartera: 0, cuentas: {} };
}

if (nat === "INGRESO") consolidadoMensualIE[per].ingresos += val;
if (nat === "GASTO") consolidadoMensualIE[per].gastos += val;

const puc = m.puc || "9999";
consolidadoMensualIE[per].cuentas[puc] = (consolidadoMensualIE[per].cuentas[puc] || 0) + val;
});

// Exposición en el espacio de ejecución global de la ventana
window.NEXUS_ACCOUNTING_CONSOLIDATED = consolidadoMensualIE;

recalcularMecanicaContable();
});
}

function actualizarDashboards(i, g, c) {
const ids = { "dash-ingresos": i, "dash-gastos": g, "dash-utilidad": i - g, "dash-pendiente": c };
Object.entries(ids).forEach(([id, val]) => {
const el = document.getElementById(id);
if (el) el.innerText = ``$ ${Math.round(val).toLocaleString('es-CO')};
});
}

async function cargarVistaCuentas() {
const content = document.getElementById("cont-dynamic-content");
const filtrados = obtenerRegistrosFiltrados();

let stats = { ing: 0, gas: 0, cart: 0, sane: 0 };
filtrados.forEach(d => {
const v = extraerMonto(d);
const n = clasificarMovimiento(d);
if (n === "INGRESO") stats.ing += v;
if (n === "GASTO") stats.gas += v;
if (d.puc === "1305") stats.cart += v;
if (d.puc === "1105" && d.tipo?.includes("saneamiento")) stats.sane += v;
});

content.innerHTML = &lt;div class="bg-[#0d1117] p-10 rounded-[3rem] border border-white/5 shadow-2xl text-center max-w-5xl mx-auto"&gt; &lt;h2 class="orbitron text-2xl text-amber-500 mb-2 font-black"&gt;Auditoría Balance General PUC (Rango Filtrado)&lt;/h2&gt; &lt;div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8"&gt;${renderStatCard("Flujo Bruto de Ingresos (Clase 4)", stats.ing, "text-emerald-400")}
 {renderStatCard("Cartera por Recuperar (Cuenta 1305)", stats.cart - stats.sane, "text-cyan-400")}
${renderStatCard("Utilidad del Ejercicio Contable", stats.ing - stats.gas, "text-amber-400")} &lt;/div&gt; &lt;/div>;
}

function renderStatCard(title, val, color) {
return <div class="p-8 bg-black/40 rounded-[2.5rem] border border-white/5"&gt; &lt;p class="text-[9px] orbitron${color} mb-2 uppercase font-black tracking-wider"> {color}">latex
 

{Math.round(val).toLocaleString('es-CO')}</span>
</div>`;
}

function traducirPeriodo(pString) {
const [ano, mes] = pString.split("-");
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
return ${meses[parseInt(mes) - 1]} ${ano};
}

await renderLayout();
}
