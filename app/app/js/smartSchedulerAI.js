/**
 * Smart Scheduler AI
 * TallerPRO360
 * Optimización de agenda de trabajo del taller
 */

export class SmartSchedulerAI {

constructor(){

this.tecnicos = []
this.ordenes = []

}


/* ==============================
CARGAR TÉCNICOS
============================== */

cargarTecnicos(listaTecnicos){

this.tecnicos = listaTecnicos.map(t=>{

return {

nombre: t.nombre,
especialidad: t.especialidad || "general",
ordenesAsignadas: 0,
horasDisponibles: t.horasDisponibles || 8

}

})

}


/* ==============================
CARGAR ÓRDENES
============================== */

cargarOrdenes(listaOrdenes){

this.ordenes = listaOrdenes.map(o=>{

return {

id: o.id,
tipo: o.tipo || "general",
prioridad: o.prioridad || "media",
horasEstimadas: o.horasEstimadas || 1

}

})

}


/* ==============================
PRIORIZAR ÓRDENES
============================== */

ordenarPrioridad(){

const prioridadValor = {
alta:3,
media:2,
baja:1
}

this.ordenes.sort((a,b)=>{

return prioridadValor[b.prioridad] - prioridadValor[a.prioridad]

})

}


/* ==============================
BUSCAR MEJOR TÉCNICO
============================== */

buscarTecnico(orden){

let mejor = null
let menorCarga = Infinity

this.tecnicos.forEach(t=>{

const puedeTrabajar = t.horasDisponibles >= orden.horasEstimadas

if(!puedeTrabajar) return

if(t.ordenesAsignadas < menorCarga){

menorCarga = t.ordenesAsignadas
mejor = t

}

})

return mejor

}


/* ==============================
ASIGNAR ÓRDENES
============================== */

asignarOrdenes(){

this.ordenarPrioridad()

let agenda = []

this.ordenes.forEach(orden=>{

const tecnico = this.buscarTecnico(orden)

if(!tecnico){

agenda.push({
ordenId: orden.id,
tecnico: "pendiente"
})

return
}

tecnico.ordenesAsignadas += 1
tecnico.horasDisponibles -= orden.horasEstimadas

agenda.push({

ordenId: orden.id,
tecnico: tecnico.nombre,
horas: orden.horasEstimadas,
prioridad: orden.prioridad

})

})

return agenda

}


/* ==============================
REPORTE IA
============================== */

generarReporte(){

const agenda = this.asignarOrdenes()

return {

agendaOptimizada: agenda,
tecnicos: this.tecnicos,
ordenesPendientes: agenda.filter(a=>a.tecnico === "pendiente").length

}

}

}