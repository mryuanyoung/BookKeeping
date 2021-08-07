import { Bill } from './Bill';
import { getNowDate, getNowTime, getUnix, sameDate } from '@utils/calendar';
import { RootContainer } from './BillContainer';
import { DateReq, DayContainer, SpanContainer } from './interfaces';
import { replaceRootContainer } from '@utils/localStore';
import { BillType } from './enums';

function findContainers(root: RootContainer, date: DateReq) {
  const { year, month, day } = date || getNowDate();
  const yearCont = root.containers[year];
  const monthCont = yearCont.containers[month - 1] as SpanContainer;
  const dayCont = monthCont.containers[day - 1] as DayContainer;
  return {
    yearCont,
    monthCont,
    dayCont,
  }
}

export function create(bill: Bill, root: RootContainer) {
  const { dayCont } = findContainers(root, bill.date);
  if (!dayCont.bills) {
    dayCont.bills = [];
  }
  dayCont.bills.push(bill);
  if (bill.mode === BillType.Import) {
    dayCont.totalImportAmount += bill.amount;
  }
  else {
    dayCont.totalExportAmount += bill.amount;
  }
  replaceRootContainer(root);
}

export function update(targetBill: Bill, sourceBill: Bill, root: RootContainer,) {
  const unique_unix = targetBill.unix;
  const sourceDate = sourceBill.date;
  const { dayCont: targetDayCont } = findContainers(root, targetBill.date);
  if (!sameDate(sourceDate, targetBill.date)) {
    // 修改非当日记账
    // target中添加
    targetBill.time = getNowTime();
    create(targetBill, root);
    // source中删除
    del(targetBill.unix, sourceDate, root);
  }
  else {
    // 修改当日记账
    for (let i = 0, len = targetDayCont.bills.length; i < len; i++) {
      const item = targetDayCont.bills[i];
      if (item.unix === unique_unix) {
        targetDayCont.bills[i] = targetBill;
        if (targetBill.mode !== sourceBill.mode || targetBill.amount !== sourceBill.amount) {
          // 涉及到总额修改
          // 去除source的金额
          if (sourceBill.mode === BillType.Export) {
            targetDayCont.totalExportAmount -= sourceBill.amount;
          }
          else {
            targetDayCont.totalImportAmount -= sourceBill.amount;
          }
          // 记录target的金额
          if (targetBill.mode === BillType.Import) {
            targetDayCont.totalImportAmount += targetBill.amount;
          }
          else {
            targetDayCont.totalExportAmount += targetBill.amount;
          }
        }
        break;
      }
    };
  }
  replaceRootContainer(root);
}

export function del(unix: number, date: DateReq, root: RootContainer) {
  const { dayCont } = findContainers(root, date);
  let idx = -1;
  for (let i = 0, len = dayCont.bills.length; i < len; i++) {
    const item = dayCont.bills[i];
    if (item.unix === unix) {
      idx = i;
    }
  };
  if (idx < 0) throw Error('删除失败');
  const bill = dayCont.bills[idx];
  if (bill.mode === BillType.Import) {
    dayCont.totalImportAmount -= bill.amount;
  }
  else {
    dayCont.totalExportAmount -= bill.amount;
  }
  dayCont.bills.splice(idx, 1);
  replaceRootContainer(root);
}

export function findDayConsumption(date: DateReq, root: RootContainer) {
  const { dayCont } = findContainers(root, date);
  const bills = dayCont.bills || [];
  return { container: dayCont, bills };
}

export function findMonthConsumption(date: DateReq, root: RootContainer) {
  const { monthCont } = findContainers(root, date);
  return monthCont;
}

export function findYearConsumption(date: DateReq, root: RootContainer) {
  const { yearCont } = findContainers(root, date);
  return yearCont;
}

export function clearAndReCalcAccount(root: RootContainer) {
  Object.keys(root.containers).forEach(year => {
    const yearCont = root.containers[parseInt(year)];
    yearCont.totalImportAmount = 0;
    yearCont.totalExportAmount = 0;

    yearCont.containers.forEach(monthCont => {
      monthCont.totalExportAmount = 0;
      monthCont.totalImportAmount = 0;

      (monthCont as SpanContainer).containers.forEach(dayCont => {
        const DayCont = (dayCont as DayContainer);
        DayCont.totalImportAmount = 0;
        DayCont.totalExportAmount = 0;

        DayCont.bills && DayCont.bills.forEach(dayBill => {
          if (dayBill.mode === BillType.Export) {
            DayCont.totalExportAmount += dayBill.amount;
          }
          else {
            DayCont.totalImportAmount += dayBill.amount;
          }
        })

        monthCont.totalExportAmount += DayCont.totalExportAmount;
        monthCont.totalImportAmount += DayCont.totalImportAmount;
      })

      yearCont.totalExportAmount += monthCont.totalExportAmount;
      yearCont.totalImportAmount += monthCont.totalImportAmount;
    })
  })
  replaceRootContainer(root);
}