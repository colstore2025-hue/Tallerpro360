import { auth } from "../core/firebase-config.js";

export function protegerApp() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "/login.html";
            return;
        }
        // Verificamos que existan los datos mínimos de sesión
        const empresaId = localStorage.getItem("nexus_empresaId");
        if (!empresaId) {
            console.warn("⚠️ Sesión incompleta");
            window.location.href = "/login.html";
        }
    });
}

export function protegerAdmin() {
    const rol = (localStorage.getItem("nexus_rol") || "").toUpperCase();
    if (rol !== "ADMIN" && rol !== "DUENO") {
        alert("ACCESO DENEGADO: REQUIERE RANGO DE COMANDANTE");
        window.location.href = "/app/index.html";
    }
}

export async function cerrarSesion() {
    try {
        await auth.signOut();
        localStorage.clear();
        window.location.href = "/login.html";
    } catch (error) {
        console.error("❌ Error:", error);
    }
}
