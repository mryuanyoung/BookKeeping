import React, {useState} from "react";
import style from './index.module.scss';
import BillForm from './BillForm';
import DayConsuption from '@components/DayConsumption';

const Bill = function () {

  const [fresh, setFresh] = useState(false);

  return (
    <div className={style.page}>
      <BillForm setFresh={setFresh} />
      <DayConsuption fresh={fresh} />
    </div>
  )
}

export default Bill;