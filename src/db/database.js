import Dexie from 'dexie';

export const db = new Dexie('DeliveryAppDB');

// අනිවාර්යයෙන්ම Version එක 2 විය යුතුයි
db.version(2).stores({
  settings: '++id, businessName, address, phone1, phone2, regNumber, syncStatus',
  profile: '++id, syncStatus',
  routes: '++id, routeName, syncStatus',
  shops: '++id, shopName, routeId, address, phone, syncStatus',
  items: '++id, itemName, unit, unitPrice, syncStatus',
  bills: '++id, date, shopId, totalAmount, receivedAmount, dueAmount, pastDueReceived, remarks, syncStatus',
  billItems: '++id, billId, itemId, quantity, pricePerUnit, subTotal, syncStatus',
  expenses: '++id, date, type, syncStatus'
});