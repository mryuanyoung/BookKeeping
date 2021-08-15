import { useState } from "react";
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import Input from '@components/Input'
import Box from '@material-ui/core/Box';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Chip from '@material-ui/core/Chip';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ButtonGroup from '@material-ui/core/ButtonGroup';

import style from './index.module.scss';
import { InputProps, InfoType } from '@interfaces/salary';
import { CityAverageSalary } from "@constants/cityAverageSalary";
import { CompanyTotalFiveInsureRate, getDefaultInputs, FreeTaxSalary, PersonTotalFiveInsureRate, TaxLevel, TaxTable } from "@constants/taxRate";
import { deleteCompany, getCompanyData, getCompanyNames, preserveSalary } from "@utils/localStore";
import { Divider } from "@material-ui/core";

function convertToNumber(inputs: InputProps) {
  const res: { [key: string]: any } = {};
  Object.keys(inputs).forEach(key => {
    let value;
    if (typeof inputs[key] === 'string') {
      value = parseFloat(inputs[key] as string) || 0;
    }
    else {
      value = (inputs[key] as InfoType[]).map(item => ({ amount: parseFloat(item.amount) || 0, remark: item.remark }));
    }
    res[key] = value;
  });
  return res;
}

const SalaryCalc = () => {

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [calcRes, setCalcRes] = useState('');
  const [bonusType, setBonusType] = useState(0);
  const [inputs, setInputs] = useState(getDefaultInputs());

  const handleChangeBonusType = (event: any) => {
    setBonusType(event.target.value);
  };

  const calculate = () => {
    const INPUTS = convertToNumber(inputs);
    // 五险一金缴纳基数
    const Subsidy = INPUTS.subsidy.reduce((prev: number, curr: { amount: number }) => prev += curr.amount, 0);
    const LstYearAvgSalary = INPUTS.base + Subsidy;   // 去年平均月收入暂时用这个来代替
    const Limit = INPUTS.fundLimit * 3;
    const FiveInsureBase = Math.min(LstYearAvgSalary, Limit);
    // 五险
    const PersonFiveInsure = FiveInsureBase * PersonTotalFiveInsureRate;
    const CompanyFiveInsure = FiveInsureBase * CompanyTotalFiveInsureRate;
    // 公积金
    const Fund = FiveInsureBase * INPUTS.fundRate / 100;
    // 个税
    const specialReduction = 1100; // 专项扣除减免: 子女教育、继续教育、住房贷款信息、租房租金1100、大病医疗、赡养老人
    const Bonus = bonusType === 0 ? INPUTS.base * INPUTS.bonus : INPUTS.bonus;
    const ExtraBonus = INPUTS.extraBonus.reduce((prev: number, curr: { amount: number }) => prev += curr.amount, 0);
    const TotalImport = (INPUTS.base + Subsidy) * 12 + Bonus + ExtraBonus + INPUTS.OOT;  // 全年税前收入
    const TotalReduction = (FreeTaxSalary + PersonFiveInsure + Fund + specialReduction) * 12;  // 全年 6w起征点+五险一金扣除+专项附加扣除
    const TaxBase = TotalImport - TotalReduction;  // 个税缴纳基数
    let idx = 0;
    for (let len = TaxLevel.length; idx < len; idx++) {
      if (TaxBase < TaxLevel[idx]) {
        break;
      }
    }
    const TotalTax = TaxBase * TaxTable[idx][0] - TaxTable[idx][1];
    const TotalSalary = (TotalImport - (PersonFiveInsure + Fund) * 12 - TotalTax);
    const TotalFund = (Fund * 12 * 2);
    const res = `
    月薪：基础工资${INPUTS.base}+${INPUTS.subsidy.map((item: { remark: string, amount: string }) => item.remark + item.amount).join('+')}=${LstYearAvgSalary}
    年终：现金${Bonus}+${INPUTS.extraBonus.map((item: { remark: string, amount: string }) => item.remark + item.amount).join('+')}=${Bonus + ExtraBonus}
    一次性收入：${INPUTS.OOT}
    全年税前所得：${TotalImport}
    -----------------------------
    五险缴纳：${PersonFiveInsure} * 12 = ${PersonFiveInsure * 12}
    公积金缴纳：${Fund} * 12 = ${Fund * 12}
    个税缴纳：${TotalTax}
    -----------------------------
    全年税后现金收入：${TotalSalary.toFixed(1)}
    全年公积金缴存：${TotalFund.toFixed(1)}
    全年总收入：${(TotalSalary+TotalFund).toFixed(1)}
    `;
    setCalcRes(res);
  }

  const reset = () => {
    setName('');
    setCompanyName('');
    setInputs(getDefaultInputs());
    setCalcRes('');
  };

  const importData = (name: string) => {
    setName(name);
    setCompanyName(name);
    setInputs(getCompanyData(name));
    setCalcRes('');
  }

  const preserveCalcRes = () => {
    if(!name) return;
    preserveSalary(name, inputs);
  };

  const deleteAndRefresh = () => {
    deleteCompany(companyName);
    reset();
  }

  return (
    <div>
      <Button variant="outlined" onClick={() => setOpen(true)}>薪资计算</Button>
      <Drawer
        anchor='top'
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box
          id={style.salary}
          component="form"
          sx={{
            '& > :not(style)': { m: 1 },
          }}
          noValidate
          autoComplete="off"
        >
          <Input
            style={{ width: '40vw' }}
            className={style.inputs}
            value={name}
            setValue={(v: string) => setName(v)}
            outlined
            label='名称'
          />
          <FormControl style={{ width: '36vw' }}>
            <InputLabel>导入数据</InputLabel>
            <Select
              value={companyName}
              label="导入数据"
              onChange={(e: any) => importData(e.target.value)}
            >
              {
                getCompanyNames().map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)
              }
            </Select>
          </FormControl>
          <Input
            className={style.inputs}
            value={inputs.OOT}
            setValue={(v: string) => setInputs(o => ({ ...o, OOT: v }))}
            number
            outlined
            prefix='￥'
            label='一次性补贴'
            errMsg='请输入数字'
          />
          <Input
            className={style.inputs}
            value={inputs.base}
            setValue={(v: string) => setInputs(o => ({ ...o, base: v }))}
            number
            outlined
            prefix='￥'
            label='月薪'
            errMsg='请输入数字'
          />
          <div>
            <div className={style.leftEle}>
              <Chip className={style.chip} label='月度补贴' variant="outlined" />
              <ButtonGroup size='small' variant="text">
                <Button onClick={() => setInputs(o => ({ ...o, subsidy: o.subsidy.concat({ remark: '', amount: '' }) }))}><AddIcon /></Button>
                <Button onClick={() => setInputs(o => ({ ...o, subsidy: o.subsidy.slice(0, -1) }))}><RemoveIcon /></Button>
              </ButtonGroup>
            </div>
            {
              inputs.subsidy.map((item, idx) => (
                <div key={idx}>
                  <Input

                    style={{ width: '35vw', marginRight: '5vw' }}
                    number
                    label='金额'
                    prefix='￥'
                    errMsg='请输入数字'
                    outlined
                    value={item.amount}
                    setValue={(v: string) => setInputs(o => {
                      const sourceArr = o.subsidy;
                      const source = sourceArr[idx];
                      sourceArr[idx] = { ...source, amount: v };
                      return { ...o, subsidy: sourceArr };
                    })}
                  />
                  <Input
                    style={{ width: '40vw' }}
                    label='备注'
                    outlined
                    value={item.remark}
                    setValue={(v: string) => setInputs(o => {
                      const sourceArr = o.subsidy;
                      const source = sourceArr[idx];
                      sourceArr[idx] = { ...source, remark: v };
                      return { ...o, subsidy: sourceArr };
                    })}
                  />
                </div>
              ))
            }
          </div>
          <Input
            number
            outlined
            style={{ width: '55vw' }}
            errMsg='请输入数字'
            label='公积金比例'
            prefix='%'
            value={inputs.fundRate}
            setValue={(v: string) => setInputs(o => ({ ...o, fundRate: v }))}
          />
          <FormControl>
            <InputLabel>地区</InputLabel>
            <Select
              value={inputs.fundLimit}
              label="地区"
              onChange={(e: any) => setInputs(o => ({ ...o, fundLimit: e.target.value.toString() }))}
            >
              {
                CityAverageSalary.map(item => <MenuItem key={item.city} value={item.salary}>{item.city}</MenuItem>)
              }
            </Select>
          </FormControl>
          <Input
            style={{ width: '55vw' }}
            className={style.inputs}
            value={inputs.bonus}
            setValue={(v: string) => setInputs(o => ({ ...o, bonus: v }))}
            number
            outlined
            label='年终奖'
            errMsg='请输入数字'
          />
          <FormControl>
            <InputLabel>类型</InputLabel>
            <Select
              value={bonusType}
              label="类型"
              onChange={handleChangeBonusType}
            >
              <MenuItem value={0}>月份</MenuItem>
              <MenuItem value={1}>金额</MenuItem>
            </Select>
          </FormControl>
          <div>
            <div className={style.leftEle}>
              <Chip className={style.chip} label='年度奖励' variant="outlined" />
              <ButtonGroup size='small' variant="text">
                <Button onClick={() => setInputs(o => ({ ...o, extraBonus: o.extraBonus.concat({ remark: '', amount: '' }) }))}><AddIcon /></Button>
                <Button onClick={() => setInputs(o => ({ ...o, extraBonus: o.extraBonus.slice(0, -1) }))}><RemoveIcon /></Button>
              </ButtonGroup>
            </div>
            {
              inputs.extraBonus.map((item, idx) => (
                <div key={idx}>
                  <Input
                    style={{ width: '35vw', marginRight: '5vw' }}
                    number
                    label='金额'
                    prefix='￥'
                    errMsg='请输入数字'
                    outlined
                    value={item.amount}
                    setValue={(v: string) => setInputs(o => {
                      const sourceArr = o.extraBonus;
                      const source = sourceArr[idx];
                      sourceArr[idx] = { ...source, amount: v };
                      return { ...o, extraBonus: sourceArr };
                    })}
                  />
                  <Input
                    style={{ width: '40vw' }}
                    label='备注'
                    outlined
                    value={item.remark}
                    setValue={(v: string) => setInputs(o => {
                      const sourceArr = o.extraBonus;
                      const source = sourceArr[idx];
                      sourceArr[idx] = { ...source, remark: v };
                      return { ...o, extraBonus: sourceArr };
                    })}
                  />
                </div>
              ))
            }
          </div>

          <div id={style.btns}>
            <Button variant="outlined" onClick={calculate}>计算</Button>
            <Button variant="outlined" onClick={reset}>重置</Button>
            {
              calcRes ? <Button variant="outlined" onClick={preserveCalcRes}>保存</Button> : null
            }
            {
              companyName ? <Button variant="outlined" color="error" onClick={deleteAndRefresh}>删除</Button> : null
            }
          </div>
          <Divider />
          <div>
            {calcRes.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
          </div>
        </Box>
      </Drawer>
    </div>
  )
}

export default SalaryCalc;