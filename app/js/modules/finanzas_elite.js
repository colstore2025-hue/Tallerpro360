/**
 * finanzas_elite.js - TallerPRO360 NEXUS-X V17.0 💹
 * Motor de Inteligencia Predictiva: Flujo de Caja & Auditoría Real-Time
 * @author William Jeffry Urquijo Cubillos
 */
import { 
    collection, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";

export default async function finanzas(container, state) {
    const empresaId = localStorage.getItem("nexus_empresaId");
    let unsubscribe = null;
    let datosGlobales = { facturado: 0, enRampa: 0, fugado: 0, lista: [] };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-40">
            
            <header class="flex justify-between items-center mb-12 px-4">
                <div>
                    <h1 class="orbitron text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                        CASH <span class="text-cyan-400">FLOW</span>
                    </h1>
                    <p class="text-[8px] text-slate-500 font-black uppercase tracking-[0.5em] orbitron mt-3">Nexus-X Predictive Engine</p>
                </div>
                <button id="btnExportarPDF" class="group w-16 h-16 bg-slate-900 rounded-[2rem] border border-white/5 flex items-center justify-center shadow-2xl hover:border-cyan-500/50 transition-all">
                    <i class="fas fa-file-pdf text-cyan-400 text-xl group-hover:scale-110 transition-transform"></i>
                </button>
            </header>

            <div class="bg-gradient-to-br from-slate-900 to-black p-10 rounded-[4rem] border border-white/5 shadow-2xl mb-10 relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full"></div>
                
                <h4 class="text-[9px] font-black uppercase text-slate-500 tracking-[0.4em] orbitron mb-4">Utilidad Bruta Mes Actual</h4>
                <div id="txtProyeccion" class="text-6xl font-black tracking-tighter text-white orbitron tabular-nums">$ 0</div>
                
                <div class="mt-10 space-y-4">
                    <div class="flex justify-between items-end text-[9px] font-black text-slate-500 uppercase orbitron tracking-widest">
                        <span>Punto de Equilibrio</span>
                        <span id="txtMeta" class="text-cyan-400 text-[11px]">$ 15'000.000</span>
                    </div>
                    <div class="h-5 bg-black/60 rounded-full p-1.5 border border-white/5 shadow-inner">
                        <div id="barProgreso" class="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(6,182,212,0.4)]" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div class="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 flex items-center gap-6 group hover:border-amber-500/30 transition-all">
                    <div class="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                        <i class="fas fa-clock text-amber-500"></i>
                    </div>
                    <div>
                        <span class="text-[8px] text-slate-500 font-black uppercase orbitron tracking-widest block mb-1">Dinero en Rampa</span>
                        <div id="kpiAbierto" class="text-2xl font-black text-white orbitron tabular-nums">$ 0</div>
                    </div>
                </div>

                <div class="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 flex items-center gap-6 group hover:border-red-500/30 transition-all">
                    <div class="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                        <i class="fas fa-exclamation-triangle text-red-500"></i>
                    </div>
                    <div>
                        <span class="text-[8px] text-slate-500 font-black uppercase orbitron tracking-widest block mb-1">Fuga por Cancelación</span>
                        <div id="kpiFuga" class="text-2xl font-black text-red-400 orbitron tabular-nums">$ 0</div>
                    </div>
                </div>
            </div>

            <div id="boxRecomendacion" class="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-[3.5rem] flex items-start gap-6 mb-12 animate-pulse">
                <div class="w-12 h-12 bg-cyan-500 rounded-2xl flex-shrink-0 flex items-center justify-center text-black shadow-lg">
                    <i class="fas fa-brain"></i>
                </div>
                <div>
                    <h5 class="text-[10px] font-black uppercase text-cyan-400 mb-2 orbitron tracking-widest">Nexus-X Advisor</h5>
                    <p id="txtConsejo" class="text-[12px] text-slate-300 leading-relaxed font-medium">Analizando telemetría financiera...</p>
                </div>
            </div>
        </div>
        `;

        document.getElementById("btnExportarPDF").onclick = () => exportarAuditoria(datosGlobales);
        escucharFinanzas();
    };

    function escucharFinanzas() {
        if (unsubscribe) unsubscribe();

        // CONSULTA RAÍZ A ÓRDENES PARA CALCULAR FLUJO
        const q = query(
            collection(db, "ordenes"),
            where("empresaId", "==", empresaId)
        );

        unsubscribe = onSnapshot(q, (snap) => {
            const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const facturado = ordenes
                .filter(o => o.estado === 'LISTO' || o.estado === 'FINALIZADO')
                .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

            const enRampa = ordenes
                .filter(o => ['EN_TALLER', 'DIAGNOSTICO', 'REPARACION'].includes(o.estado))
                .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

            const fugado = ordenes
                .filter(o => o.estado === 'CANCELADO')
                .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

            // Guardar para reporte
            datosGlobales = { facturado, enRampa, fugado, lista: ordenes };

            actualizarUI(facturado, enRampa, fugado);
        });
    }

    function actualizarUI(f, r, fug) {
        const meta = 15000000;
        const porcentaje = Math.min(100, (f / meta) * 100);

        document.getElementById("txtProyeccion").innerText = `$ ${f.toLocaleString()}`;
        document.getElementById("kpiAbierto").innerText = `$ ${r.toLocaleString()}`;
        document.getElementById("kpiFuga").innerText = `$ ${fug.toLocaleString()}`;
        
        // Animación de barra
        const barra = document.getElementById("barProgreso");
        if(barra) barra.style.width = `${porcentaje}%`;

        // Inteligencia Nexus
        const consejo = document.getElementById("txtConsejo");
        if (fug > (f * 0.25)) {
            consejo.innerText = "ALERTA DE FUGA: Las cancelaciones superan el 25% de tu facturación. Revisa la calidad de tus diagnósticos o precios.";
            consejo.parentElement.parentElement.className = "bg-red-500/10 border border-red-500/20 p-8 rounded-[3.5rem] flex items-start gap-6 mb-12";
        } else if (r > f) {
            consejo.innerText = "CUELLO DE BOTELLA: Tienes más capital estancado en reparaciones que facturado. Necesitas agilizar las salidas del taller.";
            consejo.parentElement.parentElement.className = "bg-amber-500/10 border border-amber-500/20 p-8 rounded-[3.5rem] flex items-start gap-6 mb-12";
        } else {
            consejo.innerText = "SISTEMA NOMINAL: El flujo de caja es saludable. Estás convirtiendo misiones de forma eficiente.";
            consejo.parentElement.parentElement.className = "bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-[3.5rem] flex items-start gap-6 mb-12";
        }
    }

    async function exportarAuditoria(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString();

        // Cabecera Elite
        doc.setFillColor(5, 10, 20);
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(6, 182, 212);
        doc.setFontSize(24);
        doc.text("NEXUS-X FINANCIAL REPORT", 15, 30);
        
        doc.setTextColor(150);
        doc.setFontSize(9);
        doc.text(`AUDITORÍA DE CIERRE - FECHA: ${fecha}`, 15, 60);
        doc.text(`IDENTIFICADOR DE EMPRESA: ${empresaId}`, 15, 65);

        // Bloque de KPIs
        doc.setFillColor(240, 240, 240);
        doc.rect(15, 75, 180, 30, 'F');
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`TOTAL FACTURADO: $${data.facturado.toLocaleString()}`, 20, 85);
        doc.text(`DINERO EN RAMPA: $${data.enRampa.toLocaleString()}`, 20, 92);
        doc.setTextColor(200, 0, 0);
        doc.text(`CAPITAL FUGADO: $${data.fugado.toLocaleString()}`, 20, 99);

        // Tabla de Despliegues
        const rows = data.lista.map(o => [
            o.placa || 'N/A', 
            o.cliente?.substring(0,15) || 'N/A', 
            o.estado, 
            `$${Number(o.total || 0).toLocaleString()}`
        ]);

        doc.autoTable({
            startY: 115,
            head: [['PLACA', 'COMANDANTE', 'ESTADO', 'VALOR']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [6, 182, 212], font: 'helvetica' }
        });

        doc.save(`Auditoria_Nexus_${empresaId}_${fecha}.pdf`);
    }

    renderLayout();
}
