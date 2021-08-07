import React, { useState, useEffect } from "react";
import style from './index.module.scss';
import BillForm from '../../components/BillForm';
import DayConsuption from '@components/DayConsumption';

import { defaultBillForm } from "@constants/bill";
import { Divider } from "@material-ui/core";
import useBillOperator from "@hooks/useBillOperator";

const BillPage = function () {

  const [fresh, setFresh] = useState(false);
  const [formData, setFormData] = useState(defaultBillForm);

  return (
    <div className={style.page}>
      <BillForm setFresh={setFresh} initData={formData} setFormData={setFormData} />
      <Divider variant='fullWidth' />
      <DayConsuption fresh={fresh} setFormData={setFormData} />
    </div>
  )
}

export default BillPage;