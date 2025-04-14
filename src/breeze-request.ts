import { defaultRequest } from './default';
import { Interceptor } from './Interceptor';
import type { BreezeRequestOptions, BreezeMiddleware, BreezeErrorHandler, BreezeRequestConfig, BreezeRequestCustom, BreezeContext, BreezeNext } from './types';

/**
 * BreezeRequest 类，提供 HTTP 请求方法和中间件支持
 * @class BreezeRequest
 */
export class BreezeRequest<TReq = unknown, TRes = unknown> {
  /**
   * 内部拦截器实例
   * @private
   */
  #interceptor: Interceptor<TReq, TRes>;

  /**
   * 默认请求选项
   * @private
   */
  #defaultOptions: BreezeRequestOptions;

  /**
   * 自定义请求处理函数
   * @private
   */
  #request: BreezeRequestCustom<TReq, TRes>;

  /**
   * 请求任务句柄
   */
  taskHandle: unknown | null = null;

  /**
   * 创建 BreezeRequest 实例
   * @param {BreezeRequestOptions} options - 请求选项
   * @param {Function} requestCustom - 自定义请求处理函数
   */
  constructor(options: BreezeRequestOptions = {}, requestCustom: BreezeRequestCustom<TReq, TRes> = defaultRequest as BreezeRequestCustom<TReq, TRes>) {
    this.#interceptor = new Interceptor<TReq, TRes>();
    this.#defaultOptions = options;
    this.#request = requestCustom;
  }

  /**
   * 发送请求
   * @param {string} url - 请求地址
   * @param {TReq} data - 请求数据
   * @param {Record<string, any>} options - 请求选项
   * @returns {Promise<R>} 请求响应
   */
  async request<R = TRes>(url: string, data: TReq, options: BreezeRequestOptions): Promise<R> {
    const requestConfig: BreezeRequestConfig<TReq> = {
      url,
      data,
      options: { ...this.#defaultOptions, ...options },
      getTaskHandle: _taskHandle => (this.taskHandle = _taskHandle)
    };

    const context: BreezeContext<TReq, TRes> = {
      request: requestConfig,
      error: undefined,
      response: undefined
    };

    // 执行拦截器
    await this.#interceptor.execute(context, async (ctx: BreezeContext<TReq, TRes>, next: BreezeNext) => {
      await next();
      ctx.response = await this.#request(ctx.request);
    });

    return context.response as R;
  }

  /**
   * 添加中间件
   * @param {BreezeMiddleware} fn - 中间件函数
   * @returns {BreezeRequest<TReq, TRes>} 返回当前实例，支持链式调用
   */
  use(fn: BreezeMiddleware<TReq, TRes>): BreezeRequest<TReq, TRes> {
    this.#interceptor.use(fn);
    return this;
  }

  /**
   * 添加错误处理中间件
   * @param {BreezeErrorHandler} fn - 错误处理中间件函数
   * @returns {BreezeRequest<TReq, TRes>} 返回当前实例，支持链式调用
   */
  catch(fn: BreezeErrorHandler<TReq, TRes>): BreezeRequest<TReq, TRes> {
    this.#interceptor.catch(fn);
    return this;
  }

  /**
   * 添加 baseURL 中间件
   * @param {string} baseUrl - 基础 URL
   */
  useBaseUrl(baseUrl: string): BreezeRequest<TReq, TRes> {
    const baseURLMiddleware = (baseURL: string) => {
      return async (ctx: BreezeContext<TReq, TRes>, next: BreezeNext) => {
        if (ctx.request && ctx.request.url && !ctx.request.url.startsWith('http')) {
          ctx.request.url = `${baseURL}${ctx.request.url}`;
        }
        await next();
      };
    };
    return this.use(baseURLMiddleware(baseUrl));
  }

  // http 方法
  GET<R = TRes>(url: string, params?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, params as TReq, { ...this.#defaultOptions, ...options, method: 'GET' });
  }

  POST<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, data as TReq, { ...this.#defaultOptions, ...options, method: 'POST' });
  }

  PUT<R = TRes>(url: string, params?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, params as TReq, { ...this.#defaultOptions, ...options, method: 'PUT' });
  }

  DELETE<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, data as TReq, { ...this.#defaultOptions, ...options, method: 'DELETE' });
  }

  PATCH<R = TRes>(url: string, params?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, params as TReq, { ...this.#defaultOptions, ...options, method: 'PATCH' });
  }

  HEAD<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, data as TReq, { ...this.#defaultOptions, ...options, method: 'HEAD' });
  }

  OPTIONS<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request<R>(url, data as TReq, { ...this.#defaultOptions, ...options, method: 'OPTIONS' });
  }
}
