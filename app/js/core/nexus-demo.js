/**
 * app/js/core/nexus-demo.js - PROTOCOLO DE VÍNCULO NEXUS-X
 * Sincronizado con Firebase v10 Modular
 */
import { collection, addDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function ejecutarProtocoloNexus() {
    // 1. Acceso al Nodo Central (Referencia Global de Base de Datos)
    const db = window.db; 
    const btn = document.getElementById('btn-protocolo-demo');
    const overlay = document.getElementById('handshake');
    const statusText = document.getElementById('handshake-text');

    if (!db) {
        console.error("CRITICAL: Nodo Firestore no detectado en el espacio global.");
        Swal.fire({
            icon: 'error',
            title: 'ERROR DE NODO',
            text: 'La base de datos no se inicializó correctamente.',
            background: '#020617',
            color: '#ff4444'
        });
        return;
    }

    // 2. Feedback Visual de Handshake
    if(overlay) overlay.classList.remove('hidden');
    if(statusText) statusText.innerText = "ESTABLECIENDO TÚNEL SEGURO GRATI-CORE...";
    btn.disabled = true;

    try {
    const hoy = new Date();
    const expiracion = new Date();
    expiracion.setDate(hoy.getDate() + 7);

    // A. CREAR EMPRESA DEMO
    const empresaRef = await addDoc(collection(db, "empresas"), {
        plan: "GRATI-CORE",
        status: "ELITE_TRIAL",
        creado_el: serverTimestamp(),
        expira_el: Timestamp.fromDate(expiracion),
        limite_ordenes: 5,
        ordenes_creadas: 2, // Marcamos 2 porque las inyectaremos ahora
        sello: "Nexus-X Starlink V1.1",
        config_elite: true
    });

    const empresaId = empresaRef.id;

    // B. INYECTAR ÓRDENES SEMILLA (Data Pre-cargada)
    const ordenesRef = collection(db, "ordenes");

    // Orden 1: Finalizada para mostrar historial
    await addDoc(ordenesRef, {
        empresaId: empresaId,
        cliente: "CLIENTE DE PRUEBA NEXUS",
        vehiculo: "TESLA MODEL 3 / PLACA: NEX-001",
        servicio: "Sincronización de Sensores Starlink",
        estado: "FINALIZADO",
        total: 150000,
        fecha: serverTimestamp(),
        tecnico: "IA Nexus-X"
    });

    // Orden 2: En proceso para mostrar seguimiento real
    await addDoc(ordenesRef, {
        empresaId: empresaId,
        cliente: "NEXUS DISCOVERY USER",
        vehiculo: "BMW M4 / PLACA: STAR-999",
        servicio: "Diagnóstico de Inyección Electrónica",
        estado: "EN PROCESO",
        total: 85000,
        fecha: serverTimestamp(),
        tecnico: "IA Nexus-X"
    });

    if(statusText) statusText.innerText = "NODO Y DATOS SINCRONIZADOS.";
    
    // ... sigue con el Swal.fire que definimos antes ...
            Swal.fire({
    icon: 'success',
    title: 'PROTOCOLO ACTIVADO',
    html: `
        <div class="text-left orbitron p-4 bg-slate-900 rounded-lg border border-cyan-500/30">
            <p class="text-[10px] text-cyan-400 mb-2 font-bold uppercase">Acceso Satelital:</p>
            <p class="text-[12px] text-white mb-1">USUARIO: <span class="text-yellow-400">discovery@tallerpro360.com</span></p>
            <p class="text-[12px] text-white">LLAVE: <span class="text-yellow-400">nexus2026</span></p>
            <hr class="my-3 border-slate-700">
            <p class="text-[9px] text-slate-400 italic">ID de Transmisión: ${docRef.id}</p>
        </div>
    `,
    background: '#020617',
    confirmButtonText: 'INGRESAR A TERMINAL',
    confirmButtonColor: '#06b6d4'
}).then(() => {
    window.location.href = "https://tallerpro360.vercel.app/login";
});
