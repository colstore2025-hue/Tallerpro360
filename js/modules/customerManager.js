/*
================================================
CUSTOMERMANAGER.JS - Versión Final
Gestión de clientes con historial de visitas
Ubicación: /app/js/modules/customerManager.js
================================================
*/

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default class CustomerManager {
  
  constructor(){
    this.collectionRef = collection(db, "clientes");
  }

  async searchCustomer(phone){
    try {
      const q = query(this.collectionRef, where("phone","==",phone));
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
      const docRef = await addDoc(this.collectionRef, {
        name: data.name || "Cliente",
        phone: data.phone || "",
        vehicle: data.vehicle || "",
        plate: data.plate || "",
        createdAt: new Date(),
        lastVisit: new Date()
      });
      return docRef.id;
    } catch(e){
      console.error("Error creando cliente:", e);
      return null;
    }
  }

  async updateVisit(customerId){
    try {
      const ref = doc(db,"clientes",customerId);
      await updateDoc(ref, { lastVisit: new Date() });
    } catch(e){
      console.error("Error actualizando visita:", e);
    }
  }

  async getAllCustomers(){
    try {
      const q = query(this.collectionRef, orderBy("lastVisit","desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } catch(e){
      console.error("Error obteniendo clientes:", e);
      return [];
    }
  }
}