import { Bill, ExportBill, ImportBill } from '@PO/Bill';
import {
  BillDayContainer,
  BillSpanContainer,
  RootContainer
} from '@PO/BillContainer';
import { BillType } from '@PO/enums';
import { SpanContainer } from '@PO/interfaces';
import Dexie, { Table } from 'dexie';

export class BookkeepingDB extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  importBill!: Table<ImportBill, number>;
  exportBill!: Table<ExportBill, number>;

  constructor() {
    super('bookkeeping');
    this.version(1).stores({
      importBill: '++id, dateStr, type', // Primary key and indexed props
      exportBill: '++id, dateStr, type'
    });
  }
}

const db = new BookkeepingDB();

function importJSONToIndexedDB(text: string) {
  try {
    const json = JSON.parse(text) as RootContainer;
    const importBills: ImportBill[] = [],
      exportBills: ExportBill[] = [];

    Object.keys(json.containers).forEach(key => {
      json.containers[parseInt(key)].containers.forEach(monthContainer => {
        if (!(monthContainer as BillSpanContainer).containers) {
          return;
        }
        (monthContainer as BillSpanContainer).containers.forEach(
          dayContainer => {
            if (!(dayContainer as BillDayContainer).bills) {
              return;
            }
            (dayContainer as BillDayContainer).bills.forEach(bill => {
              bill.dateStr = `${bill.date.year}-${bill.date.month}-${bill.date.day}`;
              if (bill.mode === BillType.Export) {
                exportBills.push(bill as ExportBill);
              } else {
                importBills.push(bill as ImportBill);
              }
            });
          }
        );
      });
    });

    console.log(importBills, exportBills);
    db.importBill.toCollection().delete();
    db.importBill
      .bulkAdd(importBills)
      .then(_ => console.log('import importBills success!'));

    db.exportBill.toCollection().delete();
    db.exportBill
      .bulkAdd(exportBills)
      .then(_ => console.log('import exportBills success!'));
  } catch (err) {
    throw err;
  }
}

export { db, importJSONToIndexedDB };
