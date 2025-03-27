import { defaultRequest } from './default';
import { Interceptor } from './Interceptor';
import type { BreezeRequestOptions, BreezeMiddleware, BreezeErrorHandler, BreezeRequestConfig, BreezeRequestCustom, BreezeContext, BreezeNext } from './types';

/**
 * BreezeRequest 类，提供 HTTP 请求方法和中间件支持
 * @class BreezeRequest
 */
export class BreezeRequest<TRes> {
  /**
   * 内部拦截器实例
   * @private
   */
  #interceptor: Interceptor<unknown, TRes>;

  /**
   * 默认请求选项
   * @private
   */
  #defaultOptions: BreezeRequestOptions;

  /**
   * 自定义请求处理函数
   * @private
   */
  #request: BreezeRequestCustom;

  /**
   * 请求任务句柄
   */
  taskHandle: unknown | null = null;

  /**
   * 创建 BreezeRequest 实例
   * @param {BreezeRequestOptions} options - 请求选项
   * @param {Function} requestCustom - 自定义请求处理函数
   */
  constructor(options: BreezeRequestOptions = {}, requestCustom: BreezeRequestCustom = defaultRequest) {
    this.#interceptor = new Interceptor();
    this.#defaultOptions = options;
    this.#request = requestCustom as BreezeRequestCustom;
  }

  /**
   * 发送请求
   * @param {string} url - 请求地址
   * @param {any} data - 请求数据
   * @param {Record<string, any>} options - 请求选项
   * @param {string} method - HTTP 方法
   * @returns {Promise<any>} 请求响应
   */
  async request<T = unknown>(url: string, data: unknown, options: BreezeRequestOptions): Promise<T> {
    const requestConfig = {
      url,
      data,
      options: { ...this.#defaultOptions, ...options },
      getTaskHandle: _taskHandle => (this.taskHandle = _taskHandle)
    } as BreezeRequestConfig;

    const context: BreezeContext<unknown, TRes> = {
      request: requestConfig,
      error: undefined,
      response: undefined
    };

    // 执行拦截器
    await this.#interceptor.execute(context, async (ctx: BreezeContext<unknown, TRes>, next: BreezeNext) => {
      await next();
      ctx.response = (await this.#request(ctx.request as BreezeRequestConfig)) as TRes & Record<string, unknown>;
    });

    return context.response as T;
  }

  /**
   * 添加中间件
   * @param {BreezeMiddleware} fn - 中间件函数
   * @returns {BreezeInstance} 返回当前实例，支持链式调用
   */
  use(fn: BreezeMiddleware<unknown, TRes>): BreezeRequest<TRes> {
    this.#interceptor.use(fn);
    return this;
  }

  /**
   * 添加错误处理中间件
   * @param {BreezeErrorHandler} fn - 错误处理中间件函数
   * @returns {BreezeInstance} 返回当前实例，支持链式调用
   */
  catch(fn: BreezeErrorHandler<unknown, TRes>): BreezeRequest<TRes> {
    this.#interceptor.catch(fn);
    return this;
  }

  /**
   * 添加 baseURL 中间件
   * @param {string} baseUrl - 基础 URL
   */
  useBaseUrl(baseUrl: string): BreezeRequest<TRes> {
    // 创建一个 baseURL 中间件
    const baseURLMiddleware = (baseURL: string) => {
      return async (ctx: BreezeContext<unknown, TRes>, next: BreezeNext) => {
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
    return this.request(url, params, { ...this.#defaultOptions, ...options, method: 'GET' });
  }

  POST<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request(url, data, { ...this.#defaultOptions, ...options, method: 'POST' });
  }

  PUT<R = TRes>(url: string, params?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request(url, params, { ...this.#defaultOptions, ...options, method: 'PUT' });
  }

  DELETE<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request(url, data, { ...this.#defaultOptions, ...options, method: 'DELETE' });
  }

  PATCH<R = TRes>(url: string, params?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request(url, params, { ...this.#defaultOptions, ...options, method: 'PATCH' });
  }

  HEAD<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request(url, data, { ...this.#defaultOptions, ...options, method: 'HEAD' });
  }

  OPTIONS<R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> {
    return this.request(url, data, { ...this.#defaultOptions, ...options, method: 'OPTIONS' });
  }
}
