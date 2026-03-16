/*
=====================================
dashboard.js
panel principal gerente
tallerpro360
=====================================
*/

export async function dashboard(container){

container.innerHTML=`

<h1 style="font-size:28px;margin-bottom:20px;">
🚀 dashboard tallerpro360
</h1>


<div style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
gap:20px;
">

<div style="
background:#020617;
padding:20px;
border-radius:10px;
border:1px solid #1e293b;
">
<h3>órdenes activas</h3>
<p style="font-size:28px">0</p>
</div>


<div style="
background:#020617;
padding:20px;
border-radius:10px;
border:1px solid #1e293b;
">
<h3>clientes registrados</h3>
<p style="font-size:28px">0</p>
</div>


<div style="
background:#020617;
padding:20px;
border-radius:10px;
border:1px solid #1e293b;
">
<h3>repuestos inventario</h3>
<p style="font-size:28px">0</p>
</div>


<div style="
background:#020617;
padding:20px;
border-radius:10px;
border:1px solid #1e293b;
">
<h3>ingresos hoy</h3>
<p style="font-size:28px">$0</p>
</div>

</div>


<div style="
margin-top:30px;
background:#020617;
padding:20px;
border-radius:10px;
border:1px solid #1e293b;
">

<h2>actividad reciente</h2>

<p style="color:#94a3b8">
el sistema está funcionando correctamente
</p>

</div>

`;

}