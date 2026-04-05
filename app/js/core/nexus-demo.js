import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function ejecutarProtocoloNexus() {
    const db = window.db; 
    const statusText = document.getElementById('handshake-text');
    const overlay = document.getElementById('handshake');

    // 1. Verificación de Nodo Maestro
    if (!db) {
        return Swal.fire({ 
            icon: 'error', 
            title: 'NODO NO VINCULADO',
            text: 'Revisar consola del navegador (F12)',
            background: '#020617',
            color: '#fff'
        });
    }

    if(overlay) overlay.classList.remove('hidden');
    if(statusText) statusText.innerText = "INICIANDO SECUENCIA GRATI-CORE...";
    
    try {
        // A. CREAR EMPRESA EN LA COLECCIÓN MAESTRA
        // Importante: El dashboard v32.6 suele buscar estos campos exactos
        const empresaRef = await addDoc(collection(db, "empresas"), {
            nombre: "DEMO TALLERPRO360",
            plan: "GRATI-CORE",
            limite_ordenes: 5, // Límite solicitado
            config_elite: true,
            status: "ACTIVE",
            fecha_activacion: serverTimestamp(),
            email_admin: "demo@tallerpro360.com",
            version_engine: "1.1.0-STABLE"
        });

        const nuevoEmpresaId = empresaRef.id;

        if(statusText) statusText.innerText = "INYECTANDO ÓRDENES SEMILLA...";

        // B. INYECTAR ÓRDENES (Vinculadas al nuevo ID)
        const ordenesRef = collection(db, "ordenes");
        
        await Promise.all([
            addDoc(ordenesRef, { 
                empresaId: nuevoEmpresaId, 
                cliente: "CLIENTE DEMO 1", 
                servicio: "Mantenimiento Preventivo", 
                estado: "PENDIENTE",
                fecha: serverTimestamp(),
                tecnico: "NEXUS-X AI"
            }),
            addDoc(ordenesRef, { 
                empresaId: nuevoEmpresaId, 
                cliente: "CLIENTE DEMO 2", 
                servicio: "Cambio de Sensores", 
                estado: "FINALIZADO",
                fecha: serverTimestamp(),
                tecnico: "NEXUS-X AI"
            })
        ]);

        // C. EL "BYPASS" PARA EL DASHBOARD V32.6
        // Seteamos el ID en el localStorage tal cual lo busca el sistema original
        localStorage.clear(); // Limpiamos basuras previas
        localStorage.setItem("empresaId", nuevoEmpresaId);
        localStorage.setItem("userRole", "admin"); // Forzamos rol admin para la demo
        localStorage.setItem("isDemo", "true");

        if(statusText) statusText.innerText = "TUNEL SEGURO ESTABLECIDO.";

        Swal.fire({
            icon: 'success',
            title: 'NODO GRATI-CORE ACTIVADO',
            html: `<div class="orbitron text-[10px] text-cyan-400">ID: ${nuevoEmpresaId}<br>ACCESO 7 DÍAS CONCEDIDO</div>`,
            background: '#020617',
            color: '#fff',
            confirmButtonText: 'INGRESAR A TERMINAL',
            confirmButtonColor: '#06b6d4'
        }).then(() => {
            // REDIRECCIÓN FINAL - Ajusta según tu carpeta
            window.location.href = "login.html"; 
        });

    } catch (error) {
        if(overlay) overlay.classList.add('hidden');
        console.error("Fallo Crítico Nexus:", error);
        Swal.fire({
            icon: 'error',
            title: 'ERROR DE TRANSMISIÓN',
            text: error.message,
            background: '#020617',
            color: '#fff'
        });
    }
}
