import { getNowDate, getNowTime, getUnix } from '@utils/calendar';
import { BillType, ImportBillType, ExportBillType } from './enums';
import { DateReq, TimeReq } from './interfaces';

export interface Bill {
  id?: number;
  dateStr: string;
  date: DateReq;
  time: TimeReq;
  mode: BillType;
  amount: number;
  remark: string;
  unix: number;
  type: string;
}

interface ImportBillT extends Bill {
  type: ImportBillType;
}

interface ExportBillT extends Bill {
  type: ExportBillType;
}

export class ImportBill implements ImportBillT {
  id?: number | undefined;
  date: DateReq;
  dateStr: string;
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
    this.dateStr = `${date.year}-${date.month}-${date.day}`;
    this.mode = BillType.Import;
    this.amount = amount;
    this.remark = remark;
    this.type = type;
  }
}

export class ExportBill implements ExportBillT {
  id?: number | undefined;
  date: DateReq;
  dateStr: string;
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
    this.dateStr = `${date.year}-${date.month}-${date.day}`;
    this.mode = BillType.Export;
    this.amount = amount;
    this.remark = remark;
    this.type = type;
  }
}
