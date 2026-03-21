/**
 * login.js - Soporte Multi-Nivel (Superadmin & Empresa)
 */
import { auth, db } from "../core/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, collectionGroup, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loginProcess(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // 1. INTENTO CAPA GLOBAL (Superadmins / Constructores)
        const globalRef = doc(db, "usuariosGlobal", uid);
        const globalSnap = await getDoc(globalRef);

        if (globalSnap.exists()) {
            const data = globalSnap.data();
            saveSession(uid, data.empresaId, data.rolGlobal, data.planTipo || "Elite");
            window.location.href = "/index.html";
            return;
        }

        // 2. INTENTO CAPA EMPRESA (Si no es superadmin, buscamos su vinculación)
        // Usamos collectionGroup para encontrar al usuario dentro de cualquier subcolección de empresa
        const userQuery = query(collectionGroup(db, "usuariosGlobal"), where("uid", "==", uid));
        const querySnap = await getDocs(userQuery);

        if (!querySnap.empty) {
            const userData = querySnap.docs[0].data();
            const empresaId = querySnap.docs[0].ref.parent.parent.id; // Subimos dos niveles para obtener el ID de empresa
            saveSession(uid, empresaId, userData.rol, userData.plan || "Basico");
            window.location.href = "/index.html";
        } else {
            throw new Error("Usuario no registrado en ninguna plataforma.");
        }

    } catch (error) {
        console.error("Error en login:", error);
        alert("Acceso denegado: " + error.message);
    }
}

function saveSession(uid, empresaId, rol, plan) {
    localStorage.setItem("uid", uid);
    localStorage.setItem("empresaId", empresaId);
    localStorage.setItem("rol", rol);
    localStorage.setItem("plan", plan);
}
