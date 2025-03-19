import { defaultRequest } from './default';
import { Interceptor } from './Interceptor';
import type { BreezeRequestOptions, MiddlewareFunction, ErrorHandlerFunction, BreezeRequestConfig, BreezeRequestCustom } from './types';

/**
 * 支持的 HTTP 方法
 */
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
type HttpMethod = (typeof methods)[number];

/**
 * 请求方法接口，用于 Proxy 的返回类型
 */
interface RequestMethods {
  [key: string]: <T = unknown>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<T>;
}

/**
 * BreezeRequest 类，提供 HTTP 请求方法和中间件支持
 * @class BreezeRequest
 */
export class BreezeRequest {
  /**
   * 内部拦截器实例
   * @private
   */
  #interceptor: Interceptor;

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
  #proxy: BreezeRequest & RequestMethods;

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
    this.#proxy = new Proxy(this as unknown as BreezeRequest & RequestMethods, {
      get: (target: BreezeRequest & RequestMethods, prop: string | symbol) => {
        if (prop in target) {
          return Reflect.get(target, prop);
        }

        // 如果是 HTTP 方法，创建对应的请求函数
        const propStr = prop.toString().toUpperCase();
        if (methods.includes(propStr as HttpMethod)) {
          return <T = unknown>(url: string, data?: unknown, options?: BreezeRequestOptions): Promise<T> => {
            return this.#fetch<T>(url, data, { ...this.#defaultOptions, ...options }, propStr);
          };
        }

        return undefined;
      }
    });

    // 返回代理对象
    return this.#proxy as unknown as BreezeRequestInstance;
  }

  /**
   * 发送请求的内部方法
   * @private
   * @param {string} url - 请求地址
   * @param {any} data - 请求数据
   * @param {Record<string, any>} options - 请求选项
   * @param {string} method - HTTP 方法
   * @returns {Promise<any>} 请求响应
   */
  async #fetch<T = unknown>(url: string, data: unknown, options: BreezeRequestOptions, method = 'GET'): Promise<T> {
    const context = {
      request: {
        url,
        data,
        options,
        method
      },
      response: null as unknown
    };

    // 调用请求处理函数获取实际请求配置
    const requestConfig = {
      url,
      data,
      options: { ...this.#defaultOptions, ...options },
      method,
      getTaskHandle: _taskHandle => (this.taskHandle = _taskHandle)
    } as BreezeRequestConfig;

    this.#interceptor.use(async (ctx, next) => {
      await next();
      ctx.response = await this.#request(requestConfig);
    });

    // 执行拦截器
    await this.#interceptor.execute(context);

    return context.response as T;
  }

  /**
   * 添加中间件
   * @param {MiddlewareFunction} fn - 中间件函数
   * @returns {BreezeRequestInstance} 返回当前实例，支持链式调用
   */
  use(fn: MiddlewareFunction): BreezeRequestInstance {
    this.#interceptor.use(fn);
    return this.#proxy as unknown as BreezeRequestInstance;
  }

  /**
   * 添加错误处理中间件
   * @param {ErrorHandlerFunction} fn - 错误处理中间件函数
   * @returns {BreezeRequestInstance} 返回当前实例，支持链式调用
   */
  catch(fn: ErrorHandlerFunction): BreezeRequestInstance {
    this.#interceptor.catch(fn);
    return this.#proxy as unknown as BreezeRequestInstance;
  }
}

// 定义 BreezeRequest 实例类型，包含原始类方法和 HTTP 方法
export type BreezeRequestInstance = BreezeRequest & {
  GET: <T = unknown>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<T>;
  POST: <T = unknown>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<T>;
  PUT: <T = unknown>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<T>;
  DELETE: <T = unknown>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<T>;
  PATCH: <T = unknown>(url: string, data?: unknown, options?: BreezeRequestOptions) => Promise<T>;
  HEAD: <T = unknown>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<T>;
  OPTIONS: <T = unknown>(url: string, params?: unknown, options?: BreezeRequestOptions) => Promise<T>;
};
