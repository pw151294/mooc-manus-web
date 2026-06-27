// src/api/request.ts
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';

// 自定义Axios实例类型,重写响应类型为 T(而非 AxiosResponse<T>)
// 原因: 响应拦截器中直接返回 response.data,因此调用方应直接收到数据
interface CustomAxiosInstance extends Omit<
  AxiosInstance,
  'get' | 'post' | 'put' | 'delete' | 'patch'
> {
  get<T = unknown>(url: string, config?: Parameters<AxiosInstance['get']>[1]): Promise<T>;
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Parameters<AxiosInstance['post']>[2]
  ): Promise<T>;
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Parameters<AxiosInstance['put']>[2]
  ): Promise<T>;
  delete<T = unknown>(url: string, config?: Parameters<AxiosInstance['delete']>[1]): Promise<T>;
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Parameters<AxiosInstance['patch']>[2]
  ): Promise<T>;
}

// 创建Axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

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
