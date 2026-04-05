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
        // 3. Cálculo de Ciclo Orbital (7 días de Trial)
        const hoy = new Date();
        const expiracion = new Date();
        expiracion.setDate(hoy.getDate() + 7);

        // 4. Inyección de Datos en Colección 'empresas'
        const docRef = await addDoc(collection(db, "empresas"), {
            plan: "GRATI-CORE",
            status: "ELITE_TRIAL",
            creado_el: serverTimestamp(),
            expira_el: Timestamp.fromDate(expiracion),
            limite_ordenes: 5,
            ordenes_creadas: 0,
            config_elite: true,
            sello: "Nexus-X Starlink V1.1",
            metadata: {
                origen: "Landing_Discovery",
                handshake: "Success"
            }
        });

        // 5. Éxito de Transmisión
        if(statusText) statusText.innerText = "VÍNCULO EXITOSO. NODO VIRTUAL CREADO.";
        
        setTimeout(() => {
            if(overlay) overlay.classList.add('hidden');
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
