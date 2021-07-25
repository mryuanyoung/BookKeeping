import { BillType, ExportBillType, ImportBillType } from '@PO/enums';
import { DateReq } from '@PO/interfaces';

export interface BillForm {
  amount: number;
  mode: BillType;
  type: ExportBillType | ImportBillType;
  remark: string,
  date: DateReq,
}