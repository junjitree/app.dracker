import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { defineBoot } from '#q-app/wrappers';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

interface ErrorData {
  msg: string;
}

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  withCredentials: true,
});

export default defineBoot(async ({ app }) => {
  let csrfToken = null;

  try {
    const response = await api.get('/v1/csrf');
    csrfToken = response.headers['x-csrf-token'];
  } catch (error) {
    console.error('Failed to retrieve CSRF token:', error);
  }

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const method = config.method?.toLowerCase() ?? '';

      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        if (csrfToken) {
          config.headers['x-csrf-token'] = csrfToken;
        }
      }

      return config;
    },

    (error: AxiosError) => {
      return Promise.reject(error);
    },
  );

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },

    (error: AxiosError) => {
      if (
        error.response?.status === 401 &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'msg' in error.response.data
      ) {
        const data = error.response.data as ErrorData;
        if (data.msg === 'Unauthorized') {
          window.location.href = '/';
        }
      }

      return Promise.reject(error);
    },
  );

  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
