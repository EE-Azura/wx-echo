/**
 * 在拦截器之间传递的上下文对象
 * @interface Context
 */
export interface Context {
  /**
   * 请求相关数据
   * @type {any}
   */
  request?: any;

  /**
   * 响应相关数据
   * @type {any}
   */
  response?: any;

  /**
   * 允许存储任意其他键值对
   * @type {any}
   */
  [key: string]: any;
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
