import React, {
  createRef,
  useContext,
  useRef,
  useState,
  createContext,
  useMemo,
  Dispatch,
  SetStateAction
} from 'react';
import {
  Button,
  Avatar,
  Grid,
  Paper,
  Box,
  Snackbar,
  Alert
} from '@material-ui/core';

import style from './index.module.scss';
import useBillOperator from '@hooks/useBillOperator';
import { AccountCtx } from '@assets/../App';
import { importRootContainer } from '@utils/localStore';
import SalaryCalc from '@components/SalaryCalc';
import WebDAV from '@components/WebDAV';
import { useNavigate } from 'react-router-dom';
import { exportData, importJSONToIndexedDB } from '@database/db';
import HousingFundCalc from '@components/HousingFundCalc';
import EstateCalc from '@components/EstateCalc';

export const ToastCtx = createContext({
  toast: '',
  setToast: function () {} as Dispatch<SetStateAction<string>>
});

const People = () => {
  const { exportRootContainer } = useBillOperator();
  const ref = createRef<HTMLInputElement>();
  const { setCtx } = useContext(AccountCtx);
  const reader = useRef(new FileReader());

  const [toast, setToast] = useState('');
  const ctxValue = useMemo(() => ({ toast, setToast }), [toast, setToast]);

  const navigate = useNavigate();

  reader.current.addEventListener('loadend', async () => {
    try {
      const arrayBuf = reader.current.result!;
      const blob = new Blob([arrayBuf]);
      const text = await blob.text();
      // 导入外部数据到数据库
      await importJSONToIndexedDB(text);
      setToast('导入成功!');
    } catch (err) {
      setToast('导入失败!');
    }
  });

  const handleChange = (e: any) => {
    if (!ref.current) return;
    const file = ref.current.files![0];
    reader.current.readAsArrayBuffer(file);
  };

  return (
    <div className={style.page}>
      <ToastCtx.Provider value={ctxValue}>
        <div style={{ height: '30%', display: 'flow-root' }}>
          <Avatar
            style={{
              width: '40vw',
              height: '40vw',
              margin: '0 auto',
              marginTop: '5vh'
            }}
          />
        </div>
        <div className={style.row} style={{ height: '60%' }}>
          <div className={style.col}>
            <Paper
              elevation={12}
              className={style.paper}
              style={{ backgroundColor: '#fff1f0' }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate('/login', { replace: true })}
                style={{ width: '60%' }}
              >
                登录
              </Button>
            </Paper>
            <Paper
              elevation={12}
              className={style.paper}
              style={{ backgroundColor: '#fffbe6' }}
            >
              <SalaryCalc />
              <HousingFundCalc />
              <EstateCalc />
            </Paper>
          </div>

          <div className={style.col}>
            <Paper
              elevation={12}
              className={style.paper}
              style={{ backgroundColor: '#f9f0ff' }}
            >
              <Button
                variant="outlined"
                onClick={exportData}
                style={{ width: '60%' }}
              >
                导出数据
              </Button>
              <div style={{ marginTop: '2vh', width: '60%' }}>
                <input
                  type="file"
                  ref={ref}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  onClick={() => ref.current?.click()}
                  style={{ width: '100%' }}
                >
                  数据导入
                </Button>
              </div>
            </Paper>
            <Paper
              elevation={12}
              className={style.paper}
              style={{ backgroundColor: '#e6fffb' }}
            >
              <WebDAV />
            </Paper>
          </div>
        </div>
      </ToastCtx.Provider>
      <Snackbar
        open={toast !== ''}
        onClose={() => setToast('')}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          variant="filled"
          onClose={() => setToast('')}
          severity="info"
          sx={{ width: '100%' }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default People;
