import React from 'react';
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

interface Props {
  setFormData: React.Dispatch<React.SetStateAction<Bill>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  date?: DateReq;
}

const YearConsumption: React.FC<Props> = React.memo(props => {
  const { setFormData, setOpen, date } = props;
  // const { getYearConsumption } = useBillOperator();

  // const container = getYearConsumption(date || getNowDate());

  const yearContainer = useFindBills({
    date: date || getNowDate(),
    span: BillSpan.Year
  }) as YearContainerVO;

  return (
    <div>
      <div>支出：{yearContainer.totalExportAmount.toFixed(1)}</div>
      <div>收入：{yearContainer.totalImportAmount.toFixed(1)}</div>
      {yearContainer.monthContainer
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
              key={monthCont.dateAttr.year + monthCont.dateAttr.month!}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {monthCont.dateAttr.month}月 支出：
                {monthCont.totalExportAmount.toFixed(1)} 收入：
                {monthCont.totalImportAmount.toFixed(1)}
              </AccordionSummary>
              <AccordionDetails>
                <MonthConsumption
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
