import { ExportBill } from '@PO/Bill';
import { DateReq } from '@PO/interfaces';
import { db } from './db';

export function insert(bill: ExportBill) {
  return db.exportBill.add(bill);
}

export function del(key: number) {
  return db.exportBill.delete(key);
}

export function update(key: number, bill: Partial<ExportBill>) {
  return db.exportBill.update(key, bill);
}

export function findByKey(key: number) {
  return db.exportBill.get(key);
}

export function findByDate(date: DateReq) {
  const dateStr = `${date.year}-${date.month}-${date.day}`;
  return db.exportBill.where('dateStr').equals(dateStr).toArray();
}

export function findByMonth(date: DateReq) {
  const dateStrPre = `${date.year}-${date.month}`;
  return db.exportBill.where('dateStr').startsWith(dateStrPre).toArray();
}

export function findByYear(date: DateReq) {
  const dateStrPre = `${date.year}`;
  return db.exportBill.where('dateStr').startsWith(dateStrPre).toArray();
}

export function findAll() {
  return db.exportBill.toArray();
}
