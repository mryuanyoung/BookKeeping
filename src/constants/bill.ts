import { BillType, ExportBillType, ImportBillType } from '@PO/enums';
import {Bill} from '@PO/Bill';

export const defaultBillForm: Bill  = {
  amount: 0,
  mode: BillType.Export,
  type: ExportBillType.Meal,
  remark: '',
} as Bill