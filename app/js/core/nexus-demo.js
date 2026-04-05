// app/js/core/nexus-demo.js

async function ejecutarProtocoloNexus() {
    const btn = document.getElementById('btn-protocolo-demo');
    const overlay = document.getElementById('handshake');
    const statusText = document.getElementById('handshake-text');

    // 1. UI Feedback Instantáneo
    if(overlay) overlay.classList.remove('hidden');
    if(statusText) statusText.innerText = "ACCEDIENDO AL NODO GRATI-CORE...";
    btn.disabled = true;
    btn.innerHTML = "PROCESANDO...";

    try {
        // Verificamos conexión con Firestore (db debe venir de firebase-config.js)
        if (!db) throw new Error("Nodo Firestore no inicializado");

        // 2. Traemos la configuración maestra que creaste en Firestore
        const planDoc = await db.collection("planes").doc("GRATI-CORE").get();
        
        if (!planDoc.exists) {
            throw new Error("El protocolo GRATI-CORE no existe en la base de datos.");
        }

        const planData = planDoc.data();

        // 3. Calculamos la expiración de 7 días
        const hoy = new Date();
        const expiracion = new Date();
        expiracion.setDate(hoy.getDate() + 7);

        // 4. Creamos la nueva empresa (Instancia del cliente)
        // Usamos un ID aleatorio para el nuevo cliente
        const nuevaEmpresaRef = db.collection("empresas").doc();

        const payloadCliente = {
            id: nuevaEmpresaRef.id,
            plan: "GRATI-CORE",
            sello: "Nexus-X Starlink SaaS",
            status: planData.status || "ELITE_TRIAL",
            limite_ordenes: planData.limite_ordenes || 5,
            ordenes_creadas: 0,
            creado_el: firebase.firestore.FieldValue.serverTimestamp(), // Sello de tiempo oficial
            expira_el: firebase.firestore.Timestamp.fromDate(expiracion),
            config_elite: true
        };

        await nuevaEmpresaRef.set(payloadCliente);

        // 5. ÉXITO: Sincronización completa
        if(statusText) statusText.innerText = "VÍNCULO EXITOSO. INYECTANDO MODO ELITE...";
        
        setTimeout(() => {
            if(overlay) overlay.classList.add('hidden');
            Swal.fire({
                icon: 'success',
                title: 'SISTEMA VINCULADO',
                text: 'Has activado 7 días de acceso Elite (Grati-Core).',
                background: '#020617',
                color: '#06b6d4',
                confirmButtonColor: '#06b6d4'
            }).then(() => {
                // Redirección al área de trabajo
                window.location.href = "/login"; 
            });
        }, 1500);

    } catch (error) {
        console.error("Critical System Error:", error);
        if(overlay) overlay.classList.add('hidden');
        
        btn.disabled = false;
        btn.innerHTML = "REINTENTAR VÍNCULO";

        Swal.fire({
            icon: 'error',
            title: 'ERROR DE VÍNCULO',
            text: error.message || 'Falla en la comunicación con el Nodo Central.',
            background: '#020617',
            color: '#ff4444'
        });
    }
}
