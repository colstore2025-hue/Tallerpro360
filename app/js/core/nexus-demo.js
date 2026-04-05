import { collection, addDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * NEXUS-X STARLINK - PROTOCOLO GRATI-CORE V1.1.0
 * Estrategia: Personalización total + Límite Operativo Estricto
 */
export async function ejecutarProtocoloNexus() {
    const db = window.db; 
    const statusText = document.getElementById('handshake-text');
    const overlay = document.getElementById('handshake');

    // 1. BLOQUEO DE REPETICIÓN (Fingerprinting local)
    const existingNode = localStorage.getItem("nexus_x_fingerprint");
    if (existingNode) {
        return Swal.fire({
            icon: 'info',
            title: 'NODO YA ACTIVO',
            text: 'Tu terminal Grati-Core ya está configurada en este equipo.',
            background: '#020617',
            color: '#fff',
            confirmButtonColor: '#06b6d4',
            confirmButtonText: 'RE-INGRESAR A TERMINAL'
        }).then(() => window.location.href = "/login");
    }

    if (!db) return Swal.fire({ icon: 'error', title: 'ERROR DE VÍNCULO', text: 'Nodo Maestro no detectado.' });

    if(overlay) overlay.classList.remove('hidden');
    
    try {
        if(statusText) statusText.innerText = "GENERANDO HUELLA DE TERMINAL...";

        // 2. CREACIÓN DE EMPRESA TRIAL (7 DÍAS)
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);

        const empresaRef = await addDoc(collection(db, "empresas"), {
            nombre: "MI TALLER DEMO",
            plan: "GRATI-CORE",
            status: "ACTIVE",
            limite_ordenes: 3, // 2 Semillas + 1 de Ensayo
            expira_el: Timestamp.fromDate(fechaExpiracion),
            creado_el: serverTimestamp(),
            // Campos para que el cliente ensaye personalización
            logo_url: "",
            whatsapp_number: "",
            apikey_bold: "", 
            config_personalizada: true,
            fingerprint: btoa(navigator.userAgent + navigator.language).slice(0, 16)
        });

        const nuevoEmpresaId = empresaRef.id;

        if(statusText) statusText.innerText = "INYECTANDO ÓRDENES DE ENSAYO...";

        // 3. ÓRDENES SEMILLA (Visualización de potencia)
        const ordenesRef = collection(db, "ordenes");
        const seedBase = {
            empresaId: nuevoEmpresaId,
            fecha: serverTimestamp(),
            tecnico: "NEXUS-AI ENGINE",
            total: 0
        };

        await Promise.all([
            addDoc(ordenesRef, { 
                ...seedBase, 
                cliente: "CLIENTE EJEMPLO 1", 
                servicio: "Sincronización Starlink (Demo)", 
                estado: "FINALIZADO",
                notas: "Esta es una orden generada automáticamente para visualizar el panel."
            }),
            addDoc(ordenesRef, { 
                ...seedBase, 
                cliente: "CLIENTE EJEMPLO 2", 
                servicio: "Revisión de Sensores", 
                estado: "EN PROCESO",
                notas: "Puedes editar los costos de esta orden para probar el sistema."
            })
        ]);

        // 4. SELLADO DE SESIÓN
        // Limpiamos y preparamos el bypass para Dashboard v32.6
        localStorage.clear();
        localStorage.setItem("empresaId", nuevoEmpresaId);
        localStorage.setItem("nexus_x_fingerprint", nuevoEmpresaId);
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("isDemo", "true");

        if(statusText) statusText.innerText = "CONEXIÓN ESTABLECIDA.";

        Swal.fire({
            icon: 'success',
            title: 'SISTEMA SINCRONIZADO',
            html: `
                <div class="text-left orbitron text-[10px] space-y-2">
                    <p class="text-cyan-400">PLAN: GRATI-CORE ACTIVADO</p>
                    <p>CUOTA: 1 ORDEN DISPONIBLE PARA ENSAYO</p>
                    <p class="text-slate-500 italic">Válido por 7 días. Puedes configurar tu Logo y WhatsApp en Ajustes.</p>
                </div>
            `,
            background: '#020617',
            color: '#fff',
            confirmButtonText: 'ABRIR DASHBOARD',
            confirmButtonColor: '#06b6d4'
        }).then(() => {
            window.location.href = "/login"; 
        });

    } catch (error) {
        if(overlay) overlay.classList.add('hidden');
        console.error("Fallo Nexus-X:", error);
        Swal.fire({
            icon: 'error',
            title: 'FALLO DE TRANSMISIÓN',
            text: 'No se pudo crear el nodo trial. Revisa las Reglas de Firestore.',
            background: '#020617', color: '#fff'
        });
    }
}
