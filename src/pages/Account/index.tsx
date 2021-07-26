import React,{ useState } from "react";
import style from './index.module.scss';

import BillForm from "@components/BillForm";
import YearConsumption from "@components/YearConsumption";
import MonthConsumption from "@components/MonthConsumption";
import { defaultBillForm } from "@constants/bill";

const Account = () => {

  const [fresh, setFresh] = useState(false);

  return (
    <div className={style.page}>
      账单
      <MonthConsumption setFresh={setFresh} />
      <YearConsumption />
    </div>
  );
};

export default Account;