/*
=====================================
dashboard.js
dashboard erp
tallerpro360
=====================================
*/

export async function dashboard(container,userId){

console.log("📊 cargando dashboard");

container.innerHTML=`

<h1 style="font-size:28px;margin-bottom:20px">
dashboard
</h1>

<p>bienvenido al erp tallerpro360</p>

<div style="margin-top:30px">

<div style="
background:#0f172a;
padding:20px;
border-radius:10px;
margin-bottom:15px
">

órdenes del día: 0

</div>

<div style="
background:#0f172a;
padding:20px;
border-radius:10px;
margin-bottom:15px
">

ingresos del día: $0

</div>

<div style="
background:#0f172a;
padding:20px;
border-radius:10px
">

clientes activos: 0

</div>

</div>

`;

}