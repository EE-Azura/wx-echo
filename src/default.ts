import type { BreezeRequestConfig } from './types';

/**
 * 默认请求处理函数，用于微信小程序环境
 * @param {object} params - 请求参数对象
 * @param {string} params.url - 请求地址
 * @param {object} params.data - 请求数据
 * @param {object} params.options - 请求选项
 * @param {string} params.method - HTTP 方法
 * @param {Function} params.getTaskHandle - 获取请求任务的回调函数
 * @returns {Promise<any>} 请求结果的 Promise
 */
export const defaultRequest = ({ url, data, options, method, getTaskHandle }: BreezeRequestConfig) => {
  return new Promise((resolve, reject) => {
    const requestTask = wx.request({
      url,
      data,
      method,
      ...options,
      success: resolve,
      fail: reject
    });
    if (getTaskHandle) {
      getTaskHandle(requestTask);
    }
  });
};
