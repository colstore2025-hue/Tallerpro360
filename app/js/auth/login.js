import { auth, db } from "../core/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loginProcess(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // Búsqueda directa por UID (Más rápido que collectionGroup)
        const globalRef = doc(db, "usuariosGlobal", uid);
        const snap = await getDoc(globalRef);

        if (snap.exists()) {
            const data = snap.data();
            localStorage.setItem("uid", uid);
            localStorage.setItem("empresaId", data.empresaId || uid);
            localStorage.setItem("rol", data.rolGlobal);
            window.location.href = "/app/index.html";
        } else {
            throw new Error("Perfil no encontrado.");
        }
    } catch (error) {
        alert("Error: " + error.message);
    }
}
