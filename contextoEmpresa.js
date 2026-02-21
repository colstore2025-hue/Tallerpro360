// contextoEmpresa.js
// Carga empresa, sucursal y rol automáticamente
// TallerPRO360 Arquitectura Profesional

import { auth } from "./firebase-config.js";
import { db } from "./firebase-config.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export let contextoGlobal = null;

export function initContextoEmpresa(callback) {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {

      // Buscar usuario dentro de empresas
      const empresasRef = collection(db, "empresas");
      const snapshotEmpresas = await getDocs(empresasRef);

      let encontrado = false;

      for (const empresaDoc of snapshotEmpresas.docs) {

        const usuariosRef = collection(
          db,
          "empresas",
          empresaDoc.id,
          "usuarios"
        );

        const q = query(
          usuariosRef,
          where("uid", "==", user.uid),
          where("activo", "==", true)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {

          const usuarioData = querySnapshot.docs[0].data();

          contextoGlobal = {
            empresaId: empresaDoc.id,
            sucursalId: usuarioData.sucursalId,
            rol: usuarioData.rol,
            uid: user.uid
          };

          console.log("✅ Contexto cargado:", contextoGlobal);

          encontrado = true;
          break;
        }
      }

      if (!encontrado) {
        alert("Usuario no pertenece a ninguna empresa activa.");
        await auth.signOut();
        window.location.href = "login.html";
        return;
      }

      if (callback) callback(contextoGlobal);

    } catch (error) {
      console.error("❌ Error cargando contexto:", error);
    }

  });
}