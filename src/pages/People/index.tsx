import React from "react";
import { Button } from "@material-ui/core";

import style from './index.module.scss';
import useBillOperator from "@hooks/useBillOperator";

const People = () => {

  const { exportRootContainer } = useBillOperator();

  return (
    <div className={style.page}>
      个人中心
      <Button variant="outlined" onClick={exportRootContainer}>导出数据</Button>
    </div>
  );
};

export default People;