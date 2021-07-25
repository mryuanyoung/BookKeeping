import React from "react";
import style from './index.module.scss';

import YearConsumption from "@components/YearConsumption";
import MonthConsumption from "@components/MonthConsumption";

const Account = () => {

  return (
    <div className={style.page}>
      账单
      <MonthConsumption />
      <YearConsumption />
    </div>
  );
};

export default Account;