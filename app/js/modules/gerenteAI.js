/**
 * 👑 gerenteAI.js - TallerPRO360 NEXUS-X V6.5 
 * EL CENTRO DE COMANDO ESTRATÉGICO: INTELIGENCIA PREDICTIVA Y DASHBOARDS LOOKER-ELITE
 * @author William Jeffry Urquijo Cubillos & Gemini AI
 * @version 6.5 - Arquitectura Gráfica Reactiva con Chart.js
 */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { hablar } from "../voice/voiceCore.js";

export default async function gerenteAI(container) {
    const empresaId = (localStorage.getItem("nexus_empresaId") || localStorage.getItem("empresaId") || "").trim();
    const nombreUsuario = localStorage.getItem("nexus_userName") || "Comandante";
    
    // Inicialización del Filtro Cronológico (Últimos 30 días por defecto)
    if (!localStorage.getItem("nexus_tmp_f_inicio")) {
        const hoy = new Date();
        const haceUnMes = new Date();
        haceUnMes.setDate(hoy.getDate() - 30);
        localStorage.setItem("nexus_tmp_f_inicio", haceUnMes.toISOString().split('T')[0]);
        localStorage.setItem("nexus_tmp_f_fin", hoy.toISOString().split('T')[0]);
    }

    let fechaInicioIso = localStorage.getItem("nexus_tmp_f_inicio");
    let fechaFinIso = localStorage.getItem("nexus_tmp_f_fin");
    let chartsInstanciados = {}; // Repositorio para destruir y recrear gráficas sin memory leaks

    // Asegurar la carga ultraligera de Chart.js desde CDN para entorno PWA Móvil
    const cargarChartJS = () => {
        return new Promise((resolve) => {
            if (window.Chart) return resolve();
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = () => resolve();
            document.head.appendChild(script);
        });
    };

    const renderLayout = () => {
        container.innerHTML = `
        <div class="p-4 lg:p-8 bg-[#010409] min-h-screen text-white animate-in fade-in duration-500 pb-40 font-sans">
            
            <header class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 border-l-4 border-cyan-500 pl-4 relative">
                <div>
                    <h1 class="orbitron text-3xl font-black italic tracking-tighter text-white uppercase">
                        STRATEGIC <span class="text-cyan-400">COMMAND CONTROL</span>
                    </h1>
                    <p class="text-[9px] orbitron tracking-[0.4em] text-slate-500 uppercase mt-1">
                        INTEGRACIÓN GLOBAL CONTABILIDAD & RENDIMIENTO // TALLERPRO360 V6.5
                    </p>
                </div>

                <div class="flex flex-wrap items-center gap-3 bg-[#0d1117] p-3 rounded-2xl border border-white/5 w-full xl:w-auto">
                    <input type="date" id="filtro-fecha-inicio" value="${fechaInicioIso}" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono focus:outline-none">
                    <input type="date" id="filtro-fecha-fin" value="${fechaFinIso}" class="bg-black text-white text-xs p-2 rounded-xl border border-white/10 font-mono focus:outline-none">
                    
                    <button id="btnFiltrarRango" class="px-4 py-2 bg-cyan-600 text-black text-[10px] orbitron font-black uppercase rounded-xl hover:bg-cyan-400 transition-all">
                        🚀 SINCRONIZAR PANALES
                    </button>

                    <button id="btnVozIA" class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black hover:bg-cyan-500 hover:text-white transition-all shadow-lg">
                        <i class="fas fa-brain text-sm"></i>
                    </button>
                </div>
            </header>

            <!-- Grid de Lienzos Gráficos Estilo Looker Studio (Optimizado para visualización móvil) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                <!-- KPI 1: FLUJO DE CAJA TEMPORAL (Líneas Cruzadas) -->
                <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 class="orbitron text-xs font-black text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                        📈 TENDENCIA DE FLUJO DE CAJA (INGRESO VS GASTO DIARIO)
                    </h3>
                    <div class="relative w-full h-64">
                        <canvas id="chartFlujoCaja"></canvas>
                    </div>
                </div>

                <!-- KPI 2: DISTRIBUCIÓN PUC DEL GASTO (Dona Ciberpunk) -->
                <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 class="orbitron text-xs font-black text-amber-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                        🍩 DISTRIBUCIÓN DE EGRESOS POR CUENTA PUC
                    </h3>
                    <div class="relative w-full h-64 flex justify-center">
                        <canvas id="chartEgresosPUC"></canvas>
                    </div>
                </div>

                <!-- KPI 3: EMBUDO DE EVACUACIÓN Y EFICIENCIA DE RAMPA (Barras Horizontales) -->
                <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 class="orbitron text-xs font-black text-emerald-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                        📊 EFICIENCIA EN PATIO Y RETENCIÓN EN RAMPA
                    </h3>
                    <div class="relative w-full h-64">
                        <canvas id="chartEficienciaRampa"></canvas>
                    </div>
                </div>

                <!-- KPI 4: ESCALABILIDAD FUTURA: ESTRUCTURA DE NÓMINA PASIVA VS RENDIMIENTO -->
                <div class="bg-[#0d1117] p-5 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 class="orbitron text-xs font-black text-indigo-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                        💎 PERFORMANCE Y APORTACIÓN POR MECÁNICO (BASE 30%)
                    </h3>
                    <div class="relative w-full h-64">
                        <canvas id="chartPerformanceMecanicos"></canvas>
                    </div>
                </div>

            </div>

            <!-- Panel Inferior de Insights Estratégicos Nexus AI -->
            <div id="contenedorMisionesGerenciales" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl font-mono text-xs text-slate-300">
                    <span class="text-cyan-400 font-bold block mb-1">🧠 NEXUS INSIGHT:</span>
                    <p id="insightFlujo">Procesando telemetría de flujos...</p>
                </div>
                <div class="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl font-mono text-xs text-slate-300">
                    <span class="text-amber-400 font-bold block mb-1">📦 VISIÓN DE STOCK:</span>
                    <p id="insightStock">Analizando rotación de bodegas aliadas...</p>
                </div>
                <div class="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl font-mono text-xs text-slate-300">
                    <span class="text-indigo-400 font-bold block mb-1">👔 ESCALABILIDAD FUTURA:</span>
                    <p id="insightNomina">Estructura lista para absorción de nómina formal.</p>
                </div>
            </div>

        </div>`;
    };

    const ejecutarDiagnosticoVisual = async () => {
        try {
            fechaInicioIso = document.getElementById("filtro-fecha-inicio").value;
            fechaFinIso = document.getElementById("filtro-fecha-fin").value;
            
            localStorage.setItem("nexus_tmp_f_inicio", fechaInicioIso);
            localStorage.setItem("nexus_tmp_f_fin", fechaFinIso);

            // 1. Extraer Órdenes de Trabajo e Inventarios en tiempo real
            const [snapOrdenes, snapInv] = await Promise.all([
                getDocs(query(collection(db, "ordenes"), where("empresaId", "==", empresaId))),
                getDocs(query(collection(db, "inventario"), where("empresaId", "==", empresaId)))
            ]);

            // 2. Sincronización Directa y Reactiva con el Libro Diario Abierto en contabilidad.js
            let datasetContableDiario = {};
            let rubrosPUC = { "613505 Compras Repuestos": 0, "5105 Nómina Operativa": 0, "5120 Arriendos/Servicios": 0, "Otros Egresos": 0 };
            
            if (window.NEXUS_ACCOUNTING_CONSOLIDATED) {
                Object.entries(window.NEXUS_ACCOUNTING_CONSOLIDATED).forEach(([periodo, data]) => {
                    // Mapeo detallado de cuentas PUC unificado
                    if (data.cuentas) {
                        Object.entries(data.cuentas).forEach(([cuenta, valor]) => {
                            if (cuenta.startsWith("613505")) rubrosPUC["613505 Compras Repuestos"] += valor;
                            else if (cuenta.startsWith("5105")) rubrosPUC["5105 Nómina Operativa"] += valor;
                            else if (cuenta.startsWith("5120")) rubrosPUC["5120 Arriendos/Servicios"] += valor;
                            else if (cuenta.startsWith("5")) rubrosPUC["Otros Egresos"] += valor;
                        });
                    }
                    
                    // Extraer comportamiento diario para la gráfica temporal de flujo
                    if (data.diario) {
                        Object.entries(data.diario).forEach(([dia, metrics]) => {
                            if (dia >= fechaInicioIso && dia <= fechaFinIso) {
                                if (!datasetContableDiario[dia]) datasetContableDiario[dia] = { ingresos: 0, gastos: 0 };
                                datasetContableDiario[dia].ingresos += (metrics.ingresos || 0);
                                datasetContableDiario[dia].gastos += (metrics.egresos || 0);
                            }
                        });
                    }
                });
            }

            // 3. Procesar Métricas Operativas de Rampa y Personal (reportes.js Core)
            let estadosRampa = { "INGRESO/PROCESO": 0, "FINALIZADO/LISTO": 0, "ENTREGADO": 0 };
            let rankingMecanicos = {};
            let rampaValTotal = 0;

            snapOrdenes.forEach(doc => {
                const ot = doc.data();
                const total = Number(String(ot.total || 0).replace(/[^0-9.-]/g, "")) || 0;
                const est = String(ot.estado || "").toUpperCase();
                const mec = ot.tecnico_asignado || "Mecánico por Asignar";

                if (['INGRESO', 'PROCESO', 'REPARACION'].includes(est)) {
                    estadosRampa["INGRESO/PROCESO"]++;
                    rampaValTotal += total;
                } else if (['LISTO', 'FINALIZADA'].includes(est)) {
                    estadosRampa["FINALIZADO/LISTO"]++;
                } else if (est === 'ENTREGADO') {
                    estadosRampa["ENTREGADO"]++;
                }

                // Estructurar el análisis de aportación y comisiones por operario para el futuro automatizado
                if (['LISTO', 'ENTREGADO', 'FINALIZADA'].includes(est)) {
                    if (!rankingMecanicos[mec]) rankingMecanicos[mec] = 0;
                    rankingMecanicos[mec] += total;
                }
            });

            let totalInvCosto = 0;
            snapInv.forEach(doc => {
                const it = doc.data();
                totalInvCosto += (Number(it.cantidad || 0) * Number(it.precioCosto || 0));
            });

            // Generar e Inyectar Gráficas Looker Studio Ciberpunk
            construirGraficasUI(datasetContableDiario, rubrosPUC, estadosRampa, rankingMecanicos);
            
            // Textualizar Insights Dinámicos de la Inteligencia de Negocio
            document.getElementById("insightFlujo").innerText = `El patio retiene $${rampaValTotal.toLocaleString('es-CO')} en rampa. Liberar estos carros acelerará el flujo de caja sin recurrir a pasivos.`;
            document.getElementById("insightStock").innerText = totalInvCosto > 0 
                ? `Bodega registra $${totalInvCosto.toLocaleString('es-CO')} inmovilizados. Los talleres aliados muestran baja rotación de stock actualmente.` 
                : `Operación Liviana en Inventarios: El taller no mantiene capital atrapado en stock pasivo; compras bajo demanda optimizadas por la 613505.`;

            document.getElementById("btnVozIA").onclick = () => {
                hablar(`Comandante ${nombreUsuario}. Los tableros analíticos están unificados. Rampa retiene ${Math.round(rampaValTotal)} pesos y los canales de compras de repuestos por la seis uno treinta y cinco cero cinco están siendo monitoreados bajo demanda.`);
            };

        } catch (e) {
            console.error("Fallo Crítico en el Render del Gerente Analítico:", e);
        }
    };

    const construirGraficasUI = (flujoDiario, egresosPUC, rampaData, mecanicosData) => {
        // Limpieza y Destrucción Segura de Instancias Previas para Evitar Superposiciones en Móviles
        Object.keys(chartsInstanciados).forEach(k => { if (chartsInstanciados[k]) chartsInstanciados[k].destroy(); });

        const opcionesComunes = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'monospace', size: 9 } } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 9 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 9 } } }
            }
        };

        // 📈 CHART 1: TENDENCIA DE FLUJO DE CAJA (Líneas)
        const diasLabels = Object.keys(flujoDiario).sort();
        chartsInstanciados.flujo = new Chart(document.getElementById('chartFlujoCaja'), {
            type: 'line',
            data: {
                labels: diasLabels.map(d => d.substring(5)), // Simplificar fecha a MM-DD
                datasets: [
                    { label: 'Ingresos', data: diasLabels.map(d => flujoDiario[d].ingresos), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 },
                    { label: 'Gastos', data: diasLabels.map(d => flujoDiario[d].gastos), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3 }
                ]
            },
            options: opcionesComunes
        });

        // 🍩 CHART 2: DISTRIBUCIÓN PUC (Dona)
        chartsInstanciados.puc = new Chart(document.getElementById('chartEgresosPUC'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(egresosPUC),
                datasets: [{
                    data: Object.values(egresosPUC),
                    backgroundColor: ['#f59e0b', '#6366f1', '#06b6d4', '#475569'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 9 } } } } }
        });

        // 📊 CHART 3: EFICIENCIA DE RAMPA (Barras Horizontales)
        chartsInstanciados.rampa = new Chart(document.getElementById('chartEficienciaRampa'), {
            type: 'bar',
            data: {
                labels: Object.keys(rampaData),
                datasets: [{ label: 'Vehículos', data: Object.values(rampaData), backgroundColor: '#06b6d4', borderRadius: 8 }]
            },
            options: { ...opcionesComunes, indexAxis: 'y' }
        });

        // 💎 CHART 4: PERFORMANCE DE COLABORADORES Y FUTURA NÓMINA (Barras Verticales)
        chartsInstanciados.mecanicos = new Chart(document.getElementById('chartPerformanceMecanicos'), {
            type: 'bar',
            data: {
                labels: Object.keys(mecanicosData).length ? Object.keys(mecanicosData) : ['Sin Órdenes del Periodo'],
                datasets: [{ label: 'Facturación Aportada ($)', data: Object.keys(mecanicosData).length ? Object.values(mecanicosData) : [0], backgroundColor: '#6366f1', borderRadius: 8 }]
            },
            options: opcionesComunes
        });
    };

    // Inicialización del Entorno
    renderLayout();
    await cargarChartJS();
    await ejecutarDiagnosticoVisual();

    document.getElementById("btnFiltrarRango").onclick = ejecutarDiagnosticoVisual;
}
