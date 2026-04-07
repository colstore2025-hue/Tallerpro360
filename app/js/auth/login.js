import { auth, db } from "../core/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loginProcess(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // CORRECCIÓN: Usamos la colección 'usuarios' que es la real
        const userRef = doc(db, "usuarios", uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            
            // --- NORMALIZACIÓN ABSOLUTA PARA NEXUS-X ---
            localStorage.setItem("nexus_uid", uid);
            localStorage.setItem("nexus_empresaId", data.empresaId || "taller_001");
            
            // Guardamos el plan y el rol siempre en MAYÚSCULAS para evitar errores de lectura
            const planFinal = (data.planType || data.plan || "GRATI-CORE").toUpperCase();
            const rolFinal = (data.role || data.rol || "OPERADOR").toUpperCase();
            
            localStorage.setItem("nexus_plan", planFinal);
            localStorage.setItem("nexus_rol", rolFinal);
            localStorage.setItem("nexus_userName", data.nombre || "Comandante");
            
            // Compatibilidad con Dashboard antiguo
            localStorage.setItem("planTipo", planFinal); 

            window.location.href = "/app/index.html";
        } else {
            throw new Error("El perfil no existe en la base de datos de Nexus-X.");
        }
    } catch (error) {
        throw error; // Dejamos que el UI maneje el mensaje
    }
}
