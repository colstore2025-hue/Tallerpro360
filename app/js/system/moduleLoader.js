class ModuleLoader{

constructor(){

this.modules={};

}

register(name,fn){

this.modules[name]=fn;

console.log("📦 módulo:",name);

}

async load(name,container,userId){

const mod=this.modules[name];

if(!mod){

container.innerHTML="Módulo no encontrado";
return;

}

await mod(container,userId);

}

}

export const moduleLoader=new ModuleLoader();