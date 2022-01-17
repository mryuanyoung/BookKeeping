import Axios from "@utils/axios";

export interface BaseReq {
  username: string,
  password: string
}

export interface CreateFile extends BaseReq{
  filename?: string,
  json: string
}

export interface GetFileReq extends BaseReq{
  path?: string
  filename?: string
}

export interface Response<T>{
  success: boolean,
  message: string
  res: T,
}

export function backupData(json: string, username: string, password: string): Promise<Response<boolean>>{
  return Axios.post('/createFile', {
    json,
    username,
    password
  })
}