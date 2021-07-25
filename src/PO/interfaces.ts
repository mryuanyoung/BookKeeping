import { Bill } from './Bill';
import { ContainerType } from './enums';

export interface Container {
  type: ContainerType;
  dateAttr: DateAttr;
}

export interface SpanContainer extends Container {
  containers: Container[];
}
export interface DayContainer extends Container {
  bills: Bill[];
}

export interface DateAttr {
  year: number,
  month?: number,
  day?: number,
}

export interface DateReq {
  year: number,
  month: number,
  day: number,
}

export interface TimeReq {
  hour: number,
  minute: number,
  second: number,
}

