/**
 * dashboard.js 
 * 🔥 TallerPRO360 ULTRA V3 - Edición Estabilizada
 * Dashboard Modular + CEO Autónomo + Gráficos Neón
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { store } from "../core/store.js";

let charts = {};

/**
 * Punto de entrada principal
 */
export default async function dashboard(container, state) {
    // 1. Render inicial (Esqueleto Neón)
    renderBaseUI(container);

    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    if (!empresaId) return renderError(container, "❌ Identificador de empresa no encontrado");

    try {
        // 2. Carga inteligente (Prioriza Cache del Store para velocidad instantánea)
        if (store.cache.ordenes?.length > 0) {
            processAndRender(container, store.cache);
        }

        // 3. Sync en vivo con Firebase
        const [clientes, ordenes, inventario] = await Promise.all([
            getClientes(empresaId),
            getOrdenes(empresaId),
            getInventario(empresaId)
        ]);

        const freshData = { clientes, ordenes, inventario };
        processAndRender(container, freshData);

    } catch (e) {
        console.error("🔥 Error en Dashboard Core:", e);
        renderError(container, "⚠️ Error de conexión con los servicios de datos.");
    }
}

/**
 * Procesa la lógica de negocio y dispara el renderizado
 */
function processAndRender(container, rawData) {
    const processed = calculateMetrics(rawData);
    renderKPIs(processed);
    renderCharts(processed);
    renderCEO(processed);
}

/**
 * Lógica de negocio: Cálculos y KPI's
 */
function calculateMetrics(data) {
    const { clientes, ordenes, inventario } = data;
    
    let ingresos = 0, costos = 0, alertas = [];
    let ingresosPorDia = {};

    ordenes.forEach(o => {
        const total = Number(o.valorTrabajo || 0);
        const costo = Number(o.costoTotal || 0);
        ingresos += total;
        costos += costo;

        // Agrupación por fecha para el gráfico
        const fecha = o.creadoEn?.toDate?.().toISOString().split("T")[0] || "Sin Fecha";
        ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;

        if (total < costo && total > 0) {
            alertas.push({ msg: `Orden #${o.id.slice(-4)} con pérdida`, nivel: "alto" });
        }
    });

    inventario.forEach(item => {
        if (Number(item.cantidad) < 5) {
            alertas.push({ msg: `Stock bajo: ${item.nombre}`, nivel: "medio" });
        }
    });

    const utilidad = ingresos - costos;
    const margen = ingresos ? (utilidad / ingresos) * 100 : 0;

    return {
        ingresos, costos, utilidad, margen,
        totalClientes: clientes.length,
        totalOrdenes: ordenes.length,
        totalStock: inventario.length,
        ingresosPorDia,
        alertas,
        rawData
    };
}

/* ========================================================================
   RENDERERS (UI & CHARTS)
   ======================================================================== */

function renderBaseUI(container) {
    container.innerHTML = `
    <div style="padding:20px; background:#0a0f1a; min-height:100vh; font-family:'Segoe UI',Roboto,sans-serif;">
        <h1 style="font-size:32px; font-weight:900; color:#00ffff; margin-bottom:25px; text-shadow:0 0 15px #00ffff66;">
            🧠 DASHBOARD PRO360 <span style="font-size:14px; color:#facc15; text-shadow:none;">ULTRA V3</span>
        </h1>
        
        <div id="kpiGrid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:15px; margin-bottom:30px;">
            <div class="skeleton-kpi" style="height:100px; background:#0f172a; border-radius:12px; animate:pulse 2s infinite;"></div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; flex-wrap:wrap;">
            <div style="background:#0f172a; padding:20px; border-radius:15px; border:1px solid #1e293b; box-shadow:0 10px 30px #000;">
                <h3 style="color:#00ffff; margin-bottom:15px;">Flujo de Ingresos</h3>
                <canvas id="mainChart" style="max-height:350px;"></canvas>
            </div>
            
            <div id="ceoPanel"></div>
        </div>
    </div>`;
}

function renderKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const cards = [
        { lab: "Ingresos", val: m.ingresos, col: "#00ffff", cur: true },
        { lab: "Utilidad", val: m.utilidad, col: "#22c55e", cur: true },
        { lab: "Margen", val: m.margen.toFixed(1) + "%", col: "#facc15", cur: false },
        { lab: "Órdenes", val: m.totalOrdenes, col: "#00ffff", cur: false },
        { lab: "Clientes", val: m.totalClientes, col: "#a855f7", cur: false }
    ];

    grid.innerHTML = cards.map(c => `
        <div style="background:#0f172a; padding:18px; border-radius:12px; border:1px solid #1e293b; box-shadow:0 4px 20px ${c.col}22;">
            <p style="font-size:12px; color:#94a3b8; margin:0;">${c.lab}</p>
            <h2 style="color:${c.col}; font-size:24px; margin:5px 0 0 0;">
                ${c.cur ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(c.val) : c.val}
            </h2>
        </div>
    `).join("");
}

async function renderCharts(m) {
    const ChartLib = window.Chart;
    if (!ChartLib) return;

// En dashboard.js, dentro de renderCEO:
if (state.rolGlobal === 'superadmin') {
    panel.innerHTML += `
        <div style="margin-top:20px; border:1px solid #22c55e; padding:10px; background:#064e3b; border-radius:10px;">
            <p style="color:#22c55e; font-size:11px; font-weight:bold;">🛠️ CONSOLE AUTO-FIX (Superadmin)</p>
            <div id="aiConsole" style="font-family:monospace; font-size:10px; color:#fff;">
                > Esperando logs...
            </div>
            <button onclick="IA_AutoFixer.analizarYReparar('${state.empresaId}')" 
                    style="margin-top:10px; background:#22c55e; color:#000; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; width:100%; border-radius:5px;">
                FORZAR ESCANEO DE ERRORES
            </button>
        </div>
    `;
}

    const ctx = document.getElementById("mainChart").getContext("2d");
    if (charts.main) charts.main.destroy();

    const dates = Object.keys(m.ingresosPorDia).sort();
    const values = dates.map(d => m.ingresosPorDia[d]);

    charts.main = new ChartLib(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Ingresos Diarios',
                data: values,
                borderColor: '#00ffff',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#facc15'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderCEO(m) {
    const panel = document.getElementById("ceoPanel");
    
    const decisiones = [];
    if (m.margen < 20) decisiones.push("Subir precios de mano de obra");
    if (m.totalStock < 10) decisiones.push("Reponer stock de alta rotación");
    if (m.totalOrdenes > 0 && m.ingresos / m.totalOrdenes < 50000) decisiones.push("Promover servicios preventivos");

    panel.innerHTML = `
        <div style="background:linear-gradient(145deg, #0f172a, #1e293b); padding:20px; border-radius:15px; border:1px solid #00ffff44; height:100%;">
            <h3 style="color:#00ffff; display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">👑</span> CEO AUTÓNOMO
            </h3>
            
            <div style="margin-top:15px;">
                <p style="color:#facc15; font-size:13px; font-weight:bold;">⚠️ ALERTAS CRÍTICAS</p>
                ${m.alertas.length ? m.alertas.map(a => `<p style="font-size:12px; color:${a.nivel === 'alto' ? '#ef4444' : '#fbbf24'}; margin:4px 0;">• ${a.msg}</p>`).join("") : '<p style="color:#22c55e; font-size:12px;">Sistema saludable</p>'}
            </div>

            <div style="margin-top:20px;">
                <p style="color:#00ffff; font-size:13px; font-weight:bold;">🧠 SUGERENCIAS IA</p>
                ${decisiones.map(d => `
                    <div style="background:#0a0f1a; padding:10px; border-radius:8px; margin-top:8px; font-size:12px; border-left:3px solid #00ffff;">
                        ${d}
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function renderError(container, msg) {
    container.innerHTML = `<div style="text-align:center; padding:50px; color:#ef4444;">${msg}</div>`;
}
