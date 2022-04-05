import React, { useContext, useEffect } from 'react';
import MonthConsumption from '@components/MonthConsumption';
import useBillOperator from '@hooks/useBillOperator';
import { Bill } from '@PO/Bill';
import { DateReq } from '@PO/interfaces';
import { getNowDate } from '@utils/calendar';

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import useFindBills, { YearContainerVO } from '@hooks/useFindBills';
import { BillSpan } from '@PO/enums';
import { Button } from '@material-ui/core';
import { ChartCtx } from '@pages/Account';
import Tag from '@components/Tag';

interface Props {
  setFormData: React.Dispatch<React.SetStateAction<Bill>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  date?: DateReq;
  fresh?: boolean;
  data?: YearContainerVO;
}

const YearConsumption: React.FC<Props> = React.memo(props => {
  const { setFormData, setOpen, date, fresh = false, data } = props;
  const { setChart } = useContext(ChartCtx);
  // const { getYearConsumption } = useBillOperator();

  // const container = getYearConsumption(date || getNowDate());

  const yearContainer =
    data ||
    (useFindBills({
      date: date || getNowDate(),
      span: BillSpan.Year,
      fresh
    }) as YearContainerVO);

  useEffect(() => {
    setChart(yearContainer);
  }, [yearContainer]);

  return (
    <div>
      {/* <div>支出：{yearContainer.totalExportAmount.toFixed(1)}</div>
      <div>收入：{yearContainer.totalImportAmount.toFixed(1)}</div> */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1.5vh',
          marginBottom: '1.5vh'
        }}
      >
        <Tag bdColor="#ffa39e" bgColor="#fff1f0" ftColor="#cf1322">
          {yearContainer.dateAttr.year}年总支出:{' '}
          {yearContainer.totalExportAmount.toFixed(1)}
        </Tag>
        <Tag bdColor="#b7eb8f" bgColor="#f6ffed" ftColor="#389e0d">
          {yearContainer.dateAttr.year}年总收入:{' '}
          {yearContainer.totalImportAmount.toFixed(1)}
        </Tag>
      </div>
      {yearContainer.containers
        .map(monthCont => {
          const nowDate = getNowDate();
          if (
            monthCont.totalExportAmount === 0 &&
            monthCont.totalImportAmount === 0
            // || monthCont.dateAttr.month! > nowDate.month
          )
            return;

          return (
            <Accordion
              style={{ width: '97%', margin: '0 auto', marginBottom: '1vh' }}
              key={monthCont.dateAttr.year + monthCont.dateAttr.month!}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                style={{ backgroundColor: '#fcffe6' }}
              >
                {monthCont.dateAttr.month}月 支出：
                {monthCont.totalExportAmount.toFixed(1)} 收入：
                {monthCont.totalImportAmount.toFixed(1)}
              </AccordionSummary>
              <AccordionDetails>
                <MonthConsumption
                  data={monthCont}
                  setFormData={setFormData}
                  setOpen={setOpen}
                  date={{
                    year: monthCont.dateAttr.year,
                    month: monthCont.dateAttr.month!,
                    day: 1
                  }}
                />
              </AccordionDetails>
            </Accordion>
          );
        })
        .reverse()}
    </div>
  );
});

export default YearConsumption;
