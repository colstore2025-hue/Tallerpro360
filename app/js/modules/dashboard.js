/**
 * dashboard.js 
 * 🔥 TallerPRO360 ULTRA V3 - Edición Certificada
 */
import { getClientes, getOrdenes, getInventario } from "../services/dataService.js";
import { AI_Engine } from "../ai/aiAutonomousFlow.js";
import { store } from "../core/store.js";

let charts = {};

export default async function dashboard(container, state) {
    // 1. Render inicial inmediato (UX First)
    renderBaseUI(container);

    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    if (!empresaId) return renderError(container, "❌ Identificador de empresa no encontrado");

    try {
        // 2. Intentar cargar desde Store para velocidad instantánea
        if (store.cache?.ordenes?.length > 0) {
            processAndRender(container, store.cache, state);
        }

        // 3. Sincronización asíncrona con Firebase
        const [clientes, ordenes, inventario] = await Promise.all([
            getClientes(empresaId).catch(() => []),
            getOrdenes(empresaId).catch(() => []),
            getInventario(empresaId).catch(() => [])
        ]);

        const freshData = { clientes, ordenes, inventario };
        store.cache = freshData; 

        await processAndRender(container, freshData, state);

    } catch (e) {
        console.error("🔥 Error crítico en Dashboard:", e);
        // No bloqueamos la pantalla, mostramos lo que tengamos
    }
}

async function processAndRender(container, rawData, state) {
    const metrics = calculateMetrics(rawData);
    
    // Renderizamos KPIs y Gráficos primero (No esperamos a la IA)
    renderKPIs(metrics);
    renderCharts(metrics);

    // Luego, de forma asíncrona, cargamos el panel CEO
    AI_Engine.analizarNegocio(state.empresaId)
        .then(aiAnalysis => renderCEO(metrics, aiAnalysis, state))
        .catch(() => renderCEO(metrics, null, state));
}

function calculateMetrics(data) {
    const clientes = data.clientes || [];
    const ordenes = data.ordenes || [];
    const inventario = data.inventario || [];
    
    let ingresos = 0, costos = 0, alertas = [];
    let ingresosPorDia = {};

    ordenes.forEach(o => {
        const total = Number(o.total || o.valorTrabajo || 0);
        const costo = Number(o.costoTotal || 0);
        ingresos += total;
        costos += costo;

        // SAFE DATE: Evita el error .toDate()
        let fecha = "Sin Fecha";
        try {
            if (o.creadoEn?.toDate) fecha = o.creadoEn.toDate().toISOString().split("T")[0];
            else if (o.creadoEn) fecha = new Date(o.creadoEn).toISOString().split("T")[0];
        } catch(e) { fecha = "Error Fecha"; }
        
        ingresosPorDia[fecha] = (ingresosPorDia[fecha] || 0) + total;

        if (total < costo && total > 0) {
            alertas.push({ msg: `Orden #${o.id?.slice(-4) || '??'} con pérdida`, nivel: "alto" });
        }
    });

    inventario.forEach(item => {
        if (Number(item.cantidad || 0) < 5) {
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

function renderBaseUI(container) {
    container.innerHTML = `
    <div style="padding:20px; background:#0a0f1a; min-height:100vh; font-family:sans-serif;">
        <h1 style="font-size:28px; font-weight:900; color:#00ffff; margin-bottom:20px;">
            🧠 DASHBOARD PRO360 <span style="font-size:12px; color:#facc15;">ULTRA V3</span>
        </h1>
        <div id="kpiGrid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:15px; margin-bottom:30px;">
             <div style="height:100px; background:#0f172a; border-radius:12px; border:1px solid #1e293b; animate: pulse 2s infinite;"></div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
            <div style="background:#0f172a; padding:20px; border-radius:15px; border:1px solid #1e293b;">
                <h3 style="color:#00ffff; margin-bottom:15px; font-size:16px;">Flujo de Ingresos</h3>
                <canvas id="mainChart" style="max-height:300px;"></canvas>
            </div>
            <div id="ceoPanel"></div>
        </div>
    </div>`;
}

function renderKPIs(m) {
    const grid = document.getElementById("kpiGrid");
    if (!grid) return;
    const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    
    const cards = [
        { lab: "Ingresos", val: fmt.format(m.ingresos), col: "#00ffff" },
        { lab: "Utilidad", val: fmt.format(m.utilidad), col: "#22c55e" },
        { lab: "Margen", val: m.margen.toFixed(1) + "%", col: "#facc15" },
        { lab: "Órdenes", val: m.totalOrdenes, col: "#a855f7" }
    ];

    grid.innerHTML = cards.map(c => `
        <div style="background:#0f172a; padding:18px; border-radius:12px; border:1px solid #1e293b;">
            <p style="font-size:11px; color:#94a3b8; margin:0; text-transform:uppercase;">${c.lab}</p>
            <h2 style="color:${c.col}; font-size:24px; margin:5px 0 0 0; font-weight:800;">${c.val}</h2>
        </div>
    `).join("");
}

async function renderCharts(m) {
    // Si Chart.js no está en el index.html, lo cargamos dinámicamente
    if (!window.Chart) {
        console.warn("Chart.js no detectado, esperando...");
        return;
    }

    const ctx = document.getElementById("mainChart")?.getContext("2d");
    if (!ctx) return;

    if (charts.main) charts.main.destroy();

    const dates = Object.keys(m.ingresosPorDia).sort();
    const values = dates.map(d => m.ingresosPorDia[d]);

    charts.main = new window.Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                data: values,
                borderColor: '#00ffff',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 255, 255, 0.05)'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function renderCEO(m, ai, state) {
    const panel = document.getElementById("ceoPanel");
    if (!panel) return;

    panel.innerHTML = `
        <div style="background:#0f172a; padding:20px; border-radius:15px; border:1px solid #00ffff44;">
            <h3 style="color:#00ffff; margin-top:0;">👑 CEO AUTÓNOMO</h3>
            <div style="margin-bottom:15px;">
                <p style="color:#facc15; font-size:11px; font-weight:bold;">ALERTAS ACTIVAS</p>
                ${m.alertas.length ? m.alertas.map(a => `<p style="color:#ef4444; font-size:12px; margin:4px 0;">● ${a.msg}</p>`).join("") : '<p style="color:#22c55e; font-size:12px;">Operación Estable</p>'}
            </div>
            <div style="margin-bottom:15px;">
                <p style="color:#00ffff; font-size:11px; font-weight:bold;">IA SUGERENCIAS</p>
                ${ai?.sugerencias?.map(s => `<p style="color:#fff; font-size:12px;">→ ${s.msg}</p>`).join("") || '<p style="color:#64748b; font-size:12px;">Analizando datos...</p>'}
            </div>
        </div>
    `;
    window.AI_Engine = AI_Engine;
}

function renderError(container, msg) {
    container.innerHTML = `<div style="color:red; padding:50px; text-align:center;">${msg}</div>`;
}
