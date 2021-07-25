import React from "react";
import AddIcon from '@material-ui/icons/Add';
import MinimizeIcon from '@material-ui/icons/Minimize';
import Chip from '@material-ui/core/Chip';
import Stack from '@material-ui/core/Stack';

import { Bill } from '@PO/Bill';
import { BillType } from "@PO/enums";

interface Props {
  bill: Bill
}

const DayConsuItem: React.FC<Props> = (props) => {

  const { bill } = props;

  const Icon = bill.mode === BillType.Export ? MinimizeIcon : AddIcon;

  return (
    <div>
      <Icon />{bill.amount} {bill.remark}
      <Chip label={bill.type} variant="outlined" />
    </div>
  );
};

export default DayConsuItem;