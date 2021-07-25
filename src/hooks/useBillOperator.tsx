import React, { useContext } from "react";

import { BillType, ExportBillType, ImportBillType } from '@PO/enums';
import { AccountCtx } from '@assets/../App';
import { ExportBill, ImportBill } from '@PO/Bill';
import {create, findTodayConsumption} from '@PO/Operator';

const useBillOperator = () => {
  const accountCtx = useContext(AccountCtx);

  const createBill = (amount: number, mode: BillType, type: ExportBillType | ImportBillType, remark: string) => {
    let bill;
    if (mode === BillType.Export) {
      bill = new ExportBill(amount, remark, type as ExportBillType);
    }
    else {
      bill = new ImportBill(amount, remark, type as ImportBillType);
    }
    create(bill, accountCtx);
  };

  const showAccount = () => accountCtx;

  const getTodayConsumption = () => findTodayConsumption(accountCtx);

  return {
    createBill,
    showAccount,
    getTodayConsumption,
  };
};

export default useBillOperator;