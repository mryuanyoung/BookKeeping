
import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import Divider from '@material-ui/core/Divider';

import useBillOperator from '@hooks/useBillOperator';
import DayConsuItem from '@components/DayConsuItem';
import { BillType } from "@PO/enums";
import {Bill} from '@PO/Bill';

interface Props {
  fresh: boolean;
  setFormData: Dispatch<SetStateAction<Bill>>;
}

const DayConsuption: React.FC<Props> = (props) => {

  const { fresh, setFormData } = props;

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
    setAmount({ ex, im });
  }, [fresh]);

  return (
    <div>
      <div>今日支出: {amount.ex}</div>
      <div>今日收入: {amount.im}</div>
      <Divider variant='middle' />
      <div>
        {
          consumption.map(bill => (
            <div onClick={e => setFormData(bill)} key={bill.unix}>
              <DayConsuItem bill={bill}/>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default DayConsuption;