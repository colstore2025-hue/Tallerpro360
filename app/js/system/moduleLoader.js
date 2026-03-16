class ModuleLoader{

constructor(){

this.modules={};

}

register(name,fn){

this.modules[name]=fn;

console.log("📦 módulo registrado:",name);

}

async load(name,container,userId){

const mod=this.modules[name];

if(!mod){

container.innerHTML=`Módulo ${name} no encontrado`;

return;

}

try{

await mod(container,userId);

}
catch(e){

console.error("Error módulo:",name,e);

container.innerHTML=`
<h2>Error cargando módulo ${name}</h2>
`;

}

}

}

export const moduleLoader=new ModuleLoader();