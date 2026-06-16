import React, { useCallback, useContext, useState } from 'react';
import { Paper, Snackbar } from '@material-ui/core';
import { Button, Box } from '@material-ui/core';
import Input from '@components/Input';
import { LoadingButton } from '@material-ui/lab';
import { login } from '../../api/user';
import icon from '@assets/icon_trans.png';

import style from './index.module.scss';

import { useNavigate } from 'react-router-dom';
import { ToastCtx } from '@pages/People';

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPswd] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToast } = useContext(ToastCtx);

  const handleLogin = async () => {
    if (!username || !password) {
      return;
    }

    try {
      const { success, msg } = await login(username, password);
      setToast(msg);
      if (success) {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.log(err);
      setToast('网络错误, 请稍后重试');
    }
  };

  const handleOffline = useCallback(() => {
    localStorage.setItem('offline', '*');
    navigate('/', { replace: true });
  }, []);

  return (
    <Paper elevation={10} style={{ width: '100vw', height: '100vh' }}>
      <Paper
        elevation={24}
        style={{
          width: '90vw',
          margin: '0 auto',
          position: 'relative',
          top: '20%'
        }}
      >
        <Box
          component="form"
          sx={{
            '& > :not(style)': { m: 1 }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          noValidate
          autoComplete="off"
        >
          <img src={icon} style={{ width: '30vw', paddingBottom: '10px' }} />
          <Input
            className={style.inputs}
            value={username}
            setValue={setUsername}
            outlined
            label="用户名"
          />
          <Input
            type="password"
            className={style.inputs}
            value={password}
            setValue={setPswd}
            outlined
            label="密码"
          />
          <LoadingButton
            variant="contained"
            onClick={handleLogin}
            loading={loading}
          >
            登录
          </LoadingButton>
          <div>
            <Button variant="text" onClick={handleOffline}>
              离线使用
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/register', { replace: true })}
            >
              注册
            </Button>
          </div>
        </Box>
      </Paper>
    </Paper>
  );
};

export default Login;
