import { getNowDate, getNowTime, getUnix } from '@utils/calendar';
import { BillType, ImportBillType, ExportBillType } from './enums';
import { DateReq, TimeReq } from './interfaces';

export interface Bill {
  date: DateReq;
  time: TimeReq;
  mode: BillType;
  amount: number;
  remark: string;
  unix: number;
  type: ImportBillType | ExportBillType;
}

interface ImportBillT extends Bill {}

interface ExportBillT extends Bill {}

export class ImportBill implements ImportBillT {
  date: DateReq;
  time: TimeReq;
  mode: BillType;
  amount: number;
  remark: string;
  type: ImportBillType;
  unix: number;

  constructor(
    amount: number,
    remark: string,
    type: ImportBillType,
    date: DateReq
  ) {
    this.time = getNowTime();
    this.unix = getUnix();
    this.date = date;
    this.mode = BillType.Import;
    this.amount = amount;
    this.remark = remark;
    this.type = type;
  }
}

export class ExportBill implements ExportBillT {
  date: DateReq;
  time: TimeReq;
  mode: BillType;
  amount: number;
  remark: string;
  type: ExportBillType;
  unix: number;

  constructor(
    amount: number,
    remark: string,
    type: ExportBillType,
    date: DateReq
  ) {
    this.time = getNowTime();
    this.unix = getUnix();
    this.date = date;
    this.mode = BillType.Export;
    this.amount = amount;
    this.remark = remark;
    this.type = type;
  }
}
