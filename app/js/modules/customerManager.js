/**
 * customerManager.js
 * Gestión inteligente de clientes - TallerPRO360 ERP
 * Lógica central para CRUD y predicciones
 */

import { db } from "../core/firebase-config.js";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class CustomerManager {
  constructor() {
    this.customers = [];
    this.collectionName = "clientes"; // Unificar colección
  }

  /* ===============================
     CARGAR CLIENTES
  ================================ */
  async loadCustomers() {
    try {
      const snapshot = await getDocs(collection(db, this.collectionName));
      this.customers = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      return this.customers;
    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
      return [];
    }
  }

  /* ===============================
     CREAR CLIENTE
  ================================ */
  async createCustomer(data) {
    try {
      if (!data?.phone) {
        console.warn("⚠️ Cliente sin teléfono");
        return null;
      }

      const newCustomer = {
        name: data.name || "Cliente",
        phone: data.phone,
        email: data.email || "",
        vehicle: data.vehicle || "",
        plate: data.plate || "",
        lastVisit: new Date(),
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.collectionName), newCustomer);
      console.log("✅ Cliente creado:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creando cliente:", error);
      return null;
    }
  }

  /* ===============================
     BUSCAR CLIENTE POR TELÉFONO
  ================================ */
  async searchCustomer(phone) {
    try {
      if (!phone) return null;

      const q = query(collection(db, this.collectionName), where("phone", "==", phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    } catch (error) {
      console.error("❌ Error buscando cliente:", error);
      return null;
    }
  }

  /* ===============================
     ACTUALIZAR VISITA
  ================================ */
  async updateVisit(customerId) {
    try {
      if (!customerId) return;
      const ref = doc(db, this.collectionName, customerId);
      await updateDoc(ref, { lastVisit: new Date() });
    } catch (error) {
      console.error("❌ Error actualizando visita:", error);
    }
  }

  /* ===============================
     PREDICCIÓN DE REGRESO DEL CLIENTE
  ================================ */
  predictReturn(customer) {
    try {
      if (!customer?.lastVisit) return "Cliente nuevo";

      const last = new Date(customer.lastVisit);
      const now = new Date();
      const days = Math.floor((now - last) / (1000 * 60 * 60 * 24));

      if (days > 180) return "Cliente perdido";
      if (days > 90) return "Probable regreso";
      if (days > 30) return "Cliente activo";

      return "Cliente reciente";
    } catch (error) {
      console.error("Error predicción cliente", error);
      return "Desconocido";
    }
  }
}

export default CustomerManager;