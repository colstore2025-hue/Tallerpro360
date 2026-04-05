import { collection, addDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function ejecutarProtocoloNexus() {
    const db = window.db; 
    const statusText = document.getElementById('handshake-text');
    const overlay = document.getElementById('handshake');

    if (!db) return Swal.fire({ icon: 'error', title: 'NODO NO VINCULADO' });

    if(overlay) overlay.classList.remove('hidden');
    
    try {
        // A. CREAR EMPRESA GRATI-CORE
        const empresaRef = await addDoc(collection(db, "empresas"), {
            plan: "GRATI-CORE",
            limite_ordenes: 5,
            config_elite: true,
            status: "ACTIVE",
            creado_el: serverTimestamp()
        });

        const nuevoEmpresaId = empresaRef.id;

        // B. INYECTAR LAS 2 ÓRDENES SEMILLA
        const ordenesRef = collection(db, "ordenes");
        const seedData = {
            empresaId: nuevoEmpresaId,
            fecha: serverTimestamp(),
            tecnico: "IA NEXUS-X",
            total: 0
        };

        await Promise.all([
            addDoc(ordenesRef, { ...seedData, cliente: "DEMO USER 1", servicio: "Sincronización Starlink", estado: "FINALIZADO" }),
            addDoc(ordenesRef, { ...seedData, cliente: "DEMO USER 2", servicio: "Diagnóstico de Red", estado: "EN PROCESO" })
        ]);

        // C. EL TRUCO MAESTRO: Guardar el ID antes de ir al Login
        // Esto hace que el Dashboard original (v32.6) lea este ID sin modificaciones
        localStorage.setItem("empresaId", nuevoEmpresaId);
        localStorage.setItem("nexus_empresaId", nuevoEmpresaId);

        if(statusText) statusText.innerText = "SISTEMA SINCRONIZADO. REDIRECCIONANDO...";

        Swal.fire({
            icon: 'success',
            title: 'ACCESO CONCEDIDO',
            html: `<p class="orbitron text-xs">ID ASIGNADO: ${nuevoEmpresaId}</p>`,
            background: '#020617',
            confirmButtonText: 'ENTRAR A TERMINAL'
        }).then(() => {
            window.location.href = "/login"; // O la ruta de tu login
        });

    } catch (error) {
        if(overlay) overlay.classList.add('hidden');
        console.error("Fallo Nexus:", error);
    }
}
