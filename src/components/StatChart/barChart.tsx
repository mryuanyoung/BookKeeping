import { useContext, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartCtx } from '@pages/Account';
import { BillSpan, BillType } from '@PO/enums';
import {
  DayContainerVO,
  MonthContainerVO,
  YearContainerVO
} from '@hooks/useFindBills';
import { getDaysOfMonth, getNowDate } from '@utils/calendar';

const option = (label: string[], data: number[], type: BillType) => ({
  // backgroundColor: '#0B1535',
  title: {
    text: (type === BillType.Export ? '支出' : '收入') + '统计',
    x: 'center',
    y: '0%',
    textStyle: {
      fontSize: 10,
      fontWeight: 'normal',
      color: '#333333'
    }
  },
  textStyle: {
    fontSize: 0
  },
  grid: {
    top: '12%',
    bottom: '12%',
    left: '12%',
    right: '5%'
  },
  tooltip: {
    show: true,
    trigger: 'item',
    formatter: `{b}${type === BillType.Export ? '支出' : '收入'}{c}元`
  },
  xAxis: {
    nameTextStyle: {
      color: '#c0c3cd',
      padding: [0, 0, -10, 0],
      fontSize: 14
    },
    axisLabel: {
      color: '#8BA0C4',
      fontWeight: 400,
      fontFamily: 'SourceHanSansCN-Regular, SourceHanSansCN',
      fontSize: 10
    },
    axisTick: {
      lineStyle: {
        color: '#0B1535',
        width: 1
      },
      show: false
    },
    splitLine: {
      show: false
    },
    axisLine: {
      lineStyle: {
        color: '#384267',
        width: 1,
        type: 'dashed'
      },
      show: true
    },
    data: label,
    type: 'category'
  },
  yAxis: {
    type: 'value',
    nameTextStyle: {
      color: '#c0c3cd',
      padding: [0, 0, -10, 0],
      fontSize: 14
    },
    axisLabel: {
      color: '#8BA0C4',
      fontWeight: 400,
      fontFamily: 'SourceHanSansCN-Regular, SourceHanSansCN',
      fontSize: 10
    },
    axisTick: {
      lineStyle: {
        color: '#384267',
        width: 1
      },
      show: true
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#384267',
        type: 'line'
      }
    },
    axisLine: {
      lineStyle: {
        color: '#fff',
        width: 1,
        type: 'line'
      },
      show: false
    }
  },
  series: [
    {
      data: data,
      type: 'bar',
      barMaxWidth: 'auto',
      barWidth: 10,
      itemStyle: {
        color: {
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          type: 'linear',
          global: false,
          colorStops: [
            {
              offset: 0,
              color: '#00BFFF'
            },
            {
              offset: 1,
              color: '#54FF9F'
            }
          ]
        }
      },
      label: {
        show: true,
        distance: 10,
        color: '#fff',
        position: [30, 10]
      }
    }
  ]
});

interface Props {
  type: BillType;
}

function convertData(
  billType: BillType,
  cont: MonthContainerVO | YearContainerVO
) {
  const now = getNowDate();
  let type: BillSpan;
  if (cont instanceof MonthContainerVO) {
    type = BillSpan.Day;
  } else {
    type = BillSpan.Month;
  }

  const arrLen =
    type === BillSpan.Day
      ? getDaysOfMonth(now.year, now.month)
      : now.year > cont.dateAttr.year
      ? 12
      : now.month;
  const label: string[] = Array(arrLen);
  const token = type === BillSpan.Day ? '号' : '月';
  for (let i = 0; i < arrLen; i++) {
    label[i] = i + 1 + token;
  }

  const data: number[] = Array(arrLen);
  for (let i = 0; i < arrLen; i++) {
    const vo = cont.containers[i];
    if (!vo) {
      data[i] = 0;
      continue;
    }
    data[i] =
      billType === BillType.Export
        ? vo.totalExportAmount
        : vo.totalImportAmount;
  }

  return { label, data };
}

const BarChart: React.FC<Props> = props => {
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

    const obj = convertData(type, data);
    chart.current.setOption(option(obj.label, obj.data, type));
  }, [data]);

  return (
    <div
      ref={ref}
      style={{ height: '25vh', width: '90vw', marginTop: '2vh' }}
    ></div>
  );
};

export default BarChart;
