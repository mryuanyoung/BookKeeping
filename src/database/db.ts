import { ExportBill, ImportBill } from '@PO/Bill';
import Dexie, { Table } from 'dexie';

export class BookkeepingDB extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  importBill!: Table<ImportBill>;
  exportBill!: Table<ExportBill>;

  constructor() {
    super('bookkeeping');
    this.version(1).stores({
      importBill: '++id, dateStr, type', // Primary key and indexed props
      exportBill: '++id, dateStr, type'
    });
  }
}

export const db = new BookkeepingDB();
