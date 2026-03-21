/**
 * dataService.js - Versión Estabilizada
 */
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../core/firebase-config.js";
import { setStore, store } from "../core/store.js";

export const dataService = {
  // Suscripción genérica que alimenta el Store automáticamente
  subscribeTo: (collectionName) => {
    const empresaId = store.empresa?.id || localStorage.getItem("empresaId");
    if (!empresaId) return null;

    const path = `empresas/${empresaId}/${collectionName}`;
    const q = query(collection(db, path), orderBy("creadoEn", "desc"));

    // Retornamos el unsubsribe para poder limpiar memoria al cerrar sesión
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Actualizamos el cache global
      const newCache = { ...store.cache, [collectionName]: data };
      setStore('cache', newCache);
      
      console.log(`[DataService] ${collectionName} actualizada en Cache.`);
    }, (error) => {
      console.error(`Error en suscripción ${collectionName}:`, error);
    });
  }
};
