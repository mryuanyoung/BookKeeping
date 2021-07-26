import React, { useState, Dispatch, SetStateAction } from "react";
import Drawer from '@material-ui/core/Drawer';

import DayConsuptionItem from "@components/DayConsuItem";
import useBillOperator from "@hooks/useBillOperator";
import { DayContainer } from "@PO/interfaces";
import { Divider } from "@material-ui/core";
import moment from "moment";
import BillForm from "@components/BillForm";
import { Bill } from "@PO/Bill";
import { defaultBillForm } from "@constants/bill";

interface Props {
  setFresh: Dispatch<SetStateAction<boolean>>;
}

const MonthConsumption: React.FC<Props> = (props) => {

  const { setFresh } = props;

  const [formData, setFormData] = useState(defaultBillForm);
  const { getMonthConsumtion } = useBillOperator();
  const monthCont = getMonthConsumtion();
  const [open, setOpen] = useState(false);

  const handleOpen = (bill: Bill) => {
    setFormData(bill);
    setOpen(true);
  }

  return (
    <div>
      <Drawer
        anchor='top'
        open={open}
        onClose={() => setOpen(false)}
      >
        <BillForm setFresh={setOpen} initData={formData} setFormData={setFormData} />
      </Drawer>
      {monthCont.dateAttr.month}月账单:
      {
        monthCont.containers.map((dayCont, idx) => {
          const bills = (dayCont as DayContainer).bills || [];
          const day = dayCont.dateAttr.day!;
          const today = moment().date();
          if (day > today || (day < today && bills.length === 0)) return;
          return (
            <div key={idx}>
              <div>{dayCont.dateAttr.day}号: </div>
              {
                bills.map((bill, idx) => (<div key={idx} onClick={() => handleOpen(bill)}><DayConsuptionItem bill={bill} /></div>))
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