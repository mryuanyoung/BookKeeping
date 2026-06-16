import { Button } from "@material-ui/core"
import { useState } from "react";
import { Drawer } from 'antd';
import { createForm, ArrayField as ArrayFieldType } from '@formily/core'
import { Field, FormProvider, ArrayField, useField, observer } from "@formily/react";
import { FormItem, Input, NumberPicker, Select, Space } from "@formily/antd";
import { CalcParam, LoanSource, PaymentType, calcSellingPrice } from "./algorithm";
import { getFormattedNumberStr } from "@utils/index";

const form = createForm<CalcParam>({
  initialValues: {
    expectedRate: 0.05,
    downPaymentRate: 0.3,
    loans: [{ source: 0, amount: 0, rate: 0.043, duration: 30 }],
    paymentType: 0,
    rent: 2000
  },
});

const LoanForm = observer(() => {
  const field = useField<ArrayFieldType>()

  return (
    <>
      <div>
        {field.value?.map((item, index) => (
          <div key={index} >
            <Space>
              <FormItem label={'贷款项' + (index + 1)}>
                <Field required name={[index, 'source']} title='类型' decorator={[FormItem]} component={[
                  Select,
                  {
                    options: [
                      { label: '商业贷款', value: 0 },
                      { label: '公积金贷款', value: 1 }
                    ]
                  }
                ]} />
                <Field required name={[index, 'amount']} title='总额' decorator={[FormItem]} component={[NumberPicker]} />
                <Field required name={[index, 'rate']} title='利率' decorator={[FormItem]} component={[NumberPicker]} />
                <Field required name={[index, 'duration']} title='贷款年限' decorator={[FormItem]} component={[NumberPicker]} />
              </FormItem>
              <Button
                onClick={() => {
                  field.remove(index)
                }}
              >
                Remove
              </Button>
            </Space>
          </div>
        ))}
      </div>
      <Button
        onClick={() => {
          field.push({})
        }}
      >
        Add
      </Button>
    </>
  )
})

const EstateCalc = () => {

  const [visible, setVisible] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof calcSellingPrice>>();

  function handleClose() {
    setVisible(false);
    form.reset();
  }

  async function handleCalc(){
    try{
      await form.validate();
      console.log(form.values);
      const res = calcSellingPrice(form.values);
      setRes(res);
      console.log(res);
    }
    catch(err){
      console.log('err:', err);
    }
  }

  return (
    <div>
      <Button variant="outlined" onClick={() => setVisible(true)}>房地产盈亏计算</Button>
      <Drawer height={'80vh'} closable={false} destroyOnClose placement='top' open={visible} onClose={handleClose}>
        <FormProvider form={form}>
          <Field
            required
            name="totalPrice"
            title="房屋总价"
            decorator={[FormItem]}
            component={[
              NumberPicker,
            ]}
          />
          <Field
            required
            name="downPaymentRate"
            title="首付比例"
            decorator={[FormItem]}
            component={[
              NumberPicker,
            ]}
          />
          <ArrayField name="loans" component={[LoanForm]} />
          <Field
            required
            name="paymentType"
            title="还款方式"
            decorator={[FormItem]}
            component={[
              Select,
              {
                options: [
                  { label: '等额本息', value: 0 },
                  { label: '等额本金', value: 1 }
                ]
              }
            ]}
          />
          <Field
            required
            name="expectedRate"
            title="理财利率"
            decorator={[FormItem]}
            component={[
              NumberPicker,
            ]}
          />
          <Field
            required
            name="rent"
            title="初始每月租金"
            decorator={[FormItem]}
            component={[
              NumberPicker,
            ]}
          />
          <Field
            required
            name="years"
            title="卖出年"
            decorator={[FormItem]}
            component={[
              NumberPicker,
            ]}
          />
        </FormProvider>
        <Button onClick={handleCalc}>计算</Button>
        <div>
          <div>累计还款: {getFormattedNumberStr(res?.accTotal)}，其中本金{getFormattedNumberStr(res?.accPrincipal)}，利息{getFormattedNumberStr(res?.accInterest)}</div>
          <div>除去租金{getFormattedNumberStr(res?.expectedInterest.totalRent)}，将本金{getFormattedNumberStr(res?.expectedInterest.principal)}用于理财，收益为{getFormattedNumberStr(res?.expectedInterest.diff)}</div>
          <div>卖出另需还款{getFormattedNumberStr(res?.toLoan)}，价格为{getFormattedNumberStr(res?.expectedSellingPrice)}时与理财收益持平</div>
        </div>
      </Drawer>
    </div>
  )
}

export default EstateCalc;