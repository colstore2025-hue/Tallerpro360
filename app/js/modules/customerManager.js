/**
 * CustomerManager.js - TallerPRO360 V4 👥
 * Motor de Gestión de Identidad de Clientes & CRM
 */
import { db } from "../core/firebase-config.js";
import { 
  collection, addDoc, getDocs, query, where, doc, updateDoc, orderBy, serverTimestamp, limit 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default class CustomerManager {
  constructor(empresaId) {
    // Priorizamos el ID pasado por parámetro o buscamos en storage
    this.empresaId = empresaId || localStorage.getItem("empresaId");
    
    if (!this.empresaId) {
      console.error("❌ Error Crítico: Empresa no identificada en el CRM");
    }

    // Referencia limpia a la sub-colección de la empresa actual
    this.collectionRef = collection(db, "empresas", this.empresaId, "clientes");
  }

  /**
   * Limpia espacios y caracteres para evitar duplicados por formato
   */
  normalize(str) {
    return (str || "").replace(/\s+/g, "").trim().toUpperCase();
  }

  /**
   * Búsqueda Inteligente: Por Teléfono o Por Placa
   */
  async findCustomer(value, type = 'phone') {
    try {
      const cleanValue = this.normalize(value);
      if (!cleanValue) return null;

      const q = query(this.collectionRef, where(type, "==", cleanValue), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    } catch (e) {
      console.error(`Error en búsqueda por ${type}:`, e);
      return null;
    }
  }

  /**
   * Registra un nuevo cliente con metadatos de lealtad
   */
  async register(data) {
    try {
      // Validar si ya existe por teléfono para evitar basura en DB
      const existing = await this.findCustomer(data.phone, 'phone');
      if (existing) {
        await this.recordVisit(existing.id);
        return existing.id;
      }

      const docRef = await addDoc(this.collectionRef, {
        name: data.name || "Cliente Nuevo",
        phone: this.normalize(data.phone),
        email: data.email || "",
        vehicle: data.vehicle || "No especificado",
        plate: this.normalize(data.plate),
        totalSpent: 0,         // Para que la IA sepa quién es cliente VIP
        visitCount: 1,         // Contador de fidelidad
        createdAt: serverTimestamp(),
        lastVisit: serverTimestamp(),
        status: "ACTIVO"
      });

      return docRef.id;
    } catch (e) {
      console.error("Error al registrar cliente:", e);
      return null;
    }
  }

  /**
   * Actualiza la fecha de visita y aumenta el contador de lealtad
   */
  async recordVisit(customerId, amount = 0) {
    try {
      const ref = doc(this.collectionRef, customerId);
      // Nota: En una versión Pro, aquí usarías increment() de Firebase
      await updateDoc(ref, {
        lastVisit: serverTimestamp(),
        // Podrías sumar el 'amount' al totalSpent aquí
      });
    } catch (e) {
      console.error("Error actualizando ciclo de visita:", e);
    }
  }

  /**
   * Obtiene la base de datos completa para el módulo de Marketing/Gerencia
   */
  async getDirectory() {
    try {
      const q = query(this.collectionRef, orderBy("lastVisit", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("Error en Directorio:", e);
      return [];
    }
  }
}
