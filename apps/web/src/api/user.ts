import Axios from '@utils/axios';

interface Response<T> {
  msg: string;
  success: boolean;
  detail: T;
}

export function login(
  username: string,
  password: string
): Promise<Response<any>> {
  return Axios.post('/backend/login', {
    username,
    password
  });
}

export function register(
  username: string,
  password: string
): Promise<Response<any>> {
  return Axios.post('/backend/register', {
    username,
    password
  });
}
