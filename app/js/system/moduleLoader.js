/**
 * moduleLoader.js
 * Cargador inteligente de módulos
 * TallerPRO360 ERP
 */

export const moduleLoader = {

  modules:{},

  /* =====================================
  REGISTRAR MÓDULO
  ===================================== */

  register(name,fn){

    if(!name){
      console.warn("⚠ Nombre de módulo inválido");
      return;
    }

    if(typeof fn!=="function"){
      console.warn("⚠ El módulo no es función:",name);
      return;
    }

    const key = name.toLowerCase();

    if(this.modules[key]){
      console.warn("⚠ Módulo ya registrado:",key);
      return;
    }

    this.modules[key] = fn;

    console.log("📦 módulo registrado:",key);

  },


  /* =====================================
  LISTAR MÓDULOS
  ===================================== */

  list(){

    return Object.keys(this.modules);

  },


  /* =====================================
  CARGAR MÓDULO
  ===================================== */

  async load(name,container){

    if(!container){
      console.error("❌ Contenedor no válido");
      return;
    }

    const key = name.toLowerCase();

    container.innerHTML=`
      <div style="padding:20px">
      ⏳ Cargando ${key}...
      </div>
    `;

    try{

      const module = this.modules[key];

      if(!module){

        console.error("❌ módulo no registrado:",key);

        container.innerHTML=`
          <div style="padding:30px">
          <h3>⚠ Módulo no disponible</h3>
          <p>${key}</p>
          </div>
        `;

        return;

      }

      if(typeof module !== "function"){
        throw new Error("El módulo no es ejecutable");
      }

      await module(container);

      console.log("✅ módulo cargado:",key);

    }
    catch(e){

      console.error("❌ Error cargando módulo:",key,e);

      container.innerHTML=`
        <div style="padding:30px">
        <h3>⚠ Error cargando módulo</h3>
        <p>${key}</p>

        <button onclick="location.reload()"
        style="
        padding:10px;
        border:none;
        background:#dc2626;
        color:white;
        border-radius:6px;
        cursor:pointer;
        ">
        Reiniciar sistema
        </button>

        </div>
      `;

    }

  },


  /* =====================================
  DIAGNÓSTICO DEL SISTEMA
  ===================================== */

  diagnostic(){

    const list = this.list();

    console.log("🧠 Diagnóstico ModuleLoader");

    if(list.length===0){
      console.warn("⚠ No hay módulos registrados");
    }

    console.table(list);

    return list;

  }

};