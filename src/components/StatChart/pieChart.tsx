import { useContext, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import React from 'react';
import { ChartCtx } from '@pages/Account';
import {
  BillSpan,
  BillType,
  ImportBillLabel,
  ExportBillLabel,
  ImportBillType,
  ExportBillType
} from '@PO/enums';
import { MonthContainerVO, YearContainerVO } from '@hooks/useFindBills';
import { getNowDate } from '@utils/calendar';
import { Bill, ExportBill, ImportBill } from '@PO/Bill';

interface PieProps {
  value: number;
  name: string;
}

const option = (data: PieProps[], title: string) => ({
  // color: ['#FFA23F ', '#FF6B43', '#625AFF', '#D041FF', '#1A76FF ', '#2FDC89 '],
  title: {
    text: title,
    // subtext: '5624行',
    itemGap: 20,
    x: 'center',
    y: '46%',
    textStyle: {
      fontSize: 10,
      fontWeight: 'normal',
      color: '#333333'
    },
    subtextStyle: {
      fontSize: 24,
      fontWeight: 'normal',
      align: 'center',
      color: '#333333'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)',
    position: [0, 0]
  },
  series: [
    {
      name: '磁盘占用',
      type: 'pie',
      selectedMode: 'single',
      radius: [20, 50],
      // label: {
      //   padding: [10, -20],
      //   formatter: '{b}:{c}行\n\n'
      // },
      // labelLine: {
      //   length: 5,
      //   length2: 10,
      //   show: true,
      //   color: '#00ffff'
      // },

      data: data
    }
  ]
});

function convertData(
  billType: BillType,
  cont: MonthContainerVO | YearContainerVO
) {
  let type: BillSpan, token;
  if (cont instanceof MonthContainerVO) {
    type = BillSpan.Day;
    token = '号';
  } else {
    type = BillSpan.Month;
    token = '月';
  }

  if (cont instanceof MonthContainerVO) {
    return convertMonthData(cont, billType);
  } else {
    return convertYearData(cont, billType);
  }
}

function isBillSubType(bill: Bill): bill is ImportBill | ExportBill {
  return bill.mode === BillType.Import || bill.mode === BillType.Export;
}

type ImportEnum = {
  [key in keyof typeof ImportBillType]: number;
} & {
  [key in keyof typeof ExportBillType]: number;
};

function convertMonthData(cont: MonthContainerVO, billType: BillType) {
  const ret: ImportEnum = cont.containers.reduce((prev, curr) => {
    const n = { ...prev };
    curr.bills.forEach(bill => {
      if (bill.mode === billType) {
        if (isBillSubType(bill)) {
          n[bill.type] = (n[bill.type] || 0) + bill.amount;
        }
      }
    });
    return n;
  }, {} as ImportEnum);

  return Object.keys(ret).map(key => {
    const k = key as keyof ImportEnum;
    return {
      value: ret[k],
      name:
        billType === BillType.Export
          ? ExportBillLabel[key as ExportBillType]
          : ImportBillLabel[key as ImportBillType]
    };
  });
}

function convertYearData(cont: YearContainerVO, billType: BillType) {
  const res = cont.containers.map(monthCont =>
    convertMonthData(monthCont, billType)
  );
  const obj = Object.values(
    billType === BillType.Export ? ExportBillLabel : ImportBillLabel
  ).reduce((prev, curr) => ({ ...prev, [curr]: 0 }), {});
  res.forEach(each => {
    each.forEach(item => {
      obj[item.name] += item.value;
    });
  });
  return Object.keys(obj).map(key => ({ value: obj[key], name: key }));
}

interface Props {
  type: BillType;
}

const PieChart: React.FC<Props> = React.memo(props => {
  const { type } = props;
  const ref = useRef(null);
  const chart = useRef<echarts.EChartsType>();
  const { chart: data } = useContext(ChartCtx);

  useEffect(() => {
    if (!ref.current || chart.current !== undefined) {
      return;
    }

    chart.current = echarts.init(ref.current);
  }, [ref.current]);

  useEffect(() => {
    if (!chart.current || !data) {
      return;
    }

    const pie = convertData(type, data);
    chart.current.setOption(
      option(pie, type === BillType.Export ? '支出' : '收入')
    );
  }, [data]);

  return <div ref={ref} style={{ height: '25vh', width: '45vw' }}></div>;
});

export default PieChart;
