import { Bill } from './Bill';
import { getNowDate } from '@utils/calendar';
import { RootContainer } from './BillContainer';
import { DayContainer, SpanContainer } from './interfaces';
import { replaceRootContainer } from '@utils/localStore';

function findContainers(root: RootContainer) {
  const { year, month, day } = getNowDate();
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
  const { dayCont } = findContainers(root);
  if (!dayCont.bills) {
    dayCont.bills = [];
  }
  dayCont.bills.push(bill);
  replaceRootContainer(root);
}

export function findTodayConsumption(root: RootContainer) {
  const { dayCont } = findContainers(root);
  const bills = dayCont.bills || [];
  return bills;
}