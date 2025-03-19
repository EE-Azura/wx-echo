import { Context, MiddlewareFunction, ErrorHandlerFunction } from './types';

/**
 * 拦截器模块，灵感来自 Koa2 的中间件系统
 * 实现洋葱模型用于请求/响应处理
 * @module Interceptor
 */

/**
 * 拦截器类，管理中间件栈
 * @class Interceptor
 * @classdesc 提供中间件注册和执行功能的拦截器
 */
export class Interceptor {
  /**
   * 存储中间件函数的数组
   * @private
   * @type {MiddlewareFunction[]}
   */
  private middleware: MiddlewareFunction[] = [];

  /**
   * 存储错误处理中间件函数的数组
   * @private
   * @type {ErrorHandlerFunction[]}
   */
  private errorHandlers: ErrorHandlerFunction[] = [];

  /**
   * 添加中间件到拦截器栈
   * @param {MiddlewareFunction} fn - 中间件函数
   * @returns {Interceptor} 返回拦截器实例，支持链式调用
   */
  use(fn: MiddlewareFunction): Interceptor {
    this.middleware.push(fn);
    return this;
  }

  /**
   * 添加错误处理中间件到拦截器栈
   * @param {ErrorHandlerFunction} fn - 错误处理中间件函数
   * @returns {Interceptor} 返回拦截器实例，支持链式调用
   */
  catch(fn: ErrorHandlerFunction): Interceptor {
    this.errorHandlers.push(fn);
    return this;
  }

  /**
   * 执行中间件栈
   * @param {Context} [context={}] - 初始上下文对象
   * @returns {Promise<Context>} 返回处理后的上下文对象
   * @throws {Error} 当多次调用 next() 时抛出错误
   */
  async execute(context: Context = {}): Promise<Context> {
    let index = -1;

    /**
     * 递归调度函数，用于执行中间件
     * @param {number} i - 当前中间件索引
     * @returns {Promise<void>}
     * @throws {Error} 当多次调用 next() 时抛出错误
     */
    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }

      index = i;

      const fn = this.middleware[i];

      if (!fn) return;

      try {
        return await fn(context, () => dispatch(i + 1));
      } catch (err) {
        return await this.handleError(err, context);
      }
    };

    try {
      await dispatch(0);
    } catch (err) {
      await this.handleError(err, context);
    }

    return context;
  }

  /**
   * 处理执行过程中的错误
   * @private
   * @param {unknown} err - 捕获到的错误
   * @param {Context} context - 上下文对象
   * @returns {Promise<void>}
   */
  private async handleError(err: unknown, context: Context): Promise<void> {
    // 在上下文中存储错误信息
    context.error = err;

    // 如果没有错误处理器，则重新抛出错误
    if (this.errorHandlers.length === 0) {
      throw err;
    }

    // 按顺序执行错误处理中间件
    for (const handler of this.errorHandlers) {
      try {
        await handler(err as Error, context);
        // 如果错误被处理了（通过标记），则停止传播
        if (context.errorHandled === true) {
          break;
        }
      } catch (handlerError) {
        // 如果错误处理器本身出错，替换为新错误并继续
        context.error = handlerError;
      }
    }

    // 如果所有错误处理器都执行完但错误未被标记为已处理，则重新抛出
    if (context.errorHandled !== true) {
      throw context.error;
    }
  }

  /**
   * 将多个拦截器组合成一个
   * @static
   * @param {...Interceptor[]} interceptors - 要组合的拦截器列表
   * @returns {Interceptor} 组合后的新拦截器实例
   */
  static compose(...interceptors: Interceptor[]): Interceptor {
    const composed = new Interceptor();

    interceptors.forEach(interceptor => {
      // 合并常规中间件
      interceptor.middleware.forEach(fn => {
        composed.use(fn);
      });

      // 合并错误处理中间件
      interceptor.errorHandlers.forEach(fn => {
        composed.catch(fn);
      });
    });

    return composed;
  }
}
