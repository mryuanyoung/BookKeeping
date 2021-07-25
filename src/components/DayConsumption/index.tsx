
import React, { useEffect, useState } from "react";
import Divider from '@material-ui/core/Divider';

import useBillOperator from '@hooks/useBillOperator';
import DayConsuItem from '@components/DayConsuItem';
import { BillType } from "@PO/enums";

interface Props {
  fresh: boolean;
}

const DayConsuption: React.FC<Props> = (props) => {

  const { fresh } = props;

  const { getTodayConsumption } = useBillOperator();
  const consumption = getTodayConsumption();
  const [amount, setAmount] = useState({ ex: 0, im: 0 });

  useEffect(() => {
    let ex = 0, im = 0;
    consumption.forEach(item => {
      if (item.mode === BillType.Export) {
        ex += item.amount;
      }
      else {
        im += item.amount;
      }
    })
    console.log(consumption, ex, im);
    setAmount({ ex, im });
  }, [fresh]);

  return (
    <div>
      <div>今日支出: {amount.ex}</div>
      <div>今日收入: {amount.im}</div>
      <Divider variant='middle' />
      {
        consumption.map(bill => (<DayConsuItem bill={bill} key={bill.unix} />))
      }
    </div>
  );
};

export default DayConsuption;