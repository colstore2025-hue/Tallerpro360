/**
 * staff.js - TallerPRO360 NEXUS-X V18.3 👥
 * VERSIÓN DE EMERGENCIA: Limpia errores de carga en Vercel.
 */
import { 
    collection, query, where, onSnapshot, serverTimestamp, setDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { db, firebaseConfig } from "../core/firebase-config.js";

export default async function staffModule(container, state) {
    const auth = getAuth();
    const empresaId = state?.empresaId || localStorage.getItem("empresaId");
    const miRol = (state?.rol || localStorage.getItem("rol") || "OPERADOR").toUpperCase(); 

    if (!container) return;

    // Interfaz Base
    container.innerHTML = `
    <div class="p-6 bg-[#010409] min-h-screen text-white">
        <h1 class="orbitron text-4xl mb-8">CREW <span class="text-indigo-400">CONTROL</span></h1>
        <div id="statusStaff" class="mb-4 text-[10px] orbitron text-slate-500">CONECTANDO AL NODO...</div>
        <div id="gridStaff" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
        ${['DUENO', 'ADMIN'].includes(miRol) ? `
            <button id="btnNuevoStaff" class="fixed bottom-24 right-6 bg-indigo-600 p-4 rounded-full shadow-lg">
                <i class="fas fa-plus"></i>
            </button>
        ` : ''}
    </div>`;

    const statusStaff = document.getElementById("statusStaff");
    const gridStaff = document.getElementById("gridStaff");

    // Lógica de Escucha Silenciosa
    const q = query(collection(db, "usuarios"), where("empresaId", "==", empresaId));
    onSnapshot(q, (snap) => {
        statusStaff.innerText = `NODO ACTIVO: ${snap.size} UNIDADES`;
        gridStaff.innerHTML = snap.docs.map(d => {
            const u = d.data();
            return `
            <div class="bg-[#0d1117] p-6 rounded-2xl border border-white/5">
                <p class="orbitron text-xs">${u.nombre || 'SIN NOMBRE'}</p>
                <p class="text-[9px] text-slate-500">${u.role || 'TECNICO'}</p>
            </div>`;
        }).join("");
    });

    // Evento de creación
    document.getElementById("btnNuevoStaff")?.addEventListener("click", async () => {
        const { value: formValues } = await Swal.fire({
            title: 'RECLUTAR',
            background: '#0d1117',
            color: '#fff',
            html: '<input id="sw-name" class="swal2-input" placeholder="Nombre"><input id="sw-email" class="swal2-input" placeholder="Email"><input id="sw-pass" type="password" class="swal2-input" placeholder="Pass">',
            preConfirm: () => [
                document.getElementById('sw-name').value,
                document.getElementById('sw-email').value,
                document.getElementById('sw-pass').value
            ]
        });

        if (formValues) {
            try {
                // Instancia secundaria para no cerrar sesión del dueño
                let sApp = getApps().find(a => a.name === "Secondary") || initializeApp(firebaseConfig, "Secondary");
                const sAuth = getAuth(sApp);
                const uCred = await createUserWithEmailAndPassword(sAuth, formValues[1], formValues[2]);
                
                await setDoc(doc(db, "usuarios", uCred.user.uid), {
                    uid: uCred.user.uid,
                    nombre: formValues[0].toUpperCase(),
                    email: formValues[1].toLowerCase(),
                    role: 'TECNICO',
                    empresaId: empresaId,
                    status: 'ACTIVE'
                });
                await signOut(sAuth);
                Swal.fire("LISTO", "Operador en sistema", "success");
            } catch (e) {
                Swal.fire("ERROR", e.message, "error");
            }
        }
    });
}
