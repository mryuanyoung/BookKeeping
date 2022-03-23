import { BillType } from '@PO/enums';
import { useEffect, useRef } from 'react';
import BarChart from './barChart';
import PieChart from './pieChart';

const StatChart = () => {
  console.log('stat chart render');
  return (
    <div
      style={{
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <BarChart type={BillType.Export} />
      <BarChart type={BillType.Import} />
      <div style={{ display: 'flex' }}>
        <PieChart type={BillType.Export} />
        <PieChart type={BillType.Import} />
      </div>
    </div>
  );
};

export default StatChart;
