/**
 * aiCommandCenter.js
 * Centro de Comandos IA
 * TallerPRO360 ERP - Versión Final
 */

class AICommandCenter {
  constructor(){
    console.log("🤖 AI Command Center iniciado");
    this.history = [];
    this.commands = {
      dashboard:["dashboard","inicio","panel","home","panel principal"],
      inventario:["inventario","stock","repuestos","productos","almacen"],
      clientes:["clientes","cliente","buscar cliente","ver clientes","lista clientes"],
      ordenes:["orden","ordenes","orden trabajo","crear orden","nueva orden","orden servicio"],
      finanzas:["finanzas","dinero","estado financiero","ingresos","gastos","contabilidad"],
      pagos:["pagos","facturas","cobros","facturacion","caja"],
      ceo:["ceo","analisis negocio","estado empresa","analisis financiero"]
    };
  }

  normalize(text){
    if(!text) return "";
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  }

  processCommand(text){
    const command = this.normalize(text);
    if(!command) return null;
    for(const module in this.commands){
      const keywords = this.commands[module];
      for(const word of keywords){
        if(command.includes(this.normalize(word))){
          return module;
        }
      }
    }
    return null;
  }

  execute(text){
    try{
      if(!text) return null;
      const module = this.processCommand(text);
      if(!module){
        console.warn("⚠️ Comando no reconocido:",text);
        this.addHistory(text,null);
        return null;
      }
      console.log("🧠 IA abre módulo:",module);
      this.addHistory(text,module);
      this.navigate(module);
      this.emitEvent("ai:navigation",{module});
      return module;
    } catch(error){
      console.error("❌ Error ejecutando comando IA:",error);
      return null;
    }
  }

  navigate(module){
    if(!module) return;
    if(typeof window !== "undefined"){
      window.location.hash = module;
    }
  }

  addHistory(command,module){
    this.history.push({command,module,date:new Date().toISOString()});
    if(this.history.length > 50) this.history.shift();
  }

  getHistory(){ return this.history; }

  clearHistory(){ this.history = []; }

  emitEvent(name,data){
    if(typeof window !== "undefined"){
      window.dispatchEvent(new CustomEvent(name,{detail:data}));
    }
  }
}

const aiCommandCenter = new AICommandCenter();
export default aiCommandCenter;

if(typeof window !== "undefined"){
  window.AICommandCenter = aiCommandCenter;
}