import React, { useState, Dispatch, SetStateAction } from "react";

import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import ClearIcon from '@material-ui/icons/Clear';

interface Props {
  label: string;
  value: string;
  setValue: Function;
  style?: any;
  className?: string;
  number?: boolean;
  errMsg?: string;
  outlined?: boolean;
  prefix?: string;
  type?: string;
}

const MyInput: React.FC<Props> = (props) => {

  const { label, value, setValue, style, className = '', errMsg = '', number = false, outlined = false, prefix = '', type = 'text' } = props;

  const [error, setError] = useState(false);

  const InputElement = outlined ? OutlinedInput : Input;

  const handleChange = (value: string) => {
    setValue(value);
    if (number) {
      setError((!!value && (parseFloat(value) + '' !== value)));
    }
  }

  return (
    <FormControl style={style} className={className} variant={outlined ? 'outlined' : 'standard'}>
      <InputLabel error={error}>{label}</InputLabel>
      <InputElement
        type={type}
        label={label}
        error={error}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        startAdornment={prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : null}
        endAdornment={value ? <ClearIcon color={error ? 'error' : 'primary'} fontSize="small" onClick={() => handleChange('')} /> : null}
      />
      {
        error ? <FormHelperText error>{errMsg}</FormHelperText> : null
      }
    </FormControl>
  );
};

export default MyInput;