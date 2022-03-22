import React, { useState } from 'react';
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

const Account = () => {
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultBillForm);
  const [fresh, setFresh] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
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
      </Tabs>
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
    </div>
  );
};

export default Account;
