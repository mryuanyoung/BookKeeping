import React, { useState, useEffect, Dispatch, SetStateAction } from "react";

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';

import Input from '@components/Input';
import useBillOperator from "@hooks/useBillOperator";
import { BillType, ExportBillType, ExportBillLabel, ImportBillType, ImportBillLabel } from '@PO/enums';

interface Props {
  setFresh: Dispatch<SetStateAction<boolean>>;
}

const BillForm: React.FC<Props> = (props) => {

  const { setFresh } = props;

  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState(BillType.Export);
  const [type, setType] = useState<ExportBillType | ImportBillType>(ExportBillType.Meal);
  const [remark, setRemark] = useState('');
  const { createBill } = useBillOperator();

  useEffect(() => {
    if (mode === BillType.Export) {
      setType(ExportBillType.Meal);
    }
    else {
      setType(ImportBillType.Salary);
    }
  }, [mode]);

  const handleSubmit = () => {
    const AMOUNT = parseFloat(amount) || 0;
    if (AMOUNT === 0) return;
    createBill(AMOUNT, mode, type, remark);
    setFresh(b => !b);
  };

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
      <Divider variant='middle' />
      <Input value={amount} setValue={setAmount} number outlined prefix='￥' label='金额' errMsg='请输入数字'/>
      <Divider variant='middle' />
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
      <Divider variant='middle' />
      <Input value={remark} setValue={setRemark} outlined label='备注' />
      <Divider variant='middle' />
      <Button variant="outlined" onClick={handleSubmit}>提交</Button>
    </Box>

  )
}

export default BillForm;