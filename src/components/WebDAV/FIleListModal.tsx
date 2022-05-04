import { importJSONToIndexedDB } from '@database/db';
import { Button, Modal, Box, Snackbar, Alert } from '@material-ui/core';
import { ToastCtx } from '@pages/People';
import { useContext, useEffect, useState } from 'react';
import { FileStat, getFileContent, getFileList } from '../../api/webdav';

interface Props {
  visible: boolean;
  close: () => void;
}

const FileListModal: React.FC<Props> = props => {
  const { visible, close } = props;
  const [files, setFiles] = useState<FileStat[]>([]);
  const { setToast } = useContext(ToastCtx);

  useEffect(() => {
    if (!visible) {
      return;
    }

    (async function () {
      try {
        const { success, res } = await getFileList();
        if (!success) {
          return;
        }
        setFiles(res);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [visible]);

  const handleClick = async (file: FileStat) => {
    close();
    try {
      const { success, res, message } = await getFileContent(file.filename);
      if (!success) {
        throw new Error(message);
      }
      await importJSONToIndexedDB(res);
      setToast('导入成功!');
    } catch (err) {
      setToast('导入失败!');
      console.error(err);
    }
  };

  return (
    <Modal open={visible} onClose={close}>
      <div style={{ backgroundColor: 'white', padding: '1vh' }}>
        {files.map(file => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <span>{file.filename.split('/').slice(-1)}</span>
            <Button onClick={() => handleClick(file)}>选择</Button>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default FileListModal;
