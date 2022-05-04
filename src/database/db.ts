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
    // 之前json结构的版本
    // const json = JSON.parse(text) as RootContainer;
    // const importBills: ImportBill[] = [],
    //   exportBills: ExportBill[] = [];

    // Object.keys(json.containers).forEach(key => {
    //   json.containers[parseInt(key)].containers.forEach(monthContainer => {
    //     if (!(monthContainer as BillSpanContainer).containers) {
    //       return;
    //     }
    //     (monthContainer as BillSpanContainer).containers.forEach(
    //       dayContainer => {
    //         if (!(dayContainer as BillDayContainer).bills) {
    //           return;
    //         }
    //         (dayContainer as BillDayContainer).bills.forEach(bill => {
    //           bill.dateStr = `${bill.date.year}-${bill.date.month}-${bill.date.day}`;
    //           if (bill.mode === BillType.Export) {
    //             exportBills.push(bill as ExportBill);
    //           } else {
    //             importBills.push(bill as ImportBill);
    //           }
    //         });
    //       }
    //     );
    //   });
    // });

    const json = JSON.parse(text);
    const importBills: ImportBill[] = json.importBill,
      exportBills: ExportBill[] = json.exportBill;

    const ps = [];

    ps.push(
      new Promise((resolve, reject) => {
        db.importBill
          .toCollection()
          .delete()
          .then(() => {
            db.importBill.bulkAdd(importBills).then(_ => {
              console.log('import importBills success!');
              resolve(_);
            });
          })
          .catch(() => reject());
      })
    );

    ps.push(
      new Promise((resolve, reject) => {
        db.exportBill
          .toCollection()
          .delete()
          .then(() => {
            db.exportBill.bulkAdd(exportBills).then(_ => {
              console.log('import exportBills success!');
              resolve(_);
            });
          })
          .catch(() => reject());
      })
    );

    return Promise.all(ps);
  } catch (err) {
    throw err;
  }
}

function getAllData() {
  const json: { [key: string]: any } = {};
  db.tables.forEach(async table => {
    const res = await table.toArray();
    json[table.name] = res;
  });

  const p = db.tables.map(
    table =>
      new Promise<void>(resolve => {
        table.toArray(value => {
          json[table.name] = value;
          resolve();
        });
      })
  );

  return Promise.all(p).then(_ => json);
}

async function exportData() {
  const json = await getAllData();

  const blob = new Blob([JSON.stringify(json)]);
  const urlObj = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'data.json';
  link.style.display = 'none';
  link.href = urlObj;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export { db, importJSONToIndexedDB, exportData, getAllData };
