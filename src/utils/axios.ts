import axios from 'axios';

const Axios = axios.create({
  baseURL: 'http://101.33.125.161:8085',
  // baseURL: 'http://localhost:3001'
});

Axios.interceptors.request.use(
  (config) => {
    //请求之前
    return config;
  },
  (error) => {
    //错误处理
    return Promise.reject(error);
  }
)

Axios.interceptors.response.use(
  (response) => {
    //处理响应数据
    const res = response.data;
    return res;
  },
  (error) => {
    //错误处理
    return Promise.reject(error);
  }
)

export default Axios;