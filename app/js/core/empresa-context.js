/**
 * empresa-context.js
 * TallerPRO360 SaaS
 * Manejo central de empresa activa
 */

const KEY_EMPRESA = "empresaId";


/* ===============================
OBTENER EMPRESA ACTIVA
=============================== */

export function obtenerEmpresaId(){

try{

const empresaId = localStorage.getItem(KEY_EMPRESA);

if(!empresaId){

console.warn("⚠ empresaId no encontrado en localStorage");

return null;

}

return empresaId.trim();

}
catch(error){

console.error("❌ Error obteniendo empresaId:",error);

return null;

}

}


/* ===============================
ESTABLECER EMPRESA ACTIVA
=============================== */

export function establecerEmpresaId(empresaId){

try{

if(!empresaId || empresaId.trim()===""){

console.error("❌ empresaId inválido");

return false;

}

localStorage.setItem(KEY_EMPRESA,empresaId.trim());

console.log("🏢 Empresa activa:",empresaId);

return true;

}
catch(error){

console.error("❌ Error guardando empresaId:",error);

return false;

}

}


/* ===============================
LIMPIAR EMPRESA ACTIVA
=============================== */

export function limpiarEmpresaId(){

try{

localStorage.removeItem(KEY_EMPRESA);

console.log("🧹 empresaId eliminado");

}
catch(error){

console.error("❌ Error limpiando empresaId:",error);

}

}


/* ===============================
VALIDAR CONTEXTO DE EMPRESA
=============================== */

export function validarEmpresa(){

const empresaId = obtenerEmpresaId();

if(!empresaId){

console.warn("⚠ No hay empresa activa");

return false;

}

return true;

}