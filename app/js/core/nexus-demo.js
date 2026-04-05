// app/js/core/nexus-demo.js

async function ejecutarProtocoloNexus() {
    const btn = document.getElementById('btn-protocolo-demo');
    
    // UI Feedback
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch animate-spin mr-2"></i> ENLAZANDO...`;

    try {
        // Asumiendo que db ya está inicializado en su firebase-config.js
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaInicio.getDate() + 7); // Hardcode de 7 días

        const demoRef = db.collection("clientes").doc(); // Genera ID único

        const nuevoClienteDemo = {
            uid: demoRef.id,
            nombre_empresa: "NEXUS-X DEMO USER",
            sello: "Nexus-X Starlink SaaS",
            plan: "GRATI-CORE",
            status: "ELITE_TRIAL",
            limite_ordenes: 5,
            ordenes_creadas: 0,
            creado_el: firebase.firestore.Timestamp.fromDate(fechaInicio),
            expira_el: firebase.firestore.Timestamp.fromDate(fechaFin),
            config_elite: true,
            vendedor: "Representacion Colombia"
        };

        await demoRef.set(nuevoClienteDemo);

        // Guardar localmente para que la App TallerPRO360 sepa que es modo demo
        localStorage.setItem('nexus_session_type', 'GRATI-CORE');
        localStorage.setItem('nexus_expiration', fechaFin.getTime());

        Swal.fire({
            title: 'SISTEMA VINCULADO',
            text: 'Modo Elite activo por 7 días (Máx 5 Órdenes)',
            icon: 'success',
            background: '#020617',
            color: '#06b6d4',
            confirmButtonColor: '#06b6d4'
        }).then(() => {
            window.location.href = '/dashboard'; 
        });

    } catch (error) {
        console.error("Error de Nodo:", error);
        btn.disabled = false;
        btn.innerHTML = "ERROR DE VÍNCULO";
    }
}
