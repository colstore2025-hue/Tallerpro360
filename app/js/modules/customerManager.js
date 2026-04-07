/**
 * CustomerManager.js - TALLERPRO360 NEXUS-X V4 👥
 * MOTOR DE INTELIGENCIA DE CLIENTES Y FIDELIZACIÓN (CRM CORE)
 * @author William Jeffry Urquijo Cubillos
 */
import { db } from "./firebase-config.js";
import { 
  collection, addDoc, getDocs, query, where, doc, 
  updateDoc, orderBy, serverTimestamp, limit, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export default class CustomerManager {
  constructor() {
    // Identidad única de la estación de trabajo
    this.empresaId = localStorage.getItem("nexus_empresaId");
    
    if (!this.empresaId) {
      console.error("⚠️ CRITICAL_ERROR: Acceso denegado a la base de datos de clientes. Empresa no definida.");
    }

    // Ruta optimizada: empresas/{id}/clientes
    this.collectionRef = collection(db, "empresas", this.empresaId, "clientes");
  }

  /**
   * Normalización Nexus: Limpia ruidos en strings para búsquedas exactas
   */
  normalize(str) {
    if (!str) return "";
    return str.toString().replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
  }

  /**
   * Búsqueda por radar: Localiza clientes por Placa o Teléfono
   */
  async findCustomer(valor, criterio = 'plate') {
    try {
      const cleanValue = this.normalize(valor);
      if (!cleanValue) return null;

      // Consulta de alto rendimiento limitada a 1 resultado
      const q = query(this.collectionRef, where(criterio, "==", cleanValue), limit(1));
      const snap = await getDocs(q);

      if (snap.empty) return null;

      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    } catch (e) {
      console.error(`ERROR_RADAR_BUSQUEDA [${criterio}]:`, e);
      return null;
    }
  }

  /**
   * Registro y Vínculo: Crea o actualiza el nodo del cliente
   */
  async register(data) {
    try {
      // 1. Evitar duplicidad táctica (Check por placa)
      const existing = await this.findCustomer(data.plate, 'plate');
      
      if (existing) {
        // Si existe, solo actualizamos el contador de misiones
        await this.recordVisit(existing.id);
        return { id: existing.id, status: "VINCULADO_EXISTENTE" };
      }

      // 2. Creación de nuevo Operador (Cliente)
      const payload = {
        name: data.name?.toUpperCase() || "OPERADOR_ANONIMO",
        phone: this.normalize(data.phone),
        email: data.email?.toLowerCase() || "",
        plate: this.normalize(data.plate),
        vehicleModel: data.vehicle || "N/A",
        // Métricas de Fidelización (Efecto Terminator)
        ltv: 0,                   // Life Time Value (Total gastado histórico)
        missionCount: 1,          // Contador de órdenes finalizadas
        lastVisit: serverTimestamp(),
        createdAt: serverTimestamp(),
        status: "ACTIVO",
        rank: "OPERATOR"          // Rangos: OPERATOR, COMMANDER, VIP
      };

      const docRef = await addDoc(this.collectionRef, payload);
      return { id: docRef.id, status: "NUEVO_VINCULO" };

    } catch (e) {
      console.error("FALLO_SISTEMA_REGISTRO:", e);
      return null;
    }
  }

  /**
   * Actualización de Métricas Financieras (Ejecutada tras cada pago exitoso)
   */
  async updateFinances(customerId, amount) {
    try {
      const ref = doc(this.collectionRef, customerId);
      
      // Incremento atómico en Firebase (Seguridad total)
      await updateDoc(ref, {
        ltv: increment(amount),
        missionCount: increment(1),
        lastVisit: serverTimestamp()
      });

      // Lógica de Rango Automático
      const snap = await getDocs(query(this.collectionRef, where("__name__", "==", customerId)));
      const data = snap.docs[0].data();
      
      if (data.missionCount >= 5) {
        await updateDoc(ref, { rank: "COMMANDER" });
      }
    } catch (e) {
      console.error("ERROR_ACTUALIZACION_FINANCIERA:", e);
    }
  }

  /**
   * Obtener Directorio para el CRM
   */
  async getDirectory(filtro = null) {
    try {
      let q = query(this.collectionRef, orderBy("lastVisit", "desc"));
      
      // Filtro para clientes "Fuera de Radar" (Inactivos)
      if (filtro === "INACTIVOS") {
          // Aquí podrías filtrar por fecha de hace 3 meses
      }

      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error("ERROR_LECTURA_DIRECTORIO:", e);
      return [];
    }
  }
}
