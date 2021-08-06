import React, { useState, Dispatch, SetStateAction } from "react";
import Drawer from '@material-ui/core/Drawer';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';


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
      {monthCont.dateAttr.month}月
      <div>
        总支出：{monthCont.totalExportAmount}
      </div>
      <div>
        总收入：{monthCont.totalImportAmount}
      </div>
      {
        monthCont.containers.map((dayCont, idx) => {
          const bills = (dayCont as DayContainer).bills || [];
          const day = dayCont.dateAttr.day!;
          const today = moment().date();
          if (day > today || (day < today && bills.length === 0)) return;
          return (
            <Accordion key={idx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div>{dayCont.dateAttr.day}号 总支出：{dayCont.totalExportAmount} 总收入：{monthCont.totalImportAmount}</div>
              </AccordionSummary>
              <AccordionDetails>
                {
                  bills.map((bill, idx) => (<div key={idx} onClick={() => handleOpen(bill)}><DayConsuptionItem bill={bill} /></div>))
                }
              </AccordionDetails>
            </Accordion>
          )
        }).reverse()
      }
    </div>
  );
};

export default MonthConsumption;