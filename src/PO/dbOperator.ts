import { include, INDEXEDDB, MYSQL } from '@constants/dataOrigin';
import { Bill, ExportBill, ImportBill } from './Bill';
import * as exportOp from '@database/exportBillOp';
import * as importOp from '@database/importBillOp';
import { BillType } from './enums';

type Create = (bill: ImportBill | ExportBill, mode: number) => Promise<number>;

function isImportBill(bill: ImportBill | ExportBill): bill is ImportBill {
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
