import React, { useContext } from "react";

import { BillType, ExportBillType, ImportBillType } from '@PO/enums';
import { AccountCtx } from '@assets/../App';
import { ExportBill, ImportBill, Bill } from '@PO/Bill';
import { create, update, del, findDayConsumption, findMonthConsumption, findYearConsumption, clearAndReCalcAccount } from '@PO/Operator';
import { BillForm } from "@interfaces/billForm";
import { buildBill } from "@utils/bill";
import { DateReq } from "@PO/interfaces";
import { getNowDate, getNowTime } from "@utils/calendar";

const useBillOperator = () => {
  const { accountCtx } = useContext(AccountCtx);

  const createBill = (param: BillForm) => {
    const bill = buildBill(param);
    create(bill, accountCtx);
  };

  const updateBill = (target: Bill, source: Bill) => {
    update(target, source, accountCtx);
  }

  const deleteBill = (unix: number, date: DateReq) => {
    del(unix, date, accountCtx);
  }

  const showAccount = () => accountCtx;

  const getTodayConsumption = () => findDayConsumption(getNowDate(), accountCtx);

  const getMonthConsumption = (date: DateReq) => findMonthConsumption(date, accountCtx);

  const getYearConsumption = (date: DateReq) => findYearConsumption(date, accountCtx);

  const ClearAndReCalcAccount = () => clearAndReCalcAccount(accountCtx);

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
    getMonthConsumption,
    getYearConsumption,
    exportRootContainer,
    ClearAndReCalcAccount
  };
};

export default useBillOperator;