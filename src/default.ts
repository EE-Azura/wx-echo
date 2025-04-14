import type { BreezeRequestConfig } from './types';

/**
 * 默认请求处理函数，用于微信小程序环境
 * @param {BreezeRequestConfig} config - 请求配置对象
 * @returns {Promise<WechatMiniprogram.RequestSuccessCallbackResult>} 请求结果的 Promise
 */
export const defaultRequest = (config: BreezeRequestConfig<string | WechatMiniprogram.IAnyObject | ArrayBuffer>): Promise<WechatMiniprogram.RequestSuccessCallbackResult> => {
  const { url, data, options = {}, getTaskHandle } = config;
  const { method = 'GET', ...restOptions } = options as { method?: WechatMiniprogram.RequestOption['method'] } & Omit<typeof options, 'method'>;

  return new Promise<WechatMiniprogram.RequestSuccessCallbackResult>((resolve, reject: (reason?: WechatMiniprogram.GeneralCallbackResult | Error) => void) => {
    if (!wx?.request) {
      return reject(new Error('wx.request is not defined. Please check if you are in a WeChat Mini Program environment.'));
    }

    const requestTask: WechatMiniprogram.RequestTask = wx.request({
      url,
      data,
      method,
      success: resolve,
      ...restOptions,
      fail: reject
    });

    if (getTaskHandle) {
      getTaskHandle(requestTask);
    }
  });
};
