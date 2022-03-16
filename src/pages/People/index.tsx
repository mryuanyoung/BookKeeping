import React, { createRef, useContext } from 'react';
import { Button } from '@material-ui/core';

import style from './index.module.scss';
import useBillOperator from '@hooks/useBillOperator';
import { AccountCtx } from '@assets/../App';
import { importRootContainer } from '@utils/localStore';
import SalaryCalc from '@components/SalaryCalc';
import WebDAV from '@components/WebDAV';
import { useNavigate } from 'react-router-dom';

const People = () => {
  const { exportRootContainer } = useBillOperator();
  const ref = createRef<HTMLInputElement>();
  const { setCtx } = useContext(AccountCtx);
  const reader = new FileReader();

  const navigate = useNavigate();

  reader.addEventListener('loadend', async () => {
    const arrayBuf = reader.result!;
    const blob = new Blob([arrayBuf]);
    const text = await blob.text();
    importRootContainer(text);
    setCtx(JSON.parse(text));
  });

  const handleChange = (e: any) => {
    if (!ref.current) return;
    const file = ref.current.files![0];
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className={style.page}>
      <div>个人中心</div>
      <Button variant="outlined" onClick={exportRootContainer}>
        导出数据
      </Button>
      <input type="file" ref={ref} onChange={handleChange} />
      <SalaryCalc />
      <WebDAV />

      <div>花销预算</div>
      <Button
        variant="outlined"
        onClick={() => navigate('/login', { replace: true })}
      >
        登录
      </Button>
    </div>
  );
};

export default People;
