import useBillOperator from "@hooks/useBillOperator";
import React from "react";
import { useEffect } from "react";

const ReCalc = () => {
  const {ClearAndReCalcAccount} = useBillOperator();

  useEffect(() => {
    ClearAndReCalcAccount();
  }, []);

  return null;
};

export default ReCalc;