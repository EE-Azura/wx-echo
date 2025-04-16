export interface EchoContext<TReq = unknown, TRes = unknown> {
  /**
   * 请求相关数据
   * @type {EchoRequestConfig}
   */
  request: EchoRequestConfig<TReq>;

  /**
   * 响应相关数据
   * @type {TRes | undefined}
   */
  response?: TRes;

  /**
   * 错误信息
   * @type {unknown}
   */
  error?: unknown;

  /**
   * 错误是否已处理
   * @type {boolean}
   */
  errorHandled?: boolean;

  /**
   * 允许存储任意其他键值对
   * @type {unknown}
   */
  [key: string]: unknown;
}

export type EchoNext = () => Promise<void>;

export type EchoMiddleware<TReq = unknown, TRes = unknown> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;

export type EchoErrorHandler<TReq = unknown, TRes = unknown> = (err: unknown, ctx: EchoContext<TReq, TRes>) => Promise<void> | void;

export interface EchoRequestOptions {
  /**
   * 请求头
   * @type {Record<string, string>}
   */
  headers?: Record<string, string>;

  /**
   * 超时时间
   * @type {number}
   */
  timeout?: number;

  /**
   * 请求方法
   * @type {HttpMethod}
   * @default 'GET'
   */
  method?: HttpMethod;

  /**
   * 响应类型
   * @type {string}
   */
  responseType?: string;

  /**
   * 其他选项
   * @type {Record<string, unknown>}
   */
  [key: string]: unknown;
}

export interface EchoRequestConfig<T = unknown> {
  /**
   * 请求地址
   * @type {string}
   */
  url: string;

  /**
   * 请求数据
   * @type {unknown}
   */
  data?: T;

  /**
   * 请求选项
   * @type {EchoRequestOptions}
   */
  options?: EchoRequestOptions;

  /**
   * 设置/获取请求任务的回调函数
   * @type {Function}
   */
  setTask?: (task: EchoRequestTask) => void;
}

/**
 * Echo 请求任务接口，扩展了 Promise 功能
 * @template TRes 响应数据的类型
 */
export interface EchoRequestHandle<TRes = unknown> extends Promise<TRes> {
  /**
   * 异步获取底层的请求任务对象
   * @returns {Promise<EchoRequestTask>} 一个 Promise，将在任务可用时解析为任务对象 (类型为 unknown，具体类型取决于适配器)
   */
  getTask(): Promise<EchoRequestTask>;
}

export type EchoRequestTask = unknown;

export type EchoRequestCustom<TReq = unknown, TRes = unknown> = (params: EchoRequestConfig<TReq>) => Promise<TRes>;

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
