import React, { useContext } from 'react';
import AddIcon from '@material-ui/icons/AddBox';
import MinimizeIcon from '@material-ui/icons/IndeterminateCheckBox';
import Chip from '@material-ui/core/Chip';

import style from './index.module.scss';
import { Bill } from '@PO/Bill';
import { BillType } from '@PO/enums';

interface Props {
  bill: Bill;
}

const DayConsuItem: React.FC<Props> = props => {
  const { bill } = props;

  const Icon = bill.mode === BillType.Export ? MinimizeIcon : AddIcon;

  return (
    <div className={style.consumptionItem}>
      <Icon style={{ verticalAlign: 'middle' }} />
      <span
        style={{ verticalAlign: 'middle', marginLeft: '1vw', maxWidth: '64%' }}
      >
        {bill.amount}:&nbsp;&nbsp;{bill.remark}
      </span>
      <Chip
        label={bill.type}
        variant="outlined"
        style={{ position: 'absolute', right: '3vw' }}
      />
    </div>
  );
};

export default DayConsuItem;
