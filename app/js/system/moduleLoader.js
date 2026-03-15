/**
 * moduleLoader.js
 * Cargador inteligente de módulos (auto-registro)
 * TallerPRO360
 */

export const moduleLoader = {

  modules:{},

  /* Registrar módulo */
  register(name,fn){
    if(!name || typeof fn!=="function"){
      console.warn("Registro inválido:",name);
      return;
    }
    this.modules[name]=fn;
    console.log("📦 módulo registrado:",name);
  },

  /* Ver módulos registrados */
  list(){
    return Object.keys(this.modules);
  },

  /* Cargar módulo */
  async load(name,container){

    if(!container){
      console.error("Contenedor no válido");
      return;
    }

    container.innerHTML="Cargando módulo...";

    try{

      const module=this.modules[name];

      if(!module){
        throw new Error("Módulo no registrado: "+name);
      }

      await module(container);

      console.log("✅ módulo cargado:",name);

    }catch(e){

      console.error("Error cargando módulo:",name,e);

      container.innerHTML=`
        <div style="padding:30px">
        <h3>Error cargando módulo</h3>
        <p>${name}</p>
        <button onclick="location.reload()">Reiniciar sistema</button>
        </div>
      `;

    }

  },

  diagnostic(){
    console.table(this.list());
  }

};