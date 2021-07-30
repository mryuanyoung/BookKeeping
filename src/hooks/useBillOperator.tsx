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

  const updateBill = (bill: Bill, sourceDate: DateReq) => {
    update(bill, accountCtx, sourceDate);
  }

  const deleteBill = (unix: number, date: DateReq) => {
    del(unix, date, accountCtx);
  }

  const showAccount = () => accountCtx;

  const getTodayConsumption = () => findDayConsumption(getNowDate(), accountCtx);

  const getMonthConsumtion = () => findMonthConsumption(getNowDate(), accountCtx);

  const exportRootContainer = () => {
    // todo 完善
    const blob = new Blob([JSON.stringify(accountCtx)]);
    const urlObj = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'data.json';
    link.style.display = 'none';
    link.href = urlObj;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    createBill,
    updateBill,
    deleteBill,
    showAccount,
    getTodayConsumption,
    getMonthConsumtion,
    exportRootContainer
  };
};

export default useBillOperator;