import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

export async function pagarPlan(planId){

  const user = auth.currentUser;

  if(!user){
    alert("Debes iniciar sesión");
    return;
  }

  const token = await user.getIdToken();

  const resp = await fetch("/api/crearPago",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      uid: user.uid,
      planId: planId
    })
  });

  const data = await resp.json();

  if(data.init_point){
    window.location.href = data.init_point;
  }else{
    alert("Error creando el pago");
  }

}