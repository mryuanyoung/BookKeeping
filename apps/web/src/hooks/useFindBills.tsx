import { Bill, ExportBill, ImportBill } from '@PO/Bill';
import { getNowDate } from '@utils/calendar';
import { useEffect, useState } from 'react';
import * as ex from '@database/exportBillOp';
import * as im from '@database/importBillOp';
import {
  DateAttr,
  DateReq,
  DayContainer,
  Container,
  SpanContainer
} from '@PO/interfaces';
import { BillSpan, BillType, ContainerType } from '@PO/enums';

interface Props {
  date: DateReq;
  span: BillSpan;
  fresh: boolean;
}

const ExApi = {
  [BillSpan.Day]: ex.findByDate,
  [BillSpan.Month]: ex.findByMonth,
  [BillSpan.Year]: ex.findByYear,
  [BillSpan.Whole]: ex.findAll
};

const ImApi = {
  [BillSpan.Day]: im.findByDate,
  [BillSpan.Month]: im.findByMonth,
  [BillSpan.Year]: im.findByYear,
  [BillSpan.Whole]: im.findAll
};

export class DayContainerVO implements DayContainer {
  bills: Bill[];
  type: ContainerType;
  dateAttr: DateAttr;
  totalImportAmount: number;
  totalExportAmount: number;

  constructor(
    type: ContainerType,
    dateAttr: DateAttr,
    exportBills?: ExportBill[],
    importBills?: ImportBill[]
  ) {
    this.type = type;
    this.dateAttr = dateAttr;
    if (!(exportBills && importBills)) {
      this.bills = [];
      this.totalImportAmount = 0;
      this.totalExportAmount = 0;
      return;
    }
    this.bills = [...exportBills, ...importBills];
    this.totalImportAmount = importBills.reduce(
      (prev, bill) => prev + bill.amount,
      0
    );
    this.totalExportAmount = exportBills.reduce(
      (prev, bill) => prev + bill.amount,
      0
    );
  }
}

export class MonthContainerVO implements SpanContainer {
  type: ContainerType;
  dateAttr: DateAttr;
  totalImportAmount: number;
  totalExportAmount: number;
  containers: DayContainerVO[];

  constructor(
    type: ContainerType,
    dateAttr: DateAttr,
    exportBills?: ExportBill[],
    importBills?: ImportBill[]
  ) {
    this.type = type;
    this.dateAttr = dateAttr;

    this.containers = Array(31);
    if (!(exportBills && importBills)) {
      this.totalExportAmount = 0;
      this.totalImportAmount = 0;
      return;
    }

    this.mapBillToContainer(exportBills);
    this.mapBillToContainer(importBills);

    let totalImport = 0,
      totalExport = 0;
    this.containers.forEach(dayContainer => {
      let im = 0,
        ex = 0;
      dayContainer.bills.forEach(bill => {
        if (bill.mode === BillType.Export) {
          ex += bill.amount;
        } else {
          im += bill.amount;
        }
      });
      dayContainer.totalExportAmount = ex;
      dayContainer.totalImportAmount = im;
      totalExport += ex;
      totalImport += im;
    });
    this.totalExportAmount = totalExport;
    this.totalImportAmount = totalImport;
  }

  mapBillToContainer(bills: Bill[]) {
    bills.forEach(bill => {
      if (!this.containers[bill.date.day - 1]) {
        this.containers[bill.date.day - 1] = new DayContainerVO(
          ContainerType.Day,
          bill.date
        );
      }
      this.containers[bill.date.day - 1].bills.push(bill);
    });
  }
}

export class YearContainerVO implements SpanContainer {
  type: ContainerType;
  dateAttr: DateAttr;
  totalImportAmount: number;
  totalExportAmount: number;
  containers: MonthContainerVO[];

  constructor(
    type: ContainerType,
    dateAttr: DateAttr,
    exportBills?: ExportBill[],
    importBills?: ImportBill[]
  ) {
    this.type = type;
    this.dateAttr = dateAttr;
    this.containers = Array(12);
    if (!(exportBills && importBills)) {
      this.totalExportAmount = 0;
      this.totalImportAmount = 0;
      return;
    }

    this.mapBillToContainer(exportBills);
    this.mapBillToContainer(importBills);

    let totalImport = 0,
      totalExport = 0;
    this.containers.forEach(monthContainer => {
      let mex = 0,
        mim = 0;

      monthContainer.containers.forEach(dayContainer => {
        let im = 0,
          ex = 0;

        dayContainer.bills.forEach(bill => {
          if (bill.mode === BillType.Export) {
            ex += bill.amount;
          } else {
            im += bill.amount;
          }
        });
        dayContainer.totalExportAmount = ex;
        dayContainer.totalImportAmount = im;
        mex += ex;
        mim += im;
      });

      monthContainer.totalExportAmount = mex;
      monthContainer.totalImportAmount = mim;
      totalExport += mex;
      totalImport += mim;
    });

    this.totalExportAmount = totalExport;
    this.totalImportAmount = totalImport;
  }

  mapBillToContainer(bills: Bill[]) {
    bills.forEach(bill => {
      if (!this.containers[bill.date.month - 1]) {
        this.containers[bill.date.month - 1] = new MonthContainerVO(
          ContainerType.Month,
          bill.date
        );
      }

      if (!this.containers[bill.date.month - 1].containers[bill.date.day - 1]) {
        this.containers[bill.date.month - 1].containers[bill.date.day - 1] =
          new DayContainerVO(ContainerType.Day, bill.date);
      }

      try {
        this.containers[bill.date.month - 1].containers[
          bill.date.day - 1
        ].bills.push(bill);
      } catch (err) {
        console.log('error]', this, bill);
      }
    });
  }
}

function VOFactory(
  date: DateReq,
  span: BillSpan,
  exportBills?: ExportBill[],
  importBills?: ImportBill[]
) {
  switch (span) {
    case BillSpan.Day:
      return new DayContainerVO(
        ContainerType.Day,
        date,
        exportBills,
        importBills
      );
    case BillSpan.Month:
      return new MonthContainerVO(
        ContainerType.Month,
        date,
        exportBills,
        importBills
      );
    case BillSpan.Year:
      return new YearContainerVO(
        ContainerType.Year,
        date,
        exportBills,
        importBills
      );
    default:
      return {} as DayContainerVO;
  }
}

const useFindBills = (props: Props) => {
  const { date, span, fresh } = props;

  const [vo, setVO] = useState<
    DayContainerVO | MonthContainerVO | YearContainerVO
  >(VOFactory(date, span));

  useEffect(() => {
    (async function () {
      const d = date || getNowDate();
      const all = await Promise.all([ExApi[span](d), ImApi[span](d)]);
      const obj = VOFactory(date, span, all[0], all[1]);
      setVO(obj);
    })();
  }, [fresh]);

  return vo;
};

export default useFindBills;
