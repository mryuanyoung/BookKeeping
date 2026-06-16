import { useState } from 'react';

import BillPage from '@pages/Bill';
import AccountPage from '@pages/Account';
import PeoplePage from '@pages/People';
import RouteComponent from '@components/RouteComponent';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import CreateIcon from '@material-ui/icons/Create';
import ReceiptIcon from '@material-ui/icons/Receipt';
import PersonPinIcon from '@material-ui/icons/PersonPin';

import useAuth from '@hooks/useAuth';

import style from './index.module.scss';

const Index = () => {
  useAuth();

  const [idx, setIdx] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setIdx(newValue);
  };
  return (
    <>
      <div id={style.container}>
        <RouteComponent index={0} curr={idx}>
          <BillPage />
        </RouteComponent>
        <RouteComponent index={1} curr={idx}>
          <AccountPage />
        </RouteComponent>
        <RouteComponent index={2} curr={idx}>
          <PeoplePage />
        </RouteComponent>
      </div>
      <Tabs
        id={style.tabs}
        value={idx}
        variant="fullWidth"
        onChange={handleChange}
        visibleScrollbar
      >
        <Tab icon={<CreateIcon />} label="记账" />
        <Tab icon={<ReceiptIcon />} label="账单" />
        <Tab icon={<PersonPinIcon />} label="个人" />
      </Tabs>
    </>
  );
};

export default Index;
