/**
 * store.js
 * Estado global y centralizado de TallerPRO360
 */

export const store = {
  user: null,        // info usuario { uid, email, rol }
  empresa: null,     // info empresa { id, nombre }
  cache: {},         // cache de datos temporales
  listeners: [],     // módulos que escuchan cambios
};

/**
 * Actualiza el estado y notifica a los listeners
 */
export function setStore(key, value) {
  store[key] = value;
  store.listeners.forEach(fn => fn(store));
}

/**
 * Permite a un módulo suscribirse a cambios de store
 */
export function subscribe(fn) {
  if (typeof fn === "function") store.listeners.push(fn);
}

/**
 * Devuelve copia del estado global
 */
export function getStore() {
  return { ...store };
}