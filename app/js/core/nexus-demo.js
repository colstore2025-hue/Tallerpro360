/**
 * app/js/core/nexus-demo.js - PROTOCOLO DE VÍNCULO NEXUS-X
 * Edición Estándar para TallerPRO360 (Grati-Core)
 */
import { collection, addDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function ejecutarProtocoloNexus() {
    const db = window.db; 
    const btn = document.getElementById('btn-protocolo-demo');
    const overlay = document.getElementById('handshake');
    const statusText = document.getElementById('handshake-text');

    if (!db) {
        Swal.fire({ icon: 'error', title: 'NODO NO ENCONTRADO', background: '#020617', color: '#ff4444' });
        return;
    }

    if(overlay) overlay.classList.remove('hidden');
    if(statusText) statusText.innerText = "SINCRONIZANDO NODO GRATI-CORE...";
    btn.disabled = true;

    try {
        const expiracion = new Date();
        expiracion.setDate(expiracion.getDate() + 7);

        // A. CREAR EMPRESA DEMO (ID Aleatorio de Firebase)
        const empresaRef = await addDoc(collection(db, "empresas"), {
            plan: "GRATI-CORE",
            status: "ELITE_TRIAL",
            creado_el: serverTimestamp(),
            expira_el: Timestamp.fromDate(expiracion),
            limite_ordenes: 5,
            ordenes_creadas: 2, // Se sincroniza con las 2 órdenes de abajo
            sello: "Nexus-X Starlink V1.1",
            config_elite: true
        });

        const empresaId = empresaRef.id;

        // B. INYECTAR ÓRDENES SEMILLA ASOCIADAS AL ID GENERADO
        const ordenesRef = collection(db, "ordenes");

        await Promise.all([
            addDoc(ordenesRef, {
                empresaId: empresaId,
                cliente: "CLIENTE DE PRUEBA NEXUS",
                vehiculo: "TESLA MODEL 3 / PLACA: NEX-001",
                servicio: "Sincronización de Sensores Starlink",
                estado: "FINALIZADO",
                total: 150000,
                fecha: serverTimestamp(),
                tecnico: "IA Nexus-X"
            }),
            addDoc(ordenesRef, {
                empresaId: empresaId,
                cliente: "NEXUS DISCOVERY USER",
                vehiculo: "BMW M4 / PLACA: STAR-999",
                servicio: "Diagnóstico de Inyección Electrónica",
                estado: "EN PROCESO",
                total: 85000,
                fecha: serverTimestamp(),
                tecnico: "IA Nexus-X"
            })
        ]);

        // C. GUARDADO DE IDENTIDAD PARA EL DASHBOARD
        localStorage.setItem("nexus_empresaId", empresaId);
        localStorage.setItem("empresaId", empresaId);

        if(statusText) statusText.innerText = "ACCESO SATELITAL CONCEDIDO.";

        Swal.fire({
            icon: 'success',
            title: 'PROTOCOLO ACTIVADO',
            html: `
                <div class="text-left orbitron p-4 bg-slate-900 rounded-lg border border-cyan-500/30">
                    <p class="text-[10px] text-cyan-400 mb-2 font-bold uppercase text-center">Acceso Discovery:</p>
                    <p class="text-[12px] text-white mb-1">USUARIO: <span class="text-yellow-400">discovery@tallerpro360.com</span></p>
                    <p class="text-[12px] text-white">LLAVE: <span class="text-yellow-400">Demo2026</span></p>
                    <hr class="my-3 border-slate-700">
                    <p class="text-[8px] text-slate-500 text-center uppercase tracking-widest italic">ID Transmisión: ${empresaId}</p>
                </div>
            `,
            background: '#020617',
            confirmButtonText: 'INGRESAR A TERMINAL',
            confirmButtonColor: '#06b6d4'
        }).then(() => {
            window.location.href = "/login";
        });

    } catch (error) {
        console.error("Error Nexus:", error);
        if(overlay) overlay.classList.add('hidden');
        Swal.fire({ icon: 'error', title: 'FALLA DE VÍNCULO', text: error.message, background: '#020617' });
    }
}
