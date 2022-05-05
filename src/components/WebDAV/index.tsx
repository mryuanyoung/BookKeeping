import Input from '@components/Input';
import { getAllData } from '@database/db';
import useBillOperator from '@hooks/useBillOperator';
import { Button, Modal, Box, Snackbar, Alert } from '@material-ui/core';
import { LoadingButton } from '@material-ui/lab';
import { ToastCtx } from '@pages/People';
import { useState, useContext } from 'react';
import { backupData } from '../../api/webdav';
import FileListModal from './FIleListModal';

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

  const webdavAccount = JSON.parse(localStorage.getItem('account') || '{}');

  const [username, setUsername] = useState(webdavAccount.username || '');
  const [password, setPassword] = useState(webdavAccount.password || '');
  const { setToast } = useContext(ToastCtx);
  const [loading, setLoading] = useState(false);
  const [fileListModal, setFileListModal] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

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
      const json = await getAllData();
      const res = await backupData(JSON.stringify(json));
      if (res.success) {
        setToast('备份成功!');
      } else {
        setToast('备份失败!');
      }
    } catch (err) {
      setToast('备份失败!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '60%' }}>
      <FileListModal
        loading={fileLoading}
        visible={fileListModal}
        close={() => setFileListModal(false)}
        stopLoading={() => setFileLoading(false)}
      />
      <Modal open={baseInfoVisi} onClose={() => setBaseInfoVisi(false)}>
        <Box
          component="form"
          sx={{
            '& > :not(style)': { m: 1 },
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
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
            type="password"
            style={{ width: '80vw' }}
            value={password}
            setValue={setPassword}
            outlined
            label="密码"
          />
          <Button
            variant="outlined"
            onClick={handleSubmit}
            style={{ marginBottom: '2vh' }}
          >
            保存
          </Button>
        </Box>
      </Modal>
      <Button
        variant="outlined"
        onClick={() => setBaseInfoVisi(true)}
        style={{ width: '100%', marginBottom: '2vh' }}
      >
        云盘账户
      </Button>
      <LoadingButton
        loading={fileLoading}
        variant="outlined"
        onClick={() => {
          setFileListModal(true);
          setFileLoading(true);
        }}
        style={{ width: '100%', marginBottom: '2vh' }}
      >
        云盘导入
      </LoadingButton>
      <LoadingButton
        variant="outlined"
        onClick={webDAVBackup}
        loading={loading}
      >
        云盘备份
      </LoadingButton>
    </div>
  );
};

export default WebDAV;
