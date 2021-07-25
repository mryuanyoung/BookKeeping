import { Container, SpanContainer, DayContainer, DateAttr } from "./interfaces";
import { Bill } from './Bill';
import { ContainerType } from './enums';
import { getDaysOfMonth, getNowDate } from "@utils/calendar";
import moment from "moment";

export class RootContainer implements Container {
  type: ContainerType;
  dateAttr: DateAttr;
  containers: { [key: number]: BillSpanContainer };

  constructor() {
    this.type = ContainerType.Root;
    this.dateAttr = getNowDate();
    this.containers = {};
  }

  createAnnualBill(year?: number) {
    year = year || moment().year();
    if (this.containers[year]) {
      throw Error(`年份: ${year} 已存在`);
    }
    const cont = new BillSpanContainer(ContainerType.Year, { year });
    this.containers[year] = cont;
  }
}

export class BillSpanContainer implements SpanContainer {

  type: ContainerType;
  dateAttr: DateAttr;
  containers: SpanContainer[] | DayContainer[];

  constructor(type: ContainerType, dateAttr: DateAttr) {
    this.type = type;
    this.dateAttr = dateAttr;
    switch (type) {
      case ContainerType.Year:
        this.containers = Array.from(Array(12).keys()).map(idx =>
          new BillSpanContainer(
            ContainerType.Month,
            {
              year: dateAttr.year,
              month: idx + 1
            }));
        break;
      case ContainerType.Month:
        const { year, month } = dateAttr;
        const totalDays = getDaysOfMonth(year, month!);
        this.containers = Array.from(Array(totalDays).keys()).map(idx =>
          new BillDayContainer({
            day: idx + 1,
            year,
            month,
          }));
        break;
      default:
        throw Error('此类型的容器仅包含年账单和月账单');
    }
  }
}

export class BillDayContainer implements DayContainer {
  type: ContainerType;
  dateAttr: DateAttr;
  #bills: Bill[];

  constructor(dateAttr: DateAttr) {
    this.type = ContainerType.Day;
    this.dateAttr = dateAttr;
    this.#bills = [];
  }

  get bills() {
    return this.#bills;
  }
}