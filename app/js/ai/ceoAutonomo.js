/**
 * ceoAutonomo.js
 * CEO Autónomo GOD CORE 🧠👑
 * Monitorea, analiza y actúa automáticamente
 */

import { generarSugerencias } from "./aiAdvisor.js";

class CEOAutonomo {

  constructor(){
    this.interval = null;
    this.estado = {
      activo: false,
      ultimaEjecucion: null
    };

    console.log("👑 CEO Autónomo listo");
  }

  /* ===============================
  ACTIVAR CEO
  =============================== */

  iniciar(state){

    if(this.estado.activo){
      console.warn("⚠️ CEO ya está activo");
      return;
    }

    console.log("🚀 CEO Autónomo ACTIVADO");

    this.estado.activo = true;

    // 🔥 Ejecuta cada 60 segundos
    this.interval = setInterval(()=>{
      this.ejecutar(state);
    }, 60000);

    // Ejecutar inmediatamente
    this.ejecutar(state);
  }

  /* ===============================
  DETENER CEO
  =============================== */

  detener(){

    if(this.interval){
      clearInterval(this.interval);
      this.interval = null;
    }

    this.estado.activo = false;

    console.log("🛑 CEO Autónomo detenido");
  }

  /* ===============================
  MOTOR PRINCIPAL
  =============================== */

  async ejecutar(state){

    try{

      console.log("🧠 CEO analizando negocio...");

      if(!state?.empresaId){
        console.warn("⚠️ empresaId no definido");
        return;
      }

      // 🔥 Obtener datos desde window (ya cargados por módulos)
      const ordenes = window.__ordenes || [];
      const inventario = window.__inventario || [];

      if(!ordenes.length){
        console.warn("⚠️ No hay datos para análisis");
        return;
      }

      const data = await generarSugerencias({
        ordenes,
        inventario,
        empresaId: state.empresaId
      });

      this.estado.ultimaEjecucion = new Date();

      this.tomarDecisiones(data);

    }
    catch(error){
      console.error("❌ Error CEO Autónomo:", error);
    }
  }

  /* ===============================
  DECISIONES AUTOMÁTICAS
  =============================== */

  tomarDecisiones(data){

    const sugerencias = data?.sugerencias || [];

    console.log("👑 CEO decisiones:");

    sugerencias.forEach(s => {

      console.log("➡️", s);

      /* ===============================
      REGLAS AUTOMÁTICAS
      =============================== */

      if(s.includes("Stock crítico")){
        this.alertar("⚠️ Comprar repuestos urgente");
      }

      if(s.includes("Margen promedio")){
        const margen = parseFloat(s.match(/[\d.]+/)?.[0] || 0);

        if(margen < 30){
          this.alertar("📉 Margen bajo: subir precios o reducir costos");
        }
      }

      if(s.includes("Reaprovisiona")){
        this.alertar("📦 Reposición recomendada");
      }

    });

  }

  /* ===============================
  ALERTAS INTELIGENTES
  =============================== */

  alertar(msg){

    console.warn("🚨 CEO ALERTA:", msg);

    // 🔔 Notificación simple (puedes conectar con UI o WhatsApp)
    if(typeof window !== "undefined"){
      window.dispatchEvent(new CustomEvent("ceo:alert", {
        detail: { mensaje: msg }
      }));
    }

  }

}

/* ===============================
INSTANCIA GLOBAL
=============================== */

const ceoAutonomo = new CEOAutonomo();

export default ceoAutonomo;

if(typeof window !== "undefined"){
  window.CEO = ceoAutonomo;
}