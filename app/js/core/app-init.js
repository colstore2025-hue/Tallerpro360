import { panel } from "../modules/panel.js";

export async function iniciarApp(){

console.log("🚀 iniciarApp");

const container=document.getElementById("appContent");

if(!container){

console.error("No existe appContent");
return;

}

let uid=localStorage.getItem("uid");

/* SOLO PARA PRUEBA */

if(!uid){

uid="demoUser";
localStorage.setItem("uid",uid);

}

await panel(container,uid);

}