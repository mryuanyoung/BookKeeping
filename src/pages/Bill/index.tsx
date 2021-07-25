import React, { useState, createContext, Dispatch, SetStateAction } from "react";
import style from './index.module.scss';
import BillForm from './BillForm';
import DayConsuption from '@components/DayConsumption';

import { defaultBillForm } from "@constants/bill";

const BillPage = function () {

  const [fresh, setFresh] = useState(false);
  const [formData, setFormData] = useState(defaultBillForm);

  return (
    <div className={style.page}>
      <BillForm setFresh={setFresh} initData={formData} setFormData={setFormData} />
      <DayConsuption fresh={fresh} setFormData={setFormData} />
    </div>
  )
}

export default BillPage;