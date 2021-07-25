import React, { useContext } from "react";

import { BillType, ExportBillType, ImportBillType } from '@PO/enums';
import { AccountCtx } from '@assets/../App';
import { ExportBill, ImportBill, Bill } from '@PO/Bill';
import { create, update, del, findDayConsumption, findMonthConsumption, findYearConsumption } from '@PO/Operator';
import { BillForm } from "@interfaces/billForm";
import { buildBill } from "@utils/bill";
import { DateReq } from "@PO/interfaces";
import { getNowDate } from "@utils/calendar";

const useBillOperator = () => {
  const accountCtx = useContext(AccountCtx);

  const createBill = (param: BillForm) => {
    const bill = buildBill(param);
    create(bill, accountCtx);
  };

  const updateBill = (bill: Bill) => {
    update(bill, accountCtx);
  }

  const deleteBill = (unix: number, date: DateReq) => {
    del(unix, date, accountCtx);
  }

  const showAccount = () => accountCtx;

  const getTodayConsumption = () => findDayConsumption(getNowDate(), accountCtx);

  const getMonthConsumtion = () => findMonthConsumption(getNowDate(), accountCtx);

  return {
    createBill,
    updateBill,
    deleteBill,
    showAccount,
    getTodayConsumption,
    getMonthConsumtion,
  };
};

export default useBillOperator;