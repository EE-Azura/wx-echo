import type { EchoRequestConfig } from './types';

/**
 * 默认请求处理函数，用于微信小程序环境
 * @param {EchoRequestConfig} config - 请求配置对象
 * @returns {Promise<WechatMiniprogram.RequestSuccessCallbackResult>} 请求结果的 Promise
 */
export const defaultRequest = (config: EchoRequestConfig<string | WechatMiniprogram.IAnyObject | ArrayBuffer>): Promise<WechatMiniprogram.RequestSuccessCallbackResult> => {
  const { url, data, options = {}, setTask } = config;
  const { method = 'GET', headers, ...restOptions } = options as { method?: WechatMiniprogram.RequestOption['method'] } & Omit<typeof options, 'method'>;

  return new Promise<WechatMiniprogram.RequestSuccessCallbackResult>((resolve, reject: (reason?: WechatMiniprogram.GeneralCallbackResult | Error) => void) => {
    if (!wx?.request) {
      return reject(new Error('wx.request is not defined. Please check if you are in a WeChat Mini Program environment.'));
    }

    const requestTask: WechatMiniprogram.RequestTask = wx.request({
      url,
      data,
      header: headers as WechatMiniprogram.IAnyObject | undefined, // Cast headers to the expected type
      method,
      success: resolve,
      ...restOptions,
      fail: reject
    });

    if (setTask) {
      setTask(requestTask);
    }
  });
};
