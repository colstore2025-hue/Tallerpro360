/**
 * dashboard.js 
 * 🔥 TallerPRO360 ULTRA V3 - Edición Estabilizada
 * Integrated: AI Gerente + Self-Healing Core + KPIs Neón
 */

import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { AI_Engine } from "../ai/aiAutonomousFlow.js";
import { store } from "../core/store.js";

let charts = {};

/**
 * Punto de entrada principal
 */
export default async function dashboard(container, state) {
    // 1. Render inicial de la estructura
    renderBaseUI(container);

    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    if (!empresaId) return renderError(container, "❌ Identificador de empresa no encontrado");

    try {
        // 2. Carga instantánea desde el Store (UX Speed)
        if (store.cache.ordenes?.length > 0) {
            await processAndRender(container, store.cache, state);
        }

        // 3. Sincronización en vivo con Firebase
        const [clientes, ordenes, inventario] = await Promise.all([
            getClientes(empresaId),
            getOrdenes(empresaId),
            getInventario(empresaId)
        ]);

        const freshData = { clientes, ordenes, inventario };
        
        // Actualizar caché del store
        store.cache = freshData; 

        await processAndRender(container, freshData, state);

    } catch (e) {
        console.error("🔥 Error en Dashboard Core:", e);
        renderError(container, "⚠️ Error de conexión con los servicios de datos.");
    }
}

/**
 * Orquestador de renderizado
 */
async function processAndRender(container, rawData, state) {
    // Procesar métricas base
    const metrics = calculateMetrics(rawData);
    
    // Obtener análisis profundo de la IA Gerente
    const aiAnalysis = await AI_Engine.analizarNegocio(state.empresaId);

    renderKPIs(metrics);
    renderCharts(metrics);
    renderCEO(metrics, aiAnalysis, state);
}

/**
 * Lógica de negocio y cálculos de KPI
 */
function calculateMetrics(data) {
    const { clientes, ordenes, inventario } = data;
    
    let ingresos = 0, costos = 0, alertas = [];
    let ingresosPorDia = {};

    ordenes.forEach(o => {
        const total = Number(o.total || o.valorTrabajo || 0);
        const costo = Number(o.costoTotal || 0);
        ingresos += total;
        costos += costo;

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

    return {
        ingresos, costos, 
        utilidad: ingresos - costos,
        margen: ingresos ? ((ingresos - costos) / ingresos) * 100 : 0,
        totalClientes: clientes.length,
        totalOrdenes: ordenes.length,
        totalStock: inventario.length,
        ingresosPorDia,
        alertas
    };
}

/* ========================================================================
   RENDERIZADO DE INTERFAZ (UI)
   ======================================================================== */

function renderBaseUI(container) {
    container.innerHTML = `
    <div style="padding:20px; background:#0a0f1a; min-height:100vh; font-family:'Segoe UI',Roboto,sans-serif;">
        <h1 style="font-size:32px; font-weight:900; color:#00ffff; margin-bottom:25px; text-shadow:0 0 15px #00ffff66;">
            🧠 DASHBOARD PRO360 <span style="font-size:14px; color:#facc15; text-shadow:none;">ULTRA V3</span>
        </h1>
        
        <div id="kpiGrid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:15px; margin-bottom:30px;">
            <div class="skeleton-kpi" style="height:100px; background:#0f172a; border-radius:12px;"></div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; flex-wrap:wrap;">
            <div style="background:#0f172a; padding:20px; border-radius:15px; border:1px solid #1e293b; box-shadow:0 10px 30px #000;">
                <h3 style="color:#00ffff; margin-bottom:15px; font-size:16px;">Flujo de Ingresos</h3>
                <canvas id="mainChart" style="max-height:350px;"></canvas>
            </div>
            <div id="ceoPanel"></div>
        </div>
    </div>`;
}

function renderKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    
    const cards = [
        { lab: "Ingresos", val: fmt.format(m.ingresos), col: "#00ffff" },
        { lab: "Utilidad", val: fmt.format(m.utilidad), col: "#22c55e" },
        { lab: "Margen", val: m.margen.toFixed(1) + "%", col: "#facc15" },
        { lab: "Órdenes", val: m.totalOrdenes, col: "#00ffff" },
        { lab: "Clientes", val: m.totalClientes, col: "#a855f7" }
    ];

    grid.innerHTML = cards.map(c => `
        <div style="background:#0f172a; padding:18px; border-radius:12px; border:1px solid #1e293b; box-shadow:0 4px 20px ${c.col}22;">
            <p style="font-size:11px; color:#94a3b8; margin:0; text-transform:uppercase;">${c.lab}</p>
            <h2 style="color:${c.col}; font-size:22px; margin:5px 0 0 0; font-weight:800;">${c.val}</h2>
        </div>
    `).join("");
}

async function renderCharts(m) {
    const ChartLib = window.Chart;
    if (!ChartLib) return;

    const ctx = document.getElementById("mainChart").getContext("2d");
    if (charts.main) charts.main.destroy();

    const dates = Object.keys(m.ingresosPorDia).sort();
    const values = dates.map(d => m.ingresosPorDia[d]);

    charts.main = new ChartLib(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                data: values,
                borderColor: '#00ffff',
                backgroundColor: 'rgba(0, 255, 255, 0.05)',
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
                y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
            }
        }
    });
}

function renderCEO(m, ai, state) {
    const panel = document.getElementById("ceoPanel");
    
    // Combinar alertas de métricas con alertas de IA Gerente
    const todasLasAlertas = [...m.alertas.map(a => a.msg), ...(ai?.alertas || [])];

    panel.innerHTML = `
        <div style="background:linear-gradient(145deg, #0f172a, #1e293b); padding:20px; border-radius:15px; border:1px solid #00ffff44; min-height:100%; box-shadow:0 10px 30px #000;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="color:#00ffff; display:flex; align-items:center; gap:10px; margin:0; font-size:18px;">
                    <span style="font-size:22px;">👑</span> CEO AUTÓNOMO
                </h3>
                <span style="font-size:10px; color:#22c55e; border:1px solid #22c55e; padding:2px 6px; border-radius:4px;">ONLINE</span>
            </div>
            
            <div style="margin-bottom:20px;">
                <p style="color:#facc15; font-size:11px; font-weight:bold; letter-spacing:1px;">⚠️ ESTADO CRÍTICO</p>
                ${todasLasAlertas.length ? todasLasAlertas.map(msg => `
                    <p style="font-size:12px; color:#ef4444; margin:6px 0; display:flex; align-items:center; gap:5px;">
                        <span style="font-size:8px;">●</span> ${msg}
                    </p>
                `).join("") : '<p style="color:#22c55e; font-size:12px;">✔ Operación óptima</p>'}
            </div>

            <div style="margin-bottom:20px;">
                <p style="color:#00ffff; font-size:11px; font-weight:bold; letter-spacing:1px;">🧠 ACCIONES SUGERIDAS</p>
                ${ai?.sugerencias.map(s => `
                    <div style="background:#0a0f1a; padding:12px; border-radius:10px; margin-top:10px; border-left:3px solid #00ffff;">
                        <p style="color:#fff; font-size:12px; margin:0; font-weight:600;">${s.msg}</p>
                        <p style="color:#00ffff; font-size:10px; margin:4px 0 0 0; opacity:0.7;">Impacto esperado: ${s.impact}</p>
                    </div>
                `).join("") || '<p style="color:#94a3b8; font-size:12px;">Analizando mercado...</p>'}
            </div>

            ${state.rolGlobal === 'superadmin' ? `
                <div style="margin-top:30px; padding:15px; background:rgba(34, 197, 94, 0.05); border:1px dashed #22c55e; border-radius:12px;">
                    <p style="color:#22c55e; font-size:11px; font-weight:bold; margin-bottom:10px; display:flex; align-items:center; gap:5px;">
                        <i class="fas fa-tools"></i> CONSOLA DE AUTOCURACIÓN
                    </p>
                    <div id="aiConsole" style="font-family:monospace; font-size:10px; color:#94a3b8; margin-bottom:12px; background:#000; padding:8px; border-radius:5px; max-height:60px; overflow:hidden;">
                        > Sistema estable. Esperando logs...
                    </div>
                    <button onclick="window.AI_Engine.systemSelfHealing('${state.empresaId}')" 
                            style="width:100%; background:#22c55e; color:#000; border:none; padding:10px; cursor:pointer; font-weight:bold; border-radius:8px; font-size:11px; transition:0.3s;">
                        EJECUTAR ESCANEO DE REPARACIÓN
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // Hacer la IA_Engine accesible globalmente para el botón del DOM
    window.AI_Engine = AI_Engine;
}

function renderError(container, msg) {
    container.innerHTML = `
        <div style="text-align:center; padding:100px 20px; color:#ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size:40px; margin-bottom:20px;"></i>
            <p style="font-size:18px; font-weight:bold;">${msg}</p>
            <button onclick="location.reload()" style="margin-top:20px; background:#1e293b; color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">Reintentar</button>
        </div>
    `;
}
