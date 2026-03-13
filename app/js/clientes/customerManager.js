// customerManager.js
// IA de gestión de clientes para talleres

import { db } from "../core/firebase-config.js";

import {
collection,
addDoc,
getDocs,
query,
where,
updateDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

class CustomerManager {

constructor(){
this.customers = [];
}

/* ===============================
CARGAR CLIENTES
=============================== */

async loadCustomers(){

const snapshot = await getDocs(collection(db,"customers"));

this.customers = snapshot.docs.map(docSnap=>({
id: docSnap.id,
...docSnap.data()
}));

return this.customers;

}

/* ===============================
CREAR CLIENTE
=============================== */

async createCustomer(data){

const newCustomer = {

name: data.name,
phone: data.phone,
vehicle: data.vehicle,
plate: data.plate,

lastVisit: new Date(),
createdAt: new Date()

};

const docRef = await addDoc(
collection(db,"customers"),
newCustomer
);

return docRef.id;

}

/* ===============================
BUSCAR CLIENTE
=============================== */

async searchCustomer(phone){

const q = query(
collection(db,"customers"),
where("phone","==",phone)
);

const snapshot = await getDocs(q);

if(snapshot.empty) return null;

return {

id: snapshot.docs[0].id,
...snapshot.docs[0].data()

};

}

/* ===============================
ACTUALIZAR VISITA
=============================== */

async updateVisit(customerId){

const ref = doc(db,"customers",customerId);

await updateDoc(ref,{
lastVisit:new Date()
});

}

/* ===============================
PREDICCION REGRESO
=============================== */

predictReturn(customer){

const last = new Date(customer.lastVisit);
const now = new Date();

const days = Math.floor(
(now-last)/(1000*60*60*24)
);

if(days > 180) return "Cliente perdido";
if(days > 90) return "Probable regreso";
if(days > 30) return "Cliente activo";

return "Cliente reciente";

}

}

export default CustomerManager;