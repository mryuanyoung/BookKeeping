import React, { useState } from "react";
import style from './index.module.scss';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import BillForm from "@components/BillForm";
import YearConsumption from "@components/YearConsumption";
import MonthConsumption from "@components/MonthConsumption";
import { defaultBillForm } from "@constants/bill";
import RouteComponent from "@components/RouteComponent";

const Account = () => {

  const [fresh, setFresh] = useState(false);
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className={style.page}>
      <Tabs value={value} onChange={handleChange}>
        <Tab label="月度账单" />
        <Tab label="年度账单" />
      </Tabs>
      <RouteComponent index={0} curr={value}>
        <MonthConsumption setFresh={setFresh} />
      </RouteComponent>
      <RouteComponent index={1} curr={value}>
        <YearConsumption />
      </RouteComponent>
    </div>
  );
};

export default Account;