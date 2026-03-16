/*
=====================================
dashboard.js
Dashboard ERP - TallerPRO360
=====================================
*/

export async function dashboard(container,userId){
  console.log("📊 cargando dashboard");

  container.innerHTML = `
<h1 style="font-size:28px;margin-bottom:20px">📊 Dashboard ERP</h1>
<p>Bienvenido al ERP TallerPRO360</p>

<div style="margin-top:30px">

  <div style="background:#0f172a;padding:20px;border-radius:10px;margin-bottom:15px;color:white;">
    Órdenes del día: <span id="ordenesDia">0</span>
  </div>

  <div style="background:#0f172a;padding:20px;border-radius:10px;margin-bottom:15px;color:white;">
    Ingresos del día: $<span id="ingresosDia">0</span>
  </div>

  <div style="background:#0f172a;padding:20px;border-radius:10px;color:white;">
    Clientes activos: <span id="clientesActivos">0</span>
  </div>

</div>
`;

  // Opcional: aquí puedes cargar datos reales desde Firestore en el futuro
}