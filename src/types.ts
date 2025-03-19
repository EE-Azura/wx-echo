/**
 * 在拦截器之间传递的上下文对象
 * @interface Context
 */
export interface Context {
  /**
   * 请求相关数据
   * @type {unknown}
   */
  request?: unknown;

  /**
   * 响应相关数据
   * @type {unknown}
   */
  response?: unknown;

  /**
   * 允许存储任意其他键值对
   * @type {unknown}
   */
  [key: string]: unknown;
}

/**
 * 中间件函数类型定义
 * @callback MiddlewareFunction
 * @param {Context} ctx - 上下文对象，包含请求和响应信息
 * @param {Function} next - 调用下一个中间件的函数
 * @returns {Promise<void>|void} 可以是异步或同步函数
 */
export type MiddlewareFunction = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

/**
 * 错误处理中间件函数类型定义
 * @callback ErrorHandlerFunction
 * @param {Error} err - 捕获到的错误对象
 * @param {Context} ctx - 上下文对象，包含请求和响应信息
 * @returns {Promise<void>|void} 可以是异步或同步函数
 */
export type ErrorHandlerFunction = (err: Error, ctx: Context) => Promise<void> | void;

/**
 * BreezeRequestOptions 接口定义
 * @interface BreezeRequestOptions
 */
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

/**
 * BreezeRequestConfig 接口定义
 * @interface BreezeRequestConfig
 */
export interface BreezeRequestConfig {
  /**
   * 请求地址
   * @type {string}
   */
  url: string;

  /**
   * 请求数据
   * @type {unknown}
   */
  data?: unknown;

  /**
   * 请求选项
   * @type {BreezeRequestOptions}
   */
  options?: BreezeRequestOptions;

  /**
   * 请求方法
   * @type {string}
   */
  method?: string;

  /**
   * 获取请求任务的回调函数
   * @type {Function}
   */
  getTaskHandle?: (task: unknown) => void;
}

/**
 * BreezeRequest 函数类型定义
 * @callback BreezeRequestCustom
 */
export type BreezeRequestCustom = (params: BreezeRequestConfig) => Promise<unknown>;
