import { ImportBill } from '@PO/Bill';
import { DateReq } from '@PO/interfaces';
import { db } from './db';

export function insert(bill: ImportBill) {
  return db.importBill.add(bill);
}

export function del(key: number) {
  return db.importBill.delete(key);
}

export function update(key: number, bill: Partial<ImportBill>) {
  return db.importBill.update(key, bill);
}

export function findByKey(key: number) {
  return db.importBill.get(key);
}

export function findByDate(date: DateReq) {
  const dateStr = `${date.year}-${date.month}-${date.day}`;
  return db.importBill.where('dateStr').equals(dateStr).toArray();
}

export function findByMonth(date: DateReq) {
  const dateStrPre = `${date.year}-${date.month}`;
  return db.importBill.where('dateStr').startsWith(dateStrPre).toArray();
}

export function findByYear(date: DateReq) {
  const dateStrPre = `${date.year}`;
  return db.importBill.where('dateStr').startsWith(dateStrPre).toArray();
}

export function findAll() {
  return db.importBill.toArray();
}
