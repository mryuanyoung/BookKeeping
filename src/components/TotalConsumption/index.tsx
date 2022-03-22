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
import YearConsumption from '@components/YearConsumption';

const now = getNowDate();
const years = Array(now.year - 2021 + 1)
  .fill(0)
  .map((_, idx) => now.year - idx);

interface Props {
  setFormData: React.Dispatch<React.SetStateAction<Bill>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  date?: DateReq;
}

const TotalConsumption: React.FC<Props> = React.memo(props => {
  const { setFormData, setOpen, date } = props;
  // const { getYearConsumption, getRootContainer } = useBillOperator();

  // const root = getRootContainer();
  // const container = getYearConsumption(date || getNowDate());

  return (
    <div>
      {years.map(year => (
        <div>
          {year}年:
          <YearConsumption
            key={year}
            setFormData={setFormData}
            setOpen={setOpen}
            date={{ year, month: 1, day: 1 }}
          />
        </div>
      ))}
      {/* <YearConsumption
        setFormData={setFormData}
        setOpen={setOpen}
        date={getNowDate()}
      />
      hhh
      <YearConsumption
        setFormData={setFormData}
        setOpen={setOpen}
        date={{ ...getNowDate(), year: 2021 }}
      /> */}
      {/* {Object.keys(root).map(key => {
        const container = root[key as any as number];

        return (
          <Accordion key={container.dateAttr.year}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {container.dateAttr.year}年 总支出：{container.totalExportAmount}{' '}
              总收入：{container.totalImportAmount}
            </AccordionSummary>
            <div>
              {container.containers
                .map(monthCont => {
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
                            year: container.dateAttr.year,
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
          </Accordion>
        );
      })} */}
    </div>
  );
});

export default TotalConsumption;
