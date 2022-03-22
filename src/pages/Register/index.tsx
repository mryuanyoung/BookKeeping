import React, { useCallback, useState } from 'react';
import { Paper, Input as RAWInput, Snackbar } from '@material-ui/core';
import { Button, Box } from '@material-ui/core';
import Input from '@components/Input';
import icon from '@assets/icon_trans.png';
import { register } from '../../api/user';

import style from './index.module.scss';

import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPswd] = useState('');
  const [toast, setToast] = useState('');

  const handleRegister = async () => {
    if (!username || !password) {
      return;
    }

    try {
      const { success, msg } = await register(username, password);
      if (success) {
        setToast('注册成功, 请登录');
        navigate('/login', { replace: true });
      } else {
        setToast(msg);
      }
    } catch (err) {
      console.log(err);
      setToast('网络错误, 请稍后重试');
    }
  };

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
            '& > :not(style)': { m: 1 },
            paddingBottom: '20px'
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

          <div>
            <Button variant="contained" onClick={handleRegister}>
              注册
            </Button>
            <Button
              variant="text"
              style={{ position: 'absolute', right: '30px' }}
              onClick={() => navigate('/login', { replace: true })}
            >
              登录
            </Button>
          </div>
        </Box>
      </Paper>
      <Snackbar
        open={toast !== ''}
        onClose={() => setToast('')}
        autoHideDuration={2000}
        message={toast}
      />
    </Paper>
  );
};

export default Register;
