import { defaultRequest } from './default';
import { Interceptor } from './Interceptor';
import type { BreezeRequestOptions, BreezeMiddleware, BreezeErrorHandler, BreezeRequestConfig, BreezeRequestCustom, BreezeContext, BreezeNext } from './types';

/**
 * 支持的 HTTP 方法
 */
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
type HttpMethod = (typeof methods)[number];

/**
 * 请求方法接口，用于 Proxy 的返回类型
 */
interface RequestMethods<TRes = unknown> {
  [key: string]: <R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<R>;
}

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
   * 请求方法代理
   * @private
   */
  #proxy: BreezeRequest<TRes> & RequestMethods;

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

    // 创建代理对象
    this.#proxy = new Proxy(this as unknown as BreezeRequest<TRes> & RequestMethods, {
      get: (target: BreezeRequest<TRes> & RequestMethods, prop: string | symbol) => {
        if (prop in target) {
          return Reflect.get(target, prop);
        }

        // 如果是 HTTP 方法，创建对应的请求函数
        const httpMethod = prop.toString().toUpperCase();
        if (methods.includes(httpMethod as HttpMethod)) {
          return <R = TRes>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<R> => {
            return this.request<R>(url, data, { ...this.#defaultOptions, ...options, method: httpMethod });
          };
        }

        return undefined;
      }
    });

    // 返回代理对象
    return this.#proxy as unknown as BreezeInstance<TRes>;
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

    this.use(async (ctx: BreezeContext<unknown, TRes>, next: BreezeNext) => {
      await next();
      ctx.response = (await this.#request(ctx.request as BreezeRequestConfig)) as TRes;
    });

    // 执行拦截器
    await this.#interceptor.execute(context);

    return context.response as T;
  }

  /**
   * 添加中间件
   * @param {BreezeMiddleware} fn - 中间件函数
   * @returns {BreezeInstance} 返回当前实例，支持链式调用
   */
  use(fn: BreezeMiddleware<unknown, TRes>): BreezeInstance<TRes> {
    this.#interceptor.use(fn);
    return this.#proxy as unknown as BreezeInstance<TRes>;
  }

  /**
   * 添加错误处理中间件
   * @param {BreezeErrorHandler} fn - 错误处理中间件函数
   * @returns {BreezeInstance} 返回当前实例，支持链式调用
   */
  catch(fn: BreezeErrorHandler<unknown, TRes>): BreezeInstance<TRes> {
    this.#interceptor.catch(fn);
    return this.#proxy as unknown as BreezeInstance<TRes>;
  }

  /**
   * 添加 baseURL 中间件
   * @param {string} baseUrl - 基础 URL
   */
  useBaseUrl(baseUrl: string): BreezeInstance<TRes> {
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
}

// 定义 BreezeRequest 实例类型，包含原始类方法和 HTTP 方法
export type BreezeInstance<T = unknown> = BreezeRequest<T> & {
  GET: <R = T>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<R>;
  POST: <R = T>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<R>;
  PUT: <R = T>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<R>;
  DELETE: <R = T>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<R>;
  PATCH: <R = T>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<R>;
  HEAD: <R = T>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<R>;
  OPTIONS: <R = T>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<R>;
};
