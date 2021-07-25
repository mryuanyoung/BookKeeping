import { Bill } from './Bill';
import { getNowDate } from '@utils/calendar';
import { RootContainer } from './BillContainer';
import { DateReq, DayContainer, SpanContainer } from './interfaces';
import { replaceRootContainer } from '@utils/localStore';

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
  replaceRootContainer(root);
}

export function update(bill: Bill, root: RootContainer) {
  // todo 从记账页面将当日账单修改为其他日期的账单时，会有bug
  const unique_unix = bill.unix;
  const { dayCont } = findContainers(root, bill.date);
  for (let i = 0, len = dayCont.bills.length; i < len; i++) {
    const item = dayCont.bills[i];
    if (item.unix === unique_unix) {
      dayCont.bills[i] = bill;
      break;
    }
  };
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
  dayCont.bills.splice(idx, 1);
  replaceRootContainer(root);
}

export function findDayConsumption(date: DateReq, root: RootContainer) {
  const { dayCont } = findContainers(root, date);
  const bills = dayCont.bills || [];
  return bills;
}

export function findMonthConsumption(date: DateReq, root: RootContainer) {
  const { monthCont } = findContainers(root, date);
  return monthCont;
}

export function findYearConsumption(date: DateReq, root: RootContainer) {
  const { yearCont } = findContainers(root, date);
  return yearCont;
}