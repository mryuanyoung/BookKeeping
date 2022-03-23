import React, {
  useState,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import DayConsuptionItem from '@components/DayConsuItem';
import useBillOperator from '@hooks/useBillOperator';
import { DateReq, DayContainer } from '@PO/interfaces';
import { Button, Divider, Drawer } from '@material-ui/core';
import moment from 'moment';
import BillForm from '@components/BillForm';
import { Bill } from '@PO/Bill';
import { defaultBillForm } from '@constants/bill';
import { getNowDate } from '@utils/calendar';
import useFindBills, { MonthContainerVO } from '@hooks/useFindBills';
import { BillSpan } from '@PO/enums';
import StatChart from '@components/StatChart';
import { ChartCtx } from '@pages/Account';
interface Props {
  setFormData: React.Dispatch<React.SetStateAction<Bill>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  date?: DateReq;
  fresh?: boolean;
  data?: MonthContainerVO;
}

const MonthConsumption: React.FC<Props> = React.memo(props => {
  console.log('month consumption render');
  const { setFormData, setOpen, date, fresh = false, data } = props;
  const { setChart } = useContext(ChartCtx);
  // const { getMonthConsumption } = useBillOperator();
  // const monthCont = getMonthConsumption(date || getNowDate());

  const monthContainer =
    data ||
    (useFindBills({
      date: date || getNowDate(),
      span: BillSpan.Month,
      fresh
    }) as MonthContainerVO);

  const handleOpen = (bill: Bill) => {
    setFormData(bill);
    setOpen(true);
  };

  useEffect(() => {
    setChart(monthContainer);
  }, [monthContainer]);

  return (
    <div>
      {/* <div>支出：{monthCont.totalExportAmount.toFixed(1)}</div>
      <div>收入：{monthCont.totalImportAmount.toFixed(1)}</div>
      {monthCont.containers
        .map((dayCont, idx) => {
          const bills = (dayCont as DayContainer).bills || []; */}
      <div>支出：{monthContainer.totalExportAmount.toFixed(1)}</div>
      <div>收入：{monthContainer.totalImportAmount.toFixed(1)}</div>
      {monthContainer.containers
        .map((dayCont, idx) => {
          const bills = dayCont.bills;
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
});

export default MonthConsumption;
