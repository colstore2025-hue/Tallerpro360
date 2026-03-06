class RepairEstimator {

estimate(diagnosis){

let estimate = {
parts: [],
laborHours: 0,
cost: 0
}

diagnosis.forEach(issue => {

if(issue === "Sobrecalentamiento del motor"){
estimate.parts.push("Termostato")
estimate.laborHours += 2
estimate.cost += 180
}

if(issue === "Batería baja o alternador defectuoso"){
estimate.parts.push("Batería")
estimate.laborHours += 1
estimate.cost += 120
}

if(issue === "Posible desgaste de pastillas"){
estimate.parts.push("Pastillas de freno")
estimate.laborHours += 1.5
estimate.cost += 90
}

})

return estimate

}

}

module.exports = RepairEstimator