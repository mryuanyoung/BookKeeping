import React, { useState, Dispatch, SetStateAction } from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import DayConsuptionItem from '@components/DayConsuItem';
import useBillOperator from '@hooks/useBillOperator';
import { DateReq, DayContainer } from '@PO/interfaces';
import { Divider } from '@material-ui/core';
import moment from 'moment';
import BillForm from '@components/BillForm';
import { Bill } from '@PO/Bill';
import { defaultBillForm } from '@constants/bill';
import { getNowDate } from '@utils/calendar';

interface Props {
  setFormData: React.Dispatch<React.SetStateAction<Bill>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  date?: DateReq;
}

const MonthConsumption: React.FC<Props> = props => {
  const { setFormData, setOpen, date } = props;
  const { getMonthConsumption } = useBillOperator();
  const monthCont = getMonthConsumption(date || getNowDate());

  const handleOpen = (bill: Bill) => {
    setFormData(bill);
    setOpen(true);
  };

  return (
    <div>
      <div>支出：{monthCont.totalExportAmount.toFixed(1)}</div>
      <div>收入：{monthCont.totalImportAmount.toFixed(1)}</div>
      {monthCont.containers
        .map((dayCont, idx) => {
          const bills = (dayCont as DayContainer).bills || [];
          const day = dayCont.dateAttr.day!;
          const today = moment().date();
          if (bills.length === 0 || (!date && day > today)) return;
          return (
            <Accordion
              key={
                dayCont.dateAttr.year +
                dayCont.dateAttr.month! +
                dayCont.dateAttr.day!
              }
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div>
                  {dayCont.dateAttr.day}号 支出：
                  {dayCont.totalExportAmount.toFixed(1)} 收入：
                  {dayCont.totalImportAmount.toFixed(1)}
                </div>
              </AccordionSummary>
              <AccordionDetails>
                {bills.map(bill => (
                  <div key={bill.unix} onClick={() => handleOpen(bill)}>
                    <DayConsuptionItem bill={bill} />
                  </div>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })
        .reverse()}
    </div>
  );
};

export default MonthConsumption;
