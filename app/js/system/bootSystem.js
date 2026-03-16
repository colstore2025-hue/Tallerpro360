/**
 * bootSystem.js
 */

import { iniciarApp } from "../core/app-init.js";

export async function bootSystem(){

console.log("🚀 Boot ERP iniciado");

const uid = localStorage.getItem("uid");

if(!uid){

location.href="/login.html";
return;

}

await iniciarApp();

}