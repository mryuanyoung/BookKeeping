import React, {
  Dispatch,
  SetStateAction,
  useState,
  createContext,
  useRef
} from 'react';
import style from './index.module.scss';

import Drawer from '@material-ui/core/Drawer';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import BillForm from '@components/BillForm';
import YearConsumption from '@components/YearConsumption';
import MonthConsumption from '@components/MonthConsumption';
import { defaultBillForm } from '@constants/bill';
import RouteComponent from '@components/RouteComponent';
import TotalConsumption from '@components/TotalConsumption';
import StatChart from '@components/StatChart';
import { Button } from '@material-ui/core';
import { MonthContainerVO, YearContainerVO } from '@hooks/useFindBills';

export interface ChartCtxProps {
  chart?: MonthContainerVO | YearContainerVO;
  setChart: (v: MonthContainerVO | YearContainerVO) => void;
}
export const ChartCtx = createContext<ChartCtxProps>({} as ChartCtxProps);

const Account = () => {
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultBillForm);
  const [fresh, setFresh] = useState(false);
  const [chart, setChart] = useState(false);
  const ref = useRef({
    chart: {} as MonthContainerVO | YearContainerVO,
    setChart: function (v: MonthContainerVO | YearContainerVO) {
      ref.current.chart = v;
    }
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 3) {
      setChart(true);
      return;
    }
    setValue(newValue);
  };

  return (
    <div className={style.page}>
      <Drawer anchor="top" open={open} onClose={() => setOpen(false)}>
        <BillForm
          setFresh={b => {
            setOpen(b);
            setFresh(b);
          }}
          initData={formData}
          setFormData={setFormData}
        />
      </Drawer>
      <Tabs value={value} onChange={handleChange}>
        <Tab label="月度账单" />
        <Tab label="年度账单" />
        <Tab label="总账单" />
        <Tab label="图表统计" />
      </Tabs>
      <ChartCtx.Provider value={ref.current}>
        <Drawer anchor="bottom" open={chart} onClose={() => setChart(false)}>
          <StatChart />
        </Drawer>
        <RouteComponent index={0} curr={value}>
          <MonthConsumption
            setFormData={setFormData}
            setOpen={setOpen}
            fresh={fresh}
          />
        </RouteComponent>
        <RouteComponent index={1} curr={value}>
          <YearConsumption
            setFormData={setFormData}
            setOpen={setOpen}
            fresh={fresh}
          />
        </RouteComponent>
        <RouteComponent index={2} curr={value}>
          <TotalConsumption setFormData={setFormData} setOpen={setOpen} />
        </RouteComponent>
      </ChartCtx.Provider>
    </div>
  );
};

export default Account;
