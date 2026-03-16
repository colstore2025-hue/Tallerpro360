import { panel } from "../modules/panel.js";

export function iniciarApp(){

const uid=localStorage.getItem("uid");

if(!uid){

location.href="/login.html";

return;

}

const app=document.getElementById("appContent");

panel(app,uid);

}