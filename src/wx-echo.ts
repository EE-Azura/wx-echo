import { defaultRequest } from './default';
import { Interceptor } from './Interceptor';
import type {
  EchoRequestOptions,
  EchoMiddleware,
  EchoErrorHandler,
  EchoRequestConfig,
  EchoRequestCustom,
  EchoContext,
  EchoNext,
  EchoRequestHandle,
  EchoRequestTask
} from './types';

/**
 * Echo 类，提供 HTTP 请求方法和中间件支持
 * @class Echo
 */
export class Echo<TReq = string | object | ArrayBuffer, TRes = unknown> {
  /**
   * 内部拦截器实例
   * @private
   */
  #interceptor: Interceptor<TReq, TRes>;

  /**
   * 默认请求选项
   * @private
   */
  #defaultOptions: EchoRequestOptions;

  /**
   * 自定义请求处理函数
   * @private
   */
  #request: EchoRequestCustom<TReq, TRes>;

  /**
   * 创建 Echo 实例
   * @param {EchoRequestOptions} options - 请求选项
   * @param {Function} requestCustom - 自定义请求处理函数
   */
  constructor(options: EchoRequestOptions = {}, requestCustom: EchoRequestCustom<TReq, TRes> = defaultRequest as EchoRequestCustom<TReq, TRes>) {
    this.#interceptor = new Interceptor<TReq, TRes>();
    this.#defaultOptions = options;
    this.#request = requestCustom;
  }

  /**
   * 发送请求
   * @param {string} url - 请求地址
   * @param {TReq} [data] - 请求数据
   * @param {EchoRequestOptions} [options] - 请求选项
   * @returns {EchoRequestHandle<R>} 请求响应句柄，包含 getTask 方法
   */
  request<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    let taskResolver: (task: EchoRequestTask) => void;
    const taskPromise = new Promise<EchoRequestTask>(resolve => {
      taskResolver = resolve;
    });

    const combinedOptions = combineRequestOptions(this.#defaultOptions, options || {});

    const requestConfig: EchoRequestConfig<TReq> = {
      url,
      data,
      options: combinedOptions,
      setTask: (_task: EchoRequestTask) => {
        const actualTask = _task;
        taskResolver?.(actualTask);
      }
    };

    const context: EchoContext<TReq, TRes> = {
      request: requestConfig,
      error: undefined,
      response: undefined
    };

    const executeRequest = async () => {
      try {
        await this.#interceptor.execute(context, async (ctx: EchoContext<TReq, TRes>, next: EchoNext) => {
          await next();
          ctx.response = await this.#request(ctx.request);
        });

        if (context.error && !context.errorHandled) {
          throw context.error;
        }
        return context.response as R;
      } catch (err) {
        if (!context.error) {
          context.error = err;
        }
        if (!context.errorHandled) {
          throw context.error;
        }
        return context.response as R;
      }
    };

    const promise = new Promise<R>((resolve, reject) => {
      executeRequest().then(resolve).catch(reject);
    });

    /**
     * 获取底层请求任务对象 (类型为 unknown)
     * @returns {Promise<EchoRequestTask>}
     */
    const getTask = (): Promise<EchoRequestTask> => taskPromise;

    return Object.assign(promise, { getTask }) as EchoRequestHandle<R>;
  }

  /**
   * 添加中间件
   * @param {EchoMiddleware} fn - 中间件函数
   * @returns {Echo<TReq, TRes>} 返回当前实例，支持链式调用
   */
  use(fn: EchoMiddleware<TReq, TRes>): Echo<TReq, TRes> {
    this.#interceptor.use(fn);
    return this;
  }

  /**
   * 添加错误处理中间件
   * @param {EchoErrorHandler} fn - 错误处理中间件函数
   * @returns {Echo<TReq, TRes>} 返回当前实例，支持链式调用
   */
  catch(fn: EchoErrorHandler<TReq, TRes>): Echo<TReq, TRes> {
    this.#interceptor.catch(fn);
    return this;
  }

  /**
   * 添加 baseURL 中间件
   * @param {string} baseUrl - 基础 URL
   * @returns {Echo<TReq, TRes>} 返回当前实例，支持链式调用
   */
  useBaseUrl(baseUrl: string): Echo<TReq, TRes> {
    const baseURLMiddleware = (baseURL: string): EchoMiddleware<TReq, TRes> => {
      return async (ctx: EchoContext<TReq, TRes>, next: EchoNext) => {
        if (ctx.request && ctx.request.url && !ctx.request.url.startsWith('http')) {
          const sanitizedBaseUrl = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
          const sanitizedUrl = ctx.request.url.startsWith('/') ? ctx.request.url : `/${ctx.request.url}`;
          ctx.request.url = `${sanitizedBaseUrl}${sanitizedUrl}`;
        }
        await next();
      };
    };
    return this.use(baseURLMiddleware(baseUrl));
  }

  GET<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'GET' });
  }

  POST<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'POST' });
  }

  PUT<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'PUT' });
  }

  DELETE<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'DELETE' });
  }

  PATCH<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'PATCH' });
  }

  HEAD<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'HEAD' });
  }

  OPTIONS<R = TRes>(url: string, data?: TReq, options?: EchoRequestOptions): EchoRequestHandle<R> {
    return this.request<R>(url, data, { ...options, method: 'OPTIONS' });
  }
}

function combineRequestOptions(defaultOptions: EchoRequestOptions, options: EchoRequestOptions): EchoRequestOptions {
  const { headers: defaultHeaders, method: defaultMethod, timeout: defaultTimeout, responseType: defaultResponseType, ...restDefaultOptions } = defaultOptions || {};
  const { headers: currentHeaders, method: currentMethod, timeout: currentTimeout, responseType: currentResponseType, ...restCurrentOptions } = options || {};

  return {
    ...restDefaultOptions,
    ...restCurrentOptions,
    method: currentMethod ?? defaultMethod,
    headers: {
      ...(defaultHeaders || {}),
      ...(currentHeaders || {})
    },
    timeout: currentTimeout ?? defaultTimeout,
    responseType: currentResponseType ?? defaultResponseType
  };
}
