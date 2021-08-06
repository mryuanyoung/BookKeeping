import React, { useState, useEffect, Dispatch, SetStateAction, useContext, useCallback } from "react";
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import TextField from '@material-ui/core/TextField';
import AdapterDateFns from '@material-ui/lab/AdapterMoment';
import LocalizationProvider from '@material-ui/lab/LocalizationProvider';
import DatePicker from '@material-ui/lab/DatePicker';
import moment from 'moment';

import style from './index.module.scss';
import Input from '@components/Input';
import useBillOperator from "@hooks/useBillOperator";
import { BillType, ExportBillType, ExportBillLabel, ImportBillType, ImportBillLabel } from '@PO/enums';
import { defaultBillForm } from "@constants/bill";
import { Bill } from "@PO/Bill";
import { sameDate } from "@utils/calendar";

interface Props {
  setFresh: Dispatch<SetStateAction<boolean>>;
  initData: Bill,
  setFormData: Dispatch<SetStateAction<Bill>>
}

const BillForm: React.FC<Props> = (props) => {

  const { setFresh, initData, setFormData } = props;
  const { createBill, updateBill, deleteBill } = useBillOperator();

  const Amount = initData.unix ? initData.amount + '' : '';
  const [amount, setAmount] = useState(Amount);
  const [mode, setMode] = useState(initData.mode);
  const [type, setType] = useState(initData.type);
  const [remark, setRemark] = useState(initData.remark);
  const [date, setDate] = useState<moment.Moment | null>(moment());


  const initForm = () => {
    const Amount = initData.unix ? initData.amount + '' : '';
    setAmount(Amount);
    setMode(initData.mode);
    setType(initData.type);
    setRemark(initData.remark);
    if (initData.unix) {
      const mo = moment();
      mo.year(initData.date.year);
      mo.month(initData.date.month - 1);
      mo.date(initData.date.day);
      setDate(mo);
    }
  };

  const clearForm = useCallback(() => {
    setAmount('');
    setMode(BillType.Export);
    setType(ExportBillType.Meal);
    setRemark('');
  }, []);

  useEffect(() => {
    initForm();
  }, [initData]);

  useEffect(() => {
    if (mode === BillType.Export) {
      setType(ExportBillType.Meal);
    }
    else {
      setType(ImportBillType.Salary);
    }
  }, [mode]);

  const handleSubmit = () => {
    // 粗糙的表单验证;
    const AMOUNT = parseFloat(amount) || 0;
    if (AMOUNT === 0) return;
    const dateReq = {
      year: date!.year(),
      month: date!.month() + 1,
      day: date!.date(),
    };

    if (initData.unix) {
      const target = {
        ...initData,
        amount: AMOUNT,
        date: dateReq,
        mode,
        type,
        remark,
      };
      updateBill(target, initData);
    }
    else {
      createBill({ amount: AMOUNT, date: dateReq, mode, type, remark });
    }
    setFresh(b => !b);
    clearForm();
  };

  const handleDelete = (unix: number) => {
    const dateReq = {
      year: date!.year(),
      month: date!.month() + 1,
      day: date!.date(),
    };

    deleteBill(unix, dateReq);
    setFormData(defaultBillForm);
    setFresh(b => !b);
  }

  return (
    <Box
      component="form"
      sx={{
        '& > :not(style)': { m: 1 },
      }}
      noValidate
      autoComplete="off"
    >
      <FormControl component="fieldset">
        <FormLabel component="legend">类型</FormLabel>
        <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as BillType)}>
          <FormControlLabel value={BillType.Export} control={<Radio />} label="流出" />
          <FormControlLabel value={BillType.Import} control={<Radio />} label="流入" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset">
        <FormLabel component="legend">类别</FormLabel>
        <RadioGroup row value={type} onChange={(e) => setType(e.target.value as ExportBillType | ImportBillType)}>
          {
            mode === BillType.Export ? (
              Object.keys(ExportBillType).map(item => (
                <FormControlLabel key={item} value={item} control={<Radio />} label={ExportBillLabel[item as ExportBillType]} />
              )
              )
            )
              :
              (
                Object.keys(ImportBillType).map(item => (
                  <FormControlLabel key={item} value={item} control={<Radio />} label={ImportBillLabel[item as ImportBillType]} />
                )
                )
              )
          }
        </RadioGroup>
      </FormControl>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="日期"
          value={date}
          onChange={(newDate: moment.Moment | null) => {
            if (!newDate) return;
            setDate(newDate);
          }}
          renderInput={(params: any) => <TextField {...params} className={style.inputs} />}
        />
      </LocalizationProvider>
      <Input
        className={style.inputs}
        value={amount}
        setValue={setAmount}
        number
        outlined
        prefix='￥'
        label='金额'
        errMsg='请输入数字'
      />
      <Input
        className={style.inputs}
        value={remark}
        setValue={setRemark}
        outlined
        label='备注'
      />
      <div id={style.btns}>
        <Button variant="outlined" onClick={handleSubmit}>{initData.unix ? '修改' : '记账'}</Button>
        {
          initData.unix ? (
            <>
              <Button variant="outlined" onClick={() => setFormData(defaultBillForm)}>返回</Button>
              <Button variant="outlined" color="error" onClick={() => handleDelete(initData.unix)}>删除</Button>
            </>
          ) : null
        }
      </div>
    </Box>

  )
}

export default BillForm;