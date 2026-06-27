// src/api/request.ts
import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { message } from 'antd';

// 创建Axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可在此添加token等认证信息
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 后端直接返回数据(无统一封装),直接透传
    return response.data;
  },
  (error: AxiosError<{ error?: string }>) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message.error(data?.error || '请求参数错误');
          break;
        case 404:
          message.error(data?.error || '资源不存在');
          break;
        case 409:
          message.error(data?.error || '资源冲突');
          break;
        case 500:
          message.error(data?.error || '服务器错误');
          break;
        default:
          message.error(data?.error || '请求失败');
      }
    } else if (error.request) {
      message.error('网络连接失败');
    } else {
      message.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

export default request;
