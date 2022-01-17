import React, { createRef, useContext } from "react";
import { Button } from "@material-ui/core";

import style from './index.module.scss';
import useBillOperator from "@hooks/useBillOperator";
import { AccountCtx } from '@assets/../App';
import { importRootContainer } from '@utils/localStore';
import SalaryCalc from "@components/SalaryCalc";
import WebDAV from "@components/WebDAV";

const People = () => {

  const { exportRootContainer } = useBillOperator();
  const ref = createRef<HTMLInputElement>();
  const { setCtx } = useContext(AccountCtx);
  const reader = new FileReader();

  reader.addEventListener('loadend', async () => {
    const arrayBuf = reader.result!;
    const blob = new Blob([arrayBuf]);
    const text = await blob.text();
    importRootContainer(text);
    setCtx(JSON.parse(text));
  })

  const handleChange = (e: any) => {
    if (!ref.current) return;
    const file = ref.current.files![0];
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className={style.page}>
      <div>
        个人中心
      </div>
      <Button variant="outlined" onClick={exportRootContainer}>导出数据</Button>
      <input type='file' ref={ref} onChange={handleChange} />
      <SalaryCalc />
      <WebDAV />
      <div>
        花销预算
      </div>
    </div>
  );
};

export default People;