// customerManager.js
// IA de gestión de clientes para talleres

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class CustomerManager {

  constructor() {
    this.customers = [];
  }

  async loadCustomers() {

    const snapshot = await getDocs(collection(db, "customers"));

    this.customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return this.customers;
  }

  async createCustomer(data) {

    const newCustomer = {
      name: data.name,
      phone: data.phone,
      vehicle: data.vehicle,
      plate: data.plate,
      lastVisit: new Date(),
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, "customers"), newCustomer);

    return docRef.id;
  }

  async searchCustomer(phone) {

    const q = query(
      collection(db, "customers"),
      where("phone", "==", phone)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  }

  async updateVisit(customerId) {

    const ref = doc(db, "customers", customerId);

    await updateDoc(ref, {
      lastVisit: new Date()
    });
  }

  predictReturn(customer) {

    const last = new Date(customer.lastVisit);
    const now = new Date();

    const days = Math.floor(
      (now - last) / (1000 * 60 * 60 * 24)
    );

    if (days > 180) return "Cliente perdido";
    if (days > 90) return "Probable regreso";
    if (days > 30) return "Cliente activo";

    return "Cliente reciente";
  }

}

export const customerManager = new CustomerManager();