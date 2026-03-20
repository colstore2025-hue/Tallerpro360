import { db } from "../core/firebase-config.js";
import { obtenerEmpresaId } from "../core/empresa-context.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default class CustomerManager {

  constructor(){
    const empresaId = obtenerEmpresaId();

    if(!empresaId){
      console.warn("⚠️ Empresa no definida en CustomerManager");
    }

    this.collectionRef = collection(db, "empresas", empresaId, "clientes");
  }

  normalizePhone(phone){
    return (phone || "").replace(/\s+/g, "").trim();
  }

  async searchCustomer(phone){
    try {
      const cleanPhone = this.normalizePhone(phone);
      if(!cleanPhone) return null;

      const q = query(this.collectionRef, where("phone","==",cleanPhone));
      const snapshot = await getDocs(q);

      if(snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };

    } catch(e){
      console.error("Error buscando cliente:", e);
      return null;
    }
  }

  async createCustomer(data){
    try {

      const cleanPhone = this.normalizePhone(data.phone);

      const docRef = await addDoc(this.collectionRef, {
        name: data.name || "Cliente",
        phone: cleanPhone,
        vehicle: data.vehicle || "",
        plate: data.plate || "",
        createdAt: serverTimestamp(),
        lastVisit: serverTimestamp()
      });

      return docRef.id;

    } catch(e){
      console.error("Error creando cliente:", e);
      return null;
    }
  }

  async updateVisit(customerId){
    try {
      const ref = doc(this.collectionRef, customerId);

      await updateDoc(ref, {
        lastVisit: serverTimestamp()
      });

    } catch(e){
      console.error("Error actualizando visita:", e);
    }
  }

  async getAllCustomers(){
    try {
      const q = query(this.collectionRef, orderBy("lastVisit","desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

    } catch(e){
      console.error("Error obteniendo clientes:", e);
      return [];
    }
  }
}