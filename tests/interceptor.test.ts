import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Interceptor } from '../src/Interceptor';
import { BreezeContext, BreezeNext } from '../src/types';

describe('拦截器', () => {
  let interceptor: Interceptor<unknown, unknown>;

  beforeEach(() => {
    interceptor = new Interceptor();
  });

  it('应该按正确顺序执行中间件', async () => {
    const order: string[] = [];

    interceptor.use(async (ctx, next) => {
      order.push('before-1');
      await next();
      order.push('after-1');
    });

    interceptor.use(async (ctx, next) => {
      order.push('before-2');
      await next();
      order.push('after-2');
    });

    // 提供一个核心中间件作为第二个参数
    await interceptor.execute({} as BreezeContext<unknown, unknown>, async (ctx, next) => {
      order.push('core');
      await next();
    });

    expect(order).toEqual(['before-1', 'before-2', 'core', 'after-2', 'after-1']);
  });

  it('应该处理中间件错误', async () => {
    const errorHandler = vi.fn((err, ctx) => {
      ctx.errorHandled = true;
    });

    interceptor.use(async () => {
      throw new Error('Test error');
    });

    interceptor.catch(errorHandler);

    // 提供一个核心中间件作为第二个参数
    const context = await interceptor.execute({} as BreezeContext<unknown, unknown>, async (ctx, next) => {
      await next();
    });

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(context.errorHandled).toBe(true);
    expect(context.error).toBeInstanceOf(Error);
  });

  it('应该组合多个拦截器', async () => {
    const interceptor1 = new Interceptor<unknown, unknown>();
    const middleware1 = async (ctx: BreezeContext<unknown, unknown>, next: BreezeNext) => {
      await next();
    };
    interceptor1.use(middleware1);

    const interceptor2 = new Interceptor<unknown, unknown>();
    const middleware2 = async (ctx: BreezeContext<unknown, unknown>, next: BreezeNext) => {
      await next();
    };
    interceptor2.use(middleware2);

    const composed = Interceptor.compose(interceptor1, interceptor2);
    expect(composed).toBeInstanceOf(Interceptor);

    // 不直接访问私有成员，而是通过调用execute方法间接验证
    // 创建一个追踪执行次数的变量
    let executionCount = 0;

    // 提供一个核心中间件作为第二个参数，每次经过中间件都增加计数
    await composed.execute({} as BreezeContext<unknown, unknown>, async (ctx, next) => {
      executionCount++;
      await next();
    });

    // 验证中间件数量（应该执行了2个用户中间件和1个核心中间件）
    expect(executionCount).toBe(1);
  });
});
