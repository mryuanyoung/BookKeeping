import Axios from '@utils/axios';
import { getWebDAVAccount } from '@utils/localStore';

export interface BaseReq {
  username: string;
  password: string;
}

export interface CreateFile extends BaseReq {
  filename?: string;
  json: string;
}

export interface GetFileReq extends BaseReq {
  path?: string;
  filename?: string;
}

export interface Response<T> {
  success: boolean;
  message: string;
  res: T;
}

export interface FileStat {
  filename: string;
  basename: string;
  lastmod: string;
  size: number;
  type: string;
  etag: string;
  mime: string;
}

function url(path: string) {
  // return `http://localhost:3001${path}`;
  return `http://101.33.125.161:8085${path}`;
}

export function backupData(json: string): Promise<Response<boolean>> {
  const { username, password } = getWebDAVAccount();
  return Axios.post(url('/createFile'), {
    json,
    username,
    password
  });
}

export function getFileList(): Promise<Response<FileStat[]>> {
  const { username, password } = getWebDAVAccount();
  return Axios.post(url('/files'), {
    username,
    password
  });
}

export function getFileContent(filename: string): Promise<Response<string>> {
  const { username, password } = getWebDAVAccount();
  return Axios.post(url('/fileContent'), {
    filename,
    username,
    password
  });
}
