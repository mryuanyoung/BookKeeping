import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';

import useBillOperator from '@hooks/useBillOperator';
import DayConsuItem from '@components/DayConsuItem';
import { Bill, ExportBill, ImportBill } from '@PO/Bill';
import * as ex from '@database/exportBillOp';
import * as im from '@database/importBillOp';
import { getNowDate } from '@utils/calendar';
import useFindBills, { DayContainerVO } from '@hooks/useFindBills';
import { BillSpan } from '@PO/enums';
import { DateReq } from '@PO/interfaces';

interface Props {
  fresh?: boolean;
  setFormData: Dispatch<SetStateAction<Bill>>;
  date?: DateReq;
}

const DayConsuption: React.FC<Props> = props => {
  const { fresh, setFormData, date } = props;

  // const { getTodayConsumption } = useBillOperator();
  // const { bills, container } = getTodayConsumption();

  const dayContainer = useFindBills({
    date: date || getNowDate(),
    span: BillSpan.Day
  }) as DayContainerVO;

  return (
    <div>
      {/* <div>今日支出: {container.totalExportAmount.toFixed(1)}</div>
      <div>今日收入: {container.totalImportAmount.toFixed(1)}</div> */}
      <div>今日支出: {dayContainer.totalExportAmount}</div>
      <div>今日收入: {dayContainer.totalImportAmount}</div>
      <div>
        {dayContainer.bills.map(bill => (
          <div onClick={e => setFormData(bill)} key={bill.id}>
            <DayConsuItem bill={bill} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayConsuption;
