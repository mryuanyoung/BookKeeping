import React from "react";

import DayConsuptionItem from "@components/DayConsuItem";
import useBillOperator from "@hooks/useBillOperator";
import { DayContainer } from "@PO/interfaces";
import { Divider } from "@material-ui/core";
import moment from "moment";

const MonthConsumption = () => {

  const { getMonthConsumtion } = useBillOperator();
  const monthCont = getMonthConsumtion();

  return (
    <div>
      {monthCont.dateAttr.month}月账单:
      {
        monthCont.containers.map((dayCont, idx) => {
          const bills = (dayCont as DayContainer).bills || [];
          if(dayCont.dateAttr.day! > moment().date() || bills.length === 0) return;
          return (
            <div key={idx}>
              <div>{dayCont.dateAttr.day}号: </div>
              {
                bills.map((bill, idx) => (<div key={idx}><DayConsuptionItem bill={bill} /></div>))
              }
              <Divider variant='middle' />
            </div>
          )
        }).reverse()
      }
    </div>
  );
};

export default MonthConsumption;