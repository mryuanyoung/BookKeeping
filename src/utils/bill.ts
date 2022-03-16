import { BillForm } from '@interfaces/billForm';
import { Bill, ExportBill, ImportBill } from '@PO/Bill';
import { ExportBillType, BillType, ImportBillType } from '@PO/enums';

export function buildBill(param: BillForm): Bill {
  const { mode, amount, remark, type, date } = param;
  let bill;
  if (mode === BillType.Export) {
    bill = new ExportBill(amount, remark, type as ExportBillType, date);
  } else {
    bill = new ImportBill(amount, remark, type as ImportBillType, date);
  }
  return bill;
}
