/**
 * empresa-context.js
 * TallerPRO360 SaaS
 * Manejo central de empresa activa (VERSIÓN PRO ESTABLE)
 */

const KEY_EMPRESA = "empresaId";

/* ===============================
OBTENER EMPRESA ACTIVA
=============================== */
export function obtenerEmpresaId(){
  try{
    const empresaId = localStorage.getItem(KEY_EMPRESA);

    if(!empresaId || typeof empresaId !== "string"){
      console.warn("⚠ empresaId no encontrado o inválido en localStorage");
      return null;
    }

    return empresaId.trim();

  } catch(error){
    console.error("❌ Error obteniendo empresaId:", error);
    return null;
  }
}

/* ===============================
ESTABLECER EMPRESA ACTIVA
=============================== */
export function establecerEmpresaId(empresaId){
  try{

    if(!empresaId || typeof empresaId !== "string" || empresaId.trim() === ""){
      console.error("❌ empresaId inválido");
      return false;
    }

    const cleanId = empresaId.trim();

    localStorage.setItem(KEY_EMPRESA, cleanId);

    console.log("🏢 Empresa activa:", cleanId);

    return true;

  } catch(error){
    console.error("❌ Error guardando empresaId:", error);
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
  } catch(error){
    console.error("❌ Error limpiando empresaId:", error);
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

/* ===============================
OBTENER EMPRESA (OBLIGATORIO)
🔥 Evita errores silenciosos en módulos críticos
=============================== */
export function getEmpresaIdOrThrow(){
  const empresaId = obtenerEmpresaId();

  if(!empresaId){
    throw new Error("empresaId no definido. Debes iniciar sesión o seleccionar empresa.");
  }

  return empresaId;
}