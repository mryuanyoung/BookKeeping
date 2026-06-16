import { include, INDEXEDDB, MYSQL } from '@constants/dataOrigin';
import { Bill, ExportBill, ImportBill } from './Bill';
import * as exportOp from '@database/exportBillOp';
import * as importOp from '@database/importBillOp';
import { BillType } from './enums';
import { db } from '@database/db';
import moment from 'moment';

export type Variant = ImportBill | ExportBill;
type Create = (bill: Variant, mode: number) => Promise<number>;

function isImportBill(bill: Bill): bill is ImportBill {
  return bill.mode === BillType.Import;
}

export const create: Create = async function (bill, mode) {
  try {
    let key = -1;
    if (include(mode, INDEXEDDB)) {
      if (isImportBill(bill)) {
        key = await importOp.insert(bill);
      } else {
        key = await exportOp.insert(bill);
      }
    }

    if (include(mode, MYSQL)) {
      // todo 待后端
    }

    return key;
  } catch (err) {
    return -1;
  }
};

export async function update(target: Bill, origin: Bill, mode: number) {
  target.dateStr = `${target.date.year}-${target.date.month}-${target.date.day}`;

  if (include(mode, INDEXEDDB)) {
    if (target.mode !== origin.mode) {
      // 跨表修改
      db.transaction('rw', db.importBill, db.exportBill, async () => {
        if (isImportBill(target)) {
          await exportOp.del(origin.id!);
          delete target.id;
          await importOp.insert(target);
        } else {
          await importOp.del(origin.id!);
          delete target.id;
          await exportOp.insert(target as ExportBill);
        }
      });
    } else {
      if (isImportBill(target)) {
        await importOp.update(target.id!, target);
      } else {
        await exportOp.update(target.id!, target as ExportBill);
      }
    }
  }

  if (include(mode, MYSQL)) {
  }
}

export async function delBill(key: number, type: BillType, mode: number) {
  if (include(mode, INDEXEDDB)) {
    if (type === BillType.Export) {
      await exportOp.del(key);
    } else {
      await importOp.del(key);
    }
  }

  if (include(mode, MYSQL)) {
  }
}
