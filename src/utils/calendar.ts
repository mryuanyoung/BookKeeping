import { DateAttr, DateReq, TimeReq } from "@PO/interfaces";
import moment from "moment";

export function getDaysOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getNowDate(): DateReq {
  const m = moment();
  return {
    year: m.year(),
    month: m.month()+1,
    day: m.date(),
  }
}

export function getNowTime(): TimeReq{
  const m = moment();
  return {
    hour: m.hour(),
    minute: m.minute(),
    second: m.second(),
  }
}

export function getUnix(){
  return moment().unix();
}

export function sameDate(d1: DateReq, d2: DateReq){
  return d1.day === d2.day && d1.month === d2.month && d1.year === d2.year;
}