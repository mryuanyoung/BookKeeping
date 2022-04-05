import React, { useState, useEffect } from 'react';
import style from './index.module.scss';
import BillForm from '../../components/BillForm';
import DayConsuption from '@components/DayConsumption';

import { defaultBillForm } from '@constants/bill';
import { Divider, Card, CardContent } from '@material-ui/core';
import useBillOperator from '@hooks/useBillOperator';

const BillPage = function () {
  const [fresh, setFresh] = useState(false);
  const [formData, setFormData] = useState(defaultBillForm);

  return (
    <Card sx={{ width: '100%', height: '100%' }}>
      {/* <div className={style.page}> */}
      <CardContent sx={{ minHeight: '65%' }}>
        <BillForm
          setFresh={setFresh}
          initData={formData}
          setFormData={setFormData}
        />
      </CardContent>
      <Divider variant="fullWidth" />
      <CardContent sx={{ overflow: 'auto', height: '35%' }}>
        <DayConsuption fresh={fresh} setFormData={setFormData} />
      </CardContent>
    </Card>
    // </div>
  );
};

export default BillPage;
