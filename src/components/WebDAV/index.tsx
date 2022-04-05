import Input from '@components/Input';
import useBillOperator from '@hooks/useBillOperator';
import { Button, Modal, Box, Snackbar } from '@material-ui/core';
import { LoadingButton } from '@material-ui/lab';
import { useState } from 'react';
import { backupData } from '../../api/webdav';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
};

const WebDAV = () => {
  const [baseInfoVisi, setBaseInfoVisi] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const { showAccount } = useBillOperator();

  const handleSubmit = () => {
    if (!username || !password) {
      return;
    }

    localStorage.setItem(
      'account',
      JSON.stringify({
        username,
        password
      })
    );

    setBaseInfoVisi(false);

    setToast('保存成功!');
  };

  const webDAVBackup = async () => {
    const account = JSON.parse(localStorage.getItem('account') || '{}');
    if (!account.password || !account.username) {
      setToast('请配置基本信息!');
      return;
    }

    setLoading(true);

    try {
      const json = JSON.stringify(showAccount());
      const res = await backupData(json, account.username, account.password);
      if (res.success) {
        setToast('备份成功!');
      } else {
        setToast('备份失败!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '60%' }}>
      <Modal open={baseInfoVisi} onClose={() => setBaseInfoVisi(false)}>
        <Box
          component="form"
          sx={{
            '& > :not(style)': { m: 1 },
            background: 'white'
          }}
          noValidate
          autoComplete="off"
        >
          <Input
            style={{ width: '80vw' }}
            value={username}
            setValue={setUsername}
            outlined
            label="用户名"
          />
          <Input
            style={{ width: '80vw' }}
            value={password}
            setValue={setPassword}
            outlined
            label="密码"
          />
          <Button variant="outlined" onClick={handleSubmit}>
            保存
          </Button>
        </Box>
      </Modal>
      <Button
        variant="outlined"
        onClick={() => setBaseInfoVisi(true)}
        style={{ width: '100%', marginBottom: '2vh' }}
      >
        基本信息
      </Button>
      <LoadingButton
        variant="outlined"
        onClick={webDAVBackup}
        loading={loading}
      >
        云盘备份
      </LoadingButton>
      <Snackbar
        open={toast !== ''}
        onClose={() => setToast('')}
        autoHideDuration={2000}
        message={toast}
      />
    </div>
  );
};

export default WebDAV;
