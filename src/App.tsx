import React, { useState, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { getRootContainer } from '@utils/localStore';
import { RootContainer } from '@PO/BillContainer';

import ReCalc from '@components/ReCalc';
import Login from '@pages/Login';
import Register from '@pages/Register';
import Index from '@pages/Index';
import DataOrigin from '@hooks/useDataOrigin';

interface CtxType {
  accountCtx: RootContainer;
  setCtx: React.Dispatch<React.SetStateAction<RootContainer>>;
}

export const AccountCtx = createContext<CtxType>({} as CtxType);

function App() {
  const [account, setAccount] = useState(getRootContainer());

  return (
    <DataOrigin>
      <AccountCtx.Provider value={{ accountCtx: account, setCtx: setAccount }}>
        {/* <ReCalc /> */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </BrowserRouter>
      </AccountCtx.Provider>
    </DataOrigin>
  );
}

export default App;
