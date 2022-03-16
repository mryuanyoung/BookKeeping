import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';

import useBillOperator from '@hooks/useBillOperator';
import DayConsuItem from '@components/DayConsuItem';
import { Bill } from '@PO/Bill';

interface Props {
  fresh: boolean;
  setFormData: Dispatch<SetStateAction<Bill>>;
}

const DayConsuption: React.FC<Props> = props => {
  const { fresh, setFormData } = props;

  const { getTodayConsumption } = useBillOperator();
  const { bills, container } = getTodayConsumption();

  return (
    <div>
      <div>今日支出: {container.totalExportAmount.toFixed(1)}</div>
      <div>今日收入: {container.totalImportAmount.toFixed(1)}</div>
      <div>
        {bills.map(bill => (
          <div onClick={e => setFormData(bill)} key={bill.unix}>
            <DayConsuItem bill={bill} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayConsuption;
