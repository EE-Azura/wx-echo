export interface BreezeContext<TReq = unknown, TRes = unknown> {
  /**
   * 请求相关数据
   * @type {BreezeRequestConfig}
   */
  request: BreezeRequestConfig<TReq>;

  /**
   * 响应相关数据
   * @type {TRes | undefined} // 修改此类型
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

export type BreezeNext = () => Promise<void>;

export type BreezeMiddleware<TReq = unknown, TRes = unknown> = (ctx: BreezeContext<TReq, TRes>, next: BreezeNext) => Promise<void> | void;

export type BreezeErrorHandler<TReq = unknown, TRes = unknown> = (err: unknown, ctx: BreezeContext<TReq, TRes>) => Promise<void> | void;

export interface BreezeRequestOptions {
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

export interface BreezeRequestConfig<T = unknown> {
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
   * @type {BreezeRequestOptions}
   */
  options?: BreezeRequestOptions;

  /**
   * 获取请求任务的回调函数
   * @type {Function}
   */
  getTaskHandle?: (task: unknown) => void;
}

export type BreezeRequestCustom<TReq = unknown, TRes = unknown> = (params: BreezeRequestConfig<TReq>) => Promise<TRes>;

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
