/**
 * contabilidad.js - NEXUS-X FINANCIAL CORE V21.1 "ULTIMATUM" 🏛️
 * Sincronización Total: Órdenes -> Contabilidad -> Dashboard
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 */
import { 
    collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "../core/firebase-config.js";

export default async function contabilidad(container) {
    const empresaId = localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId");
    let vistaActual = "DIARIO"; 
    let unsubscribe = null;

    // --- 🟢 MAPEO DE COMPATIBILIDAD (EL PUENTE) ---
    // Esto asegura que si una OT envía 'nomina' o 'nomina_pago', ambos sumen al mismo lugar.
    const MAP_TIPOS = {
        ingresos: ['ingreso_ot', 'venta_repuesto', 'capital_inicial', 'capital'],
        gastos: ['gasto_operativo', 'gasto_insumos', 'nomina_pago', 'nomina', 'arrendamiento'],
        notas: ['nota_credito', 'garantia']
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-10 bg-[#010409] min-h-screen text-slate-100 font-sans pb-32 animate-in fade-in duration-500">
            <header class="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 border-b border-white/10 pb-10">
                <div class="text-center lg:text-left">
                    <h1 class="orbitron text-5xl font-black text-white italic tracking-tighter uppercase">
                        FINANCE <span class="text-amber-400">CORE</span><span class="text-cyan-500 text-xl">.V21.1</span>
                    </h1>
                    <p class="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] orbitron mt-2 italic">Automated Fiscal Intelligence System</p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-emerald-500/20 text-center shadow-lg">
                        <span class="text-[8px] orbitron text-emerald-400 block mb-1">TOTAL INGRESOS</span>
                        <h2 id="dash-ingresos" class="text-xl font-black orbitron text-white">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-red-500/20 text-center shadow-lg">
                        <span class="text-[8px] orbitron text-red-500 block mb-1">TOTAL GASTOS</span>
                        <h2 id="dash-gastos" class="text-xl font-black orbitron text-white">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-amber-500/20 text-center shadow-lg">
                        <span class="text-[8px] orbitron text-amber-500 block mb-1">UTILIDAD NETA</span>
                        <h2 id="dash-utilidad" class="text-xl font-black orbitron text-white">$ 0</h2>
                    </div>
                    <div class="bg-[#0d1117] p-5 rounded-3xl border border-cyan-500/20 text-center shadow-lg">
                        <span class="text-[8px] orbitron text-cyan-400 block mb-1">CAJA DISPONIBLE</span>
                        <h2 id="dash-caja" class="text-xl font-black orbitron text-white">$ 0</h2>
                    </div>
                </div>
            </header>

            <nav class="flex justify-center gap-4 mb-12">
                <button id="btn-vista-diario" class="px-8 py-3 rounded-full orbitron text-[10px] font-black border-2 transition-all"></button>
                <button id="btn-vista-puc" class="px-8 py-3 rounded-full orbitron text-[10px] font-black border-2 transition-all"></button>
            </nav>

            <div id="cont-dynamic-content" class="animate-in slide-in-from-bottom-5 duration-700"></div>
        </div>`;
        
        setupNavigation();
        if (vistaActual === "DIARIO") cargarVistaDiaria();
        else cargarVistaCuentas();
    };

    const setupNavigation = () => {
        const btnDiario = document.getElementById("btn-vista-diario");
        const btnPuc = document.getElementById("btn-vista-puc");
        btnDiario.innerText = "LIBRO DIARIO";
        btnPuc.innerText = "PLAN PUC / BALANCES";

        btnDiario.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black border-2 ${vistaActual === 'DIARIO' ? 'bg-amber-400 text-black border-amber-400' : 'border-white/10 text-slate-500 hover:border-white/30'}`;
        btnPuc.className = `px-8 py-3 rounded-full orbitron text-[10px] font-black border-2 ${vistaActual === 'CUENTAS' ? 'bg-amber-400 text-black border-amber-400' : 'border-white/10 text-slate-500 hover:border-white/30'}`;

        btnDiario.onclick = () => { vistaActual = "DIARIO"; renderLayout(); };
        btnPuc.onclick = () => { vistaActual = "CUENTAS"; renderLayout(); };
    };

    const cargarVistaDiaria = () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div class="lg:col-span-4">
                <div class="bg-[#0d1117] p-8 rounded-[3rem] border border-white/5 shadow-2xl sticky top-10">
                    <p class="orbitron text-[10px] text-amber-500 font-black mb-6 italic underline uppercase">Registro de Asiento Manual</p>
                    <div class="space-y-5">
                        <input id="acc-concepto" class="w-full bg-black p-5 rounded-2xl border border-white/10 outline-none focus:border-amber-500 font-bold uppercase text-sm" placeholder="DESCRIPCIÓN DEL MOVIMIENTO">
                        <select id="acc-tipo" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-amber-400 font-black orbitron text-[10px]">
                            <optgroup label="INGRESOS (4)">
                                <option value="ingreso_ot">4135 - SERVICIOS MECÁNICOS (OT)</option>
                                <option value="venta_repuesto">413505 - VENTA REPUESTOS</option>
                            </optgroup>
                            <optgroup label="EGRESOS (5)">
                                <option value="gasto_operativo">5195 - GASTOS DIVERSOS</option>
                                <option value="nomina_pago">5105 - PAGO TÉCNICOS/NÓMINA</option>
                                <option value="nota_credito">5305 - NOTA CRÉDITO/GARANTÍA</option>
                            </optgroup>
                            <optgroup label="ACTIVOS (1)">
                                <option value="capital_inicial">1105 - APORTE CAPITAL/CAJA</option>
                            </optgroup>
                        </select>
                        <input id="acc-monto" type="number" class="w-full bg-black p-5 rounded-2xl border border-white/10 text-white font-black orbitron text-xl focus:border-amber-500" placeholder="0.00">
                        <button id="btnGuardarFinanza" class="w-full bg-amber-400 text-black font-black orbitron py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase">SINCRONIZAR LIBRO</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-8">
                <div id="listaFinanzas" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"></div>
            </div>
        </div>`;

        document.getElementById("btnGuardarFinanza").onclick = registrarMovimiento;
        escucharContabilidad();
    };

    function escucharContabilidad() {
        if (unsubscribe) unsubscribe();
        const q = query(collection(db, "contabilidad"), where("empresaId", "==", empresaId), orderBy("creadoEn", "desc"));

        unsubscribe = onSnapshot(q, (snap) => {
            let totalIngresos = 0, totalGastos = 0, totalNotas = 0;
            const list = document.getElementById("listaFinanzas");
            if (!list) return;

            if (snap.empty) {
                list.innerHTML = `<div class="text-center p-20 opacity-20 orbitron italic text-xs">NO SE DETECTAN MOVIMIENTOS EN EL LIBRO ACTUAL</div>`;
                return;
            }

            list.innerHTML = snap.docs.map(docSnap => {
                const m = docSnap.data();
                const v = parseFloat(m.monto || 0);
                
                // Lógica de compatibilidad cruzada V20 vs V21
                const esIngreso = MAP_TIPOS.ingresos.includes(m.tipo);
                const esNota = MAP_TIPOS.notas.includes(m.tipo);
                const esGasto = MAP_TIPOS.gastos.includes(m.tipo);

                if (esNota) totalNotas += v;
                else if (esIngreso) totalIngresos += v;
                else if (esGasto) totalGastos += v;

                const estilo = obtenerEstiloFinanciero(m.tipo);
                return `
                <div class="bg-[#0d1117] p-6 rounded-[2.5rem] border border-white/5 flex justify-between items-center hover:border-amber-400/50 transition-all group">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-2xl ${estilo.bg} flex items-center justify-center border ${estilo.border} group-hover:scale-110 transition-transform">
                            <i class="${estilo.icon} ${estilo.text}"></i>
                        </div>
                        <div>
                            <p class="text-xs font-black text-white uppercase tracking-tight">${m.concepto}</p>
                            <p class="text-[8px] text-slate-500 orbitron">${m.creadoEn?.toDate().toLocaleString() || 'SINCRONIZANDO...'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-black orbitron ${estilo.text}">${esIngreso ? '+' : '-'} $${v.toLocaleString()}</p>
                        <p class="text-[7px] text-slate-600 orbitron uppercase font-black">${m.tipo}</p>
                    </div>
                </div>`;
            }).join("");

            // Actualización de Headers
            const utilidad = totalIngresos - totalGastos - totalNotas;
            document.getElementById("dash-ingresos").innerText = `$ ${totalIngresos.toLocaleString()}`;
            document.getElementById("dash-gastos").innerText = `$ ${totalGastos.toLocaleString()}`;
            document.getElementById("dash-utilidad").innerText = `$ ${utilidad.toLocaleString()}`;
            document.getElementById("dash-caja").innerText = `$ ${utilidad.toLocaleString()}`; // Simplificado para balance
            
            // Colores dinámicos para utilidad
            document.getElementById("dash-utilidad").className = `text-xl font-black orbitron ${utilidad >= 0 ? 'text-emerald-400' : 'text-red-500'}`;
        });
    }

    const cargarVistaCuentas = async () => {
        const content = document.getElementById("cont-dynamic-content");
        content.innerHTML = `
        <div class="bg-[#0d1117] p-10 rounded-[4rem] border border-white/5 shadow-3xl animate-in fade-in zoom-in-95 duration-500">
            <h3 class="orbitron text-xl font-black mb-10 text-amber-400 italic">BALANCE POR CUENTAS PUC (OFICIAL)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="p-8 bg-black/40 rounded-[3rem] border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                    <p class="text-[10px] orbitron font-black text-emerald-400 mb-6">CLASE 4 - INGRESOS</p>
                    <div class="space-y-4" id="puc-clase-4"></div>
                </div>
                <div class="p-8 bg-black/40 rounded-[3rem] border border-red-500/10 hover:border-red-500/30 transition-all">
                    <p class="text-[10px] orbitron font-black text-red-500 mb-6">CLASE 5 - GASTOS</p>
                    <div class="space-y-4" id="puc-clase-5"></div>
                </div>
                <div class="p-8 bg-black/40 rounded-[3rem] border border-amber-500/10 hover:border-amber-500/30 transition-all">
                    <p class="text-[10px] orbitron font-black text-amber-500 mb-6">CLASE 1 - ACTIVOS</p>
                    <div class="space-y-4" id="puc-clase-1"></div>
                </div>
            </div>
        </div>`;
        calcularPUCReal();
    };

    const calcularPUCReal = async () => {
        const snap = await getDocs(query(collection(db, "contabilidad"), where("empresaId", "==", empresaId)));
        // Consolidación de cuentas PUC
        const p = { '4135': 0, '413505': 0, '5105': 0, '5195': 0, '5305': 0, '1105': 0 };

        snap.forEach(d => {
            const m = d.data();
            const val = parseFloat(m.monto || 0);
            
            // Mapeo Inteligente (Suma versiones V20 y V21 al mismo código PUC)
            if(['ingreso_ot'].includes(m.tipo)) p['4135'] += val;
            if(['venta_repuesto'].includes(m.tipo)) p['413505'] += val;
            if(['nomina_pago', 'nomina'].includes(m.tipo)) p['5105'] += val;
            if(['gasto_operativo', 'gasto_insumos', 'arrendamiento'].includes(m.tipo)) p['5195'] += val;
            if(['nota_credito', 'garantia'].includes(m.tipo)) p['5305'] += val;
            if(['capital_inicial', 'capital'].includes(m.tipo)) p['1105'] += val;
        });

        const renderCuenta = (cod, nom, val) => `
            <div class="flex justify-between border-b border-white/5 pb-2">
                <span class="text-[10px] text-slate-400 font-mono tracking-tighter">${cod} - ${nom}</span>
                <span class="text-xs font-black text-white">$ ${val.toLocaleString()}</span>
            </div>`;

        document.getElementById("puc-clase-4").innerHTML = renderCuenta('4135', 'Servicios OT', p['4135']) + renderCuenta('413505', 'Repuestos', p['413505']);
        document.getElementById("puc-clase-5").innerHTML = renderCuenta('5105', 'Nómina/Personal', p['5105']) + renderCuenta('5195', 'Diversos/Op', p['5195']) + renderCuenta('5305', 'Garantías', p['5305']);
        document.getElementById("puc-clase-1").innerHTML = renderCuenta('1105', 'Caja General', p['1105']);
    };

    const obtenerEstiloFinanciero = (tipo) => {
        const estilos = {
            ingreso_ot: { icon: 'fas fa-file-invoice-dollar', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            venta_repuesto: { icon: 'fas fa-gears', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            gasto_operativo: { icon: 'fas fa-receipt', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            gasto_insumos: { icon: 'fas fa-tools', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            nomina_pago: { icon: 'fas fa-id-card-clip', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            nomina: { icon: 'fas fa-user-tie', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            nota_credito: { icon: 'fas fa-rotate-left', text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            capital_inicial: { icon: 'fas fa-vault', text: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
            capital: { icon: 'fas fa-vault', text: 'text-white', bg: 'bg-white/10', border: 'border-white/20' }
        };
        return estilos[tipo] || estilos.gasto_operativo;
    };

    async function registrarMovimiento() {
        const concepto = document.getElementById("acc-concepto").value.toUpperCase();
        const tipo = document.getElementById("acc-tipo").value;
        const monto = parseFloat(document.getElementById("acc-monto").value);

        if (!concepto || isNaN(monto) || monto <= 0) {
            Swal.fire({ icon: 'warning', title: 'DATOS INCOMPLETOS', background: '#0d1117', color: '#fff' });
            return;
        }

        await addDoc(collection(db, "contabilidad"), {
            empresaId, concepto, tipo, monto, creadoEn: serverTimestamp()
        });

        document.getElementById("acc-concepto").value = "";
        document.getElementById("acc-monto").value = "";
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'ASIENTO REGISTRADO', showConfirmButton: false, timer: 1500, background: '#0d1117', color: '#fff' });
    }

    renderLayout();
}
