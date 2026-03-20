/**
 * aiCommandCenter.js
 * Centro de Comandos IA PRO360 · FIX TOTAL
 */

class AICommandCenter {

  constructor(){
    console.log("🤖 AI Command Center iniciado");

    this.history = [];

    this.commands = {
      dashboard:["dashboard","inicio","panel","home"],
      inventario:["inventario","stock","repuestos","almacen"],
      clientes:["clientes","cliente","lista clientes"],
      ordenes:["orden","ordenes","crear orden","nueva orden"],
      finanzas:["finanzas","ingresos","gastos","contabilidad"],
      pagos:["pagos","facturas","cobros"],
      ceoAI:["ceo","analisis negocio","estado empresa"]
    };
  }

  /* =========================
  NORMALIZAR TEXTO
  ========================= */
  normalize(text){
    if(!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .trim();
  }

  /* =========================
  DETECTAR COMANDO
  ========================= */
  processCommand(text){

    const command = this.normalize(text);
    if(!command) return null;

    for(const module in this.commands){

      for(const word of this.commands[module]){

        if(command.includes(this.normalize(word))){
          return module;
        }
      }
    }

    return null;
  }

  /* =========================
  EJECUTAR
  ========================= */
  execute(text){

    try{

      const module = this.processCommand(text);

      if(!module){

        console.warn("⚠️ Comando no reconocido:", text);
        this.addHistory(text, null);
        this.emitEvent("ai:error",{text});

        return null;
      }

      console.log("🧠 IA detectó módulo:", module);

      this.addHistory(text, module);

      /* 🔥 NAVEGACIÓN CORRECTA */
      if(typeof window !== "undefined" && window.navigate){
        window.navigate(module);
      }

      this.emitEvent("ai:navigation",{module});

      return module;

    } catch(error){

      console.error("❌ Error ejecutando comando IA:", error);
      return null;
    }
  }

  /* =========================
  HISTORIAL
  ========================= */
  addHistory(command, module){

    this.history.push({
      command,
      module,
      date: new Date().toISOString()
    });

    if(this.history.length > 50){
      this.history.shift();
    }
  }

  getHistory(){
    return this.history;
  }

  clearHistory(){
    this.history = [];
  }

  /* =========================
  EVENTOS
  ========================= */
  emitEvent(name,data){

    if(typeof window !== "undefined"){
      window.dispatchEvent(new CustomEvent(name,{detail:data}));
    }
  }
}

/* =========================
EXPORT
========================= */
const aiCommandCenter = new AICommandCenter();

export default aiCommandCenter;

/* 🔥 GLOBAL DEBUG */
if(typeof window !== "undefined"){
  window.aiCommandCenter = aiCommandCenter;
}