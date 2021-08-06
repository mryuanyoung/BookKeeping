import React, { useState, createContext } from 'react';

import { getRootContainer } from '@utils/localStore';
import { RootContainer } from '@PO/BillContainer';

import BillPage from '@pages/Bill';
import AccountPage from '@pages/Account';
import PeoplePage from '@pages/People';
import RouteComponent from '@components/RouteComponent';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import PhoneIcon from '@material-ui/icons/Phone';
import FavoriteIcon from '@material-ui/icons/Favorite';
import PersonPinIcon from '@material-ui/icons/PersonPin';
import style from './App.module.scss';
import useBillOperator from '@hooks/useBillOperator';

interface CtxType {
  accountCtx: RootContainer,
  setCtx: React.Dispatch<React.SetStateAction<RootContainer>>,
}

export const AccountCtx = createContext<CtxType>({} as CtxType);

function App() {

  const [account, setAccount] = useState(getRootContainer());
  const { ClearAndReCalcAccount } = useBillOperator();
  const [idx, setIdx] = useState(0);


  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setIdx(newValue);
  };


  return (
    <AccountCtx.Provider value={{ accountCtx: account, setCtx: setAccount }}>
      {/* {ClearAndReCalcAccount()} */}
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
      <Tabs id={style.tabs} value={idx} variant="fullWidth" onChange={handleChange} visibleScrollbar>
        <Tab icon={<PhoneIcon />} label="记账" />
        <Tab icon={<FavoriteIcon />} label="账单" />
        <Tab icon={<PersonPinIcon />} label="个人" />
      </Tabs>
    </AccountCtx.Provider>
  );
}

export default App;
