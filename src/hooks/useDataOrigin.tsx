import { INDEXEDDB } from '@constants/dataOrigin';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState
} from 'react';

interface DataCtx {
  origin: number;
  setOrigin: Dispatch<SetStateAction<number>>;
}

export const DataOriginCtx = createContext({} as DataCtx);

export const useDataOrigin = () => {
  return useContext(DataOriginCtx);
};

const DataOrigin: React.FC = props => {
  const [origin, setOrigin] = useState(INDEXEDDB);

  return (
    <DataOriginCtx.Provider value={{ origin, setOrigin }}>
      {props.children}
    </DataOriginCtx.Provider>
  );
};

export default DataOrigin;
